import {useEffect,useState,type FormEvent} from "react";
import {Link} from "@tanstack/react-router";
import {ShoppingBag,Plus,Search,ReceiptText,Heart,CheckCircle2} from "lucide-react";
import {AppShell} from "@/components/AppShell";
import {useI18n} from "@/lib/i18n";
import {WishlistDecisionPanel} from "./WishlistDecisionPanel";
import {uid,useLocalState,fmtJOD} from "@/lib/storage";
import {FAMILY_WISHLIST_KEY,makeWishlistItem,type WishlistItem,type WishlistKind} from "@/lib/familyWishlist";
import {isSampleBasketEntry,basketExpenseId,recordBasketExpense,type BasketEntry} from "@/lib/basketRecording";
import {sampleMoney,type MoneyState} from "@/lib/money";
import {marketSearchLink} from "@/lib/jordanMarketSources";
import {localToday} from "@/lib/cashflow";
import {FAMILY_PLANS_KEY,ACTIVE_PLAN_KEY,type FamilyPlan} from "@/lib/familyPlans";

const primary="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#2F6F67] px-4 text-sm font-bold text-white disabled:opacity-40";
const secondary="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#D9E4E5] bg-white px-3 text-sm font-semibold text-[#315B62]";
const field="min-h-11 w-full rounded-xl border border-[#D9E4E5] bg-white px-3 text-sm";

