import {createFileRoute,Link} from "@tanstack/react-router";
import {ArrowRight,CloudSun,Heart,Receipt,Sparkles} from "lucide-react";
import {useState} from "react";
import {AppShell} from "@/components/AppShell";
import {TodayFamilyBrief} from "@/components/TodayFamilyBrief";
import {QuickExpenseCard} from "@/components/QuickExpenseCard";
import {FamilyChoiceHome} from "@/components/FamilyChoiceHome";
import {FamilySetupCard} from "@/components/FamilySetupCard";
import {FamilyWeather} from "@/components/FamilyWeather";
import {defaultFamilyPreferences} from "@/lib/familyPreferences";
import {useLocalState,writeLocal} from "@/lib/storage";
import {useI18n} from "@/lib/i18n";

export const Route=createFileRoute("/")({
 head:()=>({meta:[
  {title:"Today — Dabberna | Spend Wisely. Live Well."},
  {name:"description",content:"A family-life companion to manage money, celebrate occasions and make more thoughtful everyday choices."},
  {property:"og:title",content:"Dabberna — Family money, moments & thoughtful choices"},
  {property:"og:description",content:"Spend wisely. Live well. Plan family moments and household spending, all in one calm place."}
 ]}),
 component:Index
});

function Index(){
 const {lang}=useI18n(),ar=lang==="ar";
 const [prefs]=useLocalState("familyPreferences",defaultFamilyPreferences);
 const [quickExpenseOpen,setQuickExpenseOpen]=useState(false);
 const [introDone,setIntroDone,ready]=useLocalState("homeIntroDone",false);
 const now=new Date();
 const hour=now.getHours();
 const greeting=ar?(hour<12?"صباح الخير":hour<18?"مسا الخير":"ليلة هنية"):(hour<12?"Good morning":hour<18?"Good afternoon":"Good evening");
 const date=new Intl.DateTimeFormat(ar?"ar-JO":"en-US",{weekday:"long",month:"long",day:"numeric"}).format(now);
 const intro=ready&&!introDone;
 const daily=ready&&introDone;
 return <AppShell>
  {!ready?<div className="hero-surface h-48 animate-pulse rounded-[2rem]" aria-label={ar?"جارٍ تجهيز الصفحة":"Loading your day"}/>:
  intro?<section className="relative isolate overflow-hidden rounded-[2rem] border border-[#DCE5D9] bg-gradient-to-br from-[#E8F0E7] via-[#F7F4EB] to-[#F3E4D7] px-5 pb-6 pt-7 sm:px-8 sm:pb-8 sm:pt-9">
    <div className="pointer-events-none absolute -end-16 -top-20 size-52 rounded-full border-[25px] border-white/30 sm:size-72" aria-hidden="true"/>
    <div className="pointer-events-none absolute end-4 top-5 rounded-full bg-white/50 p-3 text-[#517A60] sm:end-10 sm:top-9" aria-hidden="true"><Heart className="size-7 sm:size-10" strokeWidth={1.6}/></div>
    <div className="relative max-w-xl">
      <p className="section-eyebrow">{ar?"دبّرنا · رفيقك في الحياة اليومية":"MEET DABBERNA · YOUR EVERYDAY COMPANION"}</p>
      <h1 className="mt-5 max-w-lg text-[2.1rem] font-semibold leading-[1.16] tracking-tight text-ink sm:text-[3.2rem]">
       {ar?"عِش اللحظات الحلوة، وخلّي بالك مرتاح.":"More life to enjoy. More peace of mind."}
      </h1>
      <p className="mt-4 max-w-md text-sm leading-7 text-[#50695A] sm:text-base">
       {ar?"دبّرنا يجمع ميزانية البيت، مناسباتك، وأفكار الطلعات والمشتريات، لتختار الأنسب إلك ولعيلتك بثقة."
       :"Dabberna brings together household money, meaningful occasions and everyday choices—so you can live well and spend with confidence."}
      </p>
      <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/65 bg-white/60 px-3 py-2 text-xs font-semibold text-brand">
       <Sparkles className="size-4"/>{ar?"أنفق بذكاء، وعِش براحة":"SPEND WISELY · LIVE WELL"}
      </div>
    </div>
   </section>:
   <section className="relative isolate overflow-hidden rounded-[1.85rem] bg-gradient-to-br from-[#EAF1E7] via-[#F3F2E9] to-[#F8EBDD] px-5 py-5 sm:px-7 sm:py-7">
    <div className="pointer-events-none absolute -end-10 -top-9 size-44 rounded-full border-[26px] border-white/35" aria-hidden="true"/>
    <div className="relative">
     <p className="section-eyebrow">{date}</p>
     <h1 className="mt-3 text-[2rem] font-semibold tracking-tight text-ink sm:text-4xl">{greeting}<span aria-hidden="true" className="ms-2 text-[#B88461]">✦</span></h1>
     <p className="mt-2 max-w-lg text-sm leading-relaxed text-[#526B5D]">{ar?"خلّينا نرتّب المهم، ونترك مساحة للأوقات الحلوة.":"Make room for the good things, with the important things in hand."}</p>
    </div>
   </section>}

  {ready&&intro&&<>
   <FamilyChoiceHome onNavigate={()=>{writeLocal("homeIntroDone",true);setIntroDone(true);}}/>
   <button type="button" onClick={()=>setIntroDone(true)}
    className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-full border border-[#DAE4D8] bg-white px-5 text-sm font-semibold text-brand">
    {ar?"اعرض ملخص يومي":"Show my family today"} <ArrowRight className="size-4 rtl:rotate-180"/>
   </button>
  </>}

  {daily&&<>
   <FamilyChoiceHome/>
   <TodayFamilyBrief/>
   <div className="mt-5 flex flex-wrap items-center gap-3">
    <button type="button" aria-expanded={quickExpenseOpen} aria-controls="quick-expense"
     onClick={()=>setQuickExpenseOpen(v=>!v)}
     className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[#D7E5D5] bg-white px-4 text-sm font-semibold text-brand">
     <Receipt className="size-4"/>{ar?"سجّل مصروف اليوم":"Record today's expense"}
    </button>
    <Link to="/advisor" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-brand underline">
     <Sparkles className="size-4"/>{ar?"اسأل دبّرنا":"Ask Dabberna"} →
    </Link>
   </div>
   {quickExpenseOpen&&<QuickExpenseCard onClose={()=>setQuickExpenseOpen(false)}/>}
   <details className="mt-4 rounded-xl border border-[#E2E9DF] bg-white px-4 py-3">
    <summary className="flex min-h-11 cursor-pointer items-center text-sm font-semibold text-brand">
     {ar?"خصّص نصائح دبّرنا (اختياري)":"Personalize your family advice (optional)"}
    </summary>
    <FamilySetupCard/>
   </details>
   {prefs.weather&&<details className="group editorial-card mt-4 overflow-hidden">
    <summary className="flex min-h-16 cursor-pointer items-center gap-3 px-4 py-3">
     <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#EAF1E8] text-brand"><CloudSun className="size-5"/></span>
     <span className="flex-1 text-sm font-semibold">{ar?"الطقس ونصائح الطلعات":"Weather & outing tips"}</span>
     <span className="text-xs font-medium text-brand group-open:hidden">{ar?"عرض":"View"} +</span>
     <span className="hidden text-xs font-medium text-brand group-open:inline">{ar?"إخفاء":"Close"} −</span>
    </summary>
    <div className="border-t border-border/70 px-3 pb-4"><FamilyWeather/></div>
   </details>}
  </>}

  <div className="mt-8 premium-divider"/>
  <footer className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
   <p>{ar?"خصوصيتك مهمة. بياناتك المالية والعائلية تبقى على هذا الجهاز.":"Made for everyday family life. Your financial and family details stay on this device."}</p>
   <Link to="/about" className="font-semibold text-brand underline-offset-2 hover:underline">{ar?"اعرف أكثر":"How it works"} <ArrowRight className="inline size-3.5 rtl:rotate-180"/></Link>
  </footer>
 </AppShell>;
}
