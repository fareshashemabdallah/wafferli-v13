import {useState,type FormEvent} from "react";
import {ExternalLink,Plus,ShieldCheck,Trash2} from "lucide-react";
import {Button} from "@/components/ui/button";
import {useI18n} from "@/lib/i18n";
import {dateKey} from "@/lib/familyCalendar";
import {useLocalState,uid} from "@/lib/storage";
import {SERVICE_SHORTLIST_KEY,makeServiceEntry,assessServiceShortlist,
 type ServiceEntry,type ServiceType} from "@/lib/serviceShortlist";

export function FamilyServiceShortlist({category}:{category:ServiceType}){
 const {lang}=useI18n(),ar=lang==="ar";
 const [entries,setEntries,ready]=useLocalState<ServiceEntry[]>(SERVICE_SHORTLIST_KEY,[]);
 const [name,setName]=useState("");
 const [city,setCity]=useState("Amman");
 const [checkedAt,setCheckedAt]=useState(dateKey(new Date()));
 const [cost,setCost]=useState("");
 const [url,setUrl]=useState("");
 const [fit,setFit]=useState("");
 const [childFriendly,setChildFriendly]=useState(false);
 const [stepFree,setStepFree]=useState(false);
 const [credentials,setCredentials]=useState(false);
 const [available,setAvailable]=useState(false);
 const [note,setNote]=useState("");
 const [error,setError]=useState("");
 const [notice,setNotice]=useState("");
 if(!ready)return null;
 const visible=assessServiceShortlist(entries.filter(e=>e.category===category));
 const add=(e:FormEvent)=>{
  e.preventDefault();setError("");setNotice("");
  if(entries.length>=100){setError("Local comparison is limited to 100 providers");return;}
  try{
   const entry=makeServiceEntry({
    id:uid(),category,name,city,checkedAt,
    ...(cost.trim()?{costJod:Number(cost)}:{}),
    ...(url.trim()?{sourceUrl:url}:{}),
    ...(fit?{parentFit:Number(fit)}:{}),
    childFriendly,stepFreeAccess:stepFree,
    credentialsConfirmedByParent:credentials,
    availabilityConfirmedByParent:available,
    ...(note.trim()?{note}:{})
   });
   setEntries(old=>[...old,entry]);
   setName("");setCost("");setUrl("");setFit("");setNote("");
   setChildFriendly(false);setStepFree(false);setCredentials(false);setAvailable(false);
   setNotice(ar?"حُفظت ملاحظاتك على هذا الجهاز. لم نتحقق من الجهة.":"Your notes were saved on this device. Dabberna has NOT verified this provider.");
  }catch(err){setError(err instanceof Error?err.message:String(err));}
 };
 return <section className="mt-5 rounded-2xl border border-[#DDE8DD] bg-[#F8FBF5] p-4 sm:p-5"
  aria-label={ar?"قائمة مقارنة الخدمات":"My personal family services comparison"}>
  <div className="flex items-start gap-3">
   <ShieldCheck className="mt-0.5 size-6 shrink-0 text-brand"/>
   <div>
    <h2 className="text-base font-semibold">{ar?"قارن خدمات لعيلتك حسب معلوماتك":"Compare providers using your own evidence"}</h2>
    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{ar?
     "احفظ روابط الجهات ومعلوماتك بعد التواصل أو البحث. التقييمات منك فقط، وليست مراجعات مستقلة أو تحققاً من ترخيص أو كفاءة أو مواعيد.":
     "Save providers and source links you personally investigated. Ratings and checkboxes are your own observations—not independent reviews, credentials verification, booking availability or medical advice."}</p>
   </div>
  </div>
  <form onSubmit={add} className="mt-4 space-y-3 rounded-xl bg-white p-3">
   <h3 className="text-sm font-semibold">{ar?"أضف جهة للمقارنة":"Add a provider to compare"}</h3>
   <div className="grid gap-3 sm:grid-cols-2">
    <label className="text-xs font-semibold sm:col-span-2">{ar?"الاسم":"Provider name"}
     <input value={name} required maxLength={110} onChange={e=>setName(e.target.value)}
      className="mt-1 min-h-11 w-full rounded-xl border px-3 text-sm"/>
    </label>
    <label className="text-xs font-semibold">{ar?"المدينة / المنطقة العامة":"City / general area"}
     <input value={city} required maxLength={75} onChange={e=>setCity(e.target.value)}
      className="mt-1 min-h-11 w-full rounded-xl border px-3 text-sm"/>
    </label>
    <label className="text-xs font-semibold">{ar?"تاريخ تحقّقك الشخصي":"Date you personally checked"}
     <input type="date" required value={checkedAt} onChange={e=>setCheckedAt(e.target.value)}
      className="mt-1 min-h-11 w-full rounded-xl border px-3 text-sm"/>
    </label>
    <label className="text-xs font-semibold">{ar?"تكلفة تقديرية د.أ (اختياري)":"Estimated cost JOD (optional)"}
     <input type="number" inputMode="decimal" min="0" max="100000" step=".01"
      value={cost} onChange={e=>setCost(e.target.value)}
      className="mt-1 min-h-11 w-full rounded-xl border px-3 text-sm"/>
    </label>
    <label className="text-xs font-semibold">{ar?"الملاءمة حسب رأيك":"Fit for your family — your judgment"}
     <select value={fit} onChange={e=>setFit(e.target.value)}
      className="mt-1 min-h-11 w-full rounded-xl border px-3 text-sm">
      <option value="">{ar?"غير مقيم":"Not assessed"}</option>
      {[1,2,3,4,5].map(n=><option key={n} value={n}>{n}/5</option>)}
     </select>
    </label>
    <label className="text-xs font-semibold sm:col-span-2">{ar?"رابط مصدر عام HTTPS (اختياري)":"Public HTTPS source URL (optional)"}
     <input type="url" value={url} maxLength={700} onChange={e=>setUrl(e.target.value)}
      placeholder="https://example.org/provider"
      className="mt-1 min-h-11 w-full rounded-xl border px-3 text-sm"/>
    </label>
    <label className="text-xs font-semibold sm:col-span-2">{ar?"ملاحظات بدون بيانات صحية شخصية أو أسماء أطفال":"Notes — no personal health information or children's names"}
     <input value={note} maxLength={250} onChange={e=>setNote(e.target.value)}
      className="mt-1 min-h-11 w-full rounded-xl border px-3 text-sm"/>
    </label>
   </div>
   <div className="grid gap-2 text-xs sm:grid-cols-2">
    <label className="flex items-center gap-2"><input type="checkbox" checked={childFriendly} onChange={e=>setChildFriendly(e.target.checked)}/>
     {ar?"أرى أنها مناسبة للأطفال":"I believe it is child-friendly"}</label>
    <label className="flex items-center gap-2"><input type="checkbox" checked={stepFree} onChange={e=>setStepFree(e.target.checked)}/>
     {ar?"تحققتُ من سهولة الوصول":"I checked accessibility"}</label>
    <label className="flex items-center gap-2"><input type="checkbox" checked={available} onChange={e=>setAvailable(e.target.checked)}/>
     {ar?"تواصلتُ وتأكدتُ من التوافر":"I asked about availability"}</label>
    {category==="doctor"&&<label className="flex items-center gap-2">
     <input type="checkbox" checked={credentials} onChange={e=>setCredentials(e.target.checked)}/>
     {ar?"أنا راجعت مؤهلات الطبيب":"I personally checked clinician credentials"}</label>}
   </div>
   <Button type="submit"><Plus className="size-4"/>{ar?"احفظ مقارنة خاصة":"Save private comparison"}</Button>
  </form>
  {error&&<p role="alert" className="mt-3 text-xs text-destructive">{error}</p>}
  {notice&&<p role="status" className="mt-3 text-xs text-brand">{notice}</p>}
  <div className="mt-4">
   <h3 className="text-sm font-semibold">{ar?"جهات حفظتها لهذه الفئة":"Your saved options in this category"} ({visible.length})</h3>
   {visible.length===0?<p className="mt-2 text-xs text-muted-foreground">{ar?"ما في خيارات بعد.":"No options saved yet."}</p>:
    <div className="mt-2 space-y-2">{visible.map(({entry,freshness,missingChecks})=>
     <article key={entry.id} className="rounded-xl border border-[#E2E9E0] bg-white p-3 text-xs">
      <div className="flex items-start justify-between gap-3">
       <div>
        <p className="font-semibold">{entry.name} · {entry.city}</p>
        <p className="mt-1 text-muted-foreground">{entry.costJod===undefined?(ar?"التكلفة غير معروفة":"Cost unknown"):entry.costJod.toFixed(2)+" JOD"}
         {" · "}{entry.parentFit?entry.parentFit+"/5 "+(ar?"حسب رأيك":"your rating"):(ar?"الملاءمة غير مقيّمة":"Fit unassessed")}</p>
        <p className="mt-1 text-muted-foreground">{ar?"راجعت المعلومات في ":"Your last check: "}{entry.checkedAt}
         {" · "}{freshness==="review"?(ar?"مرّ أكثر من شهر—حدّث المعلومات":"Older than 30 days—review again"):(ar?"تحققت منها مؤخراً بنفسك":"Recently checked by you")}</p>
        <p className="mt-1 text-muted-foreground">{missingChecks.length?
         (ar?"بحاجة للتأكد من: ":"Still check: ")+missingChecks.join(", "):
         (ar?"أكملت الأسئلة الأساسية بنفسك؛ ليست مصادقة من دبّرنا.":"Your basic checklist is complete; not verified by Dabberna.")}</p>
        {entry.note&&<p className="mt-2 text-muted-foreground">{entry.note}</p>}
        {entry.sourceUrl&&<a href={entry.sourceUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 text-brand underline">
         {ar?"المصدر الذي حفظته":"Your source"}<ExternalLink className="size-3"/>
        </a>}
       </div>
       <Button variant="ghost" size="sm" onClick={()=>{
        if(window.confirm(ar?"إزالة هذه الجهة من جهازك؟":"Remove this provider from your device?"))
         setEntries(old=>old.filter(x=>x.id!==entry.id));
       }}><Trash2 className="size-3.5"/>{ar?"إزالة":"Remove"}</Button>
      </div>
     </article>)}</div>}
  </div>
  <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">{ar?
   "لا تعتمد على هذا الجدول وحده لاختيار طبيب. تأكد من الترخيص والتخصص والتأمين والتوافر مباشرة من مصادر رسمية. لا يتم إرسال ملاحظاتك للخوادم.":
   "Never select a clinician solely from this list. Independently verify licensing, expertise, insurance and availability with authoritative sources. Entries remain local to this browser."}</p>
 </section>;
}
