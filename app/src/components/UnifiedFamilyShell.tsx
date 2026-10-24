import {Link} from "@tanstack/react-router";
import {Languages,MessageCircle,Settings2,UsersRound} from "lucide-react";
import type {CSSProperties,ReactNode} from "react";
import {useI18n} from "@/lib/i18n";
import {areaFromRoute,currentRoutePath,familyDestinations,type FamilyArea} from "@/lib/familyNavigation";
import {Logo} from "./Logo";
import {ConnectivityNotice} from "./ConnectivityNotice";
import {RhythmPageHeader} from "./RhythmPageHeader";
import "./adventureWorldSkin.css";
import {LocalSaveNotice} from "./LocalSaveNotice";

// Exactly three approved destinations; unfinished discovery and circles
// experiences are retired, not kept behind an overflow menu.
export function UnifiedFamilyShell({children,title,homeLayout=false,shopping=false}:{
 children:ReactNode;title?:string;homeLayout?:boolean;shopping?:boolean
}){
 const {lang,setLang}=useI18n();const ar=lang==="ar";
 const location=currentRoutePath();
 const area:FamilyArea=homeLayout?"today":areaFromRoute(location);
 // Shopping is an optional contextual tool, not a primary area.
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
   <p className="mb-7 px-2 text-xs font-medium leading-relaxed text-[#6A8276]">{text("One family. One rhythm.","عيلة واحدة، وإيقاع واحد.")}</p>
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
   <Link to="/advisor" className="mt-4 flex min-h-12 items-center gap-3 rounded-2xl border border-[#E3DBEC] bg-[#F9F4FE] px-3 text-sm font-semibold text-[#6D528A] focus-visible:ring-2">
    <MessageCircle className="size-5"/>{text("Ask Dabberna","اسأل دبّرنا")}
   </Link>
   <Link to="/about" className="mt-auto mb-2 px-3 py-2 text-xs text-[#637F73] underline underline-offset-2">{text("About & privacy","حول دبّرنا والخصوصية")}</Link>
   <Link to="/space" className="flex min-h-12 items-center gap-2 rounded-2xl border border-[#DCEADF] bg-white/80 px-3 text-xs font-semibold text-[#386E57] focus-visible:ring-2">
    <UsersRound className="size-[18px] text-[#288966]"/>{text("Family & settings","العائلة والإعدادات")}
   </Link>
  </aside>
  <div className="flex min-w-0 flex-1 flex-col">
   <header className="pt-safe sticky top-0 z-30 flex h-[68px] shrink-0 items-center justify-between gap-3 border-b border-[#DAEBDF] bg-[#FAFEF9]/95 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
    <Link to="/" aria-label={text("Dabberna home","الصفحة الرئيسية لدبّرنا")}
     className="inline-flex rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#AF7B9B] lg:hidden"><Logo/></Link>
    <span className="hidden text-xs font-bold tracking-wide text-[#648373] lg:block">
     {text("Understand · Prepare · Decide · Live","نفهم · نتحضّر · نقرّر · نعيش")}
    </span>
    <div className="ms-auto flex items-center gap-2">
     <Link to="/advisor" aria-label={text("Ask Dabberna","اسأل دبّرنا")}
       className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-[#E6D6ED] bg-[#F6EEFC] px-3 text-xs font-bold text-[#79569A] focus-visible:ring-2">
       <MessageCircle className="size-4"/><span className="hidden min-[370px]:inline">{text("Ask","اسأل")}</span>
     </Link>
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
    {!homeLayout&&<RhythmPageHeader path={location} {...(title?{title}:{})}/>}
    {homeLayout&&title&&<h1 className="sr-only">{title}</h1>}
    {children}
   </main>
   <footer className="pb-24 text-center text-xs text-[#678576] lg:hidden">
    <Link to="/about" className="inline-block min-h-10 px-3 py-3 underline underline-offset-2">{text("About & privacy","حول دبّرنا والخصوصية")}</Link>
   </footer>
  </div>
  <nav aria-label={mobileName}
   className="pb-safe fixed inset-x-0 bottom-0 z-40 grid grid-cols-3 border-t border-[#D1E9D8] bg-[#F9FFF9]/95 px-1 pt-2 shadow-[0_-10px_30px_-20px_rgba(38,91,60,.16)] backdrop-blur-xl lg:hidden">
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
  <Link to="/advisor" aria-label={text("Ask Dabberna anywhere","اسأل دبّرنا من أي مكان")}
   className="fixed bottom-[calc(5.25rem+env(safe-area-inset-bottom))] end-3 z-30 grid size-12 place-items-center rounded-full border-2 border-white bg-[#398C68] text-white shadow-[0_10px_24px_-8px_rgba(32,89,66,.5)] transition hover:scale-105 focus-visible:ring-2 focus-visible:ring-[#358E6A] lg:bottom-6 lg:end-6">
   <MessageCircle className="size-5"/><span className="sr-only">{text("Ask Dabberna","اسأل دبّرنا")}</span>
  </Link>
 </div>;
}
