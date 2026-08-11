(function () {
  "use strict";

  const SELF_URL = document.currentScript && document.currentScript.src;
  const CSS_URL = SELF_URL ? new URL("booking-ticket.css?v=20260810-6", SELF_URL).href : "booking-ticket.css?v=20260810-6";
  const CAT_URL = SELF_URL ? new URL("mascot/nhu-nhi-ticket.png?v=20260809-1", SELF_URL).href : "mascot/nhu-nhi-ticket.png?v=20260809-1";

  function make(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  }

  function metaItem(label, value, note, href) {
    const item = make("div", "mew-ticket-meta-item");
    item.append(make("span", "mew-ticket-meta-label", label));
    const valueNode = make(href ? "a" : "span", "mew-ticket-meta-value", value);
    if (href) valueNode.href = href;
    item.append(valueNode);
    item.append(make("span", "mew-ticket-meta-note", note));
    return item;
  }

  function prepareButton(button) {
    button.className = "mew-ticket-button";
    button.removeAttribute("style");
    button.removeAttribute("style-hover");
    button.innerHTML = '<span class="mew-ticket-button-shine" aria-hidden="true"></span><span class="mew-ticket-button-label">Đặt hẹn ngay</span>';
    return button;
  }

  function transformBookingTicket() {
    const section = document.getElementById("datlich");
    if (!section || section.dataset.mewTicketReady === "true") return false;

    const oldCard = section.querySelector(".nhu-major-surface--booking");
    const button = section.querySelector("#mewBookBtn");
    const legacyMascot = section.querySelector('[data-cat="sleep"]');
    if (!oldCard || !button || !legacyMascot) return false;

    section.dataset.mewTicketReady = "true";
    section.classList.add("mew-ticket-section");

    const ticket = make("div", "mew-booking-ticket");
    ticket.setAttribute("data-reveal", "1");

    const main = make("div", "mew-ticket-main");
    const topline = make("div", "mew-ticket-topline");
    topline.append(make("span", "mew-ticket-eyebrow", "Vé mời · 1M65 Nails"));
    topline.append(make("span", "mew-ticket-rule"));
    topline.append(make("span", "mew-ticket-validity", "không giới hạn ngày dùng"));
    main.append(topline);

    const title = make("h2", "mew-ticket-title");
    title.innerHTML = '<span class="mew-ticket-title-line">Bàn tay bạn xứng đáng</span> <span class="mew-ticket-title-line">một buổi chiều tử tế</span>';
    main.append(title);
    main.append(make("p", "mew-ticket-copy mew-ticket-copy--desktop", "Không cần đặt cọc, không phụ thu cuối tuần. Đặt xong bạn cứ tới, bận thì nhắn Zalo dời lịch."));
    main.append(make("p", "mew-ticket-copy mew-ticket-copy--mobile", "Không cần đặt cọc, không phụ thu cuối tuần."));

    const meta = make("div", "mew-ticket-meta");
    meta.append(metaItem("Giờ mở cửa", "9:00 – 18:00", "cả tuần, kể cả chủ nhật"));
    meta.append(metaItem("Tiệm ở", "Đại Phước, Đồng Nai", "có chỗ để xe ngay trước tiệm"));
    meta.append(metaItem("Gọi hoặc Zalo", "0946 712 911", "trả lời trong 5 phút", "tel:0946712911"));
    main.append(meta);

    const stub = make("div", "mew-ticket-stub");
    const stubHead = make("div", "mew-ticket-stub-head");
    stubHead.append(make("span", "mew-ticket-stub-label", "Cuống vé"));
    const stubTitle = make("h3", "mew-ticket-stub-title");
    stubTitle.innerHTML = "Giữ chỗ<br>cho bạn";
    stubHead.append(stubTitle);
    stub.append(stubHead);
    stub.append(prepareButton(button));
    stub.append(make("p", "mew-ticket-note", "30 giây · không cần đặt cọc"));

    const mobileInfo = make("div", "mew-ticket-mobile-info");
    mobileInfo.append(make("span", "", "9:00 – 18:00 cả tuần"));
    const phone = make("a", "", "0946 712 911");
    phone.href = "tel:0946712911";
    mobileInfo.append(phone);
    main.append(mobileInfo);

    const cat = make("img", "mew-ticket-cat");
    cat.src = CAT_URL;
    cat.alt = "Nhu Nhi";
    cat.decoding = "async";
    stub.append(cat);

    legacyMascot.classList.add("mew-ticket-legacy-mascot");
    legacyMascot.removeAttribute("style");
    stub.append(legacyMascot);

    ticket.append(main, stub);
    section.replaceChildren(ticket);
    return true;
  }

  function transformMobileContact() {
    if (!window.matchMedia("(max-width: 767px)").matches) return false;

    const contact = document.getElementById("lienhe");
    const mapFrame = contact && contact.querySelector('iframe[title*="1M65"]');
    const map = mapFrame && mapFrame.parentElement;
    const copy = map && map.nextElementSibling;
    if (!contact || !map || !copy || copy.classList.contains("mew-mobile-contact-copy")) return false;

    map.classList.add("mew-mobile-contact-map");
    copy.classList.add("mew-mobile-contact-copy");
    contact.insertBefore(copy, map);
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
    transformMobileContact();
  } else if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootParent, { once: true });
  } else {
    bootParent();
  }
})();
