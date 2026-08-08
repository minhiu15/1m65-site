(() => {
  'use strict';

  const phoneElement = document.querySelector('#customer-phone');
  const actions = document.querySelector('#contact-actions');
  const callLink = document.querySelector('#call-customer');
  const zaloLink = document.querySelector('#zalo-customer');
  const note = document.querySelector('#contact-note');
  const rawPhone = decodeURIComponent(window.location.hash.slice(1));
  const phone = rawPhone.replace(/\D/g, '').slice(0, 10);

  document.querySelector('#back-button').addEventListener('click', () => {
    if (window.history.length > 1) window.history.back();
    else window.location.replace('./admin.html');
  });

  if (!/^0\d{9}$/.test(phone)) {
    phoneElement.textContent = 'Số điện thoại không hợp lệ';
    note.textContent = 'Quay lại Discord và mở lại số điện thoại từ phiếu booking.';
    return;
  }

  phoneElement.textContent = `${phone.slice(0, 4)} ${phone.slice(4, 7)} ${phone.slice(7)}`;
  callLink.href = `tel:${phone}`;
  zaloLink.href = `https://zalo.me/${phone}`;
  actions.hidden = false;
})();
