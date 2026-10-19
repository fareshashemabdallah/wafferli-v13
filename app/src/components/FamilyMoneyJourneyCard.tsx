import {useState} from "react";
import {Link} from "@tanstack/react-router";
import {ArrowRight,CalendarClock,ChevronDown,Eye,EyeOff,HeartHandshake,ShieldCheck,Sprout,Wallet} from "lucide-react";
import {useI18n} from "@/lib/i18n";
import {useLocalState} from "@/lib/storage";
import {sampleMoney,sampleMembers,type MoneyState,type Member} from "@/lib/money";
import {FAMILY_PLANS_KEY,type FamilyPlan} from "@/lib/familyPlans";
import {defaultFamilyPreferences,type FamilyPreferences} from "@/lib/familyPreferences";
import type {FamilyMoment} from "@/lib/familyCalendar";
import {buildFamilyMoneyJourney,type MoneyJourneyFocus} from "@/lib/familyMoneyJourney";

const pillars=[
 {id:"understand",icon:Eye},
 {id:"protect",icon:ShieldCheck},
 {id:"prepare",icon:CalendarClock},
 {id:"live",icon:Sprout}
] as const;
/** Financial detail is hidden by default on shared devices; revealing is
 * explicit and session-only, no automated provider or AI transmission. */
