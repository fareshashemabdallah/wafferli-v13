import {describe,expect,it} from "vitest";
import {createParentPlace,createParentReview,parentReviewExternalSearch,reportedReviewCount,sameParentPlace,upsertParentReview} from "./parentsSay";

const now="2026-10-26T12:00:00.000Z";
const input={age:"3-5" as const,experience:"mixed" as const,safety:"concerns" as const,convenience:"somewhat" as const,
 wouldReturn:"maybe" as const,comment:"The teacher was patient but beginner sessions were crowded.",
 providerSummaryOptIn:false,parentQuestionsOptIn:false};

describe("What Parents Say private pilot integrity",()=>{
 it("adds one canonical local place and recognizes duplicates",()=>{
  const first=createParentPlace({name:"  Little   Swimmers ",area:"Amman",category:"activities"},"p1",now)!;
  const duplicate=createParentPlace({name:"little swimmers",area:"AMMAN",category:"activities"},"p2",now)!;
  expect(first.name).toBe("Little Swimmers");
  expect(sameParentPlace(first,duplicate)).toBe(true);
  expect(sameParentPlace(first,{...duplicate,category:"products"})).toBe(false);
 });
 it("rejects empty/overlong places and reviews too short to be useful",()=>{
  expect(createParentPlace({name:"a",area:"Amman",category:"activities"},"p",now)).toBeNull();
  expect(createParentReview({...input,comment:"nice"},"p","r",now)).toBeNull();
  expect(createParentReview({...input,comment:"x".repeat(1501)},"p","r",now)).toBeNull();
 });
 it("keeps safety observations distinct from verification and public posts",()=>{
  const result=createParentReview(input,"place1","review1",now)!;
  expect(result).toMatchObject({placeId:"place1",age:"3-5",safety:"concerns",providerSummaryOptIn:false,parentQuestionsOptIn:false});
  expect(result).not.toHaveProperty("verified");
  expect(result).not.toHaveProperty("published");
 });
 it("edits the same review without fabricating additional parents",()=>{
  const one=createParentReview(input,"p","one",now)!;
  const next=createParentReview({...input,experience:"positive",providerSummaryOptIn:true},"p","other","2026-10-27T10:00:00.000Z",one)!;
  const all=upsertParentReview([one],next);
  expect(all).toHaveLength(1);
  expect(all[0]).toMatchObject({id:"one",createdAt:now,experience:"positive",providerSummaryOptIn:true});
  expect(reportedReviewCount(all,"p")).toBe(1);
 });
 it("constructs outbound public searches safely, not fake review summaries",()=>{
  const link=parentReviewExternalSearch("The Place & Co","Amman","maps");
  expect(link).toStartWith("https://www.google.com/maps/search/");
  expect(link).toContain("The%20Place%20%26%20Co");
  expect(parentReviewExternalSearch("Club","Amman","web")).toContain("www.google.com/search");
 });
});
