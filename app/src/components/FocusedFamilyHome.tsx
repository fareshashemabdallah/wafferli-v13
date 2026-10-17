import {useEffect,useRef,useState,type FormEvent} from "react";
import {Link} from "@tanstack/react-router";
import {ArrowRight,CalendarDays,Heart,Send,ShieldCheck,Wallet} from "lucide-react";
import {useI18n} from "@/lib/i18n";
import {useLocalState,fmtJOD} from "@/lib/storage";
import {sampleMoney,sampleMembers,computeMoney,type MoneyState,type Member} from "@/lib/money";
import {FAMILY_TASKS_KEY,type FamilyTask} from "@/lib/familyTasks";
import {FAMILY_PLANS_KEY,type FamilyPlan} from "@/lib/familyPlans";
import {FAMILY_WISHLIST_KEY,type WishlistItem} from "@/lib/familyWishlist";
import {type BasketEntry,isSampleBasketEntry} from "@/lib/basketRecording";
import {type FamilyMoment,dateKey} from "@/lib/familyCalendar";
import {realFamilyMembers} from "@/lib/familySetup";
import {homeSnapshot} from "@/lib/homeSnapshot";
import {defaultFamilyPreferences,type FamilyPreferences} from "@/lib/familyPreferences";
import {answerFamilyQuestion,type GuidedAnswer} from "@/lib/guidedFamilyAdvisor";
import {TodayQuickActions} from "./TodayQuickActions";
import {TodayFamilyBrief} from "./TodayFamilyBrief";
import {FamilyWeather} from "./FamilyWeather";

const panel="rounded-[1.55rem] border border-[#F0E4E9] bg-white/95 p-4 shadow-[0_16px_35px_-28px_rgba(57,40,64,.20)] sm:p-5";
function dayGreeting(ar:boolean,now:Date){
 const hour=now.getHours();
 return hour<12?(ar?"صباح الخير":"Good morning"):hour<18?(ar?"يسعد مساك":"Good afternoon"):(ar?"مساء الخير":"Good evening");
}
function TodayAskInline({onClose}:{onClose:()=>void}){
 const {lang}=useI18n(),ar=lang==="ar";
 const text=(en:string,arabic:string)=>ar?arabic:en;
 const [question,setQuestion]=useState("");
 const [reply,setReply]=useState<{question:string;answer:GuidedAnswer}|null>(null);
 const [money,,moneyReady]=useLocalState<MoneyState>("money",sampleMoney());
 const [members,,membersReady]=useLocalState<Member[]>("members",sampleMembers());
 const [moments,,momentsReady]=useLocalState<FamilyMoment[]>("familyCalendar",[]);
 const [plans,,plansReady]=useLocalState<FamilyPlan[]>(FAMILY_PLANS_KEY,[]);
 const [tasks,,tasksReady]=useLocalState<FamilyTask[]>(FAMILY_TASKS_KEY,[]);
 const [wishlist,,wishReady]=useLocalState<WishlistItem[]>(FAMILY_WISHLIST_KEY,[]);
 const [prefs,,prefsReady]=useLocalState<FamilyPreferences>("familyPreferences",defaultFamilyPreferences);
 const input=useRef<HTMLInputElement>(null);
 const ready=moneyReady&&membersReady&&momentsReady&&plansReady&&tasksReady&&wishReady&&prefsReady;
 useEffect(()=>input.current?.focus(),[]);
 const submit=(event:FormEvent)=>{
  event.preventDefault();if(!ready||!question.trim())return;
  const clean=question.trim().slice(0,400);
  const answer=answerFamilyQuestion(clean,{money,members,moments,plans,tasks,wishlist,preferences:prefs,now:new Date()});
  setReply({question:clean,answer});
 };
 return <section aria-label={text("Ask your family question","اسأل عن عائلتك")} className={panel}>
  <div className="flex items-center justify-between gap-3">
   <h2 className="text-base font-extrabold">{text("Ask about your family","اسأل عن عائلتك")}</h2>
   <button type="button" onClick={onClose} className="min-h-11 rounded-full px-3 text-xs font-semibold text-[#677185]">
    {text("Close","إغلاق")}
   </button>
  </div>
  <form onSubmit={submit} className="mt-3 flex items-center gap-2 rounded-xl border border-[#E9E1E9] bg-[#FFF9FB] p-2">
   <label className="sr-only" htmlFor="focused-home-question">{text("Ask about your family","اسأل عن عائلتك")}</label>
   <input id="focused-home-question" ref={input} value={question} onChange={e=>setQuestion(e.target.value)}
    maxLength={400} placeholder={text("e.g. How are our savings goals?","مثلاً كيف ماشيين بأهداف الادخار؟")}
    className="min-h-11 min-w-0 flex-1 bg-transparent px-2 text-base outline-none"/>
   <button type="submit" disabled={!ready||!question.trim()}
    aria-label={text("Get family guidance","اعرض إرشاد العائلة")}
    className="grid size-11 shrink-0 place-items-center rounded-full bg-[#806AB9] text-white disabled:opacity-50">
    <Send className="size-4 rtl:rotate-180"/>
   </button>
  </form>
  {reply&&<div role="status" className="mt-3 rounded-2xl bg-[#F7F4FE] p-4">
   <p className="text-xs font-medium text-[#756985]">{reply.question}</p>
   <h3 className="mt-2 text-sm font-bold text-[#25354B]">{ar?reply.answer.titleAr:reply.answer.titleEn}</h3>
   <p className="mt-2 text-sm leading-relaxed text-[#515D75]">{ar?reply.answer.textAr:reply.answer.textEn}</p>
   <p className="mt-2 text-[11px] text-[#6E788B]">{ar?reply.answer.sourceAr:reply.answer.sourceEn}</p>
   <Link to={reply.answer.route} className="mt-3 inline-flex min-h-10 items-center gap-1 text-xs font-bold text-[#7253AE] underline">
    {ar?reply.answer.actionAr:reply.answer.actionEn}<ArrowRight className="size-4 rtl:rotate-180"/>
   </Link>
  </div>}
  <p className="mt-2 text-[11px] text-[#7A8292]">{text(
   "Guidance uses saved information on this device; this is not connected generative AI or verified bank data.",
   "الإرشاد مبني على المعلومات المحفوظة في جهازك، وليس ذكاءً اصطناعياً متصلاً أو بيانات بنك مؤكدة.")}</p>
 </section>;
}

