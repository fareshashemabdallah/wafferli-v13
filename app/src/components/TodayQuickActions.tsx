import {useState,type ReactNode} from "react";
import {MessageCircle,Receipt} from "lucide-react";
import {useI18n} from "@/lib/i18n";
import {QuickExpenseCard} from "./QuickExpenseCard";

/** Today has just two real, useful actions: record an actual expense or
 * ask for help. Retired shopping prototypes must not write another list. */
export function TodayQuickActions({onAsk,onOtherAction}:{onAsk:()=>void;onOtherAction?:()=>void}){
 const {lang}=useI18n(),ar=lang==="ar";
 const t=(en:string,arabic:string)=>ar?arabic:en;
 const [expenseOpen,setExpenseOpen]=useState(false);
 const action=(label:string,icon:ReactNode,onClick:()=>void,chosen:boolean,color:string)=>
  <button type="button" onClick={onClick} aria-pressed={chosen}
   className="flex min-h-[78px] flex-1 items-center justify-center gap-2 rounded-2xl border border-[#E7E7E5] bg-white px-3 py-3 text-sm font-bold text-[#25354B] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#C974A2]"
   style={chosen?{borderColor:color}:{}}>
   <span aria-hidden="true" style={{color}}>{icon}</span>{label}
  </button>;
 return <section aria-label={t("Quick family actions","خطوات العائلة السريعة")}
  className="rounded-[1.6rem] border border-[#F0E4E9] bg-[#FFFDFD] p-3 sm:p-4">
  <h2 className="text-base font-extrabold text-[#25354B]">{t("Quick actions","خطوات سريعة")}</h2>
  <div className="mt-3 flex flex-wrap gap-2">
   {action(t("Add expense","سجّل مصروف"),<Receipt className="size-5"/>,()=>{
    onOtherAction?.();setExpenseOpen(v=>!v);},expenseOpen,"#389683")}
   {action(t("Ask Dabberna","اسأل دبّرنا"),<MessageCircle className="size-5"/>,()=>{
    setExpenseOpen(false);onAsk();},false,"#8774BE")}
  </div>
  {expenseOpen&&<div className="mt-3" data-testid="fast-expense-panel">
   <QuickExpenseCard onClose={()=>setExpenseOpen(false)}/>
  </div>}
 </section>;
}