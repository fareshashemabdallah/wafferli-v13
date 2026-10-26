import {Link} from "@tanstack/react-router";
import {ArrowLeft,HeartPulse} from "lucide-react";
import {useI18n} from "@/lib/i18n";
import {areaFromRoute} from "@/lib/familyNavigation";

/** A single understated chapter heading. Main nav already contains the routes,
 * so no duplicate hero, carousel, progress, next-page CTA, or phantom journey steps. */
export function rhythmChapter(path:string){
 const chapters={
  today:{en:"Today",ar:"اليوم",sentenceEn:"One clear view of your family journey.",sentenceAr:"صورة واضحة لرحلة عيلتك."},
  money:{en:"Understand",ar:"افهم",sentenceEn:"Edit the real figures behind your story. Plans, bills and recorded spending are different things.",sentenceAr:"عدّل الأرقام الأساسية لحكايتكم؛ الخطة والفاتورة والمصروف المدفوع أشياء مختلفة."},
  parents:{en:"What Parents Say",ar:"شو بيقولوا الأهل؟",sentenceEn:"Understand firsthand parent experiences and their sources, separate from Family planning.",sentenceAr:"اقرأ تجارب الأهل ومصادرها بشكل مستقل عن تخطيط العيلة."},
  finds:{en:"Our Market",ar:"سوقنا",sentenceEn:"Pass along something useful: sell, swap or share the joy. Private preview until community safeguards are ready.",sentenceAr:"بيع أو بدّل أو شارك الفرحة. التجربة حالياً خاصة حتى تجهز حماية المجتمع."},
  ask:{en:"Decide",ar:"قرّر",sentenceEn:"Compare realistic choices. Only you decide what becomes a saved family plan.",sentenceAr:"قارن خيارات واقعية؛ أنت وحدك بتقرر شو يتحوّل لخطة محفوظة."},
  family:{en:"Prepare & act",ar:"تحضّر ونفّذ",sentenceEn:"Your saved dates and plans stay connected as one source of truth.",sentenceAr:"المواعيد والخطط المحفوظة بتبقى مترابطة بدون نسخ ثانية."}
 } as const;
 if(path==="/space"||path.startsWith("/household"))return {en:"Know our family",ar:"تعرّف على عيلتنا",
  sentenceEn:"Add only details that improve guidance. Profiles and birthdays are optional; manage them once here.",
  sentenceAr:"ضيف بس المعلومات المفيدة للنصيحة؛ الملفات وأعياد الميلاد اختيارية ومن مكان واحد."};
 if(path==="/about")return {en:"Trust",ar:"الثقة",
  sentenceEn:"Understand what Dabberna can verify, what remains optional and who controls your information.",
  sentenceAr:"اعرف شو دبّرنا بتقدر تتأكد منه، وشو اختياري، وكيف تتحكّم بمعلوماتك."};
 return chapters[areaFromRoute(path)];
}
export function RhythmPageHeader({path,title}:{path:string;title?:string}){
 const {lang}=useI18n(),ar=lang==="ar";
 const t=(en:string,arabic:string)=>ar?arabic:en;
 const chapter=rhythmChapter(path);
 return <header className="mb-4 rounded-[1.2rem] border border-[#DDE9DF] bg-white px-4 py-3 sm:px-5" aria-label={t("Family rhythm chapter","مرحلة رحلة العيلة")}>
  <div className="flex flex-wrap items-center justify-between gap-3">
   <div className="min-w-0">
    <p className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-[#408266]">
     <HeartPulse className="size-4" aria-hidden="true"/>{t("OUR FAMILY RHYTHM","إيقاع عيلتنا")} · {ar?chapter.ar:chapter.en}
    </p>
    <h1 className="mt-1 text-xl font-extrabold text-[#234B3A]">{title??(ar?chapter.ar:chapter.en)}</h1>
    <p className="mt-1 text-xs leading-relaxed text-[#687E70]">{ar?chapter.sentenceAr:chapter.sentenceEn}</p>
   </div>
   <Link to="/" className="inline-flex min-h-10 shrink-0 items-center gap-1 rounded-full border border-[#D7E8D8] bg-[#F7FBF6] px-3 text-xs font-semibold text-[#357A5A]">
    <ArrowLeft className="size-4 rtl:rotate-180"/>{t("Today's story","حكاية اليوم")}
   </Link>
  </div>
 </header>;
}
