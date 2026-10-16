import {describe,expect,it} from "vitest";
import {checkFamilyPlan,postponeFlexiblePlan,markPlanDoneWithoutCost,addPlanActualCost} from "./familyPlanCheckIn";
import type {FamilyPlan} from "./familyPlans";
const now=new Date(2026,9,16,12);
const base=(overrides:Partial<FamilyPlan>={}):FamilyPlan=>({
 id:"plan-001",title:"Family day out",kind:"outing",status:"planning",
 createdAt:"2026-10-01T12:00:00Z",updatedAt:"2026-10-01T12:00:00Z",
 date:"2026-10-17",budgetJod:40,...overrides
});
describe("plan review and adjustment is a decision, not a new form",()=>{
 it("surfaces due, past, future and undated plans with appropriate guidance",()=>{
  expect(checkFamilyPlan(base(),now).state).toBe("soon");
  expect(checkFamilyPlan(base({date:"2026-10-14"}),now).state).toBe("overdue");
  expect(checkFamilyPlan(base({date:"2026-11-25"}),now).state).toBe("future");
  const unscheduled=base();delete unscheduled.date;
  expect(checkFamilyPlan(unscheduled,now).state).toBe("undated");
 });
 it("moves an unlinked flexible plan exactly one week on parent approval",()=>{
  const original=base(),before=JSON.stringify(original);
  const moved=postponeFlexiblePlan(original,now);
  expect(moved?.date).toBe("2026-10-24");
  expect(moved?.budgetJod).toBe(40);
  expect(moved?.status).toBe("planning");
  expect(JSON.stringify(original)).toBe(before);
  expect(postponeFlexiblePlan(base({date:"2026-10-14"}),now)?.date).toBe("2026-10-23");
 });
 it("never shifts a linked birthday, fixed occasion, completed plan or prior expense",()=>{
  expect(postponeFlexiblePlan(base({kind:"occasion"}),now)).toBeNull();
  expect(postponeFlexiblePlan(base({sourceRef:"occasion:birthday@2026"}),now)).toBeNull();
  expect(postponeFlexiblePlan(base({status:"completed"}),now)).toBeNull();
  expect(postponeFlexiblePlan(base({expenseId:"paid-in-money"}),now)).toBeNull();
 });
 it("marks a real confirmed outcome complete without inventing a zero cost or a money ledger record",()=>{
  const item=base(),before=JSON.stringify(item);
  const result=markPlanDoneWithoutCost(item,now);
  expect(result.status).toBe("completed");
  expect(result.actualJod).toBeUndefined();
  expect(result.expenseId).toBeUndefined();
  expect(result.completedAt).toBe("2026-10-16T12:00:00.000Z");
  expect(JSON.stringify(item)).toBe(before);
  expect(checkFamilyPlan(result,now).detailEn).toContain("no expense or payment");
 });
 it("later actual costs are optional, explicit and cannot change an already recorded expense",()=>{
  const completed=markPlanDoneWithoutCost(base(),now);
  expect(addPlanActualCost(completed,32.5,now)?.actualJod).toBe(32.5);
  expect(addPlanActualCost(completed,-1,now)).toBeNull();
  expect(addPlanActualCost(completed,0.001,now)).toBeNull();
  expect(addPlanActualCost(base(),10,now)).toBeNull();
  expect(addPlanActualCost({...completed,expenseId:"recorded"},20,now)).toBeNull();
 });
});
