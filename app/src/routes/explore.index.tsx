import {createFileRoute,Link} from "@tanstack/react-router";
import {useEffect,useState,type FormEvent} from "react";
import {Compass,Search,MapPin,ExternalLink,HeartHandshake,CalendarPlus,MessageSquareHeart} from "lucide-react";
import type {User} from "@supabase/supabase-js";
import {AppShell} from "@/components/AppShell";
import {useI18n} from "@/lib/i18n";
import {useLocalState,uid} from "@/lib/storage";
import {defaultFamilyPreferences,type FamilyPreferences} from "@/lib/familyPreferences";
import {outingCity,findWeekendPlaces,weekendCityName,type WeekendPlace,type WeekendCity} from "@/lib/weekendPlaceSearch";
import {FAMILY_PLANS_KEY,ACTIVE_PLAN_KEY,makeFamilyPlan,type FamilyPlan} from "@/lib/familyPlans";
import {communityDb as db,itemKey,opinionNoticeEn,opinionNoticeAr,type ExperienceReview,type Group} from "@/lib/community";

export const Route=createFileRoute("/explore/")({
 head:()=>({meta:[{title:"Discover — Dabberna"},{name:"description",content:"Family experiences, trustworthy sources and plans in one place."}]}),
 component:Discover
});
type Kind="outing"|"restaurant"|"activity"|"service";
type Candidate={name:string;city:string;kind:Kind;sourceRef:string;sourceLabel:string;sourceUrl?:string};
const kinds:{id:Kind;en:string;ar:string}[]=[
 {id:"outing",en:"Outings & parks",ar:"طلعات وحدائق"},
 {id:"restaurant",en:"Restaurants",ar:"مطاعم"},
 {id:"activity",en:"Children's activities",ar:"أنشطة الأطفال"},
 {id:"service",en:"Family services",ar:"خدمات العيلة"}
];
const reviewType=(kind:Kind)=>kind==="outing"?"playground":kind==="activity"?"activity":kind==="service"?"other":kind;
const field="mt-1 min-h-11 w-full rounded-xl border border-[#DCE7DE] bg-white px-3 text-sm";
const primary="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#286B52] px-4 text-sm font-semibold text-white disabled:opacity-50";
const secondary="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#D6E7DC] bg-white px-3 text-sm font-semibold text-[#285F4B]";

