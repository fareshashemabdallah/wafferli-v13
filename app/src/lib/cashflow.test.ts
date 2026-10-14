import { describe, expect, it } from "vitest";
import { buildForecast, futureDate, legacyIncome, monthlyTotal, scheduleDates, type IncomeSource, type Commitment } from "./cashflow";

describe("Dabberna household cash flow", () => {
  it("preserves the original monthly date after February", () => {
    expect(scheduleDates("2026-01-31","monthly","2026-02-01","2026-04-30"))
      .toEqual(["2026-02-28","2026-03-31","2026-04-30"]);
  });
  it("handles biweekly, one-time and irregular payments", () => {
    expect(scheduleDates("2026-10-01","biweekly","2026-10-01","2026-10-31"))
      .toEqual(["2026-10-01","2026-10-15","2026-10-29"]);
    expect(scheduleDates("2026-10-01","irregular","2026-10-01","2026-10-31"))
      .toEqual(["2026-10-01"]);
  });
  it("retains the old single monthly income without inventing a payment date", () => {
    const legacy=legacyIncome(1200);
    expect(legacy[0]?.nextDate).toBe("");
    expect(monthlyTotal(legacy)).toBe(1200);
  });
  it("never counts future salary as cash already safe to spend", () => {
    const incomes:IncomeSource[]=[{id:"pay",name:"Salary",amount:1200,frequency:"monthly",nextDate:"2026-10-25",shared:true}];
    const bills:Commitment[]=[{id:"rent",name:"Rent",amount:400,frequency:"once",dueDate:"2026-10-20"}];
    const result=buildForecast({incomes,commitments:bills,openingBalance:500,reserve:50,today:"2026-10-14",days:30});
    expect(result.expectedIncome).toBe(1200);
    expect(result.upcomingBills).toBe(400);
    expect(result.safeToSpend).toBe(50);
    expect(result.projectedEnd).toBe(1300);
  });
  it("includes overdue unpaid bills but skips confirmed payments", () => {
    const bills:Commitment[]=[{id:"r",name:"Rent",amount:150,frequency:"monthly",dueDate:"2026-09-15",
      paidDates:["2026-09-15"]}];
    const result=buildForecast({incomes:[],commitments:bills,openingBalance:300,reserve:0,
      today:"2026-10-14",days:30});
    expect(result.overdueCount).toBe(0);
    expect(result.upcomingBills).toBe(150);
    expect(result.events[0]?.displayDate).toBe("2026-10-15");
  });
  it("reports missed income separately instead of crediting cash", () => {
    const incomes:IncomeSource[]=[{id:"s",name:"Salary",amount:800,frequency:"once",nextDate:"2026-10-10",shared:true}];
    const result=buildForecast({incomes,commitments:[],openingBalance:100,reserve:0,today:"2026-10-14"});
    expect(result.expectedIncome).toBe(0);
    expect(result.safeToSpend).toBe(100);
  });
  it("uses local calendar date boundaries", () => {
    expect(futureDate("2026-10-31",1)).toBe("2026-11-01");
  });
});
