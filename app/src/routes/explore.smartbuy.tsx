import { useI18n } from "@/lib/i18n";
import { createFileRoute,Link } from "@tanstack/react-router";
import { CheckCircle2, Plus, RotateCcw, Trash2 } from "lucide-react";
import {useEffect,useState} from "react";
import { Notice } from "@/components/AppShell";
import { ShoppingExperienceShell } from "@/components/ShoppingExperienceShell";
import { PlanContextBanner } from "@/components/PlanContextBanner";
import {FamilyWishlistPanel} from "@/components/FamilyWishlistPanel";
import {ShoppingReferenceDashboard} from "@/components/ShoppingReferenceDashboard";
import {ShoppingJourneyStrip} from "@/components/ShoppingJourneyStrip";
import {evaluatePriceEvidence} from "@/lib/merchantQuoteDraft";
import {compareManuallyEnteredPrices} from "@/lib/clearShoppingResult";
import {dateKey} from "@/lib/familyCalendar";
import {familyFinancialCommitments,recordFamilyCommitmentPayment} from "@/lib/familyFinancialCommitments";
import {matchesGiftProduct,selectOccasionGiftSeller} from "@/lib/occasionGiftPurchase";
import {sampleMoney,type MoneyState} from "@/lib/money";
import {isSampleBasketEntry,type BasketEntry} from "@/lib/basketRecording";
import { Field, inputCls } from "@/components/Field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fmtJOD, uid, useLocalState,readLocal,writeLocal } from "@/lib/storage";
import {ACTIVE_PLAN_KEY,FAMILY_PLANS_KEY,setPlanChoice,type FamilyPlan} from "@/lib/familyPlans";
import {toast} from "sonner";

export const Route = createFileRoute("/explore/smartbuy")({
  head: () => ({
    meta: [
      { title: "Shopping & Wishlist — Dabberna" },
      { name: "description", content: "Your private family wishlist, shopping ideas, saved needs and manual price comparison with a parent-controlled color theme." },
      { property: "og:title", content: "Shopping & Wishlist — Dabberna" },
      { property: "og:description", content: "Personalized family wishlists and saved shopping needs — no invented retailer offers." },
    ],
  }),
  component: SmartBuy,
});

type Alt = { id: string; store: string; price: string; extra: string; verified: boolean; quality?: string; fit?: string; note?: string; sourceUrl?:string; checkedDate?:string|undefined };

