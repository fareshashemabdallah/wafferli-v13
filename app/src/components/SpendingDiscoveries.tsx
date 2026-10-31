import {useState,type FormEvent} from "react";
import {useI18n} from "@/lib/i18n";
import {fmtJOD} from "@/lib/storage";
import {localToday} from "@/lib/cashflow";
import {type MoneyState} from "@/lib/money";
import {buildSpendingDiscoveries,discoveryTargetValid} from "@/lib/spendingDiscoveries";

type Props={state:MoneyState;setState:(next:MoneyState|((prev:MoneyState)=>MoneyState))=>void};
/** One optional insight inside Our Money, never another finance dashboard.
 * A target is a voluntary behavioural guide, not cash saved or a budget entry.
 */
export function SpendingDiscoveries({state,setState}:Props){
 const {lang}=useI18n();
 const t=(en:string,ar:string,fr:string)=>lang==="ar"?ar:lang==="fr"?fr:en;
 const view=buildSpendingDiscoveries(state,localToday().slice(0,7));
 const groups=view.visible.slice(0,4);
 const [key,setKey]=useState<string|null>(null);
 const [editing,setEditing]=useState(false);
 const [draft,setDraft]=useState("");
 const [error,setError]=useState("");
 if(state.demo||view.paidCount<2||groups.length===0)return null;
 const active=groups.find(g=>g.key===key)??groups[0]!;
 const food=active.kind==="food-delivery";
 const name=food?t("Food delivery","توصيل الأكل","Livraison de repas"):active.label;
 const select=(value:string)=>{setKey(value);setEditing(false);setError("");};
 const save=(ev:FormEvent)=>{
  ev.preventDefault();
  if(!/^\d{1,6}(?:\.\d{1,2})?$/.test(draft.trim())||!discoveryTargetValid(Number(draft))){
   setError(t("Enter a valid monthly amount in JOD.","أدخل مبلغاً شهرياً صحيحاً بالدينار.","Saisissez un montant mensuel valide en JOD."));return;
  }
  const amount=Number(draft);
  setState(prev=>prev.demo?prev:{...prev,spendingDiscoveryTargets:{...prev.spendingDiscoveryTargets,[active.key]:amount}});
  setEditing(false);setError("");
 };
 const clear=()=>{
  setState(prev=>{
   if(!prev.spendingDiscoveryTargets||!(active.key in prev.spendingDiscoveryTargets))return prev;
   const targets={...prev.spendingDiscoveryTargets};delete targets[active.key];
   return {...prev,spendingDiscoveryTargets:targets};
  });setEditing(false);setError("");
 };
 const difference=active.targetJod===null?null:
  Math.round((active.amountJod-active.targetJod)*100)/100;
 return <section data-testid="money-spending-discoveries"
  aria-label={t("Spending discoveries","اكتشافات المصاريف","Découvertes de dépenses")}
  className="rounded-2xl border border-[#D9E7DB] bg-[linear-gradient(130deg,#F3FAF3,#FFFFFF_70%)] p-4 sm:p-5">
  <div className="flex items-start justify-between gap-3">
   <div>
    <p className="text-[11px] font-bold uppercase tracking-wider text-[#598770]">{t("Money insight","معلومة عن مصاريفك","Éclairage sur vos dépenses")}</p>
    <h3 className="mt-1 text-base font-extrabold text-[#285D42]">{t("Something worth noticing","مصروف يستحق الانتباه","Une dépense à remarquer")}</h3>
   </div>
   <span aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-2xl bg-[#E5F3E6] text-xl">{food?"🥡":"🔎"}</span>
  </div>
  {groups.length>1&&<div className="mt-3 flex flex-wrap gap-2" aria-label={t("Spending areas","مجالات المصاريف","Catégories de dépenses")}>
   {groups.map(g=><button key={g.key} type="button" onClick={()=>select(g.key)} aria-pressed={active.key===g.key}
    className={"min-h-10 max-w-full rounded-full border px-3 text-xs font-semibold "+(active.key===g.key?"border-[#548E6D] bg-[#E4F2E6] text-[#26583F]":"border-[#DDE9DE] bg-white text-[#587262]")}>
    {g.kind==="food-delivery"?t("Food delivery","توصيل الأكل","Livraison de repas"):g.label}
   </button>)}
  </div>}
  <div className="mt-3 flex flex-wrap items-end justify-between gap-2">
   <div className="min-w-0">
    <p className="text-sm font-semibold text-[#476A52]">{name}</p>
    <p className="mt-1 text-2xl font-black tabular-nums text-[#285D42]">{fmtJOD(active.amountJod)}</p>
   </div>
   <p className="text-xs font-semibold text-[#597766]">
    {active.count} {t("recorded purchases","مصاريف مسجلة","achats enregistrés")} · {active.sharePct}% {t("of recorded spending","من المصاريف المسجلة","des dépenses enregistrées")}
   </p>
  </div>
  {active.previousMonthJod!==null&&<p className="mt-2 text-xs text-[#647D6D]">
   {t("Previous month recorded: ","الشهر السابق مسجّل: ","Mois précédent enregistré : ")}{fmtJOD(active.previousMonthJod)}
  </p>}
  {active.targetJod!==null&&<div className="mt-3 rounded-xl border border-[#D6E7DA] bg-white p-3">
   <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
    <span className="font-semibold text-[#50755C]">{t("Your monthly target","هدفك الشهري","Votre objectif mensuel")}: {fmtJOD(active.targetJod)}</span>
    <span className={"font-bold "+(difference!==null&&difference>0?"text-[#A05A3C]":"text-[#367D59]")}>
     {difference!==null&&difference>0?
      fmtJOD(difference)+" "+t("above target so far","فوق الهدف حتى الآن","au-dessus de l’objectif pour l’instant"):
      t("Within target so far","ضمن الهدف حتى الآن","Dans l’objectif pour l’instant")}
    </span>
   </div>
   <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#E6F0E9]">
    <div className="h-full rounded-full bg-[#55A37B]" style={{width:Math.min(100,active.targetJod>0?active.amountJod/active.targetJod*100:active.amountJod>0?100:0)+"%"}}/>
   </div>
  </div>}
  {!editing?<button type="button" onClick={()=>{setDraft(active.targetJod===null?"":String(active.targetJod));setEditing(true);}}
   className="mt-3 min-h-11 rounded-xl border border-[#B7D8C2] bg-white px-4 text-sm font-bold text-[#327650]">
   {active.targetJod===null?t("Set a comfortable target","حدّد هدف مناسب","Fixer un objectif réaliste"):
    t("Adjust my target","عدّل هدفي","Modifier mon objectif")}
  </button>:<form onSubmit={save} className="mt-3 rounded-xl border border-[#D6E7DA] bg-white p-3">
   <label className="text-xs font-bold text-[#4E735D]">{t("Monthly target · JOD","الهدف الشهري · دينار","Objectif mensuel · JOD")}
    <input aria-label={t("Monthly spending target in JOD","هدف المصاريف الشهري بالدينار","Objectif mensuel de dépenses en JOD")}
     autoFocus type="number" inputMode="decimal" min="0" max="100000" step=".01" value={draft}
     onChange={e=>{setDraft(e.target.value);setError("");}}
     className="mt-1 min-h-11 w-full rounded-xl border border-[#C8DEC8] px-3 text-sm"/>
   </label>
   {error&&<p role="alert" className="mt-2 text-xs font-semibold text-red-700">{error}</p>}
   <div className="mt-2 flex flex-wrap gap-2">
    <button type="submit" className="min-h-11 rounded-xl bg-[#33865B] px-4 text-xs font-bold text-white">{t("Save target","احفظ الهدف","Enregistrer l’objectif")}</button>
    <button type="button" onClick={()=>{setEditing(false);setError("");}} className="min-h-11 px-3 text-xs font-bold text-[#527461]">{t("Cancel","إلغاء","Annuler")}</button>
    {active.targetJod!==null&&<button type="button" onClick={clear} className="min-h-11 px-3 text-xs font-bold text-[#A05A3C]">{t("Remove target","احذف الهدف","Supprimer l’objectif")}</button>}
   </div>
  </form>}
  <p className="mt-3 text-[11px] leading-relaxed text-[#738878]">
   {t("Only expenses you recorded as paid are included. Missing purchases may change the picture. Targets guide your choices; they do not change your budget or move money.",
    "نحسب فقط المصاريف المدفوعة اللي سجّلتها. أي مصاريف ناقصة ممكن تغيّر الصورة. الهدف بيساعدك تقرر، وما بيغيّر الميزانية أو بينقل مصاري.",
    "Seules les dépenses payées et saisies sont comptées. Les achats manquants peuvent modifier le résultat. Un objectif ne modifie ni votre budget ni votre argent.")}
  </p>
 </section>;
}
