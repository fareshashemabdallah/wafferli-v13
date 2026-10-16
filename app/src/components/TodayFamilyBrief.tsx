import {useState} from "react";
import {Link} from "@tanstack/react-router";
import {ArrowRight,Bell,ChevronDown,Sparkles,ShieldAlert} from "lucide-react";
import {CalendarReminderExport} from "@/components/CalendarReminderExport";
import {useI18n} from "@/lib/i18n";
import {useLocalState} from "@/lib/storage";
import {defaultFamilyPreferences,type FamilyPreferences} from "@/lib/familyPreferences";
import {FAMILY_SETUP_PREFERENCES_KEY} from "@/lib/familySetup";
import {FAMILY_PLANS_KEY,type FamilyPlan} from "@/lib/familyPlans";
import {FAMILY_TASKS_KEY,type FamilyTask} from "@/lib/familyTasks";
import {FAMILY_WISHLIST_KEY,type WishlistItem} from "@/lib/familyWishlist";
import {sampleMoney,sampleMembers,type MoneyState,type Member} from "@/lib/money";
import type {FamilyMoment} from "@/lib/familyCalendar";
import {buildFamilyAttention,snoozeAttention,FAMILY_ATTENTION_SNOOZES_KEY,type AttentionSnoozes} from "@/lib/familyAttention";
import {buildFamilyDecisionBrief} from "@/lib/familyDecisionBrief";
import {buildTodaySignals} from "@/lib/todaySignals";

/** One parent-facing briefing replaces parallel attention and decision panels
 * on Today. All inputs remain local; none is uploaded or silently altered. */
