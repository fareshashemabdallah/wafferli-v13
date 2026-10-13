import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { MapPin, Search, ExternalLink, Plus, Clock3, KeyRound } from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";
import { AppShell, Notice } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, NativeSelect } from "@/components/Field";
import { filterPlaces, searchAreas, type OpenPlace } from "@/lib/openPlaces";
import { getGeoapifyPlaces, googleMapsSearchUrl } from "@/lib/freePlaces";

export const Route = createFileRoute("/explore/restaurants")({
  head: () => ({
    meta: [
      { title: "Find real places in Amman — Dabberna" },
      { name: "description", content: "Find live Google Maps results free or connect a Geoapify free key to show real mapped venues inside Dabberna." },
    ],
  }),
  component: Restaurants,
});

const CHOSEN_KEY = "dabberna.v13.restaurantSelections";
const API_KEY = "dabberna.geoapify.personalPilotKey";

function storeSelected(name: string) {
  if (!name.trim()) return false;
  let names: string[] = [];
  try {
    const old: unknown = JSON.parse(localStorage.getItem(CHOSEN_KEY) || "[]");
    if (Array.isArray(old)) names = old.filter((n): n is string => typeof n === "string");
  } catch { /* first selection */ }
  const next = [...new Set([...names, name.trim().slice(0,80)])].slice(0,10);
  try { localStorage.setItem(CHOSEN_KEY, JSON.stringify(next)); return true; } catch { return false; }
}

