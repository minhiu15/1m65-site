(function () {
  "use strict";

  const SELF_URL = document.currentScript && document.currentScript.src;
  const CSS_URL = SELF_URL ? new URL("booking-ticket.css?v=20260809-2", SELF_URL).href : "booking-ticket.css?v=20260809-2";

  function make(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  }

  function metaItem(label, value, href) {
    const item = make("div", "mew-ticket-meta-item");
    item.append(make("span", "mew-ticket-meta-label", label));
    const valueNode = make(href ? "a" : "span", "mew-ticket-meta-value", value);
    if (href) valueNode.href = href;
    item.append(valueNode);
    return item;
  }

  function prepareButton(button) {
    button.className = "mew-ticket-button";
    button.removeAttribute("style");
    button.removeAttribute("style-hover");
    button.innerHTML =
      '<span>Giữ chỗ cho mình</span>' +
      '<svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">' +
      '<path d="M7 4v3M17 4v3M4.5 9.5h15M6.5 6h11a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-11a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>' +
      '<path d="m9 14 2 2 4-4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>' +
      "</svg>";
    return button;
  }

  function transformBookingTicket() {
    const section = document.getElementById("datlich");
    if (!section || section.dataset.mewTicketReady === "true") return false;

    const oldCard = section.querySelector(".nhu-major-surface--booking");
    const button = section.querySelector("#mewBookBtn");
    const mascot = section.querySelector('[data-cat="sleep"]');
    if (!oldCard || !button || !mascot) return false;

    section.dataset.mewTicketReady = "true";
    section.classList.add("mew-ticket-section");

    const ticket = make("div", "mew-booking-ticket");
    ticket.setAttribute("data-reveal", "1");
    ["tl", "tr", "bl", "br"].forEach(function (corner) {
      ticket.append(make("span", "mew-ticket-cutout mew-ticket-cutout--" + corner));
    });

    const main = make("div", "mew-ticket-main");
    const topline = make("div", "mew-ticket-topline");
    topline.append(make("span", "", "Vé mời · 1M65 Nails"));
    topline.append(make("span", "mew-ticket-number", "No. 000165"));
    main.append(topline);

    const title = make("h2", "mew-ticket-title");
    title.innerHTML = '<span class="mew-ticket-title-line">Bàn tay bạn xứng đáng</span><span class="mew-ticket-title-line mew-ticket-title-line--accent">một buổi chiều tử tế.</span>';
    main.append(title);
    main.append(make("p", "mew-ticket-copy", "Chọn dịch vụ bạn thích, tìm một khung giờ vừa vặn rồi để tụi mình chăm phần còn lại. Không cần đặt cọc."));

    const meta = make("div", "mew-ticket-meta");
    meta.append(metaItem("Giờ mở cửa", "9:00 – 18:00 mỗi ngày"));
    meta.append(metaItem("Ghé tiệm", "TP. Thủ Đức · TP.HCM"));
    meta.append(metaItem("Gọi cho tiệm", "028 3822 0100", "tel:+842838220100"));
    main.append(meta);

    const stub = make("div", "mew-ticket-stub");
    const stubHead = make("div", "mew-ticket-stub-head");
    stubHead.append(make("span", "mew-ticket-stub-label", "Cuống vé"));
    const stubTitle = make("h3", "mew-ticket-stub-title");
    stubTitle.innerHTML = "Giữ chỗ<br>cho bạn";
    stubHead.append(stubTitle);
    stub.append(stubHead);
    stub.append(prepareButton(button));
    stub.append(make("p", "mew-ticket-note", "Chỉ khoảng 30 giây · không cần đặt cọc"));

    const mobileMeta = make("div", "mew-ticket-mobile-meta");
    mobileMeta.append(metaItem("Giờ mở cửa", "9:00 – 18:00"));
    mobileMeta.append(metaItem("Gọi cho tiệm", "028 3822 0100", "tel:+842838220100"));
    stub.append(mobileMeta);

    mascot.classList.add("mew-ticket-mascot");
    mascot.removeAttribute("style");
    stub.append(mascot);

    ticket.append(main, stub);
    section.replaceChildren(ticket);
    return true;
  }

  function ensureFrameAssets(frame) {
    let doc;
    try {
      doc = frame.contentDocument;
    } catch (_) {
      return;
    }
    if (!doc || !doc.head || !doc.body) return;

    if (!doc.querySelector('link[data-mew-ticket-style]')) {
      const style = doc.createElement("link");
      style.rel = "stylesheet";
      style.href = CSS_URL;
      style.dataset.mewTicketStyle = "true";
      doc.head.append(style);
    }

    if (!doc.querySelector('script[data-mew-ticket-script]')) {
      const script = doc.createElement("script");
      script.src = SELF_URL;
      script.dataset.mewTicketScript = "true";
      doc.body.append(script);
    }
  }

  function bootParent() {
    document.querySelectorAll("iframe.desktop, iframe.mobile").forEach(function (frame) {
      frame.addEventListener("load", function () { ensureFrameAssets(frame); });
      if (frame.contentDocument && frame.contentDocument.readyState === "complete") {
        ensureFrameAssets(frame);
      }
    });
  }

  if (document.getElementById("datlich")) {
    if (!document.querySelector('link[data-mew-ticket-style]')) {
      const style = document.createElement("link");
      style.rel = "stylesheet";
      style.href = CSS_URL;
      style.dataset.mewTicketStyle = "true";
      document.head.append(style);
    }
    transformBookingTicket();
  } else if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootParent, { once: true });
  } else {
    bootParent();
  }
})();
