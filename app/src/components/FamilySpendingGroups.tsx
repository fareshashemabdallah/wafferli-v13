import {Plus} from "lucide-react";
import {useI18n} from "@/lib/i18n";
import {computeMoney,type Category,type MoneyState} from "@/lib/money";
import {fmtJOD} from "@/lib/storage";
import {localToday} from "@/lib/cashflow";
import {confirmedMonthPlan} from "@/lib/monthAwareMoney";
import {spendingBreakdown,type SpendingRole} from "@/lib/spendingGroups";
import {UnifiedCategoryDetails} from "./UnifiedCategoryDetails";
import {STARTER_PICTURES,visualGroupOf,iconForCategory,pictureFor,type CategoryPicture} from "@/lib/familyCategoryCards";
type Props={
 state:MoneyState;setState:(next:MoneyState|((prev:MoneyState)=>MoneyState))=>void;
 activeCategory:string|null;onClose:()=>void;onManage:(id:string)=>void;
 onEditCategory:(selection:{id?:string;starter?:CategoryPicture})=>void;
};
const tile="rounded-[1.05rem] border border-[#E3EAE0] bg-white p-3 text-start transition hover:border-[#91C6A4] focus-visible:ring-2 focus-visible:ring-[#4E9D70]";
const groups={
 committed:{en:"Committed costs",ar:"التزامات العيلة",icon:"🔒",tone:"bg-[#F2F7F2]",
  explanation:"Fixed obligations and genuine due dates—not just costs with predictable amounts.",
  arExplanation:"التزامات فعلية ومواعيد استحقاق، وليس فقط مصاريف بمبالغ ثابتة."},
 necessary:{en:"Necessary but variable",ar:"ضرورية لكنها متغيرة",icon:"🧺",tone:"bg-[#F7F8EE]",
  explanation:"The family needs these things, even when their price changes each month.",
  arExplanation:"تحتاجها العيلة، حتى لو تغيرت كلفتها من شهر لآخر."},
 flexible:{en:"Flexible family choices",ar:"خيارات العيلة المرنة",icon:"💗",tone:"bg-[#FCF5F4]",
  explanation:"Decisions you can adjust or defer; your family's protected priorities still matter.",
  arExplanation:"اختيارات قابلة للتعديل أو التأجيل؛ وتبقى أولويات العيلة المحمية مهمة."}
} as const;
export function FamilySpendingGroups({state,setState,activeCategory,onClose,onManage,onEditCategory}:Props){
 const {lang}=useI18n(),ar=lang==="ar",t=(en:string,a:string)=>ar?a:en;
 const month=localToday().slice(0,7);
 const m=computeMoney(state);
 const breakdown=spendingBreakdown(state,month);
 const money=(n:number)=>fmtJOD(n);
 const editLine=(categoryId:string)=>onManage(categoryId);
 const categoryTile=(cat:Category)=>{
  const pic=pictureFor(iconForCategory(cat));
  const group=visualGroupOf(cat);
  const first=STARTER_PICTURES.some(p=>p.key===group)&&
   state.categories.find(c=>visualGroupOf(c)===group)?.id===cat.id;
  const id=first?"category-picture-"+group:group==="custom"?"category-custom-"+cat.id:"category-id-"+cat.id;
  const total=m.plannedBy(cat.id),paid=m.spentBy(cat.id);
  const pct=total>0?Math.min(100,paid/total*100):0;
  return <button type="button" key={cat.id} data-testid={id} className={tile+" min-h-36 text-start"}
    onClick={()=>onManage(cat.id)} aria-label={cat.name+" · "+t("Costs and payments","بنود ودفعات")}>
    <span className="grid size-11 place-items-center rounded-2xl text-2xl" style={{background:pic.bg}} aria-hidden="true">{pic.icon}</span>
    <strong className="mt-2 block truncate text-xs text-[#385C48]">{cat.name}</strong>
    <span className="mt-1 block text-xs text-[#718875]">{money(total)}</span>
    <span className="mt-0.5 block text-[10px] text-[#758778]">{t("Paid","مدفوع")}: {money(paid)}</span>
    {confirmedMonthPlan(state,cat.id,month)!==null&&<span className="mt-1 block text-[10px] font-bold text-[#438567]">{t("Adjusted this month","معدل هذا الشهر")}</span>}
    <span className="mt-2 block h-1.5 overflow-hidden rounded-full bg-[#EEF0EA]"><span className="block h-full rounded-full bg-[#63B387]" style={{width:pct+"%"}}/></span>
    <span className="mt-2 block text-[10px] font-semibold text-[#42845F]">{t("Tap for costs & payments","اضغط للبنود والدفعات")}</span>
   </button>;
 };
 const emptyStarters=STARTER_PICTURES.filter(p=>!(state.hiddenStarterGroups??[]).includes(p.key)&&
  !state.categories.some(c=>visualGroupOf(c)===p.key));
 return <section id="money-category-cards" className="scroll-mt-4 space-y-3" aria-label={t("Where our money goes","وين بتروح مصاريف العيلة")}>
  <div className="flex flex-wrap items-start justify-between gap-3">
   <div><h3 className="text-sm font-black text-[#2B5944]">{t("Where our money goes","وين بتروح مصاريف العيلة")}</h3>
    <p className="mt-1 text-[11px] leading-relaxed text-[#7A8A7B]">{t(
     "One category per part of family life. Split costs inside it, without adding another budget.",
     "فئة واحدة لكل جانب من حياة العيلة. قسّم مصاريفها من الداخل، دون ميزانية إضافية.")}</p></div>
   <button type="button" onClick={()=>onEditCategory({})}
    className="inline-flex min-h-11 items-center gap-1 rounded-xl border border-[#B5D8BD] bg-white px-3 text-xs font-bold text-[#387F58]">
    <Plus className="size-4"/>{t("Add category","أضف فئة")}</button>
  </div>
  <div className="flex flex-wrap gap-x-5 gap-y-1 rounded-xl border border-[#DDE8DB] bg-white px-4 py-3 text-xs text-[#657D6A]">
   <span>{t("Total monthly plan","إجمالي خطة الشهر")}: <strong className="text-[#275D41]">{money(breakdown.totalPlanned)}</strong></span>
   <span>{t("Paid this month","مدفوع هذا الشهر")}: <strong className="text-[#275D41]">{money(breakdown.totalPaid)}</strong></span>
  </div>
  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3" data-testid="unique-category-cards">
   {state.categories.map(categoryTile)}
   {emptyStarters.map(p=><button type="button" key={p.key} data-testid={"category-picture-"+p.key}
    className={tile+" min-h-28 text-start"} onClick={()=>onEditCategory({starter:p.key})}>
    <span className="grid size-10 place-items-center rounded-xl text-xl" style={{background:p.bg}} aria-hidden="true">{p.icon}</span>
    <strong className="mt-2 block text-xs text-[#385C48]">{t(p.en,p.ar)}</strong>
    <span className="mt-1 block text-[11px] text-[#829484]">{t("Not entered","غير مدخل")}</span>
   </button>)}
  </div>
  {activeCategory&&state.categories.some(c=>c.id===activeCategory)&&
   <UnifiedCategoryDetails key={activeCategory} state={state} setState={setState} categoryId={activeCategory}
     onEdit={()=>onEditCategory({id:activeCategory})} onClose={onClose}/>}
  <div className="pt-2">
   <h4 className="text-sm font-black text-[#2F5B43]">{t("What each cost means for our money","كيف بتأثر بنود المصاريف على مال العيلة")}</h4>
   <p className="mt-1 text-[11px] text-[#7B8D7C]">{t(
    "The three groups organize cost lines, not whole categories. Car can appear in several groups but its total is counted once.",
    "التقسيم حسب البنود، لا حسب الفئات كاملة. السيارة قد تظهر في أكثر من مجموعة لكن مجموعها يُحتسب مرة واحدة.")}</p>
  </div>
  {breakdown.groups.map(group=>{
   const info=groups[group.role as SpendingRole];
   return <section key={group.role} data-testid={"spending-group-"+group.role}
    aria-label={t(info.en,info.ar)} className={"rounded-[1.4rem] border border-[#E3EAE0] p-3 sm:p-4 "+info.tone}>
    <div className="flex flex-wrap items-start justify-between gap-2">
     <div className="flex min-w-0 flex-1 items-start gap-2">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white text-xl" aria-hidden="true">{info.icon}</span>
      <div><h4 className="text-sm font-extrabold text-[#31563F]">{t(info.en,info.ar)}</h4>
       <p className="mt-1 max-w-xl text-[11px] leading-relaxed text-[#7B8979]">{t(info.explanation,info.arExplanation)}</p></div>
     </div>
     <strong className="text-sm tabular-nums text-[#335F45]">{money(group.planned)}</strong>
    </div>
    <p className="mt-2 text-[11px] text-[#66806B]">{t("Paid","مدفوع")}: <strong>{money(group.paid)}</strong>
     {" · "}{t("Allowance left (not a debt)","باقي المخصص (ليس ديناً)")}: <strong>{money(group.remainingAllowance)}</strong></p>
    {group.lines.length?<div className="mt-3 grid gap-2 sm:grid-cols-2">
     {group.lines.map(line=><button type="button" key={line.itemId}
      data-testid={"classified-line-"+line.itemId}
      onClick={()=>editLine(line.categoryId)}
      className="min-h-20 rounded-xl border border-[#DDE8D9] bg-white p-3 text-start">
      <span className="block text-[11px] text-[#718B76]">{line.categoryName} ›</span>
      <strong className="block text-sm text-[#385C48]">{line.name}</strong>
      <span className="mt-1 block text-xs tabular-nums text-[#466E52]">{money(line.planned)} {t("monthly","شهرياً")}
       {" · "}{t("Paid","مدفوع")} {money(line.paid)}</span>
      {line.needsReview&&<span className="mt-1 block text-[10px] text-[#A07846]">{t("Suggested nature · confirm in this line","تصنيف مقترح · أكده داخل البند")}</span>}
      {line.priority==="protected"&&<span className="mt-1 block text-[10px] text-[#3D7B5C]">{t("Protected family priority","أولوية محمية للعيلة")}</span>}
     </button>)}
    </div>:<p className="mt-3 text-xs text-[#7A907E]">{t(
      "No costs classified here yet. Open a category and break it down into lines.",
      "لا بنود مصنفة هنا بعد. افتح فئة وقسّمها إلى بنود.")}</p>}
   </section>;
  })}
  {breakdown.unassigned.length>0&&<section data-testid="spending-unassigned" className="rounded-2xl border border-dashed border-[#CBDCCE] bg-white p-3 sm:p-4">
    <h4 className="text-sm font-extrabold text-[#416B51]">{t("Still to split within categories","مبالغ لم تُقسّم بعد داخل الفئات")}</h4>
    <p className="mt-1 text-[11px] text-[#7C8A7E]">{t(
     "These amounts remain in your monthly plan. They're not debts, and Dabberna won't guess whether they're committed, necessary or flexible.",
     "هذه المبالغ ضمن خطة الشهر وليست ديوناً. دبرنا لا يفترض إن كانت التزاماً أو ضرورة أو اختياراً مرناً.")}</p>
    <div className="mt-2 space-y-2">
     {breakdown.unassigned.map(row=><button type="button" key={row.categoryId}
      className="flex min-h-12 w-full flex-wrap items-center justify-between gap-2 rounded-xl bg-[#F6FAF4] p-3 text-start text-xs"
      onClick={()=>onManage(row.categoryId)}>
      <span className="font-bold text-[#386D50]">{row.name}</span>
      <span className="text-[#708573]">{t("Unsplit","غير مفصل")}: {money(row.planned)}
       {row.paid>0?" · "+t("Paid without a line","مدفوع بدون بند")+": "+money(row.paid):""}</span>
     </button>)}
    </div>
  </section>}
  {breakdown.due.length>0&&<section data-testid="actual-bills-due" className="rounded-2xl border border-[#D8E5DA] bg-[#F8FBF8] p-3 sm:p-4">
    <h4 className="text-sm font-extrabold text-[#39624A]">{t("Actual scheduled payments still owed this month","الدفعات المجدولة المستحقة فعلياً هذا الشهر")}</h4>
    <p className="mt-1 text-[11px] text-[#7C8B7E]">{t(
     "This is a bill view, not another monthly budget. Part payments reduce the balance; unused flexible allowances do not create debt.",
     "هذه قائمة فواتير وليست ميزانية إضافية. الدفعات الجزئية تقلل المتبقي، والمخصص المرن غير المستخدم ليس ديناً.")}</p>
    <div className="mt-2 space-y-2">{breakdown.due.map(d=><button key={d.billId+":"+d.dueDate} type="button"
     className="flex min-h-12 w-full flex-wrap items-center justify-between gap-2 rounded-xl border border-[#E1E8E0] bg-white p-3 text-start text-xs"
     onClick={()=>onManage(d.categoryId)}>
     <span><strong className="block text-[#365F48]">{d.categoryName} › {d.name}</strong>
      <span className="block text-[#738575]">{d.dueDate} · {t("Paid","مدفوع")} {money(d.paid)}</span></span>
     <strong className="text-[#916346]">{t("Still owed","متبقي مستحق")}: {money(d.remaining)}</strong>
    </button>)}</div>
  </section>}
  <p className="text-[11px] leading-relaxed text-[#7C8879]">{t(
   "No extra expense, bill or account is created by these views. Mark personally important activities as protected when editing their cost lines.",
   "هذا العرض لا ينشئ مصاريف أو فواتير إضافية. احمِ الأنشطة المهمة للعيلة من داخل بند المصروف.")}</p>
 </section>;
}
