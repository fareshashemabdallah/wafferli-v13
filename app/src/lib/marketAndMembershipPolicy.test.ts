import {describe,expect,it} from "vitest";
import {MARKETS,MARKET_PREVIEW,marketReadiness} from "./marketPolicy";
import {MEMBERSHIP_FEATURES,PLANS_STATE,isLivePilotFeature,plannedTierFeatures} from "./membershipPolicy";
describe("non-billing market and Plus foundations",()=>{
 it("never treats previewed foreign currency as an actual saved Money currency",()=>{
  expect(MARKETS.map(m=>m.code)).toEqual(["JO","LB","AE","OM"]);
  expect(MARKET_PREVIEW.JO.currency).toBe("JOD");
  expect(marketReadiness("JO").allowedForLiveFinance).toBe(true);
  for(const code of ["LB","AE","OM"] as const){
   expect(marketReadiness(code).allowedForLiveFinance).toBe(false);
   expect(marketReadiness(code).notice).toContain("NOT enabled for Money");
  }
 });
 it("keeps all country launches and regulated payments disabled",()=>{
  for(const m of MARKETS){
   expect(m.legalLaunchReady).toBe(false);
   expect(m.consumerBillingEnabled).toBe(false);
   expect(m.merchantSettlementEnabled).toBe(false);
  }
  expect(PLANS_STATE.checkoutEnabled).toBe(false);
  expect(PLANS_STATE.paidSubscriptionEnabled).toBe(false);
  expect(PLANS_STATE.serverVerifiedEntitlements).toBe(false);
  expect(PLANS_STATE.priceJod).toBeNull();
 });
 it("does not permit a planned paid feature via an unverified client flag",()=>{
  expect(isLivePilotFeature("familyMoney")).toBe(true);
  expect(isLivePilotFeature("encryptedBackup")).toBe(true);
  expect(isLivePilotFeature("crossDeviceSync")).toBe(false);
  expect(isLivePilotFeature("liveConcierge")).toBe(false);
  expect(plannedTierFeatures("plus").length).toBeGreaterThan(plannedTierFeatures("free").length);
  expect(MEMBERSHIP_FEATURES.filter(f=>f.status==="backend-gated")
   .every(f=>f.plusPlanned)).toBe(true);
 });
});
