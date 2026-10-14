import {Link} from "@tanstack/react-router";
import {AlertCircle,ChevronRight} from "lucide-react";
import {useMemo} from "react";
import {sampleMoney} from "@/lib/money";
import {getMoneyOverview} from "@/lib/moneyOverview";
import {useLocalState} from "@/lib/storage";
import {useI18n} from "@/lib/i18n";

/** Keep detailed figures on the Money screen, not in the family's daily welcome. */
export function FamilyFinanceSnapshot(){
 const {lang}=useI18n(),ar=lang==="ar";
 const [money,,ready]=useLocalState("money",sampleMoney());
 const overview=useMemo(()=>getMoneyOverview(money),[money]);
 const toReview=!money.demo && (
   overview.forecast.overdueCount>0 ||
   (overview.cashAfterBills!==null&&overview.cashAfterBills<0) ||
   overview.dateProblems>0
 );
 // The primary Money action already appears at the top of My Day.
 // Only show this contextual nudge when real, non-demo data needs attention.
 if(!ready||money.demo||!toReview)return null;
 return <section className="mt-4" aria-label={ar?"ملاحظة مالية مهمة":"Financial reminder"}>
  <Link to="/money" className="flex items-center gap-3 rounded-2xl border border-[#E9DDC8] bg-[#FFF8EF] px-4 py-3 transition hover:border-[#DABF92]">
   <AlertCircle className="size-5 shrink-0 text-[#956D46]" aria-hidden="true"/>
   <span className="min-w-0 flex-1">
    <span className="block text-sm font-semibold text-ink">{ar?"ملاحظة تستحق المراجعة":"Something worth checking"}</span>
    <span className="mt-1 block text-xs text-muted-foreground">{ar?"قد يحتاج أحد الالتزامات أو تقديرات المصروف إلى مراجعة.":"A bill or spending estimate may need attention."}</span>
   </span>
   <ChevronRight className="size-4 shrink-0 text-[#956D46] rtl:rotate-180" aria-hidden="true"/>
  </Link>
 </section>;
}
