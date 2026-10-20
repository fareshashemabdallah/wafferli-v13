import {createFileRoute,Link} from "@tanstack/react-router";
import {useMemo,useState} from "react";
import {AppShell} from "@/components/AppShell";
import {OccasionPreparationSection} from "@/components/OccasionPreparationSection";
import {FamilyWishlistPanel} from "@/components/FamilyWishlistPanel";
import {useI18n} from "@/lib/i18n";
import {useLocalState,writeLocal} from "@/lib/storage";
import {type FamilyMoment,formatMomentDate} from "@/lib/familyCalendar";
import {sampleMembers,sampleMoney,type Member,type MoneyState} from "@/lib/money";
import {chooseOccasion,planKey,upcomingPlanEvents,type OccasionPlans} from "@/lib/occasionAdvisor";
import {FAMILY_PLANS_KEY,ACTIVE_PLAN_KEY,type FamilyPlan} from "@/lib/familyPlans";

export const Route=createFileRoute("/occasions")({
 head:()=>({meta:[
  {title:"Family occasions — Dabberna"},
  {name:"description",content:"Prepare gifts and celebrations on one canonical family-calendar-linked plan, without repeating financial entries."}
 ]}),component:OccasionPlanner
});
/** Single canonical occasion preparation surface.
 * Legacy occasionPlans are kept untouched and only read for historical notes
 * and optional ceiling migration when the parent explicitly starts a plan.
 */
