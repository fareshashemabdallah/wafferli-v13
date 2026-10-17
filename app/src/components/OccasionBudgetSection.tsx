import {useEffect,useState,type FormEvent} from "react";
import {Link} from "@tanstack/react-router";
import {CalendarClock,Gift,Wallet,CheckCircle2} from "lucide-react";
import {useI18n} from "@/lib/i18n";
import {useLocalState,uid,fmtJOD} from "@/lib/storage";
import {sampleMoney,type MoneyState} from "@/lib/money";
import {makeFamilyPlan,FAMILY_PLANS_KEY,type FamilyPlan,type OccasionPreparation} from "@/lib/familyPlans";
import {FAMILY_TASKS_KEY,makeFamilyTask,type FamilyTask} from "@/lib/familyTasks";
import {dateKey,parseCalendarDate} from "@/lib/familyCalendar";
import {initialOccasionPreparation,validateOccasionPreparation,occasionFunding,occasionBudgetAdvice,occasionKinds,type OccasionCostKind} from "@/lib/occasionPreparation";

type Props={occasionDate:string;occasionTitle:string;sourceRef?:string;planId?:string};
const names:{id:OccasionCostKind;en:string;ar:string;deadlineEn:string;deadlineAr:string}[]=[
 {id:"gift",en:"Gift budget",ar:"ميزانية الهدية",deadlineEn:"Gift needed by",deadlineAr:"موعد شراء الهدية"},
 {id:"celebration",en:"Celebration budget",ar:"ميزانية الاحتفال",deadlineEn:"Celebration payment by",deadlineAr:"موعد دفع الاحتفال"},
 {id:"extras",en:"Cake & other costs",ar:"الكعكة والمصاريف الأخرى",deadlineEn:"Extras needed by",deadlineAr:"موعد المصاريف الأخرى"}
];
/** Integrated budget of the SAME FamilyPlan reached from Calendar or Plans.
 * All edits require explicit Save; neither saving nor reminders transfer funds.
 */
