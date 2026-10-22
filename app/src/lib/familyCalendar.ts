/** Device-only family occasions. Public holidays are not populated by a remote calendar. */
import type { Member } from "./money";
export type MomentKind = "birthday" | "anniversary" | "holiday" | "celebration" | "school" | "activity" | "other";
export type FamilyMoment = {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD, date only in user's local time
  kind: MomentKind;
  annual: boolean;
  note?: string;
  time?: string; // HH:mm or empty
};
export type MomentOccurrence = FamilyMoment & { occursOn: string };

export const memberBirthdayPrefix = "member-birthday:";
/** Derived from profiles on each read: editing or deleting a member updates their birthday everywhere automatically. */
export function memberBirthdayMoments(members: Member[], arabic = false): FamilyMoment[] {
  return members
    .filter(m => !!m.id && !!m.name.trim() &&
      (!!m.birthday && !!parseCalendarDate(m.birthday)||
       !!m.birthdayMonthDay && !!parseCalendarDate("2000-"+m.birthdayMonthDay) &&
       /^\d{2}-\d{2}$/.test(m.birthdayMonthDay)))
    .map(m => ({
      id: memberBirthdayPrefix + m.id,
      title: arabic ? "عيد ميلاد " + m.name.trim() : m.name.trim() + "'s birthday",
      // Month/day explicitly entered in the profile wins over a stale
      // legacy full birthday. Retain an entered year only for age-based advice.
      date: m.birthdayMonthDay?
       (m.birthday?.slice(0,4)??"2000")+"-"+m.birthdayMonthDay:m.birthday!,
      kind: "birthday" as const,
      annual: true,
    }));
}
/** Normalize common English/Arabic birthday titles to suppress duplicates from older manual entries. */
function birthdaySubject(title:string):string {
  return title.trim().toLocaleLowerCase()
    .replace(/[’']/g,"")
    .replace(/^(birthday of |birthday: |عيد ميلاد\s+)/u,"")
    .replace(/(s birthday| birthday|\s+عيد ميلاد)$/u,"")
    .replace(/\s+/g," ").trim();
}
export function allFamilyMoments(events: FamilyMoment[], members: Member[], arabic = false): FamilyMoment[] {
  const linked=memberBirthdayMoments(members, arabic);
  // Keep historical user-authored notes in storage; only hide an overlapping manual
  // birthday on the calendar when the profile already supplies that person's birthday.
  const visible=events.filter(event=>{
    if(event.kind!=="birthday")return true;
    const matches=linked.filter(m=>birthdaySubject(event.title)===birthdaySubject(m.title));
    if(matches.length===1)return false; // same one person's old manually entered birthday
    // Two people with the same name are ambiguous: never delete or silently
    // merge distinct birthdays simply because they share a display name.
    return true;
  });
  return [...visible,...linked];
}
export function isMemberBirthday(item: FamilyMoment): boolean {
  return item.id.startsWith(memberBirthdayPrefix);
}

export const kindNames: Record<MomentKind,{en:string;ar:string}> = {
  birthday:{en:"Birthday",ar:"عيد ميلاد"},
  anniversary:{en:"Wedding anniversary",ar:"ذكرى الزواج"},
  holiday:{en:"Holiday",ar:"عطلة / مناسبة"},
  celebration:{en:"Special occasion",ar:"مناسبة خاصة"},
  school:{en:"School event",ar:"مناسبة مدرسية"},
  activity:{en:"Family activity",ar:"نشاط عائلي"},
  other:{en:"Other",ar:"أخرى"},
};
export function dateKey(d:Date):string {
  return [d.getFullYear(),String(d.getMonth()+1).padStart(2,"0"),String(d.getDate()).padStart(2,"0")].join("-");
}
export function parseCalendarDate(value:string):Date|null {
  if(!/^\d{4}-\d{2}-\d{2}$/.test(value))return null;
  const [year=0,month=0,day=0]=value.split("-").map(Number);
  if(year<1900||year>2200)return null;
  const d=new Date(year,month-1,day,12);
  return dateKey(d)===value?d:null;
}
export function shiftDays(d:Date,days:number):Date {
  return new Date(d.getFullYear(),d.getMonth(),d.getDate()+days,12);
}
export function isJordanWeekend(d:Date):boolean {
  // Local family-planning default for Jordan. Other regions require customization later.
  return d.getDay()===5 || d.getDay()===6;
}
export function nextJordanWeekend(now:Date):Date {
  const today = new Date(now.getFullYear(),now.getMonth(),now.getDate(),12);
  for(let i=0;i<7;i++){
    const candidate=shiftDays(today,i);
    if(candidate.getDay()===5)return candidate; // Friday start of next/current weekend
  }
  return shiftDays(today,7);
}
export function occurrencesForDate(events:FamilyMoment[],date:string):MomentOccurrence[] {
  return events.filter(e=>{
    if(!parseCalendarDate(e.date))return false;
    if(e.annual) return e.date.slice(5)===date.slice(5) && date>=e.date;
    return e.date===date;
  }).map(e=>({...e,occursOn:date})).sort((a,b)=>
    (a.time||"").localeCompare(b.time||"") || a.title.localeCompare(b.title)
  );
}
export function upcomingMoments(events:FamilyMoment[],start:Date,windowDays=45):MomentOccurrence[]{
  const out:MomentOccurrence[]=[];
  const startDate=new Date(start.getFullYear(),start.getMonth(),start.getDate(),12);
  for(let i=0;i<windowDays;i++){
    const date=dateKey(shiftDays(startDate,i));
    out.push(...occurrencesForDate(events,date));
  }
  return out;
}
export function monthCells(year:number,monthZeroBased:number):Array<{date:string;inMonth:boolean;weekend:boolean}>{
  const first=new Date(year,monthZeroBased,1,12);
  const weekStart=(first.getDay()+6)%7; // Monday-first
  const days=new Date(year,monthZeroBased+1,0).getDate();
  const total=Math.ceil((weekStart+days)/7)*7;
  return Array.from({length:total},(_,i)=>{
    const d=new Date(year,monthZeroBased,1+i-weekStart,12);
    return {date:dateKey(d),inMonth:d.getMonth()===monthZeroBased,weekend:isJordanWeekend(d)};
  });
}
export function formatMomentDate(value:string,arabic:boolean):string{
  const d=parseCalendarDate(value);
  return d?new Intl.DateTimeFormat(arabic?"ar-JO":"en-GB",{day:"numeric",month:"short"}).format(d):value;
}
