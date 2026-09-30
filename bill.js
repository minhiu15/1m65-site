// The booking bill ("Phiếu đặt lịch"), after the owner's reference. It is drawn on a canvas so the page
// behind the ticket's QR code and the picture customers download are the same image, growing with the
// number of services. Table, icons and QR are drawn here; the paper, cat, bow, hearts and flowers are the
// owner's art.
import qrcode from "./vendor/qrcode.mjs";
import { ESTIMATE_NOTE, hasUnitPricing, unitPrice } from "./price-units.js?v=20260928-1";

export const API = "https://aomiaszicxqrctcgeoms.supabase.co/functions/v1/booking-api";
const ART = new URL("assets/booking/", import.meta.url).href;
const TZ = "Asia/Ho_Chi_Minh";
const STORE = [
  ["store", "1M65 Nails, Eyelashes, Shampoo"],
  ["pin", "Địa chỉ: Lý Thái Tổ, Đại Phước, Đồng Nai"],
  ["clock", "Giờ mở cửa: 09:00 - 18:00 (tất cả các ngày)"]
];
const W = 1024, TOP = 150;
const INK = "#4a2a26", TITLE = "#6f3b2f", PINK = "#e0527f", DEEP_PINK = "#d23f6f", LINE = "#f0a3b8", NAVY = "#354a63", MUTED = "#7b6568";
const HAND = '"Baloo 2", Quicksand, sans-serif', BODY = "Nunito, system-ui, sans-serif", ROUND = 'Quicksand, "Baloo 2", sans-serif', SCRIPT = '"Great Vibes", cursive';
const HEART_PATH = "M0 6.5C-3 4-8 .8-8-2.8C-8-5.6-5.8-7.4-3.6-7.4C-2-7.4-.6-6.5 0-5.2C.6-6.5 2-7.4 3.6-7.4C5.8-7.4 8-5.6 8-2.8C8 .8 3 4 0 6.5Z";
const STAR_PATH = "M0-7C.6-2.2 2.2-.6 7 0C2.2.6.6 2.2 0 7C-.6 2.2-2.2.6-7 0C-2.2-.6-.6-2.2 0-7Z";
const PASTEL_STAR_PATH = "M0-8C-1.2-3.6-3.7-1.2-8 0C-3.7 1.2-1.2 3.6 0 8C1.2 3.6 3.7 1.2 8 0C3.7-1.2 1.2-3.6 0-8Z";
const CROWN_PATH = "M8 36L4 12l15 12L32 5l13 19 15-12-4 24z M9 41h46";

export function maskPhone(phone) {
  const digits = String(phone || "");
  return /^0\d{9}$/.test(digits) ? digits.slice(0, 4) + " ••• " + digits.slice(7) : "";
}

// The QR opens the bill when the booking came with its key; without one it opens the booking lookup.
export function billUrl(reference, key) {
  const url = new URL(key ? "bill.html" : "manage-booking.html", import.meta.url);
  if (key) {
    url.searchParams.set("r", reference);
    url.searchParams.set("k", key);
  } else {
    url.searchParams.set("reference", reference);
  }
  return url.href;
}

// Level L: the code is never covered, and the fewer, larger modules still scan when the ticket or bill is small.
function qrCode(text) {
  const qr = qrcode(0, "L");
  qr.addData(text);
  qr.make();
  return qr;
}

// Dark runs of each row become one path segment. No backing: the light paper round it is the quiet zone.
export function qrSvg(text, className) {
  const qr = qrCode(text), count = qr.getModuleCount(), size = count + 4;
  let path = "";
  for (let row = 0; row < count; row += 1) {
    for (let col = 0; col < count; col += 1) {
      if (!qr.isDark(row, col)) continue;
      const start = col;
      while (col + 1 < count && qr.isDark(row, col + 1)) col += 1;
      path += "M" + start + " " + row + "h" + (col - start + 1) + "v1h-" + (col - start + 1) + "z";
    }
  }
  return '<svg class="' + className + '" viewBox="-2 -2 ' + size + " " + size + '" shape-rendering="crispEdges" aria-hidden="true"><path d="' + path + '" fill="' + INK + '"/></svg>';
}

