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
  const set=<K extends keyof FamilyPreferences>(key:K,value:FamilyPreferences[K])=>setPreferences(old=>({...old,[key]:value}));
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
    <div className="mt-4 space-y-2">
      {interests.map(({key,en,ar:arabic,Icon})=><label key={key} className="flex min-h-12 items-center justify-between gap-3 rounded-xl bg-muted/40 p-3">
        <span className="flex items-center gap-3 text-sm font-medium"><Icon className="size-5 shrink-0 text-brand"/>{ar?arabic:en}</span>
        <input type="checkbox" className="size-5 accent-[#426958]" checked={Boolean(preferences[key])} onChange={e=>set(key,e.target.checked)} />
      </label>)}
    </div>
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
  </section>;
}
