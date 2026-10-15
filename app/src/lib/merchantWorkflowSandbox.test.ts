import {describe,expect,it} from "vitest";
import {createSandboxMerchant,submitSandboxMerchant,reviewSandboxMerchant,
 createSandboxOffer,advanceSandboxOffer,sandboxOfferSummary} from "./merchantWorkflowSandbox";
const now=new Date(2026,9,15,12);
const registered=()=>reviewSandboxMerchant(submitSandboxMerchant(
 createSandboxMerchant("merchant-test","Fictional Merchant"),"merchant"
),"reviewer",true);
const offer=()=>createSandboxOffer({id:"offer-one",merchant:registered(),title:"Sample school kits",
 totalJod:"25.125",expiresOn:"2026-10-20"},now);
describe("development-only merchant approval simulation",()=>{
 it("requires fictional reviewer to approve a submitted merchant and blocks merchant self-approval",()=>{
  const draft=createSandboxMerchant("m1","Fictional Shop");
  const submitted=submitSandboxMerchant(draft,"merchant");
  expect(submitted.status).toBe("pending-review");
  expect(()=>reviewSandboxMerchant(submitted,"merchant",true)).toThrow(/reviewer/i);
  const approved=reviewSandboxMerchant(submitted,"reviewer",true);
  expect(approved.status).toBe("demo-approved");
  expect(draft.status).toBe("draft");
 });
 it("accepts only approved fictional merchants before an offer can be drafted",()=>{
  const merchant=createSandboxMerchant("m1","Fictional Shop");
  expect(()=>createSandboxOffer({id:"o",merchant,title:"Mock offer",
   totalJod:"12.250",expiresOn:"2026-10-20"},now)).toThrow();
  expect(()=>createSandboxOffer({id:"o",merchant:registered(),title:"Mock offer",
   totalJod:"12.1234",expiresOn:"2026-10-20"},now)).toThrow();
  expect(()=>createSandboxOffer({id:"o",merchant:registered(),title:"Mock offer",
   totalJod:"12.250",expiresOn:"2026-02-31"},now)).toThrow();
 });
 it("separates hypothetical merchant submit and demo-review approval stages",()=>{
  const draft=offer();
  expect(draft.totalFils).toBe(25125);
  const submitted=advanceSandboxOffer(draft,"merchant","submit",now);
  expect(submitted.status).toBe("submitted");
  expect(()=>advanceSandboxOffer(submitted,"merchant","approve",now)).toThrow(/reviewer/i);
  expect(()=>advanceSandboxOffer(draft,"reviewer","approve",now)).toThrow(/submitted/i);
  const approved=advanceSandboxOffer(submitted,"reviewer","approve",now);
  expect(approved.status).toBe("demo-approved");
  expect(sandboxOfferSummary(approved,now).displayTotal).toBe("25.125 JOD");
  expect(approved).not.toHaveProperty("paymentStatus");
  expect(approved).not.toHaveProperty("realMerchantVerified");
 });
 it("handles reviewer changes, expired offers and rejection without external side effects",()=>{
  const submitted=advanceSandboxOffer(offer(),"merchant","submit",now);
  const returned=advanceSandboxOffer(submitted,"reviewer","request-changes",now);
  expect(returned.status).toBe("needs-changes");
  const resubmitted=advanceSandboxOffer(returned,"merchant","submit",now);
  expect(advanceSandboxOffer(resubmitted,"reviewer","reject",now).status).toBe("demo-rejected");
  const expiredDate=new Date(2026,9,25,12);
  expect(()=>advanceSandboxOffer(offer(),"merchant","submit",expiredDate)).toThrow(/expired/i);
  expect(sandboxOfferSummary(offer(),expiredDate).isExpired).toBe(true);
 });
});
