import {useState,type FormEvent} from "react";
import {Link} from "@tanstack/react-router";
import {ACTIVE_PLAN_KEY,FAMILY_PLANS_KEY,type FamilyPlan} from "@/lib/familyPlans";
import {Archive,ClipboardList,Plus,Trash2} from "lucide-react";
import {Button} from "@/components/ui/button";
import {useI18n} from "@/lib/i18n";
import {useLocalState,uid} from "@/lib/storage";
import {addEnteredOffer,compareEnteredOffers,chooseEnteredOfferForPlan,
 PRIVATE_QUOTES_KEY,type PrivateQuote,recordUserSharedRequest} from "@/lib/privateQuoteWorkspace";

const defaultOffer={merchant:"",itemCost:"",delivery:"0",taxes:"0",expiresOn:"",source:"",note:""};
/** A private record of requests and prices *entered by the family*. No
 * merchant account, bid collection, provider identity verification or payment. */
export function PrivateOfferWorkspace(){
 const {lang}=useI18n(),ar=lang==="ar";
 const [requests,setRequests,ready]=useLocalState<PrivateQuote[]>(PRIVATE_QUOTES_KEY,[]);
 const [plans,setPlans,plansReady]=useLocalState<FamilyPlan[]>(FAMILY_PLANS_KEY,[]);
 const [activePlanId]=useLocalState<string|null>(ACTIVE_PLAN_KEY,null);
 const purchasePlan=plans.find(p=>p.id===activePlanId&&p.kind==="purchase"&&p.status!=="completed");
 const [active,setActive]=useState("");
 const [draft,setDraft]=useState(defaultOffer);
 const [error,setError]=useState("");
 const [notice,setNotice]=useState("");
 const selected=requests.find(r=>r.id===active)??requests[0];
 if(!ready||!plansReady)return null;
 const update=(fn:(r:PrivateQuote)=>PrivateQuote)=>{
  if(!selected)return;
  setRequests(old=>old.map(r=>r.id===selected.id?fn(r):r));
 };
 const add=(e:FormEvent)=>{
  e.preventDefault();setError("");setNotice("");
  if(!selected)return;
  try{
   const next=addEnteredOffer(selected,{
    id:uid(),merchant:draft.merchant,
    itemCostJod:Number(draft.itemCost),deliveryJod:Number(draft.delivery),
    taxesJod:Number(draft.taxes),expiresOn:draft.expiresOn,
    note:draft.note,evidenceUrl:draft.source
   });
   update(()=>next);
   setDraft(defaultOffer);
   setNotice(ar?"تم حفظ العرض الذي أدخلته على هذا الجهاز، ولم يتم التحقق من التاجر.":"Your manually entered option was saved on this device; no merchant verification occurred.");
  }catch(e){setError(e instanceof Error?e.message:String(e));}
 };
 const deleteOffer=(id:string)=>{
  if(!window.confirm(ar?"حذف هذا السعر المسجّل محلياً؟":"Remove this locally entered offer?"))return;
  update(q=>({...q,offers:q.offers.filter(o=>o.id!==id)}));
 };
 const deleteQuote=()=>{
  if(!selected||!window.confirm(ar?"حذف الطلب وأسعاره من هذا الجهاز فقط؟":"Erase this quote request and its offers from this device?"))return;
  setRequests(old=>old.filter(r=>r.id!==selected.id));setActive("");
 };
 return <section className="mt-5 rounded-2xl border border-[#DCE7DC] bg-[#F8FBF6] p-4 sm:p-5"
  aria-label={ar?"طلبات الأسعار الخاصة":"Private quote records"}>
  <div className="flex items-start gap-2">
   <ClipboardList className="mt-0.5 size-5 text-brand"/>
   <div><h3 className="font-semibold">{ar?"تابع طلبات الأسعار الخاصة":"Your private request and offer tracker"}</h3>
    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{ar?
     "مسوداتك والعروض التي تدخلها بنفسك محفوظة على الجهاز فقط. ما في تجار متصلون بهذا القسم، ولا تُرسل أو تُستلم عروض تلقائياً.":
     "Your drafts and prices you enter yourself remain on this device. No merchants are connected and offers are not sent or received automatically."}</p>
   </div>
  </div>
  {requests.length===0?<p className="mt-4 rounded-xl bg-white p-3 text-xs text-muted-foreground">{ar?
   "استخدم «جهّز طلب عرض سعر» أعلاه، ثم احفظه كمسودة خاصة لتتابع عروضك هنا.":
   "Prepare a quote request above and save it as a private draft to track manually obtained offers here."}</p>:<>
   <label className="mt-4 block text-xs font-semibold">{ar?"الطلب المحفوظ":"Saved private request"}
    <select value={selected?.id??""} onChange={e=>{setActive(e.target.value);setDraft(defaultOffer);setError("");}}
     className="mt-1 min-h-11 w-full rounded-xl border border-input bg-white px-3 text-sm">
     {requests.map(r=><option key={r.id} value={r.id}>{r.request.product} · {r.createdAt.slice(0,10)}</option>)}
    </select>
   </label>
   {selected&&<>
    <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl border border-[#E0E9DC] bg-white p-3 text-xs">
     <div className="min-w-[175px] flex-1">
      <p className="font-semibold">{selected.request.product} · {selected.request.quantity} ×</p>
      <p className="mt-1 text-muted-foreground">{selected.request.deliveryCity} · {selected.request.neededBy}</p>
      <p className="mt-1 text-muted-foreground">{ar?
       (selected.status==="shared-by-user"?"قلت إنك شاركته بنفسك. لم نتحقق من الاستلام.":selected.status==="closed"?"مغلق محلياً":"مسودة لم يتم إرسالها"):
       (selected.status==="shared-by-user"?"Marked shared outside the app by you; delivery unverified":selected.status==="closed"?"Closed locally":"Unsent draft")}</p>
     </div>
     {selected.status==="draft"&&<Button variant="outline" size="sm" onClick={()=>{
      if(window.confirm(ar?"هل شاركت النص بنفسك خارج دبّرنا؟ هذا لا يؤكد وصوله لتاجر.":"Did you share the request yourself outside Dabberna? This does not verify merchant receipt."))update(recordUserSharedRequest);
     }}>{ar?"شاركته بنفسي":"I shared it myself"}</Button>}
     {selected.status!=="closed"&&<Button variant="outline" size="sm" onClick={()=>{
      if(window.confirm(ar?"إغلاق هذا الطلب محلياً؟":"Close this local request?"))
       update(q=>({...q,status:"closed"}));
     }}><Archive className="size-3.5"/>{ar?"إغلاق":"Close"}</Button>}
     <Button variant="ghost" size="sm" onClick={deleteQuote}><Trash2 className="size-3.5"/>{ar?"حذف":"Delete"}</Button>
    </div>
    <h4 className="mt-4 text-sm font-semibold">{ar?"الأسعار المسجّلة يدوياً":"Manually recorded options"}</h4>
    <p className="mt-1 text-xs text-muted-foreground">{ar?
     "تُرتب العروض غير المنتهية حسب التكلفة الكاملة: السلعة + التوصيل + الضرائب. الأرخص ليس أفضل قيمة بالضرورة، والتقييم ليس تحققاً من التاجر.":
     "Current entries sort by item + delivery + tax total. Lowest cost is not automatically best value. These are not authenticated merchant offers."}</p>
    <div className="mt-3 space-y-2">
     {compareEnteredOffers(selected).length===0?<p className="rounded-xl bg-white p-3 text-xs text-muted-foreground">{ar?"ما في عروض مدخلة.":"No options entered yet."}</p>:
      compareEnteredOffers(selected).map(row=><article key={row.offer.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#E2E9DF] bg-white p-3 text-xs">
       <div>
        <p className="font-semibold">{row.offer.merchant} · {row.totalJod.toFixed(2)} JOD</p>
        <p className="mt-1 text-muted-foreground">{ar?"المنتج":"Item"} {row.offer.itemCostJod.toFixed(2)} · {ar?"التوصيل":"Delivery"} {row.offer.deliveryJod.toFixed(2)} · {ar?"الضريبة":"Tax"} {row.offer.taxesJod.toFixed(2)}</p>
        <p className="mt-1 text-muted-foreground">{ar?"صالح حسب إدخالك لغاية ":"Entered expiry: "}{row.offer.expiresOn} · {row.expired?(ar?"منتهي":"Expired"):(ar?"غير منتهي حسب التاريخ":"Not expired by entered date")}
         {row.withinCeiling!==null?" · "+(row.withinCeiling?(ar?"ضمن السقف":"Under your ceiling"):(ar?"يتجاوز السقف":"Over your ceiling")):""}</p>
        {purchasePlan&&selected.status!=="closed"&&!row.expired&&<div className="mt-2 rounded-lg border border-[#DAE8D9] bg-[#F5F9F2] p-2">
         <p className="text-[11px] text-muted-foreground">{ar?"خطة الشراء المختارة: ":"Active purchase plan: "}{purchasePlan.title}</p>
         <Button type="button" variant="outline" size="sm" className="mt-2"
          onClick={()=>{
           if(!window.confirm(ar?
            "إضافة السعر الذي أدخلته بنفسك كتكلفة تقديرية للخطة؟ لن يتم شراء أو دفع شيء، والتاجر غير متحقق منه.":
            "Save this manually entered total as an UNVERIFIED estimate for your active purchase plan? No merchant order, checkout or payment will occur."))return;
           try{
            const updated=chooseEnteredOfferForPlan(selected,row.offer.id,purchasePlan);
            setPlans(old=>old.map(p=>p.id===purchasePlan.id&&p.status!=="completed"?updated:p));
            setNotice(ar?"تمت إضافة الخيار إلى الخطة كتكلفة تقديرية فقط.":"Manual price saved as a Plan estimate, not a payment or verified offer.");
            setError("");
           }catch(e){setError(e instanceof Error?e.message:String(e));}
          }}>{ar?"اختَر السعر للخطة":"Use this estimate in Plan"}</Button>
         <Link to="/plans" className="ms-2 text-xs font-semibold text-brand underline">{ar?"راجع الخطة":"Review plan"}</Link>
        </div>}
        {row.offer.evidenceUrl&&<a href={row.offer.evidenceUrl} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block text-brand underline">{ar?"رابط المصدر الذي أضفته":"Your evidence link"}</a>}
       </div>
       <Button variant="ghost" size="sm" onClick={()=>deleteOffer(row.offer.id)}><Trash2 className="size-3.5"/>{ar?"حذف":"Remove"}</Button>
      </article>)}
    </div>
    {selected.status!=="closed"&&selected.offers.length<20&&<form onSubmit={add} className="mt-4 space-y-3 rounded-xl bg-white p-3">
     <h4 className="text-xs font-semibold">{ar?"أدخل عرضاً حصلت عليه بنفسك":"Enter an option you obtained yourself"}</h4>
     <div className="grid gap-3 sm:grid-cols-2">
      <label className="text-xs font-semibold sm:col-span-2">{ar?"التاجر (اسم فقط)":"Merchant name only"}
       <input value={draft.merchant} maxLength={90} required onChange={e=>setDraft(v=>({...v,merchant:e.target.value}))} className="mt-1 min-h-11 w-full rounded-xl border px-3"/>
      </label>
      {([{field:"itemCost",en:"Item cost JOD",ar:"تكلفة المنتج د.أ"},
         {field:"delivery",en:"Delivery JOD",ar:"التوصيل د.أ"},
         {field:"taxes",en:"Taxes JOD",ar:"الضرائب د.أ"}] as const).map(x=>
       <label key={x.field} className="text-xs font-semibold">{ar?x.ar:x.en}
        <input inputMode="decimal" type="number" min="0" step="0.01" required value={draft[x.field]}
         onChange={e=>setDraft(v=>({...v,[x.field]:e.target.value}))}
         className="mt-1 min-h-11 w-full rounded-xl border px-3"/>
       </label>)}
      <label className="text-xs font-semibold">{ar?"تاريخ انتهاء العرض":"Offer expiry date"}
       <input type="date" required value={draft.expiresOn} onChange={e=>setDraft(v=>({...v,expiresOn:e.target.value}))}
        className="mt-1 min-h-11 w-full rounded-xl border px-3"/>
      </label>
      <label className="text-xs font-semibold sm:col-span-2">{ar?"مصدر HTTPS (اختياري)":"Public HTTPS source (optional)"}
       <input type="url" value={draft.source} maxLength={700} onChange={e=>setDraft(v=>({...v,source:e.target.value}))}
        className="mt-1 min-h-11 w-full rounded-xl border px-3"/>
      </label>
      <label className="text-xs font-semibold sm:col-span-2">{ar?"ملاحظاتك الخاصة (اختياري)":"Your private notes (optional)"}
       <input value={draft.note} maxLength={250} onChange={e=>setDraft(v=>({...v,note:e.target.value}))}
        className="mt-1 min-h-11 w-full rounded-xl border px-3"/>
      </label>
     </div>
     <Button type="submit"><Plus className="size-4"/>{ar?"احفظ السعر المسجّل":"Save entered option"}</Button>
    </form>}
   </>}
  </>}
  {error&&<p role="alert" className="mt-3 text-xs text-destructive">{error}</p>}
  {notice&&<p role="status" className="mt-3 text-xs text-brand">{notice}</p>}
  <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">{ar?
   "لا يتم حجز أو شراء أو دفع شيء هنا. تحقق بنفسك من المورد والسعر والصلاحية والمواصفات قبل الشراء.":
   "No order, payment, booking or verified merchant connection takes place. Independently verify the provider, current price, terms and suitability."}</p>
 </section>;
}
