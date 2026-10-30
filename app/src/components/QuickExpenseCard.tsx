import {frenchUI} from "@/lib/french";
import {useState,type FormEvent} from "react";
import {Link} from "@tanstack/react-router";
import {CheckCircle2,Receipt,X} from "lucide-react";
import {useI18n} from "@/lib/i18n";
import {useLocalState,fmtJOD,uid} from "@/lib/storage";
import {sampleMoney,type MoneyState} from "@/lib/money";
import {localToday} from "@/lib/cashflow";
import {recordConfirmedExpense} from "@/lib/confirmedExpense";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";

export type QuickExpenseDraft={id:string;amount:string;categoryId:string;note:string};
/** Never adjusts a bank balance. Idempotent within one action attempt. */
export function saveQuickExpense(money:MoneyState,draft:QuickExpenseDraft,day:string):MoneyState{
 const amount=Number(draft.amount);
 if(money.demo||!draft.id||!/^\w[\w-]{4,90}$/.test(draft.id)||
    !Number.isFinite(amount)||amount<=0||amount>100000||
    Math.abs(amount*100-Math.round(amount*100))>0.000001||
    !(draft.categoryId==="uncategorized"||money.categories.some(c=>c.id===draft.categoryId))||
    !/^\d{4}-\d{2}-\d{2}$/.test(day)||
    draft.note.length>160)return money;
 return recordConfirmedExpense(money,{id:draft.id,date:day,categoryId:draft.categoryId,
  amount,note:draft.note},"untracked");
}

