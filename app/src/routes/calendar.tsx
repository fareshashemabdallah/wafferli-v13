import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Cake, CalendarDays, Check, ChevronLeft, ChevronRight, Gift, Heart, Pencil, Plus, Trash2 } from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { allFamilyMoments,dateKey,formatMomentDate,isMemberBirthday,kindNames,monthCells,occurrencesForDate,parseCalendarDate,upcomingMoments,type FamilyMoment,type MomentKind } from "@/lib/familyCalendar";
import { sampleMembers } from "@/lib/money";
import { useI18n } from "@/lib/i18n";
import { uid,useLocalState } from "@/lib/storage";

export const Route=createFileRoute("/calendar")({
 head:()=>({meta:[{title:"Family Calendar — Dabberna"},{name:"description",content:"A private family calendar for birthdays, holidays and meaningful occasions. Saved on this device."}]}),
 component:FamilyCalendarPage
});
type Draft={id:string;title:string;date:string;kind:MomentKind;annual:boolean;time:string;note:string};
const blank=(date:string):Draft=>({id:"",title:"",date,kind:"birthday",annual:true,time:"",note:""});
function FamilyCalendarPage(){
 const {lang}=useI18n(),ar=lang==="ar";
 const today=useMemo(()=>new Date(),[]);
 const todayKey=dateKey(today);
 const [events,setEvents,eventsReady]=useLocalState<FamilyMoment[]>("familyCalendar",[]);
 const [members,,membersReady]=useLocalState("members",sampleMembers());
 const ready=eventsReady&&membersReady;
 const combined=useMemo(()=>allFamilyMoments(events,members,ar),[events,members,ar]);
 const [month,setMonth]=useState(()=>new Date(today.getFullYear(),today.getMonth(),1,12));
 const [selected,setSelected]=useState(todayKey);
 const [editing,setEditing]=useState(false);
 const [form,setForm]=useState<Draft>(()=>blank(todayKey));
 const [error,setError]=useState("");
 const cells=useMemo(()=>monthCells(month.getFullYear(),month.getMonth()),[month]);
 const chosen=useMemo(()=>occurrencesForDate(combined,selected),[combined,selected]);
 const upcoming=useMemo(()=>upcomingMoments(combined,today,60).slice(0,8),[combined,today]);
 const move=(delta:number)=>setMonth(d=>new Date(d.getFullYear(),d.getMonth()+delta,1,12));
 const monthLabel=new Intl.DateTimeFormat(ar?"ar-JO":"en-US",{month:"long",year:"numeric"}).format(month);
 const weekNames=Array.from({length:7},(_,i)=>new Intl.DateTimeFormat(ar?"ar-JO":"en-US",{weekday:"short"}).format(new Date(2026,9,12+i,12)));
 const startNew=(date:string)=>{setForm(blank(date));setEditing(true);setError("");};
 const startEdit=(item:FamilyMoment)=>{setForm({id:item.id,title:item.title,date:item.date,kind:item.kind,annual:item.annual,time:item.time??"",note:item.note??""});setEditing(true);setError("");};
 const save=(e:FormEvent)=>{
  e.preventDefault();const title=form.title.trim(),date=parseCalendarDate(form.date);
  if(title.length<2||title.length>80||!date){setError(ar?"أدخل عنوانًا صحيحًا (٢–٨٠ حرفًا) وتاريخًا صالحًا.":"Enter a title (2–80 characters) and valid date.");return;}
  if(form.time&&!/^([01]\d|2[0-3]):[0-5]\d$/.test(form.time)){setError(ar?"الوقت غير صالح.":"Please enter a valid time.");return;}
  const record:FamilyMoment={id:form.id||uid(),title,date:form.date,kind:form.kind,annual:form.annual,...(form.time?{time:form.time}:{}),...(form.note.trim()?{note:form.note.trim().slice(0,240)}:{})};
  setEvents(old=>form.id?old.map(x=>x.id===form.id?record:x):[...old,record]);
  setEditing(false);setError("");setSelected(form.date);
  setMonth(new Date(date.getFullYear(),date.getMonth(),1,12));
 };
 const remove=(item:FamilyMoment)=>{
  if(!window.confirm(ar?"حذف هذه المناسبة؟":"Delete this occasion?"))return;
  setEvents(old=>old.filter(x=>x.id!==item.id));
  if(form.id===item.id)setEditing(false);
 };
 const localeDate=(day:string)=> {
  const d=parseCalendarDate(day);
  return d?new Intl.DateTimeFormat(ar?"ar-JO":"en-US",{weekday:"long",month:"long",day:"numeric"}).format(d):day;
 };
 const kindColor=(kind:MomentKind)=>kind==="birthday"?"bg-[#FBE9E7] text-[#A66760]":kind==="holiday"?"bg-[#FCF0DC] text-[#98754A]":kind==="school"?"bg-[#E8EEF8] text-[#5C789B]":"bg-mint text-brand";
 return <AppShell title={ar?"تقويم العائلة":"Family Calendar"}>
  <section className="hero-surface rounded-3xl p-5 sm:p-6">
   <div className="flex items-center gap-3"><span className="grid size-12 place-items-center rounded-2xl bg-white/80 text-brand"><CalendarDays className="size-6"/></span>
   <div><h2 className="text-xl font-semibold">{ar?"أيام صغيرة، ذكريات جميلة":"A little planning, more moments together"}</h2>
   <p className="mt-1 text-sm text-muted-foreground">{ar?"تظهر أعياد الميلاد تلقائياً من عائلتي، مع ذكرى الزواج والعطلات والمناسبات الخاصة.":"Birthdays from My Family appear automatically, alongside anniversaries, holidays and other moments."}</p></div></div>
  </section>
  <Link to="/space" className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-brand">{ar?"أضف أو عدّل عيد ميلاد أحد أفراد العائلة":"Add or edit a family member’s birthday"} →</Link>
  <Link to="/occasions" className="mt-4 inline-flex items-center gap-2 rounded-xl bg-mint px-4 py-3 text-sm font-semibold text-brand">{ar?"ابدأ تجهيز الهدية والتجربة قبل المناسبة":"Plan gifts and experiences in advance"} →</Link>
  <div className="card-soft mt-4 p-4 sm:p-5">
   <div className="flex items-center justify-between gap-2">
    <Button variant="outline" size="icon" aria-label={ar?"الشهر السابق":"Previous month"} onClick={()=>move(-1)}><ChevronLeft className="size-5 rtl:rotate-180"/></Button>
    <h2 className="text-lg font-semibold">{monthLabel}</h2>
    <Button variant="outline" size="icon" aria-label={ar?"الشهر التالي":"Next month"} onClick={()=>move(1)}><ChevronRight className="size-5 rtl:rotate-180"/></Button>
   </div>
   <div className="mt-4 grid grid-cols-7 gap-1 text-center">
    {weekNames.map((s,i)=><span key={i} className="py-2 text-[11px] font-medium text-muted-foreground">{s}</span>)}
    {cells.map(cell=>{
     const has=occurrencesForDate(combined,cell.date).length>0;
     const current=cell.date===todayKey,chosenDay=selected===cell.date;
     return <button key={cell.date} type="button" onClick={()=>setSelected(cell.date)}
       aria-label={localeDate(cell.date)} aria-pressed={chosenDay}
       className={"relative flex min-h-[3.4rem] flex-col items-center justify-center gap-1 rounded-xl border text-sm transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand "+
        (chosenDay?"border-brand bg-mint text-brand":current?"border-[#DABAA4] bg-[#FFF5EC] text-ink":"border-transparent "+(cell.weekend&&cell.inMonth?"bg-[#FCF5EC]":"hover:bg-muted/70"))+
        (!cell.inMonth?" opacity-40":"")}>
       <span className={current?"font-bold":""}>{Number(cell.date.slice(-2))}</span>
       <span className={"size-1.5 rounded-full "+(has?"bg-[#C68A70]":"bg-transparent")}/>
      </button>;
    })}
   </div>
   <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
    <span>{ar?"تُظلل الجمعة والسبت كعطلة نهاية الأسبوع في الأردن.":"Friday and Saturday are highlighted as the weekend in Jordan."}</span>
    <button type="button" className="font-semibold text-brand underline-offset-2 hover:underline" onClick={()=>{setMonth(new Date(today.getFullYear(),today.getMonth(),1,12));setSelected(todayKey);}}>{ar?"اليوم":"Jump to today"}</button>
   </div>
  </div>
  <section className="card-soft mt-4 p-4 sm:p-5">
   <div className="flex flex-wrap items-center justify-between gap-2">
    <div><h2 className="font-semibold">{localeDate(selected)}</h2><p className="text-xs text-muted-foreground">{ar?"المناسبات الخاصة بهذا اليوم":"Occasions on this day"}</p></div>
    <Button size="sm" onClick={()=>startNew(selected)}><Plus className="size-4"/>{ar?"أضف مناسبة":"Add occasion"}</Button>
   </div>
   <div className="mt-3 space-y-2">{chosen.length===0?<p className="rounded-xl bg-muted/40 p-3 text-sm text-muted-foreground">{ar?"لا توجد مناسبات مسجّلة لهذا اليوم.":"No occasions saved for this day yet."}</p>:chosen.map(item=><div key={item.id} className="flex items-center gap-3 rounded-xl border border-border p-3">
    <span className={"grid size-9 shrink-0 place-items-center rounded-xl "+kindColor(item.kind)}>{item.kind==="birthday"?<Cake className="size-4"/>:item.kind==="celebration"?<Heart className="size-4"/>:<CalendarDays className="size-4"/>}</span>
    <div className="min-w-0 flex-1"><p className="text-sm font-semibold">{item.title}</p><p className="text-xs text-muted-foreground">{kindNames[item.kind][ar?"ar":"en"]}{item.time?" · "+item.time:""}{item.annual?" · "+(ar?"سنوي":"Yearly"):""}</p>{item.note&&<p className="mt-1 break-words text-xs text-muted-foreground">{item.note}</p>}</div>
    {isMemberBirthday(item)?<Link to="/space" aria-label={ar?"تعديل تاريخ الميلاد في عائلتي":"Edit birthday in My Family"} className="rounded-lg p-2 text-xs font-semibold text-brand hover:bg-mint">{ar?"عدّل في عائلتي":"Edit in My Family"}</Link>:<>
     <button type="button" onClick={()=>startEdit(item)} aria-label={ar?"تعديل":"Edit"} className="rounded-lg p-2 text-brand hover:bg-mint"><Pencil className="size-4"/></button>
     <button type="button" onClick={()=>remove(item)} aria-label={ar?"حذف":"Delete"} className="rounded-lg p-2 text-destructive hover:bg-muted"><Trash2 className="size-4"/></button>
    </>}
   </div>)}</div>
  </section>
  {editing&&<form onSubmit={save} className="card-soft mt-4 space-y-3 p-4 sm:p-5">
   <h2 className="text-lg font-semibold">{form.id?(ar?"تعديل المناسبة":"Edit occasion"):(ar?"مناسبة جديدة":"New occasion")}</h2>
   <div className="grid gap-3 sm:grid-cols-2">
    <label className="block text-sm font-medium sm:col-span-2">{ar?"اسم المناسبة":"Occasion title"}
     <Input required minLength={2} maxLength={80} className="mt-1" value={form.title} onChange={e=>setForm({...form,title:e.target.value})} placeholder={ar?"مثلاً: عيد ميلاد، يوم عطلة، نشاط المدرسة":"e.g. Birthday, holiday, school play"}/>
    </label>
    <label className="block text-sm font-medium">{ar?"التاريخ":"Date"}
     <Input required type="date" className="mt-1" value={form.date} onChange={e=>setForm({...form,date:e.target.value})}/>
    </label>
    <label className="block text-sm font-medium">{ar?"نوع المناسبة":"Occasion type"}
     <select className="mt-1 w-full rounded-xl border border-border bg-card p-3" value={form.kind} onChange={e=>setForm({...form,kind:e.target.value as MomentKind,annual:e.target.value==="birthday"?true:form.annual})}>
      {Object.entries(kindNames).map(([key,value])=><option value={key} key={key}>{ar?value.ar:value.en}</option>)}
     </select>
    </label>
    <label className="block text-sm font-medium">{ar?"الوقت (اختياري)":"Time (optional)"}
     <Input type="time" className="mt-1" value={form.time} onChange={e=>setForm({...form,time:e.target.value})}/>
    </label>
    <label className="flex items-center gap-2 self-end rounded-xl bg-mint/40 px-3 py-3 text-sm font-medium">
     <input type="checkbox" className="size-4 accent-[#426958]" checked={form.annual} onChange={e=>setForm({...form,annual:e.target.checked})}/>
     {ar?"كرّر كل سنة":"Repeat every year"}
    </label>
    <label className="block text-sm font-medium sm:col-span-2">{ar?"ملاحظة قصيرة (اختياري)":"Short note (optional)"}
     <Input maxLength={240} className="mt-1" value={form.note} onChange={e=>setForm({...form,note:e.target.value})} placeholder={ar?"مثلاً: تجهيز الهدية":"e.g. Remember to prepare a gift"}/>
    </label>
   </div>
   {error&&<p className="text-sm text-destructive" role="alert">{error}</p>}
   <div className="flex gap-2"><Button type="submit"><Check className="size-4"/>{ar?"حفظ المناسبة":"Save occasion"}</Button><Button type="button" variant="outline" onClick={()=>setEditing(false)}>{ar?"إلغاء":"Cancel"}</Button></div>
  </form>}
  <section className="mt-6">
   <h2 className="text-lg font-semibold">{ar?"قريباً في تقويمنا":"Coming up for your family"}</h2>
   {!ready?<p className="mt-2 text-sm text-muted-foreground">{ar?"جارٍ تحميل المناسبات...":"Loading saved occasions…"}</p>:upcoming.length===0?<p className="mt-2 rounded-xl bg-muted/40 p-4 text-sm text-muted-foreground">{ar?"عندما تضيف مناسبات، ستظهر هنا وعلى الصفحة الرئيسية.":"When you add birthdays in My Family or occasions here, they will appear on My Day."}</p>
   :<div className="mt-3 space-y-2">{upcoming.map(item=><div key={item.id+item.occursOn} className="card-soft flex items-center gap-3 p-3">
    <Gift className="size-5 shrink-0 text-brand"/><div className="flex-1"><p className="text-sm font-semibold">{item.title}</p><p className="text-xs text-muted-foreground">{formatMomentDate(item.occursOn,ar)} · {kindNames[item.kind][ar?"ar":"en"]}</p></div>
   </div>)}</div>}
  </section>
  <div className="mt-5 rounded-xl border border-dashed border-border p-4 text-xs text-muted-foreground">
   {ar?"هذا التقويم خاص بهذا المتصفح فقط ولا تتم مزامنته بين أفراد العائلة بعد. العطل الرسمية لا تُضاف تلقائيًا؛ أضفها يدويًا. لا تُرسل تذكيرات تلقائية أو إشعارات خارج التطبيق. بالنسبة لميلاد 29 فبراير، تظهر الذكرى فقط في السنوات الكبيسة.":"This calendar is private to this browser, not yet shared across family members. Public holidays must be entered manually. There are no background reminders or push notifications. A 29 February birthday appears only in leap years."}
  </div>
  <Link to="/" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-brand">{ar?<ArrowRight className="size-4"/>:<ArrowLeft className="size-4"/>}{ar?"العودة إلى يومي":"Back to My Day"}</Link>
 </AppShell>;
}
