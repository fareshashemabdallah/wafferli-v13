import type { IncomeSource, Commitment } from "./cashflow";
import { monthlyTotal } from "./cashflow";
export type CatType = "fixed" | "variable" | "periodic";
export type Category = { id: string; name: string; type: CatType; planned: number };
export type BudgetAllocation = {kind:"variable"|"savings"; categoryId?:string; delta:number; approvedAt:string};
export type Expense = { id: string; date: string; categoryId: string; amount: number; note?: string; owner?: string; shared: boolean; billId?:string; dueDate?:string; cashDeducted?:boolean; /** Planned entries do not count as actual spending until confirmed. */ status?:"planned"|"paid"; plannedAmount?:number; allocation?:BudgetAllocation; };
export type MoneyState = {
  /** Legacy monthly income: retained to preserve users' existing saved budgets. */
  income:number; savingsPct:number; categories:Category[]; expenses:Expense[]; demo:boolean;
  incomeSources?:IncomeSource[]; commitments?:Commitment[];
  /** Manual actual cash available now, intentionally not inferred from historic expense entries. */
  cashOnHand?:number|null; cashReserve?:number;
  /** Date on which the user last refreshed the manually entered cash balance. */
  cashUpdatedAt?:string | undefined;
  /** Exact monthly JOD savings target overrides the legacy percentage when set. */
  savingsTargetAmount?:number;
};
export type Member = { id: string; name: string; role: "adult" | "child"; ageGroup: string; prefs: string; /** Date of birth, stored on this device only. */ birthday?: string | undefined };

const today = new Date();
const d = (day: number) => {
  const n = new Date(today.getFullYear(),today.getMonth(),Math.min(day,today.getDate()));
  return [n.getFullYear(),String(n.getMonth()+1).padStart(2,"0"),String(n.getDate()).padStart(2,"0")].join("-");
};

export const sampleMoney = (): MoneyState => ({
  demo: true,
  income: 1200,
  savingsPct: 10,
  categories: [
    { id: "rent", name: "Rent", type: "fixed", planned: 400 },
    { id: "utils", name: "Electricity & water", type: "fixed", planned: 60 },
    { id: "groc", name: "Groceries", type: "variable", planned: 250 },
    { id: "fuel", name: "Fuel & transport", type: "variable", planned: 90 },
    { id: "out", name: "Eating out", type: "variable", planned: 80 },
    { id: "school", name: "School & periodic", type: "periodic", planned: 120 },
  ],
  expenses: [
    { id: "e1", date: d(1), categoryId: "rent", amount: 400, shared: true, owner: "Household" },
    { id: "e2", date: d(3), categoryId: "groc", amount: 42.5, note: "Weekly basket", shared: true },
    { id: "e3", date: d(5), categoryId: "fuel", amount: 25, shared: false, owner: "Me" },
    { id: "e4", date: d(7), categoryId: "out", amount: 18, note: "Shawarma night", shared: true },
  ],
});

export const sampleMembers = (): Member[] => [
  { id: "m1", name: "Me (sample)", role: "adult", ageGroup: "30–44", prefs: "Budget-conscious, likes Lebanese food" },
  { id: "m2", name: "Partner (sample)", role: "adult", ageGroup: "30–44", prefs: "Prefers delivery on weekdays" },
  { id: "m3", name: "Child (sample)", role: "child", ageGroup: "6–12", prefs: "School supplies in September" },
];

export function computeMoney(s: MoneyState, now = new Date()) {
  const ym = [now.getFullYear(),String(now.getMonth()+1).padStart(2,"0")].join("-");
  const month = s.expenses.filter((e) => e.date.startsWith(ym) && e.status!=="planned");
  const spentBy = (id: string) => month.filter((e) => e.categoryId === id).reduce((a, e) => a + e.amount, 0);
  const monthlyIncome = s.incomeSources === undefined ? s.income : monthlyTotal(s.incomeSources);
  const savingsTarget = typeof s.savingsTargetAmount==="number"&&Number.isFinite(s.savingsTargetAmount)&&s.savingsTargetAmount>=0
    ? s.savingsTargetAmount : Math.round(monthlyIncome*s.savingsPct)/100;
  const spendable = monthlyIncome - savingsTarget;
  const planned = s.categories.reduce((a, c) => a + c.planned, 0);
  const spent = month.reduce((a, e) => a + e.amount, 0);
  const day = now.getDate();
  const days = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  // Projection: fixed/periodic = max(planned, actual); variable = actual pace extrapolated, at least actual
  let projected = 0;
  for (const c of s.categories) {
    const a = spentBy(c.id);
    projected += c.type === "variable" ? Math.max(a, (a / day) * days) : Math.max(a, c.planned);
  }
  // expenses with unknown categories
  const known = new Set(s.categories.map((c) => c.id));
  projected += month.filter((e) => !known.has(e.categoryId)).reduce((a, e) => a + e.amount, 0);
  return {
    monthlyIncome,
    savingsTarget,
    spendable,
    planned,
    spent,
    remaining: spendable - spent,
    projected,
    projectedSavings: monthlyIncome - projected,
    overPlan: planned > spendable,
    spentBy,
    daysLeft: days - day,
  };
}