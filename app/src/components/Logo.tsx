import {useI18n} from "@/lib/i18n";

/** Dabberna's recognizable robot is the same on the Home Screen and inside the app. */
export function Logo({className=""}:{className?:string}){
 const {lang}=useI18n();
 return <span className={"inline-flex items-center gap-2 "+className} dir="ltr">
  <img src={import.meta.env.BASE_URL+"app-icon.svg"} alt="" aria-hidden="true"
   className="size-9 shrink-0 rounded-xl" width="36" height="36"/>
  <span className="font-display text-xl font-semibold tracking-tight text-brand"
   dir={lang==="ar"?"rtl":"ltr"}>{lang==="ar"?"دبّرنا":"Dabberna"}</span>
 </span>;
}