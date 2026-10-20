import {createFileRoute} from "@tanstack/react-router";
import {AppShell} from "@/components/AppShell";
import {GuidedFamilyAdvisor} from "@/components/GuidedFamilyAdvisor";
import {SixPillarDecisionStudio} from "@/components/SixPillarDecisionStudio";
import {LiveFamilyAdvisor} from "@/components/LiveFamilyAdvisor";
import {LIVE_AI_UI_ENABLED} from "@/lib/liveAiClient";
import {useI18n} from "@/lib/i18n";

export const Route=createFileRoute("/advisor")({
 head:()=>({meta:[
  {title:"Ask Dabberna — Family decisions"},
  {name:"description",content:"Ask one family question; local guidance uses your saved information. Optional advanced decision planning, and consented AI only when securely enabled."}
 ]}),component:Advisor
});
/** Ask first. Supported local questions are routed by the existing grounded
 * question engine. Advanced option comparison is secondary; connected AI
 * never appears in the public build unless independently enabled.
 */
export function Advisor(){
 const {lang}=useI18n(),ar=lang==="ar";
 return <AppShell title={ar?"اسأل دبّرنا":"Ask Dabberna"}>
  <div className="mx-auto max-w-[960px] space-y-4">
   <header className="rounded-2xl border border-[#DAE9DC] bg-[#F4FAF1] p-4">
    <p className="text-xs font-extrabold text-[#3C8768]">{ar?"اسأل · افهم · قرّر":"ASK · UNDERSTAND · DECIDE"}</p>
    <h2 className="mt-1 text-lg font-black text-[#244D3B]">{ar?"شو حابب تعرف عن عيلتك؟":"What can we help your family decide?"}</h2>
    <p className="mt-1 text-xs leading-relaxed text-[#65796B]">{ar?
      "اسأل مباشرة. الإرشاد المحلي يستخدم ما حفظته ويشرح الناقص، من دون إرسال السؤال أو الادعاء بذكاء متصل.":
      "Ask directly. Device-only guidance checks the family information you saved and explains what is missing. No connected AI is assumed."}</p>
   </header>
   <GuidedFamilyAdvisor/>
   <details className="rounded-2xl border border-[#DCE8DB] bg-white p-4" data-testid="advanced-decision">
    <summary className="min-h-11 cursor-pointer text-sm font-semibold text-brand">
     {ar?"اختياري: قارن طرق مختلفة لتنفيذ القرار":"Optional: compare different ways forward"}
    </summary>
    <div className="mt-3"><SixPillarDecisionStudio/></div>
   </details>
   {LIVE_AI_UI_ENABLED&&<details className="rounded-2xl border border-[#DCE8DB] bg-white p-4">
    <summary className="min-h-11 cursor-pointer text-sm font-semibold text-brand">
     {ar?"مساعد متصل — بموافقتك عند تشغيل الخدمة":"Connected assistant — only with consent and an enabled service"}
    </summary>
    <div className="mt-3"><LiveFamilyAdvisor/></div>
   </details>}
   <p className="text-xs leading-relaxed text-[#758479]">
    {ar?"الإجابات المحلية مبنية على بياناتك، وليست أسعاراً أو حجوزات أو معلومات بنكية مؤكدة.":
    "Local answers are grounded in your saved records, not verified provider prices, bookings or live bank information."}
   </p>
  </div>
 </AppShell>;
}
