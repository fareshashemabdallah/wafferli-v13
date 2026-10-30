import {useI18n} from "@/lib/i18n";
import {useLocalState} from "@/lib/storage";
import {COUNTRIES,COUNTRY_KEY,getCountry,isCountryCode,type CountryCode} from "@/lib/regionalMarket";
import {defaultFamilyPreferences,type FamilyPreferences} from "@/lib/familyPreferences";

/** Preferences only: one existing canonical city field, independent of UI language.
 * No GPS use, record migration, FX conversion, provider enablement or bank sync.
 */
export function RegionalPreferences(){
 const {lang,setLang}=useI18n();
 const [country,setCountry,countryReady]=useLocalState<CountryCode>(COUNTRY_KEY,"JO");
 const [prefs,setPrefs,prefsReady]=useLocalState<FamilyPreferences>("familyPreferences",defaultFamilyPreferences);
 const tr=(en:string,ar:string,fr:string)=>lang==="ar"?ar:lang==="fr"?fr:en;
 if(!countryReady||!prefsReady)return null;
 const market=getCountry(country);
 return <section className="editorial-card mt-5 p-4 sm:p-5" aria-labelledby="regional-settings-heading" data-testid="regional-settings">
  <h2 id="regional-settings-heading" className="text-base font-bold text-brand">
   {tr("Language & region","اللغة والمنطقة","Langue et région")}
  </h2>
  <p className="mt-1 text-sm text-muted-foreground">
   {tr("Make Dabberna feel local. These choices are saved on this device.",
    "خلّي دبّرنا يناسب بلدك. الخيارات محفوظة على هذا الجهاز.",
    "Personnalisez Dabberna selon votre pays. Ces choix restent sur cet appareil.")}
  </p>
  <div className="mt-4 grid gap-3 sm:grid-cols-2">
   <label className="block text-sm font-semibold">
    {tr("App language","لغة التطبيق","Langue de l’application")}
    <select className="mt-1 min-h-11 w-full rounded-xl border border-border bg-white px-3"
     aria-label={tr("App language","لغة التطبيق","Langue de l’application")}
     value={lang} onChange={e=>setLang(e.target.value as typeof lang)}>
     <option value="ar">العربية</option>
     <option value="en">English</option>
     <option value="fr">Français</option>
    </select>
   </label>
   <label className="block text-sm font-semibold">
    {tr("Country","البلد","Pays")}
    <select className="mt-1 min-h-11 w-full rounded-xl border border-border bg-white px-3"
     aria-label={tr("Country","البلد","Pays")} value={market.code}
     onChange={e=>{if(isCountryCode(e.target.value))setCountry(e.target.value);}}>
     {COUNTRIES.map(c=><option key={c.code} value={c.code}>{c[lang]}</option>)}
    </select>
   </label>
   <label className="block text-sm font-semibold sm:col-span-2">
    {tr("Your city (optional)","مدينتك (اختياري)","Votre ville (facultatif)")}
    <input className="mt-1 min-h-11 w-full rounded-xl border border-border bg-white px-3" maxLength={80}
     autoComplete="address-level2" value={prefs.city??""}
     onChange={e=>setPrefs(old=>({...old,city:e.target.value.slice(0,80)}))}
     placeholder={tr("Enter your city","اكتب اسم المدينة","Saisissez votre ville")}/>
   </label>
  </div>
  <p className="mt-3 text-xs text-muted-foreground">
   {tr("Local currencies for reference: ","العملات المحلية للعلم: ","Devises locales à titre indicatif : ")}
   <strong dir="ltr">{market.currencies.join(" / ")}</strong>
  </p>
  <p className="mt-2 text-xs leading-relaxed text-[#785B3F]">
   {tr("Important: Existing Money budgets and transactions remain in JOD. Changing your country does not convert or relabel them. Local pricing, provider listings and country rules are not live.",
    "مهم: ميزانياتك ومصاريفك الحالية تبقى بالدينار الأردني (JOD). تغيير البلد لا يحوّلها أو يغيّر عملتها. الأسعار المحلية والخدمات والقواعد الخاصة بالبلد غير مفعّلة بعد.",
    "Important : vos budgets et opérations existants restent en JOD. Changer de pays ne les convertit pas. Les prix locaux, les prestataires et les règles nationales ne sont pas encore activés.")}
  </p>
  <p className="mt-2 text-xs text-muted-foreground">
   {tr("Choose language and country separately; no automatic location tracking.",
    "اللغة والبلد خياران منفصلان؛ لا يوجد تتبّع تلقائي للموقع.",
    "Choisissez indépendamment votre langue et votre pays, sans géolocalisation automatique.")}
  </p>
 </section>;
}
