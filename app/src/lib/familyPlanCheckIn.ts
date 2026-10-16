import {dateKey,parseCalendarDate,shiftDays} from "./familyCalendar";
import type {FamilyPlan} from "./familyPlans";

export type PlanCheckIn={
 state:"completed"|"overdue"|"soon"|"future"|"undated";
 headingEn:string;headingAr:string;
 detailEn:string;detailAr:string;
 canMove:boolean;
};
/** A saved plan is a reminder and intention, never an external booking or bill. */
export function checkFamilyPlan(plan:FamilyPlan,now=new Date()):PlanCheckIn{
 const canMove=plan.status!=="completed"&&!!plan.date&&
  (plan.kind==="outing"||plan.kind==="purchase"||plan.kind==="other")&&!plan.sourceRef&&!plan.expenseId;
 const fixed={canMove};
 if(plan.status==="completed")
  return {...fixed,state:"completed",
   headingEn:"You marked this plan completed",headingAr:"أكّدت أن الخطة اكتملت",
   detailEn:plan.actualJod===undefined?
    "No actual cost has been entered. The plan is completed, but no expense or payment was recorded.":
    "You recorded an actual cost for the plan. Check Money separately if you want to record a paid expense.",
   detailAr:plan.actualJod===undefined?
    "ما سجّلت تكلفة فعلية. الخطة مكتملة، لكن ما سجّلنا أي مصروف أو دفع.":
    "سجّلت التكلفة الفعلية للخطة. تسجيل مصروف مدفوع في المالية خطوة منفصلة."};
 if(!plan.date||!parseCalendarDate(plan.date))
  return {...fixed,state:"undated",
   headingEn:"This plan has no scheduled date",headingAr:"هالخطة ما إلها موعد محدد",
   detailEn:"You can compare options now and set a date only when you have decided.",
   detailAr:"فيك تقارن الخيارات وهلّق تحدد موعد لما تقرر."};
 const d=parseCalendarDate(plan.date)!;
 const delta=Math.round((d.getTime()-parseCalendarDate(dateKey(now))!.getTime())/86400000);
 if(delta<0)return {...fixed,state:"overdue",
  headingEn:"The planned date has passed",headingAr:"مرّ موعد الخطة",
  detailEn:"Did this happen, or should you change the plan? Dabberna hasn't assumed a booking, payment or completion.",
  detailAr:"صارت الخطة أو بدك تغيّرها؟ دبّرنا ما افترض أي حجز أو دفع أو إنجاز."};
 if(delta<=7)return {...fixed,state:"soon",
  headingEn:delta===0?"This plan is due today":"Your plan is coming up",
  headingAr:delta===0?"موعد الخطة اليوم":"موعد الخطة قريب",
  detailEn:"Check your selected option, latest price and availability. Confirm when the plan is done or change a flexible date.",
  detailAr:"تأكد من الخيار والسعر والتوفر الحالي. أكّد إنجاز الخطة أو غيّر الموعد إذا كان مرناً."};
 return {...fixed,state:"future",
  headingEn:"Your plan is on track for later",headingAr:"موعد خطتك لاحقاً",
  detailEn:"You can leave it as planned. Dabberna will surface it when you open the app closer to the date.",
  detailAr:"فينا نخليها متل ما هي. دبّرنا بيذكّرك فيها لما تفتح التطبيق قرب الموعد."};
}
export function postponeFlexiblePlan(plan:FamilyPlan,now=new Date()):FamilyPlan|null{
 const current=checkFamilyPlan(plan,now);
 if(!current.canMove||!plan.date)return null;
 const original=parseCalendarDate(plan.date);
 if(!original)return null;
 const today=parseCalendarDate(dateKey(now))!;
 const base=original.getTime()>today.getTime()?original:today;
 return {...plan,date:dateKey(shiftDays(base,7)),updatedAt:now.toISOString()};
}
export function markPlanDoneWithoutCost(plan:FamilyPlan,now=new Date()):FamilyPlan{
 if(plan.status==="completed")return plan;
 return {...plan,status:"completed",completedAt:now.toISOString(),updatedAt:now.toISOString()};
}
/** Explicit after-the-fact expense declaration; never touches bank or ledger. */
export function addPlanActualCost(plan:FamilyPlan,amount:number,now=new Date()):FamilyPlan|null{
 if(plan.status!=="completed"||plan.expenseId||
  !Number.isFinite(amount)||amount<0||amount>100000||
  Math.abs(amount*100-Math.round(amount*100))>.00001)return null;
 return {...plan,actualJod:Math.round(amount*100)/100,updatedAt:now.toISOString()};
}
