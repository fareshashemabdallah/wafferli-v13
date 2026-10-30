import {frenchUI} from "@/lib/french";
import {useI18n} from "@/lib/i18n";
import {useLocalState} from "@/lib/storage";
import {sampleMembers,type Member} from "@/lib/money";
import {realFamilyMembers} from "@/lib/familySetup";
import {HOUSEHOLD_PRESENCE_KEY,emptyHouseholdPresence,type HouseholdPresence} from "@/lib/householdPresence";
import {defaultFamilyPreferences,type FamilyPreferences} from "@/lib/familyPreferences";
import {householdCountSource} from "@/lib/progressiveFamilyInput";
/** A private and progressive alternative to named profiles. Every change is
 * immediately reused by the existing household presence and city-aware discovery.
 */
export function FamilyBasicsQuickInput(){
 const {lang}=useI18n(),ar=lang==="ar",t=(en:string,a:string)=>ar?a:lang==="fr"?frenchUI(en):en;
 const [members,,membersReady]=useLocalState<Member[]>("members",sampleMembers());
 const [presence,setPresence,presenceReady]=useLocalState<HouseholdPresence>(HOUSEHOLD_PRESENCE_KEY,emptyHouseholdPresence());
 const [prefs,setPrefs,prefsReady]=useLocalState<FamilyPreferences>("familyPreferences",defaultFamilyPreferences);
 const ready=membersReady&&presenceReady&&prefsReady;
 const actual=realFamilyMembers(members);
 const counts=householdCountSource(members,presence);
 const anon=counts.source==="anonymous";
 const updateCount=(key:"adults"|"children",v:string)=>{
  if(v!==""&&(!/^\d{1,2}$/.test(v)||Number(v)>50))return;
  setPresence(p=>({...p,[key]:v===""?null:Number(v)}));
 };
 if(!ready)return null;
 return <section className="mt-5 rounded-2xl border border-[#D5E7DA] bg-[#F4FAF2] p-4" aria-label={t("Quick family basics","معلومات العيلة السريعة")}>
  <p className="text-xs font-bold uppercase tracking-wide text-brand">{t("START WITH WHAT HELPS","ابدأ باللي بيفيد")}</p>
  <h2 className="mt-1 text-lg font-bold">{t("A little about our household","شوي عن بيتنا")}</h2>
  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{t(
   "Names, birth years and income are not required. Counts and city are optional and saved on this device; change them any time.",
   "ما بدنا أسماء أو سنوات ميلاد أو دخل. عدد الأشخاص والمدينة اختياري ومحفوظ على الجهاز، وبتقدر تغيّره بأي وقت.")}</p>
  {actual.length>0&&!anon?<div className="mt-3 rounded-xl bg-white p-3 text-xs">
    {t("Using the people you already saved. We won't ask you to enter separate counts.",
       "منستخدم أفراد العيلة اللي حفظتهم؛ مش رح نطلب منك عدد إضافي.")}</div>:
   <div className="mt-3 grid grid-cols-2 gap-3">
    {(["adults","children"] as const).map(key=><label key={key} className="text-sm font-semibold">
     {key==="adults"?t("Adults (optional)","البالغين (اختياري)"):t("Children (optional)","الأطفال (اختياري)")}
     <input aria-label={key==="adults"?t("Resident adults","عدد البالغين"):t("Resident children","عدد الأطفال")}
      type="number" min="0" max="50" step="1" placeholder={t("Unknown","غير معروف")}
      className="mt-1 min-h-11 w-full rounded-xl border border-[#CFE0D3] bg-white px-3"
      value={presence[key]??""} onChange={e=>updateCount(key,e.target.value)}/>
    </label>)}
   </div>}
  <label className="mt-3 block text-sm font-semibold">{t("City (optional)","المدينة (اختياري)")}
   <input type="text" maxLength={80} className="mt-1 min-h-11 w-full rounded-xl border border-[#CFE0D3] bg-white px-3"
    placeholder={t("e.g. Amman","مثلاً عمّان")} value={prefs.city??""}
    onChange={e=>setPrefs(p=>({...p,city:e.target.value.slice(0,80)}))}/>
  </label>
  <p className="mt-2 text-xs text-muted-foreground">{t(
   "Family profiles take priority unless you've explicitly chosen anonymous counts. We don't add profiles and anonymous counts together.",
   "ملفات العيلة بتكون الأساس، إلا إذا اخترت أعداد بدون أسماء. ما منجمع الاثنين مع بعض.")}</p>
  {(anon&&actual.length>0)&&<button type="button" className="mt-2 min-h-10 text-xs font-semibold text-brand underline"
   onClick={()=>setPresence(p=>({...p,adults:null,children:null}))}>
   {t("Use my saved family profiles instead","استخدم أفراد عيلتي المحفوظين بدل الأعداد")}</button>}
  <p className="mt-2 text-xs font-semibold text-brand">{t("Changes are saved automatically. No extra form to submit.","التغييرات بتنحفظ تلقائياً، بلا نموذج إضافي.")}</p>
 </section>;
}
