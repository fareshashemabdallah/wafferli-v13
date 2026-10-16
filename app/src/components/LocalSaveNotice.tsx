import {useEffect,useState} from "react";
import {AlertTriangle,X} from "lucide-react";
import {useI18n} from "@/lib/i18n";
import {LOCAL_SAVE_FAILED_EVENT} from "@/lib/storage";

/** Persistent on-screen warning when browser-local storage is blocked or full. */
export function LocalSaveNotice(){
 const {lang}=useI18n(),ar=lang==="ar";
 const [failed,setFailed]=useState(false);
 useEffect(()=>{
  const onFailure=()=>setFailed(true);
  window.addEventListener(LOCAL_SAVE_FAILED_EVENT,onFailure);
  return ()=>window.removeEventListener(LOCAL_SAVE_FAILED_EVENT,onFailure);
 },[]);
 if(!failed)return null;
 return <div role="alert" className="mb-4 flex items-start gap-3 rounded-2xl border border-[#E2BCA5] bg-[#FFF4EA] p-4 text-sm text-[#754634]">
  <AlertTriangle className="mt-0.5 size-5 shrink-0" aria-hidden="true"/>
  <div className="min-w-0 flex-1">
   <p className="font-semibold">{ar?"لم نتمكن من حفظ التغييرات":"Your changes could not be saved"}</p>
   <p className="mt-1 text-xs leading-relaxed">{ar?
    "قد تكون مساحة التخزين ممتلئة أو يحظر المتصفح حفظ البيانات. لا تعتمد على هذا التعديل؛ تحقّق من إعدادات المتصفح واحفظ نسخة احتياطية من بياناتك إن أمكن.":
    "This browser may be out of storage space or may block local data. Do not rely on this change; check your browser settings and export a backup if possible."}</p>
  </div>
  <button type="button" onClick={()=>setFailed(false)}
   aria-label={ar?"إخفاء التنبيه":"Dismiss save warning"}
   className="grid min-h-11 min-w-11 place-items-center rounded-lg hover:bg-white/70 focus-visible:ring-2 focus-visible:ring-brand">
   <X className="size-5"/>
  </button>
 </div>;
}
