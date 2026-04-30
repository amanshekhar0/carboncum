/**
 * background.js
 * Service worker for the CarbonTwin Chrome extension (Manifest V3).
 *
 * What it does:
 *   1. Watches the active tab and accumulates time spent on social vs video sites,
 *      pausing when the window loses focus or the user goes idle.
 *   2. Tracks "zombie tabs" — open tabs not focused for >30 minutes.
 *   3. Every 5 minutes (or on demand from the popup) POSTs a telemetry payload to
 *      `${apiBase}/ingest/browser` so the dashboard's carbon engine can recompute.
 *   4. Notifies the user when their rolling-window social-media usage crosses the
 *      doomscroll threshold (15m within the last hour).
 *
 * State design:
 *   The service worker is killed any time Chrome decides. Therefore *all* state
 *   lives in `chrome.storage.local` under the `cbState` key and is loaded /
 *   saved on every event. In-memory variables are not trusted across events.
 *
 *   cbState = {
 *     tabLastActiveAt: { [tabId]: epochMs },
 *     activeTabId: number | null,
 *     activeSessionStart: epochMs | null,
 *     activeSessionKind: 'social' | 'video' | null,
 *     pendingVideoMs:   ms accumulated since last report
 *     pendingSocialMs:  ms accumulated since last report
 *     pendingSearchCount, pendingDirectCount
 *     socialWindowStart, socialWindowMs:  rolling 1h window for doomscroll alert
 *     socialLastNotifiedAt: epochMs       rate-limit doomscroll notifications
 *   }
 *
 * Configuration overrides live in `chrome.storage.local.config` so an options
 * page (or popup) can tweak the API URL, thresholds, or domain lists without
 * a code change.
 */

const DEFAULT_CONFIG = {
  apiBase: 'https://carboncum.onrender.com/api',
  dashboardUrl: 'https://carbontwin-tau.vercel.app/',
  tabLimit: 10,
  tabAlertCooldownMs: 2 * 60 * 1000,
  reportIntervalMinutes: 5,
  inactiveThresholdMs: 30 * 60 * 1000,
  doomscrollThresholdMs: 15 * 60 * 1000,
  doomscrollCooldownMs: 30 * 60 * 1000,
  socialDomains: [
    'instagram.com',
    'twitter.com',
    'x.com',
    'facebook.com',
    'tiktok.com',
    'reddit.com',
    'snapchat.com'
  ],
  videoDomains: [
    'youtube.com',
    'netflix.com',
    'primevideo.com',
    'hotstar.com',
    'twitch.tv'
  ]
};

const STATE_KEY = 'cbState';
const CONFIG_KEY = 'config';

const DEFAULT_STATE = {
  tabLastActiveAt: {},
  activeTabId: null,
  activeSessionStart: null,
  activeSessionKind: null,
  pendingVideoMs: 0,
  pendingSocialMs: 0,
  pendingSearchCount: 0,
  pendingDirectCount: 0,
  lastTabCountNotifiedAt: 0,
  socialWindowStart: 0,
  socialWindowMs: 0,
  socialLastNotifiedAt: 0
};

// ---------- storage helpers ----------

async function loadConfig() {
  const { [CONFIG_KEY]: cfg } = await chrome.storage.local.get(CONFIG_KEY);
  return { ...DEFAULT_CONFIG, ...(cfg || {}) };
}

async function loadState() {
  const { [STATE_KEY]: s } = await chrome.storage.local.get(STATE_KEY);
  return { ...DEFAULT_STATE, ...(s || {}) };
}

async function saveState(s) {
  await chrome.storage.local.set({ [STATE_KEY]: s });
}

// ---------- classification ----------

function classify(url, config) {
  if (!url) return null;
  let host;
  try {
    host = new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return null;
  }
  const matches = (list) =>
    list.some((d) => host === d || host.endsWith('.' + d));
  if (matches(config.socialDomains)) return 'social';
  if (matches(config.videoDomains)) return 'video';
  return null;
}

function isSearchUrl(url) {
  if (!url) return false;
  return (
    /https?:\/\/(www\.)?google\.[^/]+\/search\b/.test(url) ||
    /https?:\/\/(www\.)?bing\.com\/search\b/.test(url) ||
    /https?:\/\/duckduckgo\.com\/\?/.test(url)
  );
}

