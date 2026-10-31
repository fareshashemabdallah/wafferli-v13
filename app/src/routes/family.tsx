import {createFileRoute,Link} from "@tanstack/react-router";
import {useState} from "react";
import {ArrowLeft,ArrowRight,CalendarDays,CalendarHeart,CheckCircle2,ClipboardList,HeartHandshake,UsersRound} from "lucide-react";
import {AppShell} from "@/components/AppShell";
import {FamilyTasksPanel} from "@/components/FamilyTasksPanel";
import {PlansWorkspace} from "@/routes/plans";
import {FamilyCalendarWorkspace} from "@/routes/calendar";
import {useI18n} from "@/lib/i18n";
import {useLocalState} from "@/lib/storage";
import {sampleMembers,type Member} from "@/lib/money";
import {realFamilyMembers} from "@/lib/familySetup";
import {FAMILY_TASKS_KEY,type FamilyTask,taskSummary} from "@/lib/familyTasks";
import {FAMILY_PLANS_KEY,ACTIVE_PLAN_KEY,type FamilyPlan,upcomingFamilyPlans} from "@/lib/familyPlans";
import {upcomingMoments,formatMomentDate,type FamilyMoment} from "@/lib/familyCalendar";
import {canonicalFamilyReadModel} from "@/lib/canonicalFamilyFacts";

