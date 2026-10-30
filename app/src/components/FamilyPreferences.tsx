import { Bell, Compass, CloudSun, ShieldCheck, ShoppingBag } from "lucide-react";
import { defaultFamilyPreferences, type FamilyPreferences } from "@/lib/familyPreferences";
import { useLocalState } from "@/lib/storage";
import { useI18n } from "@/lib/i18n";
const interests: Array<{key:keyof FamilyPreferences;en:string;ar:string;Icon:typeof Bell}>=[
  {key:"weather",en:"Show weather and clothing guidance",ar:"عرض الطقس واقتراح الملابس",Icon:CloudSun},
  {key:"lifestyle",en:"Suggest family activities",ar:"اقتراح أنشطة عائلية",Icon:Compass},
  {key:"financeTips",en:"Show financial planning notes",ar:"عرض ملاحظات التخطيط المالي",Icon:ShieldCheck},
  {key:"billReminders",en:"Show upcoming bills in the app",ar:"عرض الالتزامات القادمة في التطبيق",Icon:Bell},
  {key:"shoppingTips",en:"Show shopping tips",ar:"عرض نصائح التسوق",Icon:ShoppingBag}
];
export function FamilyPreferences() {
  const {lang}=useI18n();
  const ar=lang==="ar";
  const [preferences,setPreferences,ready]=useLocalState<FamilyPreferences>("familyPreferences",defaultFamilyPreferences);
  const set=<K extends keyof FamilyPreferences>(key:K,value:FamilyPreferences[K])=>{setPreferences(old=>({...old,[key]:value}));};
  if(!ready)return null;
  return <section className="card-soft mt-6 p-4" id="family-preferences">
    <h2 className="text-lg font-semibold">{ar?"تفضيلات العائلة":"Family preferences"}</h2>
    <p className="mt-1 text-sm text-muted-foreground">{ar?"اختاروا النصائح التي تظهر في الصفحة الرئيسية. هذه الإعدادات محفوظة على الجهاز فقط، ولا ترسل إشعارات هاتف حالياً.":"Choose what appears on your home screen. Preferences stay on this device; push notifications are not active."}</p>
    <label className="mt-4 block text-sm font-medium">{ar?"هذه التجربة لمن؟":"Who are we planning for?"}
      <select className="mt-1 w-full rounded-xl border border-border bg-card p-3" value={preferences.experienceMode??"auto"} onChange={e=>set("experienceMode",e.target.value as "auto"|"individual"|"family")}>
       <option value="auto">{ar?"تلقائي حسب الملف الشخصي":"Adapt to my profile"}</option>
       <option value="individual">{ar?"أنا كفرد":"Myself"}</option>
       <option value="family">{ar?"عائلتي أو أسرتي":"My family / household"}</option>
      </select>
      <span className="mt-1 block text-xs font-normal text-muted-foreground">{ar?"يمكنك تغيير ذلك لاحقاً دون فقدان البيانات.":"You can change this without losing any saved information."}</span>
    </label>
    <div className="mt-4 grid gap-3 sm:grid-cols-2">
      <label className="text-sm font-medium">{ar?"هل الأطفال بيشاركوا عادة بالطلعات؟":"Do children usually join outings?"}
       <select className="mt-1 w-full rounded-xl border border-border bg-card p-3" value={preferences.typicalChildrenAttendance??"ask"} onChange={e=>set("typicalChildrenAttendance",e.target.value as "ask"|"yes"|"no")}>
        <option value="ask">{ar?"اسألني بكل طلعة":"Ask me each time"}</option>
        <option value="yes">{ar?"غالباً معنا أطفال":"Children usually join"}</option>
        <option value="no">{ar?"غالباً للبالغين فقط":"Usually adults only"}</option>
       </select>
      </label>
      <label className="text-sm font-medium">{ar?"إذا معنا أطفال، لمين الطلعة؟":"When children join, who is the focus?"}
       <select className="mt-1 w-full rounded-xl border border-border bg-card p-3" value={preferences.typicalOutingFocus??"mixed"} onChange={e=>set("typicalOutingFocus",e.target.value as "children"|"mixed"|"adults")}>
        <option value="mixed">{ar?"للجميع":"A balance for everyone"}</option>
        <option value="children">{ar?"الأولوية لمتعة الأطفال":"Children first"}</option>
        <option value="adults">{ar?"نشاط للكبار والأطفال معنا":"Adult-focused, children welcome"}</option>
       </select>
      </label>
    </div>
    <details className="mt-4 rounded-xl border border-[#DCE8DB] bg-[#F6FAF5] p-3">
      <summary className="min-h-10 cursor-pointer text-sm font-semibold text-brand">{ar?"تفاصيل اختيارية للنشاطات":"Optional activity details"}</summary>
      <h3 className="sr-only">{ar?"تفضيلات الأنشطة (اختيارية)":"Activity discovery preferences (optional)"}</h3>
      <p className="mt-1 text-xs text-muted-foreground">{ar?"أنت تختار، بلا تصنيف لعائلتك حسب الدخل أو المعتقد. لا يمكننا تأكيد ملاءمة نشاط قبل التحقق من الجهة.":"Choose what matters to your family; no income or cultural labels. Provider claims require direct verification."}</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
       <label className="text-sm font-medium">{ar?"شو الأهم؟":"What matters most?"}
        <select className="mt-1 min-h-11 w-full rounded-lg border bg-white p-2" value={preferences.discoveryPriority??"balance"}
         onChange={e=>set("discoveryPriority",e.target.value as NonNullable<FamilyPreferences["discoveryPriority"]>)}>
         <option value="quality">{ar?"الراحة والجودة":"Convenience and quality"}</option>
         <option value="balance">{ar?"توازن السعر والجودة":"Best value overall"}</option>
         <option value="affordable">{ar?"الخيارات الأقل تكلفة":"Affordable options first"}</option>
        </select>
       </label>
       <label className="text-sm font-medium">{ar?"بيئة المجموعة المفضّلة":"Preferred class composition"}
        <select className="mt-1 min-h-11 w-full rounded-lg border bg-white p-2" value={preferences.activityGroupPreference??"any"}
         onChange={e=>set("activityGroupPreference",e.target.value as NonNullable<FamilyPreferences["activityGroupPreference"]>)}>
         <option value="any">{ar?"أي مجموعة مناسبة":"No preference"}</option>
         <option value="girls">{ar?"مجموعات بنات فقط":"Girls-only sessions"}</option>
         <option value="boys">{ar?"مجموعات أولاد فقط":"Boys-only sessions"}</option>
         <option value="separate">{ar?"مجموعات منفصلة":"Separate groups"}</option>
        </select>
       </label>
       <label className="text-sm font-medium">{ar?"المدرّب أو المدرّبة":"Instructor preference"}
        <select className="mt-1 min-h-11 w-full rounded-lg border bg-white p-2" value={preferences.instructorPreference??"any"}
         onChange={e=>set("instructorPreference",e.target.value as NonNullable<FamilyPreferences["instructorPreference"]>)}>
         <option value="any">{ar?"بدون تفضيل":"No preference"}</option>
         <option value="female">{ar?"مدرّبة":"Female instructor"}</option>
         <option value="male">{ar?"مدرّب":"Male instructor"}</option>
        </select>
       </label>
       <div className="flex flex-col gap-2 pt-2">
        <label className="flex min-h-10 items-center gap-2 text-sm"><input type="checkbox" className="size-4"
         checked={preferences.freeActivitiesFirst??false} onChange={e=>set("freeActivitiesFirst",e.target.checked)}/>
         {ar?"ابحث عن المجاني أولاً":"Search free options first"}</label>
        <label className="flex min-h-10 items-center gap-2 text-sm"><input type="checkbox" className="size-4"
         checked={preferences.parentCanObservePreferred??false} onChange={e=>set("parentCanObservePreferred",e.target.checked)}/>
         {ar?"أفضل أن أتمكّن من مشاهدة الجلسة":"Prefer that parents can observe"}</label>
       </div>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">{ar?"هذه أسئلة تسألها للجهة قبل التسجيل، وليست فلاتر تضمن دقّة أي إعلان.":"Use these to guide questions to a provider; the app does not assume a listing satisfies them."}</p>
    </details>
    <details className="mt-4 rounded-xl border border-[#DCE8DB] bg-white p-3"><summary className="min-h-10 cursor-pointer text-sm font-semibold text-brand">{ar?"ما هي النصائح التي تظهر لي؟":"What guidance should appear?"}</summary>
    <div className="mt-3 space-y-2">
      {interests.map(({key,en,ar:arabic,Icon})=><label key={key} className="flex min-h-12 items-center justify-between gap-3 rounded-xl bg-muted/40 p-3">
        <span className="flex items-center gap-3 text-sm font-medium"><Icon className="size-5 shrink-0 text-brand"/>{ar?arabic:en}</span>
        <input type="checkbox" className="size-5 accent-[#426958]" checked={Boolean(preferences[key])} onChange={e=>set(key,e.target.checked)} />
      </label>)}
    </div>
    </details>
    <div className="mt-4 grid gap-3 sm:grid-cols-2">
      <label className="text-sm font-medium">{ar?"المسافة المفضلة للأنشطة":"Preferred outing distance"}
        <select className="mt-1 w-full rounded-xl border border-border bg-card p-3" value={preferences.distanceKm} onChange={e=>set("distanceKm",Number(e.target.value))}>
          {[5,10,15,25,50].map(km=><option key={km} value={km}>{km} km</option>)}
        </select>
      </label>
      <label className="text-sm font-medium">{ar?"ميزانية النزهة المخططة (دينار)":"Preferred outing budget (JOD)"}
        <input className="mt-1 w-full rounded-xl border border-border bg-card p-3" type="number" inputMode="decimal" min="0" max="10000" value={preferences.outingLimit} onChange={e=>set("outingLimit",Math.max(0,Math.min(10000,Number(e.target.value)||0)))} />
      </label>
      <label className="text-sm font-medium sm:col-span-2">{ar?"وتيرة الإرشادات":"Guidance frequency (in-app only)"}
        <select className="mt-1 w-full rounded-xl border border-border bg-card p-3" value={preferences.notificationFrequency} onChange={e=>set("notificationFrequency",e.target.value as FamilyPreferences["notificationFrequency"])}>
          <option value="off">{ar?"بدون إشعارات":"Off"}</option>
          <option value="important">{ar?"المهم فقط":"Important only"}</option>
          <option value="gentle">{ar?"اقتراحات لطيفة":"Gentle suggestions"}</option>
        </select>
      </label>
    </div>
    <div className="mt-4 rounded-xl bg-[#EDF5EA] p-3">
      <p className="text-xs text-muted-foreground">{ar?"لن نشارك هذه الخيارات مع المطاعم أو المجموعات تلقائياً. ما في تتبع للموقع ولا إشعارات خارج التطبيق.":"These choices are local. They are not automatically shared with merchants or groups, and there is no passive location tracking or push notification."}</p>
      <p className="mt-2 text-xs font-semibold text-brand">{ar?"✓ التغييرات بتنحفظ تلقائياً، بلا تأكيد إضافي.":"✓ Changes save automatically; no extra confirmation required."}</p>
    </div>
  </section>;
}
