import {Link} from "@tanstack/react-router";
import {ChevronRight,Wallet} from "lucide-react";
import {useMemo} from "react";
import {buildForecast,legacyIncome,localToday} from "@/lib/cashflow";
import {computeMoney,sampleMoney} from "@/lib/money";
import {useLocalState} from "@/lib/storage";
import {useI18n} from "@/lib/i18n";

/** Keep detailed figures on the Money screen, not in the family's daily welcome. */
export function FamilyFinanceSnapshot(){
 const {lang}=useI18n(),ar=lang==="ar";
 const [money,,ready]=useLocalState("money",sampleMoney());
 const totals=useMemo(()=>computeMoney(money),[money]);
 const forecast=useMemo(()=>buildForecast({
  incomes:money.incomeSources??legacyIncome(money.income),
  commitments:money.commitments??[],
  openingBalance:money.cashOnHand??null,
  reserve:money.cashReserve??0,
  today:localToday(),days:30
 }),[money]);
 const toReview=!money.demo&&(forecast.overdueCount>0 ||
   (forecast.minimumBalance!==null&&forecast.minimumBalance<0) ||
   totals.projectedSavings<totals.savingsTarget);
 return <section className="mt-4" aria-label={ar?"المالية":"Money"}>
  <Link to="/money" className="flex min-h-20 items-center gap-3 rounded-2xl border border-border bg-white px-4 py-3 transition hover:border-brand/30 hover:shadow-sm">
   <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-mint text-brand"><Wallet className="size-5"/></span>
   <span className="min-w-0 flex-1">
    <span className="block text-sm font-semibold text-ink">{ar?"ماليتي، براحة بال":"Money, at your pace"}</span>
    <span className="mt-1 block text-xs text-muted-foreground">{!ready?(ar?"جارٍ التحميل":"Loading your plan…"):
     toReview?(ar?"هناك تفاصيل في خطتك تستحق المراجعة.":"Something in your plan may be worth a look."):
     money.demo?(ar?"استكشف الميزانية بأرقام تجريبية.":"Explore with sample numbers."):
     (ar?"راجع ميزانيتك عند الحاجة.":"Your plan is here when you need it.")}</span>
   </span>
   <ChevronRight className="size-4 shrink-0 text-brand rtl:rotate-180"/>
  </Link>
 </section>;
}
