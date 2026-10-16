import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Calculator, Compass, Receipt, Search, ShoppingBag, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { GuidedFamilyAdvisor } from "@/components/GuidedFamilyAdvisor";
import {LiveFamilyAdvisor} from "@/components/LiveFamilyAdvisor";
import {assessImmediateSpending} from "@/lib/spendingScenario";
import { sampleMoney } from "@/lib/money";
import { fmtJOD, useLocalState } from "@/lib/storage";
import { useI18n } from "@/lib/i18n";

export const Route=createFileRoute("/advisor")({
  head:()=>({meta:[{title:"Wise Decisions — Dabberna"},{name:"description",content:"Bilingual family spending guidance with an optional secure live AI chat when separately activated."}]}),
  component: Advisor
});
function Advisor(){
  const {lang}=useI18n();
  const ar=lang==="ar";
  const [money]=useLocalState("money",sampleMoney());
  const [amount,setAmount]=useState("");
  const [purpose,setPurpose]=useState("family outing");
  const numeric=amount.trim()===""?null:Number(amount);
  const valid=numeric!==null&&Number.isFinite(numeric)&&numeric>0&&numeric<=100000;
  const scenario=useMemo(()=>assessImmediateSpending(money,valid?numeric!:0),[money,numeric,valid]);
  const reasonAr:Record<string,string>={
   "Enter a valid one-off amount in JOD (up to 2 decimals).":"أدخل مبلغاً صحيحاً بحد أقصى منزلتين عشريتين.",
   "Demo finances cannot be used for a real spending decision.":"البيانات التجريبية غير مناسبة لقرار إنفاق فعلي.",
   "Complete your real monthly income and category budget.":"أكمل الدخل الشهري الحقيقي وميزانية الفئات.",
   "Enter the actual cash balance held today.":"أدخل الرصيد النقدي الفعلي اليوم.",
   "Refresh and date-check your actual cash balance.":"راجع رصيدك الفعلي وحدّث تاريخ تسجيله.",
   "Review unpaid bills with due dates or confirm none this month.":"راجع الفواتير غير المدفوعة ومواعيدها أو أكّد عدم وجودها هذا الشهر.",
   "Some scheduled income or bills have invalid or missing dates.":"بعض الدخل أو الفواتير تفتقد تواريخ صحيحة.",
   "Unable to calculate the recorded cash trajectory.":"تعذّر حساب التدفق النقدي المسجّل.",
   "At least one recorded bill is overdue or not confirmed paid.":"هناك فاتورة مسجّلة متأخرة أو غير مؤكدة السداد.",
   "The cost exceeds recorded cash after unpaid bills and reserve.":"الكلفة أكبر من الرصيد المسجّل بعد الفواتير والاحتياطي.",
   "The 30-day forecast's low point falls below your selected cash reserve after this payment.":"أدنى رصيد متوقع خلال ٣٠ يوماً أقل من الاحتياطي بعد هذا المصروف."
  };
  const shortcuts=[
    {href:"/money",en:"Review family money",ar:"راجع ميزانية العائلة",Icon:Receipt},
    {href:"/explore/together",en:"Plan a family outing",ar:"خطّط لنزهة عائلية",Icon:Compass},
    {href:"/explore/smartbuy",en:"Compare a purchase",ar:"قارن مشترياتك",Icon:ShoppingBag},
    {href:"/explore/services",en:"Find a family service",ar:"ابحث عن خدمة للعائلة",Icon:Search},
    {href:"/occasions",en:"Plan an upcoming occasion",ar:"خطّط لمناسبة قادمة",Icon:Sparkles}
  ];
  return <AppShell title={ar?"قرارات ذكية":"Wise Decisions"}>
    <div className="page-intro relative overflow-hidden p-5 sm:p-7">
      <div className="flex items-center gap-2"><Sparkles className="size-6 text-brand"/><h2 className="text-2xl font-semibold">{ar?"أنفق بذكاء، وعِش براحة":"Spend wisely. Live well."}</h2></div>
      <p className="mt-2 max-w-lg text-sm leading-relaxed text-[#536E5D]">{ar?"خلّينا نشوف إذا قرار المصروف مناسب لخطتك، من غير ما تتخلى عن الأشياء الحلوة.":"Feel good about spending on what matters, while keeping the important things covered."}</p>
    </div>
    <GuidedFamilyAdvisor/>
    <LiveFamilyAdvisor/>
    <details className="group editorial-card mt-5 p-5 sm:p-6">
      <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 font-semibold text-brand">
       <Calculator className="size-5" aria-hidden="true"/>
       {ar?"احسب تأثير مصروف محدد (اختياري)":"Check a specific purchase amount (optional)"} +
      </summary>
      <p className="mt-2 text-xs text-muted-foreground">
       {ar?"جرّب تأثير مبلغ قبل الدفع. الحساب يعتمد على الأرقام المدخلة فقط، ولا يغيّر أي مصروف.":
        "Try a one-off amount before paying. This uses your entered records only and changes no expense or bank balance."}
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="text-sm font-medium">{ar?"المبلغ (دينار)":"Amount (JOD)"}
          <input type="number" min="0" max="100000" step=".01" value={amount} onChange={e=>setAmount(e.target.value)} className="mt-1 w-full rounded-xl border border-border bg-background p-3" placeholder="35"/>
        </label>
        <label className="text-sm font-medium">{ar?"السبب":"Purpose"}
          <select value={purpose} onChange={e=>setPurpose(e.target.value)} className="mt-1 w-full rounded-xl border border-border bg-background p-3">
            <option value="family outing">{ar?"نزهة عائلية":"Family outing"}</option>
            <option value="gift">{ar?"هدية":"Gift"}</option>
            <option value="shopping">{ar?"مشتريات":"Shopping"}</option>
            <option value="other">{ar?"غير ذلك":"Other"}</option>
          </select>
        </label>
      </div>
      {valid&&<div role="status" className={"mt-4 rounded-2xl border p-4 "+
       (scenario.outcome==="review"?"border-[#E6D3C5] bg-[#FFF8F1]":"border-[#DCE8D9] bg-[#F4F8F1]")}>
        <h3 className="font-semibold">{scenario.outcome==="unknown"?
         (ar?"المعلومات ناقصة لتقييم هذا المصروف":"More real information is required"):
         scenario.outcome==="review"?
         (ar?"هذا المصروف قد يضغط على سيولة العائلة":"This spending may put household cash under pressure"):
         (ar?"تقدير أولي فقط — راجع قبل الالتزام":"A provisional check only — review before committing")}</h3>
        {scenario.riskReasons.length>0&&<ul className="mt-2 list-disc space-y-1 ps-5 text-sm">
         {scenario.riskReasons.map(r=><li key={r}>{ar?(reasonAr[r]??r):r}</li>)}
        </ul>}
        {scenario.projectedLowJod!==null&&<>
         <p className="mt-2 text-sm">{ar?"أدنى رصيد متوقع خلال ٣٠ يوماً بعد هذا المصروف: ":"Estimated 30-day low after this payment: "}
          <strong>{fmtJOD(scenario.projectedLowJod)}</strong></p>
         <p className="mt-1 text-sm">{ar?"الاحتياطي الذي اخترته: ":"Your chosen reserve: "}
          {fmtJOD(scenario.reserveJod??0)}</p>
         <p className="mt-1 text-sm">{ar?"الرصيد النظري بعد الفواتير المسجّلة والاحتياطي وهذا المصروف: ":"Estimated cash after recorded bills, reserve and this purchase: "}
          {fmtJOD(scenario.billOnlyHeadroomJod??0)}</p>
        </>}
        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{ar?
         "محاكاة لدفع المبلغ اليوم؛ الرصيد والدخل والفواتير إدخالات يدوية، وليست بيانات بنكية مؤكدة. المصاريف غير المسجّلة وتأخر الدخل غير مضمونين، وقد تتغير النتيجة.":
         "Assumes payment today. Cash, income and bills are manually entered, not bank-verified. Unrecorded everyday expenses and delayed income may change the result; this is not a spending guarantee."}</p>
       </div>}
      <p className="mt-4 text-xs leading-relaxed text-muted-foreground">{ar?"هذه مساعدة حسابية بناءً على بياناتك، وليست ذكاءً اصطناعيًا متصلًا أو نصيحة مالية متخصصة.":"This is an on-device calculation, not a connected AI chatbot or professional financial advice."}</p>
      <Link to="/money" className="mt-4 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-brand">{ar?"أكمل بيانات الميزانية":"Complete your financial plan"} <ArrowRight className="size-4 rtl:rotate-180"/></Link>
    </details>
    <div className="editorial-card mt-5 p-4"><h2 className="font-semibold">{ar?"اسأل من تثق بهم":"Ask people you trust"}</h2><p className="mt-1 text-sm text-muted-foreground">{ar?"اسأل مجموعتك عن طبيب أو منتج أو نشاط جرّبوه بالفعل.":"Ask your circle if someone has personally tried a doctor, product or activity."}</p><Link to="/community" className="mt-2 inline-block font-semibold text-brand">{ar?"فتح دردشة المجموعة":"Open group discussion"} →</Link></div>
    <details className="group editorial-card mt-5 p-4"><summary className="cursor-pointer text-sm font-semibold text-brand">{ar?"استكشف خيارات أخرى":"More ways to plan"} +</summary>
    <div className="mt-3 grid gap-2 sm:grid-cols-2">
      {shortcuts.map(({href,en,ar:arabic,Icon})=><Link key={href} to={href} className="flex min-h-12 items-center gap-3 rounded-xl px-3 text-sm font-medium text-brand hover:bg-mint/60"><Icon className="size-5"/>{ar?arabic:en}<ArrowRight className="ms-auto size-4 rtl:rotate-180"/></Link>)}
    </div></details>
  </AppShell>;
}
