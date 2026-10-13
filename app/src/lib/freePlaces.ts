import { searchAreas, type OpenPlace } from "./openPlaces";
import { getCuisineQuery } from "./cuisines";

/** Free-tier Geoapify lookup (requires user's own browser-restricted API key).
 * This browser-only pilot makes requests directly to Geoapify. Do not enter server secrets.
 */
/** Builds a human-readable Google Maps search for every cuisine, including Arabic custom terms. */
export function googleMapsSearchUrl(areaId: string, kind: string, cuisine: string, name: string, shisha: boolean, customCuisine = ""): string {
  const area = searchAreas.find(a => a.id === areaId);
  const cuisineTerm = cuisine === "custom" ? customCuisine.trim() : cuisine === "all" ? "" : getCuisineQuery(cuisine);
  const categoryTerm = kind === "cafe" ? "cafes" : kind === "restaurant" ? "restaurants" : "restaurants cafes";
  const placeTerm = areaId === "jordan" ? "Jordan" : area ? area.name.split(" · ")[0] + " Amman Jordan" : "Amman Jordan";
  const terms = [name.trim(), cuisineTerm, categoryTerm, shisha ? "shisha argileh" : "", placeTerm];
  return "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(terms.filter(Boolean).join(" "));
}
type GeoFeature = { properties?: Record<string, unknown>; geometry?: { coordinates?: unknown } };
const category = (raw: unknown) => Array.isArray(raw) ? raw.filter((x): x is string => typeof x === "string") : [];
const string = (raw: unknown) => typeof raw === "string" ? raw : "";
const validHttps = (raw: unknown) => {
  const text = string(raw).trim();
  if (!text) return null;
  try { const url = new URL(text.startsWith("www.") ? "https://" + text : text); return url.protocol === "https:" ? url.href : null; } catch { return null; }
};
function distanceKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const rad = Math.PI / 180;
  const dLat = (lat2 - lat1) * rad, dLon = (lon2 - lon1) * rad;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLon / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(a));
}
export type PlaceResponse = { places: OpenPlace[]; updatedAt: number; cached: boolean };
export async function getGeoapifyPlaces(areaId: string, apiKey: string): Promise<PlaceResponse> {
  const area = searchAreas.find(a => a.id === areaId) ?? searchAreas[0];
  // Only store publicly mapped place information, never the API key in the cache.
  const cacheKey = "dabberna.geoapify.result.v1." + area.id;
  try {
    const result: unknown = JSON.parse(localStorage.getItem(cacheKey) || "null");
    if (result && typeof result === "object" && "updatedAt" in result && "places" in result &&
      typeof result.updatedAt === "number" && Array.isArray(result.places) &&
      Date.now() - result.updatedAt < 24 * 3600000) {
      return { places: result.places as OpenPlace[], updatedAt: result.updatedAt, cached: true };
    }
  } catch { /* storage may be restricted */ }

  const url = new URL("https://api.geoapify.com/v2/places");
  url.searchParams.set("categories", "catering.restaurant,catering.cafe");
  url.searchParams.set("filter", `circle:${area.lon},${area.lat},1900`);
  url.searchParams.set("bias", `proximity:${area.lon},${area.lat}`);
  url.searchParams.set("limit", "60");
  url.searchParams.set("lang", "en");
  url.searchParams.set("apiKey", apiKey.trim());
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 14000);
  let payload: { features?: GeoFeature[] };
  try {
    const response = await fetch(url.toString(), {signal:ctrl.signal,referrerPolicy:"strict-origin-when-cross-origin"});
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) throw new Error("Geoapify rejected the key or domain. Check your key and its allowed origins.");
      if (response.status === 429) throw new Error("Geoapify request limit reached. Try again later.");
      throw new Error("Geoapify search unavailable (HTTP " + response.status + ").");
    }
    payload = await response.json() as { features?: GeoFeature[] };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") throw new Error("Geoapify search timed out. Try Google Maps instead.");
    throw error instanceof Error ? error : new Error("Unable to connect to Geoapify.");
  } finally {clearTimeout(timer);}
  if (!Array.isArray(payload.features)) throw new Error("Geoapify returned an unexpected response.");
  const entries: OpenPlace[] = [];
  for (const feature of payload.features) {
    const prop = feature.properties ?? {};
    const name = string(prop["name"]);
    const coords = feature.geometry?.coordinates;
    const lon = Array.isArray(coords) ? Number(coords[0]) : Number(prop["lon"]);
    const lat = Array.isArray(coords) ? Number(coords[1]) : Number(prop["lat"]);
    if (!name || !Number.isFinite(lat) || !Number.isFinite(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) continue;
    const categories = category(prop["categories"]);
    const kind: "restaurant" | "cafe" = categories.some(x=>x.includes("restaurant")) ? "restaurant" : "cafe";
    const cuisine = string(prop["cuisine"]);
    const id = string(prop["place_id"]) || name + "." + lat + "." + lon;
    const address = string(prop["formatted"]) || string(prop["address_line2"]);
    const website = validHttps(prop["website"]);
    const phone = string(prop["contact:phone"]) || string(prop["phone"]) || null;
    entries.push({id,name,lat,lon,kind,cuisine,address,website,phone,
      distanceKm:distanceKm(area.lat,area.lon,lat,lon),
      osmUrl:"https://www.openstreetmap.org/?mlat="+lat+"&mlon="+lon+"#map=18/"+lat+"/"+lon});
  }
  const result = { places: entries, updatedAt: Date.now(), cached: false };
  try { localStorage.setItem(cacheKey,JSON.stringify({places:entries,updatedAt:result.updatedAt})); } catch {}
  return result;
}
