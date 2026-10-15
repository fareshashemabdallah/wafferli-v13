import {describe,expect,it} from "vitest";
import {selectFamilyLifeAdvice} from "./familyLifeAdvice";
import {defaultFamilyPreferences} from "./familyPreferences";
import {sampleMembers,sampleMoney,type Member,type MoneyState} from "./money";
import {applyStarterBudget} from "./starterBudget";
import {makeFamilyPlan,type FamilyPlan} from "./familyPlans";

const now=new Date(2026,9,15,12);
const parent:Member={id:"real-adult",name:"Parent",role:"adult",ageGroup:"30–44",prefs:""};
const child:Member={id:"real-child",name:"Child",role:"child",ageGroup:"0–5",prefs:""};
const money=():MoneyState=>applyStarterBudget(sampleMoney(),{income:1500,spending:900,savings:200});
const plan=(id:string,amount?:number,date="2026-10-21"):FamilyPlan=>
 makeFamilyPlan({id,title:"Family plan "+id,kind:"outing",date,...(amount===undefined?{}:{budgetJod:amount})},now)!;
const prefs={...defaultFamilyPreferences,notificationFrequency:"gentle" as const,
 typicalChildrenAttendance:"yes" as const, typicalOutingFocus:"children" as const};
const select=(overrides:Partial<Parameters<typeof selectFamilyLifeAdvice>[0]>={})=>
 selectFamilyLifeAdvice({
   money:money(),members:[parent,child],preferences:prefs,preferencesConfirmed:true,
   plans:[],now,...overrides
 });
describe("family life recommendations",()=>{
 it("connects combined plan cost to entered monthly room, not imaginary bank funds",()=>{
  const r=select({plans:[plan("a",260),plan("b",200)]});
  expect(r?.id).toBe("plans-over-budget");
  expect(r?.detailEn).toContain("2 plan(s)");
 });
 it("gives upcoming costless plan a specific action",()=>{
  expect(select({plans:[plan("a") ]})?.id).toBe("plan-needs-cost");
 });
 it("never calls a positive monthly calculation guaranteed affordability",()=>{
  const r=select({plans:[plan("a",70)]});
  expect(r?.id).toBe("plan-coming-up");
  expect(r?.detailEn).toMatch(/not payment approval/);
 });
 it("does not turn demo members into real child recommendations",()=>{
  const r=select({plans:[],members:sampleMembers()});
  expect(r).toBeNull();
 });
 it("only personalizes child outings with real children and explicitly selected attendance",()=>{
  expect(select()?.id).toBe("child-outing");
  expect(select({preferences:{...prefs,typicalChildrenAttendance:"ask"}})?.id).toBe("family-outing");
  expect(select({preferences:{...prefs,typicalChildrenAttendance:"no"}})?.id).toBe("family-outing");
  expect(select({members:[parent]})?.id).toBe("family-outing");
 });
 it("respects notification and lifestyle choices without altering data",()=>{
  expect(select({preferences:{...prefs,notificationFrequency:"off"}})).toBeNull();
  expect(select({preferences:{...prefs,lifestyle:false}})).toBeNull();
  expect(select({preferences:{...prefs,notificationFrequency:"important"}})).toBeNull();
  expect(select({preferencesConfirmed:false})).toBeNull();
 });
 it("flags dangerous cash assumptions without confirming a booking or transaction",()=>{
  const m={...money(),cashOnHand:50,cashReserve:100,
   cashUpdatedAt:"2026-10-15",noBillsConfirmedMonth:"2026-10"};
  const r=select({money:m,plans:[plan("a",50)]});
  expect(r?.id).toBe("plan-cash-review");
  expect(m.cashOnHand).toBe(50);
 });
 it("does not apply unverified sample income to a shortfall decision",()=>{
  const r=select({money:sampleMoney(),plans:[plan("a",100)]});
  expect(r?.id).toBe("plan-coming-up");
  expect(r?.detailEn).not.toContain("affordable");
 });
});
