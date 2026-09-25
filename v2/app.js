const BOOKING_ENDPOINT = "https://aomiaszicxqrctcgeoms.supabase.co/functions/v1/booking-api";

const tabDefs = [
  { id: "signature", label: "Signature" },
  { id: "nail", label: "Nail Care" },
  { id: "classic", label: "Classic" },
  { id: "design", label: "Design" },
  { id: "mi", label: "Eyelashes" },
  { id: "goi", label: "Shampoo" },
];

const SIGNATURE_PLACEHOLDER_IMAGE = "assets/services/signature-shared/service_photos/nail_design_ve_tay_clean.webp";

/* Cards load the card-sized file; clicking the photo opens the full-size one. */
const SIGNATURE_PHOTOS = {
  ve: "nail_design_ve_tay_clean",
  "gel-hn": "son_gel_han_nhat",
  "noi-gel": "noi_mong_dap_gel",
  "noi-bot": "noi_mong_dap_bot",
  "mi-classic": "noi_mi_classic",
};

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
  ["goi-thuong", "Gội dầu gội thường", 29000, 25, "Nhanh gọn, sạch nhẹ", "assets/services/signature-shared/service_photos/goi_dau_duong_sinh.jpg"],
  ["goi-phuchoi", "Gội phục hồi hư tổn", 69000, 40, "Ủ dưỡng cho tóc khô", "assets/services/signature-shared/service_photos/goi_dau_duong_sinh.jpg"],
  ["goi-duongsinh", "Gội dưỡng sinh + tẩy da chết da đầu", 89000, 45, "Massage đầu, vai và cổ", "assets/services/signature-shared/service_photos/goi_dau_duong_sinh.jpg"],
].map(([id, name, price, durationMinutes, description, image]) => ({ id, name, price, durationMinutes, description, image, originalPrice: price, discountPercent: 0 }));

const groupDefs = {
  nail: {
    title: "NAIL CARE",
    note: "Chăm sóc móng và da tay chân khoẻ đẹp, để bạn luôn tự tin toả sáng mỗi ngày.",
    accent: "assets/services/nail-care/decor/header_polish_doodle.webp",
    ids: ["ct-tay", "ct-chan", "thao-gel", "thao-up", "thao-bot", "noi-up", "noi-gel", "noi-bot"],
  },
  classic: {
    title: "CLASSIC",
    note: "Màu trơn trong trẻo, bóng căng và dịu dàng theo đúng gu của bạn.",
    accent: "../doodles/hearts.webp",
    ids: ["son-cung", "gel-hn", "gel-thach"],
  },
  design: {
    title: "DESIGN",
    note: "Thêm một chút lấp lánh, một nét vẽ nhỏ và thật nhiều cá tính.",
    accent: "assets/services/nail-care/doodles/header_flower.webp",
    ids: ["flash", "matmeo", "guong", "ombre", "da", "charm", "sticker", "ve", "xacu"],
  },
  mi: {
    title: "EYELASHES",
    note: "Uốn và nối mi theo dáng mắt, nhẹ nhàng nhưng vẫn thật có điểm nhấn.",
    accent: "../doodles/hand-mirror.webp",
    ids: ["uon-mi", "uon-mi-den", "mi-classic", "mi-tho", "mi-volume", "mi-sole", "mi-duoi"],
  },
  goi: {
    title: "SHAMPOO",
    note: "Một khoảng nghỉ êm cho tóc, da đầu và đôi vai được thả lỏng.",
    accent: "../doodles/teacup.webp",
    ids: ["goi-thuong", "goi-phuchoi", "goi-duongsinh"],
  },
};

const nailCareDescriptions = {
  "ct-tay": "Làm sạch và loại bỏ da chết vùng quanh móng tay.",
  "ct-chan": "Loại bỏ da chết, giúp vùng móng chân sạch sẽ, gọn gàng.",
  "thao-gel": "Tháo sơn gel nhẹ nhàng, không làm hư tổn móng thật.",
  "thao-up": "Tháo móng úp hoặc nail box an toàn, không đau rát.",
  "thao-bot": "Tháo gel/bột chuyên sâu, giữ móng thật luôn khỏe mạnh.",
  "noi-up": "Kỹ thuật nối móng úp Xgel bền đẹp, tự nhiên và chắc chắn.",
  "noi-gel": "Đắp gel tạo độ cứng và form móng chuẩn đẹp.",
  "noi-bot": "Đắp bột giúp móng cứng chắc, độ bền cao.",
};
const nailCareNotes = [
  "Giá trên chưa bao gồm sơn.",
  "Mẫu càng chi tiết, tụi mình báo giá trước khi làm.",
  "Tụi mình luôn lắng nghe để mang đến dịch vụ phù hợp nhất với bạn!",
];
fallbackServices.forEach((service) => {
  if (!groupDefs.nail.ids.includes(service.id)) return;
  service.description = nailCareDescriptions[service.id] || service.description;
});

