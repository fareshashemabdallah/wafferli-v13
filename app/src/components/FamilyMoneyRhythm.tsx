import {useEffect,useState} from "react";
import {useI18n} from "@/lib/i18n";
import {useLocalState} from "@/lib/storage";
import {FAMILY_PLANS_KEY,type FamilyPlan} from "@/lib/familyPlans";
import {sampleMembers,type Member,type MoneyState} from "@/lib/money";
import type {FamilyMoment} from "@/lib/familyCalendar";
import {canonicalPlanViews} from "@/lib/canonicalFamilyFacts";
import {emptyRealMoney} from "@/lib/moneyOverview";
import {localToday} from "@/lib/cashflow";
import {buildFamilyMoneyRhythm} from "@/lib/familyMoneyRhythm";
import {hasEnteredMonthlyIncome,type PlanSetupStep} from "@/lib/planBudgetSetup";
import type {CategoryPicture} from "@/lib/familyCategoryCards";
import {FamilyMoneyPrototypeHome} from "./FamilyMoneyPrototypeHome";
import {FamilyMoneyQuickEdit,type QuickMoneyEditor} from "./FamilyMoneyQuickEdit";
import {QuickExpenseEntry} from "./QuickExpenseEntry";
import {MonthAllowanceAdjustment} from "./MonthAllowanceAdjustment";
import {FamilyCategoryEditor} from "./FamilyCategoryEditor";

type Props={state:MoneyState;setState:(next:MoneyState|((prev:MoneyState)=>MoneyState))=>void;
 onBills:()=>void;onSpending:()=>void;onCategories:()=>void;requestedSetupStep?:PlanSetupStep|null};
/** Intentionally one Money surface. Obsolete pace, annual and parallel
 * timeline screens have been removed; canonical dates, bills, history and
 * forecasts stay untouched in MoneyState and their financial domain modules.
 */