function isCountableNav(url) {
  return (
    !!url &&
    !url.startsWith('chrome://') &&
    !url.startsWith('chrome-extension://') &&
    !url.startsWith('about:') &&
    !url.startsWith('edge://')
  );
}

// ---------- session bookkeeping ----------

function closeActiveSession(state, now) {
  if (!state.activeSessionStart || !state.activeSessionKind) return;
  const dt = Math.max(0, now - state.activeSessionStart);
  if (state.activeSessionKind === 'social') {
    state.pendingSocialMs += dt;
    state.socialWindowMs += dt;
  } else if (state.activeSessionKind === 'video') {
    state.pendingVideoMs += dt;
  }
  state.activeSessionStart = null;
  state.activeSessionKind = null;
}

function startSession(state, kind, now) {
  state.activeSessionStart = now;
  state.activeSessionKind = kind;
}

function decaySocialWindow(state, now, hourMs = 60 * 60 * 1000) {
  if (!state.socialWindowStart || now - state.socialWindowStart > hourMs) {
    state.socialWindowStart = now;
    state.socialWindowMs = 0;
  }
}

async function maybeNotifyDoomscroll(state, config, now) {
  let total = state.socialWindowMs;
  if (state.activeSessionKind === 'social' && state.activeSessionStart) {
    total += Math.max(0, now - state.activeSessionStart);
  }
  if (total < config.doomscrollThresholdMs) return;
  if (now - (state.socialLastNotifiedAt || 0) < config.doomscrollCooldownMs) return;

  const minutes = Math.round(total / 60000);
  // Rough estimate: 0.4 kg CO2 / 15 min on data-heavy social feeds.
  const kg = (total / (15 * 60 * 1000)) * 0.4;
  const inr = Math.round(kg * 14.5);

  try {
    await chrome.notifications.create(`doomscroll-${now}`, {
      type: 'basic',
      iconUrl: 'icons/icon128.png',
      title: 'Doomscroll Tax Alert',
      message:
        `~${minutes}m on social in the last hour. ` +
        `≈${kg.toFixed(2)} kg CO₂, ₹${inr} wasted. Time to switch tabs?`,
      priority: 2
    });
  } catch {
    /* notifications permission can be revoked */
  }
  state.socialLastNotifiedAt = now;
}

async function maybeNotifyTooManyTabs(state, config, now) {
  const tabs = await chrome.tabs.query({});
  const openTabs = tabs.length;
  if (openTabs <= Number(config.tabLimit || 10)) return;
  if (now - (state.lastTabCountNotifiedAt || 0) < Number(config.tabAlertCooldownMs || 0)) return;

  try {
    await chrome.notifications.create(`tabs-${now}`, {
      type: 'basic',
      iconUrl: 'icons/icon128.png',
      title: 'Too many tabs open',
      message:
        `${openTabs} tabs are open. Close a few tabs to reduce digital ` +
        'carbon emissions and improve performance.',
      priority: 2
    });
  } catch {
    /* notifications permission can be revoked */
  }
  state.lastTabCountNotifiedAt = now;
}

async function syncLinkedUserProfile(token, config) {
  try {
    const res = await fetch(`${config.apiBase}/auth/me`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      }
    });
    if (res.status === 401) {
      await chrome.storage.local.remove(['token', 'linkedUser']);
      return { ok: false, error: 'auth expired' };
    }
    if (!res.ok) return { ok: false, error: `auth/me HTTP ${res.status}` };
    const me = await res.json();
    if (!me || !me.id) return { ok: false, error: 'auth/me empty' };
    await chrome.storage.local.set({
      linkedUser: {
        id: me.id,
        name: me.name || 'User',
        email: me.email || '',
        syncedAt: Date.now()
      }
    });
    return { ok: true, user: me };
  } catch (e) {
    return { ok: false, error: e.message || 'network error' };
  }
}

const DASHBOARD_PATTERNS = [
  'https://carbontwin-tau.vercel.app/*',
  'https://carbontwin.vercel.app/*',
  'http://localhost:5173/*',
  'http://localhost:5174/*'
];

