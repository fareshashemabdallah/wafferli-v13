import { createFileRoute, Link } from "@tanstack/react-router";
import { MapPin } from "lucide-react";
import { useState } from "react";
import { AppShell, Notice, PilotBadge } from "@/components/AppShell";
import { Field, NativeSelect } from "@/components/Field";
import { budgetLabel, sampleRestaurants } from "@/lib/restaurants";

export const Route = createFileRoute("/explore/restaurants")({
  head: () => ({
    meta: [
      { title: "Restaurant Discovery — Wafferli" },
      { name: "description", content: "Filter sample Amman restaurant listings by cuisine, argeeleh, budget and area." },
      { property: "og:title", content: "Restaurant Discovery — Wafferli" },
      { property: "og:description", content: "Sample listings for planning outings in Amman." },
    ],
  }),
  component: Restaurants,
});

function Restaurants() {
  const [cuisine, setCuisine] = useState("all");
  const [arg, setArg] = useState("any");
  const [budget, setBudget] = useState("any");
  const [area, setArea] = useState("all");
  const areas = [...new Set(sampleRestaurants.map((r) => r.area))];
  const list = sampleRestaurants.filter(
    (r) => (cuisine === "all" || r.cuisine === cuisine) && (arg === "any" || (arg === "yes") === r.argeeleh) && (budget === "any" || r.budget <= Number(budget)) && (area === "all" || r.area === area),
  );
  return (
    <AppShell title="Restaurants">
      <Notice>Sample listings — not real venues. Verify prices, hours and reservations with the restaurant. No places service is connected yet.</Notice>
      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Field label="Cuisine"><NativeSelect value={cuisine} onChange={(e) => setCuisine(e.target.value)}><option value="all">All</option><option>Lebanese</option><option>Levantine</option><option>Grill</option><option>Cafe</option></NativeSelect></Field>
        <Field label="Argeeleh"><NativeSelect value={arg} onChange={(e) => setArg(e.target.value)}><option value="any">Any</option><option value="yes">Yes</option><option value="no">No</option></NativeSelect></Field>
        <Field label="Max budget"><NativeSelect value={budget} onChange={(e) => setBudget(e.target.value)}><option value="any">Any</option><option value="1">JD</option><option value="2">JDJD</option><option value="3">JDJDJD</option></NativeSelect></Field>
        <Field label="Area"><NativeSelect value={area} onChange={(e) => setArea(e.target.value)}><option value="all">All</option>{areas.map((a) => <option key={a}>{a}</option>)}</NativeSelect></Field>
      </div>
      {list.length === 0 ? (
        <p className="mt-6 rounded-xl bg-muted p-6 text-center text-sm text-muted-foreground">No sample places match these filters.</p>
      ) : (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {list.map((r) => (
            <article key={r.id} className="card-soft p-4">
              <div className="flex items-start justify-between gap-2"><h2 className="font-sans text-base font-semibold">{r.name}</h2><PilotBadge>Sample</PilotBadge></div>
              <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground"><MapPin className="size-3.5" />{r.area} · {r.cuisine} · {budgetLabel(r.budget)}{r.argeeleh && " · Argeeleh"}</p>
              <p className="mt-2 text-sm">{r.note}</p>
              <p className="mt-2 text-[11px] text-muted-foreground">Sample, verify with restaurant</p>
            </article>
          ))}
        </div>
      )}
      <Link to="/explore/together" className="mt-6 block rounded-2xl bg-lime p-4 text-center font-semibold text-ink">Plan a friends' vote →</Link>
    </AppShell>
  );
}