(() => {
  const art = document.querySelector(".footer-brand__sleeping-art");
  if (!art || !("IntersectionObserver" in window)) return;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let inView = false;
  const update = () => {
    art.classList.toggle("is-dreaming", inView && !document.hidden && !reducedMotion.matches);
  };

  new IntersectionObserver(([entry]) => {
    inView = entry.isIntersecting;
    update();
  }, { threshold: .1 }).observe(art);

  document.addEventListener("visibilitychange", update);
  reducedMotion.addEventListener("change", update);
})();
