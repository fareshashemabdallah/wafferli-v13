import {useState,type FormEvent} from "react";
import {useI18n} from "@/lib/i18n";
import {uid,fmtJOD} from "@/lib/storage";
import {localToday,futureDate,scheduleDates,roundJod} from "@/lib/cashflow";
import {computeMoney,type MoneyState} from "@/lib/money";
import {categoryItemTotal,monthlyItemCost,recordedItemSpending,type BudgetItem,type ItemFrequency} from "@/lib/householdBudgetBuilder";
import {addCategoryItem,recordCategoryPayment,undoCategoryPayment,
 billPaidTotal,billOutstanding,saveCategoryDueDate,removeCategoryBill,stopCategoryItem} from "@/lib/unifiedCategoryLedger";
import {pictureFor,iconForCategory} from "@/lib/familyCategoryCards";

type Props={state:MoneyState;setState:(v:MoneyState|((p:MoneyState)=>MoneyState))=>void;
 categoryId:string;onEdit:()=>void;onClose:()=>void};
const field="mt-1 min-h-10 w-full rounded-xl border border-[#D7E5D8] bg-white px-3 py-2 text-sm text-[#315B43]";
const btn="min-h-10 rounded-xl border border-[#BBD8C4] bg-white px-3 text-xs font-bold text-[#347C57]";
const amountOk=(s:string)=>/^\d{1,6}(\.\d{1,2})?$/.test(s)&&Number(s)>0&&Number(s)<=100000;
const money=(n:number)=>fmtJOD(roundJod(n));
export function UnifiedCategoryDetails({state,setState,categoryId,onEdit,onClose}:Props){
 const {lang}=useI18n(),ar=lang==="ar",t=(en:string,a:string)=>ar?a:en;
 const category=state.categories.find(c=>c.id===categoryId);
 const [showNewItem,setShowNewItem]=useState(false);
 const [editingItemId,setEditingItemId]=useState<string|null>(null);
 const [newName,setNewName]=useState("");
 const [newAmount,setNewAmount]=useState("");
 const [newFrequency,setNewFrequency]=useState<ItemFrequency>("monthly");
 const [newDue,setNewDue]=useState(false);
 const [newDueDate,setNewDueDate]=useState(localToday());
 const [newDueFrequency,setNewDueFrequency]=useState<"once"|"monthly"|"quarterly"|"yearly">("monthly");
 const [billForm,setBillForm]=useState(false);
 const [editingBillId,setEditingBillId]=useState<string|null>(null);
 const [billName,setBillName]=useState("");
 const [billAmount,setBillAmount]=useState("");
 const [billDate,setBillDate]=useState(localToday());
 const [billFrequency,setBillFrequency]=useState<"once"|"monthly"|"quarterly"|"yearly">("monthly");
 const [paymentTarget,setPaymentTarget]=useState<{billId?:string;dueDate?:string;itemId?:string}|null>(null);
 const [payAmount,setPayAmount]=useState("");
 const [payDate,setPayDate]=useState(localToday());
 const [showAllHistory,setShowAllHistory]=useState(false);
 const [error,setError]=useState("");
 if(!category)return null;
 const month=localToday().slice(0,7);
 const items=(state.budgetItems??[]).filter(i=>i.categoryId===categoryId&&i.enabled);
 const bills=(state.commitments??[]).filter(b=>b.categoryId===categoryId);
 const recent=state.expenses.filter(e=>e.categoryId===categoryId&&e.status!=="planned")
  .slice().sort((a,b)=>b.date.localeCompare(a.date));
 const spending=recordedItemSpending(state,categoryId,month),overview=computeMoney(state);
 const plan=overview.plannedBy(categoryId),paid=overview.spentBy(categoryId);
 const itemized=categoryItemTotal(state.budgetItems??[],categoryId);
 const free=roundJod(category.planned-itemized);
 const show=(n:number)=>money(n);
 const itemCost=(item:BudgetItem)=>item.amountJod;
 const pastDue=(billId:string)=>bills.find(b=>b.id===billId);
 const dueRows=bills.flatMap(b=>{
  const dates=scheduleDates(b.dueDate,b.frequency,futureDate(localToday(),-45),futureDate(localToday(),365),b.endDate);
  const upcoming=dates.filter(d=>billOutstanding(state,b.id,d)>0);
  const completed=dates.filter(d=>billOutstanding(state,b.id,d)===0);
  // Keep one most recent paid occurrence visible, as well as next 2 unpaid.
  return [...upcoming.slice(0,2),...(completed.length?[completed[completed.length-1]!]:[])]
   .sort().map(d=>({bill:b,date:d,remaining:billOutstanding(state,b.id,d),
    paid:billPaidTotal(state,b.id,d)}));
 });
 const startPayment=(itemId?:string,billId?:string,dueDate?:string)=>{
  setError("");setPaymentTarget({...(itemId?{itemId}:{}),...(billId&&dueDate?{billId,dueDate}:{})});
  if(billId&&dueDate)setPayAmount(String(billOutstanding(state,billId,dueDate)));
  else setPayAmount("");
  setPayDate(localToday());
 };
 const pay=(ev:FormEvent)=>{
  ev.preventDefault();setError("");
  if(!paymentTarget||!amountOk(payAmount)){setError(t("Enter a valid amount.","أدخل مبلغاً صحيحاً."));return;}
  const p={id:uid(),categoryId,amount:Number(payAmount),date:payDate,
   ...(paymentTarget.itemId?{budgetItemId:paymentTarget.itemId}:{}),
   ...(paymentTarget.billId?{billId:paymentTarget.billId,dueDate:paymentTarget.dueDate!}:{}),
  };
  const next=recordCategoryPayment(state,p);
  if(next===state){setError(t("Payment could not be recorded. Check the remaining amount, date and linked bill.",
   "تعذر تسجيل الدفعة. راجع المبلغ المتبقي والتاريخ والفاتورة."));return;}
  setState(next);setPaymentTarget(null);setPayAmount("");
 };
 const beginEditItem=(item:BudgetItem)=>{
  setEditingItemId(item.id);setNewName(item.name);setNewAmount(String(item.amountJod));
  setNewFrequency(item.frequency);setNewDue(false);setShowNewItem(true);setBillForm(false);setError("");
 };
 const addItem=(ev:FormEvent)=>{
  ev.preventDefault();setError("");
  if(!newName.trim()||!amountOk(newAmount)){setError(t("Enter a name and a positive cost.","أدخل اسم البند ومبلغاً صحيحاً."));return;}
  const previous=(state.budgetItems??[]).find(i=>i.id===editingItemId&&i.categoryId===categoryId);
  const item:BudgetItem=previous?{...previous,name:newName.trim().slice(0,90),
   amountJod:Number(newAmount),frequency:newFrequency,enabled:true}:
   {id:uid(),categoryId,name:newName.trim().slice(0,90),enabled:true,
    amountJod:Number(newAmount),frequency:newFrequency,behaviour:"variable",priority:"essential"};
  if(previous?.quantity!==undefined||previous?.unitPriceJod!==undefined){
   if(!window.confirm(t("Replace the old quantity-based calculation with this manually entered amount?",
    "هل تريد استبدال حساب الكمية السابق بالمبلغ المدخل يدوياً؟")))return;
   delete item.quantity;delete item.unitPriceJod;delete item.unitLabel;
   delete item.priceSource;delete item.priceCheckedMonth;
  }
  const next=addCategoryItem(state,item);
  if(next===state){setError(t("Subcategory exceeds the category's monthly allowance. Edit the category amount first.",
   "مجموع البنود يتجاوز مخصص الفئة الشهري. عدّل مخصص الفئة أولاً."));return;}
  if(newDue&&!editingItemId){
   const n=saveCategoryDueDate(next,{id:uid(),name:item.name,amount:itemCost(item),
    categoryId,budgetItemId:item.id,dueDate:newDueDate,frequency:newDueFrequency});
   if(n===next){setError(t("Choose a valid due date.","اختر تاريخ استحقاق صحيحاً."));return;}
   setState(n);
  }else setState(next);
  setNewName("");setNewAmount("");setShowNewItem(false);setNewDue(false);setEditingItemId(null);
 };
 const beginEditBill=(id:string)=>{
  const old=(state.commitments??[]).find(b=>b.id===id);
  if(!old)return;
  setEditingBillId(id);setBillName(old.name);setBillAmount(String(old.amount));
  setBillDate(old.dueDate);setBillFrequency(["once","monthly","quarterly","yearly"].includes(old.frequency)?
   old.frequency as typeof billFrequency:"monthly");setBillForm(true);setShowNewItem(false);setError("");
 };
 const addBill=(ev:FormEvent)=>{
  ev.preventDefault();setError("");
  if(!amountOk(billAmount)||!billName.trim()||
   !scheduleDates(billDate,"once",billDate,billDate).includes(billDate)){
   setError(t("Enter a valid name, amount and due date.","أدخل اسم ومبلغ وموعد صحيح."));return;
  }
  if(editingBillId){
   const old=(state.commitments??[]).find(b=>b.id===editingBillId);
   if(!old)return;
   if(state.expenses.some(e=>e.billId===editingBillId)||(old.paidDates??[]).length>0){
    setError(t("This bill has payment history. Stop the old schedule and add a new one; do not rewrite past due dates.",
     "هذه الفاتورة لها سجل دفعات. أوقف الجدول القديم وأنشئ موعداً جديداً دون تغيير التاريخ السابق."));return;
   }
   setState(prev=>({...prev,commitments:(prev.commitments??[]).map(b=>b.id===editingBillId?
    {...b,name:billName.trim().slice(0,60),amount:Number(billAmount),dueDate:billDate,frequency:billFrequency}:b)}));
   setEditingBillId(null);setBillForm(false);setBillName("");setBillAmount("");return;
  }
  const n=saveCategoryDueDate(state,{id:uid(),name:billName.trim(),amount:Number(billAmount),
   categoryId,dueDate:billDate,frequency:billFrequency});
  if(n===state){setError(t("Check name, amount and due date.","راجع الاسم والمبلغ والموعد."));return;}
  setState(n);setBillForm(false);setEditingBillId(null);setBillName("");setBillAmount("");
 };
 const stopBill=(id:string)=>{
  if(!window.confirm(t("Stop or remove this bill? Previously recorded payments are kept.",
   "إيقاف أو حذف هذه الفاتورة؟ تبقى الدفعات المسجلة محفوظة.")))return;
  setState(s=>removeCategoryBill(s,id));
 };
 const itemPaid=(id:string)=>roundJod(spending.byItem[id]??0);
 const illustration=pictureFor(iconForCategory(category));
 return <section id="active-money-category" className="scroll-mt-4 space-y-3 rounded-2xl border border-[#9CC9AC] bg-[#F9FCF7] p-3 sm:p-5" data-testid="unified-category-details"
   aria-label={t("Category payments and breakdown","تفاصيل الفئة والدفعات")}>
  <div className="flex items-start justify-between gap-2">
   <div className="flex min-w-0 items-center gap-2">
    <span className="grid size-11 shrink-0 place-items-center rounded-xl text-2xl" style={{background:illustration.bg}} aria-hidden="true">{illustration.icon}</span>
    <div className="min-w-0"><h3 className="truncate text-base font-extrabold text-[#315B42]">{category.name}</h3>
     <p className="text-xs text-[#738A78]">{t("Manage every cost and payment here","كل التكاليف والدفعات بنفس المكان")}</p></div>
   </div>
   <button type="button" onClick={onClose} className={btn} aria-label={t("Close category","إغلاق الفئة")}>×</button>
  </div>
  <div className="grid grid-cols-3 gap-2">
   {([{en:"Monthly plan",ar:"خطة الشهر",value:plan},{en:"Paid this month",ar:"مدفوع هذا الشهر",value:paid},
      {en:"Plan left",ar:"المتبقي من الخطة",value:Math.max(0,roundJod(plan-paid))}]).map(x=>
    <div key={x.en} className="rounded-xl bg-white p-2"><p className="text-[10px] text-[#698470]">{t(x.en,x.ar)}</p>
     <strong className="mt-1 block break-words text-xs tabular-nums text-[#397E5A] sm:text-base">{show(x.value)}</strong></div>)}
  </div>
  <div className="flex flex-wrap gap-2">
   <button type="button" className={btn} onClick={onEdit}>{t("Edit category amount","تعديل مخصص الفئة")}</button>
   <button type="button" disabled={state.demo} className={btn+" disabled:opacity-50"}
     onClick={()=>{setEditingItemId(null);setNewName("");setNewAmount("");setNewDue(false);setShowNewItem(x=>!x);setBillForm(false);setError("");}}>
     + {t("Break down this category","قسّم الفئة إلى بنود")}</button>
  </div>
  <p className="text-xs leading-relaxed text-[#768B7D]">
   {t("Subcategories explain the category plan; they never add a second budget. Unassigned plan: ",
    "البنود تفصّل نفس مخصص الفئة، بدون تكرار الميزانية. المخصص غير المفصّل: ")}{show(Math.max(0,free))}
  </p>
  {showNewItem&&<form onSubmit={addItem} className="space-y-2 rounded-xl border border-[#D7E7D9] bg-white p-3"
    aria-label={t("Add subcategory","إضافة بند")}>
   <h4 className="text-sm font-bold">{editingItemId?t("Edit subcategory","تعديل البند"):t("New subcategory","بند جديد")}</h4>
   <label className="block text-xs">{t("Name","الاسم")}
    <input className={field} maxLength={90} value={newName} onChange={e=>setNewName(e.target.value)} placeholder={t("School transport","نقل مدرسي")}/></label>
   <div className="grid grid-cols-2 gap-2">
    <label className="block text-xs">{t("Amount (JOD)","المبلغ (دينار)")}
     <input className={field} type="number" inputMode="decimal" min=".01" step=".01" value={newAmount} onChange={e=>setNewAmount(e.target.value)}/></label>
    <label className="block text-xs">{t("Frequency","التكرار")}
     <select className={field} value={newFrequency} onChange={e=>setNewFrequency(e.target.value as ItemFrequency)}>
      <option value="monthly">{t("Monthly","شهري")}</option><option value="weekly">{t("Weekly","أسبوعي")}</option>
      <option value="quarterly">{t("Quarterly","ربع سنوي")}</option><option value="yearly">{t("Yearly","سنوي")}</option>
     </select></label>
   </div>
   {!editingItemId&&<label className="flex min-h-10 items-center gap-2 text-xs"><input type="checkbox" checked={newDue} onChange={e=>setNewDue(e.target.checked)}/>
    {t("This is a bill with a due date","هذا التزام له موعد دفع")}</label>}
   {newDue&&!editingItemId&&<div className="grid grid-cols-2 gap-2">
    <label className="text-xs">{t("Next due date","موعد الدفع القادم")}
     <input className={field} type="date" value={newDueDate} onChange={e=>setNewDueDate(e.target.value)}/></label>
    <label className="text-xs">{t("Bill frequency","تكرار الدفعة")}
     <select className={field} value={newDueFrequency} onChange={e=>setNewDueFrequency(e.target.value as typeof newDueFrequency)}>
      <option value="once">{t("Once","مرة واحدة")}</option><option value="monthly">{t("Monthly","شهري")}</option>
      <option value="quarterly">{t("Quarterly","ربع سنوي")}</option><option value="yearly">{t("Yearly","سنوي")}</option>
     </select></label>
   </div>}
   <div className="flex gap-2"><button type="submit" className="min-h-10 rounded-xl bg-[#3C8E62] px-4 text-xs font-bold text-white">{editingItemId?t("Save changes","حفظ التعديلات"):t("Save line","حفظ البند")}</button>
    <button type="button" className={btn} onClick={()=>{setShowNewItem(false);setEditingItemId(null);}}>{t("Cancel","إلغاء")}</button></div>
  </form>}
  <div className="space-y-2">
   <h4 className="text-sm font-extrabold text-[#3D7957]">{t("Your costs","بنود المصاريف")}</h4>
   {items.map(item=>{
    const value=monthlyItemCost(item),actual=itemPaid(item.id);
    const linked=bills.some(b=>b.budgetItemId===item.id);
    return <div key={item.id} className="rounded-xl border border-[#E0EADD] bg-white p-3">
     <div className="flex flex-wrap items-center justify-between gap-2">
      <div className="min-w-0"><strong className="block text-sm text-[#365943]">{item.name}</strong>
       <p className="text-[11px] text-[#718574]">{t("Monthly equivalent","المعادل الشهري")}: {show(value)}
        {" · "}{t("Paid this month","مدفوع هذا الشهر")}: {show(actual)}</p></div>
      <div className="flex flex-wrap gap-2">
       {!linked&&<button type="button" className={btn} disabled={state.demo} onClick={()=>startPayment(item.id)}>{t("Record payment","تسجيل دفعة")}</button>}
       <button type="button" className={btn} disabled={state.demo} onClick={()=>beginEditItem(item)}>{t("Edit","تعديل")}</button>
       <button type="button" className="min-h-10 px-2 text-xs font-bold text-[#985E61]" disabled={state.demo}
        onClick={()=>{if(window.confirm(t("Remove this line from future budgets? Recorded payments will remain in history.",
         "إيقاف هذا البند من الميزانية القادمة؟ الدفعات السابقة محفوظة.")))setState(s=>stopCategoryItem(s,item.id));}}>
         {t("Remove","إزالة")}</button>
      </div>
     </div>
     {linked&&<p className="mt-1 text-[11px] text-[#7B8D79]">{t("This item has a scheduled bill below; record its payments there to avoid duplicates.",
       "لهذا البند فاتورة مجدولة أدناه؛ سجّل الدفعات هناك لتجنب التكرار.")}</p>}
    </div>;
   })}
   <div className="rounded-xl border border-dashed border-[#CFDDCE] bg-white p-3">
    <div className="flex flex-wrap items-center justify-between gap-2">
     <p className="text-xs text-[#5E7967]">{t("Other category spending (no subcategory needed)","مصاريف أخرى ضمن الفئة (بدون تفاصيل)")}</p>
     <button type="button" disabled={state.demo} className={btn} onClick={()=>startPayment()}>{t("Record spending","تسجيل مصروف")}</button>
    </div>
    {spending.unassigned>0&&<p className="mt-1 text-xs text-[#687D6E]">{t("Paid this month without subcategory: ","مدفوع هذا الشهر بدون بند: ")}{show(spending.unassigned)}</p>}
   </div>
  </div>
  <div className="space-y-2">
   <div className="flex flex-wrap items-center justify-between gap-2"><h4 className="text-sm font-extrabold text-[#3D7957]">{t("Due payments","الدفعات المستحقة")}</h4>
    <button type="button" disabled={state.demo} className={btn} onClick={()=>{setEditingBillId(null);setBillName("");setBillAmount("");setBillForm(x=>!x);setShowNewItem(false);setError("");}}>
     + {t("Set a due date","إضافة موعد دفع")}</button></div>
   <p className="text-xs text-[#778776]">{t("A dated bill stays inside its category. It is not added a second time to your monthly plan.",
    "الفاتورة المؤرخة تبقى ضمن الفئة، ولا تضاف مرة ثانية لخطة الشهر.")}</p>
   {billForm&&<form className="space-y-2 rounded-xl border bg-white p-3" onSubmit={addBill}>
    <label className="block text-xs">{t("Payment name","اسم الدفعة")}
     <input className={field} value={billName} maxLength={60} onChange={e=>setBillName(e.target.value)} placeholder={t("Rent, school fees","الإيجار، الرسوم المدرسية")}/></label>
    <div className="grid grid-cols-2 gap-2">
     <label className="text-xs">{t("Amount (JOD)","المبلغ")}<input className={field} type="number" step=".01" min=".01" value={billAmount} onChange={e=>setBillAmount(e.target.value)}/></label>
     <label className="text-xs">{t("Due date","موعد الدفع")}<input className={field} type="date" value={billDate} onChange={e=>setBillDate(e.target.value)}/></label>
    </div>
    <label className="block text-xs">{t("Repeats","يتكرر")}
     <select className={field} value={billFrequency} onChange={e=>setBillFrequency(e.target.value as typeof billFrequency)}>
      <option value="once">{t("Once","مرة")}</option><option value="monthly">{t("Monthly","شهري")}</option>
      <option value="quarterly">{t("Quarterly","ربع سنوي")}</option><option value="yearly">{t("Yearly","سنوي")}</option>
     </select></label>
    <div className="flex gap-2"><button type="submit" className="min-h-10 rounded-xl bg-[#3C8E62] px-4 text-xs font-bold text-white">{editingBillId?t("Save bill changes","حفظ تعديل الفاتورة"):t("Save due date","حفظ الموعد")}</button>
     <button type="button" onClick={()=>{setBillForm(false);setEditingBillId(null);}} className={btn}>{t("Cancel","إلغاء")}</button></div>
   </form>}
   {dueRows.map(row=><div key={row.bill.id+":"+row.date} className="rounded-xl border border-[#E0EADD] bg-white p-3">
    <div className="flex flex-wrap items-center justify-between gap-2">
     <div><strong className="block text-sm">{row.bill.name}</strong>
      <p className="mt-1 text-xs text-[#718574]">{t("Due","مستحق")}: {row.date}
       {" · "}{t("Total","الإجمالي")}: {show(row.bill.amount)}
       {" · "}{t("Paid","مدفوع")}: {show(row.paid)}</p>
      <p className="mt-1 text-xs font-bold text-[#388159]">{row.remaining===0?t("Paid in full","مدفوع بالكامل"):
       row.paid>0?t("Partially paid · outstanding ","مدفوع جزئياً · المتبقي ")+show(row.remaining):
        t("Unpaid · outstanding ","غير مدفوع · المتبقي ")+show(row.remaining)}</p>
     </div>
     <div className="flex flex-wrap gap-1">
      {row.remaining>0&&<button type="button" disabled={state.demo} className={btn}
       onClick={()=>startPayment(row.bill.budgetItemId,row.bill.id,row.date)}>{t("Pay full / partial","دفع كامل / جزئي")}</button>}
      <button type="button" disabled={state.demo} className={btn} onClick={()=>beginEditBill(row.bill.id)}>{t("Edit due date","تعديل الموعد")}</button>
      <button type="button" disabled={state.demo} className="min-h-10 px-2 text-xs font-bold text-[#98666A]" onClick={()=>stopBill(row.bill.id)}>
       {t("Stop bill","إيقاف")}</button>
     </div>
    </div>
   </div>)}
   {!bills.length&&<p className="rounded-xl bg-white p-3 text-xs text-[#748879]">{t("No dated commitments in this category. This is optional.",
    "لا توجد دفعات مؤرخة بهذه الفئة، وهي اختيارية.")}</p>}
   {bills.length>0&&dueRows.length===0&&<p className="rounded-xl bg-white p-3 text-xs text-[#748879]">{t("No unpaid dates in the next year. Your saved bill records are retained.",
     "لا توجد مواعيد غير مدفوعة خلال السنة المقبلة. السجلات محفوظة.")}</p>}
  </div>
  {paymentTarget&&<form className="space-y-2 rounded-xl border-2 border-[#9FCDB0] bg-white p-3" onSubmit={pay} aria-label={t("Record payment","تسجيل الدفعة")}>
   <h4 className="text-sm font-extrabold text-[#377E57]">{t("Record a full or partial payment","تسجيل دفعة كاملة أو جزئية")}</h4>
   <div className="grid grid-cols-2 gap-2">
    <label className="text-xs">{t("Paid amount (JOD)","المبلغ المدفوع")}
     <input autoFocus className={field} type="number" step=".01" min=".01" value={payAmount} onChange={e=>setPayAmount(e.target.value)}/></label>
    <label className="text-xs">{t("Paid on","تاريخ الدفع")}<input className={field} type="date" value={payDate} onChange={e=>setPayDate(e.target.value)}/></label>
   </div>
   {paymentTarget.billId&&paymentTarget.dueDate&&<button type="button" className={btn} onClick={()=>setPayAmount(String(billOutstanding(state,paymentTarget.billId!,paymentTarget.dueDate!)))}>
    {t("Fill remaining balance","تعبئة كامل المتبقي")}: {show(billOutstanding(state,paymentTarget.billId,paymentTarget.dueDate))}</button>}
   <p className="text-xs text-[#7A887D]">{t("This records one actual payment. It never deducts your manually entered cash again.",
    "هذا يسجل دفعة واحدة، ولا يخصمها مجدداً من السيولة المدخلة يدوياً.")}</p>
   <div className="flex gap-2"><button type="submit" className="min-h-10 rounded-xl bg-[#398A60] px-4 text-xs font-bold text-white">{t("Confirm payment","تأكيد الدفعة")}</button>
    <button type="button" className={btn} onClick={()=>{setPaymentTarget(null);setError("");}}>{t("Cancel","إلغاء")}</button></div>
  </form>}
  <div className="space-y-2">
   <h4 className="text-sm font-extrabold text-[#3D7957]">{t("Payment history","سجل الدفعات")}</h4>
   {(showAllHistory?recent:recent.slice(0,6)).map(e=><div key={e.id} className="flex items-center justify-between gap-2 rounded-xl bg-white p-3">
    <div className="min-w-0"><p className="truncate text-xs font-bold">{e.note??items.find(i=>i.id===e.budgetItemId)?.name??pastDue(e.billId??"")?.name??category.name}</p>
     <p className="text-[11px] text-[#76897B]">{e.date}{e.billId?" · "+t("Scheduled payment","دفعة مجدولة"):""}</p></div>
    <div className="flex shrink-0 items-center gap-2"><strong className="text-xs text-[#357D55]">{show(e.amount)}</strong>
     {!state.demo&&!e.cashDeducted&&!e.sourcePlanId&&!e.sourceOccasionCost&&<button type="button" className="min-h-10 text-xs font-bold text-[#9A5B62]"
      onClick={()=>{if(window.confirm(t("Undo this payment only? Other payments stay unchanged.",
       "إلغاء هذه الدفعة فقط؟ تبقى باقي الدفعات محفوظة.")))setState(s=>undoCategoryPayment(s,e.id));}}>{t("Undo","تراجع")}</button>}</div>
   </div>)}
   {!recent.length&&<p className="rounded-xl bg-white p-3 text-xs text-[#728675]">{t("No payments recorded in this category yet.","لم تُسجل دفعات بهذه الفئة بعد.")}</p>}
   {recent.length>6&&<button type="button" className={btn} onClick={()=>setShowAllHistory(x=>!x)}>{showAllHistory?t("Show less","عرض أقل"):t("Show all payments","عرض كل الدفعات")}</button>}
  </div>
  {error&&<p role="alert" className="rounded-xl bg-[#FFF0EE] p-3 text-xs font-bold text-[#A2535A]">{error}</p>}
  <p className="text-[11px] leading-relaxed text-[#788A7C]">{t("A monthly budget is not a bill. Remaining allowance is not necessarily a debt. All amounts are device-entered, not bank-verified.",
    "ميزانية الشهر ليست فاتورة؛ المتبقي من المخصص ليس دائماً ديناً. الأرقام مدخلة يدوياً وغير مؤكدة من البنك.")}</p>
 </section>;
}
