/** Retailer search destinations checked against real Jordan storefront domains.
 * These are DISCOVERY LINKS, not inventory APIs. No prices are fetched here.
 * Never include household, financial, child or location details in search terms.
 */
export type JordanMarketSource={
 id:"cozmo"|"hypermax"|"leaders"|"smartbuy";
 en:string;ar:string;home:string;domain:string;focus:"everyday"|"electronics"|"both"
};
export const JORDAN_MARKET_SOURCES:readonly JordanMarketSource[]=[
 {id:"cozmo",en:"Cozmo",ar:"كوزمو",home:"https://cozmo.jo/",domain:"cozmo.jo",focus:"everyday"},
 {id:"hypermax",en:"HyperMax",ar:"هايبرماكس",home:"https://www.hypermax.com.jo/mafjor/en",domain:"hypermax.com.jo",focus:"both"},
 {id:"leaders",en:"Leaders Center",ar:"ليدرز سنتر",home:"https://leaders.jo/en/",domain:"leaders.jo",focus:"electronics"},
 {id:"smartbuy",en:"SmartBuy Jordan",ar:"سمارت باي",home:"https://smartbuy-me.com/",domain:"smartbuy-me.com",focus:"electronics"}
] as const;
export type MarketIntent="all"|"everyday"|"electronics";
export function safeMarketSearchTerm(value:string):string{
 const clean=value.replace(/[\r\n\t]/g," ").replace(/\s+/g," ").trim().slice(0,90);
 if(clean.length<2||clean.length>90)return "";
 // No freeform prompts with personal information should be sent to retailers.
 if(/(?:@|https?:\/\/|\b\+?\d{7,}\b)/iu.test(clean))return "";
 return clean;
}
export function marketSearchLink(query:string,source?:JordanMarketSource):string|null{
 const term=safeMarketSearchTerm(query);
 if(!term)return null;
 const params=new URLSearchParams();
 params.set("q",(source?"site:"+source.domain+" ":"")+term+(source?"":" Jordan JOD price"));
 return "https://www.google.com/search?"+params.toString();
}
export function sourcesForMarket(intent:MarketIntent):readonly JordanMarketSource[]{
 return intent==="all"?JORDAN_MARKET_SOURCES:
 JORDAN_MARKET_SOURCES.filter(item=>item.focus==="both"||item.focus===intent);
}
