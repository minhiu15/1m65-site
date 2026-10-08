import "./booking-v2.js?v=20261006-1";

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
["mi","assets/services/signature-shared/service_photos/noi_mi_classic.jpg","Nối mi Classic"]
];
// The salon's real five-star reviews on Google Maps (sent by the owner on 2026-10-03; spelling and shorthand tidied,
// meaning and reviewer names kept). google-reviews.json replaces them once the Business Profile sync is approved.
const fallbackReviews = [
["Lần đầu đi thử tiệm mà phải wow luôn á, đi làm nail mà thấy như đi chơi với bạn thân vậy, chị chủ dễ thương cực. Tư vấn kỹ, làm việc chuyên nghiệp, kết quả thì siêu ưng. Tiệm uy tín số 1 trong lòng mình.","Lê Nguyễn Anh Thư","Làm móng tay"],
["Tiệm này có chị chủ dễ thương, làm kỹ càng, tỉ mỉ lắm luôn á. Không gian tiệm sạch sẽ, ngăn nắp, bữa mình đi chị còn bật nguyên playlist tủ của mình nữa =)))) mê.","An Khuê","Làm móng tay"],
["Lần đầu trải nghiệm mà ưng lắm ạ. Nail đẹp, dụng cụ xịn xò, chị chủ dễ thương vô cùng luôn, lần sau sẽ ủng hộ tiếp 🥰","Diễm My","Làm móng tay"],
["Chị chủ dễ thương, làm tỉ mỉ, làm xong nhìn ưng quá chừng, ăn Tết ngon luôn. Cảm ơn chị chủ, chúc chị có thật nhiều khách nha 😍😍","Lan Thùy","Làm móng tay"],
["Mọi người ủng hộ chị chủ xinh đẹp nhé! Chị chủ dễ thương lắm, nhiệt tình, nail chị làm đẹp lắm ạ! 100 điểm 💕💕","Thảo Trần","Đánh giá trên Google"],
["Chị chủ siêu dễ thương, nhiệt tình, chu đáo. Quay lại nhiều lần rồi, rất ưng.","Phương Truc","Làm móng tay"],
["Chất lượng dịch vụ tốt, gội đầu massage rất thích.","Oanh Hoang","Đánh giá trên Google"],
["Chị chủ dễ thương, tư vấn nhiệt tình.","Linh Trương","Làm móng tay"],
["Đẹp, ưng lắm nha 👍😍","Phuong Le","Đánh giá trên Google"],
["Dễ thương lắm nha.","Thư Kim","Đánh giá trên Google"]
];
let galleryFilter = "nail";
// The full Gallery popup keeps its own tab: it opens on the page's tab, then changing it leaves the page alone.
let galleryModalFilter = "nail";
let lightboxFilter = "nail";
let lightboxIndex = 0;
let reviewItems = fallbackReviews;
let reviewIndex = 1;
let reviewTimer = 0;
let reviewWrapTimer = 0;
let reviewResizeTimer = 0;
let reviewPaused = false;
let reviewInView = true;
let reviewObserver = null;
let activeModal = null;
let returnFocus = null;
let returnFocusWasPointer = false;
const modalStack = [];
let lastInputWasPointer = false;
let toastTimer = 0;
const REVIEW_AUTOPLAY_MS = 3600;
const REVIEW_TRANSITION_MS = 620;
const reviewMotion = matchMedia("(prefers-reduced-motion: reduce)");

document.addEventListener("pointerdown",function(){lastInputWasPointer=true;},true);
// iOS Safari only applies :active (the pressed look below) while some touchstart listener exists.
document.addEventListener("touchstart",function(){},{passive:true});
document.addEventListener("keydown",function(){
  lastInputWasPointer=false;
},true);

