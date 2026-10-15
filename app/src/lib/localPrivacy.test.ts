import {describe,expect,it} from "vitest";
import {sampleMoney,type MoneyState} from "./money";
import {changeLocalExpenseVisibility,localExpenseVisibilitySummary} from "./localPrivacy";
import {buildFamilyAttention,snoozeAttention} from "./familyAttention";
import {defaultFamilyPreferences} from "./familyPreferences";
import {makeFamilyTask} from "./familyTasks";
const now=new Date(2026,9,15,12);
describe("local finance privacy labels and reminder inbox",()=>{
 it("changes only selected expense's local label, not payment or cash",()=>{
  const m:MoneyState={...sampleMoney(),demo:false,cashOnHand:400};
  const before=m.expenses[0]!;
  expect(before.shared).toBe(true);
  const changed=changeLocalExpenseVisibility(m,before.id,false);
  expect(changed.expenses[0]).toMatchObject({...before,shared:false});
  expect(changed.cashOnHand).toBe(400);
  expect(m.expenses[0]?.shared).toBe(true);
  expect(localExpenseVisibilitySummary(changed).privateLabels).toBeGreaterThan(0);
  expect(()=>changeLocalExpenseVisibility(sampleMoney(),before.id,false)).toThrow();
  expect(()=>changeLocalExpenseVisibility(m,"forged",false)).toThrow();
 });
 it("supports expandable bounded attention with temporary local snoozes",()=>{
  const tasks=Array.from({length:12},(_,i)=>makeFamilyTask({id:"t"+i,title:"Task "+i,
   dueDate:"2026-10-14",priority:"high"},now)!);
  const args={money:sampleMoney(),members:[],preferences:defaultFamilyPreferences,
   preferencesConfirmed:true,plans:[],moments:[],tasks,now};
  const compact=buildFamilyAttention(args);
  const expanded=buildFamilyAttention({...args,maxItems:20});
  expect(compact.length).toBeLessThanOrEqual(4);
  expect(expanded.length).toBeGreaterThanOrEqual(compact.length);
  const snoozable=expanded.find(i=>i.canSnooze);
  if(snoozable){
   const snoozes=snoozeAttention({},snoozable,now);
   expect(buildFamilyAttention({...args,snoozes,maxItems:20}).some(i=>i.key===snoozable.key)).toBe(false);
  }
 });
});
