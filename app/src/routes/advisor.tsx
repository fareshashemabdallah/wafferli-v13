import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Calculator, Compass, Receipt, Search, ShoppingBag, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { getMoneyOverview } from "@/lib/moneyOverview";
import { sampleMoney } from "@/lib/money";
import { fmtJOD, useLocalState } from "@/lib/storage";
import { useI18n } from "@/lib/i18n";

export const Route=createFileRoute("/advisor")({
  head:()=>({meta:[{title:"Wise Decisions — Dabberna"},{name:"description",content:"A family spending decision helper using your saved budget. No live AI is connected."}]}),
  component: Advisor
});
function Advisor(){
  const {lang}=useI18n();
  const ar=lang==="ar";
  const [money]=useLocalState("money",sampleMoney());
  const [amount,setAmount]=useState("");
  const [purpose,setPurpose]=useState("family outing");
  const overview=useMemo(()=>getMoneyOverview(money),[money]);
  const numeric=amount.trim()===""?null:Number(amount);
  const valid=numeric!==null&&Number.isFinite(numeric)&&numeric>0&&numeric<=100000;
  const afterBills=overview.cashAfterBills;
  const assessed=valid&&!money.demo&&overview.cashSet&&overview.hasBillSchedule&&overview.dateProblems===0&&afterBills!==null;
  const coversScheduled=assessed && afterBills>=numeric;
  const moreDetailsNeeded=money.demo||!overview.cashSet||!overview.hasBillSchedule||overview.dateProblems>0;
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
    <div className="editorial-card mt-5 p-5 sm:p-6">
      <div className="flex items-center gap-2"><Calculator className="size-5 text-brand"/><h2 className="font-semibold">{ar?"هل يناسب هذا المصروف ميزانيتنا؟":"Can we plan this purchase?"}</h2></div>
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
      {valid && <div role="status" className="mt-4 rounded-2xl bg-mint/70 p-4">
        <p className="font-semibold">{!assessed?(ar?"نحتاج تفاصيل مالية قبل المقارنة":"More financial information needed"):coversScheduled?(ar?"قد تسمح الأرقام المدخلة بذلك — بعد مراجعة المصاريف اليومية":"Recorded cash may cover it — review everyday expenses too"):(ar?"الشراء قد يتجاوز الرصيد بعد الالتزامات":"May exceed cash after recorded commitments")}</p>
        <p className="mt-2 text-sm">{moreDetailsNeeded?
          (ar?"هذه البيانات غير مكتملة أو تجريبية. أدخل الرصيد الفعلي والفواتير المستحقة وتواريخها في المالية.":"These figures are incomplete or demo data. Enter actual cash, unpaid bills and valid due dates in Money.")
          :(ar?"الرصيد بعد الفواتير المسجلة والاحتياطي: ":"Cash after scheduled bills and reserve: ")+fmtJOD(afterBills??0)+". "+(ar?"هذا ليس مبلغاً آمناً للإنفاق؛ المصاريف غير المجدولة غير محسوبة.":"This is not safe-to-spend money: costs without due dates are excluded.")}</p>
        <p className="mt-2 text-xs text-muted-foreground">{ar?"النتيجة للمراجعة فقط ولا تضمن القدرة المالية أو تعوض التخطيط." : "This is a planning aid, not a financial guarantee."}</p>
      </div>}
      <p className="mt-4 text-xs leading-relaxed text-muted-foreground">{ar?"هذه مساعدة حسابية بناءً على بياناتك، وليست ذكاءً اصطناعيًا متصلًا أو نصيحة مالية متخصصة.":"This is an on-device calculation, not a connected AI chatbot or professional financial advice."}</p>
      <Link to="/money" className="mt-4 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-brand">{ar?"أكمل بيانات الميزانية":"Complete your financial plan"} <ArrowRight className="size-4 rtl:rotate-180"/></Link>
    </div>
    <div className="editorial-card mt-5 p-4"><h2 className="font-semibold">{ar?"اسأل من تثق بهم":"Ask people you trust"}</h2><p className="mt-1 text-sm text-muted-foreground">{ar?"اسأل مجموعتك عن طبيب أو منتج أو نشاط جرّبوه بالفعل.":"Ask your circle if someone has personally tried a doctor, product or activity."}</p><Link to="/community" className="mt-2 inline-block font-semibold text-brand">{ar?"فتح دردشة المجموعة":"Open group discussion"} →</Link></div>
    <details className="group editorial-card mt-5 p-4"><summary className="cursor-pointer text-sm font-semibold text-brand">{ar?"استكشف خيارات أخرى":"More ways to plan"} +</summary>
    <div className="mt-3 grid gap-2 sm:grid-cols-2">
      {shortcuts.map(({href,en,ar:arabic,Icon})=><Link key={href} to={href} className="flex min-h-12 items-center gap-3 rounded-xl px-3 text-sm font-medium text-brand hover:bg-mint/60"><Icon className="size-5"/>{ar?arabic:en}<ArrowRight className="ms-auto size-4 rtl:rotate-180"/></Link>)}
    </div></details>
  </AppShell>;
}
