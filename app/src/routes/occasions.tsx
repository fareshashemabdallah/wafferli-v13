import {createFileRoute,Link} from "@tanstack/react-router";
import {ArrowUpRight,CalendarHeart,Check,CheckCircle2,Gift,Globe2,Heart,Lightbulb,Search,ShieldCheck,Sparkles} from "lucide-react";
import {useEffect,useMemo,useState} from "react";
import {AppShell} from "@/components/AppShell";
import {FamilyWishlistPanel} from "@/components/FamilyWishlistPanel";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import {useI18n} from "@/lib/i18n";
import {type FamilyMoment,formatMomentDate} from "@/lib/familyCalendar";
import {sampleMembers,sampleMoney,type Member} from "@/lib/money";
import {daysUntil,eventBudgetGuidance,ideaCategory,leadAdvice,occasionIdeas,planKey,planningMilestones,upcomingPlanEvents,type OccasionPlan,type OccasionPlans} from "@/lib/occasionAdvisor";
import {useLocalState,writeLocal,uid} from "@/lib/storage";
import {FAMILY_PLANS_KEY,ACTIVE_PLAN_KEY,makeFamilyPlan,setPlanChoice,type FamilyPlan} from "@/lib/familyPlans";
import {activeDecisionKey,startDecisionJourney,externalMapLink} from "@/lib/decisionJourney";
import {defaultFamilyPreferences} from "@/lib/familyPreferences";

