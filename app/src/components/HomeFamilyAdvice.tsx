import {Link} from "@tanstack/react-router";
import {ArrowRight,CalendarHeart,ShieldAlert} from "lucide-react";
import {HomePlanHighlight} from "@/components/HomePlanHighlight";
import {useI18n} from "@/lib/i18n";
import {useLocalState} from "@/lib/storage";
import {sampleMembers,sampleMoney,type Member,type MoneyState} from "@/lib/money";
import {FAMILY_PLANS_KEY,type FamilyPlan} from "@/lib/familyPlans";
import {defaultFamilyPreferences,type FamilyPreferences} from "@/lib/familyPreferences";
import {FAMILY_SETUP_PREFERENCES_KEY} from "@/lib/familySetup";
import {selectFamilyLifeAdvice} from "@/lib/familyLifeAdvice";
import type {FamilyMoment} from "@/lib/familyCalendar";

/** Uses existing saved family plans instead of displaying a second duplicate
 * plan card. Never shows generic inspiration when guidance is turned off. */
export function HomeFamilyAdvice(){
 const {lang}=useI18n(),ar=lang==="ar";
 const [money,,moneyReady]=useLocalState<MoneyState>("money",sampleMoney());
 const [members,,membersReady]=useLocalState<Member[]>("members",sampleMembers());
 const [prefs,,prefsReady]=useLocalState<FamilyPreferences>("familyPreferences",defaultFamilyPreferences);
 const [confirmed,,confirmedReady]=useLocalState(FAMILY_SETUP_PREFERENCES_KEY,false);
 const [plans,,plansReady]=useLocalState<FamilyPlan[]>(FAMILY_PLANS_KEY,[]);
 const [moments,,momentsReady]=useLocalState<FamilyMoment[]>("familyCalendar",[]);
 if(!moneyReady||!membersReady||!prefsReady||!confirmedReady||!plansReady||!momentsReady)return null;
 const advice=selectFamilyLifeAdvice({money,members,preferences:prefs,preferencesConfirmed:confirmed,plans,moments});
 if(!advice)return <HomePlanHighlight/>;
 const Icon=advice.urgency==="attention"?ShieldAlert:CalendarHeart;
 return <section className={"editorial-card mt-5 p-4 sm:p-5 "+(advice.urgency==="attention"?"border-[#E8DAC5] bg-[#FFF9F1]":"bg-[#F6F9F3]")}
  aria-label={ar?"نصيحة لخطة العائلة":"Family plan insight"}>
  <div className="flex items-start gap-3">
   <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-white text-brand"><Icon className="size-5"/></span>
   <div className="min-w-0 flex-1">
    <p className="section-eyebrow">{ar?"خطة تناسب حياة العائلة":"A THOUGHTFUL FAMILY PLAN"}</p>
    <h2 className="mt-1 text-base font-semibold">{ar?advice.titleAr:advice.titleEn}</h2>
    <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{ar?advice.detailAr:advice.detailEn}</p>
    <Link to={advice.link} className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-full bg-brand px-4 text-xs font-semibold text-white">
     {ar?advice.actionAr:advice.actionEn}<ArrowRight className="size-3.5 rtl:rotate-180"/>
    </Link>
   </div>
  </div>
  <p className="mt-3 text-[11px] text-muted-foreground">{ar?
    "اقتراح محلي يعتمد على المعلومات التي أدخلتها. ليس حجزاً أو تأكيداً لتوفر المال أو للأسعار.":
    "Based on your entries on this device. Not a booking, verified price or guarantee of affordability."}</p>
 </section>;
}
