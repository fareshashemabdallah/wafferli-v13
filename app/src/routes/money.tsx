import { createFileRoute } from "@tanstack/react-router";
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
      { title: "My Money — Dabberna" },
      { name: "description", content: "Plan your household budget, log expenses and see your real remaining allowance and savings projection." },
      { property: "og:title", content: "My Money — Dabberna" },
      { property: "og:description", content: "Household budget, actual spending and savings projection." },
    ],
  }),
  component: MoneyPage,
});

const today = () => new Date().toISOString().slice(0, 10);

function MoneyPage() {
  const { t } = useI18n();
  const [s, setS, ready] = useLocalState("money", sampleMoney());
  const [members] = useLocalState<Member[]>("members", sampleMembers());
  const c = useMemo(() => computeMoney(s), [s]);

  if (!ready)
    return (
      <AppShell title={t("money")}>
        <div className="grid gap-3 sm:grid-cols-2">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}</div>
      </AppShell>
    );

  const upd = (p: Partial<typeof s>) => setS((prev) => ({ ...prev, ...p, demo: prev.demo }));

  return (
    <AppShell title={t("money")}>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {s.demo && <PilotBadge>Demo data</PilotBadge>}
        <span className="text-xs text-muted-foreground">Saved on this device only. Use fictional figures during the pilot.</span>
        <Button
          variant="outline"
          size="sm"
          className="ms-auto"
          onClick={() => {
            if (confirm("Reset all money data to the demo sample?")) {
              setS(sampleMoney());
              toast.success("Sample data restored");
            }
          }}
        >
          <RotateCcw className="size-4" /> Reset sample data
        </Button>
      </div>

      <section className="hero-surface rounded-3xl p-5">
        <p className="text-sm opacity-80">Remaining allowance this month</p>
        <p className="mt-1 font-display text-4xl font-semibold">{fmtJOD(c.remaining)}</p>
        <p className="mt-1 text-sm opacity-80">{c.daysLeft} days left · spent {fmtJOD(c.spent)} of {fmtJOD(c.spendable)}</p>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-primary-foreground/20">
          <div className="h-full rounded-full bg-lime" style={{ width: `${Math.min(100, (c.spent / Math.max(1, c.spendable)) * 100)}%` }} />
        </div>
      </section>

      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Savings target" value={fmtJOD(c.savingsTarget)} sub={`${s.savingsPct}% of income`} />
        <Stat label="Planned (budget)" value={fmtJOD(c.planned)} sub={c.overPlan ? "Above spendable!" : "Within spendable"} warn={c.overPlan} />
        <Stat label="Actual spent" value={fmtJOD(c.spent)} sub="This month" />
        <Stat
          label="Projected month-end"
          value={fmtJOD(c.projected)}
          sub={`Savings ≈ ${fmtJOD(c.projectedSavings)}`}
          warn={c.projectedSavings < c.savingsTarget}
        />
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        Projection: fixed & periodic use the larger of planned or actual; variable extends your current daily pace to month-end.
      </p>

      <Settings income={s.income} pct={s.savingsPct} onSave={(income, savingsPct) => upd({ income, savingsPct })} />
      <Categories cats={s.categories} spentBy={c.spentBy} onChange={(categories) => upd({ categories })} />
      <Expenses
        cats={s.categories}
        members={members}
        expenses={s.expenses}
        onChange={(expenses) => upd({ expenses })}
      />
    </AppShell>
  );
}

function Stat({ label, value, sub, warn }: { label: string; value: string; sub: string; warn?: boolean }) {
  return (
    <div className="card-soft p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold">{value}</p>
      <p className={`text-xs ${warn ? "font-semibold text-destructive" : "text-muted-foreground"}`}>{sub}</p>
    </div>
  );
}

