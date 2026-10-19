import type {Member,MoneyState,Category} from "./money";
import {realFamilyMembers} from "./familySetup";

/** Optional device-local occupancy assumptions; NOT additional family profiles. */
export const HOUSEHOLD_PRESENCE_KEY="householdPresence";
export type HelperArrangement="live-in"|"daytime";
export type GuestPattern="one-off"|"monthly"|"permanent";
export type HouseholdHelper={
 id:string; label:string; arrangement:HelperArrangement; count:number;
 salaryMonthly:number; foodDaily:number; workDaysMonthly:number;
 utilitiesMonthly:number; suppliesMonthly:number;
};
export type HouseholdGuest={
 id:string; label:string; pattern:GuestPattern; count:number;
 startDate:string; endDate:string; daysMonthly:number;
 foodDaily:number; utilitiesDaily:number; otherDaily:number;
};
export type HouseholdPresence={
 /** null means use genuine family profiles. No example/demo people are counted. */
 adults:number|null; children:number|null;
 helpers:HouseholdHelper[]; guests:HouseholdGuest[];
};
export const emptyHouseholdPresence=():HouseholdPresence=>({
 adults:null,children:null,helpers:[],guests:[]
});
export const exampleHelper=():HouseholdHelper=>({
 id:"",label:"",arrangement:"live-in",count:1,salaryMonthly:300,
 foodDaily:2.85,workDaysMonthly:22,utilitiesMonthly:12,suppliesMonthly:13
});
export const exampleGuest=():HouseholdGuest=>({
 id:"",label:"",pattern:"one-off",count:2,startDate:"",endDate:"",
 daysMonthly:8,foodDaily:3,utilitiesDaily:0.5,otherDaily:0
});
const safe=(value:number,max=100000)=>Number.isFinite(value)?Math.min(max,Math.max(0,value)):0;
const round=(n:number)=>Math.round(n*100)/100;
const monthDays=(month:string):number=>{
 if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(month))return 0;
 const [y,m]=month.split("-").map(Number);
 return new Date(Date.UTC(y!,m!,0)).getUTCDate();
};
const dateValid=(v:string)=>/^\d{4}-\d{2}-\d{2}$/.test(v)&&
 !Number.isNaN(Date.parse(v))&&new Date(v+"T12:00:00Z").toISOString().startsWith(v);
