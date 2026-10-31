import {useState,type FormEvent} from "react";
import {useI18n} from "@/lib/i18n";
import {fmtJOD} from "@/lib/storage";
import {localToday} from "@/lib/cashflow";
import {type MoneyState} from "@/lib/money";
import {buildSpendingDiscoveries,discoveryTargetValid} from "@/lib/spendingDiscoveries";

type Props={state:MoneyState;setState:(next:MoneyState|((prev:MoneyState)=>MoneyState))=>void;onStartReal:()=>void;onRecordExpense:()=>void};
/** One optional insight inside Our Money, never another finance dashboard.
 * A target is a voluntary behavioural guide, not cash saved or a budget entry.
 */
export function SpendingDiscoveries({state,setState,onStartReal,onRecordExpense}:Props){
 const {lang}=useI18n();
 const t=(en:string,ar:string,fr:string)=>lang==="ar"?ar:lang==="fr"?fr:en;
 const view=buildSpendingDiscoveries(state,localToday().slice(0,7));
 const groups=view.visible.slice(0,1);
 const [editing,setEditing]=useState(false);
 const [draft,setDraft]=useState("");
 const [error,setError]=useState("");

 // Keep the feature visible while family records are incomplete. Do not claim
 // illustrative numbers are the parent's own, and do not require setup.
 const heading=<div className="flex items-center justify-between gap-3">
   <div>
    
    <h3 className="mt-1 text-base font-extrabold text-[#285D42]">{t("Spending Discoveries","اكتشافات المصاريف","Découvertes de dépenses")}</h3>
   </div>
   <span aria-hidden="true" className="text-lg">🔎</span>
  </div>;
 const shell="rounded-2xl border border-[#D9E7DB] bg-white p-3 sm:p-4";
 if(state.demo)return <section data-testid="money-spending-discoveries" className={shell}
   aria-label={t("Spending Discoveries","اكتشافات المصاريف","Découvertes de dépenses")}>
   {heading}
   <p className="mt-3 inline-flex rounded-full bg-[#FFF0DB] px-3 py-1 text-[11px] font-bold text-[#84622D]">
    {t("Example only · not your spending","مثال فقط · مش مصاريفك","Exemple uniquement · ce ne sont pas vos dépenses")}
   </p>
   <div className="mt-3 rounded-xl border border-[#E3EBDE] bg-white p-3">
    <p className="text-sm font-semibold text-[#47745A]">🥡 {t("Food delivery","توصيل الأكل","Livraison de repas")}</p>
    <div className="mt-1 flex items-end justify-between gap-2">
     <strong className="text-2xl font-black tabular-nums text-[#285D42]">{fmtJOD(96)}</strong>
     <span className="text-xs text-[#657F6C]">8 {t("sample orders","طلبات افتراضية","commandes fictives")}</span>
    </div>
    <p className="mt-2 text-xs text-[#667E6C]">{t(
     "Eight small orders can add up. See where your money goes, then choose whether to set a target.",
     "ثمانية طلبات صغيرة ممكن يتراكم مبلغها. شوف وين بتروح مصاريفك، وبعدها قرّر إذا بدك تحدّد هدف.",
     "Huit petites commandes peuvent vite s'additionner. Découvrez vos dépenses, puis choisissez votre objectif."
    )}</p>
   </div>
   <button type="button" onClick={onStartReal}
    className="mt-3 min-h-11 rounded-xl border border-[#B7D8C2] bg-white px-4 text-sm font-bold text-[#327650]">
    {t("Use my own figures","استخدم أرقامي","Utiliser mes propres chiffres")}
   </button>
  </section>;
 if(view.paidCount<2||groups.length===0)return <section data-testid="money-spending-discoveries" className={shell}
   aria-label={t("Spending Discoveries","اكتشافات المصاريف","Découvertes de dépenses")}>
   {heading}
   <p className="mt-2 text-sm font-semibold text-[#355F48]">{t(
    "No overlooked spending pattern spotted yet.",
    "ما ظهر نمط مصاريف غير متوقّع بعد.",
    "Aucune habitude de dépense inhabituelle repérée pour le moment."
   )}</p>
   <p className="mt-1 text-xs leading-relaxed text-[#6C8372]">{t(
    "We look for repeated optional purchases, not school fees or essential bills. This reflects only expenses you recorded.",
    "مندور على المصاريف الاختيارية المتكررة، مش أقساط المدرسة أو الفواتير الأساسية. حسب اللي سجّلته فقط.",
    "Nous examinons les achats facultatifs répétés, pas les frais scolaires ou les factures essentielles. Selon vos saisies uniquement."
   )}</p>
   {view.paidCount===0&&<button type="button" onClick={onRecordExpense}
    className="mt-2 min-h-10 rounded-xl border border-[#B7D8C2] bg-white px-3 text-xs font-bold text-[#327650]">
    {t("Record an expense","سجّل مصروف","Enregistrer une dépense")}
   </button>}
  </section>;
 const active=groups[0]!;
 const food=active.kind==="food-delivery";
 const name=food?t("Food delivery","توصيل الأكل","Livraison de repas"):active.label;
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
  className={shell}>
  {heading}
  <p className="mt-3 text-xs font-semibold text-[#567F63]">{t("Worth noticing","يستحق الانتباه","À remarquer")}</p>
  <div className="mt-3 flex flex-wrap items-end justify-between gap-2">
   <div className="min-w-0">
    <p className="text-sm font-semibold text-[#476A52]">{name}</p>
    <p className="mt-1 text-2xl font-black tabular-nums text-[#285D42]">{fmtJOD(active.amountJod)}</p>
   </div>
   <p className="text-xs font-semibold text-[#597766]">
    {active.count} {t("recorded purchases","مصاريف مسجلة","achats enregistrés")}
   </p>
  </div>
  {active.previousMonthJod!==null&&active.signal==="increase"&&<p className="mt-2 text-xs text-[#647D6D]">
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
