import {useState,type FormEvent} from "react";
import {Link} from "@tanstack/react-router";
import {ArrowRight,ArrowUpRight,CalendarDays,Check,ChevronRight,Compass,Heart,MapPin,Search,ShieldCheck,Sparkles,UsersRound,Wallet} from "lucide-react";
import {AppShell} from "@/components/AppShell";
import {useI18n} from "@/lib/i18n";
import {findWeekendPlaces,weekendPlaceSearchUrl,weekendCityName,type WeekendPlace,type WeekendCity} from "@/lib/weekendPlaceSearch";
import {useLocalState,uid} from "@/lib/storage";
import {FAMILY_PLANS_KEY,ACTIVE_PLAN_KEY,makeFamilyPlan,type FamilyPlan} from "@/lib/familyPlans";
import {decisionMoneyGuidance,upsertOutingDecision,latestExperienceOpportunity,reflectOnOuting} from "@/lib/familyDecisionEngine";
import {sampleMoney,type MoneyState} from "@/lib/money";
import {communityDb as db,itemKey,type ExperienceReview} from "@/lib/community";

type Experience="all"|"playground"|"park"|"museum"|"attraction"|"arts centre";
const kinds:{id:Experience;en:string;ar:string;emoji:string}[]=[
 {id:"all",en:"Surprise us",ar:"فاجئنا",emoji:"✨"},
 {id:"playground",en:"Play together",ar:"نلعب سوا",emoji:"🛝"},
 {id:"park",en:"Fresh air",ar:"هوا وطبيعة",emoji:"🌳"},
 {id:"museum",en:"Learn & explore",ar:"نتعلّم ونكتشف",emoji:"🪐"},
 {id:"attraction",en:"Family adventure",ar:"مغامرة للعيلة",emoji:"🎡"},
 {id:"arts centre",en:"Get creative",ar:"نبدع سوا",emoji:"🎨"}
];
const cities:WeekendCity[]=["amman","irbid","zarqa","aqaba"];
const compact="min-h-11 rounded-xl border border-[#DDE9E0] bg-white px-3 text-sm outline-offset-2 focus-visible:outline-2 focus-visible:outline-[#3D906B]";
const yesNo:{id:"yes"|"mixed"|"no";en:string;ar:string}[]=[
 {id:"yes",en:"Yes",ar:"نعم"},{id:"mixed",en:"Somewhat",ar:"إلى حد ما"},{id:"no",en:"No",ar:"لا"}
];
export function FamilyDiscoverHome(){
 const {lang}=useI18n(),ar=lang==="ar";
 const t=(en:string,arabic:string)=>ar?arabic:en;
 const [city,setCity]=useState<WeekendCity>("amman");
 const [kind,setKind]=useState<Experience>("all");
 const [filter,setFilter]=useState("");
 const [places,setPlaces]=useState<WeekendPlace[]>([]);
 const [selected,setSelected]=useState<WeekendPlace|null>(null);
 const [resultsReady,setResultsReady]=useState(false),[busy,setBusy]=useState(false);
 const [stale,setStale]=useState(false),[error,setError]=useState("");
 const [reviews,setReviews]=useState<ExperienceReview[]>([]);
 const [reviewMessage,setReviewMessage]=useState("");
 const [date,setDate]=useState(""),[budget,setBudget]=useState("");
 const [notice,setNotice]=useState("");
 const [plans,setPlans,plansReady]=useLocalState<FamilyPlan[]>(FAMILY_PLANS_KEY,[]);
 const [,setActive]=useLocalState<string|null>(ACTIVE_PLAN_KEY,null);
 const [money,,moneyReady]=useLocalState<MoneyState>("money",sampleMoney());
 const [enjoyed,setEnjoyed]=useState<"yes"|"mixed"|"no">("yes");
 const [value,setValue]=useState<"yes"|"mixed"|"no">("yes");
 const [reflectionNote,setReflectionNote]=useState("");
 const today=new Date().toISOString().slice(0,10);
 const feedbackPlan=plansReady?latestExperienceOpportunity(plans,today):null;
 const search=async(e:FormEvent)=>{
  e.preventDefault();setBusy(true);setError("");setResultsReady(false);setSelected(null);
  try{const result=await findWeekendPlaces(city);setPlaces(result.places);setStale(result.stale);setResultsReady(true);}
  catch(err){setPlaces([]);setResultsReady(true);setError(err instanceof Error?err.message:t("Public map source unavailable.","مصدر الخريطة مش متاح."));}
  finally{setBusy(false);}
 };
 const choose=async(place:WeekendPlace)=>{
  setSelected(place);setError("");setNotice("");setDate("");setBudget("");setReviews([]);
  setReviewMessage(t("Looking for parent experiences…","عم نبحث عن تجارب الأهل…"));
  try{
   const type=place.category==="playground"?"playground":"activity";
   const {data,error}=await db.rpc("get_family_experience_reviews",{
    p_item_key:itemKey(type,place.name,weekendCityName(city))
   });
   if(error)throw error;
   const found=(data??[]) as ExperienceReview[];
   setReviews(found);
   setReviewMessage(found.length?"":t("No firsthand parent experiences for this listing yet. It is not endorsed by Dabberna.","ما في تجارب أهل عن هذا المكان بعد. دبّرنا ما عم توصي فيه."));
  }catch{setReviewMessage(t("Reviews cannot be checked right now. Treat this as an unverified map listing.","ما قدرنا نتحقق من آراء الأهل. هذا مكان غير موثّق."));}
 };
 const show=places.filter(p=>(kind==="all"||p.category===kind)&&p.name.toLocaleLowerCase().includes(filter.trim().toLocaleLowerCase()));
 const linked=selected?plans.find(p=>p.kind==="outing"&&p.status!=="completed"&&p.sourceRef===selected.osmUrl&&(p.date??"")===(date||"")):null;
 const estimate=budget.trim()?Number(budget):undefined;
 const preview=selected&&moneyReady&&estimate!==undefined&&Number.isFinite(estimate)&&estimate>=0?
  makeFamilyPlan({id:"decision-preview",title:selected.name,kind:"outing",sourceRef:selected.osmUrl,budgetJod:estimate}):null;
 const moneyGuidance=preview?decisionMoneyGuidance(preview,money):null;
 const save=(e:FormEvent)=>{
  e.preventDefault();if(!selected||!plansReady)return;
  if(budget.trim()&&!/^\d{1,5}(?:\.\d{1,2})?$/.test(budget)){
   setError(t("Enter a positive family estimate or leave it blank.","أدخل تكلفة متوقعة صحيحة أو اتركها فارغة."));return;
  }
  const result=upsertOutingDecision(plans,{
   id:uid(),place:selected,city,
   ...(date?{date}:{}),...(budget.trim()?{budgetJod:Number(budget)}:{})
  });
  if(!result){setError(t("Please review the date or estimated cost.","راجع التاريخ أو التكلفة."));return;}
  if(result.created)setPlans(old=>upsertOutingDecision(old,{
   id:result.plan.id,place:selected,city,
   ...(date?{date}:{}),...(budget.trim()?{budgetJod:Number(budget)}:{})
  })?.plans??old);
  setActive(result.plan.id);
  setNotice(result.created?
   t("Added as one family plan. Nothing booked or paid.","انضافت خطة واحدة للعيلة. ما في حجز أو دفع."):
   t("You already planned this outing. We kept your existing plan.","هالطلعة محفوظة من قبل. حافظنا على خطتك."));
  setError("");
 };
 const saveReflection=()=>{
  if(!feedbackPlan)return;
  const next=reflectOnOuting(feedbackPlan,{enjoyed,value,note:reflectionNote});
  if(!next)return;
  setPlans(old=>old.map(p=>p.id===next.id?next:p));
  setReflectionNote("");
  setNotice(t("Private note saved with your existing outing. It has not been shared publicly.","انحفظ رأيك بشكل خاص مع الطلعة. ما تم نشره للناس."));
 };
 return <AppShell title={t("Discover","اكتشف")}>
 <div className="mx-auto max-w-[920px] space-y-4">
  <section className="relative isolate overflow-hidden rounded-[1.9rem] border border-[#EBDCCC] bg-[linear-gradient(128deg,#FFFBF2_0%,#FBEBDD_48%,#E5F5DF_100%)] p-5 sm:p-7">
   <img src={import.meta.env.BASE_URL+"landing-family-characters.avif"} alt="" aria-hidden="true"
    className="pointer-events-none absolute bottom-0 end-[-45px] -z-0 h-[160px] w-[47%] object-contain object-bottom opacity-65 sm:end-0 sm:h-[220px] sm:opacity-90"/>
   <div className="relative z-10 max-w-[70%] sm:max-w-[66%]">
    <span className="inline-flex items-center gap-2 rounded-full bg-white/75 px-3 py-1.5 text-[11px] font-extrabold tracking-wide text-[#996546]"><Sparkles className="size-3.5"/>{t("BETTER FAMILY DAYS","أيام أحلى للعيلة")}</span>
    <h2 className="mt-3 text-[clamp(1.4rem,4vw,2.6rem)] font-black leading-tight text-[#284A3A]">{t("Less searching. More living.","دوّر أقل. عيش أحلى.")}</h2>
    <p className="mt-2 max-w-[430px] text-xs leading-relaxed text-[#536C5E] sm:text-sm">{t("Find a family experience, understand what parents really know, and keep the decision in one plan.","لاقي طلعة للعيلة، شوف شو بيعرفوا الأهل عنها، وخلي قرارك بخطة واحدة.")}</p>
   </div>
  </section>
  <section className="rounded-[1.6rem] border border-[#E0E8DB] bg-white p-4 sm:p-5">
   <div className="flex items-center gap-2"><Heart className="size-5 text-[#B76D7C]"/><h2 className="text-lg font-extrabold">{t("What would your family enjoy?","شو بتحب عيلتك تعمل؟")}</h2></div>
   <p className="mt-1 text-xs text-[#708075]">{t("Choose a feeling, not a complicated filter.","اختَر نوع التجربة، مش استبيان طويل.")}</p>
   <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-6">
    {kinds.map(item=><button key={item.id} type="button" aria-pressed={kind===item.id} onClick={()=>{setKind(item.id);setSelected(null);}}
     className={"flex min-h-[80px] flex-col items-center justify-center gap-1.5 rounded-xl border px-1.5 py-2 text-center text-[11px] font-bold transition focus-visible:outline-2 focus-visible:outline-[#338866] "+(kind===item.id?"border-[#429676] bg-[#EAF6EB] text-[#225C43]":"border-[#ECEDE6] bg-[#FAFCF8] text-[#65746D] hover:bg-[#F4F8F0]")}>
     <span className="text-2xl" aria-hidden="true">{item.emoji}</span>{ar?item.ar:item.en}
    </button>)}
   </div>
   <form onSubmit={search} className="mt-4 flex flex-wrap items-end gap-2">
    <label className="min-w-[110px] flex-1 text-xs font-bold">{t("City","المدينة")}
     <select className={compact+" mt-1 w-full"} value={city} onChange={e=>{setCity(e.target.value as WeekendCity);setSelected(null);setResultsReady(false);}}>
      {cities.map(c=><option key={c} value={c}>{weekendCityName(c)}</option>)}
     </select>
    </label>
    <button type="submit" disabled={busy} className="inline-flex min-h-11 flex-[2] items-center justify-center gap-2 rounded-xl bg-[#317B5D] px-4 text-sm font-bold text-white shadow-sm disabled:opacity-60"><Search className="size-4"/>{busy?t("Looking…","عم ندوّر…"):t("Find family experiences","دبّرنا، دورلنا")}</button>
   </form>
   <p className="mt-2 text-[11px] text-[#839087]">{t("Pilot: public mapped places near selected city centres. Not all venues, and no verified opening hours or tickets.","تجربة أولية لأماكن على الخريطة قرب مراكز المدن. ليست كل الأماكن ولا تشمل أسعار أو مواعيد مؤكدة.")}</p>
  </section>
  {error&&<p role="alert" className="rounded-xl border border-[#F0D4C9] bg-[#FFF4EF] p-3 text-sm text-[#9B5D44]">{error}</p>}
  {resultsReady&&<section aria-label={t("Family options","خيارات العيلة")} className="rounded-[1.6rem] border border-[#E0E8DB] bg-white p-4 sm:p-5">
   <div className="flex flex-wrap items-center justify-between gap-2">
    <div><p className="text-[11px] font-black uppercase tracking-widest text-[#3B8463]">{t("OPTIONS","الخيارات")}</p><h2 className="mt-1 text-lg font-extrabold">{t("Worth exploring","تستاهل تشوفها")}</h2></div>
    <span className="rounded-full bg-[#F1F5F1] px-3 py-1.5 text-[11px] font-semibold text-[#687C70]">{stale?t("Cached map results","نتائج خريطة مخزّنة"):t("Public map source","مصدر خريطة عام")}</span>
   </div>
   <label className="mt-3 block text-xs font-semibold">{t("Filter names (optional)","البحث بالاسم (اختياري)")}
    <input className={compact+" mt-1 w-full"} value={filter} onChange={e=>setFilter(e.target.value.slice(0,90))} placeholder={t("Park, museum…","حديقة، متحف…")}/>
   </label>
   <div className="mt-3 grid gap-2 sm:grid-cols-2">
    {show.length?show.slice(0,10).map((p,i)=><button key={p.id} type="button" onClick={()=>void choose(p)}
     className={"group flex min-h-[82px] items-center gap-3 rounded-2xl border p-3 text-start transition hover:shadow-sm "+(selected?.id===p.id?"border-[#429676] bg-[#EAF6EB]":"border-[#E4EAE1] bg-[#FBFCFA]")}>
     <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[#E8F2E5] text-xl" aria-hidden="true">{p.category==="park"?"🌳":p.category==="playground"?"🛝":p.category==="museum"?"🏛️":p.category==="arts centre"?"🎨":"✨"}</span>
     <span className="min-w-0 flex-1"><strong className="block truncate text-sm">{p.name}</strong><span className="mt-1 block text-[11px] text-[#738177]">{p.category} · {t("Map listing, not an endorsement","من الخريطة، مش توصية")}</span></span>
     <ChevronRight className="size-4 text-[#3F946F] rtl:rotate-180"/>
    </button>):<p className="col-span-full rounded-xl bg-[#F8F9F5] p-4 text-sm text-[#728078]">{t("No matching places in this limited public map search. Try another city or experience.","ما طلع أماكن مناسبة ضمن بحث الخريطة المحدود. جرّب مدينة أو تجربة تانية.")}</p>}
   </div>
  </section>}
  {selected&&<section className="rounded-[1.6rem] border border-[#D8E7DE] bg-white p-4 shadow-[0_20px_42px_-35px_rgba(35,81,52,.3)] sm:p-5" aria-label={t("Selected family option","اختيار العيلة")}>
   <p className="text-[11px] font-extrabold tracking-wide text-[#428368]">{t("LET'S CONSIDER THIS ONE","خلّينا نشوف هالخيار")}</p>
   <h2 className="mt-1 text-xl font-black text-[#264D3C]">{selected.name}</h2>
   <p className="mt-1 flex items-center gap-1.5 text-xs text-[#718075]"><MapPin className="size-3.5"/>{weekendCityName(city)} · {t("OpenStreetMap listing","موجود على OpenStreetMap")}</p>
   <div className="mt-4 grid gap-3 sm:grid-cols-2">
    <div className="rounded-2xl bg-[#F2F7EF] p-3">
     <h3 className="flex items-center gap-2 text-sm font-bold"><UsersRound className="size-4 text-[#428368]"/>{t("What parents say","شو قالوا الأهل")}</h3>
     {reviewMessage&&<p className="mt-2 text-xs leading-relaxed text-[#69796E]" role="status">{reviewMessage}</p>}
     {reviews.slice(0,2).map(r=><div key={r.id} className="mt-2 border-t border-[#DCE8D9] pt-2">
      <p className="text-xs font-bold">{r.author_name} <span className="font-normal text-[#799184]">· {r.experience_type==="personal"?t("Self-reported firsthand","تجربة شخصية معلنة"):t("Secondhand","منقول")}</span></p>
      <p className="mt-1 text-xs leading-relaxed">{r.experience}</p>
     </div>)}
     <p className="mt-2 text-[11px] text-[#8A9188]">{t("Opinions are self-reported, not independently verified. No paid ranking.","الآراء من أصحابها وغير متحقق منها بشكل مستقل. ما في ترتيب مدفوع.")}</p>
    </div>
    <div className="rounded-2xl bg-[#FFF6EC] p-3">
     <h3 className="flex items-center gap-2 text-sm font-bold"><ShieldCheck className="size-4 text-[#A17A44]"/>{t("Know before you go","تأكد قبل ما تروح")}</h3>
     <p className="mt-2 text-xs leading-relaxed text-[#746B5E]">{t("Child suitability, costs, access, parking, opening hours and availability aren't verified. Check with the provider.","ملاءمة الأطفال، الأسعار، الوصول، المواقف، الدوام والتوفر غير مؤكدة. تأكد من الجهة.")}</p>
     <div className="mt-3 flex flex-wrap gap-3">
      <a href={selected.osmUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-9 items-center gap-1 text-xs font-bold text-[#866342] underline">{t("Source map","الخريطة")} <ArrowUpRight className="size-3"/></a>
      <a href={weekendPlaceSearchUrl(selected,city)} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-9 items-center gap-1 text-xs font-bold text-[#866342] underline">{t("Check details","تحقق من التفاصيل")} <ArrowUpRight className="size-3"/></a>
     </div>
    </div>
   </div>
   <form onSubmit={save} className="mt-4 border-t border-[#E4ECE4] pt-4">
    <h3 className="flex items-center gap-2 text-base font-extrabold"><CalendarDays className="size-4 text-[#338866]"/>{t("Make it our plan","خليها خطتنا")}</h3>
    <p className="mt-1 text-xs text-[#748177]">{t("Only the details that matter now. Saving does not book or pay.","بس المعلومات اللازمة هلّق. الحفظ لا يعني الحجز أو الدفع.")}</p>
    <div className="mt-3 grid grid-cols-2 gap-2">
     <label className="text-xs font-semibold">{t("When? (optional)","إمتى؟ (اختياري)")}<input type="date" className={compact+" mt-1 w-full"} value={date} onChange={e=>setDate(e.target.value)}/></label>
     <label className="text-xs font-semibold">{t("Expected total JOD (optional)","التكلفة بالدينار (اختياري)")}<input inputMode="decimal" className={compact+" mt-1 w-full"} placeholder={t("Your estimate","تقديرك")} value={budget} onChange={e=>setBudget(e.target.value)}/></label>
    </div>
    {moneyGuidance&&<p className={"mt-3 rounded-xl p-3 text-xs leading-relaxed "+(moneyGuidance.state==="review"?"bg-[#FFF2E8] text-[#8C6045]":"bg-[#EFF6F0] text-[#52735F]")}><Wallet className="me-1 inline size-4"/>{ar?moneyGuidance.ar:moneyGuidance.en}</p>}
    <button type="submit" disabled={!plansReady} className="mt-3 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#317B5D] px-4 text-sm font-bold text-white disabled:opacity-60"><Check className="size-4"/>{linked?t("Continue this family plan","تابع الخطة المحفوظة"):t("Keep this in Family","احفظها بالعيلة")}</button>
    {notice&&<p role="status" className="mt-3 rounded-xl bg-[#F2F8F1] p-3 text-xs font-semibold text-[#417B57]">{notice} <Link to="/family" className="ms-2 inline-flex items-center underline">{t("See the plan","شوف الخطة")} <ArrowRight className="size-3"/></Link></p>}
   </form>
  </section>}
  {feedbackPlan&&<details className="rounded-2xl border border-[#E7DDE2] bg-[#FFFAFC] p-4">
   <summary className="flex min-h-10 cursor-pointer items-center gap-2 text-sm font-bold text-[#874D6D]"><Heart className="size-4"/>{t("How was your last outing? (optional)","كيف كانت آخر طلعة؟ (اختياري)")}</summary>
   <p className="mt-2 font-semibold">{feedbackPlan.title}</p>
   <div className="mt-3 grid gap-3 sm:grid-cols-2">
    <div><p className="text-xs font-bold">{t("Did you enjoy it?","انبسطتوا؟")}</p><div className="mt-2 flex gap-2">{yesNo.map(x=><button key={x.id} type="button" aria-pressed={enjoyed===x.id} onClick={()=>setEnjoyed(x.id)} className={"flex-1 rounded-lg border px-2 py-2 text-xs "+(enjoyed===x.id?"border-[#B8648D] bg-[#FBE6EF]":"bg-white")}>{ar?x.ar:x.en}</button>)}</div></div>
    <div><p className="text-xs font-bold">{t("Worth the cost?","بتستاهل التكلفة؟")}</p><div className="mt-2 flex gap-2">{yesNo.map(x=><button key={x.id} type="button" aria-pressed={value===x.id} onClick={()=>setValue(x.id)} className={"flex-1 rounded-lg border px-2 py-2 text-xs "+(value===x.id?"border-[#B8648D] bg-[#FBE6EF]":"bg-white")}>{ar?x.ar:x.en}</button>)}</div></div>
   </div>
   <label className="mt-3 block text-xs font-bold">{t("A note for yourself (optional)","ملاحظة إلك (اختياري)")}<textarea maxLength={300} rows={2} className="mt-1 w-full rounded-xl border border-[#E5DDE3] p-3 text-sm" value={reflectionNote} onChange={e=>setReflectionNote(e.target.value)}/></label>
   <p className="mt-2 text-[11px] text-[#867781]">{t("Private by default. Not published to other families.","خاص إلكم. ما رح يننشر للأهل الآخرين.")}</p>
   <button onClick={saveReflection} type="button" className="mt-2 min-h-11 rounded-xl bg-[#985B7D] px-4 text-sm font-bold text-white">{t("Remember our experience","احفظ تجربتنا")}</button>
  </details>}
  <p className="flex items-start gap-2 px-2 text-[11px] leading-relaxed text-[#778C7D]"><ShieldCheck className="mt-0.5 size-4 shrink-0"/>{t("You choose what to save. Your private financial information is never shared with other parents by this page.","إنت بتختار شو تحفظ. هالصفحة ما بتشارك معلوماتك المالية الخاصة مع الأهل.")}</p>
 </div>
 </AppShell>;
}
