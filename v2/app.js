const BOOKING_ENDPOINT = "https://aomiaszicxqrctcgeoms.supabase.co/functions/v1/booking-api";

const tabDefs = [
  { id: "signature", label: "Signature", icon: "assets/services/signature-shared/tab_icons/signature_star_active.png" },
  { id: "nail", label: "Nail Care", icon: "assets/services/signature-shared/tab_icons/nailcare_polish_inactive.png" },
  { id: "classic", label: "Classic", icon: "assets/services/signature-shared/tab_icons/classic_heart_inactive.png" },
  { id: "design", label: "Design", icon: "assets/services/signature-shared/tab_icons/design_flower_inactive.png" },
  { id: "mi", label: "Eyelashes", icon: "assets/services/signature-shared/tab_icons/eyelashes_eye_inactive.png" },
  { id: "goi", label: "Shampoo", icon: "assets/services/signature-shared/tab_icons/shampoo_cat_inactive.png" },
];

const fallbackServices = [
  ["ct-tay", "Cắt da tay", 20000, 20, "Gọn viền móng tay", "assets/services/nail-care/service_photos/cat_da_tay.jpg"],
  ["ct-chan", "Cắt da chân", 30000, 25, "Làm kỹ da chết quanh móng", "assets/services/nail-care/service_photos/cat_da_chan.jpg"],
  ["thao-gel", "Tháo sơn gel", 15000, 15, "Tháo nhẹ, giữ móng thật", "assets/services/nail-care/service_photos/thao_son_gel.jpg"],
  ["thao-up", "Tháo móng úp / Nail box", 20000, 20, "An toàn, không đau rát", "assets/services/nail-care/service_photos/thao_mong_up_nail_box.jpg"],
  ["thao-bot", "Tháo Gel / Bột", 30000, 25, "Ngâm mềm rồi tháo", "assets/services/nail-care/service_photos/thao_gel_bot.jpg"],
  ["noi-up", "Nối móng Úp Xgel", 90000, 60, "Nhanh, nhẹ tay nhất", "assets/services/nail-care/service_photos/noi_mong_up_xgel.jpg"],
  ["noi-gel", "Nối móng đắp Gel", 120000, 90, "Dáng theo ý bạn, nhẹ và bền", "assets/services/nail-care/service_photos/noi_mong_dap_gel.jpg"],
  ["noi-bot", "Nối móng đắp bột", 150000, 100, "Cứng cáp, giữ dáng lâu", "assets/services/nail-care/service_photos/noi_mong_dap_bot.jpg"],
  ["son-cung", "Sơn cứng móng", 20000, 20, "Lớp bảo vệ móng yếu", "assets/services/signature-shared/service_photos/son_gel_han_nhat.jpg"],
  ["gel-hn", "Sơn gel Hàn / Nhật", 70000, 45, "Màu trong trẻo, bóng căng", "assets/services/signature-shared/service_photos/son_gel_han_nhat.jpg"],
  ["gel-thach", "Sơn gel thạch", 80000, 50, "Trong như thạch, ánh nhẹ", "assets/services/signature-shared/service_photos/son_gel_han_nhat.jpg"],
  ["flash", "Flash", 40000, 15, "Ánh sáng lấp lánh", "assets/services/signature-shared/service_photos/nail_design_ve_tay.jpg"],
  ["matmeo", "Mắt mèo", 50000, 20, "Hiệu ứng chiều sâu", "assets/services/signature-shared/service_photos/nail_design_ve_tay.jpg"],
  ["guong", "Tráng gương", 50000, 20, "Bề mặt ánh kim", "assets/services/signature-shared/service_photos/nail_design_ve_tay.jpg"],
  ["ombre", "Ombre", 50000, 25, "Chuyển màu mềm mại", "assets/services/signature-shared/service_photos/nail_design_ve_tay.jpg"],
  ["da", "Đính đá", 20000, 15, "Tính theo mẫu và số viên", "assets/services/signature-shared/service_photos/nail_design_ve_tay.jpg"],
  ["charm", "Charm", 20000, 15, "Tuỳ mẫu charm", "assets/services/signature-shared/service_photos/nail_design_ve_tay.jpg"],
  ["sticker", "Sticker", 5000, 10, "Dán nhanh, nhiều mẫu", "assets/services/signature-shared/service_photos/nail_design_ve_tay.jpg"],
  ["ve", "Vẽ tay", 15000, 25, "Tuỳ độ chi tiết", "assets/services/signature-shared/service_photos/nail_design_ve_tay.jpg"],
  ["xacu", "Ẩn xà cừ / Kim tuyến", 10000, 15, "Ánh nhẹ dưới lớp gel", "assets/services/signature-shared/service_photos/nail_design_ve_tay.jpg"],
  ["uon-mi", "Uốn mi Collagen", 145000, 60, "Cong tự nhiên, giữ 1–2 tháng", "assets/services/signature-shared/service_photos/noi_mi_classic.jpg"],
  ["uon-mi-den", "Uốn mi Collagen + phủ đen", 165000, 70, "Đậm nét hơn, không cần chuốt", "assets/services/signature-shared/service_photos/noi_mi_classic.jpg"],
  ["mi-classic", "Nối mi Classic", 150000, 90, "Sợi mảnh, dày tự nhiên", "assets/services/signature-shared/service_photos/noi_mi_classic.jpg"],
  ["mi-tho", "Nối mi thỏ / em bé", 150000, 90, "Dáng cong tròn, trẻ mắt", "assets/services/signature-shared/service_photos/noi_mi_classic.jpg"],
  ["mi-volume", "Nối mi Volume", 200000, 110, "Dày và bồng nhất", "assets/services/signature-shared/service_photos/noi_mi_classic.jpg"],
  ["mi-sole", "Nối mi Sole Thái / Anime", 200000, 110, "Thiết kế theo dáng mắt", "assets/services/signature-shared/service_photos/noi_mi_classic.jpg"],
  ["mi-duoi", "Nối mi dưới", 20000, 20, "Làm kèm bộ mi trên", "assets/services/signature-shared/service_photos/noi_mi_classic.jpg"],
  ["goi-thao", "Gội thảo dược 30′", 29000, 30, "Thư giãn nhẹ nhàng", "assets/services/signature-shared/service_photos/goi_dau_duong_sinh.jpg"],
  ["goi-thuong", "Gội dầu gội thường", 29000, 25, "Nhanh gọn, sạch nhẹ", "assets/services/signature-shared/service_photos/goi_dau_duong_sinh.jpg"],
  ["goi-phuchoi", "Gội phục hồi hư tổn", 69000, 40, "Ủ dưỡng cho tóc khô", "assets/services/signature-shared/service_photos/goi_dau_duong_sinh.jpg"],
  ["goi-duongsinh", "Gội dưỡng sinh + tẩy da chết da đầu", 89000, 45, "Massage đầu, vai và cổ", "assets/services/signature-shared/service_photos/goi_dau_duong_sinh.jpg"],
].map(([id, name, price, durationMinutes, description, image]) => ({ id, name, price, durationMinutes, description, image, originalPrice: price, discountPercent: 0 }));

