import { Link } from "@tanstack/react-router";
import { ArrowUpRight, CalendarClock, PiggyBank, ShieldCheck, Wallet } from "lucide-react";
import { useMemo } from "react";
import { useI18n } from "@/lib/i18n";
import { computeMoney, sampleMoney } from "@/lib/money";
import { fmtJOD, useLocalState } from "@/lib/storage";

export function FamilyFinanceSnapshot() {
  const { lang } = useI18n();
  const [money, , ready] = useLocalState("money", sampleMoney());
  const finance = useMemo(() => computeMoney(money), [money]);
  const ar = lang === "ar";
  const demo = money.demo;
  const financialPlanShortfall = finance.projectedSavings < money.savingsPct / 100 * finance.monthlyIncome;
  return (
    <section className="mt-5 space-y-3" aria-label={ar ? "الملخص المالي للعائلة" : "Family financial overview"}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-brand">{ar ? "راحة البال تبدأ بالتخطيط" : "Peace of mind starts with a plan"}</p>
          <h2 className="mt-1 text-xl font-semibold text-ink">{ar ? "الملخص المالي للعائلة" : "Your family's money at a glance"}</h2>
        </div>
        <Link to="/money" className="inline-flex items-center gap-1 text-sm font-semibold text-brand">
          {ar ? "التفاصيل" : "Details"} <ArrowUpRight className="size-4 rtl:-rotate-90" />
        </Link>
      </div>
      {!ready ? (
        <div className="card-soft p-5 text-sm text-muted-foreground">{ar ? "جارٍ قراءة الميزانية المحفوظة..." : "Loading your saved budget…"}</div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: ar ? "الدخل الشهري" : "Monthly income", value: finance.monthlyIncome, Icon: Wallet },
              { label: ar ? "المصروف هذا الشهر" : "Spent this month", value: finance.spent, Icon: CalendarClock },
              { label: ar ? "هدف الادخار" : "Savings target", value: finance.savingsTarget, Icon: PiggyBank },
              { label: ar ? "المتبقي من المخصص للصرف" : "Remaining spendable", value: finance.remaining, Icon: ShieldCheck }
            ].map(({label, value, Icon}) => (
              <div className="card-soft min-w-0 p-4" key={label}>
                <Icon aria-hidden="true" className="size-5 text-brand" />
                <p className="mt-2 text-xs text-muted-foreground">{label}</p>
                <p className="mt-1 text-lg font-semibold tabular-nums text-ink">{fmtJOD(value)}</p>
              </div>
            ))}
          </div>
          <div className="rounded-2xl border border-border bg-mint/50 p-4">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 size-5 shrink-0 text-brand" />
              <div className="min-w-0">
                <p className="font-semibold text-ink">{demo
                  ? (ar ? "بيانات تجريبية — ليست تقييماً لوضعك المالي" : "Demo figures — not a financial assessment")
                  : (financialPlanShortfall
                    ? (ar ? "قد تحتاج خطة الإنفاق إلى مراجعة" : "Your spending plan may need a review")
                    : (ar ? "راجع الالتزامات والاحتياطي النقدي" : "Review upcoming bills and cash reserves"))}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {demo
                    ? (ar ? "الأرقام للعرض فقط. أدخل بياناتك التجريبية في صفحة أموالي لتجربة التوصيات." : "These are illustrative amounts. Adjust the sample budget in My Money to explore the tools.")
                    : (ar ? "التقديرات تعتمد على المصاريف المدخلة، ولا تثبت الأمان المالي من دون الالتزامات والسيولة والاحتياطي." : "This estimate is based on recorded spending; it cannot confirm financial safety without complete obligations, cash flow and reserves.")}
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
