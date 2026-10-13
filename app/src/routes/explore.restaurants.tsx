import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { MapPin, Search, ExternalLink, Plus, Clock3 } from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";
import { AppShell, Notice } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, NativeSelect } from "@/components/Field";
import { filterPlaces, lookupOpenPlaces, searchAreas, type OpenPlace } from "@/lib/openPlaces";

export const Route = createFileRoute("/explore/restaurants")({
  head: () => ({
    meta: [
      { title: "Real places in Amman — Dabberna" },
      { name: "description", content: "Experimental lookup of real OpenStreetMap restaurants and cafes in selected Amman neighborhoods." },
    ],
  }),
  component: Restaurants,
});

const CHOSEN_KEY = "dabberna.v13.restaurantSelections";
function Restaurants() {
  const navigate = useNavigate();
  const [area, setArea] = useState<string>("abdoun");
  const [kind, setKind] = useState("all");
  const [cuisine, setCuisine] = useState("all");
  const [words, setWords] = useState("");
  const [loaded, setLoaded] = useState<OpenPlace[]>([]);
  const [searched, setSearched] = useState(false);
  const [updatedAt, setUpdatedAt] = useState(0);
  const [cached, setCached] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const shown = useMemo(() => filterPlaces(loaded,words,kind,cuisine),[loaded,words,kind,cuisine]);
  const submit = async (e: FormEvent) => {
    e.preventDefault(); setBusy(true); setError("");setSearched(false);
    try {
      const result = await lookupOpenPlaces(area);
      setLoaded(result.places); setCached(result.cached);
      setUpdatedAt(result.updatedAt); setSearched(true);
    } catch (e) {
      setLoaded([]); setError(e instanceof Error ? e.message : "Unable to search mapped places.");
    } finally { setBusy(false); }
  };
  const select = (place: OpenPlace) => {
    let names: string[] = [];
    try {
      const old = JSON.parse(localStorage.getItem(CHOSEN_KEY) || "[]");
      if (Array.isArray(old)) names = old.filter((n): n is string => typeof n === "string");
    } catch { /* empty */ }
    const next = [...new Set([...names, place.name])].slice(0,10);
    try { localStorage.setItem(CHOSEN_KEY,JSON.stringify(next)); } catch {}
    navigate({to:"/explore/together"});
  };
  return (
    <AppShell title="Real places in Amman">
      <Notice>
        <strong>Free experimental lookup, not AI or Google Places.</strong> Venues come from OpenStreetMap community records, not the earlier fictional examples.
        Information can be outdated or incomplete. Argeeleh, prices, hours and reservations are <strong>not verified</strong>.
      </Notice>
      <form onSubmit={submit} className="card-soft mt-4 space-y-3 p-4">
        <Field label="Neighborhood">
          <NativeSelect value={area} onChange={e=>{setArea(e.target.value);setLoaded([]);setSearched(false);}}>
            {searchAreas.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}
          </NativeSelect>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Place type">
            <NativeSelect value={kind} onChange={e=>setKind(e.target.value)}>
              <option value="all">Restaurants & cafés</option><option value="restaurant">Restaurants</option><option value="cafe">Cafés</option>
            </NativeSelect>
          </Field>
          <Field label="Tagged cuisine">
            <NativeSelect value={cuisine} onChange={e=>setCuisine(e.target.value)}>
              <option value="all">All / unknown</option><option value="lebanese">Lebanese</option><option value="arab">Arabic</option><option value="italian">Italian</option>
            </NativeSelect>
          </Field>
        </div>
        <Field label="Search by name or tagged cuisine">
          <Input value={words} onChange={e=>setWords(e.target.value)} maxLength={60} placeholder="Restaurant name, café, Lebanese..." />
        </Field>
        <Button type="submit" disabled={busy} className="h-11 w-full"><Search className="size-4"/>{busy?"Searching mapped places…":"Find real places"}</Button>
        <p className="text-xs text-muted-foreground">Tap to load nearby venues. Results are cached for 24 hours, with a five-new-area-searches-per-day pilot cap. No background polling.</p>
      </form>
      {error && <div className="mt-4 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm" role="alert">{error} Try another day or open Google Maps separately.</div>}
      {searched && <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-sm">
        <strong>{shown.length} place{shown.length===1?"":"s"} shown</strong>
        <span className="text-xs text-muted-foreground"><Clock3 className="mr-1 inline size-3"/>{cached?"Cached":"Live lookup"} · Updated {new Date(updatedAt).toLocaleDateString()}</span>
      </div>}
      {searched && shown.length===0 && <p className="mt-4 rounded-xl bg-muted p-4 text-sm text-muted-foreground">No tagged places matched. Try removing the cuisine or name filter. OpenStreetMap does not cover every venue.</p>}
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {shown.map(p=><article key={p.id} className="card-soft flex flex-col gap-2 p-4">
          <div className="flex items-start justify-between gap-2">
            <h2 className="font-semibold">{p.name}</h2>
            <span className="shrink-0 rounded-full bg-mint px-2 py-1 text-[10px] font-semibold text-brand">Mapped venue</span>
          </div>
          <p className="text-sm text-muted-foreground"><MapPin className="mr-1 inline size-3.5"/>{p.kind === "restaurant"?"Restaurant":"Café"} · ~{p.distanceKm.toFixed(1)} km from neighborhood center</p>
          <p className="text-xs text-muted-foreground">{p.cuisine?"Tagged cuisine: "+p.cuisine:"Cuisine not tagged"}{p.address?" · "+p.address:""}</p>
          <p className="text-xs text-muted-foreground">Argeeleh, opening hours, prices and availability: not verified</p>
          <div className="mt-auto flex flex-wrap gap-2 pt-2">
            <a className="inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-xs font-medium text-brand" href={p.osmUrl} target="_blank" rel="noopener noreferrer">Map <ExternalLink className="size-3"/></a>
            {p.website && <a className="inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-xs font-medium text-brand" href={p.website} target="_blank" rel="noopener noreferrer">Website <ExternalLink className="size-3"/></a>}
            <Button type="button" variant="secondary" size="sm" className="text-xs" onClick={()=>select(p)}><Plus className="size-3.5"/>Add to Together</Button>
          </div>
        </article>)}
      </div>
      <div className="mt-5 rounded-xl border bg-card p-4 text-xs text-muted-foreground">
        Data © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer" className="underline">OpenStreetMap contributors</a> (ODbL). Community mapping is not a complete commercial places database. For a scaled public launch, Dabberna needs an appropriately licensed dedicated data provider.
      </div>
      <Link to="/explore/together" className="mt-4 block rounded-2xl bg-lime p-4 text-center font-semibold text-ink">Plan a friends' vote →</Link>
    </AppShell>
  );
}
