import type {Alignment} from "./financeAlignment";

export type BudgetPlainResult={
 state:"incomplete"|"balanced"|"deficit"|"surplus";
 titleEn:string;titleAr:string;messageEn:string;messageAr:string
};
const num=(n:number)=>Math.abs(n).toFixed(2);
/** First result a household sees after three inputs. Only a MONTHLY PLAN,
 * never actual bank cash or permission to spend. */
export function budgetPlainResult(a:Alignment):BudgetPlainResult{
 if(a.status==="incomplete")return {state:"incomplete",
  titleEn:"Start with your monthly family picture",titleAr:"ابدأ بصورة بسيطة عن ميزانية العائلة",
  messageEn:"Enter available income and spending estimates. Saving is optional. This shows a monthly plan, not your bank balance.",
  messageAr:"أدخل تقديرات الدخل والمصاريف المتاحة. الادخار اختياري. هذه خطة شهرية وليست رصيد البنك."};
 if(a.status==="deficit")return {state:"deficit",
  titleEn:"Your monthly plan shows a gap",titleAr:"خطة الشهر تُظهر فجوة",
  messageEn:"You've planned "+num(a.categories)+" JOD for spending and "+num(a.savings)+" JOD for savings, but your plan is "+num(a.gap)+" JOD above this month's income and any budget carryover. Review what is essential, what can wait, and whether income or payment timing can change. Don't assume all costs can be cut.",
  messageAr:"خططت لمصاريف "+num(a.categories)+" د.أ وادخار "+num(a.savings)+" د.أ. خطتك أعلى من الدخل وما تبقى من ميزانية سابقة بـ"+num(a.gap)+" د.أ. راجع الأساسيات وما يمكن تأجيله وخيارات الدخل أو مواعيد الدفع؛ مش كل مصروف قابل للتخفيض."};
 if(a.status==="surplus")return {state:"surplus",
  titleEn:"You have room left in your monthly plan",titleAr:"عندك هامش غير مخصّص بالميزانية الشهرية",
  messageEn:"After entered spending and any optional savings intention, "+num(a.gap)+" JOD is still unassigned in your monthly budget. You could keep it for surprises, increase your savings goal or plan something enjoyable. This is NOT confirmed cash to spend.",
  messageAr:"بعد المصاريف المخططة وأي ادخار اختياري، يبقى "+num(a.gap)+" د.أ غير مخصّص بالميزانية الشهرية. فيك تتركه للمفاجآت أو تزيد الادخار أو تخطط لنشاط. هذا ليس رصيداً نقدياً مؤكداً."};
 return {state:"balanced",
  titleEn:"Your monthly plan adds up",titleAr:"خطة الشهر متوازنة على الورق",
  messageEn:"Your expected costs and savings goal account for your monthly income and any budget carryover. No extra room is planned. Check actual bills and cash separately before making a purchase.",
  messageAr:"مصاريفك المتوقعة وهدف الادخار موزّعين على الدخل وما تبقى من ميزانية سابقة. ما في هامش إضافي بالخطة. راجع الفواتير والرصيد الفعلي قبل أي شراء."};
}
