import {useState,type FormEvent} from "react";
import {Link} from "@tanstack/react-router";
import {CalendarClock,CheckCircle2,Gift,Plus,Wallet,AlertTriangle,ListChecks} from "lucide-react";
import {useI18n} from "@/lib/i18n";
import {fmtJOD,uid,useLocalState,writeLocal} from "@/lib/storage";
import {type MomentOccurrence} from "@/lib/familyCalendar";
import {planKey,type OccasionPlans} from "@/lib/occasionAdvisor";
import {FAMILY_PLANS_KEY,ACTIVE_PLAN_KEY,makeFamilyPlan,type FamilyPlan,type OccasionPreparation,type OccasionCost} from "@/lib/familyPlans";
import {sampleMoney,type MoneyState} from "@/lib/money";
import {FAMILY_TASKS_KEY,makeFamilyTask,setTaskComplete,type FamilyTask} from "@/lib/familyTasks";
import {initialOccasionPreparation,validateOccasionPreparation,occasionFunding,occasionBudgetAdvice,type OccasionCostKind,occasionKinds} from "@/lib/occasionPreparation";

const panel="mt-3 rounded-2xl border border-[#EED9E4] bg-[#FFFCFD] p-4 sm:p-5";
const labels:Record<OccasionCostKind,{en:string;ar:string}>={
 gift:{en:"Gift",ar:"الهدية"},
 celebration:{en:"Celebration / activity",ar:"الاحتفال أو النشاط"},
 extras:{en:"Cake, decorations & extras",ar:"الكعكة والزينة وغيرها"}
};
const cents=(s:string):number|null=>{
 if(!/^(?:0|[1-9]\d{0,5})(?:\.\d{1,2})?$/.test(s))return null;
 const n=Number(s);return Number.isFinite(n)&&n<=100000?n:null;
};
export function OccasionPreparationSection({event,planId}:{event?:MomentOccurrence;planId?:string}){
 const {lang}=useI18n(),ar=lang==="ar";
 const t=(en:string,arabic:string)=>ar?arabic:en;
 const [plans,,plansReady]=useLocalState<FamilyPlan[]>(FAMILY_PLANS_KEY,[]);
 const [olderOccasions,,oldReady]=useLocalState<OccasionPlans>("occasionPlans",{});
 const [money,,moneyReady]=useLocalState<MoneyState>("money",sampleMoney());
 const [tasks,,tasksReady]=useLocalState<FamilyTask[]>(FAMILY_TASKS_KEY,[]);
 const [,,activeReady]=useLocalState<string|null>(ACTIVE_PLAN_KEY,null);
 const [status,setStatus]=useState("");
 const ref=event?"occasion:"+planKey(event):null;
 const plan=planId?plans.find(p=>p.id===planId):plans.find(p=>p.sourceRef===ref);
 const ready=plansReady&&moneyReady&&tasksReady&&activeReady&&oldReady;
 const create=()=>{
  if(!event||!ready)return;
  const existing=plans.find(p=>p.sourceRef===ref);
  if(existing){writeLocal(ACTIVE_PLAN_KEY,existing.id);return;}
  const legacyCeiling=olderOccasions[planKey(event)]?.budgetJod;
  const candidate=makeFamilyPlan({id:uid(),kind:"occasion",title:event.title,date:event.occursOn,sourceRef:ref!,
   ...(typeof legacyCeiling==="number"&&Number.isFinite(legacyCeiling)&&legacyCeiling>=0&&legacyCeiling<=100000?{budgetJod:legacyCeiling}:{})});
  if(!candidate)return;
  if(!writeLocal(FAMILY_PLANS_KEY,[candidate,...plans])){
   setStatus(t("Unable to save the plan on this device.","تعذّر حفظ الخطة على هذا الجهاز."));return;
  }
  writeLocal(ACTIVE_PLAN_KEY,candidate.id);
  setStatus(t("Occasion plan created. No financial records changed.","تم إنشاء خطة المناسبة من دون تغيير السجلات المالية."));
 };
 if(!ready)return null;
 if(!plan)return event?<section className={panel} aria-label={t("Occasion preparations","تجهيز المناسبة")}>
   <div className="flex items-center gap-2"><Gift className="size-5 text-[#BE5A8B]"/>
    <h3 className="font-bold">{t("Prepare "+event.title,"تجهيز "+event.title)}</h3></div>
   <p className="mt-2 text-sm text-[#667286]">{t(
    "Plan the gift, celebration, funding and deadlines right here, using this calendar date.",
    "رتّب الهدية والاحتفال والميزانية والمواعيد من نفس المناسبة بالتقويم.")}</p>
   <button onClick={create} type="button" className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-full bg-[#BF5785] px-4 text-sm font-bold text-white">
    <Plus className="size-4"/>{t("Prepare this occasion","حضّر لهذه المناسبة")}</button>
   {status&&<p role="status" className="mt-2 text-xs text-[#357B66]">{status}</p>}
  </section>:null;
 const date=event?.occursOn??plan.date??"";
 return <OccasionPreparationEditor key={plan.id} plan={plan} eventDate={date} money={money} tasks={tasks}/>;
}
function OccasionPreparationEditor({plan,eventDate,money,tasks}:{
 plan:FamilyPlan;eventDate:string;money:MoneyState;tasks:FamilyTask[];
}){
 const {lang}=useI18n(),ar=lang==="ar";
 const t=(en:string,arabic:string)=>ar?arabic:en;
 const initial=plan.occasionPreparation??initialOccasionPreparation(eventDate);
 const [gift,setGift]=useState(String(initial.gift.amountJod));
 const [celebration,setCelebration]=useState(String(initial.celebration.amountJod));
 const [extras,setExtras]=useState(String(initial.extras.amountJod));
 const [giftName,setGiftName]=useState(initial.gift.description??"");
 const [giftDate,setGiftDate]=useState(initial.gift.dueDate);
 const [celebrationDate,setCelebrationDate]=useState(initial.celebration.dueDate);
 const [extrasDate,setExtrasDate]=useState(initial.extras.dueDate);
 const [error,setError]=useState(""),[saved,setSaved]=useState("");
 const [showMore,setShowMore]=useState(initial.extras.amountJod>0);
 const [showCertainty,setShowCertainty]=useState(occasionKinds.some(k=>initial[k].certainty!==undefined&&initial[k].certainty!=="planned"));
 const [certainties,setCertainties]=useState<Record<OccasionCostKind,"idea"|"planned"|"firm">>({gift:initial.gift.certainty??"planned",celebration:initial.celebration.certainty??"planned",extras:initial.extras.certainty??"planned"});
 const [allPlans]=useLocalState<FamilyPlan[]>(FAMILY_PLANS_KEY,[]);
 const [allTasks]=useLocalState<FamilyTask[]>(FAMILY_TASKS_KEY,[]);
 const [justSavedPrep,setJustSavedPrep]=useState<OccasionPreparation|undefined>();
 const savedPreparation=plan.occasionPreparation;
 const build=():OccasionPreparation|null=>{
  const amounts=[cents(gift),cents(celebration),cents(extras)];
  if(amounts.some(x=>x===null))return null;
  return {
   gift:{description:giftName.trim(),amountJod:amounts[0]!,dueDate:giftDate,certainty:certainties.gift},
   celebration:{amountJod:amounts[1]!,dueDate:celebrationDate,certainty:certainties.celebration},
   extras:{amountJod:amounts[2]!,dueDate:extrasDate,certainty:certainties.extras}
  };
 };
 const submit=(e:FormEvent)=>{
  e.preventDefault();setSaved("");
  const next=build();
  const err=next?validateOccasionPreparation(next,eventDate):"invalid-amount";
  if(err){
   setError(err==="invalid-deadline"?t("Choose valid payment dates on or before the occasion.","حدّد مواعيد صحيحة قبل المناسبة أو يومها."):
    err==="invalid-total"?t("The total must not exceed 100,000 JOD.","يجب ألا يتجاوز المجموع ١٠٠٬٠٠٠ دينار."):
    t("Enter valid amounts and details.","أدخل مبالغ وتفاصيل صحيحة."));return;
  }
  const total=occasionFunding(next!,new Date()).totalJod;
  const current=allPlans.find(p=>p.id===plan.id);
  if(!current){setError(t("Plan not found. Refresh and try again.","الخطة غير موجودة. أعد المحاولة."));return;}
  // Preserve a parent-entered spending ceiling. If none exists, the explicit
  // itemized costs establish it, without modifying any Money records.
  const updated:FamilyPlan={...current,occasionPreparation:next!,
   ...(current.budgetJod===undefined?{budgetJod:total}:{}),
   updatedAt:new Date().toISOString()};
  if(!writeLocal(FAMILY_PLANS_KEY,allPlans.map(p=>p.id===current.id?updated:p))){
   setError(t("Unable to save in this browser.","تعذّر الحفظ في هذا المتصفح."));return;
  }
  setJustSavedPrep(next!);
  setError("");setSaved(t("Saved to this existing occasion plan. No expense or transfer was recorded.",
   "تم حفظ التكاليف في الخطة الحالية من دون تسجيل مصروف أو تحويل أموال."));
 };
 const prep=justSavedPrep??savedPreparation;
 const funding=prep?occasionFunding(prep):null;
 const advice=prep?occasionBudgetAdvice(prep,money):null;
 const linked=tasks.filter(x=>x.planId===plan.id);
 const taskSpecs: {key:OccasionCostKind;title:string;date:string}[]=prep?([
  {key:"gift",title:t("Choose and arrange the gift","اختيار الهدية وترتيبها"),date:prep.gift.dueDate},
  {key:"celebration",title:t("Confirm the celebration arrangements","تأكيد ترتيبات الاحتفال"),date:prep.celebration.dueDate},
  {key:"extras",title:t("Prepare cake and final details","تجهيز الكعكة والتفاصيل"),date:prep.extras.dueDate}
 ] as {key:OccasionCostKind;title:string;date:string}[]).filter(x=>prep[x.key].amountJod>0):[];
 const taskNeedsUpdate=(spec:{key:OccasionCostKind;date:string})=>{
  const existing=tasks.find(x=>x.id==="occasion-"+spec.key+"-"+plan.id);
  return !existing||(existing.status==="open"&&existing.dueDate!==spec.date);
 };
 const addTasks=()=>{
  const now=new Date();
  const specId=(x:{key:OccasionCostKind})=>"occasion-"+x.key+"-"+plan.id;
  const missing=taskSpecs.filter(x=>!allTasks.some(a=>a.id===specId(x)));
  const additions=missing.map(x=>makeFamilyTask({
   id:specId(x),title:x.title,dueDate:x.date,
   priority:"normal",planId:plan.id
  },now)).filter((x):x is FamilyTask=>!!x);
  if(allTasks.length+additions.length>250){
   setError(t("The family task limit has been reached.","وصلت للحد الأقصى لمهام العيلة."));return;
  }
  const adjusted=allTasks.map(task=>{
   const spec=taskSpecs.find(x=>task.id===specId(x));
   return spec&&task.status==="open"&&task.dueDate!==spec.date?
    {...task,dueDate:spec.date,updatedAt:now.toISOString()}:task;
  });
  if(!additions.length&&adjusted.every((task,i)=>task===allTasks[i])){
   setSaved(t("Preparation tasks are already up to date.","مهام التحضير محدثة."));return;
  }
  if(!writeLocal(FAMILY_TASKS_KEY,[...additions,...adjusted])){
   setError(t("Unable to save tasks.","تعذّر حفظ المهام."));return;
  }
  setError("");
  setSaved(t("Preparation tasks saved with your chosen deadlines. No bookings or payments made.",
   "تم حفظ مهام التحضير ومواعيدها، دون حجوزات أو دفعات."));
 };
 const toggleTask=(task:FamilyTask)=>{
  const edited=setTaskComplete(task,task.status!=="done");
  if(!writeLocal(FAMILY_TASKS_KEY,allTasks.map(x=>x.id===task.id?edited:x)))setError(t("Unable to update task.","تعذّر تحديث المهمة."));
 };
 const amountField=(kind:OccasionCostKind,value:string,setter:(x:string)=>void,deadline:string,setDeadline:(x:string)=>void)=>
  <div className="rounded-2xl border border-[#F1E6EC] bg-[#FFF9FB] p-3">
   <div className="flex flex-wrap items-center justify-between gap-2">
    <label className="flex min-w-[130px] flex-1 flex-col text-xs font-bold text-[#48546B]">
     {ar?labels[kind].ar:labels[kind].en} (JOD)
     <input type="number" min="0" max="100000" step="0.01" required inputMode="decimal"
      value={value} onChange={e=>setter(e.target.value)}
      className="mt-1 min-h-11 w-full rounded-xl border border-[#E9DBE6] bg-white px-3 text-base"/>
    </label>
    <label className="flex min-w-[145px] flex-1 flex-col text-xs font-bold text-[#48546B]">
     {t("Needed / payable by","متى تحتاج المبلغ؟")}
     <input type="date" required max={eventDate} value={deadline} onChange={e=>setDeadline(e.target.value)}
      className="mt-1 min-h-11 w-full rounded-xl border border-[#E9DBE6] bg-white px-3 text-base"/>
    </label>
   </div>
  </div>;
 return <section className={panel} aria-label={t("Occasion budget and preparation","ميزانية المناسبة والتحضير")}>
  <div className="flex items-center gap-2">
   <Gift className="size-5 text-[#C3568B]"/><h3 className="text-base font-extrabold">{t("Gift, celebration & preparation","الهدية والاحتفال والتحضير")}</h3>
  </div>
  <p className="mt-1 text-xs text-[#727D90]">{t(
   "Part of this occasion's existing plan. Amounts are estimates, not purchases or saved cash.",
   "هذه التفاصيل جزء من نفس خطة المناسبة. المبالغ تقديرية وليست مشتريات أو أموالاً مدّخرة.")}</p>
  {plan.status==="completed"&&<p className="mt-3 text-xs font-bold text-[#6B7588]">{t("This plan is completed; its preparation details are read-only.","هذه الخطة مكتملة؛ تفاصيل التحضير للقراءة فقط.")}</p>}
  {plan.status!=="completed"&&<form className="mt-3 space-y-3" onSubmit={submit}>
   <div className="flex items-center gap-2 text-sm font-bold"><Gift className="size-4 text-[#B75A85]"/>{t("Occasion costs","تكاليف المناسبة")}</div>
   {amountField("gift",gift,setGift,giftDate,setGiftDate)}
   <label className="block text-xs font-semibold text-[#5D687B]">
    {t("Gift idea or description (optional)","فكرة الهدية أو وصفها (اختياري)")}
    <input maxLength={100} value={giftName} onChange={e=>setGiftName(e.target.value)}
     placeholder={t("e.g. science kit","مثلاً مجموعة علوم")}
     className="mt-1 min-h-11 w-full rounded-xl border border-[#E9DBE6] bg-white px-3 text-base"/>
   </label>
   {amountField("celebration",celebration,setCelebration,celebrationDate,setCelebrationDate)}
   <button type="button" aria-expanded={showMore} onClick={()=>setShowMore(x=>!x)}
    className="min-h-10 text-xs font-bold text-[#A14C7A] underline">
    {showMore?t("Hide extras","إخفاء المصاريف الأخرى"):t("Cake, decorations & other costs","الكعكة والزينة ومصاريف أخرى")}
   </button>
   {showMore&&amountField("extras",extras,setExtras,extrasDate,setExtrasDate)}
   {error&&<p role="alert" className="rounded-lg bg-[#FFF0F0] p-2 text-xs text-[#A33643]">{error}</p>}
   <button type="submit" className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#B95284] px-4 text-sm font-bold text-white">
    <CheckCircle2 className="size-4"/>{t("Save occasion costs","احفظ تكاليف المناسبة")}
   </button>
   <p className="text-[11px] text-[#7C8595]">{t(
    "Your existing spending ceiling stays unchanged; if none was set, the first cost total becomes the plan's ceiling. Saving does not change Our Money.",
    "سقف الميزانية السابق يبقى كما هو؛ وإذا لم يكن محدداً يصبح إجمالي التكاليف الأولى هو السقف. الحفظ لا يغيّر سجلات المال.")}</p>
  </form>}
  {saved&&<p role="status" className="mt-2 rounded-lg bg-[#EDF8F0] p-2 text-xs font-semibold text-[#26765A]">{saved}</p>}
  {prep&&funding&&advice&&<div className="mt-4 space-y-3">
   <div className="rounded-2xl bg-[#F4F8F3] p-4">
    <div className="flex flex-wrap items-center justify-between gap-3">
     <p className="text-sm font-bold">{t("Planned occasion cost","التكلفة المخططة للمناسبة")}</p>
     <strong className="text-lg tabular-nums">{fmtJOD(funding.totalJod)}</strong>
    </div>
    {plan.budgetJod!==undefined&&funding.totalJod>plan.budgetJod&&plan.status!=="completed"&&
     <button type="button" onClick={()=>{
      const current=allPlans.find(x=>x.id===plan.id);
      if(!current)return;
      const adjusted={...current,budgetJod:funding.totalJod,updatedAt:new Date().toISOString()};
      if(writeLocal(FAMILY_PLANS_KEY,allPlans.map(x=>x.id===plan.id?adjusted:x))){
       setSaved(t("Plan spending ceiling updated to match the saved breakdown. Our Money is unchanged.",
        "تم تحديث سقف الخطة ليتوافق مع التفاصيل المحفوظة، دون تغيير سجلات المالية."));
       setError("");
      }else setError(t("Unable to update the plan ceiling.","تعذّر تحديث سقف الخطة."));
     }} className="mt-2 min-h-11 rounded-xl border border-[#B67A69] px-3 text-xs font-bold text-[#8F5D50]">
      {t("Set plan ceiling to this estimate","اجعل سقف الخطة يساوي هذا التقدير")}
     </button>}
    {plan.budgetJod!==undefined&&funding.totalJod>plan.budgetJod&&<p role="status" className="mt-2 text-xs text-[#A46C38]">
     <AlertTriangle className="me-1 inline size-4"/>{t(
      "The breakdown exceeds your existing plan ceiling of ","التفاصيل تتجاوز سقف الخطة السابق: ")}{fmtJOD(plan.budgetJod)}.
    </p>}
    <div className="mt-3 flex items-center gap-2"><CalendarClock className="size-4 text-[#6E926F]"/>
     <p className="text-sm font-semibold">{t("Calendar-month preparation estimate","المبلغ التحضيري على أساس الأشهر")}: {fmtJOD(funding.monthlyJod)}{t(" / month"," / شهر")}</p>
    </div>
    {funding.nextDueDate&&<p className="mt-2 text-xs">{t("Next estimated payment deadline: ","أقرب موعد متوقع للدفع: ")}{funding.nextDueDate}</p>}
    {funding.overdueAmountJod>0&&<p className="mt-2 text-xs font-semibold text-[#9E5B43]">
     {t("Past-due planning amounts need attention now: ","مبالغ تخطيطية فات موعدها: ")}{fmtJOD(funding.overdueAmountJod)}</p>}
    <p className="mt-2 text-[11px] text-[#6F7987]">{t(
     "This divides each cost over calendar months (including the current partial month), not actual paydays. No money is set aside automatically.",
     "القسمة حسب أشهر التقويم (بما فيها الشهر الحالي جزئياً)، وليست حسب مواعيد الراتب. لا يتم حجز أي مبلغ تلقائياً.")}</p>
   </div>
   <div className="rounded-2xl bg-[#F6F5FC] p-4">
    <div className="flex items-center gap-2"><Wallet className="size-4 text-[#7567B7]"/>
     <p className="text-sm font-extrabold">{t("Factor this into Our Money","كيف نحسبها ضمن المالية؟")}</p></div>
    {advice.status==="demo"||advice.status==="missing-plan"?
     <p className="mt-2 text-sm text-[#5D6880]">{t(
      "Add real income, savings and spending categories in Our Money before reviewing possible monthly budget adjustments. Sample budgets cannot support advice.",
      "أدخل الدخل والادخار وفئات الإنفاق الحقيقية في المالية أولاً. لا يمكن تقديم نصائح من أرقام تجريبية.")}</p>
     :<>
      <p className="mt-2 text-sm">{t("Unallocated amount in your entered monthly plan: ","المبلغ غير الموزّع في خطة الشهر المسجّلة: ")}
       <strong>{fmtJOD(advice.monthlyUnallocatedJod??0)}</strong></p>
      {advice.monthlyDifferenceJod!>0?<p className="mt-2 text-sm text-[#39745C]">{t(
       "The estimated monthly contribution fits within unallocated planned amounts — subject to verifying cash, dates and all bills.",
       "التخصيص الشهري التقديري ضمن المبالغ غير الموزّعة بالخطة، بعد التأكد من النقد والمواعيد والفواتير.")}</p>:
       <p className="mt-2 text-sm font-semibold text-[#985C4B]">{t("Additional monthly planning room to find: ","مبلغ إضافي للبحث عنه شهرياً: ")}
        {fmtJOD(advice.monthlyDifferenceJod??0)}</p>}
      {advice.hints.length>0&&<div className="mt-3 space-y-2">
       <p className="text-xs font-bold">{t("Discretionary categories worth reviewing (not automatic cuts)","فئات مرنة يمكن مراجعتها (من دون تخفيض تلقائي)")}</p>
       {advice.hints.map(h=><div key={h.categoryId} className="flex items-center justify-between gap-2 rounded-xl bg-white p-2 text-xs">
        <span>{h.categoryName}</span><strong>{t("Consider up to ","راجع حتى ")}{fmtJOD(h.reviewJod)}</strong>
       </div>)}
      </div>}
      {advice.notCoveredJod!==null&&advice.notCoveredJod>0&&<p className="mt-2 text-xs text-[#915942]">{t(
       "No reliable discretionary category was found for the remaining ","لا توجد فئات مرنة كافية لتغطية المبلغ المتبقي: ")}{fmtJOD(advice.notCoveredJod)}.</p>}
      <p className="mt-2 text-[11px] text-[#727D90]">{t(
       "These are optional planning ideas based on your entered category budgets. Unallocated plans are NOT verified bank funds; bills, reserves and real spending still require review.",
       "هذه أفكار اختيارية حسب ميزانيات الفئات المسجّلة. المبلغ غير الموزّع ليس رصيداً بنكياً، ولا بد من مراجعة الفواتير والاحتياطي والمصاريف الفعلية.")}</p>
     </>}
    <Link to="/money" className="mt-2 inline-flex min-h-11 items-center text-xs font-bold text-[#7261B2] underline">
     {t("Review My Money","راجع المالية")}</Link>
   </div>
   <div className="rounded-2xl border border-[#E5EBE3] bg-[#FBFDFB] p-4">
    <div className="flex items-center gap-2"><ListChecks className="size-4 text-[#368B76]"/>
     <h4 className="text-sm font-extrabold">{t("Practical preparations","التجهيزات العملية")}</h4>
    </div>
    {linked.length===0?<p className="mt-2 text-xs text-[#667286]">{t(
     "No preparation tasks yet. Add reminders using the payment dates above.",
     "ما في مهام تحضير بعد. أضف مهاماً حسب مواعيد المبالغ أعلاه.")}</p>:
     <div className="mt-3 space-y-2">{linked.map(task=><label key={task.id}
      className="flex items-center gap-2 rounded-xl border border-[#E7ECE7] bg-white p-2 text-xs">
      <input type="checkbox" className="size-4" checked={task.status==="done"} onChange={()=>toggleTask(task)}/>
      <span className="flex-1">{task.title} · {task.dueDate}</span></label>)}</div>}
    {taskSpecs.some(taskNeedsUpdate)&&
     <button type="button" onClick={addTasks} className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-full bg-[#E6F4EC] px-4 text-xs font-bold text-[#2B7A5E]">
      <Plus className="size-4"/>{t("Add / align preparation tasks","أضف أو حدّث مهام التحضير")}
     </button>}
    <p className="mt-2 text-[11px] text-[#7B8491]">{t(
     "Tasks are local reminders, not bookings, payments or push notifications.",
     "هذه المهام تذكيرات على الجهاز فقط وليست حجوزات أو دفعات أو إشعارات تلقائية.")}</p>
   </div>
  </div>}
 </section>;
}
