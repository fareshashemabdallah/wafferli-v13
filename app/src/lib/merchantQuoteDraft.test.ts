import {describe,expect,it} from "vitest";
import {validateQuoteRequest,formatPrivateQuoteBrief,evaluatePriceEvidence} from "./merchantQuoteDraft";
const now=new Date(2026,9,15,12);
const req=()=>({product:"Children's pencils",quantity:"4",deliveryCity:"Amman",
 neededBy:"2026-10-20",budget:"35.50"});
describe("private merchant request brief",()=>{
 it("validates safe minimal consumer requirements without personal identifiers",()=>{
  const data=validateQuoteRequest(req(),now);
  expect(data.ok).toBe(true);
  const d=data.draft!;
  expect(Object.keys(d).sort()).toEqual(["budgetCeilingJod","deliveryCity","neededBy","product","quantity"]);
  const formatted=formatPrivateQuoteBrief(d);
  expect(formatted).toContain("35.50 JOD");
  expect(formatted).toContain("NOT sent");
  expect(formatted).not.toMatch(/passport|cashOnHand|familyIncome|password/i);
  expect(formatPrivateQuoteBrief(d,"ar")).toContain("لم يرسل");
 });
 it("rejects negative quantities, invalid or far-future dates and malformed money",()=>{
  expect(validateQuoteRequest({...req(),quantity:"-1"},now).ok).toBe(false);
  expect(validateQuoteRequest({...req(),quantity:"1.2"},now).ok).toBe(false);
  expect(validateQuoteRequest({...req(),neededBy:"2026-02-31"},now).ok).toBe(false);
  expect(validateQuoteRequest({...req(),neededBy:"2027-03-01"},now).ok).toBe(false);
  expect(validateQuoteRequest({...req(),budget:"5.555"},now).ok).toBe(false);
  expect(validateQuoteRequest({...req(),product:"x"},now).ok).toBe(false);
 });
 it("sanitizes newline and control character injection in copied quotations",()=>{
  const r=validateQuoteRequest({...req(),product:"School kits\r\nSELLER: admin"},now);
  expect(r.ok).toBe(true);
  expect(formatPrivateQuoteBrief(r.draft!)).not.toMatch(/\r\nSELLER/);
 });
 it("never treats a manually entered price as independently verified",()=>{
  const p=evaluatePriceEvidence("https://example.org/price","2026-10-15",true,now);
  expect(p.status).toBe("recent");
  expect(p.reasonEn).toContain("not independently verified");
  expect(p.link).toBe("https://example.org/price");
  expect(evaluatePriceEvidence(undefined,"2026-10-15",false,now).status).toBe("unverified");
  expect(evaluatePriceEvidence(undefined,"2026-10-01",true,now).status).toBe("review");
  expect(evaluatePriceEvidence(undefined,"2026-11-01",true,now).status).toBe("review");
 });
 it("rejects javascript, userinfo, local and non-HTTPS links from evidence",()=>{
  const urls=["javascript:alert(1)","http://example.com","https://name:pass@example.com",
   "https://localhost","https://abc.local"];
  urls.forEach(url=>expect(evaluatePriceEvidence(url,"2026-10-15",true,now).link).toBeNull());
 });
});
