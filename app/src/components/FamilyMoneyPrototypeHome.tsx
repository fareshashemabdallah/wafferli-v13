import {useState} from "react";
import {ChevronRight,Plus} from "lucide-react";
import {useI18n} from "@/lib/i18n";
import {computeMoney,type MoneyState} from "@/lib/money";
import {type RhythmForecast} from "@/lib/familyMoneyRhythm";
import {fmtJOD} from "@/lib/storage";
import {localToday} from "@/lib/cashflow";
import {confirmedMonthPlan} from "@/lib/monthAwareMoney";

type Area="timeline"|"pace"|"annual";
type Props={
 state:MoneyState;forecast:RhythmForecast;revealed:boolean;
 onArea:(screen:Area)=>void;onIncome:()=>void;onBills:()=>void;
 onSpending:()=>void;onCategories:()=>void;onMonthPlan:(categoryId:string)=>void;
};
const groups=[
 {key:"groceries",name:"Groceries",ar:"المونة",icon:"🥦",bg:"#EAF5E7",test:/groc|food|market|بقالة|مونة/i},
 {key:"fuel",name:"Fuel",ar:"البنزين",icon:"⛽",bg:"#FFF5DE",test:/fuel|transport|car|بنزين|نقل/i},
 {key:"restaurants",name:"Restaurants",ar:"المطاعم",icon:"🍕",bg:"#FFEAF0",test:/restaurant|eating|dining|out|مطعم/i},
 {key:"children",name:"Children",ar:"الأولاد",icon:"🎒",bg:"#F8ECF7",test:/child|school|educ|درس|مدرسة|طفل/i},
 {key:"housing",name:"Housing",ar:"البيت",icon:"🏡",bg:"#EAF2FA",test:/home|housing|rent|house|shelter|سكن|بيت/i},
 {key:"health",name:"Health",ar:"الصحة",icon:"💗",bg:"#FFEFF5",test:/health|medical|doctor|care|صحة|طب/i}
] as const;
const tile="rounded-[1.05rem] border border-[#E3EAE0] bg-white p-3 text-start transition hover:-translate-y-0.5 hover:border-[#91C6A4] focus-visible:ring-2 focus-visible:ring-[#4E9D70]";
export function FamilyMoneyPrototypeHome({state,forecast,revealed,onArea,onIncome,onBills,onSpending,onCategories,onMonthPlan}:Props){
 const {lang}=useI18n(),ar=lang==="ar",t=(en:string,a:string)=>ar?a:en;
 const [selected,setSelected]=useState<string|null>(null);
 const m=computeMoney(state),unknown=t("Not entered","غير مدخل");
 const shown=(n:number|null)=>state.demo||n===null?unknown:revealed?fmtJOD(n):"••••";
 const salary=forecast.events.filter(x=>x.kind==="income"&&x.date>=localToday()).sort((a,b)=>a.date.localeCompare(b.date))[0];
 const haveBills=(state.commitments??[]).length>0;
 const warning=state.demo||forecast.unknownCash||forecast.missingDates>0||!salary?
  t("Your family cash-flow picture is incomplete. Add your cash balance, a payday and upcoming bills to build a useful outlook.",
    "صورة السيولة بعدها ناقصة. أدخل الرصيد وموعد الراتب والفواتير الجاية لنقدر نخطط بشكل مفيد."):
  forecast.firstReserveRiskDate?
  t("The recorded dates suggest possible pressure around "+forecast.firstReserveRiskDate+". Review essential payments first. Expected income is not guaranteed.",
    "المواعيد المدخلة بتشير لاحتمال ضغط بالسيولة بتاريخ "+forecast.firstReserveRiskDate+". راجع دفعات الأساسيات أولاً. الدخل المتوقع مش مضمون."):
  t("No reserve shortfall appears in your recorded 30-day forecast, but missing everyday costs could change that.",
    "ما ظهر نقص تحت الاحتياطي خلال ٣٠ يوم حسب المسجل، بس مصاريف الحياة الناقصة ممكن تغيّر النتيجة.");
 const snapshot=[
  {key:"cash",label:t("Starting cash · manually entered","سيولة البداية · مدخلة يدوياً"),amount:shown(forecast.cashStart),sub:state.cashUpdatedAt?state.cashUpdatedAt:t("Not bank verified","مش مؤكدة بنكياً"),bg:"#E9F6E9",fg:"#327D54"},
  {key:"salary",label:t("Next expected income","الدخل المتوقع التالي"),amount:salary?shown(salary.amountJod):unknown,sub:salary?.date??t("Date needed","التاريخ مطلوب"),bg:"#FFF0F4",fg:"#B96082"},
  {key:"bills",label:t("Bills due · next 30 days","الفواتير · ٣٠ يوم"),amount:haveBills?shown(forecast.futureBillsJod):unknown,sub:t("Not yet paid","لسا مش مدفوعة"),bg:"#FFF5E7",fg:"#8A704A"}
 ];
 const sorted=forecast.events.slice(0,3);
 return <div className="space-y-3" data-testid="prototype-money-home">
  <div className="grid grid-cols-3 gap-2">
   {snapshot.map(x=><div className="min-w-0 rounded-2xl border border-white p-3" key={x.key} style={{background:x.bg}}>
     <p className="min-h-9 text-[10px] font-semibold leading-[1.45] text-[#687D70]">{x.label}</p>
     <strong className="mt-1 block break-words text-base font-black tabular-nums sm:text-xl" style={{color:x.fg}}>{x.amount}</strong>
     <p className="mt-1 text-[10px] leading-snug text-[#77887C]">{x.sub}</p>
    </div>)}
  </div>
  <div className="rounded-[1.3rem] border border-[#DFE9DC] bg-[#F3FAF1] p-4">
   <div className="flex items-center justify-between gap-2">
    <h3 className="font-extrabold text-[#2B6149]">🌿 {t("What matters next","شو المهم هلّق؟")}</h3>
    <span className="rounded-full bg-white px-2 py-1 text-[10px] font-bold text-[#63836D]">{t("30-day view","نظرة ٣٠ يوم")}</span>
   </div>
   <p className="mt-2 text-sm leading-relaxed text-[#63786A]">{warning}</p>
   <button type="button" onClick={()=>onArea("timeline")} className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#3D9067] px-4 text-xs font-extrabold text-white">
    {t("Explore payment timeline","شوف جدول الدفعات")} <ChevronRight className="size-4 rtl:rotate-180"/>
   </button>
  </div>
  <h3 className="pt-2 text-sm font-black text-[#2B5944]">{t("What makes up our family's money?","شو بيكوّن مال العيلة؟")}</h3>
  <div className="grid grid-cols-2 gap-2">
   {[
    {id:"income",name:t("Income & paydays","الدخل والرواتب"),description:t("Amounts and dates","المبالغ والمواعيد"),emoji:"💵",go:onIncome},
    {id:"bills",name:t("Bills & commitments","الفواتير والالتزامات"),description:t("Deadlines and payment status","المواعيد وحالة الدفع"),emoji:"🏠",go:onBills},
    {id:"pace",name:t("Everyday spending","مصاريف كل يوم"),description:t("Groceries, fuel, restaurants","المونة والبنزين والمطاعم"),emoji:"🥦",go:()=>onArea("pace")},
    {id:"annual",name:t("Annual expenses","مصاريف سنوية"),description:t("Insurance, taxes, building","التأمين والضريبة والبناية"),emoji:"🚘",go:()=>onArea("annual")}
   ].map(x=><button type="button" key={x.id} onClick={x.go} className={tile+" min-h-28"}>
    <span className="block text-[27px]" aria-hidden="true">{x.emoji}</span>
    <strong className="mt-2 block text-sm text-[#2E5540]">{x.name}</strong>
    <span className="mt-1 block text-[11px] text-[#849287]">{x.description} ↗</span>
   </button>)}
  </div>
  <div className="flex items-center justify-between gap-2 pt-2">
   <h3 className="text-sm font-black text-[#2B5944]">{t("Upcoming on your calendar","مواعيد قريبة")}</h3>
   <button type="button" onClick={()=>onArea("timeline")} className="min-h-10 text-xs font-bold text-[#397E59] underline">
    {t("View all","كل المواعيد")} <ChevronRight className="inline size-3 rtl:rotate-180"/></button>
  </div>
  <div className="overflow-hidden rounded-2xl border border-[#E4EAE1] bg-white">
   {sorted.length?sorted.map(e=><div key={e.id} className="flex items-center gap-3 border-b border-[#EDF1EC] p-3 last:border-0">
    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#F2F8EE] text-xl">
     {e.kind==="income"?"💵":e.kind==="annual"?"🚘":e.kind==="pace"?"🥦":"🏡"}</span>
    <div className="min-w-0 flex-1"><p className="truncate text-xs font-bold text-[#2E5641]">{e.label}</p>
     <p className="mt-1 text-[10px] text-[#839184]">{e.date} · {e.kind==="income"?t("Expected","متوقع"):e.kind==="pace"?t("Estimated","تقديري"):t("Due","مستحق")}</p></div>
    <strong className={"shrink-0 text-xs tabular-nums "+(e.amountJod>0?"text-[#35805B]":"text-[#AD5975]")}>
     {e.amountJod>0?"+":"−"}{shown(Math.abs(e.amountJod))}</strong>
   </div>):<p className="p-4 text-xs text-[#839185]">{t("No dated items recorded yet.","ما في مواعيد مدخلة بعد.")}</p>}
  </div>
  <div className="flex items-center justify-between gap-2 pt-2">
   <h3 className="text-sm font-black text-[#2B5944]">{t("Recognizable family categories","فئات من حياتنا اليومية")}</h3>
   <button type="button" onClick={onCategories} className="min-h-10 text-xs font-bold text-[#3C825B] underline">{t("Edit plan","عدّل الخطة")}</button>
  </div>
  <div className="grid grid-cols-3 gap-2">
   {groups.map(g=>{
    const cat=state.categories.filter(c=>g.test.test(c.name+" "+c.id));
    const target=cat.reduce((a,x)=>a+m.plannedBy(x.id),0),used=cat.reduce((a,x)=>a+m.spentBy(x.id),0);
    const confirmed=cat.some(c=>confirmedMonthPlan(state,c.id,localToday().slice(0,7))!==null);
    const pct=target>0?Math.min(100,used/target*100):0;
    return <button key={g.key} type="button" onClick={()=>setSelected(selected===g.key?null:g.key)}
      aria-pressed={selected===g.key} className={tile+" min-h-32 "+(selected===g.key?"!border-[#51A277] !bg-[#F5FFF5]":"")}>
      <span className="grid size-11 place-items-center rounded-2xl text-2xl" style={{background:g.bg}}>{g.icon}</span>
      <strong className="mt-2 block text-xs text-[#385C48]">{t(g.name,g.ar)}</strong>
      <small className="mt-1 block text-[10px] text-[#839085]">{cat.length?shown(target):unknown}</small>
      {confirmed&&<span className="mt-1 block text-[9px] font-bold text-[#438567]">{t("Monthly adjustment","تعديل للشهر")}</span>}
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#EEF0EA]"><div className="h-full rounded-full bg-[#63B387]" style={{width:pct+"%"}}/></div>
    </button>;
   })}
  </div>
  {selected&&<div className="rounded-xl border border-[#BDDCC5] bg-[#F5FBF3] p-3 text-xs">
   <strong className="text-[#3E7653]">{t(groups.find(g=>g.key===selected)?.name??"",groups.find(g=>g.key===selected)?.ar??"")}</strong>
   <p className="mt-1 text-[#738A77]">{t("The category card uses only your recorded category allocations—not preset amounts.","هذه الفئة تعرض مخصصاتك المدخلة فقط، مش أرقام جاهزة.")}</p>
   <div className="mt-2 flex flex-wrap gap-2"><button className="min-h-10 rounded-xl bg-white px-3 font-bold text-[#327A55]" type="button" onClick={onCategories}>{t("Manage category","عدّل الفئة")}</button>
   <button className="min-h-10 rounded-xl bg-white px-3 font-bold text-[#327A55]" type="button" onClick={onSpending}>{t("Record expense","سجّل مصروف")}</button></div>
   {state.categories.filter(c=>groups.find(g=>g.key===selected)?.test.test(c.name+" "+c.id)).map(c=><div key={c.id} className="mt-2 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#D6E9D8] bg-white p-2">
    <div><strong>{c.name}</strong><p className="mt-1 text-[11px] text-[#7D8D7F]">{t("Usual monthly plan","المخصص المعتاد")}: {shown(c.planned)}</p></div>
    <button type="button" onClick={()=>onMonthPlan(c.id)} className="min-h-10 rounded-xl bg-[#E6F4E9] px-3 text-xs font-bold text-[#367B55]">{t("Adjust a month","عدّل شهر")}</button>
   </div>)}
  </div>}
  <div className="flex flex-wrap gap-2">
   <button type="button" onClick={onSpending} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#3C9266] px-4 text-xs font-bold text-white"><Plus className="size-4"/>{t("Add an expense","سجّل مصروف")}</button>
   <button type="button" onClick={onIncome} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#BBDAC4] bg-white px-4 text-xs font-bold text-[#397B59]">{t("Edit payday","عدّل موعد الراتب")}</button>
  </div>
  <p className="text-[11px] leading-relaxed text-[#768678]">{t("This is an estimate using the records you entered. There is no bank connection; a plan never becomes a payment automatically.",
    "هذه توقعات من معلوماتك المدخلة. ما في ربط بنكي؛ الخطة مش دفعة فعلية إلا بعد تأكيدها.")}</p>
 </div>;
}
