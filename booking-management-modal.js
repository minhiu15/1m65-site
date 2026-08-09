(() => {
  'use strict';

  const modal = document.querySelector('#booking-modal');
  const frame = document.querySelector('#booking-modal-frame');
  const closeButton = modal?.querySelector('.booking-modal__close');
  if (!modal || !frame || !closeButton) return;

  let returnFocus = null;

  function managerUrl(reference = '') {
    const params = new URLSearchParams({ embed: '1', view: '20260809-9' });
    const normalizedReference = String(reference || '').trim().toUpperCase();
    if (normalizedReference) params.set('reference', normalizedReference);
    return `manage-booking.html?${params.toString()}`;
  }

  function open(reference = '') {
    returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const nextUrl = managerUrl(reference);
    if (frame.getAttribute('src') !== nextUrl) frame.src = nextUrl;
    modal.hidden = false;
    closeButton.focus();
  }

  function close() {
    if (modal.hidden) return;
    modal.hidden = true;
    if (returnFocus?.isConnected) returnFocus.focus();
  }

  document.querySelectorAll('[data-booking-modal-open]').forEach((trigger) => {
    trigger.addEventListener('click', (event) => {
      event.preventDefault();
      open();
    });
  });
  closeButton.addEventListener('click', close);
  modal.addEventListener('click', (event) => {
    if (event.target === modal) close();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !modal.hidden) close();
  });
  window.addEventListener('message', (event) => {
    if (event.origin !== window.location.origin) return;
    if (event.data?.type === '1m65:close-booking-manager') close();
  });

  window.mewBookingManager = Object.freeze({ open, close });
})();
