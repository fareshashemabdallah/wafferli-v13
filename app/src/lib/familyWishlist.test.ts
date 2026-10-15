import {describe,expect,it} from "vitest";
import {makeWishlistItem,recordWishlistPrice,summarizeWishlistPrice,updateWishlistStatus,confirmRecurringPurchase,nextRecurringWishlistDate} from "./familyWishlist";
import {inspectLocalBackup,restoreLocalSections} from "./backupRestore";
import {buildLocalBackup} from "./localDataControls";
const now=new Date(2026,9,15,12);
const item=()=>makeWishlistItem({id:"gift1",name:"Birthday present",kind:"gift",
 targetDate:"2026-10-21",budgetJod:40,recipientLabel:"Family member"},now)!;
function store(){const m=new Map<string,string>();return {
 get length(){return m.size;},key:(i:number)=>[...m.keys()][i]??null,
 getItem:(k:string)=>m.get(k)??null,setItem:(k:string,v:string)=>{m.set(k,v);},
 removeItem:(k:string)=>{m.delete(k);}
};}
describe("wishlists and real user-entered price history",()=>{
 it("creates planned entries without initiating orders or recording expenses",()=>{
  const a=item();expect(a.status).toBe("considering");
  expect(a).not.toHaveProperty("paidExpenseId");
  expect(a.prices).toEqual([]);
  expect(makeWishlistItem({id:"x",name:"Some thing",kind:"gift",
    targetDate:"2026-02-30"},now)).toBeNull();
 });
 it("records chronological amounts without claiming a true price feed or saving",()=>{
  const a=recordWishlistPrice(item(),{id:"p1",amountJod:25,checkedAt:"2026-10-01",store:"Shop A"},now);
  const b=recordWishlistPrice(a,{id:"p2",amountJod:30,checkedAt:"2026-10-15",store:"Shop B",
   sourceUrl:"https://example.org/product"},now);
  expect(summarizeWishlistPrice(b)).toMatchObject({changeJod:5,lowestRecordedJod:25});
  expect(b.prices).toHaveLength(2);
  expect(()=>recordWishlistPrice(b,{id:"p2",amountJod:10,checkedAt:"2026-10-15",store:"X"},now)).toThrow();
  expect(()=>recordWishlistPrice(b,{id:"bad",amountJod:10,checkedAt:"2026-10-15",store:"Shop",
    sourceUrl:"javascript:alert(1)"},now)).toThrow();
 });
 it("does not deduct money when an entry is marked purchased",()=>{
  const x=updateWishlistStatus(item(),"purchased",now);
  expect(x.status).toBe("purchased");
  expect(x).not.toHaveProperty("actualJod");
  expect(()=>recordWishlistPrice(x,{id:"p",amountJod:10,checkedAt:"2026-10-15",store:"Store"},now)).toThrow();
 });

 it("anchors end-of-month cycles without drifting and catches leap-year February",()=>{
  expect(nextRecurringWishlistDate("2027-01-31",1,"2027-01-31")).toBe("2027-02-28");
  expect(nextRecurringWishlistDate("2027-01-31",1,"2027-02-28")).toBe("2027-03-31");
  expect(nextRecurringWishlistDate("2024-01-31",1,"2024-01-31")).toBe("2024-02-29");
  expect(nextRecurringWishlistDate("2026-10-15",3,"2026-10-15")).toBe("2027-01-15");
 });
 it("moves only the original repeat item when a parent confirms this cycle",()=>{
  const original=makeWishlistItem({id:"detergent",name:"Detergent refill",kind:"household",
   targetDate:"2026-10-31",repeatMonths:1,budgetJod:12},now)!;
  const updated=confirmRecurringPurchase(original,now);
  expect(updated.id).toBe(original.id);
  expect(updated.targetDate).toBe("2026-11-30");
  expect(updated.repeatAnchorDate).toBe("2026-10-31");
  expect(updated.lastPurchasedOn).toBe("2026-10-15");
  expect(updated.status).toBe("considering");
  expect(original.targetDate).toBe("2026-10-31");
  expect(updated.prices).toEqual([]);
  expect(updated).not.toHaveProperty("orderId");
  expect(updated).not.toHaveProperty("expenseId");
  expect(()=>confirmRecurringPurchase(updated,now)).toThrow(/already marked/i);
 });
 it("skips lapsed reminder cycles rather than creating duplicate missed orders",()=>{
  const old=makeWishlistItem({id:"refill",name:"Soap refill",kind:"household",
   targetDate:"2026-10-15",repeatMonths:1},now)!;
  const next=confirmRecurringPurchase(old,new Date(2027,3,19,12));
  expect(next.targetDate).toBe("2027-05-15");
  expect(next.lastPurchasedOn).toBe("2027-04-19");
 });
 it("rejects repeat frequencies without a date, preserving one-off gifts",()=>{
  expect(makeWishlistItem({id:"refill",name:"Paper towels",kind:"household",
   repeatMonths:1},now)).toBeNull();
  expect(confirmRecurringPurchase(item(),now)).toThrow(/not an active repeating/i);
 });
 it("safely restores recurring dates but rejects injected extra auth tokens",()=>{
  const original=store(),target=store();
  const recurring=confirmRecurringPurchase(makeWishlistItem({id:"repeat",name:"Household refill",
   kind:"household",repeatMonths:1,targetDate:"2026-10-31"},now)!,now);
  original.setItem("wafferli.v13.familyWishlist",JSON.stringify([recurring]));
  const exported=JSON.stringify(buildLocalBackup(original,now));
  const preview=inspectLocalBackup(exported,target);
  restoreLocalSections(target,preview,["familyWishlist"],true);
  expect(JSON.parse(target.getItem("wafferli.v13.familyWishlist")!)[0].repeatAnchorDate).toBe("2026-10-31");
  const injected=JSON.parse(exported) as {entries:Record<string,unknown>};
  injected.entries["familyWishlist"]=[{...recurring,session_token:"NO"}];
  expect(()=>inspectLocalBackup(JSON.stringify(injected),store())).toThrow(/invalid familyWishlist/i);
 });
 it("exports/validates/imports selected wishlist records but refuses secrets and duplicate IDs",()=>{
  const original=store(),target=store();
  original.setItem("wafferli.v13.familyWishlist",JSON.stringify([item()]));
  const file=JSON.stringify(buildLocalBackup(original,now));
  const preview=inspectLocalBackup(file,target);
  expect(preview.sections.some(s=>s.key==="familyWishlist")).toBe(true);
  restoreLocalSections(target,preview,["familyWishlist"],true);
  expect(JSON.parse(target.getItem("wafferli.v13.familyWishlist")!)).toHaveLength(1);
  const injected=JSON.parse(file) as {entries:Record<string,unknown>};
  injected.entries["familyWishlist"]=[{...item(),authToken:"secret"}];
  expect(()=>inspectLocalBackup(JSON.stringify(injected),store())).toThrow(/invalid familyWishlist/);
  injected.entries["familyWishlist"]=[{...item(),prices:[
   {id:"x",amountJod:5,checkedAt:"2026-10-15",store:"Shop"},
   {id:"x",amountJod:6,checkedAt:"2026-10-15",store:"Shop"}]}];
  expect(()=>inspectLocalBackup(JSON.stringify(injected),store())).toThrow(/Duplicate price IDs/);
 });
});
