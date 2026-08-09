(() => {
  'use strict';

  const REFERENCE_PATTERN = /1M65-[0-9]{6}-[A-F0-9]{6}/i;
  const siteFrames = Array.from(document.querySelectorAll('main > iframe'));
  const floatingLink = document.querySelector('.manage-appointment-link');

  function isVisible(element) {
    const style = element.ownerDocument.defaultView.getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    return style.display !== 'none'
      && style.visibility !== 'hidden'
      && rect.width > 0
      && rect.height > 0;
  }

  function frameHasOpenPopup(frame) {
    if (!isVisible(frame)) return false;
    try {
      return Array.from(frame.contentDocument?.querySelectorAll('button[aria-label="Đóng"]') || [])
        .some(isVisible);
    } catch {
      return false;
    }
  }

  function syncFloatingLink() {
    if (!floatingLink) return;
    floatingLink.hidden = siteFrames.some(frameHasOpenPopup);
  }

  function bindManageLink(link, reference) {
    link.href = `manage-booking.html?reference=${encodeURIComponent(reference)}`;
    if (link.dataset.bookingManageBound === 'true') return;
    link.dataset.bookingManageBound = 'true';
    link.addEventListener('click', (event) => {
      if (typeof window.mewBookingManager?.open !== 'function') return;
      event.preventDefault();
      window.mewBookingManager.open(reference);
    });
  }

  function addSuccessLink(frame) {
    let documentRoot;
    try {
      documentRoot = frame.contentDocument;
    } catch {
      return;
    }
    if (!documentRoot?.body) return;
    const referenceNode = Array.from(documentRoot.querySelectorAll('b, strong'))
      .find((item) => REFERENCE_PATTERN.test(item.textContent || ''));
    if (!referenceNode) return;
    const reference = (referenceNode.textContent || '').match(REFERENCE_PATTERN)?.[0]?.toUpperCase();
    if (!reference) return;
    const anchor = referenceNode.closest('p') || referenceNode.parentElement;
    if (!anchor) return;
    const existingLink = anchor.parentElement?.querySelector('[data-booking-manage-entry]');
    if (existingLink) {
      bindManageLink(existingLink, reference);
      return;
    }

    const link = documentRoot.createElement('a');
    link.dataset.bookingManageEntry = 'true';
    link.target = '_top';
    link.textContent = 'Xem lịch của bạn';
    link.style.cssText = [
      'display:inline-flex',
      'align-items:center',
      'justify-content:center',
      'min-height:44px',
      'padding:0 20px',
      'margin:0 auto 14px',
      'border:1px solid rgba(122,90,208,.24)',
      'border-radius:999px',
      'color:#5f479e',
      'background:#fff',
      'font:700 14px/1 system-ui,sans-serif',
      'text-decoration:none'
    ].join(';');
    bindManageLink(link, reference);
    anchor.insertAdjacentElement('afterend', link);
  }

  function bindFrame(frame) {
    const start = () => {
      addSuccessLink(frame);
      window.setInterval(() => addSuccessLink(frame), 800);
      syncFloatingLink();
    };
    if (frame.contentDocument?.readyState === 'complete') start();
    else frame.addEventListener('load', start, { once: true });
  }

  siteFrames.forEach(bindFrame);
  window.setInterval(syncFloatingLink, 120);
})();
