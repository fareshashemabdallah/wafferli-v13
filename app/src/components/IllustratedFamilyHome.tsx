import {useState,type FormEvent,type ReactNode} from "react";
import {Link} from "@tanstack/react-router";
import {ArrowRight,BookOpen,CalendarDays,CheckCircle2,ChevronRight,CloudSun,Gift,Heart,
 Home,Lightbulb,ListChecks,MessageCircle,Receipt,Send,ShieldCheck,ShoppingBasket,
 Sparkles,Wallet,Clock3,Compass} from "lucide-react";
import {useI18n} from "@/lib/i18n";
import {useLocalState,fmtJOD} from "@/lib/storage";
import {sampleMoney,sampleMembers,type Member,type MoneyState} from "@/lib/money";
import {FAMILY_TASKS_KEY,type FamilyTask} from "@/lib/familyTasks";
import {FAMILY_PLANS_KEY,type FamilyPlan} from "@/lib/familyPlans";
import {FAMILY_WISHLIST_KEY,type WishlistItem} from "@/lib/familyWishlist";
import {type BasketEntry} from "@/lib/basketRecording";
import {allFamilyMoments,occurrencesForDate,parseCalendarDate,type FamilyMoment} from "@/lib/familyCalendar";
import {realFamilyMembers} from "@/lib/familySetup";
import {defaultFamilyPreferences,type FamilyPreferences} from "@/lib/familyPreferences";
import {answerFamilyQuestion,type GuidedAnswer} from "@/lib/guidedFamilyAdvisor";
import {homeSnapshot,type HomeAgendaItem} from "@/lib/homeSnapshot";
import {decideWeekendOuting} from "@/lib/weekendOutingDecision";
import {needsStarterBudget} from "@/lib/starterBudget";
import {TodayFamilyBrief} from "@/components/TodayFamilyBrief";
import {QuickExpenseCard} from "@/components/QuickExpenseCard";
import {FamilyStarterCard} from "@/components/FamilyStarterCard";
import {FamilySetupCard} from "@/components/FamilySetupCard";
import {FamilyWeather} from "@/components/FamilyWeather";
import {SpendingBreakdownCard} from "@/components/SpendingBreakdownCard";

const homeCard="rounded-[1.55rem] border border-[#DAE8DA] bg-white/95 p-4 shadow-[0_16px_35px_-28px_rgba(27,78,55,.32)] sm:p-5";
const iconBox="grid size-11 shrink-0 place-items-center rounded-2xl";
const dateLabel=(value:string,ar:boolean)=> {
 const date=parseCalendarDate(value);
 return date?new Intl.DateTimeFormat(ar?"ar-JO":"en-GB",{month:"short",day:"numeric"}).format(date):value;
};

