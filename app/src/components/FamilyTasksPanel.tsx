import {frenchUI} from "@/lib/french";
import {useState,type FormEvent} from "react";
import {CheckCircle2,ClipboardCheck,Plus,Trash2} from "lucide-react";
import {useLocalState,uid} from "@/lib/storage";
import {useI18n} from "@/lib/i18n";
import {Button} from "@/components/ui/button";
import {dateKey} from "@/lib/familyCalendar";
import {isSampleFamilyMember} from "@/lib/familySetup";
import {sampleMembers,type Member} from "@/lib/money";
import {FAMILY_PLANS_KEY,type FamilyPlan} from "@/lib/familyPlans";
import {FAMILY_TASKS_KEY,makeFamilyTask,setTaskComplete,taskSummary,type FamilyTask} from "@/lib/familyTasks";

/** Local parent-managed reminders; not accounts, assignments or messages sent
 * to co-parents or children. No notification or financial write is triggered. */
export function FamilyTasksPanel(){
 const {lang}=useI18n(),ar=lang==="ar";
 const [tasks,setTasks,ready]=useLocalState<FamilyTask[]>(FAMILY_TASKS_KEY,[]);
 const [members]=useLocalState<Member[]>("members",sampleMembers());
 const [plans]=useLocalState<FamilyPlan[]>(FAMILY_PLANS_KEY,[]);
 const [title,setTitle]=useState(""),[date,setDate]=useState(dateKey(new Date()));
 const [priority,setPriority]=useState<FamilyTask["priority"]>("normal");
 const [owner,setOwner]=useState(""),[planId,setPlanId]=useState(""),[note,setNote]=useState("");
 const [error,setError]=useState("");
 if(!ready)return null;
 const adults=members.filter(m=>m.role==="adult"&&!isSampleFamilyMember(m));
 const summary=taskSummary(tasks);
 const submit=(e:FormEvent)=>{
  e.preventDefault();setError("");
  if(tasks.length>=250){setError(ar?"وصلت للحد الأقصى (٢٥٠ مهمة).":(lang==="fr"?frenchUI("250 local tasks maximum."):"250 local tasks maximum."));return;}
  const task=makeFamilyTask({id:uid(),title,dueDate:date,priority,
   ...(owner?{ownerMemberId:owner}:{}),...(planId?{planId}:{}),
   ...(note.trim()?{note}:{})});
  if(!task){setError(ar?"أدخل المهمة وتاريخاً صحيحاً.":(lang==="fr"?frenchUI("Enter a task and valid due date."):"Enter a task and valid due date."));return;}
  setTasks(old=>[task,...old]);setTitle("");setNote("");setOwner("");setPlanId("");
 };
 return <section className="editorial-card mt-5 p-4 sm:p-5" id="family-tasks"
  aria-label={ar?"مهام العائلة":(lang==="fr"?frenchUI("Family responsibilities"):"Family responsibilities")}>
  <div className="flex items-start gap-3">
   <ClipboardCheck className="mt-0.5 size-6 text-brand"/>
   <div>
    <h2 className="text-lg font-semibold">{ar?"مسؤوليات البيت":(lang==="fr"?frenchUI("Family responsibilities"):"Family responsibilities")}</h2>
    <p className="mt-1 text-xs text-muted-foreground">{ar?"مهام وتواريخ محلية على هذا الجهاز. الاسم الذي تختاره للتنظيم فقط؛ لا تُرسل مهام أو رسائل لأحد ولا تظهر للأطفال.":(lang==="fr"?frenchUI("Private reminders on this device. Adult names are planning labels only: no task, message or permission is sent to anyone."):"Private reminders on this device. Adult names are planning labels only: no task, message or permission is sent to anyone.")}</p>
   </div>
  </div>
  <div className="mt-3 flex flex-wrap gap-2 text-xs">
   <span className="rounded-full bg-[#E7F1E5] px-3 py-1.5">{ar?"مفتوحة":(lang==="fr"?frenchUI("Open"):"Open")} {summary.open}</span>
   <span className="rounded-full bg-[#F9E9DE] px-3 py-1.5">{ar?"متأخرة":(lang==="fr"?frenchUI("Overdue"):"Overdue")} {summary.overdue}</span>
   <span className="rounded-full bg-[#E7F1E5] px-3 py-1.5">{ar?"مكتملة":(lang==="fr"?frenchUI("Done"):"Done")} {summary.completed}</span>
  </div>
  <form onSubmit={submit} className="mt-4 grid gap-3 rounded-xl bg-[#F7FAF5] p-3 sm:grid-cols-2">
   <label className="text-xs font-semibold sm:col-span-2">{ar?"المهمة":(lang==="fr"?frenchUI("Task"):"Task")}
    <input required maxLength={140} value={title} onChange={e=>setTitle(e.target.value)}
     className="mt-1 min-h-11 w-full rounded-xl border bg-white px-3 text-sm"
     placeholder={ar?"مثلاً: تجهيز قائمة المدرسة":(lang==="fr"?frenchUI("For example: prepare school supplies"):"For example: prepare school supplies")}/>
   </label>
   <label className="text-xs font-semibold">{ar?"قبل تاريخ":(lang==="fr"?frenchUI("Due date"):"Due date")}
    <input type="date" required value={date} onChange={e=>setDate(e.target.value)}
     className="mt-1 min-h-11 w-full rounded-xl border bg-white px-3 text-sm"/>
   </label>
   <label className="text-xs font-semibold">{ar?"الأولوية":(lang==="fr"?frenchUI("Priority"):"Priority")}
    <select value={priority} onChange={e=>setPriority(e.target.value as FamilyTask["priority"])}
     className="mt-1 min-h-11 w-full rounded-xl border bg-white px-3 text-sm">
     <option value="high">{ar?"مهمة":(lang==="fr"?frenchUI("High"):"High")}</option>
     <option value="normal">{ar?"عادية":(lang==="fr"?frenchUI("Normal"):"Normal")}</option>
     <option value="low">{ar?"مرنة":(lang==="fr"?frenchUI("Flexible"):"Flexible")}</option>
    </select>
   </label>
   <label className="text-xs font-semibold">{ar?"اسم بالغ للتنظيم (اختياري)":(lang==="fr"?frenchUI("Adult label (optional)"):"Adult label (optional)")}
    <select value={owner} onChange={e=>setOwner(e.target.value)}
     className="mt-1 min-h-11 w-full rounded-xl border bg-white px-3 text-sm">
     <option value="">{ar?"بدون اسم":(lang==="fr"?frenchUI("No one selected"):"No one selected")}</option>
     {adults.map(m=><option key={m.id} value={m.id}>{m.name}</option>)}
    </select>
   </label>
   <label className="text-xs font-semibold">{ar?"الخطة المرتبطة (اختياري)":(lang==="fr"?frenchUI("Related plan (optional)"):"Related plan (optional)")}
    <select value={planId} onChange={e=>setPlanId(e.target.value)}
     className="mt-1 min-h-11 w-full rounded-xl border bg-white px-3 text-sm">
     <option value="">{ar?"لا توجد خطة":(lang==="fr"?frenchUI("No linked plan"):"No linked plan")}</option>
     {plans.filter(p=>p.status!=="completed").map(p=><option key={p.id} value={p.id}>{p.title}</option>)}
    </select>
   </label>
   <label className="text-xs font-semibold sm:col-span-2">{ar?"ملاحظة قصيرة (بدون بيانات حساسة)":(lang==="fr"?frenchUI("Short note (avoid sensitive details)"):"Short note (avoid sensitive details)")}
    <input maxLength={300} value={note} onChange={e=>setNote(e.target.value)}
     className="mt-1 min-h-11 w-full rounded-xl border bg-white px-3 text-sm"/>
   </label>
   <div className="sm:col-span-2"><Button type="submit"><Plus className="size-4"/>{ar?"أضف المهمة":(lang==="fr"?frenchUI("Add task"):"Add task")}</Button></div>
  </form>
  {error&&<p role="alert" className="mt-2 text-xs text-destructive">{error}</p>}
  <div className="mt-4 space-y-2">
   {tasks.length===0?<p className="text-xs text-muted-foreground">{ar?"لا توجد مهام بعد.":(lang==="fr"?frenchUI("No tasks yet."):"No tasks yet.")}</p>:
    [...tasks].sort((a,b)=>(a.status==="done"?1:0)-(b.status==="done"?1:0)||
      a.dueDate.localeCompare(b.dueDate)).slice(0,100).map(task=>
     <article key={task.id} className="flex items-start gap-3 rounded-xl border border-[#E2EADF] bg-white p-3">
      <button type="button" aria-label={ar?"بدّل حالة المهمة":(lang==="fr"?frenchUI("Toggle task completion"):"Toggle task completion")}
       aria-pressed={task.status==="done"}
       onClick={()=>setTasks(old=>old.map(t=>t.id===task.id?setTaskComplete(t,t.status!=="done"):t))}
       className="grid min-h-10 min-w-10 place-items-center rounded-xl bg-[#EDF5E9] text-brand">
       <CheckCircle2 className={"size-5 "+(task.status==="done"?"fill-[#CDE4C9]":"")}/>
      </button>
      <div className="min-w-0 flex-1">
       <p className={"text-sm font-semibold "+(task.status==="done"?"text-muted-foreground line-through":"")}>{task.title}</p>
       <p className="mt-1 text-xs text-muted-foreground">{task.dueDate} · {task.priority}
        {task.ownerMemberId?" · "+(adults.find(m=>m.id===task.ownerMemberId)?.name??(ar?"اسم محذوف":(lang==="fr"?frenchUI("Former label"):"Former label"))):""}
        {task.planId?" · "+(plans.find(p=>p.id===task.planId)?.title??(ar?"خطة محذوفة":(lang==="fr"?frenchUI("Former plan"):"Former plan"))):""}</p>
       {task.note&&<p className="mt-1 text-xs text-muted-foreground">{task.note}</p>}
      </div>
      <button type="button" className="grid min-h-10 min-w-10 place-items-center text-[#895D50]"
       aria-label={ar?"احذف المهمة":(lang==="fr"?frenchUI("Delete task"):"Delete task")}
       onClick={()=>{
        if(window.confirm(ar?"حذف هذه المهمة من هذا الجهاز فقط؟":(lang==="fr"?frenchUI("Delete this task from this device only?"):"Delete this task from this device only?")))
         setTasks(old=>old.filter(t=>t.id!==task.id));
       }}><Trash2 className="size-4"/></button>
     </article>)}
  </div>
  <p className="mt-3 text-[11px] text-muted-foreground">{ar?"تكتمل المهمة يدوياً فقط. لا يوجد تقويم مشترك أو إشعار تلقائي أو تحقق من إنجاز بالغ آخر.":(lang==="fr"?frenchUI("Completion is self-reported. No shared calendar, automatic device reminder or verified co-parent completion is implied."):"Completion is self-reported. No shared calendar, automatic device reminder or verified co-parent completion is implied.")}</p>
 </section>;
}