export function FamilyMoneyJourneyCard(){
 const {lang}=useI18n(),ar=lang==="ar",t=(en:string,arabic:string)=>ar?arabic:en;
 const [revealed,setRevealed]=useState(false);
 const [money,,moneyReady]=useLocalState<MoneyState>("money",sampleMoney());
 const [members,,membersReady]=useLocalState<Member[]>("members",sampleMembers());
 const [moments,,momentsReady]=useLocalState<FamilyMoment[]>("familyCalendar",[]);
 const [plans,,plansReady]=useLocalState<FamilyPlan[]>(FAMILY_PLANS_KEY,[]);
 const [prefs,setPrefs,prefsReady]=useLocalState<FamilyPreferences>("familyPreferences",defaultFamilyPreferences);
 const ready=moneyReady&&membersReady&&momentsReady&&plansReady&&prefsReady;
 const journey=ready?buildFamilyMoneyJourney({money,members,moments,plans,preferences:prefs}):null;
 const selected=prefs.moneyJourneyFocus??"prepare";
 const checked=!!journey&&prefs.moneyJourneyLastReviewedWeek===journey.weekKey;
 return <section className="overflow-hidden rounded-[1.8rem] border border-[#C7DCD0] bg-white shadow-[0_16px_35px_-30px_rgba(24,69,54,.35)]" aria-label={t("Your family's money story","حكاية مال عيلتك")}>
  <div className="bg-gradient-to-r from-[#E0F5E7] via-[#EEF8EA] to-[#FFF2E1] p-4 sm:p-6">
   <div className="flex items-start gap-3">
    <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-white/85 text-[#2D795D]"><HeartHandshake className="size-6"/></span>
    <div className="min-w-0 flex-1">
     <p className="text-xs font-extrabold uppercase tracking-wider text-[#3D8867]">{t("YOUR FAMILY'S MONEY JOURNEY","رحلة مال عيلتك")}</p>
     <h2 className="mt-1 text-xl font-black text-[#1D4437] sm:text-2xl">{t("Take care of your money. Live well together.","اهتمّوا بمال العيلة، وعيشوا منيح سوا.")}</h2>
     <p className="mt-1 text-xs leading-relaxed text-[#536D5E]">{t(
      "Your money supports the people, plans and moments that matter. One gentle check-in at a time.",
      "مال العيلة بيساعدنا نهتم بالناس والخطط واللحظات المهمة. خطوة بسيطة كل مرة.")}</p>
    </div>
   </div>
   <button type="button" aria-expanded={revealed} disabled={!ready} onClick={()=>setRevealed(v=>!v)}
    className="mt-4 inline-flex min-h-12 w-full items-center justify-between gap-2 rounded-xl bg-[#2B7258] px-4 text-sm font-bold text-white transition hover:bg-[#246047] disabled:opacity-60">
    <span className="inline-flex items-center gap-2">{revealed?<EyeOff className="size-4"/>:<Eye className="size-4"/>}{revealed?t("Hide my private money story","اخفِ التفاصيل الخاصة"):t("Open my private weekly money story","افتح ملخّص المال الأسبوعي الخاص")}</span>
    <ChevronDown className={"size-4 transition-transform "+(revealed?"rotate-180":"")}/>
   </button>
   <p className="mt-2 text-[11px] text-[#627B6C]"><ShieldCheck className="me-1 inline size-3.5"/>
    {t("Financial details are hidden until you open them. No bank connection, automatic notification or financial score.",
    "التفاصيل المالية مخفية لحد ما تفتحها. لا ربط بنكي ولا إشعارات تلقائية ولا علامة تقييم مالية.")}</p>
  </div>
  {revealed&&journey&&<div className="space-y-4 p-4 sm:p-6" data-testid="family-money-journey-details">
   <div className="flex flex-wrap items-center justify-between gap-2">
    <p className="text-xs font-bold text-[#48745E]">{t("Your week: ","أسبوعك: ")}{journey.weekKey} – {journey.weekEnd}</p>
    <span className="text-xs text-[#708073]">{checked?t("Read this week","تمت قراءة الملخّص هالأسبوع"):t("A fresh look at your saved records","نظرة على بياناتك المحفوظة")}</span>
   </div>
   <div className="rounded-xl border border-[#DFE9DE] bg-[#F8FCF6] p-4">
    <p className="text-base font-extrabold text-[#245A43]">{ar?journey.statusAr:journey.statusEn}</p>
    <p className="mt-1 text-sm leading-relaxed text-[#4D6359]">{ar?journey.storyAr:journey.storyEn}</p>
    <p className="mt-2 text-xs text-[#6B7E70]">{t("This interpretation uses entered figures, not verified bank balances or financial guarantees.","هالمعلومات من أرقامك المدخلة، مش رصيد بنك مؤكّد أو ضمانة مالية.")}</p>
   </div>
   <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
    {pillars.map(p=>{
     const info=journey.dimensions.find(d=>d.id===p.id)!;
     const Icon=p.icon;
     return <button type="button" key={p.id} aria-pressed={selected===p.id}
      onClick={()=>setPrefs(old=>({...old,moneyJourneyFocus:p.id as MoneyJourneyFocus}))}
      className={"flex min-h-20 flex-col items-center justify-center gap-2 rounded-xl border p-3 text-center text-xs font-bold "+(selected===p.id?"border-[#43946F] bg-[#E4F4E8] text-[#1E6547]":"border-[#DCE9DF] bg-white text-[#51665A]")}>
      <Icon className="size-5"/>{ar?info.labelAr:info.labelEn}
     </button>;
    })}
   </div>
   <div className="rounded-xl bg-[#F3F8F2] p-3 text-sm text-[#496352]">
    <p className="text-xs font-bold">{t("About this part of your journey","عن هالجزء من رحلتك")}</p>
    <p className="mt-1 text-xs leading-relaxed">{ar?journey.dimensions.find(d=>d.id===selected)?.detailAr:journey.dimensions.find(d=>d.id===selected)?.detailEn}</p>
   </div>
   <div className="grid gap-3 sm:grid-cols-2">
    <section className="rounded-xl border border-[#DFE7DF] p-3">
     <h3 className="flex items-center gap-2 text-sm font-bold"><CalendarClock className="size-4 text-brand"/>{t("What to expect next","شو جاي بعدين")}</h3>
     {journey.nextMilestones.length?<div className="mt-2 space-y-2">
      {journey.nextMilestones.map((m,i)=><p key={i} className="text-xs leading-relaxed text-[#51675A]"><strong>{m.date}</strong> · {m.title}</p>)}
     </div>:<p className="mt-2 text-xs text-[#6C7D6C]">{t("No dated events found in the next 45 days; this may mean your records aren't complete.","ما لقينا مناسبات أو دفعات محفوظة خلال ٤٥ يوم؛ ممكن بياناتك بعدها ناقصة.")}</p>}
     <p className="mt-2 text-[11px] text-[#768579]">{t("Dates are taken from your entries; provider status is not verified.","المواعيد من بياناتك، وما تأكدنا منها عند الجهات.")}</p>
    </section>
    <section className="rounded-xl border border-[#DFE7DF] p-3">
     <h3 className="flex items-center gap-2 text-sm font-bold"><Wallet className="size-4 text-brand"/>{t("Our money picture","صورة مالية العيلة")}</h3>
     <p className="mt-2 text-xs leading-relaxed text-[#51675A]">{journey.knownFinances?
       t("Reviewed priority classifications: ","فئات تمت مراجعة أولويتها: ")+journey.reviewedCategories+
       t(" · Still unclassified: "," · ما زالت غير مصنفة: ")+journey.unclassifiedCategories:
       t("No complete real budget is required to begin. Your example numbers are not treated as your family's.","ما لازم تكمل الميزانية من أول يوم. الأرقام التجريبية مش أرقام عيلتك.")}</p>
     <p className="mt-2 text-xs text-[#6C7D6C]">{journey.hasActualCash?
       t("Cash is parent-entered, not bank-verified.","السيولة مدخلة من الأهل وغير مؤكدة من البنك."):
       t("No confirmed bank balance available.","ما في رصيد بنك مؤكد.")}</p>
     <Link to="/money" className="mt-2 inline-flex min-h-10 items-center gap-1 text-xs font-bold text-brand underline">{t("Review our money","راجع مال العيلة")}<ArrowRight className="size-4 rtl:rotate-180"/></Link>
    </section>
   </div>
   <div className="rounded-xl border border-[#C7E4CD] bg-[#E9F6EB] p-4">
    <p className="text-xs font-extrabold uppercase tracking-wide text-[#417B56]">{t("ONE NEXT BEST ACTION","خطوة واحدة أهم")}</p>
    <h3 className="mt-1 text-base font-black text-[#24583C]">{ar?journey.next.titleAr:journey.next.titleEn}</h3>
    <p className="mt-1 text-xs leading-relaxed text-[#486753]">{ar?journey.next.detailAr:journey.next.detailEn}</p>
    <Link to={journey.next.route} className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-full bg-[#2D7857] px-4 text-xs font-bold text-white">{t("Take this step","اعمل هالخطوة")}<ArrowRight className="size-4 rtl:rotate-180"/></Link>
   </div>
   <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#E1EAE2] pt-3">
    <p className="max-w-[560px] text-[11px] leading-relaxed text-[#788777]">{t("Marking this check-in as read never confirms a bill was paid, a commitment was covered, or an expense happened.","قراءة الملخّص لا تعني دفع الفواتير أو تغطية التزام أو حدوث مصروف.")}</p>
    <button type="button" disabled={checked} onClick={()=>setPrefs(old=>({...old,moneyJourneyLastReviewedWeek:journey.weekKey}))}
     className="min-h-10 rounded-full border border-[#BED8C2] px-3 text-xs font-bold text-brand disabled:opacity-55">
     {checked?t("Read this week","تمت القراءة"):t("Mark check-in as read","علّم الملخّص كمقروء")}
    </button>
   </div>
  </div>}
 </section>;
}
