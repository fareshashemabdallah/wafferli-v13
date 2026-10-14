import { Link } from "@tanstack/react-router";
import { Compass, Home, Info, Languages, Sparkles, UserRound, Wallet } from "lucide-react";
import type { ReactNode } from "react";
import { useI18n, type Key } from "@/lib/i18n";
import { Logo } from "./Logo";

const tabs: { to: "/" | "/explore" | "/money" | "/space"; key: Key; icon: typeof Home; exact?: boolean }[] = [
 {to:"/",key:"home",icon:Home,exact:true},
 {to:"/explore",key:"explore",icon:Compass},
 {to:"/money",key:"money",icon:Wallet},
 {to:"/space",key:"space",icon:UserRound}
];

function LangToggle(){
 const {lang,setLang}=useI18n();
 return <button type="button" onClick={()=>setLang(lang==="en"?"ar":"en")}
  className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-[#DDE5DB] bg-white/80 px-3 text-xs font-semibold text-brand shadow-sm transition hover:bg-white"
  aria-label={lang==="en"?"Switch to Arabic":"Switch to English"}>
  <Languages className="size-4" aria-hidden="true"/>{lang==="en"?"العربية":"English"}
 </button>;
}

export function AppShell({children,title}:{children:ReactNode;title?:string}){
 const {t,lang}=useI18n();
 return <div className="min-h-dvh md:flex">
  <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-e border-[#E4E9E0] bg-[#FFFEFA]/95 px-5 pb-6 pt-8 md:flex">
   <Link to="/" aria-label="Dabberna home" className="inline-flex"><Logo className="scale-105 origin-left"/></Link>
   <p className="mt-3 max-w-44 text-xs leading-relaxed text-muted-foreground">{lang==="ar"?"أنفق بذكاء، وعِش براحة.":"Spend wisely. Live well."}</p>
   <div className="mt-8 premium-divider"/>
   <nav className="mt-5 flex flex-col gap-1.5" aria-label="Main">
    {tabs.map(({to,key,icon:Icon,exact})=><Link key={to} to={to} activeOptions={exact?{exact:true}:{}}
      className="flex min-h-12 items-center gap-3 rounded-2xl px-3 text-sm font-semibold text-muted-foreground transition hover:bg-[#F1F5EF] data-[status=active]:bg-[#E6F0E7] data-[status=active]:text-brand">
      <Icon className="size-5" aria-hidden="true"/>{t(key)}
    </Link>)}
   </nav>
   <div className="mt-6 rounded-[1.4rem] bg-[#EDF3EA] p-4">
    <Sparkles className="size-5 text-brand" aria-hidden="true"/>
    <p className="mt-2 text-sm font-semibold">{lang==="ar"?"ساعدني أختار":"Help me decide"}</p>
    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{lang==="ar"?"تحقق من قرار إنفاق قبل الالتزام به.":"Check a spending decision before you commit."}</p>
    <Link to="/advisor" className="mt-3 inline-flex min-h-10 items-center rounded-full bg-brand px-4 text-xs font-semibold text-white">{lang==="ar"?"ابدأ":"Get started"} →</Link>
   </div>
   <div className="mt-auto flex items-center justify-between gap-2">
    <Link to="/about" className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-brand"><Info className="size-4"/>{t("about")}</Link>
    <LangToggle/>
   </div>
  </aside>

  <div className="flex min-w-0 flex-1 flex-col">
   <header className="pt-safe sticky top-0 z-30 border-b border-[#E4E8DD]/80 bg-[#F9F8F4]/95 backdrop-blur-xl md:hidden">
    <div className="mx-auto flex h-[66px] max-w-4xl items-center justify-between gap-2 px-4">
     <Link to="/" aria-label="Dabberna home" className="inline-flex min-w-0"><Logo/></Link>
     <div className="flex shrink-0 items-center gap-2">
      <Link to="/advisor" aria-label={t("advisor")} title={t("advisor")}
       className="grid size-11 place-items-center rounded-full border border-[#DDE5DB] bg-[#EAF1E8] text-brand transition hover:bg-white">
       <Sparkles className="size-5" aria-hidden="true"/>
      </Link>
      <LangToggle/>
     </div>
    </div>
   </header>
   <main className="mx-auto w-full max-w-4xl flex-1 px-4 pb-32 pt-5 sm:px-6 sm:pt-7 md:px-8 md:pb-12 md:pt-10">
    {title&&<h1 className="mb-5 text-[1.8rem] font-semibold tracking-tight text-ink sm:text-4xl">{title}</h1>}
    {children}
   </main>
  </div>

  <nav aria-label="Main" className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-[#DEE6DD] bg-[#FFFEFC]/95 px-2 pt-2 shadow-[0_-12px_28px_-26px_rgba(42,68,47,.36)] backdrop-blur-xl md:hidden">
   <div className="mx-auto grid max-w-xl grid-cols-4 gap-1">
    {tabs.map(({to,key,icon:Icon,exact})=><Link key={to} to={to} activeOptions={exact?{exact:true}:{}}
      className="group flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl px-1 text-[11px] font-medium text-[#708174] transition hover:bg-[#F2F6F0] data-[status=active]:bg-[#ECF4EC] data-[status=active]:font-semibold data-[status=active]:text-brand">
      <Icon className="size-[21px]" aria-hidden="true"/><span>{t(key)}</span>
    </Link>)}
   </div>
  </nav>
 </div>;
}
export function PilotBadge({children="Sample"}:{children?:ReactNode}){
 return <span className="inline-flex items-center rounded-full bg-warn px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-warn-foreground">{children}</span>;
}
export function Notice({children}:{children:ReactNode}){
 return <div className="rounded-2xl border border-[#DAE6D8] bg-[#F0F6EC] p-4 text-sm leading-relaxed text-ink">{children}</div>;
}
