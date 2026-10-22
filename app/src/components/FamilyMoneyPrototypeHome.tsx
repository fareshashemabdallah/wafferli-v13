import {useState} from "react";
import {Plus} from "lucide-react";
import {OneMoneyDashboardSummary} from "./OneMoneyDashboardSummary";
import {UnifiedCategoryDetails} from "./UnifiedCategoryDetails";
import {useI18n} from "@/lib/i18n";
import {computeMoney,type MoneyState} from "@/lib/money";
import {type RhythmForecast} from "@/lib/familyMoneyRhythm";
import {fmtJOD} from "@/lib/storage";
import {localToday} from "@/lib/cashflow";
import {confirmedMonthPlan} from "@/lib/monthAwareMoney";
import {STARTER_PICTURES,visualGroupOf,iconForCategory,pictureFor,pictureCategories,type CategoryPicture} from "@/lib/familyCategoryCards";

type Area="timeline"|"pace"|"annual";
type Props={
 state:MoneyState;setState:(v:MoneyState|((p:MoneyState)=>MoneyState))=>void;forecast:RhythmForecast;
 onArea:(screen:Area)=>void;onIncome:()=>void;onCash:()=>void;onSavings:()=>void;onBills:()=>void;onQuickAdd:()=>void;
 onSpending:()=>void;onCategories:()=>void;
 onEditCategory:(selection:{id?:string;starter?:CategoryPicture})=>void;
};
const tile="rounded-[1.05rem] border border-[#E3EAE0] bg-white p-3 text-start transition hover:-translate-y-0.5 hover:border-[#91C6A4] focus-visible:ring-2 focus-visible:ring-[#4E9D70]";
export function FamilyMoneyPrototypeHome({state,setState,forecast,onArea,onIncome,onCash,onSavings,onBills,onQuickAdd,onSpending,onCategories,onEditCategory}:Props){
 const {lang}=useI18n(),ar=lang==="ar",t=(en:string,a:string)=>ar?a:en;
 const [selected,setSelected]=useState<string|null>(null);
 const [activeCategory,setActiveCategory]=useState<string|null>(null);
 const manage=(id:string)=>{setActiveCategory(current=>current===id?null:id);setSelected(null);};
 const m=computeMoney(state),unknown=t("Not entered","غير مدخل");
 const shown=(n:number|null)=>n===null?unknown:fmtJOD(n);
 const sorted=forecast.events.filter(e=>e.kind!=="pace").slice(0,5);
 const recent=state.expenses.filter(e=>e.status!=="planned").sort((a,b)=>b.date.localeCompare(a.date)).slice(0,4);
 return <div className="space-y-3" data-testid="prototype-money-home">
  <OneMoneyDashboardSummary state={state} forecast={forecast}
   onIncome={onIncome} onCash={onCash} onSavings={onSavings}
   onBills={()=>document.getElementById("money-category-cards")?.scrollIntoView({behavior:"smooth"})} onExpense={onQuickAdd}
   onTimeline={()=>onArea("timeline")}/>
  <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
   <div>
    <h3 className="text-sm font-black text-[#2B5944]">{t("Where our money goes","وين بتروح مصاريف العيلة")}</h3>
    <p className="mt-1 text-[11px] text-[#7A8A7B]">{t("Tap a picture to enter or edit your usual monthly amount.","اضغط على الصورة لتضيف أو تعدّل المخصص الشهري المعتاد.")}</p>
   </div>
   <button type="button" onClick={()=>onEditCategory({})} className="inline-flex min-h-11 items-center gap-1 rounded-xl border border-[#B5D8BD] bg-white px-3 text-xs font-bold text-[#387F58]">
    <Plus className="size-4"/>{t("Add category","أضف فئة")}</button>
  </div>
  <div id="money-category-cards" className="scroll-mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
   {STARTER_PICTURES.map(g=>{
    const cat=pictureCategories(state,g.key),target=cat.reduce((a,x)=>a+m.plannedBy(x.id),0);
    const used=cat.reduce((a,x)=>a+m.spentBy(x.id),0),pct=target>0?Math.min(100,used/target*100):0;
    const confirmed=cat.some(c=>confirmedMonthPlan(state,c.id,localToday().slice(0,7))!==null);
    return <button key={g.key} type="button" data-testid={"category-picture-"+g.key}
      onClick={()=>cat.length===0?onEditCategory({starter:g.key}):
       cat.length===1?manage(cat[0]!.id):setSelected(selected===g.key?null:g.key)}
      aria-pressed={selected===g.key} className={tile+" min-h-36 "+(selected===g.key?"!border-[#51A277] !bg-[#F5FFF5]":"")}>
     <span className="grid size-11 place-items-center rounded-2xl text-2xl" style={{background:g.bg}} aria-hidden="true">{g.icon}</span>
     <strong className="mt-2 block text-xs text-[#385C48]">{cat.length===1?cat[0]!.name:t(g.en,g.ar)}</strong>
     <small className="mt-1 block text-[11px] text-[#839085]">{cat.length?shown(target):t("Not entered","غير مدخل")}</small>
     {confirmed&&<span className="mt-1 block text-[10px] font-bold text-[#438567]">{t("Adjusted this month","معدّل هالشهر")}</span>}
     <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#EEF0EA]"><div className="h-full rounded-full bg-[#63B387]" style={{width:pct+"%"}}/></div>
     <span className="mt-2 block text-[10px] font-semibold text-[#42845F]">{cat.length===0?t("Tap to set amount","اضغط لتحدد المبلغ"):
       cat.length===1?t("Tap for costs & payments","اضغط للبنود والدفعات"):t("Manage "+cat.length+" categories","إدارة "+cat.length+" فئات")}</span>
    </button>;
   })}
   {state.categories.filter(c=>visualGroupOf(c)==="custom").map(cat=>{
    const info=pictureFor(iconForCategory(cat)),target=m.plannedBy(cat.id);
    const spent=m.spentBy(cat.id),pct=target>0?Math.min(100,spent/target*100):0;
    return <button key={cat.id} type="button" data-testid={"category-custom-"+cat.id}
      onClick={()=>manage(cat.id)} className={tile+" min-h-36"}>
     <span className="grid size-11 place-items-center rounded-2xl text-2xl" style={{background:info.bg}} aria-hidden="true">{info.icon}</span>
     <strong className="mt-2 block truncate text-xs text-[#385C48]">{cat.name}</strong>
     <small className="mt-1 block text-[11px] text-[#839085]">{shown(target)}</small>
     {confirmedMonthPlan(state,cat.id,localToday().slice(0,7))!==null&&
      <span className="mt-1 block text-[10px] font-bold text-[#438567]">{t("Adjusted this month","معدّل هالشهر")}</span>}
     <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#EEF0EA]"><div className="h-full rounded-full bg-[#63B387]" style={{width:pct+"%"}}/></div>
     <span className="mt-2 block text-[10px] font-semibold text-[#42845F]">{t("Tap for costs & payments","اضغط للبنود والدفعات")}</span>
    </button>;
   })}
   <button type="button" onClick={()=>onEditCategory({})} className="flex min-h-36 flex-col items-start justify-center gap-2 rounded-[1.05rem] border-2 border-dashed border-[#A9D4B8] bg-[#F4FAF1] p-3 text-start text-[#3D825B]">
    <span className="grid size-11 place-items-center rounded-2xl bg-white text-2xl" aria-hidden="true"><Plus className="size-6"/></span>
    <strong className="text-xs">{t("Add category","أضف فئة")}</strong>
    <span className="text-[11px]">{t("School fees, nanny, gifts…","مدرسة، مربية، هدايا…")}</span>
   </button>
  </div>
  {selected&&<div className="rounded-xl border border-[#BBDCC5] bg-[#F5FBF3] p-3" data-testid="category-group-list">
    <h4 className="text-sm font-bold text-[#387A54]">{t("Your categories in this picture","فئاتك تحت هالصورة")}</h4>
    <div className="mt-2 space-y-2">
     {state.categories.filter(c=>visualGroupOf(c)===selected).map(c=><div key={c.id}
      className="flex items-center justify-between gap-2 rounded-xl border border-[#D7E6D8] bg-white p-2">
      <div className="min-w-0"><strong className="block truncate text-xs text-[#3A6348]">{c.name}</strong>
       <span className="text-[11px] text-[#7E907D]">{shown(m.plannedBy(c.id))}</span></div>
      <button type="button" onClick={()=>manage(c.id)}
       className="min-h-10 shrink-0 rounded-xl bg-[#E9F6EB] px-3 text-xs font-bold text-[#397C56]">{t("Costs & payments","البنود والدفعات")}</button>
     </div>)}
    </div>
    <button type="button" onClick={()=>onEditCategory({starter:selected as CategoryPicture})}
      className="mt-3 min-h-11 text-xs font-bold text-[#3A7C59] underline">{t("Add another here","أضف فئة هون")}</button>
   </div>}
  {activeCategory&&state.categories.some(c=>c.id===activeCategory)&&<UnifiedCategoryDetails key={activeCategory}
    state={state} setState={setState} categoryId={activeCategory}
    onEdit={()=>onEditCategory({id:activeCategory})} onClose={()=>setActiveCategory(null)}/>}
  <section className="space-y-2" aria-label={t("Next payments and income","الدفعات والدخل القادم")}>
   <div className="flex flex-wrap items-center justify-between gap-2">
    <h3 className="text-sm font-black text-[#305D44]">{t("Coming up next","المواعيد الجاية")}</h3>
    <button type="button" onClick={()=>onArea("timeline")}
     className="min-h-11 text-xs font-bold text-[#3E855E] underline">{t("Full timeline · 7 / 30 / 90 days","الجدول الكامل · ٧ / ٣٠ / ٩٠ يوم")}</button>
   </div>
   <div className="divide-y divide-[#EDF1EB] overflow-hidden rounded-2xl border border-[#E4EAE1] bg-white">
    {sorted.length?sorted.map(e=><div key={e.id} className="flex items-center gap-3 p-3">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#F2F8EE] text-xl" aria-hidden="true">{e.kind==="income"?"💵":e.kind==="annual"?"🚘":"🏠"}</span>
      <div className="min-w-0 flex-1"><p className="truncate text-xs font-bold text-[#355943]">{e.label}</p>
       <p className="text-[11px] text-[#78897C]">{e.date} · {e.kind==="income"?t("Expected, not received","متوقع مش مستلم"):t("Unpaid commitment","التزام غير مدفوع")}</p></div>
      <strong className="text-xs tabular-nums text-[#3E7B5C]">{e.amountJod>0?"+":"−"}{shown(Math.abs(e.amountJod))}</strong>
     </div>):<p className="p-4 text-xs text-[#829082]">{t("No dated income or bills entered yet.","ما في دخل أو فواتير مؤرخة بعد.")}</p>}
   </div>
   <button type="button" onClick={()=>document.getElementById("money-category-cards")?.scrollIntoView({behavior:"smooth"})}
    className="min-h-11 rounded-xl border border-[#BAD7C0] bg-white px-3 text-xs font-bold text-[#397B55]">{t("Manage due payments in categories","إدارة الدفعات من داخل الفئات")}</button>
   {(state.commitments??[]).some(b=>!b.categoryId||!state.categories.some(c=>c.id===b.categoryId))&&
    <button type="button" onClick={onBills} className="min-h-11 text-xs font-bold text-[#397B55] underline">{t("Review older uncategorized bills","مراجعة فواتير قديمة بلا فئة")}</button>}
  </section>
  <section className="space-y-2" aria-label={t("Recent paid expenses","آخر المصاريف المدفوعة")}>
   <div className="flex flex-wrap items-center justify-between gap-2">
    <h3 className="text-sm font-black text-[#305D44]">{t("Recently recorded","المصاريف المسجلة مؤخراً")}</h3>
    <button type="button" onClick={()=>document.getElementById("money-category-cards")?.scrollIntoView({behavior:"smooth"})}
      className="min-h-11 text-xs font-bold text-[#3E855E] underline">{t("Edit payments by category","عدّل الدفعات من الفئة")}</button>
   </div>
   <div className="divide-y divide-[#EDF1EB] overflow-hidden rounded-2xl border border-[#E4EAE1] bg-white">
    {recent.length?recent.map(x=><div key={x.id} className="flex items-center gap-3 p-3">
      <span className="text-xl" aria-hidden="true">🧾</span>
      <div className="min-w-0 flex-1"><strong className="block truncate text-xs text-[#365C44]">{state.categories.find(c=>c.id===x.categoryId)?.name??t("Uncategorized","غير مصنف")}</strong>
       <p className="text-[11px] text-[#839082]">{x.date}{x.note?" · "+x.note:""}</p></div>
      <strong className="text-xs text-[#3A8058]">{shown(x.amount)}</strong>
    </div>):<p className="p-4 text-xs text-[#7B8C7E]">{t("No paid expenses recorded yet.","ما في مصاريف مدفوعة مسجلة بعد.")}</p>}
   </div>
  </section>
  <div className="flex flex-wrap gap-2">
   <button type="button" onClick={onQuickAdd} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#3C9266] px-4 text-xs font-bold text-white"><Plus className="size-4"/>{t("Add an expense","سجّل مصروف")}</button>
   <button type="button" onClick={onIncome} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#BBDAC4] bg-white px-4 text-xs font-bold text-[#397B59]">{t("Edit payday","عدّل موعد الراتب")}</button>
  </div>
  <details className="rounded-2xl border border-[#E4EADF] bg-white p-3">
   <summary className="min-h-11 cursor-pointer text-xs font-bold text-[#4F7E60]">{t("More planning options (optional)","خيارات تخطيط إضافية (اختيارية)")}</summary>
   <div className="mt-2 flex flex-wrap gap-2">
    <button type="button" onClick={()=>onArea("annual")} className="min-h-11 rounded-xl border border-[#D0E3D1] px-3 text-xs font-bold text-[#397C56]">{t("Annual insurance, tax & property costs","التأمين والضرائب والمصاريف السنوية")}</button>
    <button type="button" onClick={()=>onArea("pace")} className="min-h-11 rounded-xl border border-[#D0E3D1] px-3 text-xs font-bold text-[#397C56]">{t("Customize spending timing","خصّص مواعيد توزيع الصرف")}</button>
    <button type="button" onClick={onCategories} className="min-h-11 rounded-xl border border-[#D0E3D1] px-3 text-xs font-bold text-[#397C56]">{t("Open category breakdown","تفاصيل المصاريف ضمن الفئات")}</button>
   </div>
  </details>
  <p className="text-[11px] leading-relaxed text-[#768678]">{t("This is an estimate using the records you entered. There is no bank connection; a plan never becomes a payment automatically.",
    "هذه توقعات من معلوماتك المدخلة. ما في ربط بنكي؛ الخطة مش دفعة فعلية إلا بعد تأكيدها.")}</p>
 </div>;
}
