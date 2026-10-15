import { createFileRoute } from "@tanstack/react-router";
import { CashFlowPlanner } from "@/components/CashFlowPlanner";
import { MoneyGuidance } from "@/components/MoneyGuidance";
import {reverseVarianceAllocation} from "@/lib/financeAlignment";
import { MoneyOverviewPanel } from "@/components/MoneyOverviewPanel";
import { localToday } from "@/lib/cashflow";
import { Pencil, Plus, RotateCcw, ShieldCheck, Trash2 } from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { AppShell, PilotBadge } from "@/components/AppShell";
import { Field, NativeSelect, inputCls } from "@/components/Field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { useI18n } from "@/lib/i18n";
import { computeMoney, sampleMembers, sampleMoney, type CatType, type Category, type Expense, type Member } from "@/lib/money";
import { fmtJOD, parseAmount, uid, useLocalState } from "@/lib/storage";

export const Route = createFileRoute("/money")({
  head: () => ({
    meta: [
      { title: "Our Finances — Dabberna" },
      { name: "description", content: "Plan your household budget, log expenses and see your real remaining allowance and savings projection." },
      { property: "og:title", content: "Our Finances — Dabberna" },
      { property: "og:description", content: "Household budget, actual spending and savings projection." },
    ],
  }),
  component: MoneyPage,
});

const today = localToday;

function MoneyPage() {
  const { tr } = useI18n();
  const { lang } = useI18n();
  const ar=lang==="ar";
  const [section,setSection]=useState<"overview"|"spending"|"planning">("overview");
  const [s, setS, ready] = useLocalState("money", sampleMoney());
  const [members] = useLocalState<Member[]>("members", sampleMembers());
  const c = useMemo(() => computeMoney(s), [s]);

  if (!ready)
    return (
      <AppShell title={tr("Our Finances")}>
        <div className="grid gap-3 sm:grid-cols-2">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}</div>
      </AppShell>
    );

  const upd = (p: Partial<typeof s>) => setS((prev) => ({ ...prev, ...p, demo: prev.demo }));

  return (
    <AppShell title={tr("Our Finances")}>
      <section className="page-intro relative mb-5 overflow-hidden">
        <div className="pointer-events-none absolute -end-10 -top-16 size-44 rounded-full border-[22px] border-white/30" aria-hidden="true"/>
        <div className="relative flex items-center gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-white/85 text-brand"><ShieldCheck className="size-6"/></span>
          <div>
            <p className="section-eyebrow">{ar?"قرارات مالية أهدأ":"FINANCIAL PEACE OF MIND"}</p>
            <p className="mt-1 text-sm leading-relaxed text-[#4B6758]">{ar?"خطة بسيطة تساعدك تعيش براحة، مش بس توفّر.":"A clearer plan for living well—not simply spending less."}</p>
          </div>
        </div>
      </section>
      <div role="tablist" aria-label={ar?"أقسام المالية":"Money sections"} className="mb-5 grid grid-cols-3 gap-1 rounded-2xl border border-[#E1E8DF] bg-[#EEF2EB] p-1.5">
        {([{id:"overview",en:"Overview",ar:"لمحة"},{id:"spending",en:"Spending",ar:"مصاريف"},{id:"planning",en:"Bills & plan",ar:"الفواتير"}] as const)
          .map(v=><button role="tab" aria-selected={section===v.id} key={v.id} type="button" onClick={()=>setSection(v.id)}
            className={"min-h-11 rounded-xl px-2 text-xs font-semibold transition sm:text-sm "+(section===v.id?"bg-white text-brand shadow-sm":"text-[#64796C] hover:bg-white/60")}>{ar?v.ar:v.en}</button>)}
      </div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {s.demo && <PilotBadge>{tr("Demo data")}</PilotBadge>}
        <span className="text-xs text-muted-foreground">{tr("Saved on this device only. Use fictional figures during the pilot.")}</span>
        <details className="ms-auto"><summary className="cursor-pointer text-xs font-medium text-muted-foreground">Settings / إعدادات</summary>
        <div className="mt-2">        <Button
          variant="outline"
          size="sm"
          className="ms-auto"
          onClick={() => {
            if (confirm(tr("Reset all money data to the demo sample?"))) {
              setS(sampleMoney());
              toast.success(tr("Sample data restored"));
            }
          }}
        >
          <RotateCcw className="size-4" /> {tr("Reset sample data")} </Button>
        </div></details>
      </div>

      {section==="overview"&&<MoneyOverviewPanel state={s} setState={setS} goTo={setSection}/>}
      {section==="planning"&&<>
      <section className="editorial-card mb-4 p-4 sm:p-5">
        <h2 className="text-lg font-semibold">{ar?"دخل الشهر وهدف الادخار":"Monthly income & savings goal"}</h2>
        <Settings key={`${c.monthlyIncome}:${c.savingsTarget}`} income={c.monthlyIncome} target={c.savingsTarget} hasSources={s.incomeSources!==undefined}
         onSave={(income,savingsTargetAmount)=>upd(s.incomeSources===undefined?{income,savingsTargetAmount}:{savingsTargetAmount})}/>
      </section>
      <MoneyGuidance scope="variance" state={s} setState={setS}/>
      <CashFlowPlanner state={s} members={members} update={setS} />
      </>}
      {section==="spending"&&<>
      <MoneyGuidance scope="variance" state={s} setState={setS}/>
      <Expenses
        cats={s.categories}
        members={members}
        expenses={s.expenses}
        onChange={(expenses) => upd({ expenses })}
        cashBalance={s.cashOnHand??null}
        onConfirmPlanned={(expenseId,amount,mode)=>setS(prev=>{
          if(mode==="deduct"&&(prev.cashOnHand==null||prev.cashOnHand<amount))return prev;
          return {...prev,expenses:prev.expenses.map(e=>e.id===expenseId?{...e,amount,status:"paid" as const,
            date:today(),plannedAmount:e.plannedAmount??e.amount,cashDeducted:mode==="deduct"}:e),
            ...(mode==="deduct"&&prev.cashOnHand!=null?{cashOnHand:Math.round((prev.cashOnHand-amount)*100)/100,cashUpdatedAt:today()}:{})};
        })}
        onDelete={(expense)=>setS(previous=>{
          const base=reverseVarianceAllocation(previous,expense.id);
          if(expense.allocation&&base===previous)return previous;
          const expenses=base.expenses.filter(e=>e.id!==expense.id);
          if(!expense.billId || !expense.dueDate)return {...base,expenses};
          const commitments=(base.commitments??[]).map(b=>b.id===expense.billId?{
            ...b,paidDates:(b.paidDates??[]).filter(d=>d!==expense.dueDate)
          }:b);
          return {...base,expenses,commitments};
        })}
      />
      <details className="editorial-card mt-4 px-4 py-3">
        <summary className="cursor-pointer text-sm font-semibold text-brand">{ar?"إدارة فئات المصاريف":"Manage spending categories"} +</summary>
        <Categories cats={s.categories} spentBy={c.spentBy} plannedBy={c.plannedBy} onChange={(categories) => upd({categories})}/>
      </details>
      </>}
    </AppShell>
  );
}