export function OccasionBudgetSection({occasionDate,occasionTitle,sourceRef,planId}:Props){
 const {lang}=useI18n(),ar=lang==="ar";
 const t=(en:string,arabic:string)=>ar?arabic:en;
 const [plans,setPlans,plansReady]=useLocalState<FamilyPlan[]>(FAMILY_PLANS_KEY,[]);
 const [tasks,setTasks,tasksReady]=useLocalState<FamilyTask[]>(FAMILY_TASKS_KEY,[]);
 const [money,,moneyReady]=useLocalState<MoneyState>("money",sampleMoney());
 const plan=plans.find(p=>p.id===planId)??plans.find(p=>!!sourceRef&&p.sourceRef===sourceRef);
 const [draft,setDraft]=useState<OccasionPreparation>(()=>plan?.occasionPreparation??initialOccasionPreparation(occasionDate));
 const [dirty,setDirty]=useState(false);
 const [error,setError]=useState("");
 const [notice,setNotice]=useState("");
 const ready=plansReady&&tasksReady&&moneyReady;
 const completed=plan?.status==="completed";
 // Do not wipe unsaved typing when another browser-local module refreshes.
 useEffect(()=>{
  if(!dirty)setDraft(plan?.occasionPreparation??initialOccasionPreparation(occasionDate));
 },[plan?.occasionPreparation,occasionDate,dirty]);
 const update=(kind:OccasionCostKind,field:"amountJod"|"dueDate"|"description",value:string)=>{
  if(completed)return;
  setDirty(true);setError("");setNotice("");
  setDraft(old=>{
   const current=old[kind];
   const changed=field==="amountJod"?{amountJod:value===""?0:Number(value)}
    :field==="dueDate"?{dueDate:value}:{description:value};
   return {...old,[kind]:{...current,...changed}};
  });
 };
 const validError=validateOccasionPreparation(draft,occasionDate);
 const funding=!validError?occasionFunding(draft):null;
 const advice=funding?occasionBudgetAdvice(draft,money):null;
 const saved=!!plan?.occasionPreparation;
 const sameSaved=saved&&JSON.stringify(plan.occasionPreparation)===JSON.stringify(draft);
 const save=(e:FormEvent)=>{
  e.preventDefault();setError("");setNotice("");
  if(!ready||completed)return;
  const err=validateOccasionPreparation(draft,occasionDate);
  if(err){setError(t("Check each amount (0–100,000 JOD) and select dates no later than the occasion.","راجع المبالغ والتواريخ، ويجب أن تكون المواعيد قبل المناسبة أو في يومها."));return;}
  const newId=uid();
  setPlans(old=>{
   const existing=old.find(p=>p.id===planId)??old.find(p=>!!sourceRef&&p.sourceRef===sourceRef);
   if(existing?.status==="completed")return old;
   const now=new Date();
   if(existing)return old.map(p=>p.id===existing.id?{
    ...p,occasionPreparation:draft,updatedAt:now.toISOString()
   }:p);
   const created=makeFamilyPlan({id:newId,title:occasionTitle,kind:"occasion",date:occasionDate,
    ...(sourceRef?{sourceRef}:{})},now);
   return created?[{...created,occasionPreparation:draft},...old]:old;
  });
  setDirty(false);setNotice(t("Preparation saved in the existing family plan.","تم حفظ التحضير ضمن خطة العيلة نفسها."));
 };
 const addTasks=()=>{
  if(!plan?.occasionPreparation||!tasksReady)return;
  const p=plan;
  const newly=occasionKinds.filter(k=>p.occasionPreparation![k].amountJod>0);
  if(!newly.length)return;
  setTasks(old=>{
   let next=[...old];
   for(const kind of newly){
    const id="ocprep:"+p.id+":"+kind;
    const current=next.find(item=>item.id===id);
    const dueDate=p.occasionPreparation![kind].dueDate;
    if(current){
     if(current.status==="open"&&current.dueDate!==dueDate)
      next=next.map(item=>item.id===id?{...item,dueDate,updatedAt:new Date().toISOString()}:item);
     continue;
    }
    if(next.length>=250)break;
    const title=kind==="gift"?(ar?"جهّز الهدية: ":"Prepare gift: ")+p.title
     :kind==="celebration"?(ar?"جهّز الاحتفال: ":"Arrange celebration: ")+p.title
     :(ar?"جهّز التفاصيل: ":"Arrange extras: ")+p.title;
    const task=makeFamilyTask({id,title,dueDate,priority:"normal",planId:p.id});
    if(task)next.push(task);
   }
   return next;
  });
  setNotice(t("Preparation reminders saved under Family responsibilities. No notifications or orders were sent.",
   "تم حفظ مهام التحضير ضمن مسؤوليات العيلة، من دون إرسال إشعارات أو طلبات."));
 };
 const recorded=tasks.filter(x=>!!plan&&x.planId===plan.id&&x.id.startsWith("ocprep:"+plan.id+":"));
 return <section aria-label={t("Occasion budget and preparation","ميزانية وتحضير المناسبة")}
  className="mt-4 rounded-2xl border border-[#EED7E3] bg-[#FFF9FC] p-4 sm:p-5">
  <div className="flex items-start gap-3">
   <Gift className="mt-0.5 size-6 shrink-0 text-[#C45B91]"/>
   <div>
    <h3 className="text-base font-extrabold text-[#25354B]">{t("Gift, celebration & preparation","الهدية والاحتفال والتحضير")}</h3>
    <p className="mt-1 text-xs leading-relaxed text-[#697488]">{t(
     "Plan each amount and when it is needed. The occasion date is reused from Calendar; you won't create another birthday.",
     "حدّد المبالغ ومواعيد الدفع. تاريخ المناسبة مأخوذ من التقويم ولن تنشئ مناسبة مكررة.")}</p>
   </div>
  </div>
  <form onSubmit={save} className="mt-4 space-y-3">
   {names.map(({id,en,ar:arabic,deadlineEn,deadlineAr})=><fieldset key={id}
    className="rounded-xl border border-[#F0E3EC] bg-white p-3">
    <legend className="px-1 text-sm font-semibold">{t(en,arabic)}</legend>
    {id==="gift"&&<label className="mt-2 block text-xs text-[#667184]">
     {t("Gift idea (optional)","فكرة الهدية (اختياري)")}
     <input type="text" maxLength={100} disabled={!!completed}
      className="mt-1 min-h-11 w-full rounded-xl border border-[#E4E7EA] px-3 text-base text-[#25354B]"
      value={draft.gift.description} onChange={e=>update("gift","description",e.target.value)}
      placeholder={t("e.g. art kit","مثلاً أدوات رسم")}/>
    </label>}
    <div className="mt-2 grid gap-3 sm:grid-cols-2">
     <label className="block text-xs text-[#667184]">
      {t("Estimated cost (JOD)","التكلفة المقدّرة (دينار)")}
      <input type="number" min={0} max={100000} step=".01" inputMode="decimal" disabled={!!completed}
       className="mt-1 min-h-11 w-full rounded-xl border border-[#E4E7EA] bg-white px-3 text-base text-[#25354B]"
       value={String(draft[id].amountJod)} onChange={e=>update(id,"amountJod",e.target.value)}/>
     </label>
     <label className="block text-xs text-[#667184]">
      {t(deadlineEn,deadlineAr)}
      <input type="date" max={occasionDate} disabled={!!completed}
       className="mt-1 min-h-11 w-full rounded-xl border border-[#E4E7EA] bg-white px-3 text-base text-[#25354B]"
       value={draft[id].dueDate} onChange={e=>update(id,"dueDate",e.target.value)}/>
     </label>
    </div>
   </fieldset>)}
   {validError&&<p role="alert" className="text-xs text-[#9D354B]">{t(
    "Use valid dates on or before the occasion, and a combined estimate no higher than 100,000 JOD.",
    "استخدم تواريخ صحيحة قبل المناسبة أو في يومها، ومجموعاً لا يتجاوز ١٠٠٬٠٠٠ دينار.")}</p>}
   {funding&&<div className="rounded-xl bg-[#F1F7F4] p-4">
    <div className="flex flex-wrap items-center justify-between gap-2">
     <strong className="text-sm">{t("Total estimated occasion cost","مجموع التكلفة المقدّرة")}</strong>
     <strong className="text-lg tabular-nums">{fmtJOD(funding.totalJod)}</strong>
    </div>
    {plan?.budgetJod!==undefined&&<p className="mt-2 text-xs text-[#647488]">
     {funding.totalJod>plan.budgetJod
      ?t("This estimate is above your saved occasion spending ceiling.","التقدير أعلى من سقف المناسبة المسجّل.")
      :t("Compared with your separate saved spending ceiling.","مقارنة بسقف الإنفاق المحفوظ بشكل منفصل.")}
     {" "}{fmtJOD(plan.budgetJod)}
    </p>}
    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-[#DDE9E1] pt-3">
     <span className="text-sm">{t("Illustrative monthly preparation","مبلغ التحضير الشهري التقريبي")}</span>
     <strong className="text-lg tabular-nums">{fmtJOD(funding.monthlyJod)}</strong>
    </div>
    <p className="mt-2 text-xs leading-relaxed text-[#637484]">{t(
     "Each cost is spread over calendar months up to its own payment deadline, including this month. This does not reserve cash or guarantee a salary arrives first.",
     "كل تكلفة موزّعة على الأشهر حتى موعد دفعها، بما فيها الشهر الحالي. لا يتم حجز مال أو ضمان وصول الراتب أولاً.")}</p>
    {funding.lineItems.length>0&&<div className="mt-3 space-y-1.5 text-xs">
     {funding.lineItems.map(line=><p key={line.kind} className="flex flex-wrap justify-between gap-2">
      <span>{t(names.find(x=>x.id===line.kind)!.en,names.find(x=>x.id===line.kind)!.ar)}
       {" · "}{line.deadline}{line.overdue?" · "+t("Past due","موعد منتهٍ"):""}</span>
      <span>{fmtJOD(line.monthlyJod)}{t("/month","/شهر")}</span>
     </p>)}
    </div>}
   </div>}
   {advice&&<div className="rounded-xl bg-[#F5F3FC] p-4">
    <div className="flex items-center gap-2"><Wallet className="size-4 text-[#8267BA]"/>
     <strong className="text-sm">{t("How this fits your household budget","كيف تدخل المناسبة ضمن الميزانية")}</strong>
    </div>
    {advice.status==="demo"||advice.status==="missing-plan"
     ?<p className="mt-2 text-sm text-[#627086]">{t(
      "Add real household income, budget categories and commitments in Our Money before requesting tailored budget adjustments. Sample figures are not used.",
      "أدخل الدخل الحقيقي وفئات الإنفاق والالتزامات في ماليتنا لنقترح تعديلات مناسبة؛ لا نستخدم أرقاماً تجريبية.")}</p>
     :<div className="mt-2 space-y-2 text-sm text-[#56647A]">
      <p>{t("Unallocated in the recorded monthly plan (not verified cash): ","غير المخصّص بالخطة الشهرية المسجّلة (ليس نقداً مؤكداً): ")}
       <strong>{fmtJOD(advice.monthlyUnallocatedJod??0)}</strong></p>
      <p>{advice.status==="pressure"
       ?t("The preparation target exceeds that planning margin by ","مبلغ التحضير يتجاوز الهامش التخطيطي بمقدار ")
       :t("The preparation target fits inside the entered monthly allocations on paper. Unrecorded bills may change this.","مبلغ التحضير يدخل ضمن الخطة الشهرية نظرياً، وقد تغيّر الفواتير غير المسجّلة النتيجة.")}
       {advice.status==="pressure"&&<strong>{fmtJOD(advice.monthlyDifferenceJod??0)}</strong>}</p>
      {advice.hints.length>0&&<div>
       <strong className="text-xs">{t("Discretionary categories you could review (not automatic cuts)","فئات كمالية ممكن تراجعها (من دون تعديل تلقائي)")}</strong>
       <ul className="mt-2 space-y-1">{advice.hints.map(h=><li key={h.categoryId} className="flex justify-between gap-3 text-xs">
        <span>{h.categoryName}</span><span className="font-semibold">{fmtJOD(h.reviewJod)}</span>
       </li>)}</ul>
       {advice.notCoveredJod!==null&&advice.notCoveredJod>0&&<p className="mt-2 text-xs">
        {t("Still not covered by these illustrative changes: ","المتبقي غير المغطّى من التعديلات التقريبية: ")}{fmtJOD(advice.notCoveredJod)}</p>}
      </div>}
     </div>}
    <p className="mt-3 text-[11px] leading-relaxed text-[#777F8C]">{t(
     "Budget category suggestions use recorded labels and plan amounts only. Essentials are excluded. Actual cash, future commitments, and spending already incurred still need review. No budget, goal or expense is changed.",
     "الاقتراحات مبنية على أسماء الفئات ومبالغ الخطة فقط، مع استبعاد الأساسيات. يجب مراجعة النقد الفعلي والالتزامات والمصاريف السابقة. لا نغيّر الميزانية أو الادخار أو المصروف تلقائياً.")}</p>
    <Link to="/money" className="mt-2 inline-flex min-h-10 items-center text-xs font-bold text-[#7453B2] underline">{t("Review Our Money","راجع ماليتنا")}</Link>
   </div>}
   {error&&<p role="alert" className="rounded-lg bg-[#FFF0F0] p-3 text-xs text-[#A63D4D]">{error}</p>}
   <div className="flex flex-wrap gap-2">
    <button type="submit" disabled={!ready||!!completed||!!validError||!!sameSaved}
     className="min-h-11 rounded-full bg-[#C45586] px-4 text-sm font-bold text-white disabled:opacity-50">
     {saved?t("Save preparation changes","احفظ تعديلات التحضير"):t("Save occasion preparation","احفظ تحضير المناسبة")}
    </button>
    {saved&&funding&&funding.totalJod>0&&<button type="button" onClick={addTasks} disabled={!tasksReady||!!completed||!sameSaved}
     className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[#DCCADA] bg-white px-4 text-sm font-semibold text-[#935578] disabled:opacity-50">
     <CalendarClock className="size-4"/>{recorded.length>0?t("Update preparation task dates","حدّث تواريخ المهام"):t("Add preparation tasks","أضف مهام التحضير")}
    </button>}
   </div>
  </form>
  {completed&&<p className="mt-3 text-xs text-[#677185]">{t("This plan is completed; its preparation remains available for review.","هذه الخطة مكتملة؛ يمكنك مراجعة تفاصيل تحضيرها.")}</p>}
  {notice&&<p role="status" className="mt-3 flex items-center gap-2 text-xs font-semibold text-[#407D65]">
   <CheckCircle2 className="size-4"/>{notice}
  </p>}
  <p className="mt-3 text-[11px] leading-relaxed text-[#798395]">{t(
   "Saved with this occasion's one family plan on this device. Task dates are in-app reminders only; no notifications, transfers, purchases or bill entries are created.",
   "تُحفظ البيانات ضمن خطة المناسبة نفسها على هذا الجهاز. المهام تذكير داخل التطبيق فقط؛ لا إشعارات أو تحويلات أو مشتريات أو فواتير جديدة.")}</p>
 </section>;
}