async function findDashboardTabs(config) {
  const patterns = new Set(DASHBOARD_PATTERNS);
  try {
    const root = config.dashboardUrl.replace(/\/+$/, '');
    const origin = new URL(root).origin;
    patterns.add(`${origin}/*`);
  } catch {
    /* keep defaults */
  }
  const all = [];
  for (const url of patterns) {
    try {
      const tabs = await chrome.tabs.query({ url });
      all.push(...tabs);
    } catch {
      /* invalid pattern, skip */
    }
  }
  const seen = new Set();
  return all.filter((t) => t?.id != null && !seen.has(t.id) && seen.add(t.id));
}

async function extractTokenFromDashboardTabs(config) {
  const tabs = await findDashboardTabs(config);
  if (tabs.length === 0) {
    return { ok: false, error: 'open the CarbonTwin site & log in first' };
  }
  for (const tab of tabs) {
    try {
      const result = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => localStorage.getItem('carbontwin_token')
      });
      const token = result?.[0]?.result;
      if (typeof token === 'string' && token.trim()) {
        return { ok: true, token: token.trim() };
      }
    } catch (e) {
      /* tab may be restricted/transient */
    }
  }
  return { ok: false, error: 'no token in dashboard tabs (try logging in)' };
}

async function injectContentScriptIntoDashboardTabs(config) {
  const tabs = await findDashboardTabs(config);
  for (const tab of tabs) {
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content.js']
      });
    } catch {
      /* page might not be ready or be a chrome:// internal */
    }
  }
}

async function updateBadge() {
  try {
    const config = await loadConfig();
    const tabs = await chrome.tabs.query({});
    const limit = Number(config.tabLimit || 10);
    if (tabs.length > limit) {
      await chrome.action.setBadgeText({ text: String(tabs.length) });
      await chrome.action.setBadgeBackgroundColor({ color: '#ef4444' });
    } else {
      await chrome.action.setBadgeText({ text: '' });
    }
  } catch {
    /* badge API may not be ready */
  }
}

// ---------- main hook: active-tab changed ----------

async function onActiveTabChanged(tabId, url) {
  const config = await loadConfig();
  const state = await loadState();
  const now = Date.now();

  closeActiveSession(state, now);
  decaySocialWindow(state, now);

  state.activeTabId = tabId;
  if (tabId != null) state.tabLastActiveAt[tabId] = now;

  if (isSearchUrl(url)) {
    state.pendingSearchCount += 1;
  } else if (isCountableNav(url)) {
    state.pendingDirectCount += 1;
  }

  const kind = classify(url, config);
  if (kind) startSession(state, kind, now);

  await maybeNotifyDoomscroll(state, config, now);
  await maybeNotifyTooManyTabs(state, config, now);
  await saveState(state);
}

// ---------- periodic report ----------

async function probeActiveTab() {
  try {
    const [tab] = await chrome.tabs.query({
      active: true,
      lastFocusedWindow: true
    });
    if (!tab || !tab.id || !/^https?:/.test(tab.url || '')) return null;
    const out = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        let quality = '1080p';
        const v = document.querySelector('video');
        if (v && v.videoHeight) {
          if (v.videoHeight >= 2160) quality = '4K';
          else if (v.videoHeight >= 1440) quality = '1440p';
          else if (v.videoHeight >= 1080) quality = '1080p';
          else if (v.videoHeight >= 720) quality = '720p';
          else quality = '480p';
        }
        return { isDark, quality };
      }
    });
    return out?.[0]?.result || null;
  } catch {
    return null;
  }
}

async function countZombies(state, config, now) {
  const tabs = await chrome.tabs.query({});
  let zombies = 0;
  for (const t of tabs) {
    if (t.active) continue;
    const last = state.tabLastActiveAt[t.id];
    if (last && now - last > config.inactiveThresholdMs) zombies++;
  }
  return zombies;
}

