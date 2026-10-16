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
  messageEn:"Enter your real monthly income, expected costs and savings goal. We'll show whether those three amounts fit together—not an estimated bank balance.",
  messageAr:"أدخل دخل العائلة الشهري ومصاريفها المتوقعة وهدف الادخار. سنوضح إذا الأرقام بتتناسب مع بعض، وليس كم عندك بالبنك."};
 if(a.status==="deficit")return {state:"deficit",
  titleEn:"Your monthly plan needs an adjustment",titleAr:"ميزانيتك الشهرية بحاجة لتعديل",
  messageEn:"You've planned "+num(a.categories)+" JOD for spending and "+num(a.savings)+" JOD for savings, but your plan is "+num(a.gap)+" JOD above this month's income and any budget carryover. Review a cost or goal before adding more spending.",
  messageAr:"خططت لمصاريف "+num(a.categories)+" د.أ وادخار "+num(a.savings)+" د.أ. خطتك أعلى من الدخل وما تبقى من ميزانية سابقة بـ"+num(a.gap)+" د.أ. راجع مصروفاً أو هدفاً قبل التزامات جديدة."};
 if(a.status==="surplus")return {state:"surplus",
  titleEn:"You have room left in your monthly plan",titleAr:"عندك هامش غير مخصّص بالميزانية الشهرية",
  messageEn:"After your planned costs and savings goal, "+num(a.gap)+" JOD is still unassigned in your monthly budget. You could keep it for surprises, increase your savings goal or plan something enjoyable. This is NOT confirmed cash to spend.",
  messageAr:"بعد المصاريف المخططة وهدف الادخار، يبقى "+num(a.gap)+" د.أ غير مخصّص بالميزانية الشهرية. فيك تتركه للمفاجآت أو تزيد الادخار أو تخطط لنشاط. هذا ليس رصيداً نقدياً مؤكداً."};
 return {state:"balanced",
  titleEn:"Your monthly plan adds up",titleAr:"خطة الشهر متوازنة على الورق",
  messageEn:"Your expected costs and savings goal account for your monthly income and any budget carryover. No extra room is planned. Check actual bills and cash separately before making a purchase.",
  messageAr:"مصاريفك المتوقعة وهدف الادخار موزّعين على الدخل وما تبقى من ميزانية سابقة. ما في هامش إضافي بالخطة. راجع الفواتير والرصيد الفعلي قبل أي شراء."};
}
