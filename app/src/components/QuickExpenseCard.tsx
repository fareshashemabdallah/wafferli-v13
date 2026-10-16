import {useState,type FormEvent} from "react";
import {Link} from "@tanstack/react-router";
import {CheckCircle2,Receipt,X} from "lucide-react";
import {useI18n} from "@/lib/i18n";
import {useLocalState,fmtJOD,uid} from "@/lib/storage";
import {sampleMoney,type MoneyState} from "@/lib/money";
import {localToday} from "@/lib/cashflow";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";

export type QuickExpenseDraft={id:string;amount:string;categoryId:string;note:string};
/** Never adjusts a bank balance. Idempotent within one action attempt. */
export function saveQuickExpense(money:MoneyState,draft:QuickExpenseDraft,day:string):MoneyState{
 const amount=Number(draft.amount);
 if(money.demo||!draft.id||!/^\w[\w-]{4,90}$/.test(draft.id)||
    !Number.isFinite(amount)||amount<=0||amount>100000||
    Math.abs(amount*100-Math.round(amount*100))>0.000001||
    !money.categories.some(c=>c.id===draft.categoryId)||
    !/^\d{4}-\d{2}-\d{2}$/.test(day)||
    draft.note.length>160)return money;
 if(money.expenses.some(e=>e.id===draft.id))return money;
 return {...money,expenses:[{
  id:draft.id,date:day,categoryId:draft.categoryId,
  amount:Math.round(amount*100)/100,
  note:draft.note.trim().slice(0,160),shared:false,status:"paid"
 },...money.expenses]};
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
 const record=(e:FormEvent)=>{
  e.preventDefault();
  if(!ready||saved)return;
  const draft={id,amount,categoryId,note};
  if(saveQuickExpense(money,draft,localToday())===money){
   setError(ar?"راجع المبلغ والفئة. يجب أن يكون المبلغ بالدينار مع منزلتين عشريتين كحد أقصى.":
    "Check the amount and category. Enter a positive JOD amount with at most two decimals.");
   return;
  }
  setError("");
  setMoney(prev=>saveQuickExpense(prev,draft,localToday()));
 };
 return <section id="quick-expense" className="mt-3 scroll-mt-24 rounded-2xl border border-[#D4E4D3] bg-[#F4F8EF] p-4 sm:p-5"
  aria-label={ar?"تسجيل مصروف سريع":"Quick expense entry"}>
  <div className="flex items-start justify-between gap-3">
   <div>
    <div className="flex items-center gap-2"><Receipt className="size-5 text-brand"/>
     <h2 className="text-lg font-semibold">{ar?"سجّل مصروفاً":"Add an expense"}</h2></div>
    <p className="mt-1 text-xs text-muted-foreground">
     {ar?"يُحفظ على هذا الجهاز فقط، ولا يخصم من رصيد البنك.":"Saved on this device only; does not deduct money from your bank balance."}
    </p>
   </div>
   <button type="button" onClick={onClose} aria-label={ar?"إغلاق":"Close"}
    className="grid min-h-11 min-w-11 place-items-center rounded-lg bg-white text-brand">
    <X className="size-5"/>
   </button>
  </div>
  {!ready?<p className="mt-3 text-sm">{ar?"جارٍ فتح المالية…":"Loading Money…"}</p>:
  money.demo?<div className="mt-4 space-y-2 rounded-xl bg-white p-4 text-sm">
   <p>{ar?"لا يمكنك تسجيل مصروف حقيقي فوق الأرقام التجريبية. ابدأ بميزانية بيتك أولاً.":"You cannot record real spending while Money contains example figures. Set up your own budget first."}</p>
   <Link to="/money" className="inline-flex min-h-11 items-center font-semibold text-brand underline">
    {ar?"ابدأ بميزانيتي":"Set up My Money"} →
   </Link>
  </div>:
  money.categories.length===0?<div className="mt-4 space-y-2 rounded-xl bg-white p-4 text-sm">
   <p>{ar?"أضف فئة للمصاريف في المالية أولاً.":"Add an expense category in Money first."}</p>
   <Link to="/money" className="inline-flex min-h-11 items-center font-semibold text-brand underline">
    {ar?"إدارة المالية":"Go to Money"} →
   </Link>
  </div>:saved?<div role="status" className="mt-4 rounded-xl bg-white p-4">
   <div className="flex items-center gap-2 text-brand"><CheckCircle2 className="size-5"/><strong>
    {ar?"تم تسجيل المصروف مرة واحدة":"Expense recorded once"}
   </strong></div>
   <p className="mt-2 text-sm">{fmtJOD(Number(amount))} · {tr(money.categories.find(c=>c.id===categoryId)?.name??"")}</p>
   <div className="mt-3 flex flex-wrap gap-3">
    <Button onClick={()=>{setId(uid());setAmount("");setNote("");setError("");}}>
     {ar?"مصروف جديد":"Add another"}
    </Button>
    <Link to="/money" className="inline-flex min-h-11 items-center text-sm font-semibold text-brand underline">
     {ar?"افتح المالية":"Review Money"} →
    </Link>
   </div>
  </div>:
  <form onSubmit={record} className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr]">
   <label className="block text-sm font-medium">{ar?"المبلغ (دينار)":"Amount (JOD)"}
    <Input required className="mt-1 bg-white" inputMode="decimal" type="number" min=".01" max="100000" step=".01"
     placeholder={ar?"مثلاً ٨٫٥٠":"e.g. 8.50"} value={amount} onChange={e=>setAmount(e.target.value)}/>
   </label>
   <label className="block text-sm font-medium">{ar?"فئة المصروف":"Category"}
    <select required value={categoryId} onChange={e=>setCategoryId(e.target.value)}
     className="mt-1 min-h-11 w-full rounded-xl border border-input bg-white px-3 text-sm">
     <option value="">{ar?"اختر الفئة":"Choose category"}</option>
     {money.categories.map(cat=><option key={cat.id} value={cat.id}>{tr(cat.name)}</option>)}
    </select>
   </label>
   <label className="block text-sm font-medium sm:col-span-2">{ar?"ملاحظة (اختياري)":"Note (optional)"}
    <Input className="mt-1 bg-white" maxLength={160} value={note} onChange={e=>setNote(e.target.value)}
     placeholder={ar?"مثلاً: مشتريات المدرسة":"e.g. School supplies"}/>
   </label>
   {error&&<p role="alert" className="text-sm text-destructive sm:col-span-2">{error}</p>}
   <Button type="submit" className="min-h-11 sm:col-span-2" disabled={!amount||!categoryId}>
    {ar?"احفظ المصروف":"Save expense"}
   </Button>
  </form>}
 </section>;
}
