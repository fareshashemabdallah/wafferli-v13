/** Pricing and entitlements are commercial design proposals only.
 * NO customer payment, paid access claim or live subscription is implemented.
 * A browser-local flag or UI-selected plan must NEVER authorize premium data.
 */
export type MemberTier="free"|"plus";
export type FeatureCode="familyMoney"|"localPlans"|"encryptedBackup"|
 "familyAdvisor"|"liveConcierge"|"crossDeviceSync"|"advancedShopping"|"premiumMerchantDeals";
export type FeaturePromise={
 id:FeatureCode;en:string;ar:string;
 status:"available-pilot"|"proposal"|"backend-gated";
 free:boolean;plusPlanned:boolean;
};
export const MEMBERSHIP_FEATURES:readonly FeaturePromise[]=[
 {id:"familyMoney",en:"Local family budget and expenses",ar:"ميزانية ومصاريف محلية",
  status:"available-pilot",free:true,plusPlanned:true},
 {id:"localPlans",en:"Family plans, reminders and comparisons",ar:"خطط وتذكيرات ومقارنات عائلية",
  status:"available-pilot",free:true,plusPlanned:true},
 {id:"encryptedBackup",en:"Password-protected local backup",ar:"نسخة احتياطية محلية مشفرة",
  status:"available-pilot",free:true,plusPlanned:true},
 {id:"familyAdvisor",en:"Rule-based family guidance",ar:"نصائح عائلية مبنية على قواعد",
  status:"available-pilot",free:true,plusPlanned:true},
 {id:"liveConcierge",en:"Grounded AI family concierge",ar:"مساعد عائلي ذكي مرتبط بالمصادر",
  status:"backend-gated",free:false,plusPlanned:true},
 {id:"crossDeviceSync",en:"Consented multi-device household sync",ar:"مزامنة أسرية بإذن المستخدم",
  status:"backend-gated",free:false,plusPlanned:true},
 {id:"advancedShopping",en:"Connected retailer price comparison",ar:"مقارنات متصلة بأسعار المتاجر",
  status:"backend-gated",free:false,plusPlanned:true},
 {id:"premiumMerchantDeals",en:"Verified merchant offers",ar:"عروض تجار موثقة",
  status:"backend-gated",free:false,plusPlanned:true}
];
export type PlanState={
 checkoutEnabled:false;
 paidSubscriptionEnabled:false;
 priceJod:null;
 subscriptionProvider:null;
 serverVerifiedEntitlements:false;
};
export const PLANS_STATE:PlanState={
 checkoutEnabled:false,paidSubscriptionEnabled:false,priceJod:null,
 subscriptionProvider:null,serverVerifiedEntitlements:false
};
export function isLivePilotFeature(code:FeatureCode):boolean{
 return MEMBERSHIP_FEATURES.some(f=>f.id===code&&f.status==="available-pilot"&&f.free);
}
/** This is presentation metadata, never an authorization decision. */
export function plannedTierFeatures(tier:MemberTier):FeaturePromise[]{
 return MEMBERSHIP_FEATURES.filter(f=>tier==="free"?f.free:f.plusPlanned);
}
