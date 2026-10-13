/** Limited personal-pilot OpenStreetMap lookup.
 * Never treat OSM amenity / cuisine tags as verified hours, shisha or pricing.
 * Do NOT depend on public Overpass for a scaled commercial service.
 */
export type OpenPlace = {
  id: string; name: string; kind: "restaurant" | "cafe";
  lat: number; lon: number; cuisine: string; address: string;
  website: string | null; phone: string | null; distanceKm: number;
  osmUrl: string;
};

export const searchAreas = [
  { id: "abdoun", name: "Abdoun · عبدون", lat: 31.9412, lon: 35.8886 },
  { id: "jabal-amman", name: "Jabal Amman · جبل عمّان", lat: 31.9508, lon: 35.9205 },
  { id: "sweifieh", name: "Sweifieh · الصويفية", lat: 31.9564, lon: 35.8637 },
  { id: "khalda", name: "Khalda · خلدا", lat: 31.9924, lon: 35.8441 },
  { id: "shmaisani", name: "Shmeisani · الشميساني", lat: 31.9736, lon: 35.9032 },
  { id: "weibdeh", name: "Jabal Al-Weibdeh · جبل اللويبدة", lat: 31.9587, lon: 35.9239 },
] as const;

type Element = { type: "node" | "way" | "relation"; id: number; lat?: number; lon?: number; center?: { lat: number; lon: number }; tags?: Record<string, string> };
const PREFIX = "dabberna.osm.pilot.2026-10.";
const HOURS = 24;
const LIMIT = 5; // per device per day: keeps this opt-in pilot intentionally small
// Smaller bounds make substantially lighter Overpass queries than a 2.3km-radius scan.
const RADIUS_KM = 1.65;
const COOLDOWN_MS = 90000;
const MAX_ATTEMPTS = 8; // Failed searches are not counted toward five successful results.
const OVERPASS_SERVERS = [
  "https://overpass.private.coffee/api/interpreter",
  "https://overpass-api.de/api/interpreter",
] as const;
function bbox(lat: number,lon: number) {
  const dLat = RADIUS_KM / 111.32;
  const dLon = RADIUS_KM / (111.32 * Math.cos(lat * Math.PI / 180));
  return [lat-dLat,lon-dLon,lat+dLat,lon+dLon].map(n=>n.toFixed(5)).join(",");
}