export function IllustratedFamilyHome(){
 const {lang,tr}=useI18n(),ar=lang==="ar";
 const [money,,moneyReady]=useLocalState<MoneyState>("money",sampleMoney());
 const [members,,membersReady]=useLocalState<Member[]>("members",sampleMembers());
 const [moments,,momentsReady]=useLocalState<FamilyMoment[]>("familyCalendar",[]);
 const [tasks,,tasksReady]=useLocalState<FamilyTask[]>(FAMILY_TASKS_KEY,[]);
 const [plans,,plansReady]=useLocalState<FamilyPlan[]>(FAMILY_PLANS_KEY,[]);
 const [basket,,basketReady]=useLocalState<BasketEntry[]>("shopping",[]);
 const [wishlist,,wishlistReady]=useLocalState<WishlistItem[]>(FAMILY_WISHLIST_KEY,[]);
 const [prefs,,prefsReady]=useLocalState<FamilyPreferences>("familyPreferences",defaultFamilyPreferences);
 const [draft,setDraft]=useState("");
 const [answer,setAnswer]=useState<{question:string;result:GuidedAnswer}|null>(null);
 const [quickExpenseOpen,setQuickExpenseOpen]=useState(false);
 const now=new Date();
 const ready=moneyReady&&membersReady&&momentsReady&&tasksReady&&plansReady&&basketReady&&wishlistReady&&prefsReady;
 const view=homeSnapshot({money,members,moments,plans,tasks,basket,wishlist,now,arabic:ar});
 const weekend=decideWeekendOuting(money,prefs,now);
 const [selectedDay,setSelectedDay]=useState(view.nowKey);
 const calendarEvents=occurrencesForDate(allFamilyMoments(moments,realFamilyMembers(members),ar),selectedDay);
 const calendarTasks=tasks.filter(t=>t.status==="open"&&t.dueDate===selectedDay);
 const ask=(query:string)=>{
  if(!ready||!query.trim())return;
  const cleaned=query.trim().slice(0,400);
  const result=answerFamilyQuestion(cleaned,{money,members,moments,plans,tasks,wishlist,
   services:[],outings:[],preferences:prefs,now});
  setAnswer({question:cleaned,result});setDraft("");
 };
 const submit=(event:FormEvent)=>{event.preventDefault();ask(draft)};
 const suggestions=ar?[
  "فينا نطلع مع العيلة هالويكند؟","كيف خطة مصاريفنا هالشهر؟",
  "شو الأنشطة المناسبة للأطفال؟","شو عندنا مناسبات قريبة؟"
 ]:[
  "Can we afford a family outing this weekend?","How is our monthly budget?",
  "What outings suit our family?","What's coming up for the children?"
 ];
 const labels={
  today:ar?"اليوم":"Today",
  ask:ar?"اسأل دبّرنا":"Ask Dabberna",
  plans:ar?"خططنا":"Our Plans",
  money:ar?"المال والفواتير":"Money & Bills",
  shopping:ar?"المشتريات والرغبات":"Shopping & Wishlist",
  calendar:ar?"تقويم العائلة":"Family Calendar"
 };
 const month=new Intl.DateTimeFormat(ar?"ar-JO":"en-GB",{month:"long",year:"numeric"}).format(now);
 const groups=(view.budget?.groups??[]).filter(g=>g.lines.length>0);
 const groupNames:Record<string,{en:string;ar:string;bg:string}>={
  fixed:{en:"Fixed expenses",ar:"مصاريف ثابتة",bg:"#65A78B"},
  variable:{en:"Variable expenses",ar:"مصاريف متغيرة",bg:"#75B6DD"},
  periodic:{en:"Periodic expenses",ar:"مصاريف دورية",bg:"#F2B35D"},
  unallocated:{en:"Not yet allocated",ar:"لم تُوزّع بعد",bg:"#A2A7B2"}
 };
 const label=(en:string,arabic:string)=>ar?arabic:en;
 const dateText=(item:HomeAgendaItem)=>item.date===view.nowKey?label("Today","اليوم"):dateLabel(item.date,ar);
 const loaded=(section:string)=>ready?section:label("Loading saved family data…","عم نحمّل معلومات العائلة…");
 return <div className="dabberna-new-home mx-auto max-w-[1420px] space-y-4 pb-6 sm:space-y-5">
  <header className="relative isolate overflow-hidden rounded-[1.9rem] border border-[#DCEBDD] bg-gradient-to-r from-[#E7F2E2] via-[#F5F7EE] to-[#FFF5E7] shadow-[0_20px_60px_-45px_rgba(28,79,49,.42)]">
   <div className="pointer-events-none absolute -end-16 -top-16 size-64 rounded-full bg-[#FFF1C7]/55 blur-xl" aria-hidden="true"/>
   <div className="grid items-center gap-1 lg:grid-cols-[36%_1fr_19%]">
    <div className="relative h-48 overflow-hidden sm:h-60 lg:h-72" dir="ltr">
     <img src={import.meta.env.BASE_URL+"family-hero-cartoon.avif"} alt={label(
      "Stylized cartoon portrait of a smiling family of four, with the mother’s hair uncovered",
      "رسم كرتوني لعائلة من أربعة أفراد مبتسمين، الأم بشعر مكشوف")}
      className="absolute inset-0 size-full object-contain object-bottom" loading="eager" decoding="async"/>
    </div>
    <div className="relative px-5 pb-6 text-center sm:px-7 lg:py-8">
     <p className="text-xs font-semibold tracking-[.15em] text-[#668876]">{label("WELCOME TO YOUR FAMILY SPACE","مساحة لعيلتك")}</p>
     <h1 className="mt-2 text-[1.7rem] font-extrabold leading-[1.15] tracking-tight text-[#194C46] sm:text-[2rem] xl:text-[2.55rem]">
      {label("A calmer, brighter tomorrow for your family","يوم أهدأ ومستقبل أحلى لعيلتك")}
     </h1>
     <p className="mx-auto mt-3 max-w-[34rem] text-sm leading-relaxed text-[#4F716B]">
      {label("Plan, manage, decide, monitor and adjust — all in one place.",
       "خطّط، نظّم، قرّر، تابع وعدّل — كل شي بمكان واحد.")}
     </p>
     <Link to="/advisor" className="mt-5 inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#176548] px-6 text-sm font-bold text-white shadow-[0_9px_18px_-12px_rgba(13,90,47,.9)] transition hover:bg-[#134F3B]">
      <MessageCircle className="size-5"/>{labels.ask}<ArrowRight className="size-4 rtl:rotate-180"/>
     </Link>
    </div>
    <div className="relative hidden p-5 text-center lg:block">
     <div className="text-sm font-semibold italic leading-7 text-[#577A88]">
      {label("Better plans today for a happier tomorrow","قرارات أحلى اليوم، وراحة أكبر لبكرا")}
     </div>
     <Heart className="mx-auto mt-2 size-6 text-[#60977B]"/>
     <div className="mx-auto mt-4 grid size-24 place-items-center rounded-full bg-[#DDEDD8]/70">
      <Home className="size-11 text-[#5E9877]"/>
     </div>
    </div>
   </div>
  </header>

  <div className="grid items-stretch gap-4 lg:grid-cols-3">
   <section className={homeCard} aria-labelledby="dab-today">
    <CardHeading id="dab-today" title={labels.today} desc={label("Your current picture and next steps","صورة يومك والخطوة الجاية")}
     icon={<CalendarDays className="size-6"/>} color="green" to="/calendar" cta={label("View all","شوف الكل")}/>
    {!ready?<EmptyText>{loaded("")}</EmptyText>:view.agenda.length===0?
     <EmptyText>{label("No upcoming tasks, unpaid scheduled bills or family occasions are recorded for the next seven days.","ما في مهام أو فواتير غير مدفوعة أو مناسبات مسجّلة للأسبوع الجاي.")}</EmptyText>:
     <ol className="mt-4 space-y-1">
      {view.agenda.slice(0,4).map((item,i)=><li key={item.id}>
       <Link to={item.destination} className="group flex min-h-12 items-center gap-3 rounded-xl px-2 py-2 hover:bg-[#F4F8F1]">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#E9F3E6] text-[#4A8864]">
         {item.kind==="bill"?<Receipt className="size-[18px]"/>:item.kind==="moment"?<Heart className="size-[18px]"/>:<ListChecks className="size-[18px]"/>}
        </span>
        <span className="min-w-0 flex-1 truncate text-sm font-semibold text-[#284739]">{item.title}</span>
        <span className="shrink-0 text-xs text-[#65807C]">{dateText(item)}</span>
        <ChevronRight className="size-4 shrink-0 text-[#91AEA4] rtl:rotate-180"/>
       </Link>
      </li>)}
     </ol>}
    <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">{label(
     "Shows saved dates and payments still unconfirmed—not an external calendar or bank sync.",
     "مواعيد من معلوماتك والمدفوعات اللي ما تأكّد تسجيل دفعها؛ ما في ربط مباشر مع البنك.")}</p>
   </section>

   <section className={homeCard} aria-labelledby="dab-ask">
    <CardHeading id="dab-ask" title={labels.ask} desc={label("Personalized guidance from your saved information","إرشاد يناسب معلومات عيلتك")}
     icon={<MessageCircle className="size-6"/>} color="blue" to="/advisor" cta={label("More guidance","المزيد")}/>
    <form className="mt-4 flex gap-2 rounded-xl border border-[#D9E7DF] bg-[#FAFDFC] p-2" onSubmit={submit}>
     <label className="sr-only" htmlFor="dab-home-question">{label("Ask about your family","اسأل عن العائلة")}</label>
     <input id="dab-home-question" type="text" maxLength={400} value={draft} onChange={e=>setDraft(e.target.value)}
      placeholder={label("Ask anything about your family's plans…","اسأل عن مصاريف العيلة أو خططها…")}
      className="min-w-0 flex-1 bg-transparent px-2 text-sm outline-none" />
     <button type="submit" disabled={!ready||!draft.trim()}
      aria-label={label("Ask Dabberna","اسأل دبّرنا")}
      className="grid size-10 shrink-0 place-items-center rounded-full bg-[#267658] text-white disabled:opacity-40">
      <Send className="size-4 rtl:rotate-180"/></button>
    </form>
    {answer?<div className="mt-3 rounded-xl border border-[#CADFCF] bg-[#F0F8EE] p-3" role="status">
     <p className="text-[11px] font-semibold text-[#568371]">{answer.question}</p>
     <h3 className="mt-1 text-sm font-bold">{ar?answer.result.titleAr:answer.result.titleEn}</h3>
     <p className="mt-1 text-xs leading-relaxed">{ar?answer.result.textAr:answer.result.textEn}</p>
     <Link to={answer.result.route} className="mt-2 inline-flex min-h-10 items-center gap-1.5 text-xs font-bold text-brand underline">
      {ar?answer.result.actionAr:answer.result.actionEn}<ArrowRight className="size-3.5 rtl:rotate-180"/>
     </Link>
    </div>:<div className="mt-3 grid grid-cols-2 gap-2">
      {suggestions.map((q,i)=><button key={q} type="button" onClick={()=>ask(q)} disabled={!ready}
       className={"min-h-14 rounded-xl px-3 py-2 text-start text-xs font-semibold leading-relaxed text-[#315A57] transition hover:brightness-[.97] disabled:opacity-60 "+
        (i===0?"bg-[#E8F4E6]":"bg-[#F1F6F7]")}>{q}</button>)}
     </div>}
    <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">{label(
     "Guided local advice, not live AI research or bank-verified decisions.",
     "إرشادات محلية حسب سجلاتك، مش بحث AI مباشر أو بيانات بنكية مؤكدة.")}</p>
   </section>

   <section className={homeCard} aria-labelledby="dab-plans">
    <CardHeading id="dab-plans" title={labels.plans} desc={label("Upcoming plans and milestones","الخطط والمناسبات القادمة")}
     icon={<BookOpen className="size-6"/>} color="blue" to="/plans" cta={label("View all","شوف الكل")}/>
    {!ready?<EmptyText>{loaded("")}</EmptyText>:view.plans.length===0?
     <EmptyText>{label("No upcoming saved plans or family dates. Ask Dabberna to help with a new plan.","ما في خطط أو مناسبات مسجّلة. اسأل دبّرنا يساعدك بخطة جديدة.")}</EmptyText>:
     <div className="mt-3 divide-y divide-[#E9EFE9]">{view.plans.map(item=><Link key={item.id}
      to={item.kind==="plan"?"/plans":"/calendar"}
      className="flex min-h-[3.3rem] items-center gap-3 hover:bg-[#FAFCF8]">
      <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-[#EAF3E8] text-[#599472]">
       {item.kind==="plan"?<Compass className="size-4"/>:<Gift className="size-4"/>}
      </span>
      <span className="min-w-0 flex-1 truncate text-sm font-semibold">{item.title}</span>
      <span className="shrink-0 rounded-full bg-[#EFF6EF] px-2 py-1 text-[11px] text-[#567564]">
       {item.date?dateLabel(item.date,ar):label("Flexible","مرن")}
      </span>
      <ChevronRight className="size-4 text-[#92AFA0] rtl:rotate-180"/>
     </Link>)}</div>}
    <Link to="/plans" className="mt-4 inline-flex min-h-11 items-center gap-1.5 text-xs font-bold text-brand underline">
     {label("Review and adjust plans","راجع وعدّل الخطط")}<ArrowRight className="size-4 rtl:rotate-180"/>
    </Link>
   </section>
  </div>

  <div className="grid items-stretch gap-4 lg:grid-cols-3">
   <section className={homeCard} aria-labelledby="dab-money">
    <CardHeading id="dab-money" title={labels.money} desc={label("Your monthly household picture","صورة مصاريف البيت هالشهر")}
     icon={<Wallet className="size-6"/>} color="green" to="/money" cta={label("View details","التفاصيل")}/>
    {!ready?<EmptyText>{loaded("")}</EmptyText>:!view.budget?
     <div className="mt-4 rounded-xl bg-[#F2F8EE] p-4">
      <p className="text-sm font-semibold">{label("Your actual household figures are not set yet.","لسه ما في أرقام مالية حقيقية للعائلة.")}</p>
      <p className="mt-1 text-xs text-muted-foreground">{label("Start with a few figures. We won't show sample balances as yours.","ابدأ بشوية أرقام، وما رح نعرض بيانات تجريبية كأنها إلك.")}</p>
      <Link to="/money" className="mt-3 inline-flex min-h-11 items-center gap-1.5 text-sm font-bold text-brand underline">{label("Set up my finances","رتّب ميزانية البيت")} →</Link>
     </div>:
     <>
      <p className="mt-4 text-xs text-muted-foreground">{label("Monthly planned expenses","المصاريف المخططة للشهر")}</p>
      <p className="mt-1 text-[1.9rem] font-extrabold leading-tight tracking-tight text-[#194E4A]">{fmtJOD(view.budget.plannedJod)}</p>
      <p className="mt-1 text-xs text-[#5B7B73]">{label("Recorded as spent: ","المصروف المسجّل: ")}
       <strong>{fmtJOD(view.budget.recordedJod)}</strong></p>
      <div className="mt-4 flex h-3 overflow-hidden rounded-full bg-[#E6EEE7]" aria-label={label("Allocation by expense type","توزيع المصاريف حسب النوع")}>
       {groups.filter(g=>g.plannedJod>0).map(g=><div key={g.kind}
        title={label(groupNames[g.kind]!.en,groupNames[g.kind]!.ar)+" "+fmtJOD(g.plannedJod)}
        style={{width:100*g.plannedJod/Math.max(1,view.budget!.plannedJod)+"%",backgroundColor:groupNames[g.kind]!.bg}}/>)}
      </div>
      <div className="mt-3 divide-y divide-[#E8EFE7]">
       {groups.map(g=><div key={g.kind} className="py-2">
        <div className="flex justify-between gap-2 text-sm">
         <span className="flex items-center gap-2 font-semibold">
          <i className="size-2.5 shrink-0 rounded-full" style={{backgroundColor:groupNames[g.kind]!.bg}}/>
          {label(groupNames[g.kind]!.en,groupNames[g.kind]!.ar)}
         </span>
         <strong className="shrink-0 text-[#235753]">{fmtJOD(g.plannedJod)}</strong>
        </div>
        <p className="ms-[1.12rem] mt-1 text-[11px] leading-relaxed text-muted-foreground">
         {g.lines.slice(0,2).map(x=>tr(x.name)).join(" · ")}{g.lines.length>2?" +"+(g.lines.length-2):""}
        </p>
       </div>)}
      </div>
      <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
       {label("Planned versus recorded is not cash available or confirmed savings.",
        "الفرق بين المخطط والمسجّل مش رصيد نقدي أو توفير مؤكّد.")}
      </p>
     </>}
   </section>

   <section className={homeCard} aria-labelledby="dab-shopping">
    <CardHeading id="dab-shopping" title={labels.shopping} desc={label("Shopping needs and saved ideas","احتياجات ومشتريات العيلة")}
     icon={<ShoppingBasket className="size-6"/>} color="green" to="/explore/shopping" cta={label("View all","شوف الكل")}/>
    {!ready?<EmptyText>{loaded("")}</EmptyText>:view.shopping.length===0?
     <EmptyText>{label("Your shopping list and wishlist are empty. Save an item whenever you need one.","قائمة المشتريات والرغبات فاضية. أضف شي وقت تحتاجه.")}</EmptyText>:
     <div className="mt-4 divide-y divide-[#E9EFEA]">{view.shopping.map(item=><Link to={item.kind==="basket"?"/explore/shopping":"/occasions"} key={item.id}
      className="flex min-h-[3.5rem] items-center gap-3 hover:bg-[#F9FBF7]">
      <span className={"grid size-9 shrink-0 place-items-center rounded-xl "+(item.kind==="basket"?"bg-[#EAF4E9] text-[#53926F]":"bg-[#FDF0EE] text-[#B2746E]")}>
       {item.kind==="basket"?<ShoppingBasket className="size-5"/>:<Gift className="size-5"/>}
      </span>
      <span className={"min-w-0 flex-1 truncate text-sm font-semibold "+(item.status==="done"?"text-muted-foreground line-through":"")}>{item.title}</span>
      {item.status==="done"?<CheckCircle2 className="size-4 text-[#629B72]"/>:<ChevronRight className="size-4 text-[#91A9A1] rtl:rotate-180"/>}
     </Link>)}</div>}
    <Link to="/explore/market" className="mt-4 inline-flex min-h-11 items-center gap-1.5 text-xs font-bold text-brand underline">
     {label("Research a product","ابحث عن منتج")}<ArrowRight className="size-4 rtl:rotate-180"/>
    </Link>
   </section>

   <section className={homeCard} aria-labelledby="dab-calendar">
    <CardHeading id="dab-calendar" title={labels.calendar} desc={month}
     icon={<CalendarDays className="size-6"/>} color="blue" to="/calendar" cta={label("View calendar","شوف التقويم")}/>
    <div className="mt-4 grid grid-cols-7 gap-1">
     {view.week.map(({day,events})=>{
      const date=parseCalendarDate(day);
      const dow=date?new Intl.DateTimeFormat(ar?"ar-JO":"en-GB",{weekday:"short"}).format(date):"";
      const active=day===selectedDay;
      return <button key={day} type="button" disabled={!ready} aria-pressed={active}
       aria-label={date?new Intl.DateTimeFormat(ar?"ar-JO":"en-GB",{dateStyle:"full"}).format(date):day}
       onClick={()=>setSelectedDay(day)}
       className={"relative flex min-h-16 flex-col items-center justify-center gap-1 rounded-xl text-[11px] transition "+(active?
        "bg-[#DCEEDB] font-bold text-[#1D7653]":"text-[#647E79] hover:bg-[#F0F7EF]")}>
       <span>{dow}</span><strong className="text-sm">{Number(day.slice(-2))}</strong>
       <span className={"size-1.5 rounded-full "+(events?"bg-[#E7A65C]":"bg-transparent")}/>
      </button>;
     })}
    </div>
    <div className="mt-3 border-t border-[#E6ECE8] pt-2">
     {calendarEvents.length+calendarTasks.length===0?
      <EmptyText>{label("No saved occasions or open tasks on this date.","ما في مناسبة أو مهمة مفتوحة بهاليوم.")}</EmptyText>:
      <div className="space-y-1">
       {calendarEvents.slice(0,3).map(e=><Link key={e.id} to="/calendar"
        className="flex min-h-11 items-center gap-2 rounded-lg px-2 hover:bg-[#F5F9F4]">
        <Heart className="size-4 text-[#BE8B87]"/><span className="min-w-0 flex-1 truncate text-sm">{e.title}</span>
        <span className="text-[11px] text-[#66847B]">{e.time||label("All day","طول اليوم")}</span>
       </Link>)}
       {calendarTasks.slice(0,2).map(t=><Link key={t.id} to="/space"
        className="flex min-h-11 items-center gap-2 rounded-lg px-2 hover:bg-[#F5F9F4]">
        <ListChecks className="size-4 text-[#77A1B1]"/><span className="min-w-0 flex-1 truncate text-sm">{t.title}</span>
       </Link>)}
      </div>}
    </div>
   </section>
  </div>

  <section className="overflow-hidden rounded-[1.6rem] border border-[#D9E9D6] bg-gradient-to-r from-[#E9F5DF] via-[#FAFBF5] to-[#E4F2ED] p-4 shadow-sm sm:p-5"
   aria-labelledby="dab-recommendation">
   <div className="flex flex-wrap items-center gap-4 sm:flex-nowrap">
    <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[#FCEABB] text-[#9C7B2B]">
     <Lightbulb className="size-6"/>
    </div>
    <div className="min-w-0 flex-1">
     <h2 id="dab-recommendation" className="text-base font-bold text-[#205B4C]">{label("Dabberna suggests","دبّرنا بينصحك")}</h2>
     <p className="mt-1 text-sm font-semibold leading-relaxed text-[#315C4E]">{ar?weekend.headlineAr:weekend.headlineEn}</p>
     <p className="mt-1 text-xs leading-relaxed text-[#527367]">{ar?weekend.nextAr:weekend.nextEn}</p>
     {weekend.suggestedJod!==null&&<p className="mt-2 text-xs text-[#527367]">{label(
      "What if it costs "+fmtJOD(weekend.suggestedJod+15)+"? Compare a lower-cost option or postpone; never assume that extra money is available.",
      "شو لو صارت الكلفة "+fmtJOD(weekend.suggestedJod+15)+"؟ قارن خياراً أرخص أو أجّل الخطة؛ ما تفترض إن المبلغ الإضافي متاح.")}
     </p>}
     <p className="mt-1 text-[11px] text-[#668377]">{label(
      "Based on saved information, not verified bank funds or venue prices.",
      "النتيجة مبنية على المعلومات المسجّلة، مش أرصدة بنكية أو أسعار أماكن مؤكّدة.")}
     </p>
    </div>
    <Link to="/explore/weekend" className="inline-flex min-h-12 w-full shrink-0 items-center justify-center gap-2 rounded-full bg-[#2F7658] px-5 text-sm font-bold text-white sm:w-auto">
     {label("Explore the options","شوف الخيارات")}<ArrowRight className="size-4 rtl:rotate-180"/>
    </Link>
   </div>
  </section>

  <TodayFamilyBrief/>
  {!money.demo&&ready&&<details className="rounded-[1.4rem] border border-[#E0E8DB] bg-white p-4">
   <summary className="min-h-11 cursor-pointer text-sm font-bold text-brand">{label(
    "Show every fixed, variable and periodic expense category",
    "اعرض كل تفاصيل المصاريف الثابتة والمتغيرة والدورية")}</summary>
   <div className="mt-3"><SpendingBreakdownCard state={money} compact/></div>
  </details>}
  {needsStarterBudget(money)&&ready&&<FamilyStarterCard/>}
  <details className="rounded-[1.4rem] border border-[#E0E8DB] bg-white p-4">
   <summary className="min-h-11 cursor-pointer text-sm font-bold text-brand">
    {label("Update household information or record a payment (optional)","حدّث معلومات العيلة أو سجّل مصروف (اختياري)")}
   </summary>
   <div className="mt-3 flex flex-wrap gap-2">
    <button type="button" onClick={()=>setQuickExpenseOpen(v=>!v)} aria-expanded={quickExpenseOpen}
     className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#EDF6EA] px-4 text-sm font-semibold text-brand">
     <Receipt className="size-4"/>{label("Record a paid expense","سجّل مصروف مدفوع")}
    </button>
    <Link to="/money" className="inline-flex min-h-11 items-center gap-2 px-3 text-sm font-semibold text-brand underline">
     <Wallet className="size-4"/>{label("Detailed Money","تفاصيل المالية")}
    </Link>
    <Link to="/space" className="inline-flex min-h-11 items-center gap-2 px-3 text-sm font-semibold text-brand underline">
     <Home className="size-4"/>{label("Family & settings","العيلة والإعدادات")}
    </Link>
   </div>
   {quickExpenseOpen&&<QuickExpenseCard onClose={()=>setQuickExpenseOpen(false)}/>}
   <details className="mt-3">
    <summary className="min-h-10 cursor-pointer text-xs font-bold text-brand">{label("Personalize your family guidance","خصص إرشادات العيلة")}</summary>
    <FamilySetupCard/>
   </details>
   {prefs.weather&&<details className="mt-3">
    <summary className="flex min-h-10 cursor-pointer items-center gap-2 text-xs font-bold text-brand">
     <CloudSun className="size-4"/>{label("Weather & practical ideas","الطقس ونصائح العيلة")}
    </summary><FamilyWeather/>
   </details>}
  </details>
  <footer className="flex items-start gap-2 px-2 text-[11px] leading-relaxed text-muted-foreground">
   <ShieldCheck className="mt-0.5 size-4 shrink-0"/>
   <span>{label(
    "Your data stays in this browser unless you explicitly use another service. Listed costs are your estimates or records, not bank-verified funds. No background provider monitoring is active.",
    "معلوماتك بهالمتصفح إلا إذا اخترت خدمة خارجية. المصاريف أرقام مسجّلة أو تقديرية، مش رصيد بنكي موثّق، وما في متابعة تلقائية للمزوّدين.")}
   </span>
  </footer>
 </div>;
}
function CardHeading({id,title,desc,icon,color,to,cta}:{
 id:string;title:string;desc:string;icon:ReactNode;color:"green"|"blue";to:"/calendar"|"/plans"|"/money"|"/advisor"|"/explore/shopping";cta:string
}){
 return <div className="flex items-center gap-3">
  <span className={iconBox+" "+(color==="green"?"bg-[#E0F2E0] text-[#247351]":"bg-[#E1F2FD] text-[#2676A1]")}>
   {icon}
  </span>
  <div className="min-w-0 flex-1"><h2 id={id} className="text-lg font-extrabold text-[#163F43]">{title}</h2>
   <p className="mt-0.5 text-xs leading-snug text-[#71908B]">{desc}</p>
  </div>
  <Link to={to} className="shrink-0 rounded-full border border-[#D2E6E0] bg-white px-3 py-2 text-[11px] font-semibold text-[#427A77] hover:bg-[#F1F9F5]">{cta}</Link>
 </div>;
}
function EmptyText({children}:{children:ReactNode}){
 return <p className="mt-4 rounded-xl bg-[#F7FAF6] p-4 text-sm leading-relaxed text-[#6B8580]">{children}</p>;
}
