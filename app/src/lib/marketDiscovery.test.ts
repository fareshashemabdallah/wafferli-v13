import {describe,expect,it,vi,afterEach} from "vitest";
import {JORDAN_MARKET_SOURCES,marketSearchLink,sourcesForMarket,safeMarketSearchTerm} from "./jordanMarketSources";
import {marketFeedAvailable,validateMarketFeed,searchConfiguredMarketFeed} from "./marketPriceFeed";
const today=new Date("2026-10-16T12:00:00.000Z");
const offer=(overrides:Record<string,unknown>={})=>({
 id:"retailer-123",title:"Baby shampoo 500ml",store:"Cozmo",
 priceJod:4.95,deliveryJod:null,
 url:"https://cozmo.jo/products/baby-shampoo",
 availability:"unknown",sourceCheckedAt:"2026-10-16T09:00:00.000Z",...overrides
});
afterEach(()=>vi.restoreAllMocks());
describe("trusted online retailer discovery",()=>{
 it("uses actual store domains for one public item search rather than making up offers",()=>{
  expect(JORDAN_MARKET_SOURCES).toHaveLength(4);
  expect(sourcesForMarket("everyday").map(x=>x.id)).toEqual(["cozmo","hypermax"]);
  expect(sourcesForMarket("electronics").map(x=>x.id)).toEqual(["hypermax","leaders","smartbuy"]);
  const u=marketSearchLink("baby shampoo 500ml",JORDAN_MARKET_SOURCES[0]!);
  expect(u).not.toBeNull();
  const url=new URL(u!);
  expect(url.hostname).toBe("www.google.com");
  expect(url.searchParams.get("q")).toBe("site:cozmo.jo baby shampoo 500ml");
 });
 it("rejects contact details and empty searches, without storing family queries",()=>{
  expect(safeMarketSearchTerm(" A shampoo  ")).toBe("A shampoo");
  expect(safeMarketSearchTerm("")).toBe("");
  expect(marketSearchLink("one")).not.toBeNull();
  expect(marketSearchLink("parent@example.com")).toBeNull();
  expect(marketSearchLink("https://example.com")).toBeNull();
  expect(marketSearchLink("0791234567")).toBeNull();
 });
});
describe("licensed in-app prices require a configured and current source",()=>{
 it("rejects invalid, old, future, misleading or off-domain offers",()=>{
  expect(validateMarketFeed({offers:[offer()]},today)).toHaveLength(1);
  expect(validateMarketFeed({offers:[offer({url:"https://cozmo.jo.evil.com/item"})]},today)).toEqual([]);
  expect(validateMarketFeed({offers:[offer({url:"javascript:alert(1)"})]},today)).toEqual([]);
  expect(validateMarketFeed({offers:[offer({priceJod:2.123})]},today)).toEqual([]);
  expect(validateMarketFeed({offers:[offer({sourceCheckedAt:"2026-09-01T09:00:00.000Z"})]},today)).toEqual([]);
  expect(validateMarketFeed({offers:[offer({sourceCheckedAt:"2026-10-19T09:00:00.000Z"})]},today)).toEqual([]);
  expect(validateMarketFeed({offers:[offer({availability:"out_of_stock"})]},today)).toEqual([]);
  expect(validateMarketFeed({offers:[offer(),offer()]},today)).toHaveLength(1);
  expect(validateMarketFeed({offers:[offer({deliveryJod:-1})]},today)).toEqual([]);
  expect(validateMarketFeed({offers:[offer({url:"https://leaders.jo/en/p/real",store:"Leaders"})]},today)).toHaveLength(1);
 });
 it("is transparent when no licensed source exists and does not fetch third parties",async()=>{
  const mock=vi.spyOn(globalThis,"fetch");
  expect(marketFeedAvailable(undefined)).toBe(false);
  expect(marketFeedAvailable("http://localhost/api")).toBe(false);
  expect(marketFeedAvailable("https://catalogue.example.com/prices")).toBe(true);
  const x=await searchConfiguredMarketFeed("shampoo",undefined);
  expect(x.status).toBe("not_configured");
  expect(x.offers).toEqual([]);
  expect(mock).not.toHaveBeenCalled();
 });
 it("passes only the public product name to a configured source and validates offers",async()=>{
  const mock=vi.spyOn(globalThis,"fetch").mockResolvedValue({
   ok:true,json:async()=>({offers:[offer(),offer({id:"stale",priceJod:99,url:"https://evil.example/p"})]})
  } as Response);
  const x=await searchConfiguredMarketFeed("baby shampoo","https://prices.example.com/retail-search");
  expect(x.status).toBe("ready");
  expect(x.offers.map(y=>y.id)).toEqual(["retailer-123"]);
  const [url,options]=mock.mock.calls[0]!;
  const target=new URL(url as string);
  expect(target.searchParams.get("q")).toBe("baby shampoo");
  expect(target.searchParams.get("market")).toBe("JO");
  expect(options).toMatchObject({credentials:"omit",cache:"no-store"});
 });
});
