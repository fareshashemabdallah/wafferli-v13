import {createFileRoute,Link} from "@tanstack/react-router";
import {useState} from "react";
import {CalendarDays,CalendarHeart,ClipboardList,HeartHandshake,UsersRound,CheckCircle2,ChevronRight,MapPinned} from "lucide-react";
import {AppShell} from "@/components/AppShell";
import {FamilyTasksPanel} from "@/components/FamilyTasksPanel";
import {PlansWorkspace} from "@/routes/plans";
import {FamilyCalendarWorkspace} from "@/routes/calendar";
import {useI18n} from "@/lib/i18n";
import {useLocalState} from "@/lib/storage";
import {sampleMembers,type Member} from "@/lib/money";
import {realFamilyMembers} from "@/lib/familySetup";
import {FAMILY_TASKS_KEY,type FamilyTask,taskSummary} from "@/lib/familyTasks";
import {FAMILY_PLANS_KEY,type FamilyPlan,upcomingFamilyPlans} from "@/lib/familyPlans";
import {allFamilyMoments,upcomingMoments,formatMomentDate,type FamilyMoment} from "@/lib/familyCalendar";

export const Route=createFileRoute("/family")({
 head:()=>({meta:[{title:"Family Life — Dabberna"},{name:"description",content:"One family workspace for dates, plans, children and responsibilities."}]}),
 component:FamilyLifePage
});
type View="overview"|"calendar"|"plans"|"tasks";
const views=[
 {id:"overview" as const,en:"Overview",ar:"نظرة عامة",icon:HeartHandshake},
 {id:"calendar" as const,en:"Calendar",ar:"التقويم",icon:CalendarDays},
 {id:"plans" as const,en:"Plans & activities",ar:"الخطط والأنشطة",icon:CalendarHeart},
 {id:"tasks" as const,en:"Responsibilities",ar:"المسؤوليات",icon:ClipboardList}
];
export function FamilyLifePage(){
 const {lang}=useI18n(),ar=lang==="ar";
 const label=(en:string,arabic:string)=>ar?arabic:en;
 const [view,setView]=useState<View>("overview");
 const [calendarFocus,setCalendarFocus]=useState<string|undefined>();
 const openFamilyDate=(day:string)=>{setCalendarFocus(day);setView("calendar");};
 const [members,,membersReady]=useLocalState<Member[]>("members",sampleMembers());
 const [moments,,momentsReady]=useLocalState<FamilyMoment[]>("familyCalendar",[]);
 const [plans,,plansReady]=useLocalState<FamilyPlan[]>(FAMILY_PLANS_KEY,[]);
 const [tasks,,tasksReady]=useLocalState<FamilyTask[]>(FAMILY_TASKS_KEY,[]);
 const ready=membersReady&&momentsReady&&plansReady&&tasksReady;
 const realMembers=realFamilyMembers(members);
 const upcoming=upcomingMoments(allFamilyMoments(moments,realMembers,ar),new Date(),180);
 const activePlans=upcomingFamilyPlans(plans.filter(p=>p.status!=="completed"),new Date(),5);
 const activeTasks=taskSummary(tasks);
 const card="rounded-[1.55rem] border border-[#F0E4E9] bg-white p-4 shadow-[0_16px_35px_-28px_rgba(57,40,64,.20)] sm:p-5";
 return <AppShell title={label("Family Life","حياة العيلة")}>
  <div className="space-y-4">
   <p className="px-1 text-sm leading-relaxed text-[#657185]">
    {label("Your family's time, plans and responsibilities — organized together.",
     "مواعيد العيلة وخططها ومسؤولياتها — كلها بمكان واحد.")}
   </p>
   <nav aria-label={label("Family Life sections","أقسام حياة العيلة")}
    className="grid grid-cols-2 gap-2 rounded-[1.25rem] border border-[#F0E4E9] bg-white p-2 sm:grid-cols-4">
    {views.map(item=>{
     const Icon=item.icon,selected=view===item.id;
     return <button key={item.id} type="button" aria-current={selected?"page":undefined}
      aria-pressed={selected} onClick={()=>setView(item.id)}
      className={"inline-flex min-h-[52px] items-center justify-center gap-2 rounded-xl px-2 py-3 text-xs font-bold leading-snug transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B66C95] "+
       (selected?"bg-[#FCECF2] text-[#9B4072]":"text-[#647084] hover:bg-[#FFF8FA]")}>
      <Icon className="size-4 shrink-0"/><span>{ar?item.ar:item.en}</span>
     </button>;
    })}
   </nav>
   {view==="overview"&&<div className="space-y-4">
    <section className={card}>
     <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
       <h2 className="text-lg font-extrabold text-[#25354B]">{label("Our family life","حياة عيلتنا")}</h2>
       <p className="mt-1 text-xs text-[#738094]">{label("Your saved plans, dates and tasks in one place.","خططك ومواعيدك ومهامك المسجّلة في مكان واحد.")}</p>
      </div>
      <Link to="/space" className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[#EEE1E8] bg-[#FFF9FB] px-3 text-xs font-semibold text-[#9C4F78]">
       <UsersRound className="size-4"/>{label("Manage family members","أفراد العيلة")}
      </Link>
     </div>
     <div className="mt-4 grid grid-cols-3 gap-2">
      <div className="rounded-2xl bg-[#FCEEF3] p-3 text-center">
       <strong className="text-xl tabular-nums">{ready?realMembers.length:"—"}</strong>
       <p className="mt-1 text-[11px] text-[#68748A]">{label("Family members","أفراد العيلة")}</p>
      </div>
      <div className="rounded-2xl bg-[#F0F5FB] p-3 text-center">
       <strong className="text-xl tabular-nums">{ready?upcoming.length:"—"}</strong>
       <p className="mt-1 text-[11px] text-[#68748A]">{label("Dates next 6 months","مواعيد خلال ٦ أشهر")}</p>
      </div>
      <div className="rounded-2xl bg-[#EFF8F2] p-3 text-center">
       <strong className="text-xl tabular-nums">{ready?activeTasks.open:"—"}</strong>
       <p className="mt-1 text-[11px] text-[#68748A]">{label("Open tasks","مهام مفتوحة")}</p>
      </div>
     </div>
    </section>
    <div className="grid gap-4 md:grid-cols-2">
     <section className={card} aria-label={label("Upcoming family dates","المواعيد القادمة")}>
      <div className="flex items-center gap-2">
       <CalendarDays className="size-5 text-[#668DB5]"/><h2 className="text-base font-extrabold">{label("Upcoming dates","المواعيد القادمة")}</h2>
      </div>
      {!ready?<p className="mt-3 text-sm text-[#727C91]">{label("Loading family records…","جارٍ تحميل بيانات العيلة…")}</p>
       :upcoming.length===0?<p className="mt-3 text-sm text-[#727C91]">{label("No saved dates in the next six months.","ما في مواعيد مسجّلة خلال الأشهر الستة المقبلة.")}</p>
       :<ol className="mt-3 space-y-2">{upcoming.slice(0,3).map(item=><li key={item.id+"-"+item.occursOn}
        className="flex min-h-12 items-center justify-between gap-3 rounded-xl bg-[#F8F9FC] px-3 py-2">
         <span className="min-w-0 truncate text-sm font-semibold">{item.title}</span>
         <span className="shrink-0 text-xs text-[#728094]">{formatMomentDate(item.occursOn,ar)}</span>
         <button type="button" onClick={()=>openFamilyDate(item.occursOn)} aria-label={label("Prepare "+item.title,"حضّر "+item.title)} className="shrink-0 rounded-lg bg-white px-2 py-2 text-xs font-semibold text-[#B15380] underline">{label("Prepare","حضّر")}</button>
        </li>)}</ol>}
      <button onClick={()=>setView("calendar")} type="button" className="mt-3 inline-flex min-h-11 items-center gap-1 text-xs font-bold text-[#628BB4] underline">
       {label("Open family calendar","افتح تقويم العيلة")}<ChevronRight className="size-4 rtl:rotate-180"/>
      </button>
     </section>
     <section className={card} aria-label={label("Current family plans","الخطط الحالية")}>
      <div className="flex items-center gap-2">
       <CalendarHeart className="size-5 text-[#C86A91]"/><h2 className="text-base font-extrabold">{label("Plans & activities","الخطط والأنشطة")}</h2>
      </div>
      {!ready?<p className="mt-3 text-sm text-[#727C91]">{label("Loading plans…","جارٍ تحميل الخطط…")}</p>
       :activePlans.length===0?<p className="mt-3 text-sm text-[#727C91]">{label("No active plans recorded yet.","ما في خطط نشطة مسجّلة بعد.")}</p>
       :<ol className="mt-3 space-y-2">{activePlans.slice(0,3).map(item=><li key={item.id}
        className="flex min-h-12 items-center gap-2 rounded-xl bg-[#FFF8FB] px-3 py-2">
         <span className="min-w-0 flex-1 truncate text-sm font-semibold">{item.title}</span>
         {item.status==="completed"&&<CheckCircle2 className="size-4 text-[#408C71]"/>}
        </li>)}</ol>}
      <button onClick={()=>setView("plans")} type="button" className="mt-3 inline-flex min-h-11 items-center gap-1 text-xs font-bold text-[#B95484] underline">
       {label("Open plans","افتح الخطط")}<ChevronRight className="size-4 rtl:rotate-180"/>
      </button>
     </section>
    </div>
    <section className={card}>
     <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-2"><ClipboardList className="size-5 text-[#4A997F]"/>
       <h2 className="text-base font-extrabold">{label("Family responsibilities","مهام العيلة")}</h2></div>
      <button onClick={()=>setView("tasks")} type="button" className="inline-flex min-h-11 items-center gap-1 text-xs font-bold text-[#408E74] underline">
       {label("Manage tasks","إدارة المهام")}<ChevronRight className="size-4 rtl:rotate-180"/>
      </button>
     </div>
     <p className="mt-2 text-sm text-[#687587]">{ready?
      label(String(activeTasks.dueSoon)+" due within 7 days · "+String(activeTasks.overdue)+" overdue",
       String(activeTasks.dueSoon)+" خلال ٧ أيام · "+String(activeTasks.overdue)+" متأخرة")
      :label("Loading tasks…","جارٍ تحميل المهام…")}</p>
    </section>
    <details className={card}>
     <summary className="flex min-h-10 cursor-pointer list-none items-center gap-2 text-sm font-semibold text-[#58667A]">
      <MapPinned className="size-5 text-[#B66B92]"/>{label("More family experiences","أنشطة عائلية إضافية")}
     </summary>
     <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
      <Link to="/explore/weekend" className="rounded-xl bg-[#FCECF2] px-4 py-3 text-[#965477]">{label("Outings","الطلعات")}</Link>
      <Link to="/occasions" className="rounded-xl bg-[#FCECF2] px-4 py-3 text-[#965477]">{label("Celebrations","المناسبات")}</Link>
      <Link to="/community" className="rounded-xl bg-[#FCECF2] px-4 py-3 text-[#965477]">{label("Family & Friends Circles","دوائر العائلة والأصحاب")}</Link>
     </div>
    </details>
   </div>}
   {view==="calendar"&&<FamilyCalendarWorkspace key={calendarFocus??"calendar"} embedded {...(calendarFocus?{focusDate:calendarFocus}:{})}/>}
   {view==="plans"&&<PlansWorkspace embedded/>}
   {view==="tasks"&&<FamilyTasksPanel/>}
   <p className="px-1 text-[11px] leading-relaxed text-[#7B8491]">
    {label("Family records are currently saved in this browser. Shared household accounts and background reminders are not yet active.",
     "سجلات العيلة محفوظة حالياً بهذا المتصفح، ولا توجد مزامنة عائلية أو تذكيرات تلقائية بعد.")}
   </p>
  </div>
 </AppShell>;
}
