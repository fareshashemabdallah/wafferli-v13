import {dateKey,parseCalendarDate} from "./familyCalendar";
export const OUTING_SHORTLIST_KEY="privateOutingOptions";
export type OutingOption={
 id:string;name:string;kind:"indoor"|"outdoor"|"mixed";
 checkedOn:string;
 totalEstimatedJod?:number;distanceKm?:number;
 childAdmission:"yes"|"no"|"unknown";
 ageFit:"yes"|"no"|"unknown";
 accessible:"yes"|"no"|"unknown";
 noise:"quiet"|"loud"|"unknown";
 note?:string;
};
export type OutingConstraints={
 children:"yes"|"no"|"unsure"; ages:string[];
 requireStroller:boolean;preferQuiet:boolean;
 weather:"unknown"|"clear"|"rain"|"heat";
 budgetJod:number|null;maxDistanceKm:number|null;
};
export type OutingAssessment={
 option:OutingOption;
 suitability:"needs-confirmation"|"not-suitable"|"provisional";
 reasonsEn:string[];reasonsAr:string[];
 costWithinBudget:boolean|null;distanceWithinLimit:boolean|null;
};
const validAmount=(n:unknown):n is number=>typeof n==="number"&&Number.isFinite(n)&&n>=0&&n<=100000&&
 Math.abs(n*100-Math.round(n*100))<0.00001;
const today=(now:Date)=>dateKey(now);
export function newOutingOption(input:OutingOption,now=new Date()):OutingOption{
 const name=input.name.trim().replace(/[\u0000-\u001f\u007f]/g," ").replace(/\s+/g," ").slice(0,110);
 if(!input.id||input.id.length>130||name.length<2||
  !["indoor","outdoor","mixed"].includes(input.kind)||
  !parseCalendarDate(input.checkedOn)||input.checkedOn>today(now)||
  !["yes","no","unknown"].includes(input.childAdmission)||
  !["yes","no","unknown"].includes(input.ageFit)||
  !["yes","no","unknown"].includes(input.accessible)||
  !["quiet","loud","unknown"].includes(input.noise)||
  input.totalEstimatedJod!==undefined&&!validAmount(input.totalEstimatedJod)||
  input.distanceKm!==undefined&&(!Number.isFinite(input.distanceKm)||input.distanceKm<0||input.distanceKm>2000))
  throw new Error("Enter valid, independently checked outing details");
 return {id:input.id,name,kind:input.kind,checkedOn:input.checkedOn,
  ...(input.totalEstimatedJod!==undefined?{totalEstimatedJod:input.totalEstimatedJod}:{}),
  ...(input.distanceKm!==undefined?{distanceKm:input.distanceKm}:{}),
  childAdmission:input.childAdmission,ageFit:input.ageFit,
  accessible:input.accessible,noise:input.noise,
  ...(input.note?.trim()?{note:input.note.trim().replace(/[\u0000-\u001f\u007f]/g," ").slice(0,200)}:{})};
}
/** Honest decision guardrails, NOT verified venue safety, live weather or AI.
 * Never label an option "safe"; parent-entered checks remain provisional.
 */
