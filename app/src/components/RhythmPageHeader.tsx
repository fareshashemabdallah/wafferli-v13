import {Link} from "@tanstack/react-router";
import {ArrowLeft,HeartPulse} from "lucide-react";
import {useI18n} from "@/lib/i18n";
import {areaFromRoute} from "@/lib/familyNavigation";

/** A single understated chapter heading. Main nav already contains the routes,
 * so no duplicate hero, carousel, progress, next-page CTA, or phantom journey steps. */
export function RhythmPageHeader({path,title}:{path:string;title?:string}){
 const {lang}=useI18n(),ar=lang==="ar",area=areaFromRoute(path);
 const t=(en:string,arabic:string)=>ar?arabic:en;
 const chapter={
  today:{en:"Today",ar:"اليوم",sentenceEn:"One clear view of your family journey.",sentenceAr:"صورة واضحة لرحلة عيلتك."},
  money:{en:"Understand",ar:"افهم",sentenceEn:"Your actual money records, without a second journey to complete.",sentenceAr:"بيانات المال الفعلية، بدون رحلة ثانية لازم تكمّلها."},
  ask:{en:"Decide",ar:"قرّر",sentenceEn:"Understand your options, protect priorities and choose one next action.",sentenceAr:"افهم الخيارات، احمِ أولوياتك، واختَر خطوة واحدة."},
  family:{en:"Act & prepare",ar:"نفّذ وتحضّر",sentenceEn:"Keep plans, dates and responsibilities together—recorded once.",sentenceAr:"خطط ومواعيد ومسؤوليات العيلة مع بعض، بلا تسجيل مكرر."}
 }[area];
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
