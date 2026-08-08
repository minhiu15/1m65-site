(() => {
  'use strict';

  const API_URL = 'https://aomiaszicxqrctcgeoms.supabase.co/functions/v1/booking-manage';
  const TIME_ZONE = 'Asia/Ho_Chi_Minh';
  const STATUS_LABELS = {
    confirmed: 'Đã xác nhận',
    completed: 'Hoàn thành',
    cancelled: 'Đã hủy',
    no_show: 'Không đến'
  };
  const ERRORS = {
    booking_lookup_failed: 'Không tìm thấy lịch phù hợp. Bạn kiểm tra lại mã lịch và số điện thoại nhé.',
    appointment_not_manageable: 'Lịch này không còn có thể dời hoặc hủy trên website.',
    appointment_change_cutoff: 'Đã qua thời hạn tự thay đổi lịch. Bạn liên hệ trực tiếp với tiệm giúp mình nhé.',
    slot_unavailable: 'Khung giờ này vừa có người chọn. Bạn chọn lại khung khác nhé.',
    human_verification_failed: 'Chưa xác minh được bạn là người thật. Bạn thử lại giúp mình nhé.',
    turnstile_unavailable: 'Chưa thể mở bước xác minh. Bạn kiểm tra mạng rồi thử lại nhé.',
    request_failed: 'Chưa thể kết nối máy chủ. Bạn thử lại sau nhé.'
  };

  const elements = {
    lookupForm: document.querySelector('#lookup-form'),
    reference: document.querySelector('#booking-reference'),
    phone: document.querySelector('#booking-phone'),
    lookupButton: document.querySelector('#lookup-button'),
    lookupMessage: document.querySelector('#lookup-message'),
    view: document.querySelector('#appointment-view'),
    appointmentReference: document.querySelector('#appointment-reference'),
    status: document.querySelector('#appointment-status'),
    customer: document.querySelector('#appointment-customer'),
    time: document.querySelector('#appointment-time'),
    services: document.querySelector('#appointment-services'),
    duration: document.querySelector('#appointment-duration'),
    price: document.querySelector('#appointment-price'),
    note: document.querySelector('#appointment-note'),
    notice: document.querySelector('#manage-notice'),
    actions: document.querySelector('#manage-actions'),
    date: document.querySelector('#reschedule-date'),
    loadSlotsButton: document.querySelector('#load-slots-button'),
    slots: document.querySelector('#reschedule-slots'),
    rescheduleMessage: document.querySelector('#reschedule-message'),
    confirmRescheduleButton: document.querySelector('#confirm-reschedule-button'),
    cancelButton: document.querySelector('#cancel-button')
  };

  let credentials = null;
  let appointment = null;
  let selectedStartAt = '';

  function setMessage(target, text = '', success = false) {
    target.textContent = text;
    target.classList.toggle('success', success);
  }

  function errorCode(error) {
    return String(error?.code || error?.message || 'request_failed');
  }

  async function request(action, payload = {}) {
    let turnstileToken = '';
    try {
      turnstileToken = await window.mewTurnstileBooking.getToken();
    } catch (error) {
      error.code = errorCode(error);
      throw error;
    }
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        action,
        reference: credentials.reference,
        phone: credentials.phone,
        turnstileToken,
        ...payload
      })
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(body.error || 'request_failed');
      error.code = body.error || 'request_failed';
      throw error;
    }
    return body;
  }

  function dateTime(value) {
    return new Intl.DateTimeFormat('vi-VN', {
      timeZone: TIME_ZONE,
      weekday: 'long',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23'
    }).format(new Date(value));
  }

  function timeOnly(value) {
    return new Intl.DateTimeFormat('vi-VN', {
      timeZone: TIME_ZONE,
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23'
    }).format(new Date(value));
  }

  function isoDateInTimeZone(value = new Date()) {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: TIME_ZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).formatToParts(value).reduce((result, item) => {
      if (item.type !== 'literal') result[item.type] = item.value;
      return result;
    }, {});
    return `${parts.year}-${parts.month}-${parts.day}`;
  }

  function currency(value) {
    return `${new Intl.NumberFormat('vi-VN').format(Number(value || 0))}đ`;
  }

  function renderAppointment(nextAppointment) {
    appointment = nextAppointment;
    elements.appointmentReference.textContent = appointment.reference || '';
    elements.status.textContent = STATUS_LABELS[appointment.status] || appointment.status || '';
    elements.status.className = `status-badge ${appointment.status || ''}`;
    elements.customer.textContent = `${appointment.customerName || ''} · ${appointment.maskedPhone || ''}`;
    elements.time.textContent = dateTime(appointment.startAt);
    const serviceNames = (Array.isArray(appointment.services) ? appointment.services : [])
      .map((service) => String(service?.name || '').trim())
      .filter(Boolean);
    elements.services.textContent = serviceNames.length
      ? serviceNames.join('\n')
      : String(appointment.service || '');
    elements.duration.textContent = `${Number(appointment.durationMinutes || 0)} phút`;
    elements.price.textContent = currency(appointment.price);
    elements.note.textContent = String(appointment.customerNote || '').trim() || 'Không có ghi chú';
    elements.view.hidden = false;

    const canManage = appointment.canManage === true;
    elements.actions.hidden = !canManage;
    elements.notice.classList.toggle('locked', !canManage);
    if (canManage) {
      elements.notice.textContent = `Bạn có thể dời hoặc hủy trước ${dateTime(appointment.manageBefore)}.`;
    } else if (appointment.status === 'cancelled') {
      elements.notice.textContent = 'Lịch này đã được hủy.';
    } else if (appointment.status === 'completed') {
      elements.notice.textContent = 'Lịch này đã hoàn thành.';
    } else if (appointment.status === 'no_show') {
      elements.notice.textContent = 'Lịch này đã được ghi nhận là không đến.';
    } else {
      elements.notice.textContent = 'Đã qua thời hạn tự dời hoặc hủy. Bạn liên hệ trực tiếp với tiệm để được hỗ trợ nhé.';
    }

    const currentDate = isoDateInTimeZone(new Date(appointment.startAt));
    const today = isoDateInTimeZone();
    const maxDate = isoDateInTimeZone(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));
    elements.date.min = today;
    elements.date.max = maxDate;
    elements.date.value = currentDate < today ? today : currentDate;
    selectedStartAt = '';
    elements.slots.replaceChildren();
    elements.confirmRescheduleButton.disabled = true;
    setMessage(elements.rescheduleMessage);
    elements.view.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  async function lookup(event) {
    event.preventDefault();
    credentials = {
      reference: elements.reference.value.trim().toUpperCase(),
      phone: elements.phone.value.replace(/\D/g, '')
    };
    elements.reference.value = credentials.reference;
    elements.phone.value = credentials.phone;
    elements.lookupButton.disabled = true;
    elements.view.hidden = true;
    setMessage(elements.lookupMessage, 'Đang kiểm tra lịch hẹn…');
    try {
      const body = await request('lookup');
      renderAppointment(body.appointment);
      setMessage(elements.lookupMessage, 'Đã tìm thấy lịch hẹn.', true);
    } catch (error) {
      setMessage(elements.lookupMessage, ERRORS[errorCode(error)] || ERRORS.request_failed);
    } finally {
      elements.lookupButton.disabled = false;
    }
  }

  function renderSlots(slots) {
    selectedStartAt = '';
    elements.confirmRescheduleButton.disabled = true;
    const buttons = slots.map((slot) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'slot-button';
      button.textContent = timeOnly(slot.start_at || slot.startAt);
      button.setAttribute('aria-pressed', 'false');
      button.addEventListener('click', () => {
        selectedStartAt = String(slot.start_at || slot.startAt || '');
        elements.slots.querySelectorAll('.slot-button').forEach((item) => {
          item.setAttribute('aria-pressed', String(item === button));
        });
        elements.confirmRescheduleButton.disabled = false;
        setMessage(elements.rescheduleMessage, `Đã chọn ${button.textContent}.`, true);
      });
      return button;
    });
    elements.slots.replaceChildren(...buttons);
    if (!buttons.length) setMessage(elements.rescheduleMessage, 'Ngày này chưa còn khung giờ phù hợp.');
  }

  async function loadSlots() {
    if (!credentials || !appointment?.canManage) return;
    elements.loadSlotsButton.disabled = true;
    elements.slots.replaceChildren();
    setMessage(elements.rescheduleMessage, 'Đang tải giờ trống…');
    try {
      const body = await request('availability', { date: elements.date.value });
      setMessage(elements.rescheduleMessage);
      renderSlots(Array.isArray(body.slots) ? body.slots : []);
    } catch (error) {
      setMessage(elements.rescheduleMessage, ERRORS[errorCode(error)] || ERRORS.request_failed);
    } finally {
      elements.loadSlotsButton.disabled = false;
    }
  }

  async function reschedule() {
    if (!selectedStartAt || !appointment) return;
    const nextTime = dateTime(selectedStartAt);
    if (!window.confirm(`Dời lịch ${appointment.reference} sang ${nextTime}?`)) return;
    elements.confirmRescheduleButton.disabled = true;
    setMessage(elements.rescheduleMessage, 'Đang dời lịch…');
    try {
      const body = await request('reschedule', { startAt: selectedStartAt });
      renderAppointment(body.appointment);
      setMessage(elements.rescheduleMessage, 'Đã dời lịch thành công.', true);
    } catch (error) {
      setMessage(elements.rescheduleMessage, ERRORS[errorCode(error)] || ERRORS.request_failed);
      if (errorCode(error) === 'slot_unavailable') await loadSlots();
    }
  }

  async function cancelAppointment() {
    if (!appointment) return;
    if (!window.confirm(`Hủy lịch ${appointment.reference}? Khung giờ này sẽ được mở lại cho khách khác.`)) return;
    elements.cancelButton.disabled = true;
    setMessage(elements.lookupMessage, 'Đang hủy lịch…');
    try {
      const body = await request('cancel');
      renderAppointment(body.appointment);
      setMessage(elements.lookupMessage, 'Đã hủy lịch hẹn. Khung giờ đã được mở lại.', true);
    } catch (error) {
      setMessage(elements.lookupMessage, ERRORS[errorCode(error)] || ERRORS.request_failed);
    } finally {
      elements.cancelButton.disabled = false;
    }
  }

  const queryReference = new URLSearchParams(window.location.search).get('reference');
  if (queryReference) elements.reference.value = queryReference.trim().toUpperCase().slice(0, 32);
  elements.lookupForm.addEventListener('submit', lookup);
  elements.loadSlotsButton.addEventListener('click', loadSlots);
  elements.confirmRescheduleButton.addEventListener('click', reschedule);
  elements.cancelButton.addEventListener('click', cancelAppointment);
})();
