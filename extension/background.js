/**
 * background.js
 * Service worker for CarbonTwin Chrome Extension.
 * 
 * Logic:
 * 1. Track inactive "Zombie Tabs" (tabs not visited for 30m+)
 * 2. Calculate data usage (mocked via tab activity)
 * 3. Doomscroll Tax Engine: warn user after 15m of social media
 * 4. Post telemetry to localhost:3001/api/ingest/browser
 */

const API_BASE = 'http://localhost:3001/api';
const INACTIVE_THRESHOLD = 30 * 60 * 1000; // 30 minutes
const DOOMSCROLL_THRESHOLD = 15 * 60 * 1000; // 15 minutes

let tabActivity = {};
let socialMediaActivity = {};

// Listen for tab updates
chrome.tabs.onActivated.addListener(activeInfo => {
  const tabId = activeInfo.tabId;
  tabActivity[tabId] = Date.now();
});

// Periodic alarm to check for zombies and post telemetry
chrome.alarms.create('carbonCheck', { periodInMinutes: 5 });

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'carbonCheck') {
    checkZombiesAndReport();
  }
});

async function checkZombiesAndReport() {
  const tabs = await chrome.tabs.query({});
  const now = Date.now();
  let zombieCount = 0;
  let videoQuality = '1080p';
  let isDarkMode = false;
  let searchCount = 0;
  let directNavCount = 0;

  for (const tab of tabs) {
    const lastActive = tabActivity[tab.id] || 0;
    
    if (tab.active) {
      tabActivity[tab.id] = now;
      
      // Track search vs direct
      if (tab.url?.includes('google.com/search')) {
        searchCount++;
      } else if (tab.url && !tab.url.startsWith('chrome://')) {
        directNavCount++;
      }

      // Check Dark Mode and Video Quality on active tab
      try {
        const results = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: () => {
            const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            let quality = '1080p';
            if (window.location.host.includes('youtube.com')) {
              const qualElement = document.querySelector('.ytp-settings-button');
              // This is a simplification; in a real extension, we'd parse the player state
              quality = document.querySelector('video')?.videoHeight >= 2160 ? '4K' : '1080p';
            }
            return { isDark, quality };
          }
        });
        if (results?.[0]?.result) {
          isDarkMode = results[0].result.isDark;
          videoQuality = results[0].result.quality;
        }
      } catch (e) {
        // Scripts might fail on internal chrome:// pages
      }

      // Track doomscrolling
      if (isSocialMedia(tab.url)) {
        trackSocialMedia(tab.id);
      }
    } else if (lastActive > 0 && (now - lastActive) > INACTIVE_THRESHOLD) {
      zombieCount++;
    }
  }

  reportToBackend({
    tabCount: zombieCount,
    videoHours: tabs.some(t => t.url?.includes('youtube.com')) ? 0.08 : 0, // Mocked 5m check
    videoQuality,
    isDarkMode,
    searchCount,
    directNavigationCount: directNavCount
  });
}

function isSocialMedia(url) {
  if (!url) return false;
  return url.includes('instagram.com') || url.includes('twitter.com') || url.includes('facebook.com') || url.includes('tiktok.com');
}

function trackSocialMedia(tabId) {
  if (!socialMediaActivity[tabId]) socialMediaActivity[tabId] = Date.now();
  const duration = Date.now() - socialMediaActivity[tabId];
  
  if (duration > DOOMSCROLL_THRESHOLD) {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon128.png',
      title: 'Doomscroll Tax Alert! ⚠️',
      message: "You've been scrolling for 15m. That's approx 0.4kg of CO2 and ₹5.8 wasted. Close the tab?",
      priority: 2
    });
    // Reset to avoid spam
    socialMediaActivity[tabId] = Date.now();
  }
}

async function reportToBackend(payload) {
  try {
    const res = await fetch(`${API_BASE}/ingest/browser`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    console.log('[CarbonTwin] Telemetry reported:', await res.json());
  } catch (err) {
    console.warn('[CarbonTwin] API unavailable, skipping report.');
  }
}
