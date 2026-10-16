import {createFileRoute,Link} from "@tanstack/react-router";
import {ArrowRight,CalendarDays,MapPin,Search,ShoppingBasket,Sparkles} from "lucide-react";
import {AppShell} from "@/components/AppShell";
import {useI18n} from "@/lib/i18n";

export const Route=createFileRoute("/explore/")({
 head:()=>({meta:[
  {title:"Find family options — Dabberna"},
  {name:"description",content:"Get help deciding on a family outing, finding products and evaluating local services."}
 ]}),
 component:Explore
});
export function Explore(){
 const {lang}=useI18n(),ar=lang==="ar";
 return <AppShell title={ar?"خلّينا نلاقي الخيار المناسب":"Find what's right for your family"}>
  <section className="rounded-2xl border border-[#DFE8DB] bg-[#F1F7ED] p-5">
   <div className="flex items-center gap-2"><Sparkles className="size-5 text-brand"/>
    <h2 className="text-lg font-semibold">{ar?"شو بدك دبّرنا يساعدك تختار؟":"What would you like help deciding?"}</h2></div>
   <p className="mt-2 text-sm text-muted-foreground">{ar?
    "اختار النتيجة اللي بدك توصلها. ما في حاجة تفتح أدوات كثيرة أو تعيد إدخال بيانات عيلتك.":
    "Start with your family's goal. You don't need separate tools or repeated personal details."}</p>
   <Link to="/advisor" className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-full bg-brand px-5 text-sm font-semibold text-white">
    {ar?"اسأل دبّرنا":"Ask Dabberna"} <ArrowRight className="size-4 rtl:rotate-180"/>
   </Link>
  </section>
  <div className="mt-4 grid gap-3 sm:grid-cols-2">
   <Link to="/explore/weekend" className="rounded-2xl border border-[#DEE8DB] bg-white p-5">
    <MapPin className="size-6 text-brand"/>
    <h2 className="mt-3 font-semibold">{ar?"نشاط للعيلة":"A family outing"}</h2>
    <p className="mt-1 text-sm text-muted-foreground">{ar?
     "تقييم مبدئي للميزانية وأماكن مسجلة على الخريطة. الأسعار بحاجة لتأكيد.":
     "A budget check and mapped venues; admission and availability still need checking."}</p>
   </Link>
   <Link to="/explore/market" className="rounded-2xl border border-[#DEE8DB] bg-white p-5">
    <Search className="size-6 text-brand"/>
    <h2 className="mt-3 font-semibold">{ar?"اشتري منتجاً مناسباً":"Find a product"}</h2>
    <p className="mt-1 text-sm text-muted-foreground">{ar?
     "فتّش في مواقع متاجر أردنية، وتأكد من السعر عند البائع.":
     "Search actual Jordanian seller listings; verify current prices with the store."}</p>
   </Link>
  </div>
  <details className="mt-5 rounded-xl border border-[#DFE8DB] bg-white p-4">
   <summary className="min-h-11 cursor-pointer text-sm font-semibold text-brand">
    {ar?"حاجات محفوظة وخدمات إضافية (اختياري)":"Saved needs and other services (optional)"}
   </summary>
   <div className="mt-3 grid gap-2 sm:grid-cols-2">
    {([
     {to:"/explore/shopping" as const,en:"My shopping list",ar:"قائمة المشتريات",Icon:ShoppingBasket},
     {to:"/explore/services" as const,en:"Find a local service",ar:"ابحث عن خدمة",Icon:Search},
     {to:"/calendar" as const,en:"Family calendar",ar:"تقويم العيلة",Icon:CalendarDays},
     {to:"/occasions" as const,en:"Gift and occasion ideas",ar:"أفكار للهدايا والمناسبات",Icon:Sparkles}
    ] as const).map(({to,en,ar:arabic,Icon})=><Link key={to} to={to}
     className="flex min-h-12 items-center gap-3 rounded-lg bg-[#F6F9F4] px-3 text-sm font-semibold text-brand">
     <Icon className="size-4"/>{ar?arabic:en}<ArrowRight className="ms-auto size-4 rtl:rotate-180"/>
    </Link>)}
   </div>
  </details>
 </AppShell>;
}