export function compareOutingOptions(
 options:readonly OutingOption[],requirements:OutingConstraints,now=new Date()
):OutingAssessment[]{
 const childAttending=requirements.children!=="no";
 const maxBudget=requirements.budgetJod!==null&&validAmount(requirements.budgetJod)?requirements.budgetJod:null;
 const maxDistance=requirements.maxDistanceKm!==null&&Number.isFinite(requirements.maxDistanceKm)&&requirements.maxDistanceKm>0?
 requirements.maxDistanceKm:null;
 return options.map(option=>{
  const en:string[]=[],ar:string[]=[];
  let blocked=false;
  const reason=(english:string,arabic:string,isBlock=false)=>{
   en.push(english);ar.push(arabic);if(isBlock)blocked=true;
  };
  if(childAttending){
   if(option.childAdmission==="no")reason("The venue reportedly does not admit children.","حسب معلوماتك، المكان لا يسمح بدخول الأطفال.",true);
   else if(option.childAdmission==="unknown")reason("Confirm whether children are admitted.","أكد إمكانية دخول الأطفال.");
   if(option.ageFit==="no")reason("The activity is reportedly unsuitable for the children's ages.","حسب معلوماتك، النشاط لا يناسب أعمار الأطفال.",true);
   else if(option.ageFit==="unknown")reason("Confirm suitability for each child's age.","تأكد من ملاءمة النشاط لأعمار الأطفال.");
   if(requirements.requireStroller){
    if(option.accessible==="no")reason("Step-free/stroller access is unavailable according to your notes.","حسب ملاحظاتك، لا يوجد وصول مناسب للعربة.",true);
    else if(option.accessible==="unknown")reason("Confirm stroller or step-free accessibility.","تأكد من وجود وصول مناسب لعربة الطفل.");
   }
   if(requirements.preferQuiet){
    if(option.noise==="loud")reason("May not suit your quiet-environment preference.","قد لا يناسب رغبتك في مكان هادئ.");
    if(option.noise==="unknown")reason("Noise level has not been checked.","مستوى الضجيج غير معروف.");
   }
  }
  if(option.kind!=="indoor"&&requirements.weather==="rain")
   reason("Rain was selected by you; verify conditions and indoor alternatives.","اخترت احتمال أمطار؛ تأكد من الطقس والبدائل الداخلية.");
  if(option.kind!=="indoor"&&requirements.weather==="heat")
   reason("Heat was selected by you; check shade, hydration and weather alerts.","اخترت احتمال حرّ؛ راجع الظل والماء وتنبيهات الطقس.");
  if(option.kind!=="indoor"&&requirements.weather==="unknown")
   reason("Check the actual weather before choosing an outdoor option.","تحقق من الطقس الفعلي قبل اختيار مكان خارجي.");
  const budget=option.totalEstimatedJod===undefined||maxBudget===null?null:option.totalEstimatedJod<=maxBudget;
  const distance=option.distanceKm===undefined||maxDistance===null?null:option.distanceKm<=maxDistance;
  if(budget===false)reason("Entered total exceeds your outing budget.","التكلفة التي أدخلتها أعلى من الميزانية.",true);
  if(distance===false)reason("Estimated distance exceeds your preferred limit.","المسافة التقديرية تتجاوز الحد المفضل.");
  if(maxBudget!==null&&option.totalEstimatedJod===undefined)
   reason("Full family cost has not been entered.","التكلفة الكاملة للعائلة غير مسجلة.");
  if(maxDistance!==null&&option.distanceKm===undefined)
   reason("Travel distance has not been checked.","لم يتم التحقق من مسافة الوصول.");
  const age=new Date(option.checkedOn+"T12:00:00Z"),current=new Date(today(now)+"T12:00:00Z");
  if((current.getTime()-age.getTime())/86400000>14)
   reason("Your venue notes are older than 14 days; recheck prices and admission.","ملاحظات المكان أقدم من ١٤ يوماً؛ أعد التحقق من السعر والدخول.");
  return {option,suitability:blocked?"not-suitable":en.length?"needs-confirmation":"provisional",
   reasonsEn:en.length?en:["No contradictions found in your notes; venue safety and availability still need checking."],
   reasonsAr:ar.length?ar:["لم تظهر تعارضات ضمن ملاحظاتك؛ لا يزال التحقق من الأمان والتوفر ضرورياً."],
   costWithinBudget:budget,distanceWithinLimit:distance};
 }).sort((a,b)=>{
  const order={"provisional":0,"needs-confirmation":1,"not-suitable":2};
  return order[a.suitability]-order[b.suitability]||
   (a.option.totalEstimatedJod??Infinity)-(b.option.totalEstimatedJod??Infinity)||
   a.option.name.localeCompare(b.option.name);
 });
}
