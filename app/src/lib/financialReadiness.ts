import {computeMoney,type MoneyState} from "./money";
import {getMoneyOverview} from "./moneyOverview";
import {scheduleDates} from "./cashflow";
import type {FamilyPlan} from "./familyPlans";
export type FinancialReadiness={
 level:"sample"|"setup"|"details"|"caution"|"ready";
 budgetReady:boolean;savingsReady:boolean;cashKnown:boolean;cashFresh:boolean;billsReviewed:boolean;
 invalidBills:number;next:"income"|"savings"|"cash"|"bills"|"cash-date"|"risk"|"none";
};
export const monthOf=(at=new Date())=>at.getFullYear()+"-"+String(at.getMonth()+1).padStart(2,"0");
export function getFinancialReadiness(state:MoneyState,now=new Date(),plans:readonly FamilyPlan[]=[]):FinancialReadiness{
 const m=computeMoney(state,now),overview=getMoneyOverview(state,now,plans);
 const budgetReady=state.financialInputsPartial!==true&&(m.monthlyIncome>0||state.incomeKnown===true)&&state.categories.length>0&&
  state.categories.every(c=>Number.isFinite(c.planned)&&c.planned>=0);
 // Savings are optional: zero is a valid choice, not an incomplete household.
 const savingsReady=true;
 const cashKnown=overview.cashSet;
 const last=state.cashUpdatedAt&&/^\d{4}-\d{2}-\d{2}/.test(state.cashUpdatedAt)?
  new Date(state.cashUpdatedAt.slice(0,10)+"T12:00:00"):null;
 const elapsed=last?now.getTime()-last.getTime():Infinity;
 const cashFresh=!!last&&elapsed>=-86400000&&elapsed<=35*86400000;
 const invalidBills=(state.commitments??[]).filter(c=>!c.dueDate||
  scheduleDates(c.dueDate,"once",c.dueDate,c.dueDate).length!==1).length;
 // A birthday bill does not prove that rent, utilities or other necessities were reviewed.
 const billsReviewed=(state.commitments??[]).length>0?invalidBills===0:
  state.noBillsConfirmedMonth===monthOf(now);
 const caution=overview.forecast.overdueCount>0||
  overview.cashAfterBills!==null&&overview.cashAfterBills<0;
 const next:FinancialReadiness["next"]=!budgetReady?"income":!cashKnown?"cash":
  !billsReviewed?"bills":!cashFresh?"cash-date":caution?"risk":"none";
 const level:FinancialReadiness["level"]=state.demo?"sample":!budgetReady?"setup":
  !cashKnown||!cashFresh||!billsReviewed?"details":caution?"caution":"ready";
 return {level,budgetReady,savingsReady,cashKnown,cashFresh,billsReviewed,invalidBills,next};
}
