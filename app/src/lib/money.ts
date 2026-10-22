import type { IncomeSource, Commitment } from "./cashflow";
import type {SavingsGoal} from "./savingsGoals";
import type {BudgetItem} from "./householdBudgetBuilder";
import { monthlyTotal } from "./cashflow";
import { monthCarryover } from "./monthlyCarryover";
import {effectiveCategoryAllowance} from "./monthAwareMoney";
export type CatType = "fixed" | "variable" | "periodic";
export type Category = { id: string; name: string; type: CatType; planned: number; /** Family-confirmed meaning, distinct from urgency, bill schedule, or category monthly amount. */ spendingRole?:import("./spendingGroups").SpendingRole; /** Descriptive typical cadence; it does not create dates or obligations. */ expectedCadence?:import("./spendingGroups").ExpenseCadence; /** Stable image grouping independent of category name. */ visualGroup?:import("./familyCategoryCards").CategoryVisualGroup; visualIcon?:import("./familyCategoryCards").CategoryPicture; /** Optional family-declared priority, independent of fixed/variable schedule. */ priority?:"essential"|"protected"|"flexible"; /** Unreviewed legacy values remain estimates. */ amountConfidence?:"estimate"|"confirmed" };
export type BudgetAllocation = {kind:"variable"|"savings"; categoryId?:string; delta:number; approvedAt:string};
export type Expense = { id: string; date: string; categoryId: string; amount: number; /** Optional link to one detailed budget item; older entries remain category-only. */ budgetItemId?:string; note?: string; owner?: string; shared: boolean; billId?:string; dueDate?:string; cashDeducted?:boolean; sourcePlanId?:string; /** Identifies exactly one paid component of a family occasion. */ sourceOccasionCost?:"gift"|"celebration"|"extras"; /** Planned entries do not count as actual spending until confirmed. */ status?:"planned"|"paid"; plannedAmount?:number; allocation?:BudgetAllocation; varianceDismissed?:boolean; };
export type MoneyState = {
  /** Legacy monthly income: retained to preserve users' existing saved budgets. */
  income:number; savingsPct:number; categories:Category[]; expenses:Expense[]; demo:boolean;
  /** Optional item detail. Category planned totals remain canonical; never sum both. */
  budgetItems?:BudgetItem[];
  /** Names of removed categories retained only to label previous payment history. */
  retiredCategoryNames?:Record<string,string>;
  /** User-removed starter illustrations should not reappear as empty budget prompts. */
  hiddenStarterGroups?:import("./familyCategoryCards").CategoryPicture[];
  /** Explicitly distinguishes a parent-entered zero income from unknown income. */
  incomeKnown?:boolean; incomeConfidence?:"estimate"|"confirmed";
  /** A one-fact-at-a-time estimate does NOT describe the entire household budget. */
  financialInputsPartial?:boolean;
  /** Declared priorities for family life, not automatically deducted or shared. */
  protectedLifestyle?:("children"|"education"|"family-time"|"health"|"travel"|"buffer")[];
  incomeSources?:IncomeSource[]; commitments?:Commitment[];
  /** Optional forecast cadence for existing monthly category envelopes. No extra expenses. */
  spendingPaces?:import("./familyMoneyRhythm").SpendingPace[];
  /** Optional parent-confirmed category allowance for one YYYY-MM, never an expense or recurring bill. */
  categoryMonthlyPlans?:Record<string,Record<string,number>>;
  /** Manual actual cash available now, intentionally not inferred from historic expense entries. */
  cashOnHand?:number|null; cashReserve?:number;
  /** Date on which the user last refreshed the manually entered cash balance. */
  cashUpdatedAt?:string | undefined;
  /** Exact monthly JOD savings target overrides the legacy percentage when set. */
  savingsTargetAmount?:number;
  /** Approved one-off reallocations affect their payment month, not future months. */
  monthlyAdjustments?:Record<string,{savingsDelta:number;categoryDeltas:Record<string,number>}>;
  /** Manually stated goals, not bank balances or actual cash transfers. */
  savingsGoals?:SavingsGoal[];
  /** User attested there are no scheduled bills this calendar month. */
  noBillsConfirmedMonth?:string;
};
export type Member = { id: string; name: string; role: "adult" | "child"; ageGroup: string; prefs: string; /** Legacy full date of birth, not required for new profiles. */ birthday?: string | undefined; /** MM-DD only: permits birthday reminders without retaining birth year. */ birthdayMonthDay?:string|undefined; /** Optional whole-year age; no birth year needed. */ ageYears?:number|undefined };

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
  const baseSavings = typeof s.savingsTargetAmount==="number"&&Number.isFinite(s.savingsTargetAmount)&&s.savingsTargetAmount>=0
    ? s.savingsTargetAmount : Math.round(monthlyIncome*s.savingsPct)/100;
  const monthly=s.monthlyAdjustments?.[ym];
  const savingsTarget=Math.round((baseSavings+(monthly?.savingsDelta??0))*100)/100;
  const carryover=monthCarryover(s,ym);
  const spendable = monthlyIncome - savingsTarget + carryover.net;
  const plannedBy=(id:string)=>effectiveCategoryAllowance(s,id,ym);
  const planned = Math.round(s.categories.reduce((a, c) => a + plannedBy(c.id), 0)*100)/100;
  const spent = month.reduce((a, e) => a + e.amount, 0);
  const day = now.getDate();
  const days = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  // Projection: fixed/periodic = max(planned, actual); variable = actual pace extrapolated, at least actual
  let projected = 0;
  for (const c of s.categories) {
    const a = spentBy(c.id);
    projected += c.type === "variable" ? Math.max(a, (a / day) * days) : Math.max(a, plannedBy(c.id));
  }
  // expenses with unknown categories
  const known = new Set(s.categories.map((c) => c.id));
  projected += month.filter((e) => !known.has(e.categoryId)).reduce((a, e) => a + e.amount, 0);
  return {
    monthlyIncome,
    savingsTarget,
    carryover,
    spendable,
    planned,
    spent,
    remaining: spendable - spent,
    projected,
    projectedSavings: monthlyIncome + carryover.net - projected,
    overPlan: planned > spendable,
    spentBy,
    plannedBy,
    daysLeft: days - day,
  };
}