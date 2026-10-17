import {assessImmediateSpending} from "./spendingScenario";
import type {FamilyPlan} from "./familyPlans";
import type {MoneyState} from "./money";
import type {SpendingScenario} from "./spendingScenario";

/** Only infer a price when the parent explicitly states JOD (including Arabic).
 * Never mistake child ages, dates or unnamed quantities for an expense.
 * If two prices appear, ask for one amount rather than guessing.
 */
export function explicitJodAmount(question:string):number|null {
 const western=question.replace(/[٠-٩]/g,d=>String(d.charCodeAt(0)-0x0660))
  .replace(/[۰-۹]/g,d=>String(d.charCodeAt(0)-0x06f0))
  .replace(/٫/g,".").replace(/٬/g,",");
 // Mixed currencies need an explicit conversion decision; never silently convert.
 if(/(?:usd|eur|gbp|دولار|يورو|\$|€|£)/iu.test(western))return null;
 // A choice between two costs is not a single proposed purchase.
 if(/\d[\d.,]*\s*(?:or|أو|او)\s*\d[\d.,]*\s*(?:jod|jd|دينار|دنانير|د\.?\s?أ)/iu.test(western))return null;
 const currency=String.raw`(?:jod|j\.?d\.?|jordanian\s+dinars?|dinars?|دنانير|دينار(?:اً)?|د\.?\s?أ\.?)`;
 const digits=String.raw`(?:\d[\d,.]*\d|\d)`;
 const regex=new RegExp(String.raw`(?:${currency}\s*(${digits})|(${digits})\s*${currency})`,"giu");
 const matches=[...western.matchAll(regex)];
 if(matches.length!==1)return null;
 const token=matches[0]?.[1]??matches[0]?.[2]??"";
 const digitsOnly=/^\d{1,6}(?:\.\d{1,2})?$/;
 const grouped=/^\d{1,3}(?:,\d{3})+(?:\.\d{1,2})?$/;
 if(!digitsOnly.test(token)&&!grouped.test(token))return null;
 const amount=Number(token.replaceAll(",",""));
 if(!Number.isFinite(amount)||amount<=0||amount>100000)return null;
 return Math.round(amount*100)/100;
}

const arReasons:Record<string,string>={
 "Enter a valid one-off amount in JOD (up to 2 decimals).":"أدخل مبلغاً صحيحاً بالدينار بحد أقصى منزلتين عشريتين.",
 "Demo finances cannot be used for a real spending decision.":"لا يمكن الاعتماد على الأرقام التجريبية لاتخاذ قرار إنفاق.",
 "Complete your real monthly income and category budget.":"أكمل الدخل الشهري الحقيقي وفئات الميزانية.",
 "Enter the actual cash balance held today.":"أدخل الرصيد النقدي الفعلي اليوم.",
 "Refresh and date-check your actual cash balance.":"حدّث رصيدك الفعلي وتاريخ تسجيله.",
 "Review unpaid bills with due dates or confirm none this month.":"راجع الفواتير غير المدفوعة ومواعيدها أو أكّد عدم وجودها هذا الشهر.",
 "Some scheduled income or bills have invalid or missing dates.":"بعض الدخل أو الفواتير تفتقد تواريخ صحيحة.",
 "Unable to calculate the recorded cash trajectory.":"تعذّر احتساب الرصيد المتوقع من المعلومات المسجّلة.",
 "At least one recorded bill is overdue or not confirmed paid.":"هناك فاتورة متأخرة أو غير مؤكدة السداد.",
 "The cost exceeds recorded cash after unpaid bills and reserve.":"المبلغ أكبر من الرصيد المسجّل بعد الفواتير والاحتياطي.",
 "The 30-day forecast's low point falls below your selected cash reserve after this payment.":"أدنى رصيد متوقع خلال ٣٠ يوماً ينخفض عن الاحتياطي الذي اخترته."
};
export type SpecificSpendingGuidance={
 outcome:SpendingScenario["outcome"];
 titleEn:string;titleAr:string;
 detailEn:string;detailAr:string;
 sourceEn:string;sourceAr:string;
 amountJod:number;
};

