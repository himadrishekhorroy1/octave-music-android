/* =========================================================
   Octave Music - app.js
   - Detects online/offline state via Capacitor Network plugin
     (with HTML online/offline events as fallback).
   - When ONLINE: navigates the WebView to the live URL so
     users see the real site.
   - When OFFLINE: shows the bundled offline UI shell which
     mirrors the site's branding and gives a native feel.
   - Periodically retries when offline.
   ========================================================= */

const LIVE_URL = 'https://music.octavestreaming.com/';

// ---- Build placeholder UI (looks same as a music streaming app) ----
const ARTWORK_GRADIENTS = [
  'linear-gradient(135deg,#a855f7,#7c3aed)',
  'linear-gradient(135deg,#ec4899,#8b5cf6)',
  'linear-gradient(135deg,#f59e0b,#ef4444)',
  'linear-gradient(135deg,#10b981,#3b82f6)',
  'linear-gradient(135deg,#06b6d4,#8b5cf6)',
  'linear-gradient(135deg,#f43f5e,#a855f7)',
  'linear-gradient(135deg,#facc15,#f97316)',
  'linear-gradient(135deg,#22d3ee,#0ea5e9)',
];

const QUICK_PICKS = [
  'Liked Songs', 'Daily Mix 1', 'Discover Weekly',
  'Chill Vibes', 'Top Hits', 'Workout Beats'
];

const MADE_FOR_YOU = [
  { title: 'Daily Mix 1',  sub: 'Made for you' },
  { title: 'Discover Weekly', sub: 'Updated weekly' },
  { title: 'Release Radar',   sub: 'New from artists' },
  { title: 'Chill Hits',      sub: 'Kick back' },
  { title: 'Mood Booster',    sub: 'Feel good' },
];

const RECENTLY_PLAYED = [
  { title: 'Midnight City',     sub: 'M83' },
  { title: 'Blinding Lights',   sub: 'The Weeknd' },
  { title: 'Levitating',        sub: 'Dua Lipa' },
  { title: 'Starboy',           sub: 'The Weeknd' },
  { title: 'As It Was',         sub: 'Harry Styles' },
];

function buildUI() {
  // Quick picks grid
  const qp = document.getElementById('quickPicks');
  qp.innerHTML = QUICK_PICKS.map((t, i) => `
    <div class="quick-card">
      <div class="qc-art" style="background:${ARTWORK_GRADIENTS[i % ARTWORK_GRADIENTS.length]}"></div>
      <div class="qc-title">${t}</div>
    </div>
  `).join('');

  // Made for you row
  const cr = document.getElementById('cardRow');
  cr.innerHTML = MADE_FOR_YOU.map((c, i) => `
    <div class="play-card">
      <div class="pc-art" style="background:${ARTWORK_GRADIENTS[i % ARTWORK_GRADIENTS.length]}"></div>
      <div class="pc-title">${c.title}</div>
      <div class="pc-sub">${c.sub}</div>
    </div>
  `).join('');

  // Recently played list
  const lr = document.getElementById('listRow');
  lr.innerHTML = RECENTLY_PLAYED.map((t, i) => `
    <div class="list-item">
      <div class="li-art" style="background:${ARTWORK_GRADIENTS[i % ARTWORK_GRADIENTS.length]}"></div>
      <div class="li-meta">
        <div class="li-title">${t.title}</div>
        <div class="li-sub">${t.sub}</div>
      </div>
    </div>
  `).join('');

  // Greeting based on time of day
  const h = new Date().getHours();
  let g = 'Good evening';
  if (h < 12) g = 'Good morning';
  else if (h < 18) g = 'Good afternoon';
  document.getElementById('greetingTitle').textContent = g;
}

function showOfflineUI() {
  document.getElementById('offlineOverlay').classList.remove('hidden');
  document.getElementById('statusBanner').classList.remove('hidden');
  document.getElementById('appShell').style.opacity = '0.35';
  document.getElementById('appShell').style.pointerEvents = 'none';
  document.getElementById('miniPlayer').style.display = 'none';
  document.getElementById('lastSeen').textContent =
    'Last seen: ' + new Date().toLocaleTimeString();
}

