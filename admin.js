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
    appointmentList: document.querySelector('#appointment-list')
  };

  let session = readSession();
  let appointments = [];

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
    const select = node('select');
    select.setAttribute('aria-label', `Trạng thái lịch ${item.reference}`);
    Object.entries(STATUS_LABELS).forEach(([value, label]) => {
      const option = node('option', '', label);
      option.value = value;
      option.selected = value === item.status;
      select.append(option);
    });
    const save = node('button', 'save-status', 'Lưu trạng thái');
    save.type = 'button';
    save.addEventListener('click', () => updateStatus(item, select.value, save));
    statusColumn.append(select, save);

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
      await loadAppointments();
    } catch (error) {
      storeSession(null);
      setMessage(elements.loginMessage, errorMessage(error.message));
    } finally {
      elements.loginButton.disabled = false;
    }
  });

  elements.refreshButton.addEventListener('click', loadAppointments);
  elements.statusFilter.addEventListener('change', loadAppointments);
  elements.logoutButton.addEventListener('click', async () => {
    const token = session?.accessToken || '';
    storeSession(null);
    if (token) await rawRequest({ action: 'admin_logout' }, token).catch(() => {});
    showLogin('Bạn đã đăng xuất.');
  });

  const today = dateInTimeZone();
  elements.fromDate.value = today;
  elements.toDate.value = addDays(today, 7);

  if (session) {
    showDashboard();
    loadAppointments();
  } else {
    showLogin();
  }
})();
