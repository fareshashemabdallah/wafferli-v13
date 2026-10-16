import {Link} from "@tanstack/react-router";
import {ArrowRight,HeartHandshake,ShieldCheck} from "lucide-react";
import {useI18n} from "@/lib/i18n";
import {useLocalState} from "@/lib/storage";
import {sampleMembers,sampleMoney,type Member,type MoneyState} from "@/lib/money";
import {FAMILY_PLANS_KEY,type FamilyPlan} from "@/lib/familyPlans";
import {FAMILY_TASKS_KEY,type FamilyTask} from "@/lib/familyTasks";
import {defaultFamilyPreferences,type FamilyPreferences} from "@/lib/familyPreferences";
import {FAMILY_SETUP_PREFERENCES_KEY} from "@/lib/familySetup";
import type {FamilyMoment} from "@/lib/familyCalendar";
import {buildFamilyDecisionBrief} from "@/lib/familyDecisionBrief";
import {FAMILY_WISHLIST_KEY,type WishlistItem} from "@/lib/familyWishlist";

/** No external data or hidden LLM calls. Parents control all inputs; this
 * view does not change any financial, calendar or plan records. */
export function FamilyDecisionBriefPanel(){
 const {lang}=useI18n(),ar=lang==="ar";
 const [money,,mReady]=useLocalState<MoneyState>("money",sampleMoney());
 const [members,,pReady]=useLocalState<Member[]>("members",sampleMembers());
 const [plans,,plReady]=useLocalState<FamilyPlan[]>(FAMILY_PLANS_KEY,[]);
 const [moments,,moReady]=useLocalState<FamilyMoment[]>("familyCalendar",[]);
 const [tasks,,tReady]=useLocalState<FamilyTask[]>(FAMILY_TASKS_KEY,[]);
 const [wishlist,,wReady]=useLocalState<WishlistItem[]>(FAMILY_WISHLIST_KEY,[]);
 const [prefs,,fReady]=useLocalState<FamilyPreferences>("familyPreferences",defaultFamilyPreferences);
 const [confirmed,,cReady]=useLocalState(FAMILY_SETUP_PREFERENCES_KEY,false);
 if(!mReady||!pReady||!plReady||!moReady||!tReady||!wReady||!fReady||!cReady)return null;
 if(!confirmed||prefs.notificationFrequency==="off"||(!prefs.lifestyle&&!prefs.financeTips&&!prefs.shoppingTips))return null;
 const brief=buildFamilyDecisionBrief({money,members,plans,moments,tasks,wishlist,preferences:prefs});
 return <section className="mt-5 rounded-2xl border border-[#DDE9D8] bg-[#F5F9F1] p-4 sm:p-5"
  aria-label={ar?"خطة أولويات الأسرة":"Connected family decisions"}>
  <div className="flex items-start gap-3">
   <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white text-brand">
    <HeartHandshake className="size-5"/>
   </span>
   <div>
    <p className="section-eyebrow">{ar?"قرارات عائلية مترابطة":"FAMILY INTELLIGENCE · CONNECTED STEPS"}</p>
    <h2 className="mt-1 text-lg font-semibold">{ar?brief.titleAr:brief.titleEn}</h2>
    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{ar?brief.contextAr:brief.contextEn}</p>
   </div>
  </div>
  <div className="mt-4 space-y-2.5">
   {brief.steps.map((step,i)=><article key={step.id} className="flex items-start gap-3 rounded-xl border border-[#DFE8DD] bg-white p-3">
    <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[#E7F1E6] text-xs font-bold text-brand">{i+1}</span>
    <div className="min-w-0 flex-1">
     <div className="flex flex-wrap items-center gap-2">
      <h3 className="text-sm font-semibold">{ar?step.titleAr:step.titleEn}</h3>
      {step.urgency==="important"&&<ShieldCheck className="size-4 text-[#A2734F]" aria-label={ar?"مهم":"Important"}/>}
     </div>
     <p className="mt-1 text-xs text-muted-foreground">{ar?step.detailAr:step.detailEn}</p>
     <Link to={step.link} className="mt-2 inline-flex min-h-10 items-center gap-1.5 rounded-full bg-[#EBF2E8] px-3 text-xs font-semibold text-brand">
      {ar?"راجع الخطوة":"Review next step"}<ArrowRight className="size-3.5 rtl:rotate-180"/>
     </Link>
    </div>
   </article>)}
  </div>
  <p className="mt-3 text-[11px] text-muted-foreground">{ar?brief.notesAr:brief.notesEn}</p>
 </section>;
}