/** Reuses the conservative Money scenario engine; no extra financial model.
 * A provisional outcome is NEVER affirmative permission to spend.
 */
export function explainSpecificSpending(money:MoneyState,amountJod:number,now=new Date(),plans:readonly FamilyPlan[]=[]):SpecificSpendingGuidance{
 const result=assessImmediateSpending(money,amountJod,now,plans);
 const amount=amountJod.toFixed(2)+" JOD";
 const reasonsEn=result.riskReasons.slice(0,3).join(" ");
 const reasonsAr=result.riskReasons.slice(0,3).map(x=>arReasons[x]??"راجع تفاصيل المالية قبل الإنفاق.").join(" ");
 const disclaimerEn="This assumes payment today using your entered 30-day cash, dated bills and reserve. It excludes unrecorded daily costs; bank balances and incoming payments are not verified. No expense or booking was created.";
 const disclaimerAr="هذا تقدير لدفع المبلغ اليوم وفق الرصيد والفواتير المؤرخة والاحتياطي الذي أدخلته. لا يشمل المصاريف اليومية غير المسجلة، ولم نتحقق من الرصيد البنكي أو وصول الدخل. لم تُنشأ عملية شراء أو حجز.";
 const lowEn=result.projectedLowJod===null?"":" Estimated 30-day lowest cash after paying: "+result.projectedLowJod.toFixed(2)+" JOD.";
 const lowAr=result.projectedLowJod===null?"":" أدنى رصيد متوقع خلال ٣٠ يوماً بعد الدفع: "+result.projectedLowJod.toFixed(2)+" د.أ.";
 if(result.outcome==="unknown")return {
  outcome:"unknown",amountJod,
  titleEn:"We need a few more real figures",titleAr:"بحاجة لبعض الأرقام الفعلية",
  detailEn:"For "+amount+", I cannot make a reliable assessment yet. "+reasonsEn+" "+disclaimerEn,
  detailAr:"بالنسبة لمبلغ "+amount+"، ما فينا نعطي تقييماً موثوقاً بعد. "+reasonsAr+" "+disclaimerAr,
  sourceEn:"Money: spending scenario and data readiness",sourceAr:"المالية: محاكاة المصروف وجاهزية البيانات"
 };
 if(result.outcome==="review")return {
  outcome:"review",amountJod,
  titleEn:"This cost may put your finances under pressure",titleAr:"قد يضغط هذا المصروف على وضع العائلة",
  detailEn:"For "+amount+", "+reasonsEn+lowEn+" "+disclaimerEn,
  detailAr:"بالنسبة لمبلغ "+amount+"، "+reasonsAr+lowAr+" "+disclaimerAr,
  sourceEn:"Money: entered cash, bills, reserve and 30-day forecast",sourceAr:"المالية: الرصيد والفواتير والاحتياطي والتوقع لـ٣٠ يوماً"
 };
 return {
  outcome:"provisional",amountJod,
  titleEn:"No shortfall shown in your recorded scenario",titleAr:"لا يظهر عجز في السيناريو المسجل",
  detailEn:"For "+amount+", your currently recorded forecast does not indicate a shortfall from this payment."+lowEn+" This is NOT confirmation that the expense is affordable. "+disclaimerEn,
  detailAr:"بالنسبة لمبلغ "+amount+"، لا يظهر من الأرقام المسجّلة عجز بسبب هذه الدفعة."+lowAr+" هذا ليس تأكيداً أنك تستطيع تحمّل المصروف. "+disclaimerAr,
  sourceEn:"Money: entered cash, bills, reserve and 30-day forecast",sourceAr:"المالية: الرصيد والفواتير والاحتياطي والتوقع لـ٣٠ يوماً"
 };
}
