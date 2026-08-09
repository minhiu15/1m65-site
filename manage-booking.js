(() => {
  'use strict';

  if (window.self !== window.top) document.body.classList.add('is-embedded');

  const API_URL = 'https://aomiaszicxqrctcgeoms.supabase.co/functions/v1/booking-manage';
  const TIME_ZONE = 'Asia/Ho_Chi_Minh';
  const STATUS_LABELS = {
    confirmed: 'Đã xác nhận',
    completed: 'Hoàn thành',
    cancelled: 'Đã hủy',
    no_show: 'Không đến'
  };
  const ERRORS = {
    booking_lookup_failed: 'Số điện thoại chưa đúng hoặc chưa có lịch nào đang đặt. Bạn kiểm tra lại giúp mình nhé.',
    appointment_not_manageable: 'Lịch này không còn có thể dời hoặc hủy trên website.',
    appointment_change_cutoff: 'Đã qua thời hạn tự thay đổi lịch. Bạn liên hệ trực tiếp với tiệm giúp mình nhé.',
    slot_unavailable: 'Khung giờ này vừa có người chọn. Bạn chọn lại khung khác nhé.',
    human_verification_failed: 'Chưa xác minh được bạn là người thật. Bạn thử lại giúp mình nhé.',
    turnstile_unavailable: 'Chưa thể mở bước xác minh. Bạn kiểm tra mạng rồi thử lại nhé.',
    request_failed: 'Chưa thể kết nối máy chủ. Bạn thử lại sau nhé.'
  };

  const elements = {
    lookupForm: document.querySelector('#lookup-form'),
    phone: document.querySelector('#booking-phone'),
    lookupButton: document.querySelector('#lookup-button'),
    lookupMessage: document.querySelector('#lookup-message'),
    listView: document.querySelector('#appointment-list-view'),
    listCount: document.querySelector('#appointment-list-count'),
    list: document.querySelector('#appointment-list'),
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
  let activeAppointments = [];
  let selectedStartAt = '';
  const preferredReference = String(
    new URLSearchParams(window.location.search).get('reference') || ''
  ).trim().toUpperCase().slice(0, 32);

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

  function serviceNames(value) {
    const names = (Array.isArray(value?.services) ? value.services : [])
      .map((service) => String(service?.name || '').trim())
      .filter(Boolean);
    return names.length ? names : [String(value?.service || '').trim()].filter(Boolean);
  }

  function selectAppointment(nextAppointment) {
    credentials.reference = String(nextAppointment.reference || '');
    elements.list.querySelectorAll('.appointment-list-item').forEach((item) => {
      item.setAttribute('aria-pressed', String(item.dataset.reference === credentials.reference));
    });
    renderAppointment(nextAppointment);
  }

  function renderAppointmentList(nextAppointments) {
    activeAppointments = (Array.isArray(nextAppointments) ? nextAppointments : [])
      .filter((item) => item?.status === 'confirmed');
    elements.list.replaceChildren();
    elements.listView.hidden = activeAppointments.length === 0;
    elements.listCount.textContent = `${activeAppointments.length} lịch`;

    const items = activeAppointments.map((item) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'appointment-list-item';
      button.dataset.reference = String(item.reference || '');
      button.setAttribute('aria-pressed', 'false');

      const time = document.createElement('span');
      time.className = 'appointment-list-time';
      time.textContent = dateTime(item.startAt);

      const services = document.createElement('span');
      services.className = 'appointment-list-service';
      services.textContent = serviceNames(item).join(' + ') || 'Dịch vụ tại tiệm';

      const reference = document.createElement('span');
      reference.className = 'appointment-list-reference';
      reference.textContent = String(item.reference || '');

      button.append(time, services, reference);
      button.addEventListener('click', () => selectAppointment(item));
      return button;
    });
    elements.list.append(...items);
  }

  function updateActiveAppointment(nextAppointment) {
    activeAppointments = activeAppointments.map((item) => (
      item.reference === nextAppointment.reference ? nextAppointment : item
    ));
    renderAppointmentList(activeAppointments);
    selectAppointment(nextAppointment);
  }

  function renderAppointment(nextAppointment) {
    appointment = nextAppointment;
    elements.appointmentReference.textContent = appointment.reference || '';
    elements.status.textContent = STATUS_LABELS[appointment.status] || appointment.status || '';
    elements.status.className = `status-badge ${appointment.status || ''}`;
    elements.customer.textContent = `${appointment.customerName || ''} · ${appointment.maskedPhone || ''}`;
    elements.time.textContent = dateTime(appointment.startAt);
    const names = serviceNames(appointment);
    elements.services.textContent = names.length
      ? names.join('\n')
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
      reference: '',
      phone: elements.phone.value.replace(/\D/g, '')
    };
    elements.phone.value = credentials.phone;
    elements.lookupButton.disabled = true;
    elements.listView.hidden = true;
    elements.view.hidden = true;
    appointment = null;
    activeAppointments = [];
    setMessage(elements.lookupMessage, 'Đang kiểm tra lịch hẹn…');
    try {
      const body = await request('lookup');
      renderAppointmentList(body.appointments);
      if (!activeAppointments.length) {
        setMessage(elements.lookupMessage, 'Số điện thoại này hiện chưa có lịch nào đang đặt.');
        return;
      }
      const preferred = activeAppointments.find((item) => item.reference === preferredReference);
      if (preferred) selectAppointment(preferred);
      else if (activeAppointments.length === 1) selectAppointment(activeAppointments[0]);
      setMessage(
        elements.lookupMessage,
        `Đã tìm thấy ${activeAppointments.length} lịch đang đặt.`,
        true
      );
      elements.listView.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
      updateActiveAppointment(body.appointment);
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
      activeAppointments = activeAppointments.filter((item) => (
        item.reference !== body.appointment?.reference
      ));
      appointment = null;
      credentials.reference = '';
      elements.view.hidden = true;
      renderAppointmentList(activeAppointments);
      setMessage(
        elements.lookupMessage,
        activeAppointments.length
          ? 'Đã hủy lịch hẹn. Các lịch đang đặt khác vẫn hiển thị bên dưới.'
          : 'Đã hủy lịch hẹn. Bạn không còn lịch nào đang đặt.',
        true
      );
    } catch (error) {
      setMessage(elements.lookupMessage, ERRORS[errorCode(error)] || ERRORS.request_failed);
    } finally {
      elements.cancelButton.disabled = false;
    }
  }

  elements.lookupForm.addEventListener('submit', lookup);
  elements.loadSlotsButton.addEventListener('click', loadSlots);
  elements.confirmRescheduleButton.addEventListener('click', reschedule);
  elements.cancelButton.addEventListener('click', cancelAppointment);
})();