function Restaurants() {
  const navigate = useNavigate();
  const [area, setArea] = useState("abdoun");
  const [kind, setKind] = useState("all");
  const [cuisine, setCuisine] = useState("all");
  const [words, setWords] = useState("");
  const [shisha, setShisha] = useState(false);
  const [manual, setManual] = useState("");
  const [apiKey, setApiKey] = useState(() => { try { return localStorage.getItem(API_KEY) || ""; } catch { return ""; } });
  const [keyInput, setKeyInput] = useState(() => { try { return localStorage.getItem(API_KEY) || ""; } catch { return ""; } });
  const [loaded, setLoaded] = useState<OpenPlace[]>([]);
  const [searched, setSearched] = useState(false);
  const [updatedAt, setUpdatedAt] = useState(0);
  const [cached, setCached] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [keyMessage, setKeyMessage] = useState("");
  const shown = useMemo(()=>filterPlaces(loaded,words,kind,cuisine),[loaded,words,kind,cuisine]);
  const mapUrl = googleMapsSearchUrl(area,kind,cuisine,words,shisha);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!apiKey) { setError("Connect a free Geoapify key below for in-app listings, or choose Open Google Maps."); return; }
    setBusy(true); setError(""); setSearched(false);
    try {
      const result = await getGeoapifyPlaces(area,apiKey);
      setLoaded(result.places); setCached(result.cached); setUpdatedAt(result.updatedAt); setSearched(true);
    } catch (x) {
      setLoaded([]); setError(x instanceof Error ? x.message : "Search service unavailable. Google Maps still works.");
    } finally { setBusy(false); }
  };
  const saveApiKey = () => {
    const candidate = keyInput.trim();
    if (!candidate) { setKeyMessage("Paste the API key from your Geoapify dashboard."); return; }
    try {localStorage.setItem(API_KEY,candidate); setApiKey(candidate); setKeyMessage("Free-tier key saved in this browser. Now select Find inside Dabberna.");setError("");}
    catch {setKeyMessage("This browser blocked storage. Please enable local storage to keep your key.");}
  };
  const clearApiKey = () => {
    try {localStorage.removeItem(API_KEY);} catch {}
    setApiKey("");setKeyInput("");setKeyMessage("Local API key cleared.");setLoaded([]);setSearched(false);
  };
  const select = (name: string) => {
    if (!storeSelected(name)) { setError("Unable to save your choice. Check Safari private browsing/storage settings."); return; }
    navigate({to:"/explore/together"});
  };
  return (
    <AppShell title="Find real places">
      <Notice>
        <strong>The old community map server repeatedly timed out.</strong> We no longer rely on it for this screen.
        Search Google Maps without any API key, or connect a personal free Geoapify key to show actual mapped venues <strong>inside</strong> Dabberna. This is place lookup, not yet AI.
      </Notice>
      <div className="card-soft mt-4 space-y-3 p-4">
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
              <option value="all">Any cuisine</option><option value="lebanese">Lebanese</option><option value="arab">Arabic</option><option value="italian">Italian</option>
            </NativeSelect>
          </Field>
        </div>
        <Field label="Name or search words">
          <Input value={words} onChange={e=>setWords(e.target.value)} maxLength={70} placeholder="Lebanese restaurant, mezze, shisha, ..." />
        </Field>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={shisha} onChange={e=>setShisha(e.target.checked)} />
          Include argeeleh / shisha in Google Maps search
        </label>
        <a href={mapUrl} target="_blank" rel="noopener noreferrer"
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 text-center font-semibold text-primary-foreground">
          <MapPin className="size-4"/> Open real Google Maps results <ExternalLink className="size-4"/>
        </a>
        <p className="text-xs text-muted-foreground">Free and no API key. This opens Google Maps; ratings and details stay there, not inside Dabberna.</p>
      </div>

      <section className="card-soft mt-4 space-y-3 p-4">
        <div className="flex items-center gap-2"><KeyRound className="size-4 text-brand"/><h2 className="font-semibold">See real places inside Dabberna (free pilot)</h2></div>
        <p className="text-xs text-muted-foreground">
          Geoapify has a free tier. Create a key and restrict its allowed HTTP origins to this GitHub Pages website.
          This pilot stores your key in this browser and sends it directly to Geoapify; it is not a secret server credential.
        </p>
        <a className="inline-flex items-center gap-1 text-sm font-medium text-brand underline" href="https://myprojects.geoapify.com/" target="_blank" rel="noopener noreferrer">
          Create a free Geoapify API key <ExternalLink className="size-3.5"/>
        </a>
        <Field label="Your own Geoapify browser API key">
          <Input type="password" autoComplete="off" value={keyInput} onChange={e=>setKeyInput(e.target.value)} placeholder="Paste your free API key" />
        </Field>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" onClick={saveApiKey}>Save key on this device</Button>
          {apiKey && <Button type="button" variant="outline" onClick={clearApiKey}>Forget key</Button>}
        </div>
        {keyMessage && <p className="text-xs text-brand" role="status">{keyMessage}</p>}
        <form onSubmit={submit}>
          <Button type="submit" className="h-11 w-full" disabled={busy || !apiKey}>
            <Search className="size-4"/>{busy?"Searching Geoapify…":apiKey?"Find inside Dabberna":"Add free key to enable in-app search"}
          </Button>
        </form>
        <p className="text-xs text-muted-foreground">
          Filters apply to returned places. Cuisine and argeeleh may be missing from map records; a blank match doesn't prove a venue doesn't offer them.
          Results are cached for 24 hours to minimize free API usage.
        </p>
      </section>
      {error && <div role="alert" className="mt-4 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm">
        {error} <a href={mapUrl} target="_blank" rel="noopener noreferrer" className="font-semibold underline">See live Google Maps results instead</a>.
      </div>}
      {searched && <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-sm">
        <strong>{shown.length} mapped venue{shown.length===1?"":"s"}</strong>
        <span className="text-xs text-muted-foreground"><Clock3 className="mr-1 inline size-3"/>{cached?"Cached":"Geoapify lookup"} · {new Date(updatedAt).toLocaleDateString()}</span>
      </div>}
      {searched && shown.length===0 && <p className="mt-3 rounded-xl bg-muted p-4 text-sm">
        No mapped venues matched these filters. Try All cuisines or remove the name search. <a className="underline" href={mapUrl} target="_blank" rel="noopener noreferrer">Search Google Maps</a>.
      </p>}
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {shown.map(p=><article key={p.id} className="card-soft flex flex-col gap-2 p-4">
          <h2 className="font-semibold">{p.name}</h2>
          <p className="text-sm text-muted-foreground"><MapPin className="mr-1 inline size-3.5"/>{p.kind === "restaurant"?"Restaurant":"Café"} · ~{p.distanceKm.toFixed(1)} km from area center</p>
          <p className="text-xs text-muted-foreground">{p.cuisine?"Tagged cuisine: "+p.cuisine:"Cuisine not tagged"}{p.address?" · "+p.address:""}</p>
          <p className="text-xs text-muted-foreground">Argeeleh, hours, prices and reservations: not verified</p>
          <div className="mt-auto flex flex-wrap gap-2 pt-2">
            <a className="inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-xs font-medium text-brand" href={p.osmUrl} target="_blank" rel="noopener noreferrer">Map <ExternalLink className="size-3"/></a>
            {p.website && <a className="inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-xs font-medium text-brand" href={p.website} target="_blank" rel="noopener noreferrer">Website <ExternalLink className="size-3"/></a>}
            <Button type="button" variant="secondary" size="sm" onClick={()=>select(p.name)}><Plus className="size-3.5"/>Add to Together</Button>
          </div>
        </article>)}
      </div>
      <div className="card-soft mt-4 space-y-2 p-4">
        <h3 className="font-semibold">Found a place on Google Maps?</h3>
        <p className="text-xs text-muted-foreground">Paste its name to add it to your friends' poll. You'll choose at least three venues in Together.</p>
        <div className="flex gap-2">
          <Input value={manual} onChange={e=>setManual(e.target.value)} maxLength={80} placeholder="Actual restaurant name" />
          <Button type="button" onClick={()=>select(manual)} disabled={!manual.trim()}>Add</Button>
        </div>
      </div>
      <div className="mt-4 text-xs text-muted-foreground">
        Data attribution: <a href="https://www.geoapify.com/" className="underline" target="_blank" rel="noopener noreferrer">Powered by Geoapify</a>;
        map data © <a href="https://www.openstreetmap.org/copyright" className="underline" target="_blank" rel="noopener noreferrer">OpenStreetMap contributors</a>.
      </div>
      <Link to="/explore/together" className="mt-4 block rounded-2xl bg-lime p-4 text-center font-semibold text-ink">Plan a friends' vote →</Link>
    </AppShell>
  );
}
