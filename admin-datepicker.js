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

  // Arrows are SVG, not the ‹ › characters, which sit low in some fonts.
  function chevron(path) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('aria-hidden', 'true');
    line.setAttribute('d', path);
    svg.append(line);
    return svg;
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
      const prev = node('button', 'dp-nav');
      const next = node('button', 'dp-nav');
      prev.append(chevron('M15 5l-7 7 7 7'));
      next.append(chevron('M9 5l7 7-7 7'));
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

  // Ô chọn (<select>) cũng được bọc theo cùng kiểu: nút giống ô ngày + danh sách thả xuống của 1M65 thay cho
  // danh sách mặc định của trình duyệt. Vẫn ghi về select gốc và bắn 'change' như trước, admin.js không phải đổi.
  function enhanceSelect(select) {
    if (!select || select.dataset.dpReady === '1') return;
    select.dataset.dpReady = '1';

    const wrap = node('div', 'dp-wrap');
    select.parentNode.insertBefore(wrap, select);
    wrap.appendChild(select);
    select.classList.add('dp-native');
    select.setAttribute('tabindex', '-1');
    select.setAttribute('aria-hidden', 'true');

    const trigger = node('button', 'dp-trigger');
    trigger.type = 'button';
    trigger.setAttribute('aria-haspopup', 'listbox');
    trigger.setAttribute('aria-expanded', 'false');
    const text = node('span', 'dp-text');
    trigger.append(text, node('span', 'caret', '▾'));
    // Tên ô lấy từ chữ đầu của <label>, không lấy cả chữ của các lựa chọn bên trong.
    const owner = select.closest('label');
    const fieldName = owner && owner.firstChild && owner.firstChild.nodeType === 3 ? owner.firstChild.textContent.trim() : '';
    if (fieldName) trigger.setAttribute('aria-label', fieldName);
    wrap.appendChild(trigger);

    function sync() {
      const chosen = select.options[select.selectedIndex];
      text.textContent = chosen ? chosen.textContent : '';
    }

    trigger.addEventListener('click', () => {
      if (openPicker && openPicker.trigger === trigger) { closeOpen(); return; }
      closeOpen();

      const scrim = node('button', 'dp-scrim');
      scrim.type = 'button';
      scrim.setAttribute('aria-label', 'Đóng danh sách');
      scrim.addEventListener('click', closeOpen);

      const pop = node('div', 'dp-pop dp-list');
      pop.setAttribute('role', 'listbox');
      if (fieldName) pop.setAttribute('aria-label', fieldName);
      [...select.options].forEach((option) => {
        const item = node('button', 'dp-option', option.textContent);
        item.type = 'button';
        item.setAttribute('role', 'option');
        item.setAttribute('aria-selected', String(option.selected));
        item.disabled = option.disabled;
        item.addEventListener('click', () => {
          select.value = option.value;
          sync();
          select.dispatchEvent(new Event('change', { bubbles: true }));
          closeOpen();
          trigger.focus();
        });
        pop.append(item);
      });
      // Mũi tên lên/xuống đi qua các lựa chọn.
      pop.addEventListener('keydown', (event) => {
        if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
        event.preventDefault();
        const items = [...pop.querySelectorAll('.dp-option:not(:disabled)')];
        const at = items.indexOf(document.activeElement);
        const next = items[Math.min(items.length - 1, Math.max(0, at + (event.key === 'ArrowDown' ? 1 : -1)))];
        if (next) next.focus();
      });

      wrap.append(scrim, pop);
      trigger.setAttribute('aria-expanded', 'true');
      openPicker = { trigger, pop, scrim };
      const current = pop.querySelector('.dp-option[aria-selected="true"]') || pop.querySelector('.dp-option');
      if (current) {
        current.focus();
        current.scrollIntoView({ block: 'nearest' });
      }
    });

    // admin.js vẽ lại các lựa chọn (ví dụ sau khi khóa cả ngày) → cập nhật chữ trên nút
    select.addEventListener('change', sync);
    new MutationObserver(sync).observe(select, { childList: true, subtree: true, attributes: true });
    sync();
  }

  function scan(root) {
    (root || document).querySelectorAll('input[type=date]').forEach(enhance);
    (root || document).querySelectorAll('select').forEach(enhanceSelect);
  }

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && openPicker) {
      const trigger = openPicker.trigger;
      closeOpen();
      trigger.focus();
    }
  });

  // panel dời lịch được admin.js tạo động trong ngăn chi tiết → theo dõi để bọc luôn
  const list = document.querySelector('#detail-drawer');
  if (list) new MutationObserver(() => scan(list)).observe(list, { childList: true, subtree: true });

  scan();
})();
