import {useState,type ReactNode} from "react";
import {MessageCircle,Receipt} from "lucide-react";
import {useI18n} from "@/lib/i18n";
import {QuickExpenseCard} from "./QuickExpenseCard";

type Action="expense"|null;
/** Today offers only the approved quick expense and Ask journeys.
 * The former standalone shopping basket is retired, not quietly persisted
 * through a shortcut that no longer has an active workspace.
 */
export function TodayQuickActions({onAsk,onOtherAction}:{onAsk:()=>void;onOtherAction?:()=>void}){
 const {lang}=useI18n(),ar=lang==="ar";
 const tr=(en:string,arabic:string)=>ar?arabic:en;
 const [active,setActive]=useState<Action>(null);
 const button=(name:string,icon:ReactNode,action:()=>void,chosen:boolean,theme:string,accessibleName?:string)=>
  <button type="button" onClick={action} aria-pressed={chosen} aria-label={accessibleName??name}
   className="flex min-h-[85px] flex-col items-center justify-center gap-2 rounded-[1.1rem] border border-[#F1E3E8] bg-white px-2 py-3 text-center text-[12px] font-bold leading-snug text-[#25354B] shadow-sm transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C974A2]"
   style={chosen?{borderColor:theme,backgroundColor:"#FFF8FB"}:{}}>
   <span aria-hidden="true" className="grid size-9 place-items-center rounded-2xl" style={{backgroundColor:theme+"20",color:theme}}>{icon}</span>
   {name}
  </button>;
 return <section aria-label={tr("Quick family actions","خطوات العائلة السريعة")}
  className="rounded-[1.6rem] border border-[#F0E4E9] bg-[#FFFDFD] p-3 shadow-[0_12px_34px_-29px_rgba(59,37,69,.2)] sm:p-4">
  <div className="mb-3">
   <h2 className="text-base font-extrabold text-[#25354B]">{tr("What do you need to do?","شو بدك تعمل هلّق؟")}</h2>
   <p className="mt-1 text-xs text-[#748093]">{tr("Two useful actions, without extra pages.","خطوتان مفيدتان بدون صفحات زيادة.")}</p>
  </div>
  <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
   {button(tr("Add expense","سجّل مصروف"),<Receipt className="size-5"/>,()=>{onOtherAction?.();setActive(x=>x==="expense"?null:"expense");},active==="expense","#389683")}
   {button(tr("Ask Dabberna","اسأل دبّرنا"),<MessageCircle className="size-5"/>,()=>{setActive(null);onAsk();},false,"#8774BE",tr("Jump to Ask Dabberna","اذهب لسؤال دبّرنا"))}
  </div>
  {active==="expense"&&<div className="mt-3" data-testid="fast-expense-panel">
   <QuickExpenseCard onClose={()=>setActive(null)}/>
  </div>}
 </section>;
}
