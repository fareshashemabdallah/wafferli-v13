import { createFileRoute } from "@tanstack/react-router";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { AppShell, PilotBadge } from "@/components/AppShell";
import { inputCls } from "@/components/Field";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { sampleMoney, type MoneyState } from "@/lib/money";
import { fmtJOD, parseAmount, uid, useLocalState } from "@/lib/storage";

export const Route = createFileRoute("/explore/shopping")({
  head: () => ({
    meta: [
      { title: "Shopping List — Wafferli" },
      { name: "description", content: "Grocery list with quantities, prices and basket total, saved on your device." },
      { property: "og:title", content: "Shopping List — Wafferli" },
      { property: "og:description", content: "Build your grocery basket and record the spend." },
    ],
  }),
  component: Shopping,
});

type Item = { id: string; name: string; qty: number; price: number; done: boolean };

function Shopping() {
  const [items, setItems] = useLocalState<Item[]>("shopping", [
    { id: "s1", name: "Milk 1L (sample)", qty: 2, price: 1.1, done: false },
    { id: "s2", name: "Arabic bread (sample)", qty: 1, price: 0.5, done: false },
  ]);
  const [, setMoney] = useLocalState<MoneyState>("money", sampleMoney());
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [err, setErr] = useState("");
  const total = items.reduce((a, i) => a + i.qty * i.price, 0);
  const upd = (id: string, p: Partial<Item>) => setItems(items.map((i) => (i.id === id ? { ...i, ...p } : i)));

  const add = (e: FormEvent) => {
    e.preventDefault();
    const p = price === "" ? 0 : parseAmount(price, 5000);
    if (!name.trim()) return setErr("Item name is required.");
    if (p === null) return setErr("Price must be a positive number.");
    setErr("");
    setItems([...items, { id: uid(), name: name.trim().slice(0, 60), qty: 1, price: p, done: false }]);
    setName(""); setPrice("");
  };

  const record = () => {
    if (total <= 0) return toast.error("Basket total is zero");
    setMoney((m) => {
      const cat = m.categories.find((c) => /grocer/i.test(c.name)) ?? m.categories[0];
      if (!cat) return m;
      return { ...m, expenses: [{ id: uid(), date: new Date().toISOString().slice(0, 10), categoryId: cat.id, amount: Math.round(total * 100) / 100, note: "Shopping basket", shared: true }, ...m.expenses] };
    });
    toast.success(`Recorded ${fmtJOD(total)} in My Money`);
  };

  return (
    <AppShell title="Shopping List">
      <p className="mb-3 flex items-center gap-2 text-sm text-muted-foreground"><PilotBadge>Device only</PilotBadge> Prices are what you enter — no live store prices.</p>
      <form onSubmit={add} className="card-soft flex flex-wrap gap-2 p-3">
        <Input aria-label="Item name" className={`${inputCls} min-w-0 flex-[2]`} placeholder="Item" value={name} onChange={(e) => setName(e.target.value)} />
        <Input aria-label="Unit price" className={`${inputCls} w-28 flex-1`} inputMode="decimal" placeholder="Price JOD" value={price} onChange={(e) => setPrice(e.target.value)} />
        <Button type="submit" className="h-11"><Plus className="size-4" /> Add</Button>
        {err && <p className="w-full text-sm text-destructive" role="alert">{err}</p>}
      </form>
      {items.length === 0 ? (
        <p className="mt-4 rounded-xl bg-muted p-6 text-center text-sm text-muted-foreground">Your list is empty.</p>
      ) : (
        <ul className="card-soft mt-4 divide-y">
          {items.map((i) => (
            <li key={i.id} className="flex items-center gap-2 p-3">
              <Checkbox checked={i.done} onCheckedChange={(v) => upd(i.id, { done: v === true })} aria-label={`Got ${i.name}`} />
              <Input aria-label="Name" className={`h-10 min-w-0 flex-1 border-transparent bg-transparent ${i.done ? "line-through opacity-60" : ""}`} value={i.name} onChange={(e) => upd(i.id, { name: e.target.value.slice(0, 60) })} />
              <div className="flex items-center">
                <Button size="icon" variant="ghost" aria-label="Decrease" onClick={() => upd(i.id, { qty: Math.max(1, i.qty - 1) })}><Minus className="size-4" /></Button>
                <span className="w-6 text-center tabular-nums">{i.qty}</span>
                <Button size="icon" variant="ghost" aria-label="Increase" onClick={() => upd(i.id, { qty: Math.min(99, i.qty + 1) })}><Plus className="size-4" /></Button>
              </div>
              <Input aria-label="Price" className="h-10 w-20 bg-card" inputMode="decimal" defaultValue={i.price} onBlur={(e) => { const p = parseAmount(e.target.value, 5000); if (p !== null) upd(i.id, { price: p }); else e.target.value = String(i.price); }} />
              <Button size="icon" variant="ghost" aria-label={`Remove ${i.name}`} onClick={() => setItems(items.filter((x) => x.id !== i.id))}><Trash2 className="size-4" /></Button>
            </li>
          ))}
        </ul>
      )}
      <div className="card-soft mt-4 flex items-center justify-between p-4">
        <div><p className="text-xs text-muted-foreground">Basket total</p><p className="text-2xl font-semibold">{fmtJOD(total)}</p></div>
        <Button onClick={record}>Record as expense</Button>
      </div>
    </AppShell>
  );
}