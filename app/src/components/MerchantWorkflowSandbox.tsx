import {useState,type FormEvent} from "react";
import {Building2,ClipboardCheck,ShieldAlert} from "lucide-react";
import {Button} from "@/components/ui/button";
import {useI18n} from "@/lib/i18n";
import {dateKey} from "@/lib/familyCalendar";
import {uid} from "@/lib/storage";
import {
 createSandboxMerchant,submitSandboxMerchant,reviewSandboxMerchant,
 createSandboxOffer,advanceSandboxOffer,sandboxOfferSummary,
 type SandboxMerchant,type SandboxOffer,type SandboxActor
} from "@/lib/merchantWorkflowSandbox";

/** The entire preview is hidden from production builds. No fake role should
 * be mistaken for a real merchant account or server-side moderation.
 */
export const MERCHANT_SANDBOX_ENABLED=import.meta.env.DEV&&
 import.meta.env["VITE_ENABLE_MERCHANT_WORKFLOW_DEMO"]==="true";
export function MerchantWorkflowSandbox(){
 const {lang}=useI18n(),ar=lang==="ar";
 const [actor,setActor]=useState<SandboxActor>("merchant");
 const [business,setBusiness]=useState("Fictional Store");
 const [merchant,setMerchant]=useState<SandboxMerchant|null>(null);
 const [title,setTitle]=useState("Fictional school kits");
 const [total,setTotal]=useState("25.000");
 const [expires,setExpires]=useState(dateKey(new Date()));
 const [offer,setOffer]=useState<SandboxOffer|null>(null);
 const [error,setError]=useState("");
 const [notice,setNotice]=useState("");
 if(!MERCHANT_SANDBOX_ENABLED)return null;
 const act=(fn:()=>void)=>{
  setError("");setNotice("");
  try{fn();setNotice(ar?"تم تعديل حالة المحاكاة فقط.":"Only the mock workflow state was updated.");}
  catch(e){setError(e instanceof Error?e.message:String(e));}
 };
 const newBusiness=(e:FormEvent)=>{
  e.preventDefault();act(()=>{
   setMerchant(createSandboxMerchant(uid(),business));
   setOffer(null);
  });
 };
 const newOffer=(e:FormEvent)=>{
  e.preventDefault();if(!merchant)return;
  act(()=>setOffer(createSandboxOffer({
   id:uid(),merchant,title,totalJod:total,expiresOn:expires
  })));
 };
 return <section className="editorial-card mt-4 border-[#E8DCCA] bg-[#FFFAF1] p-4 sm:p-5"
  aria-label="Developer-only fictional merchant workflow">
  <div className="flex items-start gap-3">
   <ShieldAlert className="mt-1 size-6 shrink-0 text-[#916342]"/>
   <div>
    <p className="section-eyebrow">DEVELOPMENT ONLY · NOT A MERCHANT PORTAL</p>
    <h2 className="font-semibold">{ar?"محاكاة إدارة التاجر والعروض":"Fictional merchant and offer-review workflow"}</h2>
    <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{ar?
     "هذه تجربة محلية مؤقتة بأسماء وهمية فقط. تبديل الدور ليس تسجيل دخول ولا يعطي صلاحيات حقيقية. لا تُرسل عروض لأي مستخدم ولا توجد عقود أو تراخيص أو مدفوعات.":
     "Temporary in-memory simulation using fictional businesses only. Switching actors is NOT login or authorization. No customer receives these offers; there is no real KYC, approval, contract or payment."}</p>
   </div>
  </div>
  <div className="mt-3 flex flex-wrap gap-2">
   <Button type="button" variant={actor==="merchant"?"default":"outline"}
    onClick={()=>setActor("merchant")}>{ar?"تمثيل دور التاجر":"Simulate merchant"}</Button>
   <Button type="button" variant={actor==="reviewer"?"default":"outline"}
    onClick={()=>setActor("reviewer")}>{ar?"تمثيل دور المراجع":"Simulate reviewer"}</Button>
  </div>
  <form onSubmit={newBusiness} className="mt-4 flex flex-wrap items-end gap-3 rounded-xl bg-white p-3">
   <label className="min-w-52 flex-1 text-xs font-semibold">{ar?"اسم تجاري وهمي":"Fictional business name"}
    <input value={business} maxLength={100} onChange={e=>setBusiness(e.target.value)}
     className="mt-1 min-h-11 w-full rounded-xl border px-3 text-sm"/>
   </label>
   <Button type="submit" variant="outline" disabled={actor!=="merchant"}>
    <Building2 className="size-4"/>{ar?"أنشئ تاجر اختبار":"Create mock merchant"}
   </Button>
  </form>
  {merchant&&<div className="mt-3 rounded-xl border border-[#E7E3D9] bg-white p-3">
   <p className="text-sm font-semibold">{merchant.displayName} · JO · {merchant.status}</p>
   <div className="mt-2 flex flex-wrap gap-2">
    {merchant.status==="draft"&&<Button size="sm" disabled={actor!=="merchant"} onClick={()=>act(()=>setMerchant(submitSandboxMerchant(merchant,actor)))}>{ar?"أرسل للمراجعة التجريبية":"Submit for simulated review"}</Button>}
    {merchant.status==="pending-review"&&<>
     <Button size="sm" disabled={actor!=="reviewer"} onClick={()=>act(()=>setMerchant(reviewSandboxMerchant(merchant,actor,true)))}>{ar?"اعتماد وهمي":"Mock approve"}</Button>
     <Button size="sm" variant="outline" disabled={actor!=="reviewer"} onClick={()=>act(()=>setMerchant(reviewSandboxMerchant(merchant,actor,false)))}>{ar?"رفض وهمي":"Mock reject"}</Button>
    </>}
   </div>
  </div>}
  {merchant?.status==="demo-approved"&&<form onSubmit={newOffer} className="mt-3 grid gap-3 rounded-xl bg-white p-3 sm:grid-cols-3">
   <label className="text-xs font-semibold sm:col-span-3">{ar?"عنوان عرض تجريبي":"Fictional offer title"}
    <input value={title} maxLength={120} onChange={e=>setTitle(e.target.value)}
     className="mt-1 min-h-11 w-full rounded-xl border px-3 text-sm"/>
   </label>
   <label className="text-xs font-semibold">{ar?"المجموع JOD حتى ٣ منازل":"Total JOD, up to 3 decimals"}
    <input value={total} inputMode="decimal" onChange={e=>setTotal(e.target.value)}
     className="mt-1 min-h-11 w-full rounded-xl border px-3 text-sm"/>
   </label>
   <label className="text-xs font-semibold">{ar?"انتهاء العرض":"Expiry date"}
    <input type="date" value={expires} onChange={e=>setExpires(e.target.value)}
     className="mt-1 min-h-11 w-full rounded-xl border px-3 text-sm"/>
   </label>
   <div className="self-end">
    <Button type="submit" disabled={actor!=="merchant"}><ClipboardCheck className="size-4"/>{ar?"أنشئ عرضاً وهمياً":"Create mock offer"}</Button>
   </div>
  </form>}
  {offer&&<div className="mt-3 rounded-xl border border-[#E7E3D9] bg-white p-3">
   <p className="text-sm font-semibold">{offer.title} · {sandboxOfferSummary(offer).displayTotal}</p>
   <p className="mt-1 text-xs text-muted-foreground">{ar?"الحالة التجريبية: ":"Mock status: "}{sandboxOfferSummary(offer).status}</p>
   <div className="mt-2 flex flex-wrap gap-2">
    {["draft","needs-changes"].includes(offer.status)&&<Button size="sm" disabled={actor!=="merchant"}
     onClick={()=>act(()=>setOffer(advanceSandboxOffer(offer,actor,"submit")))}>{ar?"أرسل العرض للمراجعة الوهمية":"Submit mock offer"}</Button>}
    {offer.status==="submitted"&&(["approve","request-changes","reject"] as const).map(action=>
     <Button key={action} size="sm" variant={action==="approve"?"default":"outline"}
      disabled={actor!=="reviewer"} onClick={()=>act(()=>setOffer(advanceSandboxOffer(offer,actor,action)))}>
      {action==="approve"?(ar?"قبول تجريبي":"Mock approve"):action==="reject"?(ar?"رفض تجريبي":"Mock reject"):(ar?"اطلب تعديل":"Request changes")}
     </Button>)}
   </div>
  </div>}
  {error&&<p role="alert" className="mt-3 text-xs text-destructive">{error}</p>}
  {notice&&<p role="status" className="mt-3 text-xs text-brand">{notice}</p>}
  <p className="mt-3 text-[11px] text-muted-foreground">{ar?
   "لا تحفظ هذه المحاكاة أي بيانات في المتصفح أو الخادم. للإطلاق يلزم تحقق الهوية والعقود والتحكم بالأدوار على الخادم ومراقبة العروض والاحتيال.":
   "This simulation is not persisted anywhere. Real launch requires merchant identity verification, contracts, server-enforced roles, audit events, offer moderation and abuse controls."}</p>
 </section>;
}
