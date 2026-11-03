import {describe,expect,it} from "vitest";
import {sharedFamilyMonths,sharedFamilySnapshot} from "./connectedFamilySnapshot";
import type {SharedExpenseRow} from "./expenseSharing";

const household="be02ac77-1d70-4ecc-980e-34d1124e24d1";
const parentA="35796b6a-8c32-4c8b-b905-14bf4c58feaa";
const parentB="6ca9e00a-bd8f-48bd-b7f6-8d01ca637bd7";
const stranger="12e2c1b2-3418-4593-96bf-1aa2c0e1b22a";
const row=(id:string,author:string,amount:number,date="2026-11-02",category="Groceries"):SharedExpenseRow=>({
 id,household_id:household,created_by:author,source_fingerprint:id.replaceAll("-","").repeat(2),
 category,amount_fils:amount,occurred_on:date,currency:"JOD",
 consented_at:"2026-11-03T05:00:00Z"
});
const id1="aee9e00a-bd8f-48bd-b7f6-8d01ca637bd7";
const id2="bee9e00a-bd8f-48bd-b7f6-8d01ca637bd7";
const id3="cee9e00a-bd8f-48bd-b7f6-8d01ca637bd7";
const rows=[row(id1,parentA,70000,"2026-11-01","Education"),
 row(id2,parentB,20000,"2026-11-02","Education"),
 row(id3,parentB,9000,"2026-10-29")];
describe("connected-family privacy read model",()=>{
 it("shows the same family total to both adults without any private income or other records",()=>{
  const before=JSON.stringify(rows);
  const a=sharedFamilySnapshot(rows,household,parentA,"2026-11");
  const b=sharedFamilySnapshot(rows,household,parentB,"2026-11");
  expect(a).toMatchObject({totalFils:90000,mineFils:70000,otherAdultsFils:20000,
   count:2,mineCount:1,otherAdultsCount:1});
  expect(b).toMatchObject({totalFils:90000,mineFils:20000,otherAdultsFils:70000,
   count:2,mineCount:1,otherAdultsCount:1});
  expect(a.categories).toEqual([{category:"Education",amountFils:90000,count:2}]);
  expect(JSON.stringify(rows)).toBe(before);
 });
 it("does not count duplicate records twice or disclose records from other households",()=>{
  const leak={...row(id3,stranger,50000),household_id:stranger};
  const result=sharedFamilySnapshot([...rows,rows[0]!,leak],household,parentA,"2026-11");
  expect(result.totalFils).toBe(90000);
  expect(result.count).toBe(2);
  expect(result.categories).toHaveLength(1);
  expect(sharedFamilySnapshot(rows,household,"invalid-user","2026-11").totalFils).toBe(0);
  expect(sharedFamilySnapshot(rows,household,parentA,"2026-13").count).toBe(0);
 });
 it("labels a truncated data window and keeps month selection consistent across salary schedules",()=>{
  const repeated=Array.from({length:200},(_,i)=>row(
   "a"+String(i).padStart(7,"0")+"-bd8f-48bd-b7f6-8d01ca637bd7",
   parentA,1000));
  const result=sharedFamilySnapshot(repeated,household,parentA,"2026-11");
  expect(result.limitedToRecentRecords).toBe(true);
  expect(result.count).toBe(200);
  expect(sharedFamilyMonths(new Date(2027,0,14,12),3)).toEqual(["2027-01","2026-12","2026-11"]);
 });
});
