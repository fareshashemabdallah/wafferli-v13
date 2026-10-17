import {useState,type CSSProperties,type FormEvent} from "react";
import {Link} from "@tanstack/react-router";
import {Check, CheckCircle2, Gift, Heart, Palette, Plus, Search, ShoppingBasket, Sparkles, Shirt, SlidersHorizontal, Wallet, X} from "lucide-react";
import {useI18n} from "@/lib/i18n";
import {fmtJOD,parseAmount,uid,useLocalState} from "@/lib/storage";
import {FAMILY_WISHLIST_KEY,makeWishlistItem,updateWishlistStatus,summarizeWishlistPrice,type WishlistItem,type WishlistKind} from "@/lib/familyWishlist";
import {isSampleBasketEntry,type BasketEntry} from "@/lib/basketRecording";
import {sophiaCartoon} from "./sophiaCartoon";

type ShoppingTheme={preset:string;custom:string};
const presets=[
 {id:"pink",en:"Pink",ar:"وردي",color:"#FF4B91"},
 {id:"blue",en:"Blue",ar:"أزرق",color:"#3B82F6"},
 {id:"white",en:"White",ar:"أبيض",color:"#F3F4F6"},
 {id:"mint",en:"Mint",ar:"نعناعي",color:"#37B99B"},
 {id:"purple",en:"Purple",ar:"بنفسجي",color:"#9D70E9"},
 {id:"yellow",en:"Yellow",ar:"أصفر",color:"#F3B73E"},
 {id:"orange",en:"Orange",ar:"برتقالي",color:"#FA8744"},
 {id:"coral",en:"Coral",ar:"مرجاني",color:"#F47E7C"},
 {id:"navy",en:"Navy",ar:"كحلي",color:"#506CAD"},
 {id:"sage",en:"Sage",ar:"مريمي",color:"#87A977"}
] as const;
const validHex=(x:string)=>/^#[0-9a-fA-F]{6}$/.test(x);
const surface="rounded-[1.6rem] border border-[#E8E5E9] bg-white/90 p-4 shadow-[0_16px_42px_-38px_rgba(41,27,57,.4)] sm:p-6";
export function wishlistTitle(name:string,ar:boolean){
 const first=name.replace(/[\u0000-\u001f\u007f]/g," ").trim().slice(0,32);
 return first?(ar?"قائمة رغبات "+first:first+"’s Wishlist"):(ar?"قائمة رغبات العائلة":"Family Wishlist");
}
export function shoppingThemeColor(theme:ShoppingTheme){
 return theme.preset==="custom"&&validHex(theme.custom)?theme.custom:
  presets.find(p=>p.id===theme.preset)?.color??presets[0].color;
}
export function ShoppingWishlistHome(){
 const {lang}=useI18n(),ar=lang==="ar";
 const tr=(en:string,arabic:string)=>ar?arabic:en;
 const [owner,setOwner,ownerReady]=useLocalState<string>("shoppingWishlistOwner","Sophia");
 const [theme,setTheme,themeReady]=useLocalState<ShoppingTheme>("shoppingWishlistTheme",{preset:"pink",custom:"#FF4B91"});
 const [list,setList,listReady]=useLocalState<WishlistItem[]>(FAMILY_WISHLIST_KEY,[]);
 const [basket,setBasket,basketReady]=useLocalState<BasketEntry[]>("shopping",[]);
 const [showPreferences,setShowPreferences]=useState(false);
 const [wishlistName,setWishlistName]=useState("");
 const [basketName,setBasketName]=useState("");
 const [budgetInput,setBudgetInput]=useState("");
 const [category,setCategory]=useState<WishlistKind>("children");
 const [kindFilter,setKindFilter]=useState<"all"|WishlistKind>("all");
 const [error,setError]=useState("");
 const ready=ownerReady&&themeReady&&listReady&&basketReady;
 const accent=shoppingThemeColor(theme);
 const themeStyle={
  "--shopping-accent":accent,
  "--shopping-soft":"color-mix(in srgb, "+accent+" 14%, white)",
  "--shopping-pale":"color-mix(in srgb, "+accent+" 7%, white)",
  "--shopping-outline":"color-mix(in srgb, "+accent+" 35%, white)"
 } as CSSProperties;
 const safeName=typeof owner==="string"?owner.trim().slice(0,32):"";
 const heading=wishlistTitle(safeName,ar);
 const saved=list.filter(i=>i.status!=="removed");
 const visible=saved.filter(i=>kindFilter==="all"||i.kind===kindFilter);
 const realBasket=basket.filter(i=>!isSampleBasketEntry(i)&&!!i.name.trim());
 const categories=[
  {id:"children" as const,en:"Kids' clothes",ar:"ملابس الأطفال",emoji:"👕",to:"/explore/market" as const,shade:"#FFF0F4"},
  {id:"toys" as const,en:"Toys & games",ar:"ألعاب",emoji:"🧸",to:"/explore/market" as const,shade:"#EEF9F3"},
  {id:"groceries" as const,en:"Groceries",ar:"بقالة",emoji:"🛒",to:"/explore/shopping" as const,shade:"#FFF6DF"},
  {id:"school" as const,en:"School supplies",ar:"مستلزمات المدرسة",emoji:"📚",to:"/explore/market" as const,shade:"#F3EDFF"},
  {id:"gifts" as const,en:"Gifts",ar:"هدايا",emoji:"🎁",to:"/occasions" as const,shade:"#FFF0EA"},
  {id:"more" as const,en:"More",ar:"المزيد",emoji:"✨",to:"/explore" as const,shade:"#F0F4FF"}
 ];
 const addWish=(e:FormEvent)=>{
  e.preventDefault();setError("");
  if(!ready)return;
  if(list.length>=150){setError(tr("Wishlist limit reached.","بلغت القائمة الحد الأقصى."));return;}
  const budget=budgetInput.trim()?parseAmount(budgetInput,100000):undefined;
  if(budgetInput.trim()&&budget===null){setError(tr("Enter a valid budget.","أدخل ميزانية صحيحة."));return;}
  const item=makeWishlistItem({id:uid(),name:wishlistName,kind:category,
   ...(budget!==undefined?{budgetJod:budget}:{})});
  if(!item){setError(tr("Enter an item name of at least two characters.","أدخل اسم عنصر من حرفين على الأقل."));return;}
  setList(old=>[item,...old]);setWishlistName("");setBudgetInput("");
 };
 const addBasket=(e:FormEvent)=>{
  e.preventDefault();setError("");
  if(!ready)return;
  const name=basketName.trim().slice(0,60);
  if(name.length<2){setError(tr("Enter an item name of at least two characters.","أدخل اسم عنصر من حرفين على الأقل."));return;}
  setBasket(old=>[...old,{id:uid(),name,qty:1,price:0,done:false}]);
  setBasketName("");
 };
 const kinds=[
  {id:"all" as const,en:"All",ar:"الكل"},
  {id:"children" as const,en:"Children",ar:"الأطفال"},
  {id:"household" as const,en:"Household",ar:"المنزل"},
  {id:"gift" as const,en:"Gifts",ar:"الهدايا"},
  {id:"other" as const,en:"Other",ar:"أخرى"}
 ];
 return <div dir={ar?"rtl":"ltr"} style={themeStyle} className="space-y-4 pb-6 text-[#222C4B]">
  <div className="flex flex-wrap items-center justify-between gap-3">
   <div className="flex items-center gap-2 text-sm font-semibold"><ShoppingBasket className="size-5" style={{color:accent}}/>{tr("Shopping & Wishlist","المشتريات وقائمة الرغبات")}</div>
   <button type="button" onClick={()=>setShowPreferences(v=>!v)} aria-expanded={showPreferences}
    className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[#DDDDE6] bg-white px-4 text-sm font-bold shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
    style={{color:theme.preset==="white"?"#34435D":accent}}>
    <Palette className="size-4"/>{tr("Personalize page","خصّص الصفحة")}
   </button>
  </div>
  {showPreferences&&<section className={surface} aria-label={tr("Wishlist appearance","مظهر قائمة الرغبات")}>
   <div className="mb-4 flex items-center justify-between gap-3"><h2 className="font-bold">{tr("Make this wishlist yours","خصص قائمة الرغبات")}</h2>
    <button type="button" aria-label={tr("Close preferences","إغلاق التخصيص")} onClick={()=>setShowPreferences(false)} className="grid size-10 place-items-center rounded-full bg-slate-50"><X className="size-4"/></button>
   </div>
   <label className="block text-sm font-semibold">{tr("Name before Wishlist (optional)","الاسم قبل قائمة الرغبات (اختياري)")}
    <input value={safeName} maxLength={32} onChange={e=>setOwner(e.target.value.replace(/[\u0000-\u001f\u007f]/g," ").slice(0,32))}
     placeholder={tr("e.g. Sophia, Faris, Our Family","مثلاً صوفيا، فارس، عائلتنا")}
     className="mt-2 min-h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-base outline-offset-2"/>
   </label>
   <p className="mt-1 text-xs text-slate-500">{tr("The name changes the heading only. Existing household items remain saved together on this device.",
     "الاسم يغيّر العنوان فقط. عناصر العائلة المحفوظة تبقى في نفس القائمة على هذا الجهاز.")}</p>
   <div className="mt-5 text-sm font-bold">{tr("Color theme","لون الصفحة")}</div>
   <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-5" role="group" aria-label={tr("Color theme","لون الصفحة")}>
    {presets.map(p=><button type="button" key={p.id} aria-pressed={theme.preset===p.id} onClick={()=>setTheme(old=>({...old,preset:p.id}))}
     className="flex min-h-12 items-center gap-2 rounded-xl border-2 bg-white px-3 text-xs font-bold focus-visible:outline focus-visible:outline-2"
     style={{borderColor:theme.preset===p.id?accent:"#E7E9EF"}}>
     <span className="size-5 shrink-0 rounded-full border border-black/10" style={{background:p.color}}/>{ar?p.ar:p.en}
     {theme.preset===p.id&&<Check className="ms-auto size-4"/>}
    </button>)}
   </div>
   <label className="mt-3 flex flex-wrap items-center gap-3 text-sm font-semibold">
    <input type="color" aria-label={tr("Custom color","لون مخصص")} value={validHex(theme.custom)?theme.custom:"#FF4B91"}
     onChange={e=>setTheme({preset:"custom",custom:e.target.value})} className="size-11 cursor-pointer rounded-lg border-0 bg-transparent"/>
    {tr("Any other color","أي لون آخر")}
    <span className="text-xs font-normal text-slate-500">{theme.preset==="custom"?theme.custom:""}</span>
   </label>
  </section>}
  <section className="relative isolate grid min-h-[270px] overflow-hidden rounded-[2rem] border border-white/80 px-5 pt-7 sm:grid-cols-[1fr_240px] sm:px-8"
   style={{background:"radial-gradient(circle at 72% 16%, color-mix(in srgb, "+accent+" 32%, white), transparent 48%), linear-gradient(110deg, var(--shopping-pale), var(--shopping-soft))"}}>
   <div className="relative z-10 max-w-[29rem] pb-6">
    <div className="mb-3 inline-flex items-center gap-1 rounded-full bg-white/70 px-3 py-1.5 text-xs font-semibold"><Heart className="size-4" style={{color:accent}}/>{tr("For your happy family","لعيلتك الحلوة")}</div>
    <h1 className="text-[2.2rem] font-black leading-[1.12] tracking-tight sm:text-[3rem]" data-testid="wishlist-heading">{heading}</h1>
    <p className="mt-3 max-w-sm text-sm leading-relaxed text-slate-600 sm:text-base">
     {tr("All the things your family needs and loves, thoughtfully planned in one place.",
      "كل ما تحتاجه العائلة وتحبه، مخطّط له في مكان واحد.")}
    </p>
    <button type="button" onClick={()=>setShowPreferences(true)}
     className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-full bg-white px-4 text-sm font-bold shadow-sm">
     <Palette className="size-4" style={{color:accent}}/>{tr("Change name & color","غيّر الاسم واللون")}
    </button>
   </div>
   <img src={sophiaCartoon} alt={tr("Cartoon illustration of Sophia holding a fruit drink","رسم كرتوني لصوفيا تحمل عصيراً")}
    className="pointer-events-none relative z-0 mx-auto h-[240px] w-[220px] self-end object-contain sm:h-[275px] sm:w-[245px]"
    loading="eager" decoding="async"/>
   <span aria-hidden="true" className="pointer-events-none absolute -bottom-20 -end-20 size-60 rounded-full bg-white/30 blur-2xl"/>
  </section>
  <nav aria-label={tr("Browse shopping categories","تصفّح فئات المشتريات")} className="grid grid-cols-3 gap-2 sm:grid-cols-6">
   {categories.map(x=><Link key={x.id} to={x.to}
    className="flex min-h-[100px] flex-col items-center justify-center gap-2 rounded-2xl p-2 text-center text-xs font-semibold shadow-sm transition hover:-translate-y-0.5 focus-visible:outline-2"
    style={{backgroundColor:x.shade}}><span aria-hidden="true" className="text-3xl">{x.emoji}</span>{ar?x.ar:x.en}</Link>)}
  </nav>
  <section className={surface} aria-label={tr("Saved wishlist","قائمة الرغبات المحفوظة")}>
   <div className="flex flex-wrap items-center justify-between gap-2">
    <h2 className="flex items-center gap-2 text-xl font-extrabold"><Heart className="size-6" fill={accent} color={accent}/>{heading}</h2>
    <Link to="/explore/smartbuy" className="min-h-11 content-center text-sm font-bold underline" style={{color:theme.preset==="white"?"#34435D":accent}}>
     {tr("More options & price history","خيارات أكثر وسجل الأسعار")}</Link>
   </div>
   <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label={tr("Filter wishlist","تصفية الرغبات")}>
    {kinds.map(k=><button key={k.id} type="button" onClick={()=>setKindFilter(k.id)} aria-pressed={kindFilter===k.id}
     className="min-h-10 rounded-full border px-4 text-xs font-bold"
     style={{background:kindFilter===k.id?"var(--shopping-soft)":"white",borderColor:kindFilter===k.id?accent:"#E5E7EB"}}>
     {ar?k.ar:k.en}</button>)}
   </div>
   <form onSubmit={addWish} className="mt-4 grid gap-2 rounded-2xl bg-slate-50 p-3 sm:grid-cols-[1.6fr_1fr_1fr_auto]">
    <label className="text-xs font-semibold">{tr("Wish or item","المنتج أو الرغبة")}
     <input required minLength={2} maxLength={120} value={wishlistName} onChange={e=>setWishlistName(e.target.value)}
      placeholder={tr("e.g. school bag","مثلاً حقيبة مدرسة")} className="mt-1 min-h-11 w-full rounded-xl border bg-white px-3 text-sm"/>
    </label>
    <label className="text-xs font-semibold">{tr("Category","الفئة")}
     <select value={category} onChange={e=>setCategory(e.target.value as WishlistKind)}
      className="mt-1 min-h-11 w-full rounded-xl border bg-white px-3 text-sm">
      <option value="children">{tr("Children","الأطفال")}</option><option value="household">{tr("Household","المنزل")}</option>
      <option value="gift">{tr("Gift","هدية")}</option><option value="other">{tr("Other","أخرى")}</option>
     </select>
    </label>
    <label className="text-xs font-semibold">{tr("Budget (optional, JOD)","ميزانية اختيارية (دينار)")}
     <input type="number" min="0.01" max="100000" step=".01" value={budgetInput} onChange={e=>setBudgetInput(e.target.value)}
      placeholder={tr("No estimate","بدون تقدير")} className="mt-1 min-h-11 w-full rounded-xl border bg-white px-3 text-sm"/>
    </label>
    <button type="submit" disabled={!ready} className="mt-auto inline-flex min-h-11 items-center justify-center gap-1 rounded-xl px-4 text-sm font-bold text-white disabled:opacity-50"
     style={{background:theme.preset==="white"?"#34435D":accent}}><Plus className="size-4"/>{tr("Add","أضف")}</button>
   </form>
   {!ready?<p className="mt-4 text-sm text-slate-500">{tr("Loading saved records…","جاري تحميل البيانات المحفوظة…")}</p>:
    visible.length===0?<p className="mt-4 rounded-2xl bg-[var(--shopping-pale)] p-5 text-sm text-slate-600">
     {tr("No saved wishes in this category yet. Add one above; no sample products or prices are shown.",
      "لا توجد رغبات محفوظة في هذه الفئة. أضف عنصراً أعلاه، من دون منتجات أو أسعار تجريبية.")}</p>:
    <div className="mt-4 grid gap-3 sm:grid-cols-2">
     {visible.slice(0,10).map(item=>{
      const sum=summarizeWishlistPrice(item);
      return <article key={item.id} className="flex min-w-0 flex-col gap-3 rounded-[1.25rem] border border-slate-100 bg-white p-4 shadow-sm">
       <div className="flex items-start justify-between gap-3">
        <div className="min-w-0"><h3 className="break-words text-base font-bold">{item.name}</h3>
         <p className="mt-1 text-xs text-slate-500">{item.kind==="gift"?tr("Gift","هدية"):item.kind==="children"?tr("Children","الأطفال"):item.kind==="household"?tr("Household","المنزل"):tr("Other","أخرى")}</p>
        </div><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[var(--shopping-pale)]">
         {item.kind==="gift"?<Gift className="size-5"/>:item.kind==="children"?<Shirt className="size-5"/>:<ShoppingBasket className="size-5"/>}</span>
       </div>
       <div className="space-y-1 text-xs text-slate-600">
        {item.budgetJod!==undefined&&<p>{tr("Your budget ceiling: ","ميزانيتك القصوى: ")}{fmtJOD(item.budgetJod)}</p>}
        {sum.latest?<p>{tr("Price you recorded: ","سعر أدخلته بنفسك: ")}{fmtJOD(sum.latest.amountJod)} · {sum.latest.checkedAt}</p>:
         <p>{tr("No price recorded or verified","لا يوجد سعر مسجّل أو متحقق منه")}</p>}
        {item.targetDate&&<p>{tr("Needed by: ","تاريخ الحاجة: ")}{item.targetDate}</p>}
       </div>
       <button type="button" onClick={()=>
        setList(old=>old.map(x=>x.id===item.id?updateWishlistStatus(x,x.status==="purchased"?"considering":"purchased"):x))}
        className="mt-auto flex min-h-11 items-center justify-center gap-2 rounded-xl border text-sm font-semibold"
        style={{borderColor:"var(--shopping-outline)",background:item.status==="purchased"?"var(--shopping-soft)":"white"}}>
        <CheckCircle2 className="size-4"/>{item.status==="purchased"?tr("Reopen wish","أعد إلى الرغبات"):tr("I purchased this myself","اشتريتُ هذا بنفسي")}
       </button>
      </article>;
     })}
    </div>}
   {visible.length>10&&<p className="mt-3 text-xs text-slate-500">{tr("Showing first 10 items. Open more options to see everything.","نعرض أول 10 عناصر. افتح المزيد لعرض الكل.")}</p>}
  </section>
  <section className={surface}>
   <h2 className="flex items-center gap-2 text-xl font-extrabold"><Sparkles className="size-6" color="#E4A933"/>{tr("Shopping ideas","أفكار للتسوق")}</h2>
   <p className="mt-1 text-sm text-slate-500">{tr("Explore categories; check prices and availability yourself.","تصفّح الفئات وتأكد من الأسعار والتوفر بنفسك.")}</p>
   <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
    {([
     {en:"Children's clothes",ar:"ملابس الأطفال",icon:"👗",to:"/explore/market" as const,bg:"#FFF0F6"},
     {en:"Toys & games",ar:"ألعاب",icon:"🧩",to:"/explore/market" as const,bg:"#FFF4DA"},
     {en:"Groceries",ar:"بقالة",icon:"🥦",to:"/explore/shopping" as const,bg:"#ECF6E9"},
     {en:"School essentials",ar:"لوازم المدرسة",icon:"🎒",to:"/explore/market" as const,bg:"#F0ECFF"}
    ]).map(x=><Link key={x.en} to={x.to} className="flex min-h-[130px] flex-col items-center justify-center gap-3 rounded-[1.2rem] p-3 text-center text-xs font-bold transition hover:-translate-y-0.5"
      style={{background:x.bg}}><span className="text-5xl" aria-hidden="true">{x.icon}</span>{ar?x.ar:x.en}</Link>)}
   </div>
  </section>
  <section className={surface}>
   <div className="flex flex-wrap items-center justify-between gap-3">
    <h2 className="flex items-center gap-2 text-xl font-extrabold"><ShoppingBasket className="size-6" color="#3B9A77"/>{tr("Saved family needs","احتياجات العائلة")}</h2>
    <Link to="/explore/shopping" className="inline-flex min-h-11 items-center gap-1 text-sm font-bold underline">{tr("Open full basket","افتح السلة")}</Link>
   </div>
   <form onSubmit={addBasket} className="mt-4 flex flex-wrap items-end gap-2">
    <label className="min-w-[160px] flex-1 text-xs font-semibold">{tr("Add a needed item","أضف احتياجاً للعائلة")}
     <input required minLength={2} maxLength={60} value={basketName} onChange={e=>setBasketName(e.target.value)}
      placeholder={tr("e.g. milk","مثلاً حليب")} className="mt-1 min-h-11 w-full rounded-xl border bg-white px-3 text-sm"/>
    </label>
    <button disabled={!ready} type="submit" className="inline-flex min-h-11 items-center gap-1 rounded-xl px-4 text-sm font-bold text-white disabled:opacity-50"
     style={{background:theme.preset==="white"?"#34435D":accent}}><Plus className="size-4"/>{tr("Add item","أضف")}</button>
   </form>
   {!ready?<p className="mt-4 text-sm text-slate-500">{tr("Loading…","جاري التحميل…")}</p>:
    realBasket.length===0?<p className="mt-4 rounded-xl bg-[var(--shopping-pale)] p-4 text-sm text-slate-600">
     {tr("No real family needs saved yet. Your list starts empty.","لا توجد احتياجات حقيقية محفوظة بعد. القائمة تبدأ فارغة.")}</p>:
    <ul className="mt-4 divide-y divide-slate-100">
     {realBasket.slice(0,8).map(item=><li key={item.id} className="flex min-h-14 items-center gap-3 py-2 text-sm">
      <input type="checkbox" checked={item.done} aria-label={tr("Got ","تم شراء ")+item.name} className="size-5 accent-current"
       style={{accentColor:accent}} onChange={e=>setBasket(old=>old.map(x=>x.id===item.id?{...x,done:e.target.checked}:x))}/>
      <span className={"min-w-0 flex-1 break-words "+(item.done?"text-slate-400 line-through":"font-semibold")}>{item.name}</span>
      {item.price>0&&<span className="shrink-0 text-xs text-slate-500">{fmtJOD(item.price)} · {tr("entered","مدخل")}</span>}
     </li>)}
    </ul>}
   <p className="mt-3 text-xs leading-relaxed text-slate-500">
    {tr("These are your own saved lists. No shop prices are live, no purchases are placed and no expenses are recorded from this page.",
     "هذه قوائمك المحفوظة. لا توجد أسعار متاجر مباشرة أو طلبات شراء أو تسجيل مصروف تلقائي من هذه الصفحة.")}
   </p>
  </section>
  {error&&<p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
  <footer className="flex flex-wrap justify-between gap-3 rounded-2xl bg-slate-50 p-4 text-xs text-slate-600">
   <span>{tr("Saved on this device · your financial records are unchanged.","محفوظ على هذا الجهاز · سجلاتك المالية لم تتغيّر.")}</span>
   <div className="flex flex-wrap gap-3">
    <Link to="/explore/market" className="inline-flex gap-1 font-bold underline"><Search className="size-4"/>{tr("Find retailers","ابحث عن المتاجر")}</Link>
    <Link to="/explore/smartbuy" className="inline-flex gap-1 font-bold underline"><SlidersHorizontal className="size-4"/>{tr("Compare entered prices","قارن الأسعار المدخلة")}</Link>
    <Link to="/money" className="inline-flex gap-1 font-bold underline"><Wallet className="size-4"/>{tr("Money & Bills","المال والفواتير")}</Link>
   </div>
  </footer>
 </div>;
}