function normalizeServicePricing(service) {
  const price = Math.max(0, Number(service.price || 0));
  const rawOriginal = Math.max(0, Number(service.originalPrice || price));
  const originalPrice = Math.max(rawOriginal, price);
  const discountPercent = Math.min(100, Math.max(0, Number(service.discountPercent || 0)));
  const onSale = discountPercent > 0 && originalPrice > price;
  return {
    ...service,
    price: onSale ? price : originalPrice,
    originalPrice,
    discountPercent: onSale ? discountPercent : 0,
  };
}

const state = { activeTab: "signature", services: fallbackServices.map(normalizeServicePricing) };
window.__v2Services = { get services() { return state.services; } };
const money = (value) => `${Number(value || 0).toLocaleString("vi-VN")}₫`;
const signaturePhotoSrc = (id, variant) => (SIGNATURE_PHOTOS[id] ? `assets/services/signature-shared/service_photos/${SIGNATURE_PHOTOS[id]}${variant === "card" ? "_card" : ""}.webp` : "");
const serviceById = (id) => state.services.find((item) => item.id === id);

const saleDiscount = (service) => {
  const discount = Number(service.discountPercent || 0);
  return discount > 0 && Number(service.originalPrice || service.price || 0) > Number(service.price || 0) ? discount : 0;
};

function renderPrice(service) {
  const onSale = saleDiscount(service) > 0;
  return `<span class="service-price${onSale ? " service-price--sale" : ""}">
    <strong class="service-price-current">${money(service.price)}</strong>
    ${onSale ? `<del class="service-price-original">${money(service.originalPrice)}</del>` : ""}
  </span>`;
}

function serviceCard(service, className = "", variant = "standard", sequenceIndex = 0, { showPhoto = true } = {}) {
  const featured = className.includes("service-card--featured");
  const signature = variant === "signature";
  const spaRelaxation = signature && service.id === "goi-duongsinh";
  const signaturePhoto = signature && !spaRelaxation ? signaturePhotoSrc(service.id, "card") : "";
  const image = spaRelaxation
    ? "assets/services/signature-shared/service_photos/goi_thao_duoc.webp"
    : (signature ? signaturePhoto || SIGNATURE_PLACEHOLDER_IMAGE : service.image);
  const photoTilt = signature && showPhoto ? (sequenceIndex % 2 === 0 ? "left" : "right") : "";
  const cardClasses = ["service-card", className, spaRelaxation ? "service-card--spa" : "", showPhoto ? "" : "service-card--text-only"].filter(Boolean).join(" ");
  const photoAlt = spaRelaxation ? "Khách được gội và chăm sóc da đầu tại tiệm" : (signaturePhoto ? `Ảnh dịch vụ ${service.name}` : `Ảnh mẫu tạm cho ${service.name}`);
  return `<article class="${cardClasses}" data-card-variant="${variant}" data-service-id="${service.id}"${photoTilt ? ` data-photo-tilt="${photoTilt}"` : ""}>
    ${featured ? '<span class="featured-badge"><span>ĐƯỢC CHỌN</span><strong>NHIỀU NHẤT</strong></span>' : ""}
    <div class="service-card-copy">
      <h3>${service.name}</h3>
      <p>${service.description || "Dịch vụ được chăm chút riêng cho bạn."}</p>
      <div class="service-meta">${renderPrice(service)}<span class="service-duration-row"><span class="service-duration">~${service.durationMinutes} phút</span></span></div>
    </div>
    ${saleDiscount(service) ? `<span class="signature-sale">-${saleDiscount(service)}%</span>` : ""}
    ${showPhoto ? `<div class="service-photo-wrap${spaRelaxation ? " service-photo-wrap--spa" : ""}">
      <img src="${image}" alt="${photoAlt}" loading="lazy" decoding="async">
      ${signature ? `<button class="service-photo-zoom" type="button" data-photo-zoom="${signaturePhoto ? signaturePhotoSrc(service.id, "full") : image}" data-photo-zoom-caption="${service.name}" aria-label="Xem ảnh ${service.name}"></button>` : ""}
      ${signature ? '<img class="signature-photo-pin" src="assets/services/signature-shared/decor/signature_photo_clip_pink.svg" alt="" aria-hidden="true" decoding="async" loading="lazy">' : ""}
      ${featured ? '<img class="featured-cat-sticker" src="assets/services/signature-shared/cats/featured_photo_cat_sticker.webp" alt="" aria-hidden="true" decoding="async" loading="lazy">' : ""}
    </div>` : ""}
    ${spaRelaxation ? '<img class="signature-spa-cat" src="assets/services/signature-shared/cats/spa_relaxation_cat_original.webp" alt="" aria-hidden="true" decoding="async" loading="lazy">' : ""}
    <button class="service-booking-hitarea" type="button" data-book-service="${service.id}" aria-label="Đặt lịch ${service.name}"></button>
  </article>`;
}

