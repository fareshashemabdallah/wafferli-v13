import {useEffect,useState,type FormEvent} from "react";
import {X} from "lucide-react";
import {useI18n} from "@/lib/i18n";
import {localToday,legacyIncome,monthlyTotal,roundJod,type Frequency} from "@/lib/cashflow";
import {parseCalendarDate} from "@/lib/familyCalendar";
import {uid} from "@/lib/storage";
import type {MoneyState} from "@/lib/money";

export type QuickMoneyEditor="income"|"bill"|"cash";
type Props={kind:QuickMoneyEditor;state:MoneyState;
 setState:(fn:(current:MoneyState)=>MoneyState)=>void;onClose:()=>void};
const frequencyOptions:Frequency[]=["once","weekly","biweekly","monthly","quarterly","yearly"];
const numeric=(s:string,allowZero=false)=>/^(?:\d{1,6})(?:\.\d{1,2})?$/.test(s.trim())&&
 Number(s)<=(allowZero?1000000:100000)&&(allowZero?Number(s)>=0:Number(s)>0);
const frame="mt-1 min-h-11 w-full rounded-xl border border-[#DCE8D9] bg-white px-3 py-2 text-sm text-[#335440] focus-visible:ring-2 focus-visible:ring-[#4F9E70]";
const label="block text-xs font-bold text-[#58735E]";
export function FamilyMoneyQuickEdit({kind,state,setState,onClose}:Props){
 const {lang}=useI18n(),ar=lang==="ar",t=(en:string,a:string)=>ar?a:en;
 const source=state.incomeSources??legacyIncome(state.income),bills=state.commitments??[];
 const [picked,setPicked]=useState("");
 const record=kind==="income"?source.find(x=>x.id===picked):kind==="bill"?bills.find(x=>x.id===picked):undefined;
 const [name,setName]=useState(record?.name??"");
 const [amount,setAmount]=useState(record?String(record.amount):"");
 const [date,setDate]=useState(kind==="income"&&record?"nextDate" in record?record.nextDate:"":kind==="bill"&&record?"dueDate" in record?record.dueDate:"":"");
 const [frequency,setFrequency]=useState<Frequency>(record?.frequency??"monthly");
 const [variable,setVariable]=useState(false);
 const [balance,setBalance]=useState(state.cashOnHand==null?"":String(state.cashOnHand));
 const [reserve,setReserve]=useState(String(state.cashReserve??0));
 const [error,setError]=useState("");
 useEffect(()=>{
  const current=kind==="income"?source.find(x=>x.id===picked):kind==="bill"?bills.find(x=>x.id===picked):undefined;
  setName(current?.name??"");setAmount(current?String(current.amount):"");
  setDate(current?(kind==="income"&&"nextDate" in current?current.nextDate:
   kind==="bill"&&"dueDate" in current?current.dueDate:""):"");
  setFrequency(current?.frequency??"monthly");
  setVariable(current&&"variable" in current?!!current.variable:false);
  setError("");
 // Reinitialization must occur on selection changes, not on state updates.
 // eslint-disable-next-line react-hooks/exhaustive-deps
 },[kind,picked]);
 const onSave=(event:FormEvent)=>{
  event.preventDefault();
  if(state.demo){setError(t("Start with real Money before editing schedules.","ابدأ بمالية فعلية قبل تعديل الجداول."));return;}
  if(kind==="cash"){
   if((balance.trim()&&!numeric(balance,true))||!numeric(reserve,true)){
    setError(t("Enter valid nonnegative cash and reserve amounts.","أدخل سيولة واحتياطي بأرقام موجبة أو صفر."));return;
   }
   setState(old=>({...old,cashOnHand:balance.trim()?roundJod(Number(balance)):null,
    cashReserve:roundJod(Number(reserve)),cashUpdatedAt:balance.trim()?localToday():undefined}));
   onClose();return;
  }
  if(name.trim().length<2||name.trim().length>60||!numeric(amount)||!parseCalendarDate(date)){
   setError(t("Enter a name, positive amount and valid calendar date.","أدخل اسم ومبلغ موجب وتاريخ صحيح."));return;
  }
  const value=roundJod(Number(amount)),recordId=picked||uid();
  if(kind==="income"){
   setState(old=>{
    const existing=old.incomeSources??legacyIncome(old.income);
    const prior=existing.find(x=>x.id===recordId);
    const item={...(prior??{id:recordId,shared:false}),id:recordId,name:name.trim(),amount:value,
     nextDate:date,frequency,variable};
    const incomeSources=prior?existing.map(x=>x.id===recordId?item:x):[...existing,item];
    return {...old,incomeSources,income:monthlyTotal(incomeSources),incomeKnown:true};
   });
  }else{
   setState(old=>{
    const existing=old.commitments??[];
    const prior=existing.find(x=>x.id===recordId);
    const item={...(prior??{id:recordId}),id:recordId,name:name.trim(),amount:value,
     dueDate:date,frequency};
    return {...old,commitments:prior?existing.map(x=>x.id===recordId?item:x):[...existing,item]};
   });
  }
  onClose();
 };
 const heading=kind==="income"?t("Income and paydays","الدخل ومواعيد الرواتب"):
  kind==="bill"?t("Bills and due dates","الفواتير ومواعيد الاستحقاق"):
  t("Cash and safety reserve","السيولة والاحتياطي");
 return <div className="fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto bg-[#19392B]/65 p-3"
   role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget)onClose();}}>
   <section className="max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-[1.5rem] bg-[#FBFDF8] p-4 shadow-2xl sm:p-6"
    role="dialog" aria-modal="true" aria-label={heading}>
    <header className="flex items-start justify-between gap-3">
     <div><p className="text-[11px] font-extrabold tracking-wide text-[#50926D]">{t("FAMILY MONEY","مال العيلة")}</p>
      <h2 className="mt-1 text-lg font-black text-[#2F6548]">{heading}</h2>
      <p className="mt-1 text-xs text-[#778779]">{kind==="cash"?
       t("This balance is entered by you; it is not verified by a bank.","هذا الرصيد أنت مدخله، مش مؤكد من البنك."):
       t("A date in your plan is not confirmation of payment or receipt.","التاريخ بالخطة ما بيأكد استلام أو دفع أي مبلغ.")}</p></div>
     <button aria-label={t("Close","إغلاق")} className="grid size-10 shrink-0 place-items-center rounded-full bg-[#EBF2E9] text-[#356349]"
      onClick={onClose} type="button"><X className="size-5"/></button>
    </header>
    <form onSubmit={onSave} className="mt-4 space-y-3">
     {kind!=="cash"&&<>
      <label className={label}>{t("Choose an existing entry or add new","اختر سجل موجود أو أضف جديد")}
       <select className={frame} value={picked} onChange={e=>setPicked(e.target.value)}>
        <option value="">{kind==="income"?t("New income source","دخل جديد"):t("New bill","فاتورة جديدة")}</option>
        {(kind==="income"?source:bills).map(x=><option key={x.id} value={x.id}>{x.name}</option>)}
       </select>
      </label>
      <label className={label}>{kind==="income"?t("Income source","مصدر الدخل"):t("Payment name","اسم الدفعة")}
       <input className={frame} maxLength={60} value={name} placeholder={t("Enter a name","أدخل الاسم")}
        onChange={e=>setName(e.target.value)}/></label>
      <div className="grid grid-cols-2 gap-2">
       <label className={label}>{t("Amount (JOD)","المبلغ (دينار)")}
        <input className={frame} inputMode="decimal" type="number" min="0.01" max="100000" step=".01"
         value={amount} onChange={e=>setAmount(e.target.value)}/></label>
       <label className={label}>{kind==="income"?t("Next expected date","موعد الاستلام المتوقع"):t("Next due date","موعد الاستحقاق")}
        <input className={frame} type="date" value={date} onChange={e=>setDate(e.target.value)}/></label>
      </div>
      <label className={label}>{t("How often?","قديش بيتكرر؟")}
       <select className={frame} value={frequency} onChange={e=>setFrequency(e.target.value as Frequency)}>
        {frequencyOptions.map(v=><option key={v} value={v}>{t(
         ({once:"Once",weekly:"Weekly",biweekly:"Every two weeks",monthly:"Monthly",quarterly:"Quarterly",yearly:"Yearly"} as Record<string,string>)[v]??v,
         ({once:"مرة واحدة",weekly:"أسبوعياً",biweekly:"كل أسبوعين",monthly:"شهرياً",quarterly:"كل ثلاثة أشهر",yearly:"سنوياً"} as Record<string,string>)[v]??v)}</option>)}
       </select>
      </label>
      {kind==="income"&&<label className="flex min-h-11 items-center gap-2 text-xs font-bold text-[#5E7764]">
       <input type="checkbox" className="size-4 accent-[#39835A]" checked={variable} onChange={e=>setVariable(e.target.checked)}/>
       {t("Amount may vary (estimate only)","المبلغ ممكن يتغير (تقديري)")}</label>}
     </>}
     {kind==="cash"&&<div className="grid grid-cols-2 gap-2">
       <label className={label}>{t("Cash available now (JOD)","السيولة الموجودة حالياً")}
        <input className={frame} type="number" min="0" max="1000000" step=".01"
         value={balance} placeholder={t("Unknown","غير معروف")} onChange={e=>setBalance(e.target.value)}/></label>
       <label className={label}>{t("Reserve to protect (JOD)","الاحتياطي المطلوب حمايته")}
        <input className={frame} type="number" min="0" max="1000000" step=".01"
         value={reserve} onChange={e=>setReserve(e.target.value)}/></label>
      </div>}
     {error&&<p role="alert" className="rounded-xl bg-[#FFF0F1] p-3 text-xs font-bold text-[#AF5361]">{error}</p>}
     <p className="rounded-xl border border-[#DFE9DC] bg-[#F1F8ED] p-3 text-[11px] leading-relaxed text-[#718473]">
      {t("Saving updates the same household record. It does not make a payment, confirm income received, or move money.",
       "الحفظ بيحدّث نفس سجل العيلة، وما بيعمل دفعة أو بيأكد استلام الدخل أو بيحرّك أي مبلغ.")}</p>
     <div className="flex gap-2">
      <button type="submit" className="min-h-11 flex-1 rounded-xl bg-[#3C9063] px-4 text-sm font-bold text-white">
       {t("Save and update outlook","احفظ وحدّث التوقع")}</button>
      <button type="button" onClick={onClose} className="min-h-11 rounded-xl border border-[#D5E3D6] bg-white px-4 text-xs font-bold">{t("Cancel","إلغاء")}</button>
     </div>
    </form>
   </section>
  </div>;
}
