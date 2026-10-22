import {Link,useNavigate} from "@tanstack/react-router";
import {ArrowRight,CalendarDays,ChevronRight,Gift,Heart,Info,ShieldCheck,Wallet} from "lucide-react";
import {useI18n} from "@/lib/i18n";
import {useLocalState,writeLocal,fmtJOD} from "@/lib/storage";
import {sampleMoney,sampleMembers,type MoneyState,type Member} from "@/lib/money";
import {FAMILY_PLANS_KEY,ACTIVE_PLAN_KEY,type FamilyPlan} from "@/lib/familyPlans";
import type {FamilyMoment} from "@/lib/familyCalendar";
import {defaultFamilyPreferences,type FamilyPreferences} from "@/lib/familyPreferences";
import {buildTodayActionPolicy,type TodayAction,type TodayWeekItem} from "@/lib/todayActionPolicy";
import {TodayQuickActions} from "./TodayQuickActions";
import {RobotBuddy} from "./AdventureArtwork";

const panel="rounded-[1.5rem] border border-[#DFE8DE] bg-white/95 p-4 shadow-[0_12px_30px_-27px_rgba(44,71,55,.25)] sm:p-5";
/** Today is one contextual briefing, not a second Money or Family editor.
 * No historical local preferences or records are changed by opening it.
 */
