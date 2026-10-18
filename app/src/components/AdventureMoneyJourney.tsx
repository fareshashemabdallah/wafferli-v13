import {useState} from "react";
import {ArrowRight,Check,ChevronRight,CircleHelp,Coins,Compass,CalendarClock,Wallet,ShoppingBasket,ShieldCheck} from "lucide-react";
import {Link} from "@tanstack/react-router";
import {fmtJOD,useLocalState} from "@/lib/storage";
import {useI18n} from "@/lib/i18n";
import {computeMoney,sampleMembers,type Member,type MoneyState} from "@/lib/money";
import {HOUSEHOLD_PRESENCE_KEY,emptyHouseholdPresence,type HouseholdPresence} from "@/lib/householdPresence";
import {realFamilyMembers} from "@/lib/familySetup";
import {getMoneyOverview} from "@/lib/moneyOverview";
import {assessFinancialReality} from "@/lib/financialReality";
import {QuickMoneySetup} from "./QuickMoneySetup";
import {RobotBuddy,WorldScene} from "./AdventureArtwork";

type Props={money:MoneyState;setMoney:(fn:(s:MoneyState)=>MoneyState)=>void;
 onBudget:()=>void;onSpending:()=>void;onBills:()=>void;onInsights:()=>void;setupNeeded:boolean};
const card="rounded-[1.2rem] border border-[#DFE9DD] bg-white p-3 shadow-[0_12px_28px_-25px_rgba(36,71,54,.25)]";

