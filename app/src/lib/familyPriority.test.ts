import {describe,expect,it} from "vitest";
import {selectFamilyPriority} from "./familyPriority";
import {defaultFamilyPreferences} from "./familyPreferences";
import {emptyRealMoney} from "./moneyOverview";
import {createSavingsGoal} from "./savingsGoals";
import type {MoneyState} from "./money";

const now=new Date(2026,9,15,12);
const prefs={...defaultFamilyPreferences};
const validMoney=():MoneyState=>({...emptyRealMoney(),
  income:1800,incomeSources:undefined,savingsTargetAmount:200,
  categories:[{id:"living",name:"Living",planned:1100,type:"fixed"}],
  cashOnHand:800,cashReserve:100,cashUpdatedAt:"2026-10-15",
  noBillsConfirmedMonth:"2026-10"
});
const goal=(monthly:number,dueDate="2026-11-15")=>createSavingsGoal({
  id:"school",name:"School fund",targetJod:400,savedJod:100,monthlyJod:monthly,dueDate
},now)!;
describe("Today family priority",()=>{
 it("never presents sample data as a real personal warning",()=>{
  expect(selectFamilyPriority({...validMoney(),demo:true},prefs,now)).toBeNull();
 });
 it("honours disabled financial guidance and notifications",()=>{
  const s={...validMoney(),cashOnHand:0};
  expect(selectFamilyPriority(s,{...prefs,financeTips:false},now)).toBeNull();
  expect(selectFamilyPriority(s,{...prefs,notificationFrequency:"off"},now)).toBeNull();
 });
 it("does not duplicate the home basic budget setup",()=>{
  const s={...validMoney(),categories:[]};
  expect(selectFamilyPriority(s,prefs,now)).toBeNull();
 });
 it("puts a cash shortfall ahead of savings suggestions",()=>{
  const s={...validMoney(),cashOnHand:20,savingsGoals:[goal(10)]};
  expect(selectFamilyPriority(s,prefs,now)?.id).toBe("cash-risk");
 });
 it("identifies goal allocations above the overall monthly target, without changing any data",()=>{
  const s={...validMoney(),savingsGoals:[goal(250)]};
  expect(selectFamilyPriority(s,prefs,now)?.id).toBe("goals-overallocated");
  expect(s.savingsTargetAmount).toBe(200);
  expect(s.cashOnHand).toBe(800);
 });
 it("flags a goal whose deadline is too soon at the stated contribution",()=>{
  const s={...validMoney(),savingsGoals:[goal(50)]};
  expect(selectFamilyPriority(s,prefs,now)?.id).toBe("goal-deadline");
  expect(s.savingsGoals?.[0]?.savedJod).toBe(100);
 });
 it("ignores already-achieved and undated goals for deadline alerts",()=>{
  const g=goal(50);
  const done={...g,savedJod:g.targetJod};
  const s={...validMoney(),savingsGoals:[done]};
  expect(selectFamilyPriority(s,prefs,now)).toBeNull();
  const undated=createSavingsGoal({id:"future",name:"New goal",targetJod:400,savedJod:100,monthlyJod:50},now)!;
  expect(selectFamilyPriority({...s,savingsGoals:[undated]},prefs,now)).toBeNull();
 });
 it("points to missing real cash, bills or an old cash update in that order",()=>{
  const s=validMoney();
  expect(selectFamilyPriority({...s,cashOnHand:null},prefs,now)?.id).toBe("cash-missing");
  expect(selectFamilyPriority({...s,noBillsConfirmedMonth:undefined},prefs,now)?.id).toBe("bills-missing");
  expect(selectFamilyPriority({...s,cashUpdatedAt:"2026-07-01"},prefs,now)?.id).toBe("cash-stale");
 });
 it("only offers a soft goal suggestion in gentle notification mode",()=>{
  const s=validMoney();
  expect(selectFamilyPriority(s,prefs,now)).toBeNull();
  expect(selectFamilyPriority(s,{...prefs,notificationFrequency:"gentle"},now)?.id).toBe("savings-purpose");
 });
});
