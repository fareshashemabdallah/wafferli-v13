import {describe,expect,it} from "vitest";
import {inspectLocalBackup,restoreLocalSections} from "./backupRestore";
import {buildLocalBackup} from "./localDataControls";
import {addEnteredOffer,makePrivateQuote} from "./privateQuoteWorkspace";
import {makeServiceEntry} from "./serviceShortlist";
import {preparePrivateVaultSnapshot} from "./privateVaultCrypto";
const now=new Date(2026,9,15,12);
function store(){
 const m=new Map<string,string>();
 return {
  get length(){return m.size;},
  key(i:number){return [...m.keys()][i]??null;},
  getItem(k:string){return m.get(k)??null;},
  setItem(k:string,v:string){m.set(k,v);},
  removeItem(k:string){m.delete(k);}
 };
}
const buildFixtures=()=>{
 const quote=addEnteredOffer(makePrivateQuote({
  product:"School supplies",quantity:2,deliveryCity:"Amman",neededBy:"2026-10-25",
  budgetCeilingJod:85
 },"quote-one",now),{
  id:"offer-one",merchant:"Shop One",itemCostJod:60,deliveryJod:4,
  taxesJod:3,expiresOn:"2026-10-25",
  evidenceUrl:"https://example.org/offer",note:"Check warranty"
 },now);
 const provider=makeServiceEntry({
  id:"svc-one",category:"school",name:"School A",city:"Amman",
  checkedAt:"2026-10-15",costJod:80,parentFit:4,
  sourceUrl:"https://example.org/school",availabilityConfirmedByParent:true
 },now);
 return {quote,provider};
};
describe("strict merchant and service backup recovery",()=>{
 it("selectively restores both new personal sections while preserving unrelated local state",()=>{
  const initial=store(),target=store(),{quote,provider}=buildFixtures();
  initial.setItem("wafferli.v13.privateQuoteRequests",JSON.stringify([quote]));
  initial.setItem("wafferli.v13.privateServiceShortlist",JSON.stringify([provider]));
  initial.setItem("wafferli.v13.outings",'[{"vote_token":"DO_NOT_RESTORE"}]');
  target.setItem("wafferli.v13.money",'{"income":975}');
  const backup=JSON.stringify(buildLocalBackup(initial,now));
  const preview=inspectLocalBackup(backup,target);
  expect(preview.sections.map(x=>x.key).sort()).toEqual(
   ["privateQuoteRequests","privateServiceShortlist"].sort());
  expect(preview.skipped).toEqual(["outings"]);
  expect(JSON.stringify(preview.values)).not.toContain("DO_NOT_RESTORE");
  expect(()=>restoreLocalSections(target,preview,["privateQuoteRequests"],false))
   .toThrow(/consent/i);
  const result=restoreLocalSections(target,preview,
   ["privateQuoteRequests","privateServiceShortlist"],true);
  expect(result.restored).toHaveLength(2);
  expect(JSON.parse(target.getItem("wafferli.v13.privateQuoteRequests")!)).toEqual([quote]);
  expect(JSON.parse(target.getItem("wafferli.v13.privateServiceShortlist")!)).toEqual([provider]);
  expect(target.getItem("wafferli.v13.outings")).toBeNull();
  expect(target.getItem("wafferli.v13.money")).toBe('{"income":975}');
 });
 it("rejects concealed tokens or unforeseen fields inside provider or quotation data",()=>{
  const source=store(),{quote,provider}=buildFixtures();
  source.setItem("wafferli.v13.privateQuoteRequests",JSON.stringify([
   {...quote,offers:[{...quote.offers[0],admin_token:"SECRET"}]}
  ]));
  expect(()=>inspectLocalBackup(JSON.stringify(buildLocalBackup(source,now)),store()))
   .toThrow(/invalid privateQuoteRequests/i);
  source.setItem("wafferli.v13.privateQuoteRequests",JSON.stringify([quote]));
  source.setItem("wafferli.v13.privateServiceShortlist",JSON.stringify([
   {...provider,password:"SECRET"}
  ]));
  expect(()=>inspectLocalBackup(JSON.stringify(buildLocalBackup(source,now)),store()))
   .toThrow(/invalid privateServiceShortlist/i);
 });
 it("rejects duplicate nested offer IDs and unsafe URLs before any writes",()=>{
  const source=store(),{quote,provider}=buildFixtures();
  source.setItem("wafferli.v13.privateQuoteRequests",JSON.stringify([
   {...quote,offers:[quote.offers[0],quote.offers[0]]}
  ]));
  expect(()=>inspectLocalBackup(JSON.stringify(buildLocalBackup(source,now)),store()))
   .toThrow(/Duplicate offer IDs/i);
  source.setItem("wafferli.v13.privateQuoteRequests",JSON.stringify([quote]));
  source.setItem("wafferli.v13.privateServiceShortlist",JSON.stringify([
   {...provider,sourceUrl:"javascript:alert(1)"}
  ]));
  expect(()=>inspectLocalBackup(JSON.stringify(buildLocalBackup(source,now)),store()))
   .toThrow(/invalid privateServiceShortlist/i);
 });
 it("includes only explicitly chosen extra sections in opt-in personal vault snapshots",()=>{
  const source=store(),{quote,provider}=buildFixtures();
  source.setItem("wafferli.v13.privateQuoteRequests",JSON.stringify([quote]));
  source.setItem("wafferli.v13.privateServiceShortlist",JSON.stringify([provider]));
  source.setItem("wafferli.v13.outings",JSON.stringify([{admin_token:"SECRET"}]));
  const snapshot=preparePrivateVaultSnapshot(source,["privateServiceShortlist"],now);
  expect(snapshot.sections).toEqual(["privateServiceShortlist"]);
  const parsed=JSON.parse(snapshot.json) as {entries:Record<string,unknown>};
  expect(Object.keys(parsed.entries)).toEqual(["privateServiceShortlist"]);
  expect(snapshot.json).not.toContain("SECRET");
  expect(snapshot.json).not.toContain("Shop One");
 });
});
