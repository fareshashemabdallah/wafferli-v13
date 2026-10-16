import {useState,type FormEvent} from "react";
import {Link} from "@tanstack/react-router";
import {ArrowRight,ArrowUpRight,CalendarDays,MapPin,ShieldCheck,Wallet} from "lucide-react";
import {AppShell} from "@/components/AppShell";
import {useI18n} from "@/lib/i18n";
import {useLocalState,writeLocal,fmtJOD} from "@/lib/storage";
import {sampleMoney,type MoneyState} from "@/lib/money";
import {defaultFamilyPreferences,type FamilyPreferences} from "@/lib/familyPreferences";
import {decideWeekendOuting} from "@/lib/weekendOutingDecision";
import {localToday} from "@/lib/cashflow";
import {outingCity,weekendCityName,findWeekendPlaces,weekendPlaceSearchUrl,
 type WeekendPlace,type WeekendCity} from "@/lib/weekendPlaceSearch";
import {OUTING_SHORTLIST_KEY,type OutingOption,compareOutingOptions} from "@/lib/childAwareOutingCompare";
import {WEEKEND_HANDOFF_KEY,type WeekendPlanDraft} from "@/lib/weekendOutingHandoff";

const googlePlaces=(city:string,category:string)=>
 "https://www.google.com/maps/search/?api=1&query="+encodeURIComponent(category+" "+city+" Jordan");

