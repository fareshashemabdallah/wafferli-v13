import {useI18n} from "@/lib/i18n";
import {areaFromRoute} from "@/lib/familyNavigation";

/** The main navigation already provides context. Each screen should
 * show its own useful content instead of another chapter explanation. */
export function rhythmChapter(path:string){
 const chapters={
  today:{en:"Today",ar:"اليوم"},
  money:{en:"Money",ar:"المال"},
  parents:{en:"What Parents Say",ar:"شو بيقولوا الأهل؟"},
  finds:{en:"Our Market",ar:"سوقنا"},
  family:{en:"Family",ar:"العيلة"}
 } as const;
 if(path==="/space"||path.startsWith("/household"))
  return {en:"Family & settings",ar:"العيلة والإعدادات"};
 if(path==="/about")return {en:"About & privacy",ar:"حول دبّرنا والخصوصية"};
 return chapters[areaFromRoute(path)];
}
export function RhythmPageHeader({path,title}:{path:string;title?:string}){
 const {lang}=useI18n(),ar=lang==="ar";
 const chapter=rhythmChapter(path);
 // The four primary detail destinations already render their own visible title.
 const localHeading=["/money","/family","/finds","/what-parents-say"].includes(path);
 return <header className={localHeading?"sr-only":"mb-3 px-1"}
  aria-label={ar?"عنوان الصفحة":"Page heading"}>
   <h1 className={localHeading?"sr-only":"text-lg font-extrabold text-[#234B3A]"}>
    {title??(ar?chapter.ar:chapter.en)}
   </h1>
  </header>;
}
