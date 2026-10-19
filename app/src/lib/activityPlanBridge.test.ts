import {describe,it,expect} from "vitest";
import {ACTIVITY_THEMES} from "./familyActivityDiscovery";
import {familyThemeMatches,plannedOutingMoments,planFromDiscoveredPlace} from "./activityPlanBridge";
import type {Member} from "./money";
import {makeFamilyPlan} from "./familyPlans";

const member=(id:string,ageYears:number):Member=>({id,name:"Child "+id,role:"child",ageGroup:"",prefs:"",ageYears});
describe("discovery-first family planning",()=>{
 it("considers all siblings, even if two have identical ages, and ignores demo members",()=>{
  const children=[member("a",2),member("b",8),member("c",14),member("d",8),
   {id:"m3",name:"Child (sample)",role:"child" as const,ageGroup:"6–12",prefs:"",ageYears:18}];
  const matches=familyThemeMatches(ACTIVITY_THEMES,children);
  expect(matches.find(x=>x.theme.id==="parks")).toMatchObject({fit:"all",matches:4,total:4});
  expect(matches.find(x=>x.theme.id==="swim")).toMatchObject({fit:"some",matches:3,total:4});
  expect(matches.find(x=>x.theme.id==="toddler")).toMatchObject({fit:"some",matches:1,total:4});
  expect(matches[0]?.fit).toBe("all");
 });
 it("lets a family browse without profiles or financial information",()=>{
  expect(familyThemeMatches(ACTIVITY_THEMES,[]).every(x=>x.fit==="unknown")).toBe(true);
 });
 it("saves a validated tentative plan, never a bill, booking or paid expense",()=>{
  const plan=planFromDiscoveredPlace({name:"Children's Museum",sourceUrl:"https://www.openstreetmap.org/node/12",date:"2026-10-23",estimatedTotalJod:22},"my-id",new Date("2026-10-19T12:00:00Z"));
  expect(plan).toMatchObject({kind:"outing",status:"planning",date:"2026-10-23",budgetJod:22});
  expect(plan).not.toHaveProperty("expenseId");
  expect(plan).not.toHaveProperty("actualJod");
  expect(plan).not.toHaveProperty("commitments");
  expect(planFromDiscoveredPlace({name:"x",sourceUrl:"https://unsafe.example.org/12"},"id")).toBeNull();
  expect(planFromDiscoveredPlace({name:"x",sourceUrl:"https://www.openstreetmap.org/way/12",date:"2026-02-30"},"id")).toBeNull();
  expect(planFromDiscoveredPlace({name:"x",sourceUrl:"https://www.openstreetmap.org/way/12",estimatedTotalJod:-1},"id")).toBeNull();
 });
 it("derives one read-only calendar item from the source plan and honors edits/removal",()=>{
  const plan=makeFamilyPlan({id:"p1",title:"Family park",kind:"outing",date:"2026-10-23",budgetJod:0,sourceRef:"https://www.openstreetmap.org/node/10"});
  expect(plan).not.toBeNull();
  const first=plannedOutingMoments([plan!]);
  expect(first).toMatchObject([{id:"outing-plan:p1",title:"Family park",date:"2026-10-23",kind:"activity",annual:false}]);
  expect(plannedOutingMoments([{...plan!,date:"2026-10-25"}])[0]?.date).toBe("2026-10-25");
  expect(plannedOutingMoments([])).toEqual([]);
  expect(plannedOutingMoments([plan!],[{id:"existing",title:"Family park",date:"2026-10-23",kind:"activity",annual:false}])).toEqual([]);
  expect(plannedOutingMoments([{...plan!,status:"completed"}])).toEqual([]);
 });
});
