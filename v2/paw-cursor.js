(function setup1m65PawCursor() {
  if (document.querySelector("[data-paw-cursor], .paw-click-layer")) return;

  const finePointer = matchMedia("(pointer: fine)");
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  const clickLayer = document.createElement("div");
  const pawArtwork = "assets/ui/cat_paw_cursor_upright.webp";

  clickLayer.className = "paw-click-layer";
  clickLayer.setAttribute("aria-hidden", "true");
  clickLayer.style.pointerEvents = "none";
  document.body.append(clickLayer);

  function addTouchStamp(x, y) {
    const stamp = document.createElement("span");
    stamp.className = "paw-touch-stamp";
    stamp.dataset.pawTouchStamp = "";
    stamp.style.left = x + "px";
    stamp.style.top = y + "px";
    stamp.innerHTML = '<img src="' + pawArtwork + '" alt="" decoding="async">';
    clickLayer.append(stamp);
    setTimeout(function(){stamp.remove();}, reducedMotion.matches ? 180 : 620);
  }

  function addClickFeedback(x, y, showTouchStamp) {
    if (showTouchStamp) addTouchStamp(x, y);
    const ring = document.createElement("span");
    ring.className = "paw-click-ring";
    ring.dataset.pawClickRing = "";
    ring.style.left = x + "px";
    ring.style.top = y + "px";
    clickLayer.append(ring);
    setTimeout(function(){ring.remove();}, reducedMotion.matches ? 180 : 560);

    if (reducedMotion.matches) return;
    const colors = ["#F5C6D7", "#DDD4F3", "#FCEEE6", "#8A66D8", "#FCE4ED"];
    for (let index = 0; index < 7; index += 1) {
      const angle = Math.PI * 2 * index / 7 + Math.random();
      const distance = 30 + Math.random() * 42;
      const size = 5 + Math.random() * 6;
      const particle = document.createElement("span");
      particle.className = "paw-click-particle";
      particle.dataset.pawClickParticle = "";
      particle.style.left = x - size / 2 + "px";
      particle.style.top = y - size / 2 + "px";
      particle.style.width = size + "px";
      particle.style.height = size + "px";
      particle.style.background = colors[index % colors.length];
      particle.style.setProperty("--dx", Math.cos(angle) * distance + "px");
      particle.style.setProperty("--dy", Math.sin(angle) * distance - 16 + "px");
      clickLayer.append(particle);
      setTimeout(function(){particle.remove();}, 820);
    }
  }

  if (!finePointer.matches) {
    addEventListener("click", function(event){
      if (event.detail === 0 || (event.pointerType && event.pointerType !== "touch")) return;
      addClickFeedback(event.clientX, event.clientY, true);
    }, { passive: true });
    return;
  }

  const cursor = document.createElement("div");
  const state = {
    x: innerWidth / 2,
    y: innerHeight / 2,
    targetX: innerWidth / 2,
    targetY: innerHeight / 2,
    rotation: 0,
    scale: 1,
    hover: 0,
    press: 0,
  };
  let seen = false;

  cursor.className = "paw-cursor";
  cursor.dataset.pawCursor = "";
  cursor.setAttribute("aria-hidden", "true");
  cursor.innerHTML = '<img src="' + pawArtwork + '" alt="" decoding="async">';
  document.body.append(cursor);
  document.documentElement.classList.add("paw-cursor-active");

  function isPointerInteraction(event) {
    return event.pointerType !== "touch";
  }

  function setHoverTarget(target) {
    state.hover = target instanceof Element && Boolean(target.closest("a,button,input,select,textarea,[role='button'],[role='tab'],[tabindex]:not([tabindex='-1'])")) ? 1 : 0;
  }

  function hideCursor() {
    cursor.style.opacity = "0";
    state.press = 0;
    cursor.classList.remove("is-pressed");
  }

  addEventListener("pointermove", function(event){
    if (!isPointerInteraction(event)) return;
    state.targetX = event.clientX;
    state.targetY = event.clientY;
    if (!seen) {
      seen = true;
      state.x = event.clientX;
      state.y = event.clientY;
      cursor.style.transform = "translate3d(" + state.x + "px," + state.y + "px,0) rotate(0deg) scale(1,1)";
    }
    cursor.style.opacity = "1";
    setHoverTarget(event.target);
  }, { passive: true });
  addEventListener("pointerdown", function(event){
    if (!isPointerInteraction(event) || event.button !== 0) return;
    state.press = 1;
    cursor.classList.add("is-pressed");
    addClickFeedback(event.clientX, event.clientY);
  }, { passive: true });
  addEventListener("pointerup", function(event){
    if (!isPointerInteraction(event)) return;
    state.press = 0;
    cursor.classList.remove("is-pressed");
  }, { passive: true });
  addEventListener("blur", function(){
    state.press = 0;
    cursor.classList.remove("is-pressed");
  });
  document.addEventListener("mouseleave", hideCursor);
  document.querySelectorAll("iframe").forEach(function(frame){
    frame.addEventListener("mouseenter", hideCursor);
  });

  function tick() {
    const nextX = state.targetX;
    const nextY = state.targetY;
    const velocityX = nextX - state.x;
    state.x = nextX;
    state.y = nextY;

    if (reducedMotion.matches) {
      state.rotation = 0;
      state.scale = state.press ? .92 : 1;
    } else {
      state.rotation += (Math.max(-15, Math.min(15, velocityX * .6)) - state.rotation) * .14;
      state.scale += ((state.hover ? 1.12 : 1) * (state.press ? .8 : 1) - state.scale) * .2;
    }
    cursor.style.transform = "translate3d(" + state.x + "px," + state.y + "px,0) rotate(" + state.rotation + "deg) scale(" + state.scale + "," + state.scale + ")";
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
})();
