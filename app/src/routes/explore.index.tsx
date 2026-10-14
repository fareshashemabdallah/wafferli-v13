import {useI18n} from "@/lib/i18n";
import {createFileRoute,Link} from "@tanstack/react-router";
import {ArrowUpRight,CalendarHeart,Compass,Gift,HeartHandshake,MapPin,MessageSquareHeart,ShoppingBasket,ShoppingBag,Stethoscope,UtensilsCrossed} from "lucide-react";
import {AppShell} from "@/components/AppShell";
import {PlanContextBanner} from "@/components/PlanContextBanner";
import {defaultFamilyPreferences} from "@/lib/familyPreferences";
import {externalMapLink} from "@/lib/decisionJourney";
import {useLocalState} from "@/lib/storage";

export const Route=createFileRoute("/explore/")({
 head:()=>({meta:[{title:"Discover — Dabberna"},{name:"description",content:"Thoughtful choices for places, experiences, products and trustworthy conversations."}]}),
 component:Explore
});
const sections=[
 {id:"experiences",eyebrow:"ENJOY LIFE",arEyebrow:"استمتع بالحياة",title:"Go, enjoy & celebrate",arTitle:"اخرج واستمتع واحتفل",subtitle:"Choose a good experience—not just somewhere cheap.",arSubtitle:"اختر تجربة جميلة، وليس المكان الأرخص فقط.",items:[
  {to:"/explore/together" as const,en:"Plan Together",ar:"نخطط سوا",desc:"Plan an outing and vote with friends.",arDesc:"خطط لنزهة وصوّت مع الأصدقاء.",Icon:Compass},
  {to:"/explore/restaurants" as const,en:"Eat & Enjoy",ar:"كُل واستمتع",desc:"Explore cuisines and places.",arDesc:"اكتشف مطابخ وأماكن جديدة.",Icon:UtensilsCrossed},
  {to:"/occasions" as const,en:"Make a Moment Special",ar:"لحظات لا تُنسى",desc:"Thoughtful birthdays, gifts and anniversaries.",arDesc:"أعياد ميلاد وهدايا وذكريات مميزة.",Icon:CalendarHeart}
 ]},
 {id:"choices",eyebrow:"CHOOSE WELL",arEyebrow:"اختر بثقة",title:"Everyday choices",arTitle:"خيارات حياتك اليومية",subtitle:"Balance quality, fit, convenience and total cost.",arSubtitle:"وازن بين الجودة والملاءمة والراحة والتكلفة الكاملة.",items:[
  {to:"/explore/smartbuy" as const,en:"Compare & Choose",ar:"قارن واختر",desc:"See the real total before buying.",arDesc:"قارن التكلفة الإجمالية قبل الشراء.",Icon:ShoppingBag},
  {to:"/explore/shopping" as const,en:"My Basket",ar:"سلّتي",desc:"Plan what you need and record purchases.",arDesc:"رتّب احتياجاتك وسجّل مشترياتك.",Icon:ShoppingBasket},
  {to:"/explore/services" as const,en:"Find the Right Service",ar:"اعثر على الخدمة الأنسب",desc:"Search for services that meet your needs.",arDesc:"ابحث عن الخدمة التي تناسب احتياجاتك.",Icon:Stethoscope}
 ]},
 {id:"community",eyebrow:"PEOPLE YOU TRUST",arEyebrow:"أشخاص تثق بهم",title:"Ask, share & learn",arTitle:"اسأل وشارك واستفد",subtitle:"Private conversations and clearly labeled personal experiences.",arSubtitle:"محادثات خاصة وتجارب شخصية واضحة المصدر.",items:[
  {to:"/community" as const,en:"Family & Friends Circles",ar:"دوائر العائلة والأصدقاء",desc:"Ask people you invited and trust.",arDesc:"اسأل أشخاصًا دعوتهم وتثق بهم.",Icon:HeartHandshake},
  {to:"/experience" as const,en:"Community Experiences",ar:"تجارب المجتمع",desc:"Look up personal opinions on a specific place or product.",arDesc:"اطلع على آراء شخصية عن مكان أو منتج محدد.",Icon:MessageSquareHeart}
 ]}
] as const;
function Explore(){
 const {lang}=useI18n(),ar=lang==="ar";
 const [prefs]=useLocalState("familyPreferences",defaultFamilyPreferences);
 const city=prefs.city?.trim()||"Amman";
 return <AppShell title={ar?"اكتشف":"Discover"}>
  <div className="hero-surface rounded-3xl p-5 sm:p-6">
   <p className="text-[11px] font-semibold tracking-wide text-brand">{ar?"أنفق بذكاء، وعِش براحة":"SPEND WISELY. LIVE WELL."}</p>
   <h2 className="mt-2 text-xl font-semibold">{ar?"أفكار أفضل ليوم أجمل":"Better choices, brighter moments"}</h2>
   <p className="mt-2 text-sm text-[#526C60]">{ar?"ابدأ بما تريد تحقيقه. سنساعدك على التفكير في القيمة والراحة وما يناسب ظروفك.":"Start with what matters to you. We’ll help you think about value, enjoyment and practical fit."}</p>
  </div>
  <div className="mt-4"><PlanContextBanner/></div>
  {sections.map(section=><section key={section.id} className="mt-6" aria-label={ar?section.arTitle:section.title}>
   <p className="text-[11px] font-semibold tracking-wider text-[#B38364]">{ar?section.arEyebrow:section.eyebrow}</p>
   <h3 className="mt-1 text-lg font-semibold">{ar?section.arTitle:section.title}</h3>
   <p className="mt-1 text-sm text-muted-foreground">{ar?section.arSubtitle:section.subtitle}</p>
   <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
    {section.items.map(item=><Link to={item.to} key={item.to} className="group flex min-h-24 items-start gap-3 rounded-2xl border border-border bg-white p-3.5 transition hover:-translate-y-0.5 hover:border-[#BED3C4] hover:shadow-sm">
     <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-mint text-brand"><item.Icon className="size-5"/></span>
     <span className="min-w-0 flex-1"><span className="block text-sm font-semibold text-ink">{ar?item.ar:item.en}</span><span className="mt-1 block text-xs leading-relaxed text-muted-foreground">{ar?item.arDesc:item.desc}</span></span>
     <ArrowUpRight className="size-4 shrink-0 text-[#9CAE9D] group-hover:text-brand"/>
    </Link>)}
   </div>
  </section>)}
  <section className="mt-6 flex items-start gap-3 rounded-2xl border border-[#DDE8DD] bg-[#F0F6EE] p-4">
   <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white text-brand"><MapPin className="size-5"/></span>
   <div className="flex-1">
    <h3 className="text-sm font-semibold">{ar?"أماكن قريبة وأفكار جديدة":"Discover nearby possibilities"}</h3>
    <p className="mt-1 text-xs text-muted-foreground">{ar?"ابحث على خرائط Google باستخدام المدينة المفضلة فقط، دون مشاركة أسماء أفراد الأسرة أو الميزانية.":"Search Google Maps using only your selected city—no family names, birthdays or budget shared."}</p>
    <a href={externalMapLink("outing",city)} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-brand">{ar?"استكشف الأنشطة قرب ":"Explore activities around "}{city} <ArrowUpRight className="size-4"/></a>
   </div>
  </section>
 </AppShell>;
}
