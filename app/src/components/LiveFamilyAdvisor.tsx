import {useEffect,useState,type FormEvent} from "react";
import {Bot,LockKeyhole,Send,ShieldAlert,Trash2} from "lucide-react";
import type {User} from "@supabase/supabase-js";
import {Button} from "@/components/ui/button";
import {useI18n} from "@/lib/i18n";
import {useLocalState} from "@/lib/storage";
import {sampleMoney,type MoneyState} from "@/lib/money";
import {supabase} from "@/integrations/supabase/client";
import {askLiveFamilyAi,LIVE_AI_UI_ENABLED,optionalLiveAiFinancialSummary} from "@/lib/liveAiClient";
import type {LiveAiTurn} from "@/lib/liveAiProtocol";

type Conversation={question:string;answer:string};
/** No automatic model call: parents opt in for EACH turn and optionally choose
 * a strictly numeric, no-names finance summary. Never persisted in localStorage.
 */
export function LiveFamilyAdvisor(){
 const {lang}=useI18n(),ar=lang==="ar";
 const [user,setUser]=useState<User|null>(null),[authReady,setAuthReady]=useState(false);
 const [email,setEmail]=useState(""),[message,setMessage]=useState("");
 const [question,setQuestion]=useState(""),[consent,setConsent]=useState(false);
 const [shareNumbers,setShareNumbers]=useState(false),[busy,setBusy]=useState(false);
 const [error,setError]=useState(""),[history,setHistory]=useState<Conversation[]>([]);
 const [money,,moneyReady]=useLocalState<MoneyState>("money",sampleMoney());
 const summary=moneyReady?optionalLiveAiFinancialSummary(money):null;
 useEffect(()=>{
  if(!LIVE_AI_UI_ENABLED)return;
  let live=true;
  void supabase.auth.getUser().then(({data,error})=>{
   if(live){setUser(error?null:data.user);setAuthReady(true);}
  }).catch(()=>{if(live)setAuthReady(true);});
  const {data}=supabase.auth.onAuthStateChange((_event,session)=>{
   if(live){setUser(session?.user??null);setHistory([]);setConsent(false);setShareNumbers(false);}
  });
  return ()=>{live=false;data.subscription.unsubscribe();};
 },[]);
 if(!LIVE_AI_UI_ENABLED)return <section className="editorial-card mt-5 p-4 sm:p-5" aria-label={ar?"حالة الذكاء الاصطناعي":"Live AI status"}>
  <div className="flex items-start gap-3"><Bot className="size-6 shrink-0 text-brand"/>
   <div><h2 className="font-semibold">{ar?"المساعد المباشر غير مفعّل بعد":"Live AI requires backend activation"}</h2>
    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{ar?
     "المحادثة المباشرة تحتاج خادماً مؤمناً ومفتاح خدمة خاصاً وضبط حدود الاستخدام. الإرشادات المحلية أدناه تعمل الآن من دون إرسال بياناتك.":
     "Live conversation requires a secured server deployment, provider credentials and request limits. The local guided advisor below works without uploading family details."}</p>
   </div>
  </div>
 </section>;
 const signin=(e:FormEvent)=>{
  e.preventDefault();if(busy)return;
  setBusy(true);setError("");setMessage("");
  void supabase.auth.signInWithOtp({email:email.trim(),options:{
   emailRedirectTo:window.location.origin+import.meta.env.BASE_URL+"#/advisor"
  }}).then(({error})=>{
   if(error)throw error;
   setMessage(ar?"راجع بريدك الإلكتروني لفتح رابط الدخول.":"Check your email for a sign-in link.");
  }).catch(()=>setError(ar?"تعذّر إرسال رابط الدخول.":"Could not send a sign-in link."))
   .finally(()=>setBusy(false));
 };
 const send=(e:FormEvent)=>{
  e.preventDefault();
  if(busy||!user||!consent||question.trim().length<2)return;
  const currentQuestion=question.trim();
  const relevant=history.slice(-2).flatMap(({question:q,answer}):LiveAiTurn[]=>[
   {role:"user",content:q},{role:"assistant",content:answer.slice(0,800)}
  ]);
  setBusy(true);setError("");setMessage("");
  void askLiveFamilyAi({question:currentQuestion,language:lang,history:relevant,
   ...(shareNumbers&&summary?{context:summary}:{})})
   .then(answer=>{
    setHistory(old=>[...old.slice(-3),{question:currentQuestion,answer}]);
    setQuestion("");setConsent(false);setShareNumbers(false);
   }).catch(err=>setError(err instanceof Error?err.message:String(err)))
   .finally(()=>setBusy(false));
 };
 return <section className="editorial-card mt-5 p-4 sm:p-5" aria-label={ar?"المساعد الذكي المباشر":"Live family AI"}>
  <div className="flex items-start gap-3">
   <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#E8F1E6] text-brand"><Bot className="size-5"/></span>
   <div>
    <p className="section-eyebrow">{ar?"محادثة عند الطلب":"ON-DEMAND LIVE AI"}</p>
    <h2 className="mt-1 text-lg font-semibold">{ar?"اسأل دبّرنا مباشرة":"Ask Dabberna's live AI"}</h2>
    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{ar?
     "مساعد متصل عند الطلب، وليس رصيداً بنكياً موثوقاً أو أسعاراً مباشرة. لا تُرسل أسماء الأطفال أو بيانات صحية أو معلومات مصرفية. يُرسل السؤال وأي رسائل سابقة مختصرة إلى مزود الذكاء الاصطناعي عبر خادم دبّرنا.":
     "An on-demand AI conversation, not verified banking, live prices, medical advice or bookings. Avoid children's details, health records, passwords or account numbers. Your question and limited recent turns go to the AI provider through Dabberna's server."}</p>
   </div>
  </div>
  {!authReady?<p className="mt-3 text-xs text-muted-foreground">{ar?"التحقق من تسجيل الدخول...":"Checking sign-in..."}</p>:
   !user?<form onSubmit={signin} className="mt-4 grid gap-3 rounded-xl bg-[#F4F8F1] p-3">
    <p className="text-xs font-semibold"><LockKeyhole className="me-1 inline size-4"/>{ar?"سجل دخولك بالبريد لتأمين الاستخدام":"Sign in by email to protect AI usage"}</p>
    <label className="text-xs font-semibold">{ar?"البريد الإلكتروني":"Email"}
     <input type="email" required autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)}
      className="mt-1 min-h-11 w-full rounded-xl border bg-white px-3"/>
    </label>
    <Button type="submit" disabled={busy}>{ar?"أرسل رابط الدخول":"Send sign-in link"}</Button>
   </form>:<>
    <p className="mt-3 text-xs text-muted-foreground">{ar?"تم تسجيل الدخول":"Signed in"} · {user.email}</p>
    {history.length>0&&<div className="mt-4 space-y-3" aria-live="polite">
     {history.map((turn,i)=><article key={i} className="rounded-xl border border-[#DCE8DB] bg-[#F9FCF7] p-3">
      <p className="text-xs font-semibold text-brand">{turn.question}</p>
      <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">{turn.answer}</p>
     </article>)}
     <button type="button" className="inline-flex min-h-10 items-center gap-2 text-xs font-semibold text-brand underline"
      onClick={()=>setHistory([])}><Trash2 className="size-3.5"/>
      {ar?"امسح المحادثة من الشاشة":"Clear conversation from this screen"}</button>
    </div>}
    <form onSubmit={send} className="mt-4 space-y-3">
     <label className="block text-xs font-semibold">{ar?"شو بتحب تسأل؟":"Your question"}
      <textarea rows={3} minLength={2} maxLength={600} required value={question}
       onChange={e=>setQuestion(e.target.value)} placeholder={ar?"كيف ننظّم مصاريف العودة للمدرسة؟":"How should we plan school supplies spending?"}
       className="mt-1 w-full rounded-xl border border-input bg-white p-3 text-sm"/>
     </label>
     {summary&&<div className="rounded-xl border border-[#DDE8DC] bg-[#F6FAF5] p-3 text-xs">
      <label className="flex items-start gap-2">
       <input type="checkbox" checked={shareNumbers} onChange={e=>setShareNumbers(e.target.checked)}
        className="mt-0.5 size-4 shrink-0"/>
       <span>{ar?"أرسل ملخص الأرقام المالية التالية لهذا السؤال فقط (اختياري، غير مؤكدة من البنك)":
        "Also send this numeric budget summary for THIS question only (optional; not bank verified)"}</span>
      </label>
      {shareNumbers&&<dl className="mt-2 grid grid-cols-2 gap-2 rounded-lg bg-white p-2">
       <dt>{ar?"الدخل الشهري":"Monthly income"}</dt><dd>{summary.monthlyIncomeJod} JOD</dd>
       <dt>{ar?"المصاريف المخططة":"Expense plan"}</dt><dd>{summary.plannedExpensesJod} JOD</dd>
       <dt>{ar?"المصروف المسجل":"Recorded spending"}</dt><dd>{summary.recordedSpentJod} JOD</dd>
       <dt>{ar?"هدف الادخار":"Savings target"}</dt><dd>{summary.savingsTargetJod} JOD</dd>
       <dt>{ar?"عدد مواعيد الفواتير المسجلة":"Recorded bill schedules"}</dt><dd>{summary.upcomingBillCount}</dd>
       {summary.cashOnHandJod!==undefined&&<><dt>{ar?"الرصيد الذي أدخلته":"Entered cash balance"}</dt><dd>{summary.cashOnHandJod} JOD</dd></>}
      </dl>}
     </div>}
     <label className="flex items-start gap-2 rounded-xl bg-[#F8F4EC] p-3 text-xs leading-relaxed">
      <input type="checkbox" className="mt-0.5 size-4 shrink-0" checked={consent}
       onChange={e=>setConsent(e.target.checked)}/>
      <span>{ar?
       "أوافق على إرسال سؤالي ورسائلي القريبة إلى مزود AI عبر خادم دبّرنا لهذا الطلب. لا أرسل معلومات أطفال حساسة أو بيانات صحية أو مصرفية. أفهم أن إجابة الذكاء الاصطناعي قد تخطئ.":
       "For this request, I agree to send my question and limited recent messages to an AI provider through Dabberna. I will not include sensitive child, medical or bank information, and understand AI answers may be wrong."}</span>
     </label>
     <Button type="submit" disabled={!consent||busy||question.trim().length<2}>
      <Send className="size-4"/>{busy?(ar?"جارٍ البحث عن جواب...":"Getting an answer..."):(ar?"اسأل الذكاء الاصطناعي":"Ask live AI")}
     </Button>
    </form>
   </>}
  {message&&<p className="mt-3 text-xs text-brand" role="status">{message}</p>}
  {error&&<p className="mt-3 rounded-lg bg-[#FFF1EA] p-3 text-xs text-[#985037]" role="alert"><ShieldAlert className="me-1 inline size-4"/>{error}</p>}
  <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">{ar?
   "المحادثة محفوظة مؤقتاً في هذه الشاشة فقط ولا يطلب دبّرنا من مزود الذكاء الاصطناعي تخزين ردوده. قد تُطبق سجلات تشغيل واحتفاظ لدى المزود حسب سياساته. لا يوجد ربط تلقائي بالميزانية أو الدفع أو ملفات العائلة.":
   "Conversation is kept in this screen only; the provider request uses store:false. Provider operational retention and safety policies may still apply. There is no automatic access to Money records, child profiles, purchases or payments."}</p>
 </section>;
}
