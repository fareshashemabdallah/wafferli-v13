import {emptyRealMoney} from "./moneyOverview";
import type {Category,Member,MoneyState} from "./money";
import {realFamilyMembers} from "./familySetup";
import type {HouseholdPresence} from "./householdPresence";

/** Facts are independent. Missing values remain unknown; they are never set to
 * zero just to satisfy a form. Values are estimates until a parent confirms.
 */
export type ProgressiveMoneyFacts={
 income?:number;incomeConfidence?:"estimate"|"confirmed";
 zeroIncomeConfirmed?:boolean;essential?:number;other?:number;savings?:number;
};
const money=(v:unknown):v is number=>typeof v==="number"&&Number.isFinite(v)&&v>=0&&v<=100000;
const rounded=(v:number)=>Math.round(v*100)/100;
export function canSaveProgressiveFacts(before:MoneyState,input:ProgressiveMoneyFacts):boolean{
 const keys=["income","essential","other","savings"] as const;
 if(!keys.some(key=>input[key]!==undefined))return false;
 if(keys.some(key=>input[key]!==undefined&&!money(input[key])))return false;
 if(input.income===0&&!input.zeroIncomeConfirmed)return false;
 if(input.income!==undefined&&!before.demo&&(
  (before.incomeSources?.length??0)>0 || before.incomeKnown===true || before.income>0
 ))return false;
 if((input.essential!==undefined||input.other!==undefined)&&!before.demo&&before.categories.some(
  c=>c.id!=="household-essential"&&c.id!=="household-flexible"))return false;
 return true;
}
export function applyProgressiveMoneyFacts(before:MoneyState,input:ProgressiveMoneyFacts):MoneyState{
 if(!canSaveProgressiveFacts(before,input))return before;
 const base=before.demo?emptyRealMoney():before;
 const categories:Category[]=base.categories.slice();
 const upsert=(id:string,name:string,type:Category["type"],priority:Category["priority"],v:number)=>{
  const original=categories.find(c=>c.id===id);
  const next:Category=original?{...original,planned:rounded(v),amountConfidence:"estimate"}:
   {id,name,type,...(priority?{priority}:{}),planned:rounded(v),amountConfidence:"estimate"};
  const idx=categories.findIndex(c=>c.id===id);
  if(idx<0)categories.push(next);else categories[idx]=next;
 };
 if(input.essential!==undefined)upsert("household-essential","Essential household costs (estimate)","fixed","essential",input.essential);
 if(input.other!==undefined)upsert("household-flexible","Other household spending (estimate)","variable","flexible",input.other);
 const result:MoneyState={...base,demo:false,categories,financialInputsPartial:true,
  ...(input.income!==undefined?{income:rounded(input.income),incomeKnown:true,
   incomeConfidence:input.incomeConfidence??"estimate"}:{}),
  ...(input.savings!==undefined?{savingsTargetAmount:rounded(input.savings)}:{})
 };
 // Legacy monthly income must be visible to the cashflow forecast when no
 // dated income sources exist. An empty incomeSources array would hide it.
 if(!result.incomeSources?.length)delete result.incomeSources;
 return result;
}
/** Named family profiles are canonical. Anonymous counts are the privacy-first
 * alternative, never a second tally to sum with family members.
 */
export function householdCountSource(members:readonly Member[],presence:HouseholdPresence):
 {source:"profiles"|"anonymous"|"unknown";adults:number|null;children:number|null}{
 const real=realFamilyMembers(members);
 if(presence.adults!==null||presence.children!==null)
  return {source:"anonymous",adults:presence.adults,children:presence.children};
 if(real.length)return {source:"profiles",adults:real.filter(x=>x.role==="adult").length,
  children:real.filter(x=>x.role==="child").length};
 return {source:"unknown",adults:null,children:null};
}
/** Use a known specific age preferentially, or a legacy age band, not both. */
export function familyAgeLabel(member:Member):string|null{
 if(typeof member.ageYears==="number"&&Number.isInteger(member.ageYears)&&member.ageYears>=0&&member.ageYears<=120)
  return String(member.ageYears);
 return member.ageGroup.trim()||null;
}
