import {Link} from "@tanstack/react-router";
import {ChevronDown,Languages,MoreHorizontal,Settings2,UsersRound} from "lucide-react";
import type {CSSProperties,ReactNode} from "react";
import {useI18n} from "@/lib/i18n";
import {areaFromRoute,currentRoutePath,familyDestinations,type FamilyArea} from "@/lib/familyNavigation";
import {Logo} from "./Logo";
import {ConnectivityNotice} from "./ConnectivityNotice";
import {AdventurePageHeader} from "./AdventurePageHeader";
import "./adventureWorldSkin.css";
import {LocalSaveNotice} from "./LocalSaveNotice";

// Exactly four main destinations for all families.
// Shopping and specialist tools remain accessible under a single optional menu.
// Page-specific links are reserved for tasks that actually need the next tool.
const tools=[
 {to:"/explore/smartbuy" as const,en:"Shopping & Wishlist",ar:"المشتريات والرغبات"},
 {to:"/explore/weekend" as const,en:"Outings & places",ar:"الطلعات والأماكن"},
 {to:"/explore/market" as const,en:"Find products",ar:"البحث عن المنتجات"},
 {to:"/explore/shopping" as const,en:"Shopping basket",ar:"سلّة المشتريات"},
 {to:"/community" as const,en:"Family & Friends Circles",ar:"دوائر العائلة والأصحاب"},
 {to:"/about" as const,en:"About & privacy",ar:"حول دبّرنا والخصوصية"}
];
export function UnifiedFamilyShell({children,title,homeLayout=false,shopping=false}:{
 children:ReactNode;title?:string;homeLayout?:boolean;shopping?:boolean
}){
 const {lang,setLang}=useI18n();const ar=lang==="ar";
 const location=currentRoutePath();
 const area:FamilyArea=homeLayout?"today":areaFromRoute(location);
 // Shopping is an optional tool, not part of any of the four pillars.
 const secondaryShopping=shopping||(location.startsWith("/explore/")&&!location.startsWith("/explore/weekend")&&!location.startsWith("/explore/together"));
 const text=(en:string,arabic:string)=>ar?arabic:en;
 const accent=familyDestinations.find(x=>x.id===area)!;
 const colors={"--family-accent":accent.accent,"--family-soft":accent.soft} as CSSProperties;
 const navName=text("Main","التنقل الرئيسي");
 const mobileName=text("Main","التنقل الرئيسي");
 return <div dir={ar?"rtl":"ltr"} style={colors}
  className="dabberna-app dabberna-adventure-skin min-h-dvh bg-[#F7FBF4] text-[#234338] lg:flex">
  <a href="#dabberna-main-content"
   className="sr-only focus:not-sr-only focus:fixed focus:start-3 focus:top-3 focus:z-[100] focus:rounded-xl focus:bg-white focus:p-3">
   {text("Skip to main content","انتقل إلى المحتوى الرئيسي")}
  </a>
  <aside className="sticky top-0 hidden h-dvh w-[228px] shrink-0 flex-col border-e border-[#D6E9DA] bg-[linear-gradient(175deg,#F4FFF5,#FFFFFF_45%,#F8FBF1)] px-4 pb-5 pt-7 lg:flex">
   <Link to="/" aria-label={text("Dabberna home","الصفحة الرئيسية لدبّرنا")}
    className="mb-3 inline-flex items-center rounded-lg px-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#AF7B9B]"><Logo/></Link>
   <p className="mb-7 px-2 text-xs font-medium leading-relaxed text-[#6A8276]">{text("Our family, happier together.","عيلتنا أحلى سوا.")}</p>
   <nav aria-label={navName} className="space-y-1.5">
    {familyDestinations.map(item=>{
     const Icon=item.icon,active=!secondaryShopping&&item.id===area;
     return <Link key={item.id} to={item.to} aria-current={active?"page":undefined}
      className="group flex min-h-12 items-center gap-3 rounded-2xl px-3 text-[13px] font-semibold text-[#4E6A60] transition hover:bg-[#E4F4E9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#469F80] focus-visible:ring-offset-2"
      style={active?{background:"#DDF2E2",color:"#185D42",boxShadow:"inset 0 0 0 1px #B9D9C4"}:{}}>
      <Icon className="size-5 shrink-0" style={{color:active?item.accent:"#6D7788"}}/>
      <span className="flex-1">{ar?item.ar:item.en}</span>
      {active&&<span aria-hidden="true" className="size-1.5 rounded-full" style={{background:item.accent}}/>}
     </Link>;
    })}
   </nav>
   <details className="group mt-5 border-t border-[#DAECDF] pt-3">
    <summary className="flex min-h-11 cursor-pointer items-center gap-2 rounded-xl px-3 text-xs font-semibold text-[#637084] hover:bg-[#F9F2F5]">
     {text("Other tools","أدوات أخرى")}<ChevronDown className="ms-auto size-4 transition group-open:rotate-180"/>
    </summary>
    <div className="mt-1 space-y-0.5">
     {tools.map(x=><Link key={x.to} to={x.to}
      className="flex min-h-10 items-center rounded-xl px-3 text-xs font-medium text-[#657083] hover:bg-[#FAF1F5] focus-visible:ring-2">
      {ar?x.ar:x.en}</Link>)}
    </div>
   </details>
   <Link to="/space" className="mt-auto flex min-h-12 items-center gap-2 rounded-2xl border border-[#DCEADF] bg-white/80 px-3 text-xs font-semibold text-[#386E57] focus-visible:ring-2">
    <UsersRound className="size-[18px] text-[#288966]"/>{text("Family & settings","العائلة والإعدادات")}
   </Link>
  </aside>
  <div className="flex min-w-0 flex-1 flex-col">
   <header className="pt-safe sticky top-0 z-30 flex h-[68px] shrink-0 items-center justify-between gap-3 border-b border-[#DAEBDF] bg-[#FAFEF9]/95 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
    <Link to="/" aria-label={text("Dabberna home","الصفحة الرئيسية لدبّرنا")}
     className="inline-flex rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#AF7B9B] lg:hidden"><Logo/></Link>
    <span className="hidden text-xs font-bold tracking-wide text-[#648373] lg:block">
     {text("Our family, one place","عائلتنا في مكان واحد")}
    </span>
    <div className="ms-auto flex items-center gap-2">
     <details className="group relative lg:hidden">
      <summary aria-label={text("More features","مميزات أخرى")} className="flex min-h-11 min-w-11 cursor-pointer list-none items-center justify-center rounded-full border border-[#F0E4E9] bg-white text-[#536277] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#AF7B9B]">
       <MoreHorizontal className="size-5"/>
      </summary>
      <div className="absolute end-0 top-12 z-50 w-[min(85vw,265px)] max-h-[65dvh] space-y-0.5 overflow-y-auto rounded-2xl border border-[#F0E4E9] bg-white p-2 shadow-xl">
       {tools.map(x=><Link key={x.to} to={x.to} className="flex min-h-11 items-center rounded-xl px-3 text-xs font-semibold text-[#536277] hover:bg-[#FFF0F4] focus-visible:ring-2">
        {ar?x.ar:x.en}</Link>)}
      </div>
     </details>
     <button type="button" onClick={()=>setLang(ar?"en":"ar")} aria-label={text("Switch to Arabic","Switch to English")}
      className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-[#F0E4E9] bg-white px-3 text-xs font-bold text-[#39475F] shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#AF7B9B]">
      <Languages className="size-4"/>{ar?"English":"العربية"}
     </button>
     <Link to="/space" aria-label={text("Family settings","العائلة والإعدادات")}
      className="grid size-11 place-items-center rounded-full bg-[#E2F3E7] text-[#288565] focus-visible:ring-2 lg:hidden">
      <Settings2 className="size-[19px]"/>
     </Link>
    </div>
   </header>
   <main id="dabberna-main-content" tabIndex={-1}
    className={"dabberna-page mx-auto w-full min-w-0 flex-1 px-3 pb-28 pt-4 sm:px-5 sm:pt-6 lg:px-7 lg:pb-12 "+(homeLayout||shopping?"max-w-[1430px]":"max-w-[1120px]")}>
    <ConnectivityNotice/><LocalSaveNotice/>
    {!homeLayout&&location!=="/money"&&<AdventurePageHeader path={location} {...(title?{title}:{})}/>}
    {homeLayout&&title&&<h1 className="sr-only">{title}</h1>}
    {children}
   </main>
  </div>
  <nav aria-label={mobileName}
   className="pb-safe fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-[#D1E9D8] bg-[#F9FFF9]/95 px-1 pt-2 shadow-[0_-10px_30px_-20px_rgba(38,91,60,.16)] backdrop-blur-xl lg:hidden">
   {familyDestinations.map(item=>{
    const Icon=item.icon,active=!secondaryShopping&&item.id===area;
    return <Link key={item.id} to={item.to} aria-current={active?"page":undefined}
     className="flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl px-0.5 text-xs font-semibold leading-tight transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#AF7B9B]"
     style={active?{color:"#185D42",background:"#DDF2E2"}:{color:"#678072"}}>
     <Icon className="size-[19px]" aria-hidden="true"/>
     <span className="text-[10px]">{ar?item.shortAr:item.shortEn}</span>
    </Link>;
   })}
  </nav>
 </div>;
}