/** Three fields at most; only genuine entered numbers can become Money expenses. */
export function QuickExpenseCard({onClose}:{onClose:()=>void}){
 const {lang,tr}=useI18n(),ar=lang==="ar";
 const [money,setMoney,ready]=useLocalState<MoneyState>("money",sampleMoney());
 const [id,setId]=useState(()=>uid());
 const [amount,setAmount]=useState("");
 const [categoryId,setCategoryId]=useState("");
 const [note,setNote]=useState("");
 const [error,setError]=useState("");
 const saved=money.expenses.some(e=>e.id===id);
 // Only a genuinely recorded category may be preselected; never guess from demo data.
 const recentCategory=!money.demo?money.expenses.find(e=>e.status!=="planned"&&money.categories.some(c=>c.id===e.categoryId))?.categoryId:"";
 const selectedCategoryId=categoryId||(recentCategory??"")||(money.categories.length===0?"uncategorized":"");
 const record=(e:FormEvent)=>{
  e.preventDefault();
  if(!ready||saved)return;
  const draft={id,amount,categoryId:selectedCategoryId,note};
  if(saveQuickExpense(money,draft,localToday())===money){
   setError(ar?"راجع المبلغ والفئة. يجب أن يكون المبلغ بالدينار مع منزلتين عشريتين كحد أقصى.":(lang==="fr"?frenchUI("Check the amount and category. Enter a positive JOD amount with at most two decimals."):"Check the amount and category. Enter a positive JOD amount with at most two decimals."));
   return;
  }
  setError("");
  setMoney(prev=>saveQuickExpense(prev,draft,localToday()));
 };
 return <section id="quick-expense" className="mt-3 scroll-mt-24 rounded-2xl border border-[#D4E4D3] bg-[#F4F8EF] p-4 sm:p-5"
  aria-label={ar?"تسجيل مصروف سريع":(lang==="fr"?frenchUI("Quick expense entry"):"Quick expense entry")}>
  <div className="flex items-start justify-between gap-3">
   <div>
    <div className="flex items-center gap-2"><Receipt className="size-5 text-brand"/>
     <h2 className="text-lg font-semibold">{ar?"سجّل مصروفاً":(lang==="fr"?frenchUI("Add an expense"):"Add an expense")}</h2></div>
    <p className="mt-1 text-xs text-muted-foreground">
     {ar?"يُحفظ على هذا الجهاز فقط، ولا يخصم من رصيد البنك.":(lang==="fr"?frenchUI("Saved on this device only; does not deduct money from your bank balance."):"Saved on this device only; does not deduct money from your bank balance.")}
    </p>
   </div>
   <button type="button" onClick={onClose} aria-label={ar?"إغلاق":(lang==="fr"?frenchUI("Close"):"Close")}
    className="grid min-h-11 min-w-11 place-items-center rounded-lg bg-white text-brand">
    <X className="size-5"/>
   </button>
  </div>
  {!ready?<p className="mt-3 text-sm">{ar?"جارٍ فتح المالية…":(lang==="fr"?frenchUI("Loading Money…"):"Loading Money…")}</p>:
  money.demo?<div className="mt-4 space-y-2 rounded-xl bg-white p-4 text-sm">
   <p>{ar?"لا يمكنك تسجيل مصروف حقيقي فوق الأرقام التجريبية. ابدأ بميزانية بيتك أولاً.":(lang==="fr"?frenchUI("You cannot record real spending while Money contains example figures. Set up your own budget first."):"You cannot record real spending while Money contains example figures. Set up your own budget first.")}</p>
   <Link to="/money" className="inline-flex min-h-11 items-center font-semibold text-brand underline">
    {ar?"ابدأ بميزانيتي":(lang==="fr"?frenchUI("Set up My Money"):"Set up My Money")} →
   </Link>
  </div>:
  saved?<div role="status" className="mt-4 rounded-xl bg-white p-4">
   <div className="flex items-center gap-2 text-brand"><CheckCircle2 className="size-5"/><strong>
    {ar?"تم تسجيل المصروف مرة واحدة":(lang==="fr"?frenchUI("Expense recorded once"):"Expense recorded once")}
   </strong></div>
   <p className="mt-2 text-sm">{fmtJOD(Number(amount))} · {selectedCategoryId==="uncategorized"?(ar?"بدون تصنيف بعد":(lang==="fr"?frenchUI("Uncategorized for now"):"Uncategorized for now")):tr(money.categories.find(c=>c.id===selectedCategoryId)?.name??"")}</p>
   <div className="mt-3 flex flex-wrap gap-3">
    <Button onClick={()=>{setId(uid());setAmount("");setNote("");setError("");}}>
     {ar?"مصروف جديد":(lang==="fr"?frenchUI("Add another"):"Add another")}
    </Button>
    <Link to="/money" className="inline-flex min-h-11 items-center text-sm font-semibold text-brand underline">
     {ar?"افتح المالية":(lang==="fr"?frenchUI("Review Money"):"Review Money")} →
    </Link>
   </div>
  </div>:
  <form onSubmit={record} className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr]">
   <label className="block text-sm font-medium">{ar?"المبلغ (دينار)":(lang==="fr"?frenchUI("Amount (JOD)"):"Amount (JOD)")}
    <Input required autoFocus className="mt-1 bg-white" inputMode="decimal" type="number" min=".01" max="100000" step=".01"
     placeholder={ar?"مثلاً ٨٫٥٠":(lang==="fr"?frenchUI("e.g. 8.50"):"e.g. 8.50")} value={amount} onChange={e=>setAmount(e.target.value)}/>
   </label>
   <label className="block text-sm font-medium">{ar?"فئة المصروف":(lang==="fr"?frenchUI("Category"):"Category")}
    <select required aria-label={ar?"فئة المصروف":(lang==="fr"?frenchUI("Category"):"Category")} value={selectedCategoryId} onChange={e=>setCategoryId(e.target.value)}
     className="mt-1 min-h-11 w-full rounded-xl border border-input bg-white px-3 text-sm">
     <option value="">{ar?"اختر الفئة":(lang==="fr"?frenchUI("Choose category"):"Choose category")}</option>
     <option value="uncategorized">{ar?"مش متأكد بعد (بدون تصنيف)":(lang==="fr"?frenchUI("Not sure yet (uncategorized)"):"Not sure yet (uncategorized)")}</option>
     {money.categories.map(cat=><option key={cat.id} value={cat.id}>{tr(cat.name)}</option>)}
    </select>
    {money.categories.length===0&&<span className="mt-1 block text-xs text-muted-foreground">{ar?"ما رح نخترع ميزانية أو فئة. فيك تصنّف المصروف لاحقاً.":(lang==="fr"?frenchUI("No budget or category will be invented. Classify this purchase later if you wish."):"No budget or category will be invented. Classify this purchase later if you wish.")}</span>}
    {recentCategory&&<span className="mt-1 block text-[11px] text-muted-foreground">{ar?"الفئة الأخيرة محدّدة، تأكد أنها مناسبة.":(lang==="fr"?frenchUI("Last-used category selected. Please confirm it fits."):"Last-used category selected. Please confirm it fits.")}</span>}
   </label>
   <label className="block text-sm font-medium sm:col-span-2">{ar?"ملاحظة (اختياري)":(lang==="fr"?frenchUI("Note (optional)"):"Note (optional)")}
    <Input className="mt-1 bg-white" maxLength={160} value={note} onChange={e=>setNote(e.target.value)}
     placeholder={ar?"مثلاً: مشتريات المدرسة":(lang==="fr"?frenchUI("e.g. School supplies"):"e.g. School supplies")}/>
   </label>
   {error&&<p role="alert" className="text-sm text-destructive sm:col-span-2">{error}</p>}
   <Button type="submit" className="min-h-11 sm:col-span-2" disabled={!amount||!selectedCategoryId}>
    {ar?"احفظ المصروف":(lang==="fr"?frenchUI("Save expense"):"Save expense")}
   </Button>
  </form>}
 </section>;
}
