import { ESTIMATE_NOTE, hasUnitPricing, unitPrice, timeSaleDiscount, timeSaleFor } from "./price-units.js?v=20261004-1";
const API = "https://aomiaszicxqrctcgeoms.supabase.co/functions/v1/booking-api";
const TZ = "Asia/Ho_Chi_Minh";
const REMOVED_SERVICE_IDS = new Set(["goi-thao"]);
const categories = [
{id:"nail",label:"Nail Care",shortLabel:"Nail",ids:["ct-tay","ct-chan","thao-gel","thao-up","thao-bot","noi-up","noi-gel","noi-bot"]},
{id:"classic",label:"Classic",shortLabel:"Classic",ids:["son-cung","gel-hn","gel-thach"]},
{id:"design",label:"Design",shortLabel:"Design",ids:["flash","matmeo","guong","ombre","da","charm","sticker","ve","xacu"]},
{id:"mi",label:"Eyelashes",shortLabel:"Mi",ids:["uon-mi","uon-mi-den","mi-classic","mi-tho","mi-volume","mi-sole","mi-duoi"]},
{id:"goi",label:"Shampoo",shortLabel:"Gội",ids:["goi-thuong","goi-phuchoi","goi-duongsinh"]}
];
// "+84 912 345 678", "84912345678" and "+84 0912 345 678" are the same Vietnamese number as 0912345678.
// After the 84 country code a number never starts with 0 unless that 0 is the trunk prefix itself.
const vnPhone=(value)=>String(value||"").replace(/\D/g,"").replace(/^(?:840(?=\d{9}$)|84(?=[1-9]\d{8}$))/,"0");
// Reference photos (up to 3): uploads are shrunk on the phone before they are sent, so a 108MP
// photo still leaves as a sharp JPEG under 1MB, the private bucket's file limit (and re-drawing it
// drops EXIF, including GPS location).
const MAX_PHOTOS=3,MAX_PHOTO_SOURCE_BYTES=40*1024*1024,MAX_PHOTO_UPLOAD_BYTES=980*1024;
const PICKER_LABELS={nail:"Nail",mi:"Mi",khac:"Khác"};
const state = {step:1,category:"nail",selected:[],date:"",calendarOpen:false,calendarMonth:"",preferred:"",slots:[],blocked:[],day:null,slot:"",loading:false,pending:false,error:"",name:"",phone:"",note:"",status:"",reference:"",photos:[],photoBusy:0,photoError:"",photoWarning:"",picker:false,pickerFilter:"nail",sale:null};
let requestId = 0;

