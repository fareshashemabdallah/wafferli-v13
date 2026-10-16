import {describe,expect,it} from "vitest";
import {buildTodaySignals} from "./todaySignals";
import type {AttentionItem} from "./familyAttention";
import type {DecisionStep} from "./familyDecisionBrief";
const makeAttention=(category:AttentionItem["category"],link:AttentionItem["link"],
 severity:AttentionItem["severity"],key:string=category):AttentionItem=>({
 key,category,severity,priority:category==="finance"?0:20,
 titleEn:key,titleAr:key,detailEn:"Explain a real next action",detailAr:"شرح",
 actionEn:"Review",actionAr:"راجع",link,canSnooze:severity!=="critical"
});
const decision=(id:string,link:DecisionStep["link"],urgency:DecisionStep["urgency"]="normal"):DecisionStep=>({
 id,titleEn:"Another suggestion",titleAr:"اقتراح",detailEn:"Explanation",detailAr:"شرح",
 link,urgency
});
describe("one family briefing",()=>{
 it("keeps critical cash risk ahead of other suggestions and never repeats the Money action",()=>{
  const a=[makeAttention("finance","/money","critical","cash"),
   makeAttention("occasion","/calendar","important","birthday")];
  const result=buildTodaySignals(a,[decision("cash-review","/money","important"),
   decision("gift","/occasions")]);
  expect(result[0]?.key).toBe("cash");
  expect(result.filter(x=>x.link==="/money")).toHaveLength(1);
  expect(result.length).toBe(3);
  expect(result[0]?.canSnooze).toBe(false);
 });
 it("respects an empty / opt-out advice stream and caps additional content",()=>{
  expect(buildTodaySignals([],[])).toEqual([]);
  const items=["/money","/calendar","/plans","/space","/occasions"] as const;
  expect(buildTodaySignals([],items.map((link,i)=>decision("i"+i,link)),4)).toHaveLength(4);
 });
 it("keeps original attention item references for snoozing, never changes source arrays",()=>{
  const a=[makeAttention("shopping","/explore/smartbuy","gentle","price")];
  const b=[decision("out","/explore/together")];
  const before=JSON.stringify([a,b]);
  const items=buildTodaySignals(a,b);
  expect(items[0]?.attention).toBe(a[0]);
  expect(JSON.stringify([a,b])).toBe(before);
  expect(items[0]?.urgency).toBe("normal");
 });
});
