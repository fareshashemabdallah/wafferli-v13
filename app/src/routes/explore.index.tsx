import {createFileRoute,Link} from "@tanstack/react-router";
import {ArrowRight,ArrowUpRight,CalendarHeart,ChevronDown,Compass,Gift,HeartHandshake,MapPin,MessageSquareHeart,ShoppingBag,ShoppingBasket,Stethoscope,Sun,UtensilsCrossed} from "lucide-react";
import {AppShell} from "@/components/AppShell";
import {PlanContextBanner} from "@/components/PlanContextBanner";
import {useI18n} from "@/lib/i18n";
import {useLocalState} from "@/lib/storage";
import {defaultFamilyPreferences} from "@/lib/familyPreferences";
import {externalMapLink} from "@/lib/decisionJourney";

export const Route=createFileRoute("/explore/")({
 head:()=>({meta:[{title:"Discover — Dabberna"},{name:"description",content:"Discover thoughtful outings, gifts, products and services that fit your life, family and budget."}]}),
 component:Explore
});
function Explore(){
 const {lang}=useI18n(),ar=lang==="ar";
 const [prefs]=useLocalState("familyPreferences",defaultFamilyPreferences);
 const city=prefs.city?.trim()||"Amman";
 const more=[
  {en:"Places & everyday life",ar:"أماكن وحياتنا اليومية",options:[
   {to:"/explore/restaurants" as const,Icon:UtensilsCrossed,en:"Restaurants & cafés",ar:"مطاعم وكافيهات"},
   {to:"/explore/services" as const,Icon:Stethoscope,en:"Find the right service",ar:"ابحث عن الخدمة المناسبة"}
  ]},
  {en:"Shopping & planning",ar:"المشتريات والتخطيط",options:[
   {to:"/explore/shopping" as const,Icon:ShoppingBasket,en:"My basket",ar:"سلّتي"},
   {to:"/calendar" as const,Icon:CalendarHeart,en:"Family calendar",ar:"تقويم العائلة"}
  ]},
  {en:"People you trust",ar:"أشخاص تثق بهم",options:[
   {to:"/community" as const,Icon:HeartHandshake,en:"Family & Friends Circles",ar:"دوائر العائلة والأصدقاء"},
   {to:"/experience" as const,Icon:MessageSquareHeart,en:"Community experiences",ar:"تجارب المجتمع"}
  ]}
 ];
 return <AppShell title={ar?"اكتشف":"Discover"}>
  <p className="mb-5 max-w-xl text-sm leading-relaxed text-muted-foreground">{ar?"أفكار وتجارب وخيارات تناسبك… مش بس الأرخص.":"For good days, thoughtful gifts and better everyday choices."}</p>
  <PlanContextBanner/>
  <section className="relative isolate overflow-hidden rounded-[1.85rem] bg-gradient-to-br from-[#E4EEE3] via-[#EDF1E9] to-[#F6EEE1] px-5 pb-5 pt-6 sm:px-7 sm:pb-7 sm:pt-7">
   <div className="pointer-events-none absolute -end-14 -top-10 size-48 rounded-full border-[26px] border-white/40" aria-hidden="true"/>
   <div className="relative">
    <span className="section-eyebrow">{ar?"لحظات تستاهل":"EXPERIENCES WORTH HAVING"}</span>
    <Sun className="mt-4 size-9 text-[#A9825A]" strokeWidth={1.4} aria-hidden="true"/>
    <h2 className="mt-2 max-w-xs text-[1.8rem] font-semibold leading-tight text-ink sm:text-4xl">{ar?"خلّي الطلعة ذكرى حلوة":"Make the next outing memorable"}</h2>
    <p className="mt-3 max-w-sm text-sm leading-6 text-[#52695D]">{ar?"اختار وقت حلو مع العائلة أو الأصدقاء، وفق اهتماماتكم وميزانيتكم.":"Find something to enjoy together, based on your needs and comfortable budget."}</p>
    <Link to="/explore/together" className="mt-5 inline-flex min-h-12 items-center gap-2 rounded-full bg-brand px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#254C3D]">
     {ar?"خطّط لطلعة":"Plan an outing"} <ArrowRight className="size-4 rtl:rotate-180"/>
    </Link>
   </div>
  </section>
  <div className="mt-3 grid grid-cols-2 gap-3">
   <Link to="/explore/smartbuy" className="soft-action flex min-h-43 flex-col justify-between bg-[#FCF1E9] p-4 sm:min-h-48 sm:p-5">
    <span className="grid size-11 place-items-center rounded-[.9rem] bg-white/80 text-[#AD806A]"><ShoppingBag className="size-5"/></span>
    <span><span className="block text-base font-semibold text-ink">{ar?"اشتري بذكاء":"Buy wisely"}</span><span className="mt-1 block text-xs leading-relaxed text-muted-foreground">{ar?"قارن القيمة قبل السعر.":"Compare value, not just price."}</span></span>
   </Link>
   <Link to="/occasions" className="soft-action flex min-h-43 flex-col justify-between bg-[#EEF0E9] p-4 sm:min-h-48 sm:p-5">
    <span className="grid size-11 place-items-center rounded-[.9rem] bg-white/80 text-[#678672]"><Gift className="size-5"/></span>
    <span><span className="block text-base font-semibold text-ink">{ar?"احتفل بمحبة":"Celebrate well"}</span><span className="mt-1 block text-xs leading-relaxed text-muted-foreground">{ar?"خطط لهدية أو مناسبة.":"Plan a thoughtful occasion."}</span></span>
   </Link>
  </div>
  <section className="mt-7" aria-label={ar?"استكشف المزيد":"More possibilities"}>
   <p className="section-eyebrow">{ar?"كل شي بمكانه":"MORE, WHEN YOU NEED IT"}</p>
   <h2 className="mt-1 text-xl font-semibold">{ar?"وغير هيك؟":"Explore at your pace"}</h2>
   <div className="mt-3 space-y-2.5">
    {more.map(group=><details key={group.en} className="group editorial-card overflow-hidden">
     <summary className="flex min-h-15 cursor-pointer items-center justify-between gap-3 px-4 py-3 text-sm font-semibold">
      {ar?group.ar:group.en}<ChevronDown className="size-4 text-brand transition group-open:rotate-180"/>
     </summary>
     <div className="space-y-1 border-t border-border/75 px-2 py-2">
      {group.options.map(({to,Icon,en,ar:arabic})=><Link to={to} key={to} className="flex min-h-12 items-center gap-3 rounded-xl px-3 text-sm font-medium text-brand hover:bg-[#EFF5ED]">
        <Icon className="size-4"/><span className="flex-1">{ar?arabic:en}</span><ArrowUpRight className="size-4"/>
      </Link>)}
     </div>
    </details>)}
   </div>
  </section>
  <section className="mt-5 flex items-start gap-3 rounded-[1.35rem] bg-[#E9EFE6] p-4 sm:p-5">
   <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white/80 text-brand"><MapPin className="size-5"/></span>
   <div className="min-w-0 flex-1">
    <h3 className="text-sm font-semibold">{ar?"قريب منك":"See what's around you"}</h3>
    <a href={externalMapLink("outing",city)} target="_blank" rel="noopener noreferrer"
     className="mt-2 inline-flex min-h-9 items-center gap-1.5 text-sm font-semibold text-brand underline-offset-2 hover:underline">
      {ar?"شوف الأنشطة على الخريطة":"Explore activities on the map"} <ArrowUpRight className="size-4"/>
    </a>
    <p className="mt-1 text-xs text-muted-foreground">{ar?"البحث يتم حسب المدينة، من دون مشاركة بيانات العائلة.":"Opens an external map using only your city."}</p>
   </div>
  </section>
 </AppShell>;
}
