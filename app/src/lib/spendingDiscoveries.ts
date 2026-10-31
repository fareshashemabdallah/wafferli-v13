import type {MoneyState,Expense} from "./money";

/** Read-only awareness from the canonical paid-expense ledger.
 * No guessed bank activity, balances, new transactions or budget allocations.
 */
export type SpendingDiscovery={
 key:string;label:string;kind:"food-delivery"|"category";
 amountJod:number;count:number;sharePct:number;
 previousMonthJod:number|null;previousCount:number;
 targetJod:number|null;categoryId?:string;
};
export type SpendingDiscoveryView={
 month:string;totalRecordedJod:number;paidCount:number;
 visible:SpendingDiscovery[];
};
const cents=(n:number)=>Math.round(n*100);
const valid=(e:Expense)=>e.status!=="planned"&&
 typeof e.amount==="number"&&Number.isFinite(e.amount)&&e.amount>0&&e.amount<=1e9&&
 /^\d{4}-\d{2}-\d{2}$/.test(e.date);
const foodDeliveryName=(s:string)=>/food[ -]?delivery|take[ -]?away|take[ -]?out|دليفري|توصيل\s*(?:طعام|الطعام|اكل|أكل)|طلبات\s*توصيل|livraison\s+(?:de\s+)?repas/iu.test(s);
export const discoveryTargetValid=(n:number):boolean=>
 Number.isFinite(n)&&n>=0&&n<=100000&&Math.abs(n*100-cents(n))<0.00001;
const previousMonth=(month:string)=>{
 const [year,number]=month.split("-").map(Number);
 const date=new Date(year!,number!-2,15,12);
 return date.getFullYear()+"-"+String(date.getMonth()+1).padStart(2,"0");
};
export function buildSpendingDiscoveries(state:MoneyState,month:string):SpendingDiscoveryView{
 if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)||state.demo)
  return {month,totalRecordedJod:0,paidCount:0,visible:[]};
 const previous=previousMonth(month),categories=new Map(state.categories.map(c=>[c.id,c]));
 const budgetItems=new Map((state.budgetItems??[]).map(i=>[i.id,i]));
 type Group={key:string;label:string;kind:"food-delivery"|"category";categoryId?:string;
  currentCents:number;priorCents:number;count:number;previousCount:number;prefer:boolean};
 const groups=new Map<string,Group>();
 const paid=state.expenses.filter(valid);
 let monthCents=0,paidCount=0;
 for(const expense of paid){
  const current=expense.date.startsWith(month+"-"),older=expense.date.startsWith(previous+"-");
  if(!current&&!older)continue;
  const cat=categories.get(expense.categoryId),item=budgetItems.get(expense.budgetItemId??"");
  const delivery=expense.purpose==="food-delivery"||
   foodDeliveryName(cat?.name??"")||
   (item?.categoryId===expense.categoryId&&foodDeliveryName(item.name))||
   foodDeliveryName(expense.note??"");
  const key=delivery?"food-delivery":"category:"+expense.categoryId;
  const kind=delivery?"food-delivery":"category";
  const group=groups.get(key)??{
   key,kind,label:delivery?"Food delivery":cat?.name??state.retiredCategoryNames?.[expense.categoryId]??"Uncategorized",
   ...(delivery?{}:{categoryId:expense.categoryId}),
   currentCents:0,priorCents:0,count:0,previousCount:0,
   prefer:delivery||cat?.type==="variable"||cat?.priority==="flexible"
  };
  const amount=cents(expense.amount);
  if(current){group.currentCents+=amount;group.count++;monthCents+=amount;paidCount++;}
  else {group.priorCents+=amount;group.previousCount++;}
  groups.set(key,group);
 }
 const target=state.spendingDiscoveryTargets??{};
 const visible=[...groups.values()].filter(g=>g.count>0).map(g=>({
  key:g.key,kind:g.kind,label:g.label,...(g.categoryId?{categoryId:g.categoryId}:{}),
  amountJod:g.currentCents/100,count:g.count,
  sharePct:monthCents>0?Math.round(g.currentCents/monthCents*100):0,
  previousMonthJod:g.previousCount>0?g.priorCents/100:null,previousCount:g.previousCount,
  targetJod:typeof target[g.key]==="number"&&discoveryTargetValid(target[g.key])?target[g.key]:null,
  prefer:g.prefer
 })).sort((a,b)=>Number(b.prefer)-Number(a.prefer)||b.amountJod-a.amountJod||a.key.localeCompare(b.key))
  .map(({prefer:_prefer,...rest})=>rest);
 return {month,totalRecordedJod:monthCents/100,paidCount,visible};
}
