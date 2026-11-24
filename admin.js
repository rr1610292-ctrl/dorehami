import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";
import { SUPABASE_URL, SUPABASE_ANON_KEY, isConfigured } from "./config.js";
const $=s=>document.querySelector(s), supabase=isConfigured?createClient(SUPABASE_URL,SUPABASE_ANON_KEY):null;
let currentImage=null, removeImage=false;
function fa(n){return new Intl.NumberFormat("fa-IR").format(n)}
function statusText(v){return ({yes:"میام ❤️",no:"نمیام 💔",maybe:"هنوز مشخص نیست"})[v]||v}
function safe(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
async function loadEvent(){
 const {data,error}=await supabase.from("event_settings").select("*").eq("id",1).maybeSingle();
 if(error){$("#event-message").textContent="خواندن اطلاعات دورهمی ناموفق بود.";return;}
 if(data){$("#title").value=data.title||"";$("#location").value=data.location||"";$("#event-date-input").value=data.event_date||"";$("#description").value=data.description||"";currentImage=data.image_url||null;showPreview(currentImage);}
}
function showPreview(url){if(url){$("#cover-preview").src=url;$("#preview-wrap").hidden=false;}else{$("#preview-wrap").hidden=true;}}
$("#cover-file").addEventListener("change",e=>{
 const file=e.target.files[0];if(!file)return;
 if(file.size>5*1024*1024){$("#event-message").textContent="حجم عکس نباید بیشتر از ۵ مگابایت باشد.";e.target.value="";return;}
 if(!["image/jpeg","image/png","image/webp"].includes(file.type)){$("#event-message").textContent="فقط عکس JPG، PNG یا WEBP مجاز است.";e.target.value="";return;}
 removeImage=false;showPreview(URL.createObjectURL(file));
});
$("#remove-cover").addEventListener("click",()=>{removeImage=true;currentImage=null;$("#cover-file").value="";showPreview(null);});
$("#event-form").addEventListener("submit",async e=>{
 e.preventDefault();const message=$("#event-message"),save=$("#save-event");message.textContent="";
 if(!supabase)return;
 save.disabled=true;save.textContent="در حال ذخیره...";
 let imageUrl=removeImage?null:currentImage;
 const file=$("#cover-file").files[0];
 if(file){
  const ext=file.name.split(".").pop().toLowerCase(),path=`event-cover/${Date.now()}.${ext}`;
  const {error:uploadError}=await supabase.storage.from("event-images").upload(path,file,{upsert:true,contentType:file.type});
  if(uploadError){message.textContent="بارگذاری عکس ناموفق بود. تنظیمات Storage را بررسی کنید.";save.disabled=false;save.innerHTML='ذخیره تغییرات <span>✦</span>';return;}
  imageUrl=supabase.storage.from("event-images").getPublicUrl(path).data.publicUrl;
 }
 const payload={id:1,title:$("#title").value.trim(),location:$("#location").value.trim(),event_date:$("#event-date-input").value.trim(),description:$("#description").value.trim(),image_url:imageUrl,updated_at:new Date().toISOString()};
 const {error}=await supabase.from("event_settings").upsert(payload,{onConflict:"id"});
 save.disabled=false;save.innerHTML='ذخیره تغییرات <span>✦</span>';
 if(error){message.textContent="ذخیره اطلاعات ناموفق بود. دسترسی مدیر و SQL را بررسی کنید.";console.error(error);}
 else{currentImage=imageUrl;removeImage=false;$("#cover-file").value="";showPreview(imageUrl);message.textContent="اطلاعات دورهمی با موفقیت ذخیره شد. صفحه اصلی را تازه‌سازی کنید ❤️";}
});
async function loadGuests(){
 $("#dashboard-message").textContent="در حال دریافت اطلاعات...";
 const {data,error}=await supabase.from("guests").select("name,phone,response,created_at").order("created_at",{ascending:false});
 if(error){$("#dashboard-message").textContent="دریافت اطلاعات ممکن نشد.";return;}
 const rows=data||[];$("#total").textContent=fa(rows.length);$("#yes").textContent=fa(rows.filter(x=>x.response==="yes").length);$("#no").textContent=fa(rows.filter(x=>x.response==="no").length);$("#maybe").textContent=fa(rows.filter(x=>x.response==="maybe").length);
 $("#guest-rows").innerHTML=rows.length?rows.map(x=>`<tr><td>${safe(x.name)}</td><td dir="ltr">${safe(x.phone)}</td><td class="status-${x.response}">${statusText(x.response)}</td><td>${new Date(x.created_at).toLocaleString("fa-IR")}</td></tr>`).join(""):'<tr><td colspan="4">هنوز پاسخی ثبت نشده است.</td></tr>';
 $("#dashboard-message").textContent="";
 $("#export").onclick=()=>downloadCSV(rows);
}
function downloadCSV(rows){
 const data=[["نام","موبایل","پاسخ","زمان ثبت"],...rows.map(x=>[x.name,x.phone,statusText(x.response),new Date(x.created_at).toLocaleString("fa-IR")])];
 const csv="\uFEFF"+data.map(r=>r.map(v=>'"'+String(v??"").replace(/"/g,'""')+'"').join(",")).join("\n");
 const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8"}));a.download="dorehami-guests.csv";a.click();URL.revokeObjectURL(a.href);
}
async function showDashboard(){const {data}=await supabase.auth.getSession();if(data.session){$("#login-panel").hidden=true;$("#dashboard").hidden=false;await loadEvent();await loadGuests();}else{$("#login-panel").hidden=false;$("#dashboard").hidden=true;}}
$("#login-form").addEventListener("submit",async e=>{e.preventDefault();$("#login-message").textContent="";if(!supabase){$("#login-message").textContent="ابتدا تنظیمات Supabase را در config.js وارد کنید.";return;}const {error}=await supabase.auth.signInWithPassword({email:$("#email").value,password:$("#password").value});if(error){$("#login-message").textContent="ورود ناموفق بود. ایمیل و رمز عبور را بررسی کنید.";return;}await showDashboard();});
$("#logout").addEventListener("click",async()=>{await supabase.auth.signOut();showDashboard();});
if(!isConfigured){$("#login-message").textContent="برای فعال‌سازی، راهنمای README را دنبال کنید.";}else{supabase.auth.getSession().then(showDashboard);supabase.auth.onAuthStateChange((_event,session)=>{if(!session){$("#login-panel").hidden=false;$("#dashboard").hidden=true;}});}
