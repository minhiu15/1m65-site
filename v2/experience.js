import "./booking-v2.js";

const API = "https://aomiaszicxqrctcgeoms.supabase.co/functions/v1/booking-api";
const TZ = "Asia/Ho_Chi_Minh";
const gallery = [
["nail","assets/services/nail-care/service_photos/cat_da_tay.jpg","Chăm sóc da tay","♡"],
["nail","assets/services/nail-care/service_photos/noi_mong_dap_gel.jpg","Nối móng gel","✦"],
["mi","assets/services/signature-shared/service_photos/noi_mi_classic.jpg","Nối mi Classic","◉"],
["nail","assets/services/signature-shared/service_photos/nail_design_ve_tay.jpg","Nail design vẽ tay","☆"],
["goi","assets/services/signature-shared/service_photos/goi_dau_duong_sinh.jpg","Gội đầu dưỡng sinh","♨"],
["nail","assets/services/nail-care/service_photos/noi_mong_up_xgel.jpg","Nối móng Xgel","♡"],
["nail","assets/services/signature-shared/service_photos/son_gel_han_nhat.jpg","Sơn gel Hàn Nhật","✦"],
["khac","assets/about/photos/salon-corner.jpg","Một góc nhỏ trong tiệm","⌂"],
["nail","assets/services/nail-care/service_photos/cat_da_chan.jpg","Chăm sóc da chân","♡"],
["khac","assets/about/photos/nail-technician.jpg","Thợ nail tại 1M65","☺"],
["nail","assets/services/nail-care/service_photos/noi_mong_dap_bot.jpg","Nối móng đắp bột","✦"],
["nail","assets/services/nail-care/service_photos/thao_son_gel.jpg","Tháo sơn gel","♡"],
["nail","assets/services/nail-care/service_photos/thao_mong_up_nail_box.jpg","Tháo nail box","☆"],
["mi","assets/services/signature-shared/service_photos/noi_mi_classic.jpg","Bộ mi nhẹ tự nhiên","◉"],
["goi","assets/services/signature-shared/service_photos/goi_dau_duong_sinh.jpg","Khoảng nghỉ cho tóc và vai","♨"],
["nail","assets/services/nail-care/service_photos/thao_gel_bot.jpg","Tháo gel bột nhẹ tay","♡"],
["nail","assets/services/signature-shared/service_photos/nail_design_ve_tay.jpg","Mẫu nail cá tính","✦"],
["khac","assets/about/photos/salon-corner.jpg","Kệ sơn của tiệm","⌂"],
["nail","assets/services/signature-shared/service_photos/son_gel_han_nhat.jpg","Màu gel trong trẻo","♡"],
["khac","assets/about/photos/nail-technician.jpg","Chăm chút từng chi tiết","☺"]
];
const fallbackReviews = [
["Mình sợ nhất là thợ nói nhiều. Ở đây chị ấy chỉ hỏi một câu rồi im lặng làm suốt hai tiếng. Tuyệt vời.","Thu Hà","Nail Hàn trong veo"],
["Đặt nail mèo cho ngày cưới. Mẹ mình khóc — không rõ vì cảm động hay vì mười ngón tay mười con mèo.","Minh Châu","Nail mèo · vẽ tay"],
["Ba tuần rồi vẫn chưa bong một góc nào. Và Nhu Nhi ngủ trên chân mình cả buổi, tính thêm phí được không?","Lan Vy","Sơn gel cơ bản"],
["Gội đầu dưỡng sinh xong mình ngủ quên mất hai mươi phút. Chị Hạnh để yên cho mình ngủ, không đánh thức.","Bảo Trâm","Gội đầu dưỡng sinh"]
];
let galleryFilter = "all";
let galleryVisible = matchMedia("(max-width: 600px)").matches ? 6 : 10;
let lightboxIndex = 0;
let activeModal = null;
let returnFocus = null;
let lastInputWasPointer = false;
let toastTimer = 0;

document.addEventListener("pointerdown",function(){lastInputWasPointer=true;},true);
document.addEventListener("keydown",function(){
  lastInputWasPointer=false;
  document.querySelectorAll(".is-pointer-focus-return").forEach(function(node){node.classList.remove("is-pointer-focus-return");});
},true);

