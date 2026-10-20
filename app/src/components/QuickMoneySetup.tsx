import {useState,type FormEvent} from "react";
import {toast} from "sonner";
import {CheckCircle2,LockKeyhole} from "lucide-react";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import {computeMoney,type MoneyState} from "@/lib/money";
import {Link} from "@tanstack/react-router";
import {needsStarterBudget} from "@/lib/starterBudget";
import {applyProgressiveMoneyFacts,type ProgressiveMoneyFacts} from "@/lib/progressiveFamilyInput";
import {useI18n} from "@/lib/i18n";

type Props={money:MoneyState;setMoney:(updater:(prev:MoneyState)=>MoneyState)=>void;compact?:boolean};
type Fact="essential"|"income"|"other"|"savings";
const parse=(value:string):number|undefined|null=>value.trim()===""?undefined:
 /^\d{1,6}(?:\.\d{1,2})?$/.test(value.trim())&&Number(value)<=100000?Number(value):null;

/** A single financial amount, never a multi-question setup questionnaire.
 * Each submission refines the same Money record; it cannot create extra
 * budgets, payments, bills, income schedules or family plans.
 */
export function QuickMoneySetup({money,setMoney,compact=false}:Props){
 const {lang}=useI18n(),ar=lang==="ar";
 const tr=(en:string,arabic:string)=>ar?arabic:en;
 const figures=computeMoney(money);
 const hasIncome=!money.demo&&(money.incomeKnown===true||!!money.incomeSources?.length||figures.monthlyIncome>0);
 const cats=money.demo?[]:money.categories;
 const hasCustomCategories=cats.some(c=>c.id!=="household-essential"&&c.id!=="household-flexible");
 const choices:Fact[]=[
  ...(!hasCustomCategories&&!cats.some(c=>c.id==="household-essential")?["essential" as const]:[]),
  ...(!hasIncome?["income" as const]:[]),
  ...(!hasCustomCategories&&!cats.some(c=>c.id==="household-flexible")?["other" as const]:[]),
  ...(money.demo||money.savingsTargetAmount===undefined?["savings" as const]:[])
 ];
 const [choice,setChoice]=useState<Fact>("essential");
 const [amount,setAmount]=useState("");
 const [approximate,setApproximate]=useState(true);
 const [zeroIncome,setZeroIncome]=useState(false);
 const [error,setError]=useState("");
 const fact=choices.includes(choice)?choice:choices[0];
 if((!needsStarterBudget(money)&&money.financialInputsPartial!==true)||!fact)return null;
 const labels:Record<Fact,{en:string;ar:string;placeholderEn:string;placeholderAr:string}>={
  essential:{en:"Essential monthly costs",ar:"المصاريف الشهرية الأساسية",placeholderEn:"e.g. housing, food, school",placeholderAr:"مثل البيت والأكل والمدرسة"},
  income:{en:"Monthly family income",ar:"الدخل الشهري للعيلة",placeholderEn:"Leave unknown amounts blank",placeholderAr:"اترك المبلغ المجهول فارغ"},
  other:{en:"Other monthly spending",ar:"المصاريف الشهرية الأخرى",placeholderEn:"Only what you know",placeholderAr:"فقط اللي بتعرفه"},
  savings:{en:"Optional monthly savings goal",ar:"هدف الادخار الشهري الاختياري",placeholderEn:"A goal, not money already saved",placeholderAr:"هدف، مش مبلغ مدّخر بالفعل"}
 };
 const save=(e:FormEvent)=>{
  e.preventDefault();setError("");
  const value=parse(amount);
  if(value===undefined||value===null||fact==="income"&&value===0&&!zeroIncome){
   setError(tr("Enter one valid amount. Zero income needs explicit confirmation.","أدخل مبلغاً صحيحاً واحداً. الدخل الصفري يحتاج تأكيداً صريحاً."));return;
  }
  const input:ProgressiveMoneyFacts=fact==="income"?
   {income:value,incomeConfidence:approximate?"estimate":"confirmed",zeroIncomeConfirmed:zeroIncome}:
   fact==="essential"?{essential:value}:fact==="other"?{other:value}:{savings:value};
  if(money.demo&&!window.confirm(tr("Start your own Money records? Sample finance amounts will be replaced; family members, plans and occasions remain unchanged.",
   "تبدأ سجلات مالية لعيلتك؟ سيتم استبدال الأرقام المالية التجريبية فقط. ملفات العيلة والخطط والمناسبات ما بتتغيّر.")))return;
  if(applyProgressiveMoneyFacts(money,input)===money){
   setError(tr("This is already recorded or conflicts with an existing entry. Edit its saved record instead of adding another.",
    "هذا الرقم موجود أو يتعارض مع سجل سابق. عدّل السجل الموجود بدل إدخال نسخة ثانية."));return;
  }
  // Recheck against the latest state at commit time; never replace an expense,
  // bill or category created by another part of the app in the meantime.
  setMoney(current=>applyProgressiveMoneyFacts(current,input));
  setAmount("");setZeroIncome(false);
  toast.success(tr("Saved one fact. Everything else stays as it was.","حفظنا معلومة واحدة. كل شي تاني بيضل مثل ما كان."));
 };
 return <section className={"rounded-2xl border border-[#CEE0D0] bg-[#EDF5EC] "+(compact?"p-4":"p-4 sm:p-5")}
  aria-label={tr("Add one financial fact","أضف معلومة مالية واحدة")}>
  <p className="text-xs font-semibold tracking-wide text-brand">{tr("ONE FACT AT A TIME","معلومة واحدة كل مرة")}</p>
  <h3 className="mt-2 text-lg font-semibold">{tr("Start with a number you know","بلّش برقم بتعرفه")}</h3>
  <p className="mt-2 text-sm leading-relaxed text-[#526A5C]">{tr(
   "No full budget or income disclosure required. Add one estimate, then continue your day. Blank is unknown, not zero.",
   "مش مطلوب ميزانية كاملة أو كشف الدخل. أضف تقديراً واحداً وكمل يومك. الفراغ يعني مجهول مش صفر.")}</p>
  <form className="mt-4 space-y-3" onSubmit={save}>
   <label className="block text-sm font-medium">{tr("Which figure do you know?","أي مبلغ بتعرفه؟")}
    <select aria-label={tr("Choose one money fact","اختر معلومة مالية واحدة")} value={fact} onChange={e=>{
      setChoice(e.target.value as Fact);setAmount("");setZeroIncome(false);setError("");
     }} className="mt-1 min-h-12 w-full rounded-xl border border-[#CFE0D3] bg-white px-3 text-sm">
     {choices.map(key=><option value={key} key={key}>{ar?labels[key].ar:labels[key].en}</option>)}
    </select>
   </label>
   <label className="block text-sm font-medium">{ar?labels[fact].ar:labels[fact].en} ({tr("JOD","دينار")})
    <Input type="number" inputMode="decimal" min={0} max={100000} step=".01"
     className="mt-1 min-h-12 bg-white" required value={amount} onChange={e=>setAmount(e.target.value)}
     placeholder={ar?labels[fact].placeholderAr:labels[fact].placeholderEn}/>
   </label>
   {fact==="income"&&amount!==""&&<div className="space-y-2 text-xs">
    <label className="flex min-h-10 items-center gap-2"><input type="checkbox" checked={approximate} onChange={e=>setApproximate(e.target.checked)}/>
     {tr("This income figure is an estimate","مبلغ الدخل تقديري")}</label>
    {Number(amount)===0&&<label className="flex min-h-10 items-center gap-2"><input type="checkbox" checked={zeroIncome} onChange={e=>setZeroIncome(e.target.checked)}/>
     {tr("I confirm current household income is zero","أؤكد أن دخل العيلة حالياً صفر")}</label>}
   </div>}
   {fact==="savings"&&<p className="text-xs text-[#597567]">{tr(
    "This is a target only. We will not assume money is already saved or transfer funds.",
    "هيدا هدف فقط، مش إثبات وجود مدخرات، وما رح نحوّل أموال.")}</p>}
   {error&&<p role="alert" className="text-sm text-[#A14C52]">{error}</p>}
   <Button type="submit" className="min-h-12 w-full gap-2"><CheckCircle2 className="size-4"/>{tr("Save this one fact","احفظ هالمعلومة")}</Button>
  </form>
  <p className="mt-3 flex gap-2 text-xs leading-relaxed text-muted-foreground"><LockKeyhole className="mt-0.5 size-4 shrink-0"/>
   {tr("Private in this browser. No bank connection. One entered figure cannot prove that your family can afford a new commitment.",
    "محفوظة بهالمتصفح، بلا ربط بنك. رقم واحد ما بيكفي للتأكد أن العيلة قادرة على التزام جديد.")}</p>
  <Link to="/explore/weekend" className="mt-2 inline-flex min-h-10 items-center text-xs font-semibold text-brand underline">
   {tr("Explore without entering more numbers","استكشف بدون إدخال أرقام إضافية")}</Link>
 </section>;
}
