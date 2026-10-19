import {useState,type FormEvent} from "react";
import {Link} from "@tanstack/react-router";
import {ArrowRight,CheckCircle2,ExternalLink,MapPin,ShieldCheck,SlidersHorizontal,UsersRound,Wallet} from "lucide-react";
import {AppShell} from "@/components/AppShell";
import {useI18n} from "@/lib/i18n";
import {useLocalState,uid} from "@/lib/storage";
import {sampleMembers,sampleMoney,type Member,type MoneyState} from "@/lib/money";
import {defaultFamilyPreferences,type FamilyPreferences} from "@/lib/familyPreferences";
import {activitySearchUrl,suggestedActivityThemes,type DiscoveryPriority} from "@/lib/familyActivityDiscovery";
import {familyThemeMatches,planFromDiscoveredPlace,placeAsOutingDraft} from "@/lib/activityPlanBridge";
import {realFamilyMembers} from "@/lib/familySetup";
import {FAMILY_PLANS_KEY,reviewPlanCost,type FamilyPlan} from "@/lib/familyPlans";
import {outingCity,weekendCityName,findWeekendPlaces,weekendPlaceSearchUrl,
 type WeekendPlace,type WeekendCity} from "@/lib/weekendPlaceSearch";

const goodNumber=(v:string)=>v.trim()===""?undefined:(/^\d{1,6}(?:\.\d{1,2})?$/.test(v)&&Number(v)<=100000?Number(v):null);
const selectCls="mt-1 min-h-11 w-full rounded-xl border border-[#D0DED4] bg-white px-3 text-sm";
const panelCls="rounded-[1.4rem] border border-[#D7E6DA] bg-white p-4 sm:p-5";