function esc(value) {
  return String(value == null ? "" : value).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;");
}
function focusables(root) {
  return Array.from(root.querySelectorAll("a[href],button:not([disabled]),input:not([disabled]),textarea:not([disabled]),iframe,[tabindex]:not([tabindex='-1'])")).filter(function(node){return !node.hidden && node.getAttribute("aria-hidden") !== "true";});
}
function openModal(modal, trigger) {
  if (!modal) return;
  if (activeModal && activeModal !== modal) closeModal(activeModal, false);
  activeModal = modal;
  returnFocus = trigger || document.activeElement;
  modal.hidden = false;
  document.body.classList.add("has-overlay");
  requestAnimationFrame(function(){(modal.querySelector(".modal-close") || focusables(modal)[0] || modal).focus();});
}
function closeModal(modal, restore) {
  const target = modal || activeModal;
  if (!target) return;
  target.hidden = true;
  if (target === activeModal) activeModal = null;
  document.body.classList.remove("has-overlay");
  if (restore !== false && returnFocus && returnFocus.isConnected) {
    const focusTarget=returnFocus;
    if(lastInputWasPointer){
      focusTarget.classList.add("is-pointer-focus-return");
      focusTarget.addEventListener("blur",function(){focusTarget.classList.remove("is-pointer-focus-return");},{once:true});
    }
    focusTarget.focus();
  }
  returnFocus = null;
}
function toast(message) {
  const node = document.querySelector("[data-toast]");
  if (!node) return;
  clearTimeout(toastTimer);
  node.textContent = message;
  node.hidden = false;
  toastTimer = setTimeout(function(){node.hidden = true;}, 3200);
}
window.__v2Experience = { openModal: openModal, closeModal: closeModal, toast: toast, esc: esc };

