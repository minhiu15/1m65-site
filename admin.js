(() => {
  'use strict';

  const API_URL = 'https://aomiaszicxqrctcgeoms.supabase.co/functions/v1/booking-api';
  const SESSION_KEY = '1m65-admin-session';
  const TIME_ZONE = 'Asia/Ho_Chi_Minh';
  const STATUS_LABELS = {
    pending: 'Chờ xác nhận',
    confirmed: 'Đã xác nhận',
    completed: 'Hoàn thành',
    cancelled: 'Đã hủy',
    no_show: 'Không đến'
  };

  const elements = {
    loginView: document.querySelector('#login-view'),
    dashboardView: document.querySelector('#dashboard-view'),
    loginForm: document.querySelector('#login-form'),
    loginButton: document.querySelector('#login-button'),
    loginMessage: document.querySelector('#login-message'),
    dashboardMessage: document.querySelector('#dashboard-message'),
    adminIdentity: document.querySelector('#admin-identity'),
    fromDate: document.querySelector('#from-date'),
    toDate: document.querySelector('#to-date'),
    statusFilter: document.querySelector('#status-filter'),
    refreshButton: document.querySelector('#refresh-button'),
    logoutButton: document.querySelector('#logout-button'),
    summary: document.querySelector('#summary'),
    appointmentList: document.querySelector('#appointment-list'),
    blockDate: document.querySelector('#block-date'),
    blockReason: document.querySelector('#block-reason'),
    selectAllButton: document.querySelector('#select-all-button'),
    allDayButton: document.querySelector('#all-day-button'),
    blockSlotGrid: document.querySelector('#block-slot-grid'),
    blockSelection: document.querySelector('#block-selection'),
    createBlockButton: document.querySelector('#create-block-button'),
    blockMessage: document.querySelector('#block-message'),
    blockList: document.querySelector('#block-list')
  };

  let session = readSession();
  let appointments = [];
  let blocks = [];
  let blockDayAppointments = [];
  let selectedBlockSlots = new Set();
  let blockWholeDay = false;
  let blockDayLoading = false;

  function readSession() {
    try {
      const value = JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null');
      return value?.accessToken && value?.refreshToken ? value : null;
    } catch {
      sessionStorage.removeItem(SESSION_KEY);
      return null;
    }
  }

  function storeSession(value) {
    session = value;
    if (value) sessionStorage.setItem(SESSION_KEY, JSON.stringify(value));
    else sessionStorage.removeItem(SESSION_KEY);
  }

  function dateInTimeZone(date = new Date()) {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit'
    }).format(date);
  }

  function addDays(dateText, days) {
    const [year, month, day] = dateText.split('-').map(Number);
    const date = new Date(Date.UTC(year, month - 1, day + days));
    return date.toISOString().slice(0, 10);
  }

  function setMessage(target, message = '', success = false) {
    target.textContent = message;
    target.classList.toggle('success', success);
  }

  function errorMessage(code) {
    const messages = {
      invalid_login: 'Email hoặc mật khẩu không đúng.',
      admin_access_denied: 'Tài khoản này chưa được cấp quyền quản lý.',
      invalid_admin_date_range: 'Khoảng ngày không hợp lệ hoặc dài hơn 93 ngày.',
      invalid_appointment_status: 'Trạng thái lịch không hợp lệ.',
      appointment_not_found: 'Không tìm thấy lịch hẹn.',
      slot_unavailable: 'Không thể mở lại lịch này vì đã trùng với một lịch khác.',
      too_many_requests: 'Bạn thử đăng nhập quá nhiều lần. Vui lòng chờ một lúc.',
      invalid_block_range: 'Khoảng thời gian khóa không hợp lệ.',
      too_many_blocks: 'Bạn chọn quá nhiều khoảng khóa cùng lúc.',
      block_reason_too_long: 'Lý do khóa lịch dài quá 120 ký tự.',
      block_not_found: 'Khoảng khóa này không còn tồn tại.',
      request_failed: 'Không thể kết nối máy chủ. Vui lòng thử lại.'
    };
    return messages[code] || messages.request_failed;
  }

  async function rawRequest(body, token = '') {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(token ? { authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify(body)
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(data.error || 'request_failed');
      error.status = response.status;
      throw error;
    }
    return data;
  }

  async function refreshSession() {
    if (!session?.refreshToken) throw new Error('invalid_login');
    const data = await rawRequest({ action: 'admin_refresh', refreshToken: session.refreshToken });
    storeSession(data.session);
    return session;
  }

  async function adminRequest(body, retry = true) {
    try {
      return await rawRequest(body, session?.accessToken || '');
    } catch (error) {
      if (retry && error.status === 401 && session?.refreshToken) {
        await refreshSession();
        return adminRequest(body, false);
      }
      throw error;
    }
  }

  function showLogin(message = '') {
    appointments = [];
    elements.dashboardView.hidden = true;
    elements.loginView.hidden = false;
    elements.loginForm.reset();
    setMessage(elements.loginMessage, message);
  }

  function showDashboard() {
    elements.loginView.hidden = true;
    elements.dashboardView.hidden = false;
    const admin = session?.admin || {};
    elements.adminIdentity.textContent = [admin.displayName, admin.email].filter(Boolean).join(' · ');
  }

  function currency(value) {
    return `${new Intl.NumberFormat('vi-VN').format(Number(value || 0))}đ`;
  }

  function timeParts(value) {
    const date = new Date(value);
    return {
      time: new Intl.DateTimeFormat('vi-VN', {
        timeZone: TIME_ZONE, hour: '2-digit', minute: '2-digit'
      }).format(date),
      date: new Intl.DateTimeFormat('vi-VN', {
        timeZone: TIME_ZONE, weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric'
      }).format(date)
    };
  }

  function minutesToTime(minutes) {
    return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
  }

  function localTime(value) {
    return new Intl.DateTimeFormat('en-GB', {
      timeZone: TIME_ZONE, hour: '2-digit', minute: '2-digit', hour12: false
    }).format(new Date(value));
  }

  function currentMinuteInTimeZone() {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: TIME_ZONE, hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
    }).formatToParts(new Date()).reduce((result, part) => {
      if (part.type !== 'literal') result[part.type] = part.value;
      return result;
    }, {});
    return Number(parts.hour) * 60 + Number(parts.minute);
  }

  function node(tag, className = '', text = '') {
    const item = document.createElement(tag);
    if (className) item.className = className;
    if (text !== '') item.textContent = text;
    return item;
  }

  function renderSummary() {
    const counts = appointments.reduce((result, item) => {
      result[item.status] = (result[item.status] || 0) + 1;
      return result;
    }, {});
    const cards = [
      ['Tổng lịch', appointments.length],
      ['Đã xác nhận', counts.confirmed || 0],
      ['Hoàn thành', counts.completed || 0],
      ['Đã hủy / không đến', (counts.cancelled || 0) + (counts.no_show || 0)]
    ];
    elements.summary.replaceChildren(...cards.map(([label, value]) => {
      const card = node('article', 'summary-card');
      card.append(node('strong', '', String(value)), node('span', '', label));
      return card;
    }));
  }

  function appointmentCard(item) {
    const start = timeParts(item.startAt);
    const end = timeParts(item.endAt);
    const card = node('article', 'appointment');

    const timing = node('div');
    const time = node('time', '', `${start.time} – ${end.time}`);
    time.dateTime = item.startAt;
    timing.append(time, node('div', 'date', start.date), node('p', 'reference', item.reference));

    const customer = node('div');
    customer.append(node('h2', '', item.customerName));
    const phone = node('a', '', item.customerPhone);
    phone.href = `tel:${String(item.customerPhone).replace(/[^0-9+]/g, '')}`;
    customer.append(phone);
    if (item.customerNote) customer.append(node('p', 'note', `Ghi chú: ${item.customerNote}`));

    const service = node('div');
    service.append(node('h2', '', item.service));
    service.append(
      node('p', '', `${item.durationMinutes} phút · ${currency(item.price)}`),
      node('p', '', `Thợ: ${item.staff || 'Chưa chỉ định'}`)
    );

    const statusColumn = node('div', 'status-column');
    statusColumn.append(node('span', `badge ${item.status}`, STATUS_LABELS[item.status] || item.status));
    if (item.status === 'completed') {
      const reset = node('button', 'reset-status', 'Reset trạng thái');
      reset.type = 'button';
      reset.addEventListener('click', () => resetCompleted(item, reset));
      statusColumn.append(reset);
    } else {
      const select = node('select');
      select.setAttribute('aria-label', `Trạng thái lịch ${item.reference}`);
      Object.entries(STATUS_LABELS)
        .filter(([value]) => value !== 'completed')
        .forEach(([value, label]) => {
          const option = node('option', '', label);
          option.value = value;
          option.selected = value === item.status;
          select.append(option);
        });
      const save = node('button', 'save-status', 'Lưu trạng thái');
      save.type = 'button';
      save.addEventListener('click', () => updateStatus(item, select.value, save));
      statusColumn.append(select, save);
      if (item.status === 'pending' || item.status === 'confirmed') {
        const complete = node('button', 'complete-button', '✓ Đánh dấu hoàn thành');
        complete.type = 'button';
        complete.addEventListener('click', () => completeAppointment(item, complete));
        statusColumn.append(complete);
      }
    }

    card.append(timing, customer, service, statusColumn);
    return card;
  }

  function renderAppointments() {
    renderSummary();
    if (!appointments.length) {
      elements.appointmentList.replaceChildren(node('div', 'empty', 'Không có lịch hẹn trong khoảng ngày này.'));
      return;
    }
    elements.appointmentList.replaceChildren(...appointments.map(appointmentCard));
  }

  async function loadAppointments() {
    const from = elements.fromDate.value;
    const through = elements.toDate.value;
    if (!from || !through || through < from) {
      setMessage(elements.dashboardMessage, 'Vui lòng chọn khoảng ngày hợp lệ.');
      return;
    }
    elements.refreshButton.disabled = true;
    setMessage(elements.dashboardMessage, 'Đang tải lịch…');
    try {
      const data = await adminRequest({
        action: 'admin_list',
        from: `${from}T00:00:00+07:00`,
        to: `${addDays(through, 1)}T00:00:00+07:00`,
        status: elements.statusFilter.value || null
      });
      appointments = Array.isArray(data.appointments) ? data.appointments : [];
      renderAppointments();
      setMessage(elements.dashboardMessage, `Đã tải ${appointments.length} lịch.`, true);
    } catch (error) {
      if (error.status === 401 || error.message === 'admin_access_denied') {
        storeSession(null);
        showLogin(errorMessage(error.message));
        return;
      }
      setMessage(elements.dashboardMessage, errorMessage(error.message));
    } finally {
      elements.refreshButton.disabled = false;
    }
  }

  async function updateStatus(item, status, button) {
    if (status === item.status) {
      setMessage(elements.dashboardMessage, 'Trạng thái chưa thay đổi.');
      return;
    }
    if (status === 'cancelled' && !window.confirm(`Hủy lịch ${item.reference}? Khung giờ này sẽ được mở lại cho khách khác.`)) return;
    button.disabled = true;
    setMessage(elements.dashboardMessage, `Đang cập nhật ${item.reference}…`);
    try {
      await adminRequest({
        action: 'admin_update_status',
        appointmentId: item.id,
        status
      });
      setMessage(elements.dashboardMessage, `Đã cập nhật ${item.reference}.`, true);
      await loadAppointments();
    } catch (error) {
      setMessage(elements.dashboardMessage, errorMessage(error.message));
      button.disabled = false;
    }
  }

  async function completeAppointment(item, button) {
    if (!window.confirm(`Xác nhận lịch ${item.reference} đã hoàn thành?`)) return;
    await applyDirectStatus(item, 'completed', button, `Đã hoàn thành ${item.reference}.`);
  }

  async function resetCompleted(item, button) {
    if (!window.confirm(`Reset lịch ${item.reference} về trạng thái Đã xác nhận?`)) return;
    await applyDirectStatus(item, 'confirmed', button, `Đã reset ${item.reference}.`);
  }

  async function applyDirectStatus(item, status, button, successMessage) {
    button.disabled = true;
    setMessage(elements.dashboardMessage, `Đang cập nhật ${item.reference}…`);
    try {
      await adminRequest({
        action: 'admin_update_status',
        appointmentId: item.id,
        status
      });
      setMessage(elements.dashboardMessage, successMessage, true);
      await loadAppointments();
    } catch (error) {
      setMessage(elements.dashboardMessage, errorMessage(error.message));
      button.disabled = false;
    }
  }

  function createSlotButtons() {
    const buttons = [];
    const selectedDate = elements.blockDate.value;
    const today = dateInTimeZone();
    let firstMinute = 9 * 60;
    if (selectedDate < today) firstMinute = 18 * 60;
    if (selectedDate === today) {
      firstMinute = Math.max(9 * 60, Math.floor(currentMinuteInTimeZone() / 30) * 30 - 30);
    }
    for (let minutes = firstMinute; minutes <= 17 * 60; minutes += 30) {
      const button = node('button', 'slot-chip', minutesToTime(minutes));
      button.type = 'button';
      button.dataset.minutes = String(minutes);
      button.setAttribute('aria-pressed', 'false');
      const booked = blockSlotIsBooked(minutes);
      const locked = blockSlotIsLocked(minutes);
      button.classList.toggle('booked', booked);
      button.classList.toggle('blocked', locked);
      if (booked) {
        button.title = 'Đã có lịch khách';
        button.setAttribute('aria-label', `${minutesToTime(minutes)} · Đã có lịch khách`);
      } else if (locked) {
        button.title = 'Khung giờ đã khóa';
        button.setAttribute('aria-label', `${minutesToTime(minutes)} · Khung giờ đã khóa`);
      }
      button.addEventListener('click', () => {
        if (booked || locked) return;
        if (selectedBlockSlots.has(minutes)) selectedBlockSlots.delete(minutes);
        else selectedBlockSlots.add(minutes);
        updateBlockSelection();
      });
      buttons.push(button);
    }
    elements.blockSlotGrid.replaceChildren(...buttons);
  }

  function blockSlotIsBooked(minutes) {
    const date = elements.blockDate.value;
    const start = new Date(`${date}T${minutesToTime(minutes)}:00+07:00`).getTime();
    const end = start + 30 * 60 * 1000;
    return blockDayAppointments.some((appointment) =>
      (appointment.status === 'pending' || appointment.status === 'confirmed')
      && new Date(appointment.startAt).getTime() < end
      && new Date(appointment.endAt).getTime() > start
    );
  }

  function blockSlotIsLocked(minutes) {
    const date = elements.blockDate.value;
    const start = new Date(`${date}T${minutesToTime(minutes)}:00+07:00`).getTime();
    const end = start + 30 * 60 * 1000;
    return blocks.some((block) =>
      new Date(block.startAt).getTime() < end
      && new Date(block.endAt).getTime() > start
    );
  }

  function updateBlockSelection() {
    elements.allDayButton.setAttribute('aria-pressed', String(blockWholeDay));
    const selectable = [];
    elements.blockSlotGrid.querySelectorAll('.slot-chip').forEach((button) => {
      const minutes = Number(button.dataset.minutes);
      const booked = blockSlotIsBooked(minutes);
      const locked = blockSlotIsLocked(minutes);
      if ((booked || locked) && selectedBlockSlots.has(minutes)) selectedBlockSlots.delete(minutes);
      const selected = selectedBlockSlots.has(minutes);
      button.classList.toggle('booked', booked);
      button.classList.toggle('blocked', locked);
      button.classList.toggle('selected', selected);
      button.setAttribute('aria-pressed', String(selected));
      button.disabled = blockWholeDay || booked || locked || blockDayLoading;
      if (!booked && !locked) selectable.push(minutes);
    });
    const allSelectableSelected = selectable.length > 0
      && selectable.every((minutes) => selectedBlockSlots.has(minutes));
    elements.selectAllButton.setAttribute('aria-pressed', String(allSelectableSelected && !blockWholeDay));
    elements.selectAllButton.disabled = blockWholeDay || blockDayLoading || selectable.length === 0;
    const count = selectedBlockSlots.size;
    elements.blockSelection.textContent = blockWholeDay
      ? 'Đã chọn khóa cả ngày.'
      : count ? `Đã chọn ${count} khung 30 phút.` : 'Chưa chọn khung giờ.';
    elements.createBlockButton.disabled = blockDayLoading || (!blockWholeDay && count === 0);
  }

  function selectedRanges() {
    const date = elements.blockDate.value;
    if (!date) return [];
    if (blockWholeDay) {
      return [{
        startAt: `${date}T00:00:00+07:00`,
        endAt: `${addDays(date, 1)}T00:00:00+07:00`
      }];
    }
    const values = [...selectedBlockSlots].sort((a, b) => a - b);
    if (!values.length) return [];
    const ranges = [];
    let start = values[0];
    let previous = values[0];
    values.slice(1).forEach((minutes) => {
      if (minutes === previous + 30) {
        previous = minutes;
        return;
      }
      ranges.push({ start, end: previous + 30 });
      start = minutes;
      previous = minutes;
    });
    ranges.push({ start, end: previous + 30 });
    return ranges.map((range) => ({
      startAt: `${date}T${minutesToTime(range.start)}:00+07:00`,
      endAt: `${date}T${minutesToTime(range.end)}:00+07:00`
    }));
  }

  function renderBlocks() {
    if (!blocks.length) {
      elements.blockList.replaceChildren(node('p', 'block-empty', 'Ngày này chưa có khoảng khóa.'));
      return;
    }
    elements.blockList.replaceChildren(...blocks.map((block) => {
      const row = node('div', 'block-row');
      const details = node('div');
      const startDate = dateInTimeZone(new Date(block.startAt));
      const allDay = localTime(block.startAt) === '00:00'
        && localTime(block.endAt) === '00:00'
        && dateInTimeZone(new Date(block.endAt)) === addDays(startDate, 1);
      details.append(node('strong', '', allDay
        ? 'Cả ngày'
        : `${localTime(block.startAt)} – ${localTime(block.endAt)}`));
      if (block.reason) details.append(node('span', '', block.reason));
      const remove = node('button', 'unlock-button', 'Mở khóa');
      remove.type = 'button';
      remove.addEventListener('click', () => deleteBlock(block, remove));
      row.append(details, remove);
      return row;
    }));
  }

  async function loadBlocks() {
    const date = elements.blockDate.value;
    if (!date || !session) return;
    blockDayLoading = true;
    selectedBlockSlots.clear();
    createSlotButtons();
    updateBlockSelection();
    setMessage(elements.blockMessage, 'Đang tải lịch khóa…');
    try {
      const from = `${date}T00:00:00+07:00`;
      const to = `${addDays(date, 1)}T00:00:00+07:00`;
      const [blockData, appointmentData] = await Promise.all([
        adminRequest({ action: 'admin_list_blocks', from, to }),
        adminRequest({ action: 'admin_list', from, to, status: null })
      ]);
      blocks = Array.isArray(blockData.blocks) ? blockData.blocks : [];
      blockDayAppointments = Array.isArray(appointmentData.appointments)
        ? appointmentData.appointments : [];
      renderBlocks();
      setMessage(elements.blockMessage, '');
    } catch (error) {
      setMessage(elements.blockMessage, errorMessage(error.message));
    } finally {
      blockDayLoading = false;
      createSlotButtons();
      updateBlockSelection();
    }
  }

  async function createBlocks() {
    const ranges = selectedRanges();
    if (!ranges.length) return;
    const description = blockWholeDay ? 'cả ngày' : `${selectedBlockSlots.size} khung đã chọn`;
    if (!window.confirm(`Xác nhận khóa ${description} ngày ${elements.blockDate.value}?`)) return;
    elements.createBlockButton.disabled = true;
    setMessage(elements.blockMessage, 'Đang khóa lịch…');
    try {
      await adminRequest({
        action: 'admin_create_blocks',
        ranges,
        reason: elements.blockReason.value.trim()
      });
      selectedBlockSlots.clear();
      blockWholeDay = false;
      elements.blockReason.value = '';
      updateBlockSelection();
      await loadBlocks();
      setMessage(elements.blockMessage, 'Đã khóa lịch. Website sẽ loại các giờ bị ảnh hưởng.', true);
    } catch (error) {
      setMessage(elements.blockMessage, errorMessage(error.message));
      updateBlockSelection();
    }
  }

  async function deleteBlock(block, button) {
    if (!window.confirm('Mở khóa khoảng thời gian này để khách có thể đặt lại?')) return;
    button.disabled = true;
    try {
      await adminRequest({ action: 'admin_delete_block', blockId: block.id });
      await loadBlocks();
      setMessage(elements.blockMessage, 'Đã mở khóa lịch.', true);
    } catch (error) {
      setMessage(elements.blockMessage, errorMessage(error.message));
      button.disabled = false;
    }
  }

  elements.loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    elements.loginButton.disabled = true;
    setMessage(elements.loginMessage, 'Đang đăng nhập…');
    try {
      const form = new FormData(elements.loginForm);
      const data = await rawRequest({
        action: 'admin_login',
        email: String(form.get('email') || '').trim(),
        password: String(form.get('password') || '')
      });
      storeSession(data.session);
      showDashboard();
      await Promise.all([loadAppointments(), loadBlocks()]);
    } catch (error) {
      storeSession(null);
      setMessage(elements.loginMessage, errorMessage(error.message));
    } finally {
      elements.loginButton.disabled = false;
    }
  });

  elements.refreshButton.addEventListener('click', loadAppointments);
  elements.statusFilter.addEventListener('change', loadAppointments);
  elements.blockDate.addEventListener('change', () => {
    selectedBlockSlots.clear();
    blockDayAppointments = [];
    blockWholeDay = false;
    updateBlockSelection();
    loadBlocks();
  });
  elements.selectAllButton.addEventListener('click', () => {
    if (blockWholeDay) return;
    const selectable = [...elements.blockSlotGrid.querySelectorAll('.slot-chip:not(.booked):not(.blocked)')]
      .map((button) => Number(button.dataset.minutes));
    const allSelected = selectable.length > 0
      && selectable.every((minutes) => selectedBlockSlots.has(minutes));
    if (allSelected) selectable.forEach((minutes) => selectedBlockSlots.delete(minutes));
    else selectable.forEach((minutes) => selectedBlockSlots.add(minutes));
    updateBlockSelection();
  });
  elements.allDayButton.addEventListener('click', () => {
    blockWholeDay = !blockWholeDay;
    if (blockWholeDay) selectedBlockSlots.clear();
    updateBlockSelection();
  });
  elements.createBlockButton.addEventListener('click', createBlocks);
  elements.logoutButton.addEventListener('click', async () => {
    const token = session?.accessToken || '';
    storeSession(null);
    if (token) await rawRequest({ action: 'admin_logout' }, token).catch(() => {});
    showLogin('Bạn đã đăng xuất.');
  });

  const today = dateInTimeZone();
  elements.fromDate.value = today;
  elements.toDate.value = addDays(today, 7);
  elements.blockDate.value = today;
  createSlotButtons();
  updateBlockSelection();

  if (session) {
    showDashboard();
    Promise.all([loadAppointments(), loadBlocks()]);
  } else {
    showLogin();
  }
})();
