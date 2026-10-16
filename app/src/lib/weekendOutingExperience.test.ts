import {beforeEach,afterEach,describe,expect,it,vi} from "vitest";
import {decideWeekendOuting,nextJordanWeekend} from "./weekendOutingDecision";
import {defaultFamilyPreferences} from "./familyPreferences";
import {sampleMoney,type MoneyState} from "./money";
import {normalizeWeekendPlaces,outingCity,weekendPlaceSearchUrl,findWeekendPlaces} from "./weekendPlaceSearch";
import {usableWeekendDraft} from "./weekendOutingHandoff";
const now=new Date(2026,9,16,12);
const prefs={...defaultFamilyPreferences,city:"Amman",outingLimit:50};
const money=():MoneyState=>({...sampleMoney(),demo:false,income:2000,
 savingsTargetAmount:200,
 categories:[
  {id:"rent",name:"Rent",type:"fixed",planned:330},
  {id:"groceries",name:"Groceries",type:"variable",planned:55},
  {id:"out",name:"Family outings",type:"variable",planned:100}
 ],
 expenses:[],cashOnHand:650,cashReserve:200,cashUpdatedAt:"2026-10-16",
 commitments:[{id:"bill",name:"School",frequency:"once",amount:330,dueDate:"2026-10-17",categoryId:"rent"}],
 incomeSources:[{id:"salary",name:"Salary",amount:2000,frequency:"monthly",nextDate:"2026-11-01",shared:true}]
});
describe("weekend assessment gives an answer without overpromising",()=>{
 it("knows the Friday/Saturday weekend in Jordan",()=>{
  expect(nextJordanWeekend(now)).toEqual({from:"2026-10-16",to:"2026-10-17"});
  expect(nextJordanWeekend(new Date(2026,9,18,12))).toEqual({from:"2026-10-23",to:"2026-10-24"});
  expect(nextJordanWeekend(new Date(2026,9,17,12))).toEqual({from:"2026-10-16",to:"2026-10-17"});
 });
 it("does not turn demo finances into an affordability promise",()=>{
  const result=decideWeekendOuting(sampleMoney(),prefs,now);
  expect(result.status).toBe("needs-details");
  expect(result.missing).toBe("real-budget");
  expect(result.suggestedJod).toBeNull();
  expect(result.explanationEn).toContain("sample");
 });
 it("asks for only one missing detail at a time",()=>{
  const base=money();
  expect(decideWeekendOuting({...base,cashOnHand:null},prefs,now).missing).toBe("cash");
  expect(decideWeekendOuting({...base,cashUpdatedAt:"2026-08-01"},prefs,now).missing).toBe("cash-date");
  expect(decideWeekendOuting({...base,commitments:[]},prefs,now).missing).toBe("bills");
  expect(decideWeekendOuting({...base,commitments:[],noBillsConfirmedMonth:"2026-10"},prefs,now).missing).toBeNull();
 });
 it("can suggest a limited investigation budget while showing its actual calculation",()=>{
  const base=money(),old=JSON.stringify(base);
  const r=decideWeekendOuting(base,prefs,now);
  expect(r.status).toBe("possible");
  expect(r.suggestedJod).toBe(35);
  expect(r.recordedMarginJod).toBe(65);
  expect(r.essentialBudgetJod).toBe(55);
  expect(r.monthlyRoomJod).toBe(100);
  expect(r.unpaidBillsJod).toBe(330);
  expect(r.emergencyReserveJod).toBe(200);
  expect(r.explanationEn).toContain("remaining non-bill planned costs 55.00");
  expect(r.nextEn).toContain("not confirmed money available to spend");
  expect(JSON.stringify(base)).toBe(old);
 });
 it("does not offer a paid outing when bills, monthly envelopes or reserves are pressured",()=>{
  const base=money();
  expect(decideWeekendOuting({...base,cashOnHand:400},prefs,now).status).toBe("review");
  expect(decideWeekendOuting({...base,
   categories:[...base.categories,{id:"new",name:"Major payment",type:"fixed",planned:1600}]
  },prefs,now).status).toBe("review");
  expect(decideWeekendOuting({...base,
   expenses:[{id:"out1",date:"2026-10-12",categoryId:"out",amount:100,shared:true}]
  },prefs,now).status).toBe("review");
  expect(decideWeekendOuting({...base,commitments:[{
   id:"late",name:"Overdue",frequency:"once",amount:10,dueDate:"2026-10-15"
  }]},prefs,now).status).toBe("review");
 });
 it("doesn't invent an emergency buffer when none was selected",()=>{
  const r=decideWeekendOuting({...money(),cashReserve:0},prefs,now);
  expect(r.explanationEn).toContain("No emergency cushion was set");
  expect(r.emergencyReserveJod).toBe(0);
  expect(r.status).toBe("review");
 });
});
describe("source-backed city-centre activity listings",()=>{
 beforeEach(()=>{vi.restoreAllMocks();localStorage.clear()});
 afterEach(()=>{vi.restoreAllMocks();localStorage.clear()});
 const mapped={elements:[
  {type:"node",id:10,lat:31.954,lon:35.91,tags:{name:"Family Park",leisure:"park"}},
  {type:"way",id:11,center:{lat:31.96,lon:35.915},tags:{name:"Children's Museum",tourism:"museum"}},
  {type:"node",id:12,lat:31.954,lon:35.91,tags:{name:"Unnamed business",amenity:"cafe"}},
  {type:"node",id:13,lat:31.954,lon:35.91,tags:{name:"Unknown"}}
 ]};
 it("returns only real named mapped locations with a traceable OSM URL, no fictitious prices",()=>{
  const records=normalizeWeekendPlaces(mapped);
  expect(records).toHaveLength(2);
  expect(records[0]).toMatchObject({name:"Family Park",category:"park",osmUrl:"https://www.openstreetmap.org/node/10"});
  expect(records[1]?.category).toBe("museum");
  expect(records.every(x=>!("priceJod" in x))).toBe(true);
  expect(outingCity("إربد")).toBe("irbid");
  expect(outingCity("Amman")).toBe("amman");
  expect(weekendPlaceSearchUrl(records[0]!,"amman")).toContain("Family%20Park");
 });
 it("runs only after explicit lookup, shares city-centre bounds only, then caches",async()=>{
  const fetcher=vi.spyOn(globalThis,"fetch").mockResolvedValue({
   ok:true,json:async()=>mapped
  } as Response);
  expect(fetcher).not.toHaveBeenCalled();
  const a=await findWeekendPlaces("amman");
  expect(a.places).toHaveLength(2);
  expect(fetcher).toHaveBeenCalledTimes(1);
  const [url,opts]=fetcher.mock.calls[0]!;
  expect(String(url)).toContain("overpass-api.de");
  expect(String(url)).toContain("out%3Ajson");
  expect(opts).toMatchObject({credentials:"omit",cache:"no-store"});
  const b=await findWeekendPlaces("amman");
  expect(b.places).toHaveLength(2);
  expect(fetcher).toHaveBeenCalledTimes(1);
 });
 it("shows no invented places on source failure",async()=>{
  vi.spyOn(globalThis,"fetch").mockResolvedValue({ok:false,status:429} as Response);
  await expect(findWeekendPlaces("irbid")).rejects.toThrow(/rate-limited/);
 });
});
describe("privacy-minimal outing handoff",()=>{
 it("never carries banking or child records and expires within a day",()=>{
  const x={budgetJod:40,city:"Amman",from:"2026-10-16",to:"2026-10-17",
   createdAt:"2026-10-16T12:00:00.000Z",cashBalance:650,childrenNames:["fake"]};
  const accepted=usableWeekendDraft(x,new Date("2026-10-16T13:00:00Z"));
  expect(accepted?.budgetJod).toBe(40);
  expect(accepted).not.toHaveProperty("cashBalance");
  expect(accepted).not.toHaveProperty("childrenNames");
  expect(usableWeekendDraft(x,new Date("2026-10-18T13:00:00Z"))).toBeNull();
  expect(usableWeekendDraft({...x,budgetJod:-5},new Date("2026-10-16T13:00:00Z"))).toBeNull();
 });
});
