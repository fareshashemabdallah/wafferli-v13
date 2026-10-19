import { useI18n } from "@/lib/i18n";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Cake, CalendarHeart, Heart, Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { AppShell, Notice, PilotBadge } from "@/components/AppShell";
import { FamilyPreferences } from "@/components/FamilyPreferences";
import {FamilyBasicsQuickInput} from "@/components/FamilyBasicsQuickInput";
import {LocalExpensePrivacyReview} from "@/components/LocalExpensePrivacyReview";
import {FamilyTasksPanel} from "@/components/FamilyTasksPanel";
import {isSampleFamilyMember} from "@/lib/familySetup";
import {HOUSEHOLD_ACCOUNTS_ENABLED} from "@/lib/householdAccounts";
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
  useEffect(()=>{
    // Hash-router deep link from Today's setup checklist to the exact editor.
    const target=window.location.hash.split("#").pop();
    if(target!=="family-preferences"&&target!=="household-members")return;
    const el=document.getElementById(target);
    if(!el)return;
    if(target==="family-preferences"&&el instanceof HTMLDetailsElement)el.open=true;
    el.scrollIntoView?.({block:"start"});
  },[]);
  const [members,setMembers] = useLocalState<Member[]>("members",sampleMembers());
  const samples=members.filter(isSampleFamilyMember);
  const [events,setEvents,eventsReady] = useLocalState<FamilyMoment[]>("familyCalendar",[]);
  const [edit,setEdit] = useState<Member|null>(null);
  const [err,setErr] = useState("");
  const [occasion,setOccasion] = useState<OccasionDraft|null>(null);
  const [occasionError,setOccasionError] = useState("");
  const save=()=>{
    if(!edit)return;
    if(!edit.name.trim())return setErr(tr("Name is required."));
    if(edit.ageYears!==undefined&&(!Number.isInteger(edit.ageYears)||edit.ageYears<0||edit.ageYears>120))return setErr(ar?"أدخل عمراً صحيحاً.":"Please enter a valid age.");
    if(edit.birthday){
      const date=parseCalendarDate(edit.birthday);
      if(!date||date.getTime()>new Date().getTime())return setErr(ar?"تاريخ الميلاد غير صالح أو في المستقبل.":"Please enter a valid birth date that is not in the future.");
    }
    if(edit.birthdayMonthDay&&(!/^\d{2}-\d{2}$/.test(edit.birthdayMonthDay)||!parseCalendarDate("2000-"+edit.birthdayMonthDay)))return setErr(ar?"أدخل شهراً ويوماً صحيحين بصيغة MM-DD.":"Enter a valid birthday month and day as MM-DD.");
    const m:Member={...edit,name:edit.name.trim().slice(0,30),prefs:edit.prefs.slice(0,120),ageGroup:edit.ageYears!==undefined?"":edit.ageGroup,birthday:edit.birthday||undefined,birthdayMonthDay:edit.birthdayMonthDay||undefined};
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
      <section className="page-intro relative overflow-hidden">
        <div className="pointer-events-none absolute -end-5 -top-10 size-32 rounded-full border-[18px] border-white/40" aria-hidden="true"/>
        <p className="section-eyebrow">{ar?"الأشخاص واللحظات المهمة":"THE PEOPLE & MOMENTS THAT MATTER"}</p>
        <p className="relative mt-2 max-w-lg text-sm leading-relaxed text-[#4E6B5A]">{ar?"تفاصيل العائلة وأيامها المهمة، محفوظة بمكان واحد.":"Your people, birthdays and meaningful dates, thoughtfully kept together."}</p>
      </section>

      <FamilyBasicsQuickInput/>
      <section className="mt-7 scroll-mt-24" id="household-members">
        {samples.length>0&&<div className="mb-4 rounded-2xl border border-[#E6D7C5] bg-[#FFF8F0] p-4">
          <p className="text-sm font-semibold">{ar?"أسماء تجريبية، ليست عيلتك":"Example profiles, not your family"}</p>
          <p className="mt-1 text-xs text-muted-foreground">{ar?"هؤلاء أشخاص للتجربة فقط. فيك تشيلهم وتضيف أفراد عيلتك، من دون تغيير المصاريف أو المناسبات المسجلة.":"These are demonstration people. Remove them before personalizing family advice. This won\u0027t alter your existing money or family occasions."}</p>
          <button type="button" className="mt-3 min-h-10 rounded-full border border-[#DBC5AF] bg-white px-4 text-xs font-semibold text-brand"
           onClick={()=>{if(window.confirm(ar?"إزالة الأسماء التجريبية فقط؟ سنحافظ على ملفات العائلة الحقيقية والمناسبات والمصاريف.":"Remove example profiles only? Your real profiles, calendar and Money records will remain unchanged."))setMembers(old=>old.filter(m=>!isSampleFamilyMember(m)));}}>
           {ar?"احذف الأسماء التجريبية":"Remove example profiles"}
          </button>
        </div>}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">{tr("Household members")}</h2>
            <p className="mt-1 text-xs text-muted-foreground">{ar?"أضف تاريخ الميلاد مرة واحدة ليظهر تلقائياً في التقويم وفي يومي.":"Add a birthday once: it automatically appears in the Family Calendar and My Day."}</p>
          </div>
          <Button size="sm" onClick={()=>{setEdit({id:"",name:"",role:"adult",ageGroup:"",prefs:"",birthday:"",birthdayMonthDay:""});setErr("");}} disabled={members.length>=12}>
            <Plus className="size-4"/> {tr("Add")}
          </Button>
        </div>
        {edit&&(
          <div className="card-soft mt-3 grid gap-3 p-4 sm:grid-cols-2">
            <Field label={tr("Name")}><Input className={inputCls} maxLength={30} value={edit.name} onChange={e=>setEdit({...edit,name:e.target.value})}/></Field>
            <Field label={tr("Role")}><NativeSelect value={edit.role} onChange={e=>setEdit({...edit,role:e.target.value as Member["role"]})}>
              <option value="adult">{tr("Adult")}</option><option value="child">{tr("Child")}</option>
            </NativeSelect></Field>
            <details className="sm:col-span-2 rounded-xl border border-border bg-white p-3"><summary className="cursor-pointer text-sm font-semibold text-brand">{ar?"معلومات إضافية (اختياري)":"More about this person (optional)"}</summary><div className="mt-3 grid gap-3 sm:grid-cols-2">
            <Field label={ar?"العمر بالسنوات (اختياري)":"Age in whole years (optional)"}><Input type="number" min={0} max={120} className={inputCls}
              value={edit.ageYears??""} onChange={e=>setEdit({...edit,ageYears:e.target.value===""?undefined:Number(e.target.value)})}/></Field>
            {edit.ageYears===undefined&&<Field label={tr("Age group (if exact age is unknown)")}><NativeSelect value={edit.ageGroup} onChange={e=>setEdit({...edit,ageGroup:e.target.value})}>
              <option value="">{ar?"أفضل عدم الإجابة":"Not provided"}</option>
              {ages.map(a=><option key={a}>{a}</option>)}
            </NativeSelect></Field>
            <Field label={tr("Preferences")}><Input className={inputCls} maxLength={120} value={edit.prefs} onChange={e=>setEdit({...edit,prefs:e.target.value})}/></Field>
            </div></details>
            <label className="block text-sm font-medium sm:col-span-2">
              <span className="flex items-center gap-2"><Cake className="size-4 text-[#B87976]"/>{ar?"عيد الميلاد (شهر-يوم اختياري)":"Birthday (month-day, optional)"}</span>
              <Input type="text" inputMode="numeric" maxLength={5} placeholder="MM-DD" className={inputCls+" mt-1"} value={edit.birthdayMonthDay??(edit.birthday?.slice(5)??"")} onChange={e=>setEdit({...edit,birthdayMonthDay:e.target.value,birthday:undefined})}/>
              <span className="mt-1 block text-xs font-normal text-muted-foreground">{ar?"الشهر واليوم كافيان للتذكير. إذا عدّلت هذه الخانة، لن نحفظ سنة الميلاد.":"Month and day are enough for reminders. Changing this field does not retain the birth year."}</span>
            </label>
            {err&&<p className="text-sm text-destructive sm:col-span-2" role="alert">{err}</p>}
            <div className="flex gap-2 sm:col-span-2">
              <Button className="flex-1" onClick={save}>{tr("Save")}</Button>
              <Button variant="outline" onClick={()=>setEdit(null)}>{tr("Cancel")}</Button>
            </div>
          </div>
        )}
        <ul className="mt-3 space-y-2">
          {members.map(m=><li key={m.id} className="editorial-card flex items-center gap-3 p-4">
            <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[#E9F0E8] font-display text-lg font-semibold text-brand">{m.name[0]?.toUpperCase()}</span>
            <div className="min-w-0 flex-1">
              <p className="font-medium">{tr(m.name)}</p>
              <p className="text-xs text-muted-foreground">{tr(m.role==="adult"?"Adult":"Child")}{typeof m.ageYears==="number"?" · "+m.ageYears+" "+(ar?"سنة":"years"):m.ageGroup?" · "+m.ageGroup:""}{m.prefs&&" · "+m.prefs}</p>
              {(m.birthday||m.birthdayMonthDay)&&
                <p className="mt-1 inline-flex items-center gap-1.5 text-xs text-[#9D6867]"><Cake className="size-3.5"/>{ar?"عيد الميلاد: ":"Birthday: "}{m.birthdayMonthDay??(m.birthday?formatMomentDate(m.birthday,ar):"")}</p>}
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
              {(["anniversary","birthday","celebration","holiday","school","activity","other"] as MomentKind[]).map(kind=>
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
            <div key={event.id} className="editorial-card flex items-center gap-3 p-3">
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

      <FamilyTasksPanel/>
      <Link to="/occasions" className="mt-5 inline-flex min-h-12 items-center gap-2 rounded-full bg-brand px-5 text-sm font-semibold text-white shadow-sm hover:bg-[#244D3C]">{ar?"خطّط لهدية أو نشاط بمناسبة عائلية":"Plan a meaningful gift or family activity"} →</Link>
      {HOUSEHOLD_ACCOUNTS_ENABLED&&<section className="editorial-card mt-5 p-4">
        <h2 className="font-semibold">{ar?"حسابات الأسرة الموثّقة":"Verified household accounts"}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{ar?
          "أنشئ عضوية للبالغين بدعوات قابلة للإلغاء. لا تتم مشاركة الميزانية أو بيانات الأطفال مع الأعضاء تلقائياً.":
          "Invite or revoke adult household members. Finances and children's profiles are not automatically shared or synced."}</p>
        <Link to="/household" className="mt-3 inline-flex min-h-11 items-center rounded-full bg-brand px-4 text-sm font-semibold text-white">
          {ar?"إدارة حسابات الأسرة":"Manage household accounts"} →
        </Link>
      </section>}
      <details id="family-preferences" className="group editorial-card mt-6 scroll-mt-24 p-4"><summary className="cursor-pointer text-sm font-semibold text-brand">{ar?"التفضيلات والخصوصية":"Preferences & privacy"} <span className="float-end group-open:hidden">+</span><span className="float-end hidden group-open:inline">−</span></summary>
      <FamilyPreferences/>
      <LocalExpensePrivacyReview/>
      <section className="card-soft mt-6 p-4 text-sm">
        <h2 className="font-semibold">{tr("Shared vs private expenses")}</h2>
        <p className="mt-1 text-muted-foreground">{tr("In My Money, each expense is marked shared (household) or private. In this pilot everything stays on this one device; multi-user household sharing isn't live yet.")}</p>
      </section>
      <Notice>{ar?"أفراد العائلة وأعياد الميلاد محفوظة على هذا الجهاز، ولا تتم مشاركتها مع دوائر الأصدقاء.":"Family profiles and birthdays stay on this browser, not shared with friends' circles or synchronized across devices."}</Notice>
      </details>
    </AppShell>
  );
}