export function guestDaysInMonth(guest:HouseholdGuest,month:string):number{
 const days=monthDays(month);
 if(!days)return 0;
 if(guest.pattern==="permanent")return days;
 if(guest.pattern==="monthly")return Math.min(days,Math.floor(safe(guest.daysMonthly,31)));
 if(!dateValid(guest.startDate)||!dateValid(guest.endDate)||guest.startDate>guest.endDate)return 0;
 const begin=month+"-01",end=month+"-"+String(days).padStart(2,"0");
 const first=guest.startDate>begin?guest.startDate:begin;
 const last=guest.endDate<end?guest.endDate:end;
 if(first>last)return 0;
 const start=Date.parse(first+"T00:00:00Z"),finish=Date.parse(last+"T00:00:00Z");
 return Math.round((finish-start)/86400000)+1;
}
export type PresenceEstimate={
 adults:number|null;children:number|null;permanentResidents:number|null;
 helperSalary:number;helperFood:number;helperUtilities:number;helperSupplies:number;
 guestFood:number;guestUtilities:number;guestOther:number;
 recurringGuests:number;temporaryGuests:number;total:number;
 helperCount:number;temporaryGuestDays:number;activeVisitors:number;
};
export function estimateHouseholdPresence(
 p:HouseholdPresence,members:readonly Member[],month:string
):PresenceEstimate{
 const genuine=realFamilyMembers(members);
 const anonymousCounts=p.adults!==null||p.children!==null;
 const adults=p.adults===null?(!anonymousCounts&&genuine.length?genuine.filter(m=>m.role==="adult").length:null):
  Math.floor(safe(p.adults,50));
 const children=p.children===null?(!anonymousCounts&&genuine.length?genuine.filter(m=>m.role==="child").length:null):
  Math.floor(safe(p.children,50));
 let helperSalary=0,helperFood=0,helperUtilities=0,helperSupplies=0;
 let liveIn=0,helperCount=0;
 for(const h of p.helpers??[]){
  const count=Math.floor(safe(h.count,20)),days=h.arrangement==="live-in"?monthDays(month):Math.min(monthDays(month),Math.floor(safe(h.workDaysMonthly,31)));
  helperCount+=count;
  if(h.arrangement==="live-in")liveIn+=count;
  helperSalary+=count*safe(h.salaryMonthly);
  helperFood+=count*days*safe(h.foodDaily,200);
  helperUtilities+=count*safe(h.utilitiesMonthly);
  helperSupplies+=count*safe(h.suppliesMonthly);
 }
 let guestFood=0,guestUtilities=0,guestOther=0,recurringGuests=0,temporaryGuests=0;
 let permanentGuests=0,temporaryGuestDays=0,activeVisitors=0;
 for(const g of p.guests??[]){
  const count=Math.floor(safe(g.count,30)),days=guestDaysInMonth(g,month);
  if(!count||!days)continue;
  const cost=count*days*(safe(g.foodDaily,200)+safe(g.utilitiesDaily,100)+safe(g.otherDaily,200));
  guestFood+=count*days*safe(g.foodDaily,200);
  guestUtilities+=count*days*safe(g.utilitiesDaily,100);
  guestOther+=count*days*safe(g.otherDaily,200);
  if(g.pattern==="one-off"){temporaryGuests+=cost;temporaryGuestDays+=count*days;}
  else recurringGuests+=cost;
  if(g.pattern==="permanent")permanentGuests+=count;
  activeVisitors+=count;
 }
 return {
  adults,children,permanentResidents:adults===null||children===null?null:adults+children+liveIn+permanentGuests,
  helperSalary:round(helperSalary),helperFood:round(helperFood),
  helperUtilities:round(helperUtilities),helperSupplies:round(helperSupplies),
  guestFood:round(guestFood),guestUtilities:round(guestUtilities),guestOther:round(guestOther),
  recurringGuests:round(recurringGuests),temporaryGuests:round(temporaryGuests),
  total:round(helperSalary+helperFood+helperUtilities+helperSupplies+recurringGuests+temporaryGuests),
  helperCount,temporaryGuestDays,activeVisitors
 };
}
/** Parent-approved budget ALLOCATIONS only. Never creates paid expenses, cash or bills.
 * Dedicated category ids make retries idempotent. Temporary stays are allocated
 * in the selected month only, not every future month.
 */
export function applyHouseholdPresenceBudget(
 money:MoneyState,p:HouseholdPresence,members:readonly Member[],month:string
):MoneyState{
 if(money.demo||!monthDays(month))return money;
 const est=estimateHouseholdPresence(p,members,month);
 const base=[
  {id:"presence-helper-salary",name:"Domestic help salary",amount:est.helperSalary,type:"fixed" as const,priority:"protected" as const},
  {id:"presence-helper-living",name:"Domestic help food & living",amount:round(est.helperFood+est.helperUtilities+est.helperSupplies),type:"variable" as const,priority:"essential" as const},
  {id:"presence-guests-recurring",name:"Regular visitor/relative costs",amount:est.recurringGuests,type:"variable" as const,priority:"protected" as const},
  {id:"presence-guests-"+month,name:"Temporary visitors ("+month+")",amount:0,type:"periodic" as const,priority:"protected" as const}
 ];
 let updated=[...money.categories];
 for(const c of base){
  const old=updated.find(x=>x.id===c.id);
  if(!old&&c.amount===0&&!(c.id==="presence-guests-"+month&&est.temporaryGuests>0))continue;
  const next:Category=old?
   {...old,planned:c.amount,amountConfidence:"estimate"}:
   {id:c.id,name:c.name,type:c.type,planned:c.amount,priority:c.priority,amountConfidence:"estimate"};
  updated=old?updated.map(x=>x.id===c.id?next:x):[...updated,next];
 }
 const prior=money.monthlyAdjustments?.[month]??{savingsDelta:0,categoryDeltas:{}};
 const delta={...prior.categoryDeltas};
 const tempId="presence-guests-"+month;
 if(est.temporaryGuests>0||tempId in delta)delta[tempId]=est.temporaryGuests;
 return {...money,categories:updated,monthlyAdjustments:{
  ...money.monthlyAdjustments,
  [month]:{...prior,categoryDeltas:delta}
 }};
}
