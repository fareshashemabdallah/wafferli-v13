import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Calculator, Compass, MessagesSquare, Receipt, Search, ShoppingBag, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { buildForecast, legacyIncome, localToday } from "@/lib/cashflow";
import { sampleMoney } from "@/lib/money";
import { fmtJOD, useLocalState } from "@/lib/storage";
import { useI18n } from "@/lib/i18n";

export const Route=createFileRoute("/advisor")({
  head:()=>({meta:[{title:"Family Advisor — Dabberna"},{name:"description",content:"A family spending decision helper using your saved budget. No live AI is connected."}]}),
  component: Advisor
});
function Advisor(){
  const {lang}=useI18n();
  const ar=lang==="ar";
  const [money]=useLocalState("money",sampleMoney());
  const [amount,setAmount]=useState("");
  const [purpose,setPurpose]=useState("family outing");
  const forecast=useMemo(()=>buildForecast({incomes:money.incomeSources??legacyIncome(money.income),commitments:money.commitments??[],openingBalance:money.cashOnHand??null,reserve:money.cashReserve??0,today:localToday(),days:30}),[money]);
  const numeric=amount.trim()===""?null:Number(amount);
  const valid=numeric!==null&&Number.isFinite(numeric)&&numeric>0&&numeric<=100000;
  const safe=forecast.safeToSpend;
  const assessed=valid&&safe!==null;
  const affordable=assessed && safe>=numeric;
  const shortcuts=[
    {href:"/money",en:"Review family money",ar:"راجع ميزانية العائلة",Icon:Receipt},
    {href:"/explore/together",en:"Plan a family outing",ar:"خطّط لنزهة عائلية",Icon:Compass},
    {href:"/explore/smartbuy",en:"Compare a purchase",ar:"قارن مشترياتك",Icon:ShoppingBag},
    {href:"/explore/services",en:"Find a family service",ar:"ابحث عن خدمة للعائلة",Icon:Search}
  ];
  return <AppShell title={ar?"مساعد العائلة":"Family Advisor"}>
    <div className="hero-surface rounded-3xl p-6">
      <div className="flex items-center gap-2"><Sparkles className="size-6 text-brand"/><h2 className="text-xl font-semibold">{ar?"نساعدك على الاختيار بثقة":"Decide with more confidence"}</h2></div>
      <p className="mt-2 text-sm text-ink/80">{ar?"نسخة تجريبية: أداة حساب محلية للمساعدة في قرارات الإنفاق؛ ليست ذكاءً اصطناعياً متصلاً أو نصيحة مالية مهنية.":"Pilot: practical on-device spending guidance, not a connected AI chatbot or professional financial advice."}</p>
    </div>
    <div className="card-soft mt-5 p-5">
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
        <p className="font-semibold">{!assessed?(ar?"بيانات إضافية مطلوبة":"More information needed"):affordable?(ar?"المبلغ ضمن الحد المحسوب بحذر":"Within the conservative spending estimate"):(ar?"المبلغ يتجاوز الحد المحسوب":"Beyond the current spending estimate")}</p>
        <p className="mt-2 text-sm">{safe===null?
          (ar?"أدخل رصيدك النقدي الحالي ومواعيد الالتزامات واحتياطي الطوارئ في صفحة أموالي للحصول على تقدير حذر.":"Enter today's cash balance, scheduled bills and reserve in My Money before relying on this estimate.")
          :(ar?"الحد المحسوب للصرف الآن: ":"Estimated uncommitted cash: ")+fmtJOD(safe)+". "+(ar?"التقدير لا يشمل نفقات لم تُسجّل.":"This does not account for unrecorded expenses.")}</p>
        <p className="mt-2 text-xs text-muted-foreground">{ar?"النتيجة للمراجعة فقط ولا تضمن القدرة المالية أو تعوض التخطيط." : "This is a planning aid, not a financial guarantee."}</p>
      </div>}
      <Link to="/money" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-brand">{ar?"أكمل بيانات الميزانية":"Complete your financial plan"} <ArrowRight className="size-4 rtl:rotate-180"/></Link>
    </div>
    <Link to="/community" search={{kind:"advice",topic:"Family recommendations",invite:undefined,category:"doctor",item:"",area:""}} className="card-soft mt-4 flex items-start gap-3 p-4 hover:border-brand/40">
      <MessagesSquare className="mt-0.5 size-6 text-brand"/><span><strong>{ar?"اسأل أولياء الأمور في مجموعتك":"Ask your trusted parent network"}</strong><span className="mt-1 block text-sm text-muted-foreground">{ar?"مثلاً: هل جرب أحد هذا الطبيب أو المنتَج؟ افتح نقاشاً خاصاً بالمجموعة.":"For example: Has anyone used this doctor or product? Ask in a private group."}</span></span>
    </Link>
    <h2 className="mt-7 mb-3 text-lg font-semibold">{ar?"كيف نساعدك اليوم؟":"What would you like to do?"}</h2>
    <div className="grid gap-3 sm:grid-cols-2">
      {shortcuts.map(({href,en,ar:arabic,Icon})=><Link key={href} to={href} className="card-soft flex items-center gap-3 p-4 font-medium hover:border-brand/40"><Icon className="size-5 text-brand"/>{ar?arabic:en}<ArrowRight className="ms-auto size-4 text-muted-foreground rtl:rotate-180"/></Link>)}
    </div>
  </AppShell>;
}
