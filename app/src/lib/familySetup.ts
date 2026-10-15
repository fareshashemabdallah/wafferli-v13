import {computeMoney,type Member,type MoneyState} from "./money";
import {needsStarterBudget} from "./starterBudget";

export const FAMILY_SETUP_PREFERENCES_KEY="familySetupPreferencesConfirmed";
export const FAMILY_SETUP_PROFILE_SKIP_KEY="familySetupProfileSkipped";

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
 steps:Array<{id:"family"|"money"|"preferences";complete:boolean;optional:boolean}>;
 completed:number;
 total:number;
 next:"family"|"money"|"preferences"|null;
 hasRealFamily:boolean;
 sampleProfiles:number;
};
/** Reads existing local modules without altering money, relatives or plans. */
export function familySetupState(
 members:readonly Member[],money:MoneyState,
 preferencesConfirmed:boolean,profileSkipped=false
):FamilySetupState {
 const actual=realFamilyMembers(members);
 const family=actual.length>0||profileSkipped;
 const c=computeMoney(money);
 const moneyDone=!needsStarterBudget(money)&&!money.demo&&c.monthlyIncome>0&&
  c.savingsTarget>=0;
 const steps=[
  {id:"family" as const,complete:family,optional:true},
  {id:"money" as const,complete:moneyDone,optional:false},
  {id:"preferences" as const,complete:preferencesConfirmed,optional:true}
 ];
 const next=steps.find(step=>!step.complete)?.id??null;
 return {
  steps,completed:steps.filter(s=>s.complete).length,total:steps.length,next,
  hasRealFamily:actual.length>0,
  sampleProfiles:members.filter(isSampleFamilyMember).length
 };
}
