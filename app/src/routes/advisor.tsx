import {createFileRoute,Link} from "@tanstack/react-router";
import {ArrowRight,Sparkles} from "lucide-react";
import {AppShell} from "@/components/AppShell";
import {GuidedFamilyAdvisor} from "@/components/GuidedFamilyAdvisor";
import {SixPillarDecisionStudio} from "@/components/SixPillarDecisionStudio";
import {LiveFamilyAdvisor} from "@/components/LiveFamilyAdvisor";
import {LIVE_AI_UI_ENABLED} from "@/lib/liveAiClient";
import {useI18n} from "@/lib/i18n";

export const Route=createFileRoute("/advisor")({
 head:()=>({meta:[
  {title:"Ask Dabberna — Family Decisions"},
  {name:"description",content:"Ask about your family's money, outings and shopping. Get a grounded next step from your saved context."}
 ]}),component:Advisor
});
export function Advisor(){
 const {lang}=useI18n(),ar=lang==="ar";
 return <AppShell title={ar?"اسأل دبّرنا":"Ask Dabberna"}>
  <div className="flex items-center gap-3 rounded-[1.1rem] border border-[#DCE9D9] bg-[#F4FBF1] px-4 py-3">
   <Sparkles className="size-6 shrink-0 text-[#348D68]"/>
   <div><h2 className="text-sm font-black text-[#295D45]">{ar?"سؤال واحد، وخطوة واضحة":"One question. One useful next step."}</h2>
    <p className="mt-1 text-xs leading-relaxed text-[#557464]">{ar?
     "اسأل عن مال العيلة أو الطلعات أو المشتريات. بنستخدم المعلومات المسجّلة ونوضح الناقص.":
     "Ask about your money, outings or purchases. Dabberna uses saved details and flags what's missing."}</p>
   </div>
  </div>
  <SixPillarDecisionStudio/>
  <GuidedFamilyAdvisor/>
  {LIVE_AI_UI_ENABLED&&<LiveFamilyAdvisor/>}
  <section className="mt-5 rounded-2xl border border-[#DCE8DB] bg-white p-4">
   <h2 className="text-sm font-semibold">{ar?"بدك نتيجة محددة؟":"A specific decision you can make today"}</h2>
   <div className="mt-3 grid gap-2 sm:grid-cols-2">
    <Link to="/explore/weekend" className="flex min-h-12 items-center justify-between gap-2 rounded-xl bg-[#F1F7EF] px-4 text-sm font-semibold text-brand">
     {ar?"هل الطلعة مناسبة لميزانيتنا؟":"Does a family outing fit our plan?"}<ArrowRight className="size-4 rtl:rotate-180"/>
    </Link>
    <Link to="/explore/market" className="flex min-h-12 items-center justify-between gap-2 rounded-xl bg-[#F1F7EF] px-4 text-sm font-semibold text-brand">
     {ar?"وين ألاقي منتج من متاجر الأردن؟":"Find an item from Jordan sellers"}<ArrowRight className="size-4 rtl:rotate-180"/>
    </Link>
   </div>
   <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{ar?
    "حسابات دبّرنا تستند إلى معلوماتك المسجّلة، والأسعار والعروض لا تكون مؤكدة بدون مصدر مباشر.":
    "Advice uses entered records; real retailer prices and availability are not verified unless a connected source provides them."}</p>
  </section>
 </AppShell>;
}
