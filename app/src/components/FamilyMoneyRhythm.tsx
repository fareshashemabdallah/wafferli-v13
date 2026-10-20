import {useState,type FormEvent} from "react";
import {ChevronRight,Eye,EyeOff,Plus,ShieldCheck} from "lucide-react";
import {useI18n} from "@/lib/i18n";
import {useLocalState,fmtJOD,uid} from "@/lib/storage";
import {FAMILY_PLANS_KEY,type FamilyPlan} from "@/lib/familyPlans";
import {type MoneyState} from "@/lib/money";
import {computeMoney} from "@/lib/money";
import {futureDate,localToday,legacyIncome} from "@/lib/cashflow";
import {buildFamilyMoneyRhythm,annualPreparation,paceAllowed,removeSpendingPace,upsertSpendingPace,
 type RhythmEvent,type SpendingPace} from "@/lib/familyMoneyRhythm";
import {parseCalendarDate} from "@/lib/familyCalendar";

type Props={state:MoneyState;setState:(next:MoneyState|((prev:MoneyState)=>MoneyState))=>void;
 onBills:()=>void;onSpending:()=>void;onCategories:()=>void};
const illustrations=[
 {test:/groc|food|supermarket|بقالة|مونة/i,emoji:"🥦",color:"#E9F6E5",name:"Groceries",ar:"المونة"},
 {test:/fuel|transport|car|بنزين|نقل/i,emoji:"🚘",color:"#FFF2D9",name:"Fuel",ar:"بنزين"},
 {test:/restaurant|dining|eat|مطعم/i,emoji:"🍕",color:"#FFE9F0",name:"Restaurants",ar:"المطاعم"},
 {test:/school|educ|child|درس|مدرسة|طفل/i,emoji:"🎒",color:"#F8E9F6",name:"Children",ar:"الأولاد"},
 {test:/rent|housing|home|سكن|بيت/i,emoji:"🏡",color:"#EAF1FF",name:"Home",ar:"السكن"},
 {test:/health|medicine|doctor|صحة|طب/i,emoji:"💗",color:"#FCECF3",name:"Health",ar:"الصحة"}
];
const validAmount=(s:string)=>/^\d{1,6}(?:\.\d{1,2})?$/.test(s.trim())&&Number(s)>0&&Number(s)<=100000;
const moneyColor=(v:number|null)=>v===null?"#526B5C":v<0?"#AD5365":"#307956";
const today=()=>localToday();
const soft="rounded-[1.3rem] border border-[#E0E8DB] bg-white px-4 py-4 shadow-[0_12px_30px_-30px_rgba(48,83,55,.28)]";
export function FamilyMoneyRhythm({state,setState,onBills,onSpending,onCategories}:Props){
 const {lang}=useI18n(),ar=lang==="ar",t=(e:string,a:string)=>ar?a:e;
 const [plans,,plansReady]=useLocalState<FamilyPlan[]>(FAMILY_PLANS_KEY,[]);
 const [screen,setScreen]=useState<"map"|"timeline"|"pace"|"annual">("map");
 const [days,setDays]=useState<7|30|90>(30);
 const [includeExpected,setIncludeExpected]=useState(true);
 const [showMoney,setShowMoney]=useState(false);
 const [selected,setSelected]=useState<string|null>(null);
 const [editingPace,setEditingPace]=useState<string|null>(null);
 const [paceStart,setPaceStart]=useState(today);
 const [paceInterval,setPaceInterval]=useState<SpendingPace["intervalDays"]>(7);
 const [annualOpen,setAnnualOpen]=useState(false);
 const [annualName,setAnnualName]=useState("");
 const [annualAmount,setAnnualAmount]=useState("");
 const [annualDate,setAnnualDate]=useState("");
 const [annualCat,setAnnualCat]=useState("");
 const [error,setError]=useState("");
 const [success,setSuccess]=useState("");
 const now=today();
 const forecast=buildFamilyMoneyRhythm(state,plansReady?plans:[],now,days,includeExpected);
 const fullThirty=buildFamilyMoneyRhythm(state,plansReady?plans:[],now,30,true);
 const annual=annualPreparation(state,now);
 const categories=state.categories;
 const summary=computeMoney(state);
 const income=state.incomeSources??legacyIncome(state.income);
 const incomeScheduled=income.some(i=>parseCalendarDate(i.nextDate));
 const report=(!state.demo&&forecast.cashStart!==null&&incomeScheduled&&forecast.missingDates===0)?
   forecast.firstReserveRiskDate?
    t("Your entered dates and estimated spending indicate possible cash pressure. Review essential obligations before committing to new purchases.",
      "المواعيد والمخصصات التي أدخلتها تشير لضغط محتمل على السيولة. راجع الالتزامات الأساسية قبل شراء جديد."):
    t("No shortfall against your entered reserve appears in this scenario. It is not a bank-confirmed spending allowance.",
      "ما ظهر عجز مقابل الاحتياطي المدخل بهالسيناريو، لكنه مش مبلغ مؤكد من البنك للصرف.") :
   t("Your financial picture is incomplete. Add today's cash, income dates and upcoming bills to make this timeline useful.",
     "الصورة المالية بعدها ناقصة. أدخل سيولة اليوم ومواعيد الدخل والفواتير لتصير التوقعات أدق.");
 const moneyLabel=(v:number|null)=>state.demo||!showMoney||v===null?t("Hidden / unknown","مخفي / غير معروف"):fmtJOD(v);
 const iconFor=(name:string)=>illustrations.find(x=>x.test.test(name))??{emoji:"🧾",color:"#ECF6EB",name:"Other",ar:"أخرى"};
 const registerPace=(e:FormEvent)=>{
  e.preventDefault();setError("");setSuccess("");
  if(!editingPace)return;
  const value:SpendingPace={categoryId:editingPace,intervalDays:paceInterval,nextDate:paceStart};
  const next=upsertSpendingPace(state,value);
  if(!next){setError(t("Add a positive monthly category allocation and valid future date first. This category must not already have a linked bill.",
   "لازم يكون للفئة مخصص شهري موجب وتاريخ صحيح، وما يكون مربوط فيها جدول فواتير."));return;}
  setState(next);setEditingPace(null);
  setSuccess(t("The spending pace was saved as a forecast only. No payments were created.","تم حفظ وتيرة صرف متوقعة فقط، من دون تسجيل أي دفعات."));
 };
 const saveAnnual=(e:FormEvent)=>{
  e.preventDefault();setError("");setSuccess("");
  if(state.demo){setError(t("Start real Money before saving annual obligations.","ابدأ ببيانات مال فعلية قبل حفظ الالتزامات السنوية."));return;}
  if(annualName.trim().length<2||!validAmount(annualAmount)||!parseCalendarDate(annualDate)||annualDate<now){
   setError(t("Enter a name, positive amount and a valid future due date.","أدخل الاسم والمبلغ الموجب وتاريخ استحقاق صحيح بالمستقبل."));return;}
  if(annualCat&&(state.commitments??[]).some(c=>c.categoryId===annualCat&&c.frequency!=="yearly")){
   setError(t("This category is already linked to another bill schedule. Choose another category or leave it unlinked.",
   "الفئة مربوطة بفاتورة أخرى. اختر فئة مختلفة أو اتركها بدون تصنيف."));return;}
  const id=uid(),amount=Math.round(Number(annualAmount)*100)/100;
  setState(prev=>({...prev,commitments:[...(prev.commitments??[]),{
   id,name:annualName.trim().slice(0,60),amount,frequency:"yearly",dueDate:annualDate,
   ...(annualCat?{categoryId:annualCat}:{})
  }]}));
  setAnnualOpen(false);setAnnualName("");setAnnualAmount("");setAnnualDate("");setAnnualCat("");
  setSuccess(t("Annual bill added once to your existing Bills. It is not recorded as paid.",
   "تمت إضافة الفاتورة السنوية مرة واحدة للفواتير الحالية، مش كمصروف مدفوع."));
 };
 const chart=()=>{
  if(state.demo||forecast.cashStart===null)return null;
  const coords=[{date:now,balance:forecast.cashStart},...forecast.events
    .filter(e=>e.projectedBalance!==null).map(e=>({date:e.date,balance:e.projectedBalance!}))];
  const values=coords.map(x=>x.balance),lo=Math.min(...values,forecast.reserveJod),hi=Math.max(...values,forecast.reserveJod);
  const spread=Math.max(1,hi-lo);
  const x=(d:string)=>18+Math.max(0,Math.min(days,Math.round((new Date(d+"T12:00:00").getTime()-new Date(now+"T12:00:00").getTime())/86400000)))/days*584;
  const y=(value:number)=>145-(value-lo)/spread*120;
  return <svg viewBox="0 0 625 177" role="img" aria-label={t("Forecast cash balance by scheduled date, with reserve line","توقع الرصيد حسب التواريخ مع خط الاحتياطي")}
   className="mt-3 w-full rounded-xl bg-[#F7FBF5]">
   <line x1="18" y1={y(forecast.reserveJod)} x2="605" y2={y(forecast.reserveJod)}
     stroke="#D59B65" strokeWidth="1.6" strokeDasharray="5 5"/>
   <text x="22" y={Math.max(11,y(forecast.reserveJod)-6)} fill="#9B7552" fontSize="11">{t("Reserve","الاحتياطي")}</text>
   <polyline points={coords.map(p=>x(p.date)+","+y(p.balance)).join(" ")}
    fill="none" stroke="#438F67" strokeWidth="3.3" strokeLinecap="round" strokeLinejoin="round"/>
   <text x="18" y="169" fill="#708778" fontSize="10">{now}</text>
   <text x="603" y="169" fill="#708778" fontSize="10" textAnchor="end">{futureDate(now,days)}</text>
  </svg>;
 };
 const timelineRow=(event:RhythmEvent)=><div key={event.id} className="flex items-center gap-3 border-b border-[#EDF0EA] px-3 py-3 last:border-0">
  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#F2F8EF] text-xl">
   {event.kind==="income"?"💵":event.kind==="pace"?iconFor(event.label).emoji:event.kind==="annual"?"🗓️":"🏠"}</span>
  <div className="min-w-0 flex-1">
   <p className="truncate text-sm font-semibold text-[#345544]">{event.label}</p>
   <p className="text-[11px] text-[#718174]">{event.date} · {event.kind==="income"?
    t("Expected, not bank-confirmed","متوقع ومش مؤكد بنكياً"):event.kind==="pace"?
    t("Suggested spending, not paid","صرف مقترح مش مدفوع"):event.overdue?
    t("Overdue / unconfirmed","متأخر أو غير مؤكد"):event.kind==="annual"?
    t("Annual due date","استحقاق سنوي"):t("Bill due date","موعد فاتورة")}</p>
  </div>
  <p className={"shrink-0 text-sm font-bold tabular-nums "+(event.amountJod>0?"text-[#337D5A]":"text-[#AE5A70]")}>
   {event.amountJod>0?"+":"−"}{moneyLabel(Math.abs(event.amountJod))}</p>
 </div>;
 return <section className="mx-auto max-w-[940px] space-y-3" aria-label={t("Family money rhythm","الإيقاع المالي للعيلة")} data-testid="family-money-rhythm">
  <div className="relative overflow-hidden rounded-[1.5rem] border border-[#DCEADC] bg-[linear-gradient(120deg,#EEF7E8,#FAF7E9_65%,#FFF0F1)] p-4 sm:p-6">
   <div className="relative z-10 max-w-[57%] sm:max-w-[66%]">
    <p className="text-xs font-extrabold tracking-wide text-[#4C8D68]">{t("OUR MONEY · FAMILY RHYTHM","مال العيلة · الإيقاع المالي")}</p>
    <h2 className="mt-2 text-xl font-black text-[#24573E] sm:text-2xl">{t("Spend wisely. Live well together.","اصرفوا بذكاء، وعيشوا منيح سوا.")}</h2>
    <p className="mt-2 text-xs leading-relaxed text-[#688273]">{t("Not just how much—when income arrives and what your family needs next.",
     "مش بس قديش، كمان متى بيوصل الدخل وشو العيلة بحاجة تدفع بعدين.")}</p>
   </div>
   <img src={import.meta.env.BASE_URL+"landing-family-characters.avif"} alt="" aria-hidden="true" loading="lazy"
    className="pointer-events-none absolute bottom-[-12px] end-0 h-[145px] w-[43%] object-contain object-bottom sm:h-[176px]"/>
  </div>
  <div className="flex flex-wrap items-center gap-1.5 rounded-2xl border border-[#DCE8D9] bg-[#F0F8EE] p-1.5" role="tablist" aria-label={t("Family money rhythm sections","أقسام الإيقاع المالي")}>
   {([{id:"map",en:"Money Map",ar:"الخريطة",icon:"🏡"},{id:"timeline",en:"Timeline",ar:"الجدول",icon:"📅"},
    {id:"pace",en:"Spending pace",ar:"وتيرة الصرف",icon:"🥦"},{id:"annual",en:"Annual costs",ar:"السنوية",icon:"🚘"}] as const).map(x=>
    <button key={x.id} type="button" role="tab" aria-selected={screen===x.id} onClick={()=>setScreen(x.id)}
     className={"min-h-11 flex-1 rounded-xl px-2 text-xs font-bold "+(screen===x.id?"bg-white text-[#2B7955] shadow-sm":"text-[#718477]")}>
     {x.icon} {t(x.en,x.ar)}</button>)}
  </div>
  <div className="flex justify-end">
   <button type="button" className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[#DBE7DC] bg-white px-3 text-xs font-bold text-[#41805E]"
    onClick={()=>setShowMoney(x=>!x)} aria-pressed={showMoney} aria-label={showMoney?t("Hide amounts","إخفاء المبالغ"):t("Reveal amounts","إظهار المبالغ")}>
    {showMoney?<EyeOff className="size-4"/>:<Eye className="size-4"/>}
    {showMoney?t("Hide private amounts","إخفاء المبالغ الخاصة"):t("Reveal amounts","إظهار المبالغ")}
   </button>
  </div>
  {state.demo&&<div className="rounded-xl border border-[#E8D9BF] bg-[#FFF7E8] p-3 text-xs text-[#896C43]">
   {t("These are sample records. They will not be used to claim your household can afford anything. Start real Money to use a saved cash-flow outlook.",
    "البيانات الموجودة تجريبية. ما منستخدمها للحكم على قدرة العيلة على الدفع. ابدأ ببيانات فعلية لتحفظ التوقعات.")}</div>}

  {screen==="map"&&<>
   <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
    <div className="rounded-xl bg-[#EAF5E8] p-3"><p className="text-xs text-[#5D8069]">{t("Monthly expected income","الدخل المتوقع بالشهر")}</p>
     <p className="mt-2 text-lg font-black text-[#2D7554]">{!state.demo&&(income.length>0||state.incomeKnown)?moneyLabel(summary.monthlyIncome):t("Not entered","غير مدخل")}</p></div>
    <div className="rounded-xl bg-[#FCEFF4] p-3"><p className="text-xs text-[#856778]">{t("Paid this month","المدفوع بالشهر")}</p>
     <p className="mt-2 text-lg font-black text-[#B65780]">{!state.demo?moneyLabel(summary.spent):t("Sample","تجريبي")}</p></div>
    <div className="col-span-2 rounded-xl bg-[#FFF7E9] p-3 sm:col-span-1"><p className="text-xs text-[#8E7755]">{t("Bills in next 30 days","فواتير ٣٠ يوم")}</p>
     <p className="mt-2 text-lg font-black text-[#8C6B41]">{!state.demo?moneyLabel(fullThirty.futureBillsJod):t("Sample","تجريبي")}</p></div>
   </div>
   <div className={soft}>
    <h3 className="text-base font-extrabold text-[#2B614A]">🌿 {t("What matters before the next payday?","شو المهم قبل الراتب الجاي؟")}</h3>
    <p className="mt-2 text-sm leading-relaxed text-[#617569]">{report}</p>
    <p className="mt-2 text-xs text-[#748377]">{t("Projected income is not received money. An entered category budget is not cash reserved or a bill paid.",
     "الدخل المتوقع مش دخل مستلم، ومخصص الفئة مش مال محفوظ أو فاتورة مدفوعة.")}</p>
    <button type="button" className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#38855D] px-4 text-xs font-bold text-white" onClick={()=>setScreen("timeline")}>
     {t("Explore the cash-flow timeline","شوف جدول السيولة")}<ChevronRight className="size-4 rtl:rotate-180"/></button>
   </div>
   <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
    {([{label:t("Income & paydays","الدخل والرواتب"),emoji:"💵",desc:t("Expected and received","متوقع ومستلم"),action:onBills},
      {label:t("Bills & commitments","الفواتير والالتزامات"),emoji:"🏠",desc:t("Dates and paid status","المواعيد وحالة الدفع"),action:onBills},
      {label:t("Everyday spending","المصاريف اليومية"),emoji:"🥦",desc:t("Groceries, fuel and more","مونة وبنزين وغيرها"),action:()=>setScreen("pace")},
      {label:t("Annual payments","المصاريف السنوية"),emoji:"🚘",desc:t("Insurance, tax, building","تأمين وضرائب وبناية"),action:()=>setScreen("annual")}])).map(x=>
     <button key={x.label} type="button" onClick={x.action} className="min-h-28 rounded-2xl border border-[#E4E9DE] bg-white p-3 text-start transition hover:border-[#A6CEAC]">
      <span className="text-2xl">{x.emoji}</span><strong className="mt-2 block text-xs">{x.label}</strong>
      <span className="mt-1 block text-[11px] text-[#809083]">{x.desc}</span></button>)}
   </div>
   <div className={soft}>
    <div className="flex items-center justify-between gap-2">
     <h3 className="font-extrabold text-[#2B614A]">{t("Your family categories","فئات مصاريف العيلة")}</h3>
     <button type="button" onClick={onCategories} className="min-h-10 text-xs font-bold text-[#3C825C] underline">{t("Edit budget","عدّل الميزانية")}</button>
    </div>
    <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
     {categories.map(cat=>{
      const art=iconFor(cat.name+" "+cat.id);
      const spent=summary.spentBy(cat.id),pct=cat.planned>0?Math.min(100,spent/cat.planned*100):0;
      return <button type="button" key={cat.id} onClick={()=>setSelected(selected===cat.id?null:cat.id)}
       className={"min-h-28 rounded-xl border p-3 text-start "+(selected===cat.id?"border-[#4E9C75] bg-[#F5FFF6]":"border-[#E7ECE4] bg-white")}>
       <span className="grid size-10 place-items-center rounded-xl text-2xl" style={{background:art.color}}>{art.emoji}</span>
       <strong className="mt-2 block truncate text-xs">{cat.name}</strong>
       <p className="mt-1 text-[11px] text-[#788A7B]">{moneyLabel(spent)} {t("paid","مدفوع")}</p>
       <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#EDF1EB]"><div className="h-full rounded-full bg-[#58A47B]" style={{width:pct+"%"}}/></div>
      </button>;
     })}
     {!categories.length&&<div className="col-span-2 text-xs leading-relaxed text-[#738477] sm:col-span-3">{t("No real category budgets yet. Add only the ones your family needs.","ما في فئات ميزانية فعلية بعد. أضف اللي بتحتاجه عيلتك بس.")}</div>}
    </div>
    {selected&&<div className="mt-3 rounded-xl bg-[#F1F8F0] p-3 text-sm">
     <p className="font-bold">{categories.find(c=>c.id===selected)?.name}</p>
     <p className="mt-1 text-xs text-[#60796A]">{t("Monthly allocation","المخصص الشهري")}: {moneyLabel(categories.find(c=>c.id===selected)?.planned??0)}</p>
     <button type="button" className="mt-2 min-h-10 rounded-xl border border-[#9CCBAA] bg-white px-3 text-xs font-bold" onClick={onSpending}>{t("Record an actual expense","سجّل مصروف فعلي")}</button>
    </div>}
   </div>
  </>}

  {screen==="timeline"&&<>
   <div className={soft}>
    <div className="flex flex-wrap items-center justify-between gap-2">
     <div><h3 className="text-base">{t("Cash flow between paydays","السيولة بين الرواتب")}</h3>
      <p className="mt-1 text-xs text-[#718577]">{t("Income, unpaid bills, and estimated everyday spending.","الدخل والفواتير غير المدفوعة وتقديرات المصاريف اليومية.")}</p></div>
     <div className="flex gap-1">{([7,30,90] as const).map(n=><button type="button" key={n} onClick={()=>setDays(n)} aria-pressed={days===n}
      className={"min-h-10 rounded-full border px-3 text-xs font-bold "+(days===n?"border-[#3B9065] bg-[#E8F5EA] text-[#2D7854]":"border-[#E0E9DE]")}>{n} {t("days","يوم")}</button>)}</div>
    </div>
    <label className="mt-3 flex min-h-10 items-center gap-2 text-xs font-semibold text-[#526D5D]">
     <input type="checkbox" className="size-4 accent-[#3E9064]" checked={includeExpected}
      onChange={e=>setIncludeExpected(e.target.checked)}/>
     {t("Include future expected income (not confirmed cash)","احتسب الدخل المستقبلي المتوقع (مش رصيد مؤكد)")}</label>
    <div className="mt-3 grid grid-cols-3 gap-2">
     {([
      {name:t("Starting cash","سيولة البداية"),value:forecast.cashStart},
      {name:t("Lowest forecast","أقل رصيد متوقع"),value:forecast.minimumCash},
      {name:t("End of period","نهاية الفترة"),value:forecast.cashEnd}
     ]).map(x=><div key={x.name} className="rounded-xl bg-[#F0F7EE] p-2 sm:p-3">
      <p className="text-[10px] leading-4 text-[#617668]">{x.name}</p>
      <p className="mt-2 break-words text-sm font-black sm:text-lg" style={{color:moneyColor(x.value)}}>{moneyLabel(x.value)}</p></div>)}
    </div>
    {showMoney&&chart()}
    {(!showMoney||state.demo||forecast.cashStart===null)&&<p className="mt-3 text-xs text-[#788B7B]">{t("Reveal amounts to view your private forecast curve. Starting cash is never inferred from income minus spending.","أظهر المبالغ لتشوف المنحنى الخاص. السيولة لا تُحسب من الدخل ناقص المصروف.")}</p>}
    {forecast.firstReserveRiskDate&&<div className="mt-3 rounded-xl border border-[#F0DBC5] bg-[#FFF6E9] p-3 text-xs font-semibold text-[#885C42]">
     {t("Potential reserve shortfall around ","احتمال نقص تحت الاحتياطي بتاريخ ")+forecast.firstReserveRiskDate}</div>}
    {forecast.missingDates>0&&<p className="mt-2 text-xs text-[#986D52]">{forecast.missingDates} {t("schedule(s) lack valid dates and cannot be forecast.","موعد دخل أو فاتورة بلا تاريخ صحيح ولا يدخل بالتوقع.")}</p>}
    <p className="mt-2 text-xs text-[#748878]">{t("A forecast isn't verified cash. Past payments are not subtracted from the manually entered opening balance twice.",
     "التوقع مش رصيد مؤكد. المصاريف القديمة ما بتنخصم مرتين من السيولة اللي أدخلتها.")}</p>
    <button type="button" className="mt-3 min-h-11 rounded-xl border border-[#B6D8BD] bg-white px-4 text-xs font-bold text-[#357C56]" onClick={onBills}>
     {t("Edit income, bill dates or cash balance","عدّل مواعيد الدخل والفواتير أو السيولة")}</button>
   </div>
   <div className={soft}>
    <h3 className="text-sm font-extrabold">{t("What is coming up","شو جاي بعدين")}</h3>
    <div className="mt-3 divide-y divide-[#EDF0EA]">
     {forecast.events.slice(0,24).map(timelineRow)}
     {!forecast.events.length&&<p className="py-3 text-xs text-[#7A8C80]">{t("No dated events yet. Add paydays and bill dates first.","ما في مواعيد مسجلة. أضف مواعيد الرواتب والفواتير أولاً.")}</p>}
    </div>
    {forecast.events.length>24&&<p className="mt-2 text-xs text-[#768778]">{t("Showing first 24; every event is included in the calculation.","عم نعرض أول ٢٤ حركة، وكل المواعيد محسوبة.")}</p>}
   </div>
  </>}

  {screen==="pace"&&<>
   <div className={soft}>
    <div className="flex items-center gap-3"><span className="text-3xl">🥦</span>
     <div><h3 className="text-base font-extrabold">{t("Spread expenses, not family stress","وزّعوا المصاريف، مش الضغوط")}</h3>
      <p className="mt-1 text-xs text-[#6C8272]">{t("Choose a pattern for an existing monthly spending category. No automatic payments are created.",
       "اختار وتيرة صرف لفئة شهرية موجودة. ما بينتج عنها أي دفع تلقائي.")}</p></div></div>
    <p className="mt-3 text-xs font-semibold text-[#3E8060]">{t("Monthly allocations with a pace","المخصصات الشهرية الموزعة")}: {moneyLabel(forecast.monthlyPaceJod)}</p>
   </div>
   <div className="grid gap-2 sm:grid-cols-2">
    {categories.map(cat=>{
     const art=iconFor(cat.name+" "+cat.id),value=state.spendingPaces?.find(p=>p.categoryId===cat.id);
     const allowed=paceAllowed(cat,state.commitments??[]);
     return <div className={soft} key={cat.id}>
      <div className="flex gap-3"><span className="grid size-11 place-items-center rounded-xl text-2xl" style={{background:art.color}}>{art.emoji}</span>
       <div className="min-w-0 flex-1"><h3 className="truncate text-sm font-bold">{cat.name}</h3>
       <p className="mt-1 text-xs text-[#79877B]">{t("Monthly budget","مخصص الشهر")}: {moneyLabel(cat.planned)}</p></div></div>
      {value?<p className="mt-3 text-xs text-[#3F805D]">{t("Every ","كل ")+value.intervalDays+t(" days from "," يوم من ")+value.nextDate}</p>:
       <p className="mt-3 text-xs text-[#899486]">{allowed?t("No spending pace chosen yet","ما اخترت وتيرة بعد"):
        t("Needs a positive category allowance and no linked bill","تحتاج مخصص موجب وما تكون مرتبطة بفاتورة")}</p>}
      {value&&<p className="mt-1 text-[11px] text-[#8E8B75]">{t("A plan, not a confirmed shopping date.","تقدير مش موعد تسوق مؤكد.")}</p>}
      <div className="mt-3 flex flex-wrap gap-2">
       <button type="button" disabled={!allowed||state.demo} className="min-h-10 rounded-xl bg-[#EAF4E9] px-3 text-xs font-bold text-[#368258] disabled:opacity-50"
        onClick={()=>{setEditingPace(cat.id);setPaceInterval(value?.intervalDays??7);setPaceStart(value?.nextDate??now);setError("");}}>
        {value?t("Change pace","عدّل الوتيرة"):t("Spread this budget","وزّع المخصص")}</button>
       {value&&<button type="button" className="min-h-10 text-xs font-bold text-[#9D5D67]"
        onClick={()=>setState(s=>removeSpendingPace(s,cat.id))}>{t("Stop pacing","أوقف التوزيع")}</button>}
      </div>
     </div>;
    })}
    {!categories.length&&<div className={soft}><p className="text-sm">{t("Start with a spending category, such as groceries or fuel.","ابدأ بفئة مثل المونة أو البنزين.")}</p>
     <button type="button" className="mt-3 min-h-10 text-xs font-bold text-[#397B58] underline" onClick={onCategories}>{t("Set a monthly allowance","حدّد مخصصاً شهرياً")}</button></div>}
   </div>
   {editingPace&&<form className={soft} onSubmit={registerPace} aria-label={t("Edit spending pace","تعديل وتيرة الصرف")}>
    <h3 className="font-extrabold">{t("Spending rhythm: ","وتيرة صرف: ")+categories.find(c=>c.id===editingPace)?.name}</h3>
    <div className="mt-3 grid gap-3 sm:grid-cols-2">
     <label className="text-xs font-bold">{t("Approximate interval","الفترة التقريبية")}
      <select className="mt-1 min-h-11 w-full rounded-xl border bg-white p-2" value={paceInterval}
       onChange={e=>setPaceInterval(Number(e.target.value) as SpendingPace["intervalDays"])}>
       {[7,10,14,15,30].map(n=><option key={n} value={n}>{n} {t("days","يوم")}</option>)}</select></label>
     <label className="text-xs font-bold">{t("Next suggested date","الموعد المقترح التالي")}
      <input className="mt-1 min-h-11 w-full rounded-xl border bg-white p-2" type="date" value={paceStart} min={now} onChange={e=>setPaceStart(e.target.value)}/></label>
    </div>
    <p className="mt-2 text-xs text-[#758477]">{t("Estimated allocations appear in the forecast. Real purchases are recorded separately and never duplicated.",
     "التوزيع بيظهر بالتوقع، والمشتريات الحقيقية تُسجّل لحالها بدون تكرار.")}</p>
    {error&&<p role="alert" className="mt-2 text-xs font-bold text-red-700">{error}</p>}
    <div className="mt-3 flex gap-2"><button type="submit" className="min-h-11 rounded-xl bg-[#388D64] px-4 text-xs font-bold text-white">{t("Save pace","احفظ الوتيرة")}</button>
     <button type="button" className="min-h-11 rounded-xl border px-4 text-xs" onClick={()=>setEditingPace(null)}>{t("Cancel","إلغاء")}</button></div>
   </form>}
   <p className="text-xs leading-relaxed text-[#7A8A7C]">{t("Groceries may be essential; restaurant spending may be flexible. Dabberna doesn't cut any protected family priority automatically.",
    "المونة ممكن تكون أساسية، والمطاعم مرنة. دبّرنا ما بيخفض أي أولوية مهمة للعيلة تلقائياً.")}</p>
  </>}

  {screen==="annual"&&<>
   <div className={soft}><h3 className="text-base font-extrabold">🚘 {t("Annual costs without surprises","مصاريف السنة بدون مفاجآت")}</h3>
    <p className="mt-2 text-xs leading-relaxed text-[#728475]">{t("Use the same Bills records for insurance, building contributions or property tax. Preparation per payday is only a suggestion, never money already saved.",
      "استعمل نفس سجلات الفواتير للتأمين ومساهمة البناية والضريبة. التحضير لكل راتب مجرد اقتراح، مش ادخار تم فعلياً.")}</p>
    <button type="button" disabled={state.demo} onClick={()=>{setAnnualOpen(x=>!x);setError("");}}
     className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#3D9066] px-4 text-xs font-bold text-white disabled:opacity-50">
     <Plus className="size-4"/>{t("Add an annual bill","أضف فاتورة سنوية")}</button>
   </div>
   {annualOpen&&<form onSubmit={saveAnnual} className={soft} aria-label={t("Annual payment form","تسجيل فاتورة سنوية")}>
    <h3 className="font-extrabold">{t("What is due each year?","شو بيستحق كل سنة؟")}</h3>
    <div className="mt-3 grid gap-3 sm:grid-cols-2">
     <label className="text-xs font-bold">{t("Payment name","اسم الدفعة")}
      <input value={annualName} maxLength={60} onChange={e=>setAnnualName(e.target.value)} placeholder={t("Car insurance, property tax…","تأمين السيارة، ضريبة المسقفات…")}
       className="mt-1 min-h-11 w-full rounded-xl border p-2"/></label>
     <label className="text-xs font-bold">{t("Amount (JOD)","المبلغ (دينار)")}
      <input type="number" inputMode="decimal" step=".01" min=".01" value={annualAmount} onChange={e=>setAnnualAmount(e.target.value)}
       className="mt-1 min-h-11 w-full rounded-xl border p-2"/></label>
     <label className="text-xs font-bold">{t("Next due date","موعد الاستحقاق التالي")}
      <input type="date" min={now} value={annualDate} onChange={e=>setAnnualDate(e.target.value)}
       className="mt-1 min-h-11 w-full rounded-xl border p-2"/></label>
     <label className="text-xs font-bold">{t("Existing category (optional)","الفئة الحالية (اختياري)")}
      <select value={annualCat} onChange={e=>setAnnualCat(e.target.value)} className="mt-1 min-h-11 w-full rounded-xl border bg-white p-2">
       <option value="">{t("Uncategorized","بلا فئة")}</option>
       {categories.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select></label>
    </div>
    {error&&<p role="alert" className="mt-2 text-xs font-bold text-red-700">{error}</p>}
    <div className="mt-3 flex gap-2"><button type="submit" className="min-h-11 rounded-xl bg-[#368A60] px-4 text-xs font-bold text-white">{t("Save annual bill","احفظ الفاتورة")}</button>
     <button type="button" onClick={()=>setAnnualOpen(false)} className="min-h-11 rounded-xl border px-4 text-xs">{t("Cancel","إلغاء")}</button></div>
   </form>}
   <div className="grid gap-2 sm:grid-cols-2">
    {annual.map(x=><div key={x.id} className={soft}>
     <div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-[#F5EEFC] text-2xl">🗓️</span>
      <div><h3 className="text-sm font-extrabold">{x.name}</h3><p className="text-xs text-[#7D8880]">{x.dueDate} · {t("Annual due date","استحقاق سنوي")}</p></div></div>
     <p className="mt-3 text-lg font-black text-[#367955]">{moneyLabel(x.amountJod)}</p>
     <div className="mt-2 rounded-xl bg-[#F5F8F2] p-3">
      <p className="text-xs font-semibold text-[#6B8070]">{t("Preparation suggestion per upcoming payday","اقتراح التحضير من كل راتب قادم")}</p>
      <p className="mt-1 text-base font-extrabold text-[#3E7C5A]">{x.perPaydayJod===null?
       t("Review timing — no dated payday found","راجع التوقيت — ما في راتب محدد"):
       moneyLabel(x.perPaydayJod)}</p>
      <p className="mt-1 text-[11px] text-[#809084]">{t("Using ","بناء على ")+x.paydays+t(" expected payday(s). No reserve is claimed."," موعد راتب متوقع. ما تم ادخار أي مبلغ.")}</p>
     </div>
     <button type="button" onClick={onBills} className="mt-2 min-h-10 text-xs font-bold text-[#387C59] underline">{t("Manage actual payments in Bills","إدارة الدفعات الفعلية بالفواتير")}</button>
    </div>)}
    {!annual.length&&<div className={soft}><p className="text-xs text-[#77877B]">{t("No annual bills recorded. Add insurance, tax or shared building costs when their dates are known.",
      "ما في فواتير سنوية بعد. أضف التأمين أو الضريبة أو مساهمة البناية وقت تعرف مواعيدها.")}</p></div>}
   </div>
  </>}
  {success&&<p role="status" className="rounded-xl bg-[#EDF7EC] p-3 text-xs font-bold text-[#387954]">{success}</p>}
  <p className="flex items-start gap-2 px-2 text-[11px] leading-relaxed text-[#77877D]"><ShieldCheck className="mt-0.5 size-4 shrink-0"/>
   {t("Saved locally on this device. Income forecasts, spending pace and annual preparation are estimates. Nothing is automatically paid, debited, shared or invested.",
     "الحفظ محلي على هالجهاز. الدخل المتوقع وتوزيع المصروف وتحضير السنوي تقديرات، وما بيصير أي دفع أو خصم أو مشاركة أو استثمار تلقائياً.")}</p>
 </section>;
}
