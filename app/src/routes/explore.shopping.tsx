import { useI18n } from "@/lib/i18n";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { AppShell, PilotBadge } from "@/components/AppShell";
import { inputCls } from "@/components/Field";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { sampleMoney, type MoneyState } from "@/lib/money";
import { localToday } from "@/lib/cashflow";
import {basketExpenseId,isSampleBasketEntry,recordBasketExpense} from "@/lib/basketRecording";
import { fmtJOD, parseAmount, uid, useLocalState } from "@/lib/storage";

export const Route = createFileRoute("/explore/shopping")({
  head: () => ({
    meta: [
      { title: "My Basket — Dabberna" },
      { name: "description", content: "Grocery list with quantities, prices and basket total, saved on your device." },
      { property: "og:title", content: "My Basket — Dabberna" },
      { property: "og:description", content: "Build your grocery basket and record the spend." },
    ],
  }),
  component: Shopping,
});

type Item = { id: string; name: string; qty: number; price: number; done: boolean };

function Shopping() {
  const { tr,lang } = useI18n();
  const ar=lang==="ar";
  // New users start with an empty basket. Legacy sample rows are kept until
  // the parent removes them, but are never eligible for real expense recording.
  const [items, setItems,itemsReady] = useLocalState<Item[]>("shopping", []);
  const [money,setMoney,moneyReady] = useLocalState<MoneyState>("money", sampleMoney());
  const [cycleId,setCycleId,cycleReady]=useLocalState<string>("shoppingTripId","");
  const [categoryInput,setCategoryInput]=useState("");
  useEffect(()=>{
    if(cycleReady&&!cycleId)setCycleId(uid());
  },[cycleReady,cycleId,setCycleId]);
  const suggestedCategory=money.categories.find(c=>/grocer|food|supermarket|بقالة|سوبر|مواد غذائية/i.test(c.name))?.id??"";
  const categoryId=money.categories.some(c=>c.id===categoryInput)?categoryInput:(categoryInput==="uncategorized"?"uncategorized":suggestedCategory||"uncategorized");
  const recorded=!!cycleId&&money.expenses.some(e=>e.id===basketExpenseId(cycleId));
  const sampleRows=items.filter(isSampleBasketEntry);
  const ready=itemsReady&&moneyReady&&cycleReady&&!!cycleId;
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [err, setErr] = useState("");
  const total = items.reduce((a, i) => a + i.qty * i.price, 0);
  const upd = (id: string, p: Partial<Item>) => setItems(items.map((i) => (i.id === id ? { ...i, ...p } : i)));

  const add = (e: FormEvent) => {
    e.preventDefault();
    const p = price === "" ? 0 : parseAmount(price, 5000);
    if (!name.trim()) return setErr(tr("Item name is required."));
    if (p === null) return setErr(tr("Price must be a positive number."));
    setErr("");
    setItems([...items, { id: uid(), name: name.trim().slice(0, 60), qty: 1, price: p, done: false }]);
    setName(""); setPrice("");
  };

  const record = () => {
    if(!ready||recorded)return;
    if(money.demo){setErr(ar?"ابدأ بميزانية حقيقية قبل تسجيل المصروف.":"Start your own Money budget before recording a purchase.");return;}
    if(sampleRows.length){setErr(ar?"احذف العناصر التجريبية أولاً.":"Remove the sample products before recording your own purchases.");return;}
    
    if(total<=0){setErr(ar?"أدخل سعراً حقيقياً واحداً على الأقل.":"Enter at least one real price.");return;}
    setErr("");
    setMoney(m=>recordBasketExpense(m,items,cycleId,categoryId,localToday()));
    // Success is shown only if the expense appears in persisted Money state.
    // If local storage fails, the global save warning appears instead.
  };
  const newTrip=()=>{
    if(!recorded)return;
    setCycleId(uid());
    setItems(old=>old.map(i=>({...i,done:false})));
    setErr("");
  };

  return (
    <AppShell title={tr("My Basket")}>
      <p className="mb-4 text-sm text-muted-foreground">{tr("Plan what you need, see the total, and make room for what matters.")}</p>
      <p className="mb-3 flex items-center gap-2 text-sm text-muted-foreground"><PilotBadge>{tr("Device only")}</PilotBadge> {tr("Prices are what you enter — no live store prices.")}</p>
      <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-[#DCE7DA] bg-[#F5F9F3] p-3 text-sm">
        <span>{ar?"عم تشتري منتج كبير أو بدك تقارن سعرين؟":"Buying one larger item or comparing store prices?"}</span>
        <Link to="/explore/market" className="inline-flex min-h-11 items-center font-semibold text-brand underline">
          {ar?"ابحث عن أسعار المتاجر":"Find seller prices"} →
        </Link>
      </div>
      {sampleRows.length>0&&<div className="mb-3 rounded-xl border border-[#E8D3BB] bg-[#FFF8ED] p-3 text-sm">
        <p>{ar?"تحتوي سلّتك القديمة على عناصر تجريبية؛ لن تُسجّل كمصروف حقيقي.":"Your saved basket has sample products. They cannot be recorded as real spending."}</p>
        <button type="button" className="mt-2 min-h-10 rounded-lg bg-white px-3 font-semibold text-brand"
         onClick={()=>setItems(old=>old.filter(i=>!isSampleBasketEntry(i)))}>
          {ar?"إزالة العناصر التجريبية":"Remove sample items"}
        </button>
      </div>}
      <form onSubmit={add} className="card-soft flex flex-wrap gap-2 p-3">
        <Input aria-label={tr("Item name")} className={`${inputCls} min-w-0 flex-[2]`} placeholder={tr("Item")} value={name} onChange={(e) => setName(e.target.value)} />
        <Input aria-label={tr("Unit price")} className={`${inputCls} w-28 flex-1`} inputMode="decimal" placeholder={tr("Price JOD")} value={price} onChange={(e) => setPrice(e.target.value)} />
        <Button type="submit" className="h-11"><Plus className="size-4" /> {tr("Add")}</Button>
        {err && <p className="w-full text-sm text-destructive" role="alert">{err}</p>}
      </form>
      {items.length === 0 ? (
        <p className="mt-4 rounded-xl bg-muted p-6 text-center text-sm text-muted-foreground">{tr("Your list is empty.")}</p>
      ) : (
        <ul className="card-soft mt-4 divide-y">
          {items.map((i) => (
            <li key={i.id} className="flex items-center gap-2 p-3">
              <Checkbox checked={i.done} onCheckedChange={(v) => upd(i.id, { done: v === true })} aria-label={`${tr("Got")} ${i.name}`} />
              <Input aria-label={tr("Name")} className={`h-10 min-w-0 flex-1 border-transparent bg-transparent ${i.done ? "line-through opacity-60" : ""}`} value={i.name} onChange={(e) => upd(i.id, { name: e.target.value.slice(0, 60) })} />
              <div className="flex items-center">
                <Button size="icon" variant="ghost" aria-label={tr("Decrease")} onClick={() => upd(i.id, { qty: Math.max(1, i.qty - 1) })}><Minus className="size-4" /></Button>
                <span className="w-6 text-center tabular-nums">{i.qty}</span>
                <Button size="icon" variant="ghost" aria-label={tr("Increase")} onClick={() => upd(i.id, { qty: Math.min(99, i.qty + 1) })}><Plus className="size-4" /></Button>
              </div>
              <Input aria-label={tr("Price")} className="h-10 w-20 bg-card" inputMode="decimal" defaultValue={i.price} onBlur={(e) => { const p = parseAmount(e.target.value, 5000); if (p !== null) upd(i.id, { price: p }); else e.target.value = String(i.price); }} />
              <Button size="icon" variant="ghost" aria-label={`${tr("Remove")} ${i.name}`} onClick={() => setItems(items.filter((x) => x.id !== i.id))}><Trash2 className="size-4" /></Button>
            </li>
          ))}
        </ul>
      )}
      <section className="card-soft mt-4 space-y-3 p-4" aria-label={ar?"تسجيل مصروف التسوق":"Record shopping expense"}>
        <div className="flex items-center justify-between gap-3">
          <div><p className="text-xs text-muted-foreground">{tr("Basket total")}</p><p className="text-2xl font-semibold">{fmtJOD(total)}</p></div>
          {recorded&&<span role="status" className="text-sm font-semibold text-brand">
            {ar?"تم التسجيل في المالية":"Recorded in Money"}</span>}
        </div>
        {!money.demo&&money.categories.length>0&&<label className="block text-sm font-medium">
          {ar?"فئة المصروف":"Expense category"}
          <select className="mt-1 min-h-11 w-full rounded-xl border border-border bg-white px-3"
            value={categoryId} onChange={e=>setCategoryInput(e.target.value)} disabled={recorded}>
            <option value="uncategorized">{ar?"غير مصنف الآن":"Uncategorized for now"}</option>
            {money.categories.map(c=><option key={c.id} value={c.id}>{tr(c.name)}</option>)}
          </select>
        </label>}
        {money.demo?<p className="text-sm text-muted-foreground">
          {ar?"المالية فيها أرقام تجريبية. ابدأ بميزانيتك قبل تسجيل المشتريات.":"Your finances still contain sample figures. Set up your budget before recording purchases."}
          <Link to="/money" className="ms-2 font-semibold text-brand underline">{ar?"افتح المالية":"Open Money"}</Link>
        </p>:null}
        {err&&<p role="alert" className="text-sm text-destructive">{err}</p>}
        {recorded?<div className="flex flex-wrap items-center gap-3">
          <p className="text-xs text-muted-foreground">
            {ar?"لن نضيف نفس عملية الشراء مرتين حتى لو ضغطت مجدداً.":"This shopping trip cannot be recorded twice, even after a reload."}
          </p>
          <Button variant="outline" onClick={newTrip}>{ar?"ابدأ تسوقاً جديداً بنفس القائمة":"Start next trip with this list"}</Button>
        </div>:<Button onClick={record} disabled={!ready||money.demo||!categoryId||sampleRows.length>0||total<=0||!items.length}>
          {tr("Record as expense")}
        </Button>}
      </section>
    </AppShell>
  );
}