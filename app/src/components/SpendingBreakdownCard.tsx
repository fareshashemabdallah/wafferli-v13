import {useState,type FormEvent} from "react";
import {Link} from "@tanstack/react-router";
import {ArrowRight,Wallet,ShieldCheck} from "lucide-react";
import {fmtJOD} from "@/lib/storage";
import {useI18n} from "@/lib/i18n";
import type {MoneyState} from "@/lib/money";
import {canSplitStarter,spendingBreakdown,splitStarterBudget,type SpendingGroupKind} from "@/lib/spendingBreakdown";

const titles:Record<SpendingGroupKind,{en:string;ar:string;detailEn:string;detailAr:string}>={
 fixed:{en:"Fixed expenses",ar:"المصاريف الثابتة",
  detailEn:"Rent, recurring household costs and other fixed budget categories.",
  detailAr:"الإيجار والتكاليف الثابتة المتكررة حسب الفئات المسجلة."},
 variable:{en:"Variable expenses",ar:"المصاريف المتغيرة",
  detailEn:"Groceries, transport, outings and other flexible categories.",
  detailAr:"الأكل والمواصلات والطلعات والمصاريف اللي بتتغيّر."},
 periodic:{en:"Periodic expenses",ar:"المصاريف الدورية",
  detailEn:"School, insurance and occasional budget items.",
  detailAr:"المدرسة والتأمين والمصاريف اللي ما بتكون كل يوم."},
 unallocated:{en:"Not yet broken down",ar:"مصاريف لسه مش موزّعة",
  detailEn:"Combined spending estimate or expenses without a matching category.",
  detailAr:"تقدير إجمالي ما توزّع على فئات، أو مصروف بلا فئة محدّدة."}
};
const knownNames:Record<string,{en:string;ar:string}>={
 "starter-fixed":{en:"Fixed monthly costs",ar:"المصاريف الثابتة بالشهر"},
 "starter-variable":{en:"Variable everyday costs",ar:"المصاريف المتغيرة اليومية"},
 "starter-periodic":{en:"Occasional costs",ar:"المصاريف غير الشهرية"},
 "household-starter":{en:"Household spending (estimate)",ar:"مصاريف البيت (تقدير إجمالي)"},
 "uncategorized-recorded":{en:"Uncategorized recorded expenses",ar:"مصاريف مسجّلة بدون فئة"}
};
const cents=(s:string):number|null=>{
 if(!/^\d{1,6}(?:\.\d{1,2})?$/.test(s.trim()))return null;
 const n=Number(s);
 return Number.isFinite(n)&&n<=100000?Math.round(n*100):null;
};

