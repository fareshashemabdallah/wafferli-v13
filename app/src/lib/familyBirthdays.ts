import type {Member} from "./money";
import {parseCalendarDate} from "./familyCalendar";

/** Selecting from separate month/day/year fields works on mobile numeric
 * keyboards without requiring the user to type a hyphen. Birth year is never
 * required for reminders and is only stored after an explicit choice. */
export const birthdayMonths=Array.from({length:12},(_,i)=>String(i+1).padStart(2,"0"));
export const birthdayDays=Array.from({length:31},(_,i)=>String(i+1).padStart(2,"0"));
export const birthYears=(today=new Date())=>Array.from(
 {length:today.getFullYear()-1899},(_,i)=>String(today.getFullYear()-i)
);
export function birthdayParts(member:Pick<Member,"birthday"|"birthdayMonthDay">){
 const monthDay=member.birthdayMonthDay||member.birthday?.slice(5)||"";
 const [month="",day=""]=monthDay.split("-");
 return {month,day,year:member.birthday?.slice(0,4)||""};
}
export function birthDateFromParts(month:string,day:string,year:string){
 if(!month&&!day&&!year)return {monthDay:undefined,full:undefined,valid:true};
 if(!/^\d{2}$/.test(month)||!/^\d{2}$/.test(day)||
  !parseCalendarDate("2000-"+month+"-"+day))
  return {monthDay:undefined,full:undefined,valid:false};
 if(!year)return {monthDay:month+"-"+day,full:undefined,valid:true};
 if(!/^\d{4}$/.test(year)||!parseCalendarDate(year+"-"+month+"-"+day))
  return {monthDay:undefined,full:undefined,valid:false};
 return {monthDay:month+"-"+day,full:year+"-"+month+"-"+day,valid:true};
}
export function updateMemberBirthday(member:Member,month:string,day:string,year:string):Member{
 // Retain incomplete choices during editing, but validation blocks saving.
 const dayMonth=month||day?month+"-"+day:"";
 const parsed=birthDateFromParts(month,day,year);
 return {...member,birthdayMonthDay:dayMonth||undefined,
  birthday:parsed.full,
  // Exact birth date takes precedence over a manually entered, aging number.
  ...(parsed.full?{ageYears:undefined,ageGroup:""}:{})};
}
/** Birth year without day/month is not enough to infer an exact age.
 * Existing explicitly entered ages remain supported as a fallback. */
export function memberAgeYears(member:Pick<Member,"birthday"|"ageYears">,asOf=new Date()):number|null{
 if(member.birthday){
  const born=parseCalendarDate(member.birthday);
  if(!born)return null;
  const today=new Date(asOf.getFullYear(),asOf.getMonth(),asOf.getDate(),12);
  if(born.getTime()>today.getTime())return null;
  let years=today.getFullYear()-born.getFullYear();
  if(today.getMonth()<born.getMonth()||
   today.getMonth()===born.getMonth()&&today.getDate()<born.getDate())years--;
  return years>=0&&years<=125?years:null;
 }
 return Number.isInteger(member.ageYears)&&member.ageYears!==undefined&&
  member.ageYears>=0&&member.ageYears<=120?member.ageYears:null;
}
export function memberAgeLabel(member:Pick<Member,"birthday"|"ageYears"|"ageGroup">,asOf=new Date()):string|null{
 const age=memberAgeYears(member,asOf);
 return age===null?member.ageGroup.trim()||null:String(age);
}