function renderServiceNote(lines) {
  return `<div class="service-note-divider" aria-hidden="true">
    <i></i><img src="assets/about/decor/about_bow_divider_EXACT.webp" alt="" decoding="async" loading="lazy"><i></i>
  </div>
  <aside class="service-note service-note--shared">
    <div class="service-note-label"><strong>Lưu ý nhé</strong></div>
    <ul>${lines.map((line, index) => `<li data-note-tone="${index % 3}">${line}</li>`).join("")}</ul>
    <span class="service-note-decor" aria-hidden="true">
      <img class="service-note-decor__sparkle" src="../doodles/star-lavender.webp" alt="" decoding="async" loading="lazy">
    </span>
  </aside>`;
}

function renderSignature() {
  const ids = ["ve", "gel-hn", "noi-gel", "noi-bot", "mi-classic", "goi-duongsinh"];
  const [featuredSource, ...rest] = ids.map(serviceById).filter(Boolean);
  const featured = featuredSource ? {
    ...featuredSource,
    name: "Nail design vẽ tay",
    description: "Mắt mèo, tráng gương, ombre, flash – vẽ tay từng ngón theo mood của bạn.",
  } : null;
  const topServices = rest.slice(0, 2);
  const lowerServices = rest.slice(2, 4);
  const spaServices = rest.slice(4);
  return `<div class="signature-layout">
    <div class="signature-hero-row">
      <div class="signature-intro">
        <img class="signature-cat" src="assets/services/signature-shared/cats/signature_raised_paw_cotton_v2.webp" alt="Mèo Nhu Nhi vẫy tay" decoding="async" loading="lazy">
        <div class="signature-copy">
          <img class="signature-wordmark" src="assets/services/signature-shared/signature_wordmark/SIGNATURE_WORDMARK_PASTEL_CROWN_V11.webp" alt="Signature" decoding="async" loading="lazy">
          <span class="signature-ribbon">DỊCH VỤ NỔI BẬT TẠI 1M65 NAIL ROOM</span>
          <p>Từng chi tiết nhỏ, tạo nên sự khác biệt lớn</p>
        </div>
      </div>
      ${featured ? serviceCard(featured, "service-card--featured", "signature", 0) : ""}
    </div>
    <div class="signature-service-groups">
      <div class="signature-grid signature-grid--top">${topServices.map((item, index) => serviceCard(item, "", "signature", index + 1)).join("")}</div>
      <div class="signature-lower">
        <img class="signature-outside signature-outside--drink" src="assets/services/signature-shared/doodles/bottom_drink.webp" alt="" aria-hidden="true" decoding="async" loading="lazy">
        ${lowerServices.map((item, index) => serviceCard(item, "", "signature", index + topServices.length + 1)).join("")}
      </div>
      <div class="signature-spa-row">
        ${spaServices.map((item, index) => serviceCard(item, "", "signature", index + topServices.length + lowerServices.length + 1)).join("")}
      </div>
    </div>
    ${renderServiceNote(nailCareNotes)}
  </div>`;
}