let fontsReady;
function loadFonts() {
  if (!fontsReady) {
    const script = new FontFace("Great Vibes", "url(" + new URL("assets/fonts/GreatVibes-Regular.ttf", import.meta.url).href + ")");
    document.fonts.add(script);
    const sample = "Phiếu đặt lịch Cảm ơn bạn đã lựa chọn ƯĐđ ạẹợữ 0123456789";
    fontsReady = Promise.all([script.load()].concat(["800 40px " + HAND, "700 40px " + HAND, "600 20px " + BODY, "500 20px " + BODY, "700 40px " + ROUND].map(function (spec) { return document.fonts.load(spec, sample); }))).catch(function () {});
  }
  return fontsReady;
}

const images = new Map();
function image(path) {
  if (!images.has(path)) {
    images.set(path, new Promise(function (resolve) {
      const img = new Image();
      img.onload = function () { resolve(img); };
      img.onerror = function () { resolve(null); };
      img.src = ART + path;
    }));
  }
  return images.get(path);
}

function place(ctx, img, x, y, width, turn) {
  if (!img) return;
  const height = width * img.naturalHeight / img.naturalWidth;
  ctx.save();
  ctx.translate(x + width / 2, y + height / 2);
  if (turn) ctx.rotate(turn * Math.PI / 180);
  ctx.drawImage(img, -width / 2, -height / 2, width, height);
  ctx.restore();
}

function type(ctx, spec, color, align) {
  ctx.font = spec;
  ctx.fillStyle = color;
  ctx.textAlign = align || "left";
  ctx.textBaseline = "alphabetic";
}

function fit(ctx, text, width) {
  let out = String(text);
  if (ctx.measureText(out).width <= width) return out;
  while (out.length > 1 && ctx.measureText(out + "…").width > width) out = out.slice(0, -1);
  return out.trimEnd() + "…";
}

function wrap(ctx, text, width, most) {
  const lines = [];
  let line = "";
  String(text).split(/\s+/).filter(Boolean).forEach(function (word) {
    const next = line ? line + " " + word : word;
    if (!line || ctx.measureText(next).width <= width) line = next;
    else { lines.push(line); line = word; }
  });
  if (line) lines.push(line);
  if (lines.length > most) lines.splice(most - 1, lines.length, fit(ctx, lines.slice(most - 1).join(" "), width));
  return lines.length ? lines : [""];
}

function heart(ctx, x, y, size, filled) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(size / 16, size / 16);
  const path = new Path2D(HEART_PATH);
  if (filled) { ctx.fillStyle = "#f38bab"; ctx.fill(path); }
  ctx.lineWidth = (filled ? 1 : 2.2) * 16 / size;
  ctx.lineJoin = "round";
  ctx.strokeStyle = "#e8628d";
  ctx.stroke(path);
  ctx.restore();
}

function sparkle(ctx, x, y, size) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(size / 14, size / 14);
  const path = new Path2D(STAR_PATH);
  ctx.fillStyle = "#fff4d6";
  ctx.fill(path);
  ctx.lineWidth = 1.3;
  ctx.lineJoin = "round";
  ctx.strokeStyle = "#f0a43a";
  ctx.stroke(path);
  ctx.restore();
}

function pastelStar(ctx, accent) {
  ctx.save();
  ctx.translate(accent.x, accent.y);
  ctx.scale(accent.size / 16, accent.size / 16);
  const path = new Path2D(PASTEL_STAR_PATH);
  ctx.fillStyle = accent.fill;
  ctx.fill(path);
  ctx.lineWidth = 1.15 * 16 / accent.size;
  ctx.lineJoin = "round";
  ctx.strokeStyle = accent.stroke;
  ctx.stroke(path);
  ctx.restore();
}