const groupDefs = {
  nail: { title: "NAIL CARE", note: "Chăm sóc móng và da tay chân khoẻ đẹp, để bạn luôn tự tin toả sáng mỗi ngày.", ids: ["ct-tay", "ct-chan", "thao-gel", "thao-up", "thao-bot", "noi-up", "noi-gel", "noi-bot"] },
  classic: { title: "CLASSIC", note: "Màu trơn trong trẻo, bóng căng và dịu dàng theo đúng gu của bạn.", ids: ["son-cung", "gel-hn", "gel-thach"] },
  design: { title: "DESIGN", note: "Thêm một chút lấp lánh, một nét vẽ nhỏ và thật nhiều cá tính.", ids: ["flash", "matmeo", "guong", "ombre", "da", "charm", "sticker", "ve", "xacu"] },
  mi: { title: "EYELASHES", note: "Uốn và nối mi theo dáng mắt, nhẹ nhàng nhưng vẫn thật có điểm nhấn.", ids: ["uon-mi", "uon-mi-den", "mi-classic", "mi-tho", "mi-volume", "mi-sole", "mi-duoi"] },
  goi: { title: "SHAMPOO", note: "Một khoảng nghỉ êm cho tóc, da đầu và đôi vai được thả lỏng.", ids: ["goi-thao", "goi-thuong", "goi-phuchoi", "goi-duongsinh"] },
};