export const Route=createFileRoute("/occasions")({
 head:()=>({meta:[{title:"Plan a Special Occasion — Dabberna"},{name:"description",content:"Plan meaningful gifts and experiences before an occasion. Discover fresh public online inspiration while keeping family data private."}]}),
 component:OccasionPlanner
});
type Category="kids-birthday"|"adult-birthday"|"anniversary"|"family-occasion";
type Article={title:string;url:string;publisher:string;published:string};
type TrendFeed={generated_at:string|null;topics:Partial<Record<Category,Article[]>>};
const topics:Record<Category,string>={
 "kids-birthday":"creative age appropriate birthday gift ideas experiences kids Jordan",
 "adult-birthday":"thoughtful birthday gifts experiences adults",
 "anniversary":"creative anniversary experience meaningful gift ideas",
 "family-occasion":"new family activities weekend experiences Amman Jordan"
};
const safeFeed=(data:unknown):TrendFeed|null=>{
 if(!data||typeof data!=="object")return null;
 const raw=data as Partial<TrendFeed>;
 if(!raw.topics||typeof raw.topics!=="object")return null;
 const result:TrendFeed={generated_at:typeof raw.generated_at==="string"?raw.generated_at:null,topics:{}};
 for(const key of Object.keys(topics) as Category[]){
  const list=raw.topics[key];
  result.topics[key]=Array.isArray(list)?list.filter((x):x is Article=>
   !!x&&typeof x.title==="string"&&x.title.length<240&&
   typeof x.url==="string"&&x.url.startsWith("https://news.google.com/")&&
   typeof x.published==="string"&&/^\d{4}-\d{2}-\d{2}$/.test(x.published)&&
   typeof x.publisher==="string"
  ).slice(0,4):[];
 }
 return result;
};
function OccasionPlanner(){
 const {lang}=useI18n(),ar=lang==="ar";
 const [events,,eventsReady]=useLocalState<FamilyMoment[]>("familyCalendar",[]);
 const [members,,membersReady]=useLocalState<Member[]>("members",sampleMembers());
 const [money]=useLocalState("money",sampleMoney());
 const [plans,setPlans]=useLocalState<OccasionPlans>("occasionPlans",{});
 const [familyPlans,setFamilyPlans]=useLocalState<FamilyPlan[]>(FAMILY_PLANS_KEY,[]);
 const [,setActivePlan]=useLocalState<string|null>(ACTIVE_PLAN_KEY,null);
 const [prefs]=useLocalState("familyPreferences",defaultFamilyPreferences);
 const [chosen,setChosen]=useState("");
 const [feed,setFeed]=useState<TrendFeed|null>(null);
 const [feedState,setFeedState]=useState<"loading"|"loaded"|"unavailable">("loading");
 const now=useMemo(()=>new Date(),[]);
 const upcoming=useMemo(()=>upcomingPlanEvents(events,members,now,180,ar).slice(0,24),[events,members,now,ar]);
 const active=upcoming.find(o=>planKey(o)===chosen)??upcoming[0];
 const key=active?planKey(active):"";
 const plan:OccasionPlan=plans[key]??{budgetJod:null};
 const days=active?daysUntil(active.occursOn,now):null;
 const ideas=active?occasionIdeas(active,members):[];
 const financial=eventBudgetGuidance(plan,money,now);
 const category=active?ideaCategory(active,members):"family-occasion";
 const steps=days!==null?planningMilestones(days):[];
 const update=(patch:Partial<OccasionPlan>)=>{
  if(!key)return;
  setPlans(current=>({...current,[key]:{budgetJod:null,...current[key],...patch,updatedAt:new Date().toISOString()}}));
 };
 useEffect(()=>{
  let ok=true;
  const ac=new AbortController();
  fetch(import.meta.env.BASE_URL+"occasion-trends.json",{signal:ac.signal,cache:"no-store"})
  .then(async r=>{if(!r.ok)throw new Error("Feed unavailable");return r.json();})
  .then(data=>{if(ok){setFeed(safeFeed(data));setFeedState("loaded");}})
  .catch(()=>{if(ok)setFeedState("unavailable");});
  return()=>{ok=false;ac.abort();};
 },[]);
 const articleList=feed?.topics[category]??[];
 const publishedAt=feed?.generated_at?new Date(feed.generated_at):null;
 const isFresh=publishedAt&&Number.isFinite(publishedAt.getTime())&&Date.now()-publishedAt.getTime()<14*86400000;
 const publicSearchUrl="https://www.google.com/search?"+new URLSearchParams({q:topics[category]+" "+now.getFullYear(),tbs:"qdr:m"}).toString();
 return <AppShell title={ar?"نخطّط للمناسبات بذكاء":"Make the Moment Special"}>
  <section className="hero-surface rounded-3xl p-5 sm:p-7">
   <div className="flex gap-3"><span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-white/80 text-brand"><CalendarHeart className="size-6"/></span>
    <div><h2 className="text-xl font-semibold">{ar?"ذكريات حلوة دون إنفاق عشوائي":"Thoughtful memories. No rushed spending."}</h2>
     <p className="mt-2 text-sm text-muted-foreground">{ar?"نبدأ مبكرًا، نفكّر بهدية أو تجربة مناسبة، ثم نقارن القيمة الحقيقية قبل أي شراء. ليس الهدف صرف كامل الميزانية.":"Plan ahead for the people you love. Find gifts and experiences with real meaning, and verify value before you spend. Your budget is a ceiling, not a target."}</p>
    </div>
   </div>
  </section>
  {!eventsReady||!membersReady?<p className="mt-4 text-sm text-muted-foreground">{ar?"جارٍ تحميل مناسباتك…":"Loading your occasions…"}</p>
  :upcoming.length===0?<div className="card-soft mt-4 p-5">
    <h2 className="font-semibold">{ar?"ابدأ بمناسبة قادمة":"Start with an upcoming date"}</h2>
    <p className="mt-2 text-sm text-muted-foreground">{ar?"أضف عيد ميلاد في عائلتي أو ذكرى زواج أو مناسبة في التقويم. سنجهّز أفكارًا قبل الموعد.":"Add a birthday in My Family, or an anniversary or special date in the calendar. We'll help you get ready early."}</p>
    <div className="mt-4 flex flex-wrap gap-3"><Link to="/space" className="rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white">{ar?"عائلتي":"My Family"}</Link><Link to="/calendar" className="rounded-xl border px-4 py-2.5 text-sm font-semibold text-brand">{ar?"تقويم العائلة":"Family Calendar"}</Link></div>
   </div>:
  <>
   <section className="mt-5">
    <div className="mb-3 flex flex-wrap items-center justify-between gap-2"><h2 className="text-lg font-semibold">{ar?"اختر المناسبة":"Choose an occasion"}</h2><Link to="/calendar" className="text-xs font-semibold text-brand">{ar?"إدارة التقويم":"Manage calendar"} →</Link></div>
    <div className="flex gap-2 overflow-x-auto pb-2">
     {upcoming.map(e=><button type="button" key={planKey(e)} onClick={()=>setChosen(planKey(e))}
       className={"min-w-[9.75rem] shrink-0 rounded-2xl border p-3 text-start transition "+(planKey(e)===key?"border-brand bg-mint":"border-border bg-card")}>
       <p className="truncate text-sm font-semibold">{e.title}</p>
       <p className="mt-1 text-xs text-muted-foreground">{formatMomentDate(e.occursOn,ar)}</p>
       <p className="mt-1 text-xs text-brand">{daysUntil(e.occursOn,now)===0?(ar?"اليوم":"Today"):(ar?"بعد ":"In ")+daysUntil(e.occursOn,now)+(ar?" يوم":" days")}</p>
      </button>)}
    </div>
   </section>
   {active&&days!==null&&<>
    <section className="mt-4 rounded-2xl border border-border bg-card p-4 sm:p-5">
     <div className="flex items-start gap-3"><Heart className="mt-0.5 size-5 shrink-0 text-[#BD8772]"/>
      <div><h2 className="font-semibold">{ar?"متى نبدأ؟":"When should we start?"}</h2><p className="mt-1 text-sm text-muted-foreground">{leadAdvice(days,ar)}</p></div></div>
     <div className="mt-4 flex flex-wrap items-center gap-3">
      <label htmlFor="event-budget" className="text-sm font-medium">{ar?"الميزانية المريحة لهذه المناسبة":"Your comfortable ceiling (JOD)"}</label>
      <Input id="event-budget" className="max-w-36" type="number" inputMode="decimal" min={0} max={100000} step="0.01"
       placeholder={ar?"اختياري":"Optional"} value={plan.budgetJod==null?"":String(plan.budgetJod)}
       onChange={e=>{const v=e.target.value;update({budgetJod:v===""?null:Math.min(100000,Math.max(0,Math.round(Number(v)*100)/100))});}}/>
     </div>
     <p className="mt-2 text-xs text-muted-foreground">{ar?"هذا حد تختاره بنفسك، وليس مبلغًا ننصح بإنفاقه. الخيارات البسيطة قد تكون أفضل.":"You choose the limit. The app will never recommend using every dinar. A modest gesture may mean more."}</p>
     <div className="mt-3 flex flex-wrap items-center gap-3">
      {familyPlans.some(p=>p.sourceRef==="occasion:"+key)?
       <Link to="/plans" className="inline-flex min-h-11 items-center rounded-full bg-[#EAF1E8] px-4 text-sm font-semibold text-brand">{ar?"افتح هذه المناسبة في خططنا":"Open this in Plans"} →</Link>:
       <button type="button" className="min-h-11 rounded-full border border-[#CADBCC] bg-white px-4 text-sm font-semibold text-brand" onClick={()=>{
        if(!active)return;
        const ref="occasion:"+key;
        const existing=familyPlans.find(p=>p.sourceRef===ref);
        if(existing){setActivePlan(existing.id);return;}
        const p=makeFamilyPlan({id:uid(),title:active.title,kind:"occasion",date:active.occursOn,
         ...(plan.budgetJod!==null?{budgetJod:plan.budgetJod}:{}),sourceRef:ref});
        if(!p)return;
        const idea=ideas.find(i=>i.id===plan.chosenIdea);
        const linked=idea?setPlanChoice(p,{label:ar?idea.ar:idea.en,source:"occasion"}):p;
        setFamilyPlans(old=>[linked,...old]);setActivePlan(linked.id);
       }}>{ar?"أضف المناسبة إلى خططنا":"Add occasion to Our Plans"}</button>}
      <span className="text-xs text-muted-foreground">{ar?"ستبقى خططك على هذا الجهاز":"Your plans stay on this device"}</span>
     </div>
     {plan.budgetJod!==null&&<div className="mt-3 rounded-xl bg-muted/40 p-3 text-sm">
      <ShieldCheck className="me-2 inline size-4 text-brand"/>
      {financial.status==="demo"?(ar?"بيانات المالية الحالية تجريبية؛ لا يمكن تقييم قدرتك على الدفع منها.":"Your finance figures are demo data, so affordability cannot be assessed.")
      :financial.status==="unknown"?(ar?"للتقييم بحذر، أدخل السيولة والالتزامات والاحتياطي الحقيقي في المالية.":"For a cautious check, enter actual cash, commitments and reserve in Our Finances.")
      :financial.status==="review"?(ar?"قد يتجاوز السقف الحالي السيولة المحسوبة أو توجد التزامات مستحقة. راجع الخطة.":"This ceiling may exceed your recorded cash-flow estimate, or a commitment may be overdue. Review your plan.")
      :(ar?"الحد ضمن تقدير السيولة المدخلة، بشرط اكتمال جميع الالتزامات. ليس ضمانًا ماليًا.":"Within the entered cash-flow estimate if all obligations are captured. This is not a guarantee.")}
      <Link to="/money" className="ms-1 font-semibold text-brand underline">{ar?"راجع المالية":"Review finances"}</Link>
     </div>}
    </section>
    <section className="mt-6">
     <div className="mb-3 flex items-center gap-2"><Lightbulb className="size-5 text-brand"/><h2 className="text-lg font-semibold">{ar?"أفكار مصممة لهذه المناسبة":"Ideas worth considering"}</h2></div>
     <div className="grid gap-3 sm:grid-cols-3">
      {ideas.map(idea=>{
       const selected=plan.chosenIdea===idea.id;
       return <article key={idea.id} className={"card-soft flex flex-col gap-2 p-4 "+(selected?"ring-2 ring-brand":"")}>
        <span className="text-xs font-semibold uppercase tracking-wide text-[#A16D5E]">{idea.focus==="gift"?(ar?"هدية":"GIFT"):idea.focus==="experience"?(ar?"تجربة":"EXPERIENCE"):(ar?"وقت معًا":"TOGETHER")}</span>
        <h3 className="text-base font-semibold">{ar?idea.ar:idea.en}</h3>
        <p className="flex-1 text-sm text-muted-foreground">{ar?idea.whyAr:idea.whyEn}</p>
        {plan.budgetJod!==null&&<p className="rounded-lg bg-muted/60 px-2.5 py-2 text-xs text-muted-foreground">{ar?"حصة تخطيطية اختيارية حتى ":"Illustrative allocation up to "}{Math.round(plan.budgetJod*idea.share).toLocaleString("en-US")} JOD{ar?" (وليست سعرًا)":" (not a price quote)"}</p>}
        <Button type="button" size="sm" variant={selected?"default":"outline"} onClick={()=>update({chosenIdea:selected?"":idea.id})}>{selected?<Check className="size-4"/>:<Heart className="size-4"/>}{selected?(ar?"تم اختيارها":"Selected"):(ar?"تعجبني الفكرة":"I like this idea")}</Button>
       </article>;
      })}
     </div>
     <p className="mt-2 text-xs text-muted-foreground">{ar?"هذه أفكار مبنية على نوع المناسبة والعمر عند توفره. ليست منتجات متاحة أو أسعارًا مؤكدة، ولا توصيات ذكاء اصطناعي متصلة.":"These are creative starting points based on the occasion and age when known. They are not verified products, live prices or connected AI recommendations."}</p>
    </section>
    <section className="card-soft mt-5 p-4 sm:p-5">
     <h2 className="flex items-center gap-2 font-semibold"><CheckCircle2 className="size-5 text-brand"/>{ar?"خطة بسيطة للاستعداد":"Your preparation checklist"}</h2>
     <div className="mt-3 space-y-2">{steps.map(step=>{
      const checked=(plan.done??[]).includes(step.id);
      return <label key={step.id} className="flex cursor-pointer items-center gap-3 rounded-xl bg-muted/35 px-3 py-3 text-sm">
       <input type="checkbox" checked={checked} className="size-4 accent-[#426958]" onChange={()=>update({done:checked?(plan.done??[]).filter(x=>x!==step.id):[...(plan.done??[]),step.id]})}/>
       <span className={"flex-1 "+(checked?"text-muted-foreground line-through":"")}>{ar?step.ar:step.en}</span>
       {step.due&&!checked&&<span className="text-xs text-[#99663F]">{ar?"الوقت مناسب":"Time to do"}</span>}
      </label>;
     })}</div>
    </section>
    <section className="mt-6 rounded-2xl border border-[#CFE0D5] bg-[#F4F9F3] p-4 sm:p-5">
     <div className="flex items-start gap-3"><Globe2 className="mt-0.5 size-6 shrink-0 text-brand"/><div>
       <h2 className="text-lg font-semibold">{ar?"أفكار جديدة من الإنترنت":"Fresh inspiration from the web"}</h2>
       <p className="mt-1 text-sm text-muted-foreground">{ar?"نحدّث بحثًا عامًا حسب نوع المناسبة دون إرسال الأسماء أو تواريخ الميلاد أو ميزانيتك. العناوين روابط لمقالات منشورة حديثًا وليست إثباتًا لرواج المنتجات.":"Public, category-level reading is refreshed during site updates. We don't send names, birthdays or budgets. Article headlines are inspiration, not verified market trends or endorsements."}</p>
     </div></div>
     {feedState==="loading"&&<p className="mt-3 text-xs text-muted-foreground">{ar?"جارٍ عرض المصادر المنشورة…":"Checking cached public articles…"}</p>}
     {articleList.length>0&&isFresh?<div className="mt-4 space-y-2">
      {articleList.map(a=><a key={a.url} href={a.url} target="_blank" rel="noopener noreferrer" className="flex items-start gap-2 rounded-xl bg-white p-3 text-sm hover:underline">
        <ArrowUpRight className="mt-1 size-4 shrink-0 text-brand"/><span><span className="block font-semibold">{a.title}</span><span className="mt-1 block text-xs text-muted-foreground">{a.publisher} · {a.published}</span></span>
      </a>)}
     </div>:feedState!=="loading"&&<p className="mt-3 text-xs text-muted-foreground">{ar?"لا توجد مقالات حديثة لهذا النوع حالياً. يمكنك البحث بنفسك عن أحدث الأفكار.":"No fresh category articles are currently available. You can still search recent public ideas directly."}</p>}
     <a href={publicSearchUrl} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white">
       <Search className="size-4"/>{ar?"ابحث عن أحدث الأفكار":"Search recent ideas online"} <ArrowUpRight className="size-4"/>
     </a>
     <p className="mt-3 text-xs text-muted-foreground">{ar?"لا يتم تأكيد الأسعار أو التوفر أو الترند. تحقق من جودة المنتج وتكلفة التوصيل والمصدر قبل الشراء.":"Prices, availability and trend popularity are unverified. Check quality, delivery, returns and local availability before buying."}</p>
    </section>
    <section className="mt-6 rounded-2xl border border-border bg-white p-4 sm:p-5" aria-label={ar?"من الفكرة إلى الخطة":"From idea to real choices"}>
      <div className="flex items-center gap-2"><Sparkles className="size-5 text-brand"/><h2 className="text-lg font-semibold">{ar?"من الفكرة إلى التنفيذ":"Turn your idea into a plan"}</h2></div>
      <p className="mt-1 text-sm text-muted-foreground">{ar?"يمكنك نقل سقف الميزانية إلى النزهة أو المقارنة بالاختيار. لن نغيّر بياناتك الحالية من دون موافقتك.":"Carry your chosen spending ceiling into an outing or product comparison if you want. Existing entries are never overwritten automatically."}</p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {[
          {to:"/explore/together" as const,goal:"outing" as const,en:"Plan an outing",ar:"خطّط لنزهة"},
          {to:"/explore/smartbuy" as const,goal:"gift" as const,en:"Compare gifts & prices",ar:"قارن الهدايا والأسعار"},
          {to:"/explore/restaurants" as const,goal:"places" as const,en:"Explore restaurants",ar:"اكتشف المطاعم"},
          {to:"/community" as const,goal:"advice" as const,en:"Ask trusted friends",ar:"اسأل من تثق بهم"},
        ].map(a=><Link key={a.goal} to={a.to}
           onClick={()=>writeLocal(activeDecisionKey,startDecisionJourney(active,plan,a.goal))}
           className="inline-flex items-center justify-between rounded-xl border border-border bg-[#F9FBF7] px-3 py-3 text-sm font-semibold text-brand transition hover:bg-mint">
           {ar?a.ar:a.en} <ArrowUpRight className="size-4"/>
        </Link>)}
      </div>
      <a href={externalMapLink("outing",prefs.city||"Amman")} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-brand">{ar?"استكشف أنشطة قريبة على الخريطة":"See nearby activity ideas on Maps"} <ArrowUpRight className="size-4"/></a>
      <p className="mt-2 text-xs text-muted-foreground">{ar?"يستخدم بحث الخرائط اسم المدينة فقط، ولا يرسل اسم صاحب المناسبة أو الميزانية.":"The map search sends only the city and a general activity category, never family identities or budget."}</p>
    </section>
    <p className="mt-5 text-xs text-muted-foreground">{ar?"خطتك وميزانيتك محفوظتان على هذا المتصفح فقط. الاقتراحات تظهر عند فتح التطبيق، وليست تنبيهات خارجية أو إشعارات فورية.":"Your plan and budget remain in this browser. Preparations appear when you open the app; background personal notifications are not enabled."}</p>
   </>}
  </>}
  <FamilyWishlistPanel mode="gifts"/>
 </AppShell>;
}