// Pink line icons on a 24-unit grid, in the ticket's calendar icon's hand.
function icon(ctx, name, cx, cy, size) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(size / 24, size / 24);
  ctx.translate(-12, -12);
  ctx.lineWidth = 2;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = PINK;
  ctx.beginPath();
  if (name === "person") {
    ctx.moveTo(16, 8); ctx.arc(12, 8, 4, 0, Math.PI * 2);
    ctx.moveTo(4.5, 20.5); ctx.bezierCurveTo(4.5, 15.8, 8, 13.6, 12, 13.6); ctx.bezierCurveTo(16, 13.6, 19.5, 15.8, 19.5, 20.5); ctx.closePath();
  } else if (name === "calendar") {
    ctx.roundRect(3.5, 5, 17, 15.5, 3); ctx.moveTo(3.5, 10); ctx.lineTo(20.5, 10); ctx.moveTo(8, 3); ctx.lineTo(8, 7); ctx.moveTo(16, 3); ctx.lineTo(16, 7);
    [[8, 14], [12, 14], [16, 14], [8, 17], [12, 17]].forEach(function (dot) { ctx.moveTo(dot[0], dot[1]); ctx.lineTo(dot[0] + 1, dot[1]); });
  } else if (name === "pin") {
    ctx.moveTo(12, 21.5); ctx.bezierCurveTo(8.5, 17.5, 5, 13.5, 5, 9.5); ctx.arc(12, 9.5, 7, Math.PI, 0); ctx.bezierCurveTo(19, 13.5, 15.5, 17.5, 12, 21.5);
    ctx.moveTo(14.8, 9.5); ctx.arc(12, 9.5, 2.8, 0, Math.PI * 2);
  } else if (name === "store") {
    ctx.moveTo(3.5, 9.5); ctx.lineTo(5.5, 4.5); ctx.lineTo(18.5, 4.5); ctx.lineTo(20.5, 9.5); ctx.closePath();
    ctx.moveTo(8.8, 4.5); ctx.lineTo(8.3, 9.5); ctx.moveTo(15.2, 4.5); ctx.lineTo(15.7, 9.5);
    ctx.moveTo(5, 9.5); ctx.lineTo(5, 20); ctx.lineTo(19, 20); ctx.lineTo(19, 9.5); ctx.moveTo(10, 20); ctx.lineTo(10, 14.5); ctx.lineTo(14, 14.5); ctx.lineTo(14, 20);
  } else if (name === "clock") {
    ctx.moveTo(20.5, 12); ctx.arc(12, 12, 8.5, 0, Math.PI * 2); ctx.moveTo(12, 7.5); ctx.lineTo(12, 12); ctx.lineTo(15.2, 14);
  }
  ctx.stroke();
  ctx.restore();
}

// The bill's paper (bill-paper.webp, 1024×1536, drawn 1:1; design-assets/booking-confirmation/gen-bill-paper.py).
// A longer bill repeats one 88px band of it (728–816, straight sides, joined seamlessly) instead of stretching it. The sheet is
// put together off-screen first so its shadow falls once, under the whole paper.
const PAPER_TOP = 42, PAPER_BOTTOM = 1488, BAND = 728, BAND_HEIGHT = 88;
function paper(ctx, art, bands) {
  if (!art) return;
  const scale = ctx.getTransform().a, height = 1536 + bands * BAND_HEIGHT, sheet = document.createElement("canvas");
  sheet.width = Math.round(W * scale);
  sheet.height = Math.round(height * scale);
  const pen = sheet.getContext("2d");
  pen.scale(scale, scale);
  pen.drawImage(art, 0, 0, W, BAND, 0, 0, W, BAND);
  for (let band = 0; band < bands; band += 1) pen.drawImage(art, 0, BAND, W, BAND_HEIGHT, 0, BAND + band * BAND_HEIGHT, W, BAND_HEIGHT);
  pen.drawImage(art, 0, BAND, W, 1536 - BAND, 0, BAND + bands * BAND_HEIGHT, W, 1536 - BAND);
  ctx.save();
  ctx.shadowColor = "rgba(120, 70, 70, .2)";
  ctx.shadowBlur = 30;
  ctx.shadowOffsetY = 12;
  ctx.drawImage(sheet, 0, TOP - PAPER_TOP, W, height);
  ctx.restore();
}

