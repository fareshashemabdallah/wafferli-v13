import { useI18n } from "@/lib/i18n";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Cake, CalendarHeart, Heart, Pencil, Plus, Trash2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import { AppShell, Notice, PilotBadge } from "@/components/AppShell";
import { FamilyPreferences } from "@/components/FamilyPreferences";
import { Field, NativeSelect, inputCls } from "@/components/Field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { dateKey,formatMomentDate,kindNames,parseCalendarDate,type FamilyMoment,type MomentKind } from "@/lib/familyCalendar";
import { sampleMembers, type Member } from "@/lib/money";
import { uid, useLocalState } from "@/lib/storage";

export const Route = createFileRoute("/space")({
  head: () => ({
    meta: [
      { title: "My Family — Dabberna" },
      { name: "description", content: "Manage family member profiles, birthdays, anniversaries, important dates and preferences." },
      { property: "og:title", content: "My Family — Dabberna" },
      { property: "og:description", content: "Household profiles and private family occasions." },
    ],
  }),
  component: Space,
});

const ages = ["0–5", "6–12", "13–17", "18–29", "30–44", "45–59", "60+"];
type OccasionDraft = {
  id:string;title:string;date:string;kind:MomentKind;annual:boolean;note:string;
};
const newOccasion=():OccasionDraft=>({id:"",title:"",date:dateKey(new Date()),kind:"anniversary",annual:true,note:""});

