import {createFileRoute} from "@tanstack/react-router";
import {useState,type FormEvent} from "react";
import {BookOpen,Camera,CheckCircle2,Heart,Plus,Repeat2,Search,ShieldCheck,Tag,Trash2,X} from "lucide-react";
import {AppShell} from "@/components/AppShell";
import {useI18n} from "@/lib/i18n";
import {uid,useLocalState} from "@/lib/storage";
import {
 FAMILY_FINDS_KEY,FAMILY_FINDS_WISHES_KEY,addFindListing,blankFindDraft,changeFindStatus,
 editFindListing,findCategories,makeFindListing,readFindDraft,safeFindImage,
 validateFindWish,type FamilyFindListing,type FamilyFindWish,
 type FindCategory,type FindDraft,type FindOffer
} from "@/lib/familyFinds";

export const Route=createFileRoute("/finds")({
 head:()=>({meta:[{title:"Our Market — سوقنا | Dabberna"},
  {name:"description",content:"Sell, exchange or share something loved. Private device-only family marketplace pilot."}]}),
 component:FamilyFindsPage
});
const input="mt-1 block min-h-11 w-full rounded-xl border border-[#CFE1D5] bg-white px-3 py-2 text-sm text-[#294A3A] focus-visible:outline-2 focus-visible:outline-[#3F956D]";
const card="rounded-[1.4rem] border border-[#DBE8DE] bg-white p-4 shadow-[0_12px_30px_-28px_rgba(40,77,59,.35)]";
const categoryNames:Record<FindCategory,[string,string]>={
 books:["Books","كتب"],toys:["Toys","ألعاب"],games:["Games & puzzles","ألعاب تركيب وألغاز"],
 clothes:["Clothing","ملابس"],bikes:["Bikes & scooters","دراجات وسكوترات"],
 sports:["Sports equipment","معدات رياضية"],other:["Other safe items","أغراض أخرى آمنة"]
};
const ageNames:Record<FindDraft["age"],[string,string]>={
 "0-2":["0–2 years","٠–٢ سنة"],"3-5":["3–5 years","٣–٥ سنوات"],
 "6-9":["6–9 years","٦–٩ سنوات"],"10-13":["10–13 years","١٠–١٣ سنة"],
 "14+":["14+ years","١٤ سنة وأكثر"],all:["All ages","كل الأعمار"]
};
const conditionNames:Record<FindDraft["condition"],[string,string]>={
 "like-new":["Like new","كالجديد"],good:["Good condition","حالة جيدة"],loved:["Well loved","مستعمل بحالة مقبولة"]
};
const offerNames:Record<FindOffer,[string,string]>={
 sell:["For sale","للبيع"],swap:["Open to swapping","للتبادل"],
 "sell-swap":["Sell or swap","للبيع أو التبادل"],share:["Share the Joy","شارك الفرحة"]
};
const money=(n:number)=>n.toFixed(2)+" JOD";
async function shrinkPhoto(file:File):Promise<string>{
 if(!file.type.startsWith("image/")||file.size>7_000_000)throw Error("Choose a photo under 7 MB.");
 const url=URL.createObjectURL(file);
 try{
  const img=await new Promise<HTMLImageElement>((resolve,reject)=>{
   const image=new Image();
   image.onload=()=>resolve(image);image.onerror=()=>reject(new Error("Cannot read image."));
   image.src=url;
  });
  const size=Math.min(1,720/Math.max(img.width,img.height));
  const canvas=document.createElement("canvas");
  canvas.width=Math.max(1,Math.round(img.width*size));
  canvas.height=Math.max(1,Math.round(img.height*size));
  const ctx=canvas.getContext("2d");
  if(!ctx)throw Error("Photo processing is unavailable.");
  ctx.fillStyle="#fff";ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.drawImage(img,0,0,canvas.width,canvas.height);
  const encoded=canvas.toDataURL("image/jpeg",0.65);
  if(!safeFindImage(encoded))throw Error("Photo is too large after resizing. Try another photo.");
  return encoded;
 }finally{URL.revokeObjectURL(url);}
}
function OfferTag({offer,ar}:{offer:FindOffer;ar:boolean}){
 const [en,a]=offerNames[offer];
 return <span className={"inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold "+
  (offer==="share"?"bg-[#FCEBF3] text-[#B34F7F]":offer==="sell-swap"?"bg-[#E7F3FC] text-[#326F9E]":"bg-[#EAF5E8] text-[#31724F]")}>{ar?a:en}</span>;
}
export function FamilyFindsPage(){
 const {lang}=useI18n(),ar=lang==="ar",t=(en:string,a:string)=>ar?a:en;
 const [listings,setListings,ready]=useLocalState<FamilyFindListing[]>(FAMILY_FINDS_KEY,[]);
 const [wishes,setWishes,wishesReady]=useLocalState<FamilyFindWish[]>(FAMILY_FINDS_WISHES_KEY,[]);
 const [pane,setPane]=useState<"offers"|"wishes">("offers");
 const [editing,setEditing]=useState<string|null>(null);
 const [form,setForm]=useState<FindDraft|null>(null);
 const [imageBusy,setImageBusy]=useState(false);
 const [error,setError]=useState("");
 const [filter,setFilter]=useState<"all"|FindOffer>("all");
 const [textSearch,setTextSearch]=useState("");
 const [wishText,setWishText]=useState("");
 const [wishCategory,setWishCategory]=useState<FindCategory>("books");
 const active=listings.filter(x=>x.status==="available");
 const shown=listings.filter(x=>(filter==="all"||x.offer===filter)&&
  (!textSearch||[x.title,x.description,x.wanted??"",x.category].join(" ").toLocaleLowerCase().includes(textSearch.toLocaleLowerCase())))
  .sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt));
 const canSave=!!form&&form.title.trim().length>=3&&
  (form.offer==="share"||form.offer==="swap"||/^(?:0|[1-9]\d{0,4})(?:\.\d{1,2})?$/.test(form.price)&&Number(form.price)>0)&&
  (form.offer==="sell"||form.offer==="share"||!!form.wanted.trim()||form.openOffers);
 const edit=(x:FamilyFindListing)=>{setEditing(x.id);setForm(readFindDraft(x));setError("");};
 const fresh=()=>{setEditing(null);setForm(blankFindDraft());setError("");};
 const set=(key:keyof FindDraft,val:FindDraft[keyof FindDraft])=>setForm(old=>old?{...old,[key]:val}:old);
 const save=(event:FormEvent)=>{
  event.preventDefault();if(!form)return;
  const previous=editing?listings.find(x=>x.id===editing):undefined;
  const record=makeFindListing(form,editing??uid(),new Date().toISOString(),previous);
  if(!record){setError(t("Check the title, price, location and swap preference.","راجع العنوان والسعر والمنطقة وما تريده للتبادل."));return;}
  setListings(old=>editing?editFindListing(old,record):addFindListing(old,record));
  setForm(null);setEditing(null);setError("");
 };
 const saveWish=(event:FormEvent)=>{
  event.preventDefault();
  const wish=validateFindWish({description:wishText,category:wishCategory},uid(),new Date().toISOString());
  if(!wish){setError(t("Describe what you are looking for in at least three characters.","اكتب ماذا تبحث عنه بثلاثة أحرف على الأقل."));return;}
  setWishes(old=>[wish,...old]);setWishText("");setError("");
 };
 return <AppShell title={t("Our Market","سوقنا")}>
  <div className="mx-auto max-w-[950px] space-y-4" data-testid="family-finds">
   <header className="relative overflow-hidden rounded-[1.6rem] border border-[#DCECDD] bg-[linear-gradient(115deg,#F2FAE9,#FFF3E6_66%,#FDEDF3)] p-5 sm:p-6">
    <div className="relative z-10 max-w-[95%] sm:max-w-[75%]">
     <p className="text-[11px] font-bold uppercase tracking-wider text-[#4B896A]">{t("Loved by one family. Ready for another.","من عيلة لعيلة... والفرحة بتكمل.")}</p>
     <h2 className="mt-1 text-2xl font-black text-[#28543E]">{t("Our Market","سوقنا")} <Heart className="inline size-5 text-[#C66F86]"/></h2>
     <p className="mt-2 text-sm text-[#5A7566]">{t(
      "Sell something useful, discover what you could swap it for, or share the joy at no cost.",
      "بيع غرض مفيد، أو بدّله بشي تحتاجه عيلتك، أو شارك الفرحة بدون مقابل.")}</p>
    </div>
   </header>
   <div role="status" className="flex items-start gap-2 rounded-xl border border-[#D7E4DE] bg-white p-3 text-xs text-[#546F61]">
    <ShieldCheck className="mt-0.5 size-4 shrink-0 text-[#398A66]"/>
    <p>{t("Private testing space: your listings and wishes are saved ONLY in this browser. No other families can see them, send offers or contact you yet. Do not add addresses, phone numbers, children's names or sensitive details.",
     "مساحة تجريبية خاصة: الإعلانات وما تبحث عنه محفوظة فقط بهذا المتصفح. العائلات الأخرى لا تراها ولا يمكنها إرسال عروض أو التواصل بعد. لا تضف العنوان أو رقم الهاتف أو أسماء الأطفال أو معلومات خاصة.")}</p>
   </div>
   <div className="grid grid-cols-2 gap-2" role="tablist" aria-label={t("Our Market sections","أقسام سوقنا")}>
    <button type="button" role="tab" aria-selected={pane==="offers"} onClick={()=>{setPane("offers");setForm(null);setError("");}}
     className={"min-h-12 rounded-xl border px-3 text-sm font-bold "+(pane==="offers"?"border-[#8EBFA2] bg-[#E9F6ED] text-[#28684A]":"border-[#E1EAE0] bg-white text-[#607365]")}>
     <Tag className="me-1 inline size-4"/>{t("My listings","إعلاناتي")} ({listings.length})
    </button>
    <button type="button" role="tab" aria-selected={pane==="wishes"} onClick={()=>{setPane("wishes");setForm(null);setError("");}}
     className={"min-h-12 rounded-xl border px-3 text-sm font-bold "+(pane==="wishes"?"border-[#8EBFA2] bg-[#E9F6ED] text-[#28684A]":"border-[#E1EAE0] bg-white text-[#607365]")}>
     <BookOpen className="me-1 inline size-4"/>{t("What I'm looking for","شو بدنا؟")} ({wishes.length})
    </button>
   </div>
   {!ready||!wishesReady?<p className="p-3 text-sm">{t("Loading your saved items…","جارٍ تحميل العناصر...")}</p>:
    form?<section className={card} aria-label={t("Edit a family listing","تعديل إعلان عائلي")}>
     <div className="flex items-center justify-between gap-2">
      <h3 className="text-lg font-extrabold">{editing?t("Edit listing","تعديل الإعلان"):t("Give it a new adventure","بداية مغامرة جديدة")}</h3>
      <button type="button" onClick={()=>{setForm(null);setError("");}} className="min-h-11 rounded-xl px-3 text-sm text-[#687B6C]"><X className="inline size-4"/> {t("Cancel","إلغاء")}</button>
     </div>
     <p className="mt-1 text-xs text-[#788B7B]">{t("One item, one listing. Decide whether to sell, swap, or share.",
      "غرض واحد، إعلان واحد. اختَر البيع أو التبادل أو المشاركة.")}</p>
     <form onSubmit={save} className="mt-4 space-y-4">
      <label className="block text-xs font-bold">{t("Item name","اسم الغرض")} *
       <input className={input} value={form.title} maxLength={80} onChange={e=>set("title",e.target.value)} required minLength={3}
        placeholder={t("E.g. illustrated storybooks","مثلاً: قصص أطفال مصوّرة")}/></label>
      <div className="grid grid-cols-2 gap-3">
       <label className="block text-xs font-bold">{t("Category","الفئة")}
        <select className={input} value={form.category} onChange={e=>set("category",e.target.value as FindCategory)}>
         {findCategories.map(v=><option key={v} value={v}>{categoryNames[v][ar?1:0]}</option>)}
        </select></label>
       <label className="block text-xs font-bold">{t("Suitable age","العمر المناسب")}
        <select className={input} value={form.age} onChange={e=>set("age",e.target.value as FindDraft["age"])}>
         {(Object.keys(ageNames) as FindDraft["age"][]).map(v=><option key={v} value={v}>{ageNames[v][ar?1:0]}</option>)}
        </select></label>
      </div>
      <label className="block text-xs font-bold">{t("Condition","الحالة")}
       <select className={input} value={form.condition} onChange={e=>set("condition",e.target.value as FindDraft["condition"])}>
        {(Object.keys(conditionNames) as FindDraft["condition"][]).map(v=><option key={v} value={v}>{conditionNames[v][ar?1:0]}</option>)}
       </select></label>
      <fieldset className="space-y-2">
       <legend className="mb-2 text-xs font-bold">{t("How would you like to pass it along?","كيف بتحب ينتقل الغرض لعيلة ثانية؟")}</legend>
       <div className="grid grid-cols-2 gap-2">
        {(["sell","sell-swap","swap","share"] as const).map(value=><label key={value}
         className={"flex min-h-12 cursor-pointer items-center gap-2 rounded-xl border p-3 text-xs font-semibold "+
          (form.offer===value?"border-[#79B89A] bg-[#EAF7EF] text-[#26684A]":"border-[#DCE8DD] bg-white")}>
         <input type="radio" name="offer" value={value} checked={form.offer===value} onChange={()=>set("offer",value)}
          className="accent-[#38815B]"/>
         {offerNames[value][ar?1:0]}
        </label>)}
       </div>
      </fieldset>
      {(form.offer==="sell"||form.offer==="sell-swap")&&<label className="block text-xs font-bold">{t("Asking price in JOD","سعر البيع بالدينار")} *
       <input className={input} value={form.price} onChange={e=>set("price",e.target.value)} inputMode="decimal"
        type="number" step=".01" min=".01" max="100000" placeholder="35.00" required/></label>}
      {(form.offer==="swap"||form.offer==="sell-swap")&&<div className="rounded-xl border border-[#DBE8F0] bg-[#F3FAFF] p-3">
       <p className="flex items-center gap-2 text-xs font-bold text-[#38789C]"><Repeat2 className="size-4"/>{t("What would you like in exchange?","شو بتحب تاخد بدل هالغرض؟")}</p>
       <input className={input} value={form.wanted} maxLength={100} onChange={e=>set("wanted",e.target.value)}
        placeholder={t("E.g. books for ages 4–6 or a bigger bike","مثلاً: كتب لعمر ٤–٦ أو دراجة أكبر")}/>
       <label className="mt-2 flex min-h-10 items-center gap-2 text-xs">
        <input type="checkbox" className="size-4 accent-[#3A8C70]" checked={form.openOffers} onChange={e=>set("openOffers",e.target.checked)}/>
        {t("I'm open to other suitable offers","ممكن أفكر بعروض مناسبة ثانية")}
       </label>
      </div>}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
       <label className="block text-xs font-bold">{t("General area (optional)","المنطقة العامة (اختياري)")}
        <input className={input} maxLength={45} value={form.area} onChange={e=>set("area",e.target.value)}
         placeholder={t("E.g. Abdoun, Amman — not an address","مثلاً: عبدون، عمّان — مش عنوان بيت")}/></label>
       <label className="block text-xs font-bold">{t("A little about the item (optional)","تفاصيل بسيطة (اختياري)")}
        <textarea className={input} rows={2} maxLength={240} value={form.description} onChange={e=>set("description",e.target.value)}
         placeholder={t("Condition or what's included","الحالة أو القطع المرفقة")}/></label>
      </div>
      <div className="rounded-xl border border-dashed border-[#BAD5C2] bg-[#F7FBF5] p-3">
       <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-[#337651]">
        <Camera className="size-5"/>{t("Add one photo (optional)","أضف صورة واحدة (اختياري)")}
        <input type="file" accept="image/*" className="sr-only" disabled={imageBusy}
         onChange={async e=>{
          const file=e.target.files?.[0];e.target.value="";if(!file)return;
          setImageBusy(true);try{set("imageDataUrl",await shrinkPhoto(file));setError("");}
          catch(err){setError(err instanceof Error?err.message:t("Photo could not be used.","تعذّر استخدام الصورة."));}
          finally{setImageBusy(false);}
         }}/>
       </label>
       {form.imageDataUrl&&<div className="mt-2 flex items-center gap-3">
        <img src={form.imageDataUrl} alt={t("Selected item photo","صورة الغرض المختارة")} className="h-24 w-24 rounded-xl object-cover"/>
        <button type="button" onClick={()=>set("imageDataUrl",undefined)} className="min-h-11 text-xs font-bold text-[#99516A] underline">{t("Remove photo","احذف الصورة")}</button>
       </div>}
       <p className="mt-2 text-[11px] text-[#819084]">{t("Photo is resized and kept in this browser only. Avoid faces, school uniforms and address details.","الصورة تُصغّر وتُحفظ على هذا المتصفح فقط. تجنّب الوجوه والزي المدرسي والعناوين.")}</p>
      </div>
      <label className="flex items-start gap-2 text-xs text-[#657A6B]">
       <ShieldCheck className="mt-0.5 size-4 shrink-0"/>
       {t("Adult-only testing. Do not list car seats, safety helmets, medical items or recalled products. Inspect before any handover.",
       "التجربة للأهل البالغين فقط. لا تعرض مقاعد سيارة للأطفال أو خوذات سلامة أو معدات طبية أو منتجات مسحوبة. افحص الغرض قبل التسليم.")}
      </label>
      {error&&<p role="alert" className="rounded-lg bg-[#FFF1EE] p-2 text-sm text-[#9A4638]">{error}</p>}
      <button type="submit" disabled={!canSave||imageBusy}
       className="flex min-h-12 w-full items-center justify-center rounded-xl bg-[#33865E] px-4 text-sm font-bold text-white disabled:opacity-50">
       {imageBusy?t("Preparing photo…","عم نجهز الصورة…"):editing?t("Save changes","احفظ التعديلات"):t("Save my listing","احفظ الإعلان")}
      </button>
      <p className="text-center text-[11px] text-[#819084]">{t("Saved privately — not published to other families.","محفوظ بشكل خاص — مش منشور للعائلات الأخرى.")}</p>
     </form>
    </section>:pane==="offers"?<>
     <div className="flex flex-wrap items-center justify-between gap-2">
      <div>
       <h3 className="text-base font-extrabold text-[#2D6145]">{t("Your little treasures","كنوز عيلتك")}</h3>
       <p className="text-xs text-[#72877A]">{t(String(active.length)+" available on this device",String(active.length)+" إعلان متاح على هالجهاز")}</p>
      </div>
      <button type="button" onClick={fresh} className="flex min-h-11 items-center gap-2 rounded-full bg-[#34855E] px-4 text-sm font-bold text-white">
       <Plus className="size-4"/>{t("List an item","أضف غرض")}
      </button>
     </div>
     {listings.length>0&&<div className="grid gap-2 sm:grid-cols-[1fr_auto]">
      <label className="relative block"><Search className="absolute start-3 top-3.5 size-4 text-[#7A9484]"/>
       <input className={input+" ps-9"} placeholder={t("Search my items","ابحث بين أغراضي")} value={textSearch}
        onChange={e=>setTextSearch(e.target.value)} aria-label={t("Search listings","البحث في الإعلانات")}/></label>
      <select className={input} value={filter} onChange={e=>setFilter(e.target.value as typeof filter)} aria-label={t("Filter offer type","تصفية نوع الإعلان")}>
       <option value="all">{t("All types","كل الأنواع")}</option>
       {(["sell","sell-swap","swap","share"] as const).map(v=><option key={v} value={v}>{offerNames[v][ar?1:0]}</option>)}
      </select>
     </div>}
     {listings.length===0?<div className={card+" text-center"}>
      <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-[#F5EAF0] text-4xl">📚</div>
      <h3 className="mt-3 text-lg font-bold">{t("Every little treasure has another story","كل غرض إله حكاية جديدة")}</h3>
      <p className="mx-auto mt-2 max-w-lg text-sm text-[#72867A]">{t(
       "Start with books your children have finished or toys they've outgrown. List for sale, offer a swap, or Share the Joy.",
       "ابدأ بكتب خلصت العيلة قراءتها أو ألعاب كبروا عنها الأولاد. اعرضها للبيع أو التبادل أو شارك الفرحة.")}</p>
      <button type="button" onClick={fresh} className="mt-4 min-h-11 rounded-full bg-[#33865E] px-6 text-sm font-bold text-white">
       {t("Add my first item","ضيف أول غرض")}
      </button>
     </div>:shown.length===0?<p className={card}>{t("No listings match this filter.","ما في إعلانات مطابقة للبحث.")}</p>:
      <div className="grid gap-3 sm:grid-cols-2">{shown.map(item=><article key={item.id} className={card}>
       <div className="flex items-start gap-3">
        {item.imageDataUrl&&safeFindImage(item.imageDataUrl)?
         <img className="size-24 shrink-0 rounded-xl object-cover" alt={item.title} src={item.imageDataUrl}/>:
         <div className="grid size-24 shrink-0 place-items-center rounded-xl bg-[#F5F6EC] text-4xl" aria-hidden="true">
          {item.category==="books"?"📚":item.category==="toys"?"🧸":item.category==="clothes"?"👕":item.category==="bikes"?"🚲":item.category==="sports"?"🏀":item.category==="games"?"🧩":"🎁"}
         </div>}
        <div className="min-w-0 flex-1">
         <OfferTag offer={item.offer} ar={ar}/>
         <h4 className="mt-2 break-words text-base font-bold text-[#2B5640]">{item.title}</h4>
         <p className="text-xs text-[#77867A]">{conditionNames[item.condition][ar?1:0]} · {ageNames[item.age][ar?1:0]}</p>
         {item.priceJod!==undefined&&<strong className="mt-1 block text-sm text-[#397857]">{money(item.priceJod)}</strong>}
        </div>
       </div>
       {(item.offer==="swap"||item.offer==="sell-swap")&&<p className="mt-3 rounded-lg bg-[#F0F8FD] p-2 text-xs text-[#396B8A]">
        <Repeat2 className="me-1 inline size-4"/>{t("Would swap for: ","ممكن يتبادل مع: ")}{item.wanted||t("Other suitable offers","عروض مناسبة أخرى")}
        {item.openOffers?" · "+t("Open to ideas","منفتح على اقتراحات"):""}</p>}
       {item.area&&<p className="mt-2 text-xs text-[#698273]">📍 {item.area}</p>}
       {item.description&&<p className="mt-2 break-words text-sm text-[#5C6F62]">{item.description}</p>}
       {item.status==="completed"&&<p className="mt-2 flex items-center gap-1 text-sm font-bold text-[#39835D]"><CheckCircle2 className="size-4"/>{t("Completed (self-reported)","مكتمل حسب تسجيلك")}</p>}
       <div className="mt-3 flex flex-wrap gap-2 border-t border-[#E5ECE4] pt-3">
        <button type="button" className="min-h-10 rounded-lg border border-[#C5D9C8] px-3 text-xs font-semibold text-[#317450]" onClick={()=>edit(item)}>
         {t("Edit","عدّل")}</button>
        <button type="button" className="min-h-10 rounded-lg border border-[#C5D9C8] px-3 text-xs font-semibold text-[#317450]"
         onClick={()=>setListings(old=>changeFindStatus(old,item.id,item.status==="available"?"completed":"available"))}>
         {item.status==="available"?t("Mark completed","تم التسليم"):t("Make available again","أعد العرض")}</button>
        <button type="button" aria-label={t("Delete listing","حذف الإعلان")}
         onClick={()=>{if(window.confirm(t("Remove this listing from this device?","تحذف هالإعلان من هالجهاز؟")))setListings(old=>old.filter(x=>x.id!==item.id));}}
         className="ms-auto min-h-10 rounded-lg border border-[#F0DCE0] px-3 text-xs font-semibold text-[#99516A]">
         <Trash2 className="inline size-4"/> {t("Delete","احذف")}</button>
       </div>
      </article>)}</div>}
     <p className="rounded-xl bg-[#F6F9F2] p-3 text-xs leading-relaxed text-[#718474]">{t(
      "Preview only: no public feed, messaging, negotiations, payment collection or automatic Money entries. Do not mistake a completed listing for a verified sale or a saving.",
      "عرض تجريبي فقط: لا يوجد سوق عام أو مراسلة أو تفاوض أو تحصيل مال أو تسجيل تلقائي بالمالية. إتمام الإعلان ليس تأكيد بيع أو توفير مالي.")}</p>
    </>:<>
     <section className={card}>
      <h3 className="flex items-center gap-2 text-base font-extrabold text-[#2D654A]"><Search className="size-5"/>{t("What could your family use next?","شو بتحتاج عيلتك بعدين؟")}</h3>
      <p className="mt-1 text-xs text-[#75867A]">{t("Remember a need once. Later it could help match family-to-family offers, only with your permission.",
       "احفظ اللي عم تدور عليه مرة واحدة. لاحقاً ممكن يساعد بالمطابقة بين العائلات وبموافقتك فقط.")}</p>
      <form className="mt-3 space-y-3" onSubmit={saveWish}>
       <label className="block text-xs font-bold">{t("I'm looking for","عم بدور على")}
        <input className={input} maxLength={90} minLength={3} value={wishText} onChange={e=>setWishText(e.target.value)}
         placeholder={t("E.g. illustrated books for ages 4–6","مثلاً: كتب مصوّرة لعمر ٤–٦")} required/></label>
       <label className="block text-xs font-bold">{t("Category","الفئة")}
        <select className={input} value={wishCategory} onChange={e=>setWishCategory(e.target.value as FindCategory)}>
         {findCategories.map(v=><option key={v} value={v}>{categoryNames[v][ar?1:0]}</option>)}
        </select></label>
       {error&&<p role="alert" className="text-xs text-[#AC493D]">{error}</p>}
       <button className="min-h-11 rounded-xl bg-[#33865E] px-5 text-sm font-bold text-white" type="submit">
        <Plus className="me-1 inline size-4"/>{t("Remember this","تذكّر هالشي")}</button>
      </form>
     </section>
     {wishes.length===0?<p className={card+" text-sm text-[#657C6A]"}>{t("Nothing saved yet. Add something useful you're hoping to find.","بعدك ما أضفت شي. اكتب غرض بتتمنى تلاقيه.")}</p>:
      <div className="space-y-2">{wishes.map(w=><div className={card+" flex items-center gap-3"} key={w.id}>
       <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-[#F2F8E9] text-lg">✨</span>
       <div className="min-w-0 flex-1"><p className="break-words text-sm font-bold">{w.description}</p>
        <p className="text-xs text-[#72877A]">{categoryNames[w.category][ar?1:0]} · {t("Saved privately","محفوظ بشكل خاص")}</p></div>
       <button type="button" className="min-h-11 rounded-lg px-2 text-[#AC677B]"
        aria-label={t("Remove wish","احذف الطلب")}
        onClick={()=>setWishes(old=>old.filter(x=>x.id!==w.id))}><Trash2 className="size-4"/></button>
      </div>)}</div>}
     <div className="rounded-xl border border-[#DDE8DE] bg-[#F6FAF5] p-3 text-xs text-[#697F6D]">{t(
      "Real matching, proposals and private adult-to-adult messaging will require a reviewed accounts backend, consent and moderation. This first version only saves your preferences on this device.",
      "المطابقة الحقيقية والعروض والمراسلة بين الأهل تحتاج حسابات آمنة وموافقة ومراجعة محتوى. النسخة الحالية تحفظ طلباتك فقط على هذا الجهاز.")}</div>
    </>}
  </div>
 </AppShell>;
}
