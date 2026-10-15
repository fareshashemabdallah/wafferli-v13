import {buildForecast,legacyIncome} from "./cashflow";
import {allFamilyMoments,dateKey,shiftDays,upcomingMoments,type FamilyMoment} from "./familyCalendar";
import {realFamilyMembers} from "./familySetup";
import type {MoneyState,Member} from "./money";

export type ReminderSource="bill"|"family";
export type CalendarReminder={key:string;date:string;title:string;kind:ReminderSource};
export type ReminderChoices={bills:boolean;family:boolean};
/** Calendar entries are authored only from user-entered dates and optionally
 * actual family profiles, never from instructional sample household members.
 * No write to Money, calendar, accounts or an external service occurs here.
 */
export function collectCalendarReminders(args:{
 money:MoneyState;members:readonly Member[];moments:readonly FamilyMoment[];
 options:ReminderChoices;now?:Date;days?:number
}):CalendarReminder[]{
 const now=args.now??new Date(),today=dateKey(now);
 const days=Math.min(90,Math.max(1,args.days??45));
 const end=dateKey(shiftDays(now,days));
 const result:CalendarReminder[]=[];
 if(args.options.bills&&!args.money.demo){
  const forecast=buildForecast({
   incomes:args.money.incomeSources??legacyIncome(args.money.income),
   commitments:args.money.commitments??[],openingBalance:null,reserve:0,
   today,days
  });
  for(const e of forecast.events){
   if(e.kind!=="bill"||e.displayDate<today||e.displayDate>end)continue;
   const title=e.name.trim().slice(0,120);
   if(!title)continue;
   result.push({key:"bill:"+e.sourceId+":"+e.displayDate,date:e.displayDate,
    title:"Review due bill: "+title,kind:"bill"});
  }
 }
 if(args.options.family){
  const members=realFamilyMembers(args.members);
  const moments=allFamilyMoments([...args.moments],members);
  for(const event of upcomingMoments(moments,now,days+1)){
   if(event.occursOn<today||event.occursOn>end)continue;
   const title=event.title.trim().slice(0,120);
   if(!title)continue;
   result.push({key:"family:"+event.id+":"+event.occursOn,date:event.occursOn,
    title,kind:"family"});
  }
 }
 const seen=new Set<string>();
 return result.filter(r=>{if(seen.has(r.key))return false;seen.add(r.key);return true;})
  .sort((a,b)=>a.date.localeCompare(b.date)||a.title.localeCompare(b.title))
  .slice(0,100);
}
const clean=(value:string):string=>value.replace(/[\u0000-\u001f\u007f]/g," ").trim();
const icsEscape=(value:string)=>clean(value).replace(/\\/g,"\\\\").replace(/;/g,"\\;")
 .replace(/,/g,"\\,").replace(/\r?\n/g,"\\n");
const icsDate=(value:string)=>value.replaceAll("-","");
const validDay=(d:string)=>/^\d{4}-\d{2}-\d{2}$/.test(d)&&
 (()=>{const value=new Date(d+"T12:00:00Z");return Number.isFinite(value.getTime())&&value.toISOString().slice(0,10)===d;})();
const utc=(d:Date)=>d.toISOString().replace(/[-:]/g,"").replace(/\.\d{3}/,"");
/** Produces user-downloadable iCalendar events; individual calendar apps
 * decide whether/how to fire alerts. Export may be synchronized by the user's
 * chosen calendar provider, so the parent must explicitly acknowledge that.
 */
export function buildReminderCalendar(events:readonly CalendarReminder[],now=new Date()):string{
 if(!events.length||events.length>100)throw new Error("Choose 1–100 reminders");
 if(events.some(e=>!validDay(e.date)||!e.title.trim()||e.title.length>120||
  e.key.length>220||!["bill","family"].includes(e.kind)))
  throw new Error("One or more calendar entries are invalid");
 const stamp=utc(now);
 const entries=events.map((e,i)=>{
  const start=new Date(e.date+"T12:00:00Z");
  const next=new Date(start.getTime()+86400000).toISOString().slice(0,10);
  const uid="dabberna-"+stamp+"-"+i+"@local-reminder.invalid";
  const description=e.kind==="bill"?
   "User-recorded bill reminder. Payment status was not verified.":"User-recorded family date. Check details yourself.";
  return [
   "BEGIN:VEVENT","UID:"+uid,"DTSTAMP:"+stamp,
   "DTSTART;VALUE=DATE:"+icsDate(e.date),
   "DTEND;VALUE=DATE:"+icsDate(next),
   "SUMMARY:"+icsEscape(e.title),
   "DESCRIPTION:"+icsEscape(description),
   "BEGIN:VALARM","TRIGGER:-P1D","ACTION:DISPLAY",
   "DESCRIPTION:"+icsEscape(e.kind==="bill"?"Review bill":"Family event"),
   "END:VALARM","END:VEVENT"
  ].join("\r\n");
 });
 return ["BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//Dabberna//Local Reminder Export//EN",
  "CALSCALE:GREGORIAN","METHOD:PUBLISH",...entries,"END:VCALENDAR",""].join("\r\n");
}