export const Route=createFileRoute("/family")({
 head:()=>({meta:[{title:"Family Life — Dabberna"},{name:"description",content:"One calm place for family dates, plans, profiles and responsibilities."}]}),
 component:FamilyLifePage
});
type View="overview"|"calendar"|"plans"|"tasks";
export function FamilyLifePage(){
 const {lang}=useI18n(),ar=lang==="ar";
 const t=(en:string,arabic:string,fr:string)=>ar?arabic:lang==="fr"?fr:en;
 const [view,setView]=useState<View>("overview");
 const [calendarFocus,setCalendarFocus]=useState<string|undefined>();
 const openFamilyDate=(day:string)=>{setCalendarFocus(day);setView("calendar");};
 const [members,,membersReady]=useLocalState<Member[]>("members",sampleMembers());
 const [moments,,momentsReady]=useLocalState<FamilyMoment[]>("familyCalendar",[]);
 const [plans,,plansReady]=useLocalState<FamilyPlan[]>(FAMILY_PLANS_KEY,[]);
 const [,setActivePlan]=useLocalState<string|null>(ACTIVE_PLAN_KEY,null);
 const [tasks,,tasksReady]=useLocalState<FamilyTask[]>(FAMILY_TASKS_KEY,[]);
 const ready=membersReady&&momentsReady&&plansReady&&tasksReady;
 const realMembers=realFamilyMembers(members);
 const family=canonicalFamilyReadModel(plans,moments,members,ar);
 const nextMoment=upcomingMoments(family.moments,new Date(),180)[0];
 const nextPlan=upcomingFamilyPlans(family.plans.filter(p=>p.status!=="completed"),new Date(),5)[0];
 const taskCounts=taskSummary(tasks);
 const card="rounded-[1.5rem] border border-[#DEEADE] bg-white p-4 shadow-[0_14px_34px_-29px_rgba(34,90,61,.28)] sm:p-5";
 const choices=[
  {id:"calendar" as const,title:t("Special moments","المناسبات","Les moments importants"),detail:t("Birthdays, school and celebrations","أعياد الميلاد والمدرسة والمناسبات","Anniversaires, école et fêtes"),icon:CalendarDays,color:"bg-[#EDF4FD] text-[#4C76A1]"},
  {id:"plans" as const,title:t("Our plans","خططنا","Nos projets"),detail:t("Outings, gifts and decisions","طلعات وهدايا وخطط","Sorties, cadeaux et décisions"),icon:CalendarHeart,color:"bg-[#FFF0F2] text-[#B5657A]"},
  {id:"tasks" as const,title:t("Family tasks","مهام العيلة","Tâches familiales"),detail:t("Things that need attention","الأمور اللي لازم ننتبهلها","Les choses à faire"),icon:ClipboardList,color:"bg-[#ECF7F0] text-[#348267]"}
 ];
 return <AppShell title={t("Family","العيلة","Famille")}>
  <div className="mx-auto max-w-3xl space-y-3" data-testid="family-simple-hub">
   {view==="overview"?<>
    <section className="flex items-center gap-3 rounded-[1.5rem] border border-[#DEEBD9] bg-[linear-gradient(120deg,#EDF7E8,#FFF8EE_75%)] p-4 sm:p-5">
     <div aria-hidden="true" className="grid size-14 shrink-0 place-items-center rounded-2xl bg-white/90 text-[#468368]"><HeartHandshake className="size-7"/></div>
     <div className="min-w-0">
      <h2 className="text-lg font-black text-[#2B5340]">{t("Our family, in one place","عيلتنا بمحل واحد","Notre famille, au même endroit")}</h2>
      <p className="mt-1 text-sm text-[#647969]">{t("The moments and plans that matter.","المناسبات والخطط اللي بتهمّنا.","Les moments et les projets qui comptent.")}</p>
     </div>
    </section>
    <section className={card} aria-label={t("Coming up","القادم","À venir")}>
     <p className="text-xs font-bold uppercase tracking-wide text-[#538064]">{t("COMING UP","الخطوة الجاية","À VENIR")}</p>
     {!ready?<p className="mt-3 text-sm text-[#66786A]">{t("Loading family details…","عم نحمّل معلومات العيلة…","Chargement de la famille…")}</p>:
      nextMoment?<div className="mt-3">
       <h3 className="text-lg font-bold text-[#2B5040]">{nextMoment.title}</h3>
       <p className="mt-1 text-sm text-[#698071]">{formatMomentDate(nextMoment.occursOn,ar,lang)}</p>
       <button type="button" onClick={()=>openFamilyDate(nextMoment.occursOn)}
        className="mt-3 inline-flex min-h-12 items-center gap-2 rounded-xl bg-[#2D805E] px-5 text-sm font-extrabold text-white">
        {t("Prepare this moment","حضّر هالمناسبة","Préparer cet événement")}<ArrowRight className="size-4 rtl:rotate-180"/>
       </button>
      </div>:nextPlan?<div className="mt-3">
       <h3 className="text-lg font-bold text-[#2B5040]">{nextPlan.title}</h3>
       <p className="mt-1 text-sm text-[#698071]">{nextPlan.date??t("An ongoing family plan","خطة عائلية حالية","Un projet familial en cours")}</p>
       <button type="button" onClick={()=>{setActivePlan(nextPlan.id);setView("plans");}}
        className="mt-3 inline-flex min-h-12 items-center gap-2 rounded-xl bg-[#2D805E] px-5 text-sm font-extrabold text-white">
        {t("Continue plan","كمّل الخطة","Continuer le projet")}<ArrowRight className="size-4 rtl:rotate-180"/>
       </button>
      </div>:taskCounts.open>0?<div className="mt-3">
       <h3 className="text-base font-bold text-[#2C5441]">{t("You have family tasks to review","عندك مهام عائلية للمراجعة","Vous avez des tâches à consulter")}</h3>
       <button type="button" onClick={()=>setView("tasks")} className="mt-3 inline-flex min-h-12 items-center gap-2 rounded-xl bg-[#2D805E] px-5 text-sm font-bold text-white">
        {t("Open tasks","شوف المهام","Voir les tâches")}<ArrowRight className="size-4 rtl:rotate-180"/>
       </button>
      </div>:<div className="mt-3">
       <p className="text-sm text-[#67796D]">{realMembers.length?t("No upcoming plans or occasions saved.","ما في خطط أو مناسبات قريبة محفوظة.","Aucun projet ou événement à venir."):t("Add your family once to make suggestions more useful.","ضيف أفراد العيلة مرة وحدة لنقدّم اقتراحات أنسب.","Ajoutez votre famille une fois pour recevoir des suggestions adaptées.")}</p>
       <Link to="/space" className="mt-3 inline-flex min-h-11 items-center gap-2 text-sm font-extrabold text-[#2C805D] underline">{t("Family members","أفراد العيلة","Membres de la famille")}<ArrowRight className="size-4 rtl:rotate-180"/></Link>
      </div>}
    </section>
    <div className="grid grid-cols-2 gap-3" aria-label={t("Family areas","أقسام العيلة","Rubriques famille")}>
     {choices.map(choice=>{
      const Icon=choice.icon;
      return <button key={choice.id} type="button" onClick={()=>{setCalendarFocus(undefined);setView(choice.id);}}
       className={card+" flex min-h-[142px] flex-col items-start gap-2 text-start transition hover:border-[#8BBA9D] focus-visible:ring-2 focus-visible:ring-[#348765]"}>
       <span className={"grid size-11 place-items-center rounded-xl "+choice.color}><Icon className="size-5"/></span>
       <strong className="text-sm text-[#2E5040]">{choice.title}</strong>
       <span className="text-xs leading-snug text-[#6C8072]">{choice.detail}</span>
      </button>;
     })}
     <Link to="/space" className={card+" flex min-h-[142px] flex-col items-start gap-2 transition hover:border-[#8BBA9D] focus-visible:ring-2 focus-visible:ring-[#348765]"}>
      <span className="grid size-11 place-items-center rounded-xl bg-[#F5EDF9] text-[#9770AB]"><UsersRound className="size-5"/></span>
      <strong className="text-sm text-[#2E5040]">{t("Family members","أفراد العيلة","Membres de la famille")}</strong>
      <span className="text-xs leading-snug text-[#6C8072]">{t("Profiles and preferences","الملفات والتفضيلات","Profils et préférences")}</span>
     </Link>
    </div>
    {ready&&taskCounts.overdue>0&&<button type="button" onClick={()=>setView("tasks")} className="flex min-h-12 w-full items-center gap-2 rounded-xl border border-[#E8DECE] bg-[#FFF8EE] px-4 text-start text-sm font-semibold text-[#876544]">
     <ClipboardList className="size-5 shrink-0"/>{taskCounts.overdue} {t("tasks need a look","مهام بدها مراجعة","tâches demandent votre attention")}<ArrowRight className="ms-auto size-4 rtl:rotate-180"/>
    </button>}
   </>:<>
    <div className="flex items-center justify-between gap-3">
     <button type="button" onClick={()=>{setView("overview");setCalendarFocus(undefined);}}
      className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#D8E6DC] bg-white px-4 text-sm font-bold text-[#396E52]">
      <ArrowLeft className="size-4 rtl:rotate-180"/>{t("Family home","العودة للعيلة","Accueil famille")}
     </button>
     <span className="text-xs font-bold text-[#6D8074]">{view==="calendar"?t("Special moments","المناسبات","Moments importants"):view==="plans"?t("Our plans","خططنا","Nos projets"):t("Family tasks","مهام العيلة","Tâches familiales")}</span>
    </div>
    {view==="calendar"&&<FamilyCalendarWorkspace key={calendarFocus??"calendar"} embedded {...(calendarFocus?{focusDate:calendarFocus}:{})}/>}
    {view==="plans"&&<PlansWorkspace embedded/>}
    {view==="tasks"&&<FamilyTasksPanel/>}
   </>}
   <details className="px-2 text-xs text-[#718275]">
    <summary className="min-h-10 cursor-pointer font-semibold">{t("Private pilot · Saved on this device","تجربة خاصة · محفوظة عالجهاز","Essai privé · Enregistré sur cet appareil")}</summary>
    <p>{t("Family records are saved in this browser. Shared household accounts and background reminders are not active.","معلومات العيلة محفوظة بهالمتصفح. ما في مزامنة عائلية أو تذكيرات تلقائية بعد.","Les données restent dans ce navigateur. La synchronisation et les rappels automatiques ne sont pas activés.")}</p>
   </details>
  </div>
 </AppShell>;
}
