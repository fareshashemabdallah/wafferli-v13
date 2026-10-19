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
const parse=(value:string):number|undefined|null=>value.trim()===""?undefined:
 /^\d{1,6}(?:\.\d{1,2})?$/.test(value.trim())&&Number(value)<=100000?Number(value):null;
/** Collect exactly the facts a parent knows; don't fabricate a missing income or
 * another spending category. An incomplete budget is permitted to stay incomplete.
 */
export function QuickMoneySetup({money,setMoney,compact=false}:Props){
 const {lang}=useI18n(),ar=lang==="ar";
 const tr=(en:string,arabic:string)=>ar?arabic:en;
 const figures=computeMoney(money);
 const hasIncomeSources=!money.demo&&!!money.incomeSources?.length;
 const hasIncome=!money.demo&&(money.incomeKnown===true||hasIncomeSources);
 const categories=money.demo?[]:money.categories;
 const hasCustomCategories=categories.some(c=>c.id!=="household-essential"&&c.id!=="household-flexible");
 const canEnterCosts=!hasCustomCategories;
 const showEssential=canEnterCosts&&!categories.some(c=>c.id==="household-essential");
 const showOther=canEnterCosts&&!categories.some(c=>c.id==="household-flexible");
 const [income,setIncome]=useState("");
 const [essential,setEssential]=useState("");
 const [other,setOther]=useState("");
 const [approximate,setApproximate]=useState(true);
 const [zeroIncome,setZeroIncome]=useState(false);
 const [savings,setSavings]=useState("");
 const [error,setError]=useState("");
 if(!needsStarterBudget(money))return null;
 const save=(event:FormEvent)=>{
  event.preventDefault();setError("");
  const i=hasIncome?undefined:parse(income),a=showEssential?parse(essential):undefined,
   b=showOther?parse(other):undefined,s=parse(savings);
  if([i,a,b,s].includes(null) || i===0&&!zeroIncome){
   setError(tr("Enter a valid amount. To record zero income, confirm that explicitly.","أدخل مبلغاً صحيحاً. إذا كان الدخل صفراً، أكّد ذلك بشكل واضح."));return;
  }
  const values:ProgressiveMoneyFacts={
   ...(i!==undefined?{income:i,incomeConfidence:approximate?"estimate":"confirmed" as const,
    zeroIncomeConfirmed:zeroIncome}:{}),
   ...(a!==undefined?{essential:a}:{}),...(b!==undefined?{other:b}:{}),
   ...(s!==undefined?{savings:s}:{})
  };
  if(!Object.keys(values).some(x=>x==="income"||x==="essential"||x==="other"||x==="savings")){
   setError(tr("Enter one amount you know. Everything else can wait.","أدخل مبلغاً واحداً بتعرفه، والباقي ممكن ينتظر."));return;
  }
  if(money.demo&&!window.confirm(tr("Start your own Money records? Sample amounts will be replaced; family members, plans and occasions remain unchanged.",
    "بدك تبدأ بأرقام عيلتك؟ رح نستبدل الأرقام التجريبية فقط، ونحافظ على العيلة والخطط والمناسبات.")))return;
  const next=applyProgressiveMoneyFacts(money,values);
  if(next===money){
   setError(tr("That entry conflicts with existing financial records. Edit the saved category or income source instead.","هذه البيانات تتعارض مع سجل موجود. عدّل الفئة أو مصدر الدخل المحفوظ بدل التكرار."));return;
  }
  setMoney(()=>next);
  setIncome("");setEssential("");setOther("");setSavings("");
  toast.success(tr("Saved what you know. The missing figures remain unknown, not zero.","حفظنا اللي بتعرفه. المبالغ الناقصة بقيت مجهولة، مش صفر."));
 };
 return <section className={"rounded-2xl border border-[#CEE0D0] bg-[#EDF5EC] "+(compact?"p-4":"p-4 sm:p-5")} aria-label={tr("Set up monthly budget","البدء بالمالية")}>
  <p className="text-xs font-semibold tracking-wide text-brand">{tr("ONE FACT AT A TIME","معلومة واحدة كل مرة")}</p>
  <h3 className="mt-2 text-lg font-semibold">{tr("What do you know about your family's money?","شو بتعرف عن مصاريف ودخل عيلتك؟")}</h3>
  <p className="mt-2 text-sm leading-relaxed text-[#526A5C]">{tr(
   "Enter only one amount if that's all you know. Every field is optional. Blank never means zero; you can explore the app without sharing income.",
   "فيك تدخل مبلغ واحد بس إذا هيدا اللي بتعرفه. كل الخانات اختيارية. الفاضي مش صفر، وفيك تستكشف التطبيق بدون ما تشارك الدخل.")}</p>
  <form className="mt-4 space-y-3" onSubmit={save}>
   {!hasIncome?<label className="block text-sm font-medium">{tr("Approximate monthly household income (optional, JOD)","الدخل الشهري التقريبي (اختياري، دينار)")}
    <Input type="number" inputMode="decimal" min={0} max={100000} step=".01" className="mt-1 bg-white"
     value={income} onChange={e=>setIncome(e.target.value)} placeholder={tr("Leave blank if unknown","اتركها فاضية إذا مش معروف")}/>
   </label>:<p className="rounded-lg bg-white p-3 text-xs text-[#58715E]">{tr("Your existing income record is kept. You won't be asked to enter it twice.","مصدر الدخل موجود ومحفوظ؛ مش رح نطلبه منك مرتين.")} {hasIncomeSources?tr("Edit income sources in Bills when needed.","عدّل مصادر الدخل في قسم الفواتير عند الحاجة."):""}</p>}
   {!hasIncome&&income!==""&&<div className="space-y-2 text-xs">
    <label className="flex items-center gap-2"><input type="checkbox" checked={approximate} onChange={e=>setApproximate(e.target.checked)}/>{tr("This is an estimate","هذا تقدير")}</label>
    {Number(income)===0&&<label className="flex items-center gap-2"><input type="checkbox" checked={zeroIncome} onChange={e=>setZeroIncome(e.target.checked)}/>{tr("I confirm our income is currently zero","أكّد أن دخل عيلتنا حالياً صفر")}</label>}
   </div>}
   {showEssential&&<label className="block text-sm font-medium">{tr("One estimate of monthly essential costs (optional, JOD)","تقدير المصاريف الأساسية الشهرية (اختياري، دينار)")}
    <Input type="number" min={0} max={100000} step=".01" inputMode="decimal" value={essential}
     onChange={e=>setEssential(e.target.value)} className="mt-1 bg-white" placeholder={tr("Housing, food, schooling…","بيت، أكل، مدرسة…")}/>
   </label>}
   {showOther&&<label className="block text-sm font-medium">{tr("Other family spending estimate (optional, JOD)","تقدير مصاريف العيلة الأخرى (اختياري، دينار)")}
    <Input type="number" min={0} max={100000} step=".01" inputMode="decimal" value={other}
     onChange={e=>setOther(e.target.value)} className="mt-1 bg-white" placeholder={tr("Only if you know","فقط إذا بتعرف")}/>
   </label>}
   {!canEnterCosts&&<p className="rounded-xl bg-white p-3 text-xs text-[#58715E]">{tr(
    "Your detailed budget categories already own these figures. Edit them in Money instead of entering a duplicate total.",
    "فئات ميزانيتك التفصيلية موجودة، عدّلها في صفحة المال بدل ما تدخل مجموع جديد ومكرر.")}</p>}
   <details className="rounded-xl border border-[#D2E3D2] bg-white p-3">
    <summary className="min-h-10 cursor-pointer text-sm font-semibold">{tr("Savings goal (optional—can wait)","هدف الادخار (اختياري وممكن ينتظر)")}</summary>
    <label className="mt-2 block text-xs">{tr("Optional monthly savings amount (JOD)","مبلغ الادخار الشهري الاختياري (دينار)")}
     <Input type="number" min={0} max={100000} step=".01" className="mt-1" value={savings} onChange={e=>setSavings(e.target.value)}
      placeholder={tr("Leave blank to keep the existing plan","فاضي يعني احتفظ بالخطة الموجودة")}/>
    </label>
   </details>
   {error&&<p role="alert" className="text-sm text-[#A14C52]">{error}</p>}
   <Button type="submit" className="min-h-12 w-full gap-2"><CheckCircle2 className="size-4"/>{tr("Save what I know","احفظ اللي بعرفه")}</Button>
  </form>
  <p className="mt-3 flex gap-2 text-xs leading-relaxed text-muted-foreground"><LockKeyhole className="mt-0.5 size-4 shrink-0"/>
   {tr("Your estimates remain in this browser during the pilot. No bank account is connected; an incomplete picture never proves you can afford a commitment.",
       "تقديراتك محفوظة بهذا المتصفح خلال التجربة، وما في ربط بنك. المعلومات الناقصة ما بتثبت القدرة على الدفع.")}</p>
  <Link to="/explore/weekend" className="mt-2 inline-flex min-h-10 items-center text-xs font-semibold text-brand underline">{tr("Explore without entering more numbers","استكشف بدون أرقام إضافية")}</Link>
 </section>;
}
