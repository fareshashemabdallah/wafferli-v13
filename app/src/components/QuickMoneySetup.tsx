import {useState,type FormEvent} from "react";
import {toast} from "sonner";
import {CheckCircle2,LockKeyhole} from "lucide-react";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import {computeMoney,type MoneyState} from "@/lib/money";
import {Link} from "@tanstack/react-router";
import {applyStarterBudget,needsStarterBudget} from "@/lib/starterBudget";
import {useI18n} from "@/lib/i18n";
type Props={money:MoneyState;setMoney:(updater:(prev:MoneyState)=>MoneyState)=>void;compact?:boolean};
const moneyAmount=(s:string)=>s.trim()===""?NaN:Number(s);
export function QuickMoneySetup({money,setMoney,compact=false}:Props){
 const {lang}=useI18n(),ar=lang==="ar";
 const tr=(en:string,arabic:string)=>ar?arabic:en;
 const figures=computeMoney(money);
 const hasIncomeSources=!money.demo&&!!money.incomeSources?.length;
 const hasCategories=!money.demo&&money.categories.length>0;
 const [income,setIncome]=useState(!money.demo&&(money.incomeKnown||figures.monthlyIncome>0)?String(figures.monthlyIncome):"");
 const [essential,setEssential]=useState("");
 const [other,setOther]=useState("");
 const [approximate,setApproximate]=useState(true);
 const [zeroIncome,setZeroIncome]=useState(false);
 const [savingsMode,setSavingsMode]=useState<"later"|"set">("later");
 const existingSavings=!money.demo&&(money.savingsTargetAmount!==undefined||money.savingsPct>0);
 const [savings,setSavings]=useState("0");
 const [error,setError]=useState("");
 if(!needsStarterBudget(money))return null;
 const save=(e:FormEvent)=>{
  e.preventDefault();
  const amount=hasIncomeSources?figures.monthlyIncome:moneyAmount(income);
  const a=hasCategories?null:moneyAmount(essential),b=hasCategories?null:moneyAmount(other);
  const spending=hasCategories?figures.planned:(a??0)+(b??0);
  const saving=savingsMode==="set"?moneyAmount(savings):undefined;
  if(!Number.isFinite(amount)||amount<0||amount>100000||
   amount===0&&!zeroIncome||!Number.isFinite(spending)||spending<0||spending>100000||
   !hasCategories&&(!Number.isFinite(a)||!Number.isFinite(b)||a!<0||b!<0||a!>100000||b!>100000)||
   (saving!==undefined&&(!Number.isFinite(saving)||saving<0||saving>100000))){
    setError(tr("Enter valid JOD estimates. If income is zero, confirm that explicitly.","أدخل تقديرات صحيحة بالدينار، وأكّد إذا كان الدخل صفراً."));return;
  }
  if(money.demo&&!window.confirm(tr(
   "Replace sample Money with your estimates? Family profiles, occasions and existing plans will stay unchanged.",
   "هل تستبدل أرقام المالية التجريبية بتقديراتك؟ ستبقى بيانات العيلة والمناسبات والخطط كما هي.")))return;
  const next=applyStarterBudget(money,{
   income:amount,spending,savings:saving,
   ...(!hasCategories?{essential:a!,other:b!}:{}),
   approximateIncome:approximate,zeroIncomeConfirmed:zeroIncome
  });
  if(next===money){setError(tr("Could not save. Check your figures against existing financial records.","تعذّر الحفظ. راجع الأرقام والسجلات السابقة."));return;}
  setMoney(()=>next);setError("");
  toast.success(tr("Monthly estimates saved. This isn't a confirmed cash balance.","تم حفظ التقديرات الشهرية، وهي ليست رصيداً نقدياً مؤكداً."));
 };
 return <section className={"rounded-2xl border border-[#CEE0D0] bg-[#EDF5EC] "+(compact?"p-4":"p-4 sm:p-5")} aria-label={tr("Set up monthly budget","البدء بالمالية")}>
  <p className="text-xs font-semibold tracking-wide text-brand">{tr("START WITH WHAT YOU KNOW","ابدأ بالأرقام المتاحة")}</p>
  <h3 className="mt-2 text-lg font-semibold">{tr("Understand your family's monthly reality","افهم وضع عيلتك الشهري")}</h3>
  <p className="mt-2 text-sm leading-relaxed text-[#526A5C]">{tr(
   "Estimates are fine. Saving is optional. We won't treat your monthly plan as money in the bank or assume all variable spending can be cut.",
   "التقديرات مقبولة، والادخار اختياري. لن نعتبر ميزانية الشهر رصيداً بالبنك ولا أن كل مصروف متغيّر قابل للتخفيض.")}</p>
  <form className="mt-4 space-y-3" onSubmit={save}>
   <label className="block text-sm font-medium">{tr("1. Approximate monthly household income (JOD)","١. الدخل الشهري التقريبي للعيلة (د.أ)")}
    <Input required disabled={hasIncomeSources} type="number" inputMode="decimal" min={0} max={100000} step=".01"
     className="mt-1 bg-white" value={income} onChange={e=>setIncome(e.target.value)} placeholder={tr("e.g. 1500","مثلاً ١٥٠٠")}/>
   </label>
   {!hasIncomeSources&&<div className="space-y-2 text-xs">
    <label className="flex items-center gap-2"><input type="checkbox" checked={approximate} onChange={e=>setApproximate(e.target.checked)}/>
     {tr("This is an estimate, not a confirmed income figure","هذا تقدير وليس مبلغ دخل مؤكد")}</label>
    <label className="flex items-center gap-2"><input type="checkbox" checked={zeroIncome} onChange={e=>setZeroIncome(e.target.checked)}/>
     {tr("I currently have no household income","لا يوجد دخل للعيلة حالياً")}</label>
   </div>}
   {!hasCategories?<div className="space-y-3">
    <label className="block text-sm font-medium">{tr("2. Monthly essential household costs (JOD)","٢. المصاريف الأساسية الشهرية (د.أ)")}
     <Input required type="number" min={0} max={100000} step=".01" inputMode="decimal" value={essential}
      onChange={e=>setEssential(e.target.value)} className="mt-1 bg-white"/>
     <span className="mt-1 block text-xs text-muted-foreground">{tr("Housing, necessary food, healthcare, school, transport and essential bills.","السكن والطعام الضروري والصحة والتعليم والمواصلات والفواتير الأساسية.")}</span>
    </label>
    <label className="block text-sm font-medium">{tr("3. Other planned family spending (JOD)","٣. المصاريف العائلية الأخرى (د.أ)")}
     <Input required type="number" min={0} max={100000} step=".01" inputMode="decimal" value={other}
      onChange={e=>setOther(e.target.value)} className="mt-1 bg-white"/>
     <span className="mt-1 block text-xs text-muted-foreground">{tr("Activities, shopping, gifts and flexible choices. You decide what matters.","أنشطة وتسوق وهدايا وخيارات مرنة. أنت تحدد ما يهم عيلتك.")}</span>
    </label>
   </div>:<div className="rounded-xl bg-white p-3 text-sm">
    {tr("Your previously entered spending categories are preserved. Review which are essential or flexible in Spending when useful.","فئات الإنفاق المسجلة سابقاً محفوظة. يمكنك تحديد الأساسي والمرن من المصاريف عند الحاجة.")}
   </div>}
   <fieldset className="rounded-xl border border-[#D2E3D2] bg-white p-3">
    <legend className="px-1 text-sm font-semibold">{tr("4. Would you like to plan any savings now?","٤. هل ترغب بالتخطيط لادخار حالياً؟")}</legend>
    <label className="mt-2 flex items-center gap-2 text-sm"><input type="radio" name="starter-savings" checked={savingsMode==="later"} onChange={()=>setSavingsMode("later")}/>
     {existingSavings?tr("Keep my existing savings plan unchanged","احتفظ بخطة الادخار الحالية دون تغيير"):tr("Not right now — that's okay","ليس الآن، وهذا طبيعي")}</label>
    <label className="mt-2 flex items-center gap-2 text-sm"><input type="radio" name="starter-savings" checked={savingsMode==="set"} onChange={()=>setSavingsMode("set")}/>
     {tr("Yes, set a monthly savings intention","نعم، حدد مبلغاً أنوي توفيره شهرياً")}</label>
    {savingsMode==="set"&&<label className="mt-2 block text-xs font-semibold">{tr("Optional monthly savings amount (JOD)","مبلغ الادخار الشهري الاختياري (د.أ)")}
     <Input type="number" min={0} max={100000} step=".01" required inputMode="decimal" className="mt-1"
      value={savings} onChange={e=>setSavings(e.target.value)}/></label>}
   </fieldset>
   {hasIncomeSources&&figures.monthlyIncome<=0&&<p className="text-xs text-[#985A4B]">
    {tr("Review your existing income source first.","راجع مصدر الدخل المسجل أولاً.")} <Link to="/money" className="underline">{tr("Open Money","افتح المالية")}</Link></p>}
   {error&&<p role="alert" className="text-sm text-[#A14C52]">{error}</p>}
   <Button type="submit" className="min-h-12 w-full gap-2"><CheckCircle2 className="size-4"/>{tr("See what these estimates mean","اعرف شو بتعني هالتقديرات")}</Button>
  </form>
  <p className="mt-3 flex gap-2 text-xs leading-relaxed text-muted-foreground"><LockKeyhole className="mt-0.5 size-4 shrink-0"/>
   {tr("Stored in this browser only. No bank accounts are connected. Add dated bills or actual cash later when you need a more precise decision.","البيانات محفوظة بهذا المتصفح فقط ولا يوجد ربط بنكي. أضف مواعيد الفواتير والرصيد عند الحاجة لتقييم أدق.")}</p>
 </section>;
}
