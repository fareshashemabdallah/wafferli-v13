import {createFileRoute,Link} from "@tanstack/react-router";
import {ArrowRight,CloudSun,Receipt,Sparkles} from "lucide-react";
import {useState} from "react";
import {AppShell} from "@/components/AppShell";
import {TodayFamilyBrief} from "@/components/TodayFamilyBrief";
import {QuickExpenseCard} from "@/components/QuickExpenseCard";
import {FamilyStarterCard} from "@/components/FamilyStarterCard";
import {SpendingBreakdownCard} from "@/components/SpendingBreakdownCard";
import {sampleMoney,type MoneyState} from "@/lib/money";
import {FamilyNextActions} from "@/components/FamilyNextActions";
import {FamilySetupCard} from "@/components/FamilySetupCard";
import {FamilyWeather} from "@/components/FamilyWeather";
import {defaultFamilyPreferences} from "@/lib/familyPreferences";
import {useLocalState} from "@/lib/storage";
import {useI18n} from "@/lib/i18n";

export const Route=createFileRoute("/")({
 head:()=>({meta:[
  {title:"Today — Dabberna | Your Family Advisor"},
  {name:"description",content:"Your family briefing, one helpful next action, and everyday advice without repeating forms."},
  {property:"og:title",content:"Dabberna — Your everyday family advisor"}
 ]}),
 component:Index
});
function Index(){
 const {lang}=useI18n(),ar=lang==="ar";
 const [prefs]=useLocalState("familyPreferences",defaultFamilyPreferences);
 const [money,,moneyReady]=useLocalState<MoneyState>("money",sampleMoney());
 const [quickExpenseOpen,setQuickExpenseOpen]=useState(false);
 const now=new Date(),hour=now.getHours();
 const greeting=ar?(hour<12?"صباح الخير":hour<18?"مسا الخير":"ليلة هنية"):
  (hour<12?"Good morning":hour<18?"Good afternoon":"Good evening");
 const date=new Intl.DateTimeFormat(ar?"ar-JO":"en-GB",{weekday:"long",month:"long",day:"numeric"}).format(now);
 return <AppShell>
  <header className="relative overflow-hidden rounded-[1.8rem] bg-gradient-to-br from-[#E8F2E6] via-[#F5F5ED] to-[#F9ECDD] p-5 sm:p-7">
   <p className="section-eyebrow">{date}</p>
   <h1 className="mt-2 text-2xl font-semibold text-ink sm:text-3xl">{greeting}</h1>
   <p className="mt-2 max-w-xl text-sm leading-relaxed text-[#506D5B]">{ar?
    "خبرني شو بدك تعمل لعيلتك، ودبّرنا بيساعدك تعرف الأهم، تقارن الخيارات، وتحضّر الخطوة الجاية.":
    "Tell Dabberna what your family needs. We'll help you see what matters, weigh options and prepare the next step."}</p>
   <Link to="/advisor" className="mt-4 inline-flex min-h-12 items-center gap-2 rounded-full bg-brand px-5 text-sm font-semibold text-white">
    <Sparkles className="size-4"/>{ar?"اسأل دبّرنا عن أي قرار":"Ask Dabberna about a decision"}
    <ArrowRight className="size-4 rtl:rotate-180"/>
   </Link>
  </header>
  <div className="mt-5 space-y-4">
   <FamilyStarterCard/>
   {moneyReady&&!money.demo&&<SpendingBreakdownCard state={money} compact/>}
   <TodayFamilyBrief/>
   <FamilyNextActions/>
  </div>
  <section className="mt-7" aria-label={ar?"أمثلة بسيطة":"Quick examples"}>
   <p className="text-xs font-semibold text-brand">{ar?"ممكن نساعدك بهالمواضيع":"TWO QUESTIONS YOU CAN START WITH"}</p>
   <div className="mt-3 grid gap-2 sm:grid-cols-2">
    <Link to="/explore/weekend" className="flex min-h-14 items-center justify-between gap-2 rounded-xl border border-[#DFE9DB] bg-white px-4 text-sm font-semibold text-brand">
     {ar?"فينا نطلع هالويكند؟":"Can we afford a weekend outing?"}<ArrowRight className="size-4 rtl:rotate-180"/>
    </Link>
    <Link to="/explore/market" className="flex min-h-14 items-center justify-between gap-2 rounded-xl border border-[#DFE9DB] bg-white px-4 text-sm font-semibold text-brand">
     {ar?"وين فينا نشتري هالمنتج؟":"Where can I find this product?"}<ArrowRight className="size-4 rtl:rotate-180"/>
    </Link>
   </div>
  </section>
  <details className="mt-6 rounded-2xl border border-[#E0E9DC] bg-white p-4">
   <summary className="min-h-11 cursor-pointer text-sm font-semibold text-brand">
    {ar?"حابب تعدّل معلومات أو تسجّل مصروف؟ (اختياري)":"Want to update something? (optional)"}
   </summary>
   <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{ar?
    "مش ضروري تعبي بيانات كل يوم. حدث الرصيد أو المصروف فقط إذا عندك معلومة جديدة.":
    "You don't need to enter data every day. Update a balance or expense only when something actually changes."}</p>
   <div className="mt-3 flex flex-wrap gap-3">
    <button type="button" aria-expanded={quickExpenseOpen} aria-controls="quick-expense"
     onClick={()=>setQuickExpenseOpen(v=>!v)}
     className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#EFF5ED] px-4 text-sm font-semibold text-brand">
     <Receipt className="size-4"/>{ar?"سجل مصروفاً":"Record an expense"}
    </button>
    <Link to="/money" className="inline-flex min-h-11 items-center text-sm font-semibold text-brand underline">
     {ar?"راجع المالية":"Review Money"}
    </Link>
    <Link to="/space" className="inline-flex min-h-11 items-center text-sm font-semibold text-brand underline">
     {ar?"معلومات العائلة":"Family & settings"}
    </Link>
   </div>
   {quickExpenseOpen&&<div id="quick-expense"><QuickExpenseCard onClose={()=>setQuickExpenseOpen(false)}/></div>}
   <details className="mt-4">
    <summary className="min-h-10 cursor-pointer text-xs font-semibold text-brand">{ar?"خصص نصائح العائلة":"Personalize guidance"}</summary>
    <FamilySetupCard/>
   </details>
   {prefs.weather&&<details className="mt-3">
    <summary className="inline-flex min-h-11 cursor-pointer items-center gap-2 text-xs font-semibold text-brand">
     <CloudSun className="size-4"/>{ar?"الطقس ونصائح الأنشطة":"Weather and activity ideas"}
    </summary>
    <FamilyWeather/>
   </details>}
  </details>
  <footer className="mt-8 border-t border-[#E3E9E0] pt-4 text-xs text-muted-foreground">
   <p>{ar?"توصيات دبّرنا تعتمد على المعلومات اللي حفظتها والمصادر المتاحة. ما في تحقق بنكي أو أسعار مؤكدة أو متابعة خلفية تلقائية.":
    "Advice uses records you chose to save and available sources. No verified bank connection, guaranteed prices or automatic background monitoring."}</p>
   <Link to="/about" className="mt-2 inline-flex min-h-11 items-center font-semibold text-brand underline">
    {ar?"اعرف شو بيعمل دبّرنا اليوم":"What Dabberna can do today"} →
   </Link>
  </footer>
 </AppShell>;
}
