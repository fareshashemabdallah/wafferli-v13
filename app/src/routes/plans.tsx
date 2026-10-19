import {createFileRoute,Link} from "@tanstack/react-router";
import {CalendarDays,CheckCircle2,Compass,Plus,Trash2} from "lucide-react";
import {useState,type FormEvent} from "react";
import {toast} from "sonner";
import {AppShell} from "@/components/AppShell";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {useI18n} from "@/lib/i18n";
import {uid,fmtJOD,useLocalState} from "@/lib/storage";
import {sampleMoney,type MoneyState,type Expense} from "@/lib/money";
import {ACTIVE_PLAN_KEY,FAMILY_PLANS_KEY,makeFamilyPlan,markPlanComplete,moneyAmount,setPlanChoice,upcomingFamilyPlans,type FamilyPlan,type PlanKind} from "@/lib/familyPlans";
import {PlanDecisionPanel} from "@/components/PlanDecisionPanel";
import {checkFamilyPlan,postponeFlexiblePlan,markPlanDoneWithoutCost,addPlanActualCost} from "@/lib/familyPlanCheckIn";
import {OccasionPreparationSection} from "@/components/OccasionPreparationSection";
import {localToday} from "@/lib/cashflow";
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
 const [newOpen,setNewOpen]=useState(false);
 const [title,setTitle]=useState(""),[kind,setKind]=useState<PlanKind>("purchase"),[date,setDate]=useState(""),[budget,setBudget]=useState("");
 const [err,setErr]=useState("");
 const [chosen,setChosen]=useState(""),[price,setPrice]=useState(""),[actual,setActual]=useState(""),[category,setCategory]=useState("");
 const selected=plans.find(p=>p.id===active)??null;
 const currentPlan=selected??upcomingFamilyPlans(plans)[0]??plans[0]??null;
 const update=(next:FamilyPlan)=>setPlans(prev=>prev.map(p=>p.id===next.id?next:p));
 const completeSimply=()=>{
  if(!currentPlan||currentPlan.status==="completed")return;
  if(!window.confirm(ar?"هل اكتملت الخطة فعلاً؟ لن نسجّل مبلغاً أو دفعة، ويمكن إضافة التكلفة لاحقاً.":
   "Did the plan actually happen? This marks it done without recording a cost or payment."))return;
  update(markPlanDoneWithoutCost(currentPlan));setErr("");
  toast.success(ar?"تمّ! بلا مصروف مسجّل.":"Plan completed; no expense was recorded.");
 };
 const moveWeek=()=>{
  if(!currentPlan)return;
  const next=postponeFlexiblePlan(currentPlan);
  if(!next)return setErr(ar?"هذا الموعد مربوط بمناسبة ثابتة ولا يمكن تأجيله تلقائياً.":
   "This date belongs to a fixed or linked event and cannot be moved here.");
  if(!window.confirm(ar?
   "غيّر تاريخ الخطة المسجّل لأسبوع لاحق؟ هذا لا يغيّر أي حجز أو موعد مؤكد عند مزوّد الخدمة.":
   "Move this saved plan one week? It does NOT reschedule any real booking, order or provider appointment."))return;
  update(next);setErr("");
  toast.success(ar?"تم تحديث موعد الخطة فقط.":"Saved plan date updated only.");
 };
 const addActualLater=()=>{
  if(!currentPlan||currentPlan.status!=="completed")return;
  const n=moneyAmount(actual);
  if(n===null)return setErr(ar?"أدخل تكلفة فعلية صحيحة أو اتركها فارغة.":
   "Enter a valid actual amount or leave it unrecorded.");
  const updated=addPlanActualCost(currentPlan,n);
  if(!updated)return setErr(ar?"لا يمكن تغيير تكلفة مرتبطة بمصروف مسجل مسبقاً.":
   "Cannot change a cost already linked to a recorded expense.");
  update(updated);setActual("");setErr("");
  toast.success(ar?"تم تحديث تكلفة الخطة فقط، دون تسجيل مصروف.":"Plan cost saved, without recording an expense.");
 };
 const submit=(e:FormEvent)=>{
  e.preventDefault();const amount=budget.trim()===""?undefined:moneyAmount(budget);
  if(budget.trim()!==""&&amount===null)return setErr(ar?"أدخل ميزانية صحيحة بين صفر و١٠٠٬٠٠٠ دينار.":"Enter a valid budget between 0 and 100,000 JOD.");
  const plan=makeFamilyPlan({id:uid(),title,kind,...(date?{date}:{}),...(amount!==undefined?{budgetJod:amount!}:{})});
  if(!plan)return setErr(ar?"أدخل الاسم والتاريخ الصحيح.":"Enter a name and valid date.");
  setPlans(prev=>[plan,...prev]);setActive(plan.id);setTitle("");setDate("");setBudget("");setNewOpen(false);setErr("");
  toast.success(ar?"الخطة صارت جاهزة!":"Plan created.");
 };
 const decide=()=>{
  if(!currentPlan||!chosen.trim())return;
  const n=price.trim()===""?undefined:moneyAmount(price);
  if(price.trim()!==""&&n===null)return setErr(ar?"أدخل مبلغاً صحيحاً.":"Enter a valid estimated amount.");
  update(setPlanChoice(currentPlan,{label:chosen,...(n!==undefined?{estimatedJod:n!}:{}),source:"manual"}));
  setChosen("");setPrice("");setErr("");toast.success(ar?"تم حفظ الاختيار.":"Choice saved to your plan.");
 };
 const finish=()=>{
  if(!currentPlan)return;const n=moneyAmount(actual);
  if(n===null)return setErr(ar?"أدخل القيمة الفعلية (يمكن أن تكون صفرًا).":"Enter an actual cost (zero is allowed).");
  update(markPlanComplete(currentPlan,n));setActual("");setErr("");toast.success(ar?"تم حفظ النتيجة الفعلية.":"Actual outcome saved.");
 };
 const recordExpense=(plan:FamilyPlan)=>{
  if(money.demo||!moneyReady)return setErr(ar?"ابدأ ببيانات مالية حقيقية قبل ربط المصروف.":"Switch from demo to your real finances before recording.");
  if(plan.status!=="completed"||plan.actualJod===undefined)return;
  if(!category||!money.categories.some(c=>c.id===category))return setErr(ar?"اختَر فئة مصروف أولاً.":"Choose a spending category.");
  const expenseId="family-plan-"+plan.id;
  if(money.expenses.some(e=>e.id===expenseId)||plan.expenseId)return setErr(ar?"هذا المصروف مسجّل بالفعل.":"This expense is already recorded.");
  if(!window.confirm(ar?"سنضيف المبلغ الفعلي كمصروف مدفوع في المالية دون خصمه من رصيد البنك. هل تؤكد؟":"Record this actual amount as a paid expense in Money without changing the manually entered bank balance?"))return;
  const expense:Expense={id:expenseId,date:localToday(),categoryId:category,amount:plan.actualJod,
    status:"paid",shared:false,note:plan.title,sourcePlanId:plan.id};
  setMoney(prev=>prev.expenses.some(e=>e.id===expenseId)?prev:{...prev,expenses:[expense,...prev.expenses]});
  update({...plan,expenseId,updatedAt:new Date().toISOString()});setErr("");
  toast.success(ar?"تم الربط بالمالية دون تعديل رصيد البنك.":"Recorded in Money without deducting cash.");
 };
 const content=<>
   
   <section className="page-intro">
     <p className="section-eyebrow">{ar?"خطّة واحدة، خطوات مترابطة":"ONE PLAN · CONNECTED CHOICES"}</p>
     <h2 className="mt-2 text-xl font-semibold text-ink">{ar?"قرارات عيلتنا وخططنا القادمة":"Decisions we made, and what comes next"}</h2>
     <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{ar?"الأفكار اللي حفظتها بتبقى خطة واحدة لكل قرار. راجع الخطوة القادمة وحدّثها بدون تكرار مناسبة أو فاتورة أو مصروف.":"Your approved ideas stay here as one record each. Review or update the next action without recreating events, bills or expenses."}</p>
     <Button className="mt-4 min-h-11" onClick={()=>setNewOpen(v=>!v)}><Plus className="size-4"/>{ar?"أنشئ خطة بنفسي (اختياري)":"Create a plan myself (optional)"}</Button>
   </section>
   {newOpen&&<form onSubmit={submit} className="editorial-card mt-4 grid gap-3 p-4 sm:grid-cols-2">
    <label className="text-sm font-medium sm:col-span-2">{ar?"شو ناويين نعمل؟":"What are you planning?"}
     <Input required maxLength={100} className="mt-1" value={title} onChange={e=>setTitle(e.target.value)} placeholder={ar?"مثلاً: ثلاجة جديدة أو طلعة الجمعة":"e.g. New refrigerator or Friday outing"}/>
    </label>
    <label className="text-sm font-medium">{ar?"النوع":"Type"}
     <select className="mt-1 min-h-11 w-full rounded-xl border border-input bg-white px-3" value={kind} onChange={e=>setKind(e.target.value as PlanKind)}>
      {kinds.map(k=><option key={k.id} value={k.id}>{ar?k.ar:k.en}</option>)}
     </select>
    </label>
    <label className="text-sm font-medium">{ar?"التاريخ (اختياري)":"When (optional)"}
     <Input className="mt-1" type="date" value={date} onChange={e=>setDate(e.target.value)}/>
    </label>
    <label className="text-sm font-medium sm:col-span-2">{ar?"سقف الميزانية بالدينار (اختياري)":"Comfortable budget ceiling in JOD (optional)"}
     <Input className="mt-1" type="number" min={0} max={100000} step=".01" inputMode="decimal" value={budget} onChange={e=>setBudget(e.target.value)}/>
    </label>
    <div className="sm:col-span-2 flex flex-wrap gap-2">
     <Button type="submit">{ar?"احفظ الخطة":"Save plan"}</Button>
     <Button type="button" variant="outline" onClick={()=>{setNewOpen(false);setErr("");}}>{ar?"إلغاء":"Cancel"}</Button>
    </div>
   </form>}
   {!ready||!moneyReady?<p className="mt-4 text-sm text-muted-foreground">{ar?"جارٍ تحميل الخطط…":"Loading your plans…"}</p>:null}
   {ready&&plans.length===0&&!newOpen&&<div className="editorial-card mt-5 p-5">
    <h3 className="font-semibold">{ar?"كل رحلة حلوة تبدأ بخطة بسيطة":"Start with one meaningful plan"}</h3>
    <p className="mt-2 text-sm text-muted-foreground">{ar?"اختَر شراء أو طلعة أو مناسبة، وحدد سقفاً مريحاً إن أحببت.":"Choose a purchase, outing or occasion and add a comfortable limit if you like."}</p>
   </div>}
   {ready&&plans.length>0&&<section className="mt-6">
    <h2 className="text-lg font-semibold">{ar?"خطط العائلة":"Family plans"} <span className="text-sm text-muted-foreground">({plans.length})</span></h2>
    <div className="mt-3 flex gap-2 overflow-x-auto pb-2">
     {plans.map(p=><button key={p.id} type="button" onClick={()=>{setActive(p.id);setErr("");setChosen("");setActual("");}}
       className={"min-w-39 max-w-56 shrink-0 rounded-2xl border p-3 text-start "+(currentPlan?.id===p.id?"border-brand bg-[#EAF1E7]":"border-border bg-white")}>
       <p className="truncate text-sm font-semibold">{p.title}</p>
       <p className="mt-1 text-xs text-muted-foreground">{ar?kinds.find(k=>k.id===p.kind)?.ar:kinds.find(k=>k.id===p.kind)?.en} · {p.status==="completed"?(ar?"مكتملة":"Completed"):p.status==="decided"?(ar?"تم الاختيار":"Decided"):(ar?"تخطيط":"Planning")}</p>
       {p.date&&<p className="mt-1 text-xs text-brand">{p.date}</p>}
      </button>)}
    </div>
   </section>}
   {currentPlan&&<section className="editorial-card mt-4 p-4 sm:p-6" aria-label={ar?"تفاصيل الخطة":"Plan details"}>
    <div className="flex flex-wrap items-start justify-between gap-2">
     <div><p className="section-eyebrow">{ar?"خطتك الحالية":"YOUR ACTIVE PLAN"}</p><h2 className="mt-1 text-xl font-semibold">{currentPlan.title}</h2></div>
     <button type="button" onClick={()=>{if(!window.confirm(ar?"حذف هذه الخطة؟ لن يتم حذف المصاريف المسجلة في المالية.":"Delete this plan? Any expenses already recorded in Money will remain."))return;setPlans(prev=>prev.filter(p=>p.id!==currentPlan.id));setActive(null);}} className="grid size-11 place-items-center rounded-full border border-border text-muted-foreground" aria-label={ar?"حذف الخطة":"Delete plan"}><Trash2 className="size-4"/></button>
    </div>
    <div className="mt-3 flex flex-wrap gap-2 text-xs">
     {currentPlan.budgetJod!==undefined&&<span className="rounded-full bg-[#EDF3EA] px-3 py-2">{ar?"سقف الميزانية: ":"Budget limit: "}{fmtJOD(currentPlan.budgetJod)}</span>}
     {currentPlan.date&&<span className="inline-flex items-center gap-1 rounded-full bg-[#F8F2E9] px-3 py-2"><CalendarDays className="size-3.5"/>{currentPlan.date}</span>}
    </div>
    {(()=>{
     const pulse=checkFamilyPlan(currentPlan);
     return <div className="mt-4 rounded-xl border border-[#D5E5D3] bg-[#F2F8EF] p-4"
       aria-label={ar?"مراجعة تقدم الخطة":"Your plan check-in"}>
       <p className="text-xs font-semibold text-brand">{ar?"شو لازم نعمل هلأ؟":"YOUR NEXT ACTION"}</p>
       <h3 className="mt-1 text-base font-semibold">{ar?pulse.headingAr:pulse.headingEn}</h3>
       <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{ar?pulse.detailAr:pulse.detailEn}</p>
       {currentPlan.status!=="completed"&&<div className="mt-3 flex flex-wrap gap-2">
        <button type="button" onClick={completeSimply}
         className="inline-flex min-h-11 items-center rounded-full bg-brand px-4 text-sm font-semibold text-white">
         {ar?"تمّت الخطة بالفعل":"This plan is done"}
        </button>
        {pulse.canMove&&<button type="button" onClick={moveWeek}
         className="inline-flex min-h-11 items-center rounded-full border border-[#CDDFCD] bg-white px-4 text-sm font-semibold text-brand">
         {ar?"أجّل خطتي أسبوعاً":"Move my plan one week"}
        </button>}
       </div>}
       <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{ar?
        "هذه مراجعة على معلومات هذا الجهاز فقط. لا حجز أو دفع أو متابعة تلقائية عند مزوّد الخدمة.":
        "This is a check-in on your saved plan only. No booking, payment or provider monitoring is assumed."}</p>
      </div>;
    })()}
        {moneyReady&&currentPlan.status!=="completed"&&<PlanDecisionPanel key={currentPlan.id} plan={currentPlan} money={money} plans={plans} onUpdate={update} setMoney={setMoney}/>}
    {!money.demo&&(money.savingsGoals??[]).length>0&&currentPlan.status!=="completed"&&<div className="mt-3 rounded-2xl border border-[#D8E5D8] bg-[#F7FAF5] p-4">
      <label className="block text-sm font-semibold">{ar?"هل تدّخر لهذا الهدف؟":"Saving up for this plan?"}
       <select className="mt-2 min-h-11 w-full rounded-xl border border-input bg-white px-3 text-sm" value={currentPlan.savingsGoalId??""}
        onChange={e=>{const id=e.target.value;const next={...currentPlan,updatedAt:new Date().toISOString()};if(id)next.savingsGoalId=id;else delete next.savingsGoalId;update(next);}}>
        <option value="">{ar?"بدون هدف مرتبط":"No linked savings goal"}</option>
        {(money.savingsGoals??[]).map(g=><option key={g.id} value={g.id}>{g.name}</option>)}
       </select>
      </label>
      {money.savingsGoals?.filter(g=>g.id===currentPlan.savingsGoalId).map(g=>{
       const cost=currentPlan.choice?.estimatedJod??currentPlan.budgetJod;
       return <div key={g.id} className="mt-3 rounded-xl bg-white p-3 text-sm">
        <p>{ar?"المدّخر لهذا الهدف حسب إدخالك: ":"Manually recorded savings for this goal: "}<strong>{fmtJOD(g.savedJod)}</strong></p>
        {cost!==undefined&&<p className="mt-1">{g.savedJod>=cost?(ar?"الهدف المسجل يغطي المبلغ، بشرط توفره فعلياً.":"Recorded savings cover the estimate, if those funds remain available."):
         (ar?"المتبقي للهدف بالنسبة لهذه الخطة: ":"Still to save toward this plan: ")+fmtJOD(cost-g.savedJod)}</p>}
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{ar?"الربط لا يخصم أي مبلغ ولا يثبت توفر النقد في البنك.":"Linking a goal does not move or reserve funds, and does not verify bank cash."}</p>
       </div>;
      })}
    </div>}
    {currentPlan.kind==="occasion"&&<OccasionPreparationSection planId={currentPlan.id}/>}
    {currentPlan.status!=="completed"&&<>
      <div className="mt-5 rounded-xl bg-[#F4F7F0] p-4">
       <h3 className="font-semibold">{ar?"الخطوة التالية: قارن الخيارات":"Next step: compare suitable options"}</h3>
       <p className="mt-1 text-xs text-muted-foreground">{ar?"بعد مقارنة أرقام الخطة بالميزانية أعلاه، افتح الخيارات المتاحة وقارن كلفتها قبل اتخاذ القرار.":"After checking the figures above, compare real options by cost and suitability before choosing."}</p>
       <div className="mt-3 flex flex-wrap gap-2">
        <Link to={currentPlan.kind==="purchase"?"/explore/market":currentPlan.kind==="outing"?"/explore/weekend":currentPlan.kind==="occasion"?"/occasions":"/advisor"} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-brand px-4 text-sm font-semibold text-white">
         <Compass className="size-4"/>{ar?"استكشف الخيارات":"Explore options"}
        </Link>
       </div>
      </div>
      <details className="mt-4 rounded-xl border border-[#E0E8DD] bg-white p-3">
       <summary className="min-h-11 cursor-pointer text-sm font-semibold text-brand">
        {ar?"حفظ خيار يدوي وتكلفته (اختياري)":"Save a specific choice and cost (optional)"}
       </summary>
       <div className="mt-4">
       <p className="text-sm font-semibold">{ar?"الاختيار الذي تفضّله":"Your preferred option"}</p>
       {currentPlan.choice&&<p className="mt-2 rounded-xl bg-[#EAF1E8] p-3 text-sm">{currentPlan.choice.label}{currentPlan.choice.estimatedJod!==undefined&&" · "+fmtJOD(currentPlan.choice.estimatedJod)}</p>}
       <p className="mt-2 text-xs text-muted-foreground">{ar?"يمكنك حفظ خيار يدوي، أو اختياره من صفحة مقارنة المشتريات.":"Save a choice here, or select an option from Compare & Choose."}</p>
       <Input maxLength={120} className="mt-2" value={chosen} onChange={e=>setChosen(e.target.value)} placeholder={ar?"اسم الخيار أو المكان":"Option or venue name"}/>
       <Input className="mt-2 max-w-48" type="number" inputMode="decimal" step=".01" min={0} max={100000} value={price} onChange={e=>setPrice(e.target.value)} placeholder={ar?"سعر تقريبي (اختياري)":"Estimated cost (optional)"}/>
       <Button variant="outline" className="mt-3" onClick={decide} disabled={!chosen.trim()}>{ar?"احفظ اختياري":"Save my choice"}</Button>
      </div>
      </details>
      <details className="mt-4 rounded-xl border border-[#E0E8DD] bg-white p-3">
       <summary className="min-h-11 cursor-pointer text-sm font-semibold text-brand">
        {ar?"سجّل تكلفة فعلية مع إكمال الخطة (اختياري)":"Finish and record actual cost (optional)"}
       </summary>
       <div className="mt-5 border-t border-border pt-4">
       <h3 className="font-semibold">{ar?"ماذا حدث فعلياً؟":"What actually happened?"}</h3>
       <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{ar?"بعد الشراء أو الطلعة، سجّل التكلفة الحقيقية. لن يتم خصم مبلغ أو إنشاء مصروف إلا بموافقتك.":"After the purchase or outing, record actual cost. No cash or spending entry changes unless you approve."}</p>
       <Input className="mt-3 max-w-48" type="number" inputMode="decimal" min={0} max={100000} step=".01" value={actual} onChange={e=>setActual(e.target.value)} placeholder={ar?"التكلفة الفعلية بالدينار":"Actual cost (JOD)"}/>
       <Button className="mt-3" onClick={finish}>{ar?"اكتملت الخطة":"Mark completed"}</Button>
      </div>
      </details>
    </>}
    {currentPlan.status==="completed"&&<section className="mt-5 rounded-2xl bg-[#EDF6EA] p-4">
      <p className="flex items-center gap-2 font-semibold"><CheckCircle2 className="size-5 text-brand"/>{ar?"تمّت الخطة":"Plan completed"}</p>
      <p className="mt-2 text-sm">{ar?"التكلفة الفعلية: ":"Actual cost: "}
       <strong>{currentPlan.actualJod===undefined?(ar?"لم تسجّل بعد":"Not recorded"):fmtJOD(currentPlan.actualJod)}</strong></p>
      {currentPlan.actualJod===undefined&&<details className="mt-3 rounded-xl border border-[#DDE8DB] bg-white p-3">
       <summary className="min-h-10 cursor-pointer text-sm font-semibold text-brand">
        {ar?"أضف التكلفة الفعلية لاحقاً (اختياري)":"Add actual cost later (optional)"}
       </summary>
       <label className="mt-3 block text-xs font-semibold">{ar?"التكلفة الحقيقية بالدينار":"Actual cost (JOD)"}
        <Input className="mt-1 max-w-48" type="number" min={0} max={100000} step=".01"
         value={actual} onChange={e=>setActual(e.target.value)}/>
       </label>
       <Button className="mt-3" onClick={addActualLater} disabled={!actual.trim()}>
        {ar?"احفظ التكلفة فقط":"Save cost only"}
       </Button>
      </details>}
      {currentPlan.budgetJod!==undefined&&currentPlan.actualJod!==undefined&&<p className="mt-1 text-xs text-muted-foreground">{ar?"الفرق عن السقف: ":"Difference from ceiling: "}{fmtJOD(currentPlan.actualJod-currentPlan.budgetJod)}</p>}
      {currentPlan.expenseId||money.expenses.some(e=>e.sourcePlanId===currentPlan.id)?<p className="mt-3 text-sm font-semibold text-brand">{ar?"هذا المصروف مسجّل في المالية.":"Recorded in Money."}</p>:
      <div className="mt-3">
       <p className="text-xs text-muted-foreground">{ar?"تسجيل المصروف خطوة اختيارية؛ رصيد البنك المدخل لا يتغير.":"Optional: record actual expense in Money without changing the manually entered cash balance."}</p>
       {!money.demo&&money.categories.length>0&&<select className="mt-2 min-h-11 w-full rounded-xl border border-border bg-white px-3 text-sm" value={category} onChange={e=>setCategory(e.target.value)}>
        <option value="">{ar?"اختر فئة مصروف":"Choose spending category"}</option>{money.categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
       </select>}
       {money.demo?<Link to="/money" className="mt-2 inline-block text-sm font-semibold text-brand underline">{ar?"ابدأ بماليتي الحقيقية":"Start real Money first"}</Link>:
        <Button variant="outline" className="mt-3" onClick={()=>recordExpense(currentPlan)} disabled={!category||money.categories.length===0||currentPlan.actualJod===undefined}>{ar?"سجّل المصروف في المالية":"Record actual expense in Money"}</Button>}
      </div>}
    </section>}
   </section>}
   {err&&<p className="mt-3 rounded-xl bg-[#FFF1F1] p-3 text-sm text-[#9B3E47]" role="alert">{err}</p>}
   <p className="mt-5 text-xs leading-relaxed text-muted-foreground">{ar?"هذه الخطط محفوظة فقط على هذا الجهاز. ليست متزامنة بعد مع حسابات أفراد العائلة.":"Plans remain private to this browser for now. Household cloud sharing and role permissions are not yet connected."}</p>
 </>;
 return embedded?content:<AppShell title={ar?"خططنا":"Our Plans"}>{content}</AppShell>;
}
