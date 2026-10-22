import {useState} from "react";
import {Plus} from "lucide-react";
import {OneMoneyDashboardSummary} from "./OneMoneyDashboardSummary";
import {FamilySpendingGroups} from "./FamilySpendingGroups";
import {useI18n} from "@/lib/i18n";
import {computeMoney,type MoneyState} from "@/lib/money";
import {type RhythmForecast} from "@/lib/familyMoneyRhythm";
import {fmtJOD} from "@/lib/storage";
import {localToday} from "@/lib/cashflow";
import {type CategoryPicture} from "@/lib/familyCategoryCards";

type Area="timeline"|"pace"|"annual";
type Props={
 state:MoneyState;setState:(v:MoneyState|((p:MoneyState)=>MoneyState))=>void;forecast:RhythmForecast;
 onArea:(screen:Area)=>void;onIncome:()=>void;onCash:()=>void;onSavings:()=>void;onBills:()=>void;onQuickAdd:()=>void;
 onSpending:()=>void;onCategories:()=>void;
 onEditCategory:(selection:{id?:string;starter?:CategoryPicture})=>void;
};
export function FamilyMoneyPrototypeHome({state,setState,forecast,onArea,onIncome,onCash,onSavings,onBills,onQuickAdd,onSpending,onCategories,onEditCategory}:Props){
 const {lang}=useI18n(),ar=lang==="ar",t=(en:string,a:string)=>ar?a:en;
 const [activeCategory,setActiveCategory]=useState<string|null>(null);
 const manage=(id:string)=>setActiveCategory(current=>current===id?null:id);
 const m=computeMoney(state),unknown=t("Not entered","غير مدخل");
 const shown=(n:number|null)=>n===null?unknown:fmtJOD(n);
 const sorted=forecast.events.filter(e=>e.kind!=="pace").slice(0,5);
 const recent=state.expenses.filter(e=>e.status!=="planned").sort((a,b)=>b.date.localeCompare(a.date)).slice(0,4);
 return <div className="space-y-3" data-testid="prototype-money-home">
  <OneMoneyDashboardSummary state={state} forecast={forecast}
   onIncome={onIncome} onCash={onCash} onSavings={onSavings}
   onBills={()=>document.getElementById("money-category-cards")?.scrollIntoView({behavior:"smooth"})} onExpense={onQuickAdd}
   onTimeline={()=>onArea("timeline")}/>
  <FamilySpendingGroups state={state} setState={setState}
   activeCategory={activeCategory} onClose={()=>setActiveCategory(null)}
   onManage={manage} onEditCategory={onEditCategory}/>
  <section className="space-y-2" aria-label={t("Next payments and income","الدفعات والدخل القادم")}>
   <div className="flex flex-wrap items-center justify-between gap-2">
    <h3 className="text-sm font-black text-[#305D44]">{t("Coming up next","المواعيد الجاية")}</h3>
    <button type="button" onClick={()=>onArea("timeline")}
     className="min-h-11 text-xs font-bold text-[#3E855E] underline">{t("Full timeline · 7 / 30 / 90 days","الجدول الكامل · ٧ / ٣٠ / ٩٠ يوم")}</button>
   </div>
   <div className="divide-y divide-[#EDF1EB] overflow-hidden rounded-2xl border border-[#E4EAE1] bg-white">
    {sorted.length?sorted.map(e=><div key={e.id} className="flex items-center gap-3 p-3">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#F2F8EE] text-xl" aria-hidden="true">{e.kind==="income"?"💵":e.kind==="annual"?"🚘":"🏠"}</span>
      <div className="min-w-0 flex-1"><p className="truncate text-xs font-bold text-[#355943]">{e.label}</p>
       <p className="text-[11px] text-[#78897C]">{e.date} · {e.kind==="income"?t("Expected, not received","متوقع مش مستلم"):t("Unpaid commitment","التزام غير مدفوع")}</p></div>
      <strong className="text-xs tabular-nums text-[#3E7B5C]">{e.amountJod>0?"+":"−"}{shown(Math.abs(e.amountJod))}</strong>
     </div>):<p className="p-4 text-xs text-[#829082]">{t("No dated income or bills entered yet.","ما في دخل أو فواتير مؤرخة بعد.")}</p>}
   </div>
   <button type="button" onClick={()=>document.getElementById("money-category-cards")?.scrollIntoView({behavior:"smooth"})}
    className="min-h-11 rounded-xl border border-[#BAD7C0] bg-white px-3 text-xs font-bold text-[#397B55]">{t("Manage due payments in categories","إدارة الدفعات من داخل الفئات")}</button>
   {(state.commitments??[]).some(b=>!b.categoryId||!state.categories.some(c=>c.id===b.categoryId))&&
    <button type="button" onClick={onBills} className="min-h-11 text-xs font-bold text-[#397B55] underline">{t("Review older uncategorized bills","مراجعة فواتير قديمة بلا فئة")}</button>}
  </section>
  <section className="space-y-2" aria-label={t("Recent paid expenses","آخر المصاريف المدفوعة")}>
   <div className="flex flex-wrap items-center justify-between gap-2">
    <h3 className="text-sm font-black text-[#305D44]">{t("Recently recorded","المصاريف المسجلة مؤخراً")}</h3>
    <button type="button" onClick={()=>document.getElementById("money-category-cards")?.scrollIntoView({behavior:"smooth"})}
      className="min-h-11 text-xs font-bold text-[#3E855E] underline">{t("Edit payments by category","عدّل الدفعات من الفئة")}</button>
   </div>
   <div className="divide-y divide-[#EDF1EB] overflow-hidden rounded-2xl border border-[#E4EAE1] bg-white">
    {recent.length?recent.map(x=><div key={x.id} className="flex items-center gap-3 p-3">
      <span className="text-xl" aria-hidden="true">🧾</span>
      <div className="min-w-0 flex-1"><strong className="block truncate text-xs text-[#365C44]">{state.categories.find(c=>c.id===x.categoryId)?.name??t("Uncategorized","غير مصنف")}</strong>
       <p className="text-[11px] text-[#839082]">{x.date}{x.note?" · "+x.note:""}</p></div>
      <strong className="text-xs text-[#3A8058]">{shown(x.amount)}</strong>
    </div>):<p className="p-4 text-xs text-[#7B8C7E]">{t("No paid expenses recorded yet.","ما في مصاريف مدفوعة مسجلة بعد.")}</p>}
   </div>
  </section>
  <div className="flex flex-wrap gap-2">
   <button type="button" onClick={onQuickAdd} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#3C9266] px-4 text-xs font-bold text-white"><Plus className="size-4"/>{t("Add an expense","سجّل مصروف")}</button>
   <button type="button" onClick={onIncome} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#BBDAC4] bg-white px-4 text-xs font-bold text-[#397B59]">{t("Edit payday","عدّل موعد الراتب")}</button>
  </div>
  <details className="rounded-2xl border border-[#E4EADF] bg-white p-3">
   <summary className="min-h-11 cursor-pointer text-xs font-bold text-[#4F7E60]">{t("More planning options (optional)","خيارات تخطيط إضافية (اختيارية)")}</summary>
   <div className="mt-2 flex flex-wrap gap-2">
    <button type="button" onClick={()=>onArea("annual")} className="min-h-11 rounded-xl border border-[#D0E3D1] px-3 text-xs font-bold text-[#397C56]">{t("Annual insurance, tax & property costs","التأمين والضرائب والمصاريف السنوية")}</button>
    <button type="button" onClick={()=>onArea("pace")} className="min-h-11 rounded-xl border border-[#D0E3D1] px-3 text-xs font-bold text-[#397C56]">{t("Customize spending timing","خصّص مواعيد توزيع الصرف")}</button>
    <button type="button" onClick={onCategories} className="min-h-11 rounded-xl border border-[#D0E3D1] px-3 text-xs font-bold text-[#397C56]">{t("Open category breakdown","تفاصيل المصاريف ضمن الفئات")}</button>
   </div>
  </details>
  <p className="text-[11px] leading-relaxed text-[#768678]">{t("This is an estimate using the records you entered. There is no bank connection; a plan never becomes a payment automatically.",
    "هذه توقعات من معلوماتك المدخلة. ما في ربط بنكي؛ الخطة مش دفعة فعلية إلا بعد تأكيدها.")}</p>
 </div>;
}
