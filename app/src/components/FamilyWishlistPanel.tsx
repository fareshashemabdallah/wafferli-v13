import {useState,type FormEvent} from "react";
import {Gift,Plus,ShoppingBasket,Trash2} from "lucide-react";
import {useI18n} from "@/lib/i18n";
import {useLocalState,uid,fmtJOD} from "@/lib/storage";
import {dateKey} from "@/lib/familyCalendar";
import {FAMILY_WISHLIST_KEY,makeWishlistItem,recordWishlistPrice,
 summarizeWishlistPrice,updateWishlistStatus,confirmRecurringPurchase,type WishlistItem,type WishlistKind} from "@/lib/familyWishlist";
import {Button} from "@/components/ui/button";
export function FamilyWishlistPanel({mode}:{mode:"gifts"|"shopping"}){
 const {lang}=useI18n(),ar=lang==="ar";
 const [list,setList,ready]=useLocalState<WishlistItem[]>(FAMILY_WISHLIST_KEY,[]);
 const [name,setName]=useState(""),[kind,setKind]=useState<WishlistKind>(mode==="gifts"?"gift":"household");
 const [date,setDate]=useState(""),[budget,setBudget]=useState("");
 const [recipient,setRecipient]=useState(""),[repeat,setRepeat]=useState("");
 const [priced,setPriced]=useState(""),[price,setPrice]=useState(""),[store,setStore]=useState("");
 const [checked,setChecked]=useState(dateKey(new Date())),[source,setSource]=useState("");
 const [error,setError]=useState("");
 if(!ready)return null;
 const visible=list.filter(i=>mode==="gifts"?i.kind==="gift":i.kind!=="gift");
 const add=(e:FormEvent)=>{
  e.preventDefault();setError("");
  if(list.length>=150){setError("Maximum 150 saved items");return;}
  if(repeat&&!date){setError(ar?"حدّد تاريخ أول شراء لتكرار التذكير.":"Choose the first due date for a repeating purchase.");return;}
  const b=budget.trim()?Number(budget):undefined;
  const t=makeWishlistItem({id:uid(),name,kind,...(date?{targetDate:date}:{}),
   ...(b!==undefined?{budgetJod:b}:{}),
   ...(recipient.trim()?{recipientLabel:recipient}:{}),
   ...(repeat?{repeatMonths:Number(repeat) as 1|3|6|12}:{})});
  if(!t){setError(ar?"أدخل تفاصيل صحيحة.":"Enter valid item details.");return;}
  setList(old=>[t,...old]);setName("");setDate("");setBudget("");setRecipient("");setRepeat("");
 };
 const savePrice=(e:FormEvent,item:WishlistItem)=>{
  e.preventDefault();setError("");
  try{
   const updated=recordWishlistPrice(item,{id:uid(),amountJod:Number(price),
    checkedAt:checked,store,...(source.trim()?{sourceUrl:source}:{})});
   setList(old=>old.map(i=>i.id===item.id?updated:i));
   setPriced("");setPrice("");setStore("");setSource("");
  }catch(err){setError(err instanceof Error?err.message:String(err));}
 };
 return <section className="editorial-card mt-5 p-4 sm:p-5"
  aria-label={ar?"قائمة رغبات الأسرة":"Family wishlist and price history"}>
  <div className="flex items-start gap-3">
   {mode==="gifts"?<Gift className="size-6 text-brand"/>:<ShoppingBasket className="size-6 text-brand"/>}
   <div>
    <h2 className="font-semibold">{mode==="gifts"?(ar?"قائمة الهدايا والمناسبات":"Gift and occasion wishlist"):
     (ar?"قائمة المشتريات القادمة":"Upcoming family purchase wishlist")}</h2>
    <p className="mt-1 text-xs text-muted-foreground">{ar?
     "احتفظ بالأفكار والتكاليف التي شاهدتها بنفسك. لا توجد أسعار مباشرة أو حجوزات أو طلبات تلقائية.":
     "Plan what you want to buy and record prices you checked yourself. No live product feeds, purchases, bookings or automatic reorders."}</p>
   </div>
  </div>
  <form onSubmit={add} className="mt-4 grid gap-3 rounded-xl bg-[#F7FAF5] p-3 sm:grid-cols-2">
   <label className="text-xs font-semibold sm:col-span-2">{ar?"ما الذي تحتاج إليه؟":"What do you need?"}
    <input required maxLength={120} value={name} onChange={e=>setName(e.target.value)}
     className="mt-1 min-h-11 w-full rounded-xl border bg-white px-3 text-sm"/>
   </label>
   {mode==="shopping"&&<label className="text-xs font-semibold">{ar?"الفئة":"Category"}
    <select value={kind} onChange={e=>setKind(e.target.value as WishlistKind)}
     className="mt-1 min-h-11 w-full rounded-xl border bg-white px-3">
     <option value="household">{ar?"المنزل":"Household"}</option>
     <option value="children">{ar?"مستلزمات الأطفال":"Children's supplies"}</option>
     <option value="other">{ar?"غير ذلك":"Other"}</option>
    </select>
   </label>}
   <label className="text-xs font-semibold">{ar?"تاريخ الحاجة (اختياري)":"Needed by (optional)"}
    <input type="date" value={date} onChange={e=>setDate(e.target.value)}
     className="mt-1 min-h-11 w-full rounded-xl border bg-white px-3"/>
   </label>
   <label className="text-xs font-semibold">{ar?"حدّ أعلى للتكلفة JOD (اختياري)":"Budget ceiling JOD (optional)"}
    <input type="number" min="0" max="100000" step=".01" value={budget} onChange={e=>setBudget(e.target.value)}
     className="mt-1 min-h-11 w-full rounded-xl border bg-white px-3"/>
   </label>
   {mode==="gifts"?<label className="text-xs font-semibold">{ar?"رمز المستلم (بدون بيانات حساسة)":"Recipient label (avoid personal details)"}
    <input maxLength={60} value={recipient} onChange={e=>setRecipient(e.target.value)}
     className="mt-1 min-h-11 w-full rounded-xl border bg-white px-3"/>
   </label>:<label className="text-xs font-semibold">{ar?"دورية الشراء (اختيارية)":"Repeat planning reminder (optional)"}
    <select value={repeat} onChange={e=>setRepeat(e.target.value)}
     className="mt-1 min-h-11 w-full rounded-xl border bg-white px-3">
     <option value="">{ar?"مرة واحدة":"One time"}</option>
     {[1,3,6,12].map(n=><option key={n} value={n}>{n} {ar?"شهر":"months"}</option>)}
    </select>
   </label>}
   <div className="sm:col-span-2"><Button type="submit"><Plus className="size-4"/>{ar?"أضف للقائمة":"Add to wishlist"}</Button></div>
  </form>
  {error&&<p role="alert" className="mt-3 text-xs text-destructive">{error}</p>}
  <div className="mt-4 space-y-3">
   {visible.length===0&&<p className="text-xs text-muted-foreground">{ar?"ما في عناصر محفوظة بعد.":"No saved items in this list yet."}</p>}
   {visible.slice(0,80).map(item=>{
    const summary=summarizeWishlistPrice(item);
    return <article key={item.id} className="rounded-xl border border-[#E1E9DE] bg-white p-3">
     <div className="flex flex-wrap items-start justify-between gap-2">
      <div>
       <h3 className="text-sm font-semibold">{item.name}</h3>
       <p className="mt-1 text-xs text-muted-foreground">
        {item.targetDate??(ar?"بدون موعد":"No date")} {item.budgetJod!==undefined?" · "+fmtJOD(item.budgetJod):""}
        {item.recipientLabel?" · "+item.recipientLabel:""}
        {item.repeatMonths?" · "+(ar?"راجع كل ":"Review every ")+item.repeatMonths+(ar?" شهر":" months"):""}
        {item.lastPurchasedOn?" · "+(ar?"آخر تأكيد شراء: ":"Last self-confirmed purchase: ")+item.lastPurchasedOn:""}
       </p>
       <p className="mt-1 text-xs text-muted-foreground">
        {summary.latest?(ar?"آخر سعر أدخلته ":"Latest recorded price ")+fmtJOD(summary.latest.amountJod)+" · "+summary.latest.checkedAt:
         (ar?"لم تسجل سعراً بعد":"No recorded price yet")}
        {summary.changeJod!==null?" · "+(ar?"التغير المسجل ":"Recorded difference ")+fmtJOD(summary.changeJod):""}
       </p>
      </div>
      <div className="flex items-center gap-1">
       <button type="button" className="min-h-10 rounded-lg bg-[#ECF4EA] px-2 text-xs font-semibold text-brand"
        onClick={()=>{
         setError("");
         if(item.repeatMonths&&item.status==="considering"){
          try{
           const next=confirmRecurringPurchase(item);
           setList(old=>old.map(x=>x.id===item.id?next:x));
          }catch(e){setError(e instanceof Error?e.message:String(e));}
          return;
         }
         setList(old=>old.map(x=>x.id===item.id?
          updateWishlistStatus(x,x.status==="purchased"?"considering":"purchased"):x));
        }}>
        {item.repeatMonths&&item.status==="considering"?
         (ar?"اشتريتُ لهذه الدورة — حدّث الموعد":"Bought this cycle — schedule next"):
         item.status==="purchased"?(ar?"أعد للقائمة":"Reopen"):(ar?"اشتريتُ بنفسي":"I purchased")}
       </button>
       <button type="button" aria-label={ar?"حذف":"Delete"}
        className="grid min-h-10 min-w-10 place-items-center text-[#985F4B]"
        onClick={()=>{
         if(window.confirm(ar?"حذف هذا العنصر من الجهاز؟":"Remove this item from this device?"))
          setList(old=>old.filter(x=>x.id!==item.id));
        }}><Trash2 className="size-4"/></button>
      </div>
     </div>
     {item.status==="considering"&&<>
      <button type="button" className="mt-2 min-h-10 text-xs font-semibold text-brand underline"
       onClick={()=>setPriced(x=>x===item.id?"":item.id)}>
       {ar?"سجل سعراً شاهدته بنفسك":"Record a price you checked"}
      </button>
      {priced===item.id&&<form onSubmit={e=>savePrice(e,item)} className="mt-2 grid gap-2 rounded-lg bg-[#F6F9F3] p-3 sm:grid-cols-2">
       <label className="text-xs font-semibold">{ar?"التكلفة الكاملة JOD":"Total price JOD"}
        <input required type="number" min="0.01" max="100000" step=".01" value={price} onChange={e=>setPrice(e.target.value)}
         className="mt-1 min-h-11 w-full rounded-lg border bg-white px-2"/>
       </label>
       <label className="text-xs font-semibold">{ar?"المحل أو المصدر":"Store or source"}
        <input required maxLength={90} value={store} onChange={e=>setStore(e.target.value)}
         className="mt-1 min-h-11 w-full rounded-lg border bg-white px-2"/>
       </label>
       <label className="text-xs font-semibold">{ar?"تاريخ التحقق":"Date you checked"}
        <input required type="date" value={checked} onChange={e=>setChecked(e.target.value)}
         className="mt-1 min-h-11 w-full rounded-lg border bg-white px-2"/>
       </label>
       <label className="text-xs font-semibold">{ar?"رابط HTTPS اختياري":"Public HTTPS source (optional)"}
        <input type="url" maxLength={700} value={source} onChange={e=>setSource(e.target.value)}
         className="mt-1 min-h-11 w-full rounded-lg border bg-white px-2"/>
       </label>
       <div className="sm:col-span-2"><Button type="submit">{ar?"احفظ السعر":"Save price check"}</Button></div>
      </form>}
     </>}
     {item.prices.length>0&&<details className="mt-2 text-xs"><summary className="cursor-pointer font-semibold text-brand">{ar?"السجل":"Price history"} ({item.prices.length})</summary>
      {item.prices.map(p=><p key={p.id} className="mt-1 text-muted-foreground">
       {p.checkedAt} · {p.store} · {fmtJOD(p.amountJod)} {p.sourceUrl&&<a href={p.sourceUrl} target="_blank" rel="noopener noreferrer" className="underline">{ar?"المصدر":"Source"}</a>}</p>)}
     </details>}
    </article>;
   })}
  </div>
  <p className="mt-3 text-[11px] text-muted-foreground">{ar?
   "تغيّر الأسعار المسجلة ليس توفيراً مؤكداً. للمشتريات المتكررة، أنت تؤكد كل دورة بنفسك ويُحدّث الموعد التالي فقط؛ لا طلب ولا دفع ولا خصم مالي.":
   "Recorded price changes are not verified savings. For repeating items, you must confirm each cycle yourself; only the next planning date changes. No purchase, charge or financial deduction is made."}</p>
 </section>;
}