export function AdventureMoneyJourney({money,setMoney,onBudget,onSpending,onBills,onInsights,setupNeeded}:Props){
 const {lang}=useI18n(),ar=lang==="ar",t=(en:string,a:string)=>ar?a:en;
 const [members]=useLocalState<Member[]>("members",sampleMembers());
 const [presence]=useLocalState<HouseholdPresence>(HOUSEHOLD_PRESENCE_KEY,emptyHouseholdPresence());
 const [costExplored,setCostExplored]=useLocalState("adventureCostExplored",false);
 const [setupOpen,setSetupOpen]=useState(false);
 const people=realFamilyMembers(members);
 const enteredPeople=(presence.adults!==null&&presence.children!==null)||(people.length>0);
 const figures=computeMoney(money),summary=getMoneyOverview(money);
 const reality=money.demo?null:assessFinancialReality(money);
 const confirmedPlan=!money.demo&&money.categories.some(c=>c.planned>0);
 const tracked=!money.demo&&money.expenses.some(e=>e.status!=="planned");
 const progress=[enteredPeople,costExplored,confirmedPlan,tracked].filter(Boolean).length;
 const goCost=()=>{setCostExplored(true);if(setupNeeded)setSetupOpen(true);else onBudget();};
 const goPlan=()=>{if(setupNeeded)setSetupOpen(true);else onBudget();};
 const highlights=[
  {key:"income",label:t("Income","الدخل"),value:money.demo?t("Not entered","غير مدخل"):(!money.incomeKnown&&figures.monthlyIncome===0?t("Not entered","غير مدخل"):fmtJOD(figures.monthlyIncome)),icon:<Coins className="size-5 text-[#2C9D74]"/>,bg:"#DDF5E7"},
  {key:"plan",label:t("Your Plan","خطة العيلة"),value:money.demo?t("Not entered","غير مدخل"):fmtJOD(figures.planned),icon:<CalendarClock className="size-5 text-[#D18F43]"/>,bg:"#FFF0D5"},
  {key:"spent",label:t("Spent So Far","المدفوع المسجّل"),value:money.demo?t("Not entered","غير مدخل"):fmtJOD(figures.spent),icon:<Wallet className="size-5 text-[#C87768]"/>,bg:"#FFE6DF"},
  {key:"bills",label:t("Upcoming Bills","فواتير قادمة"),value:money.demo?t("Not entered","غير مدخل"):summary.hasBillSchedule?fmtJOD(summary.forecast.upcomingBills):t("Not entered","غير مدخل"),icon:<CalendarClock className="size-5 text-[#9C75B6]"/>,bg:"#F2E8FA"}
 ];
 const steps=[
  {key:"household",en:"Meet your household",ar:"تعرّف على عيلتك",hintEn:enteredPeople?`${people.length||((presence.adults??0)+(presence.children??0))} family members known`:"Adults, children, helpers & visitors",hintAr:enteredPeople?"أفراد البيت معروفون":"بالغون وأطفال ومساعدون وضيوف",complete:enteredPeople,action:goCost},
  {key:"costs",en:"Discover cost of living",ar:"اكتشف تكلفة المعيشة",hintEn:"See an illustrative household reference",hintAr:"شوف المرجع التوضيحي لبيتك",complete:costExplored,action:goCost},
  {key:"plan",en:"Build your own plan",ar:"ابنِ خطة بيتك",hintEn:"Make a plan that reflects your life",hintAr:"خطة بتناسب حياتك",complete:confirmedPlan,action:goPlan},
  {key:"track",en:"Track & learn",ar:"تابع وتعلّم",hintEn:"Learn from actual recorded spending",hintAr:"تعلّم من المصاريف المسجّلة",complete:tracked,action:onSpending}
 ];
 return <div className="mx-auto max-w-[900px] space-y-4 text-[#193D39]" data-adventure-money>
  <section className="relative isolate overflow-hidden rounded-[1.75rem] border border-[#CFE8DD] bg-[linear-gradient(160deg,#B6E6F6_0%,#D3F0EC_50%,#F9EBCB_100%)]" aria-label={t("Money adventure welcome","مغامرة المالية")}>
   <WorldScene place="home" className="absolute inset-0 size-full object-cover opacity-80"/>
   <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#F8EED8] to-transparent"/>
   <div className="relative flex min-h-[185px] items-start justify-between gap-2 p-5 sm:min-h-[226px] sm:p-7">
    <div className="z-10 max-w-[62%] rounded-[1.25rem] border border-white/95 bg-white/95 p-4 shadow-lg sm:max-w-[55%]">
     <p className="text-[11px] font-extrabold tracking-widest text-[#2E9D75]">{t("OUR MONEY ADVENTURE","مغامرة مال العيلة")}</p>
     <h2 className="mt-1 text-lg font-black leading-tight sm:text-2xl">{t("Let's explore your household costs together!","يلا نكتشف مصاريف البيت سوا!")}</h2>
     <p className="mt-2 text-xs leading-relaxed text-[#64766B]">{t("Your guide helps you understand, not compete.","دليلك للفهم، مش للمنافسة.")}</p>
    </div>
    <RobotBuddy className="absolute bottom-[-8px] end-1 z-10 h-36 w-36 sm:end-8 sm:h-44 sm:w-44"/>
   </div>
  </section>

  {reality&&<p className="rounded-xl border border-[#E3E9DD] bg-[#F6F9F2] p-3 text-sm leading-relaxed">
   <strong className="me-1">{ar?reality.titleAr:reality.titleEn}.</strong>{ar?reality.messageAr:reality.messageEn}
  </p>}

  <section className={card} aria-label={t("Your monthly picture","صورة الشهر")}>
   <h2 className="mb-3 text-lg font-black">{t("Your Monthly Picture","صورة الشهر")}</h2>
   <div className="grid grid-cols-2 gap-2">
    {highlights.map(h=><div key={h.key} style={{background:h.bg}} className="min-w-0 rounded-[1.15rem] p-3 sm:p-4">
     {h.icon}<p className="mt-2 text-xs font-semibold text-[#42645B]">{h.label}</p>
     <p className="mt-1 break-words text-base font-black tabular-nums sm:text-xl">{h.value}</p>
    </div>)}
   </div>
   <p className="mt-3 text-[11px] leading-relaxed text-[#72847A]">{t(
    "Plan, recorded spending and future bills can overlap. These are not additive amounts or confirmed spendable cash.",
    "الميزانية والمدفوع والفواتير القادمة ممكن تتداخل؛ ما منجمعها مع بعض ولا منعتبرها رصيداً متاحاً.")}</p>
  </section>

  <section className={card} aria-label={t("Family exploration steps","مراحل الاستكشاف")}>
   <div className="flex items-center justify-between gap-2">
    <h2 className="flex items-center gap-2 text-lg font-black"><Compass className="size-5 text-[#368B71]"/>{t("Your Journey","رحلتك")}</h2>
    <span className="text-xs font-bold text-[#678078]">{progress} / 4 {t("explored","مستكشفة")}</span>
   </div>
   <div role="progressbar" aria-label={t("Steps explored","الخطوات المستكشفة")} aria-valuenow={progress} aria-valuemin={0} aria-valuemax={4}
    className="mt-3 h-2 overflow-hidden rounded-full bg-[#E8E9DF]">
    <div style={{width:(progress/4*100)+"%"}} className="h-full rounded-full bg-[#41A480] transition-all duration-300"/>
   </div>
   <div className="mt-3 space-y-2">
    {steps.map((step,i)=><button key={step.key} type="button" onClick={step.action}
     className="flex min-h-[64px] w-full items-center gap-3 rounded-xl border border-[#E7E9DD] bg-[#FDFBF6] px-3 py-2 text-start transition hover:border-[#8BCEB1] active:scale-[.99]">
     <span className={"grid size-9 shrink-0 place-items-center rounded-full text-sm font-black "+(step.complete?"bg-[#2BA674] text-white":"border-2 border-[#BAC8BD] bg-white text-[#668478]")}>
      {step.complete?<Check className="size-5"/>:i+1}
     </span>
     <span className="min-w-0 flex-1"><strong className="block text-sm">{ar?step.ar:step.en}</strong>
      <span className="mt-0.5 block text-xs leading-snug text-[#708179]">{ar?step.hintAr:step.hintEn}</span>
     </span>
     <ChevronRight className="size-4 shrink-0 text-[#438977] rtl:rotate-180"/>
    </button>)}
   </div>
   <button type="button" onClick={setupNeeded?()=>setSetupOpen(true):goPlan}
    className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#188B6A] px-4 text-sm font-extrabold text-white shadow-[0_5px_0_#12694F] active:translate-y-1 active:shadow-none">
    {setupNeeded?t("Start my family plan","ابدأ خطة عيلتي"):t("Continue the journey","كمّل المغامرة")}<ArrowRight className="size-4 rtl:rotate-180"/>
   </button>
   <p className="mt-3 text-[11px] leading-relaxed text-[#708179]">{t("Progress celebrates exploring and recording, never spending less or earning more.","التقدّم للاستكشاف والتسجيل، مش للراتب ولا للتوفير.")}</p>
  </section>

  {setupNeeded&&setupOpen&&<section className={card} aria-label={t("Start your family plan","ابدأ خطة العيلة")}>
   <button type="button" onClick={()=>setSetupOpen(false)} className="mb-3 min-h-9 text-sm font-semibold text-[#38765F] underline">{t("Close setup","إخفاء الإعداد")}</button>
   <QuickMoneySetup money={money} setMoney={setMoney}/>
  </section>}
  {!setupNeeded&&<div className="grid grid-cols-2 gap-2">
   <button type="button" onClick={onSpending} className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-[#D6E7DA] bg-white px-3 text-sm font-bold"><Wallet className="size-4 text-[#3C936D]"/>{t("Record spending","سجّل مصروف")}</button>
   <button type="button" onClick={onBills} className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-[#D6E7DA] bg-white px-3 text-sm font-bold"><CalendarClock className="size-4 text-[#AB7C4E]"/>{t("Review bills","راجع الفواتير")}</button>
  </div>}
  <button type="button" onClick={onInsights} className="flex min-h-10 w-full items-center justify-center gap-2 text-xs font-bold text-[#4E826B] underline">{t("Detailed financial insights (optional)","التحليلات المالية التفصيلية (اختياري)")} <CircleHelp className="size-4"/></button>
  <div className="flex gap-2 text-[11px] leading-relaxed text-[#73857D]"><ShieldCheck className="mt-0.5 size-4 shrink-0"/>{t(
   "Your figures remain on this device during the pilot. References in detailed categories are illustrative, not verified Amman market averages.",
   "الأرقام محفوظة على الجهاز خلال التجربة؛ الأرقام المرجعية التوضيحية مش متوسط أسعار سوق مؤكدة بعمّان.")}</div>
 </div>;
}
