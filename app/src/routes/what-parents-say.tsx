import {createFileRoute,Link} from "@tanstack/react-router";
import {useState,type FormEvent} from "react";
import {ArrowLeft,ArrowRight,BookOpen,CheckCircle2,ChevronRight,Compass,ExternalLink,HeartHandshake,MapPin,MessageCircle,Plus,Search,ShieldAlert,ShieldCheck,ShoppingBag,Sparkles,Trash2,UsersRound,UtensilsCrossed,Waves} from "lucide-react";
import {AppShell} from "@/components/AppShell";
import {useI18n} from "@/lib/i18n";
import {uid,useLocalState} from "@/lib/storage";
import {PARENTS_SAY_PLACES_KEY,PARENTS_SAY_REVIEWS_KEY,createParentPlace,createParentReview,parentReviewExternalSearch,reportedReviewCount,reviewCategories,sameParentPlace,upsertParentReview,type ParentPlace,type ParentReview,type ReviewCategory,type ReviewInput} from "@/lib/parentsSay";

export const Route=createFileRoute("/what-parents-say")({
 head:()=>({meta:[{title:"What Parents Say — شو بيقولوا الأهل؟ | Dabberna"},
  {name:"description",content:"What matters to your family? Explore places, source links and your own private parent experiences in Dabberna's early pilot."}]}),
 component:WhatParentsSayPage
});
const card="rounded-[1.45rem] border border-[#DDE9DE] bg-white p-4 shadow-[0_16px_32px_-29px_rgba(40,75,55,.35)] sm:p-5";
const field="w-full min-h-11 rounded-xl border border-[#D3E3D6] bg-white px-3 py-2.5 text-sm text-[#2A4A39] outline-none focus-visible:ring-2 focus-visible:ring-[#4E9A75]";
const buttonPrimary="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#368664] px-4 py-2 text-sm font-bold text-white hover:bg-[#296B51] focus-visible:ring-2 focus-visible:ring-[#296B51]";
const buttonSecondary="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#D7E6D8] bg-white px-4 py-2 text-sm font-semibold text-[#366C52] hover:bg-[#F4FAF4] focus-visible:ring-2";
const ageOptions=[["0-2","0–2","٠–٢"],["3-5","3–5","٣–٥"],["6-9","6–9","٦–٩"],["10+","10+","١٠+"],["prefer-not","Prefer not to say","أفضل عدم التحديد"]] as const;
const categoryCards=[
 {id:"activities" as const,en:"Clubs & activities",ar:"نوادي وأنشطة",icon:Waves,soft:"#E5F4EB",tone:"#367B5C"},
 {id:"restaurants" as const,en:"Restaurants & outings",ar:"مطاعم وطلعات",icon:UtensilsCrossed,soft:"#FFF0E4",tone:"#A87142"},
 {id:"services" as const,en:"Services",ar:"خدمات",icon:HeartHandshake,soft:"#FBEAF1",tone:"#A45B80"},
 {id:"products" as const,en:"Children's products",ar:"منتجات للأطفال",icon:ShoppingBag,soft:"#EAF1FF",tone:"#6683B2"}
];
const defaultReview:ReviewInput={age:"prefer-not",experience:"positive",safety:"not-assessed",convenience:"not-assessed",wouldReturn:"maybe",comment:"",providerSummaryOptIn:false,parentQuestionsOptIn:false};
const labels={
 experience:{positive:["Positive","إيجابية"],mixed:["Mixed","متفاوتة"],negative:["Disappointing","مخيبة"]},
 safety:{comfortable:["Felt comfortable","شعرت بالاطمئنان"],concerns:["Had concerns","كانت لدي مخاوف"],"not-assessed":["Not assessed","لم أتمكن من التقييم"]},
 convenience:{yes:["Convenient","مريح"],somewhat:["Somewhat convenient","مريح إلى حد ما"],no:["Inconvenient","غير مريح"],"not-assessed":["Not assessed","لم أتمكن من التقييم"]},
 wouldReturn:{yes:["Yes","نعم"],maybe:["Maybe","ربما"],no:["No","لا"]}
} as const;
export function WhatParentsSayPage(){
 const {lang}=useI18n(),ar=lang==="ar",t=(en:string,a:string)=>ar?a:en;
 const [places,setPlaces,placesReady]=useLocalState<ParentPlace[]>(PARENTS_SAY_PLACES_KEY,[]);
 const [reviews,setReviews,reviewsReady]=useLocalState<ParentReview[]>(PARENTS_SAY_REVIEWS_KEY,[]);
 const [mode,setMode]=useState<"browse"|"detail"|"place"|"review">("browse");
 const [selected,setSelected]=useState<string|null>(null);
 const [query,setQuery]=useState("");
 const [category,setCategory]=useState<"all"|ReviewCategory>("all");
 const [activeTab,setActiveTab]=useState<"parents"|"web">("parents");
 const [placeName,setPlaceName]=useState("");
 const [placeArea,setPlaceArea]=useState("Amman");
 const [placeCategory,setPlaceCategory]=useState<ReviewCategory>("activities");
 const [draft,setDraft]=useState<ReviewInput>(defaultReview);
 const [error,setError]=useState("");
 const [saved,setSaved]=useState(false);
 const ready=placesReady&&reviewsReady;
 const selectedPlace=places.find(x=>x.id===selected);
 const ownReview=reviews.find(x=>x.placeId===selected);
 const visible=places.filter(p=>(category==="all"||p.category===category)&&
  [p.name,p.area,p.category].join(" ").toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()))
  .sort((a,b)=>b.createdAt.localeCompare(a.createdAt));
 const updateDraft=<K extends keyof ReviewInput>(key:K,value:ReviewInput[K])=>setDraft(old=>({...old,[key]:value}));
 const openPlace=(id:string)=>{setSelected(id);setActiveTab("parents");setError("");setMode("detail");};
 const startReview=()=>{setDraft(ownReview?{age:ownReview.age,experience:ownReview.experience,safety:ownReview.safety,convenience:ownReview.convenience,wouldReturn:ownReview.wouldReturn,comment:ownReview.comment,providerSummaryOptIn:ownReview.providerSummaryOptIn,parentQuestionsOptIn:ownReview.parentQuestionsOptIn}:defaultReview);setSaved(false);setError("");setMode("review");};
 const submitPlace=(event:FormEvent)=>{
  event.preventDefault();const proposed=createParentPlace({name:placeName,area:placeArea,category:placeCategory},uid(),new Date().toISOString());
  if(!proposed){setError(t("Enter a place or product name and a general area.","اكتب اسم المكان أو المنتج ومنطقة عامة."));return;}
  const duplicate=places.find(p=>sameParentPlace(p,proposed));
  if(!duplicate)setPlaces(old=>[proposed,...old]);
  openPlace(duplicate?.id??proposed.id);
  setPlaceName("");setPlaceArea("Amman");
 };
 const submitReview=(event:FormEvent)=>{
  event.preventDefault();if(!selectedPlace)return;
  const created=createParentReview(draft,selectedPlace.id,ownReview?.id??uid(),new Date().toISOString(),ownReview);
  if(!created){setError(t("Please share at least 20 characters of useful firsthand feedback (maximum 1,500).","شارك تجربتك الفعلية في ٢٠ حرفاً على الأقل (الحد الأقصى ١٥٠٠)."));return;}
  setReviews(old=>upsertParentReview(old,created));setError("");setSaved(true);setMode("detail");
 };
 const removeReview=()=>{
  if(!ownReview)return;
  if(typeof window!=="undefined"&&!window.confirm(t("Delete your locally saved review?","حذف تجربتك المحفوظة على هذا الجهاز؟")))return;
  setReviews(old=>old.filter(x=>x.id!==ownReview.id));setSaved(false);
 };
 const currentCategory=categoryCards.find(x=>x.id===selectedPlace?.category);
 const localOnly=t("Private pilot — your entries stay in this browser. Other families cannot read them yet, and no provider reports or chats are sent.",
 "نسخة تجريبية خاصة — مشاركاتك محفوظة في هذا المتصفح فقط. لا يراها أهل آخرون ولا يتم إرسال تقارير أو محادثات.");
 return <AppShell title={t("What Parents Say","شو بيقولوا الأهل؟")}>
  <div className="mx-auto max-w-[980px] space-y-4 pb-5" data-testid="what-parents-say">
   <section className="relative isolate overflow-hidden rounded-[1.7rem] border border-[#DBEADC] bg-[linear-gradient(115deg,#EDF8EA_5%,#FFF6EC_65%,#FFF0F5_100%)] p-5 sm:p-7">
    <div className="relative z-10 max-w-[68%] pb-2 sm:max-w-[67%]">
     <p className="text-[11px] font-bold tracking-wide text-[#428367]">{t("PARENTS HELPING PARENTS","أهل بيساعدوا أهل")}</p>
     <h2 className="mt-2 text-[clamp(1.5rem,4vw,2.15rem)] font-black leading-tight text-[#25513D]">{t("What Parents Say","شو بيقولوا الأهل؟")}</h2>
     <p className="mt-2 text-sm leading-relaxed text-[#5D7666]">{t(
      "Before you choose for your child, hear what matters to other families. Your experience could help another parent—and help places improve.",
      "قبل ما تختار لأولادك، شوف شو بهم العائلات الثانية. تجربتك ممكن تفيد أهل غيرك وتساعد الأماكن تتحسّن.")}</p>
    </div>
    <img src={import.meta.env.BASE_URL+"landing-family-characters.avif"} alt="" aria-hidden="true"
     className="pointer-events-none absolute bottom-[-2px] end-[-12px] h-[160px] w-[45%] object-contain object-bottom sm:h-[215px]" />
   </section>
   <div role="status" className="flex items-start gap-2 rounded-xl border border-[#DAE6DC] bg-white p-3 text-xs leading-relaxed text-[#597266]">
    <ShieldCheck className="mt-0.5 size-4 shrink-0 text-[#398C67]"/>{localOnly}
   </div>

   {mode==="browse"&&<div className="space-y-4">
    <section className={card+" space-y-3"}>
     <div className="flex items-center justify-between gap-2">
      <h3 className="text-lg font-extrabold text-[#273E35]">{t("Explore experiences","اكتشف التجارب")}</h3>
      <span className="text-[11px] text-[#78867D]">{t("Around your family","خيارات للعيلة")}</span>
     </div>
     <label className="flex items-center gap-2 rounded-xl border border-[#D3E5D7] bg-[#FAFDF9] px-3">
      <Search className="size-4 shrink-0 text-[#6D8A77]"/>
      <span className="sr-only">{t("Search places or products","ابحث عن مكان أو منتج")}</span>
      <input className="min-h-12 min-w-0 w-full bg-transparent text-sm outline-none" value={query} onChange={e=>setQuery(e.target.value)}
       placeholder={t("Search a club, restaurant, service or product","ابحث عن نادي أو مطعم أو خدمة أو منتج")}/>
     </label>
     <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {categoryCards.map(item=>{const Icon=item.icon;return <button key={item.id} type="button" onClick={()=>setCategory(category===item.id?"all":item.id)}
       aria-pressed={category===item.id} className={"flex min-h-[94px] flex-col items-start justify-center gap-2 rounded-2xl border p-3 text-start transition focus-visible:ring-2 focus-visible:ring-[#459672] "+(category===item.id?"border-[#5EAC83] ring-1 ring-[#7EB99B]":"border-[#E1EAE0]")}
       style={{background:item.soft}}>
       <Icon className="size-6" style={{color:item.tone}}/>
       <span className="text-xs font-bold text-[#31463D]">{ar?item.ar:item.en}</span>
      </button>;})}
     </div>
     {category!=="all"&&<button type="button" className="text-xs font-bold text-[#458667] underline" onClick={()=>setCategory("all")}>{t("Show all categories","كل الفئات")}</button>}
    </section>
    <section className={card+" space-y-3"}>
     <div className="flex flex-wrap items-center justify-between gap-2">
      <div>
       <h3 className="text-base font-extrabold">{t("Places & products you've added","الأماكن والمنتجات اللي أضفتها")}</h3>
       <p className="mt-1 text-xs text-[#78877C]">{t("Your private testing catalogue—never presented as community reviews.","قائمتك التجريبية الخاصة، وليست مراجعات عامة.")}</p>
      </div>
      <button type="button" className={buttonPrimary} onClick={()=>{setError("");setPlaceCategory(category==="all"?"activities":category);setMode("place");}}>
       <Plus className="size-4"/>{t("Add a place or item","أضف مكان أو منتج")}</button>
     </div>
     {!ready?<p className="py-5 text-center text-sm text-[#718273]">{t("Loading your saved experiences…","جارٍ تحميل التجارب…")}</p>:
      visible.length===0?<div className="rounded-2xl bg-[#F3F9F1] px-5 py-7 text-center">
       <Compass className="mx-auto size-9 text-[#68A17D]"/>
       <h4 className="mt-3 font-extrabold text-[#355C43]">{t("Every experience starts somewhere","كل تجربة إلها بداية")}</h4>
       <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-[#61776A]">{query.trim()||category!=="all"?
        t("No matching entries in your private catalogue. Adjust your search or add one.",
         "ما في نتيجة مطابقة في قائمتك الخاصة. غيّر البحث أو أضف مكان."):
        t("Add a place you've visited or a product you've used, then try the review journey. Your review won't be publicly shared.",
         "أضف مكان زرته أو منتج جربته، وجرّب كتابة تقييم. تجربتك مش منشورة للعموم.")}</p>
      </div>:
      <div className="grid gap-2 md:grid-cols-2">{visible.map(p=>{const c=categoryCards.find(x=>x.id===p.category)!;const Icon=c.icon;return <button key={p.id}
       className="flex min-h-[96px] items-center gap-3 rounded-2xl border border-[#E1E9DE] bg-white p-3 text-start hover:border-[#7BAF8D] focus-visible:ring-2"
       type="button" onClick={()=>openPlace(p.id)}>
        <span className="grid size-14 shrink-0 place-items-center rounded-2xl" style={{background:c.soft,color:c.tone}}><Icon className="size-6"/></span>
        <span className="min-w-0 flex-1">
         <strong className="block truncate text-sm text-[#31493B]">{p.name}</strong>
         <span className="mt-1 block text-xs text-[#718176]">{p.area} · {ar?c.ar:c.en}</span>
         <span className="mt-1 block text-[11px] text-[#4E8667]">{reportedReviewCount(reviews,p.id)===0?t("No saved reviews","لا توجد مراجعات محفوظة"):t("Your saved review","تجربتك المحفوظة")}</span>
        </span>
        <ChevronRight className="size-4 shrink-0 text-[#759481] rtl:rotate-180"/>
       </button>;})}</div>}
    </section>
    <div className="rounded-[1.4rem] border border-[#F1DDE6] bg-[#FFF8FB] p-4 sm:p-5">
     <div className="flex items-start gap-3">
      <MessageCircle className="mt-0.5 size-6 shrink-0 text-[#B66887]"/>
      <div><h3 className="font-extrabold text-[#6A4761]">{t("Your experience could be what another parent needs.","يمكن تجربتك تكون المعلومة اللي أهل غيرك محتاجينها.")}</h3>
       <p className="mt-2 text-sm leading-relaxed text-[#786774]">{t("Our future shared community will focus on genuine, age-relevant experiences—helping parents choose wisely and providers get better.",
        "مجتمعنا بالمستقبل رح يركّز على تجارب فعلية ومناسبة للعمر، حتى الأهل يختاروا بوعي والأماكن تتحسّن.")}</p></div>
     </div>
    </div>
   </div>}

   {mode==="place"&&<section className={card+" space-y-4"}>
    <button type="button" className={buttonSecondary} onClick={()=>setMode("browse")}><ArrowLeft className="size-4 rtl:rotate-180"/>{t("Back to exploring","ارجع للاستكشاف")}</button>
    <div><h3 className="text-xl font-black">{t("Which place or product?","أي مكان أو منتج؟")}</h3>
     <p className="mt-1 text-sm text-[#6B7B70]">{t("Enter the name once. We will keep the review connected to this same entry.","اكتب الاسم مرة واحدة، والتجربة بتظل مرتبطة فيه.")}</p></div>
    <form onSubmit={submitPlace} className="space-y-4">
     <label className="block space-y-1 text-sm font-semibold">{t("Place, provider or product name","اسم المكان أو مقدم الخدمة أو المنتج")}
      <input className={field} maxLength={100} required minLength={3} value={placeName} onChange={e=>setPlaceName(e.target.value)} placeholder={t("e.g. a swimming club or children's bicycle","مثلاً نادي سباحة أو دراجة أطفال")}/></label>
     <label className="block space-y-1 text-sm font-semibold">{t("Category","الفئة")}
      <select className={field} value={placeCategory} onChange={e=>setPlaceCategory(e.target.value as ReviewCategory)}>
       {categoryCards.map(x=><option key={x.id} value={x.id}>{ar?x.ar:x.en}</option>)}</select></label>
     <label className="block space-y-1 text-sm font-semibold">{t("General city or area (no exact address)","المدينة أو المنطقة العامة (بدون عنوان دقيق)")}
      <input className={field} maxLength={80} required value={placeArea} onChange={e=>setPlaceArea(e.target.value)}/></label>
     <p className="rounded-xl bg-[#F3F8F2] p-3 text-xs leading-relaxed text-[#64796A]">
      {t("Google Maps place selection and verified business matching aren't connected yet. We'll open public searches from the place page without copying reviews.",
       "الاختيار من خرائط جوجل ومطابقة الأماكن مش متصلين حالياً. ممكن تفتح نتائج بحث عامة من صفحة المكان.")}</p>
     {error&&<p role="alert" className="text-sm text-[#B44459]">{error}</p>}
     <button type="submit" className={buttonPrimary}><CheckCircle2 className="size-4"/>{t("Continue to place","تابع لصفحة المكان")}</button>
    </form>
   </section>}

   {mode==="detail"&&selectedPlace&&<div className="space-y-4">
    <button type="button" className={buttonSecondary} onClick={()=>{setSaved(false);setMode("browse");}}><ArrowLeft className="size-4 rtl:rotate-180"/>{t("All experiences","كل التجارب")}</button>
    <section className={card+" space-y-3"}>
     <div className="flex items-start gap-3">
      <span className="grid size-14 shrink-0 place-items-center rounded-2xl" style={{background:currentCategory?.soft??"#E7F3E8",color:currentCategory?.tone??"#39765C"}}>
       {currentCategory&&<currentCategory.icon className="size-7"/>}</span>
      <div className="min-w-0 flex-1">
       <h3 className="text-xl font-black text-[#294835]">{selectedPlace.name}</h3>
       <p className="mt-1 flex items-center gap-1 text-xs text-[#708375]"><MapPin className="size-3"/>{selectedPlace.area} · {currentCategory&&(ar?currentCategory.ar:currentCategory.en)}</p>
       <p className="mt-1 text-xs text-[#6B8474]">{t("Added by you · Not externally verified","أضفته أنت · غير موثّق من مصدر خارجي")}</p>
      </div>
     </div>
     {saved&&<p role="status" className="rounded-xl bg-[#E9F6EB] p-3 text-sm text-[#2A7955]">{t("Your review was saved in this browser only.","تم حفظ تجربتك بهذا المتصفح فقط.")}</p>}
     <div className="grid grid-cols-2 gap-2">
      <div className="rounded-xl bg-[#F1F8F2] p-3">
       <ShieldCheck className="size-5 text-[#468468]"/><p className="mt-1 text-sm font-extrabold">{t("Safety & supervision","السلامة والإشراف")}</p>
       <p className="mt-1 text-xs text-[#6E8176]">{t("What a parent observed, not a safety certificate","ملاحظات أهل، مش شهادة سلامة")}</p>
      </div>
      <div className="rounded-xl bg-[#FDF4EA] p-3">
       <Compass className="size-5 text-[#B58455]"/><p className="mt-1 text-sm font-extrabold">{t("Convenience & age fit","الراحة وملاءمة العمر")}</p>
       <p className="mt-1 text-xs text-[#8A7B69]">{t("Practical experiences for real families","تجارب عملية تهم العيلة")}</p>
      </div>
     </div>
     <button type="button" className={buttonPrimary+" w-full"} onClick={startReview}>
      <Plus className="size-4"/>{ownReview?t("Edit your experience","عدّل تجربتك"):t("Share your experience","شارك تجربتك")}</button>
    </section>
    <section className={card+" space-y-3"}>
     <div role="tablist" aria-label={t("Review sources","مصادر المراجعات")} className="grid grid-cols-2 gap-2 rounded-xl bg-[#F0F5EF] p-1">
      <button type="button" role="tab" aria-selected={activeTab==="parents"} onClick={()=>setActiveTab("parents")}
       className={"min-h-11 rounded-lg px-2 text-sm font-semibold "+(activeTab==="parents"?"bg-white text-[#2E7555] shadow-sm":"text-[#748779]")}>{t("Dabberna parents","تجارب الأهل")}</button>
      <button type="button" role="tab" aria-selected={activeTab==="web"} onClick={()=>setActiveTab("web")}
       className={"min-h-11 rounded-lg px-2 text-sm font-semibold "+(activeTab==="web"?"bg-white text-[#2E7555] shadow-sm":"text-[#748779]")}>{t("Around the web","من الإنترنت")}</button>
     </div>
     {activeTab==="parents"?<div className="space-y-3">
      <div><h4 className="font-extrabold">{t("Firsthand parent experiences","تجارب أهل من الواقع")}</h4>
       <p className="mt-1 text-xs text-[#728378]">{t("No public family reviews are connected yet. This is your private draft space.","تجارب العائلات العامة مش متصلة بعد. هاي مساحتك الخاصة للتجربة.")}</p></div>
      {!ownReview?<div className="rounded-xl bg-[#F4F8F2] p-5 text-center">
       <UsersRound className="mx-auto size-8 text-[#7CA48A]"/>
       <p className="mt-2 font-bold">{t("No firsthand review saved yet","ما في تجربة محفوظة بعد")}</p>
       <p className="mt-1 text-sm text-[#718479]">{t("Contribute an honest experience to test how this will work.","شارك تجربة صادقة لتجرّب كيف رح تشتغل الصفحة.")}</p></div>:
       <article className="rounded-2xl border border-[#DCE9DE] bg-[#FCFEFA] p-4">
        <div className="flex items-center gap-2"><span className="grid size-9 place-items-center rounded-full bg-[#E5F3E6] text-[#42835F]"><UsersRound className="size-5"/></span>
         <div className="min-w-0 flex-1"><p className="text-sm font-extrabold">{t("Your private parent review","تجربتك الخاصة")}</p>
          <p className="text-[11px] text-[#738477]">{t("Authenticated visit not verified · Not publicly posted","الزيارة غير موثّقة · غير منشورة")}</p></div></div>
        <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-[#39483E]">{ownReview.comment}</p>
        <div className="mt-3 flex flex-wrap gap-1.5 text-[11px]">
         <span className="rounded-full bg-[#E9F5E9] px-2.5 py-1 text-[#387554]">{labels.experience[ownReview.experience][ar?1:0]}</span>
         <span className="rounded-full bg-[#FFF0EA] px-2.5 py-1 text-[#A16A56]">{labels.safety[ownReview.safety][ar?1:0]}</span>
         <span className="rounded-full bg-[#F0F5F8] px-2.5 py-1 text-[#627E88]">{labels.convenience[ownReview.convenience][ar?1:0]}</span>
        </div>
        <p className="mt-2 text-xs text-[#74857A]">{t("Age range: ","الفئة العمرية: ")}{ageOptions.find(x=>x[0]===ownReview.age)?.[ar?2:1]}</p>
        <div className="mt-3 flex gap-2 border-t border-[#E5EEE6] pt-3">
         <button type="button" onClick={startReview} className={buttonSecondary}>{t("Edit","عدّل")}</button>
         <button type="button" onClick={removeReview} className={buttonSecondary+" text-[#A1485D]"}><Trash2 className="size-4"/>{t("Delete","احذف")}</button>
        </div>
       </article>}
      <div className="rounded-xl bg-[#F6F3FB] p-3 text-xs leading-relaxed text-[#766588]">
       <MessageCircle className="me-1 inline size-4"/>{t("Private parent-to-parent questions will be enabled only after secure accounts, consent and moderation are ready.",
        "الأسئلة الخاصة بين الأهل رح تتفعّل فقط بعد تجهيز الحسابات الآمنة والموافقة والإشراف.")}</div>
     </div>:
     <div className="space-y-3">
      <h4 className="font-extrabold">{t("Explore public sources","شوف المصادر العامة")}</h4>
      <p className="text-sm text-[#64796C]">{t("Open existing information on the original websites. We do not scrape, reprint or invent online reviews in this pilot.",
       "افتح المعلومات الموجودة من مواقعها الأصلية. بهذه النسخة ما بننسخ أو نختلق مراجعات من الإنترنت.")}</p>
      <a className={buttonSecondary+" w-full justify-between"} href={parentReviewExternalSearch(selectedPlace.name,selectedPlace.area,"maps")} target="_blank" rel="noopener noreferrer">
       <span className="flex items-center gap-2"><MapPin className="size-4"/>{t("Look up on Google Maps","ابحث على خرائط جوجل")}</span><ExternalLink className="size-4"/></a>
      <a className={buttonSecondary+" w-full justify-between"} href={parentReviewExternalSearch(selectedPlace.name,selectedPlace.area,"web")} target="_blank" rel="noopener noreferrer">
       <span className="flex items-center gap-2"><Search className="size-4"/>{t("Search public reviews","ابحث عن مراجعات عامة")}</span><ExternalLink className="size-4"/></a>
      <div className="rounded-xl border border-[#E6E6D8] bg-[#FFFCF2] p-3">
       <p className="flex items-center gap-2 text-sm font-bold text-[#8B6E41]"><ShieldAlert className="size-4"/>{t("What online ratings cannot tell you","شو التقييمات ما بتقدر تخبرك")}</p>
       <p className="mt-1 text-xs leading-relaxed text-[#8C816D]">{t("A high rating isn't proof of child safety or suitability. AI summaries and licensed integrations are planned—not active.",
        "التقييم العالي مش دليل على سلامة المكان أو ملاءمته للأطفال. الملخصات الذكية والربط المرخّص لسه مش مفعّلين.")}</p>
      </div>
     </div>}
    </section>
    <section className={card}>
     <div className="flex items-start gap-3">
      <Sparkles className="mt-0.5 size-5 shrink-0 text-[#B77F89]"/>
      <div><h4 className="font-extrabold">{t("Together we can help places improve","مع بعض منساعد الأماكن تتحسّن")}</h4>
       <p className="mt-1 text-sm leading-relaxed text-[#6D7B72]">{t("In the future, consenting parents' experiences could become carefully anonymized improvement themes for providers. No reports are sent in this pilot.",
        "بالمستقبل، ممكن نجمع تجارب الأهل الموافقين كتوصيات لتحسين الخدمات مع حماية الهوية. حالياً ما بنرسل تقارير.")}</p>
      </div></div>
    </section>
   </div>}

   {mode==="review"&&selectedPlace&&<section className={card+" space-y-4"}>
    <button type="button" className={buttonSecondary} onClick={()=>{setMode("detail");setError("");}}><ArrowLeft className="size-4 rtl:rotate-180"/>{t("Back to place","ارجع للمكان")}</button>
    <div><p className="text-xs font-bold text-[#5B9974]">{selectedPlace.name}</p>
     <h3 className="mt-1 text-xl font-black">{t("Share your experience","شارك تجربتك")}</h3>
     <p className="mt-1 text-sm leading-relaxed text-[#647669]">{t("A few honest details matter more than a star rating. Describe only what you actually experienced.",
      "شوية تفاصيل صادقة أهم من النجوم. احكي بس عن اللي جربته بنفسك.")}</p></div>
    <form onSubmit={submitReview} className="space-y-4">
     <label className="block space-y-1 text-sm font-semibold">{t("Child's age range during the experience (optional)","عمر الطفل وقت التجربة (اختياري)")}
      <select className={field} value={draft.age} onChange={e=>updateDraft("age",e.target.value as ReviewInput["age"])}>
       {ageOptions.map(x=><option key={x[0]} value={x[0]}>{x[ar?2:1]}</option>)}</select></label>
     <fieldset className="space-y-2"><legend className="text-sm font-extrabold">{t("How was your family's experience?","كيف كانت تجربة العيلة؟")}</legend>
      <div className="grid grid-cols-3 gap-2">{(["positive","mixed","negative"] as const).map(val=><button key={val} type="button"
       aria-pressed={draft.experience===val} onClick={()=>updateDraft("experience",val)} className={"min-h-12 rounded-xl border px-2 text-xs font-semibold "+(draft.experience===val?"border-[#4C9B70] bg-[#E8F5E9] text-[#316F4E]":"border-[#DFE7DC] bg-white")}>{labels.experience[val][ar?1:0]}</button>)}</div>
     </fieldset>
     <fieldset className="space-y-2"><legend className="text-sm font-extrabold">{t("Did you feel comfortable with safety and supervision?","هل حسّيت إن السلامة والإشراف مناسبين؟")}</legend>
      {(["comfortable","concerns","not-assessed"] as const).map(val=><label key={val} className="flex min-h-11 items-center gap-2 rounded-xl border border-[#E2EADF] px-3 text-sm">
       <input type="radio" name="review-safety" checked={draft.safety===val} onChange={()=>updateDraft("safety",val)}/>{labels.safety[val][ar?1:0]}</label>)}
      <p className="text-xs text-[#738477]">{t("Your observation is not an independent safety inspection.","ملاحظتك مش فحص سلامة مستقل.")}</p>
     </fieldset>
     <label className="block space-y-1 text-sm font-semibold">{t("Was it convenient for your family?","هل كان مريح ومناسب لعيلتك؟")}
      <select className={field} value={draft.convenience} onChange={e=>updateDraft("convenience",e.target.value as ReviewInput["convenience"])}>
       {(["yes","somewhat","no","not-assessed"] as const).map(x=><option key={x} value={x}>{labels.convenience[x][ar?1:0]}</option>)}</select></label>
     <label className="block space-y-1 text-sm font-semibold">{t("Would you choose it again?","هل ممكن تختاره مرة ثانية؟")}
      <select className={field} value={draft.wouldReturn} onChange={e=>updateDraft("wouldReturn",e.target.value as ReviewInput["wouldReturn"])}>
       {(["yes","maybe","no"] as const).map(x=><option key={x} value={x}>{labels.wouldReturn[x][ar?1:0]}</option>)}</select></label>
     <label className="block space-y-1 text-sm font-semibold">{t("What should another parent know?","شو بتحب أهل غيرك يعرفوا؟")}
      <textarea className={field+" min-h-[120px]"} required minLength={20} maxLength={1500} value={draft.comment} onChange={e=>updateDraft("comment",e.target.value)}
       placeholder={t("What worked? Any safety concerns, age considerations, practical tips or hidden costs?","شو كان منيح؟ في مخاوف، ملاحظات عن العمر، نصائح أو تكاليف إضافية؟")}/>
      <span className="block text-end text-[11px] font-normal text-[#738477]">{draft.comment.trim().length}/1500</span></label>
     <div className="rounded-2xl bg-[#F3F8F2] p-4">
      <p className="font-extrabold">{t("Your choices for the future","خياراتك للمستقبل")}</p>
      <label className="mt-3 flex items-start gap-2 text-sm"><input type="checkbox" className="mt-1" checked={draft.providerSummaryOptIn} onChange={e=>updateDraft("providerSummaryOptIn",e.target.checked)}/>
       <span>{t("I may allow this feedback in future identity-protected provider improvement summaries.","ممكن أسمح باستخدام رأيي مستقبلاً بتقارير تحسين الخدمات مع حماية هويتي.")}</span></label>
      <label className="mt-3 flex items-start gap-2 text-sm"><input type="checkbox" className="mt-1" checked={draft.parentQuestionsOptIn} onChange={e=>updateDraft("parentQuestionsOptIn",e.target.checked)}/>
       <span>{t("I may accept requests for private parent questions when secure messaging is available.","ممكن أقبل أسئلة خاصة من أهل آخرين وقت تصير المحادثات الآمنة متاحة.")}</span></label>
      <p className="mt-3 text-xs leading-relaxed text-[#6D8071]">{t("These are preferences only. Public posting, messages and provider reports are OFF. We will ask for fresh, explicit consent before activating any sharing.",
       "هاي تفضيلات فقط. النشر والمحادثات والتقارير غير مفعّلين. رح نطلب موافقة جديدة وواضحة قبل أي مشاركة.")}</p>
     </div>
     <p className="flex items-start gap-2 text-xs leading-relaxed text-[#6D7B71]"><ShieldCheck className="mt-0.5 size-4 shrink-0"/>{t("Avoid children's names, photos, contact details and identifiable personal information. Serious safety incidents need appropriate reporting, not only reviews.",
      "تجنّب أسماء وصور الأطفال وبيانات الاتصال أو التفاصيل الشخصية. مشاكل السلامة الخطيرة تحتاج بلاغاً مناسباً، مش تقييم فقط.")}</p>
     {error&&<p role="alert" className="text-sm font-semibold text-[#B44459]">{error}</p>}
     <button type="submit" className={buttonPrimary+" w-full"}><CheckCircle2 className="size-4"/>{t("Save private review","احفظ تجربتي الخاصة")}</button>
    </form>
   </section>}
   <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-xs text-[#79877F]">
    <p>{t("Our promise: genuine perspectives, transparent sources and no pretend safety certifications.","وعدنا: تجارب صادقة، مصادر واضحة، وبدون شهادات سلامة وهمية.")}</p>
    <Link to="/family" className="inline-flex min-h-10 items-center gap-1 font-bold text-[#4A8664] underline">{t("Family Life","حياة العيلة")}<ArrowRight className="size-4 rtl:rotate-180"/></Link>
   </div>
  </div>
 </AppShell>;
}
