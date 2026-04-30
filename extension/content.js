/**
 * content.js
 * Injected into the CarbonTwin dashboard to bridge auth tokens.
 */

// Function to sync token from localStorage to extension storage
function syncToken() {
  const token = localStorage.getItem('carbontwin_token');
  if (token) {
    chrome.runtime.sendMessage({ type: 'SET_TOKEN', token });
  }
}

// Initial sync
syncToken();

// Listen for storage changes in the web app
window.addEventListener('storage', (event) => {
  if (event.key === 'carbontwin_token') {
    syncToken();
  }
});

// Periodic sync as fallback
setInterval(syncToken, 5000);
