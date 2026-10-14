import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Flag, Search, ShieldAlert, Star, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/lib/i18n";
import {
  getExperienceReviews, hideCommunityContent, postExperienceReview,
  reportCommunityContent, reviewTypes, type ExperienceReview, type ReviewType
} from "@/lib/community";

type Props={groupId:string;currentUserId:string;initialType:ReviewType;initialName:string;initialArea:string};
type Lookup={type:ReviewType;name:string;area:string};
const titles:Record<ReviewType,[string,string]>={
  doctor:["Doctor / healthcare professional","طبيب / اختصاصي صحي"],
  restaurant:["Restaurant or café","مطعم أو مقهى"],
  playground:["Playground / activity","ملعب أو نشاط"],
  product:["Product / material","منتج / مادة"],
  school:["School / tutor","مدرسة / معلّم"],
  service:["Service provider","مقدم خدمة"],
  other:["Other place or item","مكان أو شيء آخر"]
};
export function CommunityReviews({groupId,currentUserId,initialType,initialName,initialArea}:Props) {
  const {lang}=useI18n();const ar=lang==="ar";
  const [type,setType]=useState<ReviewType>(reviewTypes.includes(initialType)?initialType:"restaurant");
  const [name,setName]=useState(initialName||""),[area,setArea]=useState(initialArea||"Amman");
  const [lookup,setLookup]=useState<Lookup|null>(initialName.length>=3&&initialArea.length>=2?{type:reviewTypes.includes(initialType)?initialType:"restaurant",name:initialName,area:initialArea}:null);
  const [reviews,setReviews]=useState<ExperienceReview[]>([]);
  const [rating,setRating]=useState(4),[body,setBody]=useState(""),[confirmed,setConfirmed]=useState(false);
  const [loading,setLoading]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState("");
  const read=useCallback(async()=>{
    if(!lookup){setReviews([]);return;}
    setLoading(true);setError("");
    try{setReviews(await getExperienceReviews(groupId,lookup.type,lookup.name,lookup.area));}
    catch(e){setError(e instanceof Error?e.message:"Reviews are unavailable");}
    finally{setLoading(false);}
  },[groupId,lookup]);
  useEffect(()=>{void read();},[read]);
  const find=(e:FormEvent)=>{e.preventDefault();if(name.trim().length<3||area.trim().length<2)return;
    setLookup({type,name:name.trim(),area:area.trim()});};
  const post=async(e:FormEvent)=>{
    e.preventDefault();if(!lookup||busy||!confirmed||body.trim().length<15)return;
    setBusy(true);setError("");
    try{await postExperienceReview(groupId,lookup.type,lookup.name,lookup.area,rating,body.trim());
      setBody("");setConfirmed(false);await read();
    }catch(x){setError(x instanceof Error?x.message:"Could not share your review");}
    finally{setBusy(false);}
  };
  const moderate=async(mode:"report"|"hide",review:ExperienceReview)=>{
    if(mode==="report"&&!confirm(ar?"إبلاغ عن تقييم مسيء أو غير دقيق؟":"Report this review as abusive or misleading?"))return;
    try{
      if(mode==="report")await reportCommunityContent("review",review.id,"Potentially abusive or misleading review");
      else await hideCommunityContent("review",review.id);
      await read();
    }catch(x){setError(x instanceof Error?x.message:"Could not perform this action");}
  };
  const changed=lookup&&(lookup.type!==type||lookup.name!==name.trim()||lookup.area!==area.trim());
  return <section className="card-soft p-4">
    <h3 className="flex items-center gap-2 font-semibold"><Search className="size-5 text-brand"/>{ar?"ابحث عن تجربة محددة":"Look up a specific experience"}</h3>
    <p className="mt-1 text-sm text-muted-foreground">{ar?"التقييمات لا تظهر في موجز عام. اكتب اسم المكان أو المنتج والمدينة بدقة، واختر مجموعتك الخاصة.":"Reviews are not shown in a general feed. Search for the exact named place or product and its area, within your private group."}</p>
    <form onSubmit={find} className="mt-4 grid gap-3 sm:grid-cols-2">
      <label className="text-sm font-medium">{ar?"التصنيف":"Category"}<select className="mt-1 w-full rounded-xl border border-border bg-card p-3" value={type} onChange={e=>setType(e.target.value as ReviewType)}>{reviewTypes.map(t=><option key={t} value={t}>{titles[t][ar?1:0]}</option>)}</select></label>
      <label className="text-sm font-medium">{ar?"المنطقة أو المدينة":"Area / city"}<Input className="mt-1" required minLength={2} maxLength={80} value={area} onChange={e=>setArea(e.target.value)}/></label>
      <label className="text-sm font-medium sm:col-span-2">{ar?"اسم الطبيب أو المطعم أو الملعب أو المنتج":"Exact provider, place or product name"}<Input className="mt-1" required minLength={3} maxLength={100} value={name} onChange={e=>setName(e.target.value)} placeholder={ar?"أدخل الاسم المحدد":"Enter the specific name"}/></label>
      <Button type="submit" className="sm:col-span-2"><Search className="size-4"/>{ar?"عرض تجارب هذا الاسم":"Find experiences for this exact name"}</Button>
    </form>
    {changed&&<p className="mt-2 text-xs text-muted-foreground">{ar?"غيّرت البحث. اضغط «عرض تجارب» لتحديث النتائج.":"Search details changed; select Find to refresh the results."}</p>}
    {!lookup?<p className="mt-5 rounded-xl bg-muted p-4 text-sm text-muted-foreground">{ar?"ابدأ بالبحث عن مكان أو منتج محدد لرؤية الآراء المنشورة عنه.":"Search for an exact item to see its experiences. No reviews appear until you search."}</p>:
    <>
      <div className="mt-6 border-t border-border pt-4">
        <h4 className="font-semibold">{lookup.name} · {lookup.area}</h4>
        <p className="mt-1 text-xs text-muted-foreground">{ar?"مراجعات أعضاء مجموعتك فقط، وليست توصيات دبّرنا":"Reviews from your group only, not Dabberna recommendations"}</p>
        {loading?<p className="mt-3 text-sm text-muted-foreground">{ar?"جارٍ تحميل التجارب...":"Loading experiences…"}</p>:
        reviews.length===0?<p className="mt-3 rounded-xl bg-muted p-3 text-sm text-muted-foreground">{ar?"لا توجد تجارب منشورة لهذا الاسم في هذه المجموعة.":"No experiences yet for this exact item in this group."}</p>:
        <div className="mt-3 space-y-3">
          {reviews.map(r=><article key={r.id} className="rounded-xl border border-border bg-background/70 p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="font-semibold">{r.display_name} <span className="ms-1 text-xs font-normal text-muted-foreground">· {new Date(r.created_at).toLocaleDateString(ar?"ar-JO":"en-GB")}</span></p>
              <p className="flex items-center gap-1 font-semibold text-amber-700"><Star className="size-4 fill-current"/> {r.rating}/5</p>
            </div>
            <p className="mt-2 whitespace-pre-wrap break-words text-sm">{r.body}</p>
            <p className="mt-2 text-xs text-muted-foreground">{ar?"تجربة شخصية صرّح بها المستخدم؛ لم يتم التحقق منها بشكل مستقل.":"User-declared firsthand experience; not independently verified."}</p>
            <div className="mt-2 flex justify-end gap-3">
              {r.author_id===currentUserId?<button type="button" onClick={()=>void moderate("hide",r)} className="text-xs text-muted-foreground" aria-label={ar?"إزالة تقييمي":"Remove my review"}><Trash2 className="size-4"/></button>:
                <button type="button" onClick={()=>void moderate("report",r)} className="text-xs text-muted-foreground" aria-label={ar?"إبلاغ":"Report review"}><Flag className="size-4"/></button>}
            </div>
          </article>)}
        </div>}
      </div>
      <form onSubmit={post} className="mt-5 space-y-3 border-t border-border pt-4">
        <h4 className="font-semibold">{ar?"شارك تجربة شخصية عن هذا المكان":"Share a firsthand experience about this item"}</h4>
        <label className="block text-sm">{ar?"تقييمك الشخصي":"Your own rating"} <select value={rating} onChange={e=>setRating(Number(e.target.value))} className="ms-2 rounded-xl border border-border bg-card p-2">{[1,2,3,4,5].map(n=><option key={n} value={n}>{n} / 5</option>)}</select></label>
        <label className="block text-sm font-medium">{ar?"ماذا كانت تجربتك؟":"What was your experience?"}
          <textarea rows={4} minLength={15} maxLength={1200} required value={body} onChange={e=>setBody(e.target.value)}
            className="mt-1 w-full rounded-xl border border-border bg-card p-3 text-sm" placeholder={ar?"صف ما حدث معك دون معلومات طبية أو خاصة أو اتهامات غير موثقة":"Describe your direct experience without health details, private information or unsupported allegations"}/>
        </label>
        <label className="flex items-start gap-2 text-sm"><input type="checkbox" checked={confirmed} onChange={e=>setConfirmed(e.target.checked)} className="mt-1 size-4"/>
          <span>{ar?"أؤكد أنني استخدمت هذا المنتج أو زرت هذا المكان بنفسي. أعلم أن تقييمي رأي شخصي وليس حقيقة متحققة.":"I confirm I personally visited or used this service/item. This is my opinion, not a verified factual finding."}</span>
        </label>
        <Button disabled={!confirmed||body.trim().length<15||busy} type="submit">{ar?"نشر رأيي للمجموعة":"Share with this group"}</Button>
      </form>
    </>}
    <aside className="mt-5 flex items-start gap-2 rounded-xl bg-muted p-3 text-xs text-muted-foreground"><ShieldAlert className="size-5 shrink-0"/>
      <p>{ar?"الآراء المنشورة تمثل أصحابها فقط، ولا تعبر عن رأي أو موافقة دبّرنا. لا نعتمدها كإرشادات طبية. يمكن الإبلاغ عن المحتوى الضار. تأكدوا من معلومات الأطباء والتراخيص بشكل مستقل.":"Reviews are users' personal opinions, not those of Dabberna. They are not medical advice or an endorsement. Report harmful content, and verify qualifications independently."}</p>
    </aside>
    {error&&<p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}
  </section>;
}
