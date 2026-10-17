import {Link} from "@tanstack/react-router";
import {ArrowRight,Lightbulb,ShieldAlert} from "lucide-react";
import {useI18n} from "@/lib/i18n";
import {useLocalState} from "@/lib/storage";
import {sampleMoney,type MoneyState} from "@/lib/money";
import {defaultFamilyPreferences} from "@/lib/familyPreferences";
import {selectFamilyPriority} from "@/lib/familyPriority";
import {FAMILY_PLANS_KEY,type FamilyPlan} from "@/lib/familyPlans";

/** A single next action on Today, not a feed of repetitive financial alerts. */
export function FamilyPriorityCard(){
 const {lang}=useI18n(),ar=lang==="ar";
 const [money,,moneyReady]=useLocalState<MoneyState>("money",sampleMoney());
 const [prefs,,prefsReady]=useLocalState("familyPreferences",defaultFamilyPreferences);
 const [plans,,plansReady]=useLocalState<FamilyPlan[]>(FAMILY_PLANS_KEY,[]);
 if(!moneyReady||!prefsReady||!plansReady)return null;
 const priority=selectFamilyPriority(money,prefs,new Date(),plans);
 if(!priority)return null;
 const urgent=priority.severity==="attention";
 const Icon=urgent?ShieldAlert:Lightbulb;
 return <section className={"mt-5 rounded-2xl border p-4 sm:p-5 "+(urgent?
  "border-[#E7DDC8] bg-[#FFF9EF]":"border-[#DCE8DA] bg-[#F3F8F0]")}
  aria-label={ar?"الأولوية المقترحة":"Suggested next priority"}>
  <div className="flex items-start gap-3">
   <span className={"grid size-11 shrink-0 place-items-center rounded-xl bg-white "+(urgent?"text-[#957047]":"text-[#44715B]")}>
    <Icon className="size-5" aria-hidden="true"/>
   </span>
   <div className="min-w-0 flex-1">
    <p className="text-[11px] font-semibold uppercase tracking-wider text-[#6B796A]">
     {ar?"خطوة مهمة لعائلتك":"ONE USEFUL NEXT STEP"}
    </p>
    <h2 className="mt-1 text-base font-semibold text-ink">{ar?priority.titleAr:priority.titleEn}</h2>
    <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{ar?priority.detailAr:priority.detailEn}</p>
    <Link to="/money" className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-full bg-white px-3.5 text-xs font-semibold text-brand ring-1 ring-[#D9E5D6] hover:bg-[#F6FAF4]">
     {ar?priority.actionAr:priority.actionEn}<ArrowRight className="size-3.5 rtl:rotate-180"/>
    </Link>
   </div>
  </div>
  <p className="mt-3 text-[11px] text-muted-foreground">
   {ar?"مبني على بياناتك المحفوظة في هذا المتصفح فقط. توصية للتخطيط وليست ضماناً مالياً.":
   "Based only on figures saved in this browser. A planning prompt, not a financial guarantee."}
  </p>
 </section>;
}
