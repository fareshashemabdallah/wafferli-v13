import {Plus} from "lucide-react";
import {useI18n} from "@/lib/i18n";
import {computeMoney,type Category,type MoneyState} from "@/lib/money";
import {fmtJOD} from "@/lib/storage";
import {localToday} from "@/lib/cashflow";
import {confirmedMonthPlan} from "@/lib/monthAwareMoney";
import {displaySpendingRole,spendingGroupSummaries,type SpendingRole} from "@/lib/spendingGroups";
import {STARTER_PICTURES,visualGroupOf,iconForCategory,pictureFor,type CategoryPicture} from "@/lib/familyCategoryCards";

type Props={
 state:MoneyState;
 onManage:(id:string)=>void;
 onEditCategory:(selection:{id?:string;starter?:CategoryPicture})=>void;
};
const tile="w-full rounded-[1.05rem] border border-[#E3EAE0] bg-white p-3 text-start transition hover:-translate-y-0.5 hover:border-[#91C6A4] focus-visible:ring-2 focus-visible:ring-[#4E9D70]";
const labels={
 committed:{icon:"🔒",en:"Committed costs",ar:"التزامات العيلة",desc:"Payments you need to honor. A partial payment can leave a real balance due.",
  descAr:"دفعات لازمة. الدفع الجزئي ممكن يترك مبلغاً مستحقاً.",tone:"bg-[#F2F7F2]"},
 necessary:{icon:"🧺",en:"Necessary but variable",ar:"ضرورية لكنها متغيرة",desc:"Household needs with changing monthly costs, such as groceries and utilities.",
  descAr:"احتياجات ضرورية تتغير قيمتها من شهر لآخر، مثل المونة والخدمات.",tone:"bg-[#F7F8EE]"},
 flexible:{icon:"💗",en:"Flexible family choices",ar:"خيارات العيلة المرنة",desc:"Activities and purchases you can adjust, postpone or skip. Unspent allowance is not a bill.",
  descAr:"أنشطة ومشتريات يمكنك تعديلها أو تأجيلها أو تركها. المتبقي ليس ديناً.",tone:"bg-[#FCF5F4]"}
} as const;
export function FamilySpendingGroups({state,onManage,onEditCategory}:Props){
 const {lang}=useI18n(),ar=lang==="ar",t=(en:string,a:string)=>ar?a:en;
 const month=localToday().slice(0,7);
 const money=computeMoney(state);
 const summaries=spendingGroupSummaries(state,month);
 const total=state.categories.reduce((sum,c)=>sum+money.plannedBy(c.id),0);
 const paid=state.categories.reduce((sum,c)=>sum+money.spentBy(c.id),0);
 const number=(n:number)=>fmtJOD(n);
 const categoryTile=(cat:Category)=>{
  const info=pictureFor(iconForCategory(cat));
  const key=visualGroupOf(cat);
  const firstOfPicture=STARTER_PICTURES.some(g=>g.key===key)&&
   state.categories.find(c=>visualGroupOf(c)===key)?.id===cat.id;
  const target=money.plannedBy(cat.id),spent=money.spentBy(cat.id);
  const pct=target>0?Math.min(100,spent/target*100):0;
  const grouping=displaySpendingRole(cat);
  const testId=firstOfPicture?"category-picture-"+key:key==="custom"?"category-custom-"+cat.id:"category-id-"+cat.id;
  return <div key={cat.id} className="min-w-0">
   <button type="button" data-testid={testId} className={tile+" min-h-36"} onClick={()=>onManage(cat.id)}
    aria-label={cat.name+" · "+t("Costs and payments","البنود والدفعات")}>
    <span className="grid size-11 place-items-center rounded-2xl text-2xl" style={{background:info.bg}} aria-hidden="true">{info.icon}</span>
    <strong className="mt-2 block truncate text-xs text-[#385C48]">{cat.name}</strong>
    <span className="mt-1 block text-xs tabular-nums text-[#718875]">{number(target)}</span>
    <span className="mt-0.5 block text-[10px] text-[#758778]">{t("Paid","المدفوع")}: {number(spent)}</span>
    {confirmedMonthPlan(state,cat.id,month)!==null&&<span className="mt-1 block text-[10px] font-bold text-[#438567]">{t("Adjusted this month","معدّل هالشهر")}</span>}
    <span className="mt-2 block h-1.5 overflow-hidden rounded-full bg-[#EEF0EA]"><span className="block h-full rounded-full bg-[#63B387]" style={{width:pct+"%"}}/></span>
    <span className="mt-2 block text-[10px] font-semibold text-[#42845F]">{t("Tap for costs & payments","اضغط للبنود والدفعات")}</span>
   </button>
   {grouping.suggested&&<button type="button" onClick={()=>onEditCategory({id:cat.id})}
    className="mt-1 min-h-9 px-2 text-start text-[11px] font-semibold text-[#806C4F] underline decoration-dotted underline-offset-2">
    {t("Suggested group · Confirm or change","تصنيف مقترح · تأكيد أو تعديل")}
   </button>}
  </div>;
 };
 return <section id="money-category-cards" className="scroll-mt-4 space-y-3" aria-label={t("Where our money goes by spending purpose","مصاريف العيلة حسب طبيعتها")}>
  <div className="flex flex-wrap items-center justify-between gap-2">
   <div>
    <h3 className="text-sm font-black text-[#2B5944]">{t("Where our money goes","وين بتروح مصاريف العيلة")}</h3>
    <p className="mt-1 text-[11px] leading-relaxed text-[#7A8A7B]">{t(
     "One monthly plan, shown by how much choice you have. Tap any category for costs and payments.",
     "خطة شهرية واحدة، مقسمة حسب قدرتك على الاختيار. اضغط على الفئة للبنود والدفعات.")}</p>
   </div>
   <button type="button" onClick={()=>onEditCategory({})} className="inline-flex min-h-11 items-center gap-1 rounded-xl border border-[#B5D8BD] bg-white px-3 text-xs font-bold text-[#387F58]">
    <Plus className="size-4"/>{t("Add category","أضف فئة")}
   </button>
  </div>
  <div className="flex flex-wrap gap-x-5 gap-y-1 rounded-xl border border-[#DDE8DB] bg-white px-4 py-3 text-xs text-[#657D6A]">
   <span>{t("Total monthly plan","إجمالي خطة الشهر")}: <strong className="text-[#275D41]">{number(total)}</strong></span>
   <span>{t("Paid this month","المدفوع هذا الشهر")}: <strong className="text-[#275D41]">{number(paid)}</strong></span>
  </div>
  {summaries.map(summary=>{
   const data=labels[summary.role];
   const group=state.categories.filter(c=>displaySpendingRole(c).role===summary.role);
   return <section key={summary.role} data-testid={"spending-group-"+summary.role}
    aria-label={t(data.en,data.ar)} className={"rounded-[1.4rem] border border-[#E3EAE0] p-3 sm:p-4 "+data.tone}>
    <div className="flex flex-wrap items-start justify-between gap-2">
     <div className="flex min-w-0 flex-1 items-start gap-2">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white text-xl" aria-hidden="true">{data.icon}</span>
      <div>
       <h4 className="text-sm font-extrabold text-[#31563F]">{t(data.en,data.ar)}</h4>
       <p className="mt-1 max-w-xl text-[11px] leading-relaxed text-[#7B8979]">{t(data.desc,data.descAr)}</p>
      </div>
     </div>
     <strong className="shrink-0 text-sm tabular-nums text-[#335F45]">{number(summary.planned)}</strong>
    </div>
    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-[#69816C]">
     <span>{t("Paid","مدفوع")}: <strong className="text-[#386B50]">{number(summary.paid)}</strong></span>
     {summary.role==="committed"?
      <span>{summary.numberOfDatedBills?t("Dated bills still owed","باقي الفواتير المستحقة")+": "+number(summary.billOutstanding):
       t("No linked due dates yet · budget remaining is not debt","لا مواعيد استحقاق مرتبطة بعد · باقي الميزانية مش دين")}</span>:
      <span>{t("Allowance left","الباقي من المخصص")}: <strong>{number(summary.remainingAllowance)}</strong></span>}
    </div>
    {group.length?<div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
     {group.map(categoryTile)}
    </div>:<p className="mt-3 rounded-xl border border-dashed border-[#D7E4D5] bg-white/65 p-3 text-xs text-[#819080]">
     {t("No categories assigned here yet. Add one or classify an existing category.","لا فئات بهالمجموعة بعد. أضف فئة أو غيّر تصنيف فئة موجودة.")}
    </p>}
   </section>;
  })}
  {STARTER_PICTURES.filter(g=>!(state.hiddenStarterGroups??[]).includes(g.key)&&
   !state.categories.some(c=>visualGroupOf(c)===g.key)).length>0&&
   <section className="rounded-2xl border border-dashed border-[#CDDFD1] bg-[#FAFCF9] p-3">
    <p className="text-xs font-bold text-[#52775C]">{t("Quick-add a missing category (optional)","أضف فئة ناقصة بسرعة (اختياري)")}</p>
    <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
     {STARTER_PICTURES.filter(g=>!(state.hiddenStarterGroups??[]).includes(g.key)&&
      !state.categories.some(c=>visualGroupOf(c)===g.key)).map(g=><button type="button" key={g.key}
      data-testid={"category-picture-"+g.key}
      onClick={()=>onEditCategory({starter:g.key})} className={tile+" min-h-28"}>
      <span className="grid size-10 place-items-center rounded-xl text-xl" style={{background:g.bg}} aria-hidden="true">{g.icon}</span>
      <strong className="mt-2 block text-xs text-[#385C48]">{t(g.en,g.ar)}</strong>
      <span className="mt-1 block text-[11px] text-[#829484]">{t("Not entered","غير مدخل")}</span>
     </button>)}
    </div>
   </section>}
  <button type="button" onClick={()=>onEditCategory({})} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[#A9D4B8] bg-[#F5FBF2] px-4 text-xs font-bold text-[#3A7A55]">
   <Plus className="size-4"/>{t("Add another category","أضف فئة أخرى")}
  </button>
  <p className="text-[11px] leading-relaxed text-[#7C8879]">{t(
   "Older categories show suggested groups until you confirm them. A group never creates a new bill or changes an existing payment. Mark important activities as protected in category details.",
   "الفئات القديمة تظهر بتصنيف مقترح حتى تؤكده. التصنيف لا ينشئ فاتورة ولا يغيّر دفعة. يمكنك حماية نشاط مهم من تفاصيل الفئة.")}</p>
 </section>;
}
