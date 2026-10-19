import type {FamilyPlan} from "./familyPlans";
/** Connect a parent-selected public map venue to an existing *tentative* outing
 * rather than saving a second plan. Preserve occasion linkage and any actual
 * expense records. A place is NEVER an approved booking or verified offer.
 */
export function attachVenueToOuting(existing:FamilyPlan,venue:FamilyPlan,now=new Date()):FamilyPlan|null{
 if(existing.kind!=="outing"||existing.status==="completed"||
    venue.kind!=="outing"||!venue.sourceRef?.startsWith("https://www.openstreetmap.org/")||
    !venue.title||!existing.id)return null;
 const sourceRef=existing.sourceRef&&!existing.sourceRef.startsWith("https://www.openstreetmap.org/")?
  existing.sourceRef:venue.sourceRef;
 const note=(existing.note??"").replace(/\s*Selected public map place: https:\/\/www\.openstreetmap\.org\/\S+/g,"");
 const reference="Selected public map place: "+venue.sourceRef;
 const rest=note.slice(0,Math.max(0,240-reference.length-2));
 return {...existing,
  sourceRef, note:(rest?rest+"; ":"")+reference,
  choice:{label:venue.title,source:"outing",verified:false,
   ...(venue.budgetJod!==undefined?{estimatedJod:venue.budgetJod}:{})},
  ...(venue.date?{date:venue.date}:{}),
  ...(venue.budgetJod!==undefined?{budgetJod:venue.budgetJod}:{}),
  status:"planning",updatedAt:now.toISOString()};
}