/** A 20-second returning-parent home. The detailed capabilities remain in the
 * six original sections; Today itself no longer repeats those pages.
 */
export function FocusedFamilyHome(){
 const {lang}=useI18n(),ar=lang==="ar";
 const text=(en:string,arabic:string)=>ar?arabic:en;
 const [money,,moneyReady]=useLocalState<MoneyState>("money",sampleMoney());
 const [members,,membersReady]=useLocalState<Member[]>("members",sampleMembers());
 const [moments,,momentsReady]=useLocalState<FamilyMoment[]>("familyCalendar",[]);
 const [plans,,plansReady]=useLocalState<FamilyPlan[]>(FAMILY_PLANS_KEY,[]);
 const [tasks,,tasksReady]=useLocalState<FamilyTask[]>(FAMILY_TASKS_KEY,[]);
 const [basket,,basketReady]=useLocalState<BasketEntry[]>("shopping",[]);
 const [wishlist,,wishReady]=useLocalState<WishlistItem[]>(FAMILY_WISHLIST_KEY,[]);
 const [prefs,,prefsReady]=useLocalState<FamilyPreferences>("familyPreferences",defaultFamilyPreferences);
 const [introDone,setIntroDone,introReady]=useLocalState("focusedTodayWelcomeDone",false);
 const [askOpen,setAskOpen]=useState(false);
 const now=new Date();
 const loaded=moneyReady&&membersReady&&momentsReady&&plansReady&&tasksReady&&basketReady&&wishReady&&prefsReady&&introReady;
 const existing=(!money.demo||realFamilyMembers(members).length>0||
  moments.length>0||plans.length>0||tasks.length>0||
  basket.some(x=>!isSampleBasketEntry(x))||wishlist.length>0);
 const showWelcome=loaded&&!introDone&&!existing;
 const snapshot=homeSnapshot({money,members,moments,plans,tasks,basket,wishlist,now,arabic:ar});
 const spending=!money.demo?computeMoney(money,now):null;
 const dueBills=snapshot.agenda.filter(x=>x.kind==="bill");
 const nextMoment=snapshot.plans.find(x=>!!x.date&&x.date>=dateKey(now));
 const nextDate=nextMoment?.date?new Date(Number(nextMoment.date.slice(0,4)),Number(nextMoment.date.slice(5,7))-1,Number(nextMoment.date.slice(8,10)),12):null;
 const eventDate=nextDate?new Intl.DateTimeFormat(ar?"ar-JO":"en-GB",{day:"numeric",month:"long"}).format(nextDate):"";
 const displayDate=new Intl.DateTimeFormat(ar?"ar-JO":"en-GB",{weekday:"long",day:"numeric",month:"long"}).format(now);
 return <div className="mx-auto max-w-[1250px] space-y-4 pb-5 text-[#25354B]">
  <header className="flex flex-wrap items-center justify-between gap-3 px-1 pt-1">
   <div>
    <p className="text-xs font-semibold text-[#9B6784]">{displayDate}</p>
    <h1 className="mt-1 text-[1.75rem] font-extrabold leading-tight tracking-tight sm:text-[2.25rem]">
     {dayGreeting(ar,now)} <span aria-hidden="true">☀️</span>
    </h1>
    <p className="mt-1 text-sm text-[#687387]">{text("Your family, made simpler.","عيلتك، صار تنظيمها أبسط.")}</p>
   </div>
   <span aria-hidden="true" className="grid size-12 place-items-center rounded-full bg-[#FCE7EF] text-[#D56C94]">
    <Heart className="size-6"/>
   </span>
  </header>

  {showWelcome&&<section aria-label={text("Welcome to Dabberna","أهلاً بك في دبّرنا")}
   className="grid overflow-hidden rounded-[1.65rem] border border-[#F1E4E9] bg-gradient-to-r from-[#FCEAF0] via-[#FFF6F5] to-[#EDF7F0] sm:grid-cols-[210px_1fr]">
   <div className="relative h-[165px] overflow-hidden sm:h-[210px]" dir="ltr">
    <img src={import.meta.env.BASE_URL+"family-hero-cartoon.avif"}
     alt={text("Friendly cartoon illustration of a family","رسم كرتوني لطيف لعائلة")}
     className="absolute inset-0 size-full object-contain object-bottom" loading="eager"/>
   </div>
   <div className="flex flex-col items-start justify-center gap-2 px-5 pb-5 pt-2 sm:px-7 sm:py-5">
    <h2 className="text-xl font-extrabold">{text("Welcome to your family space","أهلاً بمساحة عيلتك")}</h2>
    <p className="max-w-xl text-sm leading-relaxed text-[#626E82]">{text(
     "Plan wisely, take care of the little things and enjoy family life. You can begin without filling in a long profile.",
     "نظّم أمور العيلة بذكاء وعيش اللحظات الحلوة. فيك تبدأ من دون تعبئة ملف طويل.")}</p>
    <button type="button" onClick={()=>setIntroDone(true)}
     className="mt-2 inline-flex min-h-11 items-center gap-2 rounded-full bg-[#BD4F82] px-5 text-sm font-bold text-white">
     {text("Start my day","يلا نبدأ")}<ArrowRight className="size-4 rtl:rotate-180"/>
    </button>
   </div>
  </section>}

  <TodayQuickActions onAsk={()=>setAskOpen(true)} onOtherAction={()=>setAskOpen(false)}/>
  {askOpen&&<TodayAskInline onClose={()=>setAskOpen(false)}/>}
  <TodayFamilyBrief compact/>

  {loaded&&<div className="grid gap-4 md:grid-cols-2">
   <section className={panel} aria-label={text("Financial picture","الوضع المالي")}>
    <div className="flex items-center gap-2">
     <span className="grid size-10 place-items-center rounded-xl bg-[#EAF6F1]"><Wallet className="size-5 text-[#398A76]"/></span>
     <h2 className="text-base font-extrabold">{text("Your money, at a glance","المالية، بنظرة سريعة")}</h2>
    </div>
    {spending?<div className="mt-4 grid grid-cols-2 gap-3">
     <div className="rounded-2xl bg-[#F5FAF7] p-3">
      <p className="text-xs text-[#657487]">{text("Recorded this month","المصروف المسجّل هذا الشهر")}</p>
      <p className="mt-1 text-xl font-extrabold tabular-nums">{fmtJOD(spending.spent)}</p>
     </div>
     <div className="rounded-2xl bg-[#FFF7F1] p-3">
      <p className="text-xs text-[#657487]">{text("Bills within 7 days","فواتير خلال ٧ أيام")}</p>
      <p className="mt-1 text-xl font-extrabold tabular-nums">{dueBills.length}</p>
      <p className="mt-1 text-[10px] text-[#7F8794]">{text("Based on entered schedules","حسب المواعيد المسجّلة")}</p>
     </div>
    </div>:<div className="mt-4 rounded-xl bg-[#F8F6F8] p-3">
     <p className="text-sm text-[#5E6D80]">{text(
      "Your real monthly figures are not set up yet. Example numbers are hidden.",
      "لم تُدخل أرقام العيلة الحقيقية بعد. الأرقام التجريبية مخفية.")}</p>
     <Link to="/money" className="mt-2 inline-flex min-h-10 items-center gap-1 text-xs font-bold text-[#31866F] underline">
      {text("Set up my money","رتّب ماليتي")}<ArrowRight className="size-4 rtl:rotate-180"/>
     </Link>
    </div>}
    <p className="mt-3 text-[11px] text-[#7B8491]">{text(
     "Recorded spending and entered bill dates are not verified bank balances or confirmed payment status.",
     "المصروف المسجّل وتواريخ الفواتير ليسوا رصيداً بنكياً أو تأكيد دفع.")}</p>
   </section>
   {nextMoment&&<section className={panel} aria-label={text("Next family occasion","المناسبة العائلية القادمة")}>
    <div className="flex items-center gap-2">
     <span className="grid size-10 place-items-center rounded-xl bg-[#EDF3FB]"><CalendarDays className="size-5 text-[#618FBA]"/></span>
     <h2 className="text-base font-extrabold">{text("Coming up for your family","شو عند العيلة قريباً")}</h2>
    </div>
    <div className="mt-4 flex items-start gap-3 rounded-2xl bg-[#F8F7FC] p-4">
     <span className="grid size-11 shrink-0 place-items-center rounded-full bg-white text-[#9D79B9]"><Heart className="size-5"/></span>
     <div className="min-w-0 flex-1">
      <p className="break-words text-base font-extrabold">{nextMoment.title}</p>
      <p className="mt-1 text-sm text-[#657185]">{eventDate}</p>
     </div>
    </div>
    <Link to={nextMoment.kind==="plan"?"/plans":"/calendar"}
     className="mt-3 inline-flex min-h-11 items-center gap-1 text-xs font-bold text-[#6489B1] underline">
     {text("See this "+(nextMoment.kind==="plan"?"plan":"date"),"شوف التفاصيل")}
     <ArrowRight className="size-4 rtl:rotate-180"/>
    </Link>
   </section>}
  </div>}

  {loaded&&prefs.weather&&<FamilyWeather compact/>}
  <footer className="flex items-start gap-2 px-1 pt-1 text-[11px] leading-relaxed text-[#7B8491]">
   <ShieldCheck className="mt-0.5 size-4 shrink-0"/>
   <span>{text(
    "Your family's information remains in this browser. Suggestions are based on what you saved; no bank or live shopping connection is implied.",
    "معلومات العيلة محفوظة بهذا المتصفح. الاقتراحات تعتمد على مدخلاتك، من دون ربط بنكي أو أسعار تسوق مباشرة.")}</span>
  </footer>
 </div>;
}
