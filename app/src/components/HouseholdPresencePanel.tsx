import {useState,type FormEvent} from "react";
import {CalendarDays,ChevronDown,HousePlus,Plus,Trash2,Users} from "lucide-react";
import {useI18n} from "@/lib/i18n";
import {fmtJOD,uid,useLocalState} from "@/lib/storage";
import {realFamilyMembers} from "@/lib/familySetup";
import {householdCountSource} from "@/lib/progressiveFamilyInput";
import type {Member,MoneyState} from "@/lib/money";
import {
 HOUSEHOLD_PRESENCE_KEY,emptyHouseholdPresence,exampleHelper,exampleGuest,
 estimateHouseholdPresence,applyHouseholdPresenceBudget,
 type HouseholdHelper,type HouseholdGuest,type HouseholdPresence
} from "@/lib/householdPresence";

type Props={members:readonly Member[];money:MoneyState;setMoney:(fn:(s:MoneyState)=>MoneyState)=>void};
const thisMonth=()=>{
 const d=new Date();return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0");
};
const input="mt-1 min-h-10 w-full rounded-lg border border-[#CEDCCF] bg-white px-3 text-sm";
const number=(v:string)=>v.trim()===""?0:Number(v);
const within=(n:number,max=100000)=>Number.isFinite(n)&&n>=0&&n<=max;
export function HouseholdPresencePanel({members,money,setMoney}:Props){
 const {lang}=useI18n(),ar=lang==="ar";
 const t=(en:string,arabic:string)=>ar?arabic:en;
 const [presence,setPresence,ready]=useLocalState<HouseholdPresence>(HOUSEHOLD_PRESENCE_KEY,emptyHouseholdPresence());
 const [month,setMonth]=useState(thisMonth);
 const [helperDraft,setHelperDraft]=useState<HouseholdHelper|null>(null);
 const [guestDraft,setGuestDraft]=useState<HouseholdGuest|null>(null);
 const [error,setError]=useState("");
 const [open,setOpen]=useState(false);
 const real=realFamilyMembers(members);
 const computed=estimateHouseholdPresence(presence,members,month);
 const countSource=householdCountSource(members,presence);
 const update=(patch:Partial<HouseholdPresence>)=>setPresence(old=>({...old,...patch}));
 const addHelper=(event:FormEvent)=>{
  event.preventDefault();if(!helperDraft)return;
  const h=helperDraft;
  if(!Number.isInteger(h.count)||h.count<1||h.count>20||
   ![h.salaryMonthly,h.foodDaily,h.workDaysMonthly,h.utilitiesMonthly,h.suppliesMonthly].every(x=>within(x))||
   !Number.isInteger(h.workDaysMonthly)||h.workDaysMonthly>31){setError(t("Check the helper's count and amounts.","راجع عدد المساعدين والمبالغ."));return;}
  setPresence(old=>({...old,helpers:h.id?
   old.helpers.map(x=>x.id===h.id?h:x):[...old.helpers,{...h,id:uid()}]}));
  setHelperDraft(null);setError("");
 };
 const addGuest=(event:FormEvent)=>{
  event.preventDefault();if(!guestDraft)return;
  const g=guestDraft;
  if(!Number.isInteger(g.count)||g.count<1||g.count>30||
   ![g.foodDaily,g.utilitiesDaily,g.otherDaily,g.daysMonthly].every(x=>within(x))||
   !Number.isInteger(g.daysMonthly)||g.daysMonthly>31||
   (g.pattern==="one-off"&&(!/^\d{4}-\d{2}-\d{2}$/.test(g.startDate)||!/^\d{4}-\d{2}-\d{2}$/.test(g.endDate)||g.endDate<g.startDate||
    Number.isNaN(Date.parse(g.startDate))||Number.isNaN(Date.parse(g.endDate))))){
    setError(t("Enter valid visitor dates, quantities and costs.","أدخل تواريخ الزوار وأعدادهم وتكاليفهم بشكل صحيح."));return;
   }
  setPresence(old=>({...old,guests:g.id?
   old.guests.map(x=>x.id===g.id?g:x):[...old.guests,{...g,id:uid()}]}));
  setGuestDraft(null);setError("");
 };
 const apply=()=>{
  if(money.demo)return;
  if(!window.confirm(t(
   "Apply these estimated helper and visitor costs to your Money budget? Existing dedicated helper/visitor estimates will be replaced. No payments, bills, cash balances or family profiles will be changed.",
   "هل تريد إضافة تقديرات المساعدين والضيوف للميزانية؟ سيتم تحديث المخصصات الخاصة بهم فقط، دون تسجيل دفعات أو تغيير الرصيد أو ملفات العائلة."
  )))return;
  setMoney(prev=>applyHouseholdPresenceBudget(prev,presence,members,month));
 };
 if(!ready)return null;
 return <section className="mb-4 rounded-2xl border border-[#DDE7DB] bg-white p-4 sm:p-5"
  aria-label={t("People in our home and visitors","المقيمون في المنزل والضيوف")}>
  <div className="flex items-start gap-3">
   <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#EAF3E7] text-brand"><Users className="size-5"/></span>
   <div className="min-w-0 flex-1">
    <p className="text-xs font-semibold tracking-wide text-brand">{t("HOUSEHOLD LIVING COSTS","تكاليف المعيشة المنزلية")}</p>
    <h2 className="mt-1 text-lg font-semibold">{t("Who is staying in your home?","مين عم يقيم ببيتك؟")}</h2>
    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{t(
     "A live-in nanny also uses food and utilities; visiting relatives may increase costs only in certain months. These are optional estimates, not expenses already paid.",
     "المربية المقيمة تزيد مصروف الطعام والخدمات، والضيوف قد يزيدوا المصاريف بأشهر محددة. هذه تقديرات اختيارية وليست مصاريف مدفوعة."
    )}</p>
   </div>
  </div>
  <div className="mt-3 flex flex-wrap items-center gap-2">
   <span className="rounded-full bg-[#F2F6EE] px-3 py-1.5 text-xs">{t("Resident family","العائلة المقيمة")}: {computed.adults===null||computed.children===null?t("Not set","غير محدد"):String(computed.adults+computed.children)}</span>
   <span className="rounded-full bg-[#F2F6EE] px-3 py-1.5 text-xs">{t("Helpers","المساعدون")}: {computed.helperCount}</span>
   <span className="rounded-full bg-[#F2F6EE] px-3 py-1.5 text-xs">{t("Visitor entries","زيارات مسجّلة")}: {presence.guests.length}</span>
  </div>
  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-[#F5F8F3] p-3">
   <div><p className="text-xs text-muted-foreground">{t("Estimated extra costs","التكلفة الإضافية المقدّرة")} · {month}</p>
    <strong className="text-xl tabular-nums">{fmtJOD(computed.total)}</strong>
   </div>
   <button type="button" onClick={()=>setOpen(v=>!v)}
    className="inline-flex min-h-10 items-center gap-1 rounded-full border border-[#CFDDCD] bg-white px-3 text-xs font-semibold text-brand">
    {open?t("Close details","إخفاء التفاصيل"):t("Manage people & costs","إدارة الأشخاص والتكاليف")} <ChevronDown className={"size-4 "+(open?"rotate-180":"")}/>
   </button>
  </div>
  {open&&<div className="mt-4 space-y-4">
   <label className="block text-xs font-semibold">{t("Month to preview / plan","الشهر المطلوب تقديره")}
    <input type="month" className={input} value={month} onChange={e=>setMonth(e.target.value||thisMonth())}/>
   </label>
   <div className="rounded-xl border border-[#E2EADF] p-3">
    <h3 className="text-sm font-semibold">{t("Permanent family residents","أفراد العائلة المقيمون")}</h3>
    {presence.adults===null&&presence.children===null?<p className="mt-1 text-xs text-muted-foreground">
     {real.length?t("Using your real Family profiles ("+real.length+"). Helpers and visitors are separate.","نعتمد ملفات العائلة الحقيقية ("+real.length+"). المساعدون والضيوف منفصلون."):
      t("Add family profiles, or enter counts without sharing names.","أضف أفراد العائلة أو سجل العدد فقط دون أسماء.")}
    </p>:<p className="mt-1 text-xs text-muted-foreground">{t("Using counts you entered here rather than your family profiles.","نعتمد الأعداد التي أدخلتها هنا بدلاً من ملفات العائلة.")}</p>}
    <button className="mt-2 text-xs font-semibold text-brand underline" type="button"
     onClick={()=>update(presence.adults===null&&presence.children===null?
      {adults:real.filter(x=>x.role==="adult").length||2,children:real.filter(x=>x.role==="child").length}:
      {adults:null,children:null})}>
     {presence.adults===null&&presence.children===null?t("Enter counts manually","أدخل الأعداد يدوياً"):t("Use Family profiles","استخدم ملفات العائلة")}
    </button>
    {presence.adults!==null&&presence.children!==null&&<div className="mt-2 grid grid-cols-2 gap-2">
     <label className="text-xs">{t("Adults","بالغون")}
      <input aria-label={t("Resident adults","البالغون المقيمون")} type="number" min={0} max={50} className={input} value={presence.adults} onChange={e=>update({adults:Math.max(0,Math.min(50,Math.floor(number(e.target.value))||0))})}/>
     </label>
     <label className="text-xs">{t("Children","أطفال")}
      <input aria-label={t("Resident children","الأطفال المقيمون")} type="number" min={0} max={50} className={input} value={presence.children} onChange={e=>update({children:Math.max(0,Math.min(50,Math.floor(number(e.target.value))||0))})}/>
     </label>
    </div>}
   </div>
   <div className="rounded-xl border border-[#E2EADF] p-3">
    <div className="flex items-center justify-between gap-2">
     <h3 className="text-sm font-semibold">{t("Helpers & nannies","المساعدون والمربيات")}</h3>
     <button type="button" onClick={()=>{setHelperDraft(exampleHelper());setGuestDraft(null);setError("");}}
      className="inline-flex min-h-9 items-center gap-1 text-xs font-semibold text-brand"><Plus className="size-4"/>{t("Add","إضافة")}</button>
    </div>
    {presence.helpers.map(h=><div key={h.id} className="mt-2 flex items-center justify-between gap-2 rounded-lg bg-[#F5F8F3] p-2 text-xs">
     <div><strong>{h.label||t("Helper","مساعدة")}</strong> · {h.count} · {h.arrangement==="live-in"?t("Live-in","مقيم"):t("Daytime","نهاري")}</div>
     <div className="flex items-center gap-2">
      <button type="button" className="font-semibold text-brand underline" onClick={()=>{setHelperDraft({...h});setGuestDraft(null);}}>{t("Edit","تعديل")}</button>
      <button type="button" aria-label={t("Remove helper","حذف المساعدة")} onClick={()=>update({helpers:presence.helpers.filter(x=>x.id!==h.id)})}><Trash2 className="size-4"/></button>
     </div>
    </div>)}
    {helperDraft&&<form onSubmit={addHelper} className="mt-3 grid grid-cols-2 gap-3 rounded-xl bg-[#F5F8F3] p-3">
     <label className="col-span-2 text-xs">{t("Label (optional)","وصف اختياري")}<input maxLength={40} className={input} value={helperDraft.label} onChange={e=>setHelperDraft({...helperDraft,label:e.target.value})}/></label>
     <label className="text-xs">{t("Arrangement","نوع العمل")}
      <select className={input} value={helperDraft.arrangement} onChange={e=>setHelperDraft({...helperDraft,arrangement:e.target.value as HouseholdHelper["arrangement"]})}>
       <option value="live-in">{t("Live-in","مقيم")}</option><option value="daytime">{t("Daytime / part-time","نهاري / جزئي")}</option>
      </select>
     </label>
     <label className="text-xs">{t("Number","العدد")}<input className={input} type="number" min={1} max={20} value={helperDraft.count} onChange={e=>setHelperDraft({...helperDraft,count:number(e.target.value)})}/></label>
     <label className="text-xs">{t("Salary each / month (JOD)","الراتب الشهري لكل شخص")}<input className={input} type="number" min={0} step=".01" value={helperDraft.salaryMonthly} onChange={e=>setHelperDraft({...helperDraft,salaryMonthly:number(e.target.value)})}/></label>
     <label className="text-xs">{t("Food each / day (JOD)","طعام الشخص يومياً")}<input className={input} type="number" min={0} step=".01" value={helperDraft.foodDaily} onChange={e=>setHelperDraft({...helperDraft,foodDaily:number(e.target.value)})}/></label>
     {helperDraft.arrangement==="daytime"&&<label className="text-xs">{t("Working days / month","أيام العمل شهرياً")}<input className={input} type="number" min={0} max={31} value={helperDraft.workDaysMonthly} onChange={e=>setHelperDraft({...helperDraft,workDaysMonthly:number(e.target.value)})}/></label>}
     <label className="text-xs">{t("Additional utilities each / month","الخدمات الإضافية شهرياً")}<input className={input} type="number" min={0} step=".01" value={helperDraft.utilitiesMonthly} onChange={e=>setHelperDraft({...helperDraft,utilitiesMonthly:number(e.target.value)})}/></label>
     <label className="text-xs">{t("Supplies each / month","المستلزمات شهرياً")}<input className={input} type="number" min={0} step=".01" value={helperDraft.suppliesMonthly} onChange={e=>setHelperDraft({...helperDraft,suppliesMonthly:number(e.target.value)})}/></label>
     <div className="col-span-2 flex flex-wrap gap-2"><button type="submit" className="min-h-10 rounded-full bg-brand px-4 text-xs font-semibold text-white">{t("Save helper","حفظ المساعدة")}</button>
      <button type="button" onClick={()=>setHelperDraft(null)} className="min-h-10 px-3 text-xs font-semibold text-brand underline">{t("Cancel","إلغاء")}</button></div>
    </form>}
   </div>
   <div className="rounded-xl border border-[#E2EADF] p-3">
    <div className="flex items-center justify-between gap-2">
     <h3 className="text-sm font-semibold">{t("Visiting relatives & guests","الضيوف والأقارب الزائرون")}</h3>
     <button type="button" onClick={()=>{setGuestDraft(exampleGuest());setHelperDraft(null);setError("");}} className="inline-flex min-h-9 items-center gap-1 text-xs font-semibold text-brand"><Plus className="size-4"/>{t("Add","إضافة")}</button>
    </div>
    {presence.guests.map(g=><div key={g.id} className="mt-2 flex items-center justify-between gap-2 rounded-lg bg-[#F5F8F3] p-2 text-xs">
     <div><strong>{g.label||t("Visitors","ضيوف")}</strong> · {g.count} · {g.pattern==="one-off"?t("Dated visit","زيارة محددة"):g.pattern==="monthly"?t("Monthly","شهري"):t("Permanent","دائم")}</div>
     <div className="flex items-center gap-2"><button type="button" className="font-semibold text-brand underline" onClick={()=>{setGuestDraft({...g});setHelperDraft(null);}}>{t("Edit","تعديل")}</button>
      <button type="button" aria-label={t("Remove visit","حذف الزيارة")} onClick={()=>update({guests:presence.guests.filter(x=>x.id!==g.id)})}><Trash2 className="size-4"/></button></div>
    </div>)}
    {guestDraft&&<form onSubmit={addGuest} className="mt-3 grid grid-cols-2 gap-3 rounded-xl bg-[#F5F8F3] p-3">
     <label className="col-span-2 text-xs">{t("Label (optional)","وصف اختياري")}<input maxLength={40} className={input} value={guestDraft.label} onChange={e=>setGuestDraft({...guestDraft,label:e.target.value})}/></label>
     <label className="text-xs">{t("Stay type","نوع الإقامة")}
      <select className={input} value={guestDraft.pattern} onChange={e=>setGuestDraft({...guestDraft,pattern:e.target.value as HouseholdGuest["pattern"]})}>
       <option value="one-off">{t("Specific dates","تواريخ محددة")}</option>
       <option value="monthly">{t("Repeated monthly visits","زيارات شهرية متكررة")}</option>
       <option value="permanent">{t("Permanent guest / relative","قريب مقيم دائم")}</option>
      </select>
     </label>
     <label className="text-xs">{t("People","الأشخاص")}<input className={input} type="number" min={1} max={30} value={guestDraft.count} onChange={e=>setGuestDraft({...guestDraft,count:number(e.target.value)})}/></label>
     {guestDraft.pattern==="one-off"&&<>
      <label className="text-xs">{t("Arrival","الوصول")}<input required type="date" className={input} value={guestDraft.startDate} onChange={e=>setGuestDraft({...guestDraft,startDate:e.target.value})}/></label>
      <label className="text-xs">{t("Departure (last day staying)","المغادرة (آخر يوم إقامة)")}<input required type="date" min={guestDraft.startDate||undefined} className={input} value={guestDraft.endDate} onChange={e=>setGuestDraft({...guestDraft,endDate:e.target.value})}/></label>
     </>}
     {guestDraft.pattern==="monthly"&&<label className="col-span-2 text-xs">{t("Days staying each month","أيام الإقامة في الشهر")}<input className={input} type="number" min={0} max={31} value={guestDraft.daysMonthly} onChange={e=>setGuestDraft({...guestDraft,daysMonthly:number(e.target.value)})}/></label>}
     <label className="text-xs">{t("Food / person / day (JOD)","الطعام للشخص يومياً")}<input className={input} type="number" min={0} step=".01" value={guestDraft.foodDaily} onChange={e=>setGuestDraft({...guestDraft,foodDaily:number(e.target.value)})}/></label>
     <label className="text-xs">{t("Utilities / person / day (JOD)","الخدمات للشخص يومياً")}<input className={input} type="number" min={0} step=".01" value={guestDraft.utilitiesDaily} onChange={e=>setGuestDraft({...guestDraft,utilitiesDaily:number(e.target.value)})}/></label>
     <label className="col-span-2 text-xs">{t("Extra hosting / person / day (JOD)","ضيافة إضافية للشخص يومياً")}<input className={input} type="number" min={0} step=".01" value={guestDraft.otherDaily} onChange={e=>setGuestDraft({...guestDraft,otherDaily:number(e.target.value)})}/></label>
     <div className="col-span-2 flex flex-wrap gap-2"><button type="submit" className="min-h-10 rounded-full bg-brand px-4 text-xs font-semibold text-white">{t("Save visit","حفظ الزيارة")}</button>
      <button type="button" onClick={()=>setGuestDraft(null)} className="min-h-10 px-3 text-xs font-semibold text-brand underline">{t("Cancel","إلغاء")}</button></div>
    </form>}
   </div>
   {error&&<p role="alert" className="text-xs font-semibold text-destructive">{error}</p>}
   <div className="rounded-xl bg-[#F2F7EE] p-3 text-sm">
    <p className="font-semibold">{t("Estimated additional cost for ","التكلفة الإضافية المقدّرة لشهر ")}{month}</p>
    <div className="mt-2 space-y-1 text-xs">
     <div className="flex justify-between"><span>{t("Helper salaries","رواتب المساعدين")}</span><strong>{fmtJOD(computed.helperSalary)}</strong></div>
     <div className="flex justify-between"><span>{t("Helper food","طعام المساعدين")}</span><strong>{fmtJOD(computed.helperFood)}</strong></div>
     <div className="flex justify-between"><span>{t("Helper utilities & supplies","خدمات ومستلزمات المساعدين")}</span><strong>{fmtJOD(computed.helperUtilities+computed.helperSupplies)}</strong></div>
     <div className="flex justify-between"><span>{t("Visitor food","طعام الضيوف")}</span><strong>{fmtJOD(computed.guestFood)}</strong></div>
     <div className="flex justify-between"><span>{t("Visitor utilities & hosting","خدمات وضيافة الضيوف")}</span><strong>{fmtJOD(computed.guestUtilities+computed.guestOther)}</strong></div>
    </div>
    <p className="mt-2 text-xs text-muted-foreground">{t("Permanent occupancy including live-in help / permanent relatives: ","الإشغال الدائم بما فيه المساعدة المقيمة والأقارب الدائمون: ")}{computed.permanentResidents??t("Not yet known","غير محدد")}</p>
    {computed.temporaryGuestDays>0&&<p className="mt-1 text-xs text-muted-foreground">{t("Temporary visitor-person-days this month: ","أيام إقامة الضيوف الإجمالية هذا الشهر: ")}{computed.temporaryGuestDays}</p>}
   </div>
   <p className="text-xs leading-relaxed text-muted-foreground">{t(
    "The starting daily food amounts are editable examples—not verified public Amman averages. Do not enter helpers or relatives here if their extra living costs are already included in your existing category budget. No bills or spending records are created automatically.",
    "تكلفة الطعام اليومية الافتراضية أمثلة قابلة للتعديل وليست معدلات رسمية. تجنب إضافة نفس التكاليف مرة ثانية إذا كانت ضمن ميزانيتك. لن تُنشأ فواتير أو مصاريف مدفوعة تلقائياً."
   )}</p>
   <button type="button" disabled={money.demo||computed.total===0} onClick={apply}
    className="min-h-11 w-full rounded-full bg-brand px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-45">
    {t("Apply these estimates to my Money budget","اعتمد هذه التقديرات في ميزانيتي")}
   </button>
   {money.demo&&<p className="text-xs text-muted-foreground">{t("Set up your own Money budget before applying estimates. Your household entries are saved separately.","ابدأ ميزانيتك الحقيقية لتطبيق التقديرات. ستبقى بيانات الأشخاص محفوظة بشكل مستقل.")}</p>}
   <p className="text-xs text-muted-foreground">{t(
    "Approval creates or revises planned allocations only. Salary is NOT a scheduled payable until you set its due date in Bills. One-time visits affect only the selected month; regular guests and helpers are recurring planning categories. Existing cash and recorded expenses are untouched.",
    "الموافقة تعدّل المخصصات المخططة فقط. لا يُنشأ موعد دفع للراتب دون تسجيله بالفواتير. الزيارات المحددة تؤثر على شهرها فقط، أما المتكرر فيدخل ضمن التخطيط الشهري. الرصيد والمصاريف الفعلية لا تتغير."
   )}</p>
  </div>}
 </section>;
}
