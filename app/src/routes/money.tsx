import { createFileRoute } from "@tanstack/react-router";
import { CashFlowPlanner } from "@/components/CashFlowPlanner";
import { localToday } from "@/lib/cashflow";
import { Pencil, Plus, RotateCcw, Trash2 } from "lucide-react";
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
      <p className="mb-4 text-sm text-muted-foreground">{ar?"أنفق بذكاء وراجع التفاصيل وقت الحاجة.":"Make confident choices, one step at a time."}</p>
      <div role="tablist" aria-label={ar?"أقسام المالية":"Money sections"} className="mb-4 grid grid-cols-3 gap-2">{([{id:"overview",en:"Overview",ar:"لمحة"},{id:"spending",en:"Spending",ar:"مصاريف"},{id:"planning",en:"Bills & plan",ar:"الفواتير"}] as const).map(v=><button role="tab" aria-selected={section===v.id} key={v.id} type="button" onClick={()=>setSection(v.id)} className={"min-h-12 rounded-xl px-2 text-xs font-semibold sm:text-sm "+(section===v.id?"bg-brand text-white":"border border-border bg-white text-brand")}>{ar?v.ar:v.en}</button>)}</div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {s.demo && <PilotBadge>{tr("Demo data")}</PilotBadge>}
        <span className="text-xs text-muted-foreground">{tr("Saved on this device only. Use fictional figures during the pilot.")}</span>
        <Button
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
      </div>

      {section==="overview"&&<>
      <section className="hero-surface rounded-3xl p-5">
        <p className="text-sm opacity-80">{tr("Remaining allowance this month")}</p>
        <p className="mt-1 font-display text-4xl font-semibold">{fmtJOD(c.remaining)}</p>
        <p className="mt-1 text-sm opacity-80">{c.daysLeft} {tr("days left")} · {tr("spent")} {fmtJOD(c.spent)} {tr("of")} {fmtJOD(c.spendable)}</p>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-primary-foreground/20">
          <div className="h-full rounded-full bg-lime" style={{ width: `${Math.min(100, (c.spent / Math.max(1, c.spendable)) * 100)}%` }} />
        </div>
      </section>

      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label={tr("Savings target")} value={fmtJOD(c.savingsTarget)} sub={`${s.savingsPct}% ${tr("of income")}`} />
        <Stat label={tr("Planned (budget)")} value={fmtJOD(c.planned)} sub={tr(c.overPlan ? "Above spendable!" : "Within spendable")} warn={c.overPlan} />
        <Stat label={tr("Actual spent")} value={fmtJOD(c.spent)} sub={tr("This month")} />
        <Stat
          label={tr("Projected month-end")}
          value={fmtJOD(c.projected)}
          sub={`${tr("Savings")} ≈ ${fmtJOD(c.projectedSavings)}`}
          warn={c.projectedSavings < c.savingsTarget}
        />
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        Projection: fixed & periodic use the larger of planned or actual; variable extends your current daily pace to month-end.
      </p>

      </>}
      {section==="planning"&&<>
      <Settings income={c.monthlyIncome} pct={s.savingsPct} hasSources={s.incomeSources!==undefined}
        onSave={(income,savingsPct)=>upd(s.incomeSources===undefined?{income,savingsPct}:{savingsPct})} />
      <CashFlowPlanner state={s} members={members} update={setS} />
      </>}
      {section==="spending"&&<>
      <Categories cats={s.categories} spentBy={c.spentBy} onChange={(categories) => upd({ categories })} />
      <Expenses
        cats={s.categories}
        members={members}
        expenses={s.expenses}
        onChange={(expenses) => upd({ expenses })}
        onDelete={(expense)=>setS(previous=>{
          const expenses=previous.expenses.filter(e=>e.id!==expense.id);
          if(!expense.billId || !expense.dueDate)return {...previous,expenses};
          const commitments=(previous.commitments??[]).map(b=>b.id===expense.billId?{
            ...b,paidDates:(b.paidDates??[]).filter(d=>d!==expense.dueDate)
          }:b);
          return {...previous,expenses,commitments};
        })}
      />
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

function Settings({ income, pct, hasSources, onSave }: { income: number; pct: number; hasSources:boolean; onSave: (i: number, p: number) => void }) {
  const { tr } = useI18n();
  const [inc, setInc] = useState(String(income));
  const [p, setP] = useState(String(pct));
  const [err, setErr] = useState("");
  const save = (e: FormEvent) => {
    e.preventDefault();
    const i = hasSources ? income : parseAmount(inc, 100000);
    const pn = Number(p);
    if (i === null) return setErr(tr("Income must be a positive amount up to 100,000."));
    if (!Number.isFinite(pn) || pn < 0 || pn > 80) return setErr(tr("Savings must be between 0 and 80%."));
    setErr("");
    onSave(i, pn);
    toast.success(tr("Income & savings updated"));
  };
  return (
    <section className="card-soft mt-6 p-4">
      <h2 className="text-lg font-semibold">{tr("Income & savings goal")}</h2>
      <form onSubmit={save} className="mt-3 grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <Field label={hasSources?"Estimated monthly income (JOD)":"Existing monthly household income (JOD)"}
          hint={hasSources?"Calculated from your income sources below — edit there. One-time and irregular amounts aren't averaged into monthly income.":"Legacy monthly budget estimate. Add dated sources under Income Schedule below."}>
          <Input className={inputCls} inputMode="decimal" value={hasSources?String(income):inc}
            disabled={hasSources} onChange={(e) => setInc(e.target.value)} />
        </Field>
        <Field label={tr("Savings target (%)")}>
          <Input className={inputCls} inputMode="numeric" value={p} onChange={(e) => setP(e.target.value)} />
        </Field>
        <Button type="submit" className="h-11">{tr("Save")}</Button>
      </form>
      {err && <p className="mt-2 text-sm text-destructive" role="alert">{err}</p>}
    </section>
  );
}

const typeLabel: Record<CatType, string> = { fixed: "Fixed", variable: "Variable", periodic: "Periodic" };

function Categories({ cats, spentBy, onChange }: { cats: Category[]; spentBy: (id: string) => number; onChange: (c: Category[]) => void }) {
  const { tr } = useI18n();
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
          const pct = c.planned ? Math.min(100, (a / c.planned) * 100) : 0;
          return (
            <li key={c.id} className="flex items-center gap-3 py-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate font-medium">{tr(c.name)}</span>
                  <span className="rounded-full bg-mint px-2 text-[11px] text-brand">{tr(typeLabel[c.type])}</span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div className={`h-full ${a > c.planned ? "bg-destructive" : "bg-brand-2"}`} style={{ width: `${pct}%` }} />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{tr("Actual")} {fmtJOD(a)} · {tr("Planned")} {fmtJOD(c.planned)}</p>
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

function Expenses({ cats, members, expenses, onChange, onDelete }: {
  cats: Category[]; members: Member[]; expenses: Expense[];
  onChange: (e: Expense[]) => void; onDelete: (e:Expense)=>void;
}) {
  const { tr } = useI18n();
  const blank: Expense = { id: "", date: today(), categoryId: cats[0]?.id ?? "", amount: 0, shared: true };
  const [editing, setEditing] = useState<Expense | null>(null);
  const [quickAmount, setQuickAmount] = useState("");
  const [quickCategory, setQuickCategory] = useState(cats[0]?.id ?? "");
  const [quickError, setQuickError] = useState("");
  const selectedCategory=cats.some(x=>x.id===quickCategory)?quickCategory:(cats[0]?.id??"");
  const recordQuick=(ev:FormEvent)=>{
    ev.preventDefault();
    const amount=parseAmount(quickAmount,50000);
    if(amount===null)return setQuickError(tr("Enter a valid amount greater than zero (up to 50,000 JOD)."));
    if(!selectedCategory)return setQuickError(tr("Add a spending category first."));
    const entry:Expense={id:uid(),date:today(),categoryId:selectedCategory,amount,shared:true};
    onChange([entry,...expenses]);
    setQuickAmount("");setQuickError("");
    toast.success(tr("Expense recorded"));
  };
  const sorted = [...expenses].sort((a, b) => b.date.localeCompare(a.date));
  const catName = (id: string) => cats.find((c) => c.id === id)?.name ?? "Uncategorized";
  return (
    <section className="card-soft mt-6 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{tr("Actual expenses")}</h2>
        <Button size="sm" variant="outline" onClick={() => setEditing(blank)} disabled={cats.length === 0}>
          <Plus className="size-4" /> {tr("More details")} </Button>
      </div>
      <form onSubmit={recordQuick} className="mt-3 grid gap-2 rounded-xl bg-muted/40 p-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
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
        {quickError&&<p role="alert" className="text-sm text-destructive sm:col-span-3">{quickError}</p>}
        <p className="text-xs text-muted-foreground sm:col-span-3"> {tr("Quick entry: today · shared household · your device only. Need a different date, private expense, owner or note? Choose More details.")} </p>
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
        <p className="mt-4 rounded-xl bg-muted p-4 text-center text-sm text-muted-foreground">{tr("No expenses logged yet.")}</p>
      ) : (
        <ul className="mt-3 divide-y">
          {sorted.map((e) => (
            <li key={e.id} className="flex items-center gap-3 py-3">
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{e.note || tr(catName(e.categoryId))}</p>
                <p className="text-xs text-muted-foreground">
                  {e.date} · {tr(catName(e.categoryId))} {e.owner ? `· ${e.owner}` : ""} · {tr(e.shared ? "Shared" : "Private")}
                </p>
              </div>
              <span className="font-semibold tabular-nums">{fmtJOD(e.amount)}</span>
              <Button size="icon" variant="ghost" aria-label={tr("Edit expense")} onClick={() => setEditing(e)}><Pencil className="size-4" /></Button>
              <Button size="icon" variant="ghost" aria-label={tr("Delete expense")} onClick={() => confirm(tr("Delete this expense?")) && onDelete(e)}>
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