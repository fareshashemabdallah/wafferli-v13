/** Private, device-only household income scheduling and cash-flow forecasts.
 * No bank sync. Forecasts use user-entered estimates, not guarantees.
 */
export type Frequency = "daily" | "weekly" | "biweekly" | "monthly" | "quarterly" | "yearly" | "once" | "irregular";
export type IncomeSource = {
  id:string; name:string; amount:number; frequency:Frequency; nextDate:string;
  endDate?:string; owner?:string; shared:boolean; variable?:boolean;
  receivedDates?:string[]; receivedAmounts?:Record<string,number>;
};
export type Commitment = {
  id:string; name:string; amount:number; frequency:Frequency; dueDate:string;
  endDate?:string; categoryId?:string; budgetItemId?:string; paidDates?:string[];
};
export const frequencyNames: Record<Frequency,string> = {
  daily:"Daily", weekly:"Weekly", biweekly:"Every 2 weeks", monthly:"Monthly",
  quarterly:"Quarterly", yearly:"Yearly", once:"One-time", irregular:"Irregular / manual",
};
const iso = (date:Date) => [date.getFullYear(),String(date.getMonth()+1).padStart(2,"0"),String(date.getDate()).padStart(2,"0")].join("-");
export const localToday = () => iso(new Date());
const parse = (date:string): Date | null => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  const [y,m,d]=date.split("-").map(Number);
  const result=new Date(y!,m!-1,d!);
  return iso(result)===date?result:null;
};
const plusDays = (date:Date, days:number) => {
  const copy=new Date(date.getFullYear(),date.getMonth(),date.getDate());
  copy.setDate(copy.getDate()+days);
  return copy;
};
export const futureDate = (today:string,days:number) => {
  const start=parse(today);
  return start?iso(plusDays(start,days)):today;
};
const plusMonthsAnchored = (anchor:Date, n:number) => {
  const first=new Date(anchor.getFullYear(), anchor.getMonth()+n,1);
  const lastDay=new Date(first.getFullYear(),first.getMonth()+1,0).getDate();
  return new Date(first.getFullYear(),first.getMonth(),Math.min(anchor.getDate(),lastDay));
};
/** Generate due dates safely across months (31st -> Feb 28 -> Mar 31), bounded at 120 events. */
export function scheduleDates(start:string, frequency:Frequency, from:string, to:string, endDate?:string): string[] {
  const origin=parse(start);
  if(!origin||!parse(from)||!parse(to)||from>to) return [];
  const ceiling=endDate && parse(endDate) && endDate<to?endDate:to;
  const dates:string[]=[];
  for(let n=0;n<400;n++) {
    let next:Date;
    if(frequency==="once"||frequency==="irregular"){if(n>0)break;next=origin;}
    else if(frequency==="daily"||frequency==="weekly"||frequency==="biweekly")
      next=plusDays(origin,n*(frequency==="daily"?1:frequency==="weekly"?7:14));
    else next=plusMonthsAnchored(origin,n*(frequency==="monthly"?1:frequency==="quarterly"?3:12));
    const day=iso(next);
    if(day>ceiling)break;
    if(day>=from) dates.push(day);
    if(dates.length>=120)break;
  }
  return dates;
}
export const monthlyEquivalent = (income:IncomeSource):number => {
  if(!Number.isFinite(income.amount)||income.amount<0) return 0;
  const rate:Record<Frequency,number> = {
    daily:365/12,weekly:52/12,biweekly:26/12,monthly:1,quarterly:1/3,
    yearly:1/12,once:0,irregular:0
  };
  return income.amount*rate[income.frequency];
};
export const roundJod=(n:number)=>Math.round((n+Number.EPSILON)*100)/100;
export const monthlyTotal=(items:IncomeSource[])=>roundJod(items.reduce((sum,s)=>sum+monthlyEquivalent(s),0));
export const legacyIncome = (income:number):IncomeSource[] => income>0 ? [{
  id:"legacy-monthly-income", name:"Existing monthly household income",amount:income,
  frequency:"monthly",nextDate:"",shared:true
}] : [];
export type FlowEvent = {
  key:string; sourceId:string; date:string; displayDate:string;
  name:string; kind:"income"|"bill"; amount:number; overdue:boolean; variable?:boolean;
};
export type Forecast = {
  events:FlowEvent[]; expectedIncome:number; upcomingBills:number; safeToSpend:number|null;
  minimumBalance:number|null; projectedEnd:number|null; nextIncome:string|null;
  advice:string[]; overdueCount:number; missingDates:number;
};
export function buildForecast(input:{
  incomes:IncomeSource[]; commitments:Commitment[]; openingBalance:number|null; reserve:number;
  today:string; days?:number;
  /** Recorded partial instalments for the specific scheduled due date. */
  billPayments?:readonly {billId?:string;dueDate?:string;amount:number;status?:"paid"|"planned"}[];
}):Forecast {
  const horizon=Math.min(90,Math.max(7,input.days??30));
  const today=input.today,end=futureDate(today,horizon);
  const since=futureDate(today,-45);
  const events:FlowEvent[]=[];
  const missingDates=input.incomes.filter(item=>!parse(item.nextDate)).length+
    input.commitments.filter(item=>!parse(item.dueDate)).length;
  for(const i of input.incomes) {
    if(!parse(i.nextDate))continue;
    for(const date of scheduleDates(i.nextDate,i.frequency,today,end,i.endDate)){
      if(i.receivedDates?.includes(date))continue;
      events.push({key:"income:"+i.id+":"+date,sourceId:i.id,date,displayDate:date,name:i.name,
        kind:"income",amount:i.amount,overdue:false,...(i.variable?{variable:true}:{})});
    }
  }
  for(const bill of input.commitments){
    if(!parse(bill.dueDate))continue;
    for(const dueDate of scheduleDates(bill.dueDate,bill.frequency,since,end,bill.endDate)){
      if(bill.paidDates?.includes(dueDate))continue;
      const alreadyPaid=roundJod((input.billPayments??[]).filter(p=>p.billId===bill.id&&p.dueDate===dueDate&&p.status!=="planned")
       .reduce((sum,p)=>sum+(Number.isFinite(p.amount)&&p.amount>0?p.amount:0),0));
      const remaining=roundJod(Math.max(0,bill.amount-alreadyPaid));
      if(remaining<=0)continue;
      const overdue=dueDate<today;
      events.push({key:"bill:"+bill.id+":"+dueDate,sourceId:bill.id,
        date:overdue?today:dueDate,displayDate:dueDate,name:bill.name,
        kind:"bill",amount:remaining,overdue});
    }
  }
  events.sort((a,b)=>a.date.localeCompare(b.date)|| (a.kind==="bill"?-1:1)-(b.kind==="bill"?-1:1));
  const expectedIncome=roundJod(events.filter(e=>e.kind==="income").reduce((n,e)=>n+e.amount,0));
  const upcomingBills=roundJod(events.filter(e=>e.kind==="bill").reduce((n,e)=>n+e.amount,0));
  const cash=input.openingBalance !== null && Number.isFinite(input.openingBalance) ? input.openingBalance:null;
  const reserve=Math.max(0,input.reserve||0);
  const safeToSpend=cash===null?null:Math.max(0,roundJod(cash-upcomingBills-reserve));
  let running=cash,minimumBalance=cash;
  for(const e of events){
    if(running===null)break;
    running+=e.kind==="income"?e.amount:-e.amount;
    if(minimumBalance!==null)minimumBalance=Math.min(minimumBalance,running);
  }
  const projectedEnd=running===null?null:roundJod(running);
  const overdueCount=events.filter(e=>e.kind==="bill"&&e.overdue).length;
  const nextIncome=events.find(e=>e.kind==="income")?.date??null;
  const advice:string[]=[];
  if(cash===null) advice.push("Enter today's actual cash balance to enable Safe to Spend and shortage warnings.");
  if(input.incomes.length===0)advice.push("Add an income source and its expected payment date.");
  if(missingDates>0)advice.push(missingDates+" income or bill schedule(s) need a valid date; excluded from forecast.");
  if(input.commitments.length===0)advice.push("Add due dates for bills to make the forecast useful. Categories alone aren't scheduled payments.");
  if(overdueCount>0)advice.push(overdueCount+" bill installment(s) are overdue or unconfirmed.");
  if(minimumBalance!==null&&minimumBalance<0)advice.push("Warning: forecast cash shortage of "+roundJod(-minimumBalance).toFixed(2)+" JOD. Consider rescheduling a flexible cost or verifying expected income.");
  if(cash!==null&&safeToSpend===0&&minimumBalance!==null&&minimumBalance>=0)advice.push("No uncommitted amount available under the conservative Safe to Spend rule.");
  if(input.incomes.some(e=>e.variable))advice.push("Variable income is an estimate, not a guaranteed payment.");
  return {events,expectedIncome,upcomingBills,safeToSpend,
    minimumBalance:minimumBalance===null?null:roundJod(minimumBalance),
    projectedEnd, nextIncome,advice,overdueCount,missingDates};
}
