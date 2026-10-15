import {useEffect,useState} from "react";
import {Copy,FileText,ShieldCheck} from "lucide-react";
import {Button} from "@/components/ui/button";
import {useI18n} from "@/lib/i18n";
import {defaultFamilyPreferences} from "@/lib/familyPreferences";
import {useLocalState} from "@/lib/storage";
import {formatPrivateQuoteBrief,validateQuoteRequest} from "@/lib/merchantQuoteDraft";

/** Draft-only. No merchant discovery, supplier accounts, checkout or sending. */
export function MerchantQuoteDraft({product,budget}:{product:string;budget:string}){
 const {lang}=useI18n(),ar=lang==="ar";
 const [prefs]=useLocalState("familyPreferences",defaultFamilyPreferences);
 const [name,setName]=useState(product);
 const [quantity,setQuantity]=useState("1");
 const [city,setCity]=useState(prefs.city||"Amman");
 const [neededBy,setNeededBy]=useState("");
 const [ceiling,setCeiling]=useState(budget);
 const [brief,setBrief]=useState("");
 const [approved,setApproved]=useState(false);
 const [message,setMessage]=useState("");
 const [error,setError]=useState("");
 useEffect(()=>{if(!name.trim()&&product.trim())setName(product.trim());},[product]); 
 const changed=()=>{setBrief("");setApproved(false);setMessage("");setError("");};
 const prepare=()=>{
  setError("");setMessage("");setApproved(false);
  const v=validateQuoteRequest({product:name,quantity,deliveryCity:city,neededBy,budget:ceiling});
  if(!v.ok||!v.draft){setError(v.error??"Invalid quote request");setBrief("");return;}
  setBrief(formatPrivateQuoteBrief(v.draft,ar?"ar":"en"));
 };
 const copy=async()=>{
  if(!approved||!brief)return;
  setError("");setMessage("");
  try{
   if(!navigator.clipboard?.writeText)throw new Error("Clipboard unavailable on this device");
   await navigator.clipboard.writeText(brief);
   setMessage(ar?"تم نسخ النص. أرسله بنفسك إلى التاجر الذي تختاره.":"Request copied. You choose if and where to send it yourself.");
  }catch(e){setError(e instanceof Error?e.message:String(e));}
 };
 return <details className="mt-5 rounded-2xl border border-[#D8E5D8] bg-[#F6FAF4] p-4"
  aria-label={ar?"مسودة طلب عرض سعر":"Private merchant quotation draft"}>
  <summary className="flex min-h-10 cursor-pointer items-center gap-2 text-sm font-semibold text-brand">
   <FileText className="size-5"/>{ar?"جهّز طلب عرض سعر خاص":"Prepare a private request for a quote"}
  </summary>
  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{ar?
   "جهّز طلباً دون إرسال أي بيانات تلقائياً. لن تصل المسودة إلى أي تاجر عبر دبّرنا؛ يمكنك نسخها ومشاركتها بعد المراجعة.":
   "Prepare a quote request without transmitting it. Dabberna does not have merchant recipients connected; you can copy it and share it yourself only after reviewing."}</p>
  <div className="mt-3 grid gap-3 sm:grid-cols-2">
   <label className="text-xs font-semibold sm:col-span-2">{ar?"ما الذي تريد شراءه؟":"Product or service to quote"}
    <input value={name} maxLength={100} onChange={e=>{changed();setName(e.target.value);}}
     placeholder={ar?"وصف عام، من دون أسماء الأطفال أو معلومات شخصية":"General description only; no child names"}
     className="mt-1 min-h-11 w-full rounded-xl border border-input bg-white px-3 text-sm"/>
   </label>
   <label className="text-xs font-semibold">{ar?"الكمية":"Quantity"}
    <input type="number" min="1" max="10000" step="1" value={quantity}
     onChange={e=>{changed();setQuantity(e.target.value);}}
     className="mt-1 min-h-11 w-full rounded-xl border border-input bg-white px-3 text-sm"/>
   </label>
   <label className="text-xs font-semibold">{ar?"مدينة التسليم فقط":"Delivery city only"}
    <input maxLength={70} value={city} onChange={e=>{changed();setCity(e.target.value);}}
     className="mt-1 min-h-11 w-full rounded-xl border border-input bg-white px-3 text-sm"/>
   </label>
   <label className="text-xs font-semibold">{ar?"تاريخ التسليم المطلوب":"Preferred delivery by"}
    <input type="date" value={neededBy} onChange={e=>{changed();setNeededBy(e.target.value);}}
     className="mt-1 min-h-11 w-full rounded-xl border border-input bg-white px-3 text-sm"/>
   </label>
   <label className="text-xs font-semibold">{ar?"سقف التكلفة الإجمالية (اختياري) بالدينار":"Total JOD budget ceiling (optional)"}
    <input inputMode="decimal" value={ceiling} onChange={e=>{changed();setCeiling(e.target.value);}}
     className="mt-1 min-h-11 w-full rounded-xl border border-input bg-white px-3 text-sm"/>
   </label>
  </div>
  <Button type="button" variant="outline" className="mt-3" onClick={prepare}>
   <FileText className="size-4"/>{ar?"اعرض مسودة الطلب":"Preview request brief"}
  </Button>
  {error&&<p role="alert" className="mt-3 text-xs text-destructive">{error}</p>}
  {brief&&<section className="mt-3 rounded-xl border border-[#D8E6D5] bg-white p-3">
   <p className="flex items-center gap-2 text-xs font-semibold"><ShieldCheck className="size-4 text-brand"/>
    {ar?"راجع كل التفاصيل قبل النسخ":"Review every field before copying"}</p>
   <pre className="mt-2 whitespace-pre-wrap break-words font-sans text-xs leading-relaxed">{brief}</pre>
   <label className="mt-3 flex items-start gap-2 text-xs">
    <input type="checkbox" checked={approved} onChange={e=>setApproved(e.target.checked)}
     className="mt-0.5 size-4 accent-[#47715A]"/>
    {ar?"راجعت التفاصيل وأوافق على نسخ هذا النص ومشاركته بنفسي فقط.":"I reviewed this draft and agree to copy it. I will decide independently whether to share it."}
   </label>
   <Button type="button" className="mt-3" disabled={!approved} onClick={()=>void copy()}>
    <Copy className="size-4"/>{ar?"نسخ طلب العرض":"Copy quotation request"}
   </Button>
  </section>}
  {message&&<p role="status" className="mt-2 text-xs text-brand">{message}</p>}
  <p className="mt-3 text-[11px] text-muted-foreground">{ar?
   "ما في تحقق من المورد أو توفّر المنتجات ولا إرسال عروض أو عقود أو دفعات. رجاءً لا تدخل عنوانك التفصيلي أو بيانات التواصل أو تفاصيل الأطفال.":
   "No merchant identity checks, live stock, bids, contracts or payments are connected. Do not enter a full address, contact details or children's information."}</p>
 </details>;
}