export function FamilyMoneyRhythm({state,setState,onSpending,onCategories,requestedSetupStep=null}:Props){
 const {lang}=useI18n(),ar=lang==="ar",t=(en:string,a:string)=>ar?a:en;
 const [plans,,plansReady]=useLocalState<FamilyPlan[]>(FAMILY_PLANS_KEY,[]);
 const [members]=useLocalState<Member[]>("members",sampleMembers());
 const [events]=useLocalState<FamilyMoment[]>("familyCalendar",[]);
 const canonicalPlans=canonicalPlanViews(plans,events,members,ar);
 const [quickEdit,setQuickEdit]=useState<QuickMoneyEditor|null>(null);
 const [quickExpenseOpen,setQuickExpenseOpen]=useState(false);
 const [adjustingMonthCategory,setAdjustingMonthCategory]=useState<string|null>(null);
 const [editingCategory,setEditingCategory]=useState<{id?:string;starter?:CategoryPicture}|null>(null);
 const focusCategories=()=>{
  window.requestAnimationFrame?.(()=>onCategories());
 };
 useEffect(()=>{
  if(requestedSetupStep==="income")setQuickEdit("income");
  if(requestedSetupStep==="categories")focusCategories();
 },[requestedSetupStep]);
 const startOwnMoney=()=>{
  if(!state.demo||!window.confirm(t(
   "Replace example Money amounts with an empty personal Money record? Family members and plans are kept.",
   "استبدال مبالغ المال التجريبية بسجل حقيقي فارغ؟ تبقى سجلات العيلة والخطط محفوظة."
  )))return;
  setState(prev=>prev.demo?emptyRealMoney():prev);
 };
 const reviewBudget=()=>{
  if(state.demo||state.categories.length===0)return;
  if(!window.confirm(t(
   "Confirm that you reviewed the entered monthly budgets? This does not mean your family's whole spending is complete.",
   "تؤكد مراجعة الميزانيات المسجلة؟ لا يعني ذلك أن كل مصاريف العيلة أُدخلت."
  )))return;
  setState(prev=>({...prev,financialInputsPartial:false}));
 };
 const forecast=buildFamilyMoneyRhythm(state,plansReady?canonicalPlans:[],localToday(),30,true);
 return <section className="mx-auto max-w-[940px] space-y-3" aria-label={t("Family money rhythm","الإيقاع المالي للعيلة")} data-testid="family-money-rhythm">
  <div className="relative overflow-hidden rounded-[1.5rem] border border-[#DCEADC] bg-[linear-gradient(120deg,#EEF7E8,#FAF7E9_65%,#FFF0F1)] p-4 sm:p-6">
   <div className="relative z-10 max-w-[57%] sm:max-w-[66%]">
    <p className="text-xs font-extrabold tracking-wide text-[#4C8D68]">{t("OUR MONEY · FAMILY RHYTHM","مال العيلة · الإيقاع المالي")}</p>
    <h2 className="mt-2 text-xl font-black text-[#24573E] sm:text-2xl">{t("Spend wisely. Live well together.","اصرفوا بذكاء، وعيشوا منيح سوا.")}</h2>
    <p className="mt-2 text-xs leading-relaxed text-[#688273]">{t(
     "A clearer picture of what your family planned and actually spent.",
     "صورة أوضح عن ميزانية العيلة ومصاريفها الفعلية.")}</p>
   </div>
   <img src={import.meta.env.BASE_URL+"landing-family-characters.avif"} alt="" aria-hidden="true" loading="lazy"
    className="pointer-events-none absolute bottom-[-12px] end-0 h-[145px] w-[43%] object-contain object-bottom sm:h-[176px]"/>
  </div>
  {!!requestedSetupStep&&<section id="money-plan-setup" data-testid="money-plan-setup"
   className="scroll-mt-5 rounded-2xl border border-[#D9E6D8] bg-[#F5FAF2] p-4" aria-label={t("Money setup for your plan","المالية المطلوبة لخطتك")}>
   <h3 className="text-sm font-extrabold text-[#285E46]">{t("One money detail for your plan","معلومة مالية واحدة لخطتك")}</h3>
   <p className="mt-1 text-xs text-[#64816B]">{t(
    "Only update the information your plan needs. Existing amounts and records are kept.",
    "عدّل فقط ما تحتاجه خطتك. أرقامك وسجلاتك محفوظة.")}</p>
   <div className="mt-3 flex flex-wrap gap-2">
    {state.demo?<button type="button" onClick={startOwnMoney}
     className="min-h-11 rounded-xl bg-[#388A60] px-4 text-xs font-bold text-white">
     {t("Start real Money","ابدأ بمال العيلة الفعلي")}</button>:<>
     {(!hasEnteredMonthlyIncome(state)||requestedSetupStep==="income")&&<button type="button"
      onClick={()=>setQuickEdit("income")} className="min-h-11 rounded-xl bg-[#388A60] px-4 text-xs font-bold text-white">
      {t("Enter income","أدخل الدخل")}</button>}
     {(state.categories.length===0||requestedSetupStep==="categories")&&<button type="button"
      onClick={focusCategories} className="min-h-11 rounded-xl border border-[#B6D8BD] px-4 text-xs font-bold text-[#347D56]">
      {t("Manage categories","إدارة الفئات")}</button>}
     {requestedSetupStep==="review"&&state.categories.length>0&&<button type="button"
      onClick={reviewBudget} className="min-h-11 rounded-xl border border-[#B6D8BD] px-4 text-xs font-bold text-[#347D56]">
      {t("Confirm budget review","تأكيد مراجعة الميزانية")}</button>}
    </>}
    <button type="button" onClick={()=>window.history.back()}
     className="min-h-11 px-3 text-xs font-bold text-[#397D58] underline">{t("Return to my plan","العودة لخطتي")}</button>
   </div>
  </section>}
  {state.demo&&<p className="rounded-xl border border-[#E8D9BF] bg-[#FFF7E8] p-3 text-xs text-[#896C43]">
   {t("These are sample financial figures, not your family's records.",
    "هذه أرقام مالية تجريبية وليست سجلات العيلة.")}</p>}
  <FamilyMoneyPrototypeHome state={state} setState={setState} forecast={forecast}
   onIncome={()=>setQuickEdit("income")} onQuickAdd={()=>setQuickExpenseOpen(true)}
   onEditCategory={setEditingCategory}/>
  {quickExpenseOpen&&<QuickExpenseEntry state={state} setState={setState}
   onClose={()=>setQuickExpenseOpen(false)} onHistory={onSpending}/>}
  {quickEdit&&<FamilyMoneyQuickEdit kind={quickEdit} state={state} setState={setState}
   onClose={()=>setQuickEdit(null)}/>}
  {adjustingMonthCategory&&<MonthAllowanceAdjustment state={state} setState={setState}
   categoryId={adjustingMonthCategory} onClose={()=>setAdjustingMonthCategory(null)}/>}
  {editingCategory&&<FamilyCategoryEditor key={editingCategory.id??editingCategory.starter??"new"}
   state={state} setState={setState}
   {...(editingCategory.id?{categoryId:editingCategory.id}:{})}
   {...(editingCategory.starter?{starter:editingCategory.starter}:{})}
   onMonthPlan={setAdjustingMonthCategory} onAdvanced={focusCategories}
   onClose={()=>setEditingCategory(null)}/>}
 </section>;
}
