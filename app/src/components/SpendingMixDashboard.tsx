import {frenchUI} from "@/lib/french";
import {Heart,LockKeyhole,ShoppingBasket,Wallet} from "lucide-react";
import type {MoneyState} from "@/lib/money";
import {useI18n} from "@/lib/i18n";
import {localToday} from "@/lib/cashflow";
import {fmtJOD} from "@/lib/storage";
import {spendingMixSummary} from "@/lib/spendingMixSummary";

type Props={state:MoneyState;onOpenCategory:(id:string)=>void};
const palette={
 committed:{color:"#3A8062",en:"Committed",ar:"التزامات",
  explanation:"Payments to honor",arExplanation:"دفعات يلزم الوفاء بها",icon:LockKeyhole},
 necessary:{color:"#89B7A1",en:"Necessary, variable",ar:"ضرورية ومتغيرة",
  explanation:"Needed living costs",arExplanation:"مصاريف معيشية ضرورية",icon:ShoppingBasket},
 flexible:{color:"#E9B77D",en:"Flexible choices",ar:"خيارات مرنة",
  explanation:"Adjustable, not necessarily expendable",arExplanation:"قابلة للتعديل وليست بالضرورة للاستغناء",icon:Heart},
 cushion:{color:"#B9C3CE",en:"Budget cushions",ar:"هوامش الميزانية",
  explanation:"Room within existing categories",arExplanation:"مساحة ضمن مخصصات الفئات",icon:Wallet},
 unclassified:{color:"#D6C9B2",en:"Not yet classified",ar:"غير مصنفة بعد",
  explanation:"Categories without detailed lines",arExplanation:"فئات لم تُفصّل بعد",icon:Wallet}
} as const;
const segmentKeys=["committed","necessary","flexible","cushion","unclassified"] as const;

export function SpendingMixDashboard({state}:Props){
 const {lang}=useI18n(),ar=lang==="ar",t=(en:string,a:string)=>ar?a:lang==="fr"?frenchUI(en):en;
 const mix=spendingMixSummary(state,localToday().slice(0,7));
 const money=(v:number)=>fmtJOD(v);
 const hasPlan=state.categories.length>0&&mix.totalPlanned>0;
 const extra=mix.unclassified>0;
 return <section data-testid="money-spending-mix" aria-label={t("Your family's spending mix","توزيع مصاريف العيلة")}
  className="rounded-2xl border border-[#DFE9DC] bg-white p-3 sm:p-4">
  <div className="flex flex-wrap items-start justify-between gap-2">
   <div>
    <h3 className="text-sm font-black text-[#315C45]">{t("Your family's spending mix","توزيع مصاريف العيلة")}</h3>
    <p className="mt-1 text-[11px] text-[#758579]">{t("Where you have commitments and where you have choices","وين عندك التزامات ووين عندك خيارات")}</p>
   </div>
   <div className="text-end">
    <strong className="block text-sm font-black tabular-nums text-[#32684C]">{hasPlan?money(mix.totalPlanned):t("Not entered","غير مدخل")}</strong>
    <span className="text-[10px] text-[#829084]">{t("Same monthly spending plan","نفس خطة مصروف الشهر")}</span>
   </div>
  </div>
  {hasPlan?<div className="mt-3" role="img" aria-label={
    t("Spending mix: ","توزيع المصاريف: ")+mix.segments.filter(s=>s.amount>0).map(s=>
     t(palette[s.id].en,palette[s.id].ar)+" "+money(s.amount)).join(", ")
    }>
    <div className="flex h-3.5 w-full overflow-hidden rounded-full bg-[#EEF1ED]" data-testid="money-spending-mix-bar">
     {mix.segments.filter(s=>s.amount>0).map(s=><div key={s.id}
      data-testid={"mix-segment-"+s.id}
      style={{width:(mix.positiveBase>0?s.amount/mix.positiveBase*100:0)+"%",background:palette[s.id].color}}
      className="h-full min-w-0 border-r border-white/70 last:border-r-0"/>)}
    </div>
   </div>:<div className="mt-3 h-3.5 rounded-full bg-[#EDF1EC]"/>}
  <div className="mt-3 flex flex-wrap gap-2" data-testid="spending-mix-stats">
   {segmentKeys.filter(key=>key!=="unclassified"||extra).map(key=>{
    const detail=palette[key],Icon=detail.icon;
    const amount=key==="cushion"?mix.cushion:key==="unclassified"?mix.unclassified:mix[key];
    return <div key={key} className="flex min-w-[120px] flex-1 items-center gap-2 rounded-xl border border-[#E8ECE5] bg-[#FAFCF9] px-2.5 py-2 text-start"
     data-testid={"mix-stat-"+key}>
     <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-white" aria-hidden="true"><Icon className="size-4" style={{color:detail.color}}/></span>
     <span className="min-w-0">
      <span className="block text-[11px] font-bold leading-tight text-[#425E4B]">{t(detail.en,detail.ar)}</span>
      <strong className="block break-words text-xs font-bold tabular-nums text-[#32664B]">{money(amount)}</strong>
     </span>
    </div>;
   })}
  </div>
  {mix.unclassified>0&&<p className="mt-3 text-xs text-[#8A7250]" data-testid="mix-insight">
   {t(money(mix.unclassified)+" has not been classified yet. Edit the relevant category when ready.",
      money(mix.unclassified)+" لم يصنّف بعد. يمكنك تعديله من الفئة المعنية.")}
  </p>}
  {mix.adjustment!==0&&<p className="mt-2 text-xs text-[#6D846E]" data-testid="mix-adjustment">
   {t("This month's confirmed budget adjustment: ","تعديل ميزانية هذا الشهر: ")}{money(mix.adjustment)}
  </p>}
 </section>;
}
