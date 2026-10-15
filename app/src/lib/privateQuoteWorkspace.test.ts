import {describe,expect,it} from "vitest";
import {addEnteredOffer,compareEnteredOffers,makePrivateQuote,offerTotalJod,
 privateQuoteSummary,recordUserSharedRequest} from "./privateQuoteWorkspace";
import {buildLocalBackup,eraseLocalAppData} from "./localDataControls";
const now=new Date(2026,9,15,12);
const draft={product:"School backpacks",quantity:2,deliveryCity:"Amman",neededBy:"2026-10-25",budgetCeilingJod:100};
const q=()=>makePrivateQuote(draft,"test-quote",now);
const offer=(input:Partial<Parameters<typeof addEnteredOffer>[1]>={})=>({
 id:"o1",merchant:"Shop A",itemCostJod:72,deliveryJod:8,taxesJod:4,
 expiresOn:"2026-10-20",...input
});
describe("user-controlled local quotation lifecycle",()=>{
 it("starts unsent; sharing status is only a user's self-report",()=>{
  expect(q().status).toBe("draft");
  expect(recordUserSharedRequest(q()).status).toBe("shared-by-user");
  expect(q().offers).toEqual([]);
  expect(()=>makePrivateQuote({...draft,neededBy:"2026-01-01"},"id",now)).toThrow();
 });
 it("calculates complete cost, sorts active first and distinguishes expired manual offers",()=>{
  let record=addEnteredOffer(q(),offer(),now);
  record=addEnteredOffer(record,offer({id:"o2",merchant:"Shop B",itemCostJod:60,deliveryJod:5,
   taxesJod:2,expiresOn:"2026-10-14"}),now===now?new Date(2026,9,13,12):now);
  record=addEnteredOffer(record,offer({id:"o3",merchant:"Shop C",itemCostJod:75,deliveryJod:2,
   taxesJod:0}),now);
  const compared=compareEnteredOffers(record,now);
  expect(compared.map(o=>o.offer.id)).toEqual(["o3","o1","o2"]);
  expect(compared.map(o=>o.totalJod)).toEqual([77,84,67]);
  expect(compared[2]?.expired).toBe(true);
  expect(privateQuoteSummary(record).lowestActiveJod).toBe(77);
  expect(offerTotalJod(compared[0]!.offer)).toBe(77);
 });
 it("rejects invalid prices, duplicate offers and private or dangerous evidence links",()=>{
  expect(()=>addEnteredOffer(q(),offer({itemCostJod:-1}),now)).toThrow();
  expect(()=>addEnteredOffer(q(),offer({itemCostJod:35.555}),now)).toThrow();
  expect(()=>addEnteredOffer(q(),offer({evidenceUrl:"javascript:alert(1)"}),now)).toThrow();
  expect(()=>addEnteredOffer(q(),offer({evidenceUrl:"https://u:p@example.com/"}),now)).toThrow();
  expect(()=>addEnteredOffer(q(),offer({evidenceUrl:"http://example.com/"}),now)).toThrow();
  expect(()=>addEnteredOffer(q(),offer({expiresOn:"2026-02-30"}),now)).toThrow();
  const first=addEnteredOffer(q(),offer(),now);
  expect(()=>addEnteredOffer(first,offer(),now)).toThrow(/duplicate/i);
 });
 it("prevents recording any new price after locally closing a request",()=>{
  const closed={...q(),status:"closed" as const};
  expect(()=>addEnteredOffer(closed,offer(),now)).toThrow(/closed/i);
 });
 it("keeps quotes in device-only backup while never touching login sessions on reset",()=>{
  const values=new Map<string,string>();
  const store={
   get length(){return values.size;},
   key:(i:number)=>[...values.keys()][i]??null,
   getItem:(key:string)=>values.get(key)??null,
   setItem:(key:string,value:string)=>{values.set(key,value);},
   removeItem:(key:string)=>{values.delete(key);}
  };
  store.setItem("wafferli.v13.privateQuoteRequests",JSON.stringify([q()]));
  store.setItem("sb-tenant-auth-token","secret");
  const exported=buildLocalBackup(store,now);
  expect(exported.entries["privateQuoteRequests"]).toEqual([q()]);
  expect(JSON.stringify(exported)).not.toContain("secret");
  expect(eraseLocalAppData(store)).toBe(1);
  expect(store.getItem("sb-tenant-auth-token")).toBe("secret");
 });
});