async function reportNow() {
  const config = await loadConfig();
  const state = await loadState();
  const now = Date.now();

  closeActiveSession(state, now);

  const probe = await probeActiveTab();
  const zombies = await countZombies(state, config, now);

  const payload = {
    tabCount: zombies,
    videoHours: Math.round((state.pendingVideoMs / 3.6e6) * 100) / 100,
    videoQuality: probe?.quality || '1080p',
    isDarkMode: !!probe?.isDark,
    searchCount: state.pendingSearchCount,
    directNavigationCount: state.pendingDirectCount
  };

  state.pendingVideoMs = 0;
  state.pendingSocialMs = 0;
  state.pendingSearchCount = 0;
  state.pendingDirectCount = 0;

  if (state.activeTabId != null) {
    try {
      const tab = await chrome.tabs.get(state.activeTabId);
      const kind = classify(tab.url, config);
      if (kind) startSession(state, kind, now);
    } catch {
      state.activeTabId = null;
    }
  }

  await saveState(state);

  const { token } = await chrome.storage.local.get('token');
  if (!token) {
    console.warn('[CarbonTwin] No auth token. Sign in on the dashboard.');
    return { ok: false, error: 'not signed in', payload };
  }

  try {
    const res = await fetch(`${config.apiBase}/ingest/browser`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });
    if (res.status === 401) {
      await chrome.storage.local.remove('token');
      return { ok: false, error: 'auth expired', payload };
    }
    const body = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, error: body?.error || `HTTP ${res.status}`, payload };
    return { ok: true, payload, response: body };
  } catch (e) {
    return { ok: false, error: e.message || 'network error', payload };
  }
}

// ---------- chrome event wiring ----------

chrome.runtime.onInstalled.addListener(async () => {
  const config = await loadConfig();
  await chrome.alarms.create('carbonReport', {
    periodInMinutes: config.reportIntervalMinutes
  });
  if (chrome.idle && chrome.idle.setDetectionInterval) {
    chrome.idle.setDetectionInterval(60);
  }
  await injectContentScriptIntoDashboardTabs(config);
  const tokenResult = await extractTokenFromDashboardTabs(config);
  if (tokenResult.ok && tokenResult.token) {
    await chrome.storage.local.set({ token: tokenResult.token });
    await syncLinkedUserProfile(tokenResult.token, config);
  }
  await updateBadge();
});

chrome.runtime.onStartup.addListener(async () => {
  const config = await loadConfig();
  await chrome.alarms.create('carbonReport', {
    periodInMinutes: config.reportIntervalMinutes
  });
  await updateBadge();
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'carbonReport') reportNow().catch(() => {});
});

chrome.tabs.onActivated.addListener(async (info) => {
  try {
    const tab = await chrome.tabs.get(info.tabId);
    await onActiveTabChanged(info.tabId, tab.url);
  } catch {
    /* tab disappeared */
  }
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (!tab.active) return;
  if (changeInfo.status !== 'complete' && !changeInfo.url) return;
  await onActiveTabChanged(tabId, tab.url);
});

chrome.tabs.onCreated.addListener(async () => {
  const state = await loadState();
  const config = await loadConfig();
  await maybeNotifyTooManyTabs(state, config, Date.now());
  await saveState(state);
  await updateBadge();
});

chrome.tabs.onRemoved.addListener(async (tabId) => {
  const state = await loadState();
  if (state.activeTabId === tabId) {
    closeActiveSession(state, Date.now());
    state.activeTabId = null;
  }
  delete state.tabLastActiveAt[tabId];
  const config = await loadConfig();
  await maybeNotifyTooManyTabs(state, config, Date.now());
  await saveState(state);
  await updateBadge();
});

chrome.windows.onFocusChanged.addListener(async (winId) => {
  const state = await loadState();
  const now = Date.now();
  if (winId === chrome.windows.WINDOW_ID_NONE) {
    closeActiveSession(state, now);
    await saveState(state);
    return;
  }
  try {
    const [tab] = await chrome.tabs.query({ active: true, windowId: winId });
    if (tab) {
      await onActiveTabChanged(tab.id, tab.url);
      return;
    }
  } catch {
    /* ignore */
  }
  await saveState(state);
});

