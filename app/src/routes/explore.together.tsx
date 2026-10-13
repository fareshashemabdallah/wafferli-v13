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
      { title: "Dabberna Together — Plan any outing" },
      { name: "description", content: "Plan an outing, account for children and let the group vote on activities, venues or trips." },
      { property: "og:title", content: "Dabberna Together" },
      { property: "og:description", content: "Plan food, family activities, entertainment, outdoors or trips with friends and family." },
    ],
  }),
  component: TogetherPage,
});

const defaults = [
  { name: "", note: "" },
  { name: "", note: "" },
  { name: "", note: "" },
];
const ages = [
  { value:"0-2",label:"0–2 (babies / toddlers)" },
  { value:"3-5",label:"3–5 (preschool)" },
  { value:"6-9",label:"6–9" },
  { value:"10-12",label:"10–12" },
  { value:"13-17",label:"13–17 (teens)" },
] as const;
const activityTypes = {
  food: { label:"Food & cafés", query:"restaurants cafes" },
  family: { label:"Family & children's activities", query:"family kids attractions playground" },
  entertainment: { label:"Entertainment & events", query:"cinema entertainment events" },
  outdoors: { label:"Parks & outdoor adventures", query:"parks outdoor activities" },
  sports: { label:"Sports & games", query:"sports bowling games" },
  culture: { label:"Culture & learning", query:"museums exhibitions cultural activities" },
  trip: { label:"Trips & experiences", query:"day trips attractions" },
  other: { label:"Other / undecided", query:"things to do" },
} as const;
type ActivityType = keyof typeof activityTypes;
type ChildAttendance = "no" | "yes" | "unsure";
type ChildFocus = "children" | "mixed" | "adults";
const focusNames: Record<ChildFocus,string> = {
  children:"Children are the main focus",
  mixed:"Family outing — everyone has fun",
  adults:"Adult-focused outing — children joining",
};