function esc(value) {
  return String(value == null ? "" : value).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;");
}
function focusables(root) {
  return Array.from(root.querySelectorAll("a[href],button:not([disabled]),input:not([disabled]),textarea:not([disabled]),iframe,[tabindex]:not([tabindex='-1'])")).filter(function(node){return !node.closest("[hidden],[inert]") && node.getAttribute("aria-hidden") !== "true";});
}
function setOverlayOpen(open) {
  const scrollLeft = window.scrollX;
  const scrollTop = window.scrollY;
  if (open) document.body.classList.add("has-overlay");
  else document.body.classList.remove("has-overlay");
  const previousBehavior = document.documentElement.style.scrollBehavior;
  document.documentElement.style.scrollBehavior = "auto";
  window.scrollTo(scrollLeft, scrollTop);
  document.documentElement.style.scrollBehavior = previousBehavior;
}
function focusReturnedControl(focusTarget, openedWithPointer) {
  if (!focusTarget || !focusTarget.isConnected) return;
  if (openedWithPointer) {
    const focusOwner = focusTarget.closest(".service-card[data-card-variant='signature']");
    const suppressed = [focusTarget, focusOwner].filter(Boolean);
    suppressed.forEach(function(node){node.classList.add("is-pointer-focus-return");});
    focusTarget.addEventListener("blur",function(){suppressed.forEach(function(node){node.classList.remove("is-pointer-focus-return");});},{once:true});
  }
  focusTarget.focus({ preventScroll: true });
}
function rootReturnFocus() {
  return modalStack.length ? modalStack[0].returnFocus : returnFocus;
}
function openModal(modal, trigger, options) {
  if (!modal) return;
  const stackCurrent = Boolean(options && options.stackCurrent);
  if (activeModal && activeModal !== modal) {
    if (stackCurrent) {
      modalStack.push({ modal: activeModal, returnFocus: returnFocus, returnFocusWasPointer: returnFocusWasPointer });
      activeModal.hidden = true;
    } else {
      closeModal(activeModal, false);
    }
  }
  activeModal = modal;
  returnFocus = trigger || document.activeElement;
  returnFocusWasPointer = lastInputWasPointer;
  modal.hidden = false;
  setOverlayOpen(true);
  requestAnimationFrame(function(){(modal.querySelector(".modal-close") || focusables(modal)[0] || modal).focus({ preventScroll: true });});
}
// A modal may hold back a close the visitor asked for (X, backdrop, Escape): the booking ticket first asks
// whether to save its bill. Closes the page makes itself (opening another modal) are not held.
function requestClose(modal){if(modal&&typeof modal.holdClose==="function"&&modal.holdClose())return;closeModal(modal);}
function closeModal(modal, restore) {
  const target = modal || activeModal;
  if (!target) return;
  target.hidden = true;
  if (target !== activeModal) return;
  const focusTarget = returnFocus;
  const openedWithPointer = returnFocusWasPointer;
  if (restore !== false && modalStack.length) {
    const galleryIndex = focusTarget && focusTarget.dataset ? focusTarget.dataset.galleryIndex : "";
    const previous = modalStack.pop();
    activeModal = previous.modal;
    returnFocus = previous.returnFocus;
    returnFocusWasPointer = previous.returnFocusWasPointer;
    activeModal.hidden = false;
    setOverlayOpen(true);
    const restoredFocus = focusTarget && focusTarget.isConnected
      ? focusTarget
      : (galleryIndex ? activeModal.querySelector('[data-gallery-index="'+galleryIndex+'"]') : null);
    focusReturnedControl(restoredFocus, openedWithPointer);
    return;
  }
  activeModal = null;
  if (restore === false) {
    modalStack.splice(0).forEach(function(entry){entry.modal.hidden = true;});
  }
  setOverlayOpen(false);
  if (restore !== false) focusReturnedControl(focusTarget, openedWithPointer);
  returnFocus = null;
  returnFocusWasPointer = false;
}
function toast(message) {
  const node = document.querySelector("[data-toast]");
  if (!node) return;
  clearTimeout(toastTimer);
  node.textContent = message;
  node.hidden = false;
  toastTimer = setTimeout(function(){node.hidden = true;}, 3200);
}
// The call-or-Zalo popup the "Xem lịch của bạn" page opens on phones: a native <dialog> over a black backdrop. It
// closes on its backdrop, on Escape (kept from also closing the popup underneath), on "Để sau", or after a choice.
const contactDialog = document.querySelector("[data-contact-dialog]");
if (contactDialog) {
  contactDialog.addEventListener("click", function(event){ if (event.target === contactDialog || event.target.closest("[data-contact-close], .contact-dialog__option")) contactDialog.close(); });
  contactDialog.addEventListener("keydown", function(event){ if (event.key === "Escape") event.stopPropagation(); });
}
function openContact() { if (contactDialog && contactDialog.showModal) contactDialog.showModal(); return Boolean(contactDialog); }
window.__v2Experience = { openModal: openModal, closeModal: closeModal, toast: toast, esc: esc, gallery: gallery, galleryThumb: galleryThumb, openContact: openContact };

