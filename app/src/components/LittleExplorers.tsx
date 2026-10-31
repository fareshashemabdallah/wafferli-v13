import {useState} from "react";
import {Link} from "@tanstack/react-router";
import {ArrowLeft,ArrowRight,Brain,Check,Eye,Heart,Lightbulb,ShieldCheck,Sparkles} from "lucide-react";
import {useI18n} from "@/lib/i18n";

type Language="en"|"ar"|"fr";
type Copy=Record<Language,string>;
type Stage="welcome"|"remember"|"choose"|"correct"|"offline"|"done";
type ObjectKey="apple"|"bear"|"car"|"star"|"sun"|"flower"|"fish"|"ball"|"book"|"rocket"|"tree"|"butterfly";
const objects:Record<ObjectKey,{emoji:string;name:Copy}>={
 apple:{emoji:"🍎",name:{en:"Apple",ar:"تفاحة",fr:"Pomme"}},
 bear:{emoji:"🧸",name:{en:"Teddy bear",ar:"دبدوب",fr:"Ours"}},
 car:{emoji:"🚗",name:{en:"Car",ar:"سيارة",fr:"Voiture"}},
 star:{emoji:"⭐",name:{en:"Star",ar:"نجمة",fr:"Étoile"}},
 sun:{emoji:"☀️",name:{en:"Sun",ar:"شمس",fr:"Soleil"}},
 flower:{emoji:"🌼",name:{en:"Flower",ar:"زهرة",fr:"Fleur"}},
 fish:{emoji:"🐟",name:{en:"Fish",ar:"سمكة",fr:"Poisson"}},
 ball:{emoji:"⚽",name:{en:"Ball",ar:"كرة",fr:"Ballon"}},
 book:{emoji:"📚",name:{en:"Books",ar:"كتب",fr:"Livres"}},
 rocket:{emoji:"🚀",name:{en:"Rocket",ar:"صاروخ",fr:"Fusée"}},
 tree:{emoji:"🌳",name:{en:"Tree",ar:"شجرة",fr:"Arbre"}},
 butterfly:{emoji:"🦋",name:{en:"Butterfly",ar:"فراشة",fr:"Papillon"}}
};
export const memoryRounds:readonly {visible:readonly ObjectKey[];missing:ObjectKey;choices:readonly ObjectKey[]}[]=[
 {visible:["apple","bear","car","star"],missing:"car",choices:["car","flower","sun"]},
 {visible:["fish","ball","book","flower"],missing:"book",choices:["rocket","book","tree"]},
 {visible:["butterfly","sun","rocket","apple","tree"],missing:"butterfly",choices:["ball","butterfly","bear"]}
];
const text={
 badge:{en:"LITTLE EXPLORERS",ar:"المستكشفون الصغار",fr:"PETITS EXPLORATEURS"},
 title:{en:"What disappeared?",ar:"شو اختفى؟",fr:"Qu'est-ce qui a disparu ?"},
 intro:{en:"A tiny memory game, then a real-world discovery together.",ar:"لعبة ذاكرة قصيرة، وبعدها نكتشف أشياء حوالينا سوا.",fr:"Un petit jeu de mémoire, puis une découverte dans la vraie vie."},
 age:{en:"Ages 4–5 · About 3 minutes",ar:"للأعمار ٤–٥ · حوالي ٣ دقائق",fr:"4–5 ans · Environ 3 minutes"},
 start:{en:"Let's play!",ar:"يلا نلعب!",fr:"On joue !"},
 look:{en:"Look carefully and remember!",ar:"تفرّج منيح وتذكّر!",fr:"Regarde bien et mémorise !"},
 ready:{en:"I remember!",ar:"تذكّرت!",fr:"J'ai mémorisé !"},
 which:{en:"Which object is missing?",ar:"شو الغرض اللي اختفى؟",fr:"Quel objet a disparu ?"},
 again:{en:"Have another look. You can do it!",ar:"جرّب مرة تانية، بتقدر!",fr:"Regarde encore. Tu peux y arriver !"},
 great:{en:"You spotted it!",ar:"عرفتها! شاطر!",fr:"Tu l'as trouvé !"},
 next:{en:"Next little challenge",ar:"التحدّي اللي بعده",fr:"Défi suivant"},
 mission:{en:"Now explore the real world",ar:"هلّق اكتشف العالم حواليك",fr:"À toi d'explorer le monde réel"},
 missionTitle:{en:"Let's put the phone down",ar:"خلّينا نحط التلفون عجنب",fr:"On pose le téléphone"},
 missionText:{en:"Look around without leaving your seat. Can you find two round things? Tell your grown-up what you found.",ar:"طلّع حواليك من مطرحك. فيك تلاقي غرضين مدوّرين؟ خبر ماما أو بابا شو لقيت.",fr:"Regarde autour de toi sans quitter ta place. Trouve deux objets ronds et raconte-les à un adulte."},
 missionSafety:{en:"Stay with your grown-up. No photos, location or internet needed.",ar:"ضلّ مع أهلك. ما في حاجة لصور أو موقع أو إنترنت.",fr:"Reste avec un adulte. Ni photo, ni position, ni Internet requis."},
 done:{en:"We explored together!",ar:"اكتشفنا سوا!",fr:"On a exploré ensemble !"},
 farewell:{en:"Wonderful! The best discoveries happen together, away from the screen.",ar:"رائع! أحلى الاكتشافات بتصير سوا، بعيد عن الشاشة.",fr:"Bravo ! Les plus belles découvertes se font ensemble, loin de l'écran."},
 back:{en:"Back to Today",ar:"رجوع لليوم",fr:"Retour à Aujourd'hui"},
 stop:{en:"Finish screen time",ar:"خلص وقت الشاشة",fr:"Terminer l'écran"},
 round:{en:"Round",ar:"الجولة",fr:"Manche"},
 memory:{en:"Memory & attention",ar:"الذاكرة والانتباه",fr:"Mémoire et attention"},
 free:{en:"No scores · No endless play",ar:"بلا علامات · بلا لعب بلا نهاية",fr:"Sans scores · Sans jeu infini"}
} satisfies Record<string,Copy>;
const tileColors=["bg-[#FFF1E7]","bg-[#EEF7ED]","bg-[#F4ECFC]","bg-[#FFF6D9]","bg-[#EAF4FA]"];
export function LittleExplorers(){
 const {lang}=useI18n();
 const locale:Language=lang==="ar"?"ar":lang==="fr"?"fr":"en";
 const t=(copy:Copy)=>copy[locale];
 const [stage,setStage]=useState<Stage>("welcome");
 const [index,setIndex]=useState(0);
 const [wrong,setWrong]=useState(false);
 const round=memoryRounds[index]!;
 const isRTL=locale==="ar";
 const advance=()=>{
  setWrong(false);
  if(index+1===memoryRounds.length)setStage("offline");
  else {setIndex(i=>i+1);setStage("remember");}
 };
 const choose=(key:ObjectKey)=>{
  if(key===round.missing){setWrong(false);setStage("correct");}
  else setWrong(true);
 };
 const primary="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#287D5C] px-5 py-3 text-base font-extrabold text-white shadow-[0_12px_26px_-14px_rgba(34,99,67,.6)] hover:bg-[#206849] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#287D5C]";
 return <div className="mx-auto max-w-xl pb-6" dir={isRTL?"rtl":"ltr"} data-testid="little-explorers">
  <div className="overflow-hidden rounded-[2rem] border border-[#DCE8D9] bg-white shadow-[0_24px_60px_-42px_rgba(36,85,56,.5)]">
   <header className="relative overflow-hidden bg-[linear-gradient(130deg,#EAF7E7,#FFF4E6_65%,#FDECF3)] px-5 pb-5 pt-5 sm:px-7">
    <div className="flex items-center justify-between gap-2">
     <span className="inline-flex items-center gap-1.5 text-[11px] font-black tracking-wide text-[#317451]"><Sparkles className="size-4"/>{t(text.badge)}</span>
     <Link to="/" className="inline-flex min-h-11 items-center gap-1 rounded-full bg-white/80 px-3 text-xs font-bold text-[#3E6650]">
      {isRTL?<ArrowRight className="size-4"/>:<ArrowLeft className="size-4"/>}{t(text.back)}
     </Link>
    </div>
    <div className="mt-4 flex items-center gap-4">
     <div aria-hidden="true" className="grid size-20 shrink-0 place-items-center rounded-[1.65rem] bg-white/75 text-5xl shadow-sm">🧩</div>
     <div>
      <h1 className="text-2xl font-black leading-tight text-[#284C3D] sm:text-3xl">{t(text.title)}</h1>
      <p className="mt-1 text-sm font-semibold text-[#6A806F]">{t(text.age)}</p>
     </div>
    </div>
   </header>
   <div className="p-4 sm:p-7">
    {stage==="welcome"&&<div className="space-y-5">
     <p className="text-base leading-relaxed text-[#536B5E]">{t(text.intro)}</p>
     <div className="grid grid-cols-4 gap-2" aria-hidden="true">{(["apple","bear","car","star"] as const).map((key,i)=>
      <div key={key} className={"grid aspect-square place-items-center rounded-2xl text-4xl "+tileColors[i]}>{objects[key].emoji}</div>)}</div>
     <p className="flex items-center gap-2 text-xs text-[#6B8174]"><Brain className="size-4"/>{t(text.memory)} · {t(text.free)}</p>
     <button type="button" className={primary} onClick={()=>setStage("remember")}>{t(text.start)}<ArrowRight className={"size-5 "+(isRTL?"rotate-180":"")}/></button>
    </div>}
    {(stage==="remember"||stage==="choose"||stage==="correct")&&<div className="space-y-4">
     <div className="flex items-center justify-between gap-2">
      <span className="text-sm font-bold text-[#46745C]">{t(text.round)} {index+1} / {memoryRounds.length}</span>
      <button type="button" className="inline-flex min-h-11 items-center text-xs font-semibold text-[#6C8173] underline" onClick={()=>setStage("offline")}>{t(text.stop)}</button>
     </div>
     <div className="flex gap-1.5" aria-label={String(index+1)+" / "+memoryRounds.length}>
      {memoryRounds.map((r,i)=><span key={r.missing} className={"h-1.5 flex-1 rounded-full "+(i<=index?"bg-[#499773]":"bg-[#E3EBE4]")}/>)}
     </div>
     <h2 className="text-center text-lg font-extrabold text-[#294E3A]">{t(stage==="remember"?text.look:stage==="correct"?text.great:text.which)}</h2>
     <div className={"grid gap-2 "+(round.visible.length===5?"grid-cols-5":"grid-cols-4")}>
      {round.visible.map((key,i)=>{
       const missing=stage!=="remember"&&round.missing===key;
       return <div key={key} className={"flex min-h-[76px] flex-col items-center justify-center rounded-2xl border border-white px-1 py-3 "+(missing?"border-dashed !border-[#A8C5B0] bg-[#F3F8F3]":tileColors[i%tileColors.length])}>
        <span aria-hidden="true" className="text-4xl sm:text-5xl">{missing?"❔":objects[key].emoji}</span>
       </div>;
      })}
     </div>
     {stage==="remember"&&<button type="button" className={primary} onClick={()=>setStage("choose")}><Eye className="size-5"/>{t(text.ready)}</button>}
     {stage==="choose"&&<>
      <div className="grid grid-cols-3 gap-2" role="group" aria-label={t(text.which)}>
       {round.choices.map((key,i)=><button type="button" key={key} onClick={()=>choose(key)}
         className={"flex min-h-[102px] flex-col items-center justify-center gap-1 rounded-2xl border border-[#E0EADF] text-sm font-bold text-[#365E47] transition hover:border-[#68AB84] focus-visible:outline-2 focus-visible:outline-[#348A65] "+tileColors[(i+1)%tileColors.length]}>
        <span aria-hidden="true" className="text-4xl">{objects[key].emoji}</span><span>{t(objects[key].name)}</span>
       </button>)}
      </div>
      {wrong&&<p role="status" className="rounded-xl bg-[#FFF3E8] p-3 text-center text-sm font-semibold text-[#865F43]">{t(text.again)}</p>}
     </>}
     {stage==="correct"&&<button type="button" className={primary} onClick={advance}><Check className="size-5"/>{t(text.next)}</button>}
    </div>}
    {stage==="offline"&&<div className="space-y-4 text-center" data-testid="offline-discovery">
     <div aria-hidden="true" className="text-6xl">🌍</div>
     <h2 className="text-2xl font-black text-[#2D6249]">{t(text.missionTitle)}</h2>
     <p className="text-base font-medium leading-relaxed text-[#476956]">{t(text.missionText)}</p>
     <div className="flex items-start gap-2 rounded-xl bg-[#F2F7ED] p-3 text-start text-xs text-[#5A7263]">
      <ShieldCheck className="mt-0.5 size-4 shrink-0"/>{t(text.missionSafety)}
     </div>
     <button type="button" className={primary} onClick={()=>setStage("done")}><Heart className="size-5"/>{t(text.done)}</button>
    </div>}
    {stage==="done"&&<div className="space-y-5 py-4 text-center">
     <div aria-hidden="true" className="text-6xl">🌟</div>
     <h2 className="text-2xl font-black text-[#2E684E]">{t(text.done)}</h2>
     <p className="text-base text-[#5B7562]">{t(text.farewell)}</p>
     <Link to="/" className={primary}>{t(text.back)}</Link>
    </div>}
   </div>
  </div>
  <p className="mt-3 flex items-center justify-center gap-2 px-3 text-center text-xs text-[#688073]"><Lightbulb className="size-4"/>{t(text.memory)} · {t(text.free)}</p>
 </div>;
}
