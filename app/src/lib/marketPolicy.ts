/** Future country configuration registry only. NO FX conversions occur, and
 * the shipped family Money ledger remains JOD-only by design.
 */
export type TargetMarket="JO"|"LB"|"AE"|"OM";
export type MarketDefinition={
 code:TargetMarket;en:string;ar:string;currency:"JOD"|"LBP"|"AED"|"OMR";
 weekendDays:readonly number[];
 financeEnabled:boolean;consumerBillingEnabled:boolean;
 merchantSettlementEnabled:boolean;
 legalLaunchReady:boolean;
};
export const MARKET_PREVIEW:Readonly<Record<TargetMarket,MarketDefinition>>={
 JO:{code:"JO",en:"Jordan",ar:"الأردن",currency:"JOD",weekendDays:[5,6],
  financeEnabled:true,consumerBillingEnabled:false,merchantSettlementEnabled:false,legalLaunchReady:false},
 LB:{code:"LB",en:"Lebanon",ar:"لبنان",currency:"LBP",weekendDays:[6,0],
  financeEnabled:false,consumerBillingEnabled:false,merchantSettlementEnabled:false,legalLaunchReady:false},
 AE:{code:"AE",en:"United Arab Emirates",ar:"الإمارات العربية المتحدة",currency:"AED",weekendDays:[6,0],
  financeEnabled:false,consumerBillingEnabled:false,merchantSettlementEnabled:false,legalLaunchReady:false},
 OM:{code:"OM",en:"Oman",ar:"سلطنة عُمان",currency:"OMR",weekendDays:[5,6],
  financeEnabled:false,consumerBillingEnabled:false,merchantSettlementEnabled:false,legalLaunchReady:false}
};
export const MARKETS=Object.values(MARKET_PREVIEW);
export function marketReadiness(code:TargetMarket):{
 allowedForLiveFinance:boolean;needs:readonly string[];notice:string
}{
 const market=MARKET_PREVIEW[code];
 return {
  allowedForLiveFinance:market.financeEnabled,
  needs:[
   ...(!market.financeEnabled?["A separate, versioned financial ledger and currency handling"]:[]),
   ...(!market.legalLaunchReady?["Country-specific legal, privacy and tax review"]:[]),
   ...(!market.consumerBillingEnabled?["Licensed consumer billing and refunds"]:[]),
   ...(!market.merchantSettlementEnabled?["Merchant contract and regulated PSP commission settlement"]:[])
  ],
  notice:market.financeEnabled?
   "Current pilot Money records remain denominated only in JOD; no FX conversion or bank sync.":
   "This market is NOT enabled for Money. Do not reinterpret or convert saved JOD balances."
 };
}