export function CleanShoppingHome(){
 const {lang}=useI18n(),ar=lang==="ar";
 const t=(en:string,arabic:string)=>ar?arabic:en;
 const [basket,setBasket,basketReady]=useLocalState<BasketEntry[]>("shopping",[]);
 const [wishlist,setWishlist,wishesReady]=useLocalState<WishlistItem[]>(FAMILY_WISHLIST_KEY,[]);
 const [money,setMoney,moneyReady]=useLocalState<MoneyState>("money",sampleMoney());
 const [cycle,setCycle,cycleReady]=useLocalState<string>("shoppingTripId","");
 const [plans]=useLocalState<FamilyPlan[]>(FAMILY_PLANS_KEY,[]);
 const [activePlanId]=useLocalState<string|null>(ACTIVE_PLAN_KEY,null);
 const [name,setName]=useState(""),[destination,setDestination]=useState<"basket"|"wish">("basket");
 const [kind,setKind]=useState<WishlistKind>("household"),[message,setMessage]=useState("");
 const [selected,setSelected]=useState("");
 const [selectedWishId,setSelectedWishId]=useState("");
 const gift=plans.find(p=>p.id===activePlanId&&p.kind==="occasion"&&!!p.occasionPreparation&&p.status!=="completed");
 const ready=basketReady&&wishesReady&&moneyReady&&cycleReady;
 useEffect(()=>{if(cycleReady&&!cycle)setCycle(uid());},[cycleReady,cycle,setCycle]);
 const real=basket.filter(x=>!isSampleBasketEntry(x)&&!!x.name.trim());
 const samples=basket.filter(isSampleBasketEntry);
 const activeWish=wishlist.filter(x=>x.status==="considering");
 const total=Math.round(real.reduce((sum,item)=>sum+item.price*item.qty,0)*100)/100;
 const recorded=!!cycle&&money.expenses.some(e=>e.id===basketExpenseId(cycle));
 const groceryCategory=money.categories.find(c=>/grocer|food|supermarket|بقالة|سوبر|مواد غذائية/i.test(c.name))?.id??"uncategorized";
 const add=(e:FormEvent)=>{
  e.preventDefault();setMessage("");
  if(!ready)return;
  const clean=name.replace(/[\u0000-\u001f\u007f]/g," ").replace(/\s+/g," ").trim().slice(0,80);
  if(clean.length<2){setMessage(t("Enter at least two characters.","أدخل اسم حاجة من حرفين على الأقل."));return;}
  if(destination==="basket"){
   if(real.some(item=>!item.done&&item.name.toLocaleLowerCase()===clean.toLocaleLowerCase())){
    setMessage(t("Already in the open basket; no duplicate added.","هذه الحاجة موجودة بالفعل؛ لم نضف نسخة ثانية."));return;
   }
   if(recorded){setMessage(t("Start a new shopping trip before adding items.","ابدأ رحلة تسوّق جديدة قبل الإضافة."));return;}
   setBasket(old=>[...old,{id:uid(),name:clean,qty:1,price:0,done:false}]);
  }else{
   if(activeWish.some(item=>item.name.toLocaleLowerCase()===clean.toLocaleLowerCase())){
    setMessage(t("Already saved in your wishlist.","هذه الحاجة محفوظة من قبل."));return;
   }
   const item=makeWishlistItem({id:uid(),name:clean,kind});
   if(!item){setMessage(t("Please check the item name.","راجع اسم الحاجة."));return;}
   setWishlist(old=>[item,...old]);
  }
  setName("");setMessage(t("Saved in your existing family shopping records.","تم الحفظ في سجل التسوق الحالي للعيلة."));
 };
 const record=()=>{
  if(!ready||recorded||money.demo||samples.length||total<=0)return;
  if(!window.confirm(t("Have you actually paid this total? Record this shopping trip once in Money?","هل دفعت هذا المبلغ فعلاً؟ سجّل التسوّق مرة واحدة في المالية؟")))return;
  setMoney(old=>recordBasketExpense(old,real,cycle,groceryCategory,localToday()));
 };
 const newTrip=()=>{
  if(!recorded)return;
  setCycle(uid());setBasket(old=>old.map(i=>({...i,done:false})));setMessage("");
 };
 const searchLink=selected?marketSearchLink(selected):null;
 return <AppShell title={t("Shopping","التسوّق")}>
  <div className="mx-auto max-w-3xl space-y-4">
   <section className="rounded-[1.5rem] bg-[#EEF4FA] p-4 sm:p-5">
    <h2 className="flex items-center gap-2 text-lg font-bold"><ShoppingBag className="size-5 text-[#406A94]"/>{t("What does your family need?","شو ناقص العيلة؟")}</h2>
    <p className="mt-1 text-sm text-[#66778B]">{t("One place for shopping needs, saved wishes and real spending. Prices are not automatically verified.","مكان واحد للحاجات والرغبات والمصاريف الفعلية، والأسعار غير مؤكدة تلقائياً.")}</p>
    {gift&&<p className="mt-3 rounded-lg bg-white p-3 text-sm">
     {t("Gift linked to your existing family plan: ","هدية مرتبطة بخطة العيلة: ")}<b>{gift.title}</b>
     <a href="#/explore/smartbuy?mode=legacy" className="ms-2 font-semibold underline">{t("Continue gift comparison","كمّل مقارنة الهدية")}</a>
    </p>}
    <form onSubmit={add} className="mt-4 space-y-3">
     <label className="block text-xs font-semibold">{t("One thing you need","حاجة واحدة")}
      <input className={field+" mt-1"} value={name} onChange={e=>setName(e.target.value)} placeholder={t("Milk, children's shoes, birthday gift…","حليب، حذاء أطفال، هدية عيد ميلاد…")}/></label>
     <div className="flex flex-wrap items-center gap-3">
      <label className="text-xs font-semibold">{t("Save to","احفظ في")}
       <select className={field+" mt-1"} value={destination} onChange={e=>setDestination(e.target.value as "basket"|"wish")}>
        <option value="basket">{t("Shopping basket","سلة التسوق")}</option>
        <option value="wish">{t("Wishlist / future need","قائمة الرغبات")}</option>
       </select></label>
      {destination==="wish"&&<label className="text-xs font-semibold">{t("Type","النوع")}
       <select className={field+" mt-1"} value={kind} onChange={e=>setKind(e.target.value as WishlistKind)}>
        <option value="household">{t("Household","المنزل")}</option><option value="children">{t("Children","الأطفال")}</option>
        <option value="gift">{t("Gift","هدية")}</option><option value="other">{t("Other","أخرى")}</option>
       </select></label>}
     </div>
     <button type="submit" disabled={!ready} className={primary}><Plus className="size-4"/>{t("Save this need","احفظ الحاجة")}</button>
    </form>
   </section>
   {message&&<p role="status" className="rounded-lg border border-[#D6E5DD] bg-white p-3 text-sm">{message}</p>}
   <section className="rounded-[1.5rem] border border-[#E0E9E7] bg-white p-4 sm:p-5">
    <h2 className="text-base font-bold">{t("Our current shopping","تسوّقنا الحالي")}</h2>
    <p className="mt-1 text-xs text-[#687984]">{t("Tap a saved item to find seller sources; prices remain unverified until you check them.","اختَر حاجة للبحث عن متجر؛ الأسعار تبقى غير مؤكدة حتى تتحقق منها.")}</p>
    {real.length===0&&activeWish.length===0&&<p className="mt-3 text-sm text-[#71818C]">{t("Nothing saved yet. Add one need above.","ما في حاجات محفوظة بعد. أضف حاجة فوق.")}</p>}
    {real.length>0&&<div className="mt-3 space-y-2">
     <p className="text-xs font-semibold">{t("Basket","السلة")} · {real.length}</p>
     {real.slice(0,20).map(item=><div key={item.id} className="flex flex-wrap items-center gap-2 rounded-lg bg-[#F7FAF9] p-2">
      <button type="button" className="min-w-0 flex-1 text-start text-sm font-semibold underline-offset-2 hover:underline" onClick={()=>{setSelected(item.name);setSelectedWishId("");}}>{item.name}</button>
      {!recorded&&<input className="h-10 w-20 rounded-md border bg-white px-2 text-sm" aria-label={t("Price for ","سعر ")+item.name} inputMode="decimal" value={item.price||""}
       onChange={e=>{const n=Number(e.target.value);if(e.target.value===""||Number.isFinite(n)&&n>=0&&n<=5000)setBasket(old=>old.map(v=>v.id===item.id?{...v,price:e.target.value===""?0:Math.round(n*100)/100}:v));}}/>}
      {recorded&&<span className="text-xs">{fmtJOD(item.price)}</span>}
      {!recorded&&<button type="button" className="text-xs font-semibold text-[#A2505B]" onClick={()=>setBasket(old=>old.filter(v=>v.id!==item.id))}>{t("Remove","احذف")}</button>}
     </div>)}
    </div>}
    {activeWish.length>0&&<div className="mt-3 space-y-2">
     <p className="text-xs font-semibold">{t("Wishlist","الرغبات")} · {activeWish.length}</p>
     {activeWish.slice(0,12).map(item=><button key={item.id} type="button" onClick={()=>{setSelected(item.name);setSelectedWishId(item.id);}}
      className="flex min-h-10 w-full items-center gap-2 rounded-lg bg-[#F7FAF9] px-3 text-start text-sm"><Heart className="size-4 text-[#BB7C9B]"/>{item.name}</button>)}
    </div>}
    {selected&&<div className="mt-3 rounded-xl border border-[#D9E5E6] bg-[#F7FAFC] p-3">
     <p className="text-sm font-semibold">{selected}</p>
     <p className="mt-1 text-xs text-[#687984]">{t("External seller search; this is not a live price quote or an endorsed product.","بحث خارجي عن البائع، وليس عرض سعر مباشر أو توصية مؤكدة.")}</p>
     <div className="mt-2 flex flex-wrap gap-2">
      {searchLink&&<a href={searchLink} target="_blank" rel="noopener noreferrer" className={secondary}><Search className="size-4"/>{t("Check seller listings","تحقق من عروض المتاجر")}</a>}
      <button type="button" className={secondary} onClick={()=>{setSelected("");setSelectedWishId("");}}>{t("Close","أغلق")}</button>
     </div>
     {selectedWishId&&<WishlistDecisionPanel itemId={selectedWishId}/>}
    </div>}
   </section>
   <section className="rounded-[1.5rem] border border-[#E0E9E7] bg-white p-4 sm:p-5">
    <h2 className="flex items-center gap-2 font-bold"><ReceiptText className="size-5"/>{t("After shopping","بعد التسوق")}</h2>
    <p className="mt-1 text-sm">{t("Entered basket total: ","إجمالي السلة المُدخل: ")}<strong>{fmtJOD(total)}</strong></p>
    {recorded?<div className="mt-3 flex flex-wrap items-center gap-3">
     <p className="flex items-center gap-2 text-sm font-semibold text-[#337E5E]"><CheckCircle2 className="size-4"/>{t("Recorded once in Money","تم تسجيله مرة واحدة في المالية")}</p>
     <button className={secondary} type="button" onClick={newTrip}>{t("Start next shopping trip","ابدأ رحلة تسوق جديدة")}</button>
    </div>:<div className="mt-3 space-y-2">
     {money.demo&&<p className="text-xs text-[#8B5F52]">{t("Sample finances: enter your real money details before recording an expense.","بيانات مالية تجريبية؛ أدخل بياناتك الحقيقية قبل تسجيل المصروف.")} <Link to="/money" className="underline">{t("Money","المالية")}</Link></p>}
     {samples.length>0&&<p className="text-xs text-[#8B5F52]">{t("Sample basket items must be removed before recording.","لا يمكن تسجيل عناصر السلة التجريبية.")} <button type="button" className="ms-2 underline" onClick={()=>setBasket(old=>old.filter(i=>!isSampleBasketEntry(i)))}>{t("Remove samples","احذف التجريبي")}</button></p>}
     <button type="button" className={primary} disabled={!ready||money.demo||samples.length>0||total<=0} onClick={record}>
      {t("I paid — record actual expense","دفعت المبلغ — سجّل المصروف")}</button>
    </div>}
    <details className="mt-4 border-t pt-3">
     <summary className="cursor-pointer text-xs font-semibold text-[#587184]">{t("Previous advanced comparisons (optional)","المقارنات السابقة والمتقدمة (اختياري)")}</summary>
     <p className="mt-2 text-xs text-[#677889]">{t("Your previous price comparisons, saved gift choices and manual seller notes remain available.","مقارنات الأسعار القديمة واختيارات الهدايا وملاحظات المتاجر محفوظة.")}</p>
     <a href="#/explore/smartbuy?mode=legacy" className="mt-2 inline-flex text-xs font-bold underline">{t("Open previous comparisons","افتح المقارنات السابقة")}</a>
    </details>
   </section>
  </div>
 </AppShell>;
}
