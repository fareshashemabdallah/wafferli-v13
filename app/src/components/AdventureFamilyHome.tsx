import {Link,useNavigate} from "@tanstack/react-router";
import {ArrowRight,CalendarDays,ChevronRight,Gift,Heart,ShieldCheck,Wallet} from "lucide-react";
import {useI18n} from "@/lib/i18n";
import {useLocalState,writeLocal,fmtJOD} from "@/lib/storage";
import {sampleMoney,sampleMembers,type MoneyState,type Member} from "@/lib/money";
import {FAMILY_PLANS_KEY,ACTIVE_PLAN_KEY,type FamilyPlan} from "@/lib/familyPlans";
import type {FamilyMoment} from "@/lib/familyCalendar";
import {defaultFamilyPreferences,type FamilyPreferences} from "@/lib/familyPreferences";
import {buildTodayActionPolicy,type TodayAction,type TodayWeekItem} from "@/lib/todayActionPolicy";
import {TodayQuickActions} from "./TodayQuickActions";
import {WeeklyPlay} from "./WeeklyPlay";
import {FAMILY_HERO_LAYOUT,FAMILY_HERO_TEXT,FamilyHeroIllustration} from "./FamilyHeroIllustration";
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
  <header className={FAMILY_HERO_LAYOUT+" border-[#D7E8D9] bg-[linear-gradient(120deg,#FAFBF2_5%,#E6F5E8_60%,#FFEFE4_100%)]"} aria-label={t("Dabberna family greeting","ترحيب دبّرنا بالعائلة")}>
   <div className={FAMILY_HERO_TEXT}>
    <div className="mb-1 flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-[#42826A]"><RobotBuddy className="size-9 shrink-0" label={t("Dabberna friendly guide","روبوت دبّرنا الودود")}/><span>{t("Your family today","عيلتك اليوم")}</span></div>
    <h1 className="text-[clamp(1.15rem,4vw,2.2rem)] font-black leading-tight text-[#234E3D]">
     {t("A little easier, together","كل يوم أسهل، سوا")}
    </h1>
   </div>
   <FamilyHeroIllustration alt={t("Illustrated family together","رسم عائلة معاً")}/>
  </header>

  {ready&&(!current||brief?.moneyStatus==="risk")&&
   <section className={panel} aria-label={t("Family briefing","ملخص العيلة")}>
    <div className="flex items-center gap-3">
     <Heart className="size-5 shrink-0 text-[#3B815D]" aria-hidden="true"/>
     <p className="text-sm font-semibold text-[#3C6050]">
      {brief?.moneyStatus==="risk"
       ?t("Your saved money figures need a review. They are not bank-verified.","أرقام المال المسجّلة بحاجة لمراجعة، وهي ليست رصيداً بنكياً مؤكداً.")
       :t("Nothing urgent in your saved family records.","ما في شي مستعجل حسب سجلات العيلة المحفوظة.")}
     </p>
    </div>
   </section>}

  {current&&<section className="overflow-hidden rounded-[1.7rem] border border-[#F0DAE5] bg-[linear-gradient(135deg,#FFF9FA,#FCEEF3_62%,#FFF5E9)] p-4 shadow-[0_18px_35px_-30px_rgba(146,63,97,.3)] sm:p-6"
    aria-label={t("One next action","الخطوة القادمة")} data-testid="today-one-action">
   <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wide text-[#B2467F]">
    {current.kind==="gift"||current.kind==="occasion"?<Gift className="size-4"/>:
     current.kind==="financial"||current.kind==="bill"?<Wallet className="size-4"/>:<Heart className="size-4"/>}
    {t("Next for your family","الخطوة الجاية للعيلة")}
   </div>
   <h2 className="mt-3 text-base font-semibold text-[#564256]">{ar?current.titleAr:current.titleEn}</h2>
   <p className="mt-1 text-lg font-black leading-snug text-[#263D37] sm:text-xl">
    {current.kind==="gift"?t("Choose a gift","اختار هدية"):
     current.kind==="bill"?t("Check this payment","راجع الدفعة"):
     current.kind==="financial"?t("Review your family's money picture","راجع الوضع المالي للعيلة"):
     current.kind==="occasion"?t("Get ready together","حضّروا سوا"):
     t("Continue your plan","كمل خطتك")}
   </p>
   {current.kind==="gift"&&<p className="mt-3 text-xs font-medium text-[#725B67]">
    {t("Planned gift: ","هدية مخططة: ")}{fmtJOD(current.giftEstimateJod??0)}
    {" · "}{t("Not paid","غير مدفوعة")}
   </p>}
   <Link to={current.route} onClick={()=>continueAction(current)}
    className="mt-4 inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[linear-gradient(100deg,#D96E7C,#C84381)] px-5 text-sm font-bold text-white shadow-sm transition hover:brightness-95 focus-visible:ring-2 focus-visible:ring-[#B64680]">
    {actionLabel(current)}<ArrowRight className="size-4 rtl:rotate-180"/>
   </Link>
   <details className="mt-3 border-t border-[#EADBE1] pt-3 text-xs text-[#745E6D]">
    <summary className="min-h-10 cursor-pointer font-semibold">{t("Why this step?","ليش هالخطوة؟")}</summary>
    <p className="mt-1 leading-relaxed">{ar?current.detailAr:current.detailEn}</p>
    <p className="mt-1 leading-relaxed">{ar?current.whyAr:current.whyEn}{current.date?" · "+current.date:""}</p>
    {current.kind==="gift"&&<p className="mt-1">{current.sellerCount?t("Seller option saved","خيار متجر محفوظ"):t("No seller chosen","ما اخترت متجر بعد")}</p>}
   </details>
  </section>}

  <div className="grid gap-3 md:grid-cols-2">
   <section className={panel} aria-label={t("This week","هذا الأسبوع")}>
    <div className="flex items-center justify-between gap-2">
     <h2 className="flex items-center gap-2 text-sm font-extrabold"><CalendarDays className="size-4 text-[#4F956E]"/>{t("This week","هذا الأسبوع")}</h2>
     <Link to="/family" className="text-xs font-semibold text-[#497E66] underline">{t("See family","شوف العيلة")}</Link>
    </div>
    {brief?.week.length?<div className="mt-3 space-y-2">{brief.week.map(makeWeekLink)}</div>:
     <p className="mt-2 text-xs leading-relaxed text-[#738378]">
      {t("No saved dates this week.","ما في مواعيد مسجّلة هالأسبوع.")}
     </p>}
   </section>
   <section className={panel} aria-label={t("Money at a glance","لمحة عن المال")}>
    <div className="flex items-center justify-between gap-2">
     <h2 className="flex items-center gap-2 text-sm font-extrabold"><Wallet className="size-4 text-[#4F956E]"/>{t("Money at a glance","لمحة عن المال")}</h2>
    </div>
    <div className="mt-3 grid grid-cols-2 gap-2">
     <div className="rounded-xl bg-[#F4F9F2] p-3">
      <p className="text-xs text-[#63776A]">{t("Bills · next 7 days","فواتير · ٧ أيام")}</p>
      <strong className="mt-1 block text-lg text-[#307855]">{ready?fmtJOD(brief?.upcomingBillsJod??0):t("Loading","جار التحميل")}</strong>
     </div>
     <div className="rounded-xl bg-[#FFF5F7] p-3">
      <p className="text-xs text-[#866874]">{t("Paid · this month","المدفوع · هالشهر")}</p>
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

  {membersReady&&<WeeklyPlay members={members}/>}
  <TodayQuickActions onAsk={()=>navigate({to:"/advisor"})}/>
  <p className="px-2 text-[11px] leading-relaxed text-[#789086]">
   {t("Pilot: records stay on this device. Today never creates payments.","تجربة خاصة: السجلات على هالجهاز واليوم لا ينشئ دفعات.")}
  </p>
 </div>;
}
