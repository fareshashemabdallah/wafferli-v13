import {useState} from "react";
import {Globe2,LockKeyhole,Star} from "lucide-react";
import {useI18n} from "@/lib/i18n";
import {MARKETS,marketReadiness,type TargetMarket} from "@/lib/marketPolicy";
import {MEMBERSHIP_FEATURES,PLANS_STATE} from "@/lib/membershipPolicy";
/** Policy preview only. This component never changes financial data,
 * subscription entitlements, exchange rates or paid billing state. */
export function CommercialReadinessPreview(){
 const {lang}=useI18n(),ar=lang==="ar";
 const [market,setMarket]=useState<TargetMarket>("JO");
 const selected=MARKETS.find(m=>m.code===market)!;
 const readiness=marketReadiness(market);
 return <section className="editorial-card mt-4 p-4 sm:p-5"
  aria-label={ar?"خطة الأسواق والاشتراكات المقترحة":"Proposed market and membership readiness"}>
  <div className="flex items-start gap-3">
   <Star className="mt-0.5 size-6 shrink-0 text-brand"/>
   <div>
    <h2 className="font-semibold">{ar?"دبّرنا المجاني ودبّرنا بلس — خطة مستقبلية":"Free and Dabberna Plus — future concept"}</h2>
    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{ar?
     "لا يوجد اشتراك مدفوع أو سعر معلن أو صلاحيات بلس في هذه النسخة. لا نأخذ أي دفعات، ولا يتم فتح ميزات إضافية باختيار خطة على المتصفح.":
     "This is a product-planning preview, not a live subscription offer. No paid plan, published price, checkout or Plus entitlements exist in this pilot."}</p>
   </div>
  </div>
  <div className="mt-3 overflow-x-auto rounded-xl border border-[#DDE7DA]">
   <table className="w-full min-w-[430px] text-xs">
    <thead className="bg-[#F3F8EF]"><tr>
     <th className="p-3 text-start">{ar?"القدرة":"Capability"}</th>
     <th className="p-3 text-center">{ar?"مجاني الآن":"Free pilot"}</th>
     <th className="p-3 text-center">{ar?"بلس مخطط":"Plus idea"}</th>
    </tr></thead>
    <tbody>{MEMBERSHIP_FEATURES.map(f=><tr key={f.id} className="border-t border-[#E6ECE3]">
     <td className="p-3">{ar?f.ar:f.en}{f.status==="backend-gated"&&<span className="block text-[10px] text-muted-foreground">{ar?"غير متصل حالياً":"Not connected"}</span>}</td>
     <td className="p-3 text-center">{f.status==="available-pilot"&&f.free?(ar?"متاح":"Available"):"—"}</td>
     <td className="p-3 text-center">{f.plusPlanned?(ar?"مقترح":"Proposed"):"—"}</td>
    </tr>)}</tbody>
   </table>
  </div>
  <p className="mt-2 flex items-center gap-2 text-[11px] text-muted-foreground">
   <LockKeyhole className="size-4 shrink-0"/>
   {ar?"الاشتراك المدفوع يحتاج مزود دفع مرخّصاً وتحقّقاً من الصلاحيات بالخادم.":
    "Paid features will require licensed payment integration and SERVER-VERIFIED entitlements; browser flags cannot unlock them."}
  </p>
  <div className="mt-5 flex items-start gap-3 border-t border-[#DEE8D9] pt-4">
   <Globe2 className="mt-0.5 size-6 shrink-0 text-brand"/>
   <div className="flex-1">
    <h3 className="font-semibold">{ar?"جاهزية التوسع لأسواق جديدة":"Future market readiness"}</h3>
    <p className="mt-1 text-xs text-muted-foreground">{ar?
     "اختيار البلد هنا للمراجعة فقط، لا يغيّر بياناتك أو عملة المصاريف أو طريقة الدفع.":
     "Selecting a market here is informational only: it will NOT change your country, saved JOD finances, payments, exchange rate or legal location."}</p>
    <label className="mt-3 block text-xs font-semibold">{ar?"البلد للمقارنة":"Market to preview"}
     <select value={market} onChange={e=>setMarket(e.target.value as TargetMarket)}
      className="mt-1 min-h-11 w-full max-w-sm rounded-xl border bg-white px-3 text-sm">
      {MARKETS.map(m=><option key={m.code} value={m.code}>{ar?m.ar:m.en} ({m.code})</option>)}
     </select>
    </label>
    <p className="mt-3 text-xs font-semibold">{ar?"العملة المقترحة":"Local currency in future configuration"}: {selected.currency}</p>
    <p className="mt-1 text-xs text-muted-foreground">{ar?
     "كل السجلات المالية الحالية بالدينار الأردني فقط، ولا تُحوَّل تلقائياً.":
     readiness.notice}</p>
    <ul className="mt-2 list-disc space-y-1 ps-5 text-xs text-muted-foreground">
     {readiness.needs.map(x=><li key={x}>{x}</li>)}
    </ul>
   </div>
  </div>
  <p className="mt-3 text-[11px] text-muted-foreground">{ar?
   "التحقق النهائي: لا دفع ولا تسوية عمولات ولا إطلاق في سوق إضافي. كل المؤشرات غير مفعلة حتى مراجعة الأمان والقانون والعقود.":
   "Launch flags: billing "+String(PLANS_STATE.checkoutEnabled)+
   "; verified entitlements "+String(PLANS_STATE.serverVerifiedEntitlements)+
   ". No market expansion, merchant settlement or subscriptions are enabled."}</p>
 </section>;
}
