import {Link} from "@tanstack/react-router";
import {ChevronRight,Info,Languages,Plus,UsersRound} from "lucide-react";
import type {CSSProperties,ReactNode} from "react";
import {useI18n} from "@/lib/i18n";
import {sampleMembers,type Member} from "@/lib/money";
import {realFamilyMembers} from "@/lib/familySetup";
import {useLocalState} from "@/lib/storage";
import {currentRoutePath,areaFromRoute,destination,familyDestinations,familyFollowUps,type FamilyArea} from "@/lib/familyNavigation";
import {Logo} from "./Logo";
import {ConnectivityNotice} from "./ConnectivityNotice";
import {LocalSaveNotice} from "./LocalSaveNotice";

const descriptions:Record<FamilyArea,{en:string;ar:string}>={
 today:{en:"Your family day, plans, money and moments — together.",ar:"يوم العائلة وخططها ومالها ولحظاتها، بمكان واحد."},
 ask:{en:"Get a useful next step using the family information you've chosen to save.",ar:"خطوة عملية اعتماداً على المعلومات العائلية التي اخترت حفظها."},
 plans:{en:"Turn family decisions into plans, budgets and calendar moments.",ar:"حوّل قرارات العائلة إلى خطط وميزانيات ومناسبات."},
 money:{en:"Plan confidently, then connect spending choices to your family plans.",ar:"خطّط للمصروف بثقة واربط قرارات الشراء بخطط العائلة."},
 shopping:{en:"Save family wishes, explore ideas and compare prices you personally check.",ar:"احفظ رغبات العائلة واستكشف الأفكار وقارن الأسعار التي تتحقق منها."},
 calendar:{en:"Make time for birthdays, occasions and shared family plans.",ar:"خصص وقتاً للميلاد والمناسبات وخطط العائلة المشتركة."}
};
const shortcutRoutes=[
 {to:"/space" as const,en:"Family & settings",ar:"العائلة والإعدادات"},
 {to:"/explore/weekend" as const,en:"Family outings",ar:"نزهات العائلة"},
 {to:"/explore/market" as const,en:"Explore products",ar:"استكشف المنتجات"},
 {to:"/explore/shopping" as const,en:"My Basket",ar:"سلّتي"},
 {to:"/occasions" as const,en:"Occasions",ar:"المناسبات"}
];
export function UnifiedFamilyShell({children,title,homeLayout=false,shopping=false}:{
 children:ReactNode;title?:string;homeLayout?:boolean;shopping?:boolean
}){
 const {lang,setLang}=useI18n();const ar=lang==="ar";
 const [members]=useLocalState<Member[]>("members",sampleMembers());
 const actualMembers=realFamilyMembers(members);
 const path=currentRoutePath();
 const area:FamilyArea=shopping?"shopping":homeLayout?"today":areaFromRoute(path);
 const current=destination(area);
 const related=familyFollowUps[area].map(destination);
 const actionLabel=ar?"استمر مع دبّرنا":"Continue with Dabberna";
 const text=(en:string,arabic:string)=>ar?arabic:en;
 const colors={
  "--family-accent":current.accent,
  "--family-soft":current.soft
 } as CSSProperties;
 const navName=shopping?text("Family navigation","التنقل العائلي"):text("Main","التنقل الرئيسي");
 const mobileName=shopping?text("Shopping mobile navigation","تنقل الهاتف"):text("Main","التنقل الرئيسي");
 const largeLinkClass="group flex min-h-12 items-center gap-3 rounded-2xl border border-transparent px-3 text-[13px] font-semibold transition hover:bg-[#FFF0F4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#AA75A6] focus-visible:ring-offset-2";
 return <div dir={ar?"rtl":"ltr"} style={colors} className="min-h-dvh bg-[#FFF9F8] text-[#23334A] lg:flex">
  <a href="#dabberna-main-content" className="sr-only focus:not-sr-only focus:fixed focus:start-3 focus:top-3 focus:z-[100] focus:rounded-xl focus:bg-white focus:p-3">
   {text("Skip to main content","انتقل إلى المحتوى الرئيسي")}
  </a>
  <aside className="sticky top-0 hidden h-dvh w-[230px] shrink-0 flex-col overflow-y-auto border-e border-[#F0E5E9] bg-white/90 px-4 pb-5 pt-7 shadow-[12px_0_32px_-30px_rgba(25,25,51,.1)] lg:flex">
   <Link to="/" aria-label={text("Dabberna home","الصفحة الرئيسية لدبّرنا")}
    className="mb-3 inline-flex items-center rounded-lg px-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#AA75A6]"><Logo/></Link>
   <p className="mb-7 px-2 text-xs leading-relaxed text-[#7A8090]">
    {text("Our family. Happier together. Spend wisely, live well.","عيلتنا أحلى سوا. اصرف بذكاء وعِش براحة.")}
   </p>
   <nav aria-label={navName} className="space-y-1.5">
    {familyDestinations.map(item=>{
     const Icon=item.icon,active=item.id===area;
     return <Link key={item.id} to={item.to} aria-current={active?"page":undefined}
      className={largeLinkClass+" "+(active?"shadow-sm":"text-[#586378]")}
      style={active?{color:item.accent,backgroundColor:item.soft,borderColor:"rgba(242,224,230,.7)"}:{}}
      >
      <span className="grid size-9 shrink-0 place-items-center rounded-xl" style={{backgroundColor:active?"white":item.soft}}>
       <Icon className="size-5" aria-hidden="true" style={{color:item.accent}}/>
      </span>
      <span>{ar?item.ar:item.en}</span>
      {active&&<span aria-hidden="true" className="ms-auto size-1.5 rounded-full" style={{backgroundColor:item.accent}}/>}
     </Link>;
    })}
   </nav>
   <div className="mt-5 border-t border-[#F4EAEB] pt-4">
    <p className="mb-2 px-3 text-[11px] font-bold uppercase tracking-wide text-[#838797]">{text("More for your family","المزيد لعائلتك")}</p>
    {shortcutRoutes.map(x=><Link key={x.to} to={x.to} className="flex min-h-9 items-center rounded-xl px-3 text-xs font-medium text-[#667186] hover:bg-[#FFF0F4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#AA75A6]">{ar?x.ar:x.en}</Link>)}
   </div>
   <section aria-label={text("Family members","أفراد العائلة")} className="mt-5 border-t border-[#F4EAEB] pt-4">
    <h2 className="mb-3 px-3 text-xs font-bold text-[#7A8190]">{text("Family Members","أفراد العائلة")}</h2>
    <Link to="/space" className="flex min-h-10 items-center gap-2 rounded-2xl px-3 text-xs font-semibold hover:bg-[#FFF2F5] focus-visible:ring-2">
     <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[#FCE6EA]">🏡</span>{text("All Family","العائلة كلها")}
    </Link>
    {actualMembers.slice(0,6).map(m=><Link key={m.id} to="/space" className="flex min-h-10 items-center gap-2 rounded-2xl px-3 text-xs font-medium hover:bg-[#FFF2F5] focus-visible:ring-2">
     <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[#FCE5ED] font-bold text-[#C83D78]">{m.name.slice(0,1)}</span>
     <span className="truncate">{m.name}</span>
    </Link>)}
    <Link to="/space" className="mt-2 flex min-h-10 items-center gap-2 rounded-xl border border-[#F0E5E8] px-3 text-xs font-semibold text-[#5D667B] focus-visible:ring-2">
     <Plus className="size-4"/>{text("Manage family","إدارة العائلة")}
    </Link>
   </section>
   <Link to="/about" className="mt-auto inline-flex min-h-11 items-center gap-2 px-3 pt-4 text-xs font-semibold text-[#737C89] focus-visible:ring-2">
    <Info className="size-4"/>{text("Privacy & about","الخصوصية وعن دبّرنا")}
   </Link>
  </aside>
  <div className="flex min-w-0 flex-1 flex-col">
   <header className="pt-safe sticky top-0 z-30 flex h-[70px] shrink-0 items-center justify-between gap-3 border-b border-[#F2E6E9] bg-[#FFFDFC]/95 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
    <Link to="/" aria-label={text("Dabberna home","الصفحة الرئيسية لدبّرنا")} className="inline-flex rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#AA75A6] lg:hidden"><Logo/></Link>
    <div className="hidden min-w-0 items-center gap-2 text-xs font-semibold text-[#6E7688] lg:flex">
     <span className="grid size-9 place-items-center rounded-xl" style={{background:current.soft}}><current.icon className="size-5" style={{color:current.accent}}/></span>
     <span>{text("Dabberna / "+current.en,"دبّرنا / "+current.ar)}</span>
    </div>
    <div className="ms-auto flex items-center gap-2">
     <Link to="/explore" className="hidden min-h-11 items-center rounded-full bg-[#FFF5F6] px-4 text-xs font-semibold text-[#58647A] focus-visible:ring-2 sm:inline-flex">{text("Discover","اكتشف")}</Link>
     <button type="button" onClick={()=>setLang(ar?"en":"ar")} aria-label={text("Switch to Arabic","Switch to English")}
      className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-[#F0E4E9] bg-white px-3 text-xs font-bold text-[#39475F] shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#AA75A6]">
      <Languages className="size-4"/>{ar?"English":"العربية"}
     </button>
     <Link to="/space" aria-label={text("Family settings","العائلة والإعدادات")}
      className="grid size-11 place-items-center rounded-full bg-[#FFE7EF] text-[#CD367B] focus-visible:ring-2">
      <UsersRound className="size-5"/>
     </Link>
    </div>
   </header>
   <main id="dabberna-main-content" tabIndex={-1}
    className={"mx-auto w-full min-w-0 flex-1 px-3 pb-32 pt-4 sm:px-5 sm:pt-6 lg:px-7 lg:pb-12 "+(homeLayout||shopping?"max-w-[1490px]":"max-w-[1100px]")}>
    <ConnectivityNotice/><LocalSaveNotice/>
    {title&&<header className="mb-5 rounded-[1.65rem] border border-[#F1E6E8] bg-white/90 px-5 py-5 shadow-[0_14px_38px_-34px_rgba(47,38,66,.2)] sm:px-6">
     <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide" style={{color:current.accent}}>
      <span className="size-2 rounded-full" style={{backgroundColor:current.accent}}/>{text("One family · one place","عائلة واحدة · مكان واحد")}
     </div>
     <h1 className="mt-2 text-[1.65rem] font-extrabold leading-tight tracking-tight text-[#23334A] sm:text-[2.2rem]">{title}</h1>
     <p className="mt-1 max-w-2xl text-sm leading-relaxed text-[#747D90]">{ar?descriptions[area].ar:descriptions[area].en}</p>
    </header>}
    {children}
    {!homeLayout&&<section aria-label={text("Connected family actions","خطوات عائلية مترابطة")} className="mt-7 rounded-[1.5rem] border border-[#F0E5E9] bg-white/90 p-4 sm:p-5">
     <div className="flex flex-wrap items-center justify-between gap-2">
      <h2 className="text-sm font-extrabold text-[#29364D]">{actionLabel}</h2>
      <p className="text-[11px] text-[#85899A]">{text("Your saved family information remains available as you move between sections.","بياناتك العائلية المحفوظة تبقى متاحة بين الأقسام.")}</p>
     </div>
     <nav aria-label={text("Related family actions","خطوات العائلة التالية")} className="mt-3 grid gap-2 sm:grid-cols-3">
      {related.map(item=>{
       const Icon=item.icon;
       return <Link key={item.id} to={item.to} className="flex min-h-14 items-center gap-2 rounded-[1rem] border border-[#F0E8ED] bg-[#FFFBFC] px-3 text-xs font-bold text-[#38465A] transition hover:-translate-y-0.5 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#AA75A6]">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl" style={{backgroundColor:item.soft}}><Icon className="size-4" style={{color:item.accent}}/></span>
        <span className="flex-1">{ar?item.ar:item.en}</span><ChevronRight className="size-4 text-[#99A0AA] rtl:rotate-180"/>
       </Link>;
      })}
     </nav>
    </section>}
   </main>
  </div>
  <nav aria-label={mobileName} className="pb-safe fixed inset-x-0 bottom-0 z-40 grid grid-cols-6 border-t border-[#F2E6E9] bg-white/95 px-1 pt-2 shadow-[0_-10px_30px_-20px_rgba(38,29,46,.2)] backdrop-blur-xl lg:hidden">
   {familyDestinations.map(item=>{
    const Icon=item.icon,active=item.id===area;
    return <Link key={item.id} to={item.to} aria-current={active?"page":undefined}
     className="group flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl px-0.5 text-xs font-semibold leading-tight transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#AA75A6]"
     style={active?{color:item.accent,background:item.soft}:{color:"#677287"}}>
     <Icon className="size-[19px]" aria-hidden="true"/>
     <span className="text-[10px]">{ar?item.shortAr:item.shortEn}</span>
    </Link>;
   })}
  </nav>
 </div>;
}
