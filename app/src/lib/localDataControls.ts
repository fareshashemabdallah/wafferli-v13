/**
 * Browser-local privacy controls; no cloud, auth tokens or API credentials
 * are included in the export. Validated local restoration supports only reviewed core sections;
 * legacy cloud/group tokens and unsupported sections are never imported.
 */
export const LOCAL_APP_KEYS=[
 "money","members","familyCalendar","familyPreferences",
 "familyPlans","activeFamilyPlanId","occasionPlans",
 "outings","smartbuy","shopping","activeDecision",
 "familySetupPreferencesConfirmed","familySetupProfileSkipped",
 "familyAttentionSnoozes","familyTasks","familyWishlist","privateOutingOptions","privateQuoteRequests","privateServiceShortlist","weatherCity","homeIntroDone","lang"
] as const;
const prefix="wafferli.v13.";
const extras=["dabberna.v13.restaurantSelections","dabberna.geoapify.personalPilotKey"];
const publicCachePrefixes=["dabberna.geoapify.result.v1.","dabberna.osm.pilot.2026-10."];

/** A stable, audited allowlist prevents accidentally copying Supabase session
 * tokens (sb-*-auth-token) or browser keys belonging to other applications. */
export function localAppStorageKeys(storage:Pick<Storage,"length"|"key">):string[]{
 const keys=LOCAL_APP_KEYS.map(k=>prefix+k);
 const selected:string[]=[];
 for(let i=0;i<storage.length;i++){
  const key=storage.key(i);
  if(key&&(keys.includes(key)||extras.includes(key)||
   publicCachePrefixes.some(p=>key.startsWith(p))))selected.push(key);
 }
 return selected.sort();
}
export type LocalBackup={
 app:"dabberna";
 schemaVersion:1;
 exportedAt:string;
 storage:"browser-local";
 warning:string;
 entries:Record<string,unknown>;
};
export function buildLocalBackup(
 storage:Pick<Storage,"length"|"key"|"getItem">,now=new Date()
):LocalBackup {
 const entries:Record<string,unknown>={};
 for(const fullKey of localAppStorageKeys(storage)){
  // Never export user-managed external API keys or public places caches.
  if(!fullKey.startsWith(prefix))continue;
  const value=storage.getItem(fullKey);
  if(value===null)continue;
  if(value.length>2_000_000)throw new Error("One local record is too large for the backup");
  try{entries[fullKey.slice(prefix.length)]=JSON.parse(value) as unknown;}
  catch{throw new Error("Some local data cannot be read as JSON. Nothing was exported.");}
 }
 return {
  app:"dabberna",schemaVersion:1,exportedAt:now.toISOString(),
  storage:"browser-local",
  warning:"This JSON backup is unencrypted and contains private family information. Store it securely. Only reviewed core sections can be restored locally after schema validation and confirmation; no cloud sync or automatic restore.",
  entries
 };
}
/** Delete only Dabberna-owned local data & caches. No cloud account deletion,
 * no member revocation, no Supabase sign-out, and no third-party website state.
 */
export function eraseLocalAppData(
 storage:Pick<Storage,"length"|"key"|"removeItem">
):number{
 const keys=localAppStorageKeys(storage);
 for(const key of keys)storage.removeItem(key);
 return keys.length;
}
