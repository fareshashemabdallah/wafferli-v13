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
const asMoney=(s:string)=>s.trim()===""?NaN:Number(s);
export function QuickMoneySetup({money,setMoney,compact=false}:Props){
 const {lang}=useI18n(),ar=lang==="ar";
 const figures=computeMoney(money);
 const hasIncomeSources=!money.demo&&!!money.incomeSources?.length;
 const hasCategories=!money.demo&&money.categories.length>0;
 const [income,setIncome]=useState(!money.demo&&figures.monthlyIncome>0?String(figures.monthlyIncome):"");
 const [spending,setSpending]=useState(!money.demo&&hasCategories?String(figures.planned):"");
 const [savings,setSavings]=useState(!money.demo?String(figures.savingsTarget):"");
 const [error,setError]=useState("");
 if(!needsStarterBudget(money))return null;
 const save=(e:FormEvent)=>{
  e.preventDefault();
  const input={income:asMoney(income),spending:asMoney(spending),savings:asMoney(savings)};
  if(Object.values(input).some(v=>!Number.isFinite(v)||v<0||v>100000)||input.income<=0)
   return setError(ar?"أدخل الدخل والمصاريف والادخار كأرقام صحيحة بالدينار.":"Enter valid income, spending and savings figures in JOD.");
  if(hasIncomeSources&&figures.monthlyIncome<=0)return setError(ar?
   "لديك مصدر دخل مُسجل بدون مبلغ شهري صحيح. رجاء حدّثه في المالية.":"An income source has been entered without a valid monthly amount. Edit it in Money first.");
  if(money.demo&&!window.confirm(ar?
    "سنستبدل بيانات المالية التجريبية بهذه الأرقام. لن تتغير الخطط أو المناسبات أو بيانات العائلة. هل تؤكد؟":
    "Replace the sample Money numbers with these real figures? Your plans, occasions and family details will stay unchanged."))return;
  const next=applyStarterBudget(money,input);
  if(next===money)return setError(ar?"تعذّر حفظ الأرقام. راجع القيم أو السجلات الموجودة.":"Could not save. Check the figures against existing Money records.");
  setMoney(()=>next);setError("");
  toast.success(ar?"تم! الآن يمكنك مقارنة خطتك بأرقامك.":"Ready. Your plan can now use your monthly estimates.");
 };
 return <section className={"rounded-2xl border border-[#CEE0D0] bg-[#EDF5EC] "+(compact?"p-4":"p-4 sm:p-5")} aria-label={ar?"البدء بالمالية":"Set up monthly budget"}>
   <p className="text-xs font-semibold tracking-wide text-brand">{ar?"ابدأ من هنا · أقل من دقيقة":"START HERE · ABOUT A MINUTE"}</p>
   <h3 className="mt-2 text-lg font-semibold">{ar?"خلّينا نفهم ميزانية بيتك أولاً":"Tell Dabberna three numbers"}</h3>
   <p className="mt-2 text-sm leading-relaxed text-[#526A5C]">{ar?
     "لحتى نعرف إذا الخطة بتناسبك، نحتاج الدخل والمصاريف والادخار الشهري. هيدي أرقام تخطيط مش رصيد بنك، وأي فواتير أو رصيد سجلته من قبل رح يضل محفوظ.":
     "Start with income, expected household spending and a savings goal. These are monthly estimates, not bank cash. Any bills or cash you already entered will be preserved."}</p>
   <form className="mt-4 space-y-3" onSubmit={save}>
    <label className="block text-sm font-medium">{ar?"١. دخل العائلة بالشهر (دينار)":"1. Monthly household income (JOD)"}
      <Input required disabled={hasIncomeSources} type="number" inputMode="decimal" min={0.01} max={100000} step=".01" className="mt-1 bg-white" value={income} onChange={e=>setIncome(e.target.value)} placeholder={ar?"مثلاً ١٥٠٠":"e.g. 1500"}/>
    </label>
    <label className="block text-sm font-medium">{ar?"٢. كم تتوقع تصرف بالشهر؟ (دينار)":"2. Expected monthly household spending (JOD)"}
      <Input required disabled={hasCategories} type="number" inputMode="decimal" min={0} max={100000} step=".01" className="mt-1 bg-white" value={spending} onChange={e=>setSpending(e.target.value)} placeholder={ar?"إيجار، أكل، مدارس، فواتير…":"Rent, groceries, school, bills…"} />
    </label>
    <label className="block text-sm font-medium">{ar?"٣. كم تريد توفّر بالشهر؟ (دينار)":"3. Monthly savings goal (JOD)"}
      <Input required type="number" inputMode="decimal" min={0} max={100000} step=".01" className="mt-1 bg-white" value={savings} onChange={e=>setSavings(e.target.value)} placeholder={ar?"مثلاً ٢٠٠":"e.g. 200"}/>
    </label>
    {hasIncomeSources&&figures.monthlyIncome<=0&&<p className="text-xs text-[#985A4B]">{ar?"مصدر دخلك يحتاج تصحيح في المالية أولاً.":"Your existing income source needs correcting in Money."} <Link to="/money" className="font-semibold underline">{ar?"افتح المالية":"Open Money"}</Link></p>}
    {error&&<p className="text-sm text-[#A14C52]" role="alert">{error}</p>}
    <Button type="submit" className="min-h-12 w-full gap-2"><CheckCircle2 className="size-4"/>{ar?"احسب قدرتي على تنفيذ الخطة":"Calculate my plan's budget fit"}</Button>
   </form>
   <p className="mt-3 flex gap-2 text-xs leading-relaxed text-muted-foreground"><LockKeyhole className="mt-0.5 size-4 shrink-0"/>
    {ar?"تُحفظ البيانات على هذا المتصفح فقط. هذا تقدير مبدئي يمكنك تفصيله لاحقاً في المالية؛ لا نعتبره رصيداً نقدياً أو تأكيداً للقدرة على الدفع.":
    "Stored only in this browser. This is a first estimate you can refine in Money. It is not a cash balance or payment approval."}
   </p>
 </section>;
}
