import {Link} from "@tanstack/react-router";
import {useI18n} from "@/lib/i18n";

/** Navigation is progressive, but the original underlying shopping, wishlist,
 * comparison, basket and money records remain at their established keys. */
export function ShoppingJourneyStrip({current}:{current:"find"|"compare"|"record"}){
 const {lang}=useI18n(),ar=lang==="ar";
 const steps=[
  {id:"find",to:"/explore/market" as const,en:"1. Find",ar:"١. ابحث"},
  {id:"compare",to:"/explore/smartbuy" as const,en:"2. Compare & save",ar:"٢. قارن واحفظ"},
  {id:"record",to:"/explore/shopping" as const,en:"3. Basket & record",ar:"٣. السلّة والتسجيل"}
 ] as const;
 return <nav aria-label={ar?"رحلة الشراء":"Your purchase journey"}
  className="mb-4 rounded-2xl border border-[#D9E6D8] bg-[#F5FAF4] p-3">
  <p className="mb-2 text-xs font-semibold text-[#496A58]">
   {ar?"رحلة شراء واحدة: لا تُسجّل التكلفة كمصروف إلا بعد الدفع والتأكيد.":"One purchase journey. A price or wishlist is not spending until you confirm a paid purchase."}
  </p>
  <div className="grid grid-cols-3 gap-2">
   {steps.map(x=><Link key={x.id} to={x.to}
    aria-current={x.id===current?"step":undefined}
    className={"flex min-h-11 items-center justify-center rounded-xl px-2 text-center text-[11px] font-bold sm:text-sm "+
     (x.id===current?"bg-[#DCEFE1] text-[#215C42] ring-1 ring-[#B0D3BC]":"bg-white text-[#557265] hover:bg-[#EBF4EC]")}>
    {ar?x.ar:x.en}
   </Link>)}
  </div>
 </nav>;
}
