import {useState} from "react";
import {Link} from "@tanstack/react-router";
import {ArrowRight,ExternalLink,HeartHandshake,SlidersHorizontal,ShieldCheck} from "lucide-react";
import {useI18n} from "@/lib/i18n";
import {useLocalState} from "@/lib/storage";
import {sampleMembers,type Member} from "@/lib/money";
import {defaultFamilyPreferences,type FamilyPreferences} from "@/lib/familyPreferences";
import {childAgeOptions,suggestedActivityThemes,activitySearchUrl,type DiscoveryPriority} from "@/lib/familyActivityDiscovery";

/** Parent-first discovery: real external searches, NEVER fabricated local events or paid placements. */
export function FamilyDiscoveryPanel(){
 const {lang}=useI18n(),ar=lang==="ar";
 const t=(en:string,arabic:string)=>ar?arabic:en;
 const [prefs,setPrefs,prefsReady]=useLocalState<FamilyPreferences>("familyPreferences",defaultFamilyPreferences);
 const [members,,membersReady]=useLocalState<Member[]>("members",sampleMembers());
 const [age,setAge]=useState<string>("all");
 const [showChoices,setShowChoices]=useState(false);
 const ages=membersReady?childAgeOptions(members):[];
 const ageNumber=age==="all"?null:Number(age);
 const priority:DiscoveryPriority=prefs.discoveryPriority??"balance";
 const themes=suggestedActivityThemes(ageNumber,priority,prefs.freeActivitiesFirst??false).slice(0,4);
 const location=prefs.city.trim()||"Amman";
 const update=<K extends keyof FamilyPreferences>(key:K,value:FamilyPreferences[K])=>setPrefs(old=>({...old,[key]:value}));
 return <section className="rounded-[1.6rem] border border-[#CFDFD5] bg-white p-4 shadow-sm sm:p-5"
  aria-label={t("This week for your family","هذا الأسبوع لعيلتك")}>
  <div className="flex items-start gap-3">
   <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[#E6F4E8] text-2xl" aria-hidden="true">🌿</span>
   <div className="min-w-0 flex-1">
    <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#348267]">{t("THIS WEEK FOR YOUR FAMILY","هذا الأسبوع لعيلتك")}</p>
    <h2 className="mt-1 text-lg font-black text-[#213F38]">{t("Find something your children might enjoy","خلينا نلاقي شي يحبه أولادك")}</h2>
    <p className="mt-1 text-xs leading-relaxed text-[#65776E]">{t("Explore by age without income, accounts or a long form.","اكتشف بحسب العمر، بلا إدخال دخل أو نموذج طويل.")}</p>
   </div>
  </div>
  <div className="mt-4 flex flex-wrap items-center gap-2">
   <label htmlFor="home-child-age" className="text-sm font-bold">{t("Age","العمر")}</label>
   <select id="home-child-age" className="min-h-11 rounded-xl border border-[#CFDDCE] bg-white px-3 text-sm"
     value={age} onChange={e=>setAge(e.target.value)}>
     <option value="all">{t("All ages","كل الأعمار")}</option>
     {ages.map(x=><option key={x} value={x}>{t("Age ","العمر ")}{x}</option>)}
     {Array.from({length:19},(_,x)=>x).filter(x=>!ages.includes(x)).map(x=><option key={x} value={x}>{t("Age ","العمر ")}{x}</option>)}
   </select>
   <button type="button" onClick={()=>setShowChoices(v=>!v)} aria-expanded={showChoices}
     className="ms-auto inline-flex min-h-11 items-center gap-1 rounded-xl border border-[#CFDDCE] px-3 text-xs font-bold text-[#286A57]">
    <SlidersHorizontal className="size-4"/>{t("My priorities","أولوياتي")}
   </button>
  </div>
  {showChoices&&<div className="mt-3 space-y-3 rounded-xl border border-[#E0E8DF] bg-[#F5F9F5] p-3">
   <label className="block text-sm font-semibold">{t("What matters most?","شو الأهم إلك؟")}
    <select value={priority} disabled={!prefsReady} onChange={e=>update("discoveryPriority",e.target.value as DiscoveryPriority)}
     className="mt-1 min-h-11 w-full rounded-lg border border-[#CBDACC] bg-white px-3">
     <option value="quality">{t("Convenience & quality","الراحة والجودة")}</option>
     <option value="balance">{t("Balance of quality & price","توازن السعر والجودة")}</option>
     <option value="affordable">{t("Affordable options first","الأقل تكلفة أولاً")}</option>
    </select>
   </label>
   <label className="flex min-h-11 items-center gap-2 text-sm">
    <input type="checkbox" checked={prefs.freeActivitiesFirst??false} disabled={!prefsReady}
     onChange={e=>update("freeActivitiesFirst",e.target.checked)} className="size-4"/>
    {t("Search free options first","ابحث عن الأنشطة المجانية أولاً")}
   </label>
   <label className="block text-sm font-semibold">{t("City (optional)","المدينة (اختياري)")}
    <input maxLength={70} disabled={!prefsReady} value={prefs.city} placeholder="Amman"
     onChange={e=>update("city",e.target.value)} className="mt-1 min-h-11 w-full rounded-lg border border-[#CBDACC] bg-white px-3"/>
   </label>
   <p className="text-xs text-[#68766E]">{t("These preferences stay on this device. They are not shared with clubs or used to infer family income.","هذه الخيارات تبقى على جهازك ولا تُرسل للأندية ولا تحدد مستوى دخل العائلة.")}</p>
  </div>}
  <div className="mt-4 grid gap-2 sm:grid-cols-2">
   {themes.map(theme=><a key={theme.id} href={activitySearchUrl(theme,location)}
    target="_blank" rel="noopener noreferrer"
    className="group flex min-h-[85px] items-center gap-3 rounded-2xl border border-[#E3EADF] bg-[#FAFCF8] p-3 hover:bg-[#F0F8EF]">
     <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#E9F4E9] text-2xl" aria-hidden="true">{theme.icon}</span>
     <span className="min-w-0 flex-1">
      <strong className="block text-sm">{ar?theme.ar:theme.en}</strong>
      <span className="mt-1 block text-xs text-[#61786B]">{t("Search options near ","ابحث عن خيارات في ")}{location}</span>
     </span>
     <ExternalLink className="size-4 shrink-0 text-[#397A65]"/>
    </a>)}
  </div>
  <p className="mt-3 text-xs leading-relaxed text-[#68776E]"><ShieldCheck className="me-1 inline size-4"/>
   {t("These are discovery themes, NOT verified sessions or live availability. Confirm age suitability, prices, supervision, accessibility and dates directly with providers. No child's profile is sent to the search destination; only the activity query and city are used.",
    "هذه أفكار للبحث وليست جلسات مؤكدة أو مواعيد متاحة. تحقّق من العمر والسعر والإشراف وسهولة الوصول والمواعيد مباشرة من الجهة. لا نرسل ملف الطفل، فقط البحث والمدينة.")}
  </p>
  <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
   <Link to="/explore/weekend" className="inline-flex min-h-11 items-center gap-1 text-sm font-bold text-[#287C62] underline underline-offset-2">
    {t("Explore mapped family places","استكشف أماكن العيلة على الخريطة")}<ArrowRight className="size-4 rtl:rotate-180"/>
   </Link>
   <Link to="/space" className="inline-flex min-h-11 items-center gap-1 text-xs font-semibold text-[#597267] underline">
    <HeartHandshake className="size-4"/>{t("Add a child's age (optional)","أضف عمر الطفل (اختياري)")}
   </Link>
  </div>
 </section>;
}