function Settings({ income, pct, onSave }: { income: number; pct: number; onSave: (i: number, p: number) => void }) {
  const [inc, setInc] = useState(String(income));
  const [p, setP] = useState(String(pct));
  const [err, setErr] = useState("");
  const save = (e: FormEvent) => {
    e.preventDefault();
    const i = parseAmount(inc, 100000);
    const pn = Number(p);
    if (i === null) return setErr("Income must be a positive amount up to 100,000.");
    if (!Number.isFinite(pn) || pn < 0 || pn > 80) return setErr("Savings must be between 0 and 80%.");
    setErr("");
    onSave(i, pn);
    toast.success("Income & savings updated");
  };
  return (
    <section className="card-soft mt-6 p-4">
      <h2 className="text-lg font-semibold">Income & savings goal</h2>
      <form onSubmit={save} className="mt-3 grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <Field label="Monthly household income (JOD)">
          <Input className={inputCls} inputMode="decimal" value={inc} onChange={(e) => setInc(e.target.value)} />
        </Field>
        <Field label="Savings target (%)">
          <Input className={inputCls} inputMode="numeric" value={p} onChange={(e) => setP(e.target.value)} />
        </Field>
        <Button type="submit" className="h-11">Save</Button>
      </form>
      {err && <p className="mt-2 text-sm text-destructive" role="alert">{err}</p>}
    </section>
  );
}

const typeLabel: Record<CatType, string> = { fixed: "Fixed", variable: "Variable", periodic: "Periodic" };

