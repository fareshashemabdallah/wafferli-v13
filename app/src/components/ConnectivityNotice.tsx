import {useEffect,useState} from "react";
import {WifiOff} from "lucide-react";
import {useI18n} from "@/lib/i18n";

/** Navigator.onLine is only an advisory connectivity hint. Previously loaded
 * browser-local information may work offline; live searches and Auth won't.
 */
export function ConnectivityNotice(){
 const {lang}=useI18n(),ar=lang==="ar";
 const [offline,setOffline]=useState(()=>
  typeof navigator!=="undefined"?!navigator.onLine:false);
 useEffect(()=>{
  const update=()=>setOffline(!navigator.onLine);
  window.addEventListener("online",update);
  window.addEventListener("offline",update);
  return ()=>{
   window.removeEventListener("online",update);
   window.removeEventListener("offline",update);
  };
 },[]);
 if(!offline)return null;
 return <div role="status" aria-live="polite"
  className="mb-4 flex items-start gap-2 rounded-2xl border border-[#EAD7B8] bg-[#FFF9EB] p-3 text-xs text-[#785C3F]">
  <WifiOff className="mt-0.5 size-4 shrink-0" aria-hidden="true"/>
  <div>
   <p className="font-semibold">{ar?"يبدو إنك مش متصل بالإنترنت":"Your device appears offline"}</p>
   <p className="mt-1 leading-relaxed">{ar?
    "يمكنك مراجعة معلوماتك المحلية التي تم تحميلها. البحث المباشر، تسجيل الدخول، التصويت والاتصالات الخارجية تحتاج للإنترنت. قد تفشل إعادة فتح صفحات لم يتم تحميلها من قبل.":
    "Previously loaded local records may remain usable. Live discovery, sign-in, voting and external services need internet access. Pages you have never opened may not be available offline."}</p>
  </div>
 </div>;
}
