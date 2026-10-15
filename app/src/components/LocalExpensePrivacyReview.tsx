import {ShieldCheck} from "lucide-react";
import {useLocalState} from "@/lib/storage";
import {useI18n} from "@/lib/i18n";
import {sampleMoney,type MoneyState} from "@/lib/money";
import {changeLocalExpenseVisibility,localExpenseVisibilitySummary} from "@/lib/localPrivacy";
export function LocalExpensePrivacyReview(){
 const {lang}=useI18n(),ar=lang==="ar";
 const [money,setMoney,ready]=useLocalState<MoneyState>("money",sampleMoney());
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
  <p className="mt-3 text-xs font-semibold">{ar?"عائلي":"Household label"}: {counts.sharedLabels} · {ar?"خاص":"Private label"}: {counts.privateLabels}</p>
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
       setMoney(old=>changeLocalExpenseVisibility(old,e.id,share));
      }}>
      <option value="private">{ar?"خاص على الجهاز":"Private (device)"}</option>
      <option value="household">{ar?"علامة عائلية محلية":"Household label only"}</option>
     </select>
    </article>)}
   </div>}
  <p className="mt-3 text-[11px] text-muted-foreground">{ar?
   "لا توجد صلاحيات مستخدمين أو حسابات أطفال في هذه الأداة. تغييرات العلامات لا تغير حالة الدفع أو الرصيد أو التخطيط.":
   "No identities, child permissions or financial transactions are changed. Labels do not modify paid status, cash, balances or cloud membership."}</p>
 </section>;
}
