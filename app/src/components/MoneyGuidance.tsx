import {Check,Lightbulb,ShieldCheck} from "lucide-react";
import {useState} from "react";
import {toast} from "sonner";
import {fmtJOD} from "@/lib/storage";
import {useI18n} from "@/lib/i18n";
import type {MoneyState} from "@/lib/money";
import {allocationOptions,applyAlignmentSuggestion,applyVarianceAllocation,budgetAlignment,varianceOf,type AllocationChoice} from "@/lib/financeAlignment";
type Props={state:MoneyState;setState:(fn:(s:MoneyState)=>MoneyState)=>void;scope:"alignment"|"variance"};
const key=(a:AllocationChoice)=>a.kind+":"+(a.categoryId??"");
export function MoneyGuidance({state,setState,scope}:Props){
 const {lang}=useI18n(),ar=lang==="ar";
 const [proposal,setProposal]=useState<string|null>(null);
 const [reviewed,setReviewed]=useState<string[]>([]);
 const alignment=budgetAlignment(state);
 const item=state.expenses.find(e=>varianceOf(e)!==0&&!reviewed.includes(e.id));
 const delta=item?varianceOf(item):0;
 const choices:AllocationChoice[]=scope==="alignment"?(alignment.status==="balanced"||alignment.status==="incomplete"?[]:[
  ...state.categories.filter(c=>c.type==="variable" && (alignment.gap>0||
   c.planned+alignment.gap>=Math.max(0,state.expenses.filter(e=>e.status!=="planned"&&e.categoryId===c.id&&e.date.slice(0,7)===new Date().getFullYear()+"-"+String(new Date().getMonth()+1).padStart(2,"0")).reduce((n,e)=>n+e.amount,0)))).map(c=>({kind:"variable" as const,categoryId:c.id})),
  ...(alignment.gap>0||alignment.savings>=-alignment.gap?[{kind:"savings" as const}]:[])
 ]) : item?allocationOptions(state,delta,item.categoryId):[];
 if(state.demo)return null;
 if(scope==="variance"&&!item)return null;
 const selected=choices.find(c=>key(c)===proposal);
 const dir=scope==="alignment"?Math.sign(alignment.gap):Math.sign(delta);
 const amount=scope==="alignment"?Math.abs(alignment.gap):Math.abs(delta);
 const label=(c:AllocationChoice)=>{
  const category=state.categories.find(x=>x.id===c.categoryId)?.name??"";
  if(scope==="alignment"){
   return c.kind==="savings"?(dir<0?(ar?"خفّض هدف الادخار":"Reduce savings target"):(ar?"زد هدف الادخار":"Increase savings target")):
    (dir<0?(ar?"خفّض مخصص ":"Reduce "):(ar?"زد مخصص ":"Increase "))+category;
  }
  return c.kind==="savings"?(dir>0?(ar?"غطِّ الفرق من هدف الادخار":"Cover difference from savings target"):(ar?"أضف الوفر لهدف الادخار":"Add the saving to savings target")):
   (dir>0?(ar?"غطِّ الفرق من ":"Cover difference from "):(ar?"حوّل الوفر إلى ":"Move the saving to "))+category;
 };
 const submit=()=>{
  if(!selected)return;
  const proposed=scope==="alignment"?applyAlignmentSuggestion(state,selected):applyVarianceAllocation(state,item!.id,selected,new Date().toISOString());
  if(proposed===state){toast.error(ar?"تعذّر التعديل. راجع المخصصات أولاً.":"Cannot apply that adjustment; review the budgets first.");return;}
  setState(()=>proposed);
  setProposal(null);
  toast.success(ar?"تم تأكيد تعديل الميزانية.":"Budget reallocation confirmed.");
 };
 if(scope==="alignment"&&alignment.status==="balanced")return <div className="mt-4 flex items-center gap-2 rounded-xl bg-[#EDF5EA] p-3 text-sm text-[#3F6B50]"><Check className="size-4"/>{ar?"مخطط المصروف والادخار متوافق مع الدخل الشهري المُدخل.":"Your category budgets and savings goal match entered monthly income."}</div>;
 if(scope==="alignment"&&alignment.status==="incomplete")return <p className="mt-4 text-xs text-muted-foreground">{ar?"أدخل الدخل وهدف الادخار وفئات المصروف لتظهر المقارنة والاقتراحات.":"Enter income, a savings goal and spending-category budgets to see recommendations."}</p>;
 const title=scope==="alignment"?(dir<0?(ar?"الخطة أعلى من الدخل":"The plan exceeds income"):(ar?"هناك مبلغ لم توزّعه بعد":"Some income is not yet allocated")):
  delta>0?(ar?"المبلغ المدفوع أعلى من المتوقع":"Actual payment exceeded the plan"):(ar?"دفعت أقل من المتوقع":"You spent less than planned");
 return <section className="mt-4 rounded-2xl border border-[#DFE7D9] bg-[#F7F9F3] p-4" aria-label={ar?"اقتراح توزيع الميزانية":"Budget suggestion"}>
  <div className="flex items-start gap-2">
   <Lightbulb className="mt-0.5 size-5 shrink-0 text-brand"/>
   <div className="min-w-0 flex-1">
    <h3 className="text-sm font-semibold text-ink">{title}</h3>
    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
      {scope==="variance"&&item?<>{item.note||state.categories.find(c=>c.id===item.categoryId)?.name} · {ar?"المتوقع ":"Planned "}{fmtJOD(item.plannedAmount??0)} · {ar?"المدفوع ":"Paid "}{fmtJOD(item.amount)}. </>:null}
      {ar?"الفرق: ":"Difference: "}<strong>{fmtJOD(amount)}</strong>.
      {" "}{ar?"يمكنك اختيار تعديل في مخصصاتك؛ لن يتغير شيء دون تأكيدك.":"Choose how to adjust the plan. No budget will change without your confirmation."}
    </p>
   </div>
  </div>
  {choices.length>0?<div className="mt-3 space-y-2">
   {choices.map(c=><button key={key(c)} type="button" aria-pressed={proposal===key(c)} onClick={()=>setProposal(proposal===key(c)?null:key(c))}
    className={"flex min-h-11 w-full items-center gap-2 rounded-xl border px-3 py-2 text-start text-sm "+(proposal===key(c)?"border-brand bg-[#E8F1E6] text-brand":"border-border bg-white text-ink")}>
    <span className="flex-1">{label(c)}</span><span className="text-xs font-semibold tabular-nums">{fmtJOD(amount)}</span>
   </button>)}
   {selected&&<div className="flex flex-wrap items-center gap-2 pt-1">
    <button type="button" onClick={submit} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-brand px-4 text-sm font-semibold text-white">
     <Check className="size-4"/>{ar?"أؤكد إعادة التوزيع":"Confirm reallocation"}
    </button>
    <button type="button" onClick={()=>setProposal(null)} className="min-h-11 px-3 text-sm text-muted-foreground">{ar?"إلغاء":"Cancel"}</button>
   </div>}
  </div>:<p className="mt-3 text-xs text-muted-foreground">{ar?"لا يوجد مخصص متاح يكفي لتغطية الفرق تلقائياً. عدّل هدف الادخار أو مخصصات الفئات من الأماكن الحالية.":"No eligible category or savings target can cover the entire difference. Adjust your budgets or goal in the existing Money settings."}</p>}
  {scope==="variance"&&<button type="button" onClick={()=>{setReviewed(xs=>[...xs,item!.id]);setProposal(null);}} className="mt-3 min-h-9 text-xs font-medium text-muted-foreground underline underline-offset-2">{ar?"اترك المخصصات كما هي":"Keep budgets unchanged"}</button>}
  <div className="mt-3 flex gap-2 text-xs text-muted-foreground"><ShieldCheck className="size-4 shrink-0"/><p>{ar?"الاقتراح مبني على أرقامك المدخلة، لا يحوّل مالاً بين الحسابات ولا يغيّر رصيد البنك.":"Rule-based guidance using your entries. It moves no money and never changes your bank balance."}</p></div>
 </section>;
}
