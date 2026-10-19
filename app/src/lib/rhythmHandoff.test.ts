import {beforeEach,afterEach,describe,expect,it} from "vitest";
import {CALENDAR_FOCUS_SESSION_KEY,rememberCalendarDate,takeCalendarDate,focusSavedPlan} from "./rhythmHandoff";
import {attachVenueToOuting} from "./familyPlanContinuity";
import {makeFamilyPlan} from "./familyPlans";
import {buildFamilyMoneyJourney} from "./familyMoneyJourney";
import {defaultFamilyPreferences} from "./familyPreferences";
import {sampleMembers,sampleMoney} from "./money";
const now=new Date(2026,9,19,12);
beforeEach(()=>sessionStorage.clear());
afterEach(()=>sessionStorage.clear());
describe("one meaningful click, one existing family record",()=>{
 it("opens the chosen calendar day exactly once, rejecting invalid or fabricated dates",()=>{
  expect(rememberCalendarDate("2026-10-25")).toBe(true);
  expect(sessionStorage.getItem(CALENDAR_FOCUS_SESSION_KEY)).toBe("2026-10-25");
  expect(takeCalendarDate()).toBe("2026-10-25");
  expect(takeCalendarDate()).toBeUndefined();
  expect(rememberCalendarDate("2026-02-30")).toBe(false);
  expect(rememberCalendarDate("banana")).toBe(false);
  expect(sessionStorage.getItem(CALENDAR_FOCUS_SESSION_KEY)).toBeNull();
 });
 it("focuses only saved canonical plan identifiers",()=>{
  const selected:string[]=[];
  expect(focusSavedPlan("p1",["p1","p2"],id=>{selected.push(id);return true;})).toBe(true);
  expect(focusSavedPlan("not-there",["p1","p2"],id=>{selected.push(id);return true;})).toBe(false);
  expect(selected).toEqual(["p1"]);
 });
 it("updates a chosen mapped venue inside an existing outing without duplicating a plan or losing an occasion link",()=>{
  const occasion=makeFamilyPlan({id:"existing",title:"Grandma birthday outing",kind:"outing",date:"2026-11-03",budgetJod:45,
   sourceRef:"occasion:birthday-event@2026"},now)!;
  const venue=makeFamilyPlan({id:"temporary",title:"Children's Museum",kind:"outing",budgetJod:20,
   sourceRef:"https://www.openstreetmap.org/node/12345"},now)!;
  const modified=attachVenueToOuting(occasion,venue,now);
  expect(modified).toMatchObject({id:"existing",title:"Grandma birthday outing",date:"2026-11-03",
   budgetJod:20,status:"planning",sourceRef:"occasion:birthday-event@2026",
   choice:{label:"Children's Museum",source:"outing",verified:false,estimatedJod:20}});
  expect(modified?.note).toContain("https://www.openstreetmap.org/node/12345");
  expect(modified).not.toHaveProperty("expenseId");
  expect(attachVenueToOuting({...occasion,status:"completed"},venue,now)).toBeNull();
  expect(attachVenueToOuting({...occasion,kind:"purchase"},venue,now)).toBeNull();
  expect(attachVenueToOuting(occasion,{...venue,sourceRef:"https://untrusted.invalid/fake"},now)).toBeNull();
 });
 it("keeps the original date and budget if a newly selected venue lacks those details",()=>{
  const existing=makeFamilyPlan({id:"existing",title:"Friday",kind:"outing",date:"2026-10-23",budgetJod:65,
   note:"Prepare snacks"},now)!;
  const venue=makeFamilyPlan({id:"new",title:"Park",kind:"outing",sourceRef:"https://www.openstreetmap.org/way/40"},now)!;
  const merged=attachVenueToOuting(existing,venue,now)!;
  expect(merged.date).toBe(existing.date);
  expect(merged.budgetJod).toBe(existing.budgetJod);
  expect(merged.note).toContain("Prepare snacks");
  expect(merged.choice?.estimatedJod).toBeUndefined();
 });
 it("the journey carries exact plan focus to Plans and date focus to Calendar",()=>{
  const plan=makeFamilyPlan({id:"outing-88",title:"Family park",date:"2026-10-22",kind:"outing"},now)!;
  const before=buildFamilyMoneyJourney({money:sampleMoney(),members:sampleMembers(),moments:[],
   plans:[plan],preferences:{...defaultFamilyPreferences,lifestyle:true},now});
  expect(before.next).toMatchObject({route:"/plans",planId:"outing-88"});
  expect(before.nextMilestones[0]).toMatchObject({kind:"plan",planId:"outing-88"});
  const after=buildFamilyMoneyJourney({money:sampleMoney(),members:sampleMembers(),plans:[],
   moments:[{id:"event",title:"School play",date:"2026-10-22",kind:"school",annual:false}],
   preferences:{...defaultFamilyPreferences,lifestyle:true},now});
  expect(after.next).toMatchObject({route:"/calendar",focusDate:"2026-10-22"});
 });
});
