/**
 * popup.js
 * Renders live CarbonTwin metrics in the extension popup.
 *
 * Linking strategy:
 *   1. On open: read cached snapshot + linked-user profile, paint immediately.
 *   2. Try to auto-link by scraping the auth token from any open dashboard tab
 *      (handled by the service worker via chrome.scripting).
 *   3. If that fails (no open/logged-in dashboard tab), reveal an inline login
 *      form that signs in directly against `/api/auth/login`. The token is
 *      written to extension storage and `/auth/me` is called so we know which
 *      website user is linked.
 *   4. Once linked, fetch the latest dashboard metrics and tab counts.
 */

const DEFAULT_CONFIG = {
  apiBase: 'https://carboncum.onrender.com/api',
  dashboardUrl: 'https://carbontwin-tau.vercel.app/'
};

const $ = (id) => document.getElementById(id);

const fmtKg = (n) => `${(Number(n) || 0).toFixed(2)} kg`;
const fmtInr = (n) => `\u20B9${Math.round(Number(n) || 0).toLocaleString('en-IN')}`;
const fmtInt = (n) => String(Math.max(0, Math.round(Number(n) || 0)));

function setStatus(text, kind) {
  const el = $('status');
  el.textContent = text;
  el.classList.remove('live', 'warn', 'error');
  if (kind) el.classList.add(kind);
}

function setLinkedUser(link) {
  const info = $('connInfo');
  const btn = $('connectBtn');
  if (link?.linked && link?.linkedUser?.id) {
    const u = link.linkedUser;
    info.classList.remove('error');
    info.innerHTML = `Linked as <b>${u.email || u.name || u.id}</b>`;
    btn.textContent = 'Re-sync';
  } else {
    info.classList.remove('error');
    info.textContent = 'Account: not linked';
    btn.textContent = 'Connect';
  }
}

function setConnError(msg) {
  const info = $('connInfo');
  info.classList.add('error');
  info.textContent = msg;
}

function showLoginForm(reason) {
  $('loginForm').classList.add('show');
  if (reason) $('loginErr').textContent = reason;
}

function hideLoginForm() {
  $('loginForm').classList.remove('show');
  $('loginErr').textContent = '';
}

function paint(metrics) {
  if (!metrics) return;
  $('score').textContent = fmtInt(metrics.ecoScore);
  $('streak').textContent = `${fmtInt(metrics.currentStreak)}d`;
  $('carbon').textContent = fmtKg(metrics.totalCarbonSaved);
  $('rupees').textContent = fmtInr(metrics.totalRupeesSaved);
  ['score', 'streak', 'carbon', 'rupees'].forEach((id) =>
    $(id).classList.remove('skeleton')
  );
}

function paintTabStats(stats) {
  if (!stats) return;
  const open = Number(stats.openTabs || 0);
  const limit = Number(stats.tabLimit || 10);
  const zombies = Number(stats.zombieTabs || 0);

  const openEl = $('openTabs');
  openEl.textContent = `${open} / ${limit}`;
  openEl.classList.remove('skeleton');
  openEl.classList.toggle('warn', open > limit);

  const zEl = $('zombies');
  zEl.textContent = String(zombies);
  zEl.classList.remove('skeleton');
}

async function getConfig() {
  const { config } = await chrome.storage.local.get('config');
  return { ...DEFAULT_CONFIG, ...(config || {}) };
}

async function getCachedSnapshot() {
  const { lastSnapshot } = await chrome.storage.local.get('lastSnapshot');
  return lastSnapshot || null;
}

async function send(type, extra) {
  try {
    const res = await chrome.runtime.sendMessage({ type, ...(extra || {}) });
    if (!res || typeof res !== 'object') {
      return { ok: false, error: 'no response from background' };
    }
    return res;
  } catch (e) {
    return { ok: false, error: e?.message || 'message channel failed' };
  }
}

async function fetchLiveMetrics(apiBase, token) {
  const res = await fetch(`${apiBase}/dashboard/metrics?period=weekly`, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    }
  });
  if (res.status === 401) {
    await chrome.storage.local.remove(['token', 'linkedUser']);
    throw new Error('unauthorized');
  }
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const body = await res.json();
  return body?.user || null;
}

async function refreshMetricsAndTabs() {
  const config = await getConfig();
  const tabStats = await send('GET_TAB_STATS');
  paintTabStats(tabStats);

  const link = await send('GET_LINK_STATUS');
  setLinkedUser(link);

  const { token } = await chrome.storage.local.get('token');
  if (!token) {
    setStatus('not linked', 'error');
    return false;
  }

  setStatus('syncing…');
  try {
    const metrics = await fetchLiveMetrics(config.apiBase, token);
    if (metrics) {
      await chrome.storage.local.set({ lastSnapshot: metrics });
      paint(metrics);
    }
    setStatus('live', 'live');
    hideLoginForm();
    return true;
  } catch (e) {
    if (e.message === 'unauthorized') {
      setStatus('login expired', 'error');
      setConnError('Token expired. Please sign in again.');
      setLinkedUser({ linked: false, linkedUser: null });
      showLoginForm('Token expired. Sign in again.');
    } else {
      setStatus('api offline', 'warn');
      setConnError(`Backend: ${e.message}`);
    }
    return false;
  }
}

async function tryAutoLink() {
  setStatus('linking…');
  const sync = await send('SYNC_TOKEN_FROM_DASHBOARD');
  if (sync?.ok) {
    return { ok: true };
  }
  return { ok: false, error: sync?.error || 'auto-link failed' };
}

async function init() {
  const config = await getConfig();

  $('dashboard').addEventListener('click', () => {
    chrome.tabs.create({ url: config.dashboardUrl });
  });

  $('connectBtn').addEventListener('click', async () => {
    setStatus('linking…');
    const auto = await tryAutoLink();
    if (auto.ok) {
      hideLoginForm();
      await refreshMetricsAndTabs();
    } else {
      setStatus('not linked', 'error');
      setConnError(auto.error);
      showLoginForm(auto.error);
    }
  });

  $('hideLoginBtn').addEventListener('click', () => hideLoginForm());

  $('openSiteBtn').addEventListener('click', () => {
    const root = config.dashboardUrl.replace(/\/+$/, '');
    chrome.tabs.create({ url: `${root}/auth` });
  });

  $('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = $('email').value;
    const password = $('password').value;
    $('loginErr').textContent = '';
    $('loginSubmit').disabled = true;
    setStatus('signing in…');

    const res = await send('LOGIN', { email, password });
    $('loginSubmit').disabled = false;

    if (res?.ok) {
      $('password').value = '';
      hideLoginForm();
      await refreshMetricsAndTabs();
    } else {
      $('loginErr').textContent = res?.error || 'login failed';
      setStatus('login failed', 'error');
    }
  });

  $('reportNow').addEventListener('click', async () => {
    setStatus('reporting…');
    const res = await send('REPORT_NOW');
    if (res?.ok) {
      setStatus('reported', 'live');
      setTimeout(refreshMetricsAndTabs, 500);
    } else {
      setStatus(res?.error || 'failed', 'error');
    }
  });

  const cached = await getCachedSnapshot();
  if (cached) paint(cached);

  const link = await send('GET_LINK_STATUS');
  setLinkedUser(link);

  if (link?.linked) {
    await refreshMetricsAndTabs();
    return;
  }

  const auto = await tryAutoLink();
  if (auto.ok) {
    await refreshMetricsAndTabs();
  } else {
    setStatus('not linked', 'error');
    setConnError(auto.error);
    showLoginForm(auto.error);
  }
}

document.addEventListener('DOMContentLoaded', init);