export function FamilyActivityExplorer({onShowAffordability}:{onShowAffordability:()=>void}){
 const {lang}=useI18n(),ar=lang==="ar",t=(en:string,arabic:string)=>ar?arabic:en;
 const [prefs,setPrefs,prefsReady]=useLocalState<FamilyPreferences>("familyPreferences",defaultFamilyPreferences);
 const [members,,membersReady]=useLocalState<Member[]>("members",sampleMembers());
 const [money,,moneyReady]=useLocalState<MoneyState>("money",sampleMoney());
 const [plans,setPlans,plansReady]=useLocalState<FamilyPlan[]>(FAMILY_PLANS_KEY,[]);
 const [mode,setMode]=useState<"family"|"one"|"explore">("family");
 const [age,setAge]=useState("8");
 const [cityChoice,setCityChoice]=useState<WeekendCity|null>(null);
 const [places,setPlaces]=useState<WeekendPlace[]>([]);
 const [checked,setChecked]=useState<number|null>(null);
 const [stale,setStale]=useState(false);
 const [loading,setLoading]=useState(false);
 const [placeError,setPlaceError]=useState("");
 const [selected,setSelected]=useState<WeekendPlace|null>(null);
 const [date,setDate]=useState("");
 const [estimate,setEstimate]=useState("");
 const [saveError,setSaveError]=useState("");
 const [savedPlan,setSavedPlan]=useState<FamilyPlan|null>(null);
 const priority:DiscoveryPriority=prefs.discoveryPriority??"balance";
 const children=realFamilyMembers(members).filter(x=>x.role==="child"&&typeof x.ageYears==="number"&&Number.isInteger(x.ageYears)&&x.ageYears>=0&&x.ageYears<=18);
 const city=cityChoice??outingCity(prefs.city);
 const cityName=weekendCityName(city);
 const themes=suggestedActivityThemes(mode==="one"?Number(age):null,priority,prefs.freeActivitiesFirst??false);
 const matched=mode==="family"&&children.length?familyThemeMatches(themes,members):themes.map(theme=>({theme,matches:0,total:0,fit:"unknown" as const}));
 const shown=matched.slice(0,6);
 const prefsQuestions=[
  prefs.activityGroupPreference&&prefs.activityGroupPreference!=="any"?t("Class composition: ","المجموعة: ")+prefs.activityGroupPreference:null,
  prefs.instructorPreference&&prefs.instructorPreference!=="any"?t("Instructor: ","المدرّب/ة: ")+prefs.instructorPreference:null,
  prefs.parentCanObservePreferred?t("Can parents observe?","هل يمكن للأهل مشاهدة النشاط؟"):null
 ].filter((x):x is string=>!!x);
 const ready=prefsReady&&membersReady&&plansReady&&moneyReady;
 const update=<K extends keyof FamilyPreferences>(key:K,value:FamilyPreferences[K])=>setPrefs(p=>({...p,[key]:value}));
 const discover=async()=>{
  if(loading)return;
  setLoading(true);setPlaces([]);setChecked(null);setPlaceError("");setSelected(null);setSavedPlan(null);
  try{
   const found=await findWeekendPlaces(city);
   setPlaces(found.places);setChecked(found.checkedAt);setStale(found.stale);
  }catch(error){setPlaceError(error instanceof Error?error.message:t("Map source unavailable.","تعذّر الوصول للخريطة."));}
  finally{setLoading(false);}
 };
 const choose=(place:WeekendPlace)=>{setSelected(place);setDate("");setEstimate("");setSaveError("");setSavedPlan(null);};
 const save=(event:FormEvent)=>{
  event.preventDefault();setSaveError("");
  if(!selected||!ready)return;
  const amount=goodNumber(estimate);
  if(amount===null){setSaveError(t("Enter a valid family-total estimate in JOD, or leave it blank.","أدخل تكلفة إجمالية صحيحة بالدينار أو اتركها فارغة."));return;}
  const draft=planFromDiscoveredPlace({...placeAsOutingDraft(selected),...(date?{date}:{}),...(amount!==undefined?{estimatedTotalJod:amount}:{})},uid());
  if(!draft){setSaveError(t("Check the date, map source and estimated amount.","تأكد من التاريخ ورابط الخريطة والتكلفة."));return;}
  const duplicate=plans.find(p=>p.kind==="outing"&&p.status!=="completed"&&p.sourceRef===draft.sourceRef&&(p.date??"")===(draft.date??""));
  if(duplicate){setSavedPlan(duplicate);setSaveError(t("This place and date are already in your Family Plans. Open the existing plan instead.","هذا المكان والتاريخ محفوظان مسبقاً في خطط العيلة. افتح الخطة المحفوظة."));return;}
  setPlans(old=>[draft,...old]);setSavedPlan(draft);
 };
 const planReview=savedPlan&&moneyReady?reviewPlanCost(savedPlan,money):null;
 return <AppShell title={t("Explore family activities","اكتشف أنشطة العيلة")}>
  <main className="mx-auto max-w-[980px] space-y-4 pb-8">
   <section className="rounded-[1.7rem] border border-[#D1E7D9] bg-gradient-to-br from-[#DDF2E5] via-[#F4FAF0] to-[#FEF2E0] p-5 sm:p-7">
    <p className="text-xs font-extrabold tracking-wide text-[#348467]">{t("DISCOVER FIRST · FINANCES OPTIONAL","نكتشف أولاً · المالية اختيارية")}</p>
    <h1 className="mt-2 text-2xl font-black text-[#224D3A] sm:text-3xl">{t("What can your family enjoy?","شو ممكن تستمتع فيه عيلتك؟")}</h1>
    <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#536B5E]">{t(
     "Start with your children's ages, find real mapped places and save an idea. Add a budget only if you want a financial review.",
     "ابدأ بأعمار الأطفال، استكشف أماكن حقيقية على الخريطة واحفظ فكرة. أدخل ميزانية فقط إذا رغبت بمراجعة مالية."
    )}</p>
   </section>

   <section className={panelCls} aria-label={t("Who is joining?","مين رح يشارك؟")}>
    <div className="flex items-center gap-2"><UsersRound className="size-5 text-brand"/><h2 className="text-lg font-bold">{t("Who are we planning for?","لمين عم نخطط؟")}</h2></div>
    <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label={t("Choose participants","اختيار المشاركين")}>
     {([{id:"family",en:"All my children",ar:"كل أولادي"},{id:"one",en:"One child",ar:"طفل واحد"},{id:"explore",en:"Browse everything",ar:"تصفح كل الأفكار"}] as const).map(x=>
      <button key={x.id} type="button" aria-pressed={mode===x.id} onClick={()=>setMode(x.id)}
       className={"min-h-11 rounded-full border px-4 text-sm font-semibold "+(mode===x.id?"border-[#398365] bg-[#E6F4EA] text-[#1D654B]":"border-[#D7E4D8] bg-white text-[#51665D]")}>{ar?x.ar:x.en}</button>
     )}
    </div>
    {mode==="family"&&(children.length>0?<p className="mt-3 text-sm text-[#507466]">
      {t("Using saved ages: ","باستخدام الأعمار المسجّلة: ")}{children.map(m=>m.ageYears).join(", ")}. {t("These are broad category matches, not confirmed admission.","هذه ملاءمة عامة للفئات وليست تأكيداً لقبول الأطفال.")}
     </p>:<p className="mt-3 text-sm text-[#68796E]">{t("No real child ages saved yet. We'll show general family ideas; you can explore without a profile.","لا توجد أعمار أطفال مسجّلة. سنعرض أفكاراً عامة ويمكنك الاستكشاف بدون ملف عائلي.")} <Link to="/space" className="font-bold text-brand underline">{t("Add optional ages","أضف الأعمار اختيارياً")}</Link></p>)}
    {mode==="one"&&<label className="mt-3 block max-w-xs text-sm font-semibold">{t("Child's age","عمر الطفل")}
      <select className={selectCls} value={age} onChange={e=>setAge(e.target.value)}>
       {Array.from({length:19},(_,n)=><option key={n} value={n}>{n}</option>)}
      </select>
    </label>}
   </section>

   <section className={panelCls} aria-label={t("Activity ideas by age","أفكار حسب العمر")}>
    <h2 className="text-lg font-bold">{t("Activity ideas worth exploring","أفكار أنشطة تستاهل الاستكشاف")}</h2>
    <p className="mt-1 text-xs text-muted-foreground">{t("These are activity types, not scheduled events or confirmed providers.","هذه أنواع أنشطة وليست مواعيد أو جهات مؤكدة.")}</p>
    <details className="mt-3 rounded-xl border border-[#DDE9DC] bg-[#F6FAF5] p-3">
     <summary className="flex min-h-10 cursor-pointer items-center gap-2 text-sm font-bold text-brand"><SlidersHorizontal className="size-4"/>{t("My family preferences","تفضيلات عيلتنا")}</summary>
     <div className="mt-2 grid gap-3 sm:grid-cols-2">
      <label className="text-sm">{t("What matters most?","شو الأهم؟")}
       <select className={selectCls} value={priority} onChange={e=>update("discoveryPriority",e.target.value as DiscoveryPriority)} disabled={!prefsReady}>
        <option value="quality">{t("Convenience and quality","الراحة والجودة")}</option>
        <option value="balance">{t("Balance of quality and price","توازن الجودة والسعر")}</option>
        <option value="affordable">{t("Affordable first","الأقل تكلفة أولاً")}</option>
       </select>
      </label>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="size-4" checked={prefs.freeActivitiesFirst??false} onChange={e=>update("freeActivitiesFirst",e.target.checked)} disabled={!prefsReady}/>{t("Search public and potentially free ideas first","الأماكن العامة والخيارات المحتملة المجانية أولاً")}</label>
     </div>
     <p className="mt-2 text-xs text-muted-foreground">{t("Provider environment and instructor preferences are private questions to verify. We do not label an unverified venue as a match.","تفضيلات المدرّب وبيئة النشاط أسئلة خاصة للتحقق، ولا نعلن أن مكاناً غير متحقق منه يناسبها.")}</p>
    </details>
    <div className="mt-4 grid gap-2 sm:grid-cols-2">
     {shown.map(({theme,fit,matches,total})=><a key={theme.id} href={activitySearchUrl(theme,cityName)} target="_blank" rel="noopener noreferrer"
      className="flex min-h-[95px] items-center gap-3 rounded-xl border border-[#E0E8DE] bg-[#FAFCF9] p-3 hover:bg-[#F1F9F0]">
      <span className="text-3xl" aria-hidden="true">{theme.icon}</span>
      <span className="min-w-0 flex-1"><strong className="block text-sm">{ar?theme.ar:theme.en}</strong>
       <span className="mt-1 block text-xs text-[#5B7A69]">{mode==="family"&&total>0?
        fit==="all"?t("Age range covers all ","الفئة العمرية تشمل الأعمار ")+total+t(" saved children"," أطفال مسجلين"):
        t("Age range covers ","الفئة العمرية تشمل ")+matches+t(" of "," من ")+total+t(" saved children"," أطفال مسجلين"):
        t("Find options near ","ابحث عن خيارات في ")+cityName}</span>
      </span><ExternalLink className="size-4 text-brand"/>
     </a>)}
    </div>
    <p className="mt-3 text-xs text-muted-foreground">{t("Family-wide ideas are prioritized when your children's ages are saved. Actual eligibility, availability, price and safety always require direct confirmation.","نعطي الأولوية لأفكار تناسب أعمار كل الأولاد إذا كانت مسجّلة؛ لكن التوفر والأسعار والأمان تحتاج للتأكد مباشرة.")}</p>
   </section>

   <section className={panelCls} aria-label={t("Real mapped places","أماكن حقيقية على الخريطة")}>
    <div className="flex items-start gap-2"><MapPin className="mt-1 size-5 text-brand"/>
     <div><h2 className="text-lg font-bold">{t("Discover places on the map","اكتشف أماكن على الخريطة")}</h2>
      <p className="mt-1 text-xs text-muted-foreground">{t("Public OpenStreetMap records, not verified activity sessions. Search only after pressing the button.","معلومات خريطة عامة وليست جلسات أنشطة مؤكدة؛ البحث يبدأ فقط بضغط الزر.")}</p></div>
    </div>
    <div className="mt-3 flex flex-wrap items-end gap-2">
     <label className="text-sm font-semibold">{t("City","المدينة")}
      <select className={selectCls} value={city} onChange={e=>{setCityChoice(e.target.value as WeekendCity);setPlaces([]);setChecked(null);setSelected(null);setSavedPlan(null);}}>
       <option value="amman">{t("Amman","عمّان")}</option><option value="irbid">{t("Irbid","إربد")}</option>
       <option value="zarqa">{t("Zarqa","الزرقاء")}</option><option value="aqaba">{t("Aqaba","العقبة")}</option>
      </select>
     </label>
     <button type="button" onClick={discover} disabled={loading} className="min-h-11 rounded-xl bg-brand px-4 text-sm font-bold text-white disabled:opacity-60">
      {loading?t("Searching…","عم نبحث…"):t("Show mapped places","اعرض الأماكن")}
     </button>
    </div>
    {placeError&&<p role="status" className="mt-3 text-sm text-[#9B6346]">{placeError}</p>}
    {checked!==null&&<p className="mt-3 text-xs text-muted-foreground" role="status">{t("OSM contributors · checked ","مساهمو OSM · البحث ")}{new Date(checked).toLocaleString(ar?"ar-JO":"en-GB")}{stale?t(" · cached/stale"," · نتائج محفوظة وقديمة"):""}</p>}
    {places.length>0&&<div className="mt-3 grid gap-3 sm:grid-cols-2">{places.slice(0,10).map(place=>
     <article key={place.id} className="rounded-xl border border-[#DCE7DD] bg-[#FBFDFB] p-3">
      <p className="text-xs font-semibold text-brand">{place.category}</p>
      <h3 className="mt-1 text-sm font-bold">{place.name}</h3>
      <p className="mt-1 text-xs text-muted-foreground">{t("Age admission, opening times, instructors, accessibility and prices unverified.","العمر والمواعيد والمدرّبون وإمكانية الوصول والأسعار غير مؤكدة.")}</p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
       <a href={place.osmUrl} target="_blank" rel="noopener noreferrer" className="min-h-10 text-xs font-bold text-brand underline">{t("Map source","المصدر")}</a>
       <a href={weekendPlaceSearchUrl(place,city)} target="_blank" rel="noopener noreferrer" className="min-h-10 text-xs font-bold text-brand underline">{t("Check venue","تحقق من المكان")}</a>
       <button type="button" onClick={()=>choose(place)} className="ms-auto min-h-10 rounded-full border border-[#A8CCBA] px-3 text-xs font-bold text-brand">{t("Consider this place","فكّر بهذا المكان")}</button>
      </div>
     </article>
    )}</div>}
    {selected&&<form onSubmit={save} className="mt-4 space-y-3 rounded-xl border border-[#CAE2D3] bg-[#F1F9F0] p-4">
     <h3 className="font-bold">{t("Plan an idea: ","خطّط لفكرة: ")}{selected.name}</h3>
     <p className="text-xs text-muted-foreground">{t("Saving is not a booking or a paid expense. Date and full-family total are optional and entered by you.","الحفظ ليس حجزاً ولا مصروفاً مدفوعاً. التاريخ والتكلفة الإجمالية للعيلة اختياريان ومن إدخالك.")}</p>
     <div className="grid gap-3 sm:grid-cols-2">
      <label className="text-sm font-semibold">{t("Tentative date (optional)","موعد مقترح (اختياري)")}
       <input type="date" className={selectCls} value={date} onChange={e=>{setDate(e.target.value);setSavedPlan(null);}}/>
      </label>
      <label className="text-sm font-semibold">{t("Your estimated family total (JOD)","التكلفة الإجمالية المقدّرة (دينار)")}
       <input type="number" step=".01" min="0" max="100000" className={selectCls} value={estimate} onChange={e=>{setEstimate(e.target.value);setSavedPlan(null);}} placeholder={t("Optional","اختياري")}/>
      </label>
     </div>
     {saveError&&<p className="text-xs text-[#995C46]" role="alert">{saveError}</p>}
     <button type="submit" disabled={!ready} className="min-h-11 rounded-full bg-brand px-4 text-sm font-bold text-white disabled:opacity-50">{t("Save to Family Plans","احفظ في خطط العيلة")}</button>
     {savedPlan&&<div role="status" className="rounded-xl border border-[#BFDCC8] bg-white p-3">
       <p className="flex items-center gap-2 text-sm font-bold text-[#287454]"><CheckCircle2 className="size-4"/>{t("Plan available in your family space","الخطة متاحة في مساحة العيلة")}</p>
       <p className="mt-1 text-xs text-muted-foreground">{savedPlan.date?t("Tentative date: ","التاريخ المقترح: ")+savedPlan.date+". ":""}{t("No payment, bill or confirmed booking was created.","لم ننشئ دفعة أو فاتورة أو حجزاً مؤكداً.")}</p>
       <div className="mt-2 flex flex-wrap gap-4 text-sm font-semibold text-brand">
        <Link to="/plans" className="underline">{t("Review my plan","راجع خطتي")}</Link>
        {savedPlan.date&&<Link to="/calendar" className="underline">{t("See in Family Calendar","شوفها في تقويم العيلة")}</Link>}
       </div>
      </div>}
     {savedPlan&&savedPlan.budgetJod!==undefined&&<details className="rounded-xl border border-[#D1E2D7] bg-white p-3">
      <summary className="min-h-10 cursor-pointer text-sm font-bold text-brand"><Wallet className="me-1 inline size-4"/>{t("Optional: consider this estimate against my finances","اختياري: قارن المبلغ مع مالية العيلة")}</summary>
      <p className="mt-2 text-sm">{planReview?.reason}</p>
      <p className="mt-1 text-xs text-muted-foreground">{t("A budget comparison is not verified cash, admission, a purchase or proof of affordability.","مقارنة الميزانية ليست إثبات رصيد أو سعر أو شراء أو قدرة مؤكدة على الدفع.")}</p>
      <Link to="/money" className="mt-2 inline-flex min-h-10 items-center gap-1 text-sm font-bold text-brand underline">{t("Review financial details","راجع تفاصيل المالية")}<ArrowRight className="size-4"/></Link>
     </details>}
    </form>}
   </section>

   <details className={panelCls}>
    <summary className="flex min-h-11 cursor-pointer items-center gap-2 text-sm font-bold text-brand"><ShieldCheck className="size-4"/>{t("What should I verify with the provider?","شو لازم أتأكد من الجهة؟")}</summary>
    <p className="mt-2 text-sm">{t("Before enrolling, confirm actual dates, price including extras, class sizes, child supervision, emergency procedures, transport, accessible facilities and the right ages.","قبل التسجيل تأكد من المواعيد والأسعار الكاملة وحجم المجموعة والإشراف والطوارئ والمواصلات والمرافق المناسبة والعمر.")}</p>
    {prefsQuestions.length>0&&<p className="mt-2 text-sm font-semibold">{t("Your additional questions: ","أسئلتك الإضافية: ")}{prefsQuestions.join(" · ")}</p>}
    <p className="mt-2 text-xs text-muted-foreground">{t("Dabberna does not certify these details or pass your family's preferences to a club.","دبّرنا لا تؤكد هذه التفاصيل ولا ترسل تفضيلات عيلتك لأي نادٍ.")}</p>
    <Link to="/space" className="mt-2 inline-flex min-h-10 items-center text-sm font-semibold text-brand underline">{t("Edit private preferences","عدّل تفضيلاتك الخاصة")}</Link>
   </details>

   <details className={panelCls}>
    <summary className="flex min-h-11 cursor-pointer items-center gap-2 font-bold text-brand"><Wallet className="size-5"/>{t("Optional: Check an outing against my finances","اختياري: قارن الطلعة مع مالية العيلة")}</summary>
    <p className="mt-2 text-sm text-muted-foreground">{t("This is separate from browsing. A cautious assessment needs real balances and scheduled commitments, and may be incomplete.","هذه خطوة منفصلة عن الاستكشاف. التقييم الحذر يحتاج بيانات مالية حقيقية وقد يكون غير مكتمل.")}</p>
    <button type="button" onClick={onShowAffordability} className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-full bg-brand px-4 text-sm font-bold text-white">{t("Open the optional affordability review","افتح المراجعة المالية الاختيارية")}<ArrowRight className="size-4"/></button>
   </details>

   <p className="flex items-start gap-2 text-xs leading-relaxed text-muted-foreground"><ShieldCheck className="mt-0.5 size-4 shrink-0"/>{t("No personal child profiles, banking data or precise phone location are sent to map sources. No payments, club accounts or live reservations are offered here.","لا نرسل ملفات الأطفال أو البيانات البنكية أو موقع الهاتف الدقيق لمصادر الخرائط. لا توجد دفعات أو حسابات أندية أو حجوزات فورية هنا.")}</p>
  </main>
 </AppShell>;
}
