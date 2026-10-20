import {createFileRoute,Link} from "@tanstack/react-router";
import {useState,type FormEvent} from "react";
import {ArrowUpRight,Search,ShoppingBasket,ShieldCheck} from "lucide-react";
import {AppShell} from "@/components/AppShell";
import {ShoppingJourneyStrip} from "@/components/ShoppingJourneyStrip";
import {useI18n} from "@/lib/i18n";
import {marketSearchLink,safeMarketSearchTerm,sourcesForMarket,
 type MarketIntent} from "@/lib/jordanMarketSources";
import {marketFeedAvailable,searchConfiguredMarketFeed,
 type MarketPriceSearchResult} from "@/lib/marketPriceFeed";

export const Route=createFileRoute("/explore/market")({
 head:()=>({meta:[
  {title:"Find real store prices — Dabberna"},
  {name:"description",content:"Find Jordanian sellers and check current product listings. Only show in-app offer prices when a licensed live feed is connected."}
 ]}),
 component:MarketDiscovery
});

const feedUrl=import.meta.env["VITE_MARKET_PRICE_FEED_URL"] as string|undefined;
export function MarketDiscovery(){
 const {lang}=useI18n(),ar=lang==="ar";
 const [draft,setDraft]=useState("");
 const [searched,setSearched]=useState("");
 const [kind,setKind]=useState<MarketIntent>("all");
 const [error,setError]=useState("");
 const [loading,setLoading]=useState(false);
 const [feed,setFeed]=useState<MarketPriceSearchResult|null>(null);
 const sources=sourcesForMarket(kind);
 const submit=async(e:FormEvent)=>{
  e.preventDefault();
  const q=safeMarketSearchTerm(draft);
  if(!q){setError(ar?"اكتب اسم المنتج فقط، بلا أسماء أشخاص أو معلومات خاصة.":"Enter a product name only, without names, phone numbers or private details.");return;}
  setError("");setSearched(q);setFeed(null);
  if(!marketFeedAvailable(feedUrl))return;
  setLoading(true);
  const result=await searchConfiguredMarketFeed(q,feedUrl);
  setFeed(result);setLoading(false);
 };
 const searchAll=marketSearchLink(searched);
 const offers=feed?.offers??[];
 return <AppShell title={ar?"وين بلاقي المنتج وبأي سعر؟":"Where can I buy it, and for how much?"}>
  <ShoppingJourneyStrip current="find"/>
  <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">{ar?
   "لازم دبّرنا يساعدك توصل لعروض حقيقية من المتاجر. ابحث عن منتج واحد، وافتح أسعار المتاجر الأردنية من مصدرها. المقارنة المباشرة داخل التطبيق تحتاج ربطاً بمصدر أسعار موثوق.":
   "Start with real online seller listings, not blank price-entry forms. Search one product, open Jordanian retailer results at their sources, and check current prices. In-app price comparison needs an authorized product feed."}</p>
  <form onSubmit={submit} className="mt-5 rounded-2xl border border-[#D2E2D1] bg-[#EFF6ED] p-4 sm:p-5">
   <label className="block text-base font-semibold" htmlFor="market-product-name">
    {ar?"شو المنتج اللي بدك تشتريه؟":"What would you like to buy?"}
   </label>
   <p className="mt-1 text-xs text-muted-foreground">{ar?
    "اكتب اسم المنتج والماركة والحجم أو الموديل، من دون بيانات عائلية أو شخصية.":
    "Use the product, brand, size or model—never private family details."}</p>
   <div className="mt-3 flex flex-col gap-2 sm:flex-row">
    <input id="market-product-name" maxLength={90} required autoComplete="off" value={draft}
     onChange={e=>setDraft(e.target.value)}
     placeholder={ar?"مثلاً: شامبو أطفال ٥٠٠ مل":"e.g. baby shampoo 500ml"}
     className="min-h-12 min-w-0 flex-1 rounded-xl border border-[#CEDCCB] bg-white px-4 text-sm"/>
    <button type="submit" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-brand px-5 text-sm font-semibold text-white">
     <Search className="size-4"/>{ar?"ابحث عن الأسعار":"Find seller prices"}
    </button>
   </div>
   <div role="group" aria-label={ar?"نوع المنتج":"Product type"} className="mt-3 flex flex-wrap gap-2">
    {([
      {id:"all",en:"All products",ar:"كل المنتجات"},
      {id:"everyday",en:"Household & baby",ar:"البيت والأطفال"},
      {id:"electronics",en:"Electronics & appliances",ar:"الإلكترونيات والأجهزة"}
    ] as const).map(x=><button key={x.id} type="button" aria-pressed={kind===x.id}
      onClick={()=>setKind(x.id)} className={"min-h-10 rounded-full border px-3 text-xs font-semibold "+
       (kind===x.id?"border-brand bg-white text-brand":"border-[#CFDDCD] bg-transparent text-muted-foreground")}>
      {ar?x.ar:x.en}
     </button>)}
   </div>
   {error&&<p role="alert" className="mt-2 text-xs font-semibold text-destructive">{error}</p>}
  </form>
  {searched&&<section aria-label={ar?"مصادر أسعار أردنية":"Jordan retailer sources"} className="mt-5">
   <p className="text-xs font-semibold text-brand">{ar?"نتائج البحث عن":"SOURCE SEARCH FOR"}: {searched}</p>
   <h2 className="mt-2 text-xl font-semibold">{ar?"افتح عروض المتاجر الحالية":"See current store listings"}</h2>
   <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{ar?
    "هذه روابط بحث إلى مواقع البائعين عبر Google، وليست أسعاراً جلبها دبّرنا. تأكد من مطابقة الحجم/الموديل والسعر والتوصيل مباشرة عند المتجر.":
    "These are search links to actual retailer pages via Google—not prices retrieved by Dabberna. Check the exact model or pack size, current price, delivery and stock with the store."}</p>
   {searchAll&&<a href={searchAll} target="_blank" rel="noopener noreferrer"
    className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-full bg-[#E5EFE4] px-4 text-sm font-semibold text-brand">
    {ar?"ابحث بكل المتاجر الأردنية":"Search Jordan-wide listings"} <ArrowUpRight className="size-4"/>
   </a>}
   <div className="mt-4 grid gap-3 sm:grid-cols-2">
    {sources.map(source=>{
     const url=marketSearchLink(searched,source);
     return <div key={source.id} className="rounded-2xl border border-border bg-white p-4">
      <h3 className="text-base font-semibold">{ar?source.ar:source.en}</h3>
      <p className="mt-1 text-xs text-muted-foreground">{ar?"صفحات منتجات متوفرة للبحث، من دون ضمان السعر أو توفر المخزون.":
       "Find public listings. Prices and stock are not confirmed in Dabberna."}</p>
      {url&&<a href={url} target="_blank" rel="noopener noreferrer"
       className="mt-3 inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-brand underline">
       {ar?"ابحث عند هذا المتجر":"Find matching items"} <ArrowUpRight className="size-4"/>
      </a>}
      <a href={source.home} target="_blank" rel="noopener noreferrer"
       className="ms-3 inline-flex min-h-11 items-center text-xs text-muted-foreground underline">
       {ar?"موقع المتجر":"Store website"}
      </a>
     </div>;
    })}
   </div>
  </section>}
  {loading&&<p role="status" className="mt-4 text-sm">{ar?"عم نتحقق من مصدر الأسعار…":"Checking the connected price feed…"}</p>}
  {feed&&<section aria-label={ar?"أسعار المنتجات من المصدر":"Seller-linked product prices"} className="mt-5">
   <h2 className="text-xl font-semibold">{ar?"الأسعار التي وجدناها":"Seller-linked prices"}</h2>
   {offers.length===0?<p role="status" className="mt-2 text-sm text-muted-foreground">
    {ar?"لا توجد نتائج صالحة وحديثة بمصدر الأسعار المتصل. راجع روابط المتاجر بالأعلى.":
     "No recent valid matches were returned by the connected feed. Use the retailer searches above instead."}
   </p>:<div className="mt-3 space-y-3">
    {offers.map(item=><article key={item.id} className="rounded-2xl border border-[#DAE6D7] bg-white p-4">
     <h3 className="font-semibold">{item.title}</h3>
     <p className="mt-1 text-sm text-muted-foreground">{item.store}</p>
     <p className="mt-2 text-xl font-semibold">{item.priceJod.toFixed(2)} JOD</p>
     <p className="mt-1 text-xs text-muted-foreground">{ar?"التوصيل":"Delivery"}: {item.deliveryJod===null?(ar?"غير معروف":"Unknown"):item.deliveryJod.toFixed(2)+" JOD"}</p>
     <p className="mt-1 text-xs text-muted-foreground">{ar?"تاريخ التحقق من المصدر":"Feed source checked"}: {item.sourceCheckedAt.slice(0,10)}</p>
     <a href={item.url} rel="noopener noreferrer" target="_blank"
      className="mt-3 inline-flex min-h-11 items-center gap-2 font-semibold text-brand underline">
      {ar?"شوف السعر عند البائع":"Check price with seller"} <ArrowUpRight className="size-4"/>
     </a>
    </article>)}
   </div>}
   <p className="mt-2 text-xs text-muted-foreground">{ar?
    "معلومات البائع قد تتغير، ولا تعني ضمان التوفر أو أن كل المتاجر بالسوق شملها البحث.":
    "Seller offers can change and are not a verified full-market price range. Check pack/model match, delivery, availability and purchase terms."}</p>
  </section>}
  {!marketFeedAvailable(feedUrl)&&<section className="mt-4 rounded-xl border border-[#E6DCCA] bg-[#FFF9F0] p-4 text-xs leading-relaxed">
   <div className="flex items-center gap-2 font-semibold"><ShieldCheck className="size-4"/>{ar?"شفافية الأسعار":"Price transparency"}</div>
   <p className="mt-1 text-muted-foreground">{ar?
    "البحث عن البائعين يعمل الآن؛ عرض الأسعار داخل دبّرنا غير مفعّل لأنه يحتاج مصدر بيانات مرخّص ومربوط بالخادم. لن نختلق أسعاراً أو ندّعي أننا فحصناها.":
    "Retailer discovery works now. In-app market prices are not active until an authorized, reliable feed is connected. We won't invent a market price or imply that we checked offers we did not retrieve."}</p>
  </section>}
  <div className="mt-5 flex flex-wrap items-center gap-3">
   <Link to="/explore/smartbuy" className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#EAF1E8] px-4 text-xs font-semibold text-brand">
    <ShoppingBasket className="size-4"/>{ar?"قارن سعرين تأكدت منهم":"Compare two prices you checked"}
   </Link>
   <Link to="/advisor" className="inline-flex min-h-11 items-center text-xs font-semibold text-brand underline">
    {ar?"اسأل دبّرنا عن قرار شراء":"Ask Dabberna about buying"} →
   </Link>
  </div>
 </AppShell>;
}
