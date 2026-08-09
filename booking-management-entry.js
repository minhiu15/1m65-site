(() => {
  'use strict';

  const REFERENCE_PATTERN = /1M65-[0-9]{6}-[A-F0-9]{6}/i;

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
      existingLink.href = `manage-booking.html?reference=${encodeURIComponent(reference)}`;
      return;
    }

    const link = documentRoot.createElement('a');
    link.dataset.bookingManageEntry = 'true';
    link.href = `manage-booking.html?reference=${encodeURIComponent(reference)}`;
    link.target = '_top';
    link.textContent = 'Xem và chỉnh lịch hẹn';
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
    anchor.insertAdjacentElement('afterend', link);
  }

  function bindFrame(frame) {
    const start = () => {
      addSuccessLink(frame);
      window.setInterval(() => addSuccessLink(frame), 800);
    };
    if (frame.contentDocument?.readyState === 'complete') start();
    else frame.addEventListener('load', start, { once: true });
  }

  document.querySelectorAll('iframe').forEach(bindFrame);
})();
