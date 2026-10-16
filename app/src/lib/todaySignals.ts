import type {AttentionItem} from "./familyAttention";
import type {DecisionStep} from "./familyDecisionBrief";

export type TodaySignal={
 key:string;
 source:"attention"|"decision";
 titleEn:string;titleAr:string;
 detailEn:string;detailAr:string;
 actionEn:string;actionAr:string;
 link:AttentionItem["link"];
 urgency:"critical"|"important"|"normal";
 canSnooze:boolean;
 attention?:AttentionItem;
};

/** One next action per destination; strongest existing warning always wins.
 * Both source engines remain unchanged, retaining financial safety and consent.
 */
export function buildTodaySignals(
 attention:readonly AttentionItem[],decisions:readonly DecisionStep[],
 maxItems=4
):TodaySignal[]{
 const candidates:TodaySignal[]=[
  ...attention.map(a=>({
   key:a.key,source:"attention" as const,titleEn:a.titleEn,titleAr:a.titleAr,
   detailEn:a.detailEn,detailAr:a.detailAr,actionEn:a.actionEn,actionAr:a.actionAr,
   link:a.link,urgency:a.severity==="gentle"?"normal" as const:a.severity,
   canSnooze:a.canSnooze,attention:a
  })),
  ...decisions.map(d=>({
   key:"decision:"+d.id,source:"decision" as const,titleEn:d.titleEn,titleAr:d.titleAr,
   detailEn:d.detailEn,detailAr:d.detailAr,
   actionEn:"Review this step",actionAr:"راجع الخطوة",link:d.link,
   urgency:d.urgency==="important"?"important" as const:"normal" as const,canSnooze:false
  }))
 ];
 const rank=(x:TodaySignal)=>x.urgency==="critical"?0:x.urgency==="important"?1:2;
 // Preserve the attention engine's ordered priority for items of equal severity;
 // a decision-engine item is extra context, not a replacement for a dated warning.
 candidates.sort((a,b)=>rank(a)-rank(b)||
  (a.source===b.source?0:a.source==="attention"?-1:1));
 const used=new Set<string>();
 const result:TodaySignal[]=[];
 for(const item of candidates){
  if(used.has(item.link))continue;
  used.add(item.link);
  result.push(item);
  if(result.length>=Math.max(1,Math.min(4,maxItems)))break;
 }
 return result;
}
