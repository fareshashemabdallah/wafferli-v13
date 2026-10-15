import {describe,expect,it} from "vitest";
import {assessServiceShortlist,makeServiceEntry,validatePublicServiceLink} from "./serviceShortlist";
import {buildLocalBackup,eraseLocalAppData} from "./localDataControls";
const now=new Date(2026,9,15,12);
const entry=(overrides:Partial<Parameters<typeof makeServiceEntry>[0]>={})=>
 makeServiceEntry({id:"provider1",category:"doctor",name:"Clinic A",city:"Amman",
  checkedAt:"2026-10-14",...overrides},now);
describe("parent-owned family service comparison",()=>{
 it("never converts parent's checklist into independent provider credential verification",()=>{
  const e=entry({credentialsConfirmedByParent:true,availabilityConfirmedByParent:true,
   parentFit:4,costJod:30});
  expect(e.credentialsConfirmedByParent).toBe(true);
  expect(e.parentFit).toBe(4);
  const a=assessServiceShortlist([e],now)[0]!;
  expect(a.missingChecks).toContain("source");
  expect(a.entry).not.toHaveProperty("verifiedByDabberna");
  expect(a.entry).not.toHaveProperty("ratingFromProvider");
 });
 it("flags stale check dates and missing clinical credentials",()=>{
  const old=entry({checkedAt:"2026-08-01"});
  const a=assessServiceShortlist([old],now)[0]!;
  expect(a.freshness).toBe("review");
  expect(a.missingChecks).toContain("clinician credentials");
  const other=makeServiceEntry({id:"school",category:"school",name:"School B",city:"Amman",
   checkedAt:"2026-10-15"},now);
  expect(assessServiceShortlist([other],now)[0]?.missingChecks).not.toContain("clinician credentials");
 });
 it("rejects malformed, future and excessive-cost records without inventing prices",()=>{
  expect(()=>entry({checkedAt:"2026-02-30"})).toThrow();
  expect(()=>entry({checkedAt:"2026-10-20"})).toThrow();
  expect(()=>entry({costJod:-1})).toThrow();
  expect(()=>entry({costJod:35.555})).toThrow();
  expect(()=>entry({parentFit:6})).toThrow();
  expect(entry().costJod).toBeUndefined();
 });
 it("refuses dangerous and private source links",()=>{
  ["javascript:alert(1)","http://example.com","https://localhost/foo",
   "https://u:p@example.org","https://127.0.0.1/x","https://bad.local/x"].forEach(url=>
    expect(validatePublicServiceLink(url)).toBeNull());
  expect(validatePublicServiceLink("https://example.org/provider")).toBe("https://example.org/provider");
 });
 it("normalizes provider text so a pasted newline cannot inject structured exports",()=>{
  const e=entry({name:"Clinic A\nX-INJECT:evil",city:"Amman\nJordan"});
  expect(e.name).toBe("Clinic A X-INJECT:evil");
  expect(e.city).toBe("Amman Jordan");
 });
 it("backs up and locally deletes only app-owned records, not auth sessions",()=>{
  const map=new Map<string,string>();
  const s={
   get length(){return map.size;},key:(i:number)=>[...map.keys()][i]??null,
   getItem:(k:string)=>map.get(k)??null,
   setItem:(k:string,v:string)=>{map.set(k,v);},
   removeItem:(k:string)=>{map.delete(k);}
  };
  s.setItem("wafferli.v13.privateServiceShortlist",JSON.stringify([entry()]));
  s.setItem("sb-auth-token","unrelated-secret");
  const backup=buildLocalBackup(s,now);
  expect(backup.entries["privateServiceShortlist"]).toEqual([entry()]);
  expect(JSON.stringify(backup)).not.toContain("unrelated-secret");
  expect(eraseLocalAppData(s)).toBe(1);
  expect(s.getItem("sb-auth-token")).toBe("unrelated-secret");
 });
});