export function SmartBuy() {
  const { tr,lang } = useI18n();
  const ar=lang==="ar";
  const [plans,setPlans] = useLocalState<FamilyPlan[]>(FAMILY_PLANS_KEY,[]);
  const [activePlan] = useLocalState<string|null>(ACTIVE_PLAN_KEY,null);
  const selectedPlan=plans.find(p=>p.id===activePlan&&p.kind==="purchase"&&p.status!=="completed");
  const giftPlan=plans.find(p=>p.id===activePlan&&p.kind==="occasion"&&p.occasionPreparation);
  const [money,,moneyReady]=useLocalState<MoneyState>("money",sampleMoney());
  const [giftPaidAmount,setGiftPaidAmount]=useState("");
  const [giftFeedback,setGiftFeedback]=useState("");
  const [s, setS] = useLocalState("smartbuy", {
    product: "",
    budget: "",
    alts: [] as Alt[],
  });
  const [basket] = useLocalState<BasketEntry[]>("shopping",[]);
  // Reuse names the parent already entered; never pretend a manual basket
  // price is a verified seller quote or import it as an offer.
  const availableBasketItems=basket.filter(item=>!isSampleBasketEntry(item)&&item.name.trim()).slice(0,30);
  const budget = Number(s.budget) || 0;
  const comparison=compareManuallyEnteredPrices(s.alts);
  const rows = s.alts.map((a) => ({ ...a, total: (Number(a.price) || 0) + (Number(a.extra) || 0) }));
  const valid = rows.filter((r) => r.store.trim()&&Number(r.price)>0&&Number.isFinite(r.total)&&r.total>=0);
  const lowestCost = comparison.ready?valid.find(r=>r.id===comparison.cheaper?.id)??null:null;
  const setAlt = (id: string, p: Partial<Alt>) => setS({ ...s, alts: s.alts.map((a) => (a.id === id ? { ...a, ...p } : a)) });
  const giftName=giftPlan?.occasionPreparation?.gift.description.trim()??"";
  const matchingGift=!!giftPlan&&matchesGiftProduct(giftName,s.product);
  const chosenGift=giftPlan?.occasionPreparation?.gift.selectedQuote;
  const giftEntry=giftPlan?familyFinancialCommitments([giftPlan],money).find(x=>x.kind==="gift"):undefined;
  const giftAlreadyPaid=!!giftEntry?.paid||
   !!giftPlan&&money.expenses.some(e=>e.sourcePlanId===giftPlan.id&&e.sourceOccasionCost==="gift"&&e.status!=="planned");
  useEffect(()=>{
   if(chosenGift)setGiftPaidAmount(old=>old||String(chosenGift.totalJod));
  },[chosenGift?.totalJod]);
  const startGiftComparison=()=>{
   if(!giftName||s.product.trim()||s.alts.length)return;
   setS(prev=>({...prev,product:giftName,
    budget:prev.budget||String(giftPlan?.occasionPreparation?.gift.amountJod??"")}));
   setGiftFeedback("");
  };
  const chooseGiftQuote=(quote:Alt&{total:number})=>{
   if(!giftPlan||!matchingGift)return;
   const next=selectOccasionGiftSeller(giftPlan,s.product,quote.store,quote.total,
    quote.verified,quote.checkedDate);
   if(next===giftPlan){
    setGiftFeedback(ar?"راجع سعر البائع والمنتج وتاريخ التحقق.":"Check the gift name, price and date of your seller quote.");
    return;
   }
   setPlans(old=>old.map(p=>p.id===giftPlan.id?selectOccasionGiftSeller(p,s.product,
    quote.store,quote.total,quote.verified,quote.checkedDate):p));
   setGiftPaidAmount(String(quote.total));
   setGiftFeedback(ar?"تم حفظ خيار البائع في خطة المناسبة، من دون تسجيل دفعة.":"Seller choice saved in this occasion plan. Nothing was paid or recorded.");
  };
  const confirmGiftPaid=()=>{
   if(!giftPlan||!giftEntry||!moneyReady)return;
   const latest=readLocal<MoneyState>("money",money);
   const latestPlan=readLocal<FamilyPlan[]>(FAMILY_PLANS_KEY,plans).find(p=>p.id===giftPlan.id);
   const latestEntry=latestPlan?familyFinancialCommitments([latestPlan],latest).find(x=>x.kind==="gift"):undefined;
   if(!latestEntry||latestEntry.paid||latest.demo){
    setGiftFeedback(ar?"لا يمكن تسجيل الدفع؛ راجع المالية أو الدفعات السابقة.":"Cannot record payment. Review real Money and any previous payment.");return;
   }
   const actual=Number(giftPaidAmount);
   if(!giftPaidAmount.trim()||!Number.isFinite(actual)||actual<=0){
    setGiftFeedback(ar?"أدخل مبلغاً مدفوعاً صحيحاً.":"Enter the actual amount you paid.");return;
   }
   if(!window.confirm(ar?
    "هل دفعت فعلاً لهذا المنتج؟ سيتم تسجيل مصروف واحد دون خصم السيولة المدخلة يدوياً.":
    "Did you actually pay for this gift? One expense will be recorded in Money. Your manually entered cash balance will not be deducted."))return;
   const next=recordFamilyCommitmentPayment(latest,latestEntry,actual,"");
   if(!next||!writeLocal("money",next)){
    setGiftFeedback(ar?"لم يُحفظ المصروف؛ لم يتم أي خصم.":"Payment was not saved; no cash balance was deducted.");return;
   }
   setGiftFeedback(ar?"تم تسجيل مصروف الهدية مرة واحدة، وتحديث المالية.":"Gift payment recorded once. Your Money outlook is updated.");
  };


  return (
    <ShoppingExperienceShell>
      <ShoppingJourneyStrip current="compare"/>
      {giftPlan&&<section className="mb-4 rounded-2xl border border-[#E4CFDD] bg-[#FFF8FC] p-4" aria-label={ar?"رحلة شراء هدية المناسبة":"Occasion gift purchase journey"}>
       <p className="text-xs font-black uppercase tracking-wide text-[#9D4F78]">{ar?"متابعة هدية من خطط العيلة":"CONTINUE FROM FAMILY PLANS"}</p>
       <h2 className="mt-1 text-lg font-extrabold">{giftPlan.title}</h2>
       <p className="mt-1 text-sm">{ar?"الهدية: ":"Gift: "}<strong>{giftName|| (ar?"لم تُحدّد بعد":"Not yet described")}</strong></p>
       <p className="mt-1 text-xs text-muted-foreground">{ar?
        "سقف الهدية المخطط لا يعني أن الشراء تم. هذه المقارنة تعتمد على أسعارك أنت.":
        "A planned gift cost is not a purchase. Seller quotes below are your own entries, not verified market prices."}</p>
       {!!giftName&&!s.product.trim()&&s.alts.length===0&&<button type="button" onClick={startGiftComparison}
        className="mt-3 min-h-11 rounded-xl bg-[#E8F4EB] px-4 text-xs font-bold text-brand">
        {ar?"استخدم وصف الهدية في المقارنة":"Use saved gift name for comparison"}
       </button>}
       {!!giftName&&!matchingGift&&(s.product.trim()||s.alts.length>0)&&<p className="mt-2 rounded-xl border border-[#E4DABE] bg-[#FFF9E8] p-3 text-xs">
        {ar?"المقارنة الحالية تخص منتجاً آخر. لن نربط أسعارها بهذه الهدية. بعد إنهائها يمكنك بدء مقارنة جديدة بشكل صريح.":
        "Your current comparison belongs to another product. Its quotes will not be linked to this gift. Finish it before deliberately starting another comparison."}
       </p>}
       {chosenGift&&<div className="mt-3 rounded-xl bg-white p-3 text-sm">
        <p className="font-semibold">{ar?"الخيار المحفوظ: ":"Saved seller choice: "}{chosenGift.store} · {fmtJOD(chosenGift.totalJod)}</p>
        <p className="mt-1 text-xs text-muted-foreground">{chosenGift.checkedByParent?
         (ar?"السعر تم التحقق منه بواسطتك، وليس من دبّرنا.":"Price marked as checked by you, not externally verified by Dabberna."):
         (ar?"السعر مدخل من قبلك ولم يؤكد من المتجر.":"Price entered by you, not confirmed by the seller.")}</p>
       </div>}
       {giftAlreadyPaid?<p role="status" className="mt-3 rounded-xl bg-[#E8F5EB] p-3 text-sm font-bold text-[#286F4D]">
        {ar?"تم تسجيل دفعة هذه الهدية في المالية. لن نكررها.":"This gift payment is already in Money. It cannot be recorded twice."}
       </p>:!giftEntry?<p className="mt-3 text-xs text-muted-foreground">
        {ar?"احفظ تكلفة متوقعة أكبر من صفر في خطة المناسبة أولاً.":"Save a positive planned gift amount in the occasion before recording a payment."}
       </p>:money.demo?<p className="mt-3 text-xs">
        {ar?"سجلات المالية الحالية تجريبية. ":"Money still contains sample records. "}
        <Link to="/money" className="font-semibold text-brand underline">{ar?"ابدأ ببياناتي الفعلية":"Start real Money"}</Link>
       </p>:<div className="mt-3 rounded-xl border border-[#E8DCE5] bg-white p-3">
        <p className="text-sm font-semibold">{ar?"هل دفعت بالفعل؟":"Have you actually paid?"}</p>
        <p className="mt-1 text-xs text-muted-foreground">{ar?
         "السعر المختار مجرد مرجع. أكد المبلغ الذي دفعته فعلياً. لا تُخصم السيولة اليدوية تلقائياً.":
         "The seller quote is only a reference. Confirm the amount actually paid. Your manually entered cash will not be deducted automatically."}</p>
        <label className="mt-3 block text-xs font-semibold">{ar?"المبلغ المدفوع فعلياً (دينار)":"Actual paid amount (JOD)"}
         <input type="number" inputMode="decimal" min="0.01" max="100000" step="0.01"
          className="mt-1 min-h-11 w-full max-w-48 rounded-xl border bg-white px-3 text-base"
          value={giftPaidAmount} onChange={e=>setGiftPaidAmount(e.target.value)}/>
        </label>
        <button type="button" onClick={confirmGiftPaid} disabled={!giftPaidAmount.trim()}
         className="mt-3 min-h-11 rounded-xl bg-[#2D7958] px-4 text-xs font-bold text-white disabled:opacity-50">
         {ar?"تأكيد دفع الهدية وتحديث المالية":"Confirm paid gift and update Money"}
        </button>
       </div>}
       {giftFeedback&&<p role="status" className="mt-2 text-xs font-semibold">{giftFeedback}</p>}
       <div className="mt-3 flex flex-wrap gap-4 text-xs font-semibold">
        <Link to="/occasions" className="text-brand underline">{ar?"ارجع لخطة المناسبة":"Return to occasion"}</Link>
        <Link to="/money" className="text-brand underline">{ar?"افتح المالية":"Open Money"}</Link>
       </div>
      </section>}
      <ShoppingReferenceDashboard/>
      <details id="shopping-tools" defaultOpen={!!giftPlan} className="group mt-6 rounded-[1.6rem] border border-[#E2E8E1] bg-white p-4 sm:p-5">
       <summary className="min-h-12 cursor-pointer text-base font-bold text-brand">
        {ar?"أدوات إضافية: مقارنة الأسعار المحفوظة وسجل الرغبات":"More tools: saved price comparisons and wishlist price history"}
       </summary>
       <div className="mt-4 border-t border-[#E2E8E1] pt-4">
       <h2 className="mb-3 text-xl font-semibold">{ar?"قارن أسعار متجرين":"Which store costs less?"}</h2>
      <Link to="/explore/market" className="mb-4 inline-flex min-h-11 items-center gap-2 rounded-full bg-[#EAF3E8] px-4 text-sm font-semibold text-brand">
        {ar?"أولاً، ابحث عن سعر المنتج عند متاجر حقيقية":"First, find real seller listings"} →
       </Link>
      <PlanContextBanner onUseBudget={amount=>setS(old=>({...old,budget:String(amount)}))}/>
      <p className="mb-3 text-sm text-muted-foreground">
        {ar?"إذا عرفت سعر منتج في متجرين، أدخلهما وسنوضح لك الأرخص بعد التوصيل أو المواصلات. دبّرنا لا يجلب الأسعار مباشرة.":
        "Already have prices from two stores? Enter them and see which entered total is lower, including delivery or travel. Dabberna does not find live prices for you."}
      </p>
      <section role="status" aria-label={ar?"نتيجة مقارنة الأسعار":"Price comparison result"}
       className="mb-4 rounded-2xl border border-[#D5E5D3] bg-[#EFF6EC] p-4">
       <p className="text-xs font-semibold uppercase tracking-wide text-brand">{ar?"النتيجة":"YOUR ANSWER"}</p>
       <h2 className="mt-2 text-base font-semibold">
        {!comparison.ready?(ar?"أدخل سعرين من متجرين مختلفين لتظهر النتيجة":"Enter prices from two different stores to get an answer"):
         comparison.tied?(ar?"السعر النهائي متساوٍ بين الخيارين":"Both entered totals are the same"):
         (ar?"الأقل كلفة حسب إدخالك: ":"Lower entered total: ")+(comparison.cheaper?.store??"")}
       </h2>
       {comparison.ready&&<p className="mt-2 text-sm leading-relaxed">
        {comparison.tied?(ar?"الخياران يكلفان ":"Both options total ")+fmtJOD(comparison.cheapestTotalJod??0):
         (ar?"الإجمالي مع التوصيل/المواصلات ":"Total including delivery/travel ")+
         fmtJOD(comparison.cheapestTotalJod??0)+" · "+
         (ar?"أقل من ":"Lower than ")+(comparison.runnerUp?.store??"")+" "+
         (ar?"بمقدار ":"by ")+fmtJOD(comparison.differenceJod??0)}
       </p>}
       <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
        {ar?"الأسعار التي تدخلها غير مؤكّدة من المتاجر. الأرخص ليس دائماً الأفضل؛ تحقق من الجودة والتوفر قبل الشراء. لا يوجد شراء أو خصم مالي.":
         "Prices are entered by you, not verified retailer offers or guaranteed savings. Compare quality and availability before buying. Nothing is purchased or charged."}
       </p>
      </section>
      <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-[#DCE7D9] bg-[#F4F8F1] p-3 text-sm">
        <span>{ar?"عندك قائمة مشتريات يومية؟":"Making an everyday shopping list?"}</span>
        <Link to="/explore/shopping" className="inline-flex min-h-11 items-center font-semibold text-brand underline">
          {ar?"افتح سلّتي":"Open My Basket"} →
        </Link>
      </div>
      <div className="card-soft mt-4 grid gap-3 p-4 sm:grid-cols-2">
        <Field label={tr("What are you buying?")}><Input className={inputCls} maxLength={60} value={s.product} onChange={(e) => setS({ ...s, product: e.target.value })} /></Field>
        <details className="sm:col-span-2 rounded-lg border border-[#DDE9DF] bg-white p-3">
        <summary className="min-h-10 cursor-pointer text-sm font-semibold text-brand">{ar?"حدّ مالي للشراء (اختياري)":"Spending limit for this purchase (optional)"}</summary>
        <div className="mt-2"><Field label={tr("Your budget (JOD)")}><Input className={inputCls} inputMode="decimal" value={s.budget} onChange={(e) => setS({ ...s, budget: e.target.value })} /></Field></div>
       </details>
        {availableBasketItems.length>0&&<label className="text-xs font-semibold sm:col-span-2">
          {ar?"أو استخدم منتجاً من سلّتك المحفوظة":"Or reuse an item from My Basket"}
          <select className="mt-1 min-h-11 w-full rounded-xl border border-input bg-white px-3 text-sm"
            aria-label={ar?"منتج من سلّتي":"Item from My Basket"}
            value={availableBasketItems.some(item=>item.name===s.product)?s.product:""}
            onChange={e=>{if(e.target.value)setS(old=>({...old,product:e.target.value}));}}>
            <option value="">{ar?"اختر إذا بتحب":"Select an item (optional)"}</option>
            {availableBasketItems.map(item=><option key={item.id} value={item.name}>{item.name}</option>)}
          </select>
          <span className="mt-1 block text-[11px] font-normal text-muted-foreground">
            {ar?"ننقل اسم المنتج فقط. السعر بحاجة لتتحقق منه بنفسك.":
             "Only the name is reused. Check actual store prices yourself."}
          </span>
        </label>}
        <div className="sm:col-span-2">
          <button type="button" className="inline-flex min-h-11 items-center gap-2 text-xs font-semibold text-brand underline"
           onClick={()=>{
             if(!window.confirm(ar?"ابدأ مقارنة جديدة؟ سيُستبدل جدول المقارنة المحفوظ فقط، ولن تُحذف السلّة أو الخطط.":
              "Start a new comparison? This replaces only your saved comparison; your basket and family plans remain unchanged."))return;
             setS({product:"",budget:"",alts:[]});
           }}><RotateCcw className="size-4"/>
           {ar?"ابدأ مقارنة جديدة":"Start another comparison"}
          </button>
        </div>
      </div>
      <div className="mt-4 space-y-3">
       {s.alts.length===0&&<div className="rounded-xl border border-[#DDE7DC] bg-[#F5F9F3] p-4 text-sm">
        <p className="font-semibold">{ar?"ابحث عن المنتج أولاً، وبعدين ضيف السعر إذا صار عندك عرض فعلي.":"Start with the product. Add a seller quote only when you have a real price."}</p>
        <p className="mt-1 text-xs text-muted-foreground">{ar?"دبّرنا لا تختلق عروض أو أسعار مباشرة، وما في داعي تدخل متاجر الآن.":"Dabberna doesn't invent live retailer offers. You don't have to enter stores before discovering options."}</p>
       </div>}
        {rows.map((a) => (
          <div key={a.id} className="card-soft p-4">
            <div className="grid gap-2 sm:grid-cols-[2fr_1fr_1fr_auto]">
              <Input aria-label={tr("Store")} className={inputCls} value={a.store} onChange={(e) => setAlt(a.id, { store: e.target.value.slice(0, 50),verified:false,checkedDate:undefined })} />
              <Input aria-label={tr("Price")} className={inputCls} inputMode="decimal" placeholder={tr("Price")} value={a.price} onChange={(e) => setAlt(a.id, { price: e.target.value,verified:false,checkedDate:undefined })} />
              <Input aria-label={tr("Delivery or travel")} className={inputCls} inputMode="decimal" placeholder={tr("Delivery/travel")} value={a.extra} onChange={(e) => setAlt(a.id, { extra: e.target.value,verified:false,checkedDate:undefined })} />
              <Button variant="ghost" size="icon" aria-label={tr("Remove")} onClick={() => setS({ ...s, alts: s.alts.filter((x) => x.id !== a.id) })}><Trash2 className="size-4" /></Button>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
              <span className="font-semibold">{tr("Total")} {fmtJOD(a.total)}</span>
              {budget > 0 && <span className={a.total > budget ? "text-destructive" : "text-brand"}>{a.total > budget ? `${fmtJOD(a.total - budget)} ${tr("over budget")}` : tr("Within budget")}</span>}
              {lowestCost?.id === a.id && <span className="rounded-full border border-border px-2 py-1 text-xs text-muted-foreground">{tr("Lowest entered total — not necessarily best value")}</span>}
              <label className="ms-auto flex items-center gap-1.5 text-xs">
                <input type="checkbox" checked={a.verified} onChange={(e) => setAlt(a.id, {
                 verified: e.target.checked,checkedDate:e.target.checked?(a.checkedDate||dateKey(new Date())):undefined
                })} /> {ar?"تحققتُ من هذا السعر":"Price I checked myself"}
              </label>
              {(()=>{const evidence=evaluatePriceEvidence(a.sourceUrl,a.checkedDate,a.verified);return <span
                className={"text-[11px] "+(evidence.status==="recent"?"text-brand":"text-muted-foreground")}>
                 {ar?evidence.reasonAr:evidence.reasonEn}{evidence.link&&<a href={evidence.link} target="_blank" rel="noopener noreferrer" className="ms-2 underline">{ar?"رابط المصدر":"View source"}</a>}
                </span>;})()}
            </div>
            {giftPlan&&matchingGift&&!giftAlreadyPaid&&Number(a.price)>0&&Number.isFinite(a.total)&&a.total>0&&a.store.trim().length>=2&&
             <button type="button" onClick={()=>chooseGiftQuote(a)}
              className="mt-3 inline-flex min-h-11 items-center rounded-xl bg-[#F5E4EF] px-4 text-xs font-bold text-[#8E4774]">
              {ar?"احفظ هذا العرض لهدية المناسبة":"Save this seller option for the birthday gift"}
             </button>}
            {selectedPlan&&Number(a.price)>0&&Number.isFinite(a.total)&&a.total>=0&&a.store.trim()&&<div className="mt-3 rounded-xl border border-[#D7E6DA] bg-[#F2F7F0] p-3">
              <p className="text-xs font-medium text-muted-foreground">{ar?"اختيار لخطة: ":"Choose for plan: "}{selectedPlan.title}</p>
              <button type="button" onClick={()=>{
                 const label=(s.product.trim()?s.product.trim()+" · ":"")+a.store.trim();
                 const updated=setPlanChoice(selectedPlan,{label,estimatedJod:Math.round(a.total*100)/100,source:"comparison",verified:a.verified});
                 setPlans(prev=>prev.map(p=>p.id===selectedPlan.id?updated:p));
                 toast.success(ar?"أضفنا الاختيار للخطة. لم نسجّل أي مصروف.":"Choice saved to Plan. No expense has been recorded.");
              }} className="mt-2 inline-flex min-h-11 items-center gap-2 rounded-full bg-brand px-4 text-sm font-semibold text-white">
                <CheckCircle2 className="size-4"/>{ar?"اختَر هذا العرض للخطة":"Choose this for the plan"}
              </button>
              {selectedPlan.choice?.estimatedJod===Math.round(a.total*100)/100&&selectedPlan.choice?.label.includes(a.store.trim())&&<Link to="/plans" className="ms-3 text-xs font-semibold text-brand underline">{ar?"راجع الخطة":"Review plan"}</Link>}
            </div>}
            <details className="group mt-3 rounded-xl bg-muted/40 p-3">
              <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-medium text-brand [&::-webkit-details-marker]:hidden">
                <span>{tr("More than a price: assess this choice")}</span><span className="text-xs group-open:hidden">+</span><span className="hidden text-xs group-open:inline">−</span>
              </summary>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <label className="text-xs font-medium sm:col-span-2">{ar?"رابط المصدر (اختياري — رابط HTTPS عام)":"Source link (optional public HTTPS page)"}
                 <Input type="url" className="mt-1" maxLength={700} value={a.sourceUrl??""}
                  onChange={e=>setAlt(a.id,{sourceUrl:e.target.value,verified:false,checkedDate:undefined})}
                  placeholder="https://example.com/product"/>
                </label>
                <label className="text-xs font-medium sm:col-span-2">{ar?"تاريخ آخر تحقق قمت به":"Date you personally checked the price"}
                 <Input type="date" className="mt-1" value={a.checkedDate??""}
                  onChange={e=>setAlt(a.id,{checkedDate:e.target.value})}/>
                </label>
                <label className="text-xs font-medium">{tr("Quality & durability (your view)")}
                  <select value={a.quality??""} onChange={e=>setAlt(a.id,{quality:e.target.value})} className="mt-1 w-full rounded-xl border bg-card p-2.5">
                    <option value="">{tr("Not assessed")}</option>{[1,2,3,4,5].map(n=><option key={n} value={String(n)}>{n}/5</option>)}
                  </select>
                </label>
                <label className="text-xs font-medium">{tr("Fit for your needs (your view)")}
                  <select value={a.fit??""} onChange={e=>setAlt(a.id,{fit:e.target.value})} className="mt-1 w-full rounded-xl border bg-card p-2.5">
                    <option value="">{tr("Not assessed")}</option>{[1,2,3,4,5].map(n=><option key={n} value={String(n)}>{n}/5</option>)}
                  </select>
                </label>
                <label className="text-xs font-medium sm:col-span-2">{tr("Why would you choose this?")}
                  <Input className="mt-1" maxLength={150} value={a.note??""} onChange={e=>setAlt(a.id,{note:e.target.value})} placeholder={tr("Better quality, reliable warranty, convenient delivery…")}/>
                </label>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">{tr("These are your personal judgments, not verified product ratings or live offers.")}</p>
            </details>
          </div>
        ))}
        <Button variant="secondary" disabled={s.alts.length >= 8} onClick={() => setS({ ...s, alts: [...s.alts, { id: uid(), store: "", price: "", extra: "", verified: false }] })}><Plus className="size-4" /> {ar?"أضف سعر متجر بعد التحقق":"Add a seller quote when ready"}</Button>
      </div>
      <details className="group mt-5 rounded-2xl border border-[#DDE9DB] bg-[#FAFCF8] p-4">
        <summary className="min-h-11 cursor-pointer text-sm font-semibold text-brand">
          {ar?"مشتريات مستقبلية وقائمة الرغبات (اختياري)":"Plan future purchases & wishlist (optional)"}
        </summary>
        <p className="mt-2 text-xs text-muted-foreground">
          {ar?"احفظ الاحتياجات القادمة والأسعار التي تحققت منها. لا توجد إعادة طلب تلقائية أو مقارنة مباشرة.":
           "Save future needs and prices you personally checked. No automatic orders or live price feeds."}
        </p>
        <FamilyWishlistPanel mode="shopping"/>
      </details>
       </div>
      </details>
    </ShoppingExperienceShell>
  );
}