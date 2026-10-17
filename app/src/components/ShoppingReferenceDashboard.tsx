import {useRef,useState,type CSSProperties,type ChangeEvent,type FormEvent} from "react";
import {Link} from "@tanstack/react-router";
import {Check,CheckCircle2,ChevronRight,Heart,ImagePlus,Palette,Plus,Search,ShoppingBasket,SlidersHorizontal,Sparkles,Trash2,X} from "lucide-react";
import {useI18n} from "@/lib/i18n";
import {useLocalState,fmtJOD,uid,writeLocal} from "@/lib/storage";
import {FAMILY_WISHLIST_KEY,makeWishlistItem,updateWishlistStatus,summarizeWishlistPrice,type WishlistItem,type WishlistKind} from "@/lib/familyWishlist";
import {isSampleBasketEntry,type BasketEntry} from "@/lib/basketRecording";
import {makeLocalCartoonPortrait,validateCartoonPhoto,type CartoonPhotoError} from "@/lib/shoppingCartoon";
import {sophiaCartoon} from "./sophiaCartoon";
import {shoppingThemeColor,wishlistTitle} from "./ShoppingWishlistHome";

type ShoppingTheme={preset:string;custom:string};
const themePresets=[
 {id:"pink",en:"Pink",ar:"وردي",color:"#FF4B91"},{id:"blue",en:"Blue",ar:"أزرق",color:"#3B82F6"},
 {id:"white",en:"White",ar:"أبيض",color:"#F3F4F6"},{id:"purple",en:"Purple",ar:"بنفسجي",color:"#9D70E9"},
 {id:"mint",en:"Mint",ar:"نعناعي",color:"#37B99B"},{id:"yellow",en:"Yellow",ar:"أصفر",color:"#F3B73E"},
 {id:"orange",en:"Orange",ar:"برتقالي",color:"#FA8744"},{id:"coral",en:"Coral",ar:"مرجاني",color:"#F47E7C"},
 {id:"navy",en:"Navy",ar:"كحلي",color:"#506CAD"},{id:"sage",en:"Sage",ar:"مريمي",color:"#87A977"}
] as const;
type Filter="all"|"needs"|"wants"|"gifts"|"outfits"|"activities"|"books";
const filters:{id:Filter;en:string;ar:string;icon:string}[]=[
 {id:"all",en:"All Items",ar:"الكل",icon:"🛍️"},{id:"needs",en:"Needs",ar:"احتياجات",icon:"♡"},
 {id:"wants",en:"Wants",ar:"رغبات",icon:"☆"},{id:"gifts",en:"Gifts",ar:"هدايا",icon:"🎁"},
 {id:"outfits",en:"Outfits",ar:"ملابس",icon:"👕"},{id:"activities",en:"Activities",ar:"أنشطة",icon:"⚽"},
 {id:"books",en:"Books & Learning",ar:"كتب وتعلّم",icon:"📖"}
];
const ideas=[
 {en:"Children's clothes",ar:"ملابس الأطفال",icon:"👗",shade:"#FDEBF1"},
 {en:"Shoes",ar:"أحذية",icon:"👟",shade:"#F1EBFF"},
 {en:"Toys & games",ar:"ألعاب",icon:"🧸",shade:"#FFF1DD"},
 {en:"Books & learning",ar:"كتب وتعليم",icon:"📚",shade:"#E9F6FA"},
 {en:"Outdoor play",ar:"اللعب في الخارج",icon:"🛴",shade:"#ECF6EC"}
];
const categories=[
 {en:"Kids Clothes",ar:"ملابس الأطفال",icon:"👕",to:"/explore/market" as const,bg:"#FCE9EF"},
 {en:"Toys & Games",ar:"الألعاب",icon:"🧸",to:"/explore/market" as const,bg:"#E8F8EB"},
 {en:"Groceries",ar:"البقالة",icon:"🛒",to:"/explore/shopping" as const,bg:"#FFF4D9"},
 {en:"School Supplies",ar:"المدرسة",icon:"📖",to:"/explore/market" as const,bg:"#F1E9FF"},
 {en:"Gifts",ar:"الهدايا",icon:"🎁",to:"/occasions" as const,bg:"#FCE7ED"},
 {en:"More",ar:"المزيد",icon:"•••",to:"/explore" as const,bg:"#E9EFFB"}
];
const panel="rounded-[1.55rem] border border-[#F2E7EA] bg-white/95 p-4 shadow-[0_17px_38px_-33px_rgba(57,34,63,.32)] sm:p-5";
function fitsFilter(item:WishlistItem,filter:Filter){
 if(filter==="all")return true;
 if(filter==="needs")return item.kind==="household";
 if(filter==="wants")return item.kind==="children"||item.kind==="other";
 if(filter==="gifts")return item.kind==="gift";
 const name=item.name.toLowerCase();
 if(filter==="outfits")return item.kind==="children"&&/cloth|dress|shirt|shoe|jacket|uniform|لباس|ملابس|حذاء|فستان/.test(name);
 if(filter==="books")return /book|read|learning|school|notebook|كتاب|قراءة|مدرسة/.test(name);
 return /sport|activity|play|game|swim|كرة|نشاط|سباحة|لعبة/.test(name);
}
export function ShoppingReferenceDashboard(){
 const {lang}=useI18n(),ar=lang==="ar";const tr=(en:string,arabic:string)=>ar?arabic:en;
 const [owner,setOwner,ownerReady]=useLocalState<string>("shoppingWishlistOwner","Sophia");
 const [theme,setTheme,themeReady]=useLocalState<ShoppingTheme>("shoppingWishlistTheme",{preset:"pink",custom:"#FF4B91"});
 const [cartoon,setCartoon,avatarReady]=useLocalState<string>("shoppingWishlistCartoon","");
 const [wishlist,setWishlist,wishReady]=useLocalState<WishlistItem[]>(FAMILY_WISHLIST_KEY,[]);
 const [basket,setBasket,basketReady]=useLocalState<BasketEntry[]>("shopping",[]);
 const [isCustomizing,setCustomizing]=useState(false);
 const [candidate,setCandidate]=useState("");
 const [fileBusy,setFileBusy]=useState(false);
 const [avatarError,setAvatarError]=useState<CartoonPhotoError|null>(null);
 const [avatarMessage,setAvatarMessage]=useState("");
 const [filter,setFilter]=useState<Filter>("all");
 const [search,setSearch]=useState("");
 const [newWish,setNewWish]=useState("");
 const [newBasket,setNewBasket]=useState("");
 const [error,setError]=useState("");
 const [kind,setKind]=useState<WishlistKind>("children");
 const fileInput=useRef<HTMLInputElement>(null);
 const ready=ownerReady&&themeReady&&avatarReady&&wishReady&&basketReady;
 const named=typeof owner==="string"?owner.trim().slice(0,32):"";
 const title=wishlistTitle(named,ar);
 const color=shoppingThemeColor(theme);
 const ink=theme.preset==="white"?"#36425C":color;
 const variables={"--wish-accent":color,"--wish-pale":"color-mix(in srgb, "+color+" 9%, white)",
  "--wish-soft":"color-mix(in srgb, "+color+" 22%, white)"} as CSSProperties;
 const avatar=cartoon&&/^data:image\/(webp|png);base64,/.test(cartoon)?cartoon:sophiaCartoon;
 const currentWishlist=wishlist.filter(i=>i.status!=="removed");
 const shownWish=currentWishlist.filter(item=>fitsFilter(item,filter)&&item.name.toLowerCase().includes(search.trim().toLowerCase()));
 const shownBasket=basket.filter(i=>!isSampleBasketEntry(i)&&i.name.trim()&&i.name.toLowerCase().includes(search.trim().toLowerCase()));
 function avatarErrorText(code:CartoonPhotoError){
  return code==="format"?tr("Choose a JPEG, PNG, WebP, AVIF or HEIC image.","اختر صورة JPEG أو PNG أو WebP أو AVIF أو HEIC."):
   code==="size"?tr("Choose a photo smaller than 8 MB.","اختر صورة أقل من 8 ميغابايت."):
   code==="storage"?tr("Unable to save this picture on this device. Free some browser storage and try again.","تعذر حفظ الصورة على هذا الجهاز. حرّر مساحة تخزين وأعد المحاولة."):
   tr("Unable to process this photo. Please choose another image.","تعذر معالجة الصورة. اختر صورة أخرى.");
 }
 async function selectPhoto(e:ChangeEvent<HTMLInputElement>){
  const file=e.target.files?.[0];e.target.value="";if(!file)return;
  setAvatarMessage("");setAvatarError(null);setCandidate("");
  const invalid=validateCartoonPhoto(file);
  if(invalid){setAvatarError(invalid);return;}
  setFileBusy(true);
  try{setCandidate(await makeLocalCartoonPortrait(file));}
  catch(err){setAvatarError(err instanceof Error&&["format","size","decode","processing"].includes(err.message)?
   err.message as CartoonPhotoError:"processing");}
  finally{setFileBusy(false);}
 }
 function applyCandidate(){
  if(!candidate||!ready)return;
  // Storage hook refuses changes when browser storage is full and issues its global warning.
  try{
   if(candidate.length>900_000){setAvatarError("storage");return;}
   if(!writeLocal("shoppingWishlistCartoon",candidate)){setAvatarError("storage");return;}
   setCartoon(candidate);setCandidate("");setAvatarError(null);
   setAvatarMessage(tr("Cartoon-style picture applied on this device.","تم اعتماد الصورة الكرتونية على هذا الجهاز."));
  }catch{setAvatarError("storage");}
 }
 function resetAvatar(){
  if(!ready)return;
  setCartoon("");setCandidate("");setAvatarError(null);
  setAvatarMessage(tr("Default Sophia illustration restored.","تمت استعادة صورة صوفيا الافتراضية."));
 }
 function addWish(e:FormEvent){
  e.preventDefault();setError("");
  if(!ready)return;
  if(wishlist.length>=150){setError(tr("Wishlist limit reached.","وصلت لقائمة الرغبات القصوى."));return;}
  const item=makeWishlistItem({id:uid(),name:newWish,kind});
  if(!item){setError(tr("Enter at least two characters.","أدخل حرفين على الأقل."));return;}
  setWishlist(v=>[item,...v]);setNewWish("");setFilter("all");
 }
 function addNeed(e:FormEvent){
  e.preventDefault();setError("");
  if(!ready)return;
  const name=newBasket.trim().slice(0,60);
  if(name.length<2){setError(tr("Enter at least two characters.","أدخل حرفين على الأقل."));return;}
  setBasket(v=>[...v,{id:uid(),name,qty:1,price:0,done:false}]);setNewBasket("");
 }
 function addIdea(name:string){
  if(!ready)return;
  if(wishlist.length>=150){setError(tr("Wishlist limit reached.","وصلت لقائمة الرغبات القصوى."));return;}
  if(wishlist.some(i=>i.name===name&&i.status==="considering"))return;
  const item=makeWishlistItem({id:uid(),name,kind:"children"});
  if(item)setWishlist(v=>[item,...v]);
 }
 return <div dir={ar?"rtl":"ltr"} style={variables} className="space-y-3 font-sans text-[#1E2B4B]">
  <div className="flex flex-wrap gap-2 sm:flex-nowrap">
   <label className="flex min-h-12 min-w-[175px] flex-1 items-center gap-2 rounded-full border border-[#F2E7EA] bg-white/95 px-4 shadow-sm">
    <Search className="size-[19px] shrink-0 text-[#7D8597]"/><span className="sr-only">{tr("Search saved shopping items","ابحث في المشتريات المحفوظة")}</span>
    <input type="search" value={search} onChange={e=>setSearch(e.target.value)} placeholder={tr("Search your saved items…","ابحث في العناصر المحفوظة…")}
     className="w-full min-w-0 bg-transparent py-2.5 text-sm outline-none"/>
   </label>
   <Link to="/explore/market" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-[#F2E7EA] bg-white px-4 text-xs font-bold text-[#57667D]">
    <Search className="size-4"/>{tr("Find products","استكشف المنتجات")}</Link>
  </div>
  <section className="relative isolate grid min-h-[260px] grid-cols-[minmax(0,44%)_minmax(0,56%)] overflow-hidden rounded-[1.65rem] border border-[#FFECF0] px-3 sm:min-h-[280px] sm:gap-3 sm:px-6 lg:min-h-[300px]"
   style={{background:"radial-gradient(circle at 8% 18%, var(--wish-soft), transparent 55%),linear-gradient(120deg,var(--wish-soft),#FFF7F8 70%,var(--wish-pale))"}}>
   <span aria-hidden="true" className="absolute end-[8%] top-4 text-4xl opacity-35">♥</span>
   <div className="relative min-h-[220px] self-end sm:min-h-[260px]">
    <img src={avatar} alt={cartoon?tr("Your selected cartoon-style portrait","الصورة الكرتونية المختارة"):tr("Cartoon of Sophia with a fruit drink","رسم كرتوني لصوفيا تحمل عصيراً")}
     className="pointer-events-none absolute inset-x-0 bottom-0 h-full w-full object-contain object-bottom drop-shadow-[0_10px_12px_rgba(113,54,66,.18)]"
     style={cartoon?{borderRadius:"40% 40% 0 0"}:{}} loading="eager"/>
   </div>
   <div className="relative z-10 flex min-w-0 flex-col items-start justify-center py-9 sm:py-10">
    <p className="mb-3 text-xs font-black uppercase tracking-widest" style={{color:ink}}>{tr("For the little things that matter ♥","للحظات الحلوة ♥")}</p>
    <h1 className="break-words text-[clamp(1.65rem,4.2vw,3.4rem)] font-black leading-[1.05] tracking-[-.06em]">
     {ar?<>{tr("Wishlist","قائمة رغبات")} <span style={{color:ink}}>{named||"العائلة"}</span></>:<><span style={{color:ink}}>{named?named+"’s":"Family"}</span> Wishlist</>}
    </h1>
    <p className="mt-3 max-w-md text-xs font-medium leading-relaxed text-[#5F6578] sm:text-sm">
     {tr("All the things your family loves, needs and dreams about.","كل ما تحبه العائلة وتحتاجه وتحلم به، في مكان واحد.")}
    </p>
    <button type="button" onClick={()=>setCustomizing(true)} className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-full border border-white bg-white/90 px-3 text-xs font-bold shadow-sm"
     style={{color:ink}}><Palette className="size-4"/>{tr("Change Theme & Picture","غيّر اللون والصورة")}</button>
   </div>
  </section>
  {isCustomizing&&<section aria-label={tr("Personalize Shopping & Wishlist","خصّص المشتريات وقائمة الرغبات")} className={panel}>
   <div className="flex items-center justify-between gap-3"><h2 className="text-lg font-black">{tr("Personalize your wishlist","خصّص قائمة رغباتك")}</h2>
    <button type="button" onClick={()=>setCustomizing(false)} aria-label={tr("Close personalization","إغلاق التخصيص")} className="grid size-11 place-items-center rounded-full bg-[#FFF3F6]"><X className="size-5"/></button></div>
   <label className="mt-4 block text-sm font-semibold">{tr("Name before Wishlist","الاسم قبل قائمة الرغبات")}
    <input value={named} maxLength={32} placeholder={tr("Sophia, Faris, Family…","صوفيا، فارس، العائلة…")}
     onChange={e=>setOwner(e.target.value.replace(/[\u0000-\u001f\u007f]/g," ").slice(0,32))}
     className="mt-1 block min-h-11 w-full rounded-xl border border-[#EEE0E8] bg-white px-3 text-base"/>
   </label>
   <p className="mt-1 text-xs text-[#717B8F]">{tr("Name changes the title only; family records stay together.","الاسم يغيّر العنوان فقط، وتبقى سجلات العائلة مشتركة.")}</p>
   <h3 className="mt-5 text-sm font-bold">{tr("Color Theme","اللون")}</h3>
   <div role="group" aria-label={tr("Color Theme","اللون")} className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-5">
    {themePresets.map(p=><button key={p.id} type="button" aria-pressed={theme.preset===p.id} onClick={()=>setTheme(x=>({...x,preset:p.id}))}
     className="flex min-h-11 items-center gap-2 rounded-xl border-2 bg-white px-2 text-xs font-bold"
     style={{borderColor:theme.preset===p.id?ink:"#E7E7ED"}}>
     <span className="size-5 shrink-0 rounded-full border border-slate-200" style={{background:p.color}}/>{ar?p.ar:p.en}
     {theme.preset===p.id&&<Check className="ms-auto size-4"/>}</button>)}
   </div>
   <label className="mt-3 inline-flex items-center gap-2 text-sm font-bold">
    <input type="color" aria-label={tr("Custom color","لون مخصص")} value={/^#[0-9a-f]{6}$/i.test(theme.custom)?theme.custom:"#FF4B91"}
     onChange={e=>setTheme({preset:"custom",custom:e.target.value})} className="size-11 cursor-pointer"/>
    {tr("Choose any color","اختر أي لون")}
   </label>
   <div className="mt-5 border-t border-[#F1E5EA] pt-5">
    <h3 className="flex items-center gap-2 text-sm font-bold"><ImagePlus className="size-5" style={{color:ink}}/>{tr("Cartoon character photo","صورة شخصية كرتونية")}</h3>
    <p className="mt-2 text-xs leading-relaxed text-[#636D84]">
     {tr("Choose a photo and make an instant cartoon-style version on your device. This is a local artistic effect, not AI character generation. No original photo is uploaded or saved.",
      "اختر صورة لإنشاء تأثير كرتوني فوري على جهازك. هذا تأثير فني محلي وليس إنشاء شخصية بالذكاء الاصطناعي. لا يتم رفع الصورة الأصلية أو حفظها.")}
    </p>
    <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp,image/avif,image/heic,image/heif"
     aria-label={tr("Upload photo for cartoon","ارفع صورة لتحويلها إلى نمط كرتوني")} onChange={selectPhoto} className="sr-only"/>
    <div className="mt-3 flex flex-wrap items-center gap-2">
     <button type="button" disabled={fileBusy} onClick={()=>fileInput.current?.click()}
      className="inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-bold text-white disabled:opacity-60" style={{background:theme.preset==="white"?"#35405C":color}}>
      <ImagePlus className="size-4"/>{fileBusy?tr("Cartoonizing…","جاري التحويل…"):tr("Upload & cartoonize","ارفع وحوّل إلى كرتون")}</button>
     <button type="button" disabled={!avatarReady} onClick={resetAvatar} className="inline-flex min-h-11 items-center rounded-full border border-[#E5E3EC] bg-white px-4 text-xs font-bold">
      <Trash2 className="me-1 size-4"/>{tr("Reset to Sophia","استعادة صوفيا")}</button>
    </div>
    {candidate&&<div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl bg-[#FFF5F7] p-3">
     <img src={candidate} alt={tr("Your cartoon-style preview","معاينة التأثير الكرتوني")} className="size-32 rounded-2xl object-cover"/>
     <div className="space-y-2"><p className="text-sm font-semibold">{tr("Preview before replacing Sophia","عاين الصورة قبل استبدال صوفيا")}</p>
      <button type="button" onClick={applyCandidate} className="min-h-11 rounded-full bg-[#245B46] px-5 text-sm font-bold text-white">{tr("Use this cartoon","اعتمد هذه الصورة")}</button>
      <button type="button" onClick={()=>setCandidate("")} className="ms-2 min-h-11 rounded-full px-3 text-xs font-bold">{tr("Cancel","إلغاء")}</button>
     </div></div>}
    {avatarError&&<p role="alert" className="mt-2 rounded-xl bg-red-50 p-3 text-xs text-red-700">{avatarErrorText(avatarError)}</p>}
    {avatarMessage&&<p role="status" className="mt-2 text-xs font-bold text-[#277858]">{avatarMessage}</p>}
    <p className="mt-2 text-[11px] text-slate-500">{tr("Your saved cartoon stays on this browser only; it may be included in your own browser-local backup. Avoid personal photos on shared devices.",
     "الصورة الكرتونية تُحفظ في هذا المتصفح فقط وقد تدخل ضمن النسخة الاحتياطية المحلية. تجنّب الصور الشخصية على الأجهزة المشتركة.")}</p>
   </div>
  </section>}
  <nav aria-label={tr("Shopping categories","فئات التسوق")} className="grid grid-cols-3 gap-2 sm:grid-cols-6">
   {categories.map(c=><Link key={c.en} to={c.to} className="flex min-h-[92px] flex-col items-center justify-center gap-2 rounded-[1.2rem] px-2 text-center text-[11px] font-bold shadow-sm transition hover:-translate-y-0.5"
    style={{backgroundColor:c.bg}}><span className="text-3xl" aria-hidden="true">{c.icon}</span>{ar?c.ar:c.en}</Link>)}
  </nav>
  <section className={panel} aria-label={tr("Saved wishlist","قائمة الرغبات المحفوظة")}>
   <div className="flex flex-wrap items-center justify-between gap-3">
    <h2 className="flex items-center gap-2 text-lg font-black"><Heart className="size-5" fill={color} color={color}/>{title}</h2>
    <button type="button" onClick={()=>{const el=document.getElementById("shopping-tools") as HTMLDetailsElement|null;if(el){el.open=true;el.scrollIntoView?.({behavior:"smooth"});}}} className="inline-flex min-h-10 items-center gap-1 text-xs font-bold" style={{color:ink}}>
     {tr("Price history & more","سجل الأسعار والمزيد")}<ChevronRight className="size-4"/></button>
   </div>
  <div role="group" aria-label={tr("Wishlist filters","تصفية قائمة الرغبات")} className="flex flex-wrap gap-2">
   {filters.map(f=><button type="button" key={f.id} aria-pressed={filter===f.id} onClick={()=>setFilter(f.id)}
    className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-[#F2E5E9] px-3 text-[11px] font-bold shadow-sm sm:px-4"
    style={{background:filter===f.id?color:"white",color:filter===f.id?(theme.preset==="white"?"#24304B":"white"):"#657083"}}>
    <span aria-hidden="true">{f.icon}</span>{ar?f.ar:f.en}</button>)}
  </div>
   <form onSubmit={addWish} className="mt-3 grid gap-2 rounded-2xl bg-[#FFF9FB] p-3 sm:grid-cols-[1fr_auto_auto]">
    <input required minLength={2} maxLength={120} aria-label={tr("Add a wish","أضف رغبة")} value={newWish} onChange={e=>setNewWish(e.target.value)}
     placeholder={tr("Add an item to the wishlist…","أضف شيئاً لقائمة الرغبات…")} className="min-h-11 min-w-0 rounded-xl border border-[#F0E6EB] bg-white px-3 text-sm"/>
    <select aria-label={tr("Wish category","فئة الرغبة")} value={kind} onChange={e=>setKind(e.target.value as WishlistKind)} className="min-h-11 rounded-xl border border-[#F0E6EB] bg-white px-2 text-xs">
     <option value="children">{tr("Children","الأطفال")}</option><option value="household">{tr("Needs","الاحتياجات")}</option>
     <option value="gift">{tr("Gifts","الهدايا")}</option><option value="other">{tr("Other","أخرى")}</option>
    </select>
    <button type="submit" disabled={!ready} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-4 text-xs font-bold text-white disabled:opacity-50"
     style={{background:theme.preset==="white"?"#36425C":color}}><Plus className="size-4"/>{tr("Add","أضف")}</button>
   </form>
   {!ready?<p className="mt-4 text-sm text-slate-500">{tr("Loading your saved items…","تحميل العناصر المحفوظة…")}</p>:
    shownWish.length===0?<p className="mt-4 rounded-xl bg-[var(--wish-pale)] p-4 text-sm text-slate-500">
     {tr("No matching saved items yet. Add your own — examples and prices are not invented.","لا توجد عناصر محفوظة مطابقة. أضف عناصر حقيقية دون أسعار وهمية.")}</p>:
    <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
     {shownWish.slice(0,18).map(item=>{
      const checked=summarizeWishlistPrice(item).latest;
      return <article key={item.id} className="flex min-w-0 flex-col overflow-hidden rounded-[1.25rem] border border-[#EEE9EE] bg-white p-2.5 shadow-sm">
       <div className="relative grid aspect-[1.25] place-items-center rounded-[1rem] bg-[var(--wish-pale)]">
        <span className="text-[4rem] drop-shadow-sm" aria-hidden="true">{item.kind==="gift"?"🎁":item.kind==="children"?"🧸":item.kind==="household"?"🛒":"⭐"}</span>
        <Heart className="absolute end-2 top-2 size-5" fill={color} color={color}/>
       </div>
       <div className="flex min-w-0 flex-1 flex-col pt-2"><h3 className="break-words text-xs font-bold">{item.name}</h3>
        <p className="mt-1 text-[11px] text-slate-500">{checked?fmtJOD(checked.amountJod)+" · "+tr("entered","مدخل"):item.budgetJod!==undefined?tr("Your budget: ","ميزانيتك: ")+fmtJOD(item.budgetJod):tr("No verified price","بدون سعر مؤكد")}</p>
        <button type="button" className="mt-auto inline-flex min-h-10 items-center justify-center gap-1 rounded-full border border-[#EADFE7] px-2 text-[10px] font-bold"
         onClick={()=>setWishlist(old=>old.map(w=>w.id===item.id?updateWishlistStatus(w,w.status==="purchased"?"considering":"purchased"):w))}>
         <CheckCircle2 className="size-3.5"/>{item.status==="purchased"?tr("Reopen","إعادة"):tr("Purchased by me","اشتريته بنفسي")}</button>
       </div>
      </article>;
     })}
    </div>}
  </section>
  <section className={panel} aria-label={tr("Shopping ideas","أفكار للتسوق")}>
   <div className="flex flex-wrap items-center justify-between gap-2">
    <h2 className="flex items-center gap-2 text-lg font-black"><Sparkles className="size-5 text-[#F5AB30]"/>{tr("Suggested shopping ideas","أفكار للتسوق")}{named?" · "+named:""}</h2>
    <Link to="/explore/market" className="inline-flex min-h-10 items-center gap-1 text-xs font-bold" style={{color:ink}}>{tr("Explore shops","استكشف المتاجر")}<ChevronRight className="size-4"/></Link>
   </div>
   <p className="mb-4 text-xs text-slate-500">{tr("Ideas to explore — not personalized AI research, verified listings or store prices.",
    "أفكار للاستكشاف فقط؛ ليست توصيات ذكاء اصطناعي أو عروضاً وأسعاراً موثقة.")}</p>
   <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
    {ideas.map(idea=><article key={idea.en} className="flex min-w-0 flex-col overflow-hidden rounded-[1.15rem] border border-[#F2E9EF] bg-white">
     <div className="grid h-28 place-items-center sm:h-36" style={{background:idea.shade}}><span aria-hidden="true" className="text-[4rem] drop-shadow-sm">{idea.icon}</span></div>
     <h3 className="px-3 pt-2 text-xs font-bold">{ar?idea.ar:idea.en}</h3>
     <p className="px-3 pt-1 text-[10px] text-slate-500">{tr("No live price","لا يوجد سعر مباشر")}</p>
     <button type="button" onClick={()=>addIdea(ar?idea.ar:idea.en)}
      className="mx-2 mb-2 mt-auto min-h-10 rounded-full border border-[var(--wish-accent)] px-2 text-[11px] font-bold"
      style={{color:ink}}>{tr("Add idea to wishlist","أضف الفكرة للقائمة")}</button>
    </article>)}
   </div>
  </section>
  <section className={panel} aria-label={tr("Saved family needs","احتياجات الأسرة المحفوظة")}>
   <div className="flex items-center justify-between gap-2">
    <h2 className="flex items-center gap-2 text-lg font-black"><ShoppingBasket className="size-5 text-[#3B9B76]"/>{tr("Saved Family Needs","احتياجات العائلة")}</h2>
    <Link to="/explore/shopping" className="min-h-10 content-center text-xs font-bold text-[#3B966B]">{tr("View all","عرض الكل")} →</Link>
   </div>
   <p className="mb-3 text-xs text-slate-500">{tr("Keep track of what your family really needs.","تابع ما تحتاجه العائلة بالفعل.")}</p>
   <form onSubmit={addNeed} className="flex gap-2">
    <input required minLength={2} maxLength={60} aria-label={tr("New family need","احتياج جديد")} value={newBasket} onChange={e=>setNewBasket(e.target.value)}
     className="min-h-11 min-w-0 flex-1 rounded-xl border border-[#EEE7EC] bg-white px-3 text-sm" placeholder={tr("e.g. milk","مثلاً حليب")}/>
    <button type="submit" disabled={!ready} className="grid size-11 place-items-center rounded-full text-white disabled:opacity-50" style={{background:theme.preset==="white"?"#36425C":color}}>
     <Plus className="size-5"/><span className="sr-only">{tr("Add family need","أضف احتياج")}</span></button>
   </form>
   {!ready?<p className="mt-3 text-xs text-slate-500">{tr("Loading…","جاري التحميل…")}</p>:
    shownBasket.length===0?<p className="mt-3 rounded-xl bg-[#F9FBF9] p-4 text-sm text-slate-500">{tr("No saved family needs yet.","لا توجد احتياجات محفوظة بعد.")}</p>:
    <ul className="mt-3 divide-y divide-[#F3EFF2]">{shownBasket.slice(0,12).map(item=><li key={item.id} className="flex min-h-12 items-center gap-3 py-2">
     <input type="checkbox" aria-label={tr("Got ","تم شراء ")+item.name} checked={item.done} onChange={e=>setBasket(old=>old.map(b=>b.id===item.id?{...b,done:e.target.checked}:b))}
      className="size-5" style={{accentColor:color}}/>
     <span className={"min-w-0 flex-1 break-words text-sm "+(item.done?"text-slate-400 line-through":"font-semibold")}>{item.name}</span>
     {item.price>0&&<span className="text-xs text-slate-500">{fmtJOD(item.price)} · {tr("entered","مدخل")}</span>}
    </li>)}</ul>}
  </section>
  {error&&<p role="alert" className="rounded-xl bg-red-50 p-3 text-xs text-red-700">{error}</p>}
  <div className="flex flex-wrap justify-between gap-2 rounded-xl bg-white/75 p-4 text-[11px] text-[#6B7385]">
   <p>{tr("Saved only on this device. No live merchant prices or automatic purchases.","البيانات محفوظة على هذا الجهاز. لا أسعار تجار مباشرة ولا شراء تلقائي.")}</p>
   <button type="button" className="inline-flex min-h-9 items-center gap-2 font-bold" onClick={()=>{const el=document.getElementById("shopping-tools") as HTMLDetailsElement|null;if(el){el.open=true;el.scrollIntoView?.({behavior:"smooth"});}}}>
    <SlidersHorizontal className="size-4"/>{tr("Manual comparison & price history","المقارنة اليدوية وسجل الأسعار")}</button>
  </div>
 </div>;
}