function Space() {
  const { tr,lang } = useI18n();
  const ar=lang==="ar";
  const [members,setMembers] = useLocalState<Member[]>("members",sampleMembers());
  const [events,setEvents,eventsReady] = useLocalState<FamilyMoment[]>("familyCalendar",[]);
  const [edit,setEdit] = useState<Member|null>(null);
  const [err,setErr] = useState("");
  const [occasion,setOccasion] = useState<OccasionDraft|null>(null);
  const [occasionError,setOccasionError] = useState("");
  const save=()=>{
    if(!edit)return;
    if(!edit.name.trim())return setErr(tr("Name is required."));
    if(edit.birthday){
      const date=parseCalendarDate(edit.birthday);
      if(!date||date.getTime()>new Date().getTime())return setErr(ar?"تاريخ الميلاد غير صالح أو في المستقبل.":"Please enter a valid birth date that is not in the future.");
    }
    const m:Member={...edit,name:edit.name.trim().slice(0,30),prefs:edit.prefs.slice(0,120),birthday:edit.birthday||undefined};
    setMembers(old=>m.id?old.map(x=>x.id===m.id?m:x):[...old,{...m,id:uid()}]);
    setEdit(null);setErr("");
  };
  const saveOccasion=(e:FormEvent)=>{
    e.preventDefault();if(!occasion)return;
    const d=parseCalendarDate(occasion.date),title=occasion.title.trim();
    if(!d||title.length<2||title.length>80){
      setOccasionError(ar?"أدخل عنواناً وتاريخاً صالحين.":"Enter a valid title and date.");return;
    }
    const record:FamilyMoment={
      id:occasion.id||uid(),title,date:occasion.date,kind:occasion.kind,
      annual:occasion.annual,note:occasion.note.trim().slice(0,240),
    };
    setEvents(old=>occasion.id?old.map(x=>x.id===occasion.id?record:x):[...old,record]);
    setOccasion(null);setOccasionError("");
  };
  const removeOccasion=(id:string)=>{
    if(!window.confirm(ar?"حذف هذه المناسبة من تقويم العائلة؟":"Remove this occasion from the family calendar?"))return;
    setEvents(old=>old.filter(x=>x.id!==id));
  };
  const removeMember=(member:Member)=>{
    if(window.confirm(ar?"حذف هذا الفرد وتاريخ ميلاده من التقويم؟":"Remove this member and their birthday from the calendar?")){
      setMembers(old=>old.filter(x=>x.id!==member.id));
    }
  };
  return (
    <AppShell title={tr("My Family")}>
      <p className="mb-4 text-sm text-muted-foreground">{tr("One place to reflect your household’s needs and priorities, with privacy in your control.")}</p>
      <Notice>{ar
        ?"أفراد العائلة وأعياد الميلاد والمناسبات محفوظة في هذا المتصفح فقط. لا تتم مشاركتها مع مجموعات الأصدقاء، ولا تجري مزامنتها بين أجهزة الأهل بعد."
        :"Family members, birth dates and important occasions stay in this browser only. They are not shared with friends' circles or synchronized between parents' devices yet."}</Notice>

      <section className="mt-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">{tr("Household members")} <PilotBadge>{tr("Sample")}</PilotBadge></h2>
            <p className="mt-1 text-xs text-muted-foreground">{ar?"أضف تاريخ الميلاد مرة واحدة ليظهر تلقائياً في التقويم وفي يومي.":"Add a birthday once: it automatically appears in the Family Calendar and My Day."}</p>
          </div>
          <Button size="sm" onClick={()=>{setEdit({id:"",name:"",role:"adult",ageGroup:"30–44",prefs:"",birthday:""});setErr("");}} disabled={members.length>=12}>
            <Plus className="size-4"/> {tr("Add")}
          </Button>
        </div>
        {edit&&(
          <div className="card-soft mt-3 grid gap-3 p-4 sm:grid-cols-2">
            <Field label={tr("Name")}><Input className={inputCls} maxLength={30} value={edit.name} onChange={e=>setEdit({...edit,name:e.target.value})}/></Field>
            <Field label={tr("Role")}><NativeSelect value={edit.role} onChange={e=>setEdit({...edit,role:e.target.value as Member["role"]})}>
              <option value="adult">{tr("Adult")}</option><option value="child">{tr("Child")}</option>
            </NativeSelect></Field>
            <Field label={tr("Age group")}><NativeSelect value={edit.ageGroup} onChange={e=>setEdit({...edit,ageGroup:e.target.value})}>
              {ages.map(a=><option key={a}>{a}</option>)}
            </NativeSelect></Field>
            <Field label={tr("Preferences")}><Input className={inputCls} maxLength={120} value={edit.prefs} onChange={e=>setEdit({...edit,prefs:e.target.value})}/></Field>
            <label className="block text-sm font-medium sm:col-span-2">
              <span className="flex items-center gap-2"><Cake className="size-4 text-[#B87976]"/>{ar?"تاريخ الميلاد (اختياري)":"Date of birth (optional)"}</span>
              <Input type="date" className={inputCls+" mt-1"} max={dateKey(new Date())} value={edit.birthday??""} onChange={e=>setEdit({...edit,birthday:e.target.value})}/>
              <span className="mt-1 block text-xs font-normal text-muted-foreground">{ar?"يتكرر عيد الميلاد تلقائياً كل سنة. لا يُعرض تاريخ الميلاد لأعضاء المجموعات.":"The birthday repeats every year. This date is not visible to group members."}</span>
            </label>
            {err&&<p className="text-sm text-destructive sm:col-span-2" role="alert">{err}</p>}
            <div className="flex gap-2 sm:col-span-2">
              <Button className="flex-1" onClick={save}>{tr("Save")}</Button>
              <Button variant="outline" onClick={()=>setEdit(null)}>{tr("Cancel")}</Button>
            </div>
          </div>
        )}
        <ul className="mt-3 space-y-2">
          {members.map(m=><li key={m.id} className="card-soft flex items-center gap-3 p-4">
            <span className="grid size-11 shrink-0 place-items-center rounded-full bg-mint font-semibold text-brand">{m.name[0]?.toUpperCase()}</span>
            <div className="min-w-0 flex-1">
              <p className="font-medium">{tr(m.name)}</p>
              <p className="text-xs text-muted-foreground">{tr(m.role==="adult"?"Adult":"Child")} · {m.ageGroup}{m.prefs&&" · "+m.prefs}</p>
              {m.birthday&&parseCalendarDate(m.birthday)&&
                <p className="mt-1 inline-flex items-center gap-1.5 text-xs text-[#9D6867]"><Cake className="size-3.5"/>{ar?"عيد الميلاد: ":"Birthday: "}{formatMomentDate(m.birthday,ar)}</p>}
            </div>
            <Button size="icon" variant="ghost" aria-label={(ar?"تعديل ":"Edit ")+m.name} onClick={()=>{setEdit(m);setErr("");}}><Pencil className="size-4"/></Button>
            <Button size="icon" variant="ghost" aria-label={(ar?"حذف ":"Delete ")+m.name} onClick={()=>removeMember(m)}><Trash2 className="size-4"/></Button>
          </li>)}
          {members.length===0&&<li className="rounded-xl bg-muted p-6 text-center text-sm text-muted-foreground">{tr("No members yet.")}</li>}
        </ul>
      </section>

      <section className="mt-7">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-semibold"><CalendarHeart className="size-5 text-[#BA806B]"/>{ar?"تواريخ مهمة لعائلتنا":"Important Family Dates"}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{ar?"ذكرى الزواج، المناسبات الخاصة، العطلات، وأيام المدرسة — كلّها تظهر في تقويم العائلة.":"Wedding anniversaries, special occasions, holidays and school events—all visible in your family calendar."}</p>
          </div>
          <Button size="sm" onClick={()=>{setOccasion(newOccasion());setOccasionError("");}}><Plus className="size-4"/>{ar?"أضف":"Add"}</Button>
        </div>
        {occasion&&<form onSubmit={saveOccasion} className="card-soft mt-3 grid gap-3 p-4 sm:grid-cols-2">
          <label className="block text-sm font-medium sm:col-span-2">{ar?"اسم المناسبة":"Occasion name"}
            <Input required minLength={2} maxLength={80} className="mt-1" value={occasion.title}
              onChange={e=>setOccasion({...occasion,title:e.target.value})}
              placeholder={ar?"مثلاً: ذكرى زواجنا":"e.g. Our wedding anniversary"}/>
          </label>
          <label className="block text-sm font-medium">{ar?"نوع المناسبة":"Occasion type"}
            <NativeSelect value={occasion.kind} onChange={e=>setOccasion({...occasion,kind:e.target.value as MomentKind})}>
              {(["anniversary","celebration","holiday","school","activity","other"] as MomentKind[]).map(kind=>
                <option key={kind} value={kind}>{kindNames[kind][ar?"ar":"en"]}</option>)}
            </NativeSelect>
          </label>
          <label className="block text-sm font-medium">{ar?"تاريخ المناسبة":"Date"}
            <Input required type="date" className="mt-1" value={occasion.date} onChange={e=>setOccasion({...occasion,date:e.target.value})}/>
          </label>
          <label className="flex items-center gap-2 rounded-xl bg-mint/50 p-3 text-sm font-medium sm:col-span-2">
            <input type="checkbox" className="size-4 accent-[#426958]" checked={occasion.annual} onChange={e=>setOccasion({...occasion,annual:e.target.checked})}/>
            {ar?"تذكّر المناسبة كل سنة":"Repeat this occasion every year"}
          </label>
          <label className="block text-sm font-medium sm:col-span-2">{ar?"ملاحظة اختيارية":"Optional note"}
            <Input maxLength={240} className="mt-1" value={occasion.note} onChange={e=>setOccasion({...occasion,note:e.target.value})} placeholder={ar?"مثلاً: اختيار هدية أو حجز عشاء":"e.g. Gift idea or dinner plans"}/>
          </label>
          {occasionError&&<p className="text-sm text-destructive sm:col-span-2" role="alert">{occasionError}</p>}
          <div className="flex gap-2 sm:col-span-2">
            <Button type="submit">{ar?"احفظ المناسبة":"Save occasion"}</Button>
            <Button type="button" variant="outline" onClick={()=>setOccasion(null)}>{ar?"إلغاء":"Cancel"}</Button>
          </div>
        </form>}
        <div className="mt-3 space-y-2">
          {!eventsReady?<p className="text-sm text-muted-foreground">{ar?"جارٍ تحميل المناسبات":"Loading occasions…"}</p>:
          events.length===0?<div className="rounded-xl border border-dashed bg-[#FBF6EE] p-4 text-sm text-muted-foreground">
            <Heart className="me-2 inline size-4 text-[#BA806B]"/>
            {ar?"أضف ذكرى زواج أو مناسبة عائلية مهمة لنساعدك على تذكّرها.":"Add a wedding anniversary or another meaningful occasion to remember."}
          </div>:events.slice().sort((a,b)=>a.date.localeCompare(b.date)).map(event=>
            <div key={event.id} className="card-soft flex items-center gap-3 p-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#FCEEE7] text-[#B47B6B]"><Heart className="size-4"/></span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{event.title}</p>
                <p className="text-xs text-muted-foreground">{formatMomentDate(event.date,ar)} · {kindNames[event.kind]?.[ar?"ar":"en"]??event.kind}{event.annual?" · "+(ar?"كل سنة":"Yearly"):""}</p>
              </div>
              <Button size="icon" variant="ghost" aria-label={ar?"تعديل المناسبة":"Edit occasion"} onClick={()=>setOccasion({id:event.id,title:event.title,date:event.date,kind:event.kind,annual:event.annual,note:event.note??""})}><Pencil className="size-4"/></Button>
              <Button size="icon" variant="ghost" aria-label={ar?"حذف المناسبة":"Remove occasion"} onClick={()=>removeOccasion(event.id)}><Trash2 className="size-4"/></Button>
            </div>)}
        </div>
        <Link to="/calendar" className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-brand">
          <CalendarHeart className="size-4"/> {ar?"عرض تقويم العائلة":"Open Family Calendar"} →
        </Link>
        <p className="mt-2 text-xs text-muted-foreground">{ar?"التواريخ محفوظة على هذا الجهاز فقط. لا توجد إشعارات تلقائية خارج التطبيق بعد.":"Dates stay in this browser; background reminders and automatic notifications are not yet available."}</p>
      </section>

      <FamilyPreferences/>
      <section className="card-soft mt-6 p-4 text-sm">
        <h2 className="font-semibold">{tr("Shared vs private expenses")}</h2>
        <p className="mt-1 text-muted-foreground">{tr("In My Money, each expense is marked shared (household) or private. In this pilot everything stays on this one device; multi-user household sharing isn't live yet.")}</p>
      </section>
    </AppShell>
  );
}
