import {allFamilyMoments,dateKey,parseCalendarDate,upcomingMoments,type FamilyMoment,type MomentOccurrence} from "./familyCalendar";
import type {Member,MoneyState} from "./money";
import {buildForecast,legacyIncome} from "./cashflow";

export type OccasionPlan={budgetJod:number|null;chosenIdea?:string;done?:string[];updatedAt?:string};
export type OccasionPlans=Record<string,OccasionPlan>;
export type OccasionIdea={id:string;en:string;ar:string;whyEn:string;whyAr:string;focus:"gift"|"experience"|"together";share:number};
export const planKey=(item:MomentOccurrence)=>item.id+"@"+item.occursOn.slice(0,4);
export const daysUntil=(date:string,now:Date)=>{
 const d=parseCalendarDate(date);
 if(!d)return Number.POSITIVE_INFINITY;
 return Math.round((d.getTime()-new Date(now.getFullYear(),now.getMonth(),now.getDate(),12).getTime())/86400000);
};
export function upcomingPlanEvents(events:FamilyMoment[],members:Member[],now:Date,days=100,arabic=false){
 return upcomingMoments(allFamilyMoments(events,members,arabic),now,days+1);
}
export function leadAdvice(days:number,ar:boolean):string{
 if(days>45)return ar?"وقت مناسب لابتكار فكرة والتعرّف على خيارات جديدة.":"You have time to explore ideas, not rush into buying.";
 if(days>21)return ar?"لنحدّد الفكرة والميزانية قبل أن تصبح الخيارات محدودة.":"Start your shortlist and comfortable budget now.";
 if(days>10)return ar?"قارن الجودة وكلفة التوصيل وتأكد من مواعيد الحجز.":"Compare quality, delivery and reservation lead times.";
 if(days>3)return ar?"اقترب الموعد. تأكد من الحجز أو الهدية وتفاصيل اليوم.":"Almost there: confirm the booking, gift and details.";
 return ar?"اليوم قريب جدًا: اختر خيارًا بسيطًا محليًا، دون شراء متسرّع.":"Very soon: choose a thoughtful local option without panic buying.";
}
export function birthdayAge(item:MomentOccurrence,members:Member[]):number|null{
 const m=members.find(m=>"member-birthday:"+m.id===item.id);
 const born=m?.birthday&&parseCalendarDate(m.birthday),on=parseCalendarDate(item.occursOn);
 return born&&on?on.getFullYear()-born.getFullYear():null;
}
export function ideaCategory(item:MomentOccurrence,members:Member[]):"kids-birthday"|"adult-birthday"|"anniversary"|"family-occasion"{
 if(item.kind==="birthday"){
  const m=members.find(m=>"member-birthday:"+m.id===item.id);
  return m?.role==="child"?"kids-birthday":"adult-birthday";
 }
 return item.kind==="anniversary"?"anniversary":"family-occasion";
}
const i=(id:string,en:string,ar:string,whyEn:string,whyAr:string,focus:OccasionIdea["focus"],share:number):OccasionIdea=>({id,en,ar,whyEn,whyAr,focus,share});
export function occasionIdeas(event:MomentOccurrence,members:Member[]):OccasionIdea[]{
 const c=ideaCategory(event,members),age=birthdayAge(event,members);
 if(c==="kids-birthday"){
  if(age!==null&&age<=5)return [
   i("storybook","An illustrated story starring their imagination","قصة مصوّرة مستوحاة من خيال الطفل","Personalize a story, then read it together. Check printing and delivery timing.","خصص قصة جميلة ثم اقرأها معه. تحقق من موعد الطباعة والتوصيل.","gift",0.45),
   i("treasure","A small treasure hunt at home or in the garden","رحلة بحث عن الكنز في البيت أو الحديقة","Create playful clues; the experience matters more than expensive decorations.","حضّر ألغازًا صغيرة، فاللحظة أهم من الزينة المكلفة.","experience",0.35),
   i("creative-play","A reusable creativity box and play afternoon","صندوق إبداع قابل للاستخدام مراراً","Choose safe age-appropriate supplies and build something together.","اختر أدوات آمنة تناسب العمر واصنعوا شيئًا معًا.","together",0.5)];
  if(age!==null&&age<=12)return [
   i("maker","Hands-on maker or science afternoon","يوم ابتكار وتجارب علمية بسيطة","A hands-on activity can provide repeat fun beyond the birthday.","نشاط عملي ممتع يمكن تكراره بعد عيد الميلاد.","experience",0.55),
   i("memory-map","A personalized adventure map and challenge day","خريطة مغامرة شخصية وتحديات","Design local clues around things they already enjoy.","اصنع تحديات مرتبطة بالأشياء التي يحبها الطفل.","together",0.35),
   i("building","A durable building or art kit","مجموعة تركيب أو فنون متينة","Compare durability and age suitability, not just the current hype.","قارن المتانة وملاءمة العمر، لا الموضة وحدها.","gift",0.5)];
  return [
   i("workshop","A skill workshop with a friend","ورشة مهارة برفقة صديق","Music, cooking, art or sport: choose an interest they actually have.","اختر موسيقى أو طبخًا أو فنًا أو رياضة وفق ميولهم.","experience",0.6),
   i("creation","A kit to make something truly their own","عدة لصنع شيء خاص بهم","Prefer lasting usefulness over a quick novelty.","اختر ما سيستخدمونه طويلًا بدلاً من هدية عابرة.","gift",0.5),
   i("day-together","One-on-one parent and child experience","وقت خاص بين الأهل والطفل","Let them choose the activity within the comfortable cap.","دعهم يختارون النشاط ضمن السقف المريح.","together",0.4)];
 }
 if(c==="anniversary")return [
  i("story-date","A 'story of us' date with meaningful stops","موعد رومانسي يروي حكايتكما","Revisit places or memories; add a handwritten note.","عودا إلى ذكريات أو أماكن مميزة، وأضيفا رسالة بخط اليد.","experience",0.55),
  i("memory-gift","A mini memory book or shared playlist","ألبوم ذكريات صغير أو قائمة أغنيات خاصة","Personal meaning without needing an extravagant purchase.","معنى شخصي جميل دون الحاجة إلى هدية باهظة.","gift",0.25),
  i("new-experience","Try something new together","جرّبا تجربة جديدة معًا","Choose a cooking class, nature trip or a restaurant you've wanted to try.","اختارا ورشة طبخ أو رحلة طبيعة أو مطعمًا جديدًا.","together",0.65)];
 if(c==="adult-birthday")return [
  i("interest-day","A day built around their favorite interest","يوم مخصص لهوايتهم المفضلة","Time and attention can matter more than the price tag.","الوقت والاهتمام قد يكونان أهم من السعر.","experience",0.55),
  i("quality-gift","One thoughtful, long-lasting gift","هدية واحدة مميزة تدوم","Focus on fit and quality; compare alternatives before buying.","ركّز على الجودة والملاءمة وقارن قبل الشراء.","gift",0.55),
  i("gather","A small celebration with close friends","احتفال دافئ مع الأصدقاء المقربين","Fewer guests and personal touches can feel more memorable.","جمع بسيط ولمسات شخصية قد يصنعان ذكرى أجمل.","together",0.6)];
 return [
  i("shared-moment","A meaningful family outing","تجربة عائلية تجمع الجميع","Make the occasion feel special without turning it into an expensive obligation.","اجعل المناسبة مميزة دون تحويلها إلى عبء مالي.","experience",0.5),
  i("thoughtful","A personalized card or small gift","رسالة شخصية مع هدية رمزية","Choose a meaningful gesture that reflects the person or event.","اختر لفتة تعكس الشخص أو المناسبة.","gift",0.3),
  i("host","A simple family celebration at home","احتفال عائلي بسيط في البيت","Use shared food, music and a memorable activity.","تشاركوا الطعام والموسيقى ونشاطًا ممتعًا.","together",0.45)];
}
export function eventBudgetGuidance(plan:OccasionPlan|undefined,money:MoneyState,now:Date):{status:"unset"|"demo"|"unknown"|"review"|"within";available:number|null}{
 const amount=plan?.budgetJod;
 if(amount==null||!Number.isFinite(amount)||amount<0)return {status:"unset",available:null};
 if(money.demo)return {status:"demo",available:null};
 // An empty bill schedule or incomplete dates must never be interpreted as zero expenses.
 if(!money.commitments?.length)return {status:"unknown",available:null};
 const balance=money.cashOnHand;
 if(balance==null||!Number.isFinite(balance))return {status:"unknown",available:null};
 const forecast=buildForecast({incomes:money.incomeSources??legacyIncome(money.income),commitments:money.commitments??[],openingBalance:balance,reserve:money.cashReserve??0,today:dateKey(now),days:90});
 const available=forecast.safeToSpend;
 if(forecast.missingDates>0)return {status:"unknown",available:null};
 if(available===null)return {status:"unknown",available:null};
 return {status:forecast.overdueCount>0||amount>available?"review":"within",available};
}
export function planningMilestones(days:number):Array<{id:string;en:string;ar:string;due:boolean}> {
 return [
  {id:"idea",en:"Pick a meaningful idea",ar:"اختيار فكرة تعبّر عن المناسبة",due:days<=45},
  {id:"compare",en:"Check real prices, quality and lead times",ar:"مقارنة الأسعار الفعلية والجودة ومواعيد التوصيل",due:days<=21},
  {id:"reserve",en:"Book or order after confirming details",ar:"تأكيد الحجز أو الطلب بعد التحقق",due:days<=14},
  {id:"finish",en:"Wrap up the personal touches",ar:"تجهيز اللمسات الشخصية",due:days<=4}
 ];
}
