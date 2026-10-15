import {describe,expect,it} from "vitest";
import {assessImmediateSpending} from "./spendingScenario";
import {sampleMoney,type MoneyState} from "./money";
const now=new Date(2026,9,15,12);
const s=():MoneyState=>({...sampleMoney(),
 demo:false,income:2000,cashOnHand:1000,cashReserve:300,cashUpdatedAt:"2026-10-15",
 incomeSources:[{id:"salary",name:"Salary",amount:2000,frequency:"monthly",nextDate:"2026-10-30",shared:true}],
 commitments:[{id:"school",name:"School bill",amount:300,frequency:"once",dueDate:"2026-10-20"}]
});
describe("conservative one-off purchase scenario",()=>{
 it("refuses demo, missing cash, stale cash and unknown future bill dates",()=>{
  expect(assessImmediateSpending(sampleMoney(),50,now).outcome).toBe("unknown");
  expect(assessImmediateSpending({...s(),cashOnHand:null},50,now).riskReasons)
   .toContain("Enter the actual cash balance held today.");
  expect(assessImmediateSpending({...s(),cashUpdatedAt:"2026-07-01"},50,now).outcome)
   .toBe("unknown");
  expect(assessImmediateSpending({...s(),commitments:[]},50,now).outcome)
   .toBe("unknown");
  expect(assessImmediateSpending({...s(),commitments:[{...s().commitments![0]!,dueDate:"not-a-date"}]},50,now).outcome)
   .toBe("unknown");
 });
 it("models full immediate cost at the 30-day low point, never only monthly allowance",()=>{
  const a=assessImmediateSpending(s(),100,now);
  expect(a.outcome).toBe("provisional");
  expect(a.reserveJod).toBe(300);
  expect(a.projectedLowJod).toBe(600);
  expect(a.billOnlyHeadroomJod).toBe(300);
  expect(a.caveats.join(" ")).toContain("not a guarantee");
 });
 it("flags payment that breaches reserve and recorded obligations",()=>{
  const a=assessImmediateSpending(s(),600,now);
  expect(a.outcome).toBe("review");
  expect(a.projectedLowJod).toBe(100);
  expect(a.riskReasons.join(" ")).toMatch(/reserve/);
  expect(a.riskReasons.join(" ")).toMatch(/exceeds recorded/);
 });
 it("does not mutate the existing Money ledger on preview",()=>{
  const original=s(),before=JSON.stringify(original);
  assessImmediateSpending(original,150,now);
  expect(JSON.stringify(original)).toBe(before);
 });
 it("rejects invalid amounts and includes income volatility caveat",()=>{
  expect(assessImmediateSpending(s(),0,now).outcome).toBe("unknown");
  expect(assessImmediateSpending(s(),123.456,now).outcome).toBe("unknown");
  const a=assessImmediateSpending({...s(),incomeSources:[{
   id:"variable",name:"Freelance",amount:1800,frequency:"monthly",
   nextDate:"2026-10-30",shared:true,variable:true
  }]},100,now);
  expect(a.caveats.join(" ")).toContain("variable");
 });
});
