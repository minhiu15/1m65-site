import "./booking-v2.js";

const API = "https://aomiaszicxqrctcgeoms.supabase.co/functions/v1/booking-api";
const TZ = "Asia/Ho_Chi_Minh";
const gallery = [
["nail","assets/gallery/photos/pink-galaxy.jpg","Pink Galaxy"],
["nail","assets/gallery/photos/hello-kitty-3d-bow.jpg","Hello Kitty 3D"],
["nail","assets/gallery/photos/hello-kitty-pastel-stars.jpg","Hello Kitty Pastel"],
["nail","assets/gallery/photos/starlight-glow.jpg","Starlight Glow"],
["nail","assets/gallery/photos/cute-bear-white.jpg","Cute Bear"],
["nail","assets/gallery/photos/pink-coquette.jpg","Pink Coquette"],
["nail","assets/gallery/photos/bold-personality.jpg","Nail cá tính"],
["nail","assets/gallery/photos/snow-dream.jpg","Snow Dream"],
["nail","assets/gallery/photos/red-charming.jpg","Red Charming"],
["nail","assets/gallery/photos/snow-crystal.jpg","Snow Crystal"],
["nail","assets/gallery/photos/aurora-lilac.jpg","Aurora Lilac"],
["nail","assets/gallery/photos/pearl-ribbon.jpg","Pearl Ribbon"],
["nail","assets/gallery/photos/white-starlight.jpg","White Starlight"],
["nail","assets/gallery/photos/ice-crystal.jpg","Ice Crystal"],
["nail","assets/gallery/photos/pure-white.jpg","Pure White"],
["nail","assets/gallery/photos/pearl-glow.jpg","Pearl Glow"],
["nail","assets/gallery/photos/pink-starlight.jpg","Pink Starlight"],
["mi","assets/services/signature-shared/service_photos/noi_mi_classic.jpg","Nối mi Classic"],
["khac","assets/about/photos/salon-corner.jpg","Một góc nhỏ trong tiệm"],
["khac","assets/about/photos/nail-technician.jpg","Thợ nail tại 1M65"]
];
const fallbackReviews = [
["Mình sợ nhất là thợ nói nhiều. Ở đây chị ấy chỉ hỏi một câu rồi im lặng làm suốt hai tiếng. Tuyệt vời.","Thu Hà","Nail Hàn trong veo"],
["Đặt nail mèo cho ngày cưới. Mẹ mình khóc — không rõ vì cảm động hay vì mười ngón tay mười con mèo.","Minh Châu","Nail mèo · vẽ tay"],
["Ba tuần rồi vẫn chưa bong một góc nào. Và Nhu Nhi ngủ trên chân mình cả buổi, tính thêm phí được không?","Lan Vy","Sơn gel cơ bản"],
["Gội đầu dưỡng sinh xong mình ngủ quên mất hai mươi phút. Chị Hạnh để yên cho mình ngủ, không đánh thức.","Bảo Trâm","Gội đầu dưỡng sinh"],
["Đi nhiều tiệm rồi mới thấy: ở đây người ta hỏi mình muốn gì trước khi cầm cọ lên. Nhỏ thôi mà quý.","Ngọc Ánh","French tip"]
];
let galleryFilter = "all";
let lightboxIndex = 0;
let reviewItems = fallbackReviews;
let reviewIndex = 0;
let reviewTimer = 0;
let reviewWrapTimer = 0;
let reviewResizeTimer = 0;
let reviewPaused = false;
let reviewInView = true;
let reviewObserver = null;
let activeModal = null;
let returnFocus = null;
const modalStack = [];
let lastInputWasPointer = false;
let toastTimer = 0;
const REVIEW_AUTOPLAY_MS = 3600;
const REVIEW_TRANSITION_MS = 620;
const reviewMotion = matchMedia("(prefers-reduced-motion: reduce)");

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
function focusReturnedControl(focusTarget) {
  if (!focusTarget || !focusTarget.isConnected) return;
  if (lastInputWasPointer) {
    const focusOwner = focusTarget.closest(".service-card[data-card-variant='signature']");
    const suppressed = [focusTarget, focusOwner].filter(Boolean);
    suppressed.forEach(function(node){node.classList.add("is-pointer-focus-return");});
    focusTarget.addEventListener("blur",function(){suppressed.forEach(function(node){node.classList.remove("is-pointer-focus-return");});},{once:true});
  }
  focusTarget.focus();
}
function rootReturnFocus() {
  return modalStack.length ? modalStack[0].returnFocus : returnFocus;
}
function openModal(modal, trigger, options) {
  if (!modal) return;
  const stackCurrent = Boolean(options && options.stackCurrent);
  if (activeModal && activeModal !== modal) {
    if (stackCurrent) {
      modalStack.push({ modal: activeModal, returnFocus: returnFocus });
      activeModal.hidden = true;
    } else {
      closeModal(activeModal, false);
    }
  }
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
  if (target !== activeModal) return;
  const focusTarget = returnFocus;
  if (restore !== false && modalStack.length) {
    const galleryIndex = focusTarget && focusTarget.dataset ? focusTarget.dataset.galleryIndex : "";
    const previous = modalStack.pop();
    activeModal = previous.modal;
    returnFocus = previous.returnFocus;
    activeModal.hidden = false;
    document.body.classList.add("has-overlay");
    const restoredFocus = focusTarget && focusTarget.isConnected
      ? focusTarget
      : (galleryIndex ? activeModal.querySelector('[data-gallery-index="'+galleryIndex+'"]') : null);
    focusReturnedControl(restoredFocus);
    return;
  }
  activeModal = null;
  if (restore === false) {
    modalStack.splice(0).forEach(function(entry){entry.modal.hidden = true;});
  }
  document.body.classList.remove("has-overlay");
  if (restore !== false) focusReturnedControl(focusTarget);
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
  return '<button type="button" class="gallery-tile" data-gallery-index="'+index+'" aria-label="Xem lớn: '+esc(item[2])+'"><img src="'+esc(item[1])+'" alt="" loading="lazy" decoding="async"><span class="sr-only">'+esc(item[2])+'</span></button>';
}
function galleryEmptyState() {
  return '<div class="gallery-empty" role="status"><picture class="gallery-empty__art" aria-hidden="true"><source srcset="assets/gallery/empty/gallery-empty-polaroids.webp" type="image/webp"><img src="assets/gallery/empty/gallery-empty-polaroids.png" alt="" loading="lazy" decoding="async"></picture><h3>Chưa có ảnh ở mục này</h3><p>Tụi mình đang chuẩn bị những khoảnh khắc xinh<br>để chia sẻ cùng bạn. Ghé lại sau nhé ♡</p></div>';
}
function filteredGallery() {
  return gallery.filter(function(item){return galleryFilter === "all" || item[0] === galleryFilter;});
}
function renderGallery() {
  document.querySelectorAll("[data-gallery-filter],[data-gallery-modal-filter]").forEach(function(button){
    const active = (button.dataset.galleryFilter || button.dataset.galleryModalFilter) === galleryFilter;
    button.classList.toggle("is-active",active);
    button.setAttribute("aria-pressed",String(active));
  });
  const items = filteredGallery();
  const count = initialGalleryCount();
  const main = document.querySelector("[data-gallery-grid]");
  const full = document.querySelector("[data-gallery-modal-grid]");
  const more = document.querySelector("[data-open-gallery]");
  const hint = document.querySelector("[data-gallery-hint]");
  const empty = items.length === 0;
  const emptyMarkup = empty ? galleryEmptyState() : "";
  if (main) {
    main.classList.toggle("is-empty",empty);
    main.innerHTML = empty ? emptyMarkup : items.slice(0,count).map(tile).join("");
  }
  if (full) {
    full.classList.toggle("is-empty",empty);
    full.innerHTML = empty ? emptyMarkup : items.map(tile).join("");
  }
  if (more) more.hidden = items.length <= count;
  if (hint) hint.hidden = items.length === 0;
  if (more && more.parentElement) more.parentElement.hidden = empty;
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
  openModal(document.querySelector("#gallery-lightbox"), trigger, { stackCurrent: Boolean(trigger && trigger.closest("#gallery-modal")) });
}
function reviewVisibleCount() {
  if (innerWidth <= 600) return 1;
  if (innerWidth <= 1180) return 2;
  return 4;
}
function reviewCard(review, index, clone) {
  const quoteAsset = "assets/reviews/01_stat_star_LOCKED.webp";
  const tone = index % 5;
  const stars = new Array(5).fill('<img src="assets/reviews/08_rating_star_filled_LOCKED_CLEAN.webp" alt="" decoding="async" loading="lazy">').join("");
  return '<article class="review-card review-card--tone-'+(tone+1)+'" data-review-card role="group" aria-roledescription="slide" aria-label="Đánh giá '+(index+1)+' trên '+reviewItems.length+'"'+(clone?' aria-hidden="true"':'')+'><img class="review-card__quote" src="'+quoteAsset+'" alt="" aria-hidden="true" decoding="async" loading="lazy"><p class="review-card__text">“'+esc(review[0])+'”</p><div class="review-card__rating stars" aria-label="5 trên 5 sao">'+stars+'</div><p class="review-card__author">— '+esc(review[1])+'<small>'+esc(review[2])+'</small></p></article>';
}
function positionReviewCarousel(animate) {
  const track = document.querySelector("[data-review-track]");
  const card = track && track.querySelector("[data-review-card]");
  if (!track || !card) return;
  const computed = getComputedStyle(track);
  const gap = parseFloat(computed.columnGap || computed.gap) || 0;
  track.classList.toggle("is-snapping", !animate);
  track.style.transform = "translate3d("+(-reviewIndex*(card.getBoundingClientRect().width+gap))+"px,0,0)";
  if (!animate) {
    track.getBoundingClientRect();
    requestAnimationFrame(function(){
      requestAnimationFrame(function(){track.classList.remove("is-snapping");});
    });
  }
}
function advanceReview() {
  if (reviewItems.length <= reviewVisibleCount()) return;
  clearTimeout(reviewWrapTimer);
  reviewIndex += 1;
  positionReviewCarousel(true);
  if (reviewIndex >= reviewItems.length) {
    reviewWrapTimer = setTimeout(function(){
      reviewIndex = 0;
      positionReviewCarousel(false);
    }, REVIEW_TRANSITION_MS + 40);
  }
}
function scheduleReviewAutoplay() {
  clearTimeout(reviewTimer);
  if (reviewMotion.matches || reviewPaused || !reviewInView || document.hidden || reviewItems.length <= reviewVisibleCount()) return;
  reviewTimer = setTimeout(function(){
    advanceReview();
    scheduleReviewAutoplay();
  }, REVIEW_AUTOPLAY_MS);
}
function setupReviewCarousel(grid) {
  if (!grid.dataset.reviewCarouselBound) {
    grid.dataset.reviewCarouselBound = "true";
    grid.addEventListener("mouseenter",function(){reviewPaused=true;scheduleReviewAutoplay();});
    grid.addEventListener("mouseleave",function(){reviewPaused=false;scheduleReviewAutoplay();});
    grid.addEventListener("focusin",function(){reviewPaused=true;scheduleReviewAutoplay();});
    grid.addEventListener("focusout",function(event){if(!grid.contains(event.relatedTarget)){reviewPaused=false;scheduleReviewAutoplay();}});
  }
  if (!reviewObserver && "IntersectionObserver" in window) {
    reviewObserver = new IntersectionObserver(function(entries){
      reviewInView = Boolean(entries[0] && entries[0].isIntersecting);
      scheduleReviewAutoplay();
    },{rootMargin:"120px 0px"});
    reviewObserver.observe(grid);
  }
}
function renderReviews(reviews) {
  const grid = document.querySelector("[data-review-grid]");
  if (!grid) return;
  reviewItems = reviews.length ? reviews : fallbackReviews;
  reviewIndex = 0;
  clearTimeout(reviewWrapTimer);
  const cloneCount = Math.min(4,reviewItems.length);
  const cards = reviewItems.map(function(review,index){return reviewCard(review,index,false);});
  const clones = reviewItems.slice(0,cloneCount).map(function(review,index){return reviewCard(review,index,true);});
  grid.setAttribute("role","region");
  grid.setAttribute("aria-roledescription","carousel");
  grid.setAttribute("aria-label","Đánh giá của khách hàng");
  grid.innerHTML = '<div class="reviews-track is-snapping" data-review-track>'+cards.concat(clones).join("")+'</div>';
  setupReviewCarousel(grid);
  requestAnimationFrame(function(){positionReviewCarousel(false);scheduleReviewAutoplay();});
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
  const openGallery=target.closest("[data-open-gallery]");if(openGallery){renderGallery();openModal(document.querySelector("#gallery-modal"),openGallery);return;}
  const filter=target.closest("[data-gallery-filter],[data-gallery-modal-filter]");if(filter){galleryFilter=filter.dataset.galleryFilter||filter.dataset.galleryModalFilter;renderGallery();return;}
  const galleryTile=target.closest("[data-gallery-index]");if(galleryTile){openLightbox(Number(galleryTile.dataset.galleryIndex),galleryTile);return;}
  if(target.closest("[data-lightbox-prev]")){updateLightbox(lightboxIndex-1);return;}
  if(target.closest("[data-lightbox-next]")){updateLightbox(lightboxIndex+1);return;}
  const galleryBook=target.closest("[data-gallery-book]");if(galleryBook){const origin=rootReturnFocus()||galleryBook;closeModal(document.querySelector("#gallery-modal"),false);window.__v2Booking.open({},origin);return;}
  const lightboxBook=target.closest("[data-lightbox-book]");if(lightboxBook){const origin=rootReturnFocus()||lightboxBook;closeModal(document.querySelector("#gallery-lightbox"),false);window.__v2Booking.open({},origin);return;}
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
addEventListener("resize",function(){
  renderGallery();
  clearTimeout(reviewResizeTimer);
  reviewResizeTimer = setTimeout(function(){positionReviewCarousel(false);scheduleReviewAutoplay();},120);
});
document.addEventListener("visibilitychange",scheduleReviewAutoplay);
if (reviewMotion.addEventListener) reviewMotion.addEventListener("change",scheduleReviewAutoplay);
renderGallery();
loadReviews();
loadHomeAvailability();