function TogetherPage() {
  const navigate = useNavigate();
  const [saved, setSaved] = useLocalState<SavedOuting[]>("outings", []);
  const [f, setF] = useState({ title: "Our outing", event_at: "", neighborhood: "Amman", friends: "6", organizer: "", budget: "", whoPays: "later", activity:"other" as ActivityType });
  const [children, setChildren] = useState<ChildAttendance>("unsure");
  const [childFocus, setChildFocus] = useState<ChildFocus>("mixed");
  const [childCount, setChildCount] = useState("1");
  const [ageBands, setAgeBands] = useState<string[]>([]);
  const [stroller, setStroller] = useState(false);
  const [quiet, setQuiet] = useState(false);
  const [shareTheme, setShareTheme] = useState(true);
  const lookupSuggestion = [
    children === "yes" && childFocus === "children" ? "kids children age-appropriate" :
    children === "yes" && childFocus === "mixed" ? "family friendly children welcome" :
    children === "yes" ? "children welcome family suitable" : "adults",
    activityTypes[f.activity].query, f.neighborhood.trim() || "Amman", "Jordan"
  ].join(" ");
  const googleActivitiesLink = "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(lookupSuggestion);
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
    const kids = Number(childCount);
    if (children === "yes" && (!Number.isInteger(kids) || kids < 1 || kids > 30))
      return setErr("Enter the approximate number of children (1–30).");
    if (!Number.isInteger(n) || n < 2 || n > 30) return setErr("Number of friends must be 2–30.");
    if (clean.length < 3 || clean.length > 10) return setErr("Add 3 to 10 named venues or activities.");
    setErr(""); setBusy(true);
    try {
      // Only the general family theme is placed in the public title, with opt-in consent.
      // Children's count, ages and practical needs stay on the organizer's device.
      const theme = children === "yes" ? childFocus === "children" ? " · Kids-focused" : childFocus === "mixed" ? " · Family outing" : " · Kids attending" :
        children === "unsure" ? " · Kids TBD" : "";
      const publicTitle = shareTheme && theme ? f.title.trim().slice(0, 80 - theme.length) + theme : f.title.trim();
      const r = await createOuting({ title: publicTitle, event_at: f.event_at, neighborhood: f.neighborhood, friend_count: n, organizer_name: f.organizer, options: clean });
      setSaved((s) => [{ ...r, title: publicTitle,
        ...(f.budget ? { budget: f.budget } : {}), whoPays: f.whoPays,
        activity: f.activity, childrenAttendance: children,
        ...(children === "yes" ? { childrenFocus: childFocus, childCount: kids, ageBands, stroller, quiet } : {}),
        created: new Date().toISOString(),
      }, ...s].slice(0, 20));
      toast.success("Vote created");
      navigate({ to: "/together/$adminToken", params: { adminToken: r.admin_token } });
    } catch (x) {
      setErr(x instanceof Error ? x.message : "Could not create the vote.");
    } finally { setBusy(false); }
  };

  return (
    <AppShell title="Dabberna Together">
      <Notice>Plan <strong>any outing</strong> — a café, cinema, kids' activity, park, game or day trip. Consider children before choosing options. The vote works without an account. Safety, age restrictions and prices must be checked with each venue.</Notice>

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
        <Field label="Outing name"><Input className={inputCls} maxLength={80} value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></Field>
        <Field label="What kind of outing?">
          <NativeSelect value={f.activity} onChange={e=>setF({ ...f, activity: e.target.value as ActivityType })}>
            {(Object.keys(activityTypes) as ActivityType[]).map(key=><option key={key} value={key}>{activityTypes[key].label}</option>)}
          </NativeSelect>
        </Field>
        <Field label="Date & time"><Input className={inputCls} type="datetime-local" value={f.event_at} onChange={(e) => setF({ ...f, event_at: e.target.value })} /></Field>
        <Field label="Neighborhood"><Input className={inputCls} maxLength={60} value={f.neighborhood} onChange={(e) => setF({ ...f, neighborhood: e.target.value })} /></Field>
        <Field label="Number of voters (2–30)" hint="People expected to vote; children do not need their own accounts">
          <Input className={inputCls} inputMode="numeric" value={f.friends} onChange={(e) => setF({ ...f, friends: e.target.value })} />
        </Field>
        <Field label="Your display name (optional)" hint="Shown to friends"><Input className={inputCls} maxLength={40} value={f.organizer} onChange={(e) => setF({ ...f, organizer: e.target.value })} /></Field>
        <Field label="Budget per person (optional, private)" hint="Only you see this — never shared"><Input className={inputCls} maxLength={30} value={f.budget} onChange={(e) => setF({ ...f, budget: e.target.value })} /></Field>
        <section className="sm:col-span-2 space-y-3 rounded-2xl border bg-muted/30 p-4" aria-label="Children joining the outing">
          <h2 className="font-semibold">Are children joining? · هل الأطفال معنا؟</h2>
          <Field label="Children attending">
            <NativeSelect value={children} onChange={e=>setChildren(e.target.value as ChildAttendance)}>
              <option value="no">No — adults only</option>
              <option value="yes">Yes — children are coming</option>
              <option value="unsure">Not sure yet</option>
            </NativeSelect>
          </Field>
          {children === "yes" && <>
            <Field label="Who is this outing mainly for?">
              <NativeSelect value={childFocus} onChange={e=>setChildFocus(e.target.value as ChildFocus)}>
                <option value="children">Children-focused — kids' enjoyment comes first</option>
                <option value="mixed">Family / mixed — suitable for adults and children</option>
                <option value="adults">Adult-focused — but children will be present</option>
              </NativeSelect>
            </Field>
            <Field label="Approximate number of children" hint="Planning estimate; no children's names are collected">
              <Input className={inputCls} inputMode="numeric" value={childCount} onChange={e=>setChildCount(e.target.value)} />
            </Field>
            <div>
              <p className="mb-2 text-sm font-medium">Children's age groups (optional)</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {ages.map(group=><label key={group.value} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={ageBands.includes(group.value)} onChange={e=>setAgeBands(old=>e.target.checked ? [...old,group.value] : old.filter(v=>v!==group.value))} />
                  {group.label}
                </label>)}
              </div>
            </div>
            <div className="grid gap-2">
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={stroller} onChange={e=>setStroller(e.target.checked)} /> Stroller or step-free access needed</label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={quiet} onChange={e=>setQuiet(e.target.checked)} /> Prefer quiet / low-noise environments</label>
            </div>
            <p className="rounded-xl bg-card p-3 text-xs text-muted-foreground">
              <strong>{focusNames[childFocus]}.</strong> Check child admission and age limits, smoking exposure, safe facilities, travel time, suitable food and the children's cost.
              {stroller ? " Prioritize stroller access." : ""}{quiet ? " Avoid noisy venues." : ""}
              {" "}Dabberna does not independently verify venue safety.
            </p>
          </>}
          {children === "unsure" && <p className="text-xs text-muted-foreground">Do not finalize adults-only or age-restricted options until attendance is confirmed.</p>}
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={shareTheme} onChange={e=>setShareTheme(e.target.checked)} />
            Include a general family/kids label in the shared outing title
          </label>
          <p className="text-xs text-muted-foreground">Counts, age groups and preferences remain only in your organizer notes on this device. Only a general label is shared when selected.</p>
        </section>
        <div className="sm:col-span-2 rounded-xl border p-3 text-sm">
          <div className="font-medium">Find activity ideas</div>
          <p className="mt-1 text-xs text-muted-foreground">Opens Google Maps with your outing type and general family focus. This is not yet an AI recommendation or a verified safety search.</p>
          <a href={googleActivitiesLink} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center rounded-lg border px-3 py-2 font-semibold text-brand underline-offset-4 hover:underline">
            Search {children === "yes" ? "suitable family activities" : "activities"} near {f.neighborhood || "Amman"} ↗
          </a>
        </div>
        <Field label="Who pays (private note)" hint="Not shown in the vote">
          <NativeSelect value={f.whoPays} onChange={(e) => setF({ ...f, whoPays: e.target.value })}>
            <option value="later">Decide later</option><option value="equal">Equal split</option>
            <option value="separate">Everyone pays their own</option><option value="host">Host pays</option>
          </NativeSelect>
        </Field>

        <div className="sm:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Venues or activities to vote on ({opts.length}/10)</h2>
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
        <Button type="submit" size="lg" className="h-12 sm:col-span-2" disabled={busy}>{busy ? "Creating…" : "Create outing vote & get link"}</Button>
      </form>
    </AppShell>
  );
}