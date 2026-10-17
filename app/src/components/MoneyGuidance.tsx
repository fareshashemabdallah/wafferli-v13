import {Check,Lightbulb,ShieldCheck} from "lucide-react";
import {useState} from "react";
import {toast} from "sonner";
import {fmtJOD} from "@/lib/storage";
import {useI18n} from "@/lib/i18n";
import type {MoneyState} from "@/lib/money";
import {applyAlignmentSuggestion,applyVarianceAllocation,budgetAlignment,varianceOf,type AllocationChoice} from "@/lib/financeAlignment";
import {smartVarianceGuidance} from "@/lib/smartBudgetGuidance";
type Props={state:MoneyState;setState:(fn:(s:MoneyState)=>MoneyState)=>void;scope:"alignment"|"variance"};
const key=(a:AllocationChoice)=>a.kind+":"+(a.categoryId??"");
export function MoneyGuidance({state,setState,scope}:Props){
 const {lang}=useI18n(),ar=lang==="ar";
 const [proposal,setProposal]=useState<string|null>(null);
 const alignment=budgetAlignment(state);
 const ym=new Date().getFullYear()+"-"+String(new Date().getMonth()+1).padStart(2,"0");
 const item=state.expenses.find(e=>e.date.startsWith(ym)&&varianceOf(e)!==0&&!e.varianceDismissed);
 const delta=item?varianceOf(item):0;
 const reasoning=item?smartVarianceGuidance(state,item):null;
 const candidates:AllocationChoice[]=scope==="alignment"?(alignment.status==="balanced"||alignment.status==="incomplete"?[]:[
  ...state.categories.filter(c=>c.type==="variable" && (alignment.gap>0||
   (c.planned+(state.monthlyAdjustments?.[ym]?.categoryDeltas[c.id]??0))+alignment.gap>=Math.max(0,state.expenses.filter(e=>e.status!=="planned"&&e.categoryId===c.id&&e.date.slice(0,7)===new Date().getFullYear()+"-"+String(new Date().getMonth()+1).padStart(2,"0")).reduce((n,e)=>n+e.amount,0)))).map(c=>({kind:"variable" as const,categoryId:c.id})),
  ...(alignment.gap>0||alignment.savings>=-alignment.gap?[{kind:"savings" as const}]:[])
 ]) : reasoning?.ranked??[];
 if(state.demo)return null;
 if(scope==="variance"&&!item)return null;
 // Never propose a cut from unlabeled, essential or family-protected categories.
 // Parents can still edit their own categories deliberately in Spending.
 const reduction=scope==="alignment"?alignment.gap<0:delta>0;
 const choices=candidates.filter(choice=>!reduction||choice.kind==="savings"||
  state.categories.some(c=>c.id===choice.categoryId&&c.priority==="flexible"));
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
 if(scope==="alignment"&&alignment.status==="balanced")return <div className="mt-4 flex items-center gap-2 rounded-xl bg-[#EDF5EA] p-3 text-sm text-[#3F6B50]"><Check className="size-4"/>{ar?"مصاريفك المخططة وأي ادخار اختياري متوازنين مع تقدير الدخل الشهري.":"Your entered spending and any optional savings intention balance with estimated monthly income."}</div>;
 if(scope==="alignment"&&alignment.status==="incomplete")return <p className="mt-4 text-xs text-muted-foreground">{ar?"أدخل تقدير الدخل وفئات المصاريف للمقارنة. الادخار ممكن ينتظر.":"Enter an income estimate and spending categories for a planning comparison. Savings can wait."}</p>;
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
  {scope==="variance"&&reasoning&&<div className="mt-3 rounded-xl border border-[#DBE6DC] bg-white p-3">
    <p className="text-sm font-semibold text-brand">{ar?reasoning.ar:reasoning.en}</p>
    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{ar?reasoning.detailsAr:reasoning.detailsEn}</p>
    <p className="mt-2 text-xs text-[#825F44]">{ar?reasoning.cautionAr:reasoning.cautionEn}</p>
   </div>}
   {scope==="alignment"&&Math.abs(alignment.carryover)>=.005&&<div className="mt-3 rounded-xl bg-white p-3 text-xs leading-relaxed text-muted-foreground">
     {ar?"يتضمّن حساب هذا الشهر فرق المصروف المرحّل من الشهر السابق: ":"This month's calculation includes last month's unmatched difference: "}
     <strong>{alignment.carryover>0?"+":""}{fmtJOD(alignment.carryover)}</strong>.
     {" "}{ar?"أي تعديل هنا يخصّ هذا الشهر فقط.":"Any adjustment made for this carryover applies to this month only."}
   </div>}
  {choices.length>0?<div className="mt-3 space-y-2">
   {choices.map(c=><button key={key(c)} type="button" aria-pressed={proposal===key(c)} onClick={()=>setProposal(proposal===key(c)?null:key(c))}
    className={"flex min-h-11 w-full items-center gap-2 rounded-xl border px-3 py-2 text-start text-sm "+(proposal===key(c)?"border-brand bg-[#E8F1E6] text-brand":"border-border bg-white text-ink")}>
    <span className="flex-1">{label(c)}{scope==="variance"&&reasoning?.ranked[0]&&key(reasoning.ranked[0])===key(c)&&<span className="ms-2 text-[11px] font-semibold text-brand">{ar?"(مقترح)":"(suggested)"}</span>}</span><span className="text-xs font-semibold tabular-nums">{fmtJOD(amount)}</span>
   </button>)}
   {selected&&<div className="flex flex-wrap items-center gap-2 pt-1">
    <button type="button" onClick={submit} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-brand px-4 text-sm font-semibold text-white">
     <Check className="size-4"/>{ar?"أؤكد إعادة التوزيع":"Confirm reallocation"}
    </button>
    <button type="button" onClick={()=>setProposal(null)} className="min-h-11 px-3 text-sm text-muted-foreground">{ar?"إلغاء":"Cancel"}</button>
   </div>}
  </div>:<p className="mt-3 text-xs text-muted-foreground">{ar?"لا يوجد مخصص متاح يكفي لتغطية الفرق تلقائياً. عدّل هدف الادخار أو مخصصات الفئات من الأماكن الحالية.":"No eligible category or savings target can cover the entire difference. Adjust your budgets or goal in the existing Money settings."}</p>}
  {scope==="variance"&&<button type="button" onClick={()=>{setState(old=>({...old,expenses:old.expenses.map(e=>e.id===item!.id?{...e,varianceDismissed:true}:e)}));setProposal(null);}} className="mt-3 min-h-9 text-xs font-medium text-muted-foreground underline underline-offset-2">{ar?"اترك المخصصات كما هي":"Keep budgets unchanged"}</button>}
  <div className="mt-3 flex gap-2 text-xs text-muted-foreground"><ShieldCheck className="size-4 shrink-0"/><p>{ar?"توصيات ذكية قابلة للتفسير مبنية على بياناتك، وليست نموذج ذكاء اصطناعي متصل. لا يتم تحويل أي أموال أو تعديل رصيد البنك. فروقات الدفع تعدّل مخصصات الشهر المعني فقط.":"Intelligent, explainable recommendations based on your figures—not a connected AI model. No money is moved or bank balance changed."}</p></div>
 </section>;
}
