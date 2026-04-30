/**
 * content.js
 * Bridges the dashboard's auth token into the extension's storage so the
 * service worker can authenticate telemetry calls.
 *
 * Runs in the dashboard's page context (see manifest content_scripts).
 * Reads `localStorage.carbontwin_token` and forwards it via runtime messaging
 * whenever it changes.
 */

const TOKEN_KEY = 'carbontwin_token';
let lastSent = null;

function safeSendToken(token) {
  if (!token || token === lastSent) return;
  try {
    chrome.runtime.sendMessage({ type: 'SET_TOKEN', token }, () => {
      // swallow lastError; the popup may not be open
      void chrome.runtime.lastError;
    });
    lastSent = token;
  } catch {
    /* extension context invalidated (e.g. reloaded) */
  }
}

function safeClearToken() {
  if (lastSent === null) return;
  try {
    chrome.runtime.sendMessage({ type: 'CLEAR_TOKEN' }, () => {
      void chrome.runtime.lastError;
    });
    lastSent = null;
  } catch {
    /* ignore */
  }
}

function syncToken() {
  let token = null;
  try {
    token = localStorage.getItem(TOKEN_KEY);
  } catch {
    return;
  }
  if (token) safeSendToken(token);
  else safeClearToken();
}

syncToken();

window.addEventListener('storage', (event) => {
  if (event.key === TOKEN_KEY) syncToken();
});

// Same-tab updates don't fire 'storage', so we patch setItem/removeItem.
try {
  const proto = Storage.prototype;
  const origSet = proto.setItem;
  const origRemove = proto.removeItem;
  proto.setItem = function (key, value) {
    origSet.apply(this, arguments);
    if (this === window.localStorage && key === TOKEN_KEY) syncToken();
  };
  proto.removeItem = function (key) {
    origRemove.apply(this, arguments);
    if (this === window.localStorage && key === TOKEN_KEY) syncToken();
  };
} catch {
  /* some pages freeze prototypes */
}

// Final fallback: low-frequency poll in case something bypasses Storage methods.
setInterval(syncToken, 15000);
