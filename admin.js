(() => {
  'use strict';

  const API_URL = 'https://aomiaszicxqrctcgeoms.supabase.co/functions/v1/booking-api';
  const SESSION_KEY = '1m65-admin-session';
  const REMEMBER_MS = 30 * 24 * 60 * 60 * 1000;
  const TIME_ZONE = 'Asia/Ho_Chi_Minh';
  // Month arrows are SVG, not the ‹ › characters, which sit low in some fonts.
  const CHEVRON_LEFT = 'M15 5l-7 7 7 7';
  const CHEVRON_RIGHT = 'M9 5l7 7-7 7';
  const REMOVED_SERVICE_IDS = new Set(['combo-foot', 'goi-thao']);
  const STATUS_LABELS = {
    confirmed: 'Đã xác nhận',
    completed: 'Hoàn thành',
    cancelled: 'Đã hủy',
    no_show: 'Không đến'
  };
  const STATUS_ACTIONS = {
    confirmed: 'Khôi phục lịch',
    cancelled: 'Hủy lịch',
    no_show: 'Khách không đến'
  };
  const SERVICE_CATEGORIES = [
    {
      id: 'nail', label: 'Nail care', hint: 'Chăm móng, tháo bộ cũ và nối móng',
      serviceIds: ['ct-tay', 'ct-chan', 'thao-gel', 'thao-up', 'thao-bot', 'noi-up', 'noi-gel', 'noi-bot']
    },
    {
      id: 'classic', label: 'Classic', hint: 'Sơn một màu, bóng căng, giữ 3 tuần',
      serviceIds: ['son-cung', 'gel-hn', 'gel-thach']
    },
    {
      id: 'design', label: 'Design', hint: 'Cộng thêm vào bộ móng — giá theo full bàn, theo viên đá hoặc theo charm',
      serviceIds: ['flash', 'matmeo', 'guong', 'ombre', 'da', 'charm', 'sticker', 've', 'xacu']
    },
    {
      id: 'mi', label: 'Mi', hint: 'Tháo mi miễn phí nếu bộ cũ do 1M65 làm',
      serviceIds: ['uon-mi', 'uon-mi-den', 'mi-classic', 'mi-tho', 'mi-volume', 'mi-sole', 'mi-duoi']
    },
    {
      id: 'goi', label: 'Gội', hint: 'Thư giãn đầu, vai, cổ',
      serviceIds: ['goi-thuong', 'goi-phuchoi', 'goi-duongsinh']
    }
  ];
  // Pastel note colours, handed out in order so a day reads as a row of different slips.
  const TONES = ['y', 'p', 'b', 'y', 'p', 'm', 'l', 'o', 'b', 'm'];
  const DOW = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  // The day the timelines draw: opening to closing, in minutes.
  const DAY_START = 9 * 60;
  const DAY_END = 18 * 60;
  // Locks are read this far ahead: the booking window, so the calendar can stripe every closed day.
  const BLOCK_LOOKAHEAD_DAYS = 31;
  const DISCOUNT_STEPS = [0, 10, 15, 20, 25, 30];
  // Coming back to Tổng quan within this time shows what is loaded without asking the server again.
  const OVERVIEW_FRESH_MS = 60 * 1000;
  const ICONS = {
    close: 'M6 6l12 12M18 6 6 18',
    lock: 'M8 10.5h8a2.5 2.5 0 0 1 2.5 2.5v4.5A2.5 2.5 0 0 1 16 20H8a2.5 2.5 0 0 1-2.5-2.5V13A2.5 2.5 0 0 1 8 10.5zM8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5',
    phone: 'M6.5 4h3l1.5 4-2 1.3a10 10 0 0 0 5.7 5.7l1.3-2 4 1.5v3a2 2 0 0 1-2.2 2A16 16 0 0 1 4.5 6.2 2 2 0 0 1 6.5 4z'
  };

  const elements = {
    loginView: document.querySelector('#login-view'),
    dashboardView: document.querySelector('#dashboard-view'),
    loginForm: document.querySelector('#login-form'),
    loginButton: document.querySelector('#login-button'),
    loginMessage: document.querySelector('#login-message'),
    loginStep: document.querySelector('#login-step'),
    loginTitle: document.querySelector('#login-title'),
    loginSub: document.querySelector('#login-sub'),
    loginFoot: document.querySelector('#login-foot'),
    mfaForm: document.querySelector('#mfa-form'),
    mfaEnroll: document.querySelector('#mfa-enroll'),
    mfaQr: document.querySelector('#mfa-qr'),
    mfaSecret: document.querySelector('#mfa-secret'),
    mfaUri: document.querySelector('#mfa-uri'),
    mfaCode: document.querySelector('#mfa-code'),
    mfaBoxes: document.querySelector('#mfa-boxes'),
    mfaRemember: document.querySelector('#mfa-remember'),
    mfaButton: document.querySelector('#mfa-button'),
    mfaCancel: document.querySelector('#mfa-cancel'),
    dashboardMessage: document.querySelector('#dashboard-message'),
    adminName: document.querySelector('#admin-name'),
    adminIdentity: document.querySelector('#admin-identity'),
    adminAvatar: document.querySelector('#admin-avatar'),
    logoutButton: document.querySelector('#logout-button'),
    menuButton: document.querySelector('#menu-button'),
    menuClose: document.querySelector('#menu-close'),
    sideScrim: document.querySelector('#side-scrim'),
    navCountSchedule: document.querySelector('#nav-count-schedule'),
    navCountBlock: document.querySelector('#nav-count-block'),
    navCountDiscounts: document.querySelector('#nav-count-discounts'),
    navCountCustomers: document.querySelector('#nav-count-customers'),
    overviewGreeting: document.querySelector('#overview-greeting'),
    overviewSearch: document.querySelector('#overview-search'),
    overviewStatus: document.querySelector('#overview-status'),
    overviewReload: document.querySelector('#overview-reload'),
    overviewDateLabel: document.querySelector('#overview-date-label'),
    overviewNextChip: document.querySelector('#overview-next-chip'),
    overviewTimeline: document.querySelector('#overview-timeline'),
    dashboardTitle: document.querySelector('#dashboard-title'),
    overviewWeekStrip: document.querySelector('#overview-week-strip'),
    overviewBlocks: document.querySelector('#overview-blocks'),
    summary: document.querySelector('#summary'),
    scheduleTitleText: document.querySelector('#schedule-title-text'),
    weekNav: document.querySelector('#week-nav'),
    weekPrev: document.querySelector('#week-prev'),
    weekToday: document.querySelector('#week-today'),
    weekNext: document.querySelector('#week-next'),
    scheduleSearchToggle: document.querySelector('#schedule-search-toggle'),
    scheduleReload: document.querySelector('#schedule-reload'),
    scheduleFilters: document.querySelector('#schedule-filters'),
    rangeLabel: document.querySelector('#range-label'),
    statusFilter: document.querySelector('#status-filter'),
    scheduleSearch: document.querySelector('#schedule-search'),
    filterDates: document.querySelector('#filter-dates'),
    fromDate: document.querySelector('#from-date'),
    toDate: document.querySelector('#to-date'),
    refreshButton: document.querySelector('#refresh-button'),
    appointmentList: document.querySelector('#appointment-list'),
    weekGrid: document.querySelector('#week-grid'),
    detailScrim: document.querySelector('#detail-scrim'),
    detailDrawer: document.querySelector('#detail-drawer'),
    adminBookingForm: document.querySelector('#admin-booking-form'),
    adminServiceCount: document.querySelector('#admin-service-count'),
    adminServiceTabs: document.querySelector('#admin-service-tabs'),
    adminServiceCategoryHint: document.querySelector('#admin-service-category-hint'),
    adminServiceGrid: document.querySelector('#admin-service-grid'),
    adminServiceSummary: document.querySelector('#admin-service-summary'),
    adminBookingDate: document.querySelector('#admin-booking-date'),
    adminBookingCalendar: document.querySelector('#admin-booking-calendar'),
    adminSlotTitle: document.querySelector('#admin-slot-title'),
    adminSlotDuration: document.querySelector('#admin-slot-duration'),
    adminBookingSlotGrid: document.querySelector('#admin-booking-slot-grid'),
    adminCustomerName: document.querySelector('#admin-customer-name'),
    adminCustomerPhone: document.querySelector('#admin-customer-phone'),
    adminCustomerNote: document.querySelector('#admin-customer-note'),
    adminBookingMessage: document.querySelector('#admin-booking-message'),
    adminCreateBookingButton: document.querySelector('#admin-create-booking-button'),
    createBarTotal: document.querySelector('#create-bar-total'),
    createBarMeta: document.querySelector('#create-bar-meta'),
    createBarNext: document.querySelector('#create-bar-next'),
    createBack: document.querySelector('#create-back'),
    createReset: document.querySelector('#create-reset'),
    blockDaySelect: document.querySelector('#block-day-select'),
    blockDate: document.querySelector('#block-date'),
    blockReason: document.querySelector('#block-reason'),
    allDayButton: document.querySelector('#all-day-button'),
    blockSlotGrid: document.querySelector('#block-slot-grid'),
    blockSelection: document.querySelector('#block-selection'),
    createBlockButton: document.querySelector('#create-block-button'),
    blockMessage: document.querySelector('#block-message'),
    blockList: document.querySelector('#block-list'),
    discountSearch: document.querySelector('#discount-search'),
    discountApply: document.querySelector('#discount-apply'),
    discountDiscard: document.querySelector('#discount-discard'),
    saleList: document.querySelector('#sale-list'),
    saleMessage: document.querySelector('#sale-message'),
    saleNew: document.querySelector('#sale-new'),
    saleDialog: document.querySelector('#sale-dialog'),
    saleForm: document.querySelector('#sale-form'),
    saleFormTitle: document.querySelector('#sale-form-title'),
    saleTitle: document.querySelector('#sale-title'),
    salePercent: document.querySelector('#sale-percent'),
    salePercentChips: document.querySelector('#sale-percent-chips'),
    saleAllDay: document.querySelector('#sale-all-day'),
    saleStartDate: document.querySelector('#sale-start-date'),
    saleStartTime: document.querySelector('#sale-start-time'),
    saleEndDate: document.querySelector('#sale-end-date'),
    saleEndTime: document.querySelector('#sale-end-time'),
    saleOverlap: document.querySelector('#sale-overlap'),
    saleFormMessage: document.querySelector('#sale-form-message'),
    saleCancel: document.querySelector('#sale-cancel'),
    discountFilters: document.querySelector('#discount-filters'),
    discountServiceList: document.querySelector('#discount-service-list'),
    discountMessage: document.querySelector('#discount-message'),
    discountScrim: document.querySelector('#discount-scrim'),
    discountSheet: document.querySelector('#discount-sheet'),
    customersCount: document.querySelector('#customers-count'),
    customersRange: document.querySelector('#customers-range'),
    customerSearch: document.querySelector('#customer-search'),
    customerList: document.querySelector('#customer-list'),
    customerScrim: document.querySelector('#customer-scrim'),
    customerDetail: document.querySelector('#customer-detail'),
    confirmDialog: document.querySelector('#confirm-dialog'),
    confirmTitle: document.querySelector('#confirm-title'),
    confirmText: document.querySelector('#confirm-text'),
    confirmOk: document.querySelector('#confirm-ok'),
    confirmCancel: document.querySelector('#confirm-cancel')
  };
  const sectionLinks = [...document.querySelectorAll('a.section-link[href^="#sec-"]')];
  const navigationSections = [...document.querySelectorAll('.admin-view[id^="sec-"]')];
  const SECTION_LABELS = {
    '#sec-overview': 'Tổng quan',
    '#sec-schedule': 'Lịch hẹn',
    '#sec-create': 'Tạo lịch',
    '#sec-block': 'Khóa lịch',
    '#sec-discounts': 'Ưu đãi',
    '#sec-customers': 'Khách hàng'
  };
  // Phones get the tab bar, the bottom sheets and the one-step-at-a-time create flow.
  const phoneMedia = window.matchMedia('(max-width: 767px)');
  // Under 1440px the detail drawers lie over the page instead of sitting beside the table.
  const overlayMedia = window.matchMedia('(max-width: 1439px)');

  let session = readSession();
  let pendingMfa = null; // password-only (AAL1) token + factor, kept in memory until the 6-digit code is verified
  let appointments = [];
  let scheduleBlocks = [];
  let scheduleView = 'list';
  let scheduleStatus = '';
  let detailId = '';
  let overviewAppointments = [];
  let overviewBlocks = [];
  let overviewLoading = false;
  let overviewLoadedAt = 0;
  let blocks = [];
  let blockDayAppointments = [];
  let selectedBlockSlots = new Set();
  let blockWholeDay = false;
  let blockDayLoading = false;
  let bookingConfig = null;
  let adminSelectedServiceIds = new Set();
  let activeAdminServiceCategory = SERVICE_CATEGORIES[0].id;
  let adminAvailableSlots = [];
  let adminSelectedStartAt = '';
  let adminAvailabilityLoading = false;
  let adminConfigLoading = true;
  let adminCreatePending = false;
  let adminAvailabilityRequestId = 0;
  let adminCalendarMonth = '';
  let createStep = 1;
  let discountFilter = '';
  let discountSheetId = '';
  let customerKey = '';
  const discountDrafts = new Map();
  const discountSavingIds = new Set();
  // Time-window sales (booking_sales), all of them including those switched off: the Ưu đãi list and the Tạo lịch tags.
  const SALE_STEPS = [5, 10, 15, 20, 30];
  let sales = [];
  let editingSaleId = '';
  let saleBusy = false;
  // Units for designs priced per nail, stone or charm (shared with the site); without it prices stay one number.
  let priceUnits = null;
  import('./price-units.js?v=20261004-1').then((module) => {
    priceUnits = module;
    renderAdminServices();
    renderDiscountServices();
    renderSales();
    renderAdminSlots();
  }).catch(() => {});
  const rangeChips = [...document.querySelectorAll('[data-range]')];
  const viewButtons = [...document.querySelectorAll('[data-view]')];
  const stepButtons = [...document.querySelectorAll('[data-step-go]')];

  // Tab-scoped by default; "Ghi nhớ thiết bị" (explicit opt-in after MFA) keeps it for 30 days.
  function readSession() {
    try {
      const remembered = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
      if (remembered?.accessToken && remembered?.refreshToken && remembered.rememberUntil > Date.now()) return remembered;
      localStorage.removeItem(SESSION_KEY);
      const value = JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null');
      return value?.accessToken && value?.refreshToken ? value : null;
    } catch {
      try { sessionStorage.removeItem(SESSION_KEY); localStorage.removeItem(SESSION_KEY); } catch {}
      return null;
    }
  }

  function storeSession(value) {
    session = value;
    try {
      sessionStorage.removeItem(SESSION_KEY);
      localStorage.removeItem(SESSION_KEY);
      if (value) (value.rememberUntil ? localStorage : sessionStorage).setItem(SESSION_KEY, JSON.stringify(value));
    } catch {}
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

  function setDateValue(input, value) {
    input.value = value;
    input.dispatchEvent(new Event('input', { bubbles: true }));
  }

  // Red by default; green for a result, yellow while waiting ("…") or when the admin only has to pick again.
  function setMessage(target, message = '', success = false, warning = false) {
    target.textContent = message;
    target.classList.toggle('success', success);
    target.classList.toggle('warning', !success && (warning || message.endsWith('…')));
  }

  function errorMessage(code) {
    const messages = {
      invalid_login: 'Email hoặc mật khẩu không đúng.',
      admin_access_denied: 'Tài khoản này chưa được cấp quyền quản lý.',
      invalid_admin_date_range: 'Khoảng ngày không hợp lệ hoặc dài hơn 93 ngày.',
      invalid_appointment_status: 'Trạng thái lịch không hợp lệ.',
      appointment_not_found: 'Không tìm thấy lịch hẹn.',
      appointment_not_reschedulable: 'Chỉ có thể dời lịch đang chờ hoặc đã xác nhận.',
      slot_unavailable: 'Giờ này vừa có khách đặt. Chọn giờ khác nha.',
      too_many_requests: 'Bạn thử đăng nhập quá nhiều lần. Vui lòng chờ một lúc.',
      human_verification_failed: 'Chưa xác minh được bạn là người thật. Vui lòng thử đăng nhập lại.',
      invalid_mfa_code: 'Mã 6 số chưa đúng hoặc đã hết hạn. Lấy mã mới trong app rồi thử lại.',
      mfa_expired: 'Phiên xác thực đã hết hạn. Vui lòng đăng nhập lại.',
      mfa_not_enabled: 'Supabase chưa bật xác thực 2 lớp (TOTP). Bật trong Dashboard → Authentication → Multi-Factor rồi thử lại.',
      turnstile_unavailable: 'Chưa tải được bước xác minh chống bot. Kiểm tra mạng rồi thử lại.',
      invalid_block_range: 'Khoảng thời gian khóa không hợp lệ.',
      too_many_blocks: 'Bạn chọn quá nhiều khoảng khóa cùng lúc.',
      block_reason_too_long: 'Lý do khóa lịch dài quá 120 ký tự.',
      block_not_found: 'Khoảng khóa này không còn tồn tại.',
      invalid_customer_name: 'Tên khách cần từ 2 đến 80 ký tự.',
      invalid_customer_phone: 'Số điện thoại gồm 10 số, bắt đầu bằng 0.',
      customer_note_too_long: 'Ghi chú dài quá 500 ký tự.',
      date_outside_booking_window: 'Ngày hẹn nằm ngoài thời gian cho phép đặt.',
      start_time_is_in_the_past: 'Giờ hẹn đã qua. Vui lòng chọn giờ khác.',
      outside_business_hours: 'Giờ hẹn nằm ngoài giờ hoạt động.',
      invalid_slot_interval: 'Giờ hẹn không đúng khung 30 phút.',
      invalid_service_selection: 'Vui lòng chọn ít nhất một dịch vụ.',
      too_many_services: 'Mỗi lịch được chọn tối đa 8 dịch vụ.',
      service_not_found: 'Một dịch vụ không còn hoạt động. Vui lòng chọn lại.',
      invalid_original_price: 'Giá gốc phải là số nguyên không âm.',
      invalid_discount_percent: 'Phần trăm giảm giá phải là số nguyên từ 0 đến 100.',
      invalid_duration: 'Thời gian dịch vụ phải từ 5 đến 480 phút.',
      invalid_sale_title: 'Tên dịp cần từ 2 đến 60 ký tự.',
      invalid_sale_percent: 'Mức giảm là số nguyên từ 1 đến 90%.',
      invalid_sale_range: 'Thời gian kết thúc phải sau thời gian bắt đầu.',
      sale_not_found: 'Đợt sale này không còn nữa. Tải lại trang để xem danh sách mới.',
      service_selection_too_long: 'Tổng thời lượng dịch vụ quá dài.',
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
    storeSession({ ...data.session, rememberUntil: session.rememberUntil });
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

  // The sign-in card has three faces: password, the 6-digit code, and first-time enrolment with the QR code.
  function setLoginStage(stage) {
    const mfa = stage !== 'password';
    elements.loginView.classList.toggle('is-mfa', mfa);
    elements.loginStep.textContent = mfa ? 'Bước 2/2' : 'Admin';
    elements.loginTitle.textContent = stage === 'enroll' ? 'Bật xác thực 2 lớp' : mfa ? 'Nhập mã 6 số' : 'Chào bạn trở lại';
    elements.loginSub.textContent = stage === 'enroll'
      ? 'Lần đầu đăng nhập: quét mã QR rồi nhập mã 6 số.'
      : 'Mở app xác thực trên điện thoại để lấy mã.';
    elements.loginSub.hidden = !mfa;
    elements.loginFoot.hidden = stage !== 'code';
    elements.loginForm.hidden = mfa;
    elements.mfaForm.hidden = !mfa;
    elements.mfaEnroll.hidden = stage !== 'enroll';
  }

  function showLogin(message = '') {
    appointments = [];
    overviewLoadedAt = 0;
    setMenuOpen(false);
    elements.dashboardView.hidden = true;
    elements.loginView.hidden = false;
    elements.loginForm.reset();
    setLoginStage('password');
    pendingMfa = null;
    setMessage(elements.loginMessage, message);
  }

  function showDashboard() {
    elements.loginView.hidden = true;
    elements.dashboardView.hidden = false;
    const admin = session?.admin || {};
    const avatar = initials(admin.displayName || admin.email);
    elements.adminName.textContent = admin.displayName || 'Chủ tiệm';
    elements.adminIdentity.textContent = admin.email || '';
    elements.adminAvatar.textContent = avatar;
    elements.overviewGreeting.textContent = greeting();
    updateActiveNavigation(window.location.hash || '#sec-overview');
  }

  function initials(name) {
    const letters = String(name || '').trim().split(/[\s@.]+/).filter(Boolean).map((word) => word[0]);
    return (letters.length > 1 ? letters[0] + letters[letters.length - 1] : letters[0] || 'AD').toUpperCase();
  }

  function greeting() {
    const hour = Math.floor(currentMinuteInTimeZone() / 60);
    const part = hour < 11 ? 'sáng' : hour < 14 ? 'trưa' : hour < 18 ? 'chiều' : 'tối';
    return `Chào buổi ${part}, ${session?.admin?.displayName || 'chủ tiệm'}`;
  }

  // On phones the sidebar is a slide-in menu opened from Tổng quan.
  function setMenuOpen(open) {
    elements.dashboardView.classList.toggle('menu-open', open);
    elements.sideScrim.hidden = !open;
    elements.menuButton.setAttribute('aria-expanded', String(open));
  }

  function activeSection() {
    return `#${navigationSections.find((section) => !section.hidden)?.id || 'sec-overview'}`;
  }

  function updateActiveNavigation(sectionHash, scrollToTop = false) {
    const fallback = '#sec-overview';
    const activeHash = navigationSections.some((section) => `#${section.id}` === sectionHash)
      ? sectionHash : fallback;
    sectionLinks.forEach((link) => {
      if (link.getAttribute('href') === activeHash) link.setAttribute('aria-current', 'true');
      else link.removeAttribute('aria-current');
    });
    navigationSections.forEach((section) => {
      const active = `#${section.id}` === activeHash;
      section.hidden = !active;
      section.classList.toggle('is-active', active);
      section.setAttribute('aria-hidden', String(!active));
    });
    document.title = `${SECTION_LABELS[activeHash] || SECTION_LABELS[fallback]} · Quản lý lịch · 1M65 Nails`;
    if (scrollToTop) window.scrollTo({ top: 0, behavior: 'auto' });
    return activeHash;
  }

  function navigateToSection(sectionHash) {
    // Edited prices are not live until confirmed: leaving Ưu đãi asks to confirm them now or stay.
    // ponytail: the browser's own back button skips this; the drafts stay in memory and show again on return.
    if (discountDrafts.size && activeSection() === '#sec-discounts' && sectionHash !== '#sec-discounts') {
      confirmAction(
        `Có ${discountDrafts.size} giá chưa xác nhận`,
        'Giá mới chỉ lên website sau khi xác nhận. Xác nhận ngay, hoặc ở lại để xem lại.',
        'Xác nhận', 'Ở lại'
      ).then(async (apply) => {
        if (!apply) return;
        await savePricing([...discountDrafts.keys()]);
        if (!discountDrafts.size) navigateToSection(sectionHash);
      });
      return;
    }
    if (window.location.hash !== sectionHash) window.history.pushState(null, '', sectionHash);
    setMenuOpen(false);
    setMessage(elements.dashboardMessage);
    updateActiveNavigation(sectionHash, true);
    if (sectionHash === '#sec-overview' && session && Date.now() - overviewLoadedAt > OVERVIEW_FRESH_MS) loadOverview();
  }

  function initializeSectionNavigation() {
    sectionLinks.forEach((link) => link.addEventListener('click', (event) => {
      event.preventDefault();
      navigateToSection(link.getAttribute('href'));
    }));
    const restoreSection = () => updateActiveNavigation(window.location.hash || '#sec-overview', true);
    window.addEventListener('hashchange', restoreSection);
    window.addEventListener('popstate', restoreSection);
    updateActiveNavigation(window.location.hash || '#sec-overview');
  }

  function currency(value) {
    return `${new Intl.NumberFormat('vi-VN').format(Number(value || 0))}đ`;
  }

  // "40.000đ/full bàn", "2.000đ/viên", "10.000–20.000đ/charm" for designs priced per unit; one number otherwise.
  function priceText(service) {
    if (!priceUnits) return currency(service.price);
    const shown = priceUnits.unitPrice(service.id, service.price, 'đ');
    return `${shown.price}${shown.unit ? `/${shown.unit}` : ''}`;
  }

  // "mỗi viên", "full bàn": how a unit-priced design is counted; empty for a service priced per booking.
  function unitLabel(serviceId, price) {
    return priceUnits ? priceUnits.unitPrice(serviceId, price, 'đ').line.split(' · ')[0] : '';
  }

  // What the customer pays: the subtotal less a time-window sale (booking-api adds total and sale to each item).
  function due(item) {
    return Number(item?.total ?? item?.price ?? 0);
  }

  function saleTag(item) {
    return item?.sale ? node('span', 'sale-tag', `−${item.sale.percent}%`) : null;
  }

  function isEstimate(serviceIds) {
    return Boolean(priceUnits?.hasUnitPricing(serviceIds));
  }

  function serviceOriginalPrice(service) {
    return Number(service?.originalPrice ?? service?.price ?? 0);
  }

  function discountedPrice(originalPrice, discountPercent) {
    const percent = Math.min(100, Math.max(0, Number(discountPercent || 0)));
    return Math.round(Number(originalPrice || 0) * (100 - percent) / 100);
  }

  function normalizeDiscountInput(value) {
    const number = Number(value);
    if (!Number.isFinite(number)) return 0;
    return Math.min(100, Math.max(0, Math.round(number)));
  }

  function normalizeOriginalPriceInput(value) {
    const number = Number(value);
    if (!Number.isFinite(number)) return 0;
    return Math.min(2_000_000_000, Math.max(0, Math.round(number)));
  }

  // booking_services allows 5 to 480 minutes per service.
  function normalizeDurationInput(value) {
    const number = Number(value);
    if (!Number.isFinite(number)) return 5;
    return Math.min(480, Math.max(5, Math.round(number)));
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

  function minuteOfDay(value) {
    const [hours, minutes] = localTime(value).split(':').map(Number);
    return hours * 60 + minutes;
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

  function dayMonth(dateText) {
    return `${dateText.slice(8, 10)}/${dateText.slice(5, 7)}`;
  }

  // "T5 01/10"
  function shortDate(dateText) {
    return `${DOW[new Date(`${dateText}T00:00:00Z`).getUTCDay()]} ${dayMonth(dateText)}`;
  }

  function appointmentDate(item) {
    return dateInTimeZone(new Date(item.startAt));
  }

  function node(tag, className = '', text = '') {
    const item = document.createElement(tag);
    if (className) item.className = className;
    if (text !== '') item.textContent = text;
    return item;
  }

  function chevron(path) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('aria-hidden', 'true');
    line.setAttribute('d', path);
    svg.append(line);
    return svg;
  }

  function button(className, text = '') {
    const item = node('button', className, text);
    item.type = 'button';
    return item;
  }

  function image(className, src, width, height) {
    const item = node('img', className);
    item.src = src;
    item.alt = '';
    item.width = width;
    item.height = height;
    item.decoding = 'async';
    return item;
  }

  function icon(path, size, strokeWidth = 2) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    const shape = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    Object.entries({
      viewBox: '0 0 24 24', width: size, height: size, fill: 'none', stroke: 'currentColor',
      'stroke-width': strokeWidth, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'aria-hidden': 'true'
    }).forEach(([name, value]) => svg.setAttribute(name, value));
    shape.setAttribute('d', path);
    svg.append(shape);
    return svg;
  }

  // A pair of spans for copy that differs between the wide layouts and the phone.
  function responsiveText(wide, phone) {
    return [node('span', 'd-only', wide), node('span', 'm-only', phone)];
  }

  function skeletons(count) {
    return Array.from({ length: count }, () => {
      const block = node('span', 'skeleton');
      block.setAttribute('aria-hidden', 'true');
      return block;
    });
  }

  function renderAppointmentSkeletons() {
    const list = node('div', 'skeleton-list');
    list.append(...skeletons(4));
    elements.appointmentList.replaceChildren(list);
  }

  function renderSummarySkeletons() {
    elements.summary.replaceChildren(...Array.from({ length: 6 }, () => {
      const sticker = node('span', 'sticker sticker-skeleton');
      sticker.setAttribute('aria-hidden', 'true');
      return sticker;
    }));
    elements.overviewNextChip.replaceChildren(...skeletons(2));
    elements.overviewTimeline.classList.add('is-empty');
    elements.overviewTimeline.replaceChildren(...skeletons(4));
    elements.overviewWeekStrip.replaceChildren(...skeletons(3));
  }

  function statusBadge(item) {
    return node('span', `badge ${item.status}`, STATUS_LABELS[item.status] || item.status);
  }

  function inactive(item) {
    return item.status === 'cancelled' || item.status === 'no_show';
  }

  // A title and one short line wherever a list is empty; the optional action opens another section.
  function emptyState(title, text = '', action = null) {
    const box = node('div', 'empty');
    const copy = node('div');
    copy.append(node('strong', '', title));
    if (text) copy.append(node('p', '', text));
    if (action) {
      const open = button('btn-ghost', action.label);
      open.addEventListener('click', () => navigateToSection(action.section));
      copy.append(open);
    }
    box.append(copy);
    return box;
  }

  // Every lock, unlock, cancel, reschedule and create goes through this dialog; resolves true only on the pink button.
  function confirmAction(title, text = '', okLabel = 'Xác nhận', cancelLabel = 'Để sau') {
    return new Promise((resolve) => {
      if (elements.confirmDialog.open) {
        resolve(false);
        return;
      }
      elements.confirmTitle.textContent = title;
      elements.confirmText.textContent = text;
      elements.confirmText.hidden = !text;
      elements.confirmOk.textContent = okLabel;
      elements.confirmCancel.textContent = cancelLabel;
      elements.confirmDialog.returnValue = '';
      elements.confirmDialog.addEventListener('close', () => {
        resolve(elements.confirmDialog.returnValue === 'ok');
      }, { once: true });
      elements.confirmDialog.showModal();
    });
  }

  function setCount(target, value) {
    target.textContent = value ? String(value) : '';
    target.hidden = !value;
  }

  function selectedAdminServices() {
    const services = Array.isArray(bookingConfig?.services) ? bookingConfig.services : [];
    return services.filter((service) => adminSelectedServiceIds.has(service.id));
  }

  function adminServiceCategories() {
    const services = Array.isArray(bookingConfig?.services) ? bookingConfig.services : [];
    const servicesById = new Map(services.map((service) => [service.id, service]));
    const categorizedIds = new Set(SERVICE_CATEGORIES.flatMap((category) => category.serviceIds));
    const categories = SERVICE_CATEGORIES.map((category) => ({
      ...category,
      services: category.serviceIds.map((id) => servicesById.get(id)).filter(Boolean)
    })).filter((category) => category.services.length);
    const uncategorized = services.filter((service) => !categorizedIds.has(service.id));
    if (uncategorized.length) {
      categories.push({ id: 'other', label: 'Khác', hint: 'Các dịch vụ khác đang hoạt động', services: uncategorized });
    }
    return categories;
  }

  function updateAdminCreateButton() {
    elements.adminCreateBookingButton.disabled = adminCreatePending
      || adminAvailabilityLoading
      || adminSelectedServiceIds.size === 0
      || !adminSelectedStartAt;
    elements.createBarNext.textContent = createStep === 1 ? 'Chọn giờ →' : 'Thông tin khách →';
    elements.createBarNext.disabled = createStep === 1 ? adminSelectedServiceIds.size === 0 : !adminSelectedStartAt;
    elements.createReset.hidden = adminSelectedServiceIds.size === 0;
  }

  // Phones walk the three steps one at a time; wider screens show them all and ignore the step.
  function setCreateStep(step) {
    createStep = step;
    elements.adminBookingForm.dataset.step = String(step);
    elements.createBack.hidden = step === 1;
    stepButtons.forEach((item) => {
      if (Number(item.dataset.stepGo) === step) item.setAttribute('aria-current', 'step');
      else item.removeAttribute('aria-current');
    });
    updateAdminCreateButton();
  }

  // Back to an empty form: after a booking is created, and from the Xóa hết button.
  function resetAdminCreate() {
    elements.adminCustomerName.value = '';
    elements.adminCustomerPhone.value = '';
    elements.adminCustomerNote.value = '';
    adminSelectedServiceIds.clear();
    adminSelectedStartAt = '';
    adminAvailableSlots = [];
    setCreateStep(1);
    renderAdminServices();
    renderAdminSlots();
  }

  // The slip on the right (and the phone's sticky bar): when, what, how long and how much.
  function renderAdminServiceSummary() {
    const services = selectedAdminServices();
    const duration = services.reduce((sum, service) => sum + Number(service.durationMinutes || 0), 0);
    const price = services.reduce((sum, service) => sum + Number(service.price || 0), 0);
    const estimate = isEstimate(services.map((service) => service.id));
    const sale = adminSelectedStartAt && priceUnits ? priceUnits.timeSaleFor(sales, adminSelectedStartAt) : null;
    const cut = sale ? priceUnits.timeSaleDiscount(price, sale.percent) : 0;
    const date = elements.adminBookingDate.value;
    elements.adminServiceCount.textContent = `${services.length}/8 dịch vụ`;
    elements.adminSlotTitle.textContent = `Giờ còn trống${date ? ` · ${shortDate(date)}` : ''}`;
    elements.adminSlotDuration.textContent = services.length ? `cho ${duration} phút` : '';
    elements.createBarTotal.textContent = services.length ? `${currency(price - cut)}${estimate ? ' tạm tính' : ''}` : 'Chưa chọn dịch vụ';
    elements.createBarMeta.textContent = `${services.length}/8 dịch vụ${services.length ? ` · ${duration} phút` : ''}`;
    if (!services.length) {
      elements.adminServiceSummary.replaceChildren(node('p', 'hint', 'Chưa chọn dịch vụ.'));
      updateAdminCreateButton();
      return;
    }
    const when = adminSelectedStartAt
      ? `${shortDate(date)} · ${localTime(adminSelectedStartAt)} – ${minutesToTime(minuteOfDay(adminSelectedStartAt) + duration)}`
      : `${shortDate(date)} · chưa chọn giờ`;
    const total = node('div', 'slip-total');
    total.append(node('span', '', `${sale ? 'Còn lại' : estimate ? 'Tạm tính' : 'Tổng tiền'} · ${duration} phút`), node('b', '', currency(price - cut)));
    const saleLine = sale ? node('div', 'slip-line slip-sale') : null;
    if (saleLine) saleLine.append(node('span', '', `Giảm ${sale.title} (−${sale.percent}%)`), node('span', '', `−${currency(cut)}`));
    elements.adminServiceSummary.replaceChildren(
      node('p', 'slip-when', when),
      ...services.map((service) => {
        const unit = unitLabel(service.id, service.price);
        const line = node('div', 'slip-line');
        line.append(
          node('span', '', `${service.name}${unit ? ` · ${unit}` : ''} · ${service.durationMinutes}'`),
          node('span', '', currency(service.price))
        );
        return line;
      }),
      node('div', 'slip-tear'),
      ...(saleLine ? [saleLine] : []),
      total
    );
    if (estimate) {
      elements.adminServiceSummary.append(node('p', 'hint', 'Giá tạm tính: có dịch vụ tính theo bàn, viên đá hoặc charm. Tiệm chốt giá khi làm.'));
    }
    updateAdminCreateButton();
  }

  function renderAdminServices() {
    const services = Array.isArray(bookingConfig?.services) ? bookingConfig.services : [];
    setCount(elements.navCountDiscounts, services.filter((service) => normalizeDiscountInput(service.discountPercent) > 0).length);
    if (!services.length) {
      elements.adminServiceTabs.replaceChildren();
      elements.adminServiceCategoryHint.textContent = '';
      elements.adminServiceGrid.replaceChildren(node(
        'p', 'slot-empty', adminConfigLoading ? 'Đang tải danh sách dịch vụ…' : 'Chưa tải được danh sách dịch vụ.'
      ));
      renderAdminServiceSummary();
      return;
    }
    const categories = adminServiceCategories();
    if (!categories.some((category) => category.id === activeAdminServiceCategory)) {
      activeAdminServiceCategory = categories[0]?.id || '';
    }
    const activeCategory = categories.find((category) => category.id === activeAdminServiceCategory);
    elements.adminServiceTabs.replaceChildren(...categories.map((category) => {
      const tab = button('');
      const selectedCount = category.services.filter((service) => adminSelectedServiceIds.has(service.id)).length;
      tab.role = 'tab';
      tab.setAttribute('aria-selected', String(category.id === activeAdminServiceCategory));
      tab.append(node('span', '', category.label));
      if (selectedCount) tab.append(node('b', 'seg-count', String(selectedCount)));
      tab.addEventListener('click', () => {
        activeAdminServiceCategory = category.id;
        renderAdminServices();
      });
      return tab;
    }));
    elements.adminServiceCategoryHint.textContent = activeCategory?.hint || '';
    elements.adminServiceGrid.replaceChildren(...(activeCategory?.services || []).map((service) => {
      const selected = adminSelectedServiceIds.has(service.id);
      const option = button('admin-service-option');
      const copy = node('span', 'so-copy');
      const check = node('span', 'so-check');
      check.setAttribute('aria-hidden', 'true');
      option.setAttribute('aria-pressed', String(selected));
      option.disabled = !selected && adminSelectedServiceIds.size >= 8;
      copy.append(
        node('strong', '', service.name),
        node('span', '', `${service.durationMinutes} phút · ${priceText(service)}`)
      );
      option.append(copy, check);
      option.addEventListener('click', () => {
        if (selected) adminSelectedServiceIds.delete(service.id);
        else if (adminSelectedServiceIds.size < 8) adminSelectedServiceIds.add(service.id);
        adminSelectedStartAt = '';
        renderAdminServices();
        renderAdminSlots();
        loadAdminAvailability();
      });
      return option;
    }));
    renderAdminServiceSummary();
  }

  function discountDraft(service) {
    const savedOriginalPrice = serviceOriginalPrice(service);
    const savedPercent = normalizeDiscountInput(service.discountPercent);
    const draft = discountDrafts.get(service.id) || {};
    const originalPrice = draft.originalPrice == null ? savedOriginalPrice : normalizeOriginalPriceInput(draft.originalPrice);
    const percent = draft.discountPercent == null ? savedPercent : normalizeDiscountInput(draft.discountPercent);
    const savedDuration = Number(service.durationMinutes || 0);
    const duration = draft.durationMinutes == null ? savedDuration : normalizeDurationInput(draft.durationMinutes);
    return {
      savedOriginalPrice, savedPercent, savedDuration, originalPrice, percent, duration,
      changed: percent !== savedPercent || originalPrice !== savedOriginalPrice || duration !== savedDuration
    };
  }

  // A charm's "10.000–20.000đ" stays a range; every other price is one number.
  function shownPrice(service, price) {
    return priceUnits ? priceUnits.unitPrice(service.id, price, 'đ').price : currency(price);
  }

  function numberField(shellClass, inputClass, value, max, step, suffix, label) {
    const shell = node('span', shellClass);
    const input = node('input', inputClass);
    input.type = 'number';
    input.min = '0';
    input.max = String(max);
    input.step = String(step);
    input.inputMode = 'numeric';
    input.value = String(value);
    input.setAttribute('aria-label', label);
    shell.append(input, node('b', '', suffix));
    return { shell, input };
  }

  function renderDiscountFilters(categories, services) {
    const onSale = services.filter((service) => normalizeDiscountInput(service.discountPercent) > 0).length;
    const chips = [
      ...categories.map((category) => [category.id, `${category.label} ${category.services.length}`]),
      ['sale', `Đang giảm ${onSale}`]
    ];
    elements.discountFilters.replaceChildren(...chips.map(([id, label]) => {
      const chip = button('chip', label);
      chip.setAttribute('aria-pressed', String(discountFilter === id));
      chip.addEventListener('click', () => {
        discountFilter = id;
        renderDiscountServices();
      });
      return chip;
    }));
  }

  function renderDiscountServices() {
    if (!elements.discountServiceList) return;
    const services = Array.isArray(bookingConfig?.services) ? bookingConfig.services : [];
    const query = String(elements.discountSearch?.value || '').trim().toLocaleLowerCase('vi-VN');
    if (!services.length) {
      elements.discountFilters.replaceChildren();
      updateDiscountBar();
      elements.discountServiceList.replaceChildren(node(
        'p', 'slot-empty', adminConfigLoading ? 'Đang tải danh sách dịch vụ…' : 'Chưa tải được danh sách dịch vụ.'
      ));
      return;
    }
    const categories = adminServiceCategories();
    // Like the site's service tabs one chip is always pressed, the first group until another is picked.
    if (discountFilter !== 'sale' && !categories.some((category) => category.id === discountFilter)) {
      discountFilter = categories[0]?.id || 'sale';
    }
    renderDiscountFilters(categories, services);
    updateDiscountBar();
    // A search looks through every group; without one the pressed chip picks a group or the services on sale.
    const visible = (service) => (query
      ? String(service.name || '').toLocaleLowerCase('vi-VN').includes(query)
      : discountFilter !== 'sale' || normalizeDiscountInput(service.discountPercent) > 0);
    const groups = categories
      .filter((category) => query || discountFilter === 'sale' || category.id === discountFilter)
      .map((category) => ({ ...category, services: category.services.filter(visible) }))
      .filter((category) => category.services.length);
    if (!groups.length) {
      elements.discountServiceList.replaceChildren(node('p', 'slot-empty', 'Không tìm thấy dịch vụ phù hợp.'));
      return;
    }
    const head = node('div', 't-head disc-head');
    head.append(...['Dịch vụ', 'Phút', 'Giá gốc', 'Giảm', 'Giá hiển thị'].map((label) => node('span', '', label)));
    elements.discountServiceList.replaceChildren(head, ...groups.map((category) => {
      const group = node('section', 'disc-group');
      const title = node('h3', 'disc-group-title', category.label);
      title.append(node('span', '', category.hint));
      group.append(title, ...category.services.map((service) => discountRow(service)));
      return group;
    }));
  }

  function discountRow(service) {
    const { savedOriginalPrice, savedPercent, savedDuration, originalPrice, percent, duration, changed } = discountDraft(service);
    const saving = discountSavingIds.has(service.id);
    const card = node('article', 'discount-service-card');
    card.classList.toggle('has-active-sale', savedPercent > 0);
    card.classList.toggle('is-dirty', changed);

    const identity = node('div', 'discount-service-identity');
    const copy = node('div');
    const line = priceUnits ? priceUnits.unitPrice(service.id, service.price, 'đ').line : '';
    const state = () => (card.classList.contains('is-dirty') ? 'Chưa lưu' : savedPercent > 0 ? 'Đang giảm' : '');
    const phoneLine = node('span', 'm-only', `${duration}′ · ${state() || 'giá gốc'}`);
    copy.append(node('strong', '', service.name), phoneLine);
    if (line) copy.append(node('span', 'd-only', line));
    identity.append(copy);

    const price = numberField('discount-price-input-shell', 'discount-original-input', originalPrice, 2000000000, 1000, 'đ', `Giá gốc của ${service.name}`);
    const discount = numberField('discount-input-shell', 'discount-percent-input', percent, 100, 1, '%', `Phần trăm giảm cho ${service.name}`);
    const minutes = numberField('discount-minutes-input-shell', 'discount-minutes-input', duration, 480, 5, 'phút', `Số phút của ${service.name}`);
    minutes.input.min = '5';
    const priceInput = price.input;
    const input = discount.input;
    priceInput.disabled = saving;
    input.disabled = saving;
    minutes.input.disabled = saving;

    const preview = node('div', 'discount-price-preview');
    const previewValue = node('strong', 'discount-preview-price', shownPrice(service, discountedPrice(originalPrice, percent)));
    const originalValue = node('span', `discount-original-price${percent > 0 ? ' is-crossed' : ''}`, currency(originalPrice));
    const prices = node('div');
    prices.append(previewValue, originalValue);
    const cloud = node('span', 'sale-cloud', `-${percent}%`);
    cloud.hidden = percent === 0;
    preview.append(cloud, prices);

    const updateDraftPreview = () => {
      if (input.value === '' || priceInput.value === '' || minutes.input.value === '') return;
      const nextPercent = normalizeDiscountInput(input.value);
      const nextPrice = normalizeOriginalPriceInput(priceInput.value);
      // Minutes are put back in range on blur, not while typing ("1" on the way to "15").
      const nextDuration = normalizeDurationInput(minutes.input.value);
      if (Number(input.value) !== nextPercent) input.value = String(nextPercent);
      if (Number(priceInput.value) !== nextPrice) priceInput.value = String(nextPrice);
      const dirty = nextPercent !== savedPercent || nextPrice !== savedOriginalPrice || nextDuration !== savedDuration;
      if (dirty) discountDrafts.set(service.id, { discountPercent: nextPercent, originalPrice: nextPrice, durationMinutes: nextDuration });
      else discountDrafts.delete(service.id);
      previewValue.textContent = shownPrice(service, discountedPrice(nextPrice, nextPercent));
      originalValue.textContent = currency(nextPrice);
      originalValue.classList.toggle('is-crossed', nextPercent > 0);
      cloud.textContent = `-${nextPercent}%`;
      cloud.hidden = nextPercent === 0;
      card.classList.toggle('is-dirty', dirty);
      updateDiscountBar();
    };
    input.addEventListener('input', updateDraftPreview);
    priceInput.addEventListener('input', updateDraftPreview);
    minutes.input.addEventListener('input', updateDraftPreview);
    minutes.input.addEventListener('change', () => {
      minutes.input.value = String(normalizeDurationInput(minutes.input.value));
    });
    // The phone shows one compact line per service and edits it in a bottom sheet.
    card.addEventListener('click', () => {
      if (phoneMedia.matches) openDiscountSheet(service.id);
    });
    card.append(identity, minutes.shell, price.shell, discount.shell, preview);
    return card;
  }

  // One Xác nhận for the whole table: it wakes up with the first edited row and sends every one of them.
  function updateDiscountBar() {
    const count = discountDrafts.size;
    const saving = discountSavingIds.size > 0;
    elements.discountApply.replaceChildren(saving ? 'Đang lưu…' : 'Xác nhận');
    if (count && !saving) elements.discountApply.append(node('b', 'seg-count', String(count)));
    elements.discountApply.disabled = saving || !count;
    elements.discountDiscard.disabled = saving || !count;
  }

  function closeDiscountSheet(discard = false) {
    if (discard && discountSheetId) discountDrafts.delete(discountSheetId);
    discountSheetId = '';
    elements.discountSheet.hidden = true;
    elements.discountScrim.hidden = true;
    renderDiscountServices();
  }

  function openDiscountSheet(serviceId) {
    const service = (bookingConfig?.services || []).find((item) => item.id === serviceId);
    if (!service) return;
    discountSheetId = serviceId;
    const category = adminServiceCategories().find((item) => item.services.some((entry) => entry.id === serviceId));
    const draft = discountDraft(service);
    let originalPrice = draft.originalPrice;
    let percent = draft.percent;
    let duration = draft.duration;

    const head = node('div', 'ds-head');
    const title = node('div');
    title.append(
      node('p', 'eyebrow', category?.label || 'Dịch vụ'),
      node('h2', '', service.name)
    );
    head.append(title, image('', 'doodles/polish-bottle.webp', 372, 512));

    const priceLabel = node('label', 'ds-field', 'Giá gốc');
    const price = numberField('discount-price-input-shell', 'discount-original-input', originalPrice, 2000000000, 1000, 'đ', `Giá gốc của ${service.name}`);
    priceLabel.append(price.shell);
    const minutesLabel = node('label', 'ds-field', 'Thời gian');
    const minutes = numberField('discount-minutes-input-shell', 'discount-minutes-input', duration, 480, 5, 'phút', `Số phút của ${service.name}`);
    minutes.input.min = '5';
    minutesLabel.append(minutes.shell);

    const percentGroup = node('div', 'ds-field');
    const chips = node('div', 'pct-chips');
    // The chips are the usual steps; any other percentage is typed here.
    const custom = numberField('discount-input-shell', 'discount-percent-input', percent, 100, 1, '%', `Mức giảm khác cho ${service.name}`);
    const customRow = node('label', 'pct-custom');
    customRow.append(node('span', '', 'Hoặc nhập mức khác'), custom.shell);
    percentGroup.append(node('span', '', 'Giảm giá'), chips, customRow);

    const preview = node('div', 'ds-preview');
    const before = node('div');
    const oldPrice = node('p', 'ds-old');
    before.append(node('p', '', 'Giá mới trên website'), oldPrice);
    const after = node('div', 'ds-new');
    const cloud = node('span', 'sale-cloud');
    const newPrice = node('b');
    after.append(cloud, newPrice);
    preview.append(before, after);

    const actions = node('div', 'ds-actions');
    const later = button('btn-ghost', 'Để sau');
    const save = button('btn-paper', 'Xác nhận thay đổi');
    actions.append(later, save);

    const update = () => {
      const dirty = percent !== draft.savedPercent || originalPrice !== draft.savedOriginalPrice || duration !== draft.savedDuration;
      if (dirty) discountDrafts.set(serviceId, { discountPercent: percent, originalPrice, durationMinutes: duration });
      else discountDrafts.delete(serviceId);
      if (document.activeElement !== custom.input) custom.input.value = String(percent);
      customRow.classList.toggle('is-on', !DISCOUNT_STEPS.includes(percent));
      chips.replaceChildren(...DISCOUNT_STEPS.map((value) => {
        const chip = button('', `${value}%`);
        chip.setAttribute('aria-pressed', String(value === percent));
        chip.addEventListener('click', () => {
          percent = value;
          update();
        });
        return chip;
      }));
      oldPrice.textContent = currency(originalPrice);
      oldPrice.hidden = percent === 0;
      cloud.textContent = `-${percent}%`;
      cloud.hidden = percent === 0;
      newPrice.textContent = shownPrice(service, discountedPrice(originalPrice, percent));
      save.disabled = !dirty || discountSavingIds.has(serviceId);
    };
    price.input.addEventListener('input', () => {
      if (price.input.value === '') return;
      originalPrice = normalizeOriginalPriceInput(price.input.value);
      update();
    });
    minutes.input.addEventListener('input', () => {
      if (minutes.input.value === '') return;
      duration = normalizeDurationInput(minutes.input.value);
      update();
    });
    minutes.input.addEventListener('change', () => {
      minutes.input.value = String(duration);
    });
    custom.input.addEventListener('input', () => {
      if (custom.input.value === '') return;
      percent = normalizeDiscountInput(custom.input.value);
      if (Number(custom.input.value) !== percent) custom.input.value = String(percent);
      update();
    });
    later.addEventListener('click', () => closeDiscountSheet(true));
    save.addEventListener('click', async () => {
      save.disabled = true;
      await savePricing([serviceId]);
      closeDiscountSheet();
    });
    update();
    elements.discountSheet.replaceChildren(
      head, minutesLabel, priceLabel, percentGroup, preview,
      node('p', 'hint', 'Chỉ áp dụng cho booking mới sau khi xác nhận. Lịch đã đặt giữ giá và thời gian cũ.'), actions
    );
    elements.discountSheet.hidden = false;
    elements.discountScrim.hidden = false;
  }

  // Sends the draft of each given service; one that fails keeps its draft so it can be confirmed again.
  // ponytail: one request per service, in turn; a batch action in booking-api if a long list ever feels slow.
  async function savePricing(serviceIds) {
    const pending = (bookingConfig?.services || [])
      .filter((service) => serviceIds.includes(service.id) && !discountSavingIds.has(service.id));
    if (!pending.length) return;
    pending.forEach((service) => discountSavingIds.add(service.id));
    setMessage(elements.discountMessage, 'Đang cập nhật ưu đãi…');
    renderDiscountServices();
    let saved = 0;
    let failure = '';
    for (const service of pending) {
      const serviceId = service.id;
      const draft = discountDrafts.get(serviceId) || {};
      const originalPrice = draft.originalPrice == null
        ? serviceOriginalPrice(service) : normalizeOriginalPriceInput(draft.originalPrice);
      const discountPercent = draft.discountPercent == null
        ? normalizeDiscountInput(service.discountPercent) : normalizeDiscountInput(draft.discountPercent);
      const durationMinutes = draft.durationMinutes == null
        ? Number(service.durationMinutes) : normalizeDurationInput(draft.durationMinutes);
      try {
        const data = await adminRequest({
          action: 'admin_update_service_pricing', serviceId, originalPrice, discountPercent, durationMinutes
        });
        const updated = data.service || {};
        bookingConfig.services = bookingConfig.services.map((item) => (
          item.id === serviceId ? { ...item, ...updated } : item
        ));
        discountDrafts.delete(serviceId);
        saved += 1;
      } catch (error) {
        failure = failure || errorMessage(error.message);
      }
    }
    pending.forEach((service) => discountSavingIds.delete(service.id));
    if (failure) {
      setMessage(elements.discountMessage, saved ? `Đã cập nhật ${saved}/${pending.length} dịch vụ. ${failure}` : failure);
    } else if (pending.length > 1) {
      setMessage(elements.discountMessage, `Đã cập nhật giá của ${saved} dịch vụ.`, true);
    } else {
      const service = bookingConfig.services.find((item) => item.id === pending[0].id) || pending[0];
      const percent = normalizeDiscountInput(service.discountPercent);
      setMessage(
        elements.discountMessage,
        `Đã cập nhật ${service.name}: ${service.durationMinutes} phút, giá gốc ${currency(serviceOriginalPrice(service))}`
          + (percent > 0 ? `, giảm ${percent}%.` : '; website không hiển thị giao diện sale.'),
        true
      );
    }
    if (saved) renderAdminServices();
    renderDiscountServices();
  }

  // Days a lock covers from opening to closing: striped in the calendars, "nghỉ" in the week lists.
  function blockIsAllDay(block) {
    const date = dateInTimeZone(new Date(block.startAt));
    return new Date(block.startAt) <= new Date(`${date}T${minutesToTime(DAY_START)}:00+07:00`)
      && new Date(block.endAt) >= new Date(`${date}T${minutesToTime(DAY_END)}:00+07:00`);
  }

  function closedDates(list = overviewBlocks) {
    return new Set(list.filter(blockIsAllDay).map((block) => dateInTimeZone(new Date(block.startAt))));
  }

  function blockReason(block) {
    const reason = String(block.reason || '').trim();
    return !reason || reason === 'tiệm hôm nay nghỉ' ? 'tiệm nghỉ' : reason;
  }

  function blockWhen(block) {
    const range = blockIsAllDay(block) ? 'cả ngày' : `${localTime(block.startAt)} – ${localTime(block.endAt)}`;
    return `${shortDate(dateInTimeZone(new Date(block.startAt)))} · ${range}`;
  }

  // Where a lock sits on a day's timeline, clipped to the salon's hours.
  function blockMinutes(block, date) {
    const start = dateInTimeZone(new Date(block.startAt)) < date ? DAY_START : minuteOfDay(block.startAt);
    const end = dateInTimeZone(new Date(block.endAt)) > date ? DAY_END : minuteOfDay(block.endAt);
    return { start: Math.max(DAY_START, start), end: Math.min(DAY_END, end) };
  }

  // The month on the create form: every day of the booking window is a button, closed days are striped.
  function renderAdminCalendar() {
    const today = dateInTimeZone();
    const value = elements.adminBookingDate.value || today;
    const min = elements.adminBookingDate.min || today;
    const max = elements.adminBookingDate.max || addDays(today, 30);
    const month = adminCalendarMonth || value.slice(0, 7);
    const [year, monthNumber] = month.split('-').map(Number);
    const closed = closedDates();
    const shift = (step) => new Date(Date.UTC(year, monthNumber - 1 + step, 1)).toISOString().slice(0, 7);

    const head = node('div', 'mc-head');
    const nav = node('div', 'mc-nav');
    const previous = button('');
    const next = button('');
    previous.append(chevron(CHEVRON_LEFT));
    next.append(chevron(CHEVRON_RIGHT));
    previous.setAttribute('aria-label', 'Tháng trước');
    next.setAttribute('aria-label', 'Tháng sau');
    previous.disabled = month <= min.slice(0, 7);
    next.disabled = month >= max.slice(0, 7);
    previous.addEventListener('click', () => { adminCalendarMonth = shift(-1); renderAdminCalendar(); });
    next.addEventListener('click', () => { adminCalendarMonth = shift(1); renderAdminCalendar(); });
    nav.append(previous, next);
    head.append(node('b', '', `Tháng ${monthNumber} · ${year}`), nav);

    const grid = node('div', 'mc-grid');
    grid.append(...[...DOW.slice(1), DOW[0]].map((day) => node('span', '', day)));
    const lead = (new Date(Date.UTC(year, monthNumber - 1, 1)).getUTCDay() + 6) % 7;
    const daysInMonth = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
    const first = addDays(`${month}-01`, -lead);
    for (let index = 0; index < Math.ceil((lead + daysInMonth) / 7) * 7; index += 1) {
      const date = addDays(first, index);
      const day = button('mc-day', String(Number(date.slice(8, 10))));
      day.disabled = date < min || date > max;
      day.classList.toggle('is-today', date === today);
      day.classList.toggle('is-blocked', closed.has(date));
      day.classList.toggle('is-on', date === value);
      day.setAttribute('aria-label', `${shortDate(date)}${closed.has(date) ? ' · tiệm nghỉ' : ''}`);
      day.setAttribute('aria-pressed', String(date === value));
      day.addEventListener('click', () => {
        adminCalendarMonth = '';
        setDateValue(elements.adminBookingDate, date);
        renderAdminCalendar();
        loadAdminAvailability();
      });
      grid.append(day);
    }
    elements.adminBookingCalendar.replaceChildren(head, grid);
  }

  function renderAdminSlots() {
    const grid = elements.adminBookingSlotGrid;
    if (adminAvailabilityLoading) {
      grid.replaceChildren(node('p', 'slot-empty', 'Đang tải giờ trống…'));
    } else if (!adminSelectedServiceIds.size) {
      grid.replaceChildren(node('p', 'slot-empty', 'Chọn dịch vụ trước để xem giờ trống.'));
    } else if (!adminAvailableSlots.length) {
      grid.replaceChildren(node('p', 'slot-empty', 'Ngày này không còn giờ phù hợp.'));
    } else {
      grid.replaceChildren(...adminAvailableSlots.map((slot) => {
        const chip = button('slot-chip', slot.label);
        const slotSale = priceUnits ? priceUnits.timeSaleFor(sales, slot.startAt) : null;
        if (slotSale) chip.append(node('i', 'slot-sale', `−${slotSale.percent}%`));
        const selected = slot.startAt === adminSelectedStartAt;
        chip.classList.toggle('selected', selected);
        chip.setAttribute('aria-pressed', String(selected));
        chip.addEventListener('click', () => {
          adminSelectedStartAt = slot.startAt;
          renderAdminSlots();
        });
        return chip;
      }));
    }
    renderAdminServiceSummary();
  }

  function saleParts(value) {
    const map = {};
    new Intl.DateTimeFormat('en-GB', { timeZone: TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
      .formatToParts(new Date(value)).forEach((part) => { map[part.type] = part.value; });
    return { date: `${map.year}-${map.month}-${map.day}`, time: `${map.hour}:${map.minute}` };
  }

  function saleState(sale, now = Date.now()) {
    if (!sale.active) return { key: 'off', label: 'Đang tắt' };
    if (new Date(sale.endsAt).getTime() <= now) return { key: 'past', label: 'Đã qua' };
    if (new Date(sale.startsAt).getTime() <= now) return { key: 'live', label: 'Đang diễn ra' };
    return { key: 'soon', label: 'Sắp tới' };
  }

  function saleWhenText(sale) {
    return priceUnits ? priceUnits.timeSaleWhen(sale) : `${shortDate(saleParts(sale.startsAt).date)} → ${shortDate(saleParts(sale.endsAt).date)}`;
  }

  async function loadSales() {
    try {
      const data = await adminRequest({ action: 'admin_list_sales' });
      sales = Array.isArray(data.sales) ? data.sales : [];
    } catch (error) {
      setMessage(elements.saleMessage, errorMessage(error.message));
    }
    renderSales();
    renderAdminSlots();
  }

  function renderSales() {
    if (!elements.saleList) return;
    if (!sales.length) {
      elements.saleList.replaceChildren(node('p', 'hint', 'Chưa có đợt sale nào. Bấm “Tạo đợt sale” để bắt đầu.'));
      return;
    }
    elements.saleList.replaceChildren(...sales.map((sale) => {
      const state = saleState(sale);
      const row = node('article', `sale-row is-${state.key}`);
      const copy = node('div', 'sale-copy');
      copy.append(node('strong', '', sale.title), node('span', '', saleWhenText(sale)));
      const toggle = button('sale-switch');
      toggle.setAttribute('role', 'switch');
      toggle.setAttribute('aria-checked', String(sale.active));
      toggle.setAttribute('aria-label', `${sale.active ? 'Tắt' : 'Bật'} ${sale.title}`);
      toggle.disabled = saleBusy;
      toggle.addEventListener('click', () => toggleSale(sale));
      const feature = button('sale-feature', sale.featured ? 'Đang hiện trang chủ' : 'Hiện trang chủ');
      feature.setAttribute('role', 'switch');
      feature.setAttribute('aria-checked', String(Boolean(sale.featured)));
      feature.disabled = saleBusy || state.key === 'off' || state.key === 'past';
      feature.addEventListener('click', () => featureSale(sale));
      const edit = button('btn-ghost sale-edit', 'Sửa');
      edit.disabled = saleBusy;
      edit.addEventListener('click', () => openSaleForm(sale));
      const remove = button('btn-ghost sale-delete', 'Xóa');
      remove.disabled = saleBusy;
      remove.addEventListener('click', () => deleteSale(sale));
      row.append(node('span', 'sale-pct', `−${sale.percent}%`), copy, node('span', 'sale-state', state.label), feature, toggle, edit, remove);
      return row;
    }));
  }

  function saleRequestBody(sale) {
    return { id: sale.id || null, title: sale.title, percent: sale.percent, startsAt: sale.startsAt, endsAt: sale.endsAt, active: sale.active };
  }

  async function writeSale(action, body, done) {
    saleBusy = true;
    renderSales();
    try {
      await adminRequest({ action, ...body });
      setMessage(elements.saleMessage, done, true);
      await loadSales();
      return true;
    } catch (error) {
      setMessage(elements.saleMessage, errorMessage(error.message));
      return false;
    } finally {
      saleBusy = false;
      renderSales();
    }
  }

  async function toggleSale(sale) {
    const next = !sale.active;
    if (!await confirmAction(
      `${next ? 'Bật' : 'Tắt'} đợt “${sale.title}”?`,
      next ? `Lịch hẹn mới bắt đầu trong ${saleWhenText(sale)} sẽ được giảm ${sale.percent}%.` : 'Lịch mới sẽ không được giảm nữa. Lịch đã đặt vẫn giữ giá đã giảm.',
      next ? 'Bật' : 'Tắt'
    )) return;
    await writeSale('admin_save_sale', saleRequestBody({ ...sale, active: next }), `Đã ${next ? 'bật' : 'tắt'} đợt ${sale.title}.`);
  }

  // One sale at a time is featured on the home page; the server unfeatures the others.
  async function featureSale(sale) {
    const next = !sale.featured;
    await writeSale('admin_feature_sale', { id: sale.id, featured: next }, next ? `Trang chủ đang hiện đợt ${sale.title}.` : `Đã ẩn đợt ${sale.title} khỏi trang chủ.`);
  }

  async function deleteSale(sale) {
    if (!await confirmAction(`Xóa đợt “${sale.title}”?`, 'Lịch đã đặt vẫn giữ giá đã giảm.', 'Xóa')) return;
    await writeSale('admin_delete_sale', { id: sale.id }, `Đã xóa đợt ${sale.title}.`);
  }

  // "Cả ngày" runs from the start day's 00:00 to the day after the end day's 00:00.
  function saleFormRange() {
    const allDay = elements.saleAllDay.checked;
    const startDate = elements.saleStartDate.value;
    const endDate = elements.saleEndDate.value;
    if (!startDate || !endDate) return null;
    return {
      startsAt: `${startDate}T${allDay ? '00:00' : elements.saleStartTime.value || '00:00'}:00+07:00`,
      endsAt: allDay ? `${addDays(endDate, 1)}T00:00:00+07:00` : `${endDate}T${elements.saleEndTime.value || '00:00'}:00+07:00`
    };
  }

  function renderSaleForm() {
    const percent = Number(elements.salePercent.value);
    elements.salePercentChips.replaceChildren(...SALE_STEPS.map((value) => {
      const chip = button('', `${value}%`);
      chip.setAttribute('aria-pressed', String(value === percent));
      chip.addEventListener('click', () => {
        elements.salePercent.value = String(value);
        renderSaleForm();
      });
      return chip;
    }));
    elements.saleStartTime.disabled = elements.saleAllDay.checked;
    elements.saleEndTime.disabled = elements.saleAllDay.checked;
    const range = saleFormRange();
    const overlaps = range ? sales.filter((sale) => sale.id !== editingSaleId && sale.active
      && new Date(sale.startsAt) < new Date(range.endsAt) && new Date(range.startsAt) < new Date(sale.endsAt)) : [];
    elements.saleOverlap.hidden = !overlaps.length;
    elements.saleOverlap.textContent = overlaps.length
      ? `Trùng khung với ${overlaps.map((sale) => `“${sale.title}” (−${sale.percent}%)`).join(', ')}. Lịch trong phần trùng lấy đợt % cao hơn.`
      : '';
  }

  function openSaleForm(sale = null) {
    editingSaleId = sale?.id || '';
    elements.saleFormTitle.textContent = sale ? 'Sửa đợt sale' : 'Tạo đợt sale';
    elements.saleTitle.value = sale?.title || '';
    elements.salePercent.value = String(sale?.percent || 10);
    const today = dateInTimeZone();
    const start = sale ? saleParts(sale.startsAt) : { date: today, time: '09:00' };
    const end = sale ? saleParts(sale.endsAt) : { date: today, time: '18:00' };
    const allDay = Boolean(sale) && start.time === '00:00' && end.time === '00:00';
    elements.saleAllDay.checked = allDay;
    setDateValue(elements.saleStartDate, start.date);
    setDateValue(elements.saleEndDate, allDay ? addDays(end.date, -1) : end.date);
    elements.saleStartTime.value = allDay ? '09:00' : start.time;
    elements.saleEndTime.value = allDay ? '18:00' : end.time;
    setMessage(elements.saleFormMessage);
    renderSaleForm();
    elements.saleDialog.showModal();
    elements.saleTitle.focus();
  }

  async function submitSaleForm(event) {
    event.preventDefault();
    const title = elements.saleTitle.value.trim();
    const percent = Number(elements.salePercent.value);
    const range = saleFormRange();
    if (title.length < 2) return setMessage(elements.saleFormMessage, 'Tên dịp cần ít nhất 2 ký tự.');
    if (!Number.isInteger(percent) || percent < 1 || percent > 90) return setMessage(elements.saleFormMessage, 'Mức giảm là số nguyên từ 1 đến 90%.');
    if (!range || new Date(range.endsAt) <= new Date(range.startsAt)) {
      return setMessage(elements.saleFormMessage, 'Thời gian kết thúc phải sau thời gian bắt đầu.');
    }
    const current = sales.find((item) => item.id === editingSaleId);
    const sale = { id: editingSaleId || null, title, percent, ...range, active: current ? current.active : true };
    if (!await confirmAction(`Lưu đợt “${title}”?`, `Lịch hẹn bắt đầu trong ${saleWhenText(sale)} được giảm ${percent}% trên tổng bill.`, 'Lưu')) return;
    if (await writeSale('admin_save_sale', saleRequestBody(sale), `Đã lưu đợt ${title}.`)) elements.saleDialog.close();
  }

  async function loadAdminBookingConfig() {
    loadSales();
    adminConfigLoading = true;
    renderAdminServices();
    try {
      const data = await adminRequest({ action: 'config' });
      bookingConfig = data.config || null;
      if (Array.isArray(bookingConfig?.services)) {
        bookingConfig.services = bookingConfig.services.filter((service) => !REMOVED_SERVICE_IDS.has(service.id));
      }
      const today = dateInTimeZone();
      elements.adminBookingDate.min = today;
      elements.adminBookingDate.max = addDays(today, Number(bookingConfig?.advanceBookingDays || 30));
    } catch (error) {
      setMessage(elements.adminBookingMessage, errorMessage(error.message));
    } finally {
      adminConfigLoading = false;
      renderAdminServices();
      renderDiscountServices();
      renderAdminCalendar();
      renderAdminSlots();
    }
  }

  async function loadAdminAvailability() {
    const date = elements.adminBookingDate.value;
    const serviceIds = [...adminSelectedServiceIds];
    adminSelectedStartAt = '';
    adminAvailableSlots = [];
    if (!date || !serviceIds.length) {
      renderAdminSlots();
      return;
    }
    const requestId = ++adminAvailabilityRequestId;
    adminAvailabilityLoading = true;
    renderAdminSlots();
    setMessage(elements.adminBookingMessage, '');
    try {
      const data = await adminRequest({ action: 'availability', date, serviceIds });
      if (requestId !== adminAvailabilityRequestId) return;
      const seen = new Set();
      adminAvailableSlots = (Array.isArray(data.slots) ? data.slots : []).map((slot) => {
        const startAt = slot.start_at || slot.startAt;
        return { startAt, label: localTime(startAt) };
      }).filter((slot) => slot.startAt && !seen.has(slot.label) && seen.add(slot.label));
    } catch (error) {
      if (requestId === adminAvailabilityRequestId) {
        setMessage(elements.adminBookingMessage, errorMessage(error.message));
      }
    } finally {
      if (requestId === adminAvailabilityRequestId) {
        adminAvailabilityLoading = false;
        renderAdminSlots();
      }
    }
  }

  async function createAdminAppointment(event) {
    event.preventDefault();
    if (!elements.adminBookingForm.reportValidity()) return;
    const services = selectedAdminServices();
    if (!services.length || !adminSelectedStartAt) {
      setMessage(elements.adminBookingMessage, 'Vui lòng chọn dịch vụ và giờ hẹn.');
      return;
    }
    const customerName = elements.adminCustomerName.value.trim();
    const customerPhone = elements.adminCustomerPhone.value.replace(/\D/g, '');
    const date = elements.adminBookingDate.value;
    const time = localTime(adminSelectedStartAt);
    if (!await confirmAction(
      `Tạo lịch ${time} ${shortDate(date)} cho ${customerName}?`,
      `${services.map((service) => service.name).join(' + ')} · ${customerPhone}`,
      'Tạo lịch'
    )) return;
    adminCreatePending = true;
    updateAdminCreateButton();
    setMessage(elements.adminBookingMessage, 'Đang tạo lịch…');
    try {
      const data = await adminRequest({
        action: 'admin_create_appointment',
        serviceIds: services.map((service) => service.id),
        startAt: adminSelectedStartAt,
        customerName,
        customerPhone,
        customerNote: elements.adminCustomerNote.value.trim()
      });
      const reference = data.appointment?.reference || '';
      resetAdminCreate();
      if (date < elements.fromDate.value || date > elements.toDate.value) {
        setDateValue(elements.fromDate, date);
        setDateValue(elements.toDate, date);
      }
      await Promise.all([loadAppointments(), loadOverview()]);
      setMessage(elements.adminBookingMessage, `Đã tạo lịch ${reference} cho ${customerName}.`, true);
    } catch (error) {
      setMessage(elements.adminBookingMessage, errorMessage(error.message), false, error.message === 'slot_unavailable');
      if (error.message === 'slot_unavailable') await loadAdminAvailability();
    } finally {
      adminCreatePending = false;
      updateAdminCreateButton();
    }
  }

  function activeOverviewAppointment(item) {
    return item.status !== 'cancelled' && item.status !== 'no_show';
  }

  function overviewTodayAppointments() {
    const today = dateInTimeZone();
    return overviewAppointments.filter((item) => dateInTimeZone(new Date(item.startAt)) === today);
  }

  function overviewTodayBlocks() {
    const today = dateInTimeZone();
    const dayStart = new Date(`${today}T00:00:00+07:00`);
    const dayEnd = new Date(`${addDays(today, 1)}T00:00:00+07:00`);
    return overviewBlocks.filter((block) => new Date(block.startAt) < dayEnd && new Date(block.endAt) > dayStart);
  }

  function formatDuration(minutes) {
    const value = Math.max(0, Math.round(Number(minutes || 0)));
    const hours = Math.floor(value / 60);
    const remainder = value % 60;
    if (!hours) return `${remainder} phút`;
    if (!remainder) return `${hours} giờ`;
    return `${hours} giờ ${remainder} phút`;
  }

  function overviewDateTitle(dateText) {
    return new Intl.DateTimeFormat('vi-VN', {
      timeZone: TIME_ZONE, weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric'
    }).format(new Date(`${dateText}T12:00:00+07:00`));
  }

  function renderOverviewSummary() {
    const now = Date.now();
    const todayAppointments = overviewTodayAppointments();
    const active = todayAppointments.filter(activeOverviewAppointment);
    const completed = active.filter((item) => item.status === 'completed').length;
    const remaining = active.filter((item) => item.status !== 'completed'
      && new Date(item.endAt).getTime() > now).length;
    const duration = active.reduce((total, item) => total + Number(item.durationMinutes || 0), 0);
    const estimate = active.reduce((total, item) => total + due(item), 0);
    const dropped = todayAppointments.length - active.length;
    elements.dashboardTitle.textContent = active.length ? `Hôm nay có ${active.length} lịch` : 'Hôm nay chưa có lịch nào';
    // Always the same six tiles, so the grid keeps its shape: number on top, what it counts underneath.
    const booked = duration < 60 ? `${duration}′` : `${Math.floor(duration / 60)}h${String(duration % 60).padStart(2, '0')}`;
    const stickers = [
      [`${completed}/${active.length}`, 'đã xong'],
      [String(remaining), 'sắp tới'],
      [booked, 'đã đặt'],
      [currency(estimate), 'tạm tính'],
      [String(overviewTodayBlocks().length), 'khung khóa'],
      [String(dropped), 'hủy / không đến']
    ];
    elements.summary.replaceChildren(...stickers.map(([value, label]) => {
      const sticker = node('span', 'sticker');
      sticker.append(node('b', '', value), node('span', '', label));
      return sticker;
    }));
  }

  function nextOverviewAppointment() {
    const now = Date.now();
    return overviewTodayAppointments()
      .filter((item) => item.status === 'confirmed' && new Date(item.startAt).getTime() >= now)
      .sort((a, b) => new Date(a.startAt) - new Date(b.startAt))[0] || null;
  }

  // The "Tiếp theo" slip: who is coming next, how soon, with a call button and the way into the details.
  function renderOverviewNext() {
    const next = nextOverviewAppointment();
    if (!next) {
      const copy = node('div', 'next-empty');
      copy.append(node('b', '', 'Không còn lịch sắp tới hôm nay'), node('p', '', 'Nhu Nhi đi ngủ được rồi. Tạo lịch khi khách gọi nhé.'));
      elements.overviewNextChip.replaceChildren(copy);
      return;
    }
    const wait = formatDuration((new Date(next.startAt).getTime() - Date.now()) / 60000);
    const top = node('div', 'next-top');
    const flag = node('span', 'next-flag', 'Tiếp theo · ');
    flag.append(node('span', 'd-only', 'còn '), document.createTextNode(wait));
    const time = node('span', 'next-time', localTime(next.startAt));
    time.append(node('span', 'd-only', `–${localTime(next.endAt)}`));
    top.append(flag, time);

    const service = node('p', 'next-service', next.service);
    service.append(node('span', 'd-only', ` · ${currency(next.price)}`));
    if (next.customerNote) service.append(node('span', 'm-only', ` · ${next.customerNote}`));

    const actions = node('div', 'next-actions');
    const call = node('a', 'btn-ghost', 'Gọi ');
    call.href = `tel:${String(next.customerPhone).replace(/[^0-9+]/g, '')}`;
    call.append(...responsiveText(next.customerPhone, 'khách'));
    const open = button('btn-ghost');
    open.append(...responsiveText('Mở chi tiết', 'Chi tiết'));
    open.addEventListener('click', () => openDetail(next));
    actions.append(call, open);

    elements.overviewNextChip.replaceChildren(top, node('p', 'next-name', next.customerName), service);
    if (next.customerNote) elements.overviewNextChip.append(node('p', 'next-note d-only', `Ghi chú: ${next.customerNote}`));
    elements.overviewNextChip.append(actions);
  }

  // Today drawn from opening to closing: every appointment at its hour, locks striped, a line at "now".
  function renderOverviewTimeline() {
    const today = dateInTimeZone();
    const next = nextOverviewAppointment();
    const items = overviewTodayAppointments().sort((a, b) => new Date(a.startAt) - new Date(b.startAt));
    elements.overviewTimeline.classList.toggle('is-empty', !items.length);
    if (!items.length) {
      elements.overviewTimeline.replaceChildren(emptyState(
        'Hôm nay chưa có lịch hẹn', 'Nhu Nhi đi ngủ được rồi. Tạo lịch khi khách gọi nhé.',
        { label: 'Tạo lịch cho khách', section: '#sec-create' }
      ));
      return;
    }
    const place = (element, start, end, minimum) => {
      const from = Math.min(Math.max(start, DAY_START), DAY_END - 30);
      element.style.setProperty('--top', `${(from - DAY_START) / 30 * 34}px`);
      element.style.setProperty('--h', `${Math.max(minimum, (Math.min(end, DAY_END) - from) / 30 * 34 - 3)}px`);
    };
    const hours = Array.from({ length: (DAY_END - DAY_START) / 60 + 1 }, (_, index) => {
      const row = node('div', 'tl-hour');
      row.style.setProperty('--top', `${index * 68}px`);
      row.append(node('span', '', minutesToTime(DAY_START + index * 60)));
      return row;
    });
    const locked = overviewTodayBlocks().map((block) => {
      const { start, end } = blockMinutes(block, today);
      const row = node('div', 'tl-block');
      place(row, start, end, 26);
      row.append(icon(ICONS.lock, 15), document.createTextNode(`${minutesToTime(start)}–${minutesToTime(end)} · ${blockReason(block)} · đã khóa`));
      return row;
    });
    const notes = items.map((item, index) => {
      const note = button(`tl-item tone-${TONES[index % TONES.length]} status-${item.status}`);
      const start = minuteOfDay(item.startAt);
      place(note, start, start + Number(item.durationMinutes || 30), 32);
      note.classList.toggle('is-next', next?.id === item.id);
      note.classList.toggle('is-off', inactive(item));
      const time = node('span', 'tl-time', localTime(item.startAt));
      time.append(node('span', 'd-only', `–${localTime(item.endAt)}`));
      const main = node('span', 'tl-main');
      main.append(node('b', 'tl-name', item.customerName), node('span', 'tl-service', item.service));
      const price = node('span', 'tl-price', currency(due(item)));
      const tag = saleTag(item);
      if (tag) price.append(tag);
      note.append(time, main, price, statusBadge(item));
      note.addEventListener('click', () => openDetail(item));
      return note;
    });
    const minute = currentMinuteInTimeZone();
    const now = node('div', 'tl-now');
    now.style.setProperty('--top', `${(minute - DAY_START) / 30 * 34}px`);
    now.append(node('span', '', `Bây giờ ${minutesToTime(minute)}`));
    elements.overviewTimeline.replaceChildren(...hours, ...locked, ...notes);
    if (minute >= DAY_START && minute <= DAY_END) elements.overviewTimeline.append(now);
  }

  function renderOverviewWeek() {
    const today = dateInTimeZone();
    const closed = closedDates();
    const countByDate = overviewAppointments.reduce((result, item) => {
      if (!activeOverviewAppointment(item)) return result;
      const date = dateInTimeZone(new Date(item.startAt));
      result[date] = (result[date] || 0) + 1;
      return result;
    }, {});
    const days = Array.from({ length: 7 }, (_, index) => addDays(today, index));
    elements.overviewWeekStrip.replaceChildren(...days.map((date, index) => {
      const count = countByDate[date] || 0;
      const label = closed.has(date) && !count ? 'nghỉ' : `${count} lịch`;
      const button = node('button', 'week-row');
      button.type = 'button';
      button.classList.toggle('is-today', index === 0);
      button.classList.toggle('is-empty', count === 0);
      button.setAttribute('aria-label', `${shortDate(date)}: ${label}. Xem lịch ngày này`);
      const day = node('span', 'week-day', shortDate(date).split(' ')[0]);
      day.append(node('b', '', dayMonth(date)));
      const bar = node('span', 'week-bar');
      const fill = node('i');
      // ponytail: five appointments fill the bar; tune if the salon's full day changes
      fill.style.setProperty('--fill', `${Math.min(100, count * 20)}%`);
      bar.append(fill);
      button.append(day, bar, node('span', 'week-count', label));
      button.addEventListener('click', () => showScheduleFor(date, date));
      return button;
    }));
  }

  function renderOverviewBlocks() {
    if (!overviewBlocks.length) {
      elements.overviewBlocks.replaceChildren(node('p', 'hint', 'Chưa có khung giờ nào đang khóa.'));
      return;
    }
    elements.overviewBlocks.replaceChildren(...overviewBlocks.slice(0, 4).map((block) => {
      const row = node('div', 'locked-row');
      const copy = node('div');
      copy.append(node('b', '', blockWhen(block)), node('span', '', blockReason(block)));
      const span = blockIsAllDay(block)
        ? `${minutesToTime(DAY_START)}–${minutesToTime(DAY_END)}`
        : formatDuration((new Date(block.endAt) - new Date(block.startAt)) / 60000);
      row.append(copy, node('span', 'locked-span', span));
      return row;
    }));
    if (overviewBlocks.length > 4) {
      elements.overviewBlocks.append(node('p', 'hint', `và ${overviewBlocks.length - 4} khung khóa khác`));
    }
  }

  function showScheduleFor(from, to) {
    setDateValue(elements.fromDate, from);
    setDateValue(elements.toDate, to);
    scheduleView = 'list';
    navigateToSection('#sec-schedule');
    loadAppointments();
  }

  function renderOverview() {
    elements.overviewGreeting.textContent = greeting();
    // "Thứ Tư, 30/09" on the phone, with the year where there is room.
    const dateTitle = overviewDateTitle(dateInTimeZone());
    elements.overviewDateLabel.replaceChildren(dateTitle.slice(0, -5), node('span', 'd-only', dateTitle.slice(-5)));
    elements.overviewStatus.textContent = `Đã tải ${overviewAppointments.length} lịch · ${minutesToTime(currentMinuteInTimeZone())}`;
    elements.overviewStatus.className = 'status-pill';
    setCount(elements.navCountSchedule, overviewAppointments.length);
    setCount(elements.navCountBlock, overviewBlocks.length);
    renderOverviewSummary();
    renderOverviewNext();
    renderOverviewTimeline();
    renderOverviewWeek();
    renderOverviewBlocks();
    renderBlocks();
    renderBlockDays();
    renderAdminCalendar();
  }

  async function loadOverview() {
    if (!session || overviewLoading) return;
    overviewLoading = true;
    // Skeletons only before the first answer; a refresh keeps the page and swaps the new numbers in.
    if (!overviewLoadedAt) renderSummarySkeletons();
    elements.overviewStatus.textContent = 'Đang tải…';
    elements.overviewStatus.className = 'status-pill is-busy';
    const today = dateInTimeZone();
    try {
      const [appointmentData, blockData] = await Promise.all([
        adminRequest({
          action: 'admin_list',
          from: `${today}T00:00:00+07:00`,
          to: `${addDays(today, 7)}T00:00:00+07:00`,
          status: null
        }),
        adminRequest({
          action: 'admin_list_blocks',
          from: `${today}T00:00:00+07:00`,
          to: `${addDays(today, BLOCK_LOOKAHEAD_DAYS)}T00:00:00+07:00`
        })
      ]);
      overviewAppointments = Array.isArray(appointmentData.appointments) ? appointmentData.appointments : [];
      overviewBlocks = (Array.isArray(blockData.blocks) ? blockData.blocks : [])
        .sort((a, b) => new Date(a.startAt) - new Date(b.startAt));
      overviewLoadedAt = Date.now();
      renderOverview();
    } catch (error) {
      if (!overviewLoadedAt) {
        elements.summary.replaceChildren();
        elements.overviewNextChip.replaceChildren();
        elements.overviewTimeline.classList.add('is-empty');
        elements.overviewTimeline.replaceChildren(emptyState('Không tải được lịch hôm nay', 'Kiểm tra mạng rồi bấm Tải lại.'));
        elements.overviewWeekStrip.replaceChildren();
      }
      elements.overviewStatus.textContent = errorMessage(error.message);
      elements.overviewStatus.className = 'status-pill is-error';
    } finally {
      overviewLoading = false;
    }
  }

  function statusActions(item) {
    const actions = node('div', 'dd-actions');
    const add = (label, className, handler) => {
      const action = button(className, label);
      action.addEventListener('click', () => handler(action));
      actions.append(action);
    };
    if (item.status === 'confirmed') {
      add('Đánh dấu hoàn thành', 'btn-paper complete-button', (action) => completeAppointment(item, action));
    }
    if (item.status === 'completed') {
      add(STATUS_ACTIONS.confirmed, 'btn-ghost reset-status', (action) => resetCompleted(item, action));
    } else {
      Object.keys(STATUS_LABELS)
        .filter((value) => value !== 'completed' && value !== item.status)
        .forEach((value) => add(
          STATUS_ACTIONS[value],
          `btn-ghost status-${value}${value === 'cancelled' ? ' danger' : ''}`,
          (action) => updateStatus(item, value, action)
        ));
    }
    return actions;
  }

  function closeDetail() {
    detailId = '';
    elements.detailDrawer.hidden = true;
    elements.detailScrim.hidden = true;
    elements.appointmentList.querySelector('.appt-row.is-selected')?.classList.remove('is-selected');
  }

  // One appointment in full: beside the table on wide screens, over it on tablets, a bottom sheet on phones.
  function renderDetail(item) {
    const date = appointmentDate(item);
    const start = localTime(item.startAt);
    const end = localTime(item.endAt);
    const phoneHref = `tel:${String(item.customerPhone).replace(/[^0-9+]/g, '')}`;
    // Reference photos the customer attached: signed Storage links for uploads, site paths for gallery picks.
    const photos = Array.isArray(item.referencePhotos) ? item.referencePhotos.filter((photo) => photo?.url) : [];
    const services = Array.isArray(item.services) && item.services.length
      ? item.services : [{ id: '', name: item.service, price: item.price }];
    const estimate = isEstimate(services.map((service) => service.id));

    const top = node('div', 'dd-top');
    const close = button('dd-close');
    close.title = 'Đóng';
    close.setAttribute('aria-label', 'Đóng chi tiết lịch');
    close.append(icon(ICONS.close, 16));
    close.addEventListener('click', closeDetail);
    top.append(node('span', 'ref-pill', item.reference), statusBadge(item), close);

    const who = node('div', 'dd-who');
    const name = node('div');
    const phone = node('a', 'dd-phone d-only', `${item.customerPhone} · bấm gọi`);
    phone.href = phoneHref;
    name.append(
      node('h2', '', item.customerName), phone,
      node('p', 'dd-when m-only', `${shortDate(date)} · ${start}–${end} · ${item.durationMinutes}′`)
    );
    const call = node('a', 'dd-call m-only');
    call.href = phoneHref;
    call.title = `Gọi ${item.customerPhone}`;
    call.setAttribute('aria-label', `Gọi ${item.customerPhone}`);
    call.append(icon(ICONS.phone, 22));
    who.append(name, call);

    const facts = node('div', 'dd-facts d-only');
    const fact = (label, value) => {
      const group = node('div');
      group.append(node('p', 'dd-label', label), node('p', 'dd-value', value));
      return group;
    };
    facts.append(fact('Ngày & giờ', `${shortDate(date)} · ${start}–${end}`), fact('Thợ thực hiện', item.staff || 'Chưa chỉ định'));

    const lines = node('div', 'dd-lines');
    lines.append(...services.map((service) => {
      const line = node('div', 'dd-line');
      const label = node('span', '', service.name);
      const unit = service.id ? unitLabel(service.id, service.price) : '';
      if (unit) label.append(node('i', '', ` · ${unit}`));
      line.append(label, node('span', '', currency(service.price)));
      return line;
    }));
    if (item.sale) {
      const sale = node('div', 'dd-line dd-sale');
      sale.append(node('span', '', `Giảm ${item.sale.title} (−${item.sale.percent}%)`), node('span', '', `−${currency(item.sale.discount)}`));
      lines.append(sale);
    }
    const total = node('div', 'dd-total');
    const totalLabel = node('span', '', item.sale ? 'Còn lại' : estimate ? 'Tạm tính' : 'Tổng tiền');
    totalLabel.append(node('span', 'd-only', ` · ${item.durationMinutes} phút`));
    total.append(totalLabel, node('b', '', currency(due(item))));
    lines.append(total);

    elements.detailDrawer.replaceChildren(top, who, facts, lines);
    if (item.customerNote) elements.detailDrawer.append(node('p', 'sticky-note', `"${item.customerNote}"`));
    if (photos.length) {
      const group = node('div', 'dd-photos');
      const strip = node('div', 'dd-photo-strip');
      photos.forEach((photo, photoIndex) => {
        const label = photo.kind === 'gallery' ? (photo.title || 'Mẫu trong thư viện') : `Ảnh khách gửi ${photoIndex + 1}`;
        const link = node('a', 'dd-photo');
        link.href = photo.url;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.title = label;
        const picture = node('img');
        picture.src = photo.url;
        picture.alt = label;
        picture.loading = 'lazy';
        link.append(picture);
        strip.append(link);
      });
      group.append(node('p', 'dd-label d-only', `Ảnh mẫu khách gửi · ${photos.length}`), strip);
      elements.detailDrawer.append(group);
    }
    elements.detailDrawer.append(statusActions(item));
    if (item.status === 'confirmed') elements.detailDrawer.append(reschedulePanel(item));
    elements.detailDrawer.hidden = false;
    elements.detailScrim.hidden = false;
  }

  // Opens an appointment's details from anywhere; the drawer lives on the Lịch hẹn screen.
  function openDetail(item) {
    detailId = item.id;
    closeWeekPopover();
    if (activeSection() !== '#sec-schedule') navigateToSection('#sec-schedule');
    renderDetail(item);
    // Laid over the page the drawer takes the focus; beside the table it is brought into view.
    if (overlayMedia.matches) elements.detailDrawer.querySelector('.dd-close').focus();
    else elements.detailDrawer.scrollIntoView({ block: 'nearest' });
    if (appointments.some((entry) => entry.id === item.id)) {
      renderAppointments();
      return;
    }
    const date = appointmentDate(item);
    setDateValue(elements.fromDate, date);
    setDateValue(elements.toDate, date);
    loadAppointments();
  }

  // Moves a confirmed appointment to another free 30-minute slot; the server re-checks conflicts and locks.
  function reschedulePanel(item) {
    const panel = node('section', 'reschedule-panel');
    panel.setAttribute('aria-label', `Dời lịch ${item.reference}`);
    const heading = node('div', 'rs-head');
    const title = node('b', '', 'Dời lịch');
    title.append(node('span', 'd-only', ' sang giờ trống'));
    heading.append(title, node('span', 'rs-duration d-only', `${item.durationMinutes} phút`));

    const dateLabel = node('label', 'rs-date');
    const dateInput = node('input');
    dateInput.type = 'date';
    dateInput.min = dateInTimeZone();
    dateInput.max = addDays(dateInput.min, Number(bookingConfig?.advanceBookingDays || 30));
    const currentDate = appointmentDate(item);
    dateInput.value = currentDate < dateInput.min ? dateInput.min : currentDate;
    dateLabel.append(node('span', 'sr-only', 'Ngày mới'), dateInput);

    const slotGrid = node('div', 'rs-slots');
    const message = node('p', 'message reschedule-message');
    const submit = button('rs-submit d-only', 'Chọn giờ mới');
    submit.disabled = true;
    panel.append(heading, dateLabel, slotGrid, message, submit);

    let selectedStartAt = '';
    let requestId = 0;
    let availableSlots = [];

    function renderSlots(loading = false) {
      submit.disabled = loading || !selectedStartAt;
      submit.textContent = selectedStartAt
        ? `Dời sang ${localTime(selectedStartAt)} · ${shortDate(dateInput.value)}` : 'Chọn giờ mới';
      if (loading) {
        slotGrid.replaceChildren(node('p', 'slot-empty', 'Đang tải giờ trống…'));
        return;
      }
      if (!availableSlots.length) {
        slotGrid.replaceChildren(node('p', 'slot-empty', 'Ngày này không có giờ khác phù hợp.'));
        return;
      }
      slotGrid.replaceChildren(...availableSlots.map((slot) => {
        const chip = button('slot-chip', slot.label);
        const slotSale = priceUnits ? priceUnits.timeSaleFor(sales, slot.startAt) : null;
        if (slotSale) chip.append(node('i', 'slot-sale', `−${slotSale.percent}%`));
        const selected = slot.startAt === selectedStartAt;
        chip.classList.toggle('selected', selected);
        chip.setAttribute('aria-pressed', String(selected));
        chip.addEventListener('click', () => {
          selectedStartAt = slot.startAt;
          setMessage(message);
          renderSlots();
          // The phone sheet has no "Dời sang…" button: picking a slot goes straight to the confirmation.
          if (phoneMedia.matches) move();
        });
        return chip;
      }));
    }

    async function loadSlots() {
      const currentRequest = ++requestId;
      selectedStartAt = '';
      availableSlots = [];
      setMessage(message);
      renderSlots(true);
      try {
        const data = await adminRequest({
          action: 'admin_reschedule_availability',
          appointmentId: item.id,
          date: dateInput.value
        });
        if (currentRequest !== requestId || !panel.isConnected) return;
        const currentStart = new Date(item.startAt).getTime();
        const seen = new Set();
        availableSlots = (Array.isArray(data.slots) ? data.slots : []).map((slot) => {
          const startAt = slot.start_at || slot.startAt;
          return { startAt, label: localTime(startAt) };
        }).filter((slot) => slot.startAt
          && new Date(slot.startAt).getTime() !== currentStart
          && !seen.has(slot.label)
          && seen.add(slot.label));
      } catch (error) {
        if (currentRequest === requestId) setMessage(message, errorMessage(error.message));
      } finally {
        if (currentRequest === requestId && panel.isConnected) renderSlots();
      }
    }

    async function move() {
      if (!selectedStartAt) return;
      const oldTime = timeParts(item.startAt);
      const newTime = localTime(selectedStartAt);
      if (!await confirmAction(
        `Dời lịch ${item.reference}?`,
        `Dời lịch ${item.reference} từ ${oldTime.time} ${oldTime.date} sang ${newTime} ngày ${shortDate(dateInput.value)}.`,
        'Dời lịch'
      )) return;
      submit.disabled = true;
      setMessage(message, 'Đang dời lịch…');
      try {
        await adminRequest({
          action: 'admin_reschedule_appointment',
          appointmentId: item.id,
          startAt: selectedStartAt
        });
        await Promise.all([loadAppointments(), loadOverview()]);
        setMessage(elements.dashboardMessage, `Đã dời lịch ${item.reference}.`, true);
      } catch (error) {
        setMessage(message, errorMessage(error.message), false, error.message === 'slot_unavailable');
        if (error.message === 'slot_unavailable') await loadSlots();
        else submit.disabled = !selectedStartAt;
      }
    }

    dateInput.addEventListener('change', loadSlots);
    submit.addEventListener('click', move);
    loadSlots();
    return panel;
  }

  function dayTitle(dateText) {
    const label = new Intl.DateTimeFormat('vi-VN', {
      timeZone: TIME_ZONE, weekday: 'long', day: '2-digit', month: '2-digit'
    }).format(new Date(`${dateText}T12:00:00+07:00`));
    return dateText === dateInTimeZone() ? `Hôm nay · ${label}` : label;
  }

  function matchesQuery(item, query) {
    return !query || [item.customerName, item.customerPhone, item.reference]
      .some((value) => String(value || '').toLocaleLowerCase('vi-VN').includes(query));
  }

  function renderStatusChips(list) {
    const chips = [['', 'Tất cả'], ...Object.entries(STATUS_LABELS)];
    elements.statusFilter.replaceChildren(...chips.map(([value, label]) => {
      const chip = button('status-chip', `${label} `);
      chip.append(node('b', '', String(value ? list.filter((item) => item.status === value).length : list.length)));
      chip.setAttribute('aria-pressed', String(scheduleStatus === value));
      chip.addEventListener('click', () => {
        scheduleStatus = value;
        renderAppointments();
      });
      return chip;
    }));
  }

  function appointmentRow(item, index) {
    const photos = Array.isArray(item.referencePhotos) ? item.referencePhotos.filter((photo) => photo?.url).length : 0;
    const row = button(`appt-row tone-${TONES[index % TONES.length]} status-${item.status}`);
    row.classList.toggle('is-off', inactive(item));
    row.classList.toggle('is-selected', item.id === detailId);
    const time = node('span', 'ar-time');
    const clock = node('span');
    clock.append(
      node('b', '', localTime(item.startAt)),
      node('small', 'd-only', localTime(item.endAt)),
      node('small', 'm-only', `${item.durationMinutes}′`)
    );
    time.append(clock);
    const who = node('span', 'ar-who');
    who.append(node('b', 'ar-name', item.customerName), node('span', 'ar-phone', item.customerPhone));
    const service = node('span', 'ar-service', item.service);
    if (photos) service.append(node('span', 'photo-tag', `${photos} ảnh mẫu`));
    const price = node('span', 'ar-price', currency(due(item)));
    const tag = saleTag(item);
    if (tag) price.append(tag);
    if (photos) price.append(node('span', 'm-only', ` · ${photos} ảnh mẫu`));
    row.append(time, who, service, node('span', 'ar-duration', String(item.durationMinutes)), price, statusBadge(item));
    row.addEventListener('click', () => openDetail(item));
    return row;
  }

  function renderAppointmentList(visible) {
    if (!visible.length) {
      elements.appointmentList.replaceChildren(emptyState(
        appointments.length ? 'Không có lịch nào khớp bộ lọc' : 'Ngày này chưa có lịch',
        appointments.length ? 'Thử đổi trạng thái hoặc từ khóa tìm kiếm.' : 'Nhu Nhi đi ngủ được rồi. Tạo lịch khi khách gọi nhé.'
      ));
      return;
    }
    const days = new Map();
    visible.forEach((item) => {
      const date = appointmentDate(item);
      if (!days.has(date)) days.set(date, []);
      days.get(date).push(item);
    });
    const head = node('div', 't-head appt-head');
    head.append(...['Giờ', 'Khách', 'Dịch vụ', 'Phút', 'Tạm tính', 'Trạng thái'].map((label) => node('span', '', label)));
    elements.appointmentList.replaceChildren(head, ...[...days].map(([date, items]) => {
      const group = node('section', 'day-group');
      const title = node('h3', 'day-title', dayTitle(date));
      title.append(node('small', '', `${items.length} lịch`));
      group.append(title, ...items.map((item) => appointmentRow(item, appointments.indexOf(item))));
      return group;
    }));
  }

  function closeWeekPopover() {
    elements.weekGrid.querySelector('.week-pop')?.remove();
  }

  // The quick card over the week grid: enough to answer the phone, with the way into the full details.
  function openWeekPopover(item, anchor) {
    closeWeekPopover();
    const photos = Array.isArray(item.referencePhotos) ? item.referencePhotos.filter((photo) => photo?.url).length : 0;
    const estimate = isEstimate((item.services || []).map((service) => service.id));
    const pop = node('div', 'week-pop');
    pop.setAttribute('role', 'dialog');
    pop.setAttribute('aria-label', `Lịch ${item.reference}`);
    const top = node('div', 'wp-top');
    top.append(node('span', 'wp-ref', item.reference), statusBadge(item));
    pop.append(
      top,
      node('b', 'wp-title', `${item.customerName} · ${localTime(item.startAt)}–${localTime(item.endAt)}`),
      node('span', 'wp-service', `${item.service} · ${currency(due(item))}${item.sale ? ` (giảm ${item.sale.percent}%)` : ''}${estimate ? ' tạm tính' : ''}${photos ? ` · ${photos} ảnh mẫu` : ''}`)
    );
    if (item.customerNote) pop.append(node('span', 'wp-note', `Ghi chú: ${item.customerNote}`));
    const actions = node('div', 'wp-actions');
    const call = node('a', 'btn-ghost', 'Gọi');
    call.href = `tel:${String(item.customerPhone).replace(/[^0-9+]/g, '')}`;
    const details = button('btn-ghost', 'Chi tiết');
    details.addEventListener('click', () => openDetail(item));
    actions.append(call, details);
    pop.append(actions);
    const grid = elements.weekGrid.getBoundingClientRect();
    const box = anchor.getBoundingClientRect();
    pop.style.setProperty('--x', `${Math.max(8, Math.min(box.left - grid.left + 40, grid.width - 343))}px`);
    pop.style.setProperty('--y', `${box.top - grid.top + Math.min(53, box.height + 6)}px`);
    elements.weekGrid.append(pop);
  }

  // Seven days from the range's first day, 32px per half hour; nothing here needs another request.
  function renderWeek() {
    const today = dateInTimeZone();
    const days = Array.from({ length: 7 }, (_, index) => addDays(elements.fromDate.value, index));
    const closed = closedDates(scheduleBlocks);
    const next = nextOverviewAppointment();
    const inWeek = appointments.filter((item) => days.includes(appointmentDate(item)));
    elements.scheduleTitleText.textContent = `${dayMonth(days[0])} – ${dayMonth(days[6])} · ${inWeek.length} lịch`;
    const place = (element, start, end, minimum) => {
      const from = Math.min(Math.max(start, DAY_START), DAY_END - 30);
      element.style.setProperty('--top', `${(from - DAY_START) / 30 * 32}px`);
      element.style.setProperty('--h', `${Math.max(minimum, (Math.min(end, DAY_END) - from) / 30 * 32 - 3)}px`);
    };
    const heads = days.map((date) => {
      const count = inWeek.filter((item) => appointmentDate(item) === date).length;
      const head = node('div', 'wk-head');
      head.classList.toggle('is-today', date === today);
      head.append(
        node('p', 'wk-dow', new Intl.DateTimeFormat('vi-VN', { timeZone: TIME_ZONE, weekday: 'long' }).format(new Date(`${date}T12:00:00+07:00`))),
        node('p', 'wk-date', dayMonth(date)),
        node('p', 'wk-count', closed.has(date) && !count ? 'tiệm nghỉ' : `${count} lịch`)
      );
      return head;
    });
    const hours = node('div', 'wk-hours');
    hours.append(...Array.from({ length: (DAY_END - DAY_START) / 60 + 1 }, (_, index) => {
      const label = node('span', '', minutesToTime(DAY_START + index * 60));
      label.style.setProperty('--top', `${index * 64}px`);
      return label;
    }));
    const columns = days.map((date) => {
      const column = node('div', 'wk-col');
      column.classList.toggle('is-today', date === today);
      const dayStart = new Date(`${date}T00:00:00+07:00`);
      const dayEnd = new Date(`${addDays(date, 1)}T00:00:00+07:00`);
      scheduleBlocks.filter((block) => new Date(block.startAt) < dayEnd && new Date(block.endAt) > dayStart).forEach((block) => {
        const { start, end } = blockMinutes(block, date);
        const locked = node('div', 'wk-block', `Đã khóa · ${blockReason(block)}`);
        place(locked, start, end, 26);
        column.append(locked);
      });
      inWeek.filter((item) => appointmentDate(item) === date).forEach((item) => {
        const note = button(`wk-item tone-${TONES[appointments.indexOf(item) % TONES.length]}`);
        const start = minuteOfDay(item.startAt);
        place(note, start, start + Number(item.durationMinutes || 30), 38);
        note.classList.toggle('is-off', inactive(item));
        note.classList.toggle('is-next', next?.id === item.id);
        note.setAttribute('aria-label', `${localTime(item.startAt)} ${item.customerName}, ${STATUS_LABELS[item.status] || item.status}`);
        // The given name is the last word of a Vietnamese name; that is what fits a narrow column.
        note.append(node('b', '', localTime(item.startAt)), node('span', '', String(item.customerName).trim().split(/\s+/).pop()));
        note.addEventListener('click', () => openWeekPopover(item, note));
        column.append(note);
      });
      const minute = currentMinuteInTimeZone();
      if (date === today && minute >= DAY_START && minute <= DAY_END) {
        const now = node('div', 'wk-now');
        now.style.setProperty('--top', `${(minute - DAY_START) / 30 * 32}px`);
        column.append(now);
      }
      return column;
    });
    elements.weekGrid.replaceChildren(node('span'), ...heads, hours, ...columns);
  }

  function renderAppointments() {
    const week = scheduleView === 'week' && !phoneMedia.matches;
    const query = elements.scheduleSearch.value.trim().toLocaleLowerCase('vi-VN');
    const searched = appointments.filter((item) => matchesQuery(item, query));
    viewButtons.forEach((item) => item.setAttribute('aria-pressed', String((item.dataset.view === 'week') === week)));
    elements.appointmentList.hidden = week;
    elements.weekGrid.hidden = !week;
    elements.weekNav.hidden = !week;
    elements.scheduleFilters.hidden = week;
    elements.rangeLabel.textContent = `${dayMonth(elements.fromDate.value)} → ${dayMonth(elements.toDate.value)}`;
    renderStatusChips(searched);
    if (week) {
      renderWeek();
    } else {
      elements.scheduleTitleText.textContent = 'Quản lý lịch hẹn';
      renderAppointmentList(searched.filter((item) => !scheduleStatus || item.status === scheduleStatus));
    }
    renderCustomers();
  }

  function setScheduleView(view) {
    scheduleView = view;
    const weekEnd = addDays(elements.fromDate.value, 6);
    if (view === 'week' && elements.toDate.value !== weekEnd) {
      setDateValue(elements.toDate, weekEnd);
      loadAppointments();
      return;
    }
    renderAppointments();
  }

  function showWeekFrom(date) {
    setDateValue(elements.fromDate, date);
    setDateValue(elements.toDate, addDays(date, 6));
    loadAppointments();
  }

  function currentRange() {
    const today = dateInTimeZone();
    if (elements.fromDate.value === today && elements.toDate.value === today) return 'today';
    if (elements.fromDate.value === today && elements.toDate.value === addDays(today, 6)) return 'week';
    return 'custom';
  }

  function syncRangeChips(range = currentRange()) {
    rangeChips.forEach((chip) => chip.setAttribute('aria-pressed', String(chip.dataset.range === range)));
    elements.filterDates.hidden = range !== 'custom';
  }

  async function loadAppointments() {
    syncRangeChips();
    const from = elements.fromDate.value;
    const through = elements.toDate.value;
    if (!from || !through || through < from) {
      setMessage(elements.dashboardMessage, 'Vui lòng chọn khoảng ngày hợp lệ.');
      return;
    }
    elements.refreshButton.disabled = true;
    elements.refreshButton.textContent = 'Đang tải…';
    elements.appointmentList.setAttribute('aria-busy', 'true');
    closeWeekPopover();
    // Skeletons only when there is nothing to show yet; otherwise the list dims until the answer arrives.
    if (!appointments.length) renderAppointmentSkeletons();
    const range = { from: `${from}T00:00:00+07:00`, to: `${addDays(through, 1)}T00:00:00+07:00` };
    try {
      // Every status comes down once; the status chips, the search and the week view only redraw it.
      const [data, blockData] = await Promise.all([
        adminRequest({ action: 'admin_list', ...range, status: null }),
        adminRequest({ action: 'admin_list_blocks', ...range })
      ]);
      appointments = (Array.isArray(data.appointments) ? data.appointments : [])
        .sort((a, b) => new Date(a.startAt) - new Date(b.startAt));
      scheduleBlocks = Array.isArray(blockData.blocks) ? blockData.blocks : [];
      renderAppointments();
      const open = appointments.find((item) => item.id === detailId);
      if (open) renderDetail(open);
      else closeDetail();
    } catch (error) {
      if (error.status === 401 || error.message === 'admin_access_denied') {
        storeSession(null);
        showLogin(errorMessage(error.message));
        return;
      }
      elements.appointmentList.replaceChildren(emptyState('Không tải được lịch', 'Kiểm tra mạng rồi bấm Tải lại.'));
      setMessage(elements.dashboardMessage, errorMessage(error.message));
    } finally {
      elements.refreshButton.disabled = false;
      elements.refreshButton.textContent = 'Xem lịch';
      elements.appointmentList.removeAttribute('aria-busy');
    }
  }

  async function updateStatus(item, status, button) {
    if (status === item.status) {
      setMessage(elements.dashboardMessage, 'Trạng thái chưa thay đổi.');
      return;
    }
    if (status === 'cancelled' && !await confirmAction(
      `Hủy lịch ${item.reference}?`, 'Khung giờ này sẽ được mở lại cho khách khác.', 'Hủy lịch'
    )) return;
    button.disabled = true;
    setMessage(elements.dashboardMessage, `Đang cập nhật ${item.reference}…`);
    try {
      await adminRequest({
        action: 'admin_update_status',
        appointmentId: item.id,
        status
      });
      setMessage(elements.dashboardMessage, `Đã cập nhật ${item.reference}.`, true);
      await Promise.all([loadAppointments(), loadOverview()]);
    } catch (error) {
      setMessage(elements.dashboardMessage, errorMessage(error.message));
      button.disabled = false;
    }
  }

  async function completeAppointment(item, button) {
    if (!await confirmAction(`Xác nhận lịch ${item.reference} đã hoàn thành?`, `${item.customerName} · ${item.service}`, 'Hoàn thành')) return;
    await applyDirectStatus(item, 'completed', button, `Đã hoàn thành ${item.reference}.`);
  }

  async function resetCompleted(item, button) {
    if (!await confirmAction(`Reset lịch ${item.reference} về trạng thái Đã xác nhận?`, '', 'Khôi phục')) return;
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
      await Promise.all([loadAppointments(), loadOverview()]);
    } catch (error) {
      setMessage(elements.dashboardMessage, errorMessage(error.message));
      button.disabled = false;
    }
  }

  // Customers are the loaded appointments grouped by phone number: read-only, there is no customer API.
  function customerGroups() {
    const groups = new Map();
    appointments.forEach((item) => {
      const key = String(item.customerPhone || '').replace(/\D/g, '') || `name:${item.customerName}`;
      if (!groups.has(key)) groups.set(key, { key, tone: TONES[groups.size % TONES.length], items: [] });
      groups.get(key).items.push(item);
    });
    return [...groups.values()].map((group) => {
      const latest = group.items[group.items.length - 1];
      return {
        ...group, latest, name: latest.customerName, phone: latest.customerPhone,
        total: group.items.reduce((sum, item) => sum + due(item), 0)
      };
    });
  }

  function closeCustomer() {
    customerKey = '';
    elements.customerDetail.hidden = true;
    elements.customerScrim.hidden = true;
    elements.customerList.querySelector('.cust-row.is-selected')?.classList.remove('is-selected');
  }

  function renderCustomerDetail(customer) {
    const phone = node('a', '', `${customer.phone} · Gọi`);
    phone.href = `tel:${String(customer.phone).replace(/[^0-9+]/g, '')}`;
    const who = node('div', 'cd-who');
    who.append(node('h2', '', customer.name), phone);
    const stats = node('div', 'cd-stats');
    const stat = (value, label) => {
      const box = node('div');
      box.append(node('b', '', value), node('span', '', label));
      return box;
    };
    stats.append(stat(String(customer.items.length), 'lịch đã đặt'), stat(currency(customer.total), 'tạm tính'));
    const close = button('dd-close cd-close');
    close.setAttribute('aria-label', 'Đóng thông tin khách');
    close.append(icon(ICONS.close, 16));
    close.addEventListener('click', closeCustomer);
    elements.customerDetail.replaceChildren(
      image('cd-cat', 'mascot/nhu-nhi-heart-soft-v2.webp', 512, 512), close,
      node('span', `cd-avatar tone-${customer.tone}`, String(customer.name).trim().split(/\s+/).pop()[0]?.toUpperCase() || '?'),
      who, stats
    );
    const noted = [...customer.items].reverse().find((item) => item.customerNote);
    if (noted) {
      elements.customerDetail.append(node('p', 'cd-label', 'Ghi chú gần nhất'), node('p', 'sticky-note', `"${noted.customerNote}"`));
    }
    elements.customerDetail.append(node('p', 'cd-label', 'Lịch sử'), ...[...customer.items].reverse().map((item) => {
      const row = node('div', 'cd-history');
      row.append(
        node('b', '', `${shortDate(appointmentDate(item))} · ${localTime(item.startAt)} · ${item.durationMinutes} phút`),
        node('span', '', `${item.service} · ${STATUS_LABELS[item.status] || item.status}`)
      );
      return row;
    }));
    const create = button('btn-ghost cd-create', 'Tạo lịch mới cho khách này');
    create.addEventListener('click', () => {
      elements.adminCustomerName.value = customer.name;
      elements.adminCustomerPhone.value = String(customer.phone || '').replace(/\D/g, '').slice(0, 10);
      setCreateStep(1);
      navigateToSection('#sec-create');
    });
    elements.customerDetail.append(create);
    elements.customerDetail.hidden = false;
    elements.customerScrim.hidden = false;
  }

  function renderCustomers() {
    const all = customerGroups();
    const query = elements.customerSearch.value.trim().toLocaleLowerCase('vi-VN');
    const visible = all.filter((customer) => !query
      || [customer.name, customer.phone].some((value) => String(value || '').toLocaleLowerCase('vi-VN').includes(query)));
    elements.customersCount.textContent = `${all.length} khách hàng`;
    elements.customersRange.textContent = `Khách hàng · ${dayMonth(elements.fromDate.value)} → ${dayMonth(elements.toDate.value)}`;
    setCount(elements.navCountCustomers, all.length);
    if (!visible.length) {
      closeCustomer();
      elements.customerList.replaceChildren(emptyState(
        all.length ? 'Không tìm thấy khách phù hợp' : 'Chưa có khách trong khoảng ngày này',
        all.length ? 'Thử tên hoặc số điện thoại khác.' : 'Đổi khoảng ngày ở Lịch hẹn để xem khách của những ngày khác.'
      ));
      return;
    }
    const head = node('div', 't-head cust-head');
    head.append(...['Khách', 'SĐT', 'Lịch', 'Lịch gần nhất', 'Trạng thái', 'Tạm tính'].map((label) => node('span', '', label)));
    elements.customerList.replaceChildren(head, ...visible.map((customer) => {
      const latest = `${shortDate(appointmentDate(customer.latest))} · ${localTime(customer.latest.startAt)}`;
      const row = node('div', `cust-row tone-${customer.tone}`);
      row.classList.toggle('is-selected', customer.key === customerKey);
      const initial = node('i', 'cust-initial', String(customer.name).trim().split(/\s+/).pop()[0]?.toUpperCase() || '?');
      initial.setAttribute('aria-hidden', 'true');
      const name = button('cust-name', customer.name);
      const phone = node('a', 'cust-phone', customer.phone);
      phone.href = `tel:${String(customer.phone).replace(/[^0-9+]/g, '')}`;
      row.append(
        initial, name, phone,
        node('span', 'cust-visits', String(customer.items.length)),
        node('span', 'cust-latest', latest),
        statusBadge(customer.latest),
        node('span', 'cust-total', currency(customer.total)),
        node('span', 'cust-sub m-only', `${customer.phone} · ${latest}`)
      );
      row.addEventListener('click', (event) => {
        if (event.target.closest('a')) return;
        customerKey = customer.key;
        renderCustomers();
      });
      return row;
    }));
    const selected = visible.find((customer) => customer.key === customerKey);
    if (selected) renderCustomerDetail(selected);
    else closeCustomer();
  }

  function createSlotButtons() {
    const buttons = [];
    const selectedDate = elements.blockDate.value;
    const today = dateInTimeZone();
    let firstMinute = 9 * 60;
    if (selectedDate < today) firstMinute = 18 * 60;
    if (selectedDate === today) {
      firstMinute = Math.max(9 * 60, Math.floor(currentMinuteInTimeZone() / 30) * 30 + 30);
    }
    for (let minutes = firstMinute; minutes <= 17 * 60 + 30; minutes += 30) {
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
    if (!buttons.length) buttons.push(node('p', 'slot-empty', 'Ngày này không còn khung giờ nào để khóa.'));
    elements.blockSlotGrid.replaceChildren(...buttons);
  }

  function blockSlotIsBooked(minutes) {
    const date = elements.blockDate.value;
    const start = new Date(`${date}T${minutesToTime(minutes)}:00+07:00`).getTime();
    const end = start + 30 * 60 * 1000;
    return blockDayAppointments.some((appointment) =>
      appointment.status === 'confirmed'
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

  // "12:00 – 13:00" for a run of chosen slots, several runs joined by commas.
  function selectedRangeText() {
    return selectedRanges().map((range) => `${localTime(range.startAt)} – ${localTime(range.endAt)}`).join(', ');
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
    elements.allDayButton.disabled = blockDayLoading || (!blockWholeDay && selectable.length === 0);
    const count = selectedBlockSlots.size;
    const day = elements.blockDate.value ? shortDate(elements.blockDate.value) : '';
    if (blockWholeDay) {
      elements.blockSelection.replaceChildren(node('b', '', 'Đã chọn khóa cả ngày'), node('span', 'm-only', day));
    } else if (count) {
      const title = node('b');
      title.append(...responsiveText(`Đã chọn ${count} khung · ${selectedRangeText()}`, `${count} khung đã chọn`));
      elements.blockSelection.replaceChildren(title, node('span', 'm-only', `${day} · ${selectedRangeText()}`));
    } else {
      elements.blockSelection.replaceChildren(node('b', '', 'Chưa chọn khung giờ.'));
    }
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

  // The phone picks the day from a dropdown of the next two weeks instead of the date field.
  function renderBlockDays() {
    const today = dateInTimeZone();
    const closed = closedDates();
    const chosen = elements.blockDate.value;
    const dates = Array.from({ length: 14 }, (_, index) => addDays(today, index));
    if (chosen && !dates.includes(chosen)) dates.push(chosen);
    elements.blockDaySelect.replaceChildren(...dates.map((date) => {
      const option = node('option', '', `${date === today ? 'Hôm nay · ' : ''}${shortDate(date)}${closed.has(date) ? ' · đã khóa cả ngày' : ''}`);
      option.value = date;
      option.selected = date === chosen;
      return option;
    }));
  }

  // Every lock still ahead, plus the chosen day's own (it may lie beyond the look-ahead window).
  function renderBlocks() {
    const known = new Map([...overviewBlocks, ...blocks].map((block) => [block.id, block]));
    const list = [...known.values()].sort((a, b) => new Date(a.startAt) - new Date(b.startAt));
    if (!list.length) {
      elements.blockList.replaceChildren(node('p', 'block-empty', 'Chưa có khoảng khóa nào.'));
      return;
    }
    elements.blockList.replaceChildren(...list.map((block) => {
      const row = node('div', 'block-row');
      const details = node('div');
      details.append(node('strong', '', blockWhen(block)), node('span', '', blockReason(block)));
      const remove = button('btn-ghost unlock-button', 'Mở khóa');
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
    renderBlockDays();
    elements.blockList.setAttribute('aria-busy', 'true');
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
      renderBlocks();
      setMessage(elements.blockMessage, errorMessage(error.message));
    } finally {
      blockDayLoading = false;
      elements.blockList.removeAttribute('aria-busy');
      createSlotButtons();
      updateBlockSelection();
    }
  }

  async function createBlocks() {
    const ranges = selectedRanges();
    if (!ranges.length) return;
    const day = shortDate(elements.blockDate.value);
    const reason = elements.blockReason.value.trim() || 'tiệm nghỉ';
    if (!await confirmAction(
      blockWholeDay ? `Khóa cả ngày ${day}?` : `Khóa ${selectedBlockSlots.size} khung giờ ngày ${day}?`,
      `${blockWholeDay ? 'Cả ngày' : selectedRangeText()} · khách sẽ thấy "${reason}". Lịch đã đặt không bị ảnh hưởng.`,
      'Khóa lịch'
    )) return;
    elements.createBlockButton.disabled = true;
    setMessage(elements.blockMessage, 'Đang khóa lịch…');
    try {
      await adminRequest({
        action: 'admin_create_blocks',
        ranges,
        reason
      });
      selectedBlockSlots.clear();
      blockWholeDay = false;
      elements.blockReason.value = '';
      updateBlockSelection();
      await Promise.all([loadBlocks(), loadOverview()]);
      setMessage(elements.blockMessage, 'Đã khóa lịch. Website sẽ loại các giờ bị ảnh hưởng.', true);
    } catch (error) {
      setMessage(elements.blockMessage, errorMessage(error.message));
      updateBlockSelection();
    }
  }

  async function deleteBlock(block, button) {
    if (!await confirmAction(
      'Mở khóa khoảng thời gian này?', `${blockWhen(block)} · khách có thể đặt lại khung giờ này.`, 'Mở khóa'
    )) return;
    button.disabled = true;
    try {
      await adminRequest({ action: 'admin_delete_block', blockId: block.id });
      await Promise.all([loadBlocks(), loadOverview()]);
      setMessage(elements.blockMessage, 'Đã mở khóa lịch.', true);
    } catch (error) {
      setMessage(elements.blockMessage, errorMessage(error.message));
      button.disabled = false;
    }
  }

  // One field for the code (so the phone can autofill it), drawn as six boxes.
  function renderMfaBoxes() {
    const code = elements.mfaCode.value.replace(/\D/g, '').slice(0, 6);
    if (code !== elements.mfaCode.value) elements.mfaCode.value = code;
    [...elements.mfaBoxes.children].forEach((box, index) => {
      box.textContent = code[index] || '';
      box.classList.toggle('is-active', index === Math.min(code.length, 5));
    });
  }

  // Step 2 of sign-in: enrol TOTP on first sign-in (QR code), otherwise ask for the 6-digit code.
  async function startMfa(data) {
    pendingMfa = { token: data.pending?.accessToken || '', factorId: data.factorId || '' };
    if (data.mfa === 'enroll') {
      const factor = await rawRequest({ action: 'admin_mfa_enroll' }, pendingMfa.token);
      pendingMfa.factorId = factor.factorId;
      elements.mfaQr.src = factor.qrCode;
      elements.mfaSecret.textContent = factor.secret;
      elements.mfaUri.href = factor.uri;
    }
    setLoginStage(data.mfa === 'enroll' ? 'enroll' : 'code');
    elements.mfaCode.value = '';
    renderMfaBoxes();
    setMessage(elements.loginMessage);
    elements.mfaCode.focus();
  }

  elements.mfaForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!pendingMfa) return showLogin();
    elements.mfaButton.disabled = true;
    setMessage(elements.loginMessage, 'Đang xác nhận…');
    try {
      const data = await rawRequest({
        action: 'admin_mfa_verify',
        factorId: pendingMfa.factorId,
        code: elements.mfaCode.value
      }, pendingMfa.token);
      const remember = elements.mfaRemember.checked;
      pendingMfa = null;
      storeSession({ ...data.session, rememberUntil: remember ? Date.now() + REMEMBER_MS : 0 });
      showDashboard();
      await Promise.all([loadOverview(), loadAppointments(), loadBlocks(), loadAdminBookingConfig()]);
    } catch (error) {
      if (error.message === 'mfa_expired' || error.status === 401) {
        showLogin(errorMessage('mfa_expired'));
        return;
      }
      setMessage(elements.loginMessage, errorMessage(error.message));
      elements.mfaCode.select();
    } finally {
      elements.mfaButton.disabled = false;
    }
  });
  elements.mfaCode.addEventListener('input', renderMfaBoxes);
  elements.mfaCancel.addEventListener('click', () => showLogin());

  elements.loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    elements.loginButton.disabled = true;
    elements.loginButton.textContent = 'Đang đăng nhập…';
    setMessage(elements.loginMessage, 'Đang đăng nhập…');
    try {
      const form = new FormData(elements.loginForm);
      // Supabase Auth CAPTCHA protection needs a fresh Turnstile token for every sign-in.
      const captchaToken = window.mewTurnstileBooking ? await window.mewTurnstileBooking.getToken() : '';
      const data = await rawRequest({
        action: 'admin_login',
        email: String(form.get('email') || '').trim(),
        password: String(form.get('password') || ''),
        captchaToken
      });
      await startMfa(data);
    } catch (error) {
      storeSession(null);
      setMessage(elements.loginMessage, errorMessage(error.message));
    } finally {
      elements.loginButton.disabled = false;
      elements.loginButton.textContent = 'Đăng nhập';
    }
  });

  elements.refreshButton.addEventListener('click', loadAppointments);
  rangeChips.forEach((chip) => chip.addEventListener('click', () => {
    if (chip.dataset.range === 'custom') {
      syncRangeChips('custom');
      return;
    }
    const today = dateInTimeZone();
    setDateValue(elements.fromDate, today);
    setDateValue(elements.toDate, chip.dataset.range === 'today' ? today : addDays(today, 6));
    loadAppointments();
  }));
  viewButtons.forEach((item) => item.addEventListener('click', () => setScheduleView(item.dataset.view)));
  elements.weekPrev.addEventListener('click', () => showWeekFrom(addDays(elements.fromDate.value, -7)));
  elements.weekNext.addEventListener('click', () => showWeekFrom(addDays(elements.fromDate.value, 7)));
  elements.weekToday.addEventListener('click', () => showWeekFrom(dateInTimeZone()));
  elements.scheduleSearch.addEventListener('input', renderAppointments);
  elements.scheduleSearchToggle.addEventListener('click', () => {
    const open = elements.scheduleFilters.classList.toggle('search-open');
    elements.scheduleSearchToggle.setAttribute('aria-expanded', String(open));
    if (open) elements.scheduleSearch.focus();
  });
  elements.scheduleReload.addEventListener('click', loadAppointments);
  elements.overviewReload.addEventListener('click', () => Promise.all([loadOverview(), loadAppointments()]));
  // Enter in the search on Tổng quan opens the list with the same words filled in.
  elements.overviewSearch.addEventListener('keydown', (event) => {
    const query = elements.overviewSearch.value.trim();
    if (event.key !== 'Enter' || !query) return;
    elements.scheduleSearch.value = query;
    elements.overviewSearch.value = '';
    scheduleView = 'list';
    navigateToSection('#sec-schedule');
    renderAppointments();
  });
  elements.detailScrim.addEventListener('click', closeDetail);
  elements.customerSearch.addEventListener('input', renderCustomers);
  elements.customerScrim.addEventListener('click', closeCustomer);
  elements.discountSearch?.addEventListener('input', renderDiscountServices);
  elements.discountApply.addEventListener('click', () => savePricing([...discountDrafts.keys()]));
  elements.saleNew.addEventListener('click', () => openSaleForm());
  elements.saleForm.addEventListener('submit', submitSaleForm);
  elements.saleCancel.addEventListener('click', () => elements.saleDialog.close());
  [elements.salePercent, elements.saleAllDay, elements.saleStartDate, elements.saleStartTime, elements.saleEndDate, elements.saleEndTime]
    .forEach((input) => {
      input.addEventListener('input', renderSaleForm);
      input.addEventListener('change', renderSaleForm);
    });
  elements.discountDiscard.addEventListener('click', () => {
    discountDrafts.clear();
    renderDiscountServices();
  });
  // Closing or reloading the tab would drop edited prices without a word.
  window.addEventListener('beforeunload', (event) => {
    if (discountDrafts.size) event.preventDefault();
  });
  elements.discountScrim.addEventListener('click', () => closeDiscountSheet(true));
  elements.menuButton.addEventListener('click', () => setMenuOpen(true));
  elements.sideScrim.addEventListener('click', () => setMenuOpen(false));
  elements.menuClose.addEventListener('click', () => setMenuOpen(false));
  document.addEventListener('click', (event) => {
    if (!event.target.closest('.week-pop, .wk-item')) closeWeekPopover();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape' || elements.confirmDialog.open) return;
    closeWeekPopover();
    setMenuOpen(false);
    if (!elements.discountSheet.hidden) closeDiscountSheet(true);
    // Beside the table the drawer is part of the page; only the overlay and the sheet close on Escape.
    if (overlayMedia.matches) {
      closeDetail();
      closeCustomer();
    }
  });
  phoneMedia.addEventListener('change', renderAppointments);
  stepButtons.forEach((item) => item.addEventListener('click', () => {
    const step = Number(item.dataset.stepGo);
    if (step > 1 && !adminSelectedServiceIds.size) return;
    if (step > 2 && !adminSelectedStartAt) return;
    setCreateStep(step);
  }));
  elements.createBarNext.addEventListener('click', () => {
    setCreateStep(createStep + 1);
    window.scrollTo({ top: 0, behavior: 'auto' });
  });
  elements.createBack.addEventListener('click', () => {
    setCreateStep(createStep - 1);
    window.scrollTo({ top: 0, behavior: 'auto' });
  });
  elements.createReset.addEventListener('click', () => {
    resetAdminCreate();
    setMessage(elements.adminBookingMessage);
  });
  elements.adminCustomerPhone.addEventListener('input', () => {
    elements.adminCustomerPhone.value = elements.adminCustomerPhone.value.replace(/\D/g, '').slice(0, 10);
  });
  elements.adminBookingForm.addEventListener('submit', createAdminAppointment);
  elements.blockDate.addEventListener('change', () => {
    selectedBlockSlots.clear();
    blockDayAppointments = [];
    blockWholeDay = false;
    updateBlockSelection();
    loadBlocks();
  });
  elements.allDayButton.addEventListener('click', () => {
    blockWholeDay = !blockWholeDay;
    if (blockWholeDay) selectedBlockSlots.clear();
    updateBlockSelection();
  });
  elements.createBlockButton.addEventListener('click', createBlocks);
  elements.blockDaySelect.addEventListener('change', () => {
    setDateValue(elements.blockDate, elements.blockDaySelect.value);
    elements.blockDate.dispatchEvent(new Event('change', { bubbles: true }));
  });
  elements.logoutButton.addEventListener('click', async () => {
    const token = session?.accessToken || '';
    storeSession(null);
    if (token) await rawRequest({ action: 'admin_logout' }, token).catch(() => {});
    showLogin('Bạn đã đăng xuất.');
  });

  const today = dateInTimeZone();
  setDateValue(elements.fromDate, today);
  setDateValue(elements.toDate, addDays(today, 6));
  setDateValue(elements.adminBookingDate, today);
  setDateValue(elements.blockDate, today);
  initializeSectionNavigation();
  setCreateStep(1);
  renderMfaBoxes();
  renderAdminServices();
  renderDiscountServices();
  renderAdminCalendar();
  renderAdminSlots();
  renderBlockDays();
  createSlotButtons();
  updateBlockSelection();

  if (session) {
    showDashboard();
    Promise.all([loadOverview(), loadAppointments(), loadBlocks(), loadAdminBookingConfig()]);
  } else {
    showLogin();
  }
})();
