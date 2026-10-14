import { Link } from "@tanstack/react-router";
import { CalendarDays, Check, Heart, Pencil, Plus, Trash2 } from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatMomentDate, kindNames, parseCalendarDate, upcomingMoments, type FamilyMoment, type MomentKind } from "@/lib/familyCalendar";
import { useI18n } from "@/lib/i18n";
import { uid, useLocalState } from "@/lib/storage";

type MilestoneKind = Exclude<MomentKind,"birthday">;
type Draft={id:string;title:string;date:string;kind:MilestoneKind;annual:boolean;note:string;time:string};
const empty:Draft={id:"",title:"Wedding anniversary",date:"",kind:"anniversary",annual:true,note:"",time:""};
const options:MilestoneKind[]=["anniversary","celebration","holiday","school","activity","other"];

export function FamilyImportantEvents(){
 const {lang}=useI18n();const ar=lang==="ar";
 const [events,setEvents,ready]=useLocalState<FamilyMoment[]>("familyCalendar",[]);
 const [draft,setDraft]=useState<Draft|null>(null),[error,setError]=useState("");
 const important=useMemo(()=>events.filter(e=>e.kind!=="birthday"),[events]);
 const upcoming=useMemo(()=>{
  const sorted=upcomingMoments(important,new Date(),370);
  const seen=new Set<string>();
  return sorted.filter(e=>{if(seen.has(e.id))return false;seen.add(e.id);return true;}).slice(0,6);
 },[important]);
 const startNew=(kind:MilestoneKind="anniversary")=>{
  const title=kind==="anniversary"?"Wedding anniversary":"";
  setDraft({...empty,kind,title,annual:kind==="anniversary"});
  setError("");
 };
 const startEdit=(e:FamilyMoment)=>{setDraft({id:e.id,title:e.title,date:e.date,kind:e.kind as MilestoneKind,annual:e.annual,note:e.note??"",time:e.time??""});setError("");};
 const save=(e:FormEvent)=>{
  e.preventDefault();if(!draft)return;
  const title=draft.title.trim(),date=parseCalendarDate(draft.date);
  if(title.length<2||title.length>80||!date){
   setError(ar?"يرجى إدخال عنوان (٢–٨٠ حرفًا) وتاريخ صالح.":"Please provide an occasion title (2–80 characters) and a valid date.");return;
  }
  if(draft.time&&!/^([01]\d|2[0-3]):[0-5]\d$/.test(draft.time)){
   setError(ar?"يرجى إدخال وقت صالح.":"Please enter a valid time.");return;
  }
  if(events.some(x=>x.id!==draft.id && x.kind===draft.kind && x.title.trim().toLocaleLowerCase()===title.toLocaleLowerCase() &&
    x.date===draft.date && x.annual===draft.annual)){
    setError(ar?"هذه المناسبة مسجلة بالفعل في التقويم.":"This occasion is already saved in your calendar.");return;
  }
  const entry:FamilyMoment={id:draft.id||uid(),title,date:draft.date,kind:draft.kind,annual:draft.annual,...(draft.note.trim()?{note:draft.note.trim().slice(0,240)}:{}),...(draft.time?{time:draft.time}:{})};
  setEvents(old=>draft.id?old.map(x=>x.id===draft.id?entry:x):[...old,entry]);
  setDraft(null);setError("");
 };
 const remove=(e:FamilyMoment)=>{
  if(!window.confirm(ar?"هل تريد حذف المناسبة من تقويم العائلة؟":"Remove this occasion from the family calendar?"))return;
  setEvents(old=>old.filter(x=>x.id!==e.id));
  if(draft?.id===e.id)setDraft(null);
 };
 return <section className="mt-6" aria-label={ar?"مناسبات العائلة":"Family occasions"}>
  <div className="flex flex-wrap items-center justify-between gap-3">
   <div>
    <p className="text-xs font-semibold tracking-wider text-brand">{ar?"أيام تستحق الاحتفال":"MOMENTS WORTH REMEMBERING"}</p>
    <h2 className="mt-1 text-xl font-semibold">{ar?"المناسبات العائلية المهمة":"Important family occasions"}</h2>
    <p className="mt-1 text-sm text-muted-foreground">{ar?"أضف ذكرى الزواج والمناسبات الخاصة، وستظهر تلقائيًا في التقويم وفي يومي.":"Add wedding anniversaries and family milestones here. They'll appear in your calendar and My Day."}</p>
   </div>
   <Button size="sm" onClick={()=>startNew()}><Plus className="size-4"/>{ar?"إضافة مناسبة":"Add occasion"}</Button>
  </div>
  <div className="mt-3 flex flex-wrap items-center gap-2">
    <button type="button" onClick={()=>startNew("anniversary")} className="inline-flex items-center gap-2 rounded-full border border-[#F0D7CD] bg-[#FDF3EF] px-3 py-2 text-xs font-semibold text-[#9E695E]"><Heart className="size-4"/>{ar?"ذكرى الزواج":"Wedding anniversary"}</button>
    <Link to="/calendar" className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-3 py-2 text-xs font-semibold text-brand"><CalendarDays className="size-4"/>{ar?"فتح التقويم الكامل":"Full calendar"}</Link>
  </div>
  {draft&&<form onSubmit={save} className="card-soft mt-3 grid gap-3 p-4 sm:grid-cols-2">
    <div className="sm:col-span-2"><h3 className="font-semibold">{draft.id?(ar?"تعديل المناسبة":"Edit occasion"):(ar?"إضافة مناسبة عائلية":"New family occasion")}</h3></div>
    <label className="block text-sm font-medium sm:col-span-2">{ar?"عنوان المناسبة":"Occasion title"}
     <Input required minLength={2} maxLength={80} className="mt-1" value={draft.title} onChange={e=>setDraft({...draft,title:e.target.value})}/>
    </label>
    <label className="block text-sm font-medium">{ar?"نوع المناسبة":"Occasion type"}
     <select className="mt-1 w-full rounded-xl border border-border bg-card p-3" value={draft.kind} onChange={e=>{
       const kind=e.target.value as MilestoneKind;
       setDraft({...draft,kind,annual:kind==="anniversary"?true:draft.annual});
     }}>
      {options.map(kind=><option key={kind} value={kind}>{kindNames[kind][ar?"ar":"en"]}</option>)}
     </select>
    </label>
    <label className="block text-sm font-medium">{ar?"التاريخ":"Date"}
     <Input required type="date" className="mt-1" value={draft.date} onChange={e=>setDraft({...draft,date:e.target.value})}/>
    </label>
    <label className="block text-sm font-medium">{ar?"الوقت (اختياري)":"Time (optional)"}
     <Input type="time" className="mt-1" value={draft.time} onChange={e=>setDraft({...draft,time:e.target.value})}/>
    </label>
    <label className="flex items-center gap-2 self-end rounded-xl bg-mint/40 px-3 py-3 text-sm font-medium">
     <input type="checkbox" className="size-4 accent-[#426958]" checked={draft.annual} onChange={e=>setDraft({...draft,annual:e.target.checked})}/>
     {ar?"كرّر سنويًا":"Repeat every year"}
    </label>
    <label className="block text-sm font-medium sm:col-span-2">{ar?"ملاحظة (اختيارية)":"Note (optional)"}
     <Input className="mt-1" maxLength={240} value={draft.note} onChange={e=>setDraft({...draft,note:e.target.value})} placeholder={ar?"هدية أو خطة للاحتفال":"A thoughtful gift or family plan"}/>
    </label>
    {error&&<p className="text-sm text-destructive sm:col-span-2" role="alert">{error}</p>}
    <div className="flex gap-2 sm:col-span-2">
      <Button type="submit"><Check className="size-4"/>{ar?"حفظ المناسبة":"Save occasion"}</Button>
      <Button type="button" variant="outline" onClick={()=>{setDraft(null);setError("");}}>{ar?"إلغاء":"Cancel"}</Button>
    </div>
  </form>}
  <div className="mt-3 space-y-2">
   {!ready?<p className="text-sm text-muted-foreground">{ar?"جارٍ تحميل المناسبات...":"Loading occasions…"}</p>:
   important.length===0?<p className="rounded-2xl border border-dashed border-border bg-muted/30 p-4 text-sm text-muted-foreground">{ar?"ابدأ بذكرى زواج أو مناسبة خاصة لعائلتك.":"Start with a wedding anniversary or a meaningful family milestone."}</p>:
   <>
   {upcoming.map(e=><div key={e.id} className="card-soft flex items-center gap-3 p-3">
     <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-mint text-brand"><Heart className="size-5"/></span>
     <div className="min-w-0 flex-1">
      <p className="truncate text-sm font-semibold">{e.title}</p>
      <p className="text-xs text-muted-foreground">{formatMomentDate(e.occursOn,ar)} · {kindNames[e.kind][ar?"ar":"en"]}{e.annual?" · "+(ar?"سنوي":"Yearly"):""}</p>
     </div>
     <Button variant="ghost" size="icon" aria-label={ar?"تعديل المناسبة":"Edit occasion"} onClick={()=>startEdit(e)}><Pencil className="size-4"/></Button>
     <Button variant="ghost" size="icon" aria-label={ar?"حذف المناسبة":"Delete occasion"} onClick={()=>remove(e)}><Trash2 className="size-4"/></Button>
    </div>)}
   {important.length>upcoming.length&&<p className="text-xs text-muted-foreground">{ar?"يمكنك مشاهدة جميع المناسبات وتعديلها عبر التقويم الكامل.":"See and manage all your occasions in the full calendar."}</p>}
   </>}
  </div>
  <p className="mt-3 text-xs text-muted-foreground">{ar?"تُحفظ المناسبات وأعياد الميلاد على هذا الجهاز فقط. لا تتم مشاركة التواريخ مع دوائر الأصدقاء.":"Birthdays and occasions stay on this device; they are not shared with friends' circles."}</p>
 </section>;
}
