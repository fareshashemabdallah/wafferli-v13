import {computeMoney,type MoneyState} from "./money";
import type {FamilyPreferences} from "./familyPreferences";
import {getFinancialReadiness} from "./financialReadiness";
import {getMoneyOverview} from "./moneyOverview";
import type {FamilyPlan} from "./familyPlans";
import {assessFinancialReality} from "./financialReality";

export type FamilyPriority = {
  id: "essentials-gap"|"cash-risk"|"goals-overallocated"|"goal-deadline"|"cash-missing"|"bills-missing"|"cash-stale"|"savings-purpose";
  severity: "attention"|"gentle";
  titleEn:string; titleAr:string;
  detailEn:string; detailAr:string;
  actionEn:string; actionAr:string;
};

/**
 * One explicit, actionable family-money priority for the Today page.
 * Advisory only: no balance changes, no data sent anywhere, no invented bank data.
 * Treat user-entered goals as intentions, not money actually held in an account.
 */
export function selectFamilyPriority(
  state:MoneyState,
  prefs:FamilyPreferences,
  now=new Date(),plans:readonly FamilyPlan[]=[]
):FamilyPriority|null {
  if(state.demo || !prefs.financeTips || prefs.notificationFrequency==="off")return null;
  const readiness=getFinancialReadiness(state,now,plans);
  // The Home and Money start-up screens already explain missing basic budgets.
  if(!readiness.budgetReady)return null;
  const reality=assessFinancialReality(state,plans,now);
  if(reality.kind==="essentials-gap")return {id:"essentials-gap",severity:"attention",titleEn:reality.titleEn,titleAr:reality.titleAr,detailEn:reality.messageEn,detailAr:reality.messageAr,actionEn:reality.actionEn,actionAr:reality.actionAr};
  const overview=getMoneyOverview(state,now,plans);
  if(overview.forecast.overdueCount>0 ||
     (overview.cashAfterBills!==null && overview.cashAfterBills<0) ||
     (overview.forecast.minimumBalance!==null && overview.forecast.minimumBalance<0)){
    return {
      id:"cash-risk",severity:"attention",
      titleEn:"Review your upcoming commitments",titleAr:"راجع التزاماتك القادمة",
      detailEn:"Recorded bills, cash or reserve indicate a possible shortfall. Check the dates and figures before making a new commitment.",
      detailAr:"الفواتير أو الرصيد أو الاحتياطي المسجّل يشير إلى احتمال وجود عجز. راجع التواريخ والمبالغ قبل أي التزام جديد.",
      actionEn:"Review finances",actionAr:"راجع المالية"
    };
  }
  const goals=state.savingsGoals??[];
  const monthlySavings=computeMoney(state,now).savingsTarget;
  const allocations=goals.reduce((total,g)=>total+(Number.isFinite(g.monthlyJod)&&g.monthlyJod>0?g.monthlyJod:0),0);
  if(goals.length>0 && allocations>monthlySavings+0.005){
    return {
      id:"goals-overallocated",severity:"attention",
      titleEn:"Your savings goals need balancing",titleAr:"أهداف الادخار بحاجة لتوازن",
      detailEn:"The monthly amounts assigned to individual goals exceed your overall savings target. Review the plan; nothing is deducted automatically.",
      detailAr:"مجموع التخصيص الشهري للأهداف أكبر من هدف الادخار العام. راجع الخطة؛ لا يتم خصم أي مبلغ تلقائياً.",
      actionEn:"Review savings goals",actionAr:"راجع أهداف الادخار"
    };
  }
  // Dates are local and calculations are deliberately approximate. A goal forecast
  // is not a prediction of account balances or proof of affordability.
  const today=new Date(now.getFullYear(),now.getMonth(),now.getDate(),12);
  const deadlineRisk=goals
    .filter(g=>g.savedJod<g.targetJod && typeof g.dueDate==="string" && /^\d{4}-\d{2}-\d{2}$/.test(g.dueDate))
    .map(g=>{
      const due=new Date(g.dueDate+"T12:00:00");
      const remainingMonths=(due.getTime()-today.getTime())/(86400000*30.4375);
      return {goal:g,remainingMonths};
    })
    .filter(x=>Number.isFinite(x.remainingMonths) && x.remainingMonths<=12 &&
      (x.remainingMonths<=0 || x.goal.monthlyJod*Math.max(0,x.remainingMonths)<x.goal.targetJod-x.goal.savedJod-0.005))
    .sort((a,b)=>a.remainingMonths-b.remainingMonths)[0];
  if(deadlineRisk){
    const name=deadlineRisk.goal.name.trim();
    return {
      id:"goal-deadline",severity:"attention",
      titleEn:name+" may need a savings adjustment",
      titleAr:"هدف "+name+" قد يحتاج تعديل",
      detailEn:"At the monthly amount you entered, you may miss the target date. Revisit the deadline or contribution; no funds are moved.",
      detailAr:"بحسب التخصيص الشهري الذي أدخلته، قد لا تصل للمبلغ بالموعد المحدّد. راجع الموعد أو المساهمة؛ لا يتم تحويل أموال.",
      actionEn:"Review this goal",actionAr:"راجع الهدف"
    };
  }
  if(!readiness.cashKnown){
    return {
      id:"cash-missing",severity:"attention",
      titleEn:"Add actual cash before deciding",titleAr:"أدخل الرصيد الفعلي قبل القرار",
      detailEn:"Your monthly plan is recorded, but an estimate is not the cash you have today. Enter your current cash balance for a more useful decision check.",
      detailAr:"الميزانية الشهرية مسجّلة، لكنها ليست الرصيد الموجود اليوم. أدخل الرصيد الحالي لتقييم قراراتك بشكل أوضح.",
      actionEn:"Add cash balance",actionAr:"أدخل الرصيد"
    };
  }
  if(!readiness.billsReviewed){
    return {
      id:"bills-missing",severity:"attention",
      titleEn:"Check the bills still to come",titleAr:"تأكد من الفواتير القادمة",
      detailEn:"Review unpaid scheduled bills and their due dates, or confirm there are none this month. Unlisted bills cannot be included in estimates.",
      detailAr:"راجع الفواتير غير المدفوعة ومواعيدها، أو أكّد عدم وجودها هذا الشهر. الفواتير غير المسجّلة لا تدخل بالحساب.",
      actionEn:"Review bills",actionAr:"راجع الفواتير"
    };
  }
  if(!readiness.cashFresh){
    return {
      id:"cash-stale",severity:"attention",
      titleEn:"Update your cash balance",titleAr:"حدّث رصيدك النقدي",
      detailEn:"Your last cash update is old or unconfirmed. Refresh it before relying on a spending assessment.",
      detailAr:"آخر تحديث للرصيد قديم أو غير مؤكد. حدّثه قبل الاعتماد على تقييم للمصاريف.",
      actionEn:"Update balance",actionAr:"حدّث الرصيد"
    };
  }
  if(goals.length===0 && prefs.notificationFrequency==="gentle" && monthlySavings>0){
    return {
      id:"savings-purpose",severity:"gentle",
      titleEn:"Give your monthly savings a purpose",titleAr:"خلّي للادخار الشهري هدف واضح",
      detailEn:"You have a monthly savings target. Name a family goal—such as emergencies, school or a trip—without changing your budget.",
      detailAr:"عندك هدف ادخار شهري. سمِّ له غاية للعائلة مثل الطوارئ أو المدرسة أو رحلة، بدون تغيير ميزانيتك.",
      actionEn:"Create a savings goal",actionAr:"أضف هدف ادخار"
    };
  }
  return null;
}
