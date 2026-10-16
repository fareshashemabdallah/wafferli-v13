import { useI18n } from "@/lib/i18n";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Plus, Trash2 } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { AppShell, Notice } from "@/components/AppShell";
import { PlanContextBanner } from "@/components/PlanContextBanner";
import {ChildAwareOutingCompare} from "@/components/ChildAwareOutingCompare";
import { Field, NativeSelect, inputCls } from "@/components/Field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createOuting, type SavedOuting } from "@/lib/outings";
import { readLocal,useLocalState } from "@/lib/storage";
import {WEEKEND_HANDOFF_KEY,usableWeekendDraft} from "@/lib/weekendOutingHandoff";
import {defaultFamilyPreferences,type FamilyPreferences} from "@/lib/familyPreferences";
import {ACTIVE_PLAN_KEY,FAMILY_PLANS_KEY,setPlanChoice,type FamilyPlan} from "@/lib/familyPlans";
import { estimateOutingCost, formatJod, optionalJod, parseAttendees, parseJod } from "@/lib/outingCosts";

export const Route = createFileRoute("/explore/together")({
  head: () => ({
    meta: [
      { title: "Plan Together — Dabberna" },
      { name: "description", content: "Plan an outing, account for children and let the group vote on activities, venues or trips." },
      { property: "og:title", content: "Plan Together" },
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
  const { tr,lang } = useI18n();
  const ar=lang==="ar";
  const navigate = useNavigate();
  const [saved, setSaved] = useLocalState<SavedOuting[]>("outings", []);
  const [familyPrefs,,prefsReady]=useLocalState<FamilyPreferences>("familyPreferences",defaultFamilyPreferences);
  const preferencesApplied=useRef(false);
  const [plans,setPlans]=useLocalState<FamilyPlan[]>(FAMILY_PLANS_KEY,[]);
  const [activePlanId]=useLocalState<string|null>(ACTIVE_PLAN_KEY,null);
  const familyPlan=plans.find(p=>p.id===activePlanId&&p.kind==="outing"&&p.status!=="completed");
  const [f, setF] = useState({ title: "Our outing", event_at: "", neighborhood: "Amman", friends: "6", organizer: "", whoPays: "later", activity:"other" as ActivityType });
  const [children, setChildren] = useState<ChildAttendance>("unsure");
  const [childFocus, setChildFocus] = useState<ChildFocus>("mixed");
  useEffect(()=>{
   if(!prefsReady||preferencesApplied.current)return;
   preferencesApplied.current=true;
   setChildren(familyPrefs.typicalChildrenAttendance==="yes"?"yes":familyPrefs.typicalChildrenAttendance==="no"?"no":"unsure");
   setChildFocus(familyPrefs.typicalOutingFocus??"mixed");
   if(familyPrefs.city?.trim())setF(old=>({...old,neighborhood:familyPrefs.city.trim().slice(0,60)}));
  },[prefsReady,familyPrefs]);
  const [childCount, setChildCount] = useState("1");
  const [weekendDraft]=useState(()=>usableWeekendDraft(readLocal(WEEKEND_HANDOFF_KEY,null)));
  const [cost, setCost] = useState({
    adults: "2", adultRate: "", childRate: "", transport: "", extras: "", maximum: weekendDraft?String(weekendDraft.budgetJod):""
  });
  const [ageBands, setAgeBands] = useState<string[]>([]);
  const [stroller, setStroller] = useState(false);
  const [quiet, setQuiet] = useState(false);
  const [shareTheme, setShareTheme] = useState(true);
  const lookupSuggestion = [
    children === "yes" && childFocus === "children" ? "kids activities age appropriate" :
    children === "yes" && childFocus === "mixed" ? "family friendly adults and children" :
    children === "yes" ? "children welcome family suitable" :
    children === "unsure" ? "family friendly" : "adults",
    children === "yes" && ageBands.length > 0 ? "ages " + ageBands.join(" ") : "",
    children === "yes" && stroller ? "stroller accessible" : "",
    children === "yes" && quiet ? "quiet low noise" : "",
    activityTypes[f.activity].query, f.neighborhood.trim() || "Amman", "Jordan"
  ].filter(Boolean).join(" ");
  const googleActivitiesLink = "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(lookupSuggestion);
  const estimate = estimateOutingCost({...cost, children, childCount});
  const updateCost = (field: keyof typeof cost, value: string) => setCost(old=>({...old,[field]:value}));
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
  const [showVoteForm,setShowVoteForm]=useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const n = Number(f.friends);
    const clean = opts.map((o) => ({ name: o.name.trim(), note: o.note.trim() })).filter((o) => o.name);
    if (!f.title.trim()) return setErr(tr("Please add a title."));
    const kids = Number(childCount);
    if (children === "yes" && (!Number.isInteger(kids) || kids < 1 || kids > 30))
      return setErr(tr("Enter the approximate number of children (1–30)."));
    if (parseAttendees(cost.adults) === null)
      return setErr(tr("Enter the number of adults attending (1–30), separately from the voters."));
    if ([cost.adultRate,cost.transport,cost.extras,cost.maximum,...(children === "yes" ? [cost.childRate] : [])]
        .some(value => value.trim() !== "" && parseJod(value) === null))
      return setErr(tr("Enter valid costs in JOD (0–100,000, maximum two decimal places)."));
    if (!Number.isInteger(n) || n < 2 || n > 30) return setErr(tr("Number of friends must be 2–30."));
    if (clean.length < 3 || clean.length > 10) return setErr(tr("Add 3 to 10 named venues or activities."));
    setErr(""); setBusy(true);
    try {
      // Only the general family theme is placed in the public title, with opt-in consent.
      // Children's count, ages and practical needs stay on the organizer's device.
      const theme = children === "yes" ? childFocus === "children" ? " · "+tr("Kids-focused") : childFocus === "mixed" ? " · "+tr("Family outing") : " · "+tr("Kids attending") :
        children === "unsure" ? " · "+tr("Kids TBD") : "";
      const publicTitle = shareTheme && theme ? f.title.trim().slice(0, 80 - theme.length) + theme : f.title.trim();
      const r = await createOuting({ title: publicTitle, event_at: f.event_at, neighborhood: f.neighborhood, friend_count: n, organizer_name: f.organizer, options: clean });
      setSaved((s) => [{ ...r, title: publicTitle, whoPays: f.whoPays,
        activity: f.activity, childrenAttendance: children,
        ...(children === "yes" ? { childrenFocus: childFocus, childCount: kids, ageBands, stroller, quiet } : {}),
        adultCount: parseAttendees(cost.adults)!, 
        ...(cost.adultRate.trim() !== "" ? { adultCostPerPerson: parseJod(cost.adultRate)! } : {}),
        ...(children === "yes" && cost.childRate.trim() !== "" ? { childCostPerPerson: parseJod(cost.childRate)! } : {}),
        travelCost: optionalJod(cost.transport) ?? 0,
        otherCost: optionalJod(cost.extras) ?? 0,
        ...(estimate.maximum !== null ? { totalBudget: estimate.maximum } : {}),
        ...(estimate.estimatedTotal !== null ? { estimatedTotal: estimate.estimatedTotal } : {}),
        created: new Date().toISOString(),
      }, ...s].slice(0, 20));
      toast.success(tr("Vote created"));
      navigate({ to: "/together/$adminToken", params: { adminToken: r.admin_token } });
    } catch (x) {
      setErr(x instanceof Error ? x.message : "Could not create the vote.");
    } finally { setBusy(false); }
  };

  return (
    <AppShell title={tr("Plan Together")}>
      <PlanContextBanner onUseBudget={amount=>updateCost("maximum",String(amount))}/>
      {weekendDraft&&<div className="mb-4 rounded-xl border border-[#D8E6D5] bg-[#F2F8EE] p-3 text-sm">
       <p className="font-semibold">{ar?"نقلت سقف التخطيط من تقييم الويكند":"Planning ceiling carried from your weekend check"} · {weekendDraft.budgetJod} JOD</p>
       <p className="mt-1 text-xs text-muted-foreground">{ar?
        "هذا السقف تقديري، مش مبلغ مضمون للإنفاق. تم نقله باختيارك ولم يتغير رصيدك.":
        "This is an estimated planning ceiling—not confirmed money to spend. You chose to carry it here; no cash record changed."}</p>
      </div>}
      <p className="mb-4 text-sm text-muted-foreground">{tr("Plan a great experience together—balance everyone’s enjoyment, needs and your planned budget.")}</p>
      {familyPlan&&<div className="mb-4 rounded-2xl border border-[#D9E5D8] bg-[#F4F9F1] p-4">
       <p className="text-sm font-semibold">{tr("Save an outing estimate to your plan")} · {familyPlan.title}</p>
       <p className="mt-1 text-xs text-muted-foreground">{tr("Only the outing title and estimate are saved on this device. Creating a public vote remains optional.")}</p>
       <div className="mt-2 flex flex-wrap items-center gap-2">
        <Button size="sm" variant="outline" onClick={()=>{
          const amount=estimate.estimatedTotal??estimate.maximum??undefined;
          const updated=setPlanChoice(familyPlan,{label:f.title.trim()||familyPlan.title,...(amount!==undefined?{estimatedJod:amount}:{}) ,source:"outing"});
          setPlans(prev=>prev.map(p=>p.id===familyPlan.id?{...updated,...(f.event_at?{date:f.event_at.slice(0,10)}:{})}:p));
          toast.success(tr("Outing estimate saved to your plan."));
        }}>{tr("Save to plan")}</Button>
        <Link to="/plans" className="text-xs font-semibold text-brand underline">{tr("Open plan")} →</Link>
       </div>
      </div>}
      <div className="mt-4 rounded-2xl border border-[#D7E5D3] bg-[#F2F8EE] p-4">
        <h2 className="text-lg font-semibold">{ar?"بلّش بالأفكار، مش باستمارة طويلة":"Start with ideas, not a long form"}</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
         {ar?"سنفتح قوائم أنشطة خارجية حسب المنطقة ومشاركة الأطفال اللي اخترتها. دبّرنا لا يؤكد سلامة المكان أو السعر أو دخول الأطفال أو التوفر.":
"We'll search current external activity listings using your chosen area and attendance settings. Dabberna does not verify venue safety, pricing, admission or availability."}
        </p>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <a href={googleActivitiesLink} target="_blank" rel="noopener noreferrer" className="flex min-h-30 flex-col justify-center rounded-2xl border border-border bg-white p-4 transition hover:border-brand/40">
          <span className="text-base font-semibold text-brand">① {tr("Find activity ideas")}</span>
          <span className="mt-2 text-sm text-muted-foreground">{tr("Search")} {tr("near")} {f.neighborhood || tr("Amman")} ↗</span>
        </a>
        <button type="button" onClick={()=>setShowVoteForm(v=>!v)} className={"min-h-30 rounded-2xl border p-4 text-start transition "+(showVoteForm?"border-brand bg-mint":"border-border bg-white hover:border-brand/40")}>
          <span className="block text-base font-semibold text-brand">② {tr("Plan together with your circle")}</span>
          <span className="mt-2 block text-sm text-muted-foreground">{showVoteForm?(tr("Close")+" −"):(tr("Create outing vote & get link")+" →")}</span>
        </button>
      </div>
      <details className="mt-4 rounded-2xl border border-[#DFE7DC] bg-white p-4">
       <summary className="min-h-11 cursor-pointer text-sm font-semibold text-brand">
        {ar?"اختياري: قارن الأماكن حسب أعمار الأطفال والميزانية":"Optional: compare places against your children's needs and your budget"} +
       </summary>
       <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{ar?"استخدمها بعد ما تختار أماكن ممكنة. تأكد من دخول الأطفال والأعمار والأسعار والتوفر مع المكان.":
"Use this after you have shortlisted places. Child admission, ages, prices and availability must be confirmed with providers."}</p>
       <ChildAwareOutingCompare childrenAttendance={children} ages={ageBands}
        stroller={stroller} quiet={quiet} maximum={cost.maximum} city={f.neighborhood}
        preferredDistance={familyPrefs.distanceKm}/>
      </details>
      <details className="mt-3 text-xs text-muted-foreground"><summary className="cursor-pointer">{tr("A note on choosing safe, suitable venues")}</summary>
        <p className="mt-2">{tr("Check child admission, age limits, access, venue safety and prices directly with the provider. Google Maps results are third-party information.")}</p>
      </details>

      {saved.length > 0 && (
        <section className="card-soft mt-4 p-4">
          <h2 className="font-semibold">{tr("Your outings")}</h2>
          <ul className="mt-2 divide-y">
            {saved.map((o) => (
              <li key={o.admin_token} className="flex items-center justify-between py-2 text-sm">
                <span className="truncate">{o.title}</span>
                <Link to="/together/$adminToken" params={{ adminToken: o.admin_token }} className="font-semibold text-brand">{tr("Results →")}</Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {showVoteForm&&<form onSubmit={submit} className="card-soft mt-4 grid gap-4 p-4 sm:grid-cols-2">
       <p className="sm:col-span-2 text-sm font-medium text-brand">{tr("Choose a few places and invite your group to vote.")}</p>
        <Field label={tr("Outing name")}><Input className={inputCls} maxLength={80} value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></Field>
        <Field label={tr("What kind of outing?")}>
          <NativeSelect value={f.activity} onChange={e=>setF({ ...f, activity: e.target.value as ActivityType })}>
            {(Object.keys(activityTypes) as ActivityType[]).map(key=><option key={key} value={key}>{tr(activityTypes[key].label)}</option>)}
          </NativeSelect>
        </Field>
        <Field label={tr("Date & time")}><Input className={inputCls} type="datetime-local" value={f.event_at} onChange={(e) => setF({ ...f, event_at: e.target.value })} /></Field>
        <Field label={tr("Neighborhood")}><Input className={inputCls} maxLength={60} value={f.neighborhood} onChange={(e) => setF({ ...f, neighborhood: e.target.value })} /></Field>
        <Field label={tr("Number of voters (2–30)")} hint={tr("People expected to vote; children do not need their own accounts")}>
          <Input className={inputCls} inputMode="numeric" value={f.friends} onChange={(e) => setF({ ...f, friends: e.target.value })} />
        </Field>
        <Field label={tr("Your display name (optional)")} hint={tr("Shown to friends")}><Input className={inputCls} maxLength={40} value={f.organizer} onChange={(e) => setF({ ...f, organizer: e.target.value })} /></Field>
         <section className="sm:col-span-2 space-y-3 rounded-2xl border bg-muted/30 p-4" aria-label={tr("Children joining the outing")}>
          <h2 className="font-semibold">{tr("Are children joining? · هل الأطفال معنا؟")}</h2>
          <Field label={tr("Children attending")}>
            <NativeSelect value={children} onChange={e=>setChildren(e.target.value as ChildAttendance)}>
              <option value="no">{tr("No — adults only")}</option>
              <option value="yes">{tr("Yes — children are coming")}</option>
              <option value="unsure">{tr("Not sure yet")}</option>
            </NativeSelect>
          </Field>
          {children === "yes" && <>
            <Field label={tr("Who is this outing mainly for?")}>
              <NativeSelect value={childFocus} onChange={e=>setChildFocus(e.target.value as ChildFocus)}>
                <option value="children">{tr("Children-focused — kids' enjoyment comes first")}</option>
                <option value="mixed">{tr("Family / mixed — suitable for adults and children")}</option>
                <option value="adults">{tr("Adult-focused — but children will be present")}</option>
              </NativeSelect>
            </Field>
            <Field label={tr("Approximate number of children")} hint={tr("Planning estimate; no children's names are collected")}>
              <Input className={inputCls} inputMode="numeric" value={childCount} onChange={e=>setChildCount(e.target.value)} />
            </Field>
            <details>
              <summary className="cursor-pointer text-sm font-semibold text-brand">{tr("Children's age groups (optional)")} +</summary>
              <div className="mt-3">
              <div className="grid gap-2 sm:grid-cols-2">
                {ages.map(group=><label key={group.value} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={ageBands.includes(group.value)} onChange={e=>setAgeBands(old=>e.target.checked ? [...old,group.value] : old.filter(v=>v!==group.value))} />
                  {tr(group.label)}
                </label>)}
              </div>
              </div>
            </details>
            <div className="grid gap-2">
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={stroller} onChange={e=>setStroller(e.target.checked)} /> {tr("Stroller or step-free access needed")}</label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={quiet} onChange={e=>setQuiet(e.target.checked)} /> {tr("Prefer quiet / low-noise environments")}</label>
            </div>
            <p className="rounded-xl bg-card p-3 text-xs text-muted-foreground">
              <strong>{tr(focusNames[childFocus])}.</strong> {tr("Check child admission and age limits, smoking exposure, safe facilities, travel time, suitable food and the children's cost.")}
              {stroller ? " "+tr("Prioritize stroller access.") : ""}{quiet ? " "+tr("Avoid noisy venues.") : ""}
              {" "}{tr("Dabberna does not independently verify venue safety.")}
            </p>
          </>}
          {children === "unsure" && <p className="text-xs text-muted-foreground">{tr("Do not finalize adults-only or age-restricted options until attendance is confirmed.")}</p>}
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={shareTheme} onChange={e=>setShareTheme(e.target.checked)} /> {tr("Include a general family/kids label in the shared outing title")} </label>
          <p className="text-xs text-muted-foreground">{tr("Counts, age groups and preferences remain only in your organizer notes on this device. Only a general label is shared when selected.")}</p>
        </section>
        <details className="sm:col-span-2 rounded-2xl border border-border bg-white p-4"><summary className="cursor-pointer text-sm font-semibold text-brand">{tr("Outing cost calculator")} +</summary>
        <section className="mt-3 space-y-3" aria-label={tr("Outing cost calculator")}>
          <div>
            <h2 className="font-semibold">{tr("Outing budget calculator · ميزانية الطلعة")}</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              {tr("Private estimates in Jordanian dinars (JOD). Adult and child prices are separate; do not assume children pay adult prices. Leave a price blank if unknown, or enter 0 for free admission.")}
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label={tr("Adults attending")} hint={tr("Separate from number of voters")}>
              <Input className={inputCls} type="number" inputMode="numeric" min="1" max="30" step="1"
                value={cost.adults} onChange={e=>updateCost("adults",e.target.value)} />
            </Field>
            <Field label={tr("Estimated cost per adult (JOD)")} hint={tr("Entry, food or activity for one adult")}>
              <Input className={inputCls} type="number" inputMode="decimal" min="0" max="100000" step="0.01"
                placeholder={tr("e.g. 20")} value={cost.adultRate} onChange={e=>updateCost("adultRate",e.target.value)} />
            </Field>
            {children === "yes" && <Field label={tr("Estimated cost per child (JOD)")} hint={tr("Enter 0 if children enter free; check age-based discounts")}>
              <Input className={inputCls} type="number" inputMode="decimal" min="0" max="100000" step="0.01"
                placeholder={tr("e.g. 10")} value={cost.childRate} onChange={e=>updateCost("childRate",e.target.value)} />
            </Field>}
            <Field label={tr("Transport for the whole group (JOD)")} hint={tr("Total cost, not per person")}>
              <Input className={inputCls} type="number" inputMode="decimal" min="0" max="100000" step="0.01"
                placeholder={tr("e.g. 8")} value={cost.transport} onChange={e=>updateCost("transport",e.target.value)} />
            </Field>
            <Field label={tr("Other shared costs (JOD)")} hint={tr("Parking, equipment, babysitting, extras, etc.")}>
              <Input className={inputCls} type="number" inputMode="decimal" min="0" max="100000" step="0.01"
                placeholder={tr("e.g. 5")} value={cost.extras} onChange={e=>updateCost("extras",e.target.value)} />
            </Field>
            <Field label={tr("Maximum budget for entire outing (JOD)")} hint={tr("Optional spending limit for everyone together")}>
              <Input className={inputCls} type="number" inputMode="decimal" min="0" max="100000" step="0.01"
                placeholder={tr("e.g. 100")} value={cost.maximum} onChange={e=>updateCost("maximum",e.target.value)} />
            </Field>
          </div>
          <div className="rounded-2xl bg-muted p-4" aria-live="polite">
            <h3 className="font-semibold">{tr("Estimated cost for the whole outing")}</h3>
            <div className="mt-2 space-y-1 text-sm">
              <div className="flex justify-between gap-2">
                <span>{tr("Adults")} ({estimate.adults ?? "?"})</span>
                <span className="font-semibold">{estimate.adultSubtotal !== null ? formatJod(estimate.adultSubtotal)  : tr("Price needed")}</span>
              </div>
              {children === "yes" && <div className="flex justify-between gap-2">
                <span>{tr("Children")} ({estimate.children ?? "?"})</span>
                <span className="font-semibold">{estimate.childSubtotal !== null ? formatJod(estimate.childSubtotal)  : tr("Price needed")}</span>
              </div>}
              <div className="flex justify-between gap-2"><span>{tr("Transport + other shared costs")}</span>
                <span>{estimate.transport !== null && estimate.extras !== null ? formatJod(estimate.transport + estimate.extras)  : tr("Check amounts")}</span>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap items-baseline justify-between gap-2 border-t pt-3">
              <strong>{tr("Estimated total")}</strong>
              <strong className="text-xl">{estimate.estimatedTotal !== null ? formatJod(estimate.estimatedTotal)  : tr("Not available yet")}</strong>
            </div>
            {children === "unsure" && <p className="mt-2 text-xs text-muted-foreground"> {tr("Children may join: the final total remains unknown until attendance and children's costs are confirmed.")} </p>}
            {children === "yes" && estimate.childRate === null && <p className="mt-2 text-xs text-muted-foreground"> {tr("Please enter an estimated child price (0 if free) to calculate the full group total.")} </p>}
            {estimate.adultRate === null && <p className="mt-2 text-xs text-muted-foreground"> {tr("Enter the estimated adult price to calculate the full group total.")} </p>}
            {estimate.remaining !== null && <p className={"mt-3 font-semibold " + (estimate.remaining >= 0 ? "text-emerald-700 dark:text-emerald-300" : "text-destructive")}>
              {estimate.remaining >= 0 ? tr("Within budget — ")+formatJod(estimate.remaining)+" "+tr("remaining") : tr("Over budget by ")+formatJod(-estimate.remaining)}
            </p>}
            <p className="mt-3 text-xs text-muted-foreground"> {tr("Planning estimate only. Actual venue prices, taxes, tips, transport and child discounts may differ. Blank optional extras are treated as 0.")} </p>
          </div>
        </section></details>
        <div className="sm:col-span-2 rounded-xl border p-3 text-sm">
          <div className="font-medium">{tr("Find activity ideas")}</div>
          <p className="mt-1 text-xs text-muted-foreground">{tr("Opens Google Maps with your outing type and general family focus. This is not yet an AI recommendation or a verified safety search.")}</p>
          <a href={googleActivitiesLink} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center rounded-lg border px-3 py-2 font-semibold text-brand underline-offset-4 hover:underline">
            {tr("Search")} {tr(children === "yes" ? "suitable family activities" : "activities")} {tr("near")} {f.neighborhood || tr("Amman")} ↗
          </a>
        </div>
        <Field label={tr("Who pays (private note)")} hint={tr("Not shown in the vote")}>
          <NativeSelect value={f.whoPays} onChange={(e) => setF({ ...f, whoPays: e.target.value })}>
            <option value="later">{tr("Decide later")}</option><option value="equal">{tr("Equal split")}</option>
            <option value="separate">{tr("Everyone pays their own")}</option><option value="host">{tr("Host pays")}</option>
          </NativeSelect>
        </Field>

        <div className="sm:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">{tr("Venues or activities to vote on")} ({opts.length}/10)</h2>
            <Button type="button" size="sm" variant="secondary" disabled={opts.length >= 10} onClick={() => setOpts([...opts, { name: "", note: "" }])}><Plus className="size-4" /> {tr("Add")}</Button>
          </div>
          <ol className="mt-2 space-y-2">
            {opts.map((o, i) => (
              <li key={i} className="flex gap-2 rounded-xl bg-muted p-2">
                <div className="grid flex-1 gap-2">
                  <Input aria-label={`${tr("Option")} ${i + 1} ${tr("name")}`} className={inputCls} maxLength={80} value={o.name} placeholder={`${tr("Option")} ${i + 1}`} onChange={(e) => setOpts(opts.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} />
                  <Input aria-label={`${tr("Option")} ${i + 1} ${tr("note")}`} className="h-10 bg-card" maxLength={160} value={o.note} placeholder={tr("Short note (optional)")} onChange={(e) => setOpts(opts.map((x, j) => (j === i ? { ...x, note: e.target.value } : x)))} />
                </div>
                <Button type="button" size="icon" variant="ghost" aria-label={`${tr("Remove")} ${tr("Option")} ${i + 1}`} disabled={opts.length <= 3} onClick={() => setOpts(opts.filter((_, j) => j !== i))}><Trash2 className="size-4" /></Button>
              </li>
            ))}
          </ol>
        </div>
        {err && <p className="text-sm text-destructive sm:col-span-2" role="alert">{err}</p>}
        <Button type="submit" size="lg" className="h-12 sm:col-span-2" disabled={busy}>{tr(busy ? "Creating…" : "Create outing vote & get link")}</Button>
      </form>}
    </AppShell>
  );
}