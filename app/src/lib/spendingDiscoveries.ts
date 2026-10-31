import type {MoneyState,Expense} from "./money";

/** Read-only observations from the existing paid-expense ledger. A large bill,
 * a single purchase or a protected family commitment is NOT a discovery.
 * This is awareness, not a recommendation to cut necessary family spending.
 */
export type SpendingDiscovery={
 key:string;label:string;kind:"food-delivery"|"category"|"item";
 signal:"repeated"|"increase"|"target";
 amountJod:number;count:number;averageJod:number;twoFewerJod:number;
 previousMonthJod:number|null;previousCount:number;increaseJod:number|null;
 targetJod:number|null;categoryId?:string;
};
export type SpendingDiscoveryView={
 month:string;totalRecordedJod:number;paidCount:number;
 /** At most one discovery should be presented at a time; others remain internal. */
 visible:SpendingDiscovery[];
};
const cents=(n:number)=>Math.round(n*100);
const valid=(e:Expense)=>e.status!=="planned"&&
 Number.isFinite(e.amount)&&e.amount>0&&e.amount<=1e9&&
 /^\d{4}-\d{2}-\d{2}$/.test(e.date);
const foodDeliveryName=(s:string)=>/food[ -]?delivery|take[ -]?away|take[ -]?out|دليفري|توصيل\s*(?:طعام|الطعام|اكل|أكل)|طلبات\s*توصيل|livraison\s+(?:de\s+)?repas/iu.test(s);
/** Explicit essential/protected names act as a safe default for old data with
 * missing classification; they must not become a spending-cut suggestion. */
const protectedName=(s:string)=>/school|tuition|educat|nursery|daycare|childcare|insurance|health|medical|medicine|pharmac|doctor|housing|rent|mortgage|electric|utilit|water|grocer|supermarket|fuel|petrol|transport|tax\b|salary|school fee|travel ticket|flight ticket|airfare|مدرس|تعليم|حضان|تأمين|طبي|صحي|صيدل|طبيب|دواء|إيجار|سكن|كهرباء|مياه|بقال|سوبرماركت|بنزين|مواصل|ضريب|تذاكر\s*سفر|scolarité|école|assurance|santé|loyer|logement|supermarché|carburant|transport/iu.test(s);
const discretionaryName=(s:string)=>/restaurant|dining|eating out|coffee|cafe|café|snack|entertain|streaming|leisure|outing|takeaway|takeout|food[ -]?delivery|مطاعم|مطعم|قهوة|قهوه|كافيه|ترفيه|طلعات|خروجات|مطعم|مقاهي|مطاعم|restaurant|café|sorties|divertissement|livraison\s+de\s+repas/iu.test(s);
export const discoveryTargetValid=(n:number):boolean=>
 Number.isFinite(n)&&n>=0&&n<=100000&&Math.abs(n*100-cents(n))<0.00001;
const previousMonth=(month:string)=>{
 const [year,number]=month.split("-").map(Number);
 const date=new Date(year!,number!-2,15,12);
 return date.getFullYear()+"-"+String(date.getMonth()+1).padStart(2,"0");
};
type Group={key:string;label:string;kind:SpendingDiscovery["kind"];categoryId?:string;
 currentCents:number;priorCents:number;count:number;previousCount:number};
const value=(c:number)=>Math.round(c)/100;
/** Record-level classification: expense counted once, delivery is not counted
 * again under Restaurants. Unknown/uncategorized spending remains in Money
 * totals but is not speculatively labelled discretionary. */
export function buildSpendingDiscoveries(state:MoneyState,month:string):SpendingDiscoveryView{
 const empty={month,totalRecordedJod:0,paidCount:0,visible:[]};
 if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)||state.demo)return empty;
 const previous=previousMonth(month);
 const categories=new Map(state.categories.map(c=>[c.id,c]));
 const budgetItems=new Map((state.budgetItems??[]).map(i=>[i.id,i]));
 const groups=new Map<string,Group>();
 let totalRecordedCents=0,paidCount=0;
 for(const expense of state.expenses){
  if(!valid(expense))continue;
  const current=expense.date.startsWith(month+"-");
  const earlier=expense.date.startsWith(previous+"-");
  if(!current&&!earlier)continue;
  const amount=cents(expense.amount);
  if(current){totalRecordedCents+=amount;paidCount++;}
  const category=categories.get(expense.categoryId);
  const item=budgetItems.get(expense.budgetItemId??"");
  if(!category||expense.billId||category.type!=="variable"||
   category.priority==="essential"||category.priority==="protected"||
   item&&(item.categoryId!==category.id||item.priority!=="flexible"||
     item.spendingRole==="committed"||item.spendingRole==="necessary")||
   protectedName(category.name)||item&&protectedName(item.name))continue;
  const delivery=expense.purpose==="food-delivery"||
   foodDeliveryName(category.name)||item&&foodDeliveryName(item.name)||
   foodDeliveryName(expense.note??"");
  const recognized=delivery||category.priority==="flexible"||
   discretionaryName(category.name)||item&&discretionaryName(item.name);
  if(!recognized)continue;
  const kind:SpendingDiscovery["kind"]=delivery?"food-delivery":item&&discretionaryName(item.name)?"item":"category";
  const key=delivery?"food-delivery":kind==="item"?"item:"+item!.id:"category:"+category.id;
  const label=delivery?"Food delivery":kind==="item"?item!.name:category.name;
  const group=groups.get(key)??{key,label,kind,categoryId:category.id,
   currentCents:0,priorCents:0,count:0,previousCount:0};
  if(current){group.currentCents+=amount;group.count++;}
  else{group.priorCents+=amount;group.previousCount++;}
  groups.set(key,group);
 }
 const targets=state.spendingDiscoveryTargets??{};
 const ranked=[...groups.values()].flatMap(group=>{
  if(!group.count)return [];
  const currentJod=value(group.currentCents),previousJod=value(group.priorCents);
  const targetValue=targets[group.key];
  const targetJod=typeof targetValue==="number"&&discoveryTargetValid(targetValue)?targetValue:null;
  // Compare only with a previous month containing >=2 recorded transactions.
  // Sparse / missing history must never be narrated as a verified increase.
  const comparable=group.previousCount>=2;
  const increaseJod=comparable?value(group.currentCents-group.priorCents):null;
  const increase=comparable&&group.count>=3&&group.currentCents>=3000&&
   group.currentCents>=group.priorCents*1.4&&
   group.currentCents-group.priorCents>=2500;
  const repeated=group.count>=4&&group.currentCents>=4000;
  if(!increase&&!repeated&&targetJod===null)return [];
  const signal:SpendingDiscovery["signal"]=increase?"increase":repeated?"repeated":"target";
  const avg=value(group.currentCents/group.count);
  const entry:SpendingDiscovery={
   key:group.key,label:group.label,kind:group.kind,signal,
   amountJod:currentJod,count:group.count,averageJod:avg,
   twoFewerJod:value(2*group.currentCents/group.count),
   previousMonthJod:comparable?previousJod:null,
   previousCount:group.previousCount,increaseJod:increase?increaseJod:null,
   targetJod,categoryId:group.categoryId
  };
  return [{entry,score:(increase?20000:repeated?10000:0)+
    (targetJod!==null?2000:0)+group.currentCents/100+group.count*2}];
 }).sort((a,b)=>b.score-a.score||a.entry.key.localeCompare(b.entry.key));
 return {month,totalRecordedJod:value(totalRecordedCents),paidCount,
  visible:ranked.map(x=>x.entry)};
}