function sharedServiceRow(service) {
  const discount = Number(service.discountPercent || 0);
  const original = Number(service.originalPrice || service.price || 0);
  const hasDiscount = discount > 0 && original > Number(service.price || 0);
  return `<article class="shared-service-row ${hasDiscount ? "has-sale" : ""}" data-card-variant="shared-list">
    <div class="shared-service-row__copy">
      <div class="shared-service-row__copy-main">
        <h3>${service.name}</h3>
        <p>${service.description || "Dịch vụ được chăm chút riêng cho bạn."}</p>
      </div>
    </div>
    <div class="shared-service-row__actions">
      <div class="shared-service-row__offer-slot" aria-hidden="true">
        ${hasDiscount ? `<div class="shared-service-row__offer"><span>-${discount}%</span></div>` : ""}
      </div>
      <div class="shared-service-row__pricing">
        ${hasDiscount ? `<del>${money(original)}</del>` : ""}
        <strong>${money(service.price)}</strong>
      </div>
    </div>
    <button class="service-booking-hitarea" type="button" data-book-service="${service.id}" aria-label="Đặt lịch ${service.name}"></button>
  </article>`;
}

function renderSharedGroup(id, animate = false) {
  const group = groupDefs[id];
  const services = group.ids.map(serviceById).filter(Boolean);
  const noteLines = id === "nail" ? nailCareNotes : [
    group.note,
    ...(id === "design" ? [nailCareNotes[1]] : []),
    nailCareNotes[2],
  ];
  return `<div class="shared-service-layout shared-service-layout--${id}${animate ? " is-entering" : ""}" data-template="shared-service-list" data-service-group="${id}">
    <div class="shared-service-list">${services.map((item) => sharedServiceRow(item)).join("")}</div>
    ${renderServiceNote(noteLines)}
  </div>`;
}

function renderServices({ animateShared = false } = {}) {
  const tabs = document.querySelector("[data-service-tabs]");
  const panel = document.querySelector("[data-service-panel]");
  if (!tabs || !panel) return;
  const tabButtons = tabs.querySelectorAll("[data-service-tab]");
  // Once built, only the active state changes, so the sliding tab pill keeps its element and glides.
  if (tabButtons.length === tabDefs.length) {
    tabButtons.forEach((button) => {
      const active = button.dataset.serviceTab === state.activeTab;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-selected", String(active));
    });
  } else {
    tabs.innerHTML = tabDefs.map((tab) => `<button type="button" role="tab" id="tab-${tab.id}" aria-controls="service-panel" aria-selected="${tab.id === state.activeTab}" class="${tab.id === state.activeTab ? "is-active" : ""}" data-service-tab="${tab.id}"><span>${tab.label}</span></button>`).join("");
  };
  panel.id = "service-panel";
  panel.setAttribute("role", "tabpanel");
  panel.setAttribute("aria-labelledby", `tab-${state.activeTab}`);
  panel.innerHTML = state.activeTab === "signature" ? renderSignature() : renderSharedGroup(state.activeTab, animateShared);
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
      const merged = source ? { ...fallback, ...source, description: fallback.description, image: fallback.image } : fallback;
      return normalizeServicePricing(merged);
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
  grid.innerHTML = ["09:00", "10:30", "12:00", "13:30", "15:00", "16:30"].map((time, index) => `<button type="button" data-open-booking data-prefill-slot="${time}" style="--slot-tilt:${[-2.2, 1.7, 1.2, -1.5, 1.4, -1.8][index]}deg"><strong>${time}</strong><small>${index % 3 === 1 ? "Còn chỗ" : "Chọn giờ"}</small></button>`).join("");
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
    if (tab) {
      const nextTab = tab.dataset.serviceTab;
      if (nextTab === state.activeTab) return;
      state.activeTab = nextTab;
      renderServices({ animateShared: nextTab !== "signature" });
      return;
    }
    const booking = event.target.closest("[data-open-booking]");
    if (booking) document.dispatchEvent(new CustomEvent("1m65:v2:open-booking", { detail: { serviceId: "", slot: booking.dataset.prefillSlot || "" } }));
    const serviceBooking = event.target.closest("[data-book-service]");
    if (serviceBooking) document.dispatchEvent(new CustomEvent("1m65:v2:open-booking", { detail: { serviceId: serviceBooking.dataset.bookService, slot: "" } }));
  });
  document.addEventListener("keydown", (event) => { if (event.key === "Escape") closeDrawer(); });
}

renderHomeSchedule();
renderServices();
setupInteractions();
loadLiveServices();
