import type {Member} from "./money";
import type {ActivityTheme} from "./familyActivityDiscovery";
import {childAgeOptions} from "./familyActivityDiscovery";
import type {FamilyMoment} from "./familyCalendar";
import {parseCalendarDate} from "./familyCalendar";
import {makeFamilyPlan,type FamilyPlan} from "./familyPlans";
import type {WeekendPlace} from "./weekendPlaceSearch";

export type FamilyThemeMatch={theme:ActivityTheme;matches:number;total:number;fit:"all"|"some"|"unknown"};
/** Age-band matches are editorial suggestions, never verified admission or safeguarding claims. */
export function familyThemeMatches(themes:readonly ActivityTheme[],members:readonly Member[]):FamilyThemeMatch[]{
 const ages=childAgeOptions(members);
 return themes.map(theme=>{
  const matches=ages.filter(age=>age>=theme.minAge&&age<=theme.maxAge).length;
  return {theme,matches,total:ages.length,fit:ages.length===0?"unknown":matches===ages.length?"all":"some" as const};
 }).sort((a,b)=>{
  const tier=(x:FamilyThemeMatch)=>x.fit==="all"?0:x.fit==="some"?1:2;
  return tier(a)-tier(b)||b.matches-a.matches;
 });
}
export type MappedOutingDraft={name:string;sourceUrl:string;date?:string;estimatedTotalJod?:number};
/** Save a parent-selected IDEA in Family Plans, never as a confirmed event, bill or paid expense. */
export function planFromDiscoveredPlace(input:MappedOutingDraft,id:string,now=new Date()):FamilyPlan|null{
 if(!/^https:\/\/www\.openstreetmap\.org\/(node|way|relation)\/\d+$/.test(input.sourceUrl))return null;
 if(input.date!==undefined&&!parseCalendarDate(input.date))return null;
 if(input.estimatedTotalJod!==undefined&&
  (!Number.isFinite(input.estimatedTotalJod)||input.estimatedTotalJod<0||input.estimatedTotalJod>100000))return null;
 return makeFamilyPlan({id,title:input.name,kind:"outing",
  ...(input.date?{date:input.date}:{}),
  ...(input.estimatedTotalJod!==undefined?{budgetJod:input.estimatedTotalJod}:{}),
  sourceRef:input.sourceUrl,
  note:"An idea saved from a public map; prices, schedules, age suitability, safeguarding and availability are NOT verified."
 },now);
}
export function placeAsOutingDraft(place:WeekendPlace):MappedOutingDraft{
 return {name:place.name,sourceUrl:place.osmUrl};
}
export const PLANNED_OUTING_MOMENT_PREFIX="outing-plan:";
/** Read-only calendar projections: changing/deleting a plan updates its calendar date automatically.
 * Does not create a second event, financial commitment or actual expense.
 */
export function plannedOutingMoments(plans:readonly FamilyPlan[],authored:readonly FamilyMoment[]=[]):FamilyMoment[]{
 const own=new Set(authored.filter(x=>x.kind==="activity").map(x=>x.date+"|"+x.title.trim().toLowerCase()));
 return plans.filter(x=>x.kind==="outing"&&x.status!=="completed"&&!!x.date&&!!parseCalendarDate(x.date))
  .filter(x=>!own.has(x.date+"|"+x.title.trim().toLowerCase()))
  .map(x=>({id:PLANNED_OUTING_MOMENT_PREFIX+x.id,title:x.title,date:x.date!,kind:"activity",annual:false,
   note:"Saved family idea — not a confirmed booking or payment."}));
}