if (chrome.idle && chrome.idle.onStateChanged) {
  chrome.idle.onStateChanged.addListener(async (newState) => {
    const state = await loadState();
    const now = Date.now();
    if (newState !== 'active') {
      closeActiveSession(state, now);
      await saveState(state);
      return;
    }
    if (state.activeTabId != null) {
      try {
        const tab = await chrome.tabs.get(state.activeTabId);
        const config = await loadConfig();
        const kind = classify(tab.url, config);
        if (kind) startSession(state, kind, now);
      } catch {
        /* ignore */
      }
    }
    await saveState(state);
  });
}

// ---------- messaging (popup + content script) ----------

async function loginWithCredentials(email, password) {
  const config = await loadConfig();
  const cleanEmail = String(email || '').trim().toLowerCase();
  const cleanPwd = String(password || '');
  if (!cleanEmail || !cleanPwd) {
    return { ok: false, error: 'email and password required' };
  }
  let res;
  try {
    res = await fetch(`${config.apiBase}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: cleanEmail, password: cleanPwd })
    });
  } catch (e) {
    return { ok: false, error: `network error: ${e.message || 'fetch failed'}` };
  }
  let body = {};
  try {
    body = await res.json();
  } catch {
    /* ignore parse error */
  }
  if (!res.ok || !body?.token) {
    return { ok: false, error: body?.error || `login failed (HTTP ${res.status})` };
  }
  await chrome.storage.local.set({ token: body.token });
  if (body.user?.id) {
    await chrome.storage.local.set({
      linkedUser: {
        id: body.user.id,
        name: body.user.name || 'User',
        email: body.user.email || cleanEmail,
        syncedAt: Date.now()
      }
    });
  } else {
    await syncLinkedUserProfile(body.token, config);
  }
  return { ok: true, user: body.user };
}

async function handleMessage(msg) {
  if (!msg || typeof msg !== 'object') {
    return { ok: false, error: 'bad message' };
  }
  switch (msg.type) {
    case 'SET_TOKEN': {
      if (typeof msg.token !== 'string' || !msg.token.trim()) {
        return { ok: false, error: 'no token' };
      }
      await chrome.storage.local.set({ token: msg.token });
      const config = await loadConfig();
      await syncLinkedUserProfile(msg.token, config);
      return { ok: true };
    }
    case 'CLEAR_TOKEN':
      await chrome.storage.local.remove(['token', 'linkedUser']);
      return { ok: true };
    case 'GET_LINK_STATUS': {
      const { token, linkedUser } = await chrome.storage.local.get([
        'token',
        'linkedUser'
      ]);
      return { linked: !!token && !!linkedUser?.id, linkedUser: linkedUser || null };
    }
    case 'SYNC_TOKEN_FROM_DASHBOARD': {
      const config = await loadConfig();
      await injectContentScriptIntoDashboardTabs(config);
      const tokenResult = await extractTokenFromDashboardTabs(config);
      if (!tokenResult.ok || !tokenResult.token) {
        return { ok: false, error: tokenResult.error || 'no dashboard token' };
      }
      await chrome.storage.local.set({ token: tokenResult.token });
      const meResult = await syncLinkedUserProfile(tokenResult.token, config);
      if (!meResult.ok) {
        return { ok: false, error: meResult.error || 'profile fetch failed' };
      }
      return { ok: true, user: meResult.user };
    }
    case 'LOGIN':
      return loginWithCredentials(msg.email, msg.password);
    case 'GET_TAB_STATS': {
      const config = await loadConfig();
      const state = await loadState();
      const tabs = await chrome.tabs.query({});
      const zombies = await countZombies(state, config, Date.now());
      return {
        openTabs: tabs.length,
        tabLimit: Number(config.tabLimit || 10),
        zombieTabs: zombies
      };
    }
    case 'GET_ZOMBIE_COUNT': {
      const config = await loadConfig();
      const state = await loadState();
      const count = await countZombies(state, config, Date.now());
      return { count };
    }
    case 'REPORT_NOW':
      return reportNow();
    default:
      return { ok: false, error: `unknown message: ${msg.type}` };
  }
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  handleMessage(msg)
    .then((res) => sendResponse(res))
    .catch((e) =>
      sendResponse({ ok: false, error: e?.message || String(e) || 'handler crashed' })
    );
  return true;
});
