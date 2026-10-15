import {describe,expect,it} from "vitest";
import {
 formatJodFils,initialMerchantPaymentRecord,parseJodFils,
 quoteMerchantCommission,selectCommissionAgreement,splitCommission,
 type CommissionAgreement
} from "./merchantPaymentPolicy";

const rules:CommissionAgreement[]=[
 {id:"restaurant-standard",category:"restaurants",rateBasisPoints:500,validFrom:"2026-01-01"},
 {id:"gift-standard",category:"gifts",rateBasisPoints:450,validFrom:"2026-01-01"},
 {id:"merchant-22",merchantId:"merchant-22",rateBasisPoints:300,validFrom:"2026-01-01"},
 {id:"merchant-22-gift",merchantId:"merchant-22",category:"gifts",rateBasisPoints:250,validFrom:"2026-01-01"}
];
const sampleInput={merchantId:"merchant-22",category:"restaurants",offerRequestReference:"offer-123",grossFils:500000,date:"2026-10-15"};
describe("noncustodial merchant commission policy",()=>{
 it("applies JOD's three decimal minor units exactly",()=>{
  expect(parseJodFils("500")).toBe(500000);
  expect(parseJodFils("500.000")).toBe(500000);
  expect(parseJodFils("0.001")).toBe(1);
  expect(formatJodFils(500000)).toBe("500.000");
  expect(formatJodFils(15000)).toBe("15.000");
  expect(()=>parseJodFils("1.2345")).toThrow();
  expect(()=>parseJodFils("-1")).toThrow();
  expect(()=>parseJodFils("Infinity")).toThrow();
 });
 it("splits JOD 500 at 3% into Dabberna JOD 15 and merchant JOD 485",()=>{
  const quote=quoteMerchantCommission(sampleInput,rules);
  expect(quote).toMatchObject({
   agreementId:"merchant-22",currency:"JOD",commissionBasisPoints:300,
   grossFils:500000,dabbernaCommissionFils:15000,merchantEntitlementFils:485000,
   merchantId:"merchant-22",offerRequestReference:"offer-123"
  });
  expect(quote.grossFils).toBe(quote.dabbernaCommissionFils+quote.merchantEntitlementFils);
 });
 it("rounds commission exactly to the nearest fils, without floating point drift",()=>{
  expect(splitCommission(19999,300)).toEqual({dabbernaCommissionFils:600,merchantEntitlementFils:19399});
  expect(splitCommission(1,300)).toEqual({dabbernaCommissionFils:0,merchantEntitlementFils:1});
  expect(splitCommission(1,5000)).toEqual({dabbernaCommissionFils:1,merchantEntitlementFils:0});
  expect(splitCommission(500000,0)).toEqual({dabbernaCommissionFils:0,merchantEntitlementFils:500000});
  expect(()=>splitCommission(500000,10001)).toThrow();
  expect(()=>splitCommission(Number.NaN,300)).toThrow();
 });
 it("uses merchant+category, merchant-wide, category-wide precedence",()=>{
  expect(selectCommissionAgreement(rules,"merchant-22","gifts","2026-10-15").id).toBe("merchant-22-gift");
  expect(selectCommissionAgreement(rules,"merchant-22","restaurants","2026-10-15").id).toBe("merchant-22");
  expect(selectCommissionAgreement(rules,"another","gifts","2026-10-15").id).toBe("gift-standard");
  expect(quoteMerchantCommission({...sampleInput,merchantId:"another"},rules).commissionBasisPoints).toBe(500);
 });
 it("fails closed on absent, overlapping, expired or invalid rules",()=>{
  expect(()=>selectCommissionAgreement(rules,"new","home","2026-10-15")).toThrow(/No valid/);
  expect(()=>selectCommissionAgreement([...rules,{...rules[2]!,id:"duplicate"}],"merchant-22","restaurants","2026-10-15")).toThrow(/Overlapping/);
  expect(()=>selectCommissionAgreement(rules,"merchant-22","gifts","2026-13-01")).toThrow(/Invalid/);
  expect(()=>selectCommissionAgreement([...rules,{id:"bad",category:"home",rateBasisPoints:-1,validFrom:"2026-10-15"}],"merchant-22","gifts","2026-10-15")).toThrow(/Invalid/);
  const future=[{id:"future",merchantId:"m",rateBasisPoints:100,validFrom:"2027-01-01"}];
  expect(()=>selectCommissionAgreement(future,"m","gifts","2026-10-15")).toThrow(/No valid/);
 });
 it("preserves the original rate and agreement even if rate cards are later changed",()=>{
  const quote=quoteMerchantCommission(sampleInput,rules);
  rules[2]!.rateBasisPoints=600;
  expect(quote.commissionBasisPoints).toBe(300);
  expect(quote.dabbernaCommissionFils).toBe(15000);
  rules[2]!.rateBasisPoints=300;
 });
 it("creates only a pending server-side record; payment and commission settlement are not presumed complete",()=>{
  const quote=quoteMerchantCommission(sampleInput,rules);
  const record=initialMerchantPaymentRecord({
    quote,internalTransactionReference:"dabberna-tx-1",
    providerId:"licensed-provider",providerMerchantAccountReference:"merchant-provider-account-1",
    createdAt:"2026-10-15T12:00:00Z"
  });
  expect(record).toMatchObject({
   paymentStatus:"awaiting_payment",commissionSettlementStatus:"not_due",
   refundCancellationStatus:"none",providerTransactionReference:null,
   refundedFils:0,commissionSettledFils:0,commissionReversedFils:0,
   agreementId:"merchant-22",dabbernaCommissionFils:15000,merchantEntitlementFils:485000
  });
  expect(record).not.toHaveProperty("cardNumber");
  expect(record).not.toHaveProperty("customerBankAccount");
  const tampered={...quote,merchantEntitlementFils:490000};
  expect(()=>initialMerchantPaymentRecord({
   quote:tampered,internalTransactionReference:"tx",providerId:"provider",
   providerMerchantAccountReference:"merchant-account",createdAt:"2026-10-15"
  })).toThrow(/reconcile/);
 });
});
