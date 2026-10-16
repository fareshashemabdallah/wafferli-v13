import {computeMoney,type CatType,type MoneyState,type Category} from "./money";
import {roundJod} from "./cashflow";

export type SpendingGroupKind=CatType|"unallocated";
export type SpendingLine={
 id:string;name:string;kind:SpendingGroupKind;
 plannedJod:number;recordedJod:number;remainingJod:number;
};
export type SpendingGroup={
 kind:SpendingGroupKind;plannedJod:number;recordedJod:number;remainingJod:number;
 lines:SpendingLine[];
};
export type SpendingBreakdown={
 groups:SpendingGroup[];plannedJod:number;recordedJod:number;
 remainingJod:number;hasRealCategories:boolean;starterOnly:boolean;
 uncategorizedRecordedJod:number;
};
const GROUP_ORDER:SpendingGroupKind[]=["fixed","variable","periodic","unallocated"];
const starterIds=new Set(["household-starter","starter-unallocated"]);
const amount=(value:number)=>Number.isFinite(value)?roundJod(value):0;
/**
 * Read-only monthly budget view. Planned envelopes, recorded paid expenses,
 * and calendar bills are distinct concepts. Missing expense entries must
 * never be presented as confirmed savings or as freely spendable cash.
 */
export function spendingBreakdown(state:MoneyState,now=new Date()):SpendingBreakdown{
 const computed=computeMoney(state,now);
 const lines:SpendingLine[]=state.categories.map(category=>{
  const kind:SpendingGroupKind=starterIds.has(category.id)?"unallocated":category.type;
  const plannedJod=amount(computed.plannedBy(category.id));
  const recordedJod=amount(computed.spentBy(category.id));
  return {id:category.id,name:category.name,kind,plannedJod,recordedJod,
   remainingJod:amount(plannedJod-recordedJod)};
 });
 const knownIds=new Set(state.categories.map(category=>category.id));
 const ym=now.getFullYear()+"-"+String(now.getMonth()+1).padStart(2,"0");
 const uncategorizedRecordedJod=amount(state.expenses.filter(exp=>
  exp.date.startsWith(ym)&&exp.status!=="planned"&&!knownIds.has(exp.categoryId)
 ).reduce((sum,exp)=>sum+(Number.isFinite(exp.amount)?exp.amount:0),0));
 if(uncategorizedRecordedJod!==0)lines.push({
  id:"uncategorized-recorded",name:"Uncategorized recorded expenses",
  kind:"unallocated",plannedJod:0,recordedJod:uncategorizedRecordedJod,
  remainingJod:-uncategorizedRecordedJod
 });
 const groups=GROUP_ORDER.map(kind=>{
  const entries=lines.filter(line=>line.kind===kind);
  const plannedJod=amount(entries.reduce((sum,line)=>sum+line.plannedJod,0));
  const recordedJod=amount(entries.reduce((sum,line)=>sum+line.recordedJod,0));
  return {kind,plannedJod,recordedJod,remainingJod:amount(plannedJod-recordedJod),lines:entries};
 });
 const plannedJod=amount(groups.reduce((sum,g)=>sum+g.plannedJod,0));
 const recordedJod=amount(groups.reduce((sum,g)=>sum+g.recordedJod,0));
 return {
  groups,plannedJod,recordedJod,remainingJod:amount(plannedJod-recordedJod),
  starterOnly:state.categories.length===1&&state.categories[0]?.id==="household-starter",
  hasRealCategories:state.categories.some(category=>!starterIds.has(category.id)),
  uncategorizedRecordedJod
 };
}
const cents=(v:number):number|null=>
 Number.isFinite(v)&&v>=0&&v<=100000&&Math.abs(v*100-Math.round(v*100))<.00001?
 Math.round(v*100):null;
/** Only split the untouched one-line estimated budget. Do not silently
 * reclassify real transactions, income, savings, bills or monthly adjustments. */
export function canSplitStarter(state:MoneyState):boolean{
 const cat=state.categories[0];
 if(state.demo||state.categories.length!==1||cat?.id!=="household-starter")return false;
 if(state.expenses.some(e=>e.categoryId===cat.id))return false;
 if((state.commitments??[]).some(b=>b.categoryId===cat.id))return false;
 if(Object.values(state.monthlyAdjustments??{}).some(x=>(x.categoryDeltas[cat.id]??0)!==0))return false;
 return cents(cat.planned)!==null;
}
export function splitStarterBudget(
 state:MoneyState,parts:{fixed:number;variable:number;periodic:number}
):MoneyState{
 if(!canSplitStarter(state))return state;
 const a=cents(parts.fixed),b=cents(parts.variable),c=cents(parts.periodic);
 const planned=cents(state.categories[0]!.planned);
 if(a===null||b===null||c===null||planned===null||a+b+c!==planned)return state;
 const categories:Category[]=[
  {id:"starter-fixed",name:"Fixed monthly costs",type:"fixed",planned:a/100},
  {id:"starter-variable",name:"Variable everyday costs",type:"variable",planned:b/100},
  ...(c>0?[{id:"starter-periodic",name:"Occasional costs",type:"periodic" as const,planned:c/100}]:[])
 ];
 return {...state,categories};
}