export function TodayFamilyBrief(){
 const {lang}=useI18n(),ar=lang==="ar";
 const [money,,moneyReady]=useLocalState<MoneyState>("money",sampleMoney());
 const [members,,membersReady]=useLocalState<Member[]>("members",sampleMembers());
 const [prefs,,prefsReady]=useLocalState<FamilyPreferences>("familyPreferences",defaultFamilyPreferences);
 const [confirmed,,confirmedReady]=useLocalState(FAMILY_SETUP_PREFERENCES_KEY,false);
 const [plans,,plansReady]=useLocalState<FamilyPlan[]>(FAMILY_PLANS_KEY,[]);
 const [tasks,,tasksReady]=useLocalState<FamilyTask[]>(FAMILY_TASKS_KEY,[]);
 const [wishlist,,wishlistReady]=useLocalState<WishlistItem[]>(FAMILY_WISHLIST_KEY,[]);
 const [moments,,momentsReady]=useLocalState<FamilyMoment[]>("familyCalendar",[]);
 const [snoozes,setSnoozes,snoozesReady]=useLocalState<AttentionSnoozes>(FAMILY_ATTENTION_SNOOZES_KEY,{});
 const [more,setMore]=useState(false);
 if(!moneyReady||!membersReady||!prefsReady||!confirmedReady||!plansReady||
    !tasksReady||!wishlistReady||!momentsReady||!snoozesReady)return null;
 if(prefs.notificationFrequency==="off")return null;
 const now=new Date();
 const attention=buildFamilyAttention({
  money,members,preferences:prefs,preferencesConfirmed:confirmed,
  plans,tasks,wishlist,moments,snoozes,now,maxItems:20
 });
 // Never surface a second suggestion stream while onboarding is incomplete;
 // advice is shown only for the topics the parent explicitly enabled.
 const decisions=confirmed&&(prefs.financeTips||prefs.lifestyle||prefs.shoppingTips)?
  buildFamilyDecisionBrief({money,members,plans,tasks,wishlist,moments,preferences:prefs,now}).steps:[];
 const signals=buildTodaySignals(attention,decisions);
 if(!signals.length)return null;
 const first=signals[0]!;
 const other=signals.slice(1);
 return <section className="mt-5 rounded-2xl border border-[#DCE7DC] bg-[#F5F9F3] p-4 sm:p-5"
   aria-label={ar?"ملخص يوم العائلة":"Your family today"}>
  <div className="flex items-center gap-3">
   <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white text-brand">
    <Sparkles className="size-5" aria-hidden="true"/>
   </span>
   <div className="flex-1">
    <p className="section-eyebrow">{ar?"دبّرنا اليوم":"YOUR FAMILY TODAY"}</p>
    <h2 className="mt-1 text-lg font-semibold">{ar?"خطوتك الأهم اليوم":"One helpful next step"}</h2>
   </div>
  </div>
  <article className={"mt-4 rounded-xl border p-4 "+(first.urgency==="critical"?
   "border-[#E7C5B4] bg-[#FFF8F1]":"border-[#DEE9DC] bg-white")}>
   <div className="flex items-start gap-2">
    {first.urgency==="critical"?
     <ShieldAlert className="mt-0.5 size-5 shrink-0 text-[#A26646]" aria-hidden="true"/>:
     <Bell className="mt-0.5 size-5 shrink-0 text-brand" aria-hidden="true"/>}
    <div className="min-w-0 flex-1">
     <h3 className="text-base font-semibold">{ar?first.titleAr:first.titleEn}</h3>
     <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{ar?first.detailAr:first.detailEn}</p>
     <div className="mt-3 flex flex-wrap items-center gap-2">
      <Link to={first.link} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-brand px-4 text-xs font-semibold text-white">
       {ar?first.actionAr:first.actionEn}<ArrowRight className="size-4 rtl:rotate-180"/>
      </Link>
      {first.canSnooze&&first.attention&&<button type="button"
       onClick={()=>setSnoozes(old=>snoozeAttention(old,first.attention!,new Date()))}
       className="min-h-11 rounded-full px-3 text-xs font-semibold text-muted-foreground">
       {ar?"ذكرني لاحقاً":"Remind me later"}
      </button>}
     </div>
    </div>
   </div>
  </article>
  {other.length>0&&<div className="mt-3">
   <button type="button" aria-expanded={more} onClick={()=>setMore(v=>!v)}
    className="flex min-h-11 w-full items-center justify-between gap-3 rounded-xl border border-[#DDE9DA] bg-white px-4 py-2 text-sm font-semibold text-brand">
    {ar?"خطوات أخرى ممكنة":"Other useful steps"} ({other.length})
    <ChevronDown className={"size-4 transition "+(more?"rotate-180":"")} aria-hidden="true"/>
   </button>
   {more&&<div className="mt-2 space-y-2">
    {other.map(item=><article key={item.key} className="rounded-xl border border-[#E2E9DF] bg-white p-3">
     <h3 className="text-sm font-semibold">{ar?item.titleAr:item.titleEn}</h3>
     <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{ar?item.detailAr:item.detailEn}</p>
     <div className="mt-2 flex flex-wrap items-center gap-2">
      <Link to={item.link} className="inline-flex min-h-10 items-center gap-1 rounded-full bg-[#EDF4EA] px-3 text-xs font-semibold text-brand">
       {ar?item.actionAr:item.actionEn} →
      </Link>
      {item.canSnooze&&item.attention&&<button type="button"
       onClick={()=>setSnoozes(old=>snoozeAttention(old,item.attention!,new Date()))}
       className="min-h-10 px-2 text-xs text-muted-foreground">
       {ar?"ذكّرني لاحقاً":"Remind later"}
      </button>}
     </div>
    </article>)}
   </div>}
  </div>}
  <details className="mt-3">
   <summary className="cursor-pointer py-2 text-xs font-semibold text-brand">
    {ar?"تذكيرات التقويم والخيارات الإضافية":"Calendar reminders and additional options"}
   </summary>
   <CalendarReminderExport money={money} members={members} moments={moments}/>
   <Link to="/advisor" className="mt-3 inline-flex min-h-11 items-center gap-2 text-xs font-semibold text-brand underline">
    {ar?"اسأل دبّرنا عن قرار عائلي":"Ask Dabberna about a family decision"} →
   </Link>
  </details>
  <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
   {ar?"الخطوات تعتمد على معلومات هذا الجهاز فقط. لا يوجد تحقق بنكي أو أسعار مباشرة أو إشعارات خلفية.":"Guidance is based only on information you saved on this device; not bank-verified, live-priced or background notifications."}
  </p>
 </section>;
}
