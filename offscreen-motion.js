// Decorative loops (the paw runner, the journey doodles, the reviews flower) pause while off screen: left running,
// they had the browser restyle the page on every frame of a scroll, which phones felt as stutter.
(() => {
  if (!("IntersectionObserver" in window)) return;
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => entry.target.classList.toggle("is-offscreen", !entry.isIntersecting));
  });
  document.querySelectorAll(".nhu-paw-runner-track, .about-journey__marks, .reviews-bottom__flower").forEach((node) => {
    node.classList.add("is-offscreen");
    observer.observe(node);
  });
})();