export function AdventureFamilyHome(){
 const navigate=useNavigate();
 const {lang}=useI18n(),ar=lang==="ar";
 const t=(en:string,arabic:string)=>ar?arabic:en;
 const [money,,moneyReady]=useLocalState<MoneyState>("money",sampleMoney());
 const [members,,membersReady]=useLocalState<Member[]>("members",sampleMembers());
 const [moments,,momentsReady]=useLocalState<FamilyMoment[]>("familyCalendar",[]);
 const [plans,,plansReady]=useLocalState<FamilyPlan[]>(FAMILY_PLANS_KEY,[]);
 const [prefs,,prefsReady]=useLocalState<FamilyPreferences>("familyPreferences",defaultFamilyPreferences);
 const ready=moneyReady&&membersReady&&momentsReady&&plansReady&&prefsReady;
 const brief=ready?buildTodayActionPolicy({money,members,moments,plans,preferences:prefs}):null;
 const current=brief?.action;
 const tr=(en:string,arabic:string)=>ar?arabic:en;
 function continueAction(action:TodayAction|TodayWeekItem){
  if(action.planId)writeLocal(ACTIVE_PLAN_KEY,action.planId);
  if(action.occasionKey)writeLocal("focusedOccasionKey",action.occasionKey);
 }
 const actionLabel=(a:TodayAction)=>t(a.actionEn,a.actionAr);
 const makeWeekLink=(item:TodayWeekItem)=><Link key={item.id} to={item.route} onClick={()=>continueAction(item)}
  className="flex min-h-12 items-center gap-2 rounded-xl border border-[#E9EDE7] bg-white px-3 py-2 text-sm text-[#385448] hover:border-[#A9D4B9] focus-visible:ring-2 focus-visible:ring-[#2F8F69]">
  <CalendarDays className="size-4 shrink-0 text-[#61947A]"/>
  <span className="min-w-0 flex-1 truncate">{item.title}</span>
  <span className="shrink-0 text-[11px] text-[#687F74]">{item.date}</span>
  <ChevronRight className="size-4 shrink-0 rtl:rotate-180"/>
 </Link>;
 return <div className="mx-auto max-w-[930px] space-y-3 pb-5 text-[#263E36]" data-adventure-home>
  <header className="relative isolate overflow-hidden rounded-[1.7rem] border border-[#D7E8D9] bg-[linear-gradient(120deg,#FAFBF2_5%,#E6F5E8_60%,#FFEFE4_100%)] p-4 sm:p-6" aria-label={t("Dabberna family greeting","ترحيب دبّرنا بالعائلة")}>
   <div className="relative z-10 max-w-[58%] pb-2 sm:max-w-[65%]">
    <p className="text-xs font-semibold text-[#4F8270]">{t("Welcome to Dabberna","أهلاً في دبّرنا")}</p>
    <h1 className="mt-1 text-[clamp(1.45rem,5vw,2.4rem)] font-black leading-tight text-[#234E3D]">
     {t("Today, with your family","اليوم مع العيلة")}
    </h1>
    <p className="mt-2 text-xs leading-relaxed text-[#5B7867] sm:text-sm">
     {t("One clear next step. More time for what matters.","خطوة واحدة واضحة، ووقت أكتر للي بهم العيلة.")}
    </p>
   </div>
   <img src={import.meta.env.BASE_URL+"landing-family-characters.avif"}
    alt={t("Illustrated family together","رسم عائلة معاً")}
    className="pointer-events-none absolute bottom-[-4px] end-0 z-0 h-[145px] w-[49%] object-contain object-bottom sm:h-[195px]" loading="eager"/>
  </header>

  <section className={panel} aria-label={t("Family briefing","ملخص العيلة")}>
   <div className="flex items-start gap-3">
    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#E6F2E6] text-[#3B815D]">
     <Heart className="size-5" aria-hidden="true"/></span>
    <div className="min-w-0 flex-1">
     <h2 className="text-base font-extrabold">{t("How your family is doing","كيف أمور العيلة؟")}</h2>
     <p className="mt-1 text-sm leading-relaxed text-[#60766A]">
      {!ready?t("Reading your saved family information…","عم نراجع معلومات العيلة المحفوظة…"):
       brief?.moneyStatus==="risk"?
       t("Your entered figures suggest a financial issue to review. This is not a verified bank assessment.",
        "الأرقام اللي أدخلتها بتشير لموضوع مالي بحاجة لمراجعة، مش تقييم بنكي مؤكّد."):
       current?t("One saved family matter could use your attention. Everything else can wait.",
        "في شغلة محفوظة بتستاهل انتباهك، والباقي فيك تتركه لوقت تاني."):
       t("Nothing in your saved records needs urgent action. Enjoy your day.",
        "ما في شي عاجل ضمن المعلومات المحفوظة. استمتعوا بيومكم.")}
     </p>
    </div>
   </div>
  </section>

  {current?<section className="overflow-hidden rounded-[1.7rem] border border-[#F0DAE5] bg-[linear-gradient(135deg,#FFF9FA,#FCEEF3_62%,#FFF5E9)] p-4 shadow-[0_18px_35px_-30px_rgba(146,63,97,.3)] sm:p-6"
    aria-label={t("One next action","الخطوة القادمة")} data-testid="today-one-action">
   <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wide text-[#B2467F]">
    {current.kind==="gift"||current.kind==="occasion"?<Gift className="size-4"/>:
     current.kind==="financial"||current.kind==="bill"?<Wallet className="size-4"/>:<Heart className="size-4"/>}
    {t("One next action","خطوة واحدة مهمة")}
   </div>
   <h2 className="mt-3 text-base font-semibold text-[#564256]">{ar?current.titleAr:current.titleEn}</h2>
   <p className="mt-1 text-lg font-black leading-snug text-[#263D37] sm:text-xl">
    {current.kind==="gift"?t("Choose the right gift option","اختار أنسب خيار للهدية"):
     current.kind==="bill"?t("Check the recorded payment","راجع الدفعة المسجّلة"):
     current.kind==="financial"?t("Review your family's money picture","راجع الوضع المالي للعيلة"):
     current.kind==="occasion"?t("Prepare this family moment","حضّر هالمناسبة"):
     t("Continue your family plan","كمل خطة العيلة")}
   </p>
   <p className="mt-2 max-w-[680px] text-sm leading-relaxed text-[#665D62]">
    {ar?current.detailAr:current.detailEn}
   </p>
   {current.kind==="gift"&&<div className="mt-3 flex flex-wrap gap-2 text-xs">
    <span className="rounded-full border border-[#EDD8E1] bg-white/75 px-3 py-1.5">
     {t("Planned gift: ","الهدية المخططة: ")}
     {fmtJOD(current.giftEstimateJod??0)}
    </span>
    <span className="rounded-full border border-[#EDD8E1] bg-white/75 px-3 py-1.5">
     {current.sellerCount?t("Seller option saved","خيار متجر محفوظ"):t("No seller selected yet","ما تم اختيار متجر بعد")}
    </span>
    <span className="rounded-full border border-[#EDD8E1] bg-white/75 px-3 py-1.5">
     {t("Not recorded as paid","لم تُسجل كدفعة")}
    </span>
   </div>}
   <div className="mt-4 flex flex-wrap items-center gap-2">
    <Link to={current.route} onClick={()=>continueAction(current)}
     className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[linear-gradient(100deg,#D96E7C,#C84381)] px-5 text-sm font-bold text-white shadow-sm transition hover:brightness-95 focus-visible:ring-2 focus-visible:ring-[#B64680]">
     {actionLabel(current)}<ArrowRight className="size-4 rtl:rotate-180"/>
    </Link>
    <Link to="/advisor" className="inline-flex min-h-12 items-center gap-2 rounded-full border border-[#E9D4E2] bg-white/80 px-4 text-sm font-semibold text-[#895778]">
     {t("Ask Dabberna","اسأل دبّرنا")}
    </Link>
   </div>
   <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-[#EADBE1] pt-3 text-xs text-[#745E6D]">
    <Info className="size-4 shrink-0"/><strong>{t("Why now?","ليش هلّق؟")}</strong>
    <span>{ar?current.whyAr:current.whyEn}</span>
    {current.date&&<span className="rounded-full bg-white/80 px-2 py-1">{current.date}</span>}
   </div>
  </section>:ready?<section className={panel} aria-label={t("No urgent next action","لا توجد خطوة عاجلة")}>
    <div className="flex items-center gap-3">
     <Heart className="size-6 shrink-0 text-[#509677]"/>
     <div><h2 className="font-extrabold">{t("You're free to enjoy your day","خدوا راحتكم اليوم")}</h2>
      <p className="mt-1 text-sm text-[#677A72]">{t("No need to manufacture a task. Add something only when it matters.",
       "مش ضروري نختلق مهمة. أضف شي بس وقت يكون مهم.")}</p></div>
    </div>
   </section>:null}

  <div className="grid gap-3 md:grid-cols-2">
   <section className={panel} aria-label={t("This week","هذا الأسبوع")}>
    <div className="flex items-center justify-between gap-2">
     <h2 className="flex items-center gap-2 text-sm font-extrabold"><CalendarDays className="size-4 text-[#4F956E]"/>{t("This week","هذا الأسبوع")}</h2>
     <Link to="/family" className="text-xs font-semibold text-[#497E66] underline">{t("See family","شوف العيلة")}</Link>
    </div>
    {brief?.week.length?<div className="mt-3 space-y-2">{brief.week.map(makeWeekLink)}</div>:
     <p className="mt-2 text-xs leading-relaxed text-[#738378]">
      {t("No other scheduled items found in the next seven days. This only reflects saved records.",
       "ما في مواعيد أخرى مسجلة خلال سبعة أيام. هذا حسب البيانات المحفوظة فقط.")}
     </p>}
   </section>
   <section className={panel} aria-label={t("Money at a glance","لمحة عن المال")}>
    <div className="flex items-center justify-between gap-2">
     <h2 className="flex items-center gap-2 text-sm font-extrabold"><Wallet className="size-4 text-[#4F956E]"/>{t("Money at a glance","لمحة عن المال")}</h2>
    </div>
    <div className="mt-3 grid grid-cols-2 gap-2">
     <div className="rounded-xl bg-[#F4F9F2] p-3">
      <p className="text-xs text-[#63776A]">{t("Recorded bills: next 7 days","الفواتير المسجّلة: ٧ أيام")}</p>
      <strong className="mt-1 block text-lg text-[#307855]">{ready?fmtJOD(brief?.upcomingBillsJod??0):t("Loading","جار التحميل")}</strong>
     </div>
     <div className="rounded-xl bg-[#FFF5F7] p-3">
      <p className="text-xs text-[#866874]">{t("Actual recorded spending this month","المصاريف المدفوعة المسجّلة للشهر")}</p>
      <strong className="mt-1 block text-lg text-[#B34D7C]">{ready?fmtJOD(brief?.monthPaidJod??0):t("Loading","جار التحميل")}</strong>
     </div>
    </div>
    <p className="mt-3 flex gap-2 text-xs leading-relaxed text-[#758378]">
     <ShieldCheck className="mt-0.5 size-4 shrink-0"/>
     {money.demo?t("Sample Money amounts are examples only, not your actual family finances.","المبالغ المعروضة تجريبية وليست مالية عيلتك الحقيقية."):
      brief?.moneyStatus==="partial"?t("Your information is partial. Neither estimates nor planned costs prove money is available.",
       "معلومات المال جزئية. التقديرات والخطط لا تثبت توفر المبلغ."):
      t("Amounts come from your entries, not a bank. Planned costs do not count as paid until confirmed.",
       "الأرقام من إدخالاتك، مش من البنك. التكاليف المخططة مش مدفوعة إلا بعد تأكيدها.")}
    </p>
    <Link to="/money" className="mt-2 inline-flex min-h-10 items-center gap-1 text-xs font-bold text-[#417E60] underline">
     {t("Review Money","راجع المالية")}<ArrowRight className="size-4 rtl:rotate-180"/>
    </Link>
   </section>
  </div>

  <TodayQuickActions onAsk={()=>navigate({to:"/advisor"})}/>
  <p className="px-2 text-[11px] leading-relaxed text-[#789086]">
   {t("Your family records stay on this device during the pilot. Today only reads existing information; it never creates a purchase, payment or bank transaction.",
    "سجلات العيلة محفوظة على هالجهاز خلال التجربة. اليوم يعرض معلومات موجودة فقط؛ ما بينشئ شراء أو دفع أو عملية بنكية.")}
  </p>
 </div>;
}