const validHttps = (raw?: string) => {
  if (!raw) return null;
  try {
    const url = new URL(raw.startsWith("www.") ? "https://" + raw : raw);
    return url.protocol === "https:" ? url.href : null;
  } catch { return null; }
};
const distKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const rad = Math.PI / 180, dLat = (lat2 - lat1) * rad, dLon = (lon2 - lon1) * rad;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLon / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(a));
};
export function filterPlaces(items: OpenPlace[], name: string, kind: string, cuisine: string) {
  const q = name.trim().toLocaleLowerCase();
  return items
    .filter(p => kind === "all" || p.kind === kind)
    .filter(p => !q || [p.name,p.cuisine,p.address].some(s => s.toLocaleLowerCase().includes(q)))
    .filter(p => cuisine === "all" || p.cuisine.toLowerCase().includes(cuisine))
    .sort((a,b) => a.distanceKm - b.distanceKm).slice(0, 35);
}
export async function lookupOpenPlaces(areaId: string): Promise<{places: OpenPlace[]; updatedAt: number; cached: boolean; stale?: boolean }> {
  const area = searchAreas.find(a => a.id === areaId) || searchAreas[0];
  const key = PREFIX + "area." + area.id;
  let previous: { places: OpenPlace[]; updatedAt: number } | null = null;
  try {
    const stored: unknown = JSON.parse(localStorage.getItem(key) || "null");
    if (stored && typeof stored === "object" && "places" in stored && Array.isArray(stored.places) && "updatedAt" in stored && typeof stored.updatedAt === "number") {
      previous = { places: stored.places as OpenPlace[], updatedAt: stored.updatedAt };
      if (Date.now() - previous.updatedAt < HOURS * 3600000) return { ...previous, cached: true };
    }
  } catch { /* browser storage disabled */ }

  const day = new Date().toISOString().slice(0, 10);
  const successesKey = PREFIX + "count." + day;
  const attemptsKey = PREFIX + "attempts." + day;
  const cooldownKey = PREFIX + "lastAttempt." + area.id;
  const localNumber = (key: string) => {
    try { return Number(localStorage.getItem(key)) || 0; } catch { return 0; }
  };
  const storeNumber = (key: string, count: number) => {
    try { localStorage.setItem(key, String(count)); } catch {}
  };
  if (localNumber(successesKey) >= LIMIT || localNumber(attemptsKey) >= MAX_ATTEMPTS) {
    if (previous) return { ...previous, cached: true, stale: true };
    throw new Error("Pilot search limit reached. Try again tomorrow; public map servers are shared community resources.");
  }
  if (Date.now() - localNumber(cooldownKey) < COOLDOWN_MS) {
    if (previous) return { ...previous, cached: true, stale: true };
    throw new Error("Please wait 90 seconds before searching this area again. This protects the free map service.");
  }
  storeNumber(cooldownKey,Date.now());
  storeNumber(attemptsKey,localNumber(attemptsKey)+1);

  // Bounding box rather than 'around', short timeout, and a hard results limit.
  const query = `[out:json][timeout:14];nwr["amenity"~"^(restaurant|cafe)$"](${bbox(area.lat,area.lon)});out center 100;`;
  let data: { elements?: Element[] } | undefined;
  let failure = "Map service temporarily unavailable";
  // Only one alternative for transient upstream errors. Never retry rate-limit responses.
  for (let i = 0; i < OVERPASS_SERVERS.length; i++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 16500);
    try {
      const res = await fetch(OVERPASS_SERVERS[i] + "?data=" + encodeURIComponent(query), {
        method: "GET", signal: controller.signal, headers: { "Accept": "application/json" },
      });
      if (res.status === 429 || res.status === 403 || res.status === 406) {
        failure = "The public map server is limiting requests. Please wait before trying again.";
        break; // Do not circumvent rate limits by trying another server.
      }
      if (!res.ok) {
        failure = "Map server returned HTTP " + res.status;
        if (res.status === 502 || res.status === 503 || res.status === 504 || res.status === 408) continue;
        break;
      }
      const body: unknown = await res.json();
      if (!body || typeof body !== "object" || !("elements" in body) || !Array.isArray(body.elements)) {
        failure = "Map service sent an unexpected response";
        continue;
      }
      data = body as { elements: Element[] };
      break;
    } catch (err) {
      failure = err instanceof Error && err.name === "AbortError" ? "Map request timed out" : "The map service could not be reached";
      // Single fallback for network errors/timeouts.
    } finally { clearTimeout(timer); }
  }

  if (!data) {
    if (previous) return { ...previous, cached: true, stale: true };
    throw new Error(failure + ". Please try again later; don't keep refreshing.");
  }
  const places: OpenPlace[] = (data.elements || []).flatMap(el => {
    const tags = el.tags || {};
    const lat = el.lat ?? el.center?.lat;
    const lon = el.lon ?? el.center?.lon;
    const name = tags["name:en"] || tags["name"] || tags["name:ar"];
    const amenity = tags["amenity"];
    if (!name || lat === undefined || lon === undefined || (amenity !== "restaurant" && amenity !== "cafe")) return [];
    const address = [tags["addr:street"], tags["addr:housenumber"], tags["addr:suburb"], tags["addr:city"]].filter(Boolean).join(", ");
    return [{id: el.type + "/" + el.id, name,
      kind: amenity, lat, lon, cuisine: tags['cuisine'] || "",
      address, website: validHttps(tags['website'] || tags["contact:website"]),
      phone: tags['phone'] || tags["contact:phone"] || null,
      distanceKm: distKm(area.lat, area.lon, lat, lon),
      osmUrl: "https://www.openstreetmap.org/" + el.type + "/" + el.id
    }];
  });
  places.sort((a,b)=>a.distanceKm-b.distanceKm);
  const result = { places, updatedAt: Date.now() };
  try { localStorage.setItem(key, JSON.stringify(result)); } catch {}
  storeNumber(successesKey,localNumber(successesKey)+1);
  return { ...result, cached: false, stale: false };
}