function initialGalleryCount() {
  return matchMedia("(max-width: 600px)").matches ? 6 : 10;
}
function tile(item, index) {
  return '<button type="button" class="gallery-tile" data-gallery-index="'+index+'" data-badge="'+esc(item[3])+'" aria-label="Xem lớn: '+esc(item[2])+'"><img src="'+esc(item[1])+'" alt="" loading="lazy" decoding="async"><span class="sr-only">'+esc(item[2])+'</span></button>';
}
function filteredGallery() {
  return gallery.filter(function(item){return galleryFilter === "all" || item[0] === galleryFilter;});
}
function renderGallery() {
  document.querySelectorAll("[data-gallery-filter]").forEach(function(button){
    const active = button.dataset.galleryFilter === galleryFilter;
    button.classList.toggle("is-active",active);
    button.setAttribute("aria-pressed",String(active));
  });
  const items = filteredGallery();
  galleryVisible = Math.max(galleryVisible, initialGalleryCount());
  const main = document.querySelector("[data-gallery-grid]");
  const more = document.querySelector("[data-gallery-more]");
  if (main) main.innerHTML = items.slice(0,galleryVisible).map(tile).join("");
  if (more) more.hidden = galleryVisible >= items.length;
}
function updateLightbox(index) {
  const items = filteredGallery();
  if (!items.length) return;
  lightboxIndex = (index + items.length) % items.length;
  const item = items[lightboxIndex];
  const image = document.querySelector("[data-lightbox-image]");
  const caption = document.querySelector("[data-lightbox-caption]");
  if (image) { image.src = item[1]; image.alt = item[2]; }
  if (caption) caption.textContent = item[2];
}
function openLightbox(index, trigger) {
  updateLightbox(index);
  openModal(document.querySelector("#gallery-lightbox"), trigger);
}
function renderReviews(reviews) {
  const grid = document.querySelector("[data-review-grid]");
  if (!grid) return;
  const quoteAssets = [
    "assets/reviews/05_quote_pink_LOCKED_CLEAN.webp",
    "assets/reviews/06_quote_lavender_TEMP_LOCKED.webp",
    "assets/reviews/07_quote_peach_LOCKED_CLEAN.webp",
    "assets/reviews/06_quote_lavender_TEMP_LOCKED.webp",
  ];
  const quoteTones = ["pink", "lavender", "peach", "lavender"];
  grid.innerHTML = reviews.slice(0,4).map(function(review,index){
    const stars = new Array(5).fill('<img src="assets/reviews/08_rating_star_filled_LOCKED_CLEAN.webp" alt="" decoding="async" loading="lazy">').join("");
    return '<article class="review-card"><img class="review-card__quote review-card__quote--'+quoteTones[index]+'" src="'+quoteAssets[index]+'" alt="" aria-hidden="true" decoding="async" loading="lazy"><p class="review-card__text">“'+esc(review[0])+'”</p><div class="review-card__rating stars" aria-label="5 trên 5 sao">'+stars+'</div><p class="review-card__author">— '+esc(review[1])+'<small>'+esc(review[2])+'</small></p></article>';
  }).join("");
}
async function loadReviews() {
  renderReviews(fallbackReviews);
  try {
    const response = await fetch("../google-reviews.json",{cache:"no-store"});
    if (!response.ok) return;
    const data = await response.json();
    const reviews = Array.isArray(data.reviews) ? data.reviews.filter(function(review){return Number(review.rating)===5 && String(review.text||"").trim();}).map(function(review){return [String(review.text).trim(),String(review.name||"Khách hàng Google"),"Google · 5 sao"];}) : [];
    if (reviews.length) renderReviews(reviews);
    const average = Number(data.averageRating), total = Number(data.totalReviewCount);
    const averageNode = document.querySelector("[data-review-average]"), totalNode = document.querySelector("[data-review-total]");
    if (averageNode && Number.isFinite(average)) averageNode.innerHTML = esc(average.toLocaleString("vi-VN",{minimumFractionDigits:1,maximumFractionDigits:1}))+"<small>/5</small>";
    if (totalNode && Number.isFinite(total)) totalNode.textContent = total.toLocaleString("vi-VN")+"+";
  } catch (_) {}
}
function isoToday() {
  const parts = new Intl.DateTimeFormat("en-CA",{timeZone:TZ,year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(new Date()).reduce(function(out,part){if(part.type!=="literal")out[part.type]=part.value;return out;},{});
  return parts.year+"-"+parts.month+"-"+parts.day;
}
function slotLabel(value) {
  return new Intl.DateTimeFormat("vi-VN",{timeZone:TZ,hour:"2-digit",minute:"2-digit",hourCycle:"h23"}).format(new Date(value));
}
async function loadHomeAvailability() {
  const buttons = Array.from(document.querySelectorAll("[data-home-slots] [data-prefill-slot]"));
  if (!buttons.length) return;
  try {
    const response = await fetch(API,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({action:"availability",date:isoToday(),serviceIds:["ve"]})});
    if (!response.ok) throw new Error("request_failed");
    const body = await response.json();
    const free = new Set((Array.isArray(body.slots)?body.slots:[]).map(function(slot){return slotLabel(slot.start_at||slot.startAt);}));
    buttons.forEach(function(button){const available=free.has(button.dataset.prefillSlot);button.disabled=!available;button.setAttribute("aria-disabled",String(!available));const status=button.querySelector("small");if(status)status.textContent=available?"Còn trống":"Đã kín";});
  } catch (_) {
    buttons.forEach(function(button){const status=button.querySelector("small");if(status)status.textContent="Mở lịch";});
  }
}
function openManager(reference,trigger) {
  const frame = document.querySelector("[data-manager-frame]");
  if (frame) {const query=new URLSearchParams({embed:"1",view:"v2"});if(reference)query.set("reference",reference);frame.src="manage-booking.html?"+query.toString();}
  openModal(document.querySelector("#manager-modal"),trigger);
}
window.__v2Experience.openManager = openManager;

document.addEventListener("click",function(event){
  const target=event.target;
  const close=target.closest("[data-close-modal]");if(close)return closeModal(close.closest(".modal"));
  const more=target.closest("[data-gallery-more]");if(more){galleryVisible+=initialGalleryCount();renderGallery();return;}
  const filter=target.closest("[data-gallery-filter]");if(filter){galleryFilter=filter.dataset.galleryFilter;galleryVisible=initialGalleryCount();renderGallery();return;}
  const galleryTile=target.closest("[data-gallery-index]");if(galleryTile){openLightbox(Number(galleryTile.dataset.galleryIndex),galleryTile);return;}
  if(target.closest("[data-lightbox-prev]")){updateLightbox(lightboxIndex-1);return;}
  if(target.closest("[data-lightbox-next]")){updateLightbox(lightboxIndex+1);return;}
  if(target.closest("[data-lightbox-book]")){closeModal(document.querySelector("#gallery-lightbox"),false);window.__v2Booking.open({},target.closest("[data-lightbox-book]"));return;}
  const faq=target.closest("[data-faq-list] button");if(faq){const expanded=faq.getAttribute("aria-expanded")==="true";faq.setAttribute("aria-expanded",String(!expanded));const answer=faq.closest("article").querySelector(".faq-answer");if(answer)answer.hidden=expanded;return;}
  const manager=target.closest("[data-open-manager]");if(manager)openManager("",manager);
});
document.addEventListener("1m65:v2:open-booking",function(event){window.__v2Booking.open(event.detail||{},document.activeElement);});
document.addEventListener("keydown",function(event){
  if(event.key==="Escape"&&activeModal){event.preventDefault();closeModal(activeModal);return;}
  const drawer=document.querySelector("#mobile-drawer");
  const root=activeModal||(drawer&&!drawer.hidden?drawer.querySelector(".drawer-panel"):null);
  if(event.key==="Tab"&&root){const items=focusables(root);if(!items.length)return;const first=items[0],last=items[items.length-1];if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}}
  if(activeModal&&activeModal.id==="gallery-lightbox"&&["ArrowLeft","ArrowRight"].includes(event.key)){event.preventDefault();updateLightbox(lightboxIndex+(event.key==="ArrowRight"?1:-1));return;}
  const tab=event.target.closest&&event.target.closest("[role='tab'][data-service-tab]");
  if(tab&&["ArrowLeft","ArrowRight","Home","End"].includes(event.key)){const tabs=Array.from(document.querySelectorAll("[role='tab'][data-service-tab]"));let index=tabs.indexOf(tab);if(event.key==="Home")index=0;else if(event.key==="End")index=tabs.length-1;else index=(index+(event.key==="ArrowRight"?1:-1)+tabs.length)%tabs.length;event.preventDefault();tabs[index].focus();tabs[index].click();}
});
addEventListener("resize",renderGallery);
renderGallery();
loadReviews();
loadHomeAvailability();
