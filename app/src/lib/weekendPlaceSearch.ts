/** Small opt-in map discovery for a personal pilot, not a commercial venue API.
 * Searches only a fixed city centre (never the user's device location).
 * OSM records do not establish admission, suitability, safety, opening hours
 * or prices. Community-run Overpass can be busy, so we rate-limit aggressively.
 */
export type WeekendPlace={
 id:string;name:string;category:"park"|"playground"|"museum"|"attraction"|"arts centre";
 osmUrl:string;lat:number;lon:number;
};
type OSMElement={type:"node"|"way"|"relation";id:number;
 lat?:number;lon?:number;center?:{lat:number;lon:number};tags?:Record<string,string>};
const CITY={
 amman:{name:"Amman",lat:31.9539,lon:35.9106},
 irbid:{name:"Irbid",lat:32.5556,lon:35.8519},
 zarqa:{name:"Zarqa",lat:32.0728,lon:36.0870},
 aqaba:{name:"Aqaba",lat:29.5321,lon:35.0063}
} as const;
export type WeekendCity=keyof typeof CITY;
export function outingCity(value:string):WeekendCity{
 const name=value.trim().toLowerCase();
 if(/إربد|اربد|irbid/.test(name))return "irbid";
 if(/زرقاء|الزرقاء|zarqa/.test(name))return "zarqa";
 if(/عقبة|العقبة|aqaba/.test(name))return "aqaba";
 return "amman";
}
export const weekendCityName=(city:WeekendCity)=>CITY[city].name;
const MAX_CACHE_MS=24*60*60*1000;
const prefix="dabberna.weekend.osm.v1.";
export function normalizeWeekendPlaces(raw:unknown):WeekendPlace[]{
 if(!raw||typeof raw!=="object"||!Array.isArray((raw as {elements?:unknown}).elements))return [];
 const elements=(raw as {elements:unknown[]}).elements.slice(0,100);
 const seen=new Set<string>();
 return elements.flatMap(x=>{
  if(!x||typeof x!=="object")return [];
  const el=x as OSMElement;
  if(!["node","way","relation"].includes(el.type)||!Number.isInteger(el.id)||el.id<=0)return [];
  const name=(el.tags?.["name:en"]||el.tags?.["name"]||el.tags?.["name:ar"]||"").trim().slice(0,110);
  const category=el.tags?.["leisure"]==="park"?"park":
   el.tags?.["leisure"]==="playground"?"playground":
   el.tags?.["tourism"]==="museum"?"museum":
   el.tags?.["tourism"]==="attraction"?"attraction":
   el.tags?.["amenity"]==="arts_centre"?"arts centre":null;
  const lat=el.lat??el.center?.lat,lon=el.lon??el.center?.lon;
  const id=el.type+"/"+el.id;
  if(name.length<2||!category||lat===undefined||lon===undefined||
   !Number.isFinite(lat)||!Number.isFinite(lon)||lat<-90||lat>90||
   lon<-180||lon>180||seen.has(id))return [];
  seen.add(id);
  return [{id,name,category,lat,lon,osmUrl:"https://www.openstreetmap.org/"+id}];
 }).slice(0,20);
}
export function weekendPlaceSearchUrl(place:WeekendPlace,city:WeekendCity):string{
 const q=place.name+" "+CITY[city].name+" Jordan opening hours tickets";
 return "https://www.google.com/search?q="+encodeURIComponent(q);
}
export async function findWeekendPlaces(city:WeekendCity):Promise<{
 places:WeekendPlace[];checkedAt:number;stale:boolean
}>{
 const key=prefix+city,now=Date.now();
 const cached=(()=>{
  try{
   const data=JSON.parse(localStorage.getItem(key)||"null") as {places?:WeekendPlace[];checkedAt?:number}|null;
   return data&&Array.isArray(data.places)&&typeof data.checkedAt==="number"?data:null;
  }catch{return null}
 })();
 if(cached&&now-cached.checkedAt<MAX_CACHE_MS)
  return {places:cached.places!,checkedAt:cached.checkedAt,stale:false};
 const attemptsKey=prefix+"lastAttempt."+city;
 const last=Number((()=>{try{return localStorage.getItem(attemptsKey)}catch{return null}})())||0;
 if(now-last<90000){
  if(cached)return {places:cached.places!,checkedAt:cached.checkedAt!,stale:true};
  throw new Error("The public map source limits frequent searches. Try later.");
 }
 try{localStorage.setItem(attemptsKey,String(now));}catch{}
 const area=CITY[city],dy=2.5/111.32,dx=2.5/(111.32*Math.cos(area.lat*Math.PI/180));
 const bbox=[area.lat-dy,area.lon-dx,area.lat+dy,area.lon+dx].map(x=>x.toFixed(5)).join(",");
 const query='[out:json][timeout:12];nwr["leisure"~"^(park|playground)$"]('+bbox+');nwr["tourism"~"^(museum|attraction)$"]('+bbox+');nwr["amenity"="arts_centre"]('+bbox+');out center 60;';
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),15000);
 try{
  const result=await fetch("https://overpass-api.de/api/interpreter?data="+encodeURIComponent(query),{
   signal:controller.signal,headers:{Accept:"application/json"},credentials:"omit",cache:"no-store"
  });
  if(!result.ok)throw new Error(result.status===429?
   "Public map search is rate-limited. Check the external map instead.":
   "Public map listings are temporarily unavailable.");
  const places=normalizeWeekendPlaces(await result.json());
  if(!places.length)throw new Error("No mapped places were returned for this city centre.");
  try{localStorage.setItem(key,JSON.stringify({places,checkedAt:now}));}catch{}
  return {places,checkedAt:now,stale:false};
 }catch(err){
  if(cached)return {places:cached.places!,checkedAt:cached.checkedAt!,stale:true};
  throw err;
 }finally{clearTimeout(timer);}
}
