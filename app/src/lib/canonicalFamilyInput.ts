import {memberBirthdayMoments,type FamilyMoment} from "./familyCalendar";
import {realFamilyMembers} from "./familySetup";
import type {Member} from "./money";
/** One authored family event is shared by My Family, Calendar and occasions.
 * Never reject distinct people/events merely because they share a date.
 */
export function isDuplicateFamilyMoment(existing:readonly FamilyMoment[],candidate:FamilyMoment):boolean{
 const normalize=(s:string)=>s.trim().toLocaleLowerCase().replace(/\s+/g," ");
 const label=normalize(candidate.title);
 return existing.some(event=>event.id!==candidate.id&&event.kind===candidate.kind&&
  normalize(event.title)===label&&
  (event.date===candidate.date||
   (event.annual&&candidate.annual&&event.date.slice(5)===candidate.date.slice(5))));
}

/** A profile birthday is already a calendar entry, even if the user visits the
 * Calendar or Important Dates editor first. Do not create an invisible second
 * event that may later produce duplicate gift prompts or plans.
 * Only an actual birthday for the same person and month/day is blocked:
 * different people can celebrate on the same day.
 */
export function isDuplicateProfileBirthday(members:readonly Member[],candidate:FamilyMoment):boolean{
 if(candidate.kind!=="birthday")return false;
 const subject=(name:string)=>name.toLocaleLowerCase().normalize("NFKC")
  .replace(/[’']/g,"").replace(/\s+/g," ").trim()
  .replace(/^(?:birthday(?: of| for)?[: ]*|عيد ميلاد\s*)/u,"")
  .replace(/(?:s birthday| birthday|\s+عيد ميلاد)$/u,"").trim();
 const proposed=subject(candidate.title);
 if(!proposed)return false;
 return memberBirthdayMoments(realFamilyMembers(members)).some(birthday=>
  birthday.date.slice(5)===candidate.date.slice(5)&&subject(birthday.title)===proposed
 );
}