export function WeekendOutingExperience(){
 const {lang}=useI18n(),ar=lang==="ar";
 const [money,setMoney,moneyReady]=useLocalState<MoneyState>("money",sampleMoney());
 const [prefs,,prefsReady]=useLocalState<FamilyPreferences>("familyPreferences",defaultFamilyPreferences);
 const [shortlist,,optionsReady]=useLocalState<OutingOption[]>(OUTING_SHORTLIST_KEY,[]);
 const [balance,setBalance]=useState("");
 const [saveError,setSaveError]=useState("");
 const [cityChoice,setCityChoice]=useState<WeekendCity|null>(null);
 const [places,setPlaces]=useState<WeekendPlace[]>([]);
 const [checked,setChecked]=useState<number|null>(null);
 const [stale,setStale]=useState(false);
 const [placeError,setPlaceError]=useState("");
 const [loading,setLoading]=useState(false);
 const [handOffError,setHandOffError]=useState("");
 const ready=moneyReady&&prefsReady&&optionsReady;
 const city=cityChoice??outingCity(prefs.city);
 const cityName=weekendCityName(city);
 const decision=decideWeekendOuting(money,prefs);
 const budget=decision.suggestedJod;
 const attendance=prefs.lifestyle?prefs.typicalChildrenAttendance??"ask":"ask";
 const savedResults=ready?compareOutingOptions(shortlist,{
  children:attendance==="yes"?"yes":attendance==="no"?"no":"unsure",
  ages:[],requireStroller:false,preferQuiet:false,weather:"unknown",
  budgetJod:budget,maxDistanceKm:prefs.distanceKm>0?prefs.distanceKm:null
 }):[];
 const eligible=savedResults.filter(x=>x.suitability!=="not-suitable").slice(0,3);
 const saveBalance=(event:FormEvent)=>{
  event.preventDefault();setSaveError("");
  if(money.demo){setSaveError(ar?"ابدأ بميزانية فعلية، لا بيانات تجريبية.":"Start with real finances, not demo figures.");return;}
  const value=balance.trim()||String(money.cashOnHand??"");
  if(!/^\d{1,6}(?:\.\d{1,2})?$/.test(value)||
   !Number.isFinite(Number(value))||Number(value)>100000){
   setSaveError(ar?"أدخل رصيداً صحيحاً بالدينار.":"Enter a valid current balance in JOD.");return;
  }
  setMoney(old=>({...old,cashOnHand:Number(value),cashUpdatedAt:localToday()}));
  setBalance("");
 };
 const discover=async()=>{
  if(loading)return;
  setLoading(true);setPlaceError("");setPlaces([]);setChecked(null);
  try{
   const r=await findWeekendPlaces(city);
   setPlaces(r.places);setChecked(r.checkedAt);setStale(r.stale);
  }catch(error){
   setPlaceError(error instanceof Error?error.message:"Map listings unavailable.");
  }finally{setLoading(false);}
 };
 const handoff=()=>{
  setHandOffError("");
  if(budget===null)return;
  if(!writeLocal<WeekendPlanDraft>(WEEKEND_HANDOFF_KEY,{
   budgetJod:budget,createdAt:new Date().toISOString(),
   city:cityName,from:decision.weekendFrom,to:decision.weekendTo
  }))setHandOffError(ar?"تعذّر حفظ خطة الطلعة على هذا الجهاز.":"Could not save the outing plan on this device.");
 };
 return <AppShell title={ar?"فينا نطلع هالويكند؟":"Can we afford a family outing this weekend?"}>
  {!ready?<p className="text-sm text-muted-foreground">{ar?"عم نراجع المعلومات اللي اخترت تحفظها…":"Reading the details you chose to save…"}</p>:<>
   <section className="rounded-[1.6rem] border border-[#DAE6D5] bg-gradient-to-br from-[#EDF6EB] via-white to-[#FEF4E7] p-5 sm:p-7"
    aria-label={ar?"نتيجة تقييم الطلعة":"Your outing assessment"}>
    <p className="inline-flex items-center gap-2 text-xs font-semibold text-brand">
     <CalendarDays className="size-4"/>{decision.weekendFrom} — {decision.weekendTo}
    </p>
    <h2 className="mt-3 text-xl font-semibold text-ink sm:text-2xl">{ar?decision.headlineAr:decision.headlineEn}</h2>
    {budget!==null&&<div className="mt-4">
     <p className="text-xs font-semibold text-muted-foreground">{ar?"سقف مقترح لتخطيط الطلعة، مش رصيد مضمون":"Suggested TOTAL outing planning ceiling—not available cash"}</p>
     <p className="mt-1 text-4xl font-semibold tabular-nums text-brand">{fmtJOD(budget)}</p>
    </div>}
    <p className="mt-3 text-sm leading-relaxed text-[#456352]">{ar?decision.nextAr:decision.nextEn}</p>
    {decision.status==="needs-details"&&<>
     <p className="mt-3 text-sm leading-relaxed">{ar?decision.explanationAr:decision.explanationEn}</p>
     {decision.missing==="cash"||decision.missing==="cash-date"?
      <form onSubmit={saveBalance} className="mt-4 rounded-xl border border-[#DCE9D8] bg-white p-3">
       <label className="block text-sm font-semibold" htmlFor="outing-cash">
        {ar?"الرصيد المتاح فعلياً اليوم (د.أ)":"Cash and accessible bank balance today (JOD)"}
       </label>
       <p className="mt-1 text-xs text-muted-foreground">{ar?
        "أدخل الرصيد الحالي لتحديث تقييمك فقط. ما منسجّل مصروف أو منحجز.":
        "Confirm today's actual balance. This does not pay for or book anything."}</p>
       <div className="mt-3 flex flex-wrap gap-2">
        <input id="outing-cash" type="number" min="0" max="100000" step=".01"
         placeholder={money.cashOnHand===null||money.cashOnHand===undefined?"0":String(money.cashOnHand)}
         value={balance} onChange={e=>setBalance(e.target.value)}
         className="min-h-11 min-w-28 flex-1 rounded-lg border border-input bg-white px-3 text-sm"/>
        <button type="submit" className="min-h-11 rounded-xl bg-brand px-4 text-sm font-semibold text-white">
         {ar?"احفظ وافحص مجدداً":"Save & reassess"}
        </button>
       </div>
       {saveError&&<p role="alert" className="mt-2 text-xs text-destructive">{saveError}</p>}
      </form>:
      <Link to="/money" className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-full bg-brand px-5 text-sm font-semibold text-white">
       {ar?"أكمل معلومة مالية واحدة":"Review one missing detail"} <ArrowRight className="size-4 rtl:rotate-180"/>
      </Link>}
    </>}
    {decision.status!=="needs-details"&&<details className="mt-4 rounded-xl border border-[#DDE9D8] bg-white px-4 py-3">
     <summary className="min-h-10 cursor-pointer text-sm font-semibold text-brand">
      {ar?"ليش دبّرنا اقترح هالحد؟":"Why this planning amount?"}
     </summary>
     <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
      <p>{ar?"الرصيد المسجّل":"Entered cash"}: <strong>{fmtJOD(decision.cashJod??0)}</strong></p>
      <p>{ar?"فواتير غير مدفوعة":"Unpaid dated bills"}: <strong>{fmtJOD(decision.unpaidBillsJod??0)}</strong></p>
      <p>{ar?"مصاريف أساسية متبقية":"Remaining planned essentials"}: <strong>{fmtJOD(decision.essentialBudgetJod??0)}</strong></p>
      <p>{ar?"احتياطي حددته":"Chosen reserve"}: <strong>{fmtJOD(decision.emergencyReserveJod??0)}</strong></p>
      <p>{ar?"الهامش حسب المعلومات المسجلة":"Recorded planning margin"}: <strong>{fmtJOD(decision.recordedMarginJod??0)}</strong></p>
     </div>
     <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{ar?decision.explanationAr:decision.explanationEn}</p>
    </details>}
    <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
     {ar?"دبّرنا ما بيتصل بالبنك ولا بيعرف كل المصاريف الجاية. أي سقف هون مجرد تخطيط حذر، مش ضمان بأنك قادر تصرفه.":
      "Dabberna cannot verify your bank balance, incoming income or every upcoming expense. No amount here is guaranteed safe to spend."}
    </p>
   </section>

   <section className="mt-6" aria-label={ar?"اكتشف أنشطة حقيقية":"Discover real family activities"}>
    <div className="flex items-start gap-3">
     <MapPin className="mt-1 size-6 text-brand"/>
     <div>
      <h2 className="text-xl font-semibold">{ar?"خلّينا نلاقي نشاط مناسب":"Now let's find something worth doing"}</h2>
      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{ar?
       "نعرض أماكن مسجلة على الخريطة، مش أماكن مخترعة. تكلفة التذاكر والتوفر وملاءمة الأطفال بحاجة للتحقق من المصدر.":
       "Discover actual places mapped by the community—not made-up recommendations. Published admission prices, hours and child suitability must still be checked with the provider."}</p>
     </div>
    </div>
    <div className="mt-4 flex flex-wrap items-end gap-3">
     <label className="text-xs font-semibold">{ar?"المدينة":"City"}
      <select value={city} onChange={e=>{setCityChoice(e.target.value as WeekendCity);setPlaces([]);setChecked(null);setPlaceError("");}}
       className="mt-1 block min-h-11 min-w-32 rounded-xl border border-input bg-white px-3 text-sm">
       <option value="amman">{ar?"عمّان":"Amman"}</option>
       <option value="irbid">{ar?"إربد":"Irbid"}</option>
       <option value="zarqa">{ar?"الزرقاء":"Zarqa"}</option>
       <option value="aqaba">{ar?"العقبة":"Aqaba"}</option>
      </select>
     </label>
     <button type="button" disabled={loading} onClick={discover}
      className="inline-flex min-h-11 items-center gap-2 rounded-full bg-brand px-5 text-sm font-semibold text-white disabled:opacity-60">
      {loading?(ar?"عم نبحث على الخريطة…":"Searching map listings…"):
       (ar?"اعرض أماكن حقيقية":"Show real mapped places")}
     </button>
    </div>
    <p className="mt-2 text-xs text-muted-foreground">{ar?
      "البحث بيستخدم وسط المدينة المختارة، مش موقع هاتفك. تحتاج الضغط بنفسك لبدء طلب بحث خارجي.":
      "Searches a fixed area near the selected city centre—not your phone's location. External map lookup runs only when you choose it."}</p>
    {placeError&&<p role="status" className="mt-3 text-sm text-[#916B47]">{placeError}</p>}
    {checked!==null&&<p role="status" className="mt-3 text-xs text-muted-foreground">
     {ar?"مصدر المعلومات: متطوعو OpenStreetMap · وقت البحث: ":"Source: OpenStreetMap contributors · retrieved: "}
     {new Date(checked).toLocaleString(ar?"ar-JO":"en-GB")}
     {stale&&(ar?" · نتائج محفوظة وقديمة":" · cached/stale")}
    </p>}
    {places.length>0&&<div className="mt-3 grid gap-3 sm:grid-cols-2">
     {places.slice(0,8).map(place=><article key={place.id}
      className="rounded-xl border border-[#DFE8DB] bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-brand">{place.category}</p>
      <h3 className="mt-1 font-semibold">{place.name}</h3>
      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{ar?
       "السعر ودخول الأطفال والدوام والمسافة الحقيقية غير مؤكدة.":
       "Price, child admission, opening hours and travel distance unverified."}</p>
      <div className="mt-3 flex flex-wrap gap-3 text-xs font-semibold text-brand">
       <a target="_blank" rel="noopener noreferrer" href={place.osmUrl}
        className="inline-flex min-h-10 items-center gap-1 underline">
        {ar?"الخريطة والمصدر":"Map source"} <ArrowUpRight className="size-3.5"/>
       </a>
       <a target="_blank" rel="noopener noreferrer" href={weekendPlaceSearchUrl(place,city)}
        className="inline-flex min-h-10 items-center gap-1 underline">
        {ar?"تحقق من السعر والدوام":"Check prices & hours"} <ArrowUpRight className="size-3.5"/>
       </a>
      </div>
     </article>)}
    </div>}
    <div className="mt-4 grid gap-2 sm:grid-cols-3">
     {([
      {key:"parks",en:"Parks & playgrounds",ar:"حدائق وملاعب",term:"public parks playgrounds"},
      {key:"museums",en:"Museums & discovery",ar:"متاحف وتجارب تعلم",term:"museums children"},
      {key:"indoor",en:"Indoor family activities",ar:"أنشطة عائلية داخلية",term:"indoor family activities"}
     ] as const).map(item=><a key={item.key} href={googlePlaces(cityName,item.term)}
      target="_blank" rel="noopener noreferrer"
      className="flex min-h-14 items-center justify-between rounded-xl border border-[#DDE8DC] bg-white p-3 text-sm font-semibold text-brand">
      {ar?item.ar:item.en}<ArrowUpRight className="size-4"/>
     </a>)}
    </div>
    <p className="mt-2 text-xs text-muted-foreground">{ar?
     "هذه روابط بحث خارجي، وليست أسعاراً أو حجوزات مؤكدة من دبّرنا.":
     "These external searches are not price quotes, verified child-safety recommendations or reservations."}</p>
    {eligible.length>0&&<details className="mt-4 rounded-xl border border-border bg-white p-4">
     <summary className="cursor-pointer text-sm font-semibold text-brand">
      {ar?"خياراتك السابقة التي لا تتعارض مع بياناتك":"Previously saved options worth checking"} ({eligible.length})
     </summary>
     {eligible.map(row=><div key={row.option.id} className="mt-3 border-t border-border pt-3 text-sm">
      <strong>{row.option.name}</strong>
      <p className="mt-1 text-xs text-muted-foreground">{row.option.totalEstimatedJod!==undefined?
       fmtJOD(row.option.totalEstimatedJod):(ar?"لا يوجد سعر مسجّل":"No saved total price")}</p>
      <p className="mt-1 text-xs text-muted-foreground">{ar?
       row.reasonsAr[0]:row.reasonsEn[0]}</p>
     </div>)}
     <p className="mt-3 text-xs text-muted-foreground">{ar?
      "هذه ملاحظات أدخلتها أنت؛ ليست بيانات أماكن أو أسعار تم التحقق منها.":
      "These are your past notes, not verified venue facts or confirmed offers."}</p>
    </details>}
    {budget!==null&&<div className="mt-5 flex flex-wrap items-center gap-3">
     <Link to="/explore/together" onClick={handoff}
      className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[#D7E6D5] bg-[#EBF4E9] px-4 text-sm font-semibold text-brand">
      <Wallet className="size-4"/>{ar?"استخدم "+fmtJOD(budget)+" بخطة طلعة":"Use "+fmtJOD(budget)+" in an outing plan"}
      <ArrowRight className="size-4 rtl:rotate-180"/>
     </Link>
     {handOffError&&<p role="alert" className="text-xs text-destructive">{handOffError}</p>}
    </div>}
   </section>
   <div className="mt-6 flex items-start gap-2 rounded-xl bg-[#F2F5EF] p-4 text-xs leading-relaxed text-muted-foreground">
    <ShieldCheck className="size-5 shrink-0 text-brand"/>
    <span>{ar?"معلومات العائلة وأرقام المالية بتضل على هذا الجهاز. ما في تسجيل دفع أو حجز أو مشاركة تلقائية للبيانات مع الأماكن.":
     "Family financial details stay on this device. No venue receives household balances, and no booking or payment is created."}</span>
   </div>
  </>}
 </AppShell>;
}