function dashedBox(ctx, x, y, width, height, radius, dash, color, lineWidth) {
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, radius);
  ctx.setLineDash(dash);
  ctx.lineWidth = lineWidth;
  ctx.strokeStyle = color;
  ctx.stroke();
  ctx.restore();
}

function dashedLine(ctx, x0, y0, x1, y1) {
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.setLineDash([9, 7]);
  ctx.lineWidth = 2;
  ctx.strokeStyle = "#f3bccb";
  ctx.stroke();
  ctx.restore();
}

// A section: a pale pink card with a dashed edge and its label in a pink pill.
function section(ctx, top, height, iconName, label) {
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(104, top, 816, height, 30);
  ctx.fillStyle = "rgba(252, 222, 232, .32)";
  ctx.fill();
  ctx.restore();
  dashedBox(ctx, 104, top, 816, height, 30, [9, 7], LINE, 2);
  type(ctx, "700 24px " + HAND, DEEP_PINK);
  const width = ctx.measureText(label).width + 100;
  ctx.beginPath();
  ctx.roundRect(122, top + 16, width, 50, 25);
  ctx.fillStyle = "#fcdbe5";
  ctx.fill();
  ctx.beginPath();
  ctx.arc(150, top + 41, 23, 0, Math.PI * 2);
  ctx.fillStyle = "#fff5f8";
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = "#f3a9be";
  ctx.stroke();
  icon(ctx, iconName, 150, top + 41, 28);
  type(ctx, "700 24px " + HAND, DEEP_PINK);
  ctx.fillText(label, 184, top + 50);
}

// Integer device pixels per module, so the modules never blur into each other.
function drawQr(ctx, text, x, y, size) {
  const qr = qrCode(text), count = qr.getModuleCount(), matrix = ctx.getTransform();
  const cell = Math.floor(size * matrix.a / (count + 4)), full = cell * (count + 4);
  const left = Math.round(matrix.e + x * matrix.a + (size * matrix.a - full) / 2), top = Math.round(matrix.f + y * matrix.d + (size * matrix.d - full) / 2);
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = INK;
  for (let row = 0; row < count; row += 1) for (let col = 0; col < count; col += 1) if (qr.isDark(row, col)) ctx.fillRect(left + (col + 2) * cell, top + (row + 2) * cell, cell, cell);
  ctx.restore();
}

function money(value) { return Number(value || 0).toLocaleString("vi-VN") + "đ"; }

export function billHeadingLayout(firstCardTop) {
  return {
    textX: 122,
    sparkles: [
      { x: 90, y: firstCardTop - 18, size: 30 },
      { x: 116, y: firstCardTop + 8, size: 16 }
    ]
  };
}

export function billStoreAccent(storeTop, storeHeight) {
  return { x: 876, y: storeTop + storeHeight - 40, size: 28, fill: "#f6c7d5", stroke: "#8f8582" };
}

export function billStubQrLayout(stubY, bottom) {
  const left = 604, right = 942, qrSize = 168, centerX = (left + right) / 2;
  return { qrX: centerX - qrSize / 2, qrY: stubY + 8, qrSize, centerX, referenceY: bottom - 50 };
}