const state = { activeTab: "signature", services: fallbackServices };
window.__v2Services = { get services() { return state.services; } };
const money = (value) => `${Number(value || 0).toLocaleString("vi-VN")}₫`;
const serviceById = (id) => state.services.find((item) => item.id === id);

function renderPrice(service) {
  const discount = Number(service.discountPercent || 0);
  if (discount <= 0) return `<strong>${money(service.price)}</strong>`;
  return `<span class="sale-badge">-${discount}%</span><del>${money(service.originalPrice)}</del><strong>${money(service.price)}</strong>`;
}

function serviceCard(service, className = "") {
  return `<article class="service-card ${className}">
    <div class="service-card-copy"><h3>${service.name}</h3><p>${service.description || "Dịch vụ được chăm chút riêng cho bạn."}</p><div class="service-meta"><span>${service.durationMinutes} phút</span><span class="service-price">${renderPrice(service)}</span></div><button type="button" data-book-service="${service.id}">Đặt dịch vụ này</button></div>
    <img src="${service.image}" alt="${service.name}" loading="lazy">
  </article>`;
}

function renderSignature() {
  const ids = ["ve", "gel-hn", "noi-gel", "noi-bot", "mi-classic", "goi-duongsinh"];
  const list = ids.map(serviceById).filter(Boolean);
  const [featured, ...rest] = list;
  return `<div class="signature-layout">
    <div class="signature-intro">
      <img class="signature-cat" src="assets/services/signature-web/cats/signature_raised_paw_LOCKED.png" alt="Mèo Nhu Nhi vẫy tay">
      <div><img class="signature-wordmark" src="assets/services/signature-web/signature_wordmark/SIGNATURE_WORDMARK_FINAL_CLEAN_SAFE.png" alt="Signature"><p>Dịch vụ nổi bật tại 1M65 Nail Room</p></div>
    </div>
    ${featured ? serviceCard(featured, "service-card--featured") : ""}
    <div class="signature-grid">${rest.map((item) => serviceCard(item)).join("")}</div>
    <aside class="service-note"><img src="assets/services/signature-shared/cats/note_cat_peeking.png" alt=""><div><strong>Lưu ý nhé</strong><p>Giá trên chưa bao gồm sơn. Mẫu càng chi tiết, tụi mình báo giá trước khi làm.</p></div></aside>
  </div>`;
}

function renderSharedGroup(id) {
  const group = groupDefs[id];
  const services = group.ids.map(serviceById).filter(Boolean);
  return `<div class="shared-service-layout" data-template="nail-care">
    <header class="shared-service-title"><img src="assets/services/signature-shared/cats/note_cat_peeking.png" alt=""><div><h2>${group.title}</h2><p>${group.note}</p></div></header>
    <div class="shared-service-grid">${services.map((item) => serviceCard(item)).join("")}</div>
    <aside class="service-note"><img src="assets/services/signature-shared/cats/note_cat_peeking.png" alt=""><div><strong>Lưu ý nhé</strong><p>Giá có thể thay đổi theo độ dài và tình trạng thực tế. Tiệm luôn báo trước khi làm.</p></div></aside>
  </div>`;
}

