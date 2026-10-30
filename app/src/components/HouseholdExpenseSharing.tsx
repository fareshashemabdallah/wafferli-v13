import {frenchUI} from "@/lib/french";
import {useEffect,useMemo,useState,type FormEvent} from "react";
import {LockKeyhole,ShieldCheck,Share2,Trash2} from "lucide-react";
import {Button} from "@/components/ui/button";
import {useI18n} from "@/lib/i18n";
import {useLocalState} from "@/lib/storage";
import {sampleMoney,type MoneyState} from "@/lib/money";
import {prepareExpenseForShare,fingerprintLocalExpense,formatSharedJod,type SharedExpenseRow} from "@/lib/expenseSharing";
import {fetchSharedHouseholdExpenses,publishOneSharedExpense,withdrawSharedExpense,HOUSEHOLD_EXPENSE_SHARING_ENABLED} from "@/lib/householdExpenseApi";

/** Parents select ONE locally household-marked paid expense and separately
 * consent to its minimal server-side copy. There is NO automatic sync/import.
 * This component is rendered only inside a verified signed-in membership UI.
 */
export function HouseholdExpenseSharing({householdId,userId}:{householdId:string;userId:string}){
 const {lang}=useI18n(),ar=lang==="ar";
 const [money,,moneyReady]=useLocalState<MoneyState>("money",sampleMoney());
 const [rows,setRows]=useState<SharedExpenseRow[]>([]);
 const [loading,setLoading]=useState(true);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 const [notice,setNotice]=useState("");
 const [selected,setSelected]=useState("");
 const [consent,setConsent]=useState(false);
 const eligible=useMemo(()=>moneyReady?
  money.expenses.map(e=>prepareExpenseForShare(money,e)).filter((v):v is NonNullable<typeof v>=>v!==null)
   .sort((a,b)=>b.occurredOn.localeCompare(a.occurredOn)).slice(0,100):[],
  [money,moneyReady]);
 const chosen=eligible.find(x=>x.localExpenseId===selected);
 useEffect(()=>{
  if(!HOUSEHOLD_EXPENSE_SHARING_ENABLED)return;
  let live=true;
  setRows([]);setSelected("");setConsent(false);setError("");setNotice("");setLoading(true);
  void fetchSharedHouseholdExpenses(householdId).then(data=>{
   if(live)setRows(data);
  }).catch(e=>{
   if(live)setError(e instanceof Error?e.message:String(e));
  }).finally(()=>{if(live)setLoading(false);});
  return ()=>{live=false;};
 },[householdId,userId]);
 if(!HOUSEHOLD_EXPENSE_SHARING_ENABLED)return null;
 const reload=async()=>setRows(await fetchSharedHouseholdExpenses(householdId));
 const act=async(fn:()=>Promise<void>)=>{
  if(busy)return;
  setBusy(true);setError("");setNotice("");
  try{await fn();}catch(e){setError(e instanceof Error?e.message:String(e));}
  finally{setBusy(false);}
 };
 const publish=(event:FormEvent)=>{
  event.preventDefault();
  if(!chosen||!consent)return;
  const details=chosen.category+" · "+formatSharedJod(chosen.amountFils)+" · "+chosen.occurredOn;
  if(!window.confirm((ar?"مشاركة هذا المصروف فقط مع البالغين بهذه الأسرة؟":(lang==="fr"?frenchUI("Share only this expense with the adults in this household?"):"Share only this expense with the adults in this household?"))+"\n"+details))return;
  void act(async()=>{
   // Re-evaluate current local records at click time. Changes to Money
   // since selection must not turn another item into an automatic share.
   const original=money.expenses.find(e=>e.id===chosen.localExpenseId);
   const preview=original?prepareExpenseForShare(money,original):null;
   if(!preview||preview.amountFils!==chosen.amountFils||
     preview.category!==chosen.category||preview.occurredOn!==chosen.occurredOn)
    throw new Error(ar?"تم تعديل المصروف. راجعه قبل المشاركة.":(lang==="fr"?frenchUI("The expense changed. Review it again before sharing."):"The expense changed. Review it again before sharing."));
   const fingerprint=await fingerprintLocalExpense(householdId,userId,preview.localExpenseId);
   if(rows.some(row=>row.created_by===userId&&row.source_fingerprint===fingerprint))
    throw new Error(ar?"هذا المصروف تمت مشاركته سابقاً.":(lang==="fr"?frenchUI("This item is already shared; withdraw it before sharing again."):"This item is already shared; withdraw it before sharing again."));
   await publishOneSharedExpense(householdId,preview,fingerprint,true);
   setSelected("");setConsent(false);await reload();
   setNotice(ar?"تمت مشاركة هذا المصروف فقط. بقيت باقي البيانات محلية.":(lang==="fr"?frenchUI("Only this item was shared. All other finances remain local."):"Only this item was shared. All other finances remain local."));
  });
 };
 const withdraw=(row:SharedExpenseRow)=>{
  if(row.created_by!==userId)return;
  if(!window.confirm(ar?"إزالة هذا المصروف من مساحة الأسرة؟ لن تُحذف النسخة الموجودة على جهازك.":(lang==="fr"?frenchUI("Remove this expense from the household? Your local Money entry will remain unchanged."):"Remove this expense from the household? Your local Money entry will remain unchanged.")))return;
  void act(async()=>{
   await withdrawSharedExpense(householdId,row.id);
   await reload();
   setNotice(ar?"تمت إزالة النسخة المشتركة.":(lang==="fr"?frenchUI("Shared copy removed."):"Shared copy removed."));
  });
 };
 return <section className="mt-5 rounded-2xl border border-[#DCE6DA] bg-[#F8FBF6] p-4 sm:p-5" aria-label={ar?"مصاريف مختارة للمشاركة":(lang==="fr"?frenchUI("Selected household expense sharing"):"Selected household expense sharing")}>
  <div className="flex items-start gap-3">
   <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white text-brand"><LockKeyhole className="size-5"/></span>
   <div>
    <h3 className="font-semibold">{ar?"مشاركة مصروف محدد فقط":(lang==="fr"?frenchUI("Share only a selected expense"):"Share only a selected expense")}</h3>
    <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{ar?"المشاركة اختيارية، بنداً واحداً كل مرة، مع تأكيدك. المصاريف الخاصة، الملاحظات، دخل العائلة، الأرصدة وتفاصيل الأطفال لا تُرفع. قائمة المصاريف المحفوظة على جهازك لا تتغيّر.":(lang==="fr"?frenchUI("Sharing is opt-in, one expense at a time, with explicit confirmation. Private entries, notes, income, cash balances and child details are never uploaded. Your device's Money records are unchanged."):"Sharing is opt-in, one expense at a time, with explicit confirmation. Private entries, notes, income, cash balances and child details are never uploaded. Your device's Money records are unchanged.")}</p>
   </div>
  </div>
  {error&&<p role="alert" className="mt-3 rounded-xl bg-[#FFF0F0] p-3 text-xs text-[#973F44]">{error}</p>}
  {notice&&<p role="status" className="mt-3 rounded-xl bg-[#ECF5EA] p-3 text-xs text-brand">{notice}</p>}
  <form onSubmit={publish} className="mt-4 space-y-3 rounded-xl bg-white p-3">
   <label className="block text-xs font-semibold">{ar?"اختر مصروفاً مدفوعاً ومعلّماً محلياً كمصروف للبيت":(lang==="fr"?frenchUI("Choose one paid expense marked household locally"):"Choose one paid expense marked household locally")}
    <select className="mt-2 min-h-11 w-full rounded-xl border border-input bg-white px-3 text-sm" value={selected}
     onChange={e=>{setSelected(e.target.value);setConsent(false);}}>
     <option value="">{ar?"لا يوجد مصروف محدد":(lang==="fr"?frenchUI("Nothing selected"):"Nothing selected")}</option>
     {eligible.map(p=><option key={p.localExpenseId} value={p.localExpenseId}>
      {p.occurredOn+" · "+p.category+" · "+formatSharedJod(p.amountFils)}
     </option>)}
    </select>
   </label>
   {!moneyReady||money.demo||eligible.length===0?
    <p className="text-xs text-muted-foreground">{ar?"أضف مصروفاً فعلياً في «المالية» واختر نوعه «للبيت» لعرضه هنا. لا يتم رفع مصروف تلقائياً.":(lang==="fr"?frenchUI("Add a real, paid household-marked entry in Money first. No expense is uploaded automatically."):"Add a real, paid household-marked entry in Money first. No expense is uploaded automatically.")}</p>:null}
   {chosen&&<div className="rounded-xl border border-[#DFE8DC] bg-[#F5F9F1] p-3 text-xs">
     <p className="font-semibold">{ar?"ستظهر للبالغين بهذه الأسرة البيانات التالية فقط:":(lang==="fr"?frenchUI("Other adults will see ONLY these fields:"):"Other adults will see ONLY these fields:")}</p>
     <p className="mt-2">{chosen.category} · {formatSharedJod(chosen.amountFils)} · {chosen.occurredOn}</p>
     <p className="mt-1 text-muted-foreground">{ar?"مع مرجع معاملة داخلي واسم صاحب المشاركة ضمن العضوية. لا تشارك الملاحظات أو أسماء الأطفال.":(lang==="fr"?frenchUI("Along with a reference to your account membership. Notes, child names and other spending are excluded."):"Along with a reference to your account membership. Notes, child names and other spending are excluded.")}</p>
    </div>}
   <label className="flex items-start gap-2 text-xs">
    <input type="checkbox" className="mt-0.5 size-4 accent-[#426958]" checked={consent} disabled={!chosen||busy}
     onChange={e=>setConsent(e.target.checked)}/>
    {ar?"أوافق صراحة على مشاركة هذا المصروف وحده مع البالغين في هذه الأسرة.":(lang==="fr"?frenchUI("I explicitly agree to share this one expense with the adults in this household."):"I explicitly agree to share this one expense with the adults in this household.")}
   </label>
   <Button type="submit" disabled={busy||loading||!chosen||!consent}><Share2 className="size-4"/>{ar?"شارك هذا المصروف":(lang==="fr"?frenchUI("Share this one expense"):"Share this one expense")}</Button>
  </form>
  <div className="mt-4">
   <h4 className="flex items-center gap-2 text-sm font-semibold"><ShieldCheck className="size-4 text-brand"/>{ar?"آخر المصاريف المشتركة":(lang==="fr"?frenchUI("Recently shared expenses"):"Recently shared expenses")}</h4>
   {loading?<p className="mt-2 text-xs text-muted-foreground">{ar?"جارٍ التحقق":(lang==="fr"?frenchUI("Loading verified records…"):"Loading verified records…")}</p>:
    rows.length===0?<p className="mt-2 text-xs text-muted-foreground">{ar?"لا توجد مصاريف مشتركة ظاهرة حالياً.":(lang==="fr"?frenchUI("No shared expense entries are currently visible."):"No shared expense entries are currently visible.")}</p>:
    <ul className="mt-2 space-y-2">{rows.map(row=><li key={row.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#E1E8DD] bg-white p-3 text-xs">
      <div>
       <p className="font-semibold">{row.category} · {formatSharedJod(row.amount_fils)}</p>
       <p className="mt-1 text-muted-foreground">{row.occurred_on} · {row.created_by===userId?(ar?"شاركته أنت":(lang==="fr"?frenchUI("Shared by you"):"Shared by you")):(ar?"شاركه شخص بالغ آخر":(lang==="fr"?frenchUI("Shared by another adult"):"Shared by another adult"))}</p>
      </div>
      {row.created_by===userId&&<Button type="button" variant="outline" size="sm" disabled={busy}
       onClick={()=>withdraw(row)}><Trash2 className="size-3.5"/>{ar?"إزالة":(lang==="fr"?frenchUI("Withdraw"):"Withdraw")}</Button>}
    </li>)}</ul>}
   {rows.length>=200&&<p className="mt-2 text-xs text-muted-foreground">{ar?"تظهر أحدث ٢٠٠ عملية فقط.":(lang==="fr"?frenchUI("Showing the latest 200 records only."):"Showing the latest 200 records only.")}</p>}
  </div>
  <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">{ar?"لا تتم مزامنة أي ميزانية أو عملية دفع أو تعديل للمصروف المحلي. يمكنك إزالة النسخة المشتركة، لكن لا يمكن استعادة نسخ شاهدها الآخرون أو التقطوا صوراً لها.":(lang==="fr"?frenchUI("This is not bidirectional financial sync, automatic payment tracking or approval. You may withdraw the server copy, but cannot recall information others already viewed or copied."):"This is not bidirectional financial sync, automatic payment tracking or approval. You may withdraw the server copy, but cannot recall information others already viewed or copied.")}</p>
 </section>;
}
