import {computeMoney,type MoneyState} from "./money";
import {getMoneyOverview} from "./moneyOverview";
import {roundJod} from "./cashflow";
import type {FamilyPlan} from "./familyPlans";
import {familyFinancialSummary} from "./familyFinancialCommitments";

export type RealityKind="unknown"|"essentials-gap"|"plan-gap"|"tight"|"room";
export type FinancialReality={
 kind:RealityKind;
 knownIncomeJod:number|null;
 essentialJod:number|null;
 otherPlannedJod:number;
 unclassifiedJod:number;
 unclassifiedCategoryCount:number;
 familyUpcomingJod:number;
 familyMonthlyPreparationJod:number;
 savingsIntentionJod:number;
 plannedGapJod:number|null;
 forecastCashRisk:boolean;
 confidence:"limited"|"estimated"|"reviewed";
 titleEn:string;titleAr:string;
 messageEn:string;messageAr:string;
 actionEn:string;actionAr:string;
};
/** Never use recurring goal amounts as proof of actual cash; no data is mutated.
 * Preserves unknown legacy category classifications instead of inferring necessity
 * from variable/fixed, and includes linked family bills only in dated cash-flow.
 */
export function assessFinancialReality(money:MoneyState,plans:readonly FamilyPlan[]=[],now=new Date()):FinancialReality{
 const summary=computeMoney(money,now);
 const budgetKnown=!money.demo&&money.categories.length>0&&
  (summary.monthlyIncome>0||money.incomeKnown===true||!!money.incomeSources?.length);
 const income=budgetKnown?roundJod(summary.monthlyIncome):null;
 const essential=money.categories.filter(x=>x.priority==="essential").reduce((n,c)=>n+summary.plannedBy(c.id),0);
 const other=money.categories.filter(x=>x.priority!=="essential").reduce((n,c)=>n+summary.plannedBy(c.id),0);
 const unclassifiedCategories=money.categories.filter(x=>!x.priority);
 const unclassified=unclassifiedCategories.reduce((n,c)=>n+summary.plannedBy(c.id),0);
 // A zero estimate in an unreviewed category is still incomplete information.
 const essentialKnown=money.categories.length>0&&unclassifiedCategories.length===0;
 const knownEssential=essentialKnown?roundJod(essential):null;
 const saving=roundJod(Math.max(0,summary.savingsTarget));
 const gap=income===null?null:roundJod(income-summary.planned-saving);
 const forecast=getMoneyOverview(money,now,plans);
 const family=familyFinancialSummary(plans,money,now);
 // Family occasions may already be accounted for in an expense category.
 // Surface their preparation needs without automatically adding them to
 // monthly spending, which could count the same commitment twice.
 const familyNoteEn=family.upcomingTotalJod>0?
  " Your family calendar also has "+family.upcomingTotalJod.toFixed(2)+
  " JOD of upcoming planned or confirmed costs (about "+family.monthlyPreparationJod.toFixed(2)+
  " JOD/month to prepare). Check if your categories already include them; these are not paid expenses.":"";
 const familyNoteAr=family.upcomingTotalJod>0?
  " يوجد أيضاً "+family.upcomingTotalJod.toFixed(2)+
  " د.أ من تكاليف المناسبات المخططة أو المؤكدة (نحو "+family.monthlyPreparationJod.toFixed(2)+
  " د.أ شهرياً للتحضير). راجع إن كانت ضمن الفئات المسجلة؛ ليست مصاريف مدفوعة.":"";
 const risk=forecast.forecast.overdueCount>0||
  (forecast.cashAfterBills!==null&&forecast.cashAfterBills<0)||
  (forecast.forecast.minimumBalance!==null&&forecast.forecast.minimumBalance<0);
 const confidence=income===null?"limited" as const:
  money.incomeConfidence==="confirmed"&&money.categories.every(c=>c.amountConfidence==="confirmed")?"reviewed" as const:"estimated" as const;
 const base={knownIncomeJod:income,essentialJod:knownEssential,otherPlannedJod:roundJod(other),
  unclassifiedJod:roundJod(unclassified),unclassifiedCategoryCount:unclassifiedCategories.length,
  familyUpcomingJod:family.upcomingTotalJod,familyMonthlyPreparationJod:family.monthlyPreparationJod,
  savingsIntentionJod:saving,plannedGapJod:gap,
  forecastCashRisk:risk,confidence};
 if(income===null)return {...base,kind:"unknown",
  titleEn:"Start with the numbers you know",titleAr:"ابدأ بالأرقام اللي بتعرفها",
  messageEn:"Add whatever income and essential-cost estimates you have. You can skip unknown details and savings; we won't guess whether you can afford something.",
  messageAr:"سجّل تقدير الدخل والمصاريف الأساسية المتاح عندك. فيك تترك المعلومات الناقصة والادخار لوقت لاحق؛ ما رح نخمن قدرتك على الدفع.",
  actionEn:"Review estimates",actionAr:"راجع التقديرات"};
 if(essential>income+.005)return {...base,kind:"essentials-gap",
  titleEn:"Your essentials may exceed your income",titleAr:"المصاريف الأساسية قد تتجاوز دخلك",
  messageEn:"The essential costs you entered exceed estimated monthly income by "+roundJod(essential-income).toFixed(2)+" JOD. Budgeting alone may not close that gap. Start by verifying essential costs, support or income options; we won't pressure you to cut important family activities as a substitute.",
  messageAr:"المصاريف الأساسية المدخلة أعلى من دخلك الشهري التقديري بـ"+roundJod(essential-income).toFixed(2)+" د.أ. التنظيم وحده قد لا يسدّ الفجوة. راجع الاحتياجات وخيارات الدعم أو الدخل بدون لوم أو اقتراح تخفيضات شكلية.",
  actionEn:"Review essentials and options",actionAr:"راجع الأساسيات والخيارات"};
 if(gap!==null&&gap<-.005)return {...base,kind:"plan-gap",
  titleEn:"Your monthly plan needs a realistic choice",titleAr:"خطة الشهر بحاجة لاختيار واقعي",
  messageEn:"Expected spending and optional savings exceed entered income by "+Math.abs(gap).toFixed(2)+" JOD. Review flexible commitments, timing or the savings intention; don't assume essential costs can be reduced."+familyNoteEn,
  messageAr:"المصاريف المتوقعة والادخار الاختياري أعلى من الدخل المدخل بـ"+Math.abs(gap).toFixed(2)+" د.أ. راجع المصاريف القابلة للتعديل أو مواعيدها أو نية الادخار، من دون افتراض تخفيض الاحتياجات الأساسية."+familyNoteAr,
  actionEn:"Compare possible changes",actionAr:"قارن الخيارات"};
 if(risk)return {...base,kind:"tight",
  titleEn:"Timing may make this month tight",titleAr:"مواعيد الدفعات قد تضغط هذا الشهر",
  messageEn:"Your recorded payment dates and cash estimate suggest possible pressure even if the monthly plan balances. Check cash, essentials and upcoming due dates; this is not a verified bank forecast.",
  messageAr:"مواعيد الدفعات والرصيد المدخل تشير لاحتمال ضغط، حتى لو كانت الميزانية الشهرية متوازنة. راجع السيولة والاحتياجات والمواعيد؛ هذا ليس توقعاً بنكياً مؤكداً.",
  actionEn:"Review due dates",actionAr:"راجع مواعيد الدفع"};
 if(money.financialInputsPartial===true)return {...base,kind:"unknown",
  titleEn:"This is only part of your family's money picture",titleAr:"هذه بس جزء من الصورة المالية للعيلة",
  messageEn:"You've entered some useful figures, but other household costs may still be missing. We won't treat the difference as money available to spend. Add another fact when you know it, or review the complete budget in Money.",
  messageAr:"أدخلت بعض الأرقام المفيدة، لكن قد تكون مصاريف أخرى ناقصة. ما رح نعتبر الفرق مبلغ متاح للصرف. أضف معلومة جديدة لما تعرفها أو راجع كامل الميزانية بصفحة المال.",
  actionEn:"Review the known costs",actionAr:"راجع المصاريف المعروفة"};
 if(unclassifiedCategories.length>0)return {...base,kind:"unknown",
  titleEn:"One detail would improve this picture",titleAr:"تفصيل واحد يحسّن الصورة",
  messageEn:"Your budget is recorded, but "+unclassifiedCategories.length+" categories ("+unclassified.toFixed(2)+" JOD estimated) aren't marked essential, protected or adjustable. Classify them when useful; until then we can't say which spending can realistically change.",
  messageAr:"الميزانية مسجلة، لكن هناك "+unclassifiedCategories.length+" فئات ("+unclassified.toFixed(2)+" د.أ مقدّرة) لم تُحدّد أهميتها. صنّفها عند الحاجة؛ لا يمكننا افتراض ما يمكن تخفيضه.",
  actionEn:"Review spending priorities",actionAr:"راجع أولويات المصاريف"};
 const familyNeedsReview=family.monthlyPreparationJod>Math.max(0,gap??0)+.005;
 return {...base,kind:"room",
  titleEn:familyNeedsReview?"Your categories balance; review upcoming occasions":"Your entered monthly plan appears manageable",
  titleAr:familyNeedsReview?"الفئات متوازنة لكن المناسبات القادمة تحتاج مراجعة":"خطة الشهر المسجلة تبدو قابلة للإدارة",
  messageEn:"The estimated plan leaves "+Math.max(0,gap??0).toFixed(2)+" JOD unallocated. This is planning room, not cash set aside or approval to spend. Keep enjoying what matters while checking payment dates and missing costs."+familyNoteEn,
  messageAr:"تبقى نحو "+Math.max(0,gap??0).toFixed(2)+" د.أ غير موزعة بالخطة. هذا ليس نقداً محفوظاً أو ضماناً للصرف. استمتع بما يهم العيلة مع مراجعة المواعيد والتكاليف الناقصة."+familyNoteAr,
  actionEn:"Review the plan",actionAr:"راجع الخطة"};
}
