import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { arabicUI, arabicDictionaryKeys } from "./arabic";

const components=[
  "routes/about.tsx","routes/index.tsx","routes/money.tsx","routes/space.tsx",
  "components/CashFlowPlanner.tsx",
];

describe("Dabberna Arabic UI",()=>{
  it("translates core household, cash-flow, outings and place screens",()=>{
    expect(arabicUI("My Money")).toBe("أموالي");
    expect(arabicUI("Cash flow · التدفق النقدي")).toBe("التدفق النقدي");
    expect(arabicUI("Income schedule · مصادر الدخل")).toBe("جدول مصادر الدخل");
    expect(arabicUI("Save expense")).toBe("حفظ المصروف");
    expect(arabicUI("Dabberna Together")).toBe("دبّرنا سوا");
    expect(arabicUI("Find real places")).toBe("ابحث عن أماكن حقيقية");
  });
  it("never translates identifiers, user supplied text or prices by default",()=>{
    expect(arabicUI("rare-custom-merchant-name")).toBe("rare-custom-merchant-name");
    expect(arabicUI("873.24 JOD")).toBe("873.24 JOD");
  });
  it("translates dynamic cash-flow warnings",()=>{
    expect(arabicUI("2 bill installment(s) are overdue or unconfirmed.")).toContain("2");
    expect(arabicUI("2 bill installment(s) are overdue or unconfirmed.")).not.toContain("bill");
    expect(arabicUI("Warning: forecast cash shortage of 85.25 JOD. Consider rescheduling a flexible cost or verifying expected income.")).toContain("85.25");
  });
  it("all explicit tr UI strings have Arabic coverage",()=>{
    const covered=new Set(arabicDictionaryKeys);
    const missing:string[]=[];
    for(const path of components){
      const source=readFileSync(resolve(process.cwd(),"src",path),"utf8");
      for(const match of source.matchAll(/\btr\(("(?:(?:\\.)|[^"\\])*")\)/g)){
        const phrase=JSON.parse(match[1]!) as string;
        if(phrase==="V13" || phrase.startsWith("e.g. "))continue;
        if(!covered.has(phrase.replace(/\s+/g," ").trim()))missing.push(path+": "+phrase);
      }
    }
    expect(missing).toEqual([]);
  });
});
