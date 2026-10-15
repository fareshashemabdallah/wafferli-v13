import {useState,type FormEvent} from "react";
import {Baby,Compass,Plus,Trash2} from "lucide-react";
import {useLocalState,uid} from "@/lib/storage";
import {useI18n} from "@/lib/i18n";
import {dateKey} from "@/lib/familyCalendar";
import {Button} from "@/components/ui/button";
import {OUTING_SHORTLIST_KEY,compareOutingOptions,newOutingOption,type OutingOption,
 type OutingConstraints} from "@/lib/childAwareOutingCompare";

type Props={
 childrenAttendance:"yes"|"no"|"unsure";ages:readonly string[];
 stroller:boolean;quiet:boolean;maximum:string;city:string;preferredDistance:number
};
export function ChildAwareOutingCompare({
 childrenAttendance,ages,stroller,quiet,maximum,city,preferredDistance
}:Props){
 const {lang}=useI18n(),ar=lang==="ar";
 const [saved,setSaved,ready]=useLocalState<OutingOption[]>(OUTING_SHORTLIST_KEY,[]);
 const [name,setName]=useState("");
 const [kind,setKind]=useState<OutingOption["kind"]>("indoor");
 const [checkedOn,setCheckedOn]=useState(dateKey(new Date()));
 const [price,setPrice]=useState(""),[distance,setDistance]=useState("");
 const [admission,setAdmission]=useState<OutingOption["childAdmission"]>("unknown");
 const [ageFit,setAgeFit]=useState<OutingOption["ageFit"]>("unknown");
 const [accessible,setAccessible]=useState<OutingOption["accessible"]>("unknown");
 const [noise,setNoise]=useState<OutingOption["noise"]>("unknown");
 const [note,setNote]=useState("");
 const [weather,setWeather]=useState<OutingConstraints["weather"]>("unknown");
 const [budgetOverride,setBudgetOverride]=useState("");
 const [error,setError]=useState("");
 if(!ready)return null;
 const currentBudget=budgetOverride.trim()?Number(budgetOverride):
  maximum.trim()?Number(maximum):null;
 const requirements:OutingConstraints={
  children:childrenAttendance,ages:[...ages],
  requireStroller:stroller,preferQuiet:quiet,weather,
  budgetJod:currentBudget!==null&&Number.isFinite(currentBudget)&&currentBudget>=0?currentBudget:null,
  maxDistanceKm:Number.isFinite(preferredDistance)&&preferredDistance>0?preferredDistance:null
 };
 const compared=compareOutingOptions(saved,requirements);
 const submit=(e:FormEvent)=>{
  e.preventDefault();setError("");
  if(saved.length>=50){setError("Up to 50 private options are supported");return;}
  try{
   const next=newOutingOption({id:uid(),name,kind,checkedOn,childAdmission:admission,
    ageFit,accessible,noise,...(price.trim()?{totalEstimatedJod:Number(price)}:{}),
    ...(distance.trim()?{distanceKm:Number(distance)}:{}),
    ...(note.trim()?{note}:{})});
   setSaved(old=>[...old,next]);setName("");setPrice("");setDistance("");setNote("");
   setAdmission("unknown");setAgeFit("unknown");setAccessible("unknown");setNoise("unknown");
  }catch(ex){setError(ex instanceof Error?ex.message:String(ex));}
 };
 const select=(label:string,value:string,set:(v:any)=>void,values:readonly {v:string;en:string;ar:string}[])=>
  <label key={label} className="text-xs font-semibold">{label}
   <select value={value} onChange={e=>set(e.target.value)}
    className="mt-1 min-h-11 w-full rounded-lg border border-input bg-white px-2 text-sm">
    {values.map(o=><option key={o.v} value={o.v}>{ar?o.ar:o.en}</option>)}
   </select>
  </label>;
 const y=["unknown","yes","no"].map(v=>({v,en:v==="unknown"?"Not checked":v==="yes"?"Yes, according to me":"No, according to me",
  ar:v==="unknown"?"لم أتحقق":v==="yes"?"نعم حسب معلوماتي":"لا حسب معلوماتي"}));
 return <section className="editorial-card mt-5 p-4 sm:p-5" id="family-outing-compare">
  <div className="flex items-start gap-3">
   <Baby className="mt-1 size-6 text-brand"/>
   <div>
    <h2 className="font-semibold">{ar?"قارن خيارات الطلعة حسب احتياجات العائلة":"Compare outing options for your family's needs"}</h2>
    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{ar?
     "قائمة خاصة من الأماكن التي اخترتها بنفسك. نقارن الميزانية والمسافة وأعمار الأطفال وإمكانية الوصول والطقس حسب ما أدخلته؛ لا نتحقق من سلامة الأماكن أو توفّر الحجوزات.":
     "Your privately entered venues, compared against your budget, travel distance, children's ages, accessibility and weather notes. No venue safety, admission or booking availability is independently verified."}</p>
   </div>
  </div>
  <div className="mt-3 grid gap-3 rounded-xl bg-[#F2F7EF] p-3 sm:grid-cols-2">
   {select(ar?"ملاحظة الطقس لهذا اليوم":"Your weather check",weather,setWeather,[
    {v:"unknown",en:"Not checked",ar:"لم أتحقق"},
    {v:"clear",en:"Conditions seem suitable",ar:"الجو يبدو مناسباً"},
    {v:"rain",en:"Rain forecast (your check)",ar:"أمطار حسب توقعك"},
    {v:"heat",en:"Hot weather (your check)",ar:"حر حسب توقعك"}])}
   <label className="text-xs font-semibold">{ar?"حدّ تكلفة الطلعة JOD (اختياري)":"Whole-family budget JOD (optional)"}
    <input inputMode="decimal" type="number" min="0" max="100000" step=".01" value={budgetOverride}
     onChange={e=>setBudgetOverride(e.target.value)}
     placeholder={maximum||"Not set"}
     className="mt-1 min-h-11 w-full rounded-lg border border-input bg-white px-2 text-sm"/>
   </label>
   <p className="text-xs text-muted-foreground sm:col-span-2">
    {ar?"المدينة: ":"City: "}{city||"Amman"} · {ar?"الحد المفضل للمسافة: ":"Preferred distance: "}{preferredDistance} km ·
    {childrenAttendance==="no"?(ar?" بدون أطفال":" Adults only"):childrenAttendance==="yes"?
     (ar?" الأطفال حاضرون":" Children coming"):(ar?" حضور الأطفال غير مؤكد":" Child attendance unconfirmed")}
    {ages.length>0&&" · "+ages.join(", ")}
   </p>
  </div>
  <details className="mt-4 rounded-xl border border-[#DEE9DD] bg-white p-3">
   <summary className="min-h-10 cursor-pointer text-sm font-semibold text-brand">{ar?"أضف مكاناً بحثت عنه":"Add a venue you researched"} +</summary>
   <form onSubmit={submit} className="mt-3 grid gap-3 sm:grid-cols-2">
    <label className="text-xs font-semibold sm:col-span-2">{ar?"اسم المكان أو النشاط":"Venue / activity name"}
     <input required maxLength={110} value={name} onChange={e=>setName(e.target.value)}
      className="mt-1 min-h-11 w-full rounded-lg border px-2"/>
    </label>
    {select(ar?"نوع المكان":"Venue type",kind,setKind,[
     {v:"indoor",en:"Indoor",ar:"داخلي"},{v:"outdoor",en:"Outdoor",ar:"خارجي"},
     {v:"mixed",en:"Indoor and outdoor",ar:"داخلي وخارجي"}])}
    <label className="text-xs font-semibold">{ar?"تاريخ التحقق الشخصي":"Date you checked"}
     <input type="date" required value={checkedOn} onChange={e=>setCheckedOn(e.target.value)}
      className="mt-1 min-h-11 w-full rounded-lg border px-2"/>
    </label>
    <label className="text-xs font-semibold">{ar?"التكلفة الكاملة للعائلة JOD (اختياري)":"Whole-family total JOD (optional)"}
     <input type="number" min="0" max="100000" step=".01" value={price} onChange={e=>setPrice(e.target.value)}
      className="mt-1 min-h-11 w-full rounded-lg border px-2"/>
    </label>
    <label className="text-xs font-semibold">{ar?"المسافة التقديرية كم":"Estimated distance km"}
     <input type="number" min="0" max="2000" step=".1" value={distance}
      onChange={e=>setDistance(e.target.value)} className="mt-1 min-h-11 w-full rounded-lg border px-2"/>
    </label>
    {select(ar?"يستقبل الأطفال؟":"Children admitted?",admission,setAdmission,y)}
    {select(ar?"ملائم لأعمار الأطفال؟":"Suitable for children's ages?",ageFit,setAgeFit,y)}
    {select(ar?"وصول سهل لعربات الأطفال؟":"Stroller / step-free access?",accessible,setAccessible,y)}
    {select(ar?"الضجيج":"Noise level",noise,setNoise,[
     {v:"unknown",en:"Not checked",ar:"غير معروف"},
     {v:"quiet",en:"Quiet, according to me",ar:"هادئ حسب معلوماتي"},
     {v:"loud",en:"Loud, according to me",ar:"صاخب حسب معلوماتي"}])}
    <label className="text-xs font-semibold sm:col-span-2">{ar?"ملاحظة خاصة بدون معلومات الأطفال":"Private note — no identifying child details"}
     <input maxLength={200} value={note} onChange={e=>setNote(e.target.value)}
      className="mt-1 min-h-11 w-full rounded-lg border px-2"/>
    </label>
    <div className="sm:col-span-2"><Button type="submit"><Plus className="size-4"/>{ar?"احفظ للمقارنة":"Save to compare"}</Button></div>
   </form>
  </details>
  {error&&<p role="alert" className="mt-2 text-xs text-destructive">{error}</p>}
  <div className="mt-4 space-y-3">
   {compared.length===0?<p className="text-xs text-muted-foreground">{ar?"ما في خيارات محفوظة بعد.":"No saved venues yet."}</p>:compared.map(x=>
    <article key={x.option.id} className="rounded-xl border border-[#DEE9DC] bg-white p-3">
     <div className="flex flex-wrap items-start justify-between gap-2">
      <div>
       <h3 className="text-sm font-semibold">{x.option.name}</h3>
       <p className="mt-1 text-xs text-muted-foreground">
        {x.option.totalEstimatedJod!==undefined?x.option.totalEstimatedJod.toFixed(2)+" JOD":(ar?"تكلفة غير معروفة":"Cost unknown")}
        {" · "}{x.option.distanceKm!==undefined?x.option.distanceKm+" km":(ar?"مسافة غير معروفة":"Distance unknown")}
       </p>
       <p className="mt-1 text-xs font-semibold text-brand">{x.suitability==="not-suitable"?
        (ar?"يبدو غير ملائم حسب المعلومات المدخلة":"Potential mismatch with your requirements"):
        x.suitability==="needs-confirmation"?(ar?"بحاجة للتحقق":"Needs confirmation"):
        (ar?"تقدير مبدئي فقط":"Provisional comparison only")}</p>
      </div>
      <button type="button" aria-label={ar?"إزالة المكان":"Remove option"} className="grid min-h-10 min-w-10 place-items-center text-[#945D4A]"
       onClick={()=>{
        if(window.confirm(ar?"حذف هذه المقارنة المحلية؟":"Delete this locally recorded option?"))
         setSaved(old=>old.filter(v=>v.id!==x.option.id));
       }}><Trash2 className="size-4"/></button>
     </div>
     <ul className="mt-2 list-disc ps-4 text-xs leading-relaxed text-muted-foreground">
      {(ar?x.reasonsAr:x.reasonsEn).map((reason,i)=><li key={i}>{reason}</li>)}
     </ul>
     {x.option.note&&<p className="mt-2 text-xs text-muted-foreground">{x.option.note}</p>}
    </article>)}
  </div>
  <p className="mt-3 text-[11px] text-muted-foreground">{ar?
   "المقارنة تعتمد حصراً على معلوماتك. راجع حالة الطقس الحقيقية، عمر الطفل، الأماكن الآمنة، الرسوم والتوفر مباشرة قبل الذهاب.":
   "All comparisons are based on your own entries. Check real weather alerts, child age limits, safety, prices and availability independently before going."}</p>
 </section>;
}