function Categories({ cats, spentBy, onChange }: { cats: Category[]; spentBy: (id: string) => number; onChange: (c: Category[]) => void }) {
  const [editing, setEditing] = useState<Category | null>(null);
  return (
    <section className="card-soft mt-6 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Spending categories</h2>
        <Button size="sm" variant="secondary" onClick={() => setEditing({ id: "", name: "", type: "variable", planned: 0 })}>
          <Plus className="size-4" /> Add
        </Button>
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
      {cats.length === 0 && <p className="mt-3 text-sm text-muted-foreground">No categories yet. Add your first one.</p>}
      <ul className="mt-3 divide-y">
        {cats.map((c) => {
          const a = spentBy(c.id);
          const pct = c.planned ? Math.min(100, (a / c.planned) * 100) : 0;
          return (
            <li key={c.id} className="flex items-center gap-3 py-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate font-medium">{c.name}</span>
                  <span className="rounded-full bg-mint px-2 text-[11px] text-brand">{typeLabel[c.type]}</span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div className={`h-full ${a > c.planned ? "bg-destructive" : "bg-brand-2"}`} style={{ width: `${pct}%` }} />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">Actual {fmtJOD(a)} · Planned {fmtJOD(c.planned)}</p>
              </div>
              <Button size="icon" variant="ghost" aria-label={`Edit ${c.name}`} onClick={() => setEditing(c)}><Pencil className="size-4" /></Button>
              <Button
                size="icon"
                variant="ghost"
                aria-label={`Delete ${c.name}`}
                onClick={() => confirm(`Delete category "${c.name}"?`) && onChange(cats.filter((x) => x.id !== c.id))}
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
        if (!name.trim()) return setErr("Name is required.");
        if (p === null) return setErr("Planned amount must be 0 or a positive number.");
        onSave({ id: initial.id, name: name.trim().slice(0, 40), type, planned: p });
      }}
    >
      <Field label="Name"><Input className={inputCls} value={name} maxLength={40} onChange={(e) => setName(e.target.value)} /></Field>
      <Field label="Type">
        <NativeSelect value={type} onChange={(e) => setType(e.target.value as CatType)}>
          <option value="fixed">Fixed (rent, bills)</option>
          <option value="variable">Variable (groceries, fuel)</option>
          <option value="periodic">Periodic (school, insurance)</option>
        </NativeSelect>
      </Field>
      <Field label="Planned per month (JOD)"><Input className={inputCls} inputMode="decimal" value={planned} onChange={(e) => setPlanned(e.target.value)} /></Field>
      <div className="flex items-end gap-2">
        <Button type="submit" className="h-11 flex-1">Save</Button>
        <Button type="button" variant="outline" className="h-11" onClick={onCancel}>Cancel</Button>
      </div>
      {err && <p className="text-sm text-destructive sm:col-span-2" role="alert">{err}</p>}
    </form>
  );
}

function Expenses({ cats, members, expenses, onChange }: { cats: Category[]; members: Member[]; expenses: Expense[]; onChange: (e: Expense[]) => void }) {
  const blank: Expense = { id: "", date: today(), categoryId: cats[0]?.id ?? "", amount: 0, shared: true };
  const [editing, setEditing] = useState<Expense | null>(null);
  const sorted = [...expenses].sort((a, b) => b.date.localeCompare(a.date));
  const catName = (id: string) => cats.find((c) => c.id === id)?.name ?? "Uncategorized";
  return (
    <section className="card-soft mt-6 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Actual expenses</h2>
        <Button size="sm" onClick={() => setEditing(blank)} disabled={cats.length === 0}><Plus className="size-4" /> Add expense</Button>
      </div>
      {editing && (
        <ExpenseForm
          initial={editing}
          cats={cats}
          members={members}
          onCancel={() => setEditing(null)}
          onSave={(x) => {
            onChange(x.id ? expenses.map((e) => (e.id === x.id ? x : e)) : [{ ...x, id: uid() }, ...expenses]);
            setEditing(null);
            toast.success("Expense saved");
          }}
        />
      )}
      {sorted.length === 0 ? (
        <p className="mt-4 rounded-xl bg-muted p-4 text-center text-sm text-muted-foreground">No expenses logged yet.</p>
      ) : (
        <ul className="mt-3 divide-y">
          {sorted.map((e) => (
            <li key={e.id} className="flex items-center gap-3 py-3">
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{e.note || catName(e.categoryId)}</p>
                <p className="text-xs text-muted-foreground">
                  {e.date} · {catName(e.categoryId)} {e.owner ? `· ${e.owner}` : ""} · {e.shared ? "Shared" : "Private"}
                </p>
              </div>
              <span className="font-semibold tabular-nums">{fmtJOD(e.amount)}</span>
              <Button size="icon" variant="ghost" aria-label="Edit expense" onClick={() => setEditing(e)}><Pencil className="size-4" /></Button>
              <Button size="icon" variant="ghost" aria-label="Delete expense" onClick={() => confirm("Delete this expense?") && onChange(expenses.filter((x) => x.id !== e.id))}>
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
  const [f, setF] = useState({ ...initial, amountStr: initial.amount ? String(initial.amount) : "" });
  const [err, setErr] = useState("");
  return (
    <form
      className="mt-3 grid gap-3 rounded-xl bg-muted p-3 sm:grid-cols-2"
      onSubmit={(e) => {
        e.preventDefault();
        const amount = parseAmount(f.amountStr, 50000);
        if (amount === null) return setErr("Amount must be a positive number up to 50,000.");
        if (!/^\d{4}-\d{2}-\d{2}$/.test(f.date)) return setErr("Please pick a valid date.");
        const { amountStr: _a, ...rest } = f;
        onSave({ ...rest, amount, note: f.note?.slice(0, 60) });
      }}
    >
      <Field label="Amount (JOD)"><Input className={inputCls} inputMode="decimal" autoFocus value={f.amountStr} onChange={(e) => setF({ ...f, amountStr: e.target.value })} /></Field>
      <Field label="Date"><Input className={inputCls} type="date" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} /></Field>
      <Field label="Category">
        <NativeSelect value={f.categoryId} onChange={(e) => setF({ ...f, categoryId: e.target.value })}>
          {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </NativeSelect>
      </Field>
      <Field label="Owner (optional)">
        <NativeSelect value={f.owner ?? ""} onChange={(e) => setF({ ...f, owner: e.target.value || undefined })}>
          <option value="">—</option>
          <option value="Household">Household</option>
          {members.map((m) => <option key={m.id} value={m.name}>{m.name}</option>)}
        </NativeSelect>
      </Field>
      <Field label="Note (optional)"><Input className={inputCls} maxLength={60} value={f.note ?? ""} onChange={(e) => setF({ ...f, note: e.target.value })} /></Field>
      <label className="flex items-center justify-between gap-3 rounded-md border bg-card px-3 text-sm font-medium">
        {f.shared ? "Shared household expense" : "Private (only you)"}
        <Switch checked={f.shared} onCheckedChange={(v) => setF({ ...f, shared: v })} />
      </label>
      {err && <p className="text-sm text-destructive sm:col-span-2" role="alert">{err}</p>}
      <div className="flex gap-2 sm:col-span-2">
        <Button type="submit" className="h-11 flex-1">Save expense</Button>
        <Button type="button" variant="outline" className="h-11" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  );
}