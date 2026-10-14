import {createFileRoute,Link} from "@tanstack/react-router";
import {ArrowUpRight,CalendarHeart,Compass,Gift,HeartHandshake,MapPin,MessageSquareHeart,ShoppingBag,ShoppingBasket,Stethoscope,UtensilsCrossed} from "lucide-react";
import {AppShell} from "@/components/AppShell";
import {PlanContextBanner} from "@/components/PlanContextBanner";
import {useI18n} from "@/lib/i18n";
import {useLocalState} from "@/lib/storage";
import {defaultFamilyPreferences} from "@/lib/familyPreferences";
import {externalMapLink} from "@/lib/decisionJourney";

export const Route=createFileRoute("/explore/")({
 head:()=>({meta:[{title:"Discover — Dabberna"},{name:"description",content:"Choose an activity, compare purchases and find places or family services without long forms."}]}),
 component:Explore
});
function Explore(){
 const {lang}=useI18n(),ar=lang==="ar";
 const [prefs]=useLocalState("familyPreferences",defaultFamilyPreferences);
 const city=prefs.city?.trim()||"Amman";
 const primary=[
  {to:"/explore/together" as const,Icon:Compass,en:"Go out",ar:"نطلع ونستمتع",desc:"Find something enjoyable",arDesc:"نختار تجربة ممتعة"},
  {to:"/explore/smartbuy" as const,Icon:ShoppingBag,en:"Buy wisely",ar:"نشتري بذكاء",desc:"Compare value, not only price",arDesc:"نقارن القيمة مش بس السعر"},
  {to:"/occasions" as const,Icon:CalendarHeart,en:"Celebrate",ar:"نحتفل",desc:"Gifts, birthdays and moments",arDesc:"هدايا وأعياد ومناسبات"}
 ];
 const more=[
  {en:"Places & food",ar:"أماكن ومطاعم",options:[
   {to:"/explore/restaurants" as const,Icon:UtensilsCrossed,en:"Restaurants & cafés",ar:"مطاعم وكافيهات"},
   {to:"/explore/services" as const,Icon:Stethoscope,en:"Find a service",ar:"ابحث عن خدمة"}
  ]},
  {en:"Everyday essentials",ar:"الاحتياجات اليومية",options:[
   {to:"/explore/shopping" as const,Icon:ShoppingBasket,en:"My Basket",ar:"سلّتي"},
   {to:"/calendar" as const,Icon:CalendarHeart,en:"Calendar",ar:"التقويم"}
  ]},
  {en:"People & experiences",ar:"الأهل والأصدقاء",options:[
   {to:"/community" as const,Icon:HeartHandshake,en:"Family & Friends Circles",ar:"دوائر العائلة والأصدقاء"},
   {to:"/experience" as const,Icon:MessageSquareHeart,en:"Community Experiences",ar:"تجارب المجتمع"}
  ]}
 ];
 return <AppShell title={ar?"اكتشف":"Discover"}>
  <p className="text-sm text-muted-foreground">{ar?"شو حابّين تعملوا اليوم؟ اختاروا فكرة ومنكمل سوا.":"What would you like to do? Pick one thing to start."}</p>
  <div className="mt-4"><PlanContextBanner/></div>
  <div className="mt-4 grid gap-3 sm:grid-cols-3">
   {primary.map(({to,Icon,en,ar:arabic,desc,arDesc})=><Link to={to} key={to} className="group flex min-h-36 flex-col gap-2.5 rounded-2xl border border-border bg-white p-4 transition hover:border-brand/40 hover:shadow-sm">
    <span className="grid size-11 place-items-center rounded-xl bg-mint text-brand"><Icon className="size-5"/></span>
    <span className="block text-base font-semibold">{ar?arabic:en}</span>
    <span className="text-xs text-muted-foreground">{ar?arDesc:desc}</span>
   </Link>)}
  </div>
  <h2 className="mt-7 text-lg font-semibold">{ar?"كل ما تحتاجه في مكان واحد":"Explore more when you need it"}</h2>
  <div className="mt-3 space-y-2">
   {more.map(group=><details key={group.en} className="group rounded-2xl border border-border bg-white">
    <summary className="flex cursor-pointer list-none items-center justify-between gap-2 p-4 text-sm font-semibold text-ink [&::-webkit-details-marker]:hidden">
      {ar?group.ar:group.en}
      <span className="text-brand group-open:hidden">+</span><span className="hidden text-brand group-open:inline">−</span>
    </summary>
    <div className="space-y-1 border-t border-border px-2 py-2">
     {group.options.map(({to,Icon,en,ar:arabic})=><Link key={to} to={to} className="flex min-h-12 items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-brand hover:bg-mint/60">
      <Icon className="size-4"/><span className="flex-1">{ar?arabic:en}</span><ArrowUpRight className="size-4"/>
     </Link>)}
    </div>
   </details>)}
  </div>
  <div className="mt-6 rounded-2xl bg-[#F1F5ED] p-4">
   <div className="flex items-center gap-2"><MapPin className="size-5 text-brand"/><h3 className="text-sm font-semibold">{ar?"أماكن قريبة منك":"Ideas nearby"}</h3></div>
   <a href={externalMapLink("outing",city)} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-brand">
    {ar?"استكشف على الخريطة":"Open activity map"} <ArrowUpRight className="size-4"/>
   </a>
   <p className="mt-2 text-xs text-muted-foreground">{ar?"يُرسل اسم المدينة للبحث فقط، دون بيانات عائلتك.":"Only your selected city is used for the external map search."}</p>
  </div>
 </AppShell>;
}
