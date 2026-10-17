import {useState,type ReactNode} from "react";
import {Link} from "@tanstack/react-router";
import {ArrowRight, BookOpen, CalendarDays, ChevronRight, Heart,
  Languages, Lightbulb, PlayCircle,
  ShieldCheck, ShoppingBasket, Sparkles, Star, UsersRound, Wallet} from "lucide-react";
import {Logo} from "@/components/Logo";
import {useI18n} from "@/lib/i18n";
import {useLocalState,fmtJOD} from "@/lib/storage";
import {sampleMoney,sampleMembers,type MoneyState,type Member} from "@/lib/money";
import {type FamilyMoment} from "@/lib/familyCalendar";
import {type FamilyTask,FAMILY_TASKS_KEY} from "@/lib/familyTasks";
import {type FamilyPlan,FAMILY_PLANS_KEY} from "@/lib/familyPlans";
import {type WishlistItem,FAMILY_WISHLIST_KEY} from "@/lib/familyWishlist";
import {type BasketEntry} from "@/lib/basketRecording";
import {type FamilyPreferences,defaultFamilyPreferences} from "@/lib/familyPreferences";
import {homeSnapshot} from "@/lib/homeSnapshot";
import {decideWeekendOuting} from "@/lib/weekendOutingDecision";

const panel="rounded-[1.5rem] border border-[#E8EDE8] bg-white/90 p-4 shadow-[0_16px_44px_-32px_rgba(20,70,50,.28)] sm:p-5";
const asset=import.meta.env.BASE_URL+"landing-family-characters.avif";

/** Opt-in, read-only design preview. The current public home at / is unchanged.
 * All amounts and dates are read from this device's existing family records. */
