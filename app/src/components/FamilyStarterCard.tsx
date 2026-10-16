import {useState,type FormEvent} from "react";
import {Link} from "@tanstack/react-router";
import {ArrowRight,ShieldCheck} from "lucide-react";
import {useI18n} from "@/lib/i18n";
import {useLocalState} from "@/lib/storage";
import {sampleMoney,type MoneyState} from "@/lib/money";
import {needsStarterBudget,applyStarterBudget} from "@/lib/starterBudget";
import {defaultFamilyPreferences,type FamilyPreferences} from "@/lib/familyPreferences";
import {budgetAlignment} from "@/lib/financeAlignment";
import {budgetPlainResult} from "@/lib/budgetPlainResult";
import {computeMoney} from "@/lib/money";

/** One optional initial question: three approximate monthly figures and a city.
 * No bank connection, no profile names, birthdays, children or raw location.
 * Existing real finances and family records are not replaced. */
export function FamilyStarterCard(){
 const {lang}=useI18n(),ar=lang==="ar";
 const [money,setMoney,moneyReady]=useLocalState<MoneyState>("money",sampleMoney());
 const [prefs,setPrefs,prefsReady]=useLocalState<FamilyPreferences>("familyPreferences",defaultFamilyPreferences);
 const [opened,setOpened]=useState(false);
 const [income,setIncome]=useState(""),[expenses,setExpenses]=useState(""),[savings,setSavings]=useState("");
 const [city,setCity]=useState("");
 const [error,setError]=useState("");
 if(!moneyReady||!prefsReady)return null;
 const needs=needsStarterBudget(money);
 if(!needs){
  const summary=budgetPlainResult(budgetAlignment(money));
  return <section className="rounded-2xl border border-[#DDE8D9] bg-white p-4" aria-label={ar?"ملخص معلومات العائلة":"Your saved family picture"}>
   <p className="text-xs font-semibold text-brand">{ar?"من المعلومات اللي أدخلتها مرة واحدة":"FROM YOUR SAVED MONTHLY PLAN"}</p>
   <h2 className="mt-2 text-base font-semibold">{ar?summary.titleAr:summary.titleEn}</h2>
   <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{ar?summary.messageAr:summary.messageEn}</p>
   <p className="mt-2 text-xs text-muted-foreground">{ar?"هذه خطة تقريبية وليست رصيد بنك مؤكداً.":"A monthly planning picture, not verified bank cash."}</p>
   <Link to="/advisor" className="mt-3 inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-brand underline">
    {ar?"شو بتنصحني أعمل؟":"What should I do next?"}<ArrowRight className="size-4 rtl:rotate-180"/>
   </Link>
  </section>;
 }
 const existing=computeMoney(money);
 const entered=(s:string)=>s.trim()!==""&&/^\d{1,6}(?:\.\d{1,2})?$/.test(s)&&Number(s)<=100000?Number(s):null;
 const save=(event:FormEvent)=>{
  event.preventDefault();setError("");
  const initialIncome=money.demo?entered(income):existing.monthlyIncome;
  const initialExpenses=money.demo||money.categories.length===0?entered(expenses):existing.planned;
  const target=entered(savings);
  if(initialIncome===null||initialIncome<=0||initialExpenses===null||target===null){
   setError(ar?"أدخل الأرقام الثلاثة بالدينار وبمنزلتين عشريتين كحد أقصى.":"Enter valid JOD figures with at most two decimal places.");
   return;
  }
  if(money.demo&&!window.confirm(ar?
   "سنستبدل فقط الأرقام المالية التجريبية. مناسباتك وخططك وأفراد العائلة سيبقون كما هم. هل توافق؟":
   "Replace sample financial figures only? Family members, occasions and plans remain unchanged."))return;
  const next=applyStarterBudget(money,{income:initialIncome,spending:initialExpenses,savings:target});
  if(next===money){setError(ar?"لم نستطع حفظ الأرقام. راجع المالية.":"These amounts conflict with an existing real record. Review Money.");return;}
  setMoney(next);
  const cleanedCity=city.trim().slice(0,60);
  if(cleanedCity&&(!prefs.city||cleanedCity!==prefs.city))setPrefs(old=>({...old,city:cleanedCity}));
  setOpened(false);
 };
 return <section className="rounded-2xl border border-[#D9E6D8] bg-[#F3F8F0] p-4 sm:p-5"
  aria-label={ar?"ابدأ بصورة بسيطة عن العائلة":"Get started with a small family picture"}>
  <p className="text-xs font-semibold tracking-wide text-brand">{ar?"ابدأ ببساطة، ما في استمارات طويلة":"JUST THE ESSENTIALS"}</p>
  <h2 className="mt-2 text-lg font-semibold">{ar?"خلّيني ساعدك بدل ما تعبي بيانات":"A few details help me do more for you"}</h2>
  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{ar?
   "إذا بتحب نصائح مالية تناسب بيتك، احكِ لنا عن خطة الشهر تقريبياً. تقدر تكتشف الأنشطة والمشتريات بدون تعبئة شيء.":
   "A rough monthly picture lets Dabberna tailor money decisions. You can still explore outings and purchases without entering financial details."}</p>
  {!opened?<div className="mt-4 flex flex-wrap gap-3">
   <button type="button" onClick={()=>setOpened(true)}
    className="inline-flex min-h-11 items-center gap-2 rounded-full bg-brand px-5 text-sm font-semibold text-white">
    {ar?"أعطيك ٣ أرقام":"Add three numbers"}<ArrowRight className="size-4 rtl:rotate-180"/>
   </button>
   <Link to="/advisor" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-brand underline">
    {ar?"اسأل دبّرنا بدون إعداد":"Ask without setting up"}
   </Link>
  </div>:<form onSubmit={save} className="mt-4 space-y-3 rounded-xl bg-white p-4">
   <div className="grid gap-3 sm:grid-cols-2">
    <label className="text-xs font-semibold">{ar?"الدخل الشهري (د.أ)":"Monthly income (JOD)"}
     <input type="number" min=".01" max="100000" step=".01" required
      disabled={!money.demo&&!!money.incomeSources?.length} value={!money.demo&&!!money.incomeSources?.length?String(existing.monthlyIncome):income}
      onChange={e=>setIncome(e.target.value)} placeholder="1500"
      className="mt-1 min-h-11 w-full rounded-lg border border-input px-3 text-sm"/>
    </label>
    <label className="text-xs font-semibold">{ar?"مصاريف الشهر المتوقعة (د.أ)":"Expected monthly expenses (JOD)"}
     <input type="number" min="0" max="100000" step=".01" required
      disabled={!money.demo&&money.categories.length>0}
      value={!money.demo&&money.categories.length>0?String(existing.planned):expenses}
      onChange={e=>setExpenses(e.target.value)} placeholder="1100"
      className="mt-1 min-h-11 w-full rounded-lg border border-input px-3 text-sm"/>
    </label>
    <label className="text-xs font-semibold">{ar?"هدف الادخار (د.أ)":"Savings goal (JOD)"}
     <input type="number" min="0" max="100000" step=".01" required
      value={savings} onChange={e=>setSavings(e.target.value)} placeholder="200"
      className="mt-1 min-h-11 w-full rounded-lg border border-input px-3 text-sm"/>
    </label>
    <label className="text-xs font-semibold">{ar?"المدينة (اختياري)":"City (optional)"}
     <input maxLength={60} value={city} onChange={e=>setCity(e.target.value)}
      placeholder={prefs.city||"Amman"} className="mt-1 min-h-11 w-full rounded-lg border border-input px-3 text-sm"/>
    </label>
   </div>
   {error&&<p role="alert" className="text-xs font-semibold text-destructive">{error}</p>}
   <button type="submit" className="min-h-11 w-full rounded-xl bg-brand px-4 text-sm font-semibold text-white">
    {ar?"فرجيني نتيجة خطة الشهر":"Show my first useful result"}
   </button>
   <button type="button" className="min-h-10 text-sm text-brand underline" onClick={()=>setOpened(false)}>
    {ar?"مش هلق":"Not now"}
   </button>
  </form>}
  <p className="mt-3 flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
   <ShieldCheck className="mt-0.5 size-4 shrink-0"/>
   {ar?"الأرقام تبقى بهذا المتصفح. ما في تحقق بنكي ولا مشاركة آلية للبيانات.":
    "This stays on your device. No bank verification or automatic sharing."}
  </p>
 </section>;
}