function Stat({ label, value, sub, warn }: { label: string; value: string; sub: string; warn?: boolean }) {
  const { tr } = useI18n();
  return (
    <div className="card-soft p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold">{value}</p>
      <p className={`text-xs ${warn ? "font-semibold text-destructive" : "text-muted-foreground"}`}>{sub}</p>
    </div>
  );
}

function Settings({income,target,hasSources,onSave}:{income:number;target:number;hasSources:boolean;onSave:(income:number,target:number)=>void}){
 const {lang}=useI18n(),ar=lang==="ar";
 const [inc,setInc]=useState(String(income)),[goal,setGoal]=useState(String(target)),[err,setErr]=useState("");
 const save=(e:FormEvent)=>{
   e.preventDefault();
   const i=hasSources?income:Number(inc),amount=Number(goal);
   if(!Number.isFinite(i)||i<0||i>100000)return setErr(ar?"أدخل دخلاً صحيحاً.":"Enter a valid monthly income.");
   if(!Number.isFinite(amount)||amount<0||amount>100000)return setErr(ar?"أدخل هدف ادخار صحيحاً.":"Enter a valid savings goal.");
   setErr("");onSave(i,Math.round(amount*100)/100);
   toast.success(ar?"تم تحديث الدخل وهدف الادخار.":"Income and savings goal updated.");
 };
 return <section className="mt-4">
  <p className="text-xs text-muted-foreground">{ar?"هدف الادخار مبلغ شهري بالدينار. التعديل ينعكس على مقارنة الميزانية فوراً.":"Set the monthly savings goal in JOD. Your Overview updates immediately."}</p>
  <form onSubmit={save} className="mt-3 grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
   <Field label={ar?"الدخل الشهري (د.أ)":"Monthly income (JOD)"}>
    <Input inputMode="decimal" className={inputCls} disabled={hasSources} value={hasSources?String(income):inc} onChange={e=>setInc(e.target.value)}/>
   </Field>
   <Field label={ar?"هدف الادخار شهرياً (د.أ)":"Monthly savings goal (JOD)"}>
    <Input inputMode="decimal" className={inputCls} value={goal} onChange={e=>setGoal(e.target.value)}/>
   </Field>
   <Button type="submit" className="h-11">{ar?"حفظ":"Save"}</Button>
   {hasSources&&<p className="text-xs text-muted-foreground sm:col-span-3">{ar?"تعديل مصدر الدخل من قائمة الدخل أعلاه.":"Edit monthly income through the Income schedule above."}</p>}
  </form>
  {err&&<p className="mt-2 text-sm text-destructive" role="alert">{err}</p>}
 </section>;
}