export function LandingDesignPreview(){
 const {lang,setLang}=useI18n(),ar=lang==="ar";
 const [money,,moneyReady]=useLocalState<MoneyState>("money",sampleMoney());
 const [members,,membersReady]=useLocalState<Member[]>("members",sampleMembers());
 const [moments,,momentsReady]=useLocalState<FamilyMoment[]>("familyCalendar",[]);
 const [tasks,,tasksReady]=useLocalState<FamilyTask[]>(FAMILY_TASKS_KEY,[]);
 const [plans,,plansReady]=useLocalState<FamilyPlan[]>(FAMILY_PLANS_KEY,[]);
 const [basket,,basketReady]=useLocalState<BasketEntry[]>("shopping",[]);
 const [wishlist,,wishlistReady]=useLocalState<WishlistItem[]>(FAMILY_WISHLIST_KEY,[]);
 const [prefs,,prefsReady]=useLocalState<FamilyPreferences>("familyPreferences",defaultFamilyPreferences);
 const [mobileMenu,setMobileMenu]=useState(false);
 const ready=moneyReady&&membersReady&&momentsReady&&tasksReady&&plansReady&&basketReady&&wishlistReady&&prefsReady;
 const now=new Date();
 const view=homeSnapshot({money,members,moments,plans,tasks,basket,wishlist,now,arabic:ar});
 const decision=decideWeekendOuting(money,prefs,now);
 const display=(en:string,arabic:string)=>ar?arabic:en;
 const day=new Intl.DateTimeFormat(ar?"ar-JO":"en-GB",{weekday:"long",day:"numeric",month:"long"}).format(now);
 const mainLinks=[
  {to:"/advisor" as const,en:"Ask Dabberna",ar:"اسأل دبّرنا"},
  {to:"/money" as const,en:"Money & Bills",ar:"المال والفواتير"},
  {to:"/plans" as const,en:"Our Plans",ar:"خططنا"},
  {to:"/about" as const,en:"How it works",ar:"كيف بيشتغل؟"}
 ];
 const tiles=[
  {to:"/calendar" as const,en:"Today",ar:"اليوم",desc:"See what's next for your family.",ardesc:"شو عند العيلة قريباً",icon:CalendarDays,color:"#E9F4FC",ink:"#449CD6"},
  {to:"/money" as const,en:"Money & Bills",ar:"المال والفواتير",desc:"Stay on top of spending and savings.",ardesc:"خليك عارف مصاريفك وادخارك",icon:Wallet,color:"#EDF6E9",ink:"#2B9D71"},
  {to:"/explore/market" as const,en:"Shopping & Wishlist",ar:"مشترياتنا ورغباتنا",desc:"Find items and compare useful options.",ardesc:"ابحث وقارن الخيارات",icon:ShoppingBasket,color:"#FFF0E7",ink:"#EB7657"},
  {to:"/calendar" as const,en:"Family Calendar",ar:"تقويم العيلة",desc:"Keep important dates in one place.",ardesc:"المناسبات والمواعيد بمكان واحد",icon:CalendarDays,color:"#F3EDFC",ink:"#9C71DA"},
  {to:"/plans" as const,en:"Our Plans",ar:"خططنا",desc:"Turn family ideas into decisions.",ardesc:"حوّل الأفكار لخطط واضحة",icon:BookOpen,color:"#FFF6E3",ink:"#E0A33C"},
  {to:"/advisor" as const,en:"Ask Dabberna",ar:"اسأل دبّرنا",desc:"Get guidance from saved family context.",ardesc:"نصيحة مبنية على معلومات عيلتك",icon:Sparkles,color:"#EAF7F0",ink:"#2BA981"}
 ];
 const expenseGroups=(view.budget?.groups??[]).filter(g=>g.lines.length>0);
 const names:Record<string,{en:string;ar:string;color:string}>={
  fixed:{en:"Fixed expenses",ar:"المصاريف الثابتة",color:"#35A46F"},
  variable:{en:"Variable expenses",ar:"المصاريف المتغيرة",color:"#4597D1"},
  periodic:{en:"Periodic expenses",ar:"المصاريف الدورية",color:"#F5AE4B"},
  unallocated:{en:"Not allocated",ar:"غير موزعة",color:"#A0ABB2"}
 };
 return <div dir={ar?"rtl":"ltr"} className="dabberna-landing-preview min-h-dvh overflow-x-hidden bg-[#FFFCF7] text-[#132C31]">
  <div className="sticky top-0 z-50 border-b border-[#E8EDE7]/80 bg-[#FFFDF8]/90 backdrop-blur-xl">
   <header className="mx-auto flex min-h-[74px] max-w-[1480px] items-center justify-between gap-3 px-4 sm:px-7 lg:px-10">
    <Link to="/" className="inline-flex shrink-0 items-center gap-2" aria-label={display("Dabberna home","دبّرنا الرئيسية")}>
     <Logo className="scale-110"/>
    </Link>
    <nav className="hidden items-center gap-2 lg:flex" aria-label={display("Main navigation","التنقل الرئيسي")}>
     <span className="rounded-full bg-[#E9F4E8] px-5 py-2.5 text-sm font-bold text-[#195842]">{display("Home","الرئيسية")}</span>
     {mainLinks.map(l=><Link key={l.to} to={l.to} className="rounded-full px-4 py-2.5 text-sm font-semibold text-[#3D5658] transition hover:bg-[#EFF6EC]">{ar?l.ar:l.en}</Link>)}
    </nav>
    <div className="flex items-center gap-2">
     <button type="button" onClick={()=>setLang(ar?"en":"ar")} aria-label={display("Switch language","تغيير اللغة")}
      className="inline-flex min-h-11 items-center gap-1 rounded-full border border-[#E5E9E1] bg-white px-3 text-xs font-bold text-[#1C6752]">
      <Languages className="size-4"/>{ar?"English":"عربي"}</button>
     <Link to="/advisor" className="hidden min-h-11 items-center gap-2 rounded-full bg-[#1C604B] px-5 text-sm font-bold text-white sm:inline-flex">
      {display("Get started","ابدأ الآن")}<ArrowRight className="size-4 rtl:rotate-180"/>
     </Link>
     <button type="button" className="inline-flex min-h-11 items-center rounded-full border border-[#D9E5D9] px-3 text-xs font-semibold lg:hidden"
       aria-expanded={mobileMenu} onClick={()=>setMobileMenu(v=>!v)}>
      {display("Menu","القائمة")}</button>
    </div>
   </header>
   {mobileMenu&&<nav className="grid gap-1 border-t border-[#E5ECE4] bg-white p-3 lg:hidden" aria-label={display("Mobile menu","قائمة الهاتف")}>
    {mainLinks.map(l=><Link key={l.to} to={l.to} className="min-h-11 rounded-xl px-4 py-3 text-sm font-semibold text-[#25634D]">{ar?l.ar:l.en}</Link>)}
   </nav>}
  </div>
  <div className="mx-auto max-w-[1480px]">
   <div className="px-3 pt-3 sm:px-6">
    <div className="rounded-xl border border-[#F3E6BD] bg-[#FFF9E7] px-4 py-2 text-center text-xs font-semibold text-[#90671E]" role="note">
     {display("DESIGN TEST PREVIEW — your current homepage has not changed. Cards use your saved records, not the numbers in the illustration.",
       "معاينة اختبار للتصميم — الصفحة الرئيسية الحالية ما تغيّرت. البطاقات تستعمل بياناتك المحفوظة، مش أرقام الصورة.")}
     {" · "}
     <a href={import.meta.env.BASE_URL+"#/"} className="underline">{display("Back to current home","ارجع للصفحة الحالية")}</a>
    </div>
   </div>

   <section className="relative isolate mx-2 mt-3 overflow-hidden rounded-[2.1rem] bg-[radial-gradient(ellipse_at_75%_15%,#FBE8C3_0%,transparent_54%),linear-gradient(110deg,#FFFCF6_0%,#F5F9EF_53%,#FCE9CF_100%)] px-5 pb-4 pt-9 sm:mx-5 sm:px-8 lg:min-h-[565px] lg:px-12 lg:pb-0 lg:pt-16" aria-labelledby="dab-landing-title">
    <span aria-hidden="true" className="pointer-events-none absolute -bottom-24 -left-20 size-72 rounded-full bg-[#D6ECD5]/50 blur-3xl"/>
    <span aria-hidden="true" className="pointer-events-none absolute -right-16 top-16 size-72 rounded-full bg-[#FFD9C7]/40 blur-3xl"/>
    <div className="relative z-20 max-w-[30rem] lg:max-w-[41%]">
     <p className="text-[11px] font-extrabold uppercase tracking-[.23em] text-[#32705C]">{display("Happier families. Brighter days.","عائلات أسعد، وأيام أحلى")}</p>
     <h1 id="dab-landing-title" className="mt-5 text-[2.55rem] font-black leading-[1.1] tracking-[-.065em] text-[#14292D] sm:text-[3.65rem] lg:text-[3.7rem] xl:text-[4.35rem]">
      {ar?<>بكرا <em className="not-italic text-[#187F57]">أحلى</em> لعيلتك</>:<>A calmer, <em className="not-italic text-[#1C865F]">brighter</em> tomorrow for your family</>}
     </h1>
     <p className="mt-5 max-w-md text-base leading-relaxed text-[#375C63] sm:text-lg">
      {display("Plan, manage, decide, monitor and adjust — all in one place.","خطّط، نظّم، قرّر، تابع وعدّل — كل شي بمكان واحد.")}
     </p>
     <div className="mt-7 flex flex-wrap gap-3">
      <Link to="/advisor" className="inline-flex min-h-12 items-center gap-2 rounded-full bg-[#155943] px-6 text-sm font-extrabold text-white shadow-lg shadow-[#155943]/20">
       <Sparkles className="size-5 text-[#F2C762]"/>{display("Ask Dabberna","اسأل دبّرنا")}<ArrowRight className="size-4 rtl:rotate-180"/>
      </Link>
      <Link to="/plans" className="inline-flex min-h-12 items-center gap-2 rounded-full border border-white bg-[#EAF4E4] px-6 text-sm font-bold text-[#1E6453]">
       <PlayCircle className="size-5"/>{display("Explore plans","استكشف الخطط")}
      </Link>
     </div>
     <div className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-[11px] font-medium text-[#4B6970]">
      <span className="inline-flex items-center gap-1.5"><Heart className="size-4"/>{display("Less stress","ضغط أقل")}</span>
      <span className="inline-flex items-center gap-1.5"><UsersRound className="size-4"/>{display("More family time","وقت أكثر للعيلة")}</span>
      <span className="inline-flex items-center gap-1.5"><Star className="size-4"/>{display("A brighter tomorrow","بكرا أحلى")}</span>
     </div>
    </div>

    <div className="relative mt-6 h-[295px] sm:mx-auto sm:h-[420px] sm:max-w-3xl lg:absolute lg:inset-y-0 lg:end-[2%] lg:mt-0 lg:h-full lg:w-[60%]" aria-label={display("Playful cartoon of a family together","رسم كرتوني لعائلة مع بعضها")}>
     <img src={asset} alt={display("Cartoon mother and father smiling with their two children and a friendly robot.","أم وأب كرتونيين مبتسمين مع طفلين وروبوت لطيف")}
      className="absolute bottom-[-28px] start-[-5%] h-[110%] w-[110%] object-contain object-bottom drop-shadow-[0_14px_20px_rgba(77,89,52,.14)] lg:bottom-[-30px] lg:start-[-1%] lg:h-[96%] lg:w-[95%]" loading="eager" decoding="async"/>
     <div className="absolute start-0 top-0 hidden w-[36%] -rotate-3 rounded-2xl border border-[#E5EAE3] bg-white/95 p-3 shadow-xl shadow-[#597660]/10 lg:block">
      <div className="flex items-center gap-2 text-xs font-extrabold text-[#2D6B56]"><CalendarDays className="size-5"/>{display("Family calendar","تقويم العيلة")}</div>
      {ready&&view.agenda.length>0?<p className="mt-2 truncate text-[11px] text-[#344E50]">{view.agenda[0]?.title}</p>:
       <p className="mt-2 text-[11px] text-[#6D8180]">{display("Your important dates in one place","مواعيدك المهمة بمكان واحد")}</p>}
      <Link to="/calendar" className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-[#327B61]">{display("Open calendar","افتح التقويم")} <ArrowRight className="size-3"/></Link>
     </div>
     <div className="absolute end-0 top-[8%] hidden w-[33%] rotate-3 rounded-2xl border border-[#E4EAE5] bg-white/95 p-3 shadow-xl shadow-[#597660]/10 lg:block">
      <div className="flex items-center gap-2 text-xs font-extrabold text-[#2D6B56]"><Wallet className="size-5"/>{display("Money & Bills","المال والفواتير")}</div>
      <p className="mt-2 text-lg font-extrabold text-[#1E544A]">{ready&&view.budget?fmtJOD(view.budget.plannedJod):"—"}</p>
      <p className="text-[11px] text-[#67827C]">{display("Planned this month · JOD","مخطط لهذا الشهر · د.أ")}</p>
      <Link to="/money" className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-[#327B61]">{display("See details","التفاصيل")}<ArrowRight className="size-3"/></Link>
     </div>
     <div className="absolute bottom-[18%] end-0 hidden w-[34%] rotate-[-3deg] rounded-2xl border border-[#E8ECE9] bg-white/95 p-3 shadow-xl shadow-[#597660]/10 lg:block">
      <div className="flex items-center gap-2 text-xs font-extrabold text-[#2D6B56]"><ShoppingBasket className="size-5"/>{display("Shopping & Wishlist","المشتريات")}</div>
      <p className="mt-2 truncate text-[11px] text-[#476563]">{ready&&view.shopping.length?view.shopping[0]?.title:display("Your saved shopping needs","احتياجات العيلة المحفوظة")}</p>
      <Link to="/explore/shopping" className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-[#327B61]">{display("Open list","افتح القائمة")}<ArrowRight className="size-3"/></Link>
     </div>
    </div>
   </section>

   <nav aria-label={display("Explore family features","استكشف ميزات العائلة")}
    className="relative z-20 mx-3 -mt-1 grid grid-cols-2 gap-2 rounded-[2rem] bg-white/95 p-3 shadow-[0_16px_50px_-30px_rgba(34,81,49,.3)] sm:mx-6 sm:grid-cols-3 sm:gap-3 sm:p-4 lg:-mt-9 lg:grid-cols-6">
    {tiles.map(t=><Link key={t.en} to={t.to} className="group relative flex min-h-[134px] flex-col items-start rounded-[1.4rem] p-4 transition-transform hover:-translate-y-1"
      style={{backgroundColor:t.color}}>
     <t.icon className="size-8" color={t.ink} strokeWidth={2.3}/>
     <span className="mt-3 text-sm font-extrabold leading-tight text-[#152E32]">{ar?t.ar:t.en}</span>
     <span className="mt-1 max-w-[10rem] text-[11px] leading-relaxed text-[#5A7478]">{ar?t.ardesc:t.desc}</span>
     <span className="absolute bottom-3 end-3 grid size-8 place-items-center rounded-full bg-white/90 text-[#203D41] transition group-hover:translate-x-0.5">
      <ChevronRight className="size-4 rtl:rotate-180"/>
     </span>
    </Link>)}
   </nav>

   <div className="mx-3 mt-5 grid gap-4 sm:mx-6 lg:grid-cols-[1.1fr_1fr_1fr]" aria-label={display("Family overview","ملخص العيلة")}>
    <section className={panel} aria-labelledby="landing-money">
     <div className="flex items-center justify-between gap-2">
      <h2 id="landing-money" className="flex items-center gap-2 text-base font-extrabold"><Wallet className="size-5 text-[#2B9972]"/>{display("This month","هالشهر")}</h2>
      <Link to="/money" className="text-xs font-bold text-[#258A6A]">{display("Details","التفاصيل")}</Link>
     </div>
     {!ready?<SmallEmpty>{display("Loading saved information…","تحميل البيانات…")}</SmallEmpty>:!view.budget?
      <SmallEmpty>{display("Enter your household finances once to see fixed, variable and periodic costs.","أدخل معلومات الميزانية مرة حتى تشوف الثابت والمتغير والدوري.")}</SmallEmpty>:
      <>
       <p className="mt-3 text-xs text-[#64807A]">{display("Planned household expenses","مصاريف البيت المخططة")}</p>
       <p className="mt-1 text-2xl font-extrabold text-[#1D5B4A]">{fmtJOD(view.budget.plannedJod)}</p>
       <p className="mt-1 text-xs text-[#587C72]">{display("Recorded spent: ","المصروف المسجّل: ")}{fmtJOD(view.budget.recordedJod)}</p>
       <div className="mt-4 flex h-2.5 overflow-hidden rounded-full bg-[#EAF0EA]">
        {expenseGroups.filter(g=>g.plannedJod>0).map(g=><span key={g.kind}
         style={{width:(g.plannedJod/Math.max(1,view.budget!.plannedJod)*100)+"%",backgroundColor:names[g.kind]?.color??"#A5ACB0"}} />)}
       </div>
       <div className="mt-4 divide-y divide-[#EDF0EA]">
        {expenseGroups.map(g=><div key={g.kind} className="flex items-center justify-between gap-2 py-2 text-xs">
         <span className="flex items-center gap-2 font-semibold"><span className="size-2 rounded-full" style={{backgroundColor:names[g.kind]?.color??"#A5ACB0"}}/>
          {display(names[g.kind]?.en??g.kind,names[g.kind]?.ar??g.kind)}</span>
         <strong>{fmtJOD(g.plannedJod)}</strong>
        </div>)}
       </div>
       <p className="mt-3 text-[11px] leading-relaxed text-[#7A8887]">{display("Planned minus recorded is not available cash.","الفرق بين المخطّط والمسجّل مش رصيد نقدي متاح.")}</p>
      </>}
    </section>
    <section className={panel} aria-labelledby="landing-next">
     <div className="flex items-center gap-2"><Lightbulb className="size-5 text-[#F0B63B]"/><h2 id="landing-next" className="text-base font-extrabold">{display("Next best action","الخطوة الأنسب")}</h2></div>
     <p className="mt-4 text-sm font-semibold leading-relaxed text-[#284547]">{ready?(ar?decision.headlineAr:decision.headlineEn):display("Loading your family situation…","عم نراجع وضع العيلة…")}</p>
     <p className="mt-3 text-xs leading-relaxed text-[#6C7E7D]">{ready?(ar?decision.nextAr:decision.nextEn):""}</p>
     <Link to="/explore/weekend" className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-full bg-[#226E51] px-4 text-sm font-extrabold text-white">
      {display("Review this decision","راجع هالقرار")}<ArrowRight className="size-4 rtl:rotate-180"/>
     </Link>
    </section>
    <section className={panel} aria-labelledby="landing-week">
     <div className="flex items-center justify-between gap-2">
      <h2 id="landing-week" className="flex items-center gap-2 text-base font-extrabold"><CalendarDays className="size-5 text-[#6DB69B]"/>{display("Upcoming this week","القادم هالأسبوع")}</h2>
      <Link to="/calendar" className="text-xs font-bold text-[#258A6A]">{display("All","الكل")}</Link>
     </div>
     <p className="mt-1 text-xs text-[#718784]">{day}</p>
     {!ready?<SmallEmpty>{display("Loading…","تحميل…")}</SmallEmpty>:view.agenda.length===0?
      <SmallEmpty>{display("No upcoming saved tasks, bills or family dates for the next seven days.","ما في مهام أو فواتير أو مناسبات محفوظة للأسبوع الجاي.")}</SmallEmpty>:
      <div className="mt-3 divide-y divide-[#EDF2EC]">
       {view.agenda.slice(0,4).map(entry=><Link key={entry.id} to={entry.destination} className="flex min-h-12 items-center gap-2 py-2">
        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-[#E9F5E8] text-[#237F5B]"><CalendarDays className="size-4"/></span>
        <span className="min-w-0 flex-1 truncate text-xs font-semibold">{entry.title}</span>
        <span className="shrink-0 text-[11px] text-[#78938B]">{entry.date.slice(-5)}</span>
       </Link>)}
      </div>}
    </section>
   </div>
   <section className="mx-3 my-5 rounded-[1.5rem] border border-[#E7EDE6] bg-white/90 p-4 sm:mx-6" aria-label={display("More family options","خيارات أخرى للعيلة")}>
    <div className="flex flex-wrap items-center justify-between gap-2">
     <h2 className="inline-flex items-center gap-2 text-base font-extrabold"><Heart className="size-5 fill-[#F88C82] text-[#F88C82]"/>{display("Explore what your family enjoys","استكشف شو بتحب عيلتك")}</h2>
     <Link to="/explore" className="text-xs font-bold text-[#287E64]">{display("See all","شوف الكل")}</Link>
    </div>
    <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
     {([
      {to:"/explore/weekend" as const,en:"Kids' activities",ar:"أنشطة الأطفال",icon:"🛝",bg:"#E4F3F6"},
      {to:"/explore/restaurants" as const,en:"Family restaurants",ar:"مطاعم للعيلة",icon:"🍽️",bg:"#FAF1E4"},
      {to:"/explore/weekend" as const,en:"Parks & outdoors",ar:"حدائق وطلعات",icon:"🌳",bg:"#E7F5E6"},
      {to:"/explore/market" as const,en:"Children's clothing",ar:"ثياب الأطفال",icon:"👗",bg:"#FFF0F1"},
      {to:"/occasions" as const,en:"Gifts & occasions",ar:"هدايا ومناسبات",icon:"🎁",bg:"#FFF2DD"},
      {to:"/explore/market" as const,en:"Groceries",ar:"المواد الغذائية",icon:"🥦",bg:"#EAF5EC"}
     ]).map(x=><Link key={x.en} to={x.to} className="flex min-h-[100px] flex-col items-center justify-center gap-2 rounded-xl p-3 text-center transition hover:-translate-y-0.5"
      style={{backgroundColor:x.bg}}><span className="text-3xl" aria-hidden="true">{x.icon}</span>
      <span className="text-xs font-bold text-[#2E5454]">{ar?x.ar:x.en}</span></Link>)}
    </div>
   </section>
   <footer className="mx-3 mb-8 flex flex-wrap items-center gap-2 rounded-2xl bg-[#F2F8EF] p-4 text-xs leading-relaxed text-[#5E7A73] sm:mx-6">
    <ShieldCheck className="size-5 shrink-0"/>
    {display("Preview only. Existing finance, family and privacy records stay unchanged. Shopping sources and AI research are not yet fully connected.",
     "معاينة فقط. معلومات العيلة والمالية والخصوصية ما تغيرت. البحث المباشر بالمنتجات والذكاء الاصطناعي بعده مش مكتمل.")}
    <a href={import.meta.env.BASE_URL+"#/"} className="ms-auto shrink-0 font-bold underline">{display("Current homepage","الصفحة الحالية")}</a>
   </footer>
  </div>
 </div>;
}
function SmallEmpty({children}:{children:ReactNode}){
 return <p className="mt-4 rounded-xl bg-[#F6F9F4] p-4 text-sm leading-relaxed text-[#718583]">{children}</p>;
}
