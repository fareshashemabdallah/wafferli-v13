import {useState,type FormEvent} from "react";
import {Link} from "@tanstack/react-router";
import {ArrowRight,CheckCircle2,ClipboardCopy,HeartHandshake,LockKeyhole,ShieldCheck,Sparkles,ThumbsDown,ThumbsUp} from "lucide-react";
import {useI18n} from "@/lib/i18n";
import {readLocal,writeLocal,useLocalState,uid} from "@/lib/storage";
import {sampleMoney,sampleMembers,type Member,type MoneyState} from "@/lib/money";
import {defaultFamilyPreferences,type FamilyPreferences} from "@/lib/familyPreferences";
import {FAMILY_PLANS_KEY,ACTIVE_PLAN_KEY,type FamilyPlan} from "@/lib/familyPlans";
import {FAMILY_VALUES,DECISION_SCENARIOS,scenarioFromQuestion,decideFamilyNextSteps,publicDecisionInvitation,planFromDecision,futureFamilyMilestones,
 type DecisionScenario,type DecisionApproach,type DecisionBrief,type FamilyValue} from "@/lib/sixPillarDecisionEngine";
import type {FamilyMoment} from "@/lib/familyCalendar";

const costValue=(value:string)=>value.trim()===""?undefined:!/^\d{1,6}(?:\.\d{1,2})?$/.test(value)||Number(value)>100000?null:Number(value);
const field="mt-1 w-full min-h-11 rounded-xl border border-[#D0DED3] bg-white px-3 text-sm";

