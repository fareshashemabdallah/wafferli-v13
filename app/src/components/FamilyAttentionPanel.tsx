import {Link} from "@tanstack/react-router";
import {useState} from "react";
import {dateKey} from "@/lib/familyCalendar";
import {CalendarReminderExport} from "@/components/CalendarReminderExport";
import {ArrowRight,Bell,CalendarDays,ShieldAlert,Sparkles,Wallet} from "lucide-react";
import {useI18n} from "@/lib/i18n";
import {useLocalState} from "@/lib/storage";
import {defaultFamilyPreferences,type FamilyPreferences} from "@/lib/familyPreferences";
import {FAMILY_SETUP_PREFERENCES_KEY} from "@/lib/familySetup";
import {FAMILY_PLANS_KEY,type FamilyPlan} from "@/lib/familyPlans";
import {FAMILY_TASKS_KEY,type FamilyTask} from "@/lib/familyTasks";
import {sampleMoney,sampleMembers,type MoneyState,type Member} from "@/lib/money";
import type {FamilyMoment} from "@/lib/familyCalendar";
import {buildFamilyAttention,snoozeAttention,
 FAMILY_ATTENTION_SNOOZES_KEY,type AttentionSnoozes,type AttentionItem} from "@/lib/familyAttention";

const iconFor=(item:AttentionItem)=>item.category==="finance"||item.category==="bill"?Wallet:
 item.category==="occasion"?CalendarDays:item.category==="inspiration"?Sparkles:ShieldAlert;

/** One in-app attention queue across family life; no push, background jobs or
 * financial changes. Reads only already-saved browser data. */
