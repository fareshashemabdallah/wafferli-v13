import {createFileRoute} from "@tanstack/react-router";
import {useState} from "react";
import {AppShell} from "@/components/AppShell";
import {GuidedFamilyAdvisor} from "@/components/GuidedFamilyAdvisor";
import {SixPillarDecisionStudio} from "@/components/SixPillarDecisionStudio";
import {LiveFamilyAdvisor} from "@/components/LiveFamilyAdvisor";
import {LIVE_AI_UI_ENABLED} from "@/lib/liveAiClient";
import {useI18n} from "@/lib/i18n";

export const Route=createFileRoute("/advisor")({
 head:()=>({meta:[
  {title:"Decide with Dabberna — Family Money Journey"},
  {name:"description",content:"One decision at a time: compare realistic options, ask about saved family records or use optional consented AI when available."}
 ]}),component:Advisor
});
/** No three assistants rendered as parallel primary forms. Pick ONE way to
 * decide; existing local guided, six-pillar and consent-gated connected AI
 * are preserved but disclosed honestly and shown one at a time.
 */
export function Advisor(){
 const {lang}=useI18n(),ar=lang==="ar";
 const [mode,setMode]=useState<"decision"|"question"|"connected">("decision");
 const modes=[
  {id:"decision" as const,en:"Compare ways forward",ar:"قارن طرق مناسبة"},
  {id:"question" as const,en:"Ask about my records",ar:"اسأل عن بياناتي"},
  ...(LIVE_AI_UI_ENABLED?[{id:"connected" as const,en:"Connected AI (consent)",ar:"الذكاء المتصل (بموافقتك)"}]:[])
 ];
 return <AppShell title={ar?"قرّر مع دبّرنا":"Decide with Dabberna"}>
  <div className="mx-auto max-w-[960px] space-y-4">
   <div className="rounded-2xl border border-[#DAE9DC] bg-[#F4FAF1] p-4">
    <p className="text-xs font-extrabold text-[#3C8768]">{ar?"القرار · خطوة واحدة":"DECIDE · ONE STEP AT A TIME"}</p>
    <h2 className="mt-1 text-lg font-black text-[#244D3B]">{ar?"كيف بدك نساعدك بالقرار؟":"What decision are we helping with?"}</h2>
    <p className="mt-1 text-xs leading-relaxed text-[#65796B]">{ar?
     "اختَر طريقة واحدة. دبّرنا بتستخدم سجلات العيلة نفسها، وما بتكرر الأسئلة أو الخطط بدون اختيارك.":
     "Choose one approach. All options use the same saved family records; no separate budget or duplicated plan is created."}</p>
    <div role="group" aria-label={ar?"طريقة اتخاذ القرار":"Decision approach"} className="mt-3 flex flex-wrap gap-2">
     {modes.map(item=><button key={item.id} type="button" aria-pressed={mode===item.id} onClick={()=>setMode(item.id)}
      className={"min-h-11 rounded-full border px-4 text-xs font-bold "+(mode===item.id?
       "border-[#3A956E] bg-[#E2F3E8] text-[#236C4D]":"border-[#DAE7DD] bg-white text-[#5E7468]")}>
      {ar?item.ar:item.en}
     </button>)}
    </div>
   </div>
   {mode==="decision"&&<SixPillarDecisionStudio/>}
   {mode==="question"&&<GuidedFamilyAdvisor/>}
   {mode==="connected"&&LIVE_AI_UI_ENABLED&&<LiveFamilyAdvisor/>}
   <p className="text-xs leading-relaxed text-[#758479]">{ar?
    "الإرشادات المحلية تحسب من بياناتك المحفوظة، مش ذكاء توليدي. المساعد المتصل، إذا توفر، يحتاج موافقة مستقلة. لا أسعار أو حجوزات مؤكدة بدون مصادر.":
    "Local comparisons use deterministic rules based on your saved records, not generative AI. Connected AI, if available, requires separate consent. Provider prices and availability remain unverified without a source."}</p>
  </div>
 </AppShell>;
}
