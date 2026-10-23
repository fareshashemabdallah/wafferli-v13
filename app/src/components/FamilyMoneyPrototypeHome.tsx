import {useState} from "react";
import {useI18n} from "@/lib/i18n";
import {computeMoney,type MoneyState} from "@/lib/money";
import {fmtJOD} from "@/lib/storage";
import {confirmedMonthPlan} from "@/lib/monthAwareMoney";
import {localToday} from "@/lib/cashflow";
import {type RhythmForecast} from "@/lib/familyMoneyRhythm";
import {STARTER_PICTURES,iconForCategory,pictureFor,visualGroupOf,type CategoryPicture} from "@/lib/familyCategoryCards";
import {OneMoneyDashboardSummary} from "./OneMoneyDashboardSummary";
import {UnifiedCategoryDetails} from "./UnifiedCategoryDetails";

type Area="timeline"|"pace"|"annual";
type Props={
 state:MoneyState;setState:(v:MoneyState|((p:MoneyState)=>MoneyState))=>void;forecast:RhythmForecast;
 onArea:(screen:Area)=>void;onIncome:()=>void;onCash:()=>void;onSavings:()=>void;onBills:()=>void;onQuickAdd:()=>void;
 onSpending:()=>void;onCategories:()=>void;
 onEditCategory:(selection:{id?:string;starter?:CategoryPicture})=>void;
};
/** The approved Money foundation: monthly numbers, spending mix, categories.
 * Money facts are read from canonical state and the existing category editor.
 * No second category breakdown, savings intake, or planning-tools menu.
 */
export function FamilyMoneyPrototypeHome({state,setState,forecast,onIncome,onBills,onQuickAdd,onEditCategory}:Props){
 const {lang}=useI18n(),ar=lang==="ar",t=(en:string,a:string)=>ar?a:en;
 const [showAll,setShowAll]=useState(false);
 const [activeCategory,setActiveCategory]=useState<string|null>(null);
 const totals=computeMoney(state);
 const allCategories=[...state.categories].sort((a,b)=>totals.plannedBy(b.id)-totals.plannedBy(a.id));
 const displayed=showAll?allCategories:allCategories.slice(0,5);
 const month=localToday().slice(0,7);
 const openCategory=(id:string)=>{
  setActiveCategory(id);
  window.requestAnimationFrame?.(()=>document.getElementById("active-money-category")?.scrollIntoView?.({behavior:"smooth",block:"start"}));
 };
 const back=()=>setActiveCategory(null);
 return <div className="space-y-4" data-testid="prototype-money-home">
  <OneMoneyDashboardSummary state={state} forecast={forecast}
   onIncome={onIncome} onBills={onBills} onExpense={onQuickAdd} onOpenCategory={openCategory}/>
  <section id="money-category-cards" className="scroll-mt-4 space-y-3"
   aria-label={t("Where our money goes","وين بتروح مصاريف العيلة")}>
   {activeCategory&&state.categories.some(c=>c.id===activeCategory)?<div className="space-y-3">
    <button type="button" onClick={back} className="min-h-11 rounded-xl border border-[#B6D8BD] bg-white px-4 text-xs font-bold text-[#347D56]">
     ← {t("Back to categories","الرجوع للفئات")}
    </button>
    <UnifiedCategoryDetails key={activeCategory} state={state} setState={setState} categoryId={activeCategory}
     onEdit={()=>onEditCategory({id:activeCategory})} onClose={back}/>
   </div>:<>
    <div className="flex flex-wrap items-center justify-between gap-2">
     <div>
      <h3 className="text-base font-extrabold text-[#2B5944]">{t("Where our money goes","وين بتروح مصاريف العيلة")}</h3>
      <p className="mt-1 text-xs text-[#718675]">{t("Select a category to record spending or edit its budget.",
       "اختَر فئة لتسجيل مصروف أو تعديل ميزانيتها.")}</p>
     </div>
     <button type="button" onClick={()=>onEditCategory({})}
      className="min-h-11 rounded-xl border border-[#B6D8BD] bg-white px-4 text-xs font-bold text-[#347D56]">
      + {t("Add category","أضف فئة")}
     </button>
    </div>
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5" data-testid="money-category-preview">
     {displayed.map(cat=>{
      const pic=pictureFor(iconForCategory(cat));
      const total=totals.plannedBy(cat.id),paid=totals.spentBy(cat.id);
      const pct=total>0?Math.max(0,Math.min(100,paid/total*100)):paid>0?100:0;
      const group=visualGroupOf(cat);
      const first=STARTER_PICTURES.some(p=>p.key===group)&&state.categories.find(c=>visualGroupOf(c)===group)?.id===cat.id;
      const testid=first?"category-picture-"+group:group==="custom"?"category-custom-"+cat.id:"category-id-"+cat.id;
      return <button key={cat.id} type="button" data-testid={testid}
       aria-label={cat.name+" · "+t("Costs and payments","بنود ودفعات")}
       className="min-w-0 rounded-2xl border border-[#E1E9DE] bg-white p-3 text-start transition hover:border-[#83BA9B] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#38865B]"
       onClick={()=>openCategory(cat.id)}>
       <span className="grid size-10 place-items-center rounded-xl text-xl" aria-hidden="true" style={{background:pic.bg}}>{pic.icon}</span>
       <strong className="mt-2 block truncate text-sm text-[#315B43]">{cat.name}</strong>
       <span className="mt-1 block text-sm font-bold tabular-nums text-[#315B43]">{fmtJOD(total)}</span>
       <span className="mt-1 block text-[11px] text-[#708675]">{t("Spent","مصروف")}: {fmtJOD(paid)}</span>
       {confirmedMonthPlan(state,cat.id,month)!==null&&<span className="mt-1 block text-[10px] font-semibold text-[#438567]">{t("Adjusted this month","معدّل هذا الشهر")}</span>}
       <span className="mt-2 block h-1.5 overflow-hidden rounded-full bg-[#EAF0E8]">
        <span className="block h-full rounded-full bg-[#58A981]" style={{width:pct+"%"}}/>
       </span>
      </button>;
     })}
     {allCategories.length===0&&STARTER_PICTURES.filter(p=>!(state.hiddenStarterGroups??[]).includes(p.key))
      .map(p=><button key={p.key} type="button" data-testid={"category-picture-"+p.key}
       onClick={()=>onEditCategory({starter:p.key})}
       className="rounded-2xl border border-[#E1E9DE] bg-white p-3 text-start">
       <span className="grid size-10 place-items-center rounded-xl text-xl" style={{background:p.bg}} aria-hidden="true">{p.icon}</span>
       <strong className="mt-2 block text-sm text-[#315B43]">{t(p.en,p.ar)}</strong>
       <span className="mt-1 block text-xs text-[#7E9080]">{t("Add budget","أضف ميزانية")}</span>
      </button>)}
    </div>
    {allCategories.length>5&&<button type="button"
     onClick={()=>setShowAll(!showAll)}
     className="min-h-11 rounded-xl border border-[#B6D8BD] bg-white px-4 text-sm font-semibold text-[#347D56]">
     {showAll?t("Show fewer categories","عرض فئات أقل"):t("View all categories","عرض كل الفئات")+" ("+allCategories.length+")"}
    </button>}
   </>}
  </section>
 </div>;
}
