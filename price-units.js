// The owner's menu prices some designs per nail, per stone or per charm. Each one's booking price is the
// estimate for one unit (a full hand of the finish, one stone, one charm at its lowest price), so a total
// that holds them is "tạm tính" and the salon settles it when the work is done. Shared by the services tab,
// the booking modal and the bill.
const UNITS = {
  flash: { unit: "full bàn", perNail: 7000 },
  matmeo: { unit: "full bàn", perNail: 10000 },
  guong: { unit: "full bàn", perNail: 10000 },
  ombre: { unit: "full bàn", perNail: 10000 },
  da: { unit: "viên" },
  charm: { unit: "charm", upTo: 20000 }
};

export const ESTIMATE_NOTE = "Giá tạm tính: flash, mắt mèo, tráng gương, ombre theo full bàn (làm lẻ tính theo ngón), đính đá theo số viên, charm 10.000–20.000₫ tuỳ mẫu. Tiệm chốt giá khi làm.";

const vnd = (value, symbol) => Number(value || 0).toLocaleString("vi-VN") + symbol;

export function hasUnitPricing(ids) {
  return ids.some(function (id) { return Boolean(UNITS[id]); });
}

// A price with how it is counted. price: "40.000₫", or a charm's range "10.000–20.000₫" (range: true);
// unit: "full bàn" / "viên" / "charm"; perNail: "7.000₫/ngón"; label: how the price counts ("full bàn",
// "mỗi viên", "mỗi charm"); line: the label with the per-nail price ("full bàn · 7.000₫/ngón").
// Services priced per booking get empty unit, label and line.
export function unitPrice(id, price, symbol) {
  const mark = symbol || "₫", rule = UNITS[id];
  if (!rule) return { price: vnd(price, mark), range: false, unit: "", perNail: "", label: "", line: "" };
  const range = Boolean(rule.upTo && rule.upTo > Number(price || 0));
  const perNail = rule.perNail ? vnd(rule.perNail, mark) + "/ngón" : "";
  const label = rule.perNail ? rule.unit : "mỗi " + rule.unit;
  return {
    price: range ? vnd(price, "") + "–" + vnd(rule.upTo, mark) : vnd(price, mark),
    range: range,
    unit: rule.unit,
    perNail: perNail,
    label: label,
    line: label + (perNail ? " · " + perNail : "")
  };
}

// Time-window sales (booking_sales, set in the admin): a booking whose start time falls inside an active sale's
// [startsAt, endsAt) gets that sale's percent off its total; when two overlap the higher percent wins, then the
// earlier start. The database trigger booking_apply_sale is the authority; these preview it on the site and admin.
// sales: [{ id, title, percent, startsAt, endsAt, active? }] (the site's config lists only active ones).
const TIME_SALE_TZ = "Asia/Ho_Chi_Minh";

export function timeSaleFor(sales, startAt) {
  const time = new Date(startAt).getTime();
  if (!Number.isFinite(time)) return null;
  let best = null;
  (Array.isArray(sales) ? sales : []).forEach(function (sale) {
    const from = new Date(sale.startsAt).getTime(), to = new Date(sale.endsAt).getTime();
    if (sale.active === false || !(time >= from && time < to)) return;
    if (!best || sale.percent > best.percent || (sale.percent === best.percent && from < new Date(best.startsAt).getTime())) best = sale;
  });
  return best;
}

export function timeSaleDiscount(subtotal, percent) {
  return Math.round(Number(subtotal || 0) * Number(percent || 0) / 100);
}

// The sale the home page features: the running one with the highest percent, else the next one to start within
// seven days; null when there is none.
export function featuredTimeSale(sales, now) {
  const at = now == null ? Date.now() : now, week = 7 * 24 * 60 * 60 * 1000;
  const live = (Array.isArray(sales) ? sales : []).filter(function (sale) {
    return sale.active !== false && new Date(sale.endsAt).getTime() > at;
  });
  const running = live.filter(function (sale) { return new Date(sale.startsAt).getTime() <= at; })
    .sort(function (first, second) { return second.percent - first.percent; });
  if (running.length) return running[0];
  return live.filter(function (sale) { return new Date(sale.startsAt).getTime() - at <= week; })
    .sort(function (first, second) { return new Date(first.startsAt).getTime() - new Date(second.startsAt).getTime(); })[0] || null;
}

function timeSaleParts(value) {
  const map = {};
  new Intl.DateTimeFormat("en-GB", { timeZone: TIME_SALE_TZ, day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" })
    .formatToParts(new Date(value)).forEach(function (part) { map[part.type] = part.value; });
  return { day: map.day + "/" + map.month, time: Number(map.hour) + ":" + map.minute, midnight: map.hour === "00" && map.minute === "00" };
}

// When a sale runs, in Vietnam time: "20/10, 9:00–21:00", "20/10 18:00 – 21/10 12:00", "20/10" for one whole
// day and "01/10 – 31/10" for whole days.
export function timeSaleWhen(sale) {
  const from = timeSaleParts(sale.startsAt), to = timeSaleParts(sale.endsAt);
  if (from.midnight && to.midnight) {
    const last = timeSaleParts(new Date(sale.endsAt).getTime() - 1);
    return last.day === from.day ? from.day : from.day + " – " + last.day;
  }
  if (from.day === to.day) return from.day + ", " + from.time + "–" + to.time;
  return from.day + " " + from.time + " – " + to.day + " " + to.time;
}
