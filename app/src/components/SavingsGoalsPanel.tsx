import {frenchUI} from "@/lib/french";
import {useState,type FormEvent} from "react";
import {CheckCircle2,Plus,Target,Trash2} from "lucide-react";
import {toast} from "sonner";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {useI18n} from "@/lib/i18n";
import {fmtJOD,uid} from "@/lib/storage";
import {computeMoney,type MoneyState} from "@/lib/money";
import {createSavingsGoal,removeGoal,updateGoalSaved} from "@/lib/savingsGoals";

type Props={state:MoneyState;setState:(fn:(s:MoneyState)=>MoneyState)=>void};
const amt=(v:string)=>v.trim()===""?NaN:Number(v);
export function SavingsGoalsPanel({state,setState}:Props){
 const {lang}=useI18n(),ar=lang==="ar";
 const goals=state.savingsGoals??[],monthlyTarget=computeMoney(state).savingsTarget;
 const sum=goals.reduce((n,g)=>n+g.monthlyJod,0);
 const [show,setShow]=useState(false),[name,setName]=useState(""),[target,setTarget]=useState(""),[saved,setSaved]=useState("0"),[monthly,setMonthly]=useState("0"),[due,setDue]=useState("");
 const [editingSaved,setEditingSaved]=useState<string|null>(null),[newSaved,setNewSaved]=useState(""),[error,setError]=useState("");
 const create=(e:FormEvent)=>{
  e.preventDefault();
  const goal=createSavingsGoal({id:uid(),name,targetJod:amt(target),savedJod:amt(saved),monthlyJod:amt(monthly),...(due?{dueDate:due}:{})});
  if(!goal)return setError(ar?"راجع الاسم والمبالغ والتاريخ.":(lang==="fr"?frenchUI("Enter a name and valid target, saved, monthly and date values."):"Enter a name and valid target, saved, monthly and date values."));
  setState(s=>({...s,savingsGoals:[...(s.savingsGoals??[]),goal]}));
  setName("");setTarget("");setSaved("0");setMonthly("0");setDue("");setShow(false);setError("");
  toast.success(ar?"تمت إضافة هدف الادخار.":(lang==="fr"?frenchUI("Savings goal added."):"Savings goal added."));
 };
 const editSaved=(id:string)=>{
  const g=goals.find(x=>x.id===id),n=amt(newSaved);
  if(!g||!Number.isFinite(n)||n<0||n>1000000)return setError(ar?"أدخل مبلغًا صحيحًا.":(lang==="fr"?frenchUI("Enter a valid saved amount."):"Enter a valid saved amount."));
  if(!window.confirm(ar?"نحدّث المبلغ الذي ادّخرته فعلياً لهذا الهدف. لن يغيّر دبّرنا رصيد البنك أو يخصم أي مبلغ. هل تؤكد؟":(lang==="fr"?frenchUI("Confirm how much you have actually put aside for this goal? This does not move money or change your entered bank balance."):"Confirm how much you have actually put aside for this goal? This does not move money or change your entered bank balance.")))return;
  setState(s=>updateGoalSaved(s,id,n));setEditingSaved(null);setError("");
  toast.success(ar?"تم تحديث المبلغ المدّخر.":(lang==="fr"?frenchUI("Saved amount updated."):"Saved amount updated."));
 };
 return <section className="editorial-card p-4 sm:p-5" aria-label={ar?"أهداف الادخار":(lang==="fr"?frenchUI("Savings goals"):"Savings goals")}>
  <div className="flex flex-wrap items-center justify-between gap-2">
   <div><p className="section-eyebrow">{ar?"أهدافك":(lang==="fr"?frenchUI("YOUR GOALS"):"YOUR GOALS")}</p>
    <h2 className="mt-1 text-lg font-semibold">{ar?"على شو عم نوفر؟":(lang==="fr"?frenchUI("What are we saving for?"):"What are we saving for?")}</h2>
   </div>
   <Button size="sm" variant="outline" onClick={()=>setShow(!show)}><Plus className="size-4"/>{ar?"أضف هدف":(lang==="fr"?frenchUI("Add goal"):"Add goal")}</Button>
  </div>
  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{ar?"سجّل أهداف مثل طوارئ أو مدارس أو إجازة. المبلغ المدّخر فعليًا تُدخله أنت؛ ولا نفترض أنه موجود في البنك أو ننقله تلقائيًا.":(lang==="fr"?frenchUI("Track an emergency fund, school costs or holiday. You confirm money actually saved; Dabberna never assumes it's in your bank or transfers it."):"Track an emergency fund, school costs or holiday. You confirm money actually saved; Dabberna never assumes it's in your bank or transfers it.")}</p>
  {show&&<form onSubmit={create} className="mt-3 space-y-3 rounded-2xl border border-[#DCE8DB] bg-[#F6FAF5] p-3">
   <label className="block text-xs font-semibold">{ar?"اسم الهدف":(lang==="fr"?frenchUI("Goal name"):"Goal name")}<Input required maxLength={100} className="mt-1 bg-white" value={name} onChange={e=>setName(e.target.value)} placeholder={ar?"مثل صندوق طوارئ":(lang==="fr"?frenchUI("e.g. Emergency fund"):"e.g. Emergency fund")}/></label>
   <div className="grid grid-cols-2 gap-2">
    <label className="block text-xs font-semibold">{ar?"المبلغ المطلوب (د.أ)":(lang==="fr"?frenchUI("Target (JOD)"):"Target (JOD)")}<Input required type="number" inputMode="decimal" min=".01" step=".01" className="mt-1 bg-white" value={target} onChange={e=>setTarget(e.target.value)}/></label>
    <label className="block text-xs font-semibold">{ar?"المدّخر فعلياً (د.أ)":(lang==="fr"?frenchUI("Already saved (JOD)"):"Already saved (JOD)")}<Input required type="number" inputMode="decimal" min="0" step=".01" className="mt-1 bg-white" value={saved} onChange={e=>setSaved(e.target.value)}/></label>
    <label className="block text-xs font-semibold">{ar?"مخطط توفيره شهرياً":(lang==="fr"?frenchUI("Monthly allocation"):"Monthly allocation")}<Input required type="number" inputMode="decimal" min="0" step=".01" className="mt-1 bg-white" value={monthly} onChange={e=>setMonthly(e.target.value)}/></label>
    <label className="block text-xs font-semibold">{ar?"الموعد (اختياري)":(lang==="fr"?frenchUI("By when (optional)"):"By when (optional)")}<Input type="date" className="mt-1 bg-white" value={due} onChange={e=>setDue(e.target.value)}/></label>
   </div>
   {error&&<p role="alert" className="text-xs text-[#A44950]">{error}</p>}
   <div className="flex gap-2"><Button type="submit" size="sm">{ar?"حفظ الهدف":(lang==="fr"?frenchUI("Save goal"):"Save goal")}</Button><Button type="button" size="sm" variant="ghost" onClick={()=>setShow(false)}>{ar?"إلغاء":(lang==="fr"?frenchUI("Cancel"):"Cancel")}</Button></div>
  </form>}
  {goals.length===0?<p className="mt-4 rounded-xl bg-[#F5F7F1] p-3 text-sm text-muted-foreground">{ar?"ما في أهداف مدخلة بعد. ابدأ بهدف واحد بسيط.":(lang==="fr"?frenchUI("No named goals yet. Start with one that matters to your family."):"No named goals yet. Start with one that matters to your family.")}</p>:
   <div className="mt-4 space-y-3">{goals.map(g=>{
    const progress=Math.max(0,Math.min(100,Math.round(g.savedJod/g.targetJod*100)));
    return <article key={g.id} className="rounded-2xl border border-[#DAE5D9] bg-white p-3.5">
     <div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="font-semibold">{g.name}</p>
      <p className="mt-1 text-xs text-muted-foreground">{fmtJOD(g.savedJod)} / {fmtJOD(g.targetJod)} · {progress}%</p>
      {g.monthlyJod>0&&<p className="mt-1 text-xs text-muted-foreground">{ar?"تخصيص شهري: ":(lang==="fr"?frenchUI("Monthly allocation: "):"Monthly allocation: ")}{fmtJOD(g.monthlyJod)}</p>}
      {g.dueDate&&<p className="mt-1 text-xs text-muted-foreground">{ar?"الموعد: ":(lang==="fr"?frenchUI("Target date: "):"Target date: ")}{g.dueDate}</p>}</div>
      <button type="button" aria-label={ar?"حذف الهدف":(lang==="fr"?frenchUI("Delete savings goal"):"Delete savings goal")} onClick={()=>{
       if(window.confirm(ar?"حذف الهدف فقط؟ لن يتغير رصيد البنك أو أي سجلات مصروف.":(lang==="fr"?frenchUI("Delete this goal? Money and existing expense records won't change."):"Delete this goal? Money and existing expense records won't change.")))setState(s=>removeGoal(s,g.id));
      }} className="grid size-10 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-[#FFF1F1]"><Trash2 className="size-4"/></button>
     </div>
     <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#E5EEE4]"><div className="h-full rounded-full bg-[#547967]" style={{width:progress+"%"}}/></div>
     {editingSaved===g.id?<div className="mt-3 flex flex-wrap items-end gap-2">
       <label className="text-xs font-semibold">{ar?"المدّخر فعلياً الآن":(lang==="fr"?frenchUI("Actually saved now"):"Actually saved now")}<Input className="mt-1 w-40" type="number" min="0" max="1000000" step=".01" value={newSaved} onChange={e=>setNewSaved(e.target.value)}/></label>
       <Button size="sm" onClick={()=>editSaved(g.id)}><CheckCircle2 className="size-4"/>{ar?"تأكيد":(lang==="fr"?frenchUI("Confirm"):"Confirm")}</Button>
       <Button size="sm" variant="ghost" onClick={()=>{setEditingSaved(null);setError("");}}>{ar?"إلغاء":(lang==="fr"?frenchUI("Cancel"):"Cancel")}</Button>
       {error&&<p role="alert" className="w-full text-xs text-[#A44950]">{error}</p>}
      </div>:<button type="button" onClick={()=>{setEditingSaved(g.id);setNewSaved(String(g.savedJod));setError("");}} className="mt-3 min-h-10 text-xs font-semibold text-brand underline underline-offset-2">{ar?"حدّث المبلغ المدّخر":(lang==="fr"?frenchUI("Update what I've actually saved"):"Update what I've actually saved")}</button>}
    </article>;
   })}</div>}
  {goals.length>0&&<div className="mt-4 rounded-xl bg-[#F2F6EF] p-3">
    <div className="flex justify-between gap-2 text-sm"><span>{ar?"مخطط توفيره لهذه الأهداف كل شهر":(lang==="fr"?frenchUI("Allocated to these goals each month"):"Allocated to these goals each month")}</span><strong>{fmtJOD(sum)}</strong></div>
    <div className="mt-2 flex justify-between gap-2 text-sm"><span>{ar?"هدف الادخار الشهري الحالي":(lang==="fr"?frenchUI("Your overall monthly savings target"):"Your overall monthly savings target")}</span><strong>{fmtJOD(monthlyTarget)}</strong></div>
    <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{sum>monthlyTarget+.005?(ar?"التخصيص للأهداف أعلى من هدف الادخار الشهري. اختر إمّا زيادة هدف الادخار أو تعديل خطتك، ولا نفترض وجود المال تلقائياً.":(lang==="fr"?frenchUI("Goal allocations exceed your monthly savings target. Decide whether to increase the target or revise your plan. Nothing has changed automatically."):"Goal allocations exceed your monthly savings target. Decide whether to increase the target or revise your plan. Nothing has changed automatically.")):
     (ar?"هذه الأهداف جزء من هدف الادخار الشهري، وليست مصروفاً إضافياً يُخصم مرة ثانية.":(lang==="fr"?frenchUI("Goal allocations are part of your monthly savings target—not an extra expense deducted again."):"Goal allocations are part of your monthly savings target—not an extra expense deducted again."))}</p>
    {sum>monthlyTarget+.005&&sum<=computeMoney(state).monthlyIncome&&
      <Button size="sm" variant="outline" className="mt-3" onClick={()=>{
       if(!window.confirm(ar?"زيادة هدف الادخار الشهري إلى "+fmtJOD(sum)+"؟ سيُعاد حساب ميزانية الشهر، لكن لن يتحرك أي مبلغ نقدي.":"Increase the overall monthly savings target to "+fmtJOD(sum)+"? This will change the budget comparison, not move cash."))return;
       setState(s=>({...s,savingsTargetAmount:Math.round(sum*100)/100}));toast.success(ar?"تم تحديث هدف الادخار الشهري.":(lang==="fr"?frenchUI("Monthly savings target updated."):"Monthly savings target updated."));
      }}>{ar?"ارفع هدف الادخار إلى ":(lang==="fr"?frenchUI("Set monthly target to "):"Set monthly target to ")}{fmtJOD(sum)}</Button>}
   </div>}
 </section>;
}
