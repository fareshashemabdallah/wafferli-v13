import { useI18n } from "@/lib/i18n";
import { createFileRoute } from "@tanstack/react-router";
import { ImagePlus, Plus, Receipt, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { AppShell, Notice } from "@/components/AppShell";
import { PlanContextBanner } from "@/components/PlanContextBanner";
import { Field, inputCls } from "@/components/Field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fmtJOD, uid, useLocalState } from "@/lib/storage";

export const Route = createFileRoute("/explore/smartbuy")({
  head: () => ({
    meta: [
      { title: "Compare & Choose — Dabberna" },
      { name: "description", content: "Compare buying options by total cost including delivery or travel, against your budget." },
      { property: "og:title", content: "Compare & Choose — Dabberna" },
      { property: "og:description", content: "Honest manual price comparison with total cost." },
    ],
  }),
  component: SmartBuy,
});

type Alt = { id: string; store: string; price: string; extra: string; verified: boolean; quality?: string; fit?: string; note?: string };

function Photo({ label, icon: Icon }: { label: string; icon: typeof Receipt }) {
  const { tr } = useI18n();
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => () => { if (url) URL.revokeObjectURL(url); }, [url]);
  return (
    <label className="card-soft flex cursor-pointer flex-col items-center justify-center gap-2 p-4 text-center text-sm">
      {url ? <img src={url} alt={label} className="h-28 w-full rounded-lg object-cover" /> : <Icon className="size-7 text-brand" />}
      <span className="font-medium">{label}</span>
      <span className="text-[11px] text-muted-foreground">{tr("Preview only · AI extraction not connected")}</span>
      <input type="file" accept="image/*" className="sr-only" onChange={(e) => { const f = e.target.files?.[0]; if (f) setUrl(URL.createObjectURL(f)); }} />
    </label>
  );
}

function SmartBuy() {
  const { tr } = useI18n();
  const [s, setS] = useLocalState("smartbuy", {
    product: "",
    budget: "",
    alts: [
      { id: "a1", store: "", price: "", extra: "", verified: false },
      { id: "a2", store: "", price: "", extra: "", verified: false },
    ] as Alt[],
  });
  const budget = Number(s.budget) || 0;
  const rows = s.alts.map((a) => ({ ...a, total: (Number(a.price) || 0) + (Number(a.extra) || 0) }));
  const valid = rows.filter((r) => Number(r.price) > 0);
  const lowestCost = valid.length ? valid.reduce((a, b) => (b.total < a.total ? b : a)) : null;
  const setAlt = (id: string, p: Partial<Alt>) => setS({ ...s, alts: s.alts.map((a) => (a.id === id ? { ...a, ...p } : a)) });

  return (
    <AppShell title={tr("Compare & Choose")}>
      <PlanContextBanner onUseBudget={amount=>setS(old=>({...old,budget:String(amount)}))}/>
      <div className="rounded-2xl bg-mint/60 p-4 text-sm text-ink">{tr("The lowest price is not always the best value. Consider quality, durability, convenience and support before choosing. This pilot compares your entered costs only.")}</div>
      <Notice>{tr("Enter prices you've seen yourself. Dabberna doesn't fetch live prices yet, so there are no automatic \"savings\" claims.")}</Notice>
      <div className="card-soft mt-4 grid gap-3 p-4 sm:grid-cols-2">
        <Field label={tr("What are you buying?")}><Input className={inputCls} maxLength={60} value={s.product} onChange={(e) => setS({ ...s, product: e.target.value })} /></Field>
        <Field label={tr("Your budget (JOD)")}><Input className={inputCls} inputMode="decimal" value={s.budget} onChange={(e) => setS({ ...s, budget: e.target.value })} /></Field>
      </div>
      <div className="mt-4 space-y-3">
        {rows.map((a) => (
          <div key={a.id} className="card-soft p-4">
            <div className="grid gap-2 sm:grid-cols-[2fr_1fr_1fr_auto]">
              <Input aria-label={tr("Store")} className={inputCls} value={a.store} onChange={(e) => setAlt(a.id, { store: e.target.value.slice(0, 50) })} />
              <Input aria-label={tr("Price")} className={inputCls} inputMode="decimal" placeholder={tr("Price")} value={a.price} onChange={(e) => setAlt(a.id, { price: e.target.value })} />
              <Input aria-label={tr("Delivery or travel")} className={inputCls} inputMode="decimal" placeholder={tr("Delivery/travel")} value={a.extra} onChange={(e) => setAlt(a.id, { extra: e.target.value })} />
              <Button variant="ghost" size="icon" aria-label={tr("Remove")} onClick={() => setS({ ...s, alts: s.alts.filter((x) => x.id !== a.id) })}><Trash2 className="size-4" /></Button>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
              <span className="font-semibold">{tr("Total")} {fmtJOD(a.total)}</span>
              {budget > 0 && <span className={a.total > budget ? "text-destructive" : "text-brand"}>{a.total > budget ? `${fmtJOD(a.total - budget)} ${tr("over budget")}` : tr("Within budget")}</span>}
              {lowestCost?.id === a.id && <span className="rounded-full border border-border px-2 py-1 text-xs text-muted-foreground">{tr("Lowest entered total — not necessarily best value")}</span>}
              <label className="ms-auto flex items-center gap-1.5 text-xs">
                <input type="checkbox" checked={a.verified} onChange={(e) => setAlt(a.id, { verified: e.target.checked })} /> {tr(a.verified ? "Price I verified" : "Unverified price")}
              </label>
            </div>
            <details className="group mt-3 rounded-xl bg-muted/40 p-3">
              <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-medium text-brand [&::-webkit-details-marker]:hidden">
                <span>{tr("More than a price: assess this choice")}</span><span className="text-xs group-open:hidden">+</span><span className="hidden text-xs group-open:inline">−</span>
              </summary>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <label className="text-xs font-medium">{tr("Quality & durability (your view)")}
                  <select value={a.quality??""} onChange={e=>setAlt(a.id,{quality:e.target.value})} className="mt-1 w-full rounded-xl border bg-card p-2.5">
                    <option value="">{tr("Not assessed")}</option>{[1,2,3,4,5].map(n=><option key={n} value={String(n)}>{n}/5</option>)}
                  </select>
                </label>
                <label className="text-xs font-medium">{tr("Fit for your needs (your view)")}
                  <select value={a.fit??""} onChange={e=>setAlt(a.id,{fit:e.target.value})} className="mt-1 w-full rounded-xl border bg-card p-2.5">
                    <option value="">{tr("Not assessed")}</option>{[1,2,3,4,5].map(n=><option key={n} value={String(n)}>{n}/5</option>)}
                  </select>
                </label>
                <label className="text-xs font-medium sm:col-span-2">{tr("Why would you choose this?")}
                  <Input className="mt-1" maxLength={150} value={a.note??""} onChange={e=>setAlt(a.id,{note:e.target.value})} placeholder={tr("Better quality, reliable warranty, convenient delivery…")}/>
                </label>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">{tr("These are your personal judgments, not verified product ratings or live offers.")}</p>
            </details>
          </div>
        ))}
        <Button variant="secondary" disabled={s.alts.length >= 8} onClick={() => setS({ ...s, alts: [...s.alts, { id: uid(), store: "", price: "", extra: "", verified: false }] })}><Plus className="size-4" /> {tr("Add alternative")}</Button>
      </div>
      <div className="mt-6 grid grid-cols-2 gap-3">
        <Photo label={tr("Product photo")} icon={ImagePlus} />
        <Photo label={tr("Receipt photo")} icon={Receipt} />
      </div>
    </AppShell>
  );
}