import type {FamilyMoment} from "./familyCalendar";
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
