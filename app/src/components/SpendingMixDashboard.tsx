import {ChevronDown,ChevronRight,Heart,LockKeyhole,ShoppingBasket,Wallet} from "lucide-react";
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
type SegmentKey=keyof typeof palette;
const segmentKeys=["committed","necessary","flexible","cushion","unclassified"] as const;

export function SpendingMixDashboard({state,onOpenCategory}:Props){
 const {lang}=useI18n(),ar=lang==="ar",t=(en:string,a:string)=>ar?a:en;
 const mix=spendingMixSummary(state,localToday().slice(0,7));
 const money=(v:number)=>fmtJOD(v);
 const hasPlan=state.categories.length>0&&mix.totalPlanned>0;
 const extra=mix.unclassified>0;
 const navigate=(key:SegmentKey)=>{
  document.getElementById(key==="cushion"||key==="unclassified"?"money-spending-cushions":"spending-group-"+key)
   ?.scrollIntoView?.({behavior:"smooth",block:"start"});
 };
 const dynamicMessage=!hasPlan?t(
  "Add your usual monthly category amounts to see your spending mix.",
  "أضف مخصصات الفئات الشهرية المعتادة حتى تشوف توزيع المصاريف.") :
  extra?t(
   money(mix.unclassified)+" of your monthly plan is not classified yet. Your category cushions are separate, not missing expenses.",
   "من خطة الشهر "+money(mix.unclassified)+" غير مصنّفة بعد. هوامش الميزانية منفصلة وليست مصاريف ناقصة.") :
  mix.suggestedCount>0?t(
   "Some older expense lines have suggested classifications. Confirm them when editing those lines; no amount is counted twice.",
   "بعض البنود القديمة مصنّفة بشكل مقترح. أكّدها عند تعديل البنود، دون احتساب أي مبلغ مرتين.") :
  mix.classified>0&&(mix.committed+mix.necessary)/mix.classified>=0.75?t(
   "Most of your classified spending is committed or necessary. Review flexible choices before adding new plans, while respecting family priorities.",
   "معظم المصاريف المصنّفة التزامات أو ضروريات. راجع الخيارات المرنة قبل إضافة خطط جديدة مع احترام أولويات العيلة.") :
  mix.flexible>0?t(
   "Your flexible spending can be adjusted around family priorities. Protected activities are not automatically savings opportunities.",
   "يمكن تعديل المصاريف المرنة حسب أولويات العيلة. الأنشطة المحمية ليست فرصة توفير تلقائية.") :
  t("Your spending mix is grouped by the financial nature of saved costs—not by duplicate budgets.",
    "توزيع المصاريف حسب طبيعة التكاليف المحفوظة، دون تكرار الميزانية.");
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
  <div className="mt-3 grid grid-cols-2 gap-2" data-testid="spending-mix-stats">
   {segmentKeys.filter(key=>key!=="unclassified"||extra).map(key=>{
    const detail=palette[key],Icon=detail.icon;
    const amount=key==="cushion"?mix.cushion:key==="unclassified"?mix.unclassified:mix[key];
    return <button key={key} type="button" onClick={()=>navigate(key)}
     aria-label={t("Explore ","تفاصيل ")+t(detail.en,detail.ar)+" · "+money(amount)}
     className="flex min-h-[76px] items-start gap-2 rounded-xl border border-[#E8ECE5] bg-[#FAFCF9] p-2.5 text-start hover:border-[#A9CDB4] focus-visible:ring-2 focus-visible:ring-[#77A991]"
     data-testid={"mix-stat-"+key}>
     <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-white" aria-hidden="true"><Icon className="size-4" style={{color:detail.color}}/></span>
     <span className="min-w-0">
      <span className="block text-[11px] font-bold leading-tight text-[#425E4B]">{t(detail.en,detail.ar)}</span>
      <strong className="mt-1 block break-words text-sm tabular-nums text-[#32664B]">{money(amount)}</strong>
      <span className="mt-0.5 block text-[10px] leading-snug text-[#7B897D]">{t(detail.explanation,detail.arExplanation)}</span>
     </span>
    </button>;
   })}
  </div>
  {mix.adjustment!==0&&<p className="mt-2 text-[11px] text-[#8D774E]" data-testid="mix-adjustment">
   {t("Confirmed monthly category adjustment: ","تعديل مخصصات الشهر المؤكد: ")}{money(mix.adjustment)}.
   {" "}{t("The bar shows amounts before this adjustment; the displayed total includes it.",
     "الشريط يوضح المبالغ قبل التعديل، والإجمالي المعروض يشمل التعديل.")}
  </p>}
  {mix.positiveBase>0&&<p className="mt-2 text-[10px] text-[#8A978B]">
   {t("Budget cushions are unspent allowances, not new expenses or unpaid bills.",
     "هوامش الميزانية مخصصات لم تُصرف، وليست مصاريف جديدة أو فواتير مستحقة.")}
  </p>}
  <p className="mt-3 text-xs leading-relaxed text-[#577363]" data-testid="mix-insight">{dynamicMessage}</p>
  <details className="group mt-3 border-t border-[#EBF0EA] pt-2" data-testid="money-mix-details">
   <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 text-xs font-extrabold text-[#3F8060]">
    <span>{t("Explore spending mix","استعرض توزيع المصاريف")}</span>
    <ChevronDown className="size-4 transition-transform group-open:rotate-180"/>
   </summary>
   <div className="max-h-80 space-y-3 overflow-y-auto pb-2 pt-1" data-testid="mix-expanded-lines">
    {mix.groups.map(group=><div key={group.role} className="rounded-xl border border-[#E5ECE4] p-3">
     <div className="flex items-center justify-between gap-2">
      <strong className="text-xs text-[#365D45]">{t(palette[group.role].en,palette[group.role].ar)}</strong>
      <span className="text-xs tabular-nums text-[#558164]">{money(group.planned)}</span>
     </div>
     {group.lines.length?<div className="mt-2 space-y-1">
      {group.lines.map(line=><button type="button" key={line.itemId}
       onClick={()=>onOpenCategory(line.categoryId)}
       className="flex min-h-10 w-full items-center justify-between gap-2 rounded-lg bg-[#F7FAF5] px-2 py-1.5 text-start text-[11px] text-[#54725D] hover:bg-[#EAF4E8]">
       <span className="min-w-0"><span className="block font-bold">{line.categoryName} · {line.isRemainder?t("General costs","مصاريف عامة"):line.name}</span>
        {line.needsReview&&<span className="block text-[10px] text-[#9A7448]">{t("Suggested · confirm classification","تصنيف مقترح · بحاجة لتأكيد")}</span>}
        {line.priority==="protected"&&<span className="block text-[10px] text-[#44785B]">{t("Protected priority","أولوية محمية")}</span>}</span>
       <span className="flex shrink-0 items-center gap-1 font-semibold tabular-nums">{money(line.planned)}<ChevronRight className="size-3"/></span>
      </button>)}
     </div>:<p className="mt-2 text-[11px] text-[#879586]">{t("No classified lines yet","ما في بنود مصنّفة بعد")}</p>}
    </div>)}
    {mix.unassigned.length>0&&<div className="rounded-xl border border-[#E5ECE4] p-3">
     <strong className="text-xs text-[#365D45]">{t("Cushions & amounts awaiting classification","هوامش ومبالغ بحاجة لتصنيف")}</strong>
     <div className="mt-2 space-y-1">
      {mix.unassigned.map(row=><button key={row.categoryId} type="button" onClick={()=>onOpenCategory(row.categoryId)}
       className="flex min-h-10 w-full items-center justify-between gap-2 rounded-lg bg-[#F7FAF5] p-2 text-start text-[11px] text-[#54725D] hover:bg-[#EAF4E8]">
       <span>{row.name} · {t(row.kind==="cushion"?"Cushion":row.kind==="adjustment"?"Monthly adjustment":"Needs classification",
        row.kind==="cushion"?"هامش":row.kind==="adjustment"?"تعديل الشهر":"بحاجة لتصنيف")}</span>
       <span className="flex shrink-0 items-center gap-1 font-semibold tabular-nums">{money(row.planned)}<ChevronRight className="size-3"/></span>
      </button>)}
     </div>
    </div>}
    <p className="text-[11px] leading-relaxed text-[#819083]">{t(
     "Select a line to open its existing category and payments; this is not a second financial record.",
     "اختر بنداً لفتح فئته ومدفوعاته الأصلية؛ هذا ليس سجلاً مالياً ثانياً.")}</p>
   </div>
  </details>
 </section>;
}
