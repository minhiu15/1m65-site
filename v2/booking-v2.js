const API = "https://aomiaszicxqrctcgeoms.supabase.co/functions/v1/booking-api";
const TZ = "Asia/Ho_Chi_Minh";
const categories = [
{id:"nail",label:"Nail Care",ids:["ct-tay","ct-chan","thao-gel","thao-up","thao-bot","noi-up","noi-gel","noi-bot"]},
{id:"classic",label:"Classic",ids:["son-cung","gel-hn","gel-thach"]},
{id:"design",label:"Design",ids:["flash","matmeo","guong","ombre","da","charm","sticker","ve","xacu"]},
{id:"mi",label:"Eyelashes",ids:["uon-mi","uon-mi-den","mi-classic","mi-tho","mi-volume","mi-sole","mi-duoi"]},
{id:"goi",label:"Shampoo",ids:["goi-thao","goi-thuong","goi-phuchoi","goi-duongsinh"]}
];
const state = {step:1,category:"nail",selected:[],date:"",preferred:"",slots:[],blocked:[],slot:"",loading:false,pending:false,error:"",name:"",phone:"",note:"",status:"",reference:""};
let requestId = 0;

function exp(){return window.__v2Experience;}
function esc(value){return exp().esc(value);}
function services(){
  const source=window.__v2Services&&window.__v2Services.services;
  return Array.isArray(source)?source.filter(function(service){return service.enabled!==false&&service.active!==false&&service.isActive!==false&&service.status!=="disabled";}):[];
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
  state.date=isoToday();state.preferred=next.slot||"";state.slots=[];state.blocked=[];state.slot="";
  state.loading=false;state.pending=false;state.error="";state.name="";state.phone="";state.note="";state.status="";state.reference="";
  requestId+=1;
}
function stepOne(){
  const category=categories.find(function(item){return item.id===state.category;})||categories[0];
  const categoryHtml=categories.map(function(item){return '<button type="button" class="'+(item.id===state.category?"is-active":"")+'" data-booking-category="'+item.id+'">'+item.label+'</button>';}).join("");
  const cards=category.ids.map(byId).filter(Boolean).map(function(service){
    const selected=state.selected.includes(service.id);
    const discount=Number(service.discountPercent||0);
    const priceHtml=discount>0?'<span class="sale-badge">-'+discount+'%</span> <del>'+money(service.originalPrice)+'</del> <strong>'+money(service.price)+'</strong>':'<strong>'+money(service.price)+'</strong>';
    return '<button type="button" class="booking-service-option '+(selected?"is-selected":"")+'" data-booking-service="'+esc(service.id)+'" aria-pressed="'+selected+'"><div><h3>'+esc(service.name)+'</h3><p>'+duration(service)+' phút · '+priceHtml+'</p></div><span class="booking-check" aria-hidden="true">'+(selected?"✓":"")+'</span></button>';
  }).join("");
  const picked=selectedServices().map(function(service){return '<button type="button" data-booking-remove="'+esc(service.id)+'">'+esc(service.name)+' ×</button>';}).join("");
  const total=totals();
  return '<div class="booking-step" data-booking-step="1"><div class="booking-categories" role="tablist" aria-label="Nhóm dịch vụ">'+categoryHtml+'</div><div class="booking-service-grid">'+cards+'</div>'+(picked?'<div class="booking-picked" aria-label="Dịch vụ đã chọn">'+picked+'</div>':'')+'<div class="booking-total"><span><strong>'+state.selected.length+'/8 dịch vụ</strong><br><small>Tổng thời lượng '+durationText(total.minutes)+'</small></span><strong>'+money(total.price)+'</strong></div></div>';
}
function schedule(){
  const available=new Map(state.slots.map(function(item){const start=item.start_at||item.startAt;return [slotLabel(start),start];}));
  const blocked=new Map(state.blocked.map(function(item){const start=item.start_at||item.startAt;return [slotLabel(start),item.content==="tiệm hôm nay nghỉ"?"Tiệm nghỉ":(item.content||"Tiệm khóa lịch")];}));
  const result=[];for(let minute=540;minute<=1020;minute+=30){const label=String(Math.floor(minute/60)).padStart(2,"0")+":"+String(minute%60).padStart(2,"0");result.push({label:label,start:available.get(label)||"",blocked:blocked.get(label)||""});}return result;
}
function stepTwo(){
  const dates=new Array(7).fill(0).map(function(_,index){const iso=offsetDate(index),parts=iso.split("-"),weekday=dateLabel(iso).split(",")[0];return '<button type="button" class="booking-date '+(state.date===iso?"is-active":"")+'" data-booking-date="'+iso+'"><span>'+(index===0?"Hôm nay":esc(weekday))+'</span><strong>'+parts[2]+'</strong><small>th '+Number(parts[1])+'</small></button>';}).join("");
  let slots="";
  if(state.loading)slots='<div class="booking-loading">Đang tải giờ trống thật từ tiệm…</div>';
  else if(state.error)slots='<div class="booking-empty" role="alert"><p>'+esc(state.error)+'</p><button class="button-secondary" type="button" data-booking-retry>Thử tải lại</button></div>';
  else slots='<div class="booking-slots">'+schedule().map(function(slot){const selected=state.slot===slot.start&&!!slot.start;return '<button type="button" class="booking-slot '+(selected?"is-active ":"")+(slot.blocked?"is-blocked":"")+'" data-booking-slot="'+esc(slot.start)+'" '+(!slot.start?"disabled":"")+' aria-pressed="'+selected+'"><strong>'+slot.label+'</strong><small>'+esc(slot.blocked||(slot.start?"Còn trống":"Đã kín"))+'</small></button>';}).join("")+'</div>';
  return '<div class="booking-step" data-booking-step="2"><div class="booking-dates">'+dates+'</div><label class="booking-calendar-field"><span>Ngày khác</span><input type="date" data-booking-custom-date min="'+isoToday()+'" max="'+offsetDate(30)+'" value="'+state.date+'"></label>'+slots+'</div>';
}
function stepThree(){
  const total=totals(),names=selectedServices().map(function(service){return service.name;}).join(" + ");
  const time=state.slot?dateLabel(state.date)+" · "+slotLabel(state.slot):"Chưa chọn giờ";
  return '<div class="booking-step" data-booking-step="3">'+(state.error?'<div class="booking-empty" role="alert">'+esc(state.error)+'</div>':'')+'<div class="booking-confirm-card"><div><strong>'+esc(names)+'</strong><br><small>'+esc(time)+' · '+durationText(total.minutes)+'</small></div><strong>'+money(total.price)+'</strong></div><div class="booking-form"><label>Họ và tên<input type="text" autocomplete="name" data-booking-name maxlength="80" required value="'+esc(state.name)+'" placeholder="Tên của bạn"></label><label>Số điện thoại<input type="tel" inputmode="numeric" autocomplete="tel" data-booking-phone maxlength="10" required value="'+esc(state.phone)+'" placeholder="0xxxxxxxxx"></label><label>Ghi chú<textarea rows="2" data-booking-note maxlength="500" placeholder="Mẫu mong muốn hoặc điều tiệm cần biết">'+esc(state.note)+'</textarea></label><label class="sr-only">Website<input type="text" tabindex="-1" autocomplete="off" data-booking-website></label></div><p class="booking-security">Bước xác minh Turnstile sẽ chạy khi bạn nhấn xác nhận.</p></div>';
}
function success(){
  return '<div class="booking-result" data-booking-step="success"><img src="assets/home/header/logo_cat.webp" alt="" decoding="async" loading="lazy"><h3>Hẹn nhau ở 1M65 nha!</h3><p>Lịch đã được xác nhận. Bạn lưu mã dưới đây để tiện trao đổi với tiệm.</p><code>'+esc(state.reference||"Đã xác nhận")+'</code><div class="booking-result-actions"><button class="button-secondary" type="button" data-booking-manage>Xem lịch của bạn</button><button class="button-primary" type="button" data-booking-reset>Đặt lịch tiếp</button></div></div>';
}
function render(){
  const body=document.querySelector("[data-booking-body]"),eyebrow=document.querySelector("[data-booking-eyebrow]"),title=document.querySelector("[data-booking-title]"),back=document.querySelector("[data-booking-back]"),next=document.querySelector("[data-booking-next]"),summary=document.querySelector("[data-booking-summary]");
  if(!body||!eyebrow||!title||!back||!next||!summary)return;
  if(state.status==="done"){eyebrow.textContent="Đã đặt hẹn";title.textContent="Lịch của bạn đã sẵn sàng";body.innerHTML=success();back.textContent="Đóng";next.textContent="Đặt lịch tiếp";next.disabled=false;summary.textContent="";return;}
  const titles=["Bạn muốn làm gì hôm nay?","Mình ghé tiệm lúc nào?","Cho tiệm biết tên bạn nhé"];
  eyebrow.textContent="Đặt hẹn · bước "+state.step+"/3";title.textContent=titles[state.step-1];body.innerHTML=state.step===1?stepOne():(state.step===2?stepTwo():stepThree());back.textContent=state.step===1?"Để sau":"Quay lại";next.disabled=state.pending||state.loading;
  next.textContent=state.pending?"Đang xác nhận…":(state.step===1?(state.selected.length?"Chọn ngày & giờ":"Chọn dịch vụ trước"):(state.step===2?"Nhập thông tin":"Xác nhận đặt hẹn"));
  const total=totals();summary.textContent=state.selected.length+" dịch vụ · "+durationText(total.minutes)+" · "+money(total.price);
}
async function request(action,payload){
  const response=await fetch(API,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(Object.assign({action:action},payload||{}))});
  const body=await response.json().catch(function(){return {};});if(!response.ok){const error=new Error(body.error||"request_failed");error.code=body.error||"request_failed";throw error;}return body;
}
async function availability(){
  if(!state.selected.length)return;const current=++requestId;state.loading=true;state.error="";state.slot="";render();
  try{
    const body=await request("availability",{date:state.date,serviceIds:state.selected.slice()});if(current!==requestId)return;
    state.slots=Array.isArray(body.slots)?body.slots:[];state.blocked=Array.isArray(body.blockedSlots)?body.blockedSlots:[];
    if(state.preferred){const match=state.slots.find(function(item){return slotLabel(item.start_at||item.startAt)===state.preferred;});if(match)state.slot=String(match.start_at||match.startAt);else exp().toast(state.preferred+" không còn trống — bạn chọn giờ khác nha");state.preferred="";}
  }catch(_){if(current!==requestId)return;state.slots=[];state.blocked=[];state.error="Chưa tải được lịch trống. Bạn thử lại giúp tụi mình nha.";}
  finally{if(current===requestId){state.loading=false;render();}}
}
function open(options,trigger){reset(options);render();exp().openModal(document.querySelector("#booking-modal-v2"),trigger);}
function toggle(id){if(state.selected.includes(id))state.selected=state.selected.filter(function(item){return item!==id;});else if(state.selected.length>=8)return exp().toast("Mỗi lịch chọn tối đa 8 dịch vụ nha");else state.selected=state.selected.concat(id);state.error="";render();}
function back(){
  if(state.status==="done"||state.step===1)return exp().closeModal(document.querySelector("#booking-modal-v2"));
  state.step-=1;state.error="";render();
}
async function next(){
  if(state.status==="done"){reset();render();return;}
  if(state.step===1){if(!state.selected.length)return exp().toast("Bạn chọn ít nhất một dịch vụ trước nha");state.step=2;render();await availability();return;}
  if(state.step===2){if(!state.slot)return exp().toast("Bạn chọn một giờ còn trống trước nha");state.step=3;state.error="";render();requestAnimationFrame(function(){document.querySelector("[data-booking-name]")?.focus();});return;}
  await submit();
}
async function submit(){
  if(state.pending)return;const name=state.name.trim(),phone=state.phone.replace(/\D/g,""),website=document.querySelector("[data-booking-website]")?.value||"";
  if(name.length<2){state.error="Bạn nhập giúp tiệm họ tên từ 2 ký tự nhé.";render();document.querySelector("[data-booking-name]")?.focus();return;}
  if(!/^0\d{9}$/.test(phone)){state.error="Số điện thoại cần đủ 10 số và bắt đầu bằng 0.";render();document.querySelector("[data-booking-phone]")?.focus();return;}
  state.pending=true;state.error="";render();
  try{
    if(!window.mewTurnstileBooking||typeof window.mewTurnstileBooking.getToken!=="function"){const error=new Error("turnstile_unavailable");error.code="turnstile_unavailable";throw error;}
    const token=await window.mewTurnstileBooking.getToken();
    const body=await request("create",{serviceId:state.selected[0],serviceIds:state.selected.slice(),startAt:state.slot,customerName:name,customerPhone:phone,customerNote:state.note.trim(),turnstileToken:token,website:website});
    state.status="done";state.reference=String((body.appointment&&body.appointment.reference)||"Đã xác nhận");
  }catch(error){
    if(error.code==="slot_unavailable"){state.step=2;state.pending=false;exp().toast("Khung giờ vừa có khách khác chọn. Tụi mình đang tải lại lịch.");render();await availability();return;}
    state.error=error.code==="human_verification_failed"||error.code==="turnstile_unavailable"?"Chưa xác minh được bạn là người thật. Bạn thử lại giúp tụi mình nha.":"Chưa thể xác nhận lịch. Bạn kiểm tra mạng rồi thử lại giúp tụi mình nha.";
  }finally{state.pending=false;render();}
}
document.addEventListener("click",function(event){
  const target=event.target,category=target.closest("[data-booking-category]"),service=target.closest("[data-booking-service]"),remove=target.closest("[data-booking-remove]"),date=target.closest("[data-booking-date]"),slot=target.closest("[data-booking-slot]");
  if(category){state.category=category.dataset.bookingCategory;render();return;}
  if(service){toggle(service.dataset.bookingService);return;}
  if(remove){toggle(remove.dataset.bookingRemove);return;}
  if(date){state.date=date.dataset.bookingDate;state.preferred="";render();availability();return;}
  if(slot&&slot.dataset.bookingSlot){state.slot=slot.dataset.bookingSlot;render();return;}
  if(target.closest("[data-booking-retry]")){availability();return;}
  if(target.closest("[data-booking-back]")){back();return;}
  if(target.closest("[data-booking-next]")){next();return;}
  if(target.closest("[data-booking-reset]")){reset();render();return;}
  const manage=target.closest("[data-booking-manage]");if(manage){const reference=state.reference;exp().closeModal(document.querySelector("#booking-modal-v2"),false);exp().openManager(reference,manage);}
});
document.addEventListener("input",function(event){
  const target=event.target;if(target.matches("[data-booking-name]"))state.name=target.value;
  if(target.matches("[data-booking-phone]")){state.phone=target.value.replace(/\D/g,"").slice(0,10);if(target.value!==state.phone)target.value=state.phone;}
  if(target.matches("[data-booking-note]"))state.note=target.value;
});
document.addEventListener("change",function(event){
  if(!event.target.matches("[data-booking-custom-date]"))return;const value=event.target.value;
  if(value<isoToday()||value>offsetDate(30)){exp().toast("Bạn chỉ có thể đặt trước trong vòng 30 ngày nha");event.target.value=state.date;return;}
  state.date=value;state.preferred="";render();availability();
});
reset();
window.__v2Booking={open:open};

