import {frenchUI} from "@/lib/french";
import {createFileRoute,Link} from "@tanstack/react-router";
import {CalendarDays,CheckCircle2,Compass,Plus,Trash2} from "lucide-react";
import {useState,type FormEvent} from "react";
import {toast} from "sonner";
import {AppShell} from "@/components/AppShell";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {useI18n} from "@/lib/i18n";
import {uid,fmtJOD,useLocalState} from "@/lib/storage";
import {sampleMoney,sampleMembers,type MoneyState,type Member} from "@/lib/money";
import type {FamilyMoment} from "@/lib/familyCalendar";
import {canonicalFamilyMoments,canonicalPlanViews,occasionLink,canonicalOccasionForPlan} from "@/lib/canonicalFamilyFacts";
import {ACTIVE_PLAN_KEY,FAMILY_PLANS_KEY,makeFamilyPlan,markPlanComplete,moneyAmount,setPlanChoice,upcomingFamilyPlans,type FamilyPlan,type PlanKind} from "@/lib/familyPlans";
import {PlanDecisionPanel} from "@/components/PlanDecisionPanel";
import {checkFamilyPlan,postponeFlexiblePlan,markPlanDoneWithoutCost,addPlanActualCost} from "@/lib/familyPlanCheckIn";
import {OccasionPreparationSection} from "@/components/OccasionPreparationSection";
import {localToday} from "@/lib/cashflow";
import {recordConfirmedExpense} from "@/lib/confirmedExpense";
export const Route=createFileRoute("/plans")({
 head:()=>({meta:[{title:"My Plans — Dabberna"},{name:"description",content:"Plan meaningful purchases, outings and occasions in one private place."}]}),
 component:PlansPage
});
const kinds:{id:PlanKind;en:string;ar:string}[]=[
 {id:"purchase",en:"Purchase",ar:"مشتريات"},{id:"outing",en:"Outing",ar:"طلعة"},{id:"occasion",en:"Occasion",ar:"مناسبة"},{id:"other",en:"Other",ar:"غير ذلك"}
];
function PlansPage(){return <PlansWorkspace/>;}
export function PlansWorkspace({embedded=false}:{embedded?:boolean}={}){
 const {lang}=useI18n(),ar=lang==="ar";
 const [plans,setPlans,ready]=useLocalState<FamilyPlan[]>(FAMILY_PLANS_KEY,[]);
 const [active,setActive]=useLocalState<string|null>(ACTIVE_PLAN_KEY,null);
 const [money,setMoney,moneyReady]=useLocalState<MoneyState>("money",sampleMoney());
 const [members]=useLocalState<Member[]>("members",sampleMembers());
 const [moments]=useLocalState<FamilyMoment[]>("familyCalendar",[]);
 const resolvedPlans=canonicalPlanViews(plans,moments,members,ar);
 const [newOpen,setNewOpen]=useState(false);
 const [title,setTitle]=useState(""),[kind,setKind]=useState<PlanKind>("purchase"),[date,setDate]=useState(""),[budget,setBudget]=useState("");
 const [err,setErr]=useState("");
 const [chosen,setChosen]=useState(""),[price,setPrice]=useState(""),[actual,setActual]=useState(""),[category,setCategory]=useState("");
 const selected=resolvedPlans.find(p=>p.id===active)??null;
 const currentPlan=selected??upcomingFamilyPlans([...resolvedPlans])[0]??resolvedPlans[0]??null;
 const currentLinked=currentPlan?occasionLink(currentPlan):null;
 const originalOccasion=currentPlan&&currentLinked?
  canonicalOccasionForPlan(currentPlan,canonicalFamilyMoments(moments,members,ar)):null;
 const update=(next:FamilyPlan)=>setPlans(prev=>prev.map(p=>{
  if(p.id!==next.id)return p;
  // Only status, gifts and costs belong to the plan. An occasion's
  // title/date are derived on read from its linked profile/calendar record.
  return p.sourceRef?.startsWith("occasion:")?
   {...next,title:p.title,...(p.date?{date:p.date}:{})}:next;
 }));
 const completeSimply=()=>{
  if(!currentPlan||currentPlan.status==="completed")return;
  if(!window.confirm(ar?"هل اكتملت الخطة فعلاً؟ لن نسجّل مبلغاً أو دفعة، ويمكن إضافة التكلفة لاحقاً.":(lang==="fr"?frenchUI("Did the plan actually happen? This marks it done without recording a cost or payment."):"Did the plan actually happen? This marks it done without recording a cost or payment.")))return;
  update(markPlanDoneWithoutCost(currentPlan));setErr("");
  toast.success(ar?"تمّ! بلا مصروف مسجّل.":(lang==="fr"?frenchUI("Plan completed; no expense was recorded."):"Plan completed; no expense was recorded."));
 };
 const moveWeek=()=>{
  if(!currentPlan)return;
  const next=postponeFlexiblePlan(currentPlan);
  if(!next)return setErr(ar?"هذا الموعد مربوط بمناسبة ثابتة ولا يمكن تأجيله تلقائياً.":(lang==="fr"?frenchUI("This date belongs to a fixed or linked event and cannot be moved here."):"This date belongs to a fixed or linked event and cannot be moved here."));
  if(!window.confirm(ar?"غيّر تاريخ الخطة المسجّل لأسبوع لاحق؟ هذا لا يغيّر أي حجز أو موعد مؤكد عند مزوّد الخدمة.":(lang==="fr"?frenchUI("Move this saved plan one week? It does NOT reschedule any real booking, order or provider appointment."):"Move this saved plan one week? It does NOT reschedule any real booking, order or provider appointment.")))return;
  update(next);setErr("");
  toast.success(ar?"تم تحديث موعد الخطة فقط.":(lang==="fr"?frenchUI("Saved plan date updated only."):"Saved plan date updated only."));
 };
 const addActualLater=()=>{
  if(!currentPlan||currentPlan.status!=="completed")return;
  const n=moneyAmount(actual);
  if(n===null)return setErr(ar?"أدخل تكلفة فعلية صحيحة أو اتركها فارغة.":(lang==="fr"?frenchUI("Enter a valid actual amount or leave it unrecorded."):"Enter a valid actual amount or leave it unrecorded."));
  const updated=addPlanActualCost(currentPlan,n);
  if(!updated)return setErr(ar?"لا يمكن تغيير تكلفة مرتبطة بمصروف مسجل مسبقاً.":(lang==="fr"?frenchUI("Cannot change a cost already linked to a recorded expense."):"Cannot change a cost already linked to a recorded expense."));
  update(updated);setActual("");setErr("");
  toast.success(ar?"تم تحديث تكلفة الخطة فقط، دون تسجيل مصروف.":(lang==="fr"?frenchUI("Plan cost saved, without recording an expense."):"Plan cost saved, without recording an expense."));
 };
 const submit=(e:FormEvent)=>{
  e.preventDefault();const amount=budget.trim()===""?undefined:moneyAmount(budget);
  if(budget.trim()!==""&&amount===null)return setErr(ar?"أدخل ميزانية صحيحة بين صفر و١٠٠٬٠٠٠ دينار.":(lang==="fr"?frenchUI("Enter a valid budget between 0 and 100,000 JOD."):"Enter a valid budget between 0 and 100,000 JOD."));
  const plan=makeFamilyPlan({id:uid(),title,kind,...(date?{date}:{}),...(amount!==undefined?{budgetJod:amount!}:{})});
  if(!plan)return setErr(ar?"أدخل الاسم والتاريخ الصحيح.":(lang==="fr"?frenchUI("Enter a name and valid date."):"Enter a name and valid date."));
  setPlans(prev=>[plan,...prev]);setActive(plan.id);setTitle("");setDate("");setBudget("");setNewOpen(false);setErr("");
  toast.success(ar?"الخطة صارت جاهزة!":(lang==="fr"?frenchUI("Plan created."):"Plan created."));
 };
 const decide=()=>{
  if(!currentPlan||!chosen.trim())return;
  const n=price.trim()===""?undefined:moneyAmount(price);
  if(price.trim()!==""&&n===null)return setErr(ar?"أدخل مبلغاً صحيحاً.":(lang==="fr"?frenchUI("Enter a valid estimated amount."):"Enter a valid estimated amount."));
  update(setPlanChoice(currentPlan,{label:chosen,...(n!==undefined?{estimatedJod:n!}:{}),source:"manual"}));
  setChosen("");setPrice("");setErr("");toast.success(ar?"تم حفظ الاختيار.":(lang==="fr"?frenchUI("Choice saved to your plan."):"Choice saved to your plan."));
 };
 const finish=()=>{
  if(!currentPlan)return;const n=moneyAmount(actual);
  if(n===null)return setErr(ar?"أدخل القيمة الفعلية (يمكن أن تكون صفرًا).":(lang==="fr"?frenchUI("Enter an actual cost (zero is allowed)."):"Enter an actual cost (zero is allowed)."));
  update(markPlanComplete(currentPlan,n));setActual("");setErr("");toast.success(ar?"تم حفظ النتيجة الفعلية.":(lang==="fr"?frenchUI("Actual outcome saved."):"Actual outcome saved."));
 };
 const recordExpense=(plan:FamilyPlan)=>{
  if(money.demo||!moneyReady)return setErr(ar?"ابدأ ببيانات مالية حقيقية قبل ربط المصروف.":(lang==="fr"?frenchUI("Switch from demo to your real finances before recording."):"Switch from demo to your real finances before recording."));
  if(plan.status!=="completed"||plan.actualJod===undefined)return;
  if(category&& !money.categories.some(c=>c.id===category))return setErr(ar?"فئة غير صحيحة.":(lang==="fr"?frenchUI("Invalid category."):"Invalid category."));
  const expenseId="family-plan-"+plan.id;
  if(money.expenses.some(e=>e.id===expenseId||e.sourcePlanId===plan.id)||plan.expenseId)
   return setErr(ar?"هذا المصروف مسجّل بالفعل.":(lang==="fr"?frenchUI("This expense is already recorded."):"This expense is already recorded."));
  if(!window.confirm(ar?"سنضيف المبلغ الفعلي كمصروف مدفوع دون خصم رصيدك اليدوي. هل تؤكد؟":(lang==="fr"?frenchUI("Record this actual cost once in Money without changing your manually entered cash?"):"Record this actual cost once in Money without changing your manually entered cash?")))return;
  const next=recordConfirmedExpense(money,{id:expenseId,date:localToday(),
   categoryId:category||"uncategorized",amount:plan.actualJod,note:plan.title,
   sourcePlanId:plan.id},"untracked");
  if(next===money)return setErr(ar?"تعذّر التسجيل، راجع سجلاتك.":(lang==="fr"?frenchUI("Could not record. Review existing expenses."):"Could not record. Review existing expenses."));
  setMoney(prev=>recordConfirmedExpense(prev,{id:expenseId,date:localToday(),
   categoryId:category||"uncategorized",amount:plan.actualJod!,note:plan.title,
   sourcePlanId:plan.id},"untracked"));
  update({...plan,expenseId,updatedAt:new Date().toISOString()});setErr("");
  toast.success(ar?"تم تسجيل مصروف واحد في المالية.":(lang==="fr"?frenchUI("Recorded one expense in Money."):"Recorded one expense in Money."));
 };
 const content=<>
   
   <section className="page-intro">
     <p className="section-eyebrow">{ar?"خطّة واحدة، خطوات مترابطة":(lang==="fr"?frenchUI("ONE PLAN · CONNECTED CHOICES"):"ONE PLAN · CONNECTED CHOICES")}</p>
     <h2 className="mt-2 text-xl font-semibold text-ink">{ar?"قرارات عيلتنا وخططنا القادمة":(lang==="fr"?frenchUI("Decisions we made, and what comes next"):"Decisions we made, and what comes next")}</h2>
     <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{ar?"الأفكار اللي حفظتها بتبقى خطة واحدة لكل قرار. راجع الخطوة القادمة وحدّثها بدون تكرار مناسبة أو فاتورة أو مصروف.":(lang==="fr"?frenchUI("Your approved ideas stay here as one record each. Review or update the next action without recreating events, bills or expenses."):"Your approved ideas stay here as one record each. Review or update the next action without recreating events, bills or expenses.")}</p>
     <Button className="mt-4 min-h-11" onClick={()=>setNewOpen(v=>!v)}><Plus className="size-4"/>{ar?"أنشئ خطة بنفسي (اختياري)":(lang==="fr"?frenchUI("Create a plan myself (optional)"):"Create a plan myself (optional)")}</Button>
   </section>
   {newOpen&&<form onSubmit={submit} className="editorial-card mt-4 grid gap-3 p-4 sm:grid-cols-2">
    <label className="text-sm font-medium sm:col-span-2">{ar?"شو ناويين نعمل؟":(lang==="fr"?frenchUI("What are you planning?"):"What are you planning?")}
     <Input required maxLength={100} className="mt-1" value={title} onChange={e=>setTitle(e.target.value)} placeholder={ar?"مثلاً: ثلاجة جديدة أو طلعة الجمعة":(lang==="fr"?frenchUI("e.g. New refrigerator or Friday outing"):"e.g. New refrigerator or Friday outing")}/>
    </label>
    <label className="text-sm font-medium">{ar?"النوع":(lang==="fr"?frenchUI("Type"):"Type")}
     <select className="mt-1 min-h-11 w-full rounded-xl border border-input bg-white px-3" value={kind} onChange={e=>setKind(e.target.value as PlanKind)}>
      {kinds.map(k=><option key={k.id} value={k.id}>{ar?k.ar:(lang==="fr"?frenchUI(k.en):k.en)}</option>)}
     </select>
    </label>
    <label className="text-sm font-medium">{ar?"التاريخ (اختياري)":(lang==="fr"?frenchUI("When (optional)"):"When (optional)")}
     <Input className="mt-1" type="date" value={date} onChange={e=>setDate(e.target.value)}/>
    </label>
    <label className="text-sm font-medium sm:col-span-2">{ar?"سقف الميزانية بالدينار (اختياري)":(lang==="fr"?frenchUI("Comfortable budget ceiling in JOD (optional)"):"Comfortable budget ceiling in JOD (optional)")}
     <Input className="mt-1" type="number" min={0} max={100000} step=".01" inputMode="decimal" value={budget} onChange={e=>setBudget(e.target.value)}/>
    </label>
    <div className="sm:col-span-2 flex flex-wrap gap-2">
     <Button type="submit">{ar?"احفظ الخطة":(lang==="fr"?frenchUI("Save plan"):"Save plan")}</Button>
     <Button type="button" variant="outline" onClick={()=>{setNewOpen(false);setErr("");}}>{ar?"إلغاء":(lang==="fr"?frenchUI("Cancel"):"Cancel")}</Button>
    </div>
   </form>}
   {!ready||!moneyReady?<p className="mt-4 text-sm text-muted-foreground">{ar?"جارٍ تحميل الخطط…":(lang==="fr"?frenchUI("Loading your plans…"):"Loading your plans…")}</p>:null}
   {ready&&plans.length===0&&!newOpen&&<div className="editorial-card mt-5 p-5">
    <h3 className="font-semibold">{ar?"كل رحلة حلوة تبدأ بخطة بسيطة":(lang==="fr"?frenchUI("Start with one meaningful plan"):"Start with one meaningful plan")}</h3>
    <p className="mt-2 text-sm text-muted-foreground">{ar?"اختَر شراء أو طلعة أو مناسبة، وحدد سقفاً مريحاً إن أحببت.":(lang==="fr"?frenchUI("Choose a purchase, outing or occasion and add a comfortable limit if you like."):"Choose a purchase, outing or occasion and add a comfortable limit if you like.")}</p>
   </div>}
   {ready&&plans.length>0&&<section className="mt-6">
    <h2 className="text-lg font-semibold">{ar?"خطط العائلة":(lang==="fr"?frenchUI("Family plans"):"Family plans")} <span className="text-sm text-muted-foreground">({plans.length})</span></h2>
    <div className="mt-3 flex gap-2 overflow-x-auto pb-2">
     {resolvedPlans.map(p=><button key={p.id} type="button" onClick={()=>{setActive(p.id);setErr("");setChosen("");setActual("");}}
       className={"min-w-39 max-w-56 shrink-0 rounded-2xl border p-3 text-start "+(currentPlan?.id===p.id?"border-brand bg-[#EAF1E7]":"border-border bg-white")}>
       <p className="truncate text-sm font-semibold">{p.title}</p>
       <p className="mt-1 text-xs text-muted-foreground">{ar?kinds.find(k=>k.id===p.kind)?.ar:kinds.find(k=>k.id===p.kind)?.en} · {p.status==="completed"?(ar?"مكتملة":(lang==="fr"?frenchUI("Completed"):"Completed")):p.status==="decided"?(ar?"تم الاختيار":(lang==="fr"?frenchUI("Decided"):"Decided")):(ar?"تخطيط":(lang==="fr"?frenchUI("Planning"):"Planning"))}</p>
       {p.date&&<p className="mt-1 text-xs text-brand">{p.date}</p>}
      </button>)}
    </div>
   </section>}
   {currentPlan&&<section className="editorial-card mt-4 p-4 sm:p-6" aria-label={ar?"تفاصيل الخطة":(lang==="fr"?frenchUI("Plan details"):"Plan details")}>
    <div className="flex flex-wrap items-start justify-between gap-2">
     <div><p className="section-eyebrow">{ar?"خطتك الحالية":(lang==="fr"?frenchUI("YOUR ACTIVE PLAN"):"YOUR ACTIVE PLAN")}</p><h2 className="mt-1 text-xl font-semibold">{currentPlan.title}</h2></div>
     <button type="button" onClick={()=>{if(!window.confirm(ar?"حذف هذه الخطة؟ لن يتم حذف المصاريف المسجلة في المالية.":(lang==="fr"?frenchUI("Delete this plan? Any expenses already recorded in Money will remain."):"Delete this plan? Any expenses already recorded in Money will remain.")))return;setPlans(prev=>prev.filter(p=>p.id!==currentPlan.id));setActive(null);}} className="grid size-11 place-items-center rounded-full border border-border text-muted-foreground" aria-label={ar?"حذف الخطة":(lang==="fr"?frenchUI("Delete plan"):"Delete plan")}><Trash2 className="size-4"/></button>
    </div>
    <div className="mt-3 flex flex-wrap gap-2 text-xs">
     {currentPlan.budgetJod!==undefined&&<span className="rounded-full bg-[#EDF3EA] px-3 py-2">{ar?"سقف الميزانية: ":(lang==="fr"?frenchUI("Budget limit: "):"Budget limit: ")}{fmtJOD(currentPlan.budgetJod)}</span>}
     {currentPlan.date&&<span className="inline-flex items-center gap-1 rounded-full bg-[#F8F2E9] px-3 py-2"><CalendarDays className="size-3.5"/>{currentPlan.date}</span>}
    </div>
    {(()=>{
     const pulse=checkFamilyPlan(currentPlan);
     return <div className="mt-4 rounded-xl border border-[#D5E5D3] bg-[#F2F8EF] p-4"
       aria-label={ar?"مراجعة تقدم الخطة":(lang==="fr"?frenchUI("Your plan check-in"):"Your plan check-in")}>
       <p className="text-xs font-semibold text-brand">{ar?"شو لازم نعمل هلأ؟":(lang==="fr"?frenchUI("YOUR NEXT ACTION"):"YOUR NEXT ACTION")}</p>
       <h3 className="mt-1 text-base font-semibold">{ar?pulse.headingAr:pulse.headingEn}</h3>
       <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{ar?pulse.detailAr:pulse.detailEn}</p>
       {currentPlan.status!=="completed"&&<div className="mt-3 flex flex-wrap gap-2">
        <button type="button" onClick={completeSimply}
         className="inline-flex min-h-11 items-center rounded-full bg-brand px-4 text-sm font-semibold text-white">
         {ar?"تمّت الخطة بالفعل":(lang==="fr"?frenchUI("This plan is done"):"This plan is done")}
        </button>
        {pulse.canMove&&<button type="button" onClick={moveWeek}
         className="inline-flex min-h-11 items-center rounded-full border border-[#CDDFCD] bg-white px-4 text-sm font-semibold text-brand">
         {ar?"أجّل خطتي أسبوعاً":(lang==="fr"?frenchUI("Move my plan one week"):"Move my plan one week")}
        </button>}
       </div>}
       <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{ar?"هذه مراجعة على معلومات هذا الجهاز فقط. لا حجز أو دفع أو متابعة تلقائية عند مزوّد الخدمة.":(lang==="fr"?frenchUI("This is a check-in on your saved plan only. No booking, payment or provider monitoring is assumed."):"This is a check-in on your saved plan only. No booking, payment or provider monitoring is assumed.")}</p>
      </div>;
    })()}
        {moneyReady&&currentPlan.status!=="completed"&&<PlanDecisionPanel key={currentPlan.id} plan={currentPlan} money={money} plans={resolvedPlans} onUpdate={update} setMoney={setMoney}/>}
    {!money.demo&&(money.savingsGoals??[]).length>0&&currentPlan.status!=="completed"&&<div className="mt-3 rounded-2xl border border-[#D8E5D8] bg-[#F7FAF5] p-4">
      <label className="block text-sm font-semibold">{ar?"هل تدّخر لهذا الهدف؟":(lang==="fr"?frenchUI("Saving up for this plan?"):"Saving up for this plan?")}
       <select className="mt-2 min-h-11 w-full rounded-xl border border-input bg-white px-3 text-sm" value={currentPlan.savingsGoalId??""}
        onChange={e=>{const id=e.target.value;const next={...currentPlan,updatedAt:new Date().toISOString()};if(id)next.savingsGoalId=id;else delete next.savingsGoalId;update(next);}}>
        <option value="">{ar?"بدون هدف مرتبط":(lang==="fr"?frenchUI("No linked savings goal"):"No linked savings goal")}</option>
        {(money.savingsGoals??[]).map(g=><option key={g.id} value={g.id}>{g.name}</option>)}
       </select>
      </label>
      {money.savingsGoals?.filter(g=>g.id===currentPlan.savingsGoalId).map(g=>{
       const cost=currentPlan.choice?.estimatedJod??currentPlan.budgetJod;
       return <div key={g.id} className="mt-3 rounded-xl bg-white p-3 text-sm">
        <p>{ar?"المدّخر لهذا الهدف حسب إدخالك: ":(lang==="fr"?frenchUI("Manually recorded savings for this goal: "):"Manually recorded savings for this goal: ")}<strong>{fmtJOD(g.savedJod)}</strong></p>
        {cost!==undefined&&<p className="mt-1">{g.savedJod>=cost?(ar?"الهدف المسجل يغطي المبلغ، بشرط توفره فعلياً.":(lang==="fr"?frenchUI("Recorded savings cover the estimate, if those funds remain available."):"Recorded savings cover the estimate, if those funds remain available.")):
         (ar?"المتبقي للهدف بالنسبة لهذه الخطة: ":(lang==="fr"?frenchUI("Still to save toward this plan: "):"Still to save toward this plan: "))+fmtJOD(cost-g.savedJod)}</p>}
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{ar?"الربط لا يخصم أي مبلغ ولا يثبت توفر النقد في البنك.":(lang==="fr"?frenchUI("Linking a goal does not move or reserve funds, and does not verify bank cash."):"Linking a goal does not move or reserve funds, and does not verify bank cash.")}</p>
       </div>;
      })}
    </div>}
    {currentLinked&&!originalOccasion&&<p role="status" className="mt-2 rounded-xl bg-[#FFF3DF] p-3 text-xs text-[#8A673A]">
     {ar?"المناسبة الأصلية غير موجودة حالياً. الخطة والمدفوعات السابقة محفوظة؛ راجع ملف العيلة أو التقويم.":(lang==="fr"?frenchUI("The original date is missing from your family profile or Calendar. Your saved plan and payments remain; please review the source."):"The original date is missing from your family profile or Calendar. Your saved plan and payments remain; please review the source.")}
    </p>}
    {originalOccasion&&currentPlan.occasionPreparation&&Object.values(currentPlan.occasionPreparation).some(cost=>cost.dueDate>originalOccasion.occursOn)&&
     <p role="status" className="mt-2 rounded-xl bg-[#FFF3DF] p-3 text-xs text-[#8A673A]">
      {ar?"تغير موعد المناسبة. راجع مواعيد الهدية والاحتفال؛ لن نغير الدفعات تلقائياً.":(lang==="fr"?frenchUI("The occasion date changed. Review gift and celebration deadlines; confirmed payment dates won't move automatically."):"The occasion date changed. Review gift and celebration deadlines; confirmed payment dates won't move automatically.")}
     </p>}
    {currentPlan.kind==="occasion"&&<OccasionPreparationSection planId={currentPlan.id}/>}
    {currentPlan.status!=="completed"&&<>
      <div className="mt-5 rounded-xl bg-[#F4F7F0] p-4">
       <h3 className="font-semibold">{ar?"الخطوة التالية: قارن الخيارات":(lang==="fr"?frenchUI("Next step: compare suitable options"):"Next step: compare suitable options")}</h3>
       <p className="mt-1 text-xs text-muted-foreground">{ar?"بعد مقارنة أرقام الخطة بالميزانية أعلاه، افتح الخيارات المتاحة وقارن كلفتها قبل اتخاذ القرار.":(lang==="fr"?frenchUI("After checking the figures above, compare real options by cost and suitability before choosing."):"After checking the figures above, compare real options by cost and suitability before choosing.")}</p>
       <div className="mt-3 flex flex-wrap gap-2">
        <Link to={currentPlan.kind==="occasion"?"/occasions":"/advisor"} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-brand px-4 text-sm font-semibold text-white">
         <Compass className="size-4"/>{ar?"استكشف الخيارات":(lang==="fr"?frenchUI("Explore options"):"Explore options")}
        </Link>
       </div>
      </div>
      <details className="mt-4 rounded-xl border border-[#E0E8DD] bg-white p-3">
       <summary className="min-h-11 cursor-pointer text-sm font-semibold text-brand">
        {ar?"حفظ خيار يدوي وتكلفته (اختياري)":(lang==="fr"?frenchUI("Save a specific choice and cost (optional)"):"Save a specific choice and cost (optional)")}
       </summary>
       <div className="mt-4">
       <p className="text-sm font-semibold">{ar?"الاختيار الذي تفضّله":(lang==="fr"?frenchUI("Your preferred option"):"Your preferred option")}</p>
       {currentPlan.choice&&<p className="mt-2 rounded-xl bg-[#EAF1E8] p-3 text-sm">{currentPlan.choice.label}{currentPlan.choice.estimatedJod!==undefined&&" · "+fmtJOD(currentPlan.choice.estimatedJod)}</p>}
       <p className="mt-2 text-xs text-muted-foreground">{ar?"يمكنك حفظ خيار يدوي، أو اختياره من صفحة مقارنة المشتريات.":(lang==="fr"?frenchUI("Save a choice here, or select an option from Compare & Choose."):"Save a choice here, or select an option from Compare & Choose.")}</p>
       <Input maxLength={120} className="mt-2" value={chosen} onChange={e=>setChosen(e.target.value)} placeholder={ar?"اسم الخيار أو المكان":(lang==="fr"?frenchUI("Option or venue name"):"Option or venue name")}/>
       <Input className="mt-2 max-w-48" type="number" inputMode="decimal" step=".01" min={0} max={100000} value={price} onChange={e=>setPrice(e.target.value)} placeholder={ar?"سعر تقريبي (اختياري)":(lang==="fr"?frenchUI("Estimated cost (optional)"):"Estimated cost (optional)")}/>
       <Button variant="outline" className="mt-3" onClick={decide} disabled={!chosen.trim()}>{ar?"احفظ اختياري":(lang==="fr"?frenchUI("Save my choice"):"Save my choice")}</Button>
      </div>
      </details>
      <details className="mt-4 rounded-xl border border-[#E0E8DD] bg-white p-3">
       <summary className="min-h-11 cursor-pointer text-sm font-semibold text-brand">
        {ar?"سجّل تكلفة فعلية مع إكمال الخطة (اختياري)":(lang==="fr"?frenchUI("Finish and record actual cost (optional)"):"Finish and record actual cost (optional)")}
       </summary>
       <div className="mt-5 border-t border-border pt-4">
       <h3 className="font-semibold">{ar?"ماذا حدث فعلياً؟":(lang==="fr"?frenchUI("What actually happened?"):"What actually happened?")}</h3>
       <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{ar?"بعد الشراء أو الطلعة، سجّل التكلفة الحقيقية. لن يتم خصم مبلغ أو إنشاء مصروف إلا بموافقتك.":(lang==="fr"?frenchUI("After the purchase or outing, record actual cost. No cash or spending entry changes unless you approve."):"After the purchase or outing, record actual cost. No cash or spending entry changes unless you approve.")}</p>
       <Input className="mt-3 max-w-48" type="number" inputMode="decimal" min={0} max={100000} step=".01" value={actual} onChange={e=>setActual(e.target.value)} placeholder={ar?"التكلفة الفعلية بالدينار":(lang==="fr"?frenchUI("Actual cost (JOD)"):"Actual cost (JOD)")}/>
       <Button className="mt-3" onClick={finish}>{ar?"اكتملت الخطة":(lang==="fr"?frenchUI("Mark completed"):"Mark completed")}</Button>
      </div>
      </details>
    </>}
    {currentPlan.status==="completed"&&<section className="mt-5 rounded-2xl bg-[#EDF6EA] p-4">
      <p className="flex items-center gap-2 font-semibold"><CheckCircle2 className="size-5 text-brand"/>{ar?"تمّت الخطة":(lang==="fr"?frenchUI("Plan completed"):"Plan completed")}</p>
      <p className="mt-2 text-sm">{ar?"التكلفة الفعلية: ":(lang==="fr"?frenchUI("Actual cost: "):"Actual cost: ")}
       <strong>{currentPlan.actualJod===undefined?(ar?"لم تسجّل بعد":(lang==="fr"?frenchUI("Not recorded"):"Not recorded")):fmtJOD(currentPlan.actualJod)}</strong></p>
      {currentPlan.actualJod===undefined&&<details className="mt-3 rounded-xl border border-[#DDE8DB] bg-white p-3">
       <summary className="min-h-10 cursor-pointer text-sm font-semibold text-brand">
        {ar?"أضف التكلفة الفعلية لاحقاً (اختياري)":(lang==="fr"?frenchUI("Add actual cost later (optional)"):"Add actual cost later (optional)")}
       </summary>
       <label className="mt-3 block text-xs font-semibold">{ar?"التكلفة الحقيقية بالدينار":(lang==="fr"?frenchUI("Actual cost (JOD)"):"Actual cost (JOD)")}
        <Input className="mt-1 max-w-48" type="number" min={0} max={100000} step=".01"
         value={actual} onChange={e=>setActual(e.target.value)}/>
       </label>
       <Button className="mt-3" onClick={addActualLater} disabled={!actual.trim()}>
        {ar?"احفظ التكلفة فقط":(lang==="fr"?frenchUI("Save cost only"):"Save cost only")}
       </Button>
      </details>}
      {currentPlan.budgetJod!==undefined&&currentPlan.actualJod!==undefined&&<p className="mt-1 text-xs text-muted-foreground">{ar?"الفرق عن السقف: ":(lang==="fr"?frenchUI("Difference from ceiling: "):"Difference from ceiling: ")}{fmtJOD(currentPlan.actualJod-currentPlan.budgetJod)}</p>}
      {currentPlan.expenseId||money.expenses.some(e=>e.sourcePlanId===currentPlan.id)?<p className="mt-3 text-sm font-semibold text-brand">{ar?"هذا المصروف مسجّل في المالية.":(lang==="fr"?frenchUI("Recorded in Money."):"Recorded in Money.")}</p>:
      <div className="mt-3">
       <p className="text-xs text-muted-foreground">{ar?"تسجيل المصروف خطوة اختيارية؛ رصيد البنك المدخل لا يتغير.":(lang==="fr"?frenchUI("Optional: record actual expense in Money without changing the manually entered cash balance."):"Optional: record actual expense in Money without changing the manually entered cash balance.")}</p>
       {!money.demo&&money.categories.length>0&&<select className="mt-2 min-h-11 w-full rounded-xl border border-border bg-white px-3 text-sm" value={category} onChange={e=>setCategory(e.target.value)}>
        <option value="">{ar?"اختر فئة مصروف":(lang==="fr"?frenchUI("Choose spending category"):"Choose spending category")}</option>{money.categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
       </select>}
       {money.demo?<Link to="/money" className="mt-2 inline-block text-sm font-semibold text-brand underline">{ar?"ابدأ بماليتي الحقيقية":(lang==="fr"?frenchUI("Start real Money first"):"Start real Money first")}</Link>:
        <Button variant="outline" className="mt-3" onClick={()=>recordExpense(currentPlan)} disabled={currentPlan.actualJod===undefined}>{ar?"سجّل المصروف في المالية":(lang==="fr"?frenchUI("Record actual expense in Money"):"Record actual expense in Money")}</Button>}
      </div>}
    </section>}
   </section>}
   {err&&<p className="mt-3 rounded-xl bg-[#FFF1F1] p-3 text-sm text-[#9B3E47]" role="alert">{err}</p>}
   <p className="mt-5 text-xs leading-relaxed text-muted-foreground">{ar?"هذه الخطط محفوظة فقط على هذا الجهاز. ليست متزامنة بعد مع حسابات أفراد العائلة.":(lang==="fr"?frenchUI("Plans remain private to this browser for now. Household cloud sharing and role permissions are not yet connected."):"Plans remain private to this browser for now. Household cloud sharing and role permissions are not yet connected.")}</p>
 </>;
 return embedded?content:<AppShell title={ar?"خططنا":(lang==="fr"?frenchUI("Our Plans"):"Our Plans")}>{content}</AppShell>;
}
