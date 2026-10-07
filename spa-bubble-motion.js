(() => {
  const panel = document.querySelector("[data-service-panel]");
  if (!panel || !("IntersectionObserver" in window)) return;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let art = null;
  let inView = false;
  const observer = new IntersectionObserver(([entry]) => {
    inView = entry.isIntersecting;
    update();
  }, { threshold: .1 });

  function update() {
    art?.classList.toggle("is-bubbling", inView && !document.hidden && !reducedMotion.matches);
  }

  function reconnect() {
    const nextArt = panel.querySelector(".signature-spa-art");
    if (nextArt === art) return;
    if (art) observer.unobserve(art);
    art = nextArt;
    inView = false;
    if (art) observer.observe(art);
  }

  new MutationObserver(reconnect).observe(panel, { childList: true });
  document.addEventListener("visibilitychange", update);
  reducedMotion.addEventListener("change", update);
  reconnect();
})();