function initialGalleryCount() {
  return matchMedia("(max-width: 600px)").matches ? 6 : 10;
}
// Grid tiles show thumbnails (scripts/make-gallery-thumbs.mjs): the original photos, decoded at tile size, made
// phones re-decode them and blink while scrolling, and made switching tabs stutter. The lightbox opens the original.
function galleryThumb(src, width) {
  return "assets/gallery/thumbs/" + src.split("/").pop().replace(/\.\w+$/, "-" + width + ".webp");
}
function tile(item, index) {
  const small = esc(galleryThumb(item[1], 480)), large = esc(galleryThumb(item[1], 800));
  return '<button type="button" class="gallery-tile" data-gallery-index="'+index+'" aria-label="Xem lớn: '+esc(item[2])+'"><img src="'+small+'" srcset="'+small+' 480w, '+large+' 800w" sizes="(max-width: 600px) 40vw, 300px" alt="" loading="lazy" decoding="async"><span class="sr-only">'+esc(item[2])+'</span></button>';
}
function galleryEmptyState() {
  return '<div class="gallery-empty" role="status"><picture class="gallery-empty__art" aria-hidden="true"><source srcset="assets/gallery/empty/gallery-empty-polaroids.webp" type="image/webp"><img src="assets/gallery/empty/gallery-empty-polaroids.png" alt="" decoding="async"></picture><h3>Chưa có ảnh ở mục này</h3><p>Tụi mình đang chuẩn bị những khoảnh khắc xinh<br>để chia sẻ cùng bạn. Ghé lại sau nhé ♡</p></div>';
}
function filteredGallery(filter) {
  return gallery.filter(function(item){return item[0] === (filter || galleryFilter);});
}
// Each grid keeps the tiles it has built, per tab: switching back, or a resize (phones fire one whenever the address
// bar slides away while scrolling), reuses the same img elements, so photos never go blank and re-decode.
const galleryTiles = new Map();
function fillGalleryGrid(grid, key, empty, markup) {
  grid.classList.toggle("is-empty", empty);
  if (grid.dataset.galleryKey === key) return;
  let nodes = galleryTiles.get(key);
  if (!nodes) {
    const holder = document.createElement("template");
    holder.innerHTML = empty ? galleryEmptyState() : markup();
    nodes = Array.from(holder.content.childNodes);
    galleryTiles.set(key, nodes);
  }
  grid.replaceChildren.apply(grid, nodes);
  grid.dataset.galleryKey = key;
}
function renderGallery() {
  document.querySelectorAll("[data-gallery-filter],[data-gallery-modal-filter]").forEach(function(button){
    const active = button.dataset.galleryFilter ? button.dataset.galleryFilter === galleryFilter : button.dataset.galleryModalFilter === galleryModalFilter;
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
  if (main) fillGalleryGrid(main, "main|" + galleryFilter + "|" + count, empty, function(){ return items.slice(0,count).map(tile).join(""); });
  // The popup's grid is filled when the popup is open (opening it renders the gallery again).
  const modalItems = filteredGallery(galleryModalFilter);
  if (full && !(full.closest(".modal") || {}).hidden) fillGalleryGrid(full, "full|" + galleryModalFilter, modalItems.length === 0, function(){ return modalItems.map(tile).join(""); });
  if (more) more.hidden = items.length <= count;
  if (hint) hint.hidden = items.length === 0;
  if (more && more.parentElement) more.parentElement.hidden = empty;
}
// The lightbox opens on the picture the page already shows (the gallery tile, the card or About photo), then swaps in
// the full photo once it has loaded and decoded, so it never sits on a blank white panel while the photo downloads.
let lightboxLoad = 0;
function showLightboxImage(src, alt, placeholder) {
  const image = document.querySelector("[data-lightbox-image]");
  if (!image || !src) return;
  const load = ++lightboxLoad;
  image.alt = alt || "";
  image.style.width = image.style.height = "";
  image.src = placeholder || src;
  if (!placeholder || placeholder === src) return;
  // The placeholder is smaller than the photo, so on its own it would show small and then jump: it is drawn at the
  // size the photo takes, the largest that fits the figure (.lightbox-figure img: max-height min(820px, 100% - 34px)).
  image.decode().catch(function(){}).then(function(){
    const figure = image.parentElement;
    if (load !== lightboxLoad || !image.naturalWidth || !figure) return;
    const scale = Math.min(figure.clientWidth / image.naturalWidth, Math.min(820, figure.clientHeight - 34) / image.naturalHeight);
    image.style.width = Math.floor(image.naturalWidth * scale) + "px";
    image.style.height = Math.floor(image.naturalHeight * scale) + "px";
  });
  const full = new Image();
  full.src = src;
  full.decode().catch(function(){}).then(function(){
    if (load !== lightboxLoad) return;
    image.src = src;
    image.style.width = image.style.height = "";
  });
}
function shownPicture(element) {
  return element && element.complete && element.naturalWidth ? element.currentSrc : "";
}
function updateLightbox(index) {
  const items = filteredGallery(lightboxFilter);
  if (!items.length) return;
  lightboxIndex = (index + items.length) % items.length;
  const item = items[lightboxIndex];
  const caption = document.querySelector("[data-lightbox-caption]");
  const small = galleryThumb(item[1], 480);
  showLightboxImage(item[1], item[2], shownPicture(document.querySelector('.gallery-tile img[src="' + small + '"]')) || small);
  if (caption) caption.textContent = item[2];
}
function openLightbox(index, trigger) {
  const modal = document.querySelector("#gallery-lightbox");
  if (modal) delete modal.dataset.single;
  lightboxFilter = trigger && trigger.closest("#gallery-modal") ? galleryModalFilter : galleryFilter;
  updateLightbox(index);
  openModal(modal, trigger, { stackCurrent: Boolean(trigger && trigger.closest("#gallery-modal")) });
}
/* A service photo opens in the same lightbox, minus the gallery prev/next. */
function openPhotoZoom(src, caption, trigger) {
  const modal = document.querySelector("#gallery-lightbox");
  const image = document.querySelector("[data-lightbox-image]");
  const captionNode = document.querySelector("[data-lightbox-caption]");
  if (!modal || !image || !src) return;
  modal.dataset.single = "true";
  const picture = trigger && trigger.closest("figure, .service-photo-wrap");
  showLightboxImage(src, caption, shownPicture(picture && picture.querySelector("img:not([aria-hidden])")));
  if (captionNode) captionNode.textContent = caption || "";
  openModal(modal, trigger);
}
function reviewVisibleCount() {
  if (innerWidth <= 600) return 2;
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
  const vertical = innerWidth <= 600;
  const gap = parseFloat((vertical ? computed.rowGap : computed.columnGap) || computed.gap) || 0;
  const cardRect = card.getBoundingClientRect();
  const preview = vertical ? parseFloat(getComputedStyle(track.parentElement).getPropertyValue("--review-carousel-preview")) || 0 : 0;
  const offset = -reviewIndex * ((vertical ? cardRect.height : cardRect.width) + gap) + preview;
  track.classList.toggle("is-snapping", !animate);
  track.style.transform = vertical ? "translate3d(0,"+offset+"px,0)" : "translate3d("+offset+"px,0,0)";
  if (!animate) {
    track.getBoundingClientRect();
    requestAnimationFrame(function(){
      requestAnimationFrame(function(){track.classList.remove("is-snapping");});
    });
  }
}
function moveReview(direction) {
  if (reviewItems.length <= reviewVisibleCount()) return;
  clearTimeout(reviewWrapTimer);
  reviewIndex += direction;
  positionReviewCarousel(true);
  const wrappedIndex = direction > 0 ? 1 : reviewItems.length;
  if ((direction > 0 && reviewIndex >= reviewItems.length + 1) || (direction < 0 && reviewIndex <= 0)) {
    reviewWrapTimer = setTimeout(function(){
      reviewIndex = wrappedIndex;
      positionReviewCarousel(false);
    }, REVIEW_TRANSITION_MS + 40);
  }
}
function advanceReview() {
  moveReview(1);
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
  reviewIndex = 1;
  clearTimeout(reviewWrapTimer);
  const cloneCount = Math.min(4,reviewItems.length);
  const leadingClone = reviewCard(reviewItems[reviewItems.length-1],reviewItems.length-1,true);
  const cards = reviewItems.map(function(review,index){return reviewCard(review,index,false);});
  const clones = reviewItems.slice(0,cloneCount).map(function(review,index){return reviewCard(review,index,true);});
  grid.setAttribute("role","region");
  grid.setAttribute("aria-roledescription","carousel");
  grid.setAttribute("aria-label","Đánh giá của khách hàng");
  grid.innerHTML = '<div class="reviews-track is-snapping" data-review-track>'+[leadingClone].concat(cards,clones).join("")+'</div>';
  setupReviewCarousel(grid);
  requestAnimationFrame(function(){positionReviewCarousel(false);scheduleReviewAutoplay();});
}
async function loadReviews() {
  renderReviews(fallbackReviews);
  try {
    const response = await fetch("google-reviews.json",{cache:"no-store"});
    if (!response.ok) return;
    const data = await response.json();
    const reviews = Array.isArray(data.reviews) ? data.reviews.filter(function(review){return Number(review.rating)===5 && String(review.text||"").trim();}).map(function(review){return [String(review.text).trim(),String(review.name||"Khách hàng Google"),"Google · 5 sao"];}) : [];
    if (reviews.length) renderReviews(reviews);
    const average = Number(data.averageRating), total = Number(data.totalReviewCount);
    const averageNode = document.querySelector("[data-review-average]"), totalNode = document.querySelector("[data-review-total]");
    if (averageNode && Number.isFinite(average)) averageNode.innerHTML = esc(average.toLocaleString("vi-VN",{minimumFractionDigits:1,maximumFractionDigits:1}))+"<small>/5</small>";
    // The Google review count sits in the rating's label, "Điểm trên Google (N đánh giá)".
    if (totalNode && Number.isFinite(total)) totalNode.textContent = total.toLocaleString("vi-VN");
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
// The manager is a page of its own in an iframe; the popup shows a loading paw over it until that page loads.
function openManager(reference,trigger) {
  const frame = document.querySelector("[data-manager-frame]");
  if (frame) {const query=new URLSearchParams({embed:"1",view:"v2",v:"20261008-1"});if(reference)query.set("reference",reference);const panel=frame.parentElement;panel.classList.add("is-loading");frame.addEventListener("load",function(){panel.classList.remove("is-loading");},{once:true});frame.src="manage-booking.html?"+query.toString();}
  openModal(document.querySelector("#manager-modal"),trigger);
}
window.__v2Experience.openManager = openManager;
// manage-booking.js calls this once its page is ready, before its pictures finish loading.
window.__v2Experience.managerReady = function(){const frame=document.querySelector("[data-manager-frame]");if(frame)frame.parentElement.classList.remove("is-loading");};

document.addEventListener("click",function(event){
  const target=event.target;
  const close=target.closest("[data-close-modal]");if(close)return requestClose(close.closest(".modal"));
  const openGallery=target.closest("[data-open-gallery]");if(openGallery){galleryModalFilter=galleryFilter;openModal(document.querySelector("#gallery-modal"),openGallery);renderGallery();return;}
  const filter=target.closest("[data-gallery-filter],[data-gallery-modal-filter]");if(filter){if(filter.dataset.galleryFilter)galleryFilter=filter.dataset.galleryFilter;else galleryModalFilter=filter.dataset.galleryModalFilter;renderGallery();return;}
  const photoZoom=target.closest("[data-photo-zoom]");if(photoZoom){openPhotoZoom(photoZoom.dataset.photoZoom,photoZoom.dataset.photoZoomCaption,photoZoom);return;}
  const galleryTile=target.closest("[data-gallery-index]");if(galleryTile){openLightbox(Number(galleryTile.dataset.galleryIndex),galleryTile);return;}
  if(target.closest("[data-lightbox-prev]")){updateLightbox(lightboxIndex-1);return;}
  if(target.closest("[data-lightbox-next]")){updateLightbox(lightboxIndex+1);return;}
  if(target.closest("[data-review-prev]")){moveReview(-1);scheduleReviewAutoplay();return;}
  if(target.closest("[data-review-next]")){moveReview(1);scheduleReviewAutoplay();return;}
  const galleryBook=target.closest("[data-gallery-book]");if(galleryBook){const origin=rootReturnFocus()||galleryBook;closeModal(document.querySelector("#gallery-modal"),false);window.__v2Booking.open({defer:true},origin);return;}
  const lightboxBook=target.closest("[data-lightbox-book]");if(lightboxBook){const origin=rootReturnFocus()||lightboxBook;closeModal(document.querySelector("#gallery-lightbox"),false);window.__v2Booking.open({defer:true},origin);return;}
  const faq=target.closest("[data-faq-list] button");if(faq){const expanded=faq.getAttribute("aria-expanded")==="true";faq.setAttribute("aria-expanded",String(!expanded));return;}
  const manager=target.closest("[data-open-manager]");if(manager)openManager("",manager);
});
document.addEventListener("1m65:v2:open-booking",function(event){window.__v2Booking.open(Object.assign({defer:true},event.detail),document.activeElement);});
document.addEventListener("keydown",function(event){
  if(event.key==="Escape"&&activeModal){event.preventDefault();requestClose(activeModal);return;}
  const drawer=document.querySelector("#mobile-drawer");
  const root=activeModal||(drawer&&!drawer.hidden?drawer.querySelector(".drawer-panel"):null);
  if(event.key==="Tab"&&root){const items=focusables(root);if(!items.length)return;const first=items[0],last=items[items.length-1];if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}}
  if(activeModal&&activeModal.id==="gallery-lightbox"&&!activeModal.dataset.single&&["ArrowLeft","ArrowRight"].includes(event.key)){event.preventDefault();updateLightbox(lightboxIndex+(event.key==="ArrowRight"?1:-1));return;}
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
window.init1m65FooterMap?.(document.querySelector("[data-footer-map]"));
renderGallery();
// Once the page is idle, fetch and decode what the other gallery tabs show first (their thumbnails, the empty-tab
// art), so the first switch to another tab shows its pictures at once.
const galleryPreload = [];
(window.requestIdleCallback || function(run){ setTimeout(run, 1500); })(function(){
  const count = initialGalleryCount(), art = new Image();
  art.src = "assets/gallery/empty/gallery-empty-polaroids.webp";
  galleryPreload.push(art);
  ["nail", "mi", "khac"].filter(function(id){ return id !== galleryFilter; }).forEach(function(id){
    gallery.filter(function(item){ return item[0] === id; }).slice(0, count).forEach(function(item){
      const image = new Image(), small = galleryThumb(item[1], 480);
      image.sizes = "(max-width: 600px) 40vw, 300px";
      image.srcset = small + " 480w, " + galleryThumb(item[1], 800) + " 800w";
      image.src = small;
      galleryPreload.push(image);
    });
  });
  galleryPreload.forEach(function(image){ image.decode().catch(function(){}); });
});
loadReviews();
loadHomeAvailability();

// A tap on plain content closes the phone keyboard: iOS keeps a field focused after such a tap.
document.addEventListener("pointerdown",function(event){
  const active=document.activeElement;
  if(!active||!active.matches("input, textarea, select, [contenteditable='true']"))return;
  if(event.target.closest("input, textarea, select, label, button, a, [contenteditable='true']"))return;
  active.blur();
},true);

// One pill per tab bar glides to the chosen tab (Services, the page Gallery and its popup) instead of jumping. It is
// placed on the active tab's own pill and copies its look, so every breakpoint keeps its sizing.
function syncTabSlider(bar,animate){
  const active=bar.querySelector(":scope > .is-active");if(!active)return;
  let pill=bar.querySelector(":scope > .tab-slider");
  if(!pill){pill=document.createElement("span");pill.className="tab-slider";pill.setAttribute("aria-hidden","true");bar.append(pill);animate=false;}
  // Only when missing: classList.add rewrites the attribute even if the class is there, and the observer below
  // would then resync every frame, forcing a layout each time (it ran for good on every bar).
  if(!bar.classList.contains("has-tab-slider"))bar.classList.add("has-tab-slider");
  const shell=getComputedStyle(active,"::before"),box=bar.getBoundingClientRect(),rect=active.getBoundingClientRect(),inset=function(side){return parseFloat(shell[side])||0;};
  const x=rect.left-box.left-bar.clientLeft+inset("left"),y=rect.top-box.top-bar.clientTop+inset("top");
  pill.style.transition=animate?"":"none";
  Object.assign(pill.style,{width:(rect.width-inset("left")-inset("right"))+"px",height:(rect.height-inset("top")-inset("bottom"))+"px",transform:"translate("+x+"px,"+y+"px)",borderRadius:shell.borderRadius,border:shell.borderTopWidth+" "+shell.borderTopStyle+" "+shell.borderTopColor,backgroundColor:shell.backgroundColor,backgroundImage:shell.backgroundImage,backgroundSize:shell.backgroundSize,backgroundPosition:shell.backgroundPosition,backgroundRepeat:shell.backgroundRepeat,boxShadow:shell.boxShadow,borderImageSource:shell.borderImageSource,borderImageSlice:shell.borderImageSlice,borderImageWidth:shell.borderImageWidth,borderImageOutset:shell.borderImageOutset,borderImageRepeat:shell.borderImageRepeat});
  if(!animate){pill.getBoundingClientRect();pill.style.transition="";}
}
function watchTabSlider(bar){
  let frame=0;const queue=function(animate){cancelAnimationFrame(frame);frame=requestAnimationFrame(function(){syncTabSlider(bar,animate);});};
  new MutationObserver(function(){queue(true);}).observe(bar,{subtree:true,childList:true,attributes:true,attributeFilter:["class"]});
  // A bar in a closed popup has no size yet; it is placed once the popup opens (and on any resize).
  new ResizeObserver(function(){queue(false);}).observe(bar);
  if(document.fonts&&document.fonts.ready)document.fonts.ready.then(function(){queue(false);});
  queue(false);
}
document.querySelectorAll("[data-service-tabs], .gallery-content-panel > [data-gallery-filters], [data-gallery-modal-filters]").forEach(watchTabSlider);
// The booking popup's group tabs are one segmented bar only on phones (on wider screens they are separate pills),
// and the popup redraws them with each step, so every new bar is picked up as it appears.
const bookingBody=document.querySelector("[data-booking-body]");
if(bookingBody){
  const watchedBars=new WeakSet(),phoneBar=window.matchMedia("(max-width: 600px)");
  const watchBookingBar=function(){
    const bar=bookingBody.querySelector(".booking-categories:not(.booking-picker__tabs)");
    if(bar&&phoneBar.matches&&!watchedBars.has(bar)){watchedBars.add(bar);watchTabSlider(bar);}
  };
  new MutationObserver(watchBookingBar).observe(bookingBody,{childList:true});
  watchBookingBar();
}
