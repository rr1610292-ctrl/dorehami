import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";
import { SUPABASE_URL, SUPABASE_ANON_KEY, isConfigured } from "./config.js";
const $=s=>document.querySelector(s), msg=$("#form-message"), form=$("#rsvp-form"), button=$("#submit-btn");
const supabase=isConfigured?createClient(SUPABASE_URL,SUPABASE_ANON_KEY):null;
function showEvent(row){
 if(!row)return;
 $("#event-title").textContent=row.title||"دورهمی دوستانه";
 $("#event-description").textContent=row.description||"";
 $("#event-location").textContent=row.location||"به‌زودی اعلام می‌شود";
 $("#event-date").textContent=row.event_date||"به‌زودی اعلام می‌شود";
 if(row.image_url){$("#event-cover").src=row.image_url;$("#cover-wrap").hidden=false;}else{$("#cover-wrap").hidden=true;}
}
async function loadEvent(){
 if(!supabase)return;
 const {data}=await supabase.from("event_settings").select("*").eq("id",1).maybeSingle();
 if(data)showEvent(data);
}
loadEvent();
form.addEventListener("submit",async e=>{
 e.preventDefault();msg.textContent="";
 if(!supabase){msg.textContent="اتصال دیتابیس هنوز تنظیم نشده؛ راهنمای README را انجام دهید.";return;}
 const name=form.name.value.trim(),phone=form.phone.value.replace(/[^\d+]/g,""),response=form.response.value;
 if(!/^(\+98|0098|0)?9\d{9}$/.test(phone)){msg.textContent="لطفاً شماره موبایل معتبر وارد کنید.";return;}
 button.disabled=true;button.textContent="در حال ثبت...";
 const {error}=await supabase.from("guests").insert({name,phone,response});
 button.disabled=false;button.innerHTML='ثبت پاسخ <span>✦</span>';
 if(error){msg.textContent=error.code==="23505"?"این شماره قبلاً پاسخ ثبت کرده است. برای تغییر پاسخ با مدیر هماهنگ کن.":"ثبت پاسخ انجام نشد. لطفاً دوباره تلاش کنید.";console.error(error);}
 else{msg.textContent="پاسخت با موفقیت ثبت شد. ممنون از خبر دادنت ❤️";form.reset();}
});