function hideOfflineUI() {
  document.getElementById('offlineOverlay').classList.add('hidden');
  document.getElementById('statusBanner').classList.add('hidden');
  document.getElementById('appShell').style.opacity = '1';
  document.getElementById('appShell').style.pointerEvents = '';
  document.getElementById('miniPlayer').style.display = '';
}

function navigateToLive() {
  // Full navigation - replaces the WebView content with the live site.
  // The native Android WebViewClient intercepts network errors and
  // falls back to this offline shell automatically.
  console.log('[Octave] Online -> navigating to', LIVE_URL);
  window.location.replace(LIVE_URL);
}

function handleOnline() {
  console.log('[Octave] Network: online');
  // If we were forced into offline mode by native, reload without the flag
  // so we go through the normal online flow.
  if (isNativeOfflineFlag()) {
    console.log('[Octave] Clearing native offline flag and reloading...');
    window.location.replace(window.location.pathname);
    return;
  }
  // Briefly hide offline UI, then redirect to live site
  hideOfflineUI();
  // Small delay so the user sees a smooth transition
  setTimeout(navigateToLive, 200);
}

function handleOffline() {
  console.log('[Octave] Network: offline');
  showOfflineUI();
}

function setupNetworkListeners() {
  // Use Capacitor Network plugin if available, else HTML5 events
  if (window.Capacitor && window.Capacitor.isPluginAvailable) {
    // Capacitor 8 registers plugins as Plugins.Network etc
  }

  // HTML5 fallback - always works
  window.addEventListener('online',  handleOnline);
  window.addEventListener('offline', handleOffline);

  // Try Capacitor Network plugin
  if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Network) {
    const Network = window.Capacitor.Plugins.Network;
    Network.getStatus().then(status => {
      console.log('[Octave] Initial status:', status);
      if (status.connected) handleOnline();
      else handleOffline();
    }).catch(err => {
      console.warn('[Octave] Network.getStatus failed', err);
      // Fallback to navigator.onLine
      if (navigator.onLine) handleOnline();
      else handleOffline();
    });
    Network.addListener('networkStatusChange', status => {
      console.log('[Octave] networkStatusChange:', status);
      if (status.connected) handleOnline();
      else handleOffline();
    });
  } else {
    // Plain browser fallback
    if (navigator.onLine) handleOnline();
    else handleOffline();
  }
}

function setupRetryButtons() {
  const retry = () => {
    console.log('[Octave] Manual retry...');
    // Re-check network status
    if (window.Capacitor?.Plugins?.Network) {
      window.Capacitor.Plugins.Network.getStatus().then(s => {
        if (s.connected) handleOnline();
        else {
          // Show spinner briefly
          const btn = document.getElementById('offlineRetryBtn');
          const orig = btn.innerHTML;
          btn.innerHTML = 'Retrying...';
          btn.disabled = true;
          setTimeout(() => {
            btn.innerHTML = orig;
            btn.disabled = false;
          }, 1500);
        }
      });
    } else {
      if (navigator.onLine) handleOnline();
      else window.location.reload();
    }
  };
  document.getElementById('retryBtn')?.addEventListener('click', retry);
  document.getElementById('offlineRetryBtn')?.addEventListener('click', retry);
}

// Detect offline mode forced by native WebViewClient (set via ?offline=1)
function isNativeOfflineFlag() {
  try {
    return new URLSearchParams(window.location.search).get('offline') === '1';
  } catch (e) {
    return false;
  }
}

// Boot
document.addEventListener('DOMContentLoaded', () => {
  buildUI();
  setupRetryButtons();

  // If native sent us here due to a load failure, force offline UI immediately.
  if (isNativeOfflineFlag()) {
    console.log('[Octave] Native offline flag detected');
    showOfflineUI();
    return;
  }

  setupNetworkListeners();
});
