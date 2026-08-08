/* ============================================================================
   1M65 Nails · Studio Admin — lịch chọn ngày mang thương hiệu (tuỳ chọn)
   ----------------------------------------------------------------------------
   Đây là progressive enhancement THUẦN: không sửa admin.js, không đổi API.
   Nó bọc mỗi <input type="date"> lại, ẩn ô native đi, dựng một nút + popover
   lịch theo đúng ngôn ngữ thị giác 1M65, rồi ghi giá trị trở lại input và
   dispatch sự kiện 'change' — đúng sự kiện mà admin.js đang lắng nghe.

   Xoá file này (và thẻ <script> của nó trong admin.html) là quay lại native
   date picker, mọi thứ vẫn chạy bình thường.
   ========================================================================== */
(() => {
  'use strict';

  const TIME_ZONE = 'Asia/Ho_Chi_Minh';
  const DOW = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  const GRID_DOW = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
  let openPicker = null;

  /* Wordmark: chỉ lồng số 1 vào chữ M khi font Great Vibes thật đã nạp.
     Với font fallback, nét chữ khác nên margin âm sẽ ăn mất số 1. */
  function markScriptFont() {
    try {
      if (document.fonts && document.fonts.check("16px 'Great Vibes'")) {
        document.documentElement.classList.add('has-script');
      }
    } catch (error) { /* không có Font Loading API thì bỏ qua, wordmark vẫn đọc được */ }
  }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(markScriptFont);
  else markScriptFont();

  function todayIso() {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit'
    }).format(new Date());
  }

  function label(iso) {
    if (!iso) return 'Chọn ngày';
    const parts = iso.split('-');
    if (parts.length !== 3) return iso;
    const date = new Date(iso + 'T00:00:00Z');
    if (Number.isNaN(date.getTime())) return iso;
    return DOW[date.getUTCDay()] + ', ' + parts[2] + '/' + parts[1] + '/' + parts[0];
  }

  function node(tag, className, text) {
    const item = document.createElement(tag);
    if (className) item.className = className;
    if (text !== undefined) item.textContent = text;
    return item;
  }

  function monthTitle(month) {
    return 'Tháng ' + Number(month.slice(5, 7)) + ', ' + month.slice(0, 4);
  }

  function shift(month, step) {
    const year = Number(month.slice(0, 4));
    const index = Number(month.slice(5, 7)) - 1 + step;
    const date = new Date(Date.UTC(year, index, 1));
    return date.getUTCFullYear() + '-' + String(date.getUTCMonth() + 1).padStart(2, '0');
  }

  function closeOpen() {
    if (!openPicker) return;
    openPicker.pop.remove();
    openPicker.scrim.remove();
    openPicker.trigger.setAttribute('aria-expanded', 'false');
    openPicker = null;
  }

  function enhance(input) {
    if (!input || input.dataset.dpReady === '1') return;
    if (input.type !== 'date') return;
    input.dataset.dpReady = '1';

    const wrap = node('div', 'dp-wrap');
    input.parentNode.insertBefore(wrap, input);
    wrap.appendChild(input);
    input.classList.add('dp-native');
    input.setAttribute('tabindex', '-1');
    input.setAttribute('aria-hidden', 'true');

    const trigger = node('button', 'dp-trigger');
    trigger.type = 'button';
    trigger.setAttribute('aria-haspopup', 'dialog');
    trigger.setAttribute('aria-expanded', 'false');
    const text = node('span', 'dp-text', label(input.value));
    trigger.append(text, node('span', 'caret', '▾'));

    const fieldName = (input.closest('label') || {}).textContent;
    trigger.setAttribute('aria-label', (fieldName ? fieldName.trim() + ' · ' : '') + 'chọn ngày');
    wrap.appendChild(trigger);

    function sync() {
      text.textContent = label(input.value);
    }

    function commit(iso) {
      input.value = iso;
      sync();
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
      closeOpen();
      trigger.focus();
    }

    function render(pop, month) {
      pop.replaceChildren();

      const head = node('div', 'dp-head');
      const title = node('span', 'dp-title', monthTitle(month));
      const prev = node('button', 'dp-nav', '‹');
      const next = node('button', 'dp-nav', '›');
      prev.type = 'button'; next.type = 'button';
      prev.setAttribute('aria-label', 'Tháng trước');
      next.setAttribute('aria-label', 'Tháng sau');
      prev.addEventListener('click', () => render(pop, shift(month, -1)));
      next.addEventListener('click', () => render(pop, shift(month, 1)));
      head.append(title, prev, next);

      const dows = node('div', 'dp-dows');
      GRID_DOW.forEach((day) => dows.append(node('span', '', day)));

      const grid = node('div', 'dp-grid');
      const year = Number(month.slice(0, 4));
      const index = Number(month.slice(5, 7)) - 1;
      const lead = (new Date(Date.UTC(year, index, 1)).getUTCDay() + 6) % 7;
      const start = Date.UTC(year, index, 1 - lead);
      const min = input.min || '';
      const max = input.max || '';
      const today = todayIso();

      for (let i = 0; i < 42; i++) {
        const date = new Date(start + i * 86400000);
        const iso = date.toISOString().slice(0, 10);
        const cell = node('button', 'dp-day', String(date.getUTCDate()));
        cell.type = 'button';
        if (date.getUTCMonth() !== index) cell.classList.add('is-out');
        if (iso === today) cell.classList.add('is-today');
        if (iso === input.value) cell.classList.add('is-on');
        if ((min && iso < min) || (max && iso > max)) cell.disabled = true;
        cell.setAttribute('aria-label', label(iso) + (iso === today ? ' · hôm nay' : ''));
        cell.addEventListener('click', () => commit(iso));
        grid.append(cell);
      }

      const foot = node('div', 'dp-foot');
      const goToday = node('button', 'dp-today', 'Hôm nay');
      const done = node('button', 'dp-done', 'Xong');
      goToday.type = 'button'; done.type = 'button';
      goToday.addEventListener('click', () => {
        if ((min && today < min) || (max && today > max)) return;
        commit(today);
      });
      done.addEventListener('click', closeOpen);
      foot.append(goToday, node('span', 'rule-slot'), done);

      pop.append(head, dows, grid, foot);
    }

    trigger.addEventListener('click', () => {
      if (openPicker && openPicker.trigger === trigger) { closeOpen(); return; }
      closeOpen();

      const scrim = node('button', 'dp-scrim');
      scrim.type = 'button';
      scrim.setAttribute('aria-label', 'Đóng lịch');
      scrim.addEventListener('click', closeOpen);

      const pop = node('div', 'dp-pop');
      pop.setAttribute('role', 'dialog');
      pop.setAttribute('aria-label', 'Chọn ngày');

      wrap.append(scrim, pop);
      render(pop, (input.value || todayIso()).slice(0, 7));
      trigger.setAttribute('aria-expanded', 'true');
      openPicker = { trigger, pop, scrim };
      const first = pop.querySelector('.dp-day.is-on') || pop.querySelector('.dp-day.is-today') || pop.querySelector('.dp-day');
      if (first) first.focus();
    });

    // admin.js có thể tự set .value (ví dụ khi khởi tạo hoặc sau khi tạo lịch)
    input.addEventListener('input', sync);
    input.addEventListener('change', sync);
    const observer = new MutationObserver(sync);
    observer.observe(input, { attributes: true, attributeFilter: ['value', 'min', 'max'] });
  }

  function scan(root) {
    (root || document).querySelectorAll('input[type=date]').forEach(enhance);
  }

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && openPicker) {
      const trigger = openPicker.trigger;
      closeOpen();
      trigger.focus();
    }
  });

  // panel dời lịch được admin.js tạo động → theo dõi để bọc luôn
  const list = document.querySelector('#appointment-list');
  if (list) new MutationObserver(() => scan(list)).observe(list, { childList: true, subtree: true });

  scan();
})();
