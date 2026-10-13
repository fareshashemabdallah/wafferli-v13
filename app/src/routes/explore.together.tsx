import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Plus, Trash2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { AppShell, Notice } from "@/components/AppShell";
import { Field, NativeSelect, inputCls } from "@/components/Field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createOuting, type SavedOuting } from "@/lib/outings";
import { useLocalState } from "@/lib/storage";

export const Route = createFileRoute("/explore/together")({
  head: () => ({
    meta: [
      { title: "Dabberna Together — Friends' restaurant vote" },
      { name: "description", content: "Create a restaurant vote for your friends in Amman and share one link on WhatsApp." },
      { property: "og:title", content: "Dabberna Together" },
      { property: "og:description", content: "Plan an outing and let friends vote — no account needed." },
    ],
  }),
  component: TogetherPage,
});

const defaults = [
  { name: "Lebanese restaurant with argeeleh (example)", note: "Edit name & area" },
  { name: "Rooftop mezze & argeeleh (example)", note: "" },
  { name: "Casual grill & argeeleh café (example)", note: "" },
];

function TogetherPage() {
  const navigate = useNavigate();
  const [saved, setSaved] = useLocalState<SavedOuting[]>("outings", []);
  const [f, setF] = useState({ title: "Friends night out", event_at: "", neighborhood: "Abdoun", friends: "6", organizer: "", budget: "", whoPays: "later" });
  const [opts, setOpts] = useState(() => {
    // Share selected real venues between the Places and Together screens, on this device only.
    try {
      const saved = JSON.parse(localStorage.getItem("dabberna.v13.restaurantSelections") || "[]");
      if (!Array.isArray(saved) || !saved.length) return defaults;
      const names = saved.filter((n): n is string => typeof n === "string" && !!n.trim()).slice(0,10);
      return Array.from({ length: Math.max(3, names.length) }, (_, i) => ({
        name: names[i] || "",
        note: names[i] ? "OpenStreetMap listing — verify venue details before booking" : "",
      }));
    } catch { return defaults; }
  });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const n = Number(f.friends);
    const clean = opts.map((o) => ({ name: o.name.trim(), note: o.note.trim() })).filter((o) => o.name);
    if (!f.title.trim()) return setErr("Please add a title.");
    if (!Number.isInteger(n) || n < 2 || n > 30) return setErr("Number of friends must be 2–30.");
    if (clean.length < 3 || clean.length > 10) return setErr("Add 3 to 10 named options.");
    setErr(""); setBusy(true);
    try {
      const r = await createOuting({ title: f.title.trim(), event_at: f.event_at, neighborhood: f.neighborhood, friend_count: n, organizer_name: f.organizer, options: clean });
      setSaved((s) => [{ ...r, title: f.title.trim(), ...(f.budget ? { budget: f.budget } : {}), whoPays: f.whoPays, created: new Date().toISOString() }, ...s].slice(0, 20));
      toast.success("Vote created");
      navigate({ to: "/together/$adminToken", params: { adminToken: r.admin_token } });
    } catch (x) {
      setErr(x instanceof Error ? x.message : "Could not create the vote.");
    } finally { setBusy(false); }
  };

  return (
    <AppShell title="Dabberna Together">
      <Notice>Create an outing, share one link, friends vote without an account. Choose places from Real Places or enter your own. All venue details must be verified before you invite friends.</Notice>

      {saved.length > 0 && (
        <section className="card-soft mt-4 p-4">
          <h2 className="font-semibold">Your outings</h2>
          <ul className="mt-2 divide-y">
            {saved.map((o) => (
              <li key={o.admin_token} className="flex items-center justify-between py-2 text-sm">
                <span className="truncate">{o.title}</span>
                <Link to="/together/$adminToken" params={{ adminToken: o.admin_token }} className="font-semibold text-brand">Results →</Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <form onSubmit={submit} className="card-soft mt-4 grid gap-4 p-4 sm:grid-cols-2">
        <Field label="Title"><Input className={inputCls} maxLength={80} value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></Field>
        <Field label="Date & time"><Input className={inputCls} type="datetime-local" value={f.event_at} onChange={(e) => setF({ ...f, event_at: e.target.value })} /></Field>
        <Field label="Neighborhood"><Input className={inputCls} maxLength={60} value={f.neighborhood} onChange={(e) => setF({ ...f, neighborhood: e.target.value })} /></Field>
        <Field label="Number of friends"><Input className={inputCls} inputMode="numeric" value={f.friends} onChange={(e) => setF({ ...f, friends: e.target.value })} /></Field>
        <Field label="Your display name (optional)" hint="Shown to friends"><Input className={inputCls} maxLength={40} value={f.organizer} onChange={(e) => setF({ ...f, organizer: e.target.value })} /></Field>
        <Field label="Budget per person (optional, private)" hint="Only you see this — never shared"><Input className={inputCls} maxLength={30} value={f.budget} onChange={(e) => setF({ ...f, budget: e.target.value })} /></Field>
        <Field label="Who pays (private note)" hint="Not shown in the vote">
          <NativeSelect value={f.whoPays} onChange={(e) => setF({ ...f, whoPays: e.target.value })}>
            <option value="later">Decide later</option><option value="equal">Equal split</option>
            <option value="separate">Everyone pays their own</option><option value="host">Host pays</option>
          </NativeSelect>
        </Field>

        <div className="sm:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Options ({opts.length}/10)</h2>
            <Button type="button" size="sm" variant="secondary" disabled={opts.length >= 10} onClick={() => setOpts([...opts, { name: "", note: "" }])}><Plus className="size-4" /> Add</Button>
          </div>
          <ol className="mt-2 space-y-2">
            {opts.map((o, i) => (
              <li key={i} className="flex gap-2 rounded-xl bg-muted p-2">
                <div className="grid flex-1 gap-2">
                  <Input aria-label={`Option ${i + 1} name`} className={inputCls} maxLength={80} value={o.name} placeholder={`Option ${i + 1}`} onChange={(e) => setOpts(opts.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} />
                  <Input aria-label={`Option ${i + 1} note`} className="h-10 bg-card" maxLength={160} value={o.note} placeholder="Short note (optional)" onChange={(e) => setOpts(opts.map((x, j) => (j === i ? { ...x, note: e.target.value } : x)))} />
                </div>
                <Button type="button" size="icon" variant="ghost" aria-label={`Remove option ${i + 1}`} disabled={opts.length <= 3} onClick={() => setOpts(opts.filter((_, j) => j !== i))}><Trash2 className="size-4" /></Button>
              </li>
            ))}
          </ol>
        </div>
        {err && <p className="text-sm text-destructive sm:col-span-2" role="alert">{err}</p>}
        <Button type="submit" size="lg" className="h-12 sm:col-span-2" disabled={busy}>{busy ? "Creating…" : "Create vote & get link"}</Button>
      </form>
    </AppShell>
  );
}