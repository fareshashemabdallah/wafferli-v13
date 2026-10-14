import { createFileRoute, Link } from "@tanstack/react-router";
import { MessageSquareText, Search, Send, ShieldAlert, Star } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { communityDb as db, itemKey, opinionNoticeAr, opinionNoticeEn, type ExperienceReview } from "@/lib/community";
import { useI18n } from "@/lib/i18n";
import type { User } from "@supabase/supabase-js";
export const Route=createFileRoute("/experience")({
 head:()=>({meta:[{title:"Experience Notes — Dabberna"},{name:"description",content:"Read or contribute personal experiences for a specific place, product or service."}]}),
 component:Experience
});
const types=[
 {key:"doctor",en:"Doctor",ar:"طبيب"},
 {key:"restaurant",en:"Restaurant",ar:"مطعم"},
 {key:"playground",en:"Playground",ar:"ملعب أطفال"},
 {key:"product",en:"Product / material",ar:"منتج أو مادة"},
 {key:"school",en:"School",ar:"مدرسة"},
 {key:"activity",en:"Activity",ar:"نشاط"},
 {key:"home-service",en:"Home service",ar:"خدمة منزلية"},
 {key:"other",en:"Other",ar:"غير ذلك"}
];
function Experience(){
 const {lang}=useI18n(),ar=lang==="ar";
 const [user,setUser]=useState<User|null>(null),[email,setEmail]=useState("");
 const [type,setType]=useState("restaurant"),[item,setItem]=useState(""),[city,setCity]=useState("Amman");
 const [current,setCurrent]=useState<{type:string;item:string;city:string;key:string}|null>(null);
 const [reviews,setReviews]=useState<ExperienceReview[]>([]),[author,setAuthor]=useState(""),[rating,setRating]=useState(""),[body,setBody]=useState(""),[personal,setPersonal]=useState(true);
 const [busy,setBusy]=useState(false),[error,setError]=useState(""),[notice,setNotice]=useState("");
 useEffect(()=>{
  let active=true;
  db.auth.getUser().then(({data}:{data:{user:User|null}})=>{if(active)setUser(data.user)}).catch(()=>{});
  const {data}=db.auth.onAuthStateChange((_e:string,session:{user:User}|null)=>setUser(session?.user??null));
  const p=new URLSearchParams(window.location.hash.split("?")[1]??"");
  const preType=p.get("type"),preItem=p.get("name"),preCity=p.get("city");
  if(preType&&types.some(t=>t.key===preType))setType(preType);
  if(preItem)setItem(preItem.slice(0,120));
  if(preCity)setCity(preCity.slice(0,120));
  return ()=>{active=false;data.subscription.unsubscribe()};
 },[]);
 const lookup=async(t:string,n:string,l:string)=>{
  const key=itemKey(t,n,l);
  if(n.trim().length<2 || !l.trim()){setError(ar?"أدخل اسم الخدمة والمنطقة":"Enter the place or item and its area");return;}
  const {data,error}=await db.from("family_experience_reviews").select("id,author_id,author_name,item_type,item_key,item_name,location,rating,experience,experience_type,created_at").eq("item_key",key).order("created_at",{ascending:false}).limit(100);
  if(error)throw error;setCurrent({type:t,item:n,city:l,key});setReviews(data??[]);
 };
 const run=async(fn:()=>Promise<void>)=>{setBusy(true);setError("");setNotice("");try{await fn()}catch(e){setError(e instanceof Error?e.message:String(e))}finally{setBusy(false)}};
 const search=(e:FormEvent)=>{e.preventDefault();void run(()=>lookup(type,item.trim(),city.trim()));};
 const post=(e:FormEvent)=>{e.preventDefault();if(!user||!current)return;void run(async()=>{
  if(author.trim().length<2||body.trim().length<12)throw new Error(ar?"أدخل اسماً ونصاً من 12 حرفاً على الأقل":"Enter a display name and at least 12 characters");
  const {error}=await db.from("family_experience_reviews").insert({
   author_id:user.id,author_name:author.trim().slice(0,40),item_type:current.type,item_key:current.key,item_name:current.item,
   location:current.city,rating:rating?Number(rating):null,experience:body.trim().slice(0,1500),experience_type:personal?"personal":"secondhand"
  });
  if(error)throw error;setBody("");setRating("");setNotice(ar?"تم نشر الرأي الشخصي ضمن صفحة هذه الجهة":"Your experience note is now visible in this item's context");await lookup(current.type,current.item,current.city);
 });};
 const report=(id:string)=>{if(!user)return;const reason=window.prompt(ar?"سبب الإبلاغ عن هذا التقييم":"Why report this review?");if(!reason||reason.trim().length<5)return;void run(async()=>{const {error}=await db.from("family_content_reports").insert({reporter_id:user.id,review_id:id,reason:reason.slice(0,400)});if(error)throw error;setNotice(ar?"تم تسجيل البلاغ للمراجعة":"Report submitted for review");});};
 const remove=(id:string)=>{if(!user)return;void run(async()=>{const {error}=await db.from("family_experience_reviews").delete().eq("id",id).eq("author_id",user.id);if(error)throw error;if(current)await lookup(current.type,current.item,current.city);});};
 return <AppShell title={ar?"تجارب العائلات":"Family Experiences"}>
  <div className="hero-surface rounded-3xl p-5">
   <div className="flex items-center gap-2"><MessageSquareText className="size-6 text-brand"/><h2 className="text-xl font-semibold">{ar?"تعلّم من تجارب الآخرين":"Learn from real people's experiences"}</h2></div>
   <p className="mt-2 text-sm">{ar?"ابحث عن مكان أو طبيب أو لعبة أو منتج محدّد لقراءة آراء المستخدمين الخاصة به فقط. لا نعرضها تلقائياً على الصفحة الرئيسية.":"Search for a particular place, doctor, playground or product. Only experiences attached to that exact search appear—not an unsolicited public feed."}</p>
  </div>
  <form onSubmit={search} className="card-soft mt-4 grid gap-3 p-4 sm:grid-cols-2">
   <label className="text-sm font-medium">{ar?"النوع":"Category"}<select value={type} onChange={e=>{setType(e.target.value);setCurrent(null);}} className="mt-1 w-full rounded-xl border bg-card p-3">{types.map(t=><option value={t.key} key={t.key}>{ar?t.ar:t.en}</option>)}</select></label>
   <label className="text-sm font-medium">{ar?"الاسم المحدد":"Exact place or product name"}<Input className="mt-1" required minLength={2} maxLength={120} value={item} onChange={e=>{setItem(e.target.value);setCurrent(null)}} placeholder={ar?"الاسم كما يظهر في المصدر":"Use the name on its listing"}/></label>
   <label className="text-sm font-medium">{ar?"المدينة أو المنطقة":"City / area"}<Input className="mt-1" required maxLength={120} value={city} onChange={e=>{setCity(e.target.value);setCurrent(null)}}/></label>
   <div className="flex items-end"><Button type="submit" disabled={busy||!user} className="w-full"><Search className="size-4"/>{ar?"عرض التجارب لهذا المكان":"Find this item's reviews"}</Button></div>
  </form>
  {!user&&<div className="mt-4 rounded-xl border bg-muted/60 p-4 text-sm">{ar?"تحتاج إلى تسجيل الدخول للبحث أو إضافة رأي.":"Sign in to search and contribute experiences."} <Link to="/community" className="font-semibold text-brand">{ar?"الدخول عبر البريد":"Email sign-in"} →</Link></div>}
  {current&&<section className="mt-5 space-y-3">
   <h2 className="text-lg font-semibold">{current.item} · {current.city}</h2>
   <p className="text-sm text-muted-foreground">{reviews.length} {ar?"تجارب مرتبطة بهذا الاسم والمنطقة":"experience notes for this exact name and area"}</p>
   <div className="rounded-xl bg-muted p-3 text-xs text-muted-foreground"><ShieldAlert className="me-2 inline size-4"/>{ar?opinionNoticeAr:opinionNoticeEn}</div>
   {reviews.length===0&&<p className="card-soft p-4 text-sm text-muted-foreground">{ar?"لا توجد تجارب منشورة لهذا البحث حتى الآن.":"No contributions match this specific item yet."}</p>}
   {reviews.map(review=><article key={review.id} className="card-soft space-y-2 p-4">
    <div className="flex items-center justify-between gap-2"><b>{review.author_name}</b><time className="text-xs text-muted-foreground">{new Date(review.created_at).toLocaleDateString(ar?"ar-JO":"en-US")}</time></div>
    <p className="text-xs text-muted-foreground">{review.experience_type==="personal"?(ar?"يقول المستخدم إنها تجربة شخصية":"Self-reported firsthand experience"):(ar?"معلومة منقولة":"Secondhand information")} {review.rating? " · "+review.rating+"/5 ★":""}</p>
    <p className="whitespace-pre-wrap break-words text-sm">{review.experience}</p>
    <p className="text-xs italic text-muted-foreground">{ar?opinionNoticeAr:opinionNoticeEn}</p>
    <div className="flex gap-4 text-xs">{user&&<button onClick={()=>report(review.id)} className="text-brand underline">{ar?"إبلاغ":"Report"}</button>}{user?.id===review.author_id&&<button className="text-destructive underline" onClick={()=>remove(review.id)}>{ar?"حذف رأيي":"Delete my note"}</button>}</div>
   </article>)}
   {user&&<form onSubmit={post} className="card-soft space-y-3 p-4">
    <h3 className="flex items-center gap-2 font-semibold"><Star className="size-5 text-brand"/>{ar?"شارك تجربتك عن هذا المكان":"Share your experience with this item"}</h3>
    <label className="block text-sm">{ar?"اسم العرض (لا تكتب اسم طفلك)":"Display name (not your child's name)"}<Input required minLength={2} maxLength={40} className="mt-1" value={author} onChange={e=>setAuthor(e.target.value)} /></label>
    <label className="block text-sm">{ar?"تقييم اختياري":"Optional rating"}<select value={rating} onChange={e=>setRating(e.target.value)} className="mt-1 w-full rounded-xl border bg-card p-3"><option value="">{ar?"بدون تقييم":"No star rating"}</option>{[1,2,3,4,5].map(i=><option value={i} key={i}>{i}/5</option>)}</select></label>
    <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={personal} onChange={e=>setPersonal(e.target.checked)}/>{ar?"اختبرت هذه الخدمة أو المنتج بنفسي":"I personally used this service or product"}</label>
    <label className="block text-sm">{ar?"تفاصيل تجربتك (بدون معلومات صحية خاصة)":"Your experience (avoid sensitive personal or health details)"}<textarea required minLength={12} maxLength={1500} rows={4} value={body} onChange={e=>setBody(e.target.value)} className="mt-1 w-full rounded-xl border bg-card p-3"/></label>
    <p className="text-xs text-muted-foreground">{ar?"سيُعرض رأيك فقط عند البحث عن نفس الاسم والمنطقة، مع إخلاء مسؤولية واضح. هذا لا يثبت صحة التفاصيل، ولا ننشر معلومات الأطفال.":"Your opinion is shown on this item's page with a clear disclaimer. Visit claims are self-reported, not independently verified. Never post child or patient details."}</p>
    <Button disabled={busy} type="submit"><Send className="size-4"/>{ar?"نشر تجربتي":"Publish my experience"}</Button>
   </form>}
  </section>}
  {notice&&<p className="mt-3 rounded-lg bg-mint p-3 text-sm" role="status">{notice}</p>}
  {error&&<p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-800" role="alert">{error}</p>}
 </AppShell>;
}