function exp(){return window.__v2Experience;}
function esc(value){return exp().esc(value);}
function services(){
  const source=window.__v2Services&&window.__v2Services.services;
  return Array.isArray(source)?source.filter(function(service){return !REMOVED_SERVICE_IDS.has(service.id)&&service.enabled!==false&&service.active!==false&&service.isActive!==false&&service.status!=="disabled";}):[];
}
function byId(id){return services().find(function(service){return service.id===id;});}
function categoryOf(id){const item=categories.find(function(category){return category.ids.includes(id);});return item?item.id:"nail";}
function duration(service){return Number(service.durationMinutes||service.duration_minutes||service.dur||0);}
function price(service){return Number(service.price||0);}
function money(value){return Number(value||0).toLocaleString("vi-VN")+"₫";}
function durationText(value){const minutes=Number(value||0);if(!minutes)return "—";const hours=Math.floor(minutes/60),rest=minutes%60;return hours?hours+" giờ"+(rest?" "+rest+" phút":""):rest+" phút";}
// Designs priced per nail, stone or charm make the total an estimate: it says so, with one line on how.
function unitPriced(){return hasUnitPricing(state.selected);}
function estimateLabel(){return unitPriced()?'<small class="booking-estimate-label">Tạm tính</small>':"";}
function estimateNote(){return unitPriced()?'<p class="booking-estimate-note">'+ESTIMATE_NOTE+'</p>':"";}
function selectedServices(){return state.selected.map(byId).filter(Boolean);}
function totals(){return selectedServices().reduce(function(out,service){out.price+=price(service);out.minutes+=duration(service);return out;},{price:0,minutes:0});}
// Time-window sales from the site's config (see price-units.js): a slot inside one gets a "−X%" tag and the totals
// preview the cut. The booking's real sale comes back from the server once it is made (state.sale).
function timeSales(){return Array.isArray(window.__v2Sales)?window.__v2Sales:[];}
function slotSale(start){return start?timeSaleFor(timeSales(),start):null;}
function daySale(iso){let best=null;for(let minute=540;minute<=1020;minute+=30){const sale=slotSale(iso+"T"+String(Math.floor(minute/60)).padStart(2,"0")+":"+String(minute%60).padStart(2,"0")+":00+07:00");if(sale&&(!best||sale.percent>best.percent))best=sale;}return best;}
function chosenSale(){return state.sale||slotSale(state.slot);}
function saleCut(){const sale=chosenSale();return sale?(sale.discount!=null?Number(sale.discount):timeSaleDiscount(totals().price,sale.percent)):0;}
function due(){return totals().price-saleCut();}
function saleLine(){const sale=chosenSale();return sale?'<p class="booking-sale-line"><span>Giảm '+esc(sale.title)+' (−'+sale.percent+'%)</span><strong>−'+money(saleCut())+'</strong></p>':"";}
function isoToday(){
  const parts=new Intl.DateTimeFormat("en-CA",{timeZone:TZ,year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(new Date()).reduce(function(out,part){if(part.type!=="literal")out[part.type]=part.value;return out;},{});
  return parts.year+"-"+parts.month+"-"+parts.day;
}
function offsetDate(offset){const parts=isoToday().split("-").map(Number);return new Date(Date.UTC(parts[0],parts[1]-1,parts[2]+offset,12)).toISOString().slice(0,10);}
function dateLabel(iso){return new Intl.DateTimeFormat("vi-VN",{timeZone:TZ,weekday:"short",day:"2-digit",month:"2-digit"}).format(new Date(iso+"T12:00:00+07:00"));}
function slotLabel(value){return new Intl.DateTimeFormat("vi-VN",{timeZone:TZ,hour:"2-digit",minute:"2-digit",hourCycle:"h23"}).format(new Date(value));}
function reset(options){
  const next=options||{};
  state.step=1;state.category=next.serviceId?categoryOf(next.serviceId):"nail";
  state.selected=next.serviceId&&byId(next.serviceId)?[next.serviceId]:[];
  state.date=isoToday();state.calendarOpen=false;state.calendarMonth="";state.preferred=next.slot||"";state.slots=[];state.blocked=[];state.day=null;state.slot="";
  state.loading=false;state.pending=false;state.error="";state.name="";state.phone="";state.note="";state.status="";state.reference="";state.billKey="";state.sale=null;
  state.photos=[];state.photoBusy=0;state.photoError="";state.photoWarning="";state.picker=false;
  requestId+=1;
}
function stepOne(){
  const category=categories.find(function(item){return item.id===state.category;})||categories[0];
  const categoryHtml=categories.map(function(item){return '<button type="button" class="'+(item.id===state.category?"is-active":"")+'" data-booking-category="'+item.id+'" aria-label="'+esc(item.label)+'"><span class="booking-category-label">'+esc(item.label)+'</span><span class="booking-category-short" aria-hidden="true">'+esc(item.shortLabel)+'</span></button>';}).join("");
  const cards=category.ids.map(byId).filter(Boolean).map(function(service){
    const selected=state.selected.includes(service.id);
    const discount=Number(service.discountPercent||0);
    const badgeHtml=discount>0?'<span class="sale-badge">-'+discount+'%</span>':'';
    const shown=unitPrice(service.id,service.price);
    const priceHtml=(discount>0?'<del>'+money(service.originalPrice)+'</del>':'')+'<strong'+(shown.range?' class="is-range"':'')+'>'+shown.price+'</strong>'+(shown.label?'<small class="booking-service-unit">'+shown.label+'</small>':'');
    const saleLabel=discount>0?' aria-label="'+esc(service.name+', giảm '+discount+'%, '+duration(service)+' phút, giá '+money(service.price))+'"':'';
    return '<button type="button" class="booking-service-option '+(selected?"is-selected ":"")+(discount>0?"has-sale":"")+'" data-booking-service="'+esc(service.id)+'" aria-pressed="'+selected+'"'+saleLabel+'><div class="booking-service-copy"><h3>'+esc(service.name)+(shown.perNail?' <span class="service-per-nail">('+shown.perNail+')</span>':'')+'</h3><p><span class="booking-service-duration">'+duration(service)+' phút</span>'+'</p></div><span class="booking-service-side"><span class="booking-service-price"><span class="booking-service-offer-slot" aria-hidden="true">'+badgeHtml+'</span><span class="booking-service-price-card">'+priceHtml+'</span></span><span class="booking-check" aria-hidden="true">'+(selected?"✓":"")+'</span></span></button>';
  }).join("");
  const picked=selectedServices().map(function(service){return '<button type="button" data-booking-remove="'+esc(service.id)+'">'+esc(service.name)+' ×</button>';}).join("");
  const total=totals();
  return '<div class="booking-step" data-booking-step="1"><div class="booking-categories" role="tablist" aria-label="Nhóm dịch vụ">'+categoryHtml+'</div><div class="booking-service-grid">'+cards+'</div>'+(picked?'<div class="booking-picked" aria-label="Dịch vụ đã chọn">'+picked+'</div>':'')+'<div class="booking-total"><span><strong>'+state.selected.length+'/8 dịch vụ</strong><br><small>Tổng thời lượng '+durationText(total.minutes)+'</small></span><strong>'+estimateLabel()+money(total.price)+'</strong></div>'+estimateNote()+'</div>';
}
function schedule(){
  const available=new Map(state.slots.map(function(item){const start=item.start_at||item.startAt;return [slotLabel(start),start];}));
  const blocked=new Map(state.blocked.map(function(item){const start=item.start_at||item.startAt;return [slotLabel(start),item.content==="tiệm hôm nay nghỉ"?"Tiệm nghỉ":(item.content||"Tiệm khóa lịch")];}));
  const booked=new Set((state.day&&Array.isArray(state.day.bookedStarts)?state.day.bookedStarts:[]).map(slotLabel));
  const latestEnd=state.day&&state.day.latestEndAt?new Date(state.day.latestEndAt).getTime():0,minutes=totals().minutes;
  // Why an unavailable slot is unavailable: a real booking keeps "Đã kín"; the rest name the rule that blocks it.
  function reason(label){const start=new Date(state.date+"T"+label+":00+07:00").getTime();if(booked.has(label))return "Đã kín";if(start<=Date.now())return "Đã qua";if(!state.day)return "Đã kín";if(!latestEnd)return "Tiệm nghỉ";if(start+minutes*60000>latestEnd)return "Quá giờ làm";return "Sát lịch khác";}
  const result=[];for(let minute=540;minute<=1020;minute+=30){const label=String(Math.floor(minute/60)).padStart(2,"0")+":"+String(minute%60).padStart(2,"0");result.push({label:label,start:available.get(label)||"",blocked:blocked.get(label)||"",reason:available.has(label)?"":reason(label),sale:slotSale(available.get(label)||"")});}return result;
}
function shiftMonth(month,step){const year=Number(month.slice(0,4)),date=new Date(Date.UTC(year,Number(month.slice(5,7))-1+step,1));return date.getUTCFullYear()+"-"+String(date.getUTCMonth()+1).padStart(2,"0");}
// "Ngày khác" opens this month grid instead of the browser's native date picker (bookable: today + 30 days).
function calendar(){
  const month=state.calendarMonth||state.date.slice(0,7),min=isoToday(),max=offsetDate(30),year=Number(month.slice(0,4)),index=Number(month.slice(5,7))-1;
  const start=Date.UTC(year,index,1-((new Date(Date.UTC(year,index,1)).getUTCDay()+6)%7));let days="";
  for(let i=0;i<42;i++){const day=new Date(start+i*86400000),iso=day.toISOString().slice(0,10),active=iso===state.date;
    days+='<button type="button" class="booking-calendar__day'+(day.getUTCMonth()!==index?" is-out":"")+(active?" is-active":"")+(iso===min?" is-today":"")+'" data-booking-calendar-day="'+iso+'" aria-label="'+esc(dateLabel(iso))+'" aria-pressed="'+active+'"'+(iso<min||iso>max?" disabled":"")+'>'+day.getUTCDate()+'</button>';}
  const dows=["T2","T3","T4","T5","T6","T7","CN"].map(function(label){return '<span>'+label+'</span>';}).join("");
  return '<div class="booking-calendar" role="dialog" aria-label="Chọn ngày"><div class="booking-calendar__head"><button type="button" data-booking-calendar-month="-1" aria-label="Tháng trước"'+(month>min.slice(0,7)?"":" disabled")+'>‹</button><strong>Tháng '+(index+1)+', '+year+'</strong><button type="button" data-booking-calendar-month="1" aria-label="Tháng sau"'+(month<max.slice(0,7)?"":" disabled")+'>›</button></div><div class="booking-calendar__dows" aria-hidden="true">'+dows+'</div><div class="booking-calendar__grid">'+days+'</div></div>';
}
function stepTwo(){
  const hint=daySale(state.date);
  const dates=new Array(7).fill(0).map(function(_,index){const iso=offsetDate(index),parts=iso.split("-"),weekday=dateLabel(iso).split(",")[0];return '<button type="button" class="booking-date '+(state.date===iso?"is-active":"")+'" data-booking-date="'+iso+'"><span>'+(index===0?"Hôm nay":esc(weekday))+'</span><strong>'+parts[2]+'/'+parts[1]+'</strong>'+(daySale(iso)?'<i class="booking-date__sale" aria-hidden="true"></i>':'')+'</button>';}).join("");
  let slots="";
  if(state.loading)slots='<div class="booking-loading">Đang tải giờ trống thật từ tiệm…</div>';
  else if(state.error)slots='<div class="booking-empty" role="alert"><p>'+esc(state.error)+'</p><button class="button-secondary" type="button" data-booking-retry>Thử tải lại</button></div>';
  else slots='<div class="booking-slots">'+schedule().map(function(slot){const selected=state.slot===slot.start&&!!slot.start;return '<button type="button" class="booking-slot '+(selected?"is-active ":"")+(slot.blocked?"is-blocked":"")+'" data-booking-slot="'+esc(slot.start)+'" '+(!slot.start?"disabled":"")+' aria-pressed="'+selected+'"><strong>'+slot.label+'</strong>'+(slot.sale?'<i class="booking-slot__sale">−'+slot.sale.percent+'%</i>':'')+'<small>'+esc(slot.blocked||(slot.start?"Còn trống":slot.reason))+'</small></button>';}).join("")+'</div>';
  return '<div class="booking-step" data-booking-step="2"><div class="booking-dates">'+dates+'</div><div class="booking-calendar-field"><span>Ngày khác</span><button type="button" class="booking-calendar-trigger" data-booking-calendar-toggle aria-haspopup="dialog" aria-expanded="'+state.calendarOpen+'">'+esc(dateLabel(state.date))+'</button>'+(state.calendarOpen?calendar():"")+'</div>'+(hint&&!state.loading&&!state.error?'<p class="booking-sale-hint">Giờ có nhãn −'+hint.percent+'% được giảm '+hint.percent+'% trên tổng bill · '+esc(hint.title)+'</p>':'')+slots+'</div>';
}
function photoField(){
  const tiles=state.photos.map(function(photo,index){
    const gallery=photo.kind==="gallery",label=gallery?photo.title:"Ảnh của bạn";
    return '<figure class="booking-photo"><img src="'+esc(gallery?thumb(photo.src):photo.data)+'" alt="'+esc(label)+'" decoding="async"><figcaption>'+esc(label)+'</figcaption><button type="button" data-booking-photo-remove="'+index+'" aria-label="Bỏ ảnh '+esc(label)+'">×</button></figure>';
  }).join("")+new Array(state.photoBusy).fill('<span class="booking-photo is-busy" role="status" aria-label="Đang xử lý ảnh"></span>').join("");
  const room=MAX_PHOTOS-state.photos.length-state.photoBusy;
  const actions=room>0?'<div class="booking-photo-actions"><label class="booking-photo-button"><input type="file" accept="image/*" multiple data-booking-photo-input>Tải ảnh lên</label><button type="button" class="booking-photo-button" data-booking-photo-picker>Chọn từ thư viện</button></div>':'';
  return '<div class="booking-photos" data-booking-photos><span class="booking-photos__label">Ảnh mẫu <small>tối đa '+MAX_PHOTOS+' ảnh · không bắt buộc</small></span>'+(tiles?'<div class="booking-photo-row">'+tiles+'</div>':'')+actions+(state.photoError?'<p class="booking-photo-error" role="alert">'+esc(state.photoError)+'</p>':'')+'</div>';
}
// After an async photo step only the photo block is redrawn, so a customer typing her name keeps her caret.
function refreshPhotos(){const block=document.querySelector("[data-booking-photos]");if(block&&!state.picker)block.outerHTML=photoField();else render();}
// Gallery picks show the grid's small thumbnail; the booking still sends the original photo's path.
function thumb(src){return exp().galleryThumb?exp().galleryThumb(src,480):src;}
function pickerView(){
  const items=Array.isArray(exp().gallery)?exp().gallery:[];
  const filters=Object.keys(PICKER_LABELS).filter(function(id){return items.some(function(item){return item[0]===id;});});
  const chosen=new Set(state.photos.filter(function(photo){return photo.kind==="gallery";}).map(function(photo){return photo.src;}));
  const full=state.photos.length+state.photoBusy>=MAX_PHOTOS;
  const tabs=filters.map(function(id){return '<button type="button" class="'+(id===state.pickerFilter?"is-active":"")+'" data-booking-picker-filter="'+id+'" aria-pressed="'+(id===state.pickerFilter)+'">'+PICKER_LABELS[id]+'</button>';}).join("");
  const grid=items.filter(function(item){return item[0]===state.pickerFilter;}).map(function(item){
    const selected=chosen.has(item[1]);
    return '<button type="button" class="booking-pick'+(selected?" is-selected":"")+'" data-booking-pick="'+esc(item[1])+'" data-booking-pick-title="'+esc(item[2])+'" aria-pressed="'+selected+'"'+(!selected&&full?" disabled":"")+'><img src="'+esc(thumb(item[1]))+'" alt="" loading="lazy" decoding="async"><span>'+esc(item[2])+'</span><i aria-hidden="true">'+(selected?"✓":"")+'</i></button>';
  }).join("");
  return '<div class="booking-step booking-picker" data-booking-step="picker"><div class="booking-categories booking-picker__tabs" role="group" aria-label="Lọc thư viện">'+tabs+'</div><p class="booking-picker__hint">Chạm để chọn mẫu bạn thích · còn '+Math.max(0,MAX_PHOTOS-state.photos.length-state.photoBusy)+' chỗ</p><div class="booking-pick-grid">'+grid+'</div></div>';
}
function stepThree(){
  const total=totals(),names=selectedServices().map(function(service){return service.name;}).join(" + ");
  const time=state.slot?dateLabel(state.date)+" · "+slotLabel(state.slot):"Chưa chọn giờ";
  return '<div class="booking-step" data-booking-step="3">'+(state.error?'<div class="booking-empty" role="alert">'+esc(state.error)+'</div>':'')+'<div class="booking-confirm-card"><div><strong>'+esc(names)+'</strong><br><small>'+esc(time)+' · '+durationText(total.minutes)+'</small></div><strong>'+estimateLabel()+money(due())+'</strong></div>'+saleLine()+estimateNote()+'<div class="booking-form"><label>Họ và tên<input type="text" autocomplete="name" data-booking-name maxlength="80" required value="'+esc(state.name)+'" placeholder="Tên của bạn"></label><label>Số điện thoại<input type="tel" inputmode="tel" autocomplete="tel" data-booking-phone maxlength="16" required value="'+esc(state.phone)+'" placeholder="0xxxxxxxxx"></label><label>Ghi chú<textarea rows="2" data-booking-note maxlength="500" placeholder="Mẫu mong muốn hoặc điều tiệm cần biết">'+esc(state.note)+'</textarea></label><label class="sr-only">Website<input type="text" tabindex="-1" autocomplete="off" data-booking-website></label></div>'+photoField()+'</div>';
}
// After "Xác nhận đặt hẹn" the form steps aside for a short sequence: a spinner while the booking is
// sent, a tick once it is confirmed, then the booking ticket flies in. Reduced motion skips the waits.
const reduceMotion=window.matchMedia?window.matchMedia("(prefers-reduced-motion: reduce)"):{matches:false};
function wait(ms){return new Promise(function(resolve){setTimeout(resolve,reduceMotion.matches?0:ms);});}
function bookingModal(){return document.querySelector("#booking-modal-v2");}
function setStage(name){
  const modal=bookingModal();if(!modal)return;
  if(!modal.querySelector("[data-booking-sending]"))modal.insertAdjacentHTML("beforeend",'<div class="booking-sending" data-booking-sending role="status" aria-live="polite"><div class="booking-sending__badge"><svg viewBox="0 0 80 80" aria-hidden="true"><circle class="booking-sending__track" cx="40" cy="40" r="34"/><circle class="booking-sending__ring" cx="40" cy="40" r="34"/><path class="booking-sending__tick" d="M25 41l10 10 21-21"/></svg></div><p class="booking-sending__label" data-booking-sending-label></p></div><div class="booking-ticket" data-booking-ticket></div>');
  modal.classList.toggle("is-sending",name==="sending"||name==="confirmed");
  modal.classList.toggle("is-confirmed",name==="confirmed");
  modal.classList.toggle("is-ticket",name==="ticket");
  // The hidden form leaves the focus order, so Tab stays inside the spinner or the ticket.
  const panel=modal.querySelector(".booking-modal-panel");if(panel)panel.inert=!!name;
  const label=modal.querySelector("[data-booking-sending-label]");if(label)label.textContent=name==="sending"?"Đang xác nhận lịch…":(name==="confirmed"?"Đã xác nhận!":"");
  if(name!=="ticket"){const ticket=modal.querySelector("[data-booking-ticket]");if(ticket)ticket.innerHTML="";}
}
// The owner's ticket art lives in assets/booking/confirmation (the decorated wide ticket, plus the portrait
// shell and the cat, bow, hearts, flower, tape and close button that dress it on phones, and the row icons);
// titles, booking data, the button, 1M65 and the barcode stay live.
// The stub's crown and 1M65 are drawn in the ticket outline's watercolour manner: their curves are drawn by hand,
// a stronger line over a pale wash, offset and softened (the small print below gets the same wash as a shadow).
// No wobble filter: at their size it frayed the edges on phones and kinked the curves.
const TICKET_HAND_FILTER='<svg class="booking-ticket__filters" width="0" height="0" aria-hidden="true" focusable="false"><filter id="booking-ticket-wash" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation=".35"/></filter></svg>';
// One brush line per path, drawn twice: the wash under, the line over (dots are the crown's tips).
function inkSvg(className,viewBox,paths,dots){
  const strokes=paths.map(function(path){return '<path d="'+path+'"/>';}).join("");
  return '<svg class="'+className+'" viewBox="'+viewBox+'" aria-hidden="true"><g class="booking-ticket__ink-wash" transform="translate(.7 .5)">'+strokes+'</g><g class="booking-ticket__ink-line">'+strokes+(dots||[]).map(function(dot){return '<circle cx="'+dot[0]+'" cy="'+dot[1]+'" r="2.3"/>';}).join("")+'</g></svg>';
}
const TICKET_CROWN=["M9 37C8.2 29 6.4 20 5 13C10.5 16.5 15.2 20.4 19.2 24.2C23.4 17.6 27.6 11.6 32 6C36.2 11.6 40.6 17.6 44.8 24.2C48.8 20.4 53.5 16.5 59 13C57.6 20 55.8 29 55 37C40.4 35.7 23.6 35.7 9 37Z","M10.5 41.6C22 40.5 41.5 40.7 53.5 41.7"];
const TICKET_WORDMARK=[
  "M5 15.5C8 14 10.4 11.6 12.4 8.6C12.7 17.8 12.6 27 12.9 36",
  "M21 36C20.6 25 21 15.6 22.6 10C23.4 7.4 25.2 7.6 26.2 10C28.2 15.2 30.2 20.8 32.2 26.2C34.2 20.8 36.2 15.2 38.2 10C39.2 7.6 41 7.4 41.8 10C43.4 15.6 43.9 25 43.8 36",
  "M66.2 10.4C60.4 8.6 54.4 13.2 53.4 21.8C52.6 29.6 55.8 36.4 61.4 36.2C66.4 36 68.8 31.8 68.4 27.6C68 23.2 64.4 20.6 60.6 21.2C57.2 21.8 54.8 24.4 53.8 27.4",
  "M92.4 9.4C87.4 8.8 82.6 8.9 78.3 9.4C77.8 13 77.3 16.6 76.8 20.6C80.4 18.6 85.4 18.4 89 21C92.8 23.8 92.9 31 89.2 34.2C85.6 37.3 79.8 37 76.2 34.2"
];
const TICKET_ART="assets/booking/confirmation/";
const TICKET_ICONS={
  download:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v11M7.5 10.5 12 15l4.5-4.5M5 19.5h14"/></svg>',
  calendar:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="5" width="17" height="15.5" rx="3"/><path d="M3.5 10h17M8 3v4M16 3v4M8 14h2M12 14h2M16 14h.5M8 17h2M12 17h2"/></svg>',
  crown:inkSvg("booking-ticket__crown","-2 -1 68 46",TICKET_CROWN,[[5,11.2],[32,4],[59,11.2]])
};
const TICKET_HEART="M0 6.5C-3 4-8 .8-8-2.8C-8-5.6-5.8-7.4-3.6-7.4C-2-7.4-.6-6.5 0-5.2C.6-6.5 2-7.4 3.6-7.4C5.8-7.4 8-5.6 8-2.8C8 .8 3 4 0 6.5Z";
const TICKET_STAR="M0-7C.6-2.2 2.2-.6 7 0C2.2.6.6 2.2 0 7C-.6 2.2-2.2.6-7 0C-2.2-.6-.6-2.2 0-7Z";
// Outline sparkles in the art's amber, two to a cluster like the reference.
function ticketSparkles(className){return '<svg class="booking-ticket__deco '+className+'" viewBox="-9 -9 30 28" aria-hidden="true"><g fill="#fff4d6" stroke="#f0a43a" stroke-width="1.3" stroke-linejoin="round"><path d="'+TICKET_STAR+'"/><path d="'+TICKET_STAR+'" transform="translate(13 12) scale(.6)"/></g></svg>';}
function ticketHeart(className){return '<svg class="'+className+'" viewBox="-9.5 -9 19 17" aria-hidden="true"><path d="'+TICKET_HEART+'" fill="#f38bab" stroke="#e8628d" stroke-width="1" stroke-linejoin="round"/></svg>';}
// A decorative barcode drawn from the booking code, so every ticket's bars differ.
function barcodeSvg(code){
  let x=0,bars="";
  String(code||"").split("").forEach(function(character){const value=character.charCodeAt(0);for(let bit=0;bit<3;bit++){const width=1+((value>>bit)&1)*2;bars+='<rect x="'+x+'" width="'+width+'" height="56"/>';x+=width+1+((value>>(bit+3))&1);}});
  return '<svg class="booking-ticket__barcode" viewBox="0 0 '+Math.max(1,x)+' 56" preserveAspectRatio="none" aria-hidden="true">'+bars+'</svg>';
}
// The bill (bill.js: the QR, the "Phiếu đặt lịch" picture, its download) loads while the booking is sent; the
// stub keeps the drawn barcode and the ticket skips its download button if it cannot load.
let billLib=null,billLoading=null;
function loadBill(){return billLoading||(billLoading=import("./bill.js?v=20261004-1").then(function(lib){billLib=lib;return lib;},function(){billLoading=null;return null;}));}
function ticketBill(){
  const services=selectedServices().map(function(service){return {id:service.id,name:service.name,price:price(service)};});
  return {reference:state.reference,name:state.name.trim(),phone:billLib.maskPhone(vnPhone(state.phone)),note:state.note.trim(),startAt:state.slot,status:"confirmed",services:services,subtotal:totals().price,sale:state.sale,total:due(),url:billLib.billUrl(state.reference,state.billKey)};
}
function ticketHtml(){
  const art=function(className,file){return '<img class="booking-ticket__deco '+className+'" src="'+TICKET_ART+file+'" alt="" aria-hidden="true" decoding="async">';};
  const when=state.slot?slotLabel(state.slot)+" · "+state.date.split("-").reverse().join("/"):"";
  const row=function(icon,label,value){return '<div class="booking-ticket__row"><img class="booking-ticket__row-icon" src="'+TICKET_ART+icon+'" alt="" aria-hidden="true" decoding="async"><dt>'+label+'</dt><dd>'+value+'</dd></div>';};
  return '<div class="booking-ticket__card" tabindex="-1" aria-labelledby="booking-ticket-title">'
    +art("booking-ticket__cat","cat-peeking.webp")+art("booking-ticket__bow","pink-bow.webp")+'<span class="booking-ticket__deco booking-ticket__hearts" aria-hidden="true">'+["star","heart-big","heart-small"].map(function(piece){return '<img class="booking-ticket__heart-piece booking-ticket__heart-piece--'+piece+'" src="'+TICKET_ART+'ticket-'+piece+'.webp" alt="" decoding="async">';}).join("")+'</span>'
    +ticketSparkles("booking-ticket__sparkles booking-ticket__sparkles--title")
    +'<button type="button" class="booking-ticket__close" data-close-modal aria-label="Đóng"><img src="'+TICKET_ART+'close-button.webp" alt="" decoding="async"></button>'
    +'<div class="booking-ticket__main"><div class="booking-ticket__heading"><p class="booking-ticket__eyebrow">Đã đặt hẹn</p>'
    +'<h2 id="booking-ticket-title">Đặt lịch thành công!</h2></div>'
    +'<p class="booking-ticket__thanks">Cảm ơn bạn đã đặt lịch tại 1M65.</p>'
    +'<p class="booking-ticket__note"><span class="booking-ticket__nowrap">Nhu Nhi đã giữ chỗ cho bạn rồi,</span> <span class="booking-ticket__nowrap">hẹn gặp bạn ở tiệm nhé '+ticketHeart("booking-ticket__note-heart")+'</span></p>'
    +'<dl class="booking-ticket__info">'
    +row("calendar-icon.webp","Mã lịch hẹn",'<span class="booking-ticket__code">'+esc(state.reference)+'</span>')
    +(when?row("clock-icon.webp","Lịch hẹn",esc(when)):"")
    +row("total-icon.svg",unitPriced()?"Tạm tính":"Tổng tiền",'<span class="booking-ticket__total">'+money(due())+'</span>'+(state.sale?'<small class="booking-ticket__sale">Đã giảm '+state.sale.percent+'% · '+esc(state.sale.title)+'</small>':""))
    +'</dl>'
    +'<div class="booking-ticket__actions"><button class="booking-ticket__cta button-primary" type="button" data-booking-manage>'+TICKET_ICONS.calendar+'Xem lịch của bạn</button>'
    +(billLib?'<button class="booking-ticket__download" type="button" data-booking-download>'+TICKET_ICONS.download+'Tải phiếu</button>':'')+'</div></div>'
    +'<div class="booking-ticket__stub" aria-hidden="true">'+TICKET_HAND_FILTER+'<div class="booking-ticket__brand">'+TICKET_ICONS.crown+'<strong>'+inkSvg("booking-ticket__wordmark","0 3 98 38",TICKET_WORDMARK)+ticketHeart("booking-ticket__brand-heart")+'</strong><small>NAIL - EYE - SHAMPOO</small></div>'
    +'<div class="booking-ticket__scan">'+(billLib?billLib.qrSvg(billLib.billUrl(state.reference,state.billKey),"booking-ticket__qr"):barcodeSvg(state.reference))+'</div></div></div>';
}
function showTicket(){
  const modal=bookingModal(),holder=modal&&modal.querySelector("[data-booking-ticket]");if(!holder)return;
  holder.innerHTML=ticketHtml();setStage("ticket");
  holder.querySelector(".booking-ticket__card").focus({preventScroll:true});
  // The ticket art has no room for it, so a photo that failed to upload is flagged in a toast instead.
  if(state.photoWarning)exp().toast(state.photoWarning);
}
function render(){
  const body=document.querySelector("[data-booking-body]"),eyebrow=document.querySelector("[data-booking-eyebrow]"),title=document.querySelector("[data-booking-title]"),back=document.querySelector("[data-booking-back]"),next=document.querySelector("[data-booking-next]"),summary=document.querySelector("[data-booking-summary]");
  if(!body||!eyebrow||!title||!back||!next||!summary)return;
  if(state.status==="done")return; // the ticket has taken over; the hidden form is left as it was
  if(state.picker){eyebrow.textContent="Đặt hẹn · ảnh mẫu";title.textContent="Chọn mẫu từ thư viện";body.innerHTML=pickerView();back.textContent="Quay lại";next.disabled=false;next.textContent="Xong ("+state.photos.length+"/"+MAX_PHOTOS+")";summary.textContent="";return;}
  const titles=["Bạn muốn làm gì hôm nay?","Mình ghé tiệm lúc nào?","Cho tiệm biết tên bạn nhé"];
  eyebrow.textContent="Đặt hẹn · bước "+state.step+"/3";title.textContent=titles[state.step-1];body.innerHTML=state.step===1?stepOne():(state.step===2?stepTwo():stepThree());back.textContent=state.step===1?"Để sau":"Quay lại";next.disabled=state.pending||state.loading;
  next.textContent=state.pending?(state.photos.some(function(photo){return photo.kind==="upload";})?"Đang gửi ảnh…":"Đang xác nhận…"):(state.step===1?(state.selected.length?"Chọn ngày & giờ":"Chọn dịch vụ trước"):(state.step===2?"Nhập thông tin":"Xác nhận đặt hẹn"));
  const total=totals();summary.textContent=state.selected.length+" dịch vụ · "+durationText(total.minutes)+" · "+(unitPriced()?"tạm tính ":"")+money(due())+(chosenSale()?" (đã giảm "+chosenSale().percent+"%)":"")+(state.step===3&&state.photos.length?" · "+state.photos.length+" ảnh mẫu":"");
}
async function request(action,payload){
  const response=await fetch(API,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(Object.assign({action:action},payload||{}))});
  const body=await response.json().catch(function(){return {};});if(!response.ok){const error=new Error(body.error||"request_failed");error.code=body.error||"request_failed";throw error;}return body;
}
async function availability(){
  if(!state.selected.length)return;const current=++requestId;state.loading=true;state.error="";state.slot="";render();
  try{
    const body=await request("availability",{date:state.date,serviceIds:state.selected.slice()});if(current!==requestId)return;
    state.slots=Array.isArray(body.slots)?body.slots:[];state.blocked=Array.isArray(body.blockedSlots)?body.blockedSlots:[];state.day=body.daySchedule||null;
    if(state.preferred){const match=state.slots.find(function(item){return slotLabel(item.start_at||item.startAt)===state.preferred;});if(match)state.slot=String(match.start_at||match.startAt);else exp().toast(state.preferred+" không còn trống — bạn chọn giờ khác nha");state.preferred="";}
  }catch(_){if(current!==requestId)return;state.slots=[];state.blocked=[];state.day=null;state.error="Chưa tải được lịch trống. Bạn thử lại giúp tụi mình nha.";}
  finally{if(current===requestId){state.loading=false;render();}}
}
// The ticket's handwriting face is fetched while the form is filled in, so the ticket never flashes a fallback.
// The ticket's paper (a CSS background, so otherwise fetched only once the ticket is on screen) and its stickers
// are fetched and decoded while the form is filled in, so the ticket lands whole instead of paperless for a second.
let ticketArt=null;
function preloadTicketArt(){
  if(ticketArt)return;
  const shell=matchMedia("(max-width: 899px) and (orientation: portrait)").matches?"ticket-shell-mobile.webp":"ticket-shell-desktop.webp";
  ticketArt=[shell,"cat-peeking.webp","pink-bow.webp","ticket-star.webp","ticket-heart-big.webp","ticket-heart-small.webp","close-button.webp","calendar-icon.webp","clock-icon.webp","total-icon.svg"].map(function(file){const image=new Image();image.src=TICKET_ART+file;image.decode().catch(function(){});return image;});
}
// A tap opens the popup at once with a loading paw, and the service grid is built on the next frame, so the
// first frame answers the tap instead of waiting for the grid (options.defer; scripts calling open() get it built).
const LOADING_PAW='<div class="popup-loading" role="status" aria-label="Đang mở"><img src="assets/ui/cat_paw_cursor_upright.webp" alt="" decoding="async"></div>';
function open(options,trigger){reset(options);setStage("");
  if(options&&options.defer){const body=document.querySelector("[data-booking-body]"),eyebrow=document.querySelector("[data-booking-eyebrow]"),title=document.querySelector("[data-booking-title]");if(body)body.innerHTML=LOADING_PAW;if(eyebrow)eyebrow.textContent="Đặt hẹn · bước 1/3";if(title)title.textContent="Bạn muốn làm gì hôm nay?";requestAnimationFrame(function(){requestAnimationFrame(render);});}
  else render();
  exp().openModal(document.querySelector("#booking-modal-v2"),trigger);if(document.fonts)document.fonts.load('700 1em "Baloo 2"',"Đặt lịch thành công").catch(function(){});preloadTicketArt();}
function toggle(id){if(state.selected.includes(id))state.selected=state.selected.filter(function(item){return item!==id;});else if(state.selected.length>=8)return exp().toast("Mỗi lịch chọn tối đa 8 dịch vụ nha");else state.selected=state.selected.concat(id);state.error="";render();}
function back(){
  state.calendarOpen=false;
  if(state.picker){state.picker=false;render();return;}
  if(state.status==="done"||state.step===1)return exp().closeModal(document.querySelector("#booking-modal-v2"));
  state.step-=1;state.error="";render();
}
async function next(){
  state.calendarOpen=false;
  if(state.picker){state.picker=false;render();return;}
  if(state.status==="done"){reset();setStage("");render();return;}
  if(state.step===1){if(!state.selected.length)return exp().toast("Bạn chọn ít nhất một dịch vụ trước nha");state.step=2;render();await availability();return;}
  if(state.step===2){if(!state.slot)return exp().toast("Bạn chọn một giờ còn trống trước nha");state.step=3;state.error="";render();requestAnimationFrame(function(){document.querySelector("[data-booking-name]")?.focus();});return;}
  await submit();
}
async function submit(){
  if(state.pending)return;const name=state.name.trim(),phone=vnPhone(state.phone),website=document.querySelector("[data-booking-website]")?.value||"";
  if(state.photoBusy)return exp().toast("Ảnh đang được xử lý, bạn chờ chút xíu nha");
  if(name.length<2){state.error="Bạn nhập giúp tiệm họ tên từ 2 ký tự nhé.";render();document.querySelector("[data-booking-name]")?.focus();return;}
  if(!/^0\d{9}$/.test(phone)){state.error="Số điện thoại cần đủ 10 số, bắt đầu bằng 0 hoặc +84.";render();document.querySelector("[data-booking-phone]")?.focus();return;}
  state.pending=true;state.error="";render();
  const started=Date.now();setStage("sending");const billReady=loadBill();
  try{
    if(!window.mewTurnstileBooking||typeof window.mewTurnstileBooking.getToken!=="function"){const error=new Error("turnstile_unavailable");error.code="turnstile_unavailable";throw error;}
    const token=await window.mewTurnstileBooking.getToken();
    const body=await request("create",{serviceId:state.selected[0],serviceIds:state.selected.slice(),startAt:state.slot,customerName:name,customerPhone:phone,customerNote:state.note.trim(),turnstileToken:token,website:website,referencePhotos:state.photos.map(function(photo){return photo.kind==="upload"?{kind:"upload",data:photo.data}:{kind:"gallery",src:photo.src,title:photo.title};})});
    state.status="done";state.reference=String((body.appointment&&body.appointment.reference)||"Đã xác nhận");state.billKey=String(body.billKey||"");state.sale=body.appointment&&body.appointment.sale||null;
    const missing=state.photos.length-Number(body.photosSaved||0);
    state.photoWarning=state.photos.length&&missing>0?"Lịch đã xác nhận, nhưng "+missing+" ảnh mẫu chưa gửi được. Bạn nhắn Zalo ảnh đó cho tiệm giúp tụi mình nhé.":"";
    // Let the spinner show for a beat even on a fast network, draw the tick, then fly the ticket in.
    await wait(Math.max(0,900-(Date.now()-started)));
    setStage("confirmed");await wait(1050);await billReady;
    showTicket();
  }catch(error){
    setStage("");
    if(error.code==="slot_unavailable"){state.step=2;state.pending=false;exp().toast("Khung giờ vừa có khách khác chọn. Tụi mình đang tải lại lịch.");render();await availability();return;}
    state.error=error.code==="phone_daily_limit"?"Số điện thoại này đã có lịch trong ngày đó rồi. Bạn xem hoặc dời lịch cũ ở “Xem lịch của bạn”, hoặc nhắn Zalo cho tiệm nhé.":error.code==="phone_booking_limit"?"Số điện thoại này đang có nhiều lịch sắp tới nên chưa đặt thêm được. Bạn xem hoặc hủy bớt ở “Xem lịch của bạn”, hoặc nhắn Zalo cho tiệm nhé.":error.code==="ip_booking_limit"?"Thiết bị hoặc mạng này đã đặt nhiều lịch trong 24 giờ qua. Bạn thử lại sau hoặc nhắn Zalo cho tiệm để được hỗ trợ nhé.":error.code==="human_verification_failed"||error.code==="turnstile_unavailable"?"Chưa xác minh được bạn là người thật. Bạn thử lại giúp tụi mình nha.":error.code==="invalid_reference_photos"||error.code==="request_too_large"?"Có ảnh mẫu chưa gửi được. Bạn bỏ ảnh đó rồi thử lại, hoặc nhắn Zalo ảnh cho tiệm nhé.":"Chưa thể xác nhận lịch. Bạn kiểm tra mạng rồi thử lại giúp tụi mình nha.";
  }finally{state.pending=false;render();}
}
function decodePhoto(file){
  if(window.createImageBitmap)return createImageBitmap(file);
  return new Promise(function(resolve,reject){const image=new Image();image.onload=function(){resolve(image);};image.onerror=reject;image.src=URL.createObjectURL(file);});
}
// A one-step 4000 -> 2048px draw samples too few pixels and smears fine nail detail, so the photo is
// halved in steps (each canvas kept under 16MP for iOS) with high-quality smoothing.
function drawScaled(source,width,height,targetWidth,targetHeight){
  let current=source,currentWidth=width,currentHeight=height;
  while(currentWidth/2>=targetWidth){
    const fit=Math.min(.5,Math.sqrt(16e6/(currentWidth*currentHeight))),step=document.createElement("canvas");
    step.width=Math.max(targetWidth,Math.round(currentWidth*fit));step.height=Math.max(targetHeight,Math.round(currentHeight*fit));
    const stepContext=step.getContext("2d");stepContext.imageSmoothingQuality="high";stepContext.drawImage(current,0,0,step.width,step.height);
    current=step;currentWidth=step.width;currentHeight=step.height;
  }
  const canvas=document.createElement("canvas");canvas.width=targetWidth;canvas.height=targetHeight;
  const context=canvas.getContext("2d");context.fillStyle="#fff";context.fillRect(0,0,targetWidth,targetHeight);
  context.imageSmoothingQuality="high";context.drawImage(current,0,0,targetWidth,targetHeight);
  return canvas;
}
// Longest edge 2048px at JPEG 0.9; only very busy photos step down (0.82, then 1800px, then 1600px) to stay under 980KB.
async function shrinkPhoto(file){
  const source=await decodePhoto(file);const width=source.width||source.naturalWidth,height=source.height||source.naturalHeight;
  try{
    for(const [edge,quality] of [[2048,.9],[2048,.82],[1800,.8],[1600,.78]]){
      const scale=Math.min(1,edge/Math.max(width,height));
      const canvas=drawScaled(source,width,height,Math.max(1,Math.round(width*scale)),Math.max(1,Math.round(height*scale)));
      const blob=await new Promise(function(resolve){canvas.toBlob(resolve,"image/jpeg",quality);});
      if(blob&&blob.size<=MAX_PHOTO_UPLOAD_BYTES)return await new Promise(function(resolve,reject){const reader=new FileReader();reader.onload=function(){resolve(String(reader.result));};reader.onerror=reject;reader.readAsDataURL(blob);});
    }
  }finally{if(source.close)source.close();}
  throw new Error("photo_too_large");
}
async function addPhotoFiles(files){
  const room=MAX_PHOTOS-state.photos.length-state.photoBusy,picked=Array.from(files||[]);
  state.photoError=picked.length>room?"Mỗi lịch gửi tối đa "+MAX_PHOTOS+" ảnh nha.":"";
  const accepted=picked.slice(0,Math.max(0,room)).filter(function(file){
    if(!/^image\//.test(file.type||"")){state.photoError="Tệp “"+file.name+"” không phải ảnh.";return false;}
    if(file.size>MAX_PHOTO_SOURCE_BYTES){state.photoError="Ảnh “"+file.name+"” lớn quá 40MB, bạn chọn ảnh khác nha.";return false;}
    return true;
  });
  state.photoBusy+=accepted.length;refreshPhotos();
  await Promise.all(accepted.map(async function(file){
    try{const data=await shrinkPhoto(file);if(state.photos.length<MAX_PHOTOS)state.photos.push({kind:"upload",data:data});}
    catch(_){state.photoError="Ảnh “"+file.name+"” chưa đọc được. Bạn thử chụp màn hình ảnh đó rồi gửi lại nhé.";}
    finally{state.photoBusy-=1;refreshPhotos();}
  }));
}
function togglePick(src,title){
  const index=state.photos.findIndex(function(photo){return photo.kind==="gallery"&&photo.src===src;});
  if(index>=0)state.photos.splice(index,1);else if(state.photos.length+state.photoBusy<MAX_PHOTOS)state.photos.push({kind:"gallery",src:src,title:title});
  render();
}
document.addEventListener("click",function(event){
  const target=event.target,category=target.closest("[data-booking-category]"),service=target.closest("[data-booking-service]"),remove=target.closest("[data-booking-remove]"),date=target.closest("[data-booking-date]"),slot=target.closest("[data-booking-slot]");
  const calendarToggle=target.closest("[data-booking-calendar-toggle]"),calendarMonth=target.closest("[data-booking-calendar-month]"),calendarDay=target.closest("[data-booking-calendar-day]");
  if(calendarToggle){state.calendarOpen=!state.calendarOpen;state.calendarMonth=state.date.slice(0,7);render();if(state.calendarOpen)document.querySelector(".booking-calendar__day.is-active:not(:disabled), .booking-calendar__day.is-today")?.focus();return;}
  if(calendarMonth){state.calendarMonth=shiftMonth(state.calendarMonth||state.date.slice(0,7),Number(calendarMonth.dataset.bookingCalendarMonth));render();return;}
  if(calendarDay){state.date=calendarDay.dataset.bookingCalendarDay;state.calendarOpen=false;state.preferred="";render();document.querySelector("[data-booking-calendar-toggle]")?.focus();availability();return;}
  if(state.calendarOpen&&!target.closest(".booking-calendar-field")){state.calendarOpen=false;render();}
  if(category){
    state.category=category.dataset.bookingCategory;
    // Only the chosen tab and the service list change: the bar stays, so its pill can glide (experience.js, phones).
    const grid=document.querySelector("[data-booking-body] .booking-service-grid");
    if(grid&&!state.picker&&state.step===1){
      category.parentElement.querySelectorAll("[data-booking-category]").forEach(function(button){button.classList.toggle("is-active",button===category);});
      const holder=document.createElement("div");holder.innerHTML=stepOne();grid.replaceWith(holder.querySelector(".booking-service-grid"));
    }else render();
    return;
  }
  if(service){toggle(service.dataset.bookingService);return;}
  if(remove){toggle(remove.dataset.bookingRemove);return;}
  if(date){state.date=date.dataset.bookingDate;state.preferred="";render();availability();return;}
  if(slot&&slot.dataset.bookingSlot){state.slot=slot.dataset.bookingSlot;render();return;}
  if(target.closest("[data-booking-retry]")){availability();return;}
  const photoRemove=target.closest("[data-booking-photo-remove]");if(photoRemove){state.photos.splice(Number(photoRemove.dataset.bookingPhotoRemove),1);state.photoError="";refreshPhotos();return;}
  if(target.closest("[data-booking-photo-picker]")){const items=Array.isArray(exp().gallery)?exp().gallery:[];if(!items.some(function(item){return item[0]===state.pickerFilter;})&&items.length)state.pickerFilter=items[0][0];state.picker=true;render();document.querySelector(".booking-picker__tabs .is-active")?.focus();return;}
  const pickerFilter=target.closest("[data-booking-picker-filter]");if(pickerFilter){state.pickerFilter=pickerFilter.dataset.bookingPickerFilter;render();return;}
  const pick=target.closest("[data-booking-pick]");if(pick){togglePick(pick.dataset.bookingPick,pick.dataset.bookingPickTitle||"");return;}
  if(target.closest("[data-booking-back]")){back();return;}
  if(target.closest("[data-booking-next]")){next();return;}
  if(target.closest("[data-booking-reset]")){reset();setStage("");render();return;}
  const download=target.closest("[data-booking-download]");
  if(download&&billLib){download.disabled=true;billLib.downloadBill(ticketBill()).catch(function(){exp().toast("Chưa tải được phiếu. Bạn thử lại giúp tụi mình nha.");}).then(function(){download.disabled=false;});return;}
  const manage=target.closest("[data-booking-manage]");if(manage){const reference=state.reference;exp().closeModal(document.querySelector("#booking-modal-v2"),false);exp().openManager(reference,manage);}
});
document.addEventListener("input",function(event){
  const target=event.target;if(target.matches("[data-booking-name]"))state.name=target.value;
  if(target.matches("[data-booking-phone]")){const typed=vnPhone(target.value);state.phone=typed.slice(0,typed.startsWith("0")?10:12);if(target.value!==state.phone)target.value=state.phone;}
  if(target.matches("[data-booking-note]"))state.note=target.value;
});
document.addEventListener("change",function(event){
  const input=event.target;if(!input.matches||!input.matches("[data-booking-photo-input]"))return;
  const files=input.files;addPhotoFiles(files);
});
document.addEventListener("keydown",function(event){
  if(event.key!=="Escape"||!state.calendarOpen)return;event.preventDefault();event.stopImmediatePropagation();
  state.calendarOpen=false;render();document.querySelector("[data-booking-calendar-toggle]")?.focus();
},true);
reset();
window.__v2Booking={open:open};
// Temporary, local only: a floating "▶ Ticket" button replays just the ticket's entrance with sample
// data, so its motion can be tuned without booking anything. Remove once the motion is final; it never
// renders on the live site (localhost and private network addresses only, for testing from a phone).
if(typeof location!=="undefined"&&document.body&&/^(localhost|127\.0\.0\.1|\[::1\]|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+)$/.test(location.hostname)){
  const replay=document.createElement("button");
  replay.type="button";replay.textContent="▶ Ticket";replay.setAttribute("data-booking-ticket-replay","");
  replay.style.cssText="position:fixed;left:12px;bottom:12px;z-index:400;padding:10px 16px;border:2px dashed #e45a86;border-radius:999px;background:#fff;color:#c23b66;font:700 14px/1 sans-serif;cursor:pointer;box-shadow:0 6px 16px rgba(0,0,0,.18)";
  replay.addEventListener("click",function(){
    const modal=bookingModal();if(!modal)return;
    reset();state.status="done";state.selected=["ve"];state.reference="1M65-260927-CD102D";state.date=offsetDate(1);state.slot=new Date(state.date+"T10:00:00+07:00").toISOString();state.sale=slotSale(state.slot);
    state.name="Nguyễn Thị Mai";state.phone="0987654321";
    // The popup opens in the same task as the ticket, so its empty form never shows behind it.
    preloadTicketArt();loadBill().then(function(){if(modal.hidden)exp().openModal(modal,replay);setStage("");showTicket();});
  });
  document.body.append(replay);
}