function renderServices() {
  const tabs = document.querySelector("[data-service-tabs]");
  const panel = document.querySelector("[data-service-panel]");
  if (!tabs || !panel) return;
  tabs.innerHTML = tabDefs.map((tab) => `<button type="button" role="tab" id="tab-${tab.id}" aria-controls="service-panel" aria-selected="${tab.id === state.activeTab}" class="${tab.id === state.activeTab ? "is-active" : ""}" data-service-tab="${tab.id}"><img src="${tab.icon}" alt=""><span>${tab.label}</span></button>`).join("");
  panel.id = "service-panel";
  panel.setAttribute("role", "tabpanel");
  panel.setAttribute("aria-labelledby", `tab-${state.activeTab}`);
  panel.innerHTML = state.activeTab === "signature" ? renderSignature() : renderSharedGroup(state.activeTab);
}

async function loadLiveServices() {
  try {
    const response = await fetch(BOOKING_ENDPOINT, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "config" }) });
    if (!response.ok) return;
    const body = await response.json();
    const live = Array.isArray(body?.config?.services) ? body.config.services : [];
    if (!live.length) return;
    state.services = fallbackServices.map((fallback) => {
      const source = live.find((item) => item.id === fallback.id);
      return source ? { ...fallback, ...source, description: fallback.description, image: fallback.image } : fallback;
    });
    renderServices();
  } catch { /* Keep the reviewed local fallback. */ }
}

function renderHomeSchedule() {
  const now = new Date();
  const today = document.querySelector("[data-today]");
  if (today) today.textContent = new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }).format(now);
  const grid = document.querySelector("[data-home-slots]");
  if (!grid) return;
  grid.innerHTML = ["09:00", "10:30", "12:00", "13:30", "15:00", "16:30"].map((time, index) => `<button type="button" data-open-booking data-prefill-slot="${time}"><img src="assets/home/schedule/${["pin_pink.png", "pin_peach.png", "pin_lavender.png"][index % 3]}" alt=""><strong>${time}</strong><small>${index % 3 === 1 ? "Còn chỗ" : "Chọn giờ"}</small></button>`).join("");
}

function openDrawer() {
  const drawer = document.querySelector("#mobile-drawer");
  const trigger = document.querySelector(".menu-button");
  if (!drawer || !trigger) return;
  drawer.hidden = false;
  trigger.setAttribute("aria-expanded", "true");
  document.body.classList.add("has-overlay");
  drawer.querySelector("a")?.focus();
}

function closeDrawer() {
  const drawer = document.querySelector("#mobile-drawer");
  const trigger = document.querySelector(".menu-button");
  if (!drawer || !trigger || drawer.hidden) return;
  drawer.hidden = true;
  trigger.setAttribute("aria-expanded", "false");
  document.body.classList.remove("has-overlay");
  trigger.focus();
}

function setupInteractions() {
  document.querySelector(".menu-button")?.addEventListener("click", openDrawer);
  document.querySelectorAll("[data-close-drawer],[data-drawer-link]").forEach((node) => node.addEventListener("click", closeDrawer));
  document.addEventListener("click", (event) => {
    const tab = event.target.closest("[data-service-tab]");
    if (tab) { state.activeTab = tab.dataset.serviceTab; renderServices(); return; }
    const booking = event.target.closest("[data-open-booking],[data-book-service]");
    if (booking) document.dispatchEvent(new CustomEvent("1m65:v2:open-booking", { detail: { serviceId: booking.dataset.bookService || "", slot: booking.dataset.prefillSlot || "" } }));
  });
  document.addEventListener("keydown", (event) => { if (event.key === "Escape") closeDrawer(); });
  const observer = new IntersectionObserver((entries) => entries.forEach((entry) => entry.target.classList.toggle("is-visible", entry.isIntersecting)), { threshold: 0.12 });
  document.querySelectorAll(".reveal").forEach((node) => observer.observe(node));
}

renderHomeSchedule();
renderServices();
setupInteractions();
loadLiveServices();
