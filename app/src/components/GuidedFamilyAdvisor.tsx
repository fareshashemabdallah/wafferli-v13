import {useState,type FormEvent} from "react";
import {Link} from "@tanstack/react-router";
import {ArrowRight,MessageCircleQuestion,Send} from "lucide-react";
import {Button} from "@/components/ui/button";
import {useI18n} from "@/lib/i18n";
import {useLocalState} from "@/lib/storage";
import {sampleMoney,sampleMembers,type MoneyState,type Member} from "@/lib/money";
import {FAMILY_PLANS_KEY,type FamilyPlan} from "@/lib/familyPlans";
import {defaultFamilyPreferences} from "@/lib/familyPreferences";
import {answerFamilyQuestion,guidedPrompts,type GuidedAnswer} from "@/lib/guidedFamilyAdvisor";
import type {FamilyMoment} from "@/lib/familyCalendar";

type Exchange={question:string;reply:GuidedAnswer};
/** Controlled, local, explainable Q&A. Not presented as a connected LLM.
 * Conversation history stays transient in React state and is never stored. */
export function GuidedFamilyAdvisor(){
 const {lang}=useI18n(),ar=lang==="ar";
 const [money,,moneyReady]=useLocalState<MoneyState>("money",sampleMoney());
 const [members,,membersReady]=useLocalState<Member[]>("members",sampleMembers());
 const [moments,,calendarReady]=useLocalState<FamilyMoment[]>("familyCalendar",[]);
 const [plans,,plansReady]=useLocalState<FamilyPlan[]>(FAMILY_PLANS_KEY,[]);
 const [prefs,,prefsReady]=useLocalState("familyPreferences",defaultFamilyPreferences);
 const [question,setQuestion]=useState("");
 const [history,setHistory]=useState<Exchange[]>([]);
 const ready=moneyReady&&membersReady&&calendarReady&&plansReady&&prefsReady;
 const ask=(value:string)=>{
  if(!ready||value.trim().length===0)return;
  const q=value.trim().slice(0,400);
  const reply=answerFamilyQuestion(q,{money,members,moments,plans,preferences:prefs});
  setHistory(prev=>[...prev.slice(-4),{question:q,reply}]);
  setQuestion("");
 };
 const submit=(e:FormEvent)=>{e.preventDefault();ask(question);};
 return <section className="editorial-card mt-5 p-4 sm:p-5"
  aria-label={ar?"مساعد العائلة المحلي":"Guided family advisor"}>
  <div className="flex items-start gap-3">
   <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#E9F2E7] text-brand">
    <MessageCircleQuestion className="size-5"/>
   </span>
   <div>
    <p className="section-eyebrow">{ar?"إرشادات العائلة":"FAMILY DECISIONS"}</p>
    <h2 className="mt-1 text-lg font-semibold">{ar?"شو بدك تراجع اليوم؟":"What would you like to review?"}</h2>
    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{ar?
     "اسأل عن مصروف البيت أو الفواتير أو الادخار أو الأطفال أو الخطط. الإجابات مبنية فقط على البيانات اللي أدخلتها في هذا المتصفح—وليست محادثة AI متصلة.":
     "Ask about spending, bills, savings, children, plans or shopping. Answers use only your records on this device—this is guided logic, not a connected AI chatbot."}</p>
   </div>
  </div>
  <div className="mt-4 grid gap-2 sm:grid-cols-2">
   {guidedPrompts.map(p=><button type="button" key={p.id} disabled={!ready}
    onClick={()=>ask(ar?p.ar:p.en)}
    className="min-h-11 rounded-xl border border-[#DDE8D9] bg-[#F6FAF4] px-3 py-2 text-start text-xs font-semibold text-brand transition hover:bg-[#ECF3E9] disabled:opacity-50">
    {ar?p.ar:p.en}
   </button>)}
  </div>
  <form onSubmit={submit} className="mt-4 flex flex-wrap gap-2">
   <label className="min-w-[175px] flex-1 text-xs font-semibold">
    {ar?"أو اكتب سؤالك":"Or type your question"}
    <input maxLength={400} value={question} onChange={e=>setQuestion(e.target.value)}
     className="mt-1 min-h-11 w-full rounded-xl border border-input bg-white px-3 text-sm"
     placeholder={ar?"كيف الميزانية هالشهر؟":"What do our bills look like?"}/>
   </label>
   <Button type="submit" className="self-end" disabled={!ready||!question.trim()}>
    <Send className="size-4"/>{ar?"اسأل":"Ask"}
   </Button>
  </form>
  {history.length>0&&<div className="mt-4 space-y-3" aria-live="polite">
   {history.map((exchange,i)=><div key={i} className="rounded-xl border border-[#E1E7DB] bg-[#FAFCF8] p-3">
    <p className="text-xs font-semibold text-[#567462]">{exchange.question}</p>
    <h3 className="mt-2 text-sm font-semibold">{ar?exchange.reply.titleAr:exchange.reply.titleEn}</h3>
    <p className="mt-1 text-xs leading-relaxed">{ar?exchange.reply.textAr:exchange.reply.textEn}</p>
    <p className="mt-2 text-[11px] text-muted-foreground">{ar?"المصدر: ":"Source: "}{ar?exchange.reply.sourceAr:exchange.reply.sourceEn}</p>
    <Link to={exchange.reply.route} className="mt-2 inline-flex min-h-10 items-center gap-1.5 rounded-full bg-[#E9F2E7] px-3 text-xs font-semibold text-brand">
     {ar?exchange.reply.actionAr:exchange.reply.actionEn}<ArrowRight className="size-3.5 rtl:rotate-180"/>
    </Link>
   </div>)}
   <button type="button" onClick={()=>setHistory([])} className="min-h-10 text-xs font-semibold text-muted-foreground underline">
    {ar?"امسح الأسئلة من الشاشة":"Clear this conversation"}
   </button>
  </div>}
  <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">{ar?
   "ما منخزّن أسئلتك ولا منرسلها إلى خادم. ما منقدم ضمانات مالية أو طبية أو أسعار مباشرة، والأسئلة غير المدعومة تُوضح حدود الخدمة.":
   "Questions and answers are not saved or uploaded. No medical diagnosis, verified price, real-time banking, booking or financial guarantee. Unsupported questions are answered with a clear limitation."}</p>
 </section>;
}
