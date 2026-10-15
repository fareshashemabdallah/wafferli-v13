import {describe,expect,it} from "vitest";
import {captureSpendingReview,reviewState,reviewedBaselineMonths,reviewRevision} from "./spendingMonthReview";
import {detectSpendingChanges,spendingHistory} from "./financialIntelligence";
import {sampleMoney,type MoneyState} from "./money";
import {inspectLocalBackup,restoreLocalSections} from "./backupRestore";
import {buildLocalBackup} from "./localDataControls";
const now=new Date(2026,9,15,12);
const expense=(id:string,date:string,amount:number,status:"planned"|"paid"="paid")=>({id,date,amount,status,categoryId:"food",shared:true});
const money=():MoneyState=>({...sampleMoney(),demo:false,income:2500,
 categories:[{id:"food",name:"Food",type:"variable",planned:600}],
 expenses:[expense("aug","2026-08-11",50),expense("sep","2026-09-11",60),
  expense("oct","2026-10-11",180),expense("future","2026-10-25",250,"planned")]
});
function store(){const db=new Map<string,string>();return{
 get length(){return db.size;},key:(i:number)=>[...db.keys()][i]??null,
 getItem:(k:string)=>db.get(k)??null,setItem:(k:string,v:string)=>{db.set(k,v);},
 removeItem:(k:string)=>{db.delete(k);}
};}
describe("voluntary recorded-spending monthly reviews",()=>{
 it("cannot review demo or current/future/invalid months as a completed period",()=>{
  expect(()=>captureSpendingReview(sampleMoney(),"2026-09",now)).toThrow(/sample/i);
  expect(()=>captureSpendingReview(money(),"2026-10",now)).toThrow(/past calendar/i);
  expect(()=>captureSpendingReview(money(),"2026-11",now)).toThrow();
  expect(()=>captureSpendingReview(money(),"2026-13",now)).toThrow();
 });
 it("captures a parent review and only records a planned envelope at review time",()=>{
  const m=money(),old=JSON.stringify(m);
  const review=captureSpendingReview(m,"2026-08",now);
  expect(review).toMatchObject({month:"2026-08",paidCount:1,enteredSpendJod:50,
   capturedPlanJod:600});
  expect(reviewState(m,"2026-08",[review])).toBe("reviewed");
  expect(reviewState(m,"2026-09",[review])).toBe("unreviewed");
  expect(JSON.stringify(m)).toBe(old);
  expect(review).not.toHaveProperty("bankVerified");
 });
 it("invalidates a prior review after edited paid entries, ignoring planned-only entries",()=>{
  const m=money(),review=captureSpendingReview(m,"2026-09",now);
  const planned={...m,expenses:[...m.expenses,expense("not-paid","2026-09-22",99,"planned")]};
  expect(reviewRevision(planned,"2026-09")).toBe(review.revision);
  const corrected={...m,expenses:m.expenses.map(e=>e.id==="sep"?{...e,amount:95}:e)};
  expect(reviewState(corrected,"2026-09",[review])).toBe("changed");
  expect(reviewedBaselineMonths(corrected,[review],now).size).toBe(0);
 });
 it("requires two actively reviewed baseline months before comparative increase prompts",()=>{
  const m=money();
  const reviews=[captureSpendingReview(m,"2026-08",now),captureSpendingReview(m,"2026-09",now)];
  expect(detectSpendingChanges(m,now,new Set())).toEqual([]);
  expect(detectSpendingChanges(m,now,reviewedBaselineMonths(m,reviews.slice(0,1),now))).toEqual([]);
  const flags=detectSpendingChanges(m,now,reviewedBaselineMonths(m,reviews,now));
  expect(flags).toHaveLength(1);
  expect(flags[0]?.priorAverageJod).toBe(55);
  expect(flags[0]?.monthJod).toBe(180);
  expect(spendingHistory(m,now,3).map(r=>r.spentJod)).toEqual([50,60,180]);
 });
 it("selectively backs up exactly the validated reviewed-month records",()=>{
  const src=store(),dst=store(),review=captureSpendingReview(money(),"2026-09",now);
  src.setItem("wafferli.v13.moneyMonthReviews",JSON.stringify([review]));
  src.setItem("sb-auth-token","SECRET");
  const backup=JSON.stringify(buildLocalBackup(src,now));
  expect(backup).not.toContain("SECRET");
  const preview=inspectLocalBackup(backup,dst);
  expect(preview.sections.map(r=>r.key)).toEqual(["moneyMonthReviews"]);
  restoreLocalSections(dst,preview,["moneyMonthReviews"],true);
  expect(JSON.parse(dst.getItem("wafferli.v13.moneyMonthReviews")!)).toEqual([review]);
  const tampered=JSON.parse(backup) as {entries:Record<string,unknown>};
  tampered.entries.moneyMonthReviews=[{...review,accessToken:"SECRET"}];
  expect(()=>inspectLocalBackup(JSON.stringify(tampered),store())).toThrow(/invalid moneyMonthReviews/i);
  tampered.entries.moneyMonthReviews=[review,review];
  expect(()=>inspectLocalBackup(JSON.stringify(tampered),store())).toThrow(/Duplicate months/);
 });
});
