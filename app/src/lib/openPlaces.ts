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
const METERS = 2300;
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
export async function lookupOpenPlaces(areaId: string): Promise<{places: OpenPlace[]; updatedAt: number; cached: boolean }> {
  const area = searchAreas.find(a => a.id === areaId) || searchAreas[0];
  const key = PREFIX + "area." + area.id;
  try {
    const cached = JSON.parse(localStorage.getItem(key) || "null");
    if (cached && Date.now() - cached.updatedAt < HOURS * 3600000 && Array.isArray(cached.places)) {
      return { ...cached, cached: true };
    }
  } catch { /* storage unavailable or invalid */ }

  // No automatic network requests. Only an explicit tap triggers a fresh lookup.
  const day = new Date().toISOString().slice(0,10);
  const capKey = PREFIX + "count." + day;
  let count = 0;
  try { count = Number(localStorage.getItem(capKey)) || 0; } catch {}
  if (count >= LIMIT) throw new Error("Pilot limit reached: five map searches per device per day. Try a cached area or return tomorrow.");
  try { localStorage.setItem(capKey, String(count + 1)); } catch {}

  const query = `[out:json][timeout:18];nwr["amenity"~"^(restaurant|cafe)$"](around:${METERS},${area.lat},${area.lon});out center 210;`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 19000);
  let data: { elements?: Element[] };
  try {
    const url = "https://overpass-api.de/api/interpreter?data=" + encodeURIComponent(query);
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(res.status === 429 ? "Open map service is busy. Please try later." : "Map service unavailable (HTTP " + res.status + ").");
    data = await res.json();
  } catch (e) {
    throw new Error(e instanceof Error && e.name === "AbortError" ? "Map search timed out. Please try later." : e instanceof Error ? e.message : "Map search unavailable.");
  } finally { clearTimeout(timeout); }

  const places: OpenPlace[] = (data.elements || []).flatMap(el => {
    const tags = el.tags || {};
    const lat = el.lat ?? el.center?.lat;
    const lon = el.lon ?? el.center?.lon;
    const name = tags["name:en"] || tags.name || tags["name:ar"];
    if (!name || lat === undefined || lon === undefined || (tags.amenity !== "restaurant" && tags.amenity !== "cafe")) return [];
    const address = [tags["addr:street"], tags["addr:housenumber"], tags["addr:suburb"], tags["addr:city"]].filter(Boolean).join(", ");
    return [{id: el.type + "/" + el.id, name,
      kind: tags.amenity, lat, lon, cuisine: tags.cuisine || "",
      address, website: validHttps(tags.website || tags["contact:website"]),
      phone: tags.phone || tags["contact:phone"] || null,
      distanceKm: distKm(area.lat, area.lon, lat, lon),
      osmUrl: "https://www.openstreetmap.org/" + el.type + "/" + el.id
    }];
  });
  places.sort((a,b)=>a.distanceKm-b.distanceKm);
  const result = { places, updatedAt: Date.now() };
  try { localStorage.setItem(key, JSON.stringify(result)); } catch {}
  return { ...result, cached: false };
}
