import {describe,expect,it} from "vitest";
import {activeJourney,externalMapLink,startDecisionJourney} from "./decisionJourney";
import type {MomentOccurrence} from "./familyCalendar";
const e:MomentOccurrence={id:"member-birthday:1",title:"Child's Birthday",date:"2019-11-04",occursOn:"2026-11-04",kind:"birthday",annual:true};
describe("contextual journey",()=>{
 it("passes a voluntary spending ceiling without treating it as a price",()=>{
  const v=startDecisionJourney(e,{budgetJod:85},"outing",new Date("2026-10-14T12:00:00Z"));
  expect(v.comfortableLimitJod).toBe(85);
  expect(activeJourney(v,new Date("2026-10-14T13:00:00Z"))?.goal).toBe("outing");
 });
 it("expires stale or malformed context",()=>{
  const v=startDecisionJourney(e,{budgetJod:null},"gift",new Date("2026-09-01T12:00:00Z"));
  expect(activeJourney(v,new Date("2026-10-14T13:00:00Z"))).toBeNull();
  expect(activeJourney({occasionTitle:"test"},new Date("2026-10-14T13:00:00Z"))).toBeNull();
 });
 it("generates only neutral category search terms, never a birthday or budget",()=>{
  const url=externalMapLink("outing","Amman");
  expect(url).toContain("Google").toBe(false);
  expect(decodeURIComponent(url)).toContain("family activities and experiences Amman Jordan");
  expect(url).not.toContain("Birthday");
  expect(url).not.toContain("85");
 });
});
