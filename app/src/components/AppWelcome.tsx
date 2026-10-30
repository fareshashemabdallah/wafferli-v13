import {ArrowRight,Languages,ShieldCheck} from "lucide-react";
import {useI18n} from "@/lib/i18n";
import {readLocal} from "@/lib/storage";
import {Logo} from "./Logo";

/** A visual introduction only; it never asks for or changes family records. */
export const WELCOME_SEEN_KEY="illustratedWelcomeSeen";

export function shouldShowWelcome(){
 if(typeof window==="undefined")return false;
 const mode=new URLSearchParams(window.location.search).get("welcome");
 if(mode==="preview")return true;
 if(readLocal(WELCOME_SEEN_KEY,false))return false;
 const installed=window.matchMedia?.("(display-mode: standalone)").matches??false;
 const iosInstalled=(window.navigator as Navigator&{standalone?:boolean}).standalone===true;
 return mode==="1"||installed||iosInstalled;
}
export function AppWelcome({onContinue}:{onContinue:()=>void}){
 const {lang,setLang}=useI18n(),ar=lang==="ar";
 const t=(en:string,arabic:string,fr=en)=>ar?arabic:lang==="fr"?fr:en;
 return <div dir={ar?"rtl":"ltr"} className="flex min-h-dvh flex-col bg-[linear-gradient(155deg,#F5FFF6_0%,#FFFDF4_48%,#FFF1E9_100%)] text-[#244B41]" data-testid="illustrated-welcome">
  <header className="mx-auto flex w-full max-w-lg items-center justify-between gap-3 px-5 pt-[max(1.25rem,env(safe-area-inset-top))]">
   <Logo/>
   <label className="flex min-h-11 items-center gap-1.5 rounded-full border border-[#DCEADD] bg-white/85 px-3 text-xs font-bold text-[#386955] focus-within:outline-2 focus-within:outline-[#368D72]">
    <Languages className="size-4" aria-hidden="true"/>
    <span className="sr-only">{t("App language","لغة التطبيق","Langue de l’application")}</span>
    <select aria-label={t("App language","لغة التطبيق","Langue de l’application")} className="max-w-[89px] bg-transparent"
     value={lang} onChange={e=>setLang(e.target.value as typeof lang)}>
     <option value="ar">العربية</option><option value="en">English</option><option value="fr">Français</option>
    </select>
   </label>
  </header>
  <main className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-between gap-4 px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-7 text-center">
   <div>
    <p className="mb-3 text-xs font-extrabold uppercase tracking-[.16em] text-[#43896F]">{t("Welcome to Dabberna","أهلاً في دبّرنا","Bienvenue sur Dabberna")}</p>
    <h1 className="text-[clamp(1.65rem,6vw,2.3rem)] font-extrabold leading-tight">{t("A calmer, happier family day","نهار أريح وأحلى للعيلة","Une journée en famille plus sereine")}</h1>
   </div>
   <div className="flex min-h-0 w-full flex-1 items-center justify-center py-2">
    <img src={import.meta.env.BASE_URL+"landing-family-characters.avif"}
     alt={t("Illustration of parents, children and Dabberna's friendly robot together","رسم لأهل وأطفال وروبوت دبّرنا الودود")}
     className="block h-auto max-h-[min(48dvh,430px)] w-full max-w-[450px] object-contain"
     loading="eager" decoding="async"/>
   </div>
   <div className="w-full">
    <p className="mx-auto mb-5 max-w-[320px] text-sm font-medium leading-relaxed text-[#527567]">
     {t("Money, family moments and helpful ideas — all in one place.","المال ولحظات العيلة والأفكار المفيدة، كلّها بمكان واحد.","Budget, moments en famille et conseils utiles, au même endroit.")}
    </p>
    <button type="button" onClick={onContinue}
     className="flex min-h-14 w-full items-center justify-center gap-2 rounded-full bg-[#137E70] px-6 text-base font-extrabold text-white shadow-[0_12px_25px_-14px_#175F54] transition hover:bg-[#11695D] focus-visible:outline-2 focus-visible:outline-[#368D72]">
     {t("Let's get started","يلا نبلّش","C’est parti !")}<ArrowRight className="size-5 rtl:rotate-180"/>
    </button>
    <p className="mt-4 flex items-center justify-center gap-1.5 text-[11px] font-medium text-[#73897B]">
     <ShieldCheck className="size-3.5"/>{t("Your pilot records remain on this device.","بيانات تجربتك بتبقى على هالجهاز.","Vos données d’essai restent sur cet appareil.")}
    </p>
   </div>
  </main>
 </div>;
}