import {allFamilyMoments,dateKey,occurrencesForDate,shiftDays,upcomingMoments,type FamilyMoment} from "./familyCalendar";
import {realFamilyMembers} from "./familySetup";
import {upcomingFamilyPlans,type FamilyPlan} from "./familyPlans";
import {spendingBreakdown,type SpendingBreakdown} from "./spendingBreakdown";
import {scheduleDates} from "./cashflow";
import {isSampleBasketEntry,type BasketEntry} from "./basketRecording";
import type {FamilyTask} from "./familyTasks";
import type {WishlistItem} from "./familyWishlist";
import type {MoneyState,Member} from "./money";

export type HomeAgendaItem={id:string;title:string;date:string;time?:string;kind:"task"|"bill"|"moment";destination:"/space"|"/money"|"/calendar"};
export type HomePlanItem={id:string;title:string;date?:string;kind:"plan"|"moment"};
export type HomeWishlistItem={id:string;title:string;status:"open"|"done";kind:"basket"|"wishlist"};
export type HomeSnapshot={
 budget:SpendingBreakdown|null;
 agenda:HomeAgendaItem[];
 plans:HomePlanItem[];
 shopping:HomeWishlistItem[];
 week:{day:string;events:number}[];
 nowKey:string;
};

/** Exactly the parent-provided data. Demo money and sample people never
 * masquerade as the family's records; missing inputs produce empty states. */
export function homeSnapshot(input:{
 money:MoneyState;members:Member[];moments:FamilyMoment[];
 plans:FamilyPlan[];tasks:FamilyTask[];basket:BasketEntry[];wishlist:WishlistItem[];
 now?:Date;arabic?:boolean;
}):HomeSnapshot{
 const now=input.now??new Date(),today=dateKey(now);
 const end=dateKey(shiftDays(now,7));
 const members=realFamilyMembers(input.members);
 const moments=allFamilyMoments(input.moments,members,!!input.arabic);
 const nextOccasions=upcomingMoments(moments,now,50);
 const tasks=input.tasks.filter(task=>task.status==="open"&&task.dueDate<=end).map(task=>({
  id:"task:"+task.id,title:task.title,date:task.dueDate,kind:"task" as const,destination:"/space" as const
 }));
 const bills:HomeAgendaItem[]=input.money.demo?[]:(input.money.commitments??[]).flatMap(bill=>
  scheduleDates(bill.dueDate,bill.frequency,today,end,bill.endDate)
   .filter(date=>!bill.paidDates?.includes(date))
   .map(date=>({id:"bill:"+bill.id+":"+date,title:bill.name,date,kind:"bill" as const,destination:"/money" as const}))
 );
 const events=nextOccasions.filter(item=>item.occursOn<=end).map(item=>({
  id:"moment:"+item.id+":"+item.occursOn,title:item.title,date:item.occursOn,
  ...(item.time?{time:item.time}:{}),
  kind:"moment" as const,destination:"/calendar" as const
 }));
 const agenda=[...tasks,...bills,...events].sort((a,b)=>a.date.localeCompare(b.date)||("time" in a?a.time??"":"").localeCompare("time" in b?b.time??"":"")).slice(0,5);
 const upcoming=upcomingFamilyPlans(input.plans,now,5).map(p=>({
  id:"plan:"+p.id,title:p.title,...(p.date?{date:p.date}:{}),kind:"plan" as const
 }));
 const plannedDates=new Set(upcoming.map(p=>p.date+"|"+p.title.toLowerCase()));
 const plans:HomePlanItem[]=[...upcoming,...nextOccasions.filter(e=>!plannedDates.has(e.occursOn+"|"+e.title.toLowerCase()))
  .map(e=>({id:"moment:"+e.id+":"+e.occursOn,title:e.title,date:e.occursOn,kind:"moment" as const}))]
  .sort((a,b)=>(a.date??"9999-12-31").localeCompare(b.date??"9999-12-31")).slice(0,4);
 const basket=input.basket.filter(item=>!isSampleBasketEntry(item)&&!!item.name.trim()).slice(0,3).map(item=>({
  id:"basket:"+item.id,title:item.name,status:(item.done?"done":"open") as "done"|"open",kind:"basket" as const
 }));
 const wishlist=input.wishlist.filter(item=>item.status==="considering"&&!!item.name.trim()).slice(0,3)
  .map(item=>({id:"wish:"+item.id,title:item.name,status:"open" as const,kind:"wishlist" as const}));
 const shopping=[...basket,...wishlist].slice(0,4);
 const monday=shiftDays(now,-((now.getDay()+6)%7));
 const week=Array.from({length:7},(_,offset)=>{
  const day=dateKey(shiftDays(monday,offset));
  return {day,events:occurrencesForDate(moments,day).length+
   input.tasks.filter(t=>t.status==="open"&&t.dueDate===day).length};
 });
 return {budget:input.money.demo?null:spendingBreakdown(input.money,now),
  agenda,plans,shopping,week,nowKey:today};
}
