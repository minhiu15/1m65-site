// Zalo links open the Zalo app on phones, the zalo.me page only when the app is missing. Android: an intent for
// the Zalo package, with zalo.me as Chrome's fallback (in-app browsers, "; wv)", keep the plain link). iPhone:
// zalo.me in the same tab, which iOS hands to the app; a new tab can skip that. Pages shown in a popup frame
// (manage-booking) navigate the whole tab. Computers keep the zalo.me web chat in a new tab.
(() => {
  'use strict';

  const ua = navigator.userAgent;
  const android = /Android/i.test(ua) && !/; wv\)/.test(ua);
  const ios = /iPhone|iPad|iPod/i.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
  if (!android && !ios) return;

  document.addEventListener('click', (event) => {
    const link = event.target.closest('a[href^="https://zalo.me/"]');
    if (!link) return;
    if (ios) {
      link.target = '_top';
      return;
    }
    event.preventDefault();
    const intent = `intent://${link.href.slice('https://'.length)}#Intent;scheme=https;package=com.zing.zalo;S.browser_fallback_url=${encodeURIComponent(link.href)};end`;
    try {
      window.top.location.href = intent;
    } catch {
      window.location.href = intent;
    }
  });
})();