export function FamilyAttentionPanel(){
 const {lang}=useI18n(),ar=lang==="ar";
 const [money,,moneyReady]=useLocalState<MoneyState>("money",sampleMoney());
 const [members,,membersReady]=useLocalState<Member[]>("members",sampleMembers());
 const [prefs,,prefsReady]=useLocalState<FamilyPreferences>("familyPreferences",defaultFamilyPreferences);
 const [confirmed,,confirmedReady]=useLocalState(FAMILY_SETUP_PREFERENCES_KEY,false);
 const [plans,,plansReady]=useLocalState<FamilyPlan[]>(FAMILY_PLANS_KEY,[]);
 const [tasks,,tasksReady]=useLocalState<FamilyTask[]>(FAMILY_TASKS_KEY,[]);
 const [moments,,momentsReady]=useLocalState<FamilyMoment[]>("familyCalendar",[]);
 const [snoozes,setSnoozes,snoozesReady]=useLocalState<AttentionSnoozes>(FAMILY_ATTENTION_SNOOZES_KEY,{});
 const [expanded,setExpanded]=useState(false);
 const [showSnoozed,setShowSnoozed]=useState(false);
 if(!moneyReady||!membersReady||!prefsReady||!confirmedReady||!plansReady||!tasksReady||!momentsReady||!snoozesReady)return null;
 if(prefs.notificationFrequency==="off")return null;
 const now=new Date();
 const allItems=buildFamilyAttention({money,members,preferences:prefs,preferencesConfirmed:confirmed,plans,moments,tasks,snoozes,now,maxItems:20});
 const items=expanded?allItems:allItems.slice(0,4);
 const snoozed=Object.entries(snoozes).filter(([key,until])=>key.length<240&&until>dateKey(now)).slice(0,60);
 if(!items.length&&!snoozed.length)return null;
 return <section className="mt-5 rounded-2xl border border-[#DDE6DB] bg-[#F9FBF6] p-4 sm:p-5"
  aria-label={ar?"الأمور التي تستحق انتباهك":"Family attention center"}>
  <div className="flex flex-wrap items-start justify-between gap-3">
   <div className="flex items-start gap-3">
    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white text-brand">
     <Bell className="size-5" aria-hidden="true"/>
    </span>
    <div>
     <p className="section-eyebrow">{ar?"ذكاء العائلة":"FAMILY INTELLIGENCE"}</p>
     <h2 className="mt-1 text-lg font-semibold">{ar?"الأهم لعيلتك هلق":"What deserves your attention"}</h2>
     <p className="mt-1 text-xs text-muted-foreground">{ar?
      "حتى ٤ أولويات مبنية فقط على بياناتك المحفوظة هنا، مرتبة حسب الأهمية.":
      "Up to four actionable signals, prioritized from the information on this device."}</p>
    </div>
   </div>
   <span className="rounded-full border border-[#D5E3D6] bg-white px-3 py-1 text-xs font-semibold text-brand">
    {allItems.length} {ar?"للمراجعة":"to review"}
   </span>
  </div>
  {items.length===0&&<p className="mt-4 rounded-xl bg-white p-3 text-xs text-muted-foreground">{ar?"لا توجد أولويات ظاهرة حالياً. يمكنك مراجعة التنبيهات المؤجلة أدناه.":"No currently visible priorities. You can review snoozed reminders below."}</p>}
  <div className="mt-4 space-y-2.5">
   {items.map(item=>{
    const Icon=iconFor(item);
    const urgent=item.severity==="critical";
    return <article key={item.key} className={"rounded-xl border p-3 sm:p-4 "+
     (urgent?"border-[#EBD1C7] bg-[#FFF7F2]":"border-[#E3EAE0] bg-white")}>
     <div className="flex items-start gap-3">
      <span className={"grid size-9 shrink-0 place-items-center rounded-lg "+
       (urgent?"bg-[#FAE5D7] text-[#A15D47]":"bg-[#EDF4EC] text-[#4F755E]")}>
       <Icon className="size-4.5" aria-hidden="true"/>
      </span>
      <div className="min-w-0 flex-1">
       <h3 className="text-sm font-semibold">{ar?item.titleAr:item.titleEn}</h3>
       <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{ar?item.detailAr:item.detailEn}</p>
       <div className="mt-2.5 flex flex-wrap items-center gap-2">
        <Link to={item.link} className="inline-flex min-h-10 items-center gap-1.5 rounded-full bg-[#EAF1E8] px-3 text-xs font-semibold text-brand hover:bg-[#DDEADD]">
         {ar?item.actionAr:item.actionEn}<ArrowRight className="size-3.5 rtl:rotate-180"/>
        </Link>
        {item.canSnooze&&<button type="button"
          onClick={()=>setSnoozes(old=>snoozeAttention(old,item,new Date()))}
          className="min-h-10 rounded-full px-3 text-xs font-semibold text-muted-foreground underline-offset-2 hover:underline">
          {ar?item.severity==="gentle"?"أجّل ٧ أيام":"ذكّرني بكرا":item.severity==="gentle"?"Snooze 7 days":"Tomorrow"}
        </button>}
       </div>
      </div>
     </div>
    </article>;
   })}
  </div>
  <div className="mt-3 flex flex-wrap gap-3 text-xs">
   {allItems.length>4&&<button type="button" onClick={()=>setExpanded(x=>!x)}
    className="min-h-10 rounded-full border border-[#D8E4D6] bg-white px-3 font-semibold text-brand">
    {expanded?(ar?"إظهار أهم ٤ فقط":"Show top four"):(ar?"عرض كل الأولويات":"Show all priorities")} ({allItems.length})
   </button>}
   {snoozed.length>0&&<button type="button" onClick={()=>setShowSnoozed(x=>!x)}
    className="min-h-10 rounded-full border border-[#D8E4D6] bg-white px-3 font-semibold text-brand">
    {ar?"التنبيهات المؤجلة":"Snoozed reminders"} ({snoozed.length})
   </button>}
  </div>
  {showSnoozed&&snoozed.length>0&&<div className="mt-3 space-y-2 rounded-xl border border-[#E1E9DE] bg-white p-3">
   <p className="text-xs font-semibold">{ar?"إدارة التأجيل المحلي":"Manage local snoozes"}</p>
   {snoozed.map(([key,until])=><div key={key} className="flex flex-wrap items-center justify-between gap-2 border-t border-[#EDF2EA] py-2 text-xs">
    <span className="min-w-0 flex-1 text-muted-foreground">{key.split(":")[0]} · {ar?"حتى ":"Until "}{until}</span>
    <button type="button" className="min-h-10 rounded-full bg-[#EEF5EA] px-3 font-semibold text-brand"
     onClick={()=>setSnoozes(old=>Object.fromEntries(Object.entries(old).filter(([k])=>k!==key)))}>
     {ar?"أعد التذكير":"Restore reminder"}
    </button>
   </div>)}
  </div>}
  <CalendarReminderExport money={money} members={members} moments={moments}/>
  <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">{ar?
   "هذه تذكيرات داخل التطبيق فقط؛ لا نرسل إشعارات خلفية أو نؤكد الدفع أو الرصيد البنكي. تأجيل التنبيه لا يغيّر موعد الفاتورة أو أي مبلغ.":
   "In-app guidance only. No background notifications, bank verification or payment status checks. Snoozing changes visibility, never the bill or your balance."}</p>
 </section>;
}
