import {frenchUI} from "@/lib/french";
import {useI18n} from "@/lib/i18n";
import type {MoneyState} from "@/lib/money";
import type {FamilyPlan} from "@/lib/familyPlans";
import {assessFinancialReality} from "@/lib/financialReality";
import {AlertCircle,HeartHandshake} from "lucide-react";

const choices=[
 {id:"children",en:"Children's activities",ar:"أنشطة الأطفال"},
 {id:"education",en:"Education",ar:"التعليم"},
 {id:"family-time",en:"Family outings and time together",ar:"الطلعات والوقت مع العيلة"},
 {id:"health",en:"Health and well-being",ar:"الصحة والراحة"},
 {id:"travel",en:"Travel and holidays",ar:"السفر والعطلات"},
 {id:"buffer",en:"A comfortable safety buffer",ar:"هامش أمان مالي"}
] as const;
export function FinancialRealityPanel({money,plans=[],update,compact=false,goTo}:{
 money:MoneyState;plans?:readonly FamilyPlan[];
 update?:(fn:(m:MoneyState)=>MoneyState)=>void;compact?:boolean;goTo?:(tab:"overview"|"spending"|"planning")=>void;
}){
 const {lang}=useI18n(),ar=lang==="ar";
 if(money.demo)return null;
 const r=assessFinancialReality(money,plans);
 const caution=r.kind==="essentials-gap"||r.kind==="plan-gap"||r.kind==="tight";
 const protectedChoices=choices.filter(c=>money.protectedLifestyle?.includes(c.id));
 return <section className={"rounded-2xl border p-4 "+(caution?"border-[#EACFBC] bg-[#FFF9F4]":"border-[#D8E5DA] bg-[#F8FAF7]")}
  aria-label={ar?"الواقع المالي للعائلة":(lang==="fr"?frenchUI("Family financial reality"):"Family financial reality")}>
  <div className="flex items-start gap-2">
   {caution?<AlertCircle className="mt-0.5 size-5 shrink-0 text-[#A37154]"/>:<HeartHandshake className="mt-0.5 size-5 shrink-0 text-[#477E68]"/>}
   <div>
    <h2 className="text-sm font-extrabold">{ar?r.titleAr:r.titleEn}</h2>
    <p className="mt-2 text-sm leading-relaxed text-[#596878]">{ar?r.messageAr:r.messageEn}</p>
    {protectedChoices.length>0&&<p className="mt-2 text-xs font-medium text-[#507865]">{ar?"الأولويات التي اخترتها: ":(lang==="fr"?frenchUI("Priorities you want to protect: "):"Priorities you want to protect: ")}
     {protectedChoices.map(c=>ar?c.ar:(lang==="fr"?frenchUI(c.en):c.en)).join(" · ")}.
     {ar?" إذا فئة صرف معيّنة بتدعمها، صنّفها «مهمة للعيلة» حتى ما نقترح تخفيضها.":(lang==="fr"?frenchUI(" If a spending category supports these priorities, mark it Protected in Spending so it won't be suggested for cuts."):" If a spending category supports these priorities, mark it Protected in Spending so it won't be suggested for cuts.")}</p>}
    <p className="mt-2 text-[11px] text-muted-foreground">{r.confidence==="reviewed"?
     (ar?"حسب المبالغ التي أكّدتها؛ ليست بيانات بنكية.":(lang==="fr"?frenchUI("Based on parent-reviewed amounts, not bank-verified data."):"Based on parent-reviewed amounts, not bank-verified data.")):
     (ar?"حسب التقديرات المحفوظة؛ وقد تكون هناك مصاريف ناقصة.":(lang==="fr"?frenchUI("Based on saved estimates; unrecorded costs may change the result."):"Based on saved estimates; unrecorded costs may change the result."))}</p>
   </div>
  </div>
  {!compact&&<div className="mt-3">
   {goTo&&<button type="button" onClick={()=>goTo(r.kind==="tight"?"planning":"spending")}
     className="inline-flex min-h-10 items-center text-xs font-bold text-brand underline">
     {ar?r.actionAr:r.actionEn}
   </button>}
   {update&&<details className="mt-2 border-t border-[#D8E5DA] pt-3">
    <summary className="cursor-pointer text-xs font-semibold text-brand">{ar?"شو الأشياء اللي بتحب تحافظ عليها من نمط حياة العيلة؟ (اختياري)":(lang==="fr"?frenchUI("What matters most to protect in family life? (optional)"):"What matters most to protect in family life? (optional)")}</summary>
    <p className="mt-2 text-xs text-muted-foreground">{ar?"اختَر ما يهمّك، أو اتركه لوقت لاحق. هذا يساعد دبّرنا ما يقترح تضحيات غير مناسبة.":(lang==="fr"?frenchUI("Choose what matters or skip. We won't suggest sacrificing these priorities simply because they appear flexible."):"Choose what matters or skip. We won't suggest sacrificing these priorities simply because they appear flexible.")}</p>
    <div className="mt-3 grid gap-2 sm:grid-cols-2">
     {choices.map(c=><label key={c.id} className="flex min-h-10 items-center gap-2 rounded-xl bg-white p-2 text-xs">
      <input type="checkbox" checked={money.protectedLifestyle?.includes(c.id)??false}
       onChange={e=>update(m=>{
        const set=new Set(m.protectedLifestyle??[]);
        if(e.target.checked)set.add(c.id);else set.delete(c.id);
        return {...m,protectedLifestyle:[...set]};
       })}/>
      {ar?c.ar:(lang==="fr"?frenchUI(c.en):c.en)}
     </label>)}
    </div>
   </details>}
  </div>}
 </section>;
}
