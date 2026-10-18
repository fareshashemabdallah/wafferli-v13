import {describe,expect,it} from "vitest";
import {buildLocalBackup} from "./localDataControls";
import {inspectLocalBackup,restoreLocalSections} from "./backupRestore";
import {sampleMoney,sampleMembers} from "./money";
import {defaultFamilyPreferences} from "./familyPreferences";
import {emptyHouseholdPresence,exampleHelper,exampleGuest} from "./householdPresence";

function storage(){
 const m=new Map<string,string>();
 let failOnceKey="";
 return {
  get length(){return m.size;},
  key(i:number){return [...m.keys()][i]??null;},
  getItem(k:string){return m.get(k)??null;},
  setItem(k:string,v:string){
   if(k===failOnceKey){failOnceKey="";throw Error("Test quota exceeded");}
   m.set(k,v);
  },
  removeItem(k:string){m.delete(k);},
  failNextWrite(k:string){failOnceKey=k;}
 };
}
const prefix="wafferli.v13.";
const fixture=()=>{
 const s=storage();
 s.setItem(prefix+"money",JSON.stringify(sampleMoney()));
 s.setItem(prefix+"members",JSON.stringify(sampleMembers()));
 s.setItem(prefix+"familyPreferences",JSON.stringify(defaultFamilyPreferences));
 s.setItem(prefix+"familyCalendar",JSON.stringify([
  {id:"meeting",title:"School meeting",date:"2026-10-20",kind:"school",annual:false}
 ]));
 s.setItem(prefix+"familyPlans",JSON.stringify([
  {id:"outing-1",title:"Day trip",kind:"outing",status:"planning",
   createdAt:"2026-10-15T12:00:00.000Z",updatedAt:"2026-10-15T12:00:00.000Z",
   date:"2026-10-20",budgetJod:30}
 ]));
 s.setItem(prefix+"shopping",JSON.stringify([{id:"one",name:"Bread",qty:2,price:0.4,done:false}]));
 s.setItem(prefix+"lang",'"ar"');
 return s;
};
const backup=(s=fixture())=>JSON.stringify(buildLocalBackup(s,new Date("2026-10-15T12:00:00Z")));
describe("validated browser-only backup recovery",()=>{
 it("previews exactly six safe sections and transparently skips unsupported keys",()=>{
  const original=fixture();
  original.setItem(prefix+"outings",JSON.stringify([{admin_token:"KEEP_PRIVATE",vote_token:"SECRET"}]));
  const empty=storage();
  const preview=inspectLocalBackup(backup(original),empty);
  expect(preview.sections.map(s=>s.key).sort()).toEqual(
   ["familyCalendar","familyPlans","familyPreferences","members","money","shopping"].sort());
  expect(preview.skipped.sort()).toEqual(["lang","outings"]);
  expect(JSON.stringify(preview.values)).not.toContain("SECRET");
  expect(empty.length).toBe(0);
 });
 it("does not mutate local Money until there is explicit consent, and never merges records",()=>{
  const target=storage();
  target.setItem(prefix+"money",JSON.stringify({...sampleMoney(),income:9999}));
  target.setItem(prefix+"members",'[{"id":"parent-original"}]');
  target.setItem(prefix+"lang",'"en"');
  const preview=inspectLocalBackup(backup(),target);
  expect(()=>restoreLocalSections(target,preview,["money"],false)).toThrow(/consent/i);
  expect(JSON.parse(target.getItem(prefix+"money")!)["income"]).toBe(9999);
  const result=restoreLocalSections(target,preview,["money"],true);
  expect(result.restored).toEqual(["money"]);
  expect(JSON.parse(target.getItem(prefix+"money")!)["income"]).toBe(1200);
  expect(target.getItem(prefix+"members")).toBe('[{"id":"parent-original"}]');
  expect(target.getItem(prefix+"lang")).toBe('"en"');
 });
 it("prevents data loss when an existing record changed after backup preview",()=>{
  const target=fixture(),preview=inspectLocalBackup(backup(),target);
  target.setItem(prefix+"money",JSON.stringify({...sampleMoney(),income:823}));
  expect(()=>restoreLocalSections(target,preview,["money"],true)).toThrow(/changed since preview/i);
  expect(JSON.parse(target.getItem(prefix+"money")!)["income"]).toBe(823);
 });
 it("restores previous values when browser storage writes fail midway",()=>{
  const target=storage();
  target.setItem(prefix+"money",'{"keep":"old-money"}');
  target.setItem(prefix+"members",'[{"keep":"old-member"}]');
  const preview=inspectLocalBackup(backup(),target);
  target.failNextWrite(prefix+"members");
  expect(()=>restoreLocalSections(target,preview,["money","members"],true))
   .toThrow(/original values were restored/i);
  expect(target.getItem(prefix+"money")).toBe('{"keep":"old-money"}');
  expect(target.getItem(prefix+"members")).toBe('[{"keep":"old-member"}]');
 });
 it("refuses malicious unexpected sections and unknown backup versions",()=>{
  const data=JSON.parse(backup()) as {entries:Record<string,unknown>;schemaVersion:number};
  data.entries["auth"]={access_token:"fake"};
  expect(()=>inspectLocalBackup(JSON.stringify(data),storage())).toThrow(/unrecognized/i);
  delete data.entries["auth"];
  data.schemaVersion=7;
  expect(()=>inspectLocalBackup(JSON.stringify(data),storage())).toThrow(/Unsupported/i);
 });
 it("rejects structurally invalid nested finance amounts, dates and duplicates",()=>{
  const data=JSON.parse(backup()) as {entries:Record<string,unknown>};
  const money=data.entries["money"] as {expenses:Array<{amount:number}>};
  money.expenses[0]!.amount=-25;
  expect(()=>inspectLocalBackup(JSON.stringify(data),storage())).toThrow(/invalid money/i);
  money.expenses[0]!.amount=400;
  const family=data.entries["familyCalendar"] as Array<{date:string}>;
  family[0]!.date="2026-02-31";
  expect(()=>inspectLocalBackup(JSON.stringify(data),storage())).toThrow(/invalid familyCalendar/i);
  family[0]!.date="2026-10-20";
  const people=data.entries["members"] as Array<{id:string}>;
  people[1]!.id=people[0]!.id;
  expect(()=>inspectLocalBackup(JSON.stringify(data),storage())).toThrow(/Duplicate item IDs/i);
 });
 it("never restores unreviewed outing tokens from otherwise valid backups",()=>{
  const old=fixture();
  old.setItem(prefix+"outings",JSON.stringify([{admin_token:"private-admin",vote_token:"private-vote"}]));
  const target=storage();
  const preview=inspectLocalBackup(backup(old),target);
  expect(()=>restoreLocalSections(target,preview,["outings" as never],true))
   .toThrow(/not validated/i);
  restoreLocalSections(target,preview,["members","shopping"],true);
  expect(target.getItem(prefix+"outings")).toBeNull();
 });
 it("exports, validates and restores household helper and visitor details without touching financial records",()=>{
  const original=fixture();
  const presence={...emptyHouseholdPresence(),adults:2,children:2,
   helpers:[{...exampleHelper(),id:"helper-1"}],
   guests:[{...exampleGuest(),id:"guest-1",startDate:"2026-10-20",endDate:"2026-10-25"}]};
  original.setItem(prefix+"householdPresence",JSON.stringify(presence));
  const target=storage();
  target.setItem(prefix+"money",'{"keep":"cash"}');
  const file=backup(original);
  const preview=inspectLocalBackup(file,target);
  expect(preview.sections.some(section=>section.key==="householdPresence")).toBe(true);
  restoreLocalSections(target,preview,["householdPresence"],true);
  expect(JSON.parse(target.getItem(prefix+"householdPresence")!)).toEqual(presence);
  expect(target.getItem(prefix+"money")).toBe('{"keep":"cash"}');
  const bad=JSON.parse(file) as {entries:Record<string,unknown>};
  const p=bad.entries["householdPresence"] as {guests:Array<{id:string}>};
  p.guests.push({...p.guests[0]!});
  expect(()=>inspectLocalBackup(JSON.stringify(bad),storage())).toThrow(/Duplicate helper or visitor IDs/);
 });
});
