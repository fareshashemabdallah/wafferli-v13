import { useI18n } from "@/lib/i18n";
import { useEffect, useState, type FormEvent } from "react";
import { CalendarClock, Check, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Field, NativeSelect, inputCls } from "./Field";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { type Member, type MoneyState } from "@/lib/money";
import {
  type IncomeSource, type Commitment, type Frequency,
  buildForecast, frequencyNames, futureDate, legacyIncome,
  localToday, monthlyTotal, roundJod, scheduleDates,
} from "@/lib/cashflow";
import { fmtJOD, uid } from "@/lib/storage";

type Props = {
  state: MoneyState; members: Member[];
  update: (fn: (current:MoneyState)=>MoneyState) => void;
};
const keys=Object.keys(frequencyNames) as Frequency[];
const blankIncome=():IncomeSource=>({id:"",name:"",amount:0,frequency:"monthly",nextDate:"",shared:true});
const blankBill=():Commitment=>({id:"",name:"",amount:0,frequency:"monthly",dueDate:""});
const fmt=(d:string)=>d || "Date needed";
const positive=(str:string)=>/^(?:\d{1,6})(?:\.\d{1,2})?$/.test(str.trim()) && Number(str)>0 && Number(str)<=100000;
const nonnegative=(str:string)=>/^(?:\d{1,7})(?:\.\d{1,2})?$/.test(str.trim()) && Number(str)>=0 && Number(str)<=1000000;
const validDate=(str:string)=>/^\d{4}-\d{2}-\d{2}$/.test(str)&&!Number.isNaN(new Date(str+"T12:00:00").getTime());

