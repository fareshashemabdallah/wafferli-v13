import {createFileRoute,Link} from "@tanstack/react-router";
import {useState,type FormEvent} from "react";
import {ArrowUpRight,CalendarPlus,Compass,HeartHandshake,MapPin,Search,ShieldCheck} from "lucide-react";
import {AppShell} from "@/components/AppShell";
import {useI18n} from "@/lib/i18n";
import {findWeekendPlaces,weekendPlaceSearchUrl,weekendCityName,type WeekendPlace,type WeekendCity} from "@/lib/weekendPlaceSearch";
import {useLocalState,uid} from "@/lib/storage";
import {FAMILY_PLANS_KEY,ACTIVE_PLAN_KEY,makeFamilyPlan,type FamilyPlan} from "@/lib/familyPlans";
import {communityDb as db,itemKey,type ExperienceReview} from "@/lib/community";

export const Route=createFileRoute("/explore/")({
 head:()=>({meta:[{title:"Discover family experiences — Dabberna"},
 {name:"description",content:"One family discovery journey: see real mapped places, assess parent experiences, and keep one family plan."}]}),
 component:Explore
});
type Kind="all"|"park"|"playground"|"museum"|"attraction"|"arts centre";
const cities:readonly WeekendCity[]=["amman","irbid","zarqa","aqaba"];
const kindOptions:{id:Kind;en:string;ar:string}[]=[
 {id:"all",en:"Everything",ar:"الكل"},
 {id:"playground",en:"Playgrounds",ar:"ملاعب الأطفال"},
 {id:"park",en:"Parks",ar:"حدائق"},
 {id:"museum",en:"Museums",ar:"متاحف"},
 {id:"attraction",en:"Attractions",ar:"أماكن للزيارة"},
 {id:"arts centre",en:"Arts",ar:"فنون"}
];
export function Explore(){
 const {lang}=useI18n(),ar=lang==="ar";
 const t=(en:string,arabic:string)=>ar?arabic:en;
 const [city,setCity]=useState<WeekendCity>("amman");
 const [kind,setKind]=useState<Kind>("all");
 const [search,setSearch]=useState("");
 const [places,setPlaces]=useState<WeekendPlace[]>([]);
 const [selected,setSelected]=useState<WeekendPlace|null>(null);
 const [busy,setBusy]=useState(false),[error,setError]=useState("");
 const [looked,setLooked]=useState(false),[stale,setStale]=useState(false);
 const [reviews,setReviews]=useState<ExperienceReview[]>([]);
 const [reviewStatus,setReviewStatus]=useState("");
 const [date,setDate]=useState(""),[amount,setAmount]=useState("");
 const [notice,setNotice]=useState("");
 const [plans,setPlans,plansReady]=useLocalState<FamilyPlan[]>(FAMILY_PLANS_KEY,[]);
 const [,setActivePlan]=useLocalState<string|null>(ACTIVE_PLAN_KEY,null);
 const discover=async(e:FormEvent)=>{
  e.preventDefault();setBusy(true);setError("");setSelected(null);setLooked(false);setReviews([]);
  try {const result=await findWeekendPlaces(city);setPlaces(result.places);setStale(result.stale);setLooked(true);}
  catch(e){setPlaces([]);setError(e instanceof Error?e.message:t("Place search unavailable.","تعذّر البحث عن الأماكن."));}
  finally{setBusy(false);}
 };
 const filtered=places.filter(p=>(kind==="all"||p.category===kind)&&p.name.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()));
 const choose=async(place:WeekendPlace)=>{
  setSelected(place);setError("");setNotice("");setDate("");setAmount("");setReviews([]);
  setReviewStatus(t("Checking for firsthand parent experiences…","نتحقق من تجارب الأهل…"));
  try {
   const type=place.category==="playground"?"playground":"activity";
   const {data,error}=await db.rpc("get_family_experience_reviews",{p_item_key:itemKey(type,place.name,weekendCityName(city))});
   if(error)throw error;
   setReviews((data??[]) as ExperienceReview[]);
   setReviewStatus((data??[]).length?"":t("No parent experiences found for this exact place yet. This map listing is not a recommendation.","ما في تجارب أهل لهذا المكان حتى الآن. وجوده على الخريطة ليس توصية."));
  }catch{setReviewStatus(t("Parent reviews could not be checked. Do not treat this listing as verified.","تعذّر التحقق من آراء الأهل. المكان غير موثّق من دبّرنا."));}
 };
 const save=(e:FormEvent)=>{
  e.preventDefault();if(!selected||!plansReady)return;
  if(date&&(!/^\d{4}-\d{2}-\d{2}$/.test(date)||Number.isNaN(Date.parse(date+"T12:00:00")))){setError(t("Choose a valid date.","اختر تاريخاً صحيحاً."));return;}
  if(amount&&!/^\d{1,6}(?:\.\d{1,2})?$/.test(amount)){setError(t("Enter a valid family total or leave it blank.","أدخل تكلفة صحيحة أو اتركها فارغة."));return;}
  const existing=plans.find(p=>p.kind==="outing"&&p.sourceRef===selected.osmUrl&&(p.date??"")===(date||"")&&p.status!=="completed");
  if(existing){setActivePlan(existing.id);setNotice(t("This place is already in Family Plans. Continue the existing plan.","هذه الطلعة موجودة في خطط العيلة. تابع الخطة نفسها."));return;}
  const draft=makeFamilyPlan({id:uid(),title:selected.name,kind:"outing",sourceRef:selected.osmUrl,...(date?{date}:{}),...(amount?{budgetJod:Number(amount)}:{})});
  if(!draft){setError(t("Could not prepare this plan.","تعذّر إعداد الخطة."));return;}
  setPlans(old=>[draft,...old]);setActivePlan(draft.id);
  setNotice(t("Saved in Family Plans as an idea, not a booking or paid expense.","حُفظت الفكرة بخطط العيلة، من دون حجز أو دفع."));
 };
 return <AppShell title={t("Discover","اكتشف")}>
  <div className="mx-auto max-w-3xl space-y-4">
   <section className="rounded-[1.6rem] bg-[#FFF4E9] p-5">
    <div className="flex items-center gap-2 text-[#975F38]"><Compass className="size-5"/><span className="text-xs font-bold uppercase">{t("Enjoy more. Waste less.","استمتعوا أكثر وقلّلوا الهدر.")}</span></div>
    <h2 className="mt-2 text-2xl font-extrabold text-[#293D37]">{t("What would your family enjoy?","شو بتحب عيلتك تعمل؟")}</h2>
    <p className="mt-2 text-sm text-[#647367]">{t("Explore real places, see parent experiences where available, and keep your choice in one family plan.","اكتشف أماكن حقيقية وشوف تجارب الأهل إذا توفرت، واحفظ اختيارك بخطة واحدة.")}</p>
    <form onSubmit={discover} className="mt-4 space-y-3">
     <div className="flex flex-wrap gap-2">
      <label className="flex-1 text-xs font-semibold">{t("City","المدينة")}
       <select className="mt-1 min-h-11 w-full rounded-xl border bg-white px-3" value={city} onChange={e=>{setCity(e.target.value as WeekendCity);setPlaces([]);setSelected(null);setLooked(false);}}>
        {cities.map(c=><option value={c} key={c}>{weekendCityName(c)}</option>)}
       </select>
      </label>
      <label className="flex-1 text-xs font-semibold">{t("Experience","نوع التجربة")}
       <select className="mt-1 min-h-11 w-full rounded-xl border bg-white px-3" value={kind} onChange={e=>setKind(e.target.value as Kind)}>
        {kindOptions.map(k=><option key={k.id} value={k.id}>{ar?k.ar:k.en}</option>)}
       </select>
      </label>
     </div>
     <button disabled={busy} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#317F61] px-4 font-bold text-white disabled:opacity-60" type="submit"><Search className="size-4"/>{busy?t("Searching…","عم نبحث…"):t("Find family experiences","ابحث عن تجارب للعيلة")}</button>
    </form>
    <p className="mt-2 text-[11px] text-[#748072]">{t("Search covers mapped public places near the city centre, not every venue in the city.","البحث يشمل الأماكن العامة على الخريطة قرب وسط المدينة، وليس جميع الأماكن.")}</p>
   </section>
   {error&&<p role="alert" className="rounded-xl bg-[#FFF0EE] p-3 text-sm text-[#94463F]">{error}</p>}
   {looked&&<section className="rounded-2xl border bg-white p-4">
    <h2 className="font-bold">{t("Places to consider","أماكن ممكن تعجبكم")}</h2>
    <p className="mt-1 text-xs text-muted-foreground">{t("Public map information, not recommendations. Confirm price, hours, safety and child suitability directly.", "معلومات خريطة عامة وليست توصيات. تأكد من السعر والدوام والأمان وملاءمة الأطفال.")}{stale?t(" (Cached results)"," (نتائج قديمة)"): ""}</p>
    <label className="mt-3 block text-xs font-semibold">{t("Narrow by name","فلتر حسب الاسم")}
     <input className="mt-1 min-h-11 w-full rounded-xl border px-3" value={search} onChange={e=>setSearch(e.target.value.slice(0,90))} placeholder={t("Optional","اختياري")}/>
    </label>
    <div className="mt-3 space-y-2">{filtered.length===0?<p className="text-sm text-muted-foreground">{t("No matching mapped places. Try another category or city.","لا توجد نتائج مطابقة. جرّب فئة أو مدينة ثانية.")}</p>:filtered.slice(0,10).map(p=><button type="button" key={p.id} onClick={()=>void choose(p)} className={"flex min-h-16 w-full items-center justify-between gap-3 rounded-xl border p-3 text-start hover:bg-[#F3F9F1] "+(selected?.id===p.id?"border-[#317F61] bg-[#F3F9F1]":"border-[#E0E8DC]")}>
     <span><span className="block text-sm font-bold">{p.name}</span><span className="block text-xs text-muted-foreground">{p.category} · {t("Map listing","موجود على الخريطة")}</span></span><MapPin className="size-4 shrink-0 text-[#317F61]"/>
    </button>)}</div>
   </section>}
   {selected&&<section className="rounded-2xl border bg-white p-4" aria-label={t("Selected place","المكان المختار")}>
    <p className="text-xs font-bold text-[#317F61]">{t("YOUR CHOICE","اختيارك")}</p>
    <h2 className="mt-1 text-xl font-extrabold">{selected.name}</h2>
    <p className="mt-1 text-xs text-muted-foreground">{t("Listing source: OpenStreetMap contributors. No price or admission verification.","مصدر المكان: مساهمو OpenStreetMap. الأسعار والدخول غير مؤكدة.")}</p>
    <div className="mt-3 rounded-xl bg-[#F5F8F3] p-3">
     <div className="flex items-center gap-2"><HeartHandshake className="size-4 text-[#317F61]"/><h3 className="text-sm font-bold">{t("Parent experiences","تجارب الأهل")}</h3></div>
     {reviewStatus&&<p role="status" className="mt-2 text-xs text-muted-foreground">{reviewStatus}</p>}
     {reviews.slice(0,3).map(r=><div key={r.id} className="mt-2 border-t pt-2 text-sm"><strong>{r.author_name}</strong><span className="ms-2 text-xs text-muted-foreground">{r.experience_type==="personal"?t("Self-reported firsthand","تجربة شخصية بحسب المشارك"):t("Secondhand","منقول")}</span><p>{r.experience}</p></div>)}
     <p className="mt-2 text-[11px] text-muted-foreground">{t("Individual opinions are not independently verified; no paid placement is implied.","الآراء شخصية وغير موثّقة بشكل مستقل ولا تعني إعلاناً مدفوعاً.")}</p>
    </div>
    <div className="mt-3 flex flex-wrap gap-3 text-xs font-semibold text-[#317F61]">
     <a href={selected.osmUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-10 items-center gap-1 underline">{t("See source map","شوف المصدر")} <ArrowUpRight className="size-3"/></a>
     <a href={weekendPlaceSearchUrl(selected,city)} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-10 items-center gap-1 underline">{t("Verify venue details","تحقق من المكان")} <ArrowUpRight className="size-3"/></a>
     <Link to="/experience" className="inline-flex min-h-10 items-center underline" search={{}}>{t("Share or read more experiences","شارك أو اقرأ تجارب أكثر")}</Link>
    </div>
    <form onSubmit={save} className="mt-4 space-y-3 border-t pt-4">
     <h3 className="flex items-center gap-2 font-bold"><CalendarPlus className="size-4"/>{t("Keep this in our family plan","احفظه بخطة العيلة")}</h3>
     <div className="grid grid-cols-2 gap-2">
      <label className="text-xs font-semibold">{t("Date (optional)","التاريخ (اختياري)")}<input type="date" className="mt-1 min-h-11 w-full rounded-xl border px-2" value={date} onChange={e=>setDate(e.target.value)}/></label>
      <label className="text-xs font-semibold">{t("Estimated family total JOD","التكلفة المقدرة للعيلة") }<input inputMode="decimal" className="mt-1 min-h-11 w-full rounded-xl border px-2" placeholder={t("Optional","اختياري")} value={amount} onChange={e=>setAmount(e.target.value)}/></label>
     </div>
     <button type="submit" disabled={!plansReady} className="flex min-h-11 w-full items-center justify-center rounded-xl bg-[#317F61] text-sm font-bold text-white disabled:opacity-60">{t("Save to Family Plans","احفظ بخطط العيلة")}</button>
     {notice&&<p role="status" className="text-sm text-[#317F61]">{notice} <Link to="/family" className="underline">{t("Open Family","افتح العيلة")}</Link></p>}
    </form>
   </section>}
   <details className="rounded-xl border bg-white p-3">
    <summary className="flex min-h-10 cursor-pointer items-center gap-2 text-sm font-semibold"><ShieldCheck className="size-4"/>{t("Privacy and trusted circles","الخصوصية ودوائر الثقة")}</summary>
    <p className="mt-2 text-xs text-muted-foreground">{t("Private family finances stay private. Circle features and review posting currently require separate authentication and are not part of an automatically verified recommendation system.","مالية العيلة خاصة. دوائر الأصدقاء ونشر التجارب تحتاج تسجيل دخول منفصل، ولا تشكل نظام توصيات موثّقاً تلقائياً.")}</p>
    <Link to="/community" className="mt-2 inline-block text-sm font-semibold text-[#317F61] underline">{t("Manage an existing circle","إدارة دائرة موجودة")}</Link>
   </details>
  </div>
 </AppShell>;
}
