import {useState} from "react";
import {Link} from "@tanstack/react-router";
import {ArrowRight,Brain,ChevronDown,Clock3,Heart,Lightbulb,Sparkles} from "lucide-react";
import {useI18n} from "@/lib/i18n";
import {frenchUI} from "@/lib/french";
import type {Member} from "@/lib/money";
import {knownChildAges,weeklyPlaySelection} from "@/lib/weeklyPlay";
import {WeeklyGameArt} from "./WeeklyGameArt";

/** One short screen activity plus existing parent-led weekly games.
 * No extra child profile, subscriptions, scores or secondary play database. */
export function WeeklyPlay({members}:{members:readonly Member[]}){
 const {lang}=useI18n(),ar=lang==="ar";
 const t=(en:string,arabic:string,fr?:string)=>ar?arabic:lang==="fr"?(fr??frenchUI(en)):en;
 const [more,setMore]=useState(false);
 const [selected,setSelected]=useState<string|null>(null);
 const games=weeklyPlaySelection(members);
 const open=games.find(g=>g.id===selected);
 const ages=knownChildAges(members);
 return <section aria-label={t("Play together","نلعب سوا","Jouons ensemble")}
   className="rounded-[1.6rem] border border-[#D9E9DC] bg-white p-4 shadow-[0_16px_36px_-30px_rgba(40,89,54,.25)] sm:p-5"
   data-testid="today-weekly-play">
  <div className="flex items-start gap-3">
   <WeeklyGameArt gameId="whats-missing" category="focus" className="aspect-[240/154] w-[114px] shrink-0 rounded-2xl sm:w-[160px]"/>
   <div className="min-w-0 flex-1">
    <div className="flex items-center gap-1.5 text-[11px] font-extrabold text-[#41825E]"><Sparkles className="size-4"/>{t("LITTLE EXPLORERS","المستكشفون الصغار","PETITS EXPLORATEURS")}</div>
    <h2 className="mt-1 text-base font-extrabold text-[#2C5140]">{t("What disappeared?","شو اختفى؟","Qu'est-ce qui a disparu ?")}</h2>
    <p className="mt-1 text-xs leading-relaxed text-[#62786B]">{t("A tiny memory game, then explore together offline.","لعبة ذاكرة قصيرة، وبعدها اكتشفوا سوا بعيد عن الشاشة.","Un petit jeu de mémoire, puis explorez ensemble sans écran.")}</p>
    <p className="mt-2 flex items-center gap-1.5 text-[11px] text-[#5E7866]"><Clock3 className="size-3.5"/>{t("Ages 4–5 · About 3 min","عمر ٤–٥ · حوالي ٣ دقائق","4–5 ans · Environ 3 min")}</p>
   </div>
  </div>
  <Link to="/explorers" className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#2E805D] px-4 text-sm font-extrabold text-white shadow-sm hover:bg-[#24694D] focus-visible:ring-2 focus-visible:ring-[#2E805D]">
   {t("Play now","العب هلّق","Jouer maintenant")}<ArrowRight className="size-4 rtl:rotate-180"/>
  </Link>
  <button type="button" className="mt-2 flex min-h-11 w-full items-center justify-center gap-2 text-xs font-bold text-[#39775A]"
   aria-expanded={more} onClick={()=>{setMore(v=>!v);setSelected(null);}}>
   {t("More games without a screen","ألعاب كمان بلا شاشة","D'autres jeux sans écran")}<ChevronDown className={"size-4 transition-transform "+(more?"rotate-180":"")}/>
  </button>
  {more&&<div className="space-y-2 border-t border-[#E2EEE3] pt-3">
   <p className="text-xs leading-relaxed text-[#69816F]">{t("Three fresh ideas each week, guided by the children's saved ages.","٣ أفكار كل أسبوع بحسب أعمار الأطفال المحفوظة.","Trois idées par semaine, adaptées aux âges enregistrés.")}</p>
   {games.map(g=><div key={g.id} className="rounded-xl border border-[#E0EADF] bg-[#FCFEFA]">
    <button type="button" aria-expanded={selected===g.id} onClick={()=>setSelected(selected===g.id?null:g.id)}
     className="flex min-h-14 w-full items-center gap-3 px-3 py-2 text-start">
     <span className="text-2xl" aria-hidden="true">{g.emoji}</span>
     <span className="min-w-0 flex-1">
      <span className="block text-sm font-bold text-[#375943]">{ar?g.ar:lang==="fr"?frenchUI(g.en):g.en}</span>
      <span className="block text-xs text-[#718478]">{g.minutes} {t("min","د","min")} · {ar?g.helpsAr:lang==="fr"?frenchUI(g.helpsEn):g.helpsEn}</span>
     </span>
     <ChevronDown className={"size-4 shrink-0 text-[#6D8573] transition-transform "+(selected===g.id?"rotate-180":"")}/>
    </button>
    {open?.id===g.id&&<div className="border-t border-[#E0EADF] px-4 pb-4 pt-3">
     <p className="text-xs leading-relaxed text-[#536B5C]">{ar?g.descriptionAr:lang==="fr"?frenchUI(g.descriptionEn):g.descriptionEn}</p>
     <ol className="mt-3 list-inside list-decimal space-y-2 text-sm text-[#3E5C49]">
      {(ar?g.stepsAr:lang==="fr"?g.stepsEn.map(x=>frenchUI(x)):g.stepsEn).map((step,i)=><li key={i}>{step}</li>)}
     </ol>
     <p className="mt-3 flex items-start gap-2 rounded-xl bg-[#F1F7ED] p-3 text-xs leading-relaxed text-[#54705D]">
      <Brain className="mt-0.5 size-4 shrink-0"/>{ar?g.whyAr:lang==="fr"?frenchUI(g.whyEn):g.whyEn}
     </p>
     <p className="mt-2 flex items-start gap-2 text-xs text-[#738779]"><Heart className="size-4 shrink-0"/>{ar?g.adaptAr:lang==="fr"?frenchUI(g.adaptEn):g.adaptEn}</p>
    </div>}
   </div>)}
   <p className="flex items-center gap-1.5 text-[11px] text-[#6D8175]"><Lightbulb className="size-4"/>{ages.length?t("No scores or tracking.","بلا علامات أو متابعة.","Ni score ni suivi."):t("Add children's ages only if you wish.","أضف أعمار الأطفال بس إذا بدك.","Ajoutez les âges seulement si vous le souhaitez.")}</p>
  </div>}
 </section>;
}
