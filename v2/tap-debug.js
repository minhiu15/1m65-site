// Temporary on-device tap diagnostics, loaded only with ?tapdebug. Shows, per tap, which events the
// browser actually delivered (touch → pointer → mouse → click) so an iPhone screenshot tells us where a
// first tap gets lost. ponytail: delete this file and its loader once the iOS tap issue is diagnosed.
(function setupTapDebug() {
  const panel = document.createElement("pre");
  panel.setAttribute("aria-hidden", "true");
  panel.style.cssText = "position:fixed;left:6px;right:6px;top:calc(env(safe-area-inset-top) + 70px);z-index:2147483647;max-height:38vh;overflow:auto;margin:0;padding:8px;border-radius:10px;background:rgba(30,20,40,.86);color:#fff;font:11px/1.35 ui-monospace,Menlo,monospace;white-space:pre-wrap;pointer-events:none";
  document.body.append(panel);
  const lines = [];
  let tapStart = 0;
  const describe = (target) => {
    if (!(target instanceof Element)) return String(target && target.nodeName);
    const control = target.closest("button,a,[role='button'],[role='tab'],input,label") || target;
    const text = (control.getAttribute("aria-label") || control.textContent || "").trim().replace(/\s+/g, " ").slice(0, 18);
    return control.tagName.toLowerCase() + (text ? " '" + text + "'" : "");
  };
  const log = (message) => {
    lines.push(message);
    if (lines.length > 40) lines.shift();
    panel.textContent = lines.join("\n");
    panel.scrollTop = panel.scrollHeight;
  };
  ["touchstart", "touchend", "touchcancel", "pointerdown", "pointerup", "mouseover", "mousedown", "mouseup", "click"].forEach((type) => {
    addEventListener(type, (event) => {
      if (type === "touchstart") {
        tapStart = performance.now();
        const viewport = window.visualViewport;
        log("── tap y=" + Math.round(event.touches[0].clientY) + " / vh=" + Math.round(viewport ? viewport.height : innerHeight) + " scrollY=" + Math.round(scrollY));
      }
      const pointer = event.pointerType ? "(" + event.pointerType + ")" : "";
      log("  +" + Math.round(performance.now() - tapStart) + "ms " + type + pointer + " → " + describe(event.target));
    }, { capture: true, passive: true });
  });
  addEventListener("scroll", () => { if (lines[lines.length - 1] !== "  scroll") log("  scroll"); }, { passive: true });
  // &nopaw: keep paw-cursor.js from adding its stamp/ring/particles at touch end (between touchstart and
  // the synthetic mouse move, which iOS watches), to test whether that makes iOS treat a link tap as
  // hover. Its click listener then draws the feedback after the click instead. Window capture runs
  // before paw-cursor's window listener; nothing else listens to pointerup.
  const noPaw = /[?&]nopaw\b/.test(location.search);
  if (noPaw) addEventListener("pointerup", (event) => { if (event.pointerType === "touch") event.stopImmediatePropagation(); }, true);
  log("tapdebug on" + (noPaw ? " · TẮT hiệu ứng chân mèo" : "") + " — chạm thử các nút bị lỗi rồi chụp màn hình gửi lại");
})();
