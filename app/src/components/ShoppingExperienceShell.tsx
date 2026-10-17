import type {ReactNode} from "react";
import {Link} from "@tanstack/react-router";
import {CalendarDays,Home,Languages,ShoppingBasket,Sparkles,UsersRound,Wallet,CalendarCheck2,Plus} from "lucide-react";
import {useI18n} from "@/lib/i18n";
import {useLocalState} from "@/lib/storage";
import {sampleMembers,type Member} from "@/lib/money";
import {realFamilyMembers} from "@/lib/familySetup";
import {Logo} from "./Logo";
import {ConnectivityNotice} from "./ConnectivityNotice";
import {LocalSaveNotice} from "./LocalSaveNotice";
const nav=[
 {to:"/" as const,en:"Today",ar:"اليوم",icon:Home},
 {to:"/advisor" as const,en:"Ask Dabberna",ar:"اسأل دبّرنا",icon:Sparkles},
 {to:"/plans" as const,en:"Our Plans",ar:"خططنا",icon:CalendarCheck2},
 {to:"/money" as const,en:"Money & Bills",ar:"المال والفواتير",icon:Wallet},
 {to:"/explore/smartbuy" as const,en:"Shopping & Wishlist",ar:"المشتريات والرغبات",icon:ShoppingBasket},
 {to:"/calendar" as const,en:"Family Calendar",ar:"تقويم العائلة",icon:CalendarDays}
];
export function ShoppingExperienceShell({children}:{children:ReactNode}){
 const {lang,setLang}=useI18n(),ar=lang==="ar";
 const [members]=useLocalState<Member[]>("members",sampleMembers());
 const [,setOwner]=useLocalState<string>("shoppingWishlistOwner","Sophia");
 const actual=realFamilyMembers(members);
 return <div dir={ar?"rtl":"ltr"} className="min-h-dvh bg-[#FFF9F8] text-[#202A47] lg:flex">
  <a href="#dabberna-main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:start-3 focus:z-[100] focus:rounded-xl focus:bg-white focus:p-3">{ar?"الانتقال إلى المحتوى":"Skip to content"}</a>
  <aside className="sticky top-0 hidden h-dvh w-[222px] shrink-0 flex-col border-e border-[#F2E6E8] bg-white/85 px-4 pb-5 pt-7 shadow-[12px_0_32px_-30px_rgba(25,25,51,.1)] lg:flex">
   <Link to="/" className="mb-9 inline-flex items-center px-2" aria-label={ar?"دبّرنا الرئيسية":"Dabberna home"}><Logo/></Link>
   <nav className="space-y-1.5" aria-label={ar?"التنقل العائلي":"Family navigation"}>
    {nav.map(({to,en,ar:arabic,icon:Icon})=><Link key={to} to={to}
     className={"flex min-h-12 items-center gap-3 rounded-2xl px-3 text-[13px] font-semibold transition hover:bg-[#FFF0F4] "+(to==="/explore/smartbuy"?"bg-[#FFE7ED] text-[#E62977]":"text-[#36465F]")}>
     <Icon className="size-5 shrink-0"/>{ar?arabic:en}</Link>)}
   </nav>
   <section className="mt-8 border-t border-[#F2EBED] pt-5" aria-label={ar?"أفراد العائلة":"Family members"}>
    <h2 className="mb-3 px-3 text-xs font-bold text-slate-500">{ar?"أفراد العائلة":"Family Members"}</h2>
    <button type="button" onClick={()=>setOwner("")} className="flex min-h-11 w-full items-center gap-2 rounded-2xl px-3 text-start text-xs font-semibold hover:bg-[#FFF2F5]">
     <span className="grid size-8 place-items-center rounded-full bg-[#FBE2E5] text-lg">🏡</span>{ar?"العائلة كلها":"All Family"}
    </button>
    {actual.slice(0,7).map(member=><button type="button" key={member.id} onClick={()=>setOwner(member.name)}
      className="flex min-h-11 w-full items-center gap-2 rounded-2xl px-3 text-start text-xs font-semibold hover:bg-[#FFF2F5]">
      <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[#FCE5ED] font-bold text-[#CE3675]">{member.name.trim().slice(0,1).toUpperCase()}</span>
      <span className="truncate">{member.name}</span>
     </button>)}
    <Link to="/space" className="mt-3 flex min-h-11 items-center gap-2 rounded-2xl border border-[#F3E6E9] px-3 text-xs font-semibold text-[#5D667B]">
     <Plus className="size-4"/>{ar?"إدارة أفراد العائلة":"Manage family"}</Link>
    <p className="mt-3 px-2 text-[10px] leading-relaxed text-slate-500">
     {ar?"اختيار الاسم يغيّر عنوان القائمة، وليس خصوصية سجلات الأسرة.":"Selecting a name changes the title, not ownership of shared records."}
    </p>
   </section>
   <Link to="/about" className="mt-auto px-3 pt-5 text-xs font-semibold text-slate-500">{ar?"الخصوصية والإعدادات":"Privacy & settings"}</Link>
  </aside>
  <div className="min-w-0 flex-1">
   <header className="sticky top-0 z-40 flex h-[70px] items-center justify-between gap-3 border-b border-[#F4E7EB] bg-[#FFFDFC]/95 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
    <Link to="/" className="lg:hidden" aria-label={ar?"دبّرنا الرئيسية":"Dabberna home"}><Logo/></Link>
    <div className="hidden min-w-0 items-center gap-2 text-xs font-semibold text-slate-500 lg:flex">
     <ShoppingBasket className="size-4 text-[#EC4385]"/>{ar?"دبّرنا · حياة عائلية أسعد":"Dabberna · family shopping made simpler"}
    </div>
    <div className="ms-auto flex items-center gap-2">
     <Link to="/explore/market" className="hidden min-h-10 items-center gap-2 rounded-full border border-[#F0E3E9] bg-white px-4 text-xs font-semibold text-[#536078] sm:inline-flex">
      {ar?"استكشاف المتاجر":"Discover shops"}</Link>
     <button type="button" aria-label={ar?"Switch to English":"Switch to Arabic"} onClick={()=>setLang(ar?"en":"ar")}
      className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-white px-3 text-xs font-bold shadow-sm ring-1 ring-[#EFE5E8]">
      <Languages className="size-4"/>{ar?"English":"العربية"}
     </button>
     <Link to="/space" aria-label={ar?"العائلة والإعدادات":"Family settings"} className="grid size-10 place-items-center rounded-full bg-[#FCE8EF] text-[#C92D71]"><UsersRound className="size-5"/></Link>
    </div>
   </header>
   <main id="dabberna-main-content" tabIndex={-1} className="mx-auto w-full max-w-[1490px] px-3 pb-28 pt-4 sm:px-5 lg:px-7 lg:pb-10">
    <ConnectivityNotice/><LocalSaveNotice/>
    {children}
   </main>
  </div>
  <nav aria-label={ar?"تنقل الهاتف":"Shopping mobile navigation"} className="pb-safe fixed inset-x-0 bottom-0 z-40 grid grid-cols-6 border-t border-[#F0E5EA] bg-white/95 px-1 pt-2 shadow-lg backdrop-blur-xl lg:hidden">
   {nav.map(({to,en,ar:arabic,icon:Icon})=><Link key={to} to={to} className={"flex min-h-[60px] flex-col items-center justify-center gap-1 px-0.5 text-center text-[9px] font-bold leading-tight "+(to==="/explore/smartbuy"?"text-[#EC3883]":"text-[#606C82]")}>
    <Icon className="size-[19px]"/><span>{ar?arabic:en==="Shopping & Wishlist"?"Shopping":en==="Ask Dabberna"?"Ask":en==="Our Plans"?"Plans":en==="Money & Bills"?"Money":en==="Family Calendar"?"Calendar":en}</span>
   </Link>)}
  </nav>
 </div>;
}
