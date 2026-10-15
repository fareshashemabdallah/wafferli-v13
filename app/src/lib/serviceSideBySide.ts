import {assessServiceShortlist,type ServiceEntry,type ServiceAssessment} from "./serviceShortlist";
export type SideBySide={
 options:ServiceAssessment[];
 warnings:string[];
};
export function compareParentSelectedServices(
 entries:readonly ServiceEntry[],ids:readonly string[],now=new Date()
):SideBySide {
 const chosen=[...new Set(ids)];
 if(chosen.length<2||chosen.length>3)
  throw new Error("Choose two or three service entries for comparison");
 const map=new Map(entries.map(e=>[e.id,e]));
 const selection=chosen.map(id=>map.get(id));
 if(selection.some(x=>!x))throw new Error("A selected provider is no longer on your list");
 const valid=selection.filter((x):x is ServiceEntry=>!!x);
 if(new Set(valid.map(e=>e.category)).size!==1)
  throw new Error("Compare providers within the same service category");
 const summaries=assessServiceShortlist(valid,now);
 const byId=new Map(summaries.map(s=>[s.entry.id,s]));
 // Preserve the parent's selected order, not an inferred medical/quality rank.
 const ordered=chosen.map(id=>byId.get(id)!);
 const warnings=[
  "All amounts, provider details and ratings were manually entered by the parent.",
  "No clinician licensing, credentials, price, insurance coverage or appointment availability has been independently verified.",
  ...(ordered.some(s=>s.freshness==="review")?["At least one provider needs an updated information check."]:[]),
  ...(ordered.some(s=>s.missingChecks.length>0)?["Review missing source, cost or availability fields before deciding."]:[])
 ];
 return {options:ordered,warnings};
}