// bill: { reference, name, phone (already masked), note, startAt, status, services: [{ name, price }], total, url }
export async function renderBill(bill, scale) {
  await loadFonts();
  const [sheet, cat, bow, star, heartBig, heartSmall, flower, bouquet] = await Promise.all([
    "bill/bill-paper.webp?v=20260930-2", "confirmation/cat-peeking.webp", "confirmation/pink-bow.webp", "confirmation/ticket-star.webp", "confirmation/ticket-heart-big.webp",
    "confirmation/ticket-heart-small.webp", "bill/single-flower.webp", "bill/flower-bouquet.webp"
  ].map(image));
  const start = new Date(bill.startAt);
  const date = new Intl.DateTimeFormat("vi-VN", { timeZone: TZ, day: "2-digit", month: "2-digit", year: "numeric" }).format(start);
  const time = new Intl.DateTimeFormat("vi-VN", { timeZone: TZ, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(start);
  const services = bill.services && bill.services.length ? bill.services : [{ name: "Dịch vụ", price: bill.total }];

  // Lay out first (the note may wrap, the table grows with the services), then add paper bands until the stub
  // fits below the store; one or two services with a one-line note fit the sheet as drawn. The stub keeps to
  // the paper's foot, so a band's spare room opens above it.
  const canvas = document.createElement("canvas"), ctx = canvas.getContext("2d");
  type(ctx, "600 24px " + BODY, INK);
  const noteLines = wrap(ctx, bill.note || "Không có", 370, 2);
  // Designs priced per nail, stone or charm make the total an estimate; one small note under it says how.
  const estimate = hasUnitPricing(services.map(function (service) { return service.id || ""; }));
  type(ctx, "500 17px " + BODY, MUTED);
  const estimateLines = estimate ? wrap(ctx, ESTIMATE_NOTE.replace(/₫/g, "đ"), 744, 3) : [];
  const estimateHeight = estimateLines.length ? estimateLines.length * 24 + 8 : 0;
  // Each card keeps the same room round its content: 26px under the label, 26px after the last line (PAD
  // counts that line's descent). The three gaps below the cards share the paper a band leaves spare.
  const PAD = 32, GAP = 16, STUB = 250, s1 = 424, rowsHeight = services.length * 50;
  const s1Height = 109 + 4 * 42 + (noteLines.length - 1) * 34 + PAD, s2Height = 128 + rowsHeight + 14 + 76 + estimateHeight + 26, s3Height = 109 + 2 * 40 + PAD;
  const cards = s1Height + s2Height + s3Height;
  const bands = Math.max(0, Math.ceil((s1 + cards + 3 * GAP + STUB - (TOP - PAPER_TOP + PAPER_BOTTOM)) / BAND_HEIGHT));
  const bottom = TOP - PAPER_TOP + PAPER_BOTTOM + bands * BAND_HEIGHT, stubY = bottom - STUB, height = bottom + 30;
  const gap = (stubY - s1 - cards) / 3, s2 = s1 + s1Height + gap, s3 = s2 + s2Height + gap;
  const rowsTop = s2 + 128, totalTop = rowsTop + rowsHeight + 14;
  const headingLayout = billHeadingLayout(s1);
  const ratio = scale || 1.5;
  canvas.width = Math.round(W * ratio);
  canvas.height = Math.round(height * ratio);
  ctx.scale(ratio, ratio);

  paper(ctx, sheet, bands);

  // Heading: title and brand, thanks and wishes.
  headingLayout.sparkles.forEach(function (accent) { sparkle(ctx, accent.x, accent.y, accent.size); });
  type(ctx, "800 78px " + HAND, TITLE);
  ctx.fillText("Phiếu đặt lịch", headingLayout.textX, 300);
  ctx.save();
  ctx.translate(794, 190);
  ctx.scale(1.5, 1.5);
  ctx.lineWidth = 3;
  ctx.lineJoin = "round";
  ctx.strokeStyle = INK;
  ctx.stroke(new Path2D(CROWN_PATH));
  ctx.fillStyle = INK;
  [[4, 11], [32, 4], [60, 11]].forEach(function (dot) { ctx.beginPath(); ctx.arc(dot[0], dot[1], 3, 0, Math.PI * 2); ctx.fill(); });
  ctx.restore();
  type(ctx, "700 82px " + ROUND, INK, "center");
  ctx.fillText("1M65", 842, 326);
  heart(ctx, 938, 250, 22, true);
  type(ctx, "800 17px " + BODY, INK, "center");
  ctx.fillText("NAIL - EYE - SHAMPOO", 842, 354);
  type(ctx, "700 31px " + HAND, NAVY);
  ctx.fillText("Cảm ơn bạn đã lựa chọn 1M65!", headingLayout.textX, 356);
  type(ctx, "500 22px " + BODY, "#4b566a");
  ctx.fillText("Hẹn gặp bạn vào thời gian sắp tới. Chúc bạn luôn xinh đẹp!", headingLayout.textX, 404);

  // Customer.
  section(ctx, s1, s1Height, "person", "THÔNG TIN KHÁCH HÀNG");
  const rows = [["Họ và tên", bill.name], ["Số điện thoại", bill.phone || "—"], ["Ngày đặt lịch", date], ["Giờ đặt lịch", time]];
  rows.forEach(function (row, index) {
    const y = s1 + 109 + index * 42;
    type(ctx, "500 23px " + BODY, MUTED);
    ctx.fillText(row[0], 140, y);
    type(ctx, "600 24px " + BODY, INK);
    ctx.fillText(fit(ctx, row[1] || "", 370), 358, y);
  });
  type(ctx, "500 23px " + BODY, MUTED);
  ctx.fillText("Ghi chú", 140, s1 + 109 + 4 * 42);
  type(ctx, "600 24px " + BODY, INK);
  noteLines.forEach(function (line, index) { ctx.fillText(line, 358, s1 + 109 + 4 * 42 + index * 34); });
  dashedLine(ctx, 326, s1 + 86, 326, s1 + s1Height - 24);
  place(ctx, flower, 788, s1 + s1Height - 126, 108, -8);

  // Services.
  section(ctx, s2, s2Height, "calendar", "THÔNG TIN DỊCH VỤ");
  ctx.beginPath();
  ctx.roundRect(132, s2 + 80, 760, 48, 12);
  ctx.fillStyle = "#fbdde7";
  ctx.fill();
  type(ctx, "700 23px " + HAND, "#c2336a");
  ctx.fillText("Dịch vụ", 156, s2 + 112);
  ctx.textAlign = "center";
  ctx.fillText("Số lượng", 596, s2 + 112);
  ctx.textAlign = "right";
  ctx.fillText("Giá", 866, s2 + 112);
  services.forEach(function (service, index) {
    const y = rowsTop + index * 50 + 33;
    if (index) dashedLine(ctx, 140, rowsTop + index * 50, 884, rowsTop + index * 50);
    const shown = unitPrice(service.id, service.price, "đ");
    type(ctx, "500 17px " + BODY, MUTED);
    const detail = shown.perNail ? " · " + shown.perNail : "", detailWidth = ctx.measureText(detail).width;
    type(ctx, "500 23px " + BODY, INK);
    const name = fit(ctx, service.name, 380 - detailWidth);
    ctx.fillText(name, 156, y);
    if (detail) {
      const nameWidth = ctx.measureText(name).width;
      type(ctx, "500 17px " + BODY, MUTED);
      ctx.fillText(detail, 156 + nameWidth, y);
      type(ctx, "500 23px " + BODY, INK);
    }
    ctx.textAlign = "center";
    ctx.fillText("1", 596, y);
    type(ctx, "500 17px " + BODY, MUTED, "right");
    const unit = shown.unit ? "/" + shown.unit : "";
    ctx.fillText(unit, 866, y);
    const unitWidth = unit ? ctx.measureText(unit).width + 2 : 0;
    type(ctx, "600 23px " + BODY, INK, "right");
    ctx.fillText(shown.price, 866 - unitWidth, y);
  });
  dashedLine(ctx, 132, totalTop - 6, 892, totalTop - 6);
  ctx.beginPath();
  ctx.roundRect(132, totalTop + 6, 760, 70, 18);
  ctx.fillStyle = "#fde6ee";
  ctx.fill();
  ctx.beginPath();
  ctx.arc(178, totalTop + 41, 23, 0, Math.PI * 2);
  ctx.fillStyle = "#fff5f8";
  ctx.fill();
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = PINK;
  ctx.stroke();
  type(ctx, "800 27px " + ROUND, PINK, "center");
  ctx.fillText("$", 178, totalTop + 51);
  type(ctx, "700 32px " + HAND, INK);
  ctx.fillText(estimate ? "Tổng tạm tính" : "Tổng tiền", 220, totalTop + 53);
  type(ctx, "800 42px " + HAND, PINK, "right");
  ctx.fillText(money(bill.total), 866, totalTop + 56);
  type(ctx, "500 17px " + BODY, MUTED);
  estimateLines.forEach(function (line, index) { ctx.fillText(line, 140, totalTop + 104 + index * 24); });

  // Store.
  section(ctx, s3, s3Height, "pin", "THÔNG TIN TIỆM");
  STORE.forEach(function (row, index) {
    const y = s3 + 109 + index * 40;
    icon(ctx, row[0], 160, y - 8, 26);
    type(ctx, "500 22px " + BODY, INK);
    ctx.fillText(row[1], 196, y);
  });
  pastelStar(ctx, billStoreAccent(s3, s3Height));

  // Stub: bouquet, "Hẹn gặp bạn!" with its swoosh, and the QR with the booking code.
  const qrLayout = billStubQrLayout(stubY, bottom);
  dashedLine(ctx, 82, stubY, 942, stubY);
  place(ctx, bouquet, 100, stubY + 32, 118, -6);
  sparkle(ctx, 250, stubY + 64, 22);
  ctx.save();
  ctx.translate(414, stubY + 124);
  ctx.rotate(-8 * Math.PI / 180);
  type(ctx, "400 62px " + SCRIPT, PINK, "center");
  ctx.fillText("Hẹn gặp bạn!", 0, 0);
  ctx.beginPath();
  ctx.moveTo(-112, 36);
  ctx.quadraticCurveTo(0, 17, 104, 26);
  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  ctx.strokeStyle = PINK;
  ctx.stroke();
  ctx.restore();
  heart(ctx, 548, stubY + 134, 24, false);
  dashedLine(ctx, 604, stubY + 26, 604, bottom - 36);
  drawQr(ctx, bill.url, qrLayout.qrX, qrLayout.qrY, qrLayout.qrSize);
  type(ctx, "700 19px " + ROUND, INK, "center");
  ctx.fillText(bill.reference, qrLayout.centerX, qrLayout.referenceY);

  // The owner's cat on the top edge, the bow on the corner, the hearts off the cat's ear.
  place(ctx, bow, 34, 96, 190, -14);
  place(ctx, cat, 220, 8, 300);
  place(ctx, star, 512, 30, 50);
  place(ctx, heartBig, 562, 70, 70);
  place(ctx, heartSmall, 514, 106, 46);

  if (bill.status === "cancelled") {
    ctx.save();
    ctx.translate(640, s1 + 150);
    ctx.rotate(-12 * Math.PI / 180);
    ctx.globalAlpha = .85;
    ctx.lineWidth = 5;
    ctx.strokeStyle = "#d64545";
    ctx.beginPath();
    ctx.roundRect(-150, -52, 300, 104, 18);
    ctx.stroke();
    type(ctx, "800 56px " + HAND, "#d64545", "center");
    ctx.fillText("ĐÃ HỦY", 0, 20);
    ctx.restore();
  }
  return canvas;
}

// The saved bill is the transparent PNG itself (no backdrop), so it can be pasted onto anything. On phones it goes
// through the share sheet, whose "Save Image" puts the PNG in the photo library with its transparency; a download
// link is the fallback (and the path on desktops). Photo viewers may still paint the transparent edges white or black.
function sharesFiles(file) {
  return typeof navigator !== "undefined" && typeof navigator.canShare === "function" && typeof navigator.share === "function"
    && typeof matchMedia === "function" && matchMedia("(pointer: coarse)").matches && navigator.canShare({ files: [file] });
}

function downloadLink(blob, name) {
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = name;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(function () { URL.revokeObjectURL(link.href); }, 10000);
}

export function saveBill(canvas, reference) {
  return new Promise(function (resolve, reject) {
    canvas.toBlob(function (blob) {
      if (!blob) { reject(new Error("bill_render_failed")); return; }
      const name = reference + ".png";
      const file = typeof File === "function" ? new File([blob], name, { type: "image/png" }) : null;
      if (file && sharesFiles(file)) {
        navigator.share({ files: [file] }).then(resolve, function (error) {
          // Closing the sheet is fine; if the browser refuses (the tap is too long ago), download instead.
          if (error && error.name === "AbortError") resolve();
          else { downloadLink(blob, name); resolve(); }
        });
        return;
      }
      downloadLink(blob, name);
      resolve();
    }, "image/png");
  });
}

export async function downloadBill(bill) {
  return saveBill(await renderBill(bill), bill.reference);
}