export function OccasionPlanner(){
 const {lang}=useI18n(),ar=lang==="ar";
 const t=(en:string,arabic:string)=>ar?arabic:en;
 const [events,,eventsReady]=useLocalState<FamilyMoment[]>("familyCalendar",[]);
 const [members,,membersReady]=useLocalState<Member[]>("members",sampleMembers());
 const [oldPlans,,oldReady]=useLocalState<OccasionPlans>("occasionPlans",{});
 const [plans,,plansReady]=useLocalState<FamilyPlan[]>(FAMILY_PLANS_KEY,[]);
 const [money]=useLocalState<MoneyState>("money",sampleMoney());
 const [chosen,setChosen]=useState("");
 const [focused,setFocused]=useLocalState<string>("focusedOccasionKey","");
 const now=useMemo(()=>new Date(),[]);
 const upcoming=useMemo(()=>upcomingPlanEvents(events,members,now,180,ar).slice(0,24),[events,members,now,ar]);
 const active=chooseOccasion(upcoming,chosen,focused);
 const key=active?planKey(active):"";
 const plan=plans.find(p=>p.sourceRef==="occasion:"+key);
 const legacy=oldPlans[key];
 const ready=eventsReady&&membersReady&&oldReady&&plansReady;
 return <AppShell title={t("Plan a family moment","حضّر لمناسبة عائلية")}>
  <div className="mx-auto max-w-[900px] space-y-4">
   <header className="rounded-2xl border border-[#E4D9E2] bg-[#FFF7FB] p-4 sm:p-5">
    <h2 className="text-xl font-bold">{t("One occasion. One plan.","مناسبة واحدة، وخطة واحدة.")}</h2>
    <p className="mt-2 text-sm text-muted-foreground">{t(
     "The event remains in Family Calendar; gift, celebration and deadlines stay in its single linked Family Plan. Only a confirmed payment becomes an expense.",
     "المناسبة تبقى في تقويم العيلة، والهدية والاحتفال والمواعيد ضمن خطة واحدة مرتبطة بها. فقط الدفع المؤكد يتحوّل إلى مصروف.")}</p>
   </header>
   {!ready?<p role="status">{t("Loading family dates…","جارٍ تحميل مناسبات العيلة…")}</p>:
    upcoming.length===0?<section className="rounded-xl border bg-white p-4">
     <h3 className="font-bold">{t("Start with a family date","ابدأ بتاريخ للعيلة")}</h3>
     <p className="mt-2 text-sm text-muted-foreground">{t(
      "Add a birthday to a family profile or create an occasion in Calendar. No budget setup is required.",
      "أضف عيد ميلاد في ملف العيلة أو مناسبة في التقويم، من دون الحاجة إلى إعداد ميزانية.")}</p>
     <div className="mt-3 flex gap-3"><Link to="/space" className="font-semibold text-brand underline">{t("My Family","عيلتي")}</Link>
      <Link to="/calendar" className="font-semibold text-brand underline">{t("Calendar","التقويم")}</Link></div>
    </section>:<>
     <section className="rounded-xl border bg-white p-4">
      <h3 className="font-bold">{t("Which moment are you preparing?","أي مناسبة بدك تحضّر؟")}</h3>
      <div className="mt-3 flex gap-2 overflow-x-auto pb-2">
       {upcoming.map(event=><button key={planKey(event)} type="button"
        onClick={()=>{setChosen(planKey(event));setFocused(planKey(event));}}
        aria-pressed={key===planKey(event)}
        className={"min-w-36 shrink-0 rounded-xl border p-3 text-start text-xs "+
         (key===planKey(event)?"border-[#A65784] bg-[#FBE9F2]":"border-[#DBE6D9] bg-[#F9FCF8]")}>
        <strong className="block truncate">{event.title}</strong>
        <span className="mt-1 block text-muted-foreground">{formatMomentDate(event.occursOn,ar)}</span>
       </button>)}
      </div>
     </section>
     {active&&<OccasionPreparationSection key={key} event={active}/>}
     {plan&&<div className="flex flex-wrap gap-3 rounded-xl border bg-white p-3 text-sm">
      <Link to="/plans" onClick={()=>writeLocal(ACTIVE_PLAN_KEY,plan.id)}
       className="font-semibold text-brand underline">{t("Open this saved plan","افتح الخطة المحفوظة")}</Link>
      <Link to="/money" className="font-semibold text-brand underline">{t("Review family Money","راجع مالية العيلة")}</Link>
     </div>}
     {legacy&&<details className="rounded-xl border bg-white p-3">
      <summary className="min-h-10 cursor-pointer text-sm font-semibold text-brand">
       {t("Earlier occasion planning notes (read-only)","ملاحظات التخطيط القديمة (للقراءة فقط)")}
      </summary>
      <p className="mt-2 text-xs text-muted-foreground">{t(
       "These earlier entries remain saved on this device. A previous ceiling may be reused when you explicitly create the linked plan; these notes are no longer edited separately.",
       "الملاحظات القديمة محفوظة على الجهاز. قد يُستخدم سقف التكلفة السابق عند إنشاء الخطة المرتبطة بموافقتك، ولم تعد تُعدّل في سجل موازٍ.")}</p>
      {legacy.budgetJod!==null&&<p className="mt-2 text-sm">{t("Earlier ceiling: ","السقف السابق: ")}{legacy.budgetJod} JOD</p>}
      {legacy.chosenIdea&&<p className="text-sm">{t("Earlier idea reference: ","الفكرة السابقة: ")}{legacy.chosenIdea}</p>}
     </details>}
    </>}
   <details className="rounded-xl border bg-white p-4">
    <summary className="min-h-11 cursor-pointer text-sm font-semibold text-brand">
     {t("Optional: gift wishlist and price notes","اختياري: قائمة الهدايا والأسعار المسجّلة")}
    </summary>
    <FamilyWishlistPanel mode="gifts"/>
   </details>
   <div className="rounded-xl bg-[#F1F7EF] p-3 text-sm">
    <span>{t("Want to compare a price before buying? ","بدك تقارن السعر قبل الشراء؟ ")}</span>
    <Link to="/explore/smartbuy" className="font-semibold text-brand underline">{t("Compare and choose","قارن واختر")}</Link>
    <p className="mt-1 text-xs text-muted-foreground">{t(
     "A wish, a comparison or a planned gift never deducts cash. Financial advice uses only entered facts.",
     "الرغبة أو المقارنة أو التخطيط لهدية لا تخصم من الرصيد. الإرشاد المالي يعتمد فقط على ما أدخلته.")}</p>
   </div>
  </div>
 </AppShell>;
}