export function SixPillarDecisionStudio(){
 const {lang}=useI18n(),ar=lang==="ar",t=(en:string,arabic:string)=>ar?arabic:en;
 const [money,,moneyReady]=useLocalState<MoneyState>("money",sampleMoney());
 const [members,,membersReady]=useLocalState<Member[]>("members",sampleMembers());
 const [moments,,momentsReady]=useLocalState<FamilyMoment[]>("familyCalendar",[]);
 const [plans,,plansReady]=useLocalState<FamilyPlan[]>(FAMILY_PLANS_KEY,[]);
 const [prefs,setPrefs,prefsReady]=useLocalState<FamilyPreferences>("familyPreferences",defaultFamilyPreferences);
 const [scenario,setScenario]=useState<DecisionScenario>("outing");
 const [scenarioChosen,setScenarioChosen]=useState(false);
 const [amount,setAmount]=useState("");
 const [date,setDate]=useState("");
 const [question,setQuestion]=useState("");
 const [brief,setBrief]=useState<DecisionBrief|null>(null);
 const [chosen,setChosen]=useState<DecisionApproach>("compare");
 const [message,setMessage]=useState("");
 const [error,setError]=useState("");
 const ready=moneyReady&&membersReady&&momentsReady&&plansReady&&prefsReady;
 const ctx={money,members,moments,plans,preferences:prefs};
 const milestones=ready?futureFamilyMilestones(ctx):[];
 const selectedOption=brief?.options.find(x=>x.id===chosen);
 const values=prefs.protectedFamilyValues??[];
 const toggleValue=(value:FamilyValue,checked:boolean)=>setPrefs(old=>({...old,
  protectedFamilyValues:checked?Array.from(new Set([...(old.protectedFamilyValues??[]),value])):
   (old.protectedFamilyValues??[]).filter(x=>x!==value)
 }));
 const submit=(event:FormEvent)=>{
  event.preventDefault();setMessage("");setError("");
  const cost=costValue(amount);
  if(cost===null){setError(t("Use a valid JOD estimate or leave it blank.","أدخل تكلفة تقريبية صحيحة بالدينار أو اتركها فارغة."));return;}
  const selectedScenario=!scenarioChosen?(scenarioFromQuestion(question)??scenario):scenario;
  setScenario(selectedScenario);
  const next=decideFamilyNextSteps(selectedScenario,{...ctx,...(cost!==undefined?{estimatedJod:cost}:{})});
  setBrief(next);setChosen(next.options[0]?.id??"compare");
 };
 const save=()=>{
  if(!brief||!ready)return;
  setError("");setMessage("");
  const cost=costValue(amount);
  if(cost===null){setError(t("Check the estimated cost.","راجع التكلفة التقديرية."));return;}
  const plan=planFromDecision({scenario:brief.scenario,approach:chosen,...(cost!==undefined?{amount:cost}:{}),...(date?{date}:{})},uid());
  if(!plan){setError(t("Check the date and estimate.","راجع التاريخ والتكلفة."));return;}
  const latest=readLocal<FamilyPlan[]>(FAMILY_PLANS_KEY,plans);
  const duplicate=latest.find(x=>x.status!=="completed"&&x.title===plan.title&&x.note===plan.note&&(x.date??"")===(plan.date??""));
  if(duplicate){setMessage(t("You already saved this decision. Open your Family Plans to edit it.","هذه الفكرة محفوظة مسبقاً. افتح خطط العيلة لتعديلها."));return;}
  if(!writeLocal(FAMILY_PLANS_KEY,[plan,...latest])){setError(t("Could not save the family plan. Nothing was booked or paid.","تعذّر حفظ الخطة. لم يحدث أي حجز أو دفع."));return;}
  writeLocal(ACTIVE_PLAN_KEY,plan.id);
  setMessage(t("Idea saved once to Family Plans. A dated plan also appears in the calendar; no payment or bill was created.","الفكرة محفوظة مرة واحدة في خطط العيلة. إذا حددت تاريخاً سيظهر في التقويم، بدون فاتورة أو دفع."));
 };
 const share=()=>{
  if(!brief)return;
  const text=publicDecisionInvitation(brief.scenario,chosen,ar);
  if(typeof navigator==="undefined"||!navigator.clipboard?.writeText){
   setMessage(t("Secure copy is unavailable here. No private data was shared.","النسخ غير متاح في هذا المتصفح. لم نشارك بيانات خاصة."));return;
  }
  void navigator.clipboard.writeText(text).then(()=>setMessage(t("A privacy-safe invitation was copied. You decide whom to send it to.","تم نسخ دعوة عامة بدون بيانات خاصة. أنت تقرر مع مين تشاركها.")))
  .catch(()=>setMessage(t("Copy failed; nothing was shared.","فشل النسخ؛ لم نشارك شيئاً.")));
 };
 const rate=(helpful:boolean)=>{
  if(!brief)return;
  if(!prefs.decisionLearningEnabled){setMessage(t("Local learning is off. Enable it in preferences if you want your ratings to influence future option ordering.","التعلّم المحلي مطفأ. فعّله من الخيارات إذا بدك التقييم يأثر على ترتيب الاقتراحات."));return;}
  setPrefs(old=>{
   const current=old.decisionFeedback?.[brief.scenario]??{};
   const n=Math.min(3,Math.max(-3,(current[chosen]??0)+(helpful?1:-1)));
   return {...old,decisionFeedback:{...old.decisionFeedback,[brief.scenario]:{...current,[chosen]:n}}};
  });
  setMessage(t("Saved a small preference signal on this device only—no question, income or child details stored.","حفظنا إشارة تفضيل بسيطة على هالجهاز فقط—بدون السؤال أو الدخل أو بيانات الأطفال."));
 };
 return <section className="mt-4 rounded-[1.6rem] border border-[#CDE5D2] bg-gradient-to-b from-[#F0FAF1] to-white p-4 sm:p-6"
  aria-label={t("Family Decision Engine","مساعد القرار العائلي")}>
  <div className="flex items-start gap-3">
   <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[#DFF3E6]"><Sparkles className="size-6 text-[#287B5B]"/></div>
   <div><p className="text-xs font-extrabold tracking-wide text-brand">{t("FAMILY DECISION ENGINE · ON THIS DEVICE","محرك قرارات العيلة · على جهازك")}</p>
    <h2 className="mt-1 text-xl font-black">{t("Protect what matters. Find a way forward.","نحافظ على اللي بهمّكم ونلاقي حل.")}</h2>
    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{t("Explore three realistic approaches using only saved information and your chosen priorities. No connected AI or provider availability is assumed.","قارن ثلاث طرق واقعية حسب بياناتك وأولوياتك. لا ندّعي تفعيل ذكاء اصطناعي متصل أو توفر أنشطة مؤكدة.")}</p>
   </div>
  </div>
  <details className="mt-4 rounded-xl border border-[#DBE6DB] bg-white p-3">
   <summary className="min-h-10 cursor-pointer text-sm font-semibold text-brand"><HeartHandshake className="me-1 inline size-4"/>{t("What matters to our family (optional)","شو مهم لعيلتنا (اختياري)")}</summary>
   <p className="mt-2 text-xs text-muted-foreground">{t("These priorities are yours to change. They are not inferred from income, religion or children's ages. Essential bills always matter.","الأولويات قرارك، مش تصنيف من الدخل أو المعتقد أو الأعمار. المصاريف الأساسية دائماً مهمة.")}</p>
   <div className="mt-3 grid gap-2 sm:grid-cols-2">
    {FAMILY_VALUES.map(value=><label key={value.id} className="flex min-h-11 items-center gap-2 text-sm">
     <input type="checkbox" className="size-4" checked={values.includes(value.id)} disabled={!ready}
      onChange={e=>toggleValue(value.id,e.target.checked)}/>
     {ar?value.ar:value.en}
    </label>)}
   </div>
   <div className="mt-3 rounded-xl bg-[#F4F8F2] p-3">
    <label className="flex items-start gap-3 text-xs">
     <input type="checkbox" className="mt-0.5 size-4" checked={prefs.decisionLearningEnabled??false} disabled={!ready}
      onChange={e=>setPrefs(old=>({...old,decisionLearningEnabled:e.target.checked,
       ...(!e.target.checked?{decisionFeedback:{}}:{})}))}/>
     <span>{t("Allow optional on-device learning from my thumbs-up/down ratings. Store only tiny per-option scores, never personal questions, names, balances or choices shared with anyone.",
      "اسمح بتعلّم اختياري على الجهاز من تقييماتي. نحفظ نقاط بسيطة فقط، بدون أسئلة شخصية أو أسماء أو أرصدة أو مشاركة.")}</span>
    </label>
   </div>
  </details>
  {milestones.length>0&&<div className="mt-4 rounded-xl border border-[#E0E8D7] bg-[#FAFBF3] p-3">
   <p className="text-sm font-bold">{t("Coming up according to your saved records","قريباً حسب سجلات العيلة")}</p>
   <div className="mt-2 space-y-1">{milestones.map((m,i)=><p key={i} className="text-xs text-[#55715C]">{m.date} · {m.title}</p>)}</div>
   <p className="mt-2 text-[11px] text-muted-foreground">{t("On-screen preview only; no background monitoring, provider confirmation or push notification.","ملخّص على الشاشة فقط؛ بدون مراقبة بالخلفية أو تأكيد مواعيد الجهات أو إشعارات دفع.")}</p>
  </div>}
  <form onSubmit={submit} className="mt-4 space-y-3">
   <label className="block text-sm font-semibold">{t("What's the family decision?","شو قرار العيلة؟")}
    <select className={field} value={scenario} onChange={e=>{setScenario(e.target.value as DecisionScenario);setScenarioChosen(true);setBrief(null);}} disabled={!ready}>
     {DECISION_SCENARIOS.map(item=><option key={item.id} value={item.id}>{ar?item.ar:item.en}</option>)}
    </select>
   </label>
   <label className="block text-sm font-semibold">{t("Your question (optional and not saved)","سؤالك (اختياري ولا يُحفظ)")}
    <input className={field} maxLength={250} value={question} onChange={e=>setQuestion(e.target.value)}
     placeholder={t("e.g. How should we balance activities and school fees?","مثلاً كيف نوازن نشاط الأولاد مع أقساط المدرسة؟")}/>
   </label>
   <p className="text-[11px] text-muted-foreground">{t("Common keywords can suggest a topic unless you choose one yourself. The local engine never saves or sends your question or claims to understand its full meaning.",
    "الكلمات المعتادة قد تقترح نوع القرار ما لم تختره بنفسك. النظام لا يحفظ السؤال ولا يرسله ولا يدّعي فهم كل معناه.")}</p>
   <div className="grid gap-3 sm:grid-cols-2">
    <label className="text-sm font-semibold">{t("Estimated full family cost (optional, JOD)","تكلفة العيلة التقديرية (اختياري، دينار)")}
     <input className={field} type="number" min="0" max="100000" step=".01" value={amount} onChange={e=>{setAmount(e.target.value);setBrief(null);}} placeholder={t("Unknown","غير معروف")}/>
    </label>
    <label className="text-sm font-semibold">{t("Possible date (optional)","تاريخ مقترح (اختياري)")}
     <input className={field} type="date" value={date} onChange={e=>setDate(e.target.value)}/>
    </label>
   </div>
   {error&&<p role="alert" className="text-xs text-[#9A4B36]">{error}</p>}
   <button type="submit" disabled={!ready} className="min-h-11 w-full rounded-xl bg-brand px-4 text-sm font-bold text-white disabled:opacity-50">{t("Show three realistic paths","اعرض ثلاث خيارات واقعية")} <ArrowRight className="ms-1 inline size-4"/></button>
  </form>

  {brief&&<div className="mt-5 space-y-3" aria-live="polite">
   <h3 className="text-lg font-bold">{ar?brief.titleAr:brief.titleEn}</h3>
   <div className="grid gap-2 md:grid-cols-2">
    <div className="rounded-xl border border-[#DFE8DB] bg-white p-3">
     <p className="text-sm font-semibold">{t("Your family and what's coming","العيلة واللي جاي")}</p>
     <p className="mt-1 text-xs leading-relaxed">{ar?brief.familyAr:brief.familyEn}</p>
     <p className="mt-2 text-xs leading-relaxed">{ar?brief.upcomingAr:brief.upcomingEn}</p>
    </div>
    <div className="rounded-xl border border-[#DFE8DB] bg-white p-3">
     <p className="text-sm font-semibold">{t("Money reality and protected priorities","الوضع المالي والأولويات المهمة")}</p>
     <p className="mt-1 text-xs leading-relaxed">{ar?brief.realityAr:brief.realityEn}</p>
     <p className="mt-2 text-xs leading-relaxed">{ar?brief.protectedAr:brief.protectedEn}</p>
    </div>
   </div>
   <p className="text-sm font-bold">{t("Different ways forward—not a yes/no verdict","طرق مختلفة للتقدم، مش قرار نعم أو لا")}</p>
   {brief.options.map((option,i)=><button type="button" key={option.id} onClick={()=>setChosen(option.id)}
    aria-pressed={chosen===option.id}
    className={"w-full rounded-xl border p-4 text-start transition "+(chosen===option.id?"border-[#2F8967] bg-[#E8F6EB]":"border-[#D9E7D8] bg-white")}>
    <span className="flex items-center gap-2 text-sm font-bold">{chosen===option.id&&<CheckCircle2 className="size-4 text-[#23845B]"/>}{i+1}. {ar?option.titleAr:option.titleEn}</span>
    <span className="mt-1 block text-xs leading-relaxed">{ar?option.detailAr:option.detailEn}</span>
   </button>)}
   <details className="rounded-xl border border-[#E2E8DE] bg-white p-3">
    <summary className="min-h-10 cursor-pointer text-sm font-bold text-brand">{t("What's unknown and why?","شو بعدنا ما منعرف؟")}</summary>
    {(ar?brief.unknownsAr:brief.unknownsEn).map((line,i)=><p key={i} className="mt-2 text-xs text-muted-foreground">{line}</p>)}
    <p className="mt-2 text-[11px] text-muted-foreground">{ar?brief.sourceAr:brief.sourceEn}</p>
   </details>
   <div className="flex flex-wrap gap-2">
    {selectedOption&&<Link to={selectedOption.route}
     className="inline-flex min-h-11 items-center gap-1 rounded-full border border-[#C7DAC9] bg-white px-3 text-xs font-bold text-brand">
     {ar?selectedOption.actionAr:selectedOption.actionEn}<ArrowRight className="size-4"/>
    </Link>}
    <button type="button" onClick={save} className="min-h-11 rounded-full bg-brand px-4 text-xs font-bold text-white">
     {t("Save chosen path as one plan","احفظ الخيار بخطة واحدة")}
    </button>
    <button type="button" onClick={share} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[#D7E4D6] bg-white px-3 text-xs font-bold">
     <ClipboardCopy className="size-4"/>{t("Copy private-safe invitation","انسخ دعوة بدون تفاصيل خاصة")}
    </button>
   </div>
   <div className="flex flex-wrap items-center gap-3 text-xs">
    <span className="font-semibold">{t("Was this approach helpful?","هل هالخيار ساعدك؟")}</span>
    <button type="button" className="inline-flex min-h-10 items-center gap-1 text-brand underline" onClick={()=>rate(true)}><ThumbsUp className="size-4"/>{t("Yes","نعم")}</button>
    <button type="button" className="inline-flex min-h-10 items-center gap-1 text-brand underline" onClick={()=>rate(false)}><ThumbsDown className="size-4"/>{t("Not really","مش كتير")}</button>
   </div>
   {message&&<p role="status" className="rounded-lg bg-[#EDF6ED] p-3 text-xs">{message} <Link to="/plans" className="font-bold text-brand underline">{t("Family Plans","خطط العيلة")}</Link></p>}
   <p className="flex items-start gap-1.5 text-[11px] leading-relaxed text-muted-foreground"><LockKeyhole className="mt-0.5 size-3.5 shrink-0"/>{t("Only a generic invitation is copied—never the question, children, finances, values, dates or entered price. Parents choose where to send it. Multi-parent sync is not enabled.",
    "الدعوة المنسوخة عامة، بدون السؤال أو الأطفال أو المال أو القيم أو التواريخ أو التكلفة. الأهل يقرروا وين يرسلوها. مزامنة العيلة مش مفعّلة.")}</p>
  </div>}
  <p className="mt-4 flex items-start gap-2 text-[11px] leading-relaxed text-muted-foreground"><ShieldCheck className="mt-0.5 size-4 shrink-0"/>
   {t("This explainable on-device guide does not buy, book, contact providers, move money, or provide verified AI answers. Connected AI remains subject to its separate per-question consent.",
    "هذا الدليل المحلي لا يحجز ولا يشتري ولا يتواصل مع جهات ولا ينقل أموالاً أو يقدم نتائج AI متصلة. المساعد المتصل يحتاج موافقة منفصلة لكل سؤال.")}
  </p>
 </section>;
}
