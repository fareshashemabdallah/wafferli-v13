import {useEffect,useState,type FormEvent} from "react";
import {useI18n} from "@/lib/i18n";
import {uid} from "@/lib/storage";
import {emptyRealMoney} from "@/lib/moneyOverview";
import {removeMoneyCategory} from "@/lib/removeMoneyCategory";
import {categoryItemTotal} from "@/lib/householdBudgetBuilder";
import type {Category,MoneyState} from "@/lib/money";
import {displaySpendingRole,type SpendingRole,type ExpenseCadence} from "@/lib/spendingGroups";
import {CATEGORY_PICTURES,pictureFor,saveFamilyCategory,visualGroupOf,iconForCategory,
 type CategoryPicture,type CategoryVisualGroup,type CategoryEditResult} from "@/lib/familyCategoryCards";

type Props={
 state:MoneyState;
 setState:(next:MoneyState|((prev:MoneyState)=>MoneyState))=>void;
 categoryId?:string;starter?:CategoryPicture;onClose:()=>void;
 onMonthPlan:(id:string)=>void;onAdvanced:()=>void;
};
const field="mt-1 min-h-11 w-full rounded-xl border border-[#D9E6D7] bg-white p-2.5 text-sm text-[#2F5140] focus-visible:ring-2 focus-visible:ring-[#529F78]";
const label="block text-xs font-bold text-[#5C7665]";
export function FamilyCategoryEditor({state,setState,categoryId,starter,onClose,onMonthPlan,onAdvanced}:Props){
 const {lang}=useI18n(),ar=lang==="ar",t=(en:string,a:string)=>ar?a:en;
 const existing=state.categories.find(c=>c.id===categoryId);
 const suggested=starter?pictureFor(starter):null;
 const [name,setName]=useState(existing?.name??(suggested?t(suggested.en,suggested.ar):""));
 const [amount,setAmount]=useState(existing?String(existing.planned):"");
 const [role,setRole]=useState<SpendingRole>(existing?displaySpendingRole(existing).role:"necessary");
 const [cadence,setCadence]=useState<ExpenseCadence>(existing?.expectedCadence??"monthly");
 const [priority,setPriority]=useState<Category["priority"]>(existing?.priority);
 const [visualIcon,setVisualIcon]=useState<CategoryPicture>(existing?iconForCategory(existing):(starter??"other"));
 const [visualGroup,setVisualGroup]=useState<CategoryVisualGroup>(existing?visualGroupOf(existing):starter??"custom");
 const [more,setMore]=useState(false);
 const [error,setError]=useState("");
 const amountMinimum=existing?categoryItemTotal(state.budgetItems??[],existing.id):0;
 const amountValid=(s:string)=>/^\d{1,6}(?:\.\d{1,2})?$/.test(s)&&
  Number.isFinite(Number(s))&&Number(s)>=0&&Number(s)<=100000;
 // The editor is keyed by the selection in its parent. Existing categories
 // retain stable IDs and all linked records through every display change.
 useEffect(()=>{const onEscape=(e:KeyboardEvent)=>{if(e.key==="Escape")onClose();};
  window.addEventListener("keydown",onEscape);return ()=>window.removeEventListener("keydown",onEscape);
 },[onClose]);
 const reason=(r:Extract<CategoryEditResult,{ok:false}>["reason"]):string=>{
  if(r==="demo")return t("Start real Money to save your own categories.","ابدأ بمالية فعلية لحفظ فئات عيلتك.");
  if(r==="name")return t("Enter a category name up to 40 characters.","أدخل اسم فئة لحد ٤٠ حرف.");
  if(r==="duplicate")return t("This category name already exists. Edit the existing category instead.","اسم هالفئة موجود من قبل. عدّل الفئة الموجودة.");
  if(r==="item-minimum")return t("This category already has detailed monthly items totalling "+amountMinimum+
    " JOD. Keep at least that amount or edit the items in Detailed budget.",
    "في بنود تفصيلية مجموعها "+amountMinimum+" دينار. خلّي المخصص بهالقيمة أو عدّل البنود بالميزانية التفصيلية.");
  if(r==="amount")return t("Enter a valid monthly amount between 0 and 100,000 JOD (up to 2 decimals).",
    "أدخل مخصص شهري من صفر إلى ١٠٠٬٠٠٠ دينار، وبحد أقصى خانتين عشريتين.");
  return t("The category could not be saved. Please reopen it and try again.",
    "تعذّر حفظ الفئة. افتحها من جديد وجرّب.");
 };
 const save=(event:FormEvent)=>{
  event.preventDefault();setError("");
  if(!amountValid(amount)){setError(reason("amount"));return;}
  const result=saveFamilyCategory(state,{
   ...(existing?{id:existing.id}:{}),name,planned:Number(amount),type:existing?.type??(role==="committed"?"fixed":"variable"),
   spendingRole:role,expectedCadence:cadence,
   ...(priority?{priority}:{}),visualGroup,visualIcon
  },uid());
  if(!result.ok){setError(reason(result.reason));return;}
  setState(result.state);
  onClose();
 };
 const realStart=()=>{
  if(!window.confirm(t("Replace only the sample Money data with an empty personal Money plan? Your family profiles, calendar and plans will be kept.",
    "بدك تستبدل بيانات المال التجريبية فقط بميزانية فاضية؟ ملفات العيلة والتقويم والخطط بتبقى محفوظة.")))return;
  setState(prev=>prev.demo?emptyRealMoney():prev);onClose();
 };
 const removeCategory=()=>{
  if(!existing||state.demo)return;
  const expenseCount=state.expenses.filter(e=>e.categoryId===existing.id).length;
  const billCount=(state.commitments??[]).filter(c=>c.categoryId===existing.id).length;
  if(!window.confirm(t(
   "Remove \""+existing.name+"\" from your active budget? "+expenseCount+
   " existing expense(s) are kept in history under the old category name. "+billCount+
   " scheduled bill(s) will stay active without this category. Its monthly allowance and spending pace will be removed.",
   "حذف فئة \""+existing.name+"\" من الميزانية؟ سنحتفظ بعدد "+expenseCount+
   " من المصاريف السابقة باسم الفئة، و"+billCount+
   " من الفواتير المجدولة ستبقى مستحقة دون فئة. سيُحذف المخصص الشهري وجدول توزيع المصروف."
  )))return;
  setState(previous=>removeMoneyCategory(previous,existing.id));
  onClose();
 };
 const icon=pictureFor(visualIcon);
 const startMonth=()=>{
  if(!existing)return;
  onClose();onMonthPlan(existing.id);
 };
 return <div className="fixed inset-0 z-[75] flex items-start justify-center overflow-y-auto bg-[#193A2D]/65 p-3 pt-[min(7vh,48px)]" role="presentation"
  onMouseDown={e=>{if(e.currentTarget===e.target)onClose();}}>
  <section role="dialog" aria-modal="true" aria-label={existing?t("Edit family category","تعديل فئة العيلة"):t("Add family category","إضافة فئة للعيلة")}
   className="w-full max-w-lg rounded-[1.5rem] bg-[#FCFDF8] p-4 shadow-2xl sm:p-6">
   <header className="flex items-start justify-between gap-3">
    <div className="flex min-w-0 flex-1 items-center gap-3">
     <span className="grid size-14 shrink-0 place-items-center rounded-2xl text-3xl" style={{background:icon.bg}} aria-hidden="true">{icon.icon}</span>
     <div className="min-w-0"><p className="text-[10px] font-black tracking-wide text-[#5C9371]">{t("WHERE OUR MONEY GOES","وين بتروح مصاريف العيلة")}</p>
      <h2 className="mt-1 text-lg font-extrabold text-[#315B44]">{existing?t("Edit category","عدّل الفئة"):t("Add a category","أضف فئة")}</h2>
      <p className="mt-1 text-xs leading-relaxed text-[#758779]">{t("One usual monthly allowance. You can adjust particular months separately.",
       "مخصص شهري معتاد واحد، وفيك تعدّله لشهور معيّنة لاحقاً.")}</p></div>
    </div>
    <button type="button" onClick={onClose} aria-label={t("Close","إغلاق")} className="grid size-10 shrink-0 place-items-center rounded-full bg-[#EAF1E8] text-xl text-[#34664D]">×</button>
   </header>
   {state.demo?<div className="mt-4 rounded-xl border border-[#ECDDBF] bg-[#FFF8E7] p-4">
    <h3 className="text-sm font-extrabold text-[#876D4B]">{t("You're viewing example finances","عم تشوف بيانات تجريبية")}</h3>
    <p className="mt-2 text-xs text-[#857359]">{t("Start a personal Money plan before saving. This changes sample Money only, not your family's other records.",
     "ابدأ بميزانية خاصة لتقدر تحفظ. رح نغيّر بيانات المال التجريبية فقط، مش سجلات العيلة.")}</p>
    <button type="button" onClick={realStart} className="mt-3 min-h-11 rounded-xl bg-[#3C8C62] px-4 text-xs font-extrabold text-white">
     {t("Start with real Money","ابدأ بماليتي الفعلية")}</button>
   </div>:<form className="mt-4 space-y-3" onSubmit={save}>
    <label className={label}>{t("Category name","اسم الفئة")}
     <input className={field} autoFocus maxLength={40} value={name} placeholder={t("e.g. School fees, Nanny, Gifts","مثلاً: المدرسة، المربية، الهدايا")}
      onChange={e=>setName(e.target.value)}/></label>
    <label className={label}>{t("Usual monthly allowance (JOD)","المخصص الشهري المعتاد (دينار)")}
     <input className={field} type="number" inputMode="decimal" min="0" max="100000" step=".01" value={amount}
      placeholder={t("Enter an amount, e.g. 300","أدخل المبلغ مثلاً ٣٠٠")} onChange={e=>setAmount(e.target.value)}/>
    </label>
    <fieldset className="space-y-2 rounded-2xl border border-[#DCE8DA] bg-[#F6FAF4] p-3">
     <legend className="px-1 text-xs font-extrabold text-[#315D45]">{t("What kind of family expense is this?","أي نوع من مصاريف العيلة؟")}</legend>
     <div className="grid gap-2">
      {([
       {id:"committed",en:"Committed · must be paid",ar:"التزام · لازم يندفع",desc:"e.g. school fees, nanny or rent",descAr:"مثل أقساط المدرسة أو المربية أو الإيجار"},
       {id:"necessary",en:"Necessary · amount varies",ar:"ضروري · المبلغ بيتغير",desc:"e.g. groceries, fuel or utilities",descAr:"مثل المونة والبنزين والخدمات"},
       {id:"flexible",en:"Flexible · we choose what to spend",ar:"مرن · نحن بنقرر قديش نصرف",desc:"e.g. outings, gifts or travel",descAr:"مثل الطلعات والهدايا والسفر"}
      ] as const).map(x=><label key={x.id} className={"flex min-h-12 cursor-pointer items-start gap-3 rounded-xl border p-3 "+(role===x.id?"border-[#83C4A0] bg-white":"border-[#DFE8DF] bg-[#FBFCFA]")}>
       <input type="radio" name="family-spending-role" className="mt-1 size-4 accent-[#3C885E]" checked={role===x.id}
        onChange={()=>setRole(x.id)}/>
       <span><strong className="block text-xs text-[#335F46]">{t(x.en,x.ar)}</strong>
        <span className="mt-1 block text-[11px] text-[#798C7D]">{t(x.desc,x.descAr)}</span></span>
      </label>)}
     </div>
     {existing&&!existing.spendingRole&&<p className="text-[11px] text-[#956E40]">{t("Suggested placement from your old category; confirm or change it here.","تصنيف مقترح من فئتك القديمة؛ أكّده أو غيّره هون.")}</p>}
    </fieldset>
    <label className={label}>{t("How often is this expense expected?","كل قديش بتتوقع هالمصروف؟")}
     <select className={field} value={cadence} onChange={e=>setCadence(e.target.value as ExpenseCadence)}>
      <option value="weekly">{t("Weekly","أسبوعياً")}</option>
      <option value="monthly">{t("Monthly","شهرياً")}</option>
      <option value="quarterly">{t("Every few months","كل عدة أشهر")}</option>
      <option value="yearly">{t("Yearly","سنوياً")}</option>
      <option value="once">{t("One-time","مرة واحدة")}</option>
     </select>
     <span className="mt-1 block text-[11px] font-normal text-[#7C8C80]">{t(
      "Frequency is a reminder only. Your amount above is still the usual monthly budget. Add actual due dates and payments inside the category.",
      "التكرار للتوضيح فقط. المبلغ فوق هو المخصص الشهري المعتاد. أضف المواعيد والدفعات الفعلية من داخل الفئة.")}</span>
    </label>
    {amountMinimum>0&&<p className="rounded-xl bg-[#F1F7ED] p-3 text-xs text-[#647967]">
      {t("This category contains itemized budget entries totalling ","هذه الفئة فيها بنود تفصيلية بمجموع ")}
      <strong>{amountMinimum} JOD</strong>. {t("Keep the monthly allowance at least this high, or edit those items in Detailed budget.",
       "خلّي المخصص على الأقل بهالقيمة، أو عدّل البنود بالميزانية التفصيلية.")}</p>}
    <details open={more} onToggle={e=>setMore(e.currentTarget.open)} className="rounded-xl border border-[#E0E8DB] bg-white p-3">
     <summary className="min-h-9 cursor-pointer text-xs font-bold text-[#488063]">{t("Picture & optional details","الصورة وتفاصيل اختيارية")}</summary>
     <div className="mt-3 space-y-3">
      <label className={label}>{t("Category picture","صورة الفئة")}
       <select className={field} value={visualIcon} onChange={e=>setVisualIcon(e.target.value as CategoryPicture)}>
        {CATEGORY_PICTURES.map(p=><option key={p.key} value={p.key}>{p.icon} {t(p.en,p.ar)}</option>)}
       </select></label>
      {existing&&<label className={label}>{t("Picture grouping","مجموعة الصورة")}
       <select className={field} value={visualGroup} onChange={e=>setVisualGroup(e.target.value as CategoryVisualGroup)}>
        <option value="custom">{t("My own category card","بطاقة خاصة")}</option>
        {CATEGORY_PICTURES.slice(0,6).map(p=><option key={p.key} value={p.key}>{p.icon} {t(p.en,p.ar)}</option>)}
       </select></label>}
      <label className={label}>{t("Importance to our family (optional)","أهمية المصروف للعيلة (اختياري)")}
       <select className={field} value={priority??""} onChange={e=>setPriority(e.target.value?e.target.value as Category["priority"]:undefined)}>
        <option value="">{t("Decide later","بقرر بعدين")}</option>
        <option value="essential">{t("Essential need","أساسي")}</option>
        <option value="protected">{t("Personally important","مهم للعيلة")}</option>
        <option value="flexible">{t("Flexible","قابل للتعديل")}</option>
       </select></label>
     </div>
    </details>
    <p className="rounded-xl bg-[#F0F8EC] p-3 text-[11px] leading-relaxed text-[#647E6A]">
     {t("This saves a budget amount, not a payment. Renaming keeps every expense, bill and monthly adjustment linked to the same category.",
      "هيدا بيحفظ مخصص بالميزانية مش دفعة. تغيير الاسم بيحافظ على ارتباط كل المصاريف والفواتير والتعديلات بنفس الفئة.")}</p>
    {error&&<p className="rounded-xl bg-[#FFF0F0] p-3 text-xs font-bold text-[#AA4761]" role="alert">{error}</p>}
    <div className="flex flex-wrap gap-2">
     <button type="submit" className="min-h-11 flex-1 rounded-xl bg-[#398961] px-4 text-sm font-extrabold text-white">{t("Save category","احفظ الفئة")}</button>
     <button type="button" onClick={onClose} className="min-h-11 rounded-xl border border-[#D7E3D6] bg-white px-4 text-xs font-semibold text-[#58705F]">{t("Cancel","إلغاء")}</button>
    </div>
    {existing&&<div className="flex flex-wrap gap-4 border-t border-[#E5ECE3] pt-3">
     <button type="button" className="min-h-10 text-xs font-bold text-[#3E845B] underline" onClick={startMonth}>
      {t("Adjust a particular month","عدّل شهر معيّن")}</button>
     {amountMinimum>0&&<button type="button" className="min-h-10 text-xs font-bold text-[#3E845B] underline"
      onClick={()=>{onClose();onAdvanced();}}>{t("Edit detailed budget items","عدّل بنود الميزانية التفصيلية")}</button>}
     <button type="button" className="min-h-10 text-xs font-bold text-[#A44F5B] underline"
      onClick={removeCategory}>{t("Delete category","حذف الفئة")}</button>
    </div>}
   </form>}
  </section>
 </div>;
}
