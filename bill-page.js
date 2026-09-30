// The page a ticket's QR code opens: asks booking-api for the bill (the link's reference and key), draws it
// and lets the customer save it.
import { API, billUrl, renderBill, saveBill } from "./bill.js?v=20260930-4";

const status = document.querySelector("[data-bill-status]");
const frame = document.querySelector("[data-bill-frame]");
const actions = document.querySelector("[data-bill-actions]");
const download = document.querySelector("[data-bill-download]");
const params = new URLSearchParams(location.search);

async function open() {
  try {
    const answer = await fetch(API, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "bill", reference: params.get("r") || "", key: params.get("k") || "" })
    });
    const body = await answer.json().catch(function () { return {}; });
    if (!answer.ok || !body.bill) throw new Error(body.error || "request_failed");
    const bill = body.bill;
    const canvas = await renderBill(Object.assign({}, bill, { url: billUrl(bill.reference, params.get("k")) }));
    const when = new Intl.DateTimeFormat("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit", year: "numeric", hourCycle: "h23" }).format(new Date(bill.startAt));
    canvas.setAttribute("role", "img");
    canvas.setAttribute("aria-label", "Phiếu đặt lịch " + bill.reference + (bill.status === "cancelled" ? " (đã hủy)" : "") + ": " + bill.name + ", " + when + ", "
      + bill.services.map(function (service) { return service.name; }).join(", ") + ", tổng " + Number(bill.total || 0).toLocaleString("vi-VN") + " đồng.");
    frame.append(canvas);
    frame.hidden = false;
    actions.hidden = false;
    status.hidden = true;
    document.title = "Phiếu đặt lịch " + bill.reference + " · 1M65 Nails";
    download.addEventListener("click", function () {
      download.disabled = true;
      saveBill(canvas, bill.reference).catch(function () {}).then(function () { download.disabled = false; });
    });
  } catch (error) {
    status.textContent = error.message === "appointment_not_found"
      ? "Không tìm thấy phiếu đặt lịch này. Bạn kiểm tra lại mã QR hoặc nhắn Zalo cho tiệm nhé."
      : "Chưa mở được phiếu. Bạn kiểm tra mạng rồi tải lại trang giúp tụi mình nha.";
  }
}

open();