function StarterExpenseSplit({state,onChange}:{state:MoneyState;onChange:(value:MoneyState)=>void}){
 const {lang}=useI18n(),ar=lang==="ar";
 const [open,setOpen]=useState(false),[fixed,setFixed]=useState(""),[variable,setVariable]=useState("");
 const [periodic,setPeriodic]=useState("0"),[error,setError]=useState("");
 if(!canSplitStarter(state))return null;
 const total=state.categories[0]!.planned;
 const submit=(event:FormEvent)=>{
  event.preventDefault();setError("");
  const amounts=[cents(fixed),cents(variable),cents(periodic)];
  const target=Math.round(total*100);
  if(amounts.some(n=>n===null)||amounts.reduce<number>((n,v)=>n+(v??0),0)!==target){
   setError(ar?"المجموع لازم يساوي "+fmtJOD(total)+" من خطتك الحالية. ما عم نزيد مصاريف جديدة.":
    "These amounts must add up to your existing "+fmtJOD(total)+" plan. We're not creating extra expenses.");
   return;
  }
  const next=splitStarterBudget(state,{fixed:amounts[0]!/100,variable:amounts[1]!/100,periodic:amounts[2]!/100});
  if(next===state){setError(ar?"ما قدرنا نوزع المبلغ.":"We could not split this amount.");return;}
  onChange(next);setOpen(false);
 };
 return <div className="mt-4 rounded-xl border border-[#D9E5D2] bg-[#F5F9F0] p-4">
  <h3 className="text-sm font-semibold">{ar?"مصاريفك حالياً رقم إجمالي واحد":"Your monthly spending is still one combined estimate"}</h3>
  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{ar?
   "أدخلت "+fmtJOD(total)+" كمجموع شهري. دبّرنا ما بيقدر يعرف منه الإيجار والأكل وغيره. وزّع المبلغ مرة واحدة على ثابت ومتغير ودوري، وبعدها فيك تفصّل كل فئة إذا بتحب.":
   "You entered "+fmtJOD(total)+" as one monthly total. Dabberna can't know how much is rent or groceries. Split it once into fixed, variable and periodic costs, then add detail later only if useful."}</p>
  {!open?<button type="button" onClick={()=>setOpen(true)}
   className="mt-3 min-h-11 rounded-full bg-brand px-4 text-sm font-semibold text-white">
   {ar?"وزّع المبلغ مرة واحدة":"Split my monthly spending once"}
  </button>:<form onSubmit={submit} className="mt-3 grid gap-3 rounded-xl bg-white p-3 sm:grid-cols-2">
   {([
    {id:"fixed",label:ar?"ثابتة (إيجار، فواتير)":"Fixed costs (rent, bills)",v:fixed,set:setFixed},
    {id:"variable",label:ar?"متغيرة (أكل، نقل، طلعات)":"Variable costs (groceries, transport)",v:variable,set:setVariable},
    {id:"periodic",label:ar?"دورية (مدرسة، تأمين)":"Periodic costs (school, insurance)",v:periodic,set:setPeriodic}
   ] as const).map(x=><label key={x.id} className="text-xs font-semibold">
    {x.label} · JOD
    <input type="number" min="0" max="100000" step=".01" required
     value={x.v} onChange={event=>{x.set(event.target.value);setError("");}}
     className="mt-1 min-h-11 w-full rounded-lg border border-input bg-white px-3 text-sm"/>
   </label>)}
   <div className="flex flex-wrap items-end gap-2 sm:col-span-2">
    <button type="submit" className="min-h-11 rounded-full bg-brand px-4 text-sm font-semibold text-white">
     {ar?"احفظ التقسيم واعرض التفاصيل":"Save and show my breakdown"}
    </button>
    <button type="button" onClick={()=>{setOpen(false);setError("");}}
     className="min-h-11 px-3 text-sm font-semibold text-brand underline">{ar?"ليس الآن":"Not now"}</button>
   </div>
   {error&&<p role="alert" className="text-xs font-semibold text-destructive sm:col-span-2">{error}</p>}
  </form>}
 </div>;
}
export function SpendingBreakdownCard({
 state,compact=false,onEdit,onChange
}:{state:MoneyState;compact?:boolean;onEdit?:()=>void;onChange?:(v:MoneyState)=>void}){
 const {lang,tr}=useI18n(),ar=lang==="ar";
 const view=spendingBreakdown(state);
 const groups=view.groups.filter(g=>g.lines.length>0);
 return <section aria-label={ar?"تفاصيل المصاريف الثابتة والمتغيرة":"Fixed and variable spending breakdown"}
  className="rounded-2xl border border-[#DDE7DB] bg-white p-4 sm:p-5">
  <div className="flex items-start gap-3">
   <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#EAF3E7] text-brand"><Wallet className="size-5"/></span>
   <div className="min-w-0 flex-1">
    <p className="text-xs font-semibold tracking-wide text-brand">{ar?"صورة الشهر حسب الفئة":"YOUR MONTHLY SPENDING PLAN"}</p>
    <h2 className="mt-1 text-lg font-semibold">{ar?"وين عم تروح مصاريف بيتك؟":"Where does your household budget go?"}</h2>
    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{ar?
     "شوف المخصص الشهري مقابل المصروف اللي سجلته، مش مجرد رقم واحد.":
     "See the monthly plan beside what you actually recorded, not just one total."}</p>
   </div>
  </div>
  {state.demo&&<p className="mt-3 rounded-xl bg-[#FFF4E4] p-3 text-sm font-semibold text-[#8B633D]">
   {ar?"مثال فقط، هاي مش مصاريف عيلتك.":"Sample finances only—these are not your household costs."}
  </p>}
  <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
   <div className="rounded-xl bg-[#F0F5EE] p-3">
    <p className="text-xs text-muted-foreground">{ar?"مخطط للشهر":"Monthly plan"}</p>
    <p className="mt-1 text-lg font-semibold tabular-nums">{fmtJOD(view.plannedJod)}</p>
   </div>
   <div className="rounded-xl bg-[#F8F2EA] p-3">
    <p className="text-xs text-muted-foreground">{ar?"مصروف مسجّل":"Recorded spent"}</p>
    <p className="mt-1 text-lg font-semibold tabular-nums">{fmtJOD(view.recordedJod)}</p>
   </div>
   <div className="col-span-2 rounded-xl bg-[#F3F4F6] p-3 sm:col-span-1">
    <p className="text-xs text-muted-foreground">{ar?"فرق الخطة والمصروف المسجّل":"Plan minus recorded spend"}</p>
    <p className={"mt-1 text-lg font-semibold tabular-nums "+(view.remainingJod<0?"text-[#A24E43]":"text-ink")}>
     {fmtJOD(view.remainingJod)}
    </p>
   </div>
  </div>
  <div className="mt-4 space-y-3">
   {groups.map(group=>{
    const title=titles[group.kind],limited=compact&&group.lines.length>2;
    return <div key={group.kind} className="rounded-xl border border-[#E2E9DE] bg-[#FAFCF9] p-3">
     <div className="flex flex-wrap items-start justify-between gap-2">
      <div><h3 className="font-semibold">{ar?title.ar:title.en}</h3>
       {!compact&&<p className="mt-1 text-xs text-muted-foreground">{ar?title.detailAr:title.detailEn}</p>}
      </div>
      <strong className="text-sm tabular-nums">{fmtJOD(group.plannedJod)}</strong>
     </div>
     <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
      <span>{ar?"سجّلت: ":"Recorded: "}<strong className="text-ink">{fmtJOD(group.recordedJod)}</strong></span>
      <span>{group.remainingJod<0?(ar?"فوق المخصص: ":"Over plan: "):(ar?"غير مسجّل كمصروف: ":"Not recorded as spent: ")}
       <strong className={group.remainingJod<0?"text-[#A24E43]":"text-ink"}>{fmtJOD(Math.abs(group.remainingJod))}</strong>
      </span>
     </div>
     <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#E5ECE3]"
      role="progressbar" aria-label={(ar?title.ar:title.en)+" recorded spending"}
      aria-valuemin={0} aria-valuemax={100}
      aria-valuenow={Math.min(100,group.plannedJod>0?Math.round(group.recordedJod/group.plannedJod*100):group.recordedJod>0?100:0)}>
      <div className={"h-full "+(group.remainingJod<0?"bg-[#AF6853]":"bg-[#5D906A]")}
       style={{width:Math.max(0,Math.min(100,group.plannedJod>0?group.recordedJod/group.plannedJod*100:group.recordedJod>0?100:0))+"%"}}/>
     </div>
     {group.lines.length>0&&<div className="mt-3 divide-y divide-[#E5EBE2]">
      {(limited?group.lines.slice(0,2):group.lines).map(line=>
       <div key={line.id} className="flex items-start justify-between gap-3 py-2 text-sm">
        <div className="min-w-0 flex-1">
         <p className="font-medium">{knownNames[line.id]?(ar?knownNames[line.id]!.ar:knownNames[line.id]!.en):tr(line.name)}</p>
         <p className="mt-0.5 text-xs text-muted-foreground">{ar?"مصروف مسجّل: ":"Recorded: "}{fmtJOD(line.recordedJod)}</p>
        </div>
        <div className="shrink-0 text-end"><p className="font-semibold tabular-nums">{fmtJOD(line.plannedJod)}</p>
         <p className={"text-xs tabular-nums "+(line.remainingJod<0?"text-[#A24E43]":"text-muted-foreground")}>
          {line.remainingJod<0?(ar?"زيادة ":"Over "):(ar?"الفرق ":"Gap ")}{fmtJOD(Math.abs(line.remainingJod))}
         </p>
        </div>
       </div>)}
      {limited&&<p className="py-2 text-xs text-muted-foreground">{ar?"فئات إضافية: ":"More categories: "}{group.lines.length-2}</p>}
     </div>}
    </div>;
   })}
   {groups.length===0&&<p className="text-sm text-muted-foreground">{ar?
    "بعد ما تدخل خطة المصاريف، بنفرجيك الفئات هون.":
    "Your fixed, variable and periodic categories will appear here once saved."}</p>}
  </div>
  {onChange&&canSplitStarter(state)&&<StarterExpenseSplit state={state} onChange={onChange}/>}
  <div className="mt-4 flex flex-wrap gap-3">
   {onEdit&&<button type="button" onClick={onEdit}
    className="inline-flex min-h-11 items-center gap-2 rounded-full bg-brand px-4 text-sm font-semibold text-white">
    {ar?"راجع أو عدّل فئات مصاريفك":"Review or edit expense categories"}<ArrowRight className="size-4 rtl:rotate-180"/>
   </button>}
   {compact&&<Link to="/money" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-brand underline">
    {ar?"اعرض كل التفاصيل وعدّل الفئات":"See full breakdown & categories"}<ArrowRight className="size-4 rtl:rotate-180"/>
   </Link>}
  </div>
  <p className="mt-3 flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
   <ShieldCheck className="mt-0.5 size-4 shrink-0"/>
   {ar?"الفرق بين المخطط والمسجل مش رصيد بنك ولا توفير مؤكد. ممكن تكون دفعت مصاريف ما سجلتها بعد. الفواتير المقررة تظهر بصفحة الفواتير لحد ما تأكد دفعها.":
    "The gap between planned and recorded isn't bank cash or confirmed savings. You may have paid costs you haven't recorded. Scheduled bills remain separate until their payments are confirmed."}
  </p>
 </section>;
}
