import {ShieldCheck} from "lucide-react";
import {useState} from "react";
import {prepareExpenseForShare,formatSharedJod} from "@/lib/expenseSharing";
import {useLocalState} from "@/lib/storage";
import {useI18n} from "@/lib/i18n";
import {sampleMoney,type MoneyState} from "@/lib/money";
import {changeLocalExpenseVisibility,localExpenseVisibilitySummary} from "@/lib/localPrivacy";
export function LocalExpensePrivacyReview(){
 const {lang}=useI18n(),ar=lang==="ar";
 const [money,setMoney,ready]=useLocalState<MoneyState>("money",sampleMoney());
 const [previewId,setPreviewId]=useState<string|null>(null);
 if(!ready)return null;
 const counts=localExpenseVisibilitySummary(money);
 const entries=[...money.expenses].filter(e=>e.status!=="planned")
  .sort((a,b)=>b.date.localeCompare(a.date)).slice(0,30);
 return <section className="mt-4 rounded-xl border border-[#DDE8DC] bg-white p-4">
  <div className="flex items-start gap-3">
   <ShieldCheck className="mt-0.5 size-5 text-brand"/>
   <div>
    <h3 className="text-sm font-semibold">{ar?"راجع علامات خصوصية المصاريف":"Review local spending privacy labels"}</h3>
    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{ar?
     "«عائلي» و«خاص» هنا مجرد تصنيفات محفوظة على هذا المتصفح. لا تمنح أي والد آخر صلاحية الرؤية، ولا ترفع أي مصروف للسحابة. مشاركة بند على حساب أسرة موثّق تتطلب موافقة منفصلة لكل بند.":
     "Household/private are labels on THIS browser only. They do not grant access to another adult or upload expenses to a server. Actual authenticated household sharing requires separate consent for each expense."}</p>
   </div>
  </div>
  <p className="mt-3 text-xs font-semibold">{ar?"عائلي محلي":"Local household label"}: {counts.sharedLabels} · {ar?"خاص":"Private label"}: {counts.privateLabels}</p>
  <p className="mt-1 text-[11px] text-muted-foreground">{ar?"أي سجل جديد يبدأ بخيار خاص. تصنيف عائلي لا ينقل المعلومات لأي جهاز أو حساب آخر.":"New entries start private. A household label is not an upload, household permission or invitation."}</p>
  {money.demo?<p className="mt-3 text-xs text-muted-foreground">{ar?
   "هذه بيانات تجريبية؛ أضف أرقاماً فعلية لتفعيل المراجعة.":"Demo financial data: switch to actual entries before changing labels."}</p>:
   <div className="mt-3 space-y-2">
    {entries.length===0&&<p className="text-xs text-muted-foreground">{ar?"لا توجد مصاريف مدفوعة مسجلة.":"No recorded paid expenses."}</p>}
    {entries.map(e=><article key={e.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[#EBF0E8] p-3 text-xs">
     <span className="min-w-0 flex-1">{e.date} · {e.amount.toFixed(2)} JOD
      <span className="block text-muted-foreground">{money.categories.find(c=>c.id===e.categoryId)?.name??(ar?"فئة غير محددة":"Other category")}</span>
     </span>
     <select aria-label={ar?"علامة خصوصية هذا المصروف":"Expense privacy label"}
      value={e.shared?"household":"private"}
      className="min-h-11 rounded-xl border px-2 text-xs" onChange={ev=>{
       const share=ev.target.value==="household";
       if(share&&!window.confirm(ar?
        "تغيير العلامة إلى عائلي سيؤثر على سجلّك المحلي فقط. لا تتم مشاركة بيانات عبر الإنترنت، لكن أي مشاركة مستقبلية تتطلب موافقتك. متابعة؟":
        "Change this local label to Household? No information is uploaded. Any future authenticated upload requires explicit additional consent. Continue?"))return;
       setPreviewId(null);
       setMoney(old=>changeLocalExpenseVisibility(old,e.id,share));
      }}>
      <option value="private">{ar?"خاص على الجهاز":"Private (device)"}</option>
      <option value="household">{ar?"علامة عائلية محلية":"Household label only"}</option>
     </select>
     <button type="button" className="min-h-10 rounded-lg bg-[#EDF4EA] px-3 text-xs font-semibold text-brand"
      aria-expanded={previewId===e.id} onClick={()=>setPreviewId(current=>current===e.id?null:e.id)}>
      {ar?"راجع ما قد يظهر عند مشاركة منفصلة":"Preview separately consented fields"}
     </button>
     {previewId===e.id&&<div className="w-full rounded-xl border border-[#DCE6DA] bg-[#F7FAF5] p-3" role="region"
      aria-label={ar?"معاينة مشاركة افتراضية فقط":"Hypothetical sharing data preview"}>
      {(()=>{
       const ready=prepareExpenseForShare(money,e);
       if(!ready)return <p>{ar?
        "هذا المصروف ليس مؤهلاً حتى لمعاينة المشاركة: إما خاص أو مخطط أو يحتاج معلومات صحيحة. لا يُرسل شيء.":"This expense is not eligible for a potential sharing preview: it may be private, planned or missing required fields. Nothing is sent."}</p>;
       return <div>
        <p className="font-semibold">{ar?"الحقول التي قد تُنسخ إذا وافقت لاحقاً على مشاركة هذا البند:":"Fields that could be copied only after future per-item consent:"}</p>
        <dl className="mt-2 grid grid-cols-2 gap-2">
         <dt>{ar?"الفئة":"Category"}</dt><dd>{ready.category}</dd>
         <dt>{ar?"المبلغ":"Amount"}</dt><dd>{formatSharedJod(ready.amountFils)}</dd>
         <dt>{ar?"التاريخ":"Date"}</dt><dd>{ready.occurredOn}</dd>
        </dl>
        <p className="mt-2 text-muted-foreground">{ar?
         "لا تتضمن المعاينة الملاحظات أو أسماء أفراد العائلة أو الأرصدة أو الخطط. قد تُستخدم بصمة معرف محلية دون نقل المعرف نفسه. هذه المعاينة لا تعني موافقة ولا ترفع أي بيانات.":
         "Notes, family names, balances and plans are excluded. A fingerprint of the local ID may be used instead of sending the ID. This preview is not consent, a network upload or proof that a server is enabled."}</p>
       </div>;
      })()}
     </div>}
    </article>)}
   </div>}
  <p className="mt-3 text-[11px] text-muted-foreground">{ar?
   "لا توجد صلاحيات مستخدمين أو حسابات أطفال في هذه الأداة. تغييرات العلامات لا تغير حالة الدفع أو الرصيد أو التخطيط.":
   "No identities, child permissions or financial transactions are changed. Labels do not modify paid status, cash, balances or cloud membership."}</p>
 </section>;
}