export function CashFlowPlanner({state,members,update}:Props) {
  const { tr, lang } = useI18n();
  const ar=lang==="ar";
  const today=localToday();
  const incomes=state.incomeSources ?? legacyIncome(state.income);
  const bills=state.commitments ?? [];
  const forecast=buildForecast({incomes,commitments:bills,openingBalance:state.cashOnHand??null,
    reserve:state.cashReserve??0,today,days:30});
  const [cash,setCash]=useState(state.cashOnHand===null||state.cashOnHand===undefined?"":String(state.cashOnHand));
  const [reserve,setReserve]=useState(String(state.cashReserve??0));
  const [editIncome,setEditIncome]=useState<IncomeSource|null>(null);
  const [incomeAmount,setIncomeAmount]=useState("");
  const [editBill,setEditBill]=useState<Commitment|null>(null);
  const [billAmount,setBillAmount]=useState("");
  const [receipt,setReceipt]=useState<{sourceId:string;date:string;value:string}|null>(null);
  const [error,setError]=useState("");
  const [pendingPaid,setPendingPaid]=useState<{bill:Commitment;dueDate:string}|null>(null);
  useEffect(()=>setCash(state.cashOnHand==null?"":String(state.cashOnHand)),[state.cashOnHand]);
  useEffect(()=>setReserve(String(state.cashReserve??0)),[state.cashReserve]);

  const saveBalance=(event:FormEvent)=>{
    event.preventDefault();
    if(cash.trim()&&!nonnegative(cash))return setError(tr("Enter a valid current cash balance (0 to 1,000,000 JOD)."));
    if(!nonnegative(reserve))return setError(tr("Enter a valid nonnegative cash reserve."));
    update(s=>({...s,cashOnHand:cash.trim()?roundJod(Number(cash)):null,cashReserve:roundJod(Number(reserve)),cashUpdatedAt:cash.trim()?today:undefined}));
    setError("");toast.success(tr("Cash position updated"));
  };
  const saveIncome=(event:FormEvent)=>{
    event.preventDefault();
    if(!editIncome)return;
    if(!editIncome.name.trim())return setError(tr("Add a name for the income source."));
    if(!positive(incomeAmount))return setError(tr("Enter an income amount greater than zero (JOD)."));
    if(!validDate(editIncome.nextDate))return setError(tr("Choose the next expected payment date."));
    if(editIncome.endDate && (!validDate(editIncome.endDate)||editIncome.endDate<editIncome.nextDate))
      return setError(tr("End date must be on or after the first payment."));
    const item:IncomeSource={...editIncome,id:editIncome.id||uid(),name:editIncome.name.trim().slice(0,60),
      amount:roundJod(Number(incomeAmount))};
    update(s=>{
      const current=s.incomeSources ?? legacyIncome(s.income);
      const next=editIncome.id&&current.some(x=>x.id===editIncome.id)?
        current.map(x=>x.id===editIncome.id?item:x):[...current,item];
      return {...s,incomeSources:next,income:monthlyTotal(next)};
    });
    setError("");setEditIncome(null);toast.success(tr("Income schedule saved"));
  };
  const saveBill=(event:FormEvent)=>{
    event.preventDefault();
    if(!editBill)return;
    if(!editBill.name.trim())return setError(tr("Add a name for the bill or commitment."));
    if(!positive(billAmount))return setError(tr("Enter a bill amount greater than zero (JOD)."));
    if(!validDate(editBill.dueDate))return setError(tr("Choose a valid due date."));
    if(editBill.endDate && (!validDate(editBill.endDate)||editBill.endDate<editBill.dueDate))
      return setError("End date must be on or after the first due date.");
    const item:Commitment={...editBill,id:editBill.id||uid(),name:editBill.name.trim().slice(0,60),
      amount:roundJod(Number(billAmount))};
    update(s=>({...s,commitments:editBill.id?
      (s.commitments??[]).map(x=>x.id===editBill.id?item:x):[...(s.commitments??[]),item]}));
    setError("");setEditBill(null);toast.success(tr("Payment schedule saved"));
  };
  const confirmReceived=()=>{
    if(!receipt||!positive(receipt.value))return setError(tr("Enter the actual received amount, greater than zero."));
    update(s=>{
      const current=s.incomeSources??legacyIncome(s.income);
      const next=current.map(x=>x.id===receipt.sourceId?{
        ...x,receivedDates:[...new Set([...(x.receivedDates??[]),receipt.date])],
        receivedAmounts:{...(x.receivedAmounts??{}),[receipt.date]:roundJod(Number(receipt.value))}
      }:x);
      return {...s,incomeSources:next,income:monthlyTotal(next)};
    });
    setReceipt(null);setError("");toast.success(tr("Actual receipt recorded. Update your cash balance separately."));
  };
  const markPaid=(bill:Commitment,dueDate:string,cashMode:"already"|"deduct"|"untracked")=>{
    if(dueDate>today)return;
    if(cashMode==="deduct" && (state.cashOnHand==null||state.cashOnHand<bill.amount)){
      setError(ar?"المبلغ أكبر من الرصيد المدخل. حدّث رصيدك الفعلي أولاً.":"The payment exceeds the entered cash balance. Please update your actual balance first.");return;
    }
    update(s=>{
      const current=s.commitments??[];
      if(current.some(x=>x.id===bill.id&&x.paidDates?.includes(dueDate)))return s;
      const category=s.categories.find(c=>c.id===bill.categoryId)?.id??"uncategorized";
      return {...s,
        commitments:current.map(x=>x.id===bill.id?{...x,paidDates:[...(x.paidDates??[]),dueDate]}:x),
        expenses:[{id:uid(),date:today,categoryId:category,amount:bill.amount,note:bill.name,shared:true,billId:bill.id,dueDate},...s.expenses],
        ...(cashMode==="deduct"&&s.cashOnHand!=null?{cashOnHand:roundJod(s.cashOnHand-bill.amount),cashUpdatedAt:today}:{})
      };
    });
    setPendingPaid(null);setError("");
    toast.success(ar?"سُجلت الفاتورة المدفوعة مع المصروف.":"Bill marked paid and expense recorded.");
  };
  const undoPayment=(billId:string,date:string)=>{
    update(s=>({...s,
      commitments:(s.commitments??[]).map(b=>b.id===billId?{...b,paidDates:(b.paidDates??[]).filter(x=>x!==date)}:b),
      expenses:s.expenses.filter(e=>!(e.billId===billId&&e.dueDate===date))
    }));
    toast.success(tr("Payment confirmation and linked expense reverted"));
  };
  const dueIncome=incomes.flatMap(i=>
    scheduleDates(i.nextDate,i.frequency,futureDate(today,-45),today,i.endDate)
      .filter(date=>!i.receivedDates?.includes(date))
      .map(date=>({source:i,date}))
  ).sort((a,b)=>b.date.localeCompare(a.date));
  const outstanding=roundJod(dueIncome.reduce((sum,x)=>sum+x.source.amount,0));
  const received=roundJod(incomes.reduce((sum,i)=>sum+
    (i.receivedDates??[]).filter(d=>d.startsWith(today.slice(0,7))).reduce((a,d)=>a+(i.receivedAmounts?.[d]??i.amount),0),0));
  const futureIncome=forecast.events.filter(e=>e.kind==="income");
  const upcomingBills=forecast.events.filter(e=>e.kind==="bill");
  const totalsReady=state.cashOnHand!==null&&state.cashOnHand!==undefined;
  return (
    <div className="space-y-4" id="cash-flow">
      <section className="card-soft mt-6 p-4 sm:p-5">
        <div className="flex items-center gap-2"><CalendarClock className="size-5 text-brand"/>
          <h2 className="text-lg font-semibold">{tr("Cash flow · التدفق النقدي")}</h2>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          {tr("Understand when money actually comes in and when bills are due. Estimates are based on dates you enter; not connected to banks.")}
        </p>
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Metric label={tr("Available now")} value={totalsReady?fmtJOD(state.cashOnHand!):tr("Not set")} />
          <Metric label={tr("Expected next 30 days")} value={fmtJOD(forecast.expectedIncome)} />
          <Metric label={tr("Bills next 30 days")} value={fmtJOD(forecast.upcomingBills)} />
          <Metric label={tr("Safe to spend now")} value={forecast.safeToSpend===null?tr("Not ready"):fmtJOD(forecast.safeToSpend)}
            warning={forecast.safeToSpend===0&&totalsReady}/>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          {tr("Safe to Spend = today's cash minus bills due within 30 days and your reserve; future salaries are")} <strong>{tr("not")}</strong> {tr("counted as cash yet. Already-paid expenses must be reflected in your entered cash balance.")} </p>
        <form onSubmit={saveBalance} className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <Field label={tr("Cash available now (JOD)")} hint={tr("Bank + cash balance as of today; manual")}>
            <Input inputMode="decimal" className={inputCls} value={cash} onChange={e=>setCash(e.target.value)} placeholder={tr("e.g. 750")} />
          </Field>
          <Field label={tr("Safety reserve (JOD)")} hint={tr("Protected emergency buffer")}>
            <Input inputMode="decimal" className={inputCls} value={reserve} onChange={e=>setReserve(e.target.value)} />
          </Field>
          <Button type="submit" className="h-11">{tr("Update balance")}</Button>
        </form>
        {forecast.advice.length>0&&<div className="mt-3 space-y-1 rounded-xl bg-muted px-3 py-3">
          {forecast.advice.slice(0,4).map(text=><p key={text} className="text-xs text-muted-foreground">• {tr(text)}</p>)}
        </div>}
      </section>

      <section className="card-soft p-4">
        <div className="flex items-center justify-between gap-2">
          <div><h2 className="font-semibold">{tr("Income schedule · مصادر الدخل")}</h2>
            <p className="text-xs text-muted-foreground">{tr("Received this month:")} {fmtJOD(received)}</p></div>
          <Button size="sm" onClick={()=>{setEditIncome(blankIncome());setIncomeAmount("");setError("");}}>
            <Plus className="size-4"/> {tr("Add income")} </Button>
        </div>
        {state.incomeSources===undefined&&state.income>0&&<p className="mt-2 rounded-lg bg-muted p-2 text-xs">
          {tr("Your existing monthly income")} ({fmtJOD(state.income)}) {tr("is preserved. Edit it to set its next payment date. Until then it's excluded from the dated cash-flow forecast.")}
        </p>}
        {editIncome&&<form onSubmit={saveIncome} className="mt-3 space-y-3 rounded-xl border bg-muted/40 p-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label={tr("Source name")}><Input className={inputCls} maxLength={60} value={editIncome.name}
              onChange={e=>setEditIncome({...editIncome,name:e.target.value})} placeholder={tr("Salary, freelance, rent...")} /></Field>
            <Field label={tr("Amount (JOD)")}><Input className={inputCls} inputMode="decimal" value={incomeAmount}
              onChange={e=>setIncomeAmount(e.target.value)} placeholder={tr("e.g. 1200")} /></Field>
            <Field label={tr("Frequency")}><NativeSelect value={editIncome.frequency}
              onChange={e=>setEditIncome({...editIncome,frequency:e.target.value as Frequency})}>
              {keys.map(key=><option key={key} value={key}>{tr(frequencyNames[key])}</option>)}
            </NativeSelect></Field>
            <Field label={tr("Next expected date")}><Input className={inputCls} type="date" value={editIncome.nextDate}
              onChange={e=>setEditIncome({...editIncome,nextDate:e.target.value})} /></Field>
          </div>
          <details className="rounded-lg bg-card p-3 text-sm">
            <summary className="cursor-pointer font-medium">{tr("More details (optional)")}</summary>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Field label={tr("Income owner")}>
                <NativeSelect value={editIncome.owner??""} onChange={e=>{
                  const copy={...editIncome}; if(e.target.value)copy.owner=e.target.value;else delete copy.owner;setEditIncome(copy);
                }}><option value="">{tr("Not specified")}</option>{members.filter(m=>m.role==="adult").map(m=><option key={m.id} value={m.name}>{m.name}</option>)}</NativeSelect>
              </Field>
              <Field label={tr("End date, if applicable")}><Input className={inputCls} type="date" value={editIncome.endDate??""}
                onChange={e=>{const copy={...editIncome};if(e.target.value)copy.endDate=e.target.value;else delete copy.endDate;setEditIncome(copy);}} /></Field>
              <Field label={tr("Income reliability")}><NativeSelect value={editIncome.variable?"variable":"fixed"}
                onChange={e=>setEditIncome({...editIncome,variable:e.target.value==="variable"})}>
                <option value="fixed">{tr("Fixed / usual amount")}</option><option value="variable">{tr("Estimated / varies")}</option>
              </NativeSelect></Field>
              <Field label={tr("Privacy label")}><NativeSelect value={editIncome.shared?"shared":"private"}
                onChange={e=>setEditIncome({...editIncome,shared:e.target.value==="shared"})}>
                <option value="shared">{tr("Shared household")}</option><option value="private">{tr("Private")}</option>
              </NativeSelect></Field>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">{tr("Privacy labels are organizational in this device-only pilot; real multi-user access control is not yet implemented.")}</p>
          </details>
          <div className="flex gap-2"><Button type="submit">{tr("Save income")}</Button>
            <Button type="button" variant="outline" onClick={()=>{setEditIncome(null);setError("");}}>{tr("Cancel")}</Button></div>
        </form>}
        {incomes.length===0&&<p className="mt-3 text-sm text-muted-foreground">{tr("Add your first income source to start planning.")}</p>}
        <div className="mt-2 divide-y">
          {incomes.map(item=>{
            const next=forecast.events.find(e=>e.kind==="income"&&e.sourceId===item.id);
            const recent=dueIncome.filter(x=>x.source.id===item.id).slice(0,2);
            const lastConfirmed=(item.receivedDates??[]).filter(d=>d<=today).sort().at(-1);
            return <div key={item.id} className="py-3 text-sm">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0"><p className="font-semibold">{tr(item.name)}</p>
                  <p className="text-xs text-muted-foreground">{fmtJOD(item.amount)} · {tr(frequencyNames[item.frequency])} · {item.owner??tr(item.shared?"Household":"Private")}</p>
                  <p className="text-xs text-muted-foreground">
                    {tr("Next forecast:")} {next?next.date:tr(item.nextDate?"No future payment in next 30 days":"Date needed")}
                    {lastConfirmed?" · "+tr("Last received:")+" "+lastConfirmed:""}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button type="button" variant="ghost" size="icon" aria-label={"Edit "+item.name}
                    onClick={()=>{setEditIncome(item);setIncomeAmount(String(item.amount));setError("");}}><Pencil className="size-4"/></Button>
                  <Button type="button" variant="ghost" size="icon" aria-label={"Delete "+item.name}
                    onClick={()=>{if(confirm(tr("Delete income schedule?")))update(s=>{
                      const remaining=(s.incomeSources??legacyIncome(s.income)).filter(x=>x.id!==item.id);
                      return {...s,incomeSources:remaining,income:monthlyTotal(remaining)};
                    });}}><Trash2 className="size-4"/></Button>
                </div>
              </div>
              {recent.length>0&&<div className="mt-2 space-y-2">
                {recent.map(({date})=><div key={date} className="flex flex-wrap items-center gap-2 rounded-lg bg-muted p-2">
                  <span className="flex-1 text-xs">{tr(date<today?"Outstanding":"Expected today")} · {date}</span>
                  {receipt?.sourceId===item.id&&receipt.date===date?
                    <><Input aria-label={tr("Actual income received (JOD)")} className="h-9 w-28" inputMode="decimal"
                        value={receipt.value} onChange={e=>setReceipt({...receipt,value:e.target.value})}/>
                      <Button type="button" size="sm" onClick={confirmReceived}>{tr("Confirm")}</Button>
                      <Button type="button" size="sm" variant="ghost" onClick={()=>setReceipt(null)}>{tr("Cancel")}</Button></>:
                    <Button type="button" size="sm" variant="secondary" onClick={()=>setReceipt({sourceId:item.id,date,value:String(item.amount)})}>
                      <Check className="size-3.5"/> {tr("Received")} </Button>}
                </div>)}
              </div>}
            </div>;
          })}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          {tr("Outstanding income in the last 45 days:")} {fmtJOD(outstanding)}.
          Confirm each receipt with its <em>{tr("actual")}</em> {tr("amount. Expected deposits are not credited to your cash balance automatically.")} </p>
      </section>

      <section className="card-soft p-4">
        <div className="flex items-center justify-between gap-2">
          <div><h2 className="font-semibold">{tr("Upcoming bills · الالتزامات")}</h2>
            <p className="text-xs text-muted-foreground">{tr("Add due dates for rent, utilities, school or other commitments.")}</p></div>
          <Button size="sm" onClick={()=>{setEditBill(blankBill());setBillAmount("");setError("");}}><Plus className="size-4"/> {tr("Add bill")}</Button>
        </div>
        {editBill&&<form onSubmit={saveBill} className="mt-3 space-y-3 rounded-xl border bg-muted/40 p-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label={tr("Bill name")}><Input className={inputCls} maxLength={60} value={editBill.name}
              onChange={e=>setEditBill({...editBill,name:e.target.value})} placeholder={tr("Rent, electricity, school...")} /></Field>
            <Field label={tr("Amount (JOD)")}><Input className={inputCls} inputMode="decimal" value={billAmount}
              onChange={e=>setBillAmount(e.target.value)} /></Field>
            <Field label={tr("Frequency")}><NativeSelect value={editBill.frequency}
              onChange={e=>setEditBill({...editBill,frequency:e.target.value as Frequency})}>
              {keys.map(key=><option key={key} value={key}>{tr(frequencyNames[key])}</option>)}
            </NativeSelect></Field>
            <Field label={tr("Next due date")}><Input className={inputCls} type="date" value={editBill.dueDate}
              onChange={e=>setEditBill({...editBill,dueDate:e.target.value})}/></Field>
          </div>
          <details className="rounded-lg bg-card p-3 text-sm"><summary className="cursor-pointer font-medium">{tr("More details (optional)")}</summary>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Field label={tr("Spending category")}><NativeSelect value={editBill.categoryId??""} onChange={e=>{
                const copy={...editBill};if(e.target.value)copy.categoryId=e.target.value;else delete copy.categoryId;setEditBill(copy);
              }}><option value="">{tr("Uncategorized")}</option>{state.categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</NativeSelect></Field>
              <Field label={tr("End date")}><Input className={inputCls} type="date" value={editBill.endDate??""}
                onChange={e=>{const copy={...editBill};if(e.target.value)copy.endDate=e.target.value;else delete copy.endDate;setEditBill(copy);}}/></Field>
            </div>
          </details>
          <div className="flex gap-2"><Button type="submit">{tr("Save bill")}</Button>
            <Button type="button" variant="outline" onClick={()=>{setEditBill(null);setError("");}}>{tr("Cancel")}</Button></div>
        </form>}
        {bills.length===0&&<p className="mt-3 text-sm text-muted-foreground">{tr("No scheduled bills. Planned categories above do not automatically create due dates.")}</p>}
        <div className="mt-2 divide-y">
          {bills.map(bill=>{
            const next=upcomingBills.find(e=>e.sourceId===bill.id);
            const paid=(bill.paidDates??[]).filter(d=>d>=futureDate(today,-45)&&d<=today).sort().reverse().slice(0,1);
            return <div key={bill.id} className="py-3 text-sm">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0"><p className="font-semibold">{tr(bill.name)}</p>
                  <p className="text-xs text-muted-foreground">{fmtJOD(bill.amount)} · {tr(frequencyNames[bill.frequency])}</p>
                  <p className="text-xs text-muted-foreground">{tr("Next due:")} {next?.displayDate??(bill.dueDate||tr("Date needed"))}
                    {next?.overdue?" · "+tr("Overdue"):""}</p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button type="button" variant="ghost" size="icon" aria-label={"Edit "+bill.name} onClick={()=>{setEditBill(bill);setBillAmount(String(bill.amount));setError("");}}><Pencil className="size-4"/></Button>
                  <Button type="button" variant="ghost" size="icon" aria-label={"Delete "+bill.name}
                    onClick={()=>{if(confirm(tr("Delete this bill schedule? Already recorded expenses stay in your history.")))update(s=>({...s,commitments:(s.commitments??[]).filter(x=>x.id!==bill.id)}));}}><Trash2 className="size-4"/></Button>
                </div>
              </div>
              {next && next.displayDate<=today && <Button type="button" className="mt-2" size="sm" variant="secondary"
                onClick={()=>markPaid(bill,next.displayDate)}><Check className="size-3.5"/> {tr("Mark paid & log expense")}</Button>}
              {paid.map(date=><button key={date} type="button" className="mt-2 block text-xs text-brand underline"
                onClick={()=>{if(confirm(tr("Undo this payment? Its linked expense will also be removed.")))undoPayment(bill.id,date);}}>
                {tr("Paid")} {date} · {tr("Undo")}
              </button>)}
            </div>;
          })}
        </div>
      </section>

      <section className="card-soft p-4">
        <h2 className="font-semibold">{tr("Your next 30 days · التدفق المتوقع")}</h2>
        <p className="mt-1 text-xs text-muted-foreground">{tr("Projected end balance:")} {forecast.projectedEnd===null?tr("Set today's actual cash balance"):fmtJOD(forecast.projectedEnd)}. {tr("Future income is expected, not yet received.")}</p>
        {forecast.events.length===0&&<p className="mt-3 text-sm text-muted-foreground">{tr("Add expected payment and bill due dates to see a cash-flow timeline.")}</p>}
        <div className="mt-3 divide-y">
          {forecast.events.slice(0,20).map(e=><div key={e.key} className="flex items-center gap-3 py-2 text-sm">
            <span className="w-24 shrink-0 text-xs text-muted-foreground">{e.overdue?tr("Overdue")+" "+e.displayDate:e.date}</span>
            <span className="min-w-0 flex-1 truncate">{e.name}{e.variable?" ("+tr("estimate")+")":""}</span>
            <span className={"shrink-0 font-semibold tabular-nums "+(e.kind==="income"?"text-emerald-700 dark:text-emerald-300":"")}>
              {e.kind==="income"?"+":"−"}{fmtJOD(e.amount)}
            </span>
          </div>)}
        </div>
        {forecast.events.length>20&&<p className="mt-2 text-xs text-muted-foreground">{tr("Showing")} 20 {tr("of")} {forecast.events.length} {tr("events.")}</p>}
        <p className="mt-3 text-xs text-muted-foreground">
          {tr("Rule-based advisory only; no bank access, AI financial advice or automatic balance reconciliation. You must update your available cash after real receipts and payments.")}
        </p>
      </section>
      {error&&<p className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive" role="alert">{error}</p>}
    </div>
  );
}
function Metric({label,value,warning=false}:{label:string;value:string;warning?:boolean}){
  const { tr } = useI18n();
  return <div className="rounded-xl bg-muted p-3">
    <p className="text-xs text-muted-foreground">{label}</p>
    <p className={"mt-1 font-semibold tabular-nums "+(warning?"text-destructive":"")}>{value}</p>
  </div>;
}
