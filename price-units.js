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
// unit: "full bàn" / "viên" / "charm"; perNail: "7.000₫/ngón"; line: what shows under the price
// ("full bàn · 7.000₫/ngón", "mỗi viên", "mỗi charm"). Services priced per booking get empty unit and line.
export function unitPrice(id, price, symbol) {
  const mark = symbol || "₫", rule = UNITS[id];
  if (!rule) return { price: vnd(price, mark), range: false, unit: "", perNail: "", line: "" };
  const range = Boolean(rule.upTo && rule.upTo > Number(price || 0));
  const perNail = rule.perNail ? vnd(rule.perNail, mark) + "/ngón" : "";
  return {
    price: range ? vnd(price, "") + "–" + vnd(rule.upTo, mark) : vnd(price, mark),
    range: range,
    unit: rule.unit,
    perNail: perNail,
    line: (rule.perNail ? rule.unit : "mỗi " + rule.unit) + (perNail ? " · " + perNail : "")
  };
}
