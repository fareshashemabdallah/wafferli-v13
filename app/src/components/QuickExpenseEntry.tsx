import {frenchUI} from "@/lib/french";
import {useEffect,useState,type FormEvent} from "react";
import {uid} from "@/lib/storage";
import {localToday} from "@/lib/cashflow";
import {useI18n} from "@/lib/i18n";
import type {MoneyState,Expense} from "@/lib/money";

type Props={state:MoneyState;setState:(next:MoneyState|((prev:MoneyState)=>MoneyState))=>void;
 onClose:()=>void;onHistory:()=>void};
const field="mt-1 min-h-11 w-full rounded-xl border border-[#DCE6D9] bg-white p-2.5 text-sm";
export function QuickExpenseEntry({state,setState,onClose,onHistory}:Props){
 const {lang}=useI18n(),ar=lang==="ar",t=(en:string,a:string)=>ar?a:lang==="fr"?frenchUI(en):en;
 const [amount,setAmount]=useState("");
 const [category,setCategory]=useState(state.categories[0]?.id??"uncategorized");
 const [date,setDate]=useState(localToday());
 const [status,setStatus]=useState<"paid"|"planned">("paid");
 const [note,setNote]=useState("");
 const [foodDelivery,setFoodDelivery]=useState(false);
 const [error,setError]=useState("");
 useEffect(()=>{const onKey=(event:KeyboardEvent)=>{if(event.key==="Escape")onClose();};
  window.addEventListener("keydown",onKey);return ()=>window.removeEventListener("keydown",onKey);},[onClose]);
 const save=(event:FormEvent)=>{event.preventDefault();
  const value=Number(amount);
  if(state.demo){setError(t("Start real Money before recording expenses.","ابدأ بمالية فعلية قبل تسجيل المصاريف."));return;}
  if(!/^\d{1,6}(?:\.\d{1,2})?$/.test(amount)||!Number.isFinite(value)||value<=0||value>100000||
   !/^\d{4}-\d{2}-\d{2}$/.test(date)||
   new Date(date+"T12:00:00").toISOString().slice(0,10)!==date||
   (category!=="uncategorized"&&!state.categories.some(c=>c.id===category))){
   setError(t("Enter a valid amount, date and category.","أدخل مبلغ وتاريخ وفئة صحيحة."));return;
  }
  const expense:Expense={id:uid(),date,amount:Math.round(value*100)/100,
   categoryId:category,status,shared:false,...(foodDelivery?{purpose:"food-delivery" as const}:{}),...(note.trim()?{note:note.trim().slice(0,160)}:{})};
  // Exactly one new expense. Confirming paid does not silently subtract cash:
  // the parent's manually entered opening balance is separate from this ledger.
  setState(previous=>previous.demo||previous.expenses.some(e=>e.id===expense.id)?previous:
   {...previous,expenses:[expense,...previous.expenses]});
  onClose();
 };
 return <div className="fixed inset-0 z-[80] flex items-start justify-center overflow-y-auto bg-[#173F2E]/70 p-3 pt-[min(7vh,48px)]"
  onMouseDown={e=>{if(e.currentTarget===e.target)onClose();}} role="presentation">
  <section role="dialog" aria-modal="true" aria-label={t("Quick add expense","إضافة مصروف سريع")}
   className="w-full max-w-lg rounded-[1.5rem] bg-[#FCFDF9] p-5 shadow-2xl">
   <div className="flex items-start justify-between gap-3">
    <div><p className="text-xs font-bold text-[#5D956E]">{t("OUR MONEY","مال العيلة")}</p>
     <h2 className="mt-1 text-xl font-extrabold text-[#2B6144]">{t("Add an expense","سجّل مصروف")}</h2>
     <p className="mt-1 text-xs text-[#738678]">{t("Just the essentials. Details can be added later.","بس المعلومات الأساسية. التفاصيل بتقدر تضيفها بعدين.")}</p></div>
    <button type="button" className="grid size-10 shrink-0 place-items-center rounded-full bg-[#E9F2E6] text-xl" aria-label={t("Close","إغلاق")} onClick={onClose}>×</button>
   </div>
   <form className="mt-4 space-y-3" onSubmit={save}>
    <label className="block text-xs font-bold text-[#5C745E]">{t("Amount · JOD","المبلغ · دينار")}
     <input autoFocus inputMode="decimal" type="number" min=".01" max="100000" step=".01" className={field}
      value={amount} onChange={e=>setAmount(e.target.value)} placeholder="0.00"/></label>
    <div className="grid grid-cols-2 gap-2">
     <label className="block text-xs font-bold text-[#5C745E]">{t("What for?","لأي مصروف؟")}
      <select className={field} value={category} onChange={e=>setCategory(e.target.value)}>
       <option value="uncategorized">{t("Not categorized yet","غير مصنّف بعد")}</option>
       {state.categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
      </select></label>
     <label className="block text-xs font-bold text-[#5C745E]">{t("Date","التاريخ")}
      <input className={field} type="date" value={date} onChange={e=>setDate(e.target.value)}/></label>
    </div>
    <fieldset className="rounded-xl border border-[#DCE8D9] p-3">
     <legend className="px-1 text-xs font-bold text-[#557360]">{t("Payment status","حالة الدفع")}</legend>
     <div className="flex gap-4">
      <label className="flex min-h-9 items-center gap-2 text-sm"><input type="radio" name="paid-status" checked={status==="paid"} onChange={()=>setStatus("paid")}/>
       {t("Paid","مدفوع")}</label>
      <label className="flex min-h-9 items-center gap-2 text-sm"><input type="radio" name="paid-status" checked={status==="planned"} onChange={()=>setStatus("planned")}/>
       {t("Planned","مخطط")}</label>
     </div>
    </fieldset>
    <label className="flex min-h-11 items-center gap-2 rounded-xl border border-[#DCE8D9] bg-white px-3 text-xs font-semibold text-[#50715E]">
     <input type="checkbox" checked={foodDelivery} onChange={e=>setFoodDelivery(e.target.checked)}/>
     {lang==="fr"?"Livraison de repas (facultatif)":t("Food delivery (optional)","توصيل أكل (اختياري)")}
    </label>
    <details className="rounded-xl border border-[#E2EADF] bg-white p-3">
     <summary className="min-h-10 cursor-pointer text-xs font-bold text-[#4A8460]">{t("Optional note","ملاحظة اختيارية")}</summary>
     <input className={field} maxLength={160} value={note} onChange={e=>setNote(e.target.value)}
      placeholder={t("e.g. Friday shopping","مثلاً تسوق الجمعة")}/></details>
    <p className="rounded-xl bg-[#F0F7EF] p-3 text-xs leading-relaxed text-[#617866]">
     {t("Paid expenses count once in your monthly spending. Planned items are not paid. Neither changes manually entered cash automatically.",
      "المصروف المدفوع ينحسب مرة واحدة بالشهر. المخطط مش مدفوع. ولا واحد بيغيّر السيولة المدخلة تلقائياً.")}</p>
    {error&&<p role="alert" className="rounded-xl bg-[#FFF0F0] p-3 text-xs font-semibold text-[#A94C5B]">{error}</p>}
    <div className="flex flex-wrap gap-2">
     <button type="submit" className="min-h-11 flex-1 rounded-xl bg-[#3C9163] px-4 text-sm font-extrabold text-white">{t("Save expense","احفظ المصروف")}</button>
     <button type="button" className="min-h-11 rounded-xl border border-[#CEE0D0] bg-white px-3 text-xs font-bold text-[#4E785F]"
      onClick={()=>{onClose();onHistory();}}>{t("Expense history","سجل المصاريف")}</button>
    </div>
   </form>
  </section>
 </div>;
}
