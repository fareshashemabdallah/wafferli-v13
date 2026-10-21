import {useState,type FormEvent} from "react";
import {CheckCircle2,ShoppingBag,ShieldCheck} from "lucide-react";
import {useI18n} from "@/lib/i18n";
import {uid,useLocalState,readLocal,writeLocal,fmtJOD} from "@/lib/storage";
import {FAMILY_WISHLIST_KEY,recordWishlistPrice,summarizeWishlistPrice,updateWishlistStatus,type WishlistItem} from "@/lib/familyWishlist";
import {wishlistExpenseId,recordWishlistPurchase} from "@/lib/wishlistPurchase";
import {sampleMoney,type MoneyState} from "@/lib/money";
import {localToday} from "@/lib/cashflow";

/** Inline purchase decision on Shopping, not a second page. All prices are
 * parent-entered and the paid Money expense is idempotent by wishlist ID. */
export function WishlistDecisionPanel({itemId}:{itemId:string}){
 const {lang}=useI18n(),ar=lang==="ar";
 const t=(en:string,arabic:string)=>ar?arabic:en;
 const [wishlist,setWishlist,ready]=useLocalState<WishlistItem[]>(FAMILY_WISHLIST_KEY,[]);
 const [money]=useLocalState<MoneyState>("money",sampleMoney());
 const [store,setStore]=useState(""),[price,setPrice]=useState("");
 const [actual,setActual]=useState(""),[notice,setNotice]=useState("");
 const item=wishlist.find(w=>w.id===itemId);
 if(!item)return null;
 const summary=summarizeWishlistPrice(item);
 const paid=money.expenses.some(e=>e.id===wishlistExpenseId(item.id));
 const field="mt-1 min-h-11 w-full rounded-xl border border-[#D6E2E3] bg-white px-3 text-sm";
 const checked=(e:FormEvent)=>{
  e.preventDefault();if(!ready||item.status!=="considering")return;
  try{
   const changed=recordWishlistPrice(item,{id:uid(),store,amountJod:Number(price),checkedAt:localToday()});
   setWishlist(old=>old.map(x=>x.id===item.id?changed:x));
   setStore("");setPrice("");
   setNotice(t("Your own price check was saved, not externally verified.","انحفظ السعر اللي راجعته إنت، مش سعر مؤكّد من دبّرنا."));
  }catch(error){setNotice(error instanceof Error?error.message:t("Check the store and price.","راجع المتجر والسعر."));}
 };
 const purchase=()=>{
  if(paid||money.demo||item.status!=="considering")return;
  const amount=Number(actual);
  if(!Number.isFinite(amount)||amount<=0){setNotice(t("Enter the actual amount paid.","أدخل المبلغ المدفوع فعلياً."));return;}
  if(!window.confirm(t("Have you actually paid? This records one expense without deducting your bank balance.","هل دفعت فعلاً؟ رح نسجل مصروف واحد دون خصم تلقائي من الرصيد.")))return;
  const latest=readLocal<MoneyState>("money",money);
  const next=recordWishlistPurchase(latest,item,amount,localToday());
  if(next===latest){setNotice(t("Already recorded or invalid payment amount.","المصروف مسجل من قبل أو المبلغ غير صالح."));return;}
  if(!writeLocal("money",next)){setNotice(t("Could not save the payment. Nothing was marked purchased.","ما قدرنا نحفظ المصروف. ما تم تأكيد الشراء."));return;}
  setWishlist(old=>old.map(x=>x.id===item.id?updateWishlistStatus(x,"purchased"):x));
  setNotice(t("Purchase recorded once in Money, without silently deducting cash.","انحفظ المصروف مرة واحدة في المالية، بلا خصم نقدي تلقائي."));
 };
 return <div className="mt-3 space-y-3 border-t border-[#D6E2E3] pt-4" aria-label={t("Compare and decide","قارن وقرّر")}>
  <div className="flex items-center gap-2"><ShoppingBag className="size-4 text-[#3C786F]"/><h3 className="text-sm font-extrabold">{t("Compare your real options","قارن الخيارات اللي لقيتها")}</h3></div>
  <p className="text-xs text-[#74818A]">{t("Prices below are entered by you. Compare the same product and total delivery cost; no live-price claim.","الأسعار اللي تحت من إدخالك. قارن نفس المنتج والتوصيل؛ مش أسعار مباشرة.")}</p>
  {!!item.prices.length&&<div className="rounded-xl bg-white p-3">
   {item.prices.slice(-4).map(row=><p key={row.id} className="flex justify-between gap-2 border-b border-[#EEF1F1] py-1.5 text-xs"><span>{row.store} · {row.checkedAt}</span><strong>{fmtJOD(row.amountJod)}</strong></p>)}
   {summary.lowestRecordedJod!==null&&<p className="mt-2 text-xs font-semibold text-[#2E7569]">{t("Lowest price you entered: ","أقل سعر أدخلته: ")}{fmtJOD(summary.lowestRecordedJod)} · {t("not guaranteed savings","ليس توفيراً مضموناً")}</p>}
  </div>}
  {!paid&&item.status==="considering"&&<form onSubmit={checked} className="grid grid-cols-[minmax(0,1fr)_100px] gap-2">
   <label className="text-xs font-semibold">{t("Store or source","المتجر أو المصدر")}<input className={field} value={store} onChange={e=>setStore(e.target.value.slice(0,90))} placeholder={t("Store name","اسم المتجر")} required/></label>
   <label className="text-xs font-semibold">{t("JOD","دينار")}<input className={field} inputMode="decimal" value={price} onChange={e=>setPrice(e.target.value)} placeholder="0.00" required/></label>
   <button className="col-span-2 min-h-11 rounded-xl border border-[#9EC9C2] bg-white px-3 text-xs font-bold text-[#2D6C60]" type="submit">{t("Save my checked price","احفظ السعر اللي تأكدت منه")}</button>
  </form>}
  {paid||item.status==="purchased"?<p className="flex items-center gap-2 text-xs font-bold text-[#2D765D]"><CheckCircle2 className="size-4"/>{t("This purchase was already recorded in Money.","هذا الشراء مسجّل بالفعل في المالية.")}</p>:<details className="rounded-xl border border-[#D6E2E3] bg-white p-3">
   <summary className="min-h-10 cursor-pointer text-xs font-bold">{t("I purchased this — record actual expense","اشتريته — سجّل المصروف الفعلي")}</summary>
   <p className="mt-2 flex gap-2 text-xs text-[#718080]"><ShieldCheck className="size-4 shrink-0"/>{t("Only after payment. Your entered cash balance is not automatically debited.","فقط بعد الدفع. رصيدك النقدي لا يُخصم تلقائياً.")}</p>
   <label className="mt-3 block text-xs font-bold">{t("Actual total paid (JOD)","المبلغ المدفوع فعلياً بالدينار")}<input className={field} inputMode="decimal" value={actual} onChange={e=>setActual(e.target.value)}/></label>
   {money.demo?<p className="mt-2 text-xs text-[#9A6655]">{t("Activate real Money records before recording spending.","ابدأ بالبيانات المالية الحقيقية قبل تسجيل المصروف.")}</p>:
    <button type="button" onClick={purchase} className="mt-2 min-h-11 rounded-xl bg-[#2E7569] px-4 text-xs font-bold text-white">{t("Confirm paid once","أكد الدفع مرة واحدة")}</button>}
  </details>}
  {notice&&<p role="status" className="rounded-xl bg-[#F1F6F5] p-3 text-xs text-[#38695E]">{notice}</p>}
 </div>;
}
