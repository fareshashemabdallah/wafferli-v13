import { useI18n } from "@/lib/i18n";
import { createFileRoute,Link } from "@tanstack/react-router";
import { CheckCircle2, ImagePlus, Plus, Receipt, RotateCcw, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { AppShell, Notice } from "@/components/AppShell";
import { PlanContextBanner } from "@/components/PlanContextBanner";
import {MerchantQuoteDraft} from "@/components/MerchantQuoteDraft";
import {FamilyWishlistPanel} from "@/components/FamilyWishlistPanel";
import {PrivateOfferWorkspace} from "@/components/PrivateOfferWorkspace";
import {evaluatePriceEvidence} from "@/lib/merchantQuoteDraft";
import {dateKey} from "@/lib/familyCalendar";
import {isSampleBasketEntry,type BasketEntry} from "@/lib/basketRecording";
import { Field, inputCls } from "@/components/Field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fmtJOD, uid, useLocalState } from "@/lib/storage";
import {ACTIVE_PLAN_KEY,FAMILY_PLANS_KEY,setPlanChoice,type FamilyPlan} from "@/lib/familyPlans";
import {toast} from "sonner";

export const Route = createFileRoute("/explore/smartbuy")({
  head: () => ({
    meta: [
      { title: "Compare & Choose — Dabberna" },
      { name: "description", content: "Compare buying options by total cost including delivery or travel, against your budget." },
      { property: "og:title", content: "Compare & Choose — Dabberna" },
      { property: "og:description", content: "Honest manual price comparison with total cost." },
    ],
  }),
  component: SmartBuy,
});

type Alt = { id: string; store: string; price: string; extra: string; verified: boolean; quality?: string; fit?: string; note?: string; sourceUrl?:string; checkedDate?:string|undefined };

function Photo({ label, icon: Icon }: { label: string; icon: typeof Receipt }) {
  const { tr } = useI18n();
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => () => { if (url) URL.revokeObjectURL(url); }, [url]);
  return (
    <label className="card-soft flex cursor-pointer flex-col items-center justify-center gap-2 p-4 text-center text-sm">
      {url ? <img src={url} alt={label} className="h-28 w-full rounded-lg object-cover" /> : <Icon className="size-7 text-brand" />}
      <span className="font-medium">{label}</span>
      <span className="text-[11px] text-muted-foreground">{tr("Preview only · AI extraction not connected")}</span>
      <input type="file" accept="image/*" className="sr-only" onChange={(e) => { const f = e.target.files?.[0]; if (f) setUrl(URL.createObjectURL(f)); }} />
    </label>
  );
}

function SmartBuy() {
  const { tr,lang } = useI18n();
  const ar=lang==="ar";
  const [plans,setPlans] = useLocalState<FamilyPlan[]>(FAMILY_PLANS_KEY,[]);
  const [activePlan] = useLocalState<string|null>(ACTIVE_PLAN_KEY,null);
  const selectedPlan=plans.find(p=>p.id===activePlan&&p.kind==="purchase"&&p.status!=="completed");
  const [s, setS] = useLocalState("smartbuy", {
    product: "",
    budget: "",
    alts: [
      { id: "a1", store: "", price: "", extra: "", verified: false },
      { id: "a2", store: "", price: "", extra: "", verified: false },
    ] as Alt[],
  });
  const [basket] = useLocalState<BasketEntry[]>("shopping",[]);
  // Reuse names the parent already entered; never pretend a manual basket
  // price is a verified seller quote or import it as an offer.
  const availableBasketItems=basket.filter(item=>!isSampleBasketEntry(item)&&item.name.trim()).slice(0,30);
  const budget = Number(s.budget) || 0;
  const rows = s.alts.map((a) => ({ ...a, total: (Number(a.price) || 0) + (Number(a.extra) || 0) }));
  const valid = rows.filter((r) => Number(r.price) > 0);
  const lowestCost = valid.length ? valid.reduce((a, b) => (b.total < a.total ? b : a)) : null;
  const setAlt = (id: string, p: Partial<Alt>) => setS({ ...s, alts: s.alts.map((a) => (a.id === id ? { ...a, ...p } : a)) });

  return (
    <AppShell title={tr("Compare & Choose")}>
      <PlanContextBanner onUseBudget={amount=>setS(old=>({...old,budget:String(amount)}))}/>
      <p className="mb-3 text-sm text-muted-foreground">
        {ar?"قارن خيارين بسهولة، مع التوصيل أو المواصلات. الأسعار من إدخالك أنت وليست عروضاً مباشرة من المتاجر.":
        "Compare two options including delivery or travel. Prices are entered by you, not fetched or verified retailer offers."}
      </p>
      <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-[#DCE7D9] bg-[#F4F8F1] p-3 text-sm">
        <span>{ar?"عندك قائمة مشتريات يومية؟":"Making an everyday shopping list?"}</span>
        <Link to="/explore/shopping" className="inline-flex min-h-11 items-center font-semibold text-brand underline">
          {ar?"افتح سلّتي":"Open My Basket"} →
        </Link>
      </div>
      <div className="card-soft mt-4 grid gap-3 p-4 sm:grid-cols-2">
        <Field label={tr("What are you buying?")}><Input className={inputCls} maxLength={60} value={s.product} onChange={(e) => setS({ ...s, product: e.target.value })} /></Field>
        <Field label={tr("Your budget (JOD)")}><Input className={inputCls} inputMode="decimal" value={s.budget} onChange={(e) => setS({ ...s, budget: e.target.value })} /></Field>
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
             setS({product:"",budget:"",alts:[
              {id:uid(),store:"",price:"",extra:"",verified:false},
              {id:uid(),store:"",price:"",extra:"",verified:false}
             ]});
           }}><RotateCcw className="size-4"/>
           {ar?"ابدأ مقارنة جديدة":"Start another comparison"}
          </button>
        </div>
      </div>
      <div className="mt-4 space-y-3">
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
        <Button variant="secondary" disabled={s.alts.length >= 8} onClick={() => setS({ ...s, alts: [...s.alts, { id: uid(), store: "", price: "", extra: "", verified: false }] })}><Plus className="size-4" /> {tr("Add alternative")}</Button>
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
      <details className="group mt-4 rounded-2xl border border-[#DDE9DB] bg-white p-4">
        <summary className="min-h-11 cursor-pointer text-sm font-semibold text-brand">
          {ar?"خيارات متقدمة: عروض ومرفقات (اختياري)":"Advanced: quote drafts, offers & photos (optional)"}
        </summary>
        <p className="mt-2 text-xs text-muted-foreground">
          {ar?"هذه أدوات لتنظيم الأسعار والطلبات التي تتحقق منها أنت. لا يرسل دبّرنا طلباً لتاجر ولا يدير مدفوعات.":
           "Organize your own comparisons and quotes. Dabberna does not send merchant requests or handle payments."}
        </p>
        <MerchantQuoteDraft product={s.product} budget={s.budget}/>
        <PrivateOfferWorkspace/>
        <details className="mt-5 rounded-2xl border border-border bg-white p-4">
          <summary className="min-h-11 cursor-pointer text-sm font-semibold text-brand">{tr("Add photos (optional)")}</summary>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <Photo label={tr("Product photo")} icon={ImagePlus} />
            <Photo label={tr("Receipt photo")} icon={Receipt} />
          </div>
        </details>
      </details>
    </AppShell>
  );
}