export function Discover(){
 const {lang}=useI18n();const ar=lang==="ar";
 const t=(en:string,arabic:string)=>ar?arabic:en;
 const [preferences,,prefsReady]=useLocalState<FamilyPreferences>("familyPreferences",defaultFamilyPreferences);
 const [plans,setPlans,plansReady]=useLocalState<FamilyPlan[]>(FAMILY_PLANS_KEY,[]);
 const [,setActivePlan]=useLocalState<string|null>(ACTIVE_PLAN_KEY,null);
 const [kind,setKind]=useState<Kind>("outing");
 const [city,setCity]=useState<WeekendCity>("amman");
 const [name,setName]=useState("");
 const [places,setPlaces]=useState<WeekendPlace[]>([]);
 const [selected,setSelected]=useState<Candidate|null>(null);
 const [busy,setBusy]=useState(false),[error,setError]=useState(""),[notice,setNotice]=useState("");
 const [date,setDate]=useState(""),[estimate,setEstimate]=useState("");
 const [user,setUser]=useState<User|null>(null);
 const [reviews,setReviews]=useState<ExperienceReview[]>([]);
 const [reviewState,setReviewState]=useState<"idle"|"loading"|"available"|"unavailable">("idle");
 const [author,setAuthor]=useState(""),[opinion,setOpinion]=useState("");
 const [rating,setRating]=useState(""),[firsthand,setFirsthand]=useState(true),[consent,setConsent]=useState(false);
 const [groups,setGroups]=useState<Group[]>([]),[chosenGroup,setChosenGroup]=useState("");
 useEffect(()=>{if(prefsReady)setCity(outingCity(preferences.city||"Amman"));},[prefsReady]);
 useEffect(()=>{
  let alive=true;
  db.auth.getUser().then(({data}:{data:{user:User|null}})=>{if(alive)setUser(data.user);}).catch(()=>{});
  const {data}=db.auth.onAuthStateChange((_event:string,session:{user:User}|null)=>setUser(session?.user??null));
  return ()=>{alive=false;data.subscription.unsubscribe();};
 },[]);
 useEffect(()=>{
  if(!user){setGroups([]);return;}
  let alive=true;
  Promise.resolve(db.from("family_groups").select("id,name,description,invite_code,created_at"))
   .then(({data}:{data:Group[]|null})=>{if(alive)setGroups(data??[]);}).catch(()=>{});
  return ()=>{alive=false;};
 },[user?.id]);
 useEffect(()=>{
  if(!selected){setReviews([]);setReviewState("idle");return;}
  let active=true;setReviews([]);setReviewState("loading");
  db.rpc("get_family_experience_reviews",{p_item_key:itemKey(reviewType(selected.kind),selected.name,selected.city)})
   .then(({data,error}:{data:ExperienceReview[]|null;error:unknown})=>{
    if(!active)return;
    if(error){setReviewState("unavailable");return;}
    setReviews(data??[]);setReviewState("available");
   }).catch(()=>{if(active)setReviewState("unavailable");});
  return ()=>{active=false;};
 },[selected]);
 const choose=(place:Candidate)=>{
  setSelected(place);setError("");setNotice("");setDate("");setEstimate("");setConsent(false);
 };
 const discover=async()=>{
  setSelected(null);setError("");setNotice("");setPlaces([]);
  if(kind!=="outing"&&kind!=="activity"){
   if(name.trim().length<2)setNotice(t("Enter a place or service name. Dabberna will not invent reviews or businesses.","أدخل اسم مكان أو خدمة؛ دبّرنا لا تختلق تقييمات أو أماكن."));
   else selectNamed();return;
  }
  setBusy(true);
  try{
   const result=await findWeekendPlaces(city);
   setPlaces(result.places.filter(p=>kind==="outing"||p.category!=="park").slice(0,10));
   if(result.stale)setNotice(t("These public map records may be old. Verify venue details.","قد تكون معلومات الخرائط قديمة. تأكد من تفاصيل المكان."));
  }catch(e){setError(e instanceof Error?e.message:t("Map listings unavailable.","معلومات الخرائط غير متوفرة."));}
  finally{setBusy(false);}
 };
 const selectNamed=()=>{
  const title=name.trim().slice(0,120);
  if(title.length<2)return;
  choose({name:title,city:weekendCityName(city),kind,sourceRef:"named:"+itemKey(reviewType(kind),title,weekendCityName(city)),
   sourceLabel:t("Name supplied by you, not independently verified","الاسم أدخلته أنت ولم يتم التحقق منه")});
 };
 const findNamed=(e:FormEvent)=>{e.preventDefault();selectNamed();};
 const savePlan=()=>{
  if(!selected||!plansReady)return;
  const amount=estimate.trim()?Number(estimate):undefined;
  if(amount!==undefined&&(!Number.isFinite(amount)||amount<0||amount>100000||
   Math.abs(amount*100-Math.round(amount*100))>0.00001)){
   setError(t("Enter a valid JOD estimate, or leave it blank.","أدخل تكلفة صحيحة بالدينار أو اتركها فارغة."));return;
  }
  const existing=plans.find(p=>p.kind==="outing"&&p.status!=="completed"&&p.sourceRef===selected.sourceRef&&
   ((!date&&!p.date)||!!date&&p.date===date));
  if(existing){setActivePlan(existing.id);setNotice(t("This experience is already in your family plans; no duplicate created.","هذه التجربة موجودة بخطط العيلة، ولم ننشئ نسخة ثانية."));return;}
  const made=makeFamilyPlan({id:uid(),title:selected.name,kind:"outing",sourceRef:selected.sourceRef,
   ...(date?{date}:{}),...(amount!==undefined?{budgetJod:amount}:{})});
  if(!made){setError(t("Please check the date or estimate.","راجع التاريخ أو المبلغ."));return;}
  setPlans(old=>[made,...old]);setActivePlan(made.id);
  setNotice(t("Added to Family. This is a plan, not a paid bill or a booking.","أُضيف لخطة العيلة، وليس فاتورة مدفوعة أو حجزاً."));
 };
 const post=async(e:FormEvent)=>{
  e.preventDefault();if(!selected||!user||!consent)return;
  if(author.trim().length<2||opinion.trim().length<12){
   setError(t("Enter a display name and at least 12 characters.","أدخل اسم عرض ورأياً من ١٢ حرفاً على الأقل."));return;
  }
  setBusy(true);setError("");
  try{
   const {error:postError}=await db.from("family_experience_reviews").insert({
    author_id:user.id,author_name:author.trim().slice(0,40),item_type:reviewType(selected.kind),
    item_key:itemKey(reviewType(selected.kind),selected.name,selected.city),
    item_name:selected.name,location:selected.city,rating:rating?Number(rating):null,
    experience:opinion.trim().slice(0,1500),experience_type:firsthand?"personal":"secondhand"
   });
   if(postError)throw postError;
   setOpinion("");setRating("");setConsent(false);
   setNotice(t("Experience shared as an individual opinion, not a verified Dabberna endorsement.","نُشرت تجربتك كرأي شخصي، وليس كتوصية مؤكدة من دبّرنا."));
   const response=await db.rpc("get_family_experience_reviews",{p_item_key:itemKey(reviewType(selected.kind),selected.name,selected.city)});
   if(!response.error){setReviews((response.data??[]) as ExperienceReview[]);setReviewState("available");}
  }catch(e){setError(e instanceof Error?e.message:String(e));}
  finally{setBusy(false);}
 };
 const askCircle=async()=>{
  if(!selected||!user||!chosenGroup)return;
  setBusy(true);setError("");
  try{
   const {error:sendError}=await db.from("family_group_messages").insert({
    group_id:chosenGroup,author_id:user.id,context_type:"advice",context_title:selected.name,
    body:t("Has anyone tried this? Please share your genuine experience, including drawbacks.","هل جرّب أحد هذا المكان؟ شاركونا تجربتكم الصادقة بما فيها السلبيات.")
   });
   if(sendError)throw sendError;
   setNotice(t("Question sent to the chosen circle. No private financial or child profile information was shared.","أُرسل السؤال للدائرة المختارة دون معلومات مالية أو بيانات أطفال خاصة."));
  }catch(e){setError(e instanceof Error?e.message:String(e));}
  finally{setBusy(false);}
 };
 const link=selected?"https://www.google.com/maps/search/?api=1&query="+encodeURIComponent(selected.name+" "+selected.city+" Jordan"):"";
 return <AppShell title={t("Discover","اكتشف")}>
  <div className="mx-auto max-w-3xl space-y-4">
   <section className="rounded-[1.5rem] bg-[#F2F8EC] p-4 sm:p-5">
    <div className="flex items-center gap-2"><Compass className="size-5 text-[#2D7656]"/><h2 className="text-lg font-bold">{t("Find a worthwhile family experience","دَوّر على تجربة بتستاهل")}</h2></div>
    <p className="mt-1 text-sm text-[#65766C]">{t("Discover options, check the source and learn from parents — without five separate tools.","اكتشف الخيارات وتجارب الأهل بمكان واحد، من دون خمسة أدوات منفصلة.")}</p>
    <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label={t("Choose a category","اختَر فئة")}>
     {kinds.map(item=><button key={item.id} type="button" aria-pressed={kind===item.id}
      onClick={()=>{setKind(item.id);setSelected(null);setPlaces([]);setNotice("");setError("");}}
      className={kind===item.id?"rounded-full bg-[#2B7358] px-3 py-2 text-xs font-bold text-white":"rounded-full border border-[#D0E4D8] bg-white px-3 py-2 text-xs font-semibold text-[#476857]"}>
      {ar?item.ar:item.en}</button>)}
    </div>
    <form className="mt-4 grid gap-2 sm:grid-cols-[1fr_auto_auto] sm:items-end" onSubmit={findNamed}>
     <label className="text-xs font-semibold">{t("Place or service name (optional)","اسم المكان أو الخدمة (اختياري)")}
      <input className={field} value={name} maxLength={120} onChange={e=>setName(e.target.value)}
       placeholder={t("Something someone recommended?","حدا نصحك بمكان؟")}/></label>
     <label className="text-xs font-semibold">{t("City","المدينة")}
      <select className={field} value={city} onChange={e=>{setCity(e.target.value as WeekendCity);setSelected(null);setPlaces([]);}}>
       {(["amman","irbid","zarqa","aqaba"] as WeekendCity[]).map(c=><option key={c} value={c}>{weekendCityName(c)}</option>)}
      </select></label>
     <button type="submit" className={secondary} disabled={name.trim().length<2}><Search className="size-4"/>{t("Check it","تأكد")}</button>
    </form>
    <button type="button" onClick={()=>void discover()} disabled={busy} className={primary+" mt-3 w-full sm:w-auto"}>
     <Search className="size-4"/>{busy?t("Searching…","جارٍ البحث…"):kind==="outing"||kind==="activity"?t("Explore mapped places","اعرض أماكن على الخريطة"):t("Find parent experiences","ابحث عن تجارب الأهل")}
    </button>
   </section>
   {error&&<p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm">{error}</p>}
   {notice&&<p role="status" className="rounded-xl border border-[#CADFCE] bg-white p-3 text-sm text-[#285E48]">{notice}</p>}
   {places.length>0&&!selected&&<section aria-label={t("Mapped options","أماكن من الخرائط")} className="space-y-2">
    <p className="text-xs text-[#68786A]">{t("OpenStreetMap listings, not verified prices, child suitability or parent recommendations.","معلومات OpenStreetMap وليست أسعاراً أو ملاءمة أعمار أو توصيات أهل مؤكدة.")}</p>
    {places.map(place=><article key={place.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#DCEBDD] bg-white p-3">
     <div><p className="text-xs text-[#667B69]">{place.category} · {weekendCityName(city)}</p><strong>{place.name}</strong></div>
     <button type="button" className={secondary} onClick={()=>choose({
      name:place.name,city:weekendCityName(city),kind,sourceRef:"osm:"+place.id,sourceLabel:"OpenStreetMap — unverified",sourceUrl:place.osmUrl
     })}>{t("Consider","اعرف أكثر")}</button>
    </article>)}
   </section>}
   {selected&&<section aria-label={t("Choice details","تفاصيل الخيار")} className="space-y-3 rounded-[1.5rem] border border-[#DCEBDD] bg-white p-4 sm:p-5">
    <div className="flex flex-wrap items-start justify-between gap-3">
     <div><p className="text-xs text-[#597A68]">{selected.sourceLabel}</p><h2 className="text-xl font-bold">{selected.name}</h2><p className="text-xs text-[#718078]">{selected.city}</p></div>
     <button type="button" className={secondary} onClick={()=>setSelected(null)}>{t("Back","رجوع")}</button>
    </div>
    <div className="rounded-xl bg-[#F5F9F5] p-3">
     <h3 className="flex items-center gap-2 font-semibold"><MessageSquareHeart className="size-5"/>{t("Parent experiences","تجارب الأهل")}</h3>
     {reviewState==="loading"&&<p className="mt-2 text-sm">{t("Checking experiences…","جارٍ البحث عن التجارب…")}</p>}
     {reviewState==="unavailable"&&<p className="mt-2 text-sm">{t("Community reviews are unavailable; we cannot verify a recommendation.","التقييمات غير متوفرة حالياً ولا يمكن تأكيد التوصية.")}</p>}
     {reviewState==="available"&&reviews.length===0&&<p className="mt-2 text-sm">{t("No parent experience recorded for this exact name and city yet.","لا توجد تجارب أهل مسجلة بهذا الاسم والمدينة حالياً.")}</p>}
     {reviewState==="available"&&reviews.slice(0,8).map(review=><article key={review.id} className="mt-2 rounded-lg border bg-white p-3">
      <p className="text-xs font-semibold">{review.author_name} · {review.experience_type==="personal"?t("Self-reported firsthand","تجربة مباشرة حسب إفادة المستخدم"):t("Secondhand","تجربة منقولة")}{review.rating?" · "+review.rating+"/5":""}</p>
      <p className="mt-1 whitespace-pre-wrap text-sm">{review.experience}</p>
     </article>)}
     <p className="mt-2 text-[11px] text-[#728078]">{ar?opinionNoticeAr:opinionNoticeEn}</p>
    </div>
    <div className="rounded-xl border border-[#E1E8E0] p-3">
     <h3 className="flex items-center gap-2 font-semibold"><CalendarPlus className="size-5"/>{t("Make it a family plan","حوّلها لخطة عائلية")}</h3>
     <p className="mt-1 text-xs text-[#718078]">{t("Check child suitability, safety, price and availability with the provider. A plan does not pay or book anything.","تأكد من السعر وملاءمة الأطفال والتوفر والأمان. الخطة ليست حجزاً أو دفعاً.")}</p>
     <div className="mt-3 grid gap-2 sm:grid-cols-2">
      <label className="text-xs font-semibold">{t("Possible date (optional)","التاريخ المتوقع (اختياري)")}
       <input type="date" className={field} value={date} onChange={e=>setDate(e.target.value)}/></label>
      <label className="text-xs font-semibold">{t("Your family cost estimate, JOD (optional)","تقدير تكلفة العيلة بالدينار (اختياري)")}
       <input className={field} inputMode="decimal" value={estimate} onChange={e=>setEstimate(e.target.value)}/></label>
     </div>
     <div className="mt-3 flex flex-wrap gap-2">
      <button type="button" disabled={!plansReady} onClick={savePlan} className={primary}>{t("Add to Family","أضف لخطة العيلة")}</button>
      <a href={link} target="_blank" rel="noopener noreferrer" className={secondary}><MapPin className="size-4"/>{t("Check location","تأكد من الموقع")}<ExternalLink className="size-3"/></a>
      {selected.sourceUrl&&<a href={selected.sourceUrl} target="_blank" rel="noopener noreferrer" className={secondary}>{t("Original source","المصدر الأصلي")}</a>}
     </div>
    </div>
    <details className="rounded-xl border border-[#E1E8E0] p-3">
     <summary className="cursor-pointer text-sm font-semibold">{t("Ask my circle or share a genuine opinion","اسأل دائرتي أو شارك تجربتي")}</summary>
     {!user?<p className="mt-3 text-xs">{t("Sign in to contribute. Browsing remains available without signing in.","سجّل الدخول للمشاركة؛ يمكنك الاستكشاف دون تسجيل.")} <Link to="/community" className="font-semibold underline">{t("Sign in / manage circles","الدخول وإدارة الدوائر")}</Link></p>:
     <div className="mt-3 space-y-4">
      <div className="rounded-lg bg-[#F7FAF7] p-3">
       <h4 className="flex items-center gap-2 text-sm font-semibold"><HeartHandshake className="size-4"/>{t("Ask a trusted circle","اسأل دائرة موثوقة")}</h4>
       {groups.length?<div className="mt-2 flex flex-wrap gap-2">
        <select className={field} value={chosenGroup} onChange={e=>setChosenGroup(e.target.value)}>
         <option value="">{t("Choose circle","اختَر دائرة")}</option>{groups.map(g=><option key={g.id} value={g.id}>{g.name}</option>)}
        </select>
        <button type="button" className={secondary} disabled={!chosenGroup||busy} onClick={()=>void askCircle()}>{t("Ask for experiences","اسأل عن تجارب")}</button>
       </div>:<Link to="/community" className="mt-2 inline-flex text-sm font-semibold underline">{t("Create a trusted circle","أنشئ دائرة موثوقة")}</Link>}
      </div>
      <form onSubmit={e=>void post(e)} className="space-y-2">
       <p className="text-sm font-semibold">{t("Share your experience — positive or negative","شارك تجربتك، سواء إيجابية أو سلبية")}</p>
       <label className="block text-xs">{t("Display name (not your child's name)","اسم العرض (ليس اسم الطفل)")}
        <input className={field} value={author} maxLength={40} onChange={e=>setAuthor(e.target.value)}/></label>
       <label className="block text-xs">{t("Optional rating","تقييم اختياري")}
        <select className={field} value={rating} onChange={e=>setRating(e.target.value)}>
         <option value="">{t("No star rating","بدون نجوم")}</option>{[1,2,3,4,5].map(n=><option key={n} value={n}>{n}/5</option>)}
        </select></label>
       <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={firsthand} onChange={e=>setFirsthand(e.target.checked)}/>{t("I personally experienced it","هذه تجربتي الشخصية")}</label>
       <label className="block text-xs">{t("What should other parents know?","شو لازم يعرفوا بقية الأهل؟")}
        <textarea className={field+" p-2"} value={opinion} maxLength={1500} rows={2} onChange={e=>setOpinion(e.target.value)}/></label>
       <label className="flex items-start gap-2 text-xs"><input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)}/>
        {t("I agree to publish my opinion on this item's community page. I included no private child or financial data.","أوافق على نشر رأيي في صفحة هذا المكان، ولم أدرج بيانات خاصة بالأطفال أو مالية.")}</label>
       <button type="submit" className={primary} disabled={busy||!consent||opinion.trim().length<12||author.trim().length<2}>{t("Publish my opinion","انشر رأيي")}</button>
      </form>
     </div>}
    </details>
   </section>}
  </div>
 </AppShell>;
}
