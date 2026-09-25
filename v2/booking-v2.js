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
const state = {step:1,category:"nail",selected:[],date:"",calendarOpen:false,calendarMonth:"",preferred:"",slots:[],blocked:[],day:null,slot:"",loading:false,pending:false,error:"",name:"",phone:"",note:"",status:"",reference:"",photos:[],photoBusy:0,photoError:"",photoWarning:"",picker:false,pickerFilter:"nail"};
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
function selectedServices(){return state.selected.map(byId).filter(Boolean);}
function totals(){return selectedServices().reduce(function(out,service){out.price+=price(service);out.minutes+=duration(service);return out;},{price:0,minutes:0});}
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
  state.loading=false;state.pending=false;state.error="";state.name="";state.phone="";state.note="";state.status="";state.reference="";
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
    const priceHtml=discount>0?'<del>'+money(service.originalPrice)+'</del><strong>'+money(service.price)+'</strong>':'<strong>'+money(service.price)+'</strong>';
    const saleLabel=discount>0?' aria-label="'+esc(service.name+', giảm '+discount+'%, '+duration(service)+' phút, giá '+money(service.price))+'"':'';
    return '<button type="button" class="booking-service-option '+(selected?"is-selected ":"")+(discount>0?"has-sale":"")+'" data-booking-service="'+esc(service.id)+'" aria-pressed="'+selected+'"'+saleLabel+'><div class="booking-service-copy"><h3>'+esc(service.name)+'</h3><p><span class="booking-service-duration">'+duration(service)+' phút</span></p></div><span class="booking-service-side"><span class="booking-service-price"><span class="booking-service-offer-slot" aria-hidden="true">'+badgeHtml+'</span><span class="booking-service-price-card">'+priceHtml+'</span></span><span class="booking-check" aria-hidden="true">'+(selected?"✓":"")+'</span></span></button>';
  }).join("");
  const picked=selectedServices().map(function(service){return '<button type="button" data-booking-remove="'+esc(service.id)+'">'+esc(service.name)+' ×</button>';}).join("");
  const total=totals();
  return '<div class="booking-step" data-booking-step="1"><div class="booking-categories" role="tablist" aria-label="Nhóm dịch vụ">'+categoryHtml+'</div><div class="booking-service-grid">'+cards+'</div>'+(picked?'<div class="booking-picked" aria-label="Dịch vụ đã chọn">'+picked+'</div>':'')+'<div class="booking-total"><span><strong>'+state.selected.length+'/8 dịch vụ</strong><br><small>Tổng thời lượng '+durationText(total.minutes)+'</small></span><strong>'+money(total.price)+'</strong></div></div>';
}
function schedule(){
  const available=new Map(state.slots.map(function(item){const start=item.start_at||item.startAt;return [slotLabel(start),start];}));
  const blocked=new Map(state.blocked.map(function(item){const start=item.start_at||item.startAt;return [slotLabel(start),item.content==="tiệm hôm nay nghỉ"?"Tiệm nghỉ":(item.content||"Tiệm khóa lịch")];}));
  const booked=new Set((state.day&&Array.isArray(state.day.bookedStarts)?state.day.bookedStarts:[]).map(slotLabel));
  const latestEnd=state.day&&state.day.latestEndAt?new Date(state.day.latestEndAt).getTime():0,minutes=totals().minutes;
  // Why an unavailable slot is unavailable: a real booking keeps "Đã kín"; the rest name the rule that blocks it.
  function reason(label){const start=new Date(state.date+"T"+label+":00+07:00").getTime();if(booked.has(label))return "Đã kín";if(start<=Date.now())return "Đã qua";if(!state.day)return "Đã kín";if(!latestEnd)return "Tiệm nghỉ";if(start+minutes*60000>latestEnd)return "Quá giờ làm";return "Sát lịch khác";}
  const result=[];for(let minute=540;minute<=1020;minute+=30){const label=String(Math.floor(minute/60)).padStart(2,"0")+":"+String(minute%60).padStart(2,"0");result.push({label:label,start:available.get(label)||"",blocked:blocked.get(label)||"",reason:available.has(label)?"":reason(label)});}return result;
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
  const dates=new Array(7).fill(0).map(function(_,index){const iso=offsetDate(index),parts=iso.split("-"),weekday=dateLabel(iso).split(",")[0];return '<button type="button" class="booking-date '+(state.date===iso?"is-active":"")+'" data-booking-date="'+iso+'"><span>'+(index===0?"Hôm nay":esc(weekday))+'</span><strong>'+parts[2]+'/'+parts[1]+'</strong></button>';}).join("");
  let slots="";
  if(state.loading)slots='<div class="booking-loading">Đang tải giờ trống thật từ tiệm…</div>';
  else if(state.error)slots='<div class="booking-empty" role="alert"><p>'+esc(state.error)+'</p><button class="button-secondary" type="button" data-booking-retry>Thử tải lại</button></div>';
  else slots='<div class="booking-slots">'+schedule().map(function(slot){const selected=state.slot===slot.start&&!!slot.start;return '<button type="button" class="booking-slot '+(selected?"is-active ":"")+(slot.blocked?"is-blocked":"")+'" data-booking-slot="'+esc(slot.start)+'" '+(!slot.start?"disabled":"")+' aria-pressed="'+selected+'"><strong>'+slot.label+'</strong><small>'+esc(slot.blocked||(slot.start?"Còn trống":slot.reason))+'</small></button>';}).join("")+'</div>';
  return '<div class="booking-step" data-booking-step="2"><div class="booking-dates">'+dates+'</div><div class="booking-calendar-field"><span>Ngày khác</span><button type="button" class="booking-calendar-trigger" data-booking-calendar-toggle aria-haspopup="dialog" aria-expanded="'+state.calendarOpen+'">'+esc(dateLabel(state.date))+'</button>'+(state.calendarOpen?calendar():"")+'</div>'+slots+'</div>';
}
function photoField(){
  const tiles=state.photos.map(function(photo,index){
    const gallery=photo.kind==="gallery",label=gallery?photo.title:"Ảnh của bạn";
    return '<figure class="booking-photo"><img src="'+esc(gallery?photo.src:photo.data)+'" alt="'+esc(label)+'" decoding="async"><figcaption>'+esc(label)+'</figcaption><button type="button" data-booking-photo-remove="'+index+'" aria-label="Bỏ ảnh '+esc(label)+'">×</button></figure>';
  }).join("")+new Array(state.photoBusy).fill('<span class="booking-photo is-busy" role="status" aria-label="Đang xử lý ảnh"></span>').join("");
  const room=MAX_PHOTOS-state.photos.length-state.photoBusy;
  const actions=room>0?'<div class="booking-photo-actions"><label class="booking-photo-button"><input type="file" accept="image/*" multiple data-booking-photo-input>Tải ảnh lên</label><button type="button" class="booking-photo-button" data-booking-photo-picker>Chọn từ thư viện</button></div>':'';
  return '<div class="booking-photos" data-booking-photos><span class="booking-photos__label">Ảnh mẫu <small>tối đa '+MAX_PHOTOS+' ảnh · không bắt buộc</small></span>'+(tiles?'<div class="booking-photo-row">'+tiles+'</div>':'')+actions+(state.photoError?'<p class="booking-photo-error" role="alert">'+esc(state.photoError)+'</p>':'')+'</div>';
}
// After an async photo step only the photo block is redrawn, so a customer typing her name keeps her caret.
function refreshPhotos(){const block=document.querySelector("[data-booking-photos]");if(block&&!state.picker)block.outerHTML=photoField();else render();}
function pickerView(){
  const items=Array.isArray(exp().gallery)?exp().gallery:[];
  const filters=Object.keys(PICKER_LABELS).filter(function(id){return items.some(function(item){return item[0]===id;});});
  const chosen=new Set(state.photos.filter(function(photo){return photo.kind==="gallery";}).map(function(photo){return photo.src;}));
  const full=state.photos.length+state.photoBusy>=MAX_PHOTOS;
  const tabs=filters.map(function(id){return '<button type="button" class="'+(id===state.pickerFilter?"is-active":"")+'" data-booking-picker-filter="'+id+'" aria-pressed="'+(id===state.pickerFilter)+'">'+PICKER_LABELS[id]+'</button>';}).join("");
  const grid=items.filter(function(item){return item[0]===state.pickerFilter;}).map(function(item){
    const selected=chosen.has(item[1]);
    return '<button type="button" class="booking-pick'+(selected?" is-selected":"")+'" data-booking-pick="'+esc(item[1])+'" data-booking-pick-title="'+esc(item[2])+'" aria-pressed="'+selected+'"'+(!selected&&full?" disabled":"")+'><img src="'+esc(item[1])+'" alt="" loading="lazy" decoding="async"><span>'+esc(item[2])+'</span><i aria-hidden="true">'+(selected?"✓":"")+'</i></button>';
  }).join("");
  return '<div class="booking-step booking-picker" data-booking-step="picker"><div class="booking-categories booking-picker__tabs" role="group" aria-label="Lọc thư viện">'+tabs+'</div><p class="booking-picker__hint">Chạm để chọn mẫu bạn thích · còn '+Math.max(0,MAX_PHOTOS-state.photos.length-state.photoBusy)+' chỗ</p><div class="booking-pick-grid">'+grid+'</div></div>';
}
function stepThree(){
  const total=totals(),names=selectedServices().map(function(service){return service.name;}).join(" + ");
  const time=state.slot?dateLabel(state.date)+" · "+slotLabel(state.slot):"Chưa chọn giờ";
  return '<div class="booking-step" data-booking-step="3">'+(state.error?'<div class="booking-empty" role="alert">'+esc(state.error)+'</div>':'')+'<div class="booking-confirm-card"><div><strong>'+esc(names)+'</strong><br><small>'+esc(time)+' · '+durationText(total.minutes)+'</small></div><strong>'+money(total.price)+'</strong></div><div class="booking-form"><label>Họ và tên<input type="text" autocomplete="name" data-booking-name maxlength="80" required value="'+esc(state.name)+'" placeholder="Tên của bạn"></label><label>Số điện thoại<input type="tel" inputmode="tel" autocomplete="tel" data-booking-phone maxlength="16" required value="'+esc(state.phone)+'" placeholder="0xxxxxxxxx"></label><label>Ghi chú<textarea rows="2" data-booking-note maxlength="500" placeholder="Mẫu mong muốn hoặc điều tiệm cần biết">'+esc(state.note)+'</textarea></label><label class="sr-only">Website<input type="text" tabindex="-1" autocomplete="off" data-booking-website></label></div>'+photoField()+'</div>';
}
function success(){
  return '<div class="booking-result" data-booking-step="success"><img src="assets/home/header/logo_cat.webp" alt="" decoding="async" loading="lazy"><h3>Hẹn nhau ở 1M65 nha!</h3><p>Lịch đã được xác nhận. Bạn lưu mã dưới đây để tiện trao đổi với tiệm.</p><code>'+esc(state.reference||"Đã xác nhận")+'</code>'+(state.photoWarning?'<p class="booking-photo-error" role="status">'+esc(state.photoWarning)+'</p>':'')+'<div class="booking-result-actions"><button class="button-secondary" type="button" data-booking-manage>Xem lịch của bạn</button><button class="button-primary" type="button" data-booking-reset>Đặt lịch tiếp</button></div></div>';
}
function render(){
  const body=document.querySelector("[data-booking-body]"),eyebrow=document.querySelector("[data-booking-eyebrow]"),title=document.querySelector("[data-booking-title]"),back=document.querySelector("[data-booking-back]"),next=document.querySelector("[data-booking-next]"),summary=document.querySelector("[data-booking-summary]");
  if(!body||!eyebrow||!title||!back||!next||!summary)return;
  if(state.status==="done"){eyebrow.textContent="Đã đặt hẹn";title.textContent="Lịch của bạn đã sẵn sàng";body.innerHTML=success();back.textContent="Đóng";next.textContent="Đặt lịch tiếp";next.disabled=false;summary.textContent="";return;}
  if(state.picker){eyebrow.textContent="Đặt hẹn · ảnh mẫu";title.textContent="Chọn mẫu từ thư viện";body.innerHTML=pickerView();back.textContent="Quay lại";next.disabled=false;next.textContent="Xong ("+state.photos.length+"/"+MAX_PHOTOS+")";summary.textContent="";return;}
  const titles=["Bạn muốn làm gì hôm nay?","Mình ghé tiệm lúc nào?","Cho tiệm biết tên bạn nhé"];
  eyebrow.textContent="Đặt hẹn · bước "+state.step+"/3";title.textContent=titles[state.step-1];body.innerHTML=state.step===1?stepOne():(state.step===2?stepTwo():stepThree());back.textContent=state.step===1?"Để sau":"Quay lại";next.disabled=state.pending||state.loading;
  next.textContent=state.pending?(state.photos.some(function(photo){return photo.kind==="upload";})?"Đang gửi ảnh…":"Đang xác nhận…"):(state.step===1?(state.selected.length?"Chọn ngày & giờ":"Chọn dịch vụ trước"):(state.step===2?"Nhập thông tin":"Xác nhận đặt hẹn"));
  const total=totals();summary.textContent=state.selected.length+" dịch vụ · "+durationText(total.minutes)+" · "+money(total.price)+(state.step===3&&state.photos.length?" · "+state.photos.length+" ảnh mẫu":"");
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
function open(options,trigger){reset(options);render();exp().openModal(document.querySelector("#booking-modal-v2"),trigger);}
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
  if(state.status==="done"){reset();render();return;}
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
  try{
    if(!window.mewTurnstileBooking||typeof window.mewTurnstileBooking.getToken!=="function"){const error=new Error("turnstile_unavailable");error.code="turnstile_unavailable";throw error;}
    const token=await window.mewTurnstileBooking.getToken();
    const body=await request("create",{serviceId:state.selected[0],serviceIds:state.selected.slice(),startAt:state.slot,customerName:name,customerPhone:phone,customerNote:state.note.trim(),turnstileToken:token,website:website,referencePhotos:state.photos.map(function(photo){return photo.kind==="upload"?{kind:"upload",data:photo.data}:{kind:"gallery",src:photo.src,title:photo.title};})});
    state.status="done";state.reference=String((body.appointment&&body.appointment.reference)||"Đã xác nhận");
    const missing=state.photos.length-Number(body.photosSaved||0);
    state.photoWarning=state.photos.length&&missing>0?"Lịch đã xác nhận, nhưng "+missing+" ảnh mẫu chưa gửi được. Bạn nhắn Zalo ảnh đó cho tiệm giúp tụi mình nhé.":"";
  }catch(error){
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
  if(category){state.category=category.dataset.bookingCategory;render();return;}
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
  if(target.closest("[data-booking-reset]")){reset();render();return;}
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

