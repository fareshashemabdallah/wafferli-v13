import { useI18n } from "@/lib/i18n";
import { createFileRoute } from "@tanstack/react-router";
import { ImagePlus, Plus, Receipt, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { AppShell, Notice, PilotBadge } from "@/components/AppShell";
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

type Alt = { id: string; store: string; price: string; extra: string; verified: boolean };

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
    product: "Winter jacket",
    budget: "60",
    alts: [
      { id: "a1", store: "Mall store (example)", price: "55", extra: "3", verified: true },
      { id: "a2", store: "Online shop (example)", price: "48", extra: "4", verified: false },
    ] as Alt[],
  });
  const budget = Number(s.budget) || 0;
  const rows = s.alts.map((a) => ({ ...a, total: (Number(a.price) || 0) + (Number(a.extra) || 0) }));
  const valid = rows.filter((r) => Number(r.price) > 0);
  const best = valid.length ? valid.reduce((a, b) => (b.total < a.total ? b : a)) : null;
  const setAlt = (id: string, p: Partial<Alt>) => setS({ ...s, alts: s.alts.map((a) => (a.id === id ? { ...a, ...p } : a)) });

  return (
    <AppShell title={tr("Compare & Choose")}>
      <div className="rounded-2xl bg-mint/60 p-4 text-sm text-ink">{tr("The lowest price is not always the best value. Consider quality, durability, convenience and support before choosing. This pilot compares your entered costs only.")}</div>
      <Notice>{tr("Enter prices you've seen yourself. Dabberna doesn't fetch live prices yet, so there are no automatic \"savings\" claims.")}</Notice>
      <div className="card-soft mt-4 grid gap-3 p-4 sm:grid-cols-2">
        <Field label={tr("What are you buying?")}><Input className={inputCls} maxLength={60} value={s.product} onChange={(e) => setS({ ...s, product: e.target.value })} /></Field>
        <Field label={tr("Your budget (JOD)")}><Input className={inputCls} inputMode="decimal" value={s.budget} onChange={(e) => setS({ ...s, budget: e.target.value })} /></Field>
      </div>
      <div className="mt-4 space-y-3">
        {rows.map((a) => (
          <div key={a.id} className={`card-soft p-4 ${best?.id === a.id ? "ring-2 ring-brand-2" : ""}`}>
            <div className="grid gap-2 sm:grid-cols-[2fr_1fr_1fr_auto]">
              <Input aria-label={tr("Store")} className={inputCls} value={a.store} onChange={(e) => setAlt(a.id, { store: e.target.value.slice(0, 50) })} />
              <Input aria-label={tr("Price")} className={inputCls} inputMode="decimal" placeholder={tr("Price")} value={a.price} onChange={(e) => setAlt(a.id, { price: e.target.value })} />
              <Input aria-label={tr("Delivery or travel")} className={inputCls} inputMode="decimal" placeholder={tr("Delivery/travel")} value={a.extra} onChange={(e) => setAlt(a.id, { extra: e.target.value })} />
              <Button variant="ghost" size="icon" aria-label={tr("Remove")} onClick={() => setS({ ...s, alts: s.alts.filter((x) => x.id !== a.id) })}><Trash2 className="size-4" /></Button>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
              <span className="font-semibold">{tr("Total")} {fmtJOD(a.total)}</span>
              {budget > 0 && <span className={a.total > budget ? "text-destructive" : "text-brand"}>{a.total > budget ? `${fmtJOD(a.total - budget)} ${tr("over budget")}` : tr("Within budget")}</span>}
              {best?.id === a.id && <PilotBadge>{tr("Lowest total")}</PilotBadge>}
              <label className="ms-auto flex items-center gap-1.5 text-xs">
                <input type="checkbox" checked={a.verified} onChange={(e) => setAlt(a.id, { verified: e.target.checked })} /> {tr(a.verified ? "Price I verified" : "Unverified price")}
              </label>
            </div>
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