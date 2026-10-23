import {useState} from "react";
import {OneMoneyDashboardSummary} from "./OneMoneyDashboardSummary";
import {FamilySpendingGroups} from "./FamilySpendingGroups";
import {useI18n} from "@/lib/i18n";
import {computeMoney,type MoneyState} from "@/lib/money";
import {type RhythmForecast} from "@/lib/familyMoneyRhythm";
import {fmtJOD} from "@/lib/storage";
import {iconForCategory,pictureFor,type CategoryPicture} from "@/lib/familyCategoryCards";

type Area="timeline"|"pace"|"annual";
type Props={
 state:MoneyState;setState:(v:MoneyState|((p:MoneyState)=>MoneyState))=>void;forecast:RhythmForecast;
 onArea:(screen:Area)=>void;onIncome:()=>void;onCash:()=>void;onSavings:()=>void;onBills:()=>void;onQuickAdd:()=>void;
 onSpending:()=>void;onCategories:()=>void;
 onEditCategory:(selection:{id?:string;starter?:CategoryPicture})=>void;
};
/** One concise Money home. Detail is mounted only when requested; the
 * original category editor, paid ledger and grouped cost lines stay intact. */
export function FamilyMoneyPrototypeHome({state,setState,forecast,onArea,onIncome,onCash,onSavings,onBills,onQuickAdd,onSpending,onEditCategory}:Props){
 const {lang}=useI18n(),ar=lang==="ar",t=(en:string,a:string)=>ar?a:en;
 const [allCategories,setAllCategories]=useState(false);
 const [activeCategory,setActiveCategory]=useState<string|null>(null);
 const totals=computeMoney(state);
 const topCategories=[...state.categories].sort((a,b)=>totals.plannedBy(b.id)-totals.plannedBy(a.id)).slice(0,5);
 const scrollToDetails=()=>window.requestAnimationFrame?.(()=>{
  document.getElementById("active-money-category")?.scrollIntoView?.({behavior:"smooth",block:"start"});
 });
 const openCategory=(id:string)=>{
  setAllCategories(true);
  setActiveCategory(id);
  scrollToDetails();
 };
 const openAll=()=>{setAllCategories(true);setActiveCategory(null);};
 return <div className="space-y-3" data-testid="prototype-money-home">
  <OneMoneyDashboardSummary state={state} forecast={forecast}
   onIncome={onIncome} onCash={onCash} onSavings={onSavings}
   onBills={onBills} onExpense={onQuickAdd}
   onTimeline={()=>onArea("timeline")} onOpenCategory={openCategory}/>
  {!allCategories?<section id="money-category-preview" className="scroll-mt-4 space-y-3"
   aria-label={t("Where our money goes","وين بتروح مصاريف العيلة")}>
   <div className="flex flex-wrap items-center justify-between gap-2">
    <div><h3 className="text-base font-extrabold text-[#2B5944]">{t("Where our money goes","وين بتروح مصاريف العيلة")}</h3>
     <p className="mt-1 text-xs text-[#718675]">{t("Your main spending categories. Open one to manage its costs and payments.",
      "فئات المصاريف الأساسية. افتح أي فئة لإدارة بنودها ودفعاتها.")}</p></div>
    <button type="button" onClick={openAll}
     className="min-h-11 rounded-xl border border-[#B6D8BD] bg-white px-4 text-xs font-bold text-[#347D56]">
     {t("View all categories","شوف كل الفئات")} →
    </button>
   </div>
   {topCategories.length>0?<div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5" data-testid="money-category-preview">
    {topCategories.map(cat=>{
     const pic=pictureFor(iconForCategory(cat));
     const total=totals.plannedBy(cat.id),paid=totals.spentBy(cat.id);
     const pct=total>0?Math.max(0,Math.min(100,paid/total*100)):0;
     return <button key={cat.id} type="button" data-testid={"money-preview-category-"+cat.id}
      aria-label={cat.name+" · "+t("Manage costs and payments","إدارة البنود والدفعات")}
      className="min-w-0 rounded-2xl border border-[#E1E9DE] bg-white p-3 text-start transition hover:border-[#83BA9B] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#38865B]"
      onClick={()=>openCategory(cat.id)}>
      <span className="grid size-10 place-items-center rounded-xl text-xl" aria-hidden="true" style={{background:pic.bg}}>{pic.icon}</span>
      <strong className="mt-2 block truncate text-sm text-[#315B43]">{cat.name}</strong>
      <span className="mt-1 block text-sm font-bold tabular-nums text-[#315B43]">{fmtJOD(total)}</span>
      <span className="mt-1 block text-[11px] text-[#708675]">{t("Paid","مدفوع")}: {fmtJOD(paid)}</span>
      <span className="mt-2 block h-1.5 overflow-hidden rounded-full bg-[#EAF0E8]">
       <span className="block h-full rounded-full bg-[#58A981]" style={{width:pct+"%"}}/>
      </span>
     </button>;
    })}
   </div>:<div className="rounded-2xl border border-[#E1E9DE] bg-white p-4">
    <p className="text-sm text-[#6C8070]">{t("No categories entered yet. Add only the ones your family needs.",
     "ما في فئات مسجلة بعد. أضف فقط اللي بتحتاجه العيلة.")}</p>
    <button type="button" onClick={()=>onEditCategory({})} className="mt-2 min-h-11 rounded-xl bg-[#39875F] px-4 text-xs font-bold text-white">
     {t("Add a category","أضف فئة")}
    </button>
   </div>}
  </section>:
  <div className="space-y-3" data-testid="money-categories-expanded">
   <button type="button" onClick={()=>{setAllCategories(false);setActiveCategory(null)}}
    className="min-h-11 rounded-xl border border-[#B6D8BD] bg-white px-4 text-xs font-bold text-[#347D56]">
    ← {t("Back to category overview","رجوع لمختصر الفئات")}
   </button>
   <FamilySpendingGroups state={state} setState={setState}
    activeCategory={activeCategory} onClose={()=>setActiveCategory(null)}
    onManage={id=>setActiveCategory(current=>current===id?null:id)}
    onEditCategory={onEditCategory}/>
  </div>}
  <details className="rounded-2xl border border-[#E1E9DE] bg-white px-4 py-2">
   <summary className="flex min-h-11 cursor-pointer items-center text-xs font-bold text-[#467D5D]">
    {t("More planning tools (optional)","أدوات تخطيط إضافية (اختيارية)")}
   </summary>
   <div className="flex flex-wrap gap-2 border-t border-[#EDF1EA] py-3">
    <button type="button" onClick={onBills} className="min-h-11 rounded-xl border border-[#C7DFC9] px-3 text-xs font-semibold text-[#347D56]">
     {t("Bills and payments","الفواتير والدفعات")}</button>
    <button type="button" onClick={()=>onArea("annual")} className="min-h-11 rounded-xl border border-[#C7DFC9] px-3 text-xs font-semibold text-[#347D56]">
     {t("Annual costs","المصاريف السنوية")}</button>
    <button type="button" onClick={()=>onArea("pace")} className="min-h-11 rounded-xl border border-[#C7DFC9] px-3 text-xs font-semibold text-[#347D56]">
     {t("Spending timing","توزيع مواعيد الصرف")}</button>
    <button type="button" onClick={onSpending} className="min-h-11 rounded-xl border border-[#C7DFC9] px-3 text-xs font-semibold text-[#347D56]">
     {t("Payment history","سجل المصاريف")}</button>
   </div>
  </details>
  <p className="text-[11px] leading-relaxed text-[#768678]">{t(
   "All amounts come from your existing records. Forecasts are estimates, not confirmed cash or automatic payments.",
   "كل الأرقام من السجلات نفسها. التوقعات تقديرات، مش سيولة مؤكدة أو دفعات تلقائية.")}</p>
 </div>;
}