const typeLabel: Record<CatType, string> = { fixed: "Fixed", variable: "Variable", periodic: "Periodic" };

function Categories({ cats, spentBy, plannedBy, onChange }: { cats: Category[]; spentBy: (id: string) => number; plannedBy:(id:string)=>number; onChange: (c: Category[]) => void }) {
  const { tr,lang } = useI18n();
  const [editing, setEditing] = useState<Category | null>(null);
  return (
    <section className="card-soft mt-6 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{tr("Spending categories")}</h2>
        <Button size="sm" variant="secondary" onClick={() => setEditing({ id: "", name: "", type: "variable", planned: 0 })}>
          <Plus className="size-4" /> {tr("Add")} </Button>
      </div>
      {editing && (
        <CategoryForm
          initial={editing}
          onCancel={() => setEditing(null)}
          onSave={(cat) => {
            onChange(cat.id && cats.some((c) => c.id === cat.id) ? cats.map((c) => (c.id === cat.id ? cat : c)) : [...cats, { ...cat, id: uid() }]);
            setEditing(null);
          }}
        />
      )}
      {cats.length === 0 && <p className="mt-3 text-sm text-muted-foreground">{tr("No categories yet. Add your first one.")}</p>}
      <ul className="mt-3 divide-y">
        {cats.map((c) => {
          const a = spentBy(c.id);
          const effective=plannedBy(c.id);
          const pct = effective ? Math.min(100, (a / effective) * 100) : 0;
          return (
            <li key={c.id} className="flex items-center gap-3 py-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate font-medium">{tr(c.name)}</span>
                  <span className="rounded-full bg-mint px-2 text-[11px] text-brand">{tr(typeLabel[c.type])}</span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div className={`h-full ${a > effective ? "bg-destructive" : "bg-brand-2"}`} style={{ width: `${pct}%` }} />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{tr("Actual")} {fmtJOD(a)} · {tr("Planned")} {fmtJOD(effective)} {effective!==c.planned&&(lang==="ar"?"(معدل لهذا الشهر)":"(adjusted this month)")}</p>
              </div>
              <Button size="icon" variant="ghost" aria-label={`Edit ${c.name}`} onClick={() => setEditing(c)}><Pencil className="size-4" /></Button>
              <Button
                size="icon"
                variant="ghost"
                aria-label={`Delete ${c.name}`}
                onClick={() => confirm(`${tr("Delete category")} "${c.name}"?`) && onChange(cats.filter((x) => x.id !== c.id))}
              >
                <Trash2 className="size-4" />
              </Button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function CategoryForm({ initial, onSave, onCancel }: { initial: Category; onSave: (c: Category) => void; onCancel: () => void }) {
  const { tr } = useI18n();
  const [name, setName] = useState(initial.name);
  const [type, setType] = useState<CatType>(initial.type);
  const [planned, setPlanned] = useState(initial.planned ? String(initial.planned) : "");
  const [err, setErr] = useState("");
  return (
    <form
      className="mt-3 grid gap-3 rounded-xl bg-muted p-3 sm:grid-cols-2"
      onSubmit={(e) => {
        e.preventDefault();
        const p = planned === "" || planned === "0" ? 0 : parseAmount(planned, 100000);
        if (!name.trim()) return setErr(tr("Name is required."));
        if (p === null) return setErr(tr("Planned amount must be 0 or a positive number."));
        onSave({ id: initial.id, name: name.trim().slice(0, 40), type, planned: p });
      }}
    >
      <Field label={tr("Name")}><Input className={inputCls} value={name} maxLength={40} onChange={(e) => setName(e.target.value)} /></Field>
      <Field label={tr("Type")}>
        <NativeSelect value={type} onChange={(e) => setType(e.target.value as CatType)}>
          <option value="fixed">{tr("Fixed (rent, bills)")}</option>
          <option value="variable">{tr("Variable (groceries, fuel)")}</option>
          <option value="periodic">{tr("Periodic (school, insurance)")}</option>
        </NativeSelect>
      </Field>
      <Field label={tr("Planned per month (JOD)")}><Input className={inputCls} inputMode="decimal" value={planned} onChange={(e) => setPlanned(e.target.value)} /></Field>
      <div className="flex items-end gap-2">
        <Button type="submit" className="h-11 flex-1">{tr("Save")}</Button>
        <Button type="button" variant="outline" className="h-11" onClick={onCancel}>{tr("Cancel")}</Button>
      </div>
      {err && <p className="text-sm text-destructive sm:col-span-2" role="alert">{err}</p>}
    </form>
  );
}

function Expenses({ cats, members, expenses, onChange, onDelete, onConfirmPlanned, cashBalance }: {
  cats: Category[]; members: Member[]; expenses: Expense[];
  onChange: (e: Expense[]) => void; onDelete: (e:Expense)=>void;
  onConfirmPlanned:(id:string,actual:number,mode:"already"|"deduct"|"untracked")=>void;
  cashBalance:number|null;
}) {
  const { tr,lang } = useI18n();
  const ar=lang==="ar";
  const blank: Expense = { id: "", date: today(), categoryId: cats[0]?.id ?? "", amount: 0, shared: true };
  const [editing, setEditing] = useState<Expense | null>(null);
  const [quickAmount, setQuickAmount] = useState("");
  const [quickExpected,setQuickExpected]=useState("");
  const [quickMode,setQuickMode]=useState<"planned"|"paid">("paid");
  const [plannedDate,setPlannedDate]=useState(today());
  const [confirming,setConfirming]=useState<string|null>(null);
  const [actualValue,setActualValue]=useState("");
  const [quickCategory, setQuickCategory] = useState(cats[0]?.id ?? "");
  const [quickError, setQuickError] = useState("");
  const selectedCategory=cats.some(x=>x.id===quickCategory)?quickCategory:(cats[0]?.id??"");
  const recordQuick=(ev:FormEvent)=>{
    ev.preventDefault();
    const amount=parseAmount(quickAmount,50000);
    if(quickMode==="planned"&&!/^\d{4}-\d{2}-\d{2}$/.test(plannedDate))return setQuickError(ar?"اختر تاريخاً متوقعاً صحيحاً.":"Choose a valid planned payment date.");
    if(amount===null)return setQuickError(tr("Enter a valid amount greater than zero (up to 50,000 JOD)."));
    if(quickMode==="paid"&&quickExpected.trim()!==""&&(!Number.isFinite(Number(quickExpected))||Number(quickExpected)<0||Number(quickExpected)>50000))return setQuickError(ar?"أدخل مبلغاً متوقعاً صحيحاً.":"Enter a valid expected amount.");
    if(!selectedCategory)return setQuickError(tr("Add a spending category first."));
    const entry:Expense={id:uid(),date:quickMode==="planned"?plannedDate:today(),categoryId:selectedCategory,amount,shared:true,status:quickMode,...(quickMode==="planned"?{plannedAmount:amount}:quickExpected.trim()?{plannedAmount:Math.round(Number(quickExpected)*100)/100}:{})};
    onChange([entry,...expenses]);
    setQuickAmount("");setQuickExpected("");setQuickError("");
    toast.success(quickMode==="planned"?(ar?"تم حفظ المصروف كمخطط، دون احتسابه كمدفوع.":"Expense planned, not counted as paid."):(ar?"تم تسجيل المصروف المدفوع.":"Paid expense recorded."));
  };
  const sorted = [...expenses].sort((a, b) => b.date.localeCompare(a.date));
  const catName = (id: string) => cats.find((c) => c.id === id)?.name ?? "Uncategorized";
  return (
    <section className="card-soft mt-6 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{ar?"المصاريف المخططة والمدفوعة":"Planned & paid expenses"}</h2>
        <Button size="sm" variant="outline" onClick={() => setEditing(blank)} disabled={cats.length === 0}>
          <Plus className="size-4" /> {tr("More details")} </Button>
      </div>
      <form onSubmit={recordQuick} className="mt-3 grid gap-2 rounded-xl bg-muted/40 p-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <div className="sm:col-span-3 flex flex-wrap gap-2" role="group" aria-label={ar?"حالة المصروف":"Expense status"}>
          <button type="button" onClick={()=>setQuickMode("paid")} aria-pressed={quickMode==="paid"} className={"min-h-10 rounded-full px-4 text-sm font-semibold "+(quickMode==="paid"?"bg-brand text-white":"border border-border bg-white text-brand")}>{ar?"مدفوع الآن":"Already paid"}</button>
          <button type="button" onClick={()=>setQuickMode("planned")} aria-pressed={quickMode==="planned"} className={"min-h-10 rounded-full px-4 text-sm font-semibold "+(quickMode==="planned"?"bg-brand text-white":"border border-border bg-white text-brand")}>{ar?"سأدفع لاحقاً":"Plan for later"}</button>
        </div>
        {quickMode==="planned"&&<div className="sm:col-span-3">
          <label className="block text-xs font-semibold">{ar?"تاريخ الدفع المتوقع":"Expected payment date"}
            <Input type="date" className="mt-1 max-w-52" value={plannedDate} onChange={e=>setPlannedDate(e.target.value)}/>
          </label>
        </div>}
        <Field label={tr("Amount (JOD)")}>
          <Input className={inputCls} inputMode="decimal" value={quickAmount}
            placeholder={tr("e.g. 12.50")} onChange={e=>setQuickAmount(e.target.value)} />
        </Field>
        <Field label={tr("Category")}>
          <NativeSelect value={selectedCategory} onChange={e=>setQuickCategory(e.target.value)}>
            {cats.length===0&&<option value="">{tr("Add category first")}</option>}
            {cats.map(cat=><option key={cat.id} value={cat.id}>{tr(cat.name)}</option>)}
          </NativeSelect>
        </Field>
        <Button type="submit" className="h-11" disabled={!selectedCategory}><Plus className="size-4"/> {tr("Save")}</Button>
        {quickMode==="paid"&&<details className="sm:col-span-3 rounded-xl border border-border bg-white p-3">
          <summary className="cursor-pointer text-xs font-semibold text-brand">{ar?"هل المبلغ مختلف عن المتوقع؟ (اختياري)":"Compare with an expected amount (optional)"} +</summary>
          <label className="mt-2 block text-xs font-medium">{ar?"كم كنت تتوقع أن تدفع؟ (د.أ)":"What did you expect to pay? (JOD)"}
            <Input type="number" step=".01" min={0} max={50000} className="mt-1 max-w-44" value={quickExpected} onChange={e=>setQuickExpected(e.target.value)}/>
          </label>
          <p className="mt-2 text-xs text-muted-foreground">{ar?"إذا في فرق، يظهر اقتراح تعديل مخصصاتك بعد التسجيل، وتؤكده أنت.":"If actual differs, you'll be offered a budget adjustment to approve."}</p>
        </details>}
        {quickError&&<p role="alert" className="text-sm text-destructive sm:col-span-3">{quickError}</p>}
        <p className="text-xs text-muted-foreground sm:col-span-3"> {quickMode==="planned"?(ar?"المبلغ المتوقع لا يُحتسب كمدفوع حتى تأكيد الدفع الفعلي.":"Estimated amount is not counted as spent until you confirm the actual payment."):(ar?"المبلغ المدفوع سيظهر ضمن مصاريف هذا الشهر.":"Paid amount appears in this month’s actual spending.")} </p>
      </form>
      {editing && (
        <ExpenseForm
          initial={editing}
          cats={cats}
          members={members}
          onCancel={() => setEditing(null)}
          onSave={(x) => {
            onChange(x.id ? expenses.map((e) => (e.id === x.id ? x : e)) : [{ ...x, id: uid() }, ...expenses]);
            setEditing(null);
            toast.success(tr("Expense saved"));
          }}
        />
      )}
      {sorted.length === 0 ? (
        <p className="mt-4 rounded-xl bg-muted p-4 text-center text-sm text-muted-foreground">{ar?"لم تسجّل مصاريف بعد. ابدأ بمصروف مخطط أو مدفوع.":"No expenses yet. Add a planned or paid expense above."}</p>
      ) : (
        <ul className="mt-3 divide-y">
          {sorted.map((e) => (
            <li key={e.id} className="flex items-center gap-3 py-3">
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{e.note || tr(catName(e.categoryId))}</p>
                {e.status==="planned"&&<button type="button" onClick={()=>{setConfirming(e.id);setActualValue(String(e.amount));}} className="mt-1 min-h-9 rounded-lg bg-[#E8F1E7] px-2.5 text-xs font-semibold text-brand">{ar?"أكد الدفع الفعلي":"Confirm actual payment"}</button>}
                {confirming===e.id&&e.status==="planned"&&<div className="mt-2 rounded-xl border border-border bg-[#F9FBF6] p-3">
                  <label className="block text-xs font-semibold">{ar?"كم دفعت فعلياً؟ (د.أ)":"Actual amount paid (JOD)"}
                    <Input className="mt-1 max-w-44" type="number" min={0} max={50000} step=".01" value={actualValue} onChange={ev=>setActualValue(ev.target.value)}/>
                  </label>
                  <p className="mt-1 text-xs text-muted-foreground">{ar?"المتوقع ":"Expected "}{fmtJOD(e.plannedAmount??e.amount)} · {ar?"اختر إذا كان الرصيد يشمل الدفع أو يحتاج للخصم. تعديل المخصصات يتطلب موافقتك.":"Choose whether cash already reflects this payment. Budget changes need your approval."}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {cashBalance!==null&&<Button size="sm" type="button" variant="outline" onClick={()=>{ const v=Number(actualValue);
                      if(actualValue.trim()===""||!Number.isFinite(v)||v<0||v>50000)return setQuickError(ar?"راجع المبلغ الفعلي والرصيد.":"Check the actual amount and balance.");
                      onConfirmPlanned(e.id,Math.round(v*100)/100,"already");
                      setConfirming(null);setQuickError("");
                      toast.success(ar?"تم تسجيل المبلغ الفعلي.":"Actual payment confirmed."); }}>{ar?"الرصيد يشمل الدفع":"Already in cash balance"}</Button>}
                    {cashBalance!==null&&<Button size="sm" type="button" onClick={()=>{ const v=Number(actualValue);
                      if(actualValue.trim()===""||!Number.isFinite(v)||v<0||v>50000||cashBalance===null||v>cashBalance)return setQuickError(ar?"راجع المبلغ الفعلي والرصيد.":"Check the actual amount and balance.");
                      onConfirmPlanned(e.id,Math.round(v*100)/100,"deduct");
                      setConfirming(null);setQuickError("");
                      toast.success(ar?"تم تسجيل المبلغ الفعلي.":"Actual payment confirmed."); }}>{ar?"اخصمه من الرصيد":"Deduct from cash"}</Button>}
                    {cashBalance===null&&<Button size="sm" type="button" onClick={()=>{ const v=Number(actualValue);
                      if(actualValue.trim()===""||!Number.isFinite(v)||v<0||v>50000)return setQuickError(ar?"راجع المبلغ الفعلي والرصيد.":"Check the actual amount and balance.");
                      onConfirmPlanned(e.id,Math.round(v*100)/100,"untracked");
                      setConfirming(null);setQuickError("");
                      toast.success(ar?"تم تسجيل المبلغ الفعلي.":"Actual payment confirmed."); }}>{ar?"تأكيد (دون رصيد مدخل)":"Confirm (no cash balance)"}</Button>}
                    <Button size="sm" type="button" variant="ghost" onClick={()=>setConfirming(null)}>{ar?"إلغاء":"Cancel"}</Button>
                  </div>
                </div>}
                <p className="text-xs text-muted-foreground">
                  {e.status==="planned"?(ar?"بانتظار الدفع · ":"Planned, not paid · "):""}{e.date} · {tr(catName(e.categoryId))} {e.owner ? `· ${e.owner}` : ""} · {tr(e.shared ? "Shared" : "Private")}
                </p>
              </div>
              <div className="shrink-0 text-end"><span className="block font-semibold tabular-nums">{fmtJOD(e.amount)}</span>
                 {e.status==="planned"&&<span className="block text-[11px] text-muted-foreground">{ar?"متوقع":"Expected"}</span>}
                 {e.status!=="planned"&&e.plannedAmount!=null&&e.plannedAmount!==e.amount&&<span className="block text-[11px] text-muted-foreground">{ar?"الخطة: ":"Plan: "}{fmtJOD(e.plannedAmount)}</span>}
               </div>
              <Button size="icon" variant="ghost" disabled={!!e.billId||!!e.allocation} aria-label={tr("Edit expense")} onClick={() => setEditing(e)}><Pencil className="size-4" /></Button>
              <Button size="icon" variant="ghost" disabled={!!e.billId} aria-label={tr("Delete expense")} onClick={() => confirm(e.allocation?(ar?"سيتم حذف المصروف ومحاولة التراجع عن إعادة توزيع الميزانية. المتابعة؟":"Delete this expense and reverse its approved budget reallocation?"):tr("Delete this expense?")) && onDelete(e)}>
                <Trash2 className="size-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function ExpenseForm({ initial, cats, members, onSave, onCancel }: { initial: Expense; cats: Category[]; members: Member[]; onSave: (e: Expense) => void; onCancel: () => void }) {
  const { tr } = useI18n();
  const [f, setF] = useState({ ...initial, amountStr: initial.amount ? String(initial.amount) : "" });
  const [err, setErr] = useState("");
  return (
    <form
      className="mt-3 grid gap-3 rounded-xl bg-muted p-3 sm:grid-cols-2"
      onSubmit={(e) => {
        e.preventDefault();
        const amount = parseAmount(f.amountStr, 50000);
        if (amount === null) return setErr(tr("Amount must be a positive number up to 50,000."));
        if (!/^\d{4}-\d{2}-\d{2}$/.test(f.date)) return setErr(tr("Please pick a valid date."));
        const { amountStr: _a, ...rest } = f;
        onSave({ ...rest, amount, note: (f.note ?? "").slice(0, 60) });
      }}
    >
      <Field label={tr("Amount (JOD)")}><Input className={inputCls} inputMode="decimal" autoFocus value={f.amountStr} onChange={(e) => setF({ ...f, amountStr: e.target.value })} /></Field>
      <Field label={tr("Date")}><Input className={inputCls} type="date" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} /></Field>
      <Field label={tr("Category")}>
        <NativeSelect value={f.categoryId} onChange={(e) => setF({ ...f, categoryId: e.target.value })}>
          {cats.map((c) => <option key={c.id} value={c.id}>{tr(c.name)}</option>)}
        </NativeSelect>
      </Field>
      <Field label={tr("Owner (optional)")}>
        <NativeSelect value={f.owner ?? ""} onChange={(e) => setF((previous) => { const { owner: _owner, ...withoutOwner } = previous; return e.target.value ? { ...withoutOwner, owner: e.target.value } : withoutOwner; })}>
          <option value="">—</option>
          <option value="Household">{tr("Household")}</option>
          {members.map((m) => <option key={m.id} value={m.name}>{m.name}</option>)}
        </NativeSelect>
      </Field>
      <Field label={tr("Note (optional)")}><Input className={inputCls} maxLength={60} value={f.note ?? ""} onChange={(e) => setF({ ...f, note: e.target.value })} /></Field>
      <label className="flex items-center justify-between gap-3 rounded-md border bg-card px-3 text-sm font-medium">
        {f.shared ? "Shared household expense" : "Private (only you)"}
        <Switch checked={f.shared} onCheckedChange={(v) => setF({ ...f, shared: v })} />
      </label>
      {err && <p className="text-sm text-destructive sm:col-span-2" role="alert">{err}</p>}
      <div className="flex gap-2 sm:col-span-2">
        <Button type="submit" className="h-11 flex-1">{tr("Save expense")}</Button>
        <Button type="button" variant="outline" className="h-11" onClick={onCancel}>{tr("Cancel")}</Button>
      </div>
    </form>
  );
}