import {useState} from "react";
import {Brain,ChevronDown,Clock3,Heart,MoveRight,Sparkles,X} from "lucide-react";
import {useI18n} from "@/lib/i18n";
import type {Member} from "@/lib/money";
import {knownChildAges,PLAY_CATEGORY_LABELS,weeklyPlaySelection,type PlayCategory} from "@/lib/weeklyPlay";

const colours:Record<PlayCategory,{card:string,accent:string}>={
 focus:{card:"bg-[#F3ECFF] border-[#DDD1F6]",accent:"text-[#6A4B9F]"},
 movement:{card:"bg-[#E8F5EF] border-[#CBE8D7]",accent:"text-[#287553]"},
 creative:{card:"bg-[#FFF0E6] border-[#F8DFCC]",accent:"text-[#A45B30]"}
};

/** Optional, read-only Today feature: no second navigation destination,
 * profile form, streak, purchase, completion score, or persistence. */
export function WeeklyPlay({members}:{members:readonly Member[]}){
 const {lang}=useI18n(),ar=lang==="ar";
 const t=(en:string,arabic:string)=>ar?arabic:en;
 const [selected,setSelected]=useState<string|null>(null);
 const games=weeklyPlaySelection(members);
 const open=games.find(g=>g.id===selected);
 const ages=knownChildAges(members);
 return <section aria-label={t("This week's play","ألعاب هالأسبوع")}
  className="rounded-[1.5rem] border border-[#E2E7D9] bg-[#FFFEF9] p-4 shadow-[0_12px_30px_-26px_rgba(44,71,55,.21)] sm:p-5"
  data-testid="today-weekly-play">
  <div className="flex items-start justify-between gap-3">
   <div className="min-w-0">
    <h2 className="flex items-center gap-2 text-sm font-extrabold text-[#375B48]">
     <Sparkles className="size-4 text-[#B16D49]" aria-hidden="true"/>{t("This Week's Play","ألعاب هالأسبوع")}
    </h2>
    <p className="mt-1 text-xs leading-relaxed text-[#6E8073]">
     {t("Three little games to enjoy together — refreshed every Monday.","٣ ألعاب صغيرة تلعبوها سوا — بتتجدّد كل يوم اثنين.")}
    </p>
   </div>
   <span className="shrink-0 rounded-full bg-[#EDF3E8] px-2.5 py-1 text-[10px] font-bold text-[#4A795F]">
    {t("Free","مجاني")}
   </span>
  </div>
  <div className="mt-3 grid grid-cols-3 gap-2" role="group" aria-label={t("This week's three games","ألعاب الأسبوع الثلاثة")}>
   {games.map(g=>{
    const colour=colours[g.category],active=selected===g.id;
    return <button type="button" key={g.id} aria-expanded={active} aria-controls="weekly-play-detail"
     onClick={()=>setSelected(active?null:g.id)}
     className={"min-w-0 rounded-2xl border p-2.5 text-start transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#358E6A] sm:p-3 "+colour.card+
      (active?" ring-2 ring-[#4A8A6B]":" hover:brightness-[.98]")}>
     <span className="mb-2 block text-3xl leading-none sm:text-4xl" aria-hidden="true">{g.emoji}</span>
     <span className="block break-words text-[11px] font-extrabold leading-tight text-[#33493E] sm:text-sm">{ar?g.ar:g.en}</span>
     <span className={"mt-2 block text-[10px] font-semibold leading-snug "+colour.accent}>{t(PLAY_CATEGORY_LABELS[g.category].en,PLAY_CATEGORY_LABELS[g.category].ar)}</span>
     <span className="mt-1 flex items-center gap-1 text-[10px] text-[#65766D]"><Clock3 className="size-3" aria-hidden="true"/>{g.minutes} {t("min","د")}</span>
     <span className="mt-2 flex items-center gap-1 text-[10px] font-bold text-[#3D6A50]">
      {t("How to play","كيف نلعب؟")}<ChevronDown className={"size-3 transition "+(active?"rotate-180":"")} aria-hidden="true"/>
     </span>
    </button>;
   })}
  </div>
  {open&&<div id="weekly-play-detail" className="mt-3 rounded-2xl border border-[#D9E7D8] bg-white p-3 sm:p-4"
   aria-label={t("Game instructions","طريقة اللعب")}>
   <div className="flex items-start justify-between gap-3">
    <div>
     <p className="text-xs font-semibold text-[#3B8260]">{open.emoji} {ar?open.ar:open.en}</p>
     <p className="mt-1 text-sm text-[#536B5E]">{ar?open.descriptionAr:open.descriptionEn}</p>
    </div>
    <button type="button" onClick={()=>setSelected(null)} aria-label={t("Close instructions","أغلق التعليمات")}
     className="grid size-10 shrink-0 place-items-center rounded-full bg-[#F2F6F0] text-[#4B6F5A] focus-visible:ring-2 focus-visible:ring-[#358E6A]"><X className="size-4"/></button>
   </div>
   <ol className="mt-3 space-y-2">
    {(ar?open.stepsAr:open.stepsEn).map((step,i)=><li key={i} className="flex gap-2 text-sm leading-relaxed">
     <span className="grid size-6 shrink-0 place-items-center rounded-full bg-[#E7F2E8] text-xs font-bold text-[#35724F]">{i+1}</span>
     <span>{step}</span>
    </li>)}
   </ol>
   <p className="mt-3 rounded-xl bg-[#F4F7F1] px-3 py-2 text-xs leading-relaxed text-[#496451]">
    <Heart className="me-1 inline size-3.5" aria-hidden="true"/>{ar?open.adaptAr:open.adaptEn}
   </p>
   <p className="mt-2 text-[11px] leading-relaxed text-[#75847A]">
    {t("Suggested ages: ","أعمار مقترحة: ")}{open.minAge}–{open.maxAge} · {t("Play together, supervise, and stop if your child isn't enjoying it.","العبوا سوا، راقبوا الأطفال، ووقفوا إذا ما عادوا مستمتعين.")}
   </p>
  </div>}
  <p className="mt-3 flex items-center gap-1.5 text-[11px] text-[#78877A]">
   {ages.length?<><Brain className="size-3.5" aria-hidden="true"/>{t("Ideas guided by saved child ages. No scores or tracking.","أفكار بحسب الأعمار المحفوظة، بلا علامات أو متابعة.")}</>:
    <><MoveRight className="size-3.5" aria-hidden="true"/>{t("Easy starter ideas. Add ages only if you wish.","أفكار بسيطة للبداية. إضافة الأعمار اختيارية.")}</>}
  </p>
 </section>;
}
