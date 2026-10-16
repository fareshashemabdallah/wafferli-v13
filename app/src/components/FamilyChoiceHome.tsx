import {Link} from "@tanstack/react-router";
import {ArrowRight,HeartPulse,ShoppingBag,Sun} from "lucide-react";
import {useI18n} from "@/lib/i18n";
import {fmtJOD,useLocalState} from "@/lib/storage";
import {sampleMoney,type MoneyState} from "@/lib/money";
import {budgetAlignment} from "@/lib/financeAlignment";
import {budgetPlainResult} from "@/lib/budgetPlainResult";
import {needsStarterBudget} from "@/lib/starterBudget";
import {defaultFamilyPreferences,type FamilyPreferences} from "@/lib/familyPreferences";
import {FAMILY_SETUP_PREFERENCES_KEY} from "@/lib/familySetup";

export function FamilyChoiceHome({onNavigate}:{onNavigate?:()=>void}){
 const {lang}=useI18n(),ar=lang==="ar";
 const [money,,moneyReady]=useLocalState<MoneyState>("money",sampleMoney());
 const [prefs,,prefsReady]=useLocalState<FamilyPreferences>("familyPreferences",defaultFamilyPreferences);
 const [confirmed,,confirmedReady]=useLocalState(FAMILY_SETUP_PREFERENCES_KEY,false);
 const financialReady=moneyReady&&!needsStarterBudget(money);
 const financialSummary=financialReady?budgetAlignment(money):null;
 const financialResult=financialSummary?budgetPlainResult(financialSummary):null;
 const financialHeadline=financialSummary?.status==="surplus"?
  (ar?"غير مخصّص هالشهر: ":"Unallocated this month: ")+fmtJOD(financialSummary.gap):
  financialSummary?.status==="deficit"?
  (ar?"ميزانيتك ناقصها: ":"Your monthly plan is short by ")+fmtJOD(-financialSummary.gap):
  financialResult?(ar?financialResult.titleAr:financialResult.titleEn):
  (ar?"٣ أرقام بسيطة تعطينا الصورة، بدون ربط بنك.":"Start with three numbers; no bank connection needed.");
 const outingDetail=prefsReady&&confirmedReady&&confirmed&&prefs.lifestyle?
  (prefs.city.trim()?prefs.city.trim().slice(0,60)+" · ":"")+
   (prefs.outingLimit>0?prefs.outingLimit.toFixed(0)+" JOD "+(ar?"ميزانية طلعتك المخططة":"planned outing ceiling"):
    (ar?"ابدأ بفكرة قريبة من العيلة":"Find a suitable family activity")):
  (ar?"اكتشف أفكاراً تناسب الكبار والصغار، بدون تعبئة استمارة طويلة.":
      "Explore ideas for adults and children without filling a long form.");
 return <section className="mt-6" aria-label={ar?"كيف بيساعدك دبّرنا":"Three things Dabberna can help with"}>
  <p className="section-eyebrow">{ar?"ابدأ بالسؤال، مش بالبيانات":"START WITH YOUR QUESTION"}</p>
  <h2 className="mt-1 text-2xl font-semibold text-ink">{ar?"شو بتحب تعرف اليوم؟":"What would help your family today?"}</h2>
  <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">{ar?
   "اختار نتيجة بدك توصلها. دبّرنا بيستعمل فقط الأرقام والتفضيلات اللي اخترت تحفظها، وبيطلب الناقص عند الحاجة.":
   "Choose the outcome you need. Dabberna reuses information you've chosen to save, and asks for missing details only when they're needed."}</p>
  <div className="mt-4 grid gap-3">
   <Link to="/money" onClick={onNavigate}
    className="soft-action flex min-h-32 items-center gap-4 rounded-2xl bg-[#EDF5E9] p-4 sm:p-5">
    <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-white text-[#36694E]">
     <HeartPulse className="size-7" strokeWidth={1.6} aria-hidden="true"/>
    </span>
    <span className="min-w-0 flex-1">
     <span className="block text-lg font-semibold text-ink">{ar?"كيف وضع ميزانية عيلتي؟":"How is my family doing financially?"}</span>
     <span className="mt-1.5 block text-sm leading-relaxed text-muted-foreground">
      {financialHeadline}
     </span>
     {financialResult&&<span className="mt-1 block text-xs text-muted-foreground">{ar?
      "هذه نتيجة تخطيط وليست رصيد بنك مؤكّداً.":"A planning result, not confirmed spendable bank cash."}</span>}
     <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-brand">
      {ar?(financialResult?"فهم النتيجة":"شوف النتيجة"):(financialResult?"Understand the result":"Get my answer")}
      <ArrowRight className="size-4 rtl:rotate-180" aria-hidden="true"/>
     </span>
    </span>
   </Link>
   <Link to="/explore/weekend" onClick={onNavigate}
    className="soft-action flex min-h-32 items-center gap-4 rounded-2xl bg-[#FFF2E8] p-4 sm:p-5">
    <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-white text-[#B17A5F]">
     <Sun className="size-7" strokeWidth={1.6} aria-hidden="true"/>
    </span>
    <span className="min-w-0 flex-1">
     <span className="block text-lg font-semibold text-ink">{ar?"شو ممكن نعمل سوا هالأسبوع؟":"What can we enjoy together?"}</span>
     <span className="mt-1.5 block text-sm leading-relaxed text-muted-foreground">{outingDetail}</span>
     <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-brand">
      {ar?"شوف شو بيناسب ميزانيتنا":"See what we could plan"}<ArrowRight className="size-4 rtl:rotate-180" aria-hidden="true"/>
     </span>
    </span>
   </Link>
   <Link to="/explore/market" onClick={onNavigate}
    className="soft-action flex min-h-32 items-center gap-4 rounded-2xl bg-[#EAF1F5] p-4 sm:p-5">
    <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-white text-[#527485]">
     <ShoppingBag className="size-7" strokeWidth={1.6} aria-hidden="true"/>
    </span>
    <span className="min-w-0 flex-1">
     <span className="block text-lg font-semibold text-ink">{ar?"شو أشتري ومن وين وبأي سعر؟":"What should I buy, and where?"}</span>
     <span className="mt-1.5 block text-sm leading-relaxed text-muted-foreground">{ar?
      "ابحث عن المنتج في مواقع متاجر أردنية حقيقية. أسعار داخل دبّرنا ستحتاج مصدر بيانات متصل.":
      "Find the product at real Jordanian retailers; in-app live prices require a connected source."}</span>
     <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-brand">
      {ar?"ابحث عن المنتج":"Find products online"}<ArrowRight className="size-4 rtl:rotate-180" aria-hidden="true"/>
     </span>
    </span>
   </Link>
  </div>
 </section>;
}
