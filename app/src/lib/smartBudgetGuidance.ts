import type {MoneyState,Expense} from "./money";
import {computeMoney} from "./money";
import {allocationOptions,varianceOf,type AllocationChoice} from "./financeAlignment";
import {roundJod,buildForecast,legacyIncome} from "./cashflow";

export type SmartVarianceGuidance={
 en:string;ar:string;detailsEn:string;detailsAr:string;
 ranked:AllocationChoice[];
 cautionEn:string;cautionAr:string;
};
/** Explainable, on-device contextual guidance. Never claim to be a live AI model. */
export function smartVarianceGuidance(state:MoneyState,expense:Expense,now=new Date()):SmartVarianceGuidance {
 const delta=varianceOf(expense),ym=expense.date.slice(0,7);
 const monthDate=new Date(Number(ym.slice(0,4)),Number(ym.slice(5,7))-1,15);
 const budget=computeMoney(state,monthDate);
 const category=state.categories.find(c=>c.id===expense.categoryId);
 const isFixed=category?.type==="fixed"||category?.type==="periodic"||!!expense.billId;
 const candidates=allocationOptions(state,delta,expense.categoryId,ym)
  .filter(choice=>delta<=0||choice.kind==="savings"||
   state.categories.some(c=>c.id===choice.categoryId&&c.priority==="flexible"));
 const bySlack=(choice:AllocationChoice)=>{
  if(choice.kind==="savings")return -10000;
  return roundJod(budget.plannedBy(choice.categoryId!)-budget.spentBy(choice.categoryId!));
 };
 const ranked=[...candidates].sort((a,b)=>{
  if(a.kind!==b.kind)return a.kind==="variable"?-1:1; // preserve savings if possible
  return bySlack(b)-bySlack(a);
 });
 const today=[now.getFullYear(),String(now.getMonth()+1).padStart(2,"0"),String(now.getDate()).padStart(2,"0")].join("-");
 const forecast=buildForecast({incomes:state.incomeSources??legacyIncome(state.income),
  commitments:state.commitments??[],openingBalance:state.cashOnHand??null,
  reserve:state.cashReserve??0,today,days:30});
 const risk=forecast.overdueCount>0||(forecast.minimumBalance!==null&&forecast.minimumBalance<0);
 const spare=ranked.find(x=>x.kind==="variable");
 if(delta>0)return {
  en:spare?"First consider flexible spending before touching savings.":
   "Keep this difference visible in next month's plan rather than silently reducing savings.",
  ar:spare?"الأفضل أولاً مراجعة المصاريف المرنة قبل تخفيض الادخار.":
   "احتفظ بالفرق واضحاً في خطة الشهر القادم بدلاً من خفض الادخار تلقائياً.",
  detailsEn:`You paid ${roundJod(delta).toFixed(2)} JOD above plan${isFixed?" on a bill or committed cost":""}. ${spare?"A category you explicitly marked flexible has room for a voluntary transfer.":"No flexible category currently has enough unspent allocation."} If you make no transfer, the difference is deducted from next month's budget calculation.`,
  detailsAr:`دفعت ${roundJod(delta).toFixed(2)} دينار فوق المخطط${isFixed?" على التزام أو فاتورة":""}. ${spare?"هناك فئة صنّفتها مرنة وفيها مخصص يمكن نقله بموافقتك.":"لا توجد حالياً فئة مرنة فيها مخصص كافٍ."} إذا لم تُجرِ توزيعاً، يُحتسب الفرق خصماً من ميزانية الشهر القادم.`,
  ranked,cautionEn:risk?"Upcoming bills or cash shortage need attention; avoid assuming the savings target is cash available.":
   "Category transfers adjust plans, not your actual bank balance.",
  cautionAr:risk?"توجد فواتير قادمة أو ضائقة سيولة؛ لا تفترض أن هدف الادخار مال متاح للدفع.":
   "نقل المخصصات يغيّر الخطة فقط، وليس رصيد البنك."
 };
 return {
  en:risk?"Consider keeping the saving available for upcoming commitments.":
   "Consider protecting more savings, or giving the next month extra flexibility.",
  ar:risk?"فكّر بالاحتفاظ بالوفر للالتزامات القريبة.":
   "يمكن تعزيز الادخار، أو الاحتفاظ بمرونة إضافية للشهر القادم.",
  detailsEn:`You paid ${roundJod(-delta).toFixed(2)} JOD less than planned. You can increase the savings goal or a flexible category for this month with approval, or leave the credit for next month's budget.`,
  detailsAr:`دفعت أقل من المخطط بـ${roundJod(-delta).toFixed(2)} دينار. يمكنك إضافة الوفر لهدف الادخار أو فئة مرنة لهذا الشهر بموافقتك، أو تركه رصيداً تخطيطياً للشهر القادم.`,
  ranked:ranked.sort((a,b)=>risk?(a.kind==="variable"?-1:1)-(b.kind==="variable"?-1:1):
    (a.kind==="savings"?-1:1)-(b.kind==="savings"?-1:1)),
  cautionEn:"This is a budget carryover, not a verified bank balance or a new deposit.",
  cautionAr:"هذا ترحيل ضمن الميزانية، وليس رصيد بنك مؤكداً أو إيداعاً جديداً."
 };
}
