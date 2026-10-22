import type {MoneyState} from "./money";
import {STARTER_PICTURES,visualGroupOf} from "./familyCategoryCards";

/** Remove a budget category from the active family plan, without erasing paid
 * transactions or upcoming contractual obligations. History keeps its label. */
export function removeMoneyCategory(state:MoneyState,categoryId:string):MoneyState{
 const category=state.categories.find(c=>c.id===categoryId);
 if(!category||state.demo)return state;
 const group=visualGroupOf(category);
 const isStarter=STARTER_PICTURES.some(p=>p.key===group);
 const lastOfGroup=!state.categories.some(c=>c.id!==categoryId&&visualGroupOf(c)===group);
 const hiddenStarterGroups=isStarter&&lastOfGroup?
  [...new Set([...(state.hiddenStarterGroups??[]),group])]:state.hiddenStarterGroups??[];
 const keepItems=new Set(state.expenses.map(e=>e.budgetItemId).filter((v):v is string=>!!v));
 const monthPlans=Object.fromEntries(Object.entries(state.categoryMonthlyPlans??{}).map(([month,items])=>
  [month,Object.fromEntries(Object.entries(items).filter(([id])=>id!==categoryId))])
  .filter(([,items])=>Object.keys(items).length>0));
 const monthlyAdjustments=Object.fromEntries(Object.entries(state.monthlyAdjustments??{}).map(([month,row])=>
  [month,{...row,categoryDeltas:Object.fromEntries(Object.entries(row.categoryDeltas).filter(([id])=>id!==categoryId))}]));
 return {...state,
  categories:state.categories.filter(c=>c.id!==categoryId),
  hiddenStarterGroups,
  // Existing paid expenses keep the original ID; no financial ledger row is lost.
  retiredCategoryNames:{...(state.retiredCategoryNames??{}),[categoryId]:category.name},
  budgetItems:(state.budgetItems??[]).filter(i=>i.categoryId!==categoryId||keepItems.has(i.id))
   .map(i=>i.categoryId===categoryId?{...i,enabled:false}:i),
  spendingPaces:(state.spendingPaces??[]).filter(p=>p.categoryId!==categoryId),
  categoryMonthlyPlans:monthPlans,
  monthlyAdjustments,
  // Keep scheduled obligations and their due dates; only remove the category
  // affiliation, never mark them paid or silently cancel.
  commitments:(state.commitments??[]).map(c=>{
   if(c.categoryId!==categoryId)return c;
   const {categoryId:_removed,...bill}=c;
   return bill;
  }),
  financialInputsPartial:true
 };
}
