import {frenchUI} from "@/lib/french";
import {useState,type FormEvent} from "react";
import {useI18n} from "@/lib/i18n";
import {localToday} from "@/lib/cashflow";
import type {MoneyState} from "@/lib/money";
import {confirmedMonthPlan,effectiveCategoryAllowance,validMoneyMonth,
 withConfirmedMonthPlan,withoutConfirmedMonthPlan} from "@/lib/monthAwareMoney";

type Props={state:MoneyState;categoryId:string;onClose:()=>void;
 setState:(fn:(state:MoneyState)=>MoneyState)=>void};
const money=(value:string)=>/^\d{1,6}(?:\.\d{1,2})?$/.test(value.trim())&&Number.isFinite(Number(value))&&
 Number(value)>=0&&Number(value)<=100000;
const input="mt-1 min-h-11 w-full rounded-xl border border-[#D7E4D5] bg-white p-2 text-sm text-[#335644]";
export function MonthAllowanceAdjustment({state,categoryId,setState,onClose}:Props){
 const {lang}=useI18n(),ar=lang==="ar",t=(en:string,a:string)=>ar?a:lang==="fr"?frenchUI(en):en;
 const cat=state.categories.find(c=>c.id===categoryId);
 const [month,setMonth]=useState(localToday().slice(0,7));
 const stored=confirmedMonthPlan(state,categoryId,month);
 const [amount,setAmount]=useState(String(stored??cat?.planned??0));
 const [error,setError]=useState("");
 const selectMonth=(value:string)=>{setMonth(value);
  setAmount(String(confirmedMonthPlan(state,categoryId,value)??cat?.planned??0));setError("");};
 if(!cat)return null;
 const save=(event:FormEvent)=>{event.preventDefault();setError("");
  if(!money(amount)||!validMoneyMonth(month)||state.demo){setError(t("Enter a valid amount and month for real Money.","أدخل مبلغ وشهر صحيحين ضمن المالية الفعلية."));return;}
  const next=withConfirmedMonthPlan(state,categoryId,month,Number(amount));
  if(!next){setError(t("Could not save this month. Review the category and amount.","تعذر حفظ الشهر. راجع الفئة والمبلغ."));return;}
  setState(()=>next);onClose();
 };
 return <div className="fixed inset-0 z-[75] flex items-center justify-center bg-[#193B2C]/70 p-3"
   role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget)onClose();}}>
   <section role="dialog" aria-modal="true" aria-label={t("Adjust a month's allowance","تعديل مخصص شهر")}
    className="max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-[1.35rem] bg-[#FBFDF9] p-5 shadow-2xl">
    <div className="flex items-start justify-between gap-2">
     <div><p className="text-[10px] font-black tracking-wide text-[#548867]">{t("YOUR FAMILY MONEY MAP","خريطة مال العيلة")}</p>
      <h2 className="mt-1 text-lg font-black text-[#2E6245]">{cat.name}</h2>
      <p className="mt-1 text-xs leading-relaxed text-[#718475]">
       {t("Does this category need a different allowance in a particular month? You decide; Dabberna doesn't change it automatically.",
        "هل هالفئة بحاجة لمخصص مختلف بشهر معيّن؟ القرار إلك، ودبّرنا ما بيغيّره تلقائياً.")}</p></div>
     <button type="button" aria-label={t("Close","إغلاق")} onClick={onClose}
      className="grid size-10 shrink-0 place-items-center rounded-full bg-[#EAF4E9] text-xl text-[#397654]">×</button>
    </div>
    <form onSubmit={save} className="mt-4 space-y-3">
     <div className="grid grid-cols-2 gap-2">
      <label className="text-xs font-bold text-[#536E5A]">{t("Which month?","أي شهر؟")}
       <input className={input} type="month" min={localToday().slice(0,7)} max={String(Number(localToday().slice(0,4))+2)+"-12"}
        value={month} onChange={e=>selectMonth(e.target.value)}/></label>
      <label className="text-xs font-bold text-[#536E5A]">{t("Plan for that month (JOD)","مخصص الشهر (دينار)")}
       <input className={input} type="number" min="0" max="100000" step=".01" inputMode="decimal"
        value={amount} onChange={e=>setAmount(e.target.value)}/></label>
     </div>
     <div className="grid grid-cols-2 gap-2 rounded-xl bg-[#F0F7EC] p-3 text-xs text-[#637B68]">
      <div><p>{t("Usual monthly allowance","المخصص المعتاد")}</p><strong className="mt-1 block text-sm">{cat.planned} JOD</strong></div>
      <div><p>{t("Confirmed for this month","المؤكد لهالشهر")}</p><strong className="mt-1 block text-sm">
       {stored===null?t("Not adjusted","بدون تعديل"):stored+" JOD"}</strong></div>
     </div>
     <p className="text-[11px] leading-relaxed text-[#708475]">{t(
      "This changes only the selected month's plan and forecasts. It won't record purchases, change other months or duplicate a scheduled bill.",
      "التغيير بيشمل خطة وتوقعات هالشهر بس. ما بيسجّل مشتريات، وما بيغيّر الشهور الثانية أو بيكرر فاتورة مجدولة.")}</p>
     {state.commitments?.some(b=>b.categoryId===categoryId)&&
      <p className="rounded-xl bg-[#FFF4E9] p-3 text-xs text-[#896E4F]">{t(
       "A bill is linked to this category. Its scheduled payment remains authoritative in the cash timeline; this allowance is not added as another bill.",
       "في فاتورة مرتبطة بهالفئة. الدفعة المجدولة بتبقى الأساس بالجدول، والمخصص ما بيصير فاتورة إضافية.")}</p>}
     {error&&<p role="alert" className="rounded-xl bg-[#FFF0F0] p-2 text-xs font-bold text-[#AC4B63]">{error}</p>}
     <div className="flex flex-wrap gap-2">
      <button type="submit" disabled={state.demo} className="min-h-11 flex-1 rounded-xl bg-[#3B8E61] px-4 text-xs font-extrabold text-white disabled:opacity-50">
       {t("Confirm this month's plan","أكّد خطة هالشهر")}</button>
      {stored!==null&&<button type="button" onClick={()=>{setState(s=>withoutConfirmedMonthPlan(s,categoryId,month));onClose();}}
       className="min-h-11 rounded-xl border border-[#DACCCB] bg-white px-3 text-xs font-bold text-[#9D626B]">
       {t("Use usual plan","ارجع للمعتاد")}</button>}
      <button type="button" onClick={onClose} className="min-h-11 rounded-xl border border-[#DCE7DA] bg-white px-3 text-xs">
       {t("Cancel","إلغاء")}</button>
     </div>
    </form>
   </section>
  </div>;
}
