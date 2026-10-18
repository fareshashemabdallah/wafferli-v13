import {describe,expect,it} from "vitest";
import {buildLocalBackup,eraseLocalAppData,localAppStorageKeys} from "./localDataControls";

const mockStorage=()=>{
 const m=new Map<string,string>();
 return {
  get length(){return m.size;},
  key(i:number){return Array.from(m.keys())[i]??null;},
  getItem(k:string){return m.get(k)??null;},
  setItem(k:string,v:string){m.set(k,v);},
  removeItem(k:string){m.delete(k);},
  has(k:string){return m.has(k);}
 };
};
describe("explicit local backup and reset",()=>{
 it("exports only allowlisted JSON without Supabase login tokens, API keys or other app data",()=>{
  const s=mockStorage();
  s.setItem("wafferli.v13.money",JSON.stringify({cashOnHand:100,expenses:[{note:"personal"}]}));
  s.setItem("wafferli.v13.familyPlans",JSON.stringify([{title:"Trip"}]));
  s.setItem("sb-izevfgdynsrlwgsczllr-auth-token",JSON.stringify({access_token:"VERY_SECRET"}));
  s.setItem("dabberna.geoapify.personalPilotKey","PERSONAL_API_KEY");
  s.setItem("anotherApp.private","dont touch");
  s.setItem("dabberna.geoapify.result.v1.abdoun",JSON.stringify({places:[]}));
  const backup=buildLocalBackup(s,new Date("2026-10-15T12:00:00.000Z"));
  expect(backup).toMatchObject({app:"dabberna",schemaVersion:1,storage:"browser-local",
   exportedAt:"2026-10-15T12:00:00.000Z"});
  expect(backup.entries["money"]).toEqual({cashOnHand:100,expenses:[{note:"personal"}]});
  expect(backup.entries["familyPlans"]).toEqual([{title:"Trip"}]);
  expect(JSON.stringify(backup)).not.toContain("VERY_SECRET");
  expect(JSON.stringify(backup)).not.toContain("PERSONAL_API_KEY");
  expect(JSON.stringify(backup)).not.toContain("anotherApp");
  expect(JSON.stringify(backup)).not.toContain("places");
  expect(localAppStorageKeys(s)).not.toContain("sb-izevfgdynsrlwgsczllr-auth-token");
 });
 it("clears only Dabberna local records and public caches, preserving login session and other sites",()=>{
  const s=mockStorage();
  s.setItem("wafferli.v13.money","{}");
  s.setItem("wafferli.v13.members","[]");
  s.setItem("wafferli.v13.familyAttentionSnoozes","{}");
  s.setItem("dabberna.v13.restaurantSelections","[]");
  s.setItem("dabberna.geoapify.personalPilotKey","private");
  s.setItem("dabberna.osm.pilot.2026-10.successes.2026-10-15","2");
  s.setItem("sb-test-auth-token","token");
  s.setItem("foreign-site.money","user");
  expect(eraseLocalAppData(s)).toBe(6);
  expect(s.has("sb-test-auth-token")).toBe(true);
  expect(s.has("foreign-site.money")).toBe(true);
  expect(s.has("wafferli.v13.money")).toBe(false);
  expect(s.has("dabberna.geoapify.personalPilotKey")).toBe(false);
 });
 it("refuses an incomplete or invalid JSON backup rather than silently claiming coverage",()=>{
  const s=mockStorage();
  s.setItem("wafferli.v13.money","INVALID");
  expect(()=>buildLocalBackup(s)).toThrow(/cannot be read/i);
  expect(s.getItem("wafferli.v13.money")).toBe("INVALID");
 });
 it("never includes unknown keys that happen to share the namespace",()=>{
  const s=mockStorage();
  s.setItem("wafferli.v13.futureAuthToken",'"never export me"');
  s.setItem("wafferli.v13.money",'{"demo":false}');
  expect(Object.keys(buildLocalBackup(s).entries)).toEqual(["money"]);
  expect(eraseLocalAppData(s)).toBe(1);
  expect(s.getItem("wafferli.v13.futureAuthToken")).toBe('"never export me"');
 });
 it("exports and erases a recorded helper or visitor without touching unrelated keys",()=>{
  const s=mockStorage();
  const presence={adults:2,children:2,helpers:[{id:"helper-1",label:"Helper"}],guests:[{id:"visitor-1",label:"Relative"}]};
  s.setItem("wafferli.v13.householdPresence",JSON.stringify(presence));
  s.setItem("sb-example-auth-token",'"keep"');
  const data=buildLocalBackup(s);
  expect(data.entries["householdPresence"]).toEqual(presence);
  expect(eraseLocalAppData(s)).toBe(1);
  expect(s.has("wafferli.v13.householdPresence")).toBe(false);
  expect(s.has("sb-example-auth-token")).toBe(true);
 });
});
