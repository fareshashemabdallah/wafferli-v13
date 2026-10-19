import type {Member,MoneyState} from "./money";

export const FAMILY_SETUP_PREFERENCES_KEY="familySetupPreferencesConfirmed";
export const FAMILY_SETUP_PROFILE_SKIP_KEY="familySetupProfileSkipped";
export const FAMILY_SETUP_MONEY_SKIP_KEY="familySetupMoneySkipped";

/** Samples are instructional data, not household profiles. Never infer children
 * or household preferences from these three example records. */
const sampleNames:Record<string,string>={
 m1:"Me (sample)",m2:"Partner (sample)",m3:"Child (sample)"
};
export const isSampleFamilyMember=(member:Member):boolean=>
 sampleNames[member.id]===member.name;
export const realFamilyMembers=(members:readonly Member[]):Member[]=>
 members.filter(member=>!isSampleFamilyMember(member));

export type FamilySetupState={
 steps:Array<{id:"family"|"money";complete:boolean;optional:boolean}>;
 completed:number;
 total:number;
 next:"family"|"money"|null;
 hasRealFamily:boolean;
 sampleProfiles:number;
};
/** Reads existing local modules without altering money, relatives or plans. */
export function familySetupState(
 members:readonly Member[],money:MoneyState,
 _preferencesConfirmed:boolean,profileSkipped=false,moneySkipped=false
):FamilySetupState {
 const actual=realFamilyMembers(members);
 const family=actual.length>0||profileSkipped;
 // A single genuine saved fact counts as having started; incomplete information
 // remains incomplete in financial guidance and does not trigger repeated setup.
 const moneyDone=!money.demo&&(money.incomeKnown===true||money.categories.length>0||
  money.expenses.length>0||(money.commitments?.length??0)>0||
  typeof money.cashOnHand==="number"||(money.incomeSources?.length??0)>0);
 const steps=[
  {id:"family" as const,complete:family,optional:true},
  {id:"money" as const,complete:moneyDone||moneySkipped,optional:true}
 ];
 const next=steps.find(step=>!step.complete)?.id??null;
 return {
  steps,completed:steps.filter(s=>s.complete).length,total:steps.length,next,
  hasRealFamily:actual.length>0,
  sampleProfiles:members.filter(isSampleFamilyMember).length
 };
}
