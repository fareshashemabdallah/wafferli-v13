import {useEffect,useRef,useState,type FormEvent} from "react";
import {Bot,LockKeyhole,Send,ShieldAlert,Trash2} from "lucide-react";
import type {User} from "@supabase/supabase-js";
import {Button} from "@/components/ui/button";
import {useI18n} from "@/lib/i18n";
import {useLocalState} from "@/lib/storage";
import {sampleMoney,type MoneyState} from "@/lib/money";
import {supabase} from "@/integrations/supabase/client";
import {askLiveFamilyAi,LIVE_AI_UI_ENABLED,optionalLiveAiFinancialSummary} from "@/lib/liveAiClient";
import type {LiveAiTurn} from "@/lib/liveAiProtocol";
import {detectSensitiveAiText} from "@/lib/liveAiPrivacy";

type Conversation={question:string;answer:string};
/** No automatic model call: parents opt in for EACH turn and optionally choose
 * a strictly numeric, no-names finance summary. Never persisted in localStorage.
 */
export function LiveFamilyAdvisor(){
 const {lang}=useI18n(),ar=lang==="ar";
 const [user,setUser]=useState<User|null>(null),[authReady,setAuthReady]=useState(false);
 const [email,setEmail]=useState(""),[message,setMessage]=useState("");
 const [question,setQuestion]=useState(""),[consent,setConsent]=useState(false);
 const [shareNumbers,setShareNumbers]=useState(false),[includeHistory,setIncludeHistory]=useState(false),[busy,setBusy]=useState(false);
 const requestGeneration=useRef(0);
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
   if(live){requestGeneration.current++;
    setUser(session?.user??null);setHistory([]);setQuestion("");
    setConsent(false);setShareNumbers(false);setIncludeHistory(false);setBusy(false);
   }
  });
  return ()=>{live=false;requestGeneration.current++;data.subscription.unsubscribe();};
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
  const sensitive=detectSensitiveAiText(currentQuestion);
  if(sensitive){setError(ar?
   "قد يحتوي السؤال على بريد أو رقم هاتف أو معلومات بنكية أو بيانات تسجيل دخول. احذف المعلومات الحساسة وحاول مجدداً.":
   "Your question may contain an email address, phone, bank/card number or credential. Remove sensitive details and try again.");return;}
  const relevant=(!includeHistory?[]:history.slice(-2)).flatMap(({question:q,answer}):LiveAiTurn[]=>[
   {role:"user",content:q},{role:"assistant",content:answer.slice(0,800)}
  ]);
  const generation=++requestGeneration.current;
  setBusy(true);setError("");setMessage("");
  void askLiveFamilyAi({question:currentQuestion,language:lang,history:relevant,
   ...(shareNumbers&&summary?{context:summary}:{})})
   .then(answer=>{
    if(generation!==requestGeneration.current)return;
    setHistory(old=>[...old.slice(-3),{question:currentQuestion,answer}]);
    setQuestion("");setConsent(false);setShareNumbers(false);setIncludeHistory(false);
   }).catch(err=>{
    if(generation===requestGeneration.current)
     setError(err instanceof Error?err.message:String(err));
   }).finally(()=>{if(generation===requestGeneration.current)setBusy(false);});
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
       <dt>{ar?"عدد مواعيد الفواتير المسجلة":"Recorded bill schedules"}</dt><dd>{summary.recordedBillScheduleCount}</dd>
       {summary.cashOnHandJod!==undefined&&<><dt>{ar?"الرصيد الذي أدخلته":"Entered cash balance"}</dt><dd>{summary.cashOnHandJod} JOD</dd></>}
      </dl>}
     </div>}
     {history.length>0&&<label className="flex items-start gap-2 rounded-xl border border-[#DDE8DC] bg-[#F6FAF5] p-3 text-xs leading-relaxed">
      <input type="checkbox" checked={includeHistory} onChange={e=>setIncludeHistory(e.target.checked)}
       className="mt-0.5 size-4 shrink-0"/>
      <span>{ar?
       "أرسل آخر محادثتين (السؤال والرد) لإعطاء سياق لهذا الطلب فقط. هذا الخيار مغلق افتراضياً.":
       "Include the last two question-and-answer turns as context for this request only (optional; OFF by default)."}</span>
     </label>}
     <details className="rounded-xl border border-[#DDE8DC] bg-white p-3 text-xs">
      <summary className="min-h-9 cursor-pointer font-semibold text-brand">{ar?"راجع بالضبط ما سيُرسل قبل الموافقة":"Preview exactly what will be sent before consenting"}</summary>
      <div className="mt-2 space-y-2">
       <p className="font-semibold">{ar?"سؤالك":"Question"}</p>
       <p className="whitespace-pre-wrap break-words">{question.trim()|| (ar?"لم تكتب سؤالاً بعد.":"No question entered yet.")}</p>
       <p className="font-semibold">{ar?"الرسائل السابقة":"Previous conversation"}</p>
       <p>{includeHistory&&history.length>0?(ar?"آخر محادثتين أدناه":"Last two exchanges below"):(ar?"لن تُرسل":"Not included")}</p>
       {includeHistory&&history.slice(-2).map((turn,i)=><div key={i} className="rounded-lg bg-[#F6FAF5] p-2">
        <p className="whitespace-pre-wrap break-words">{turn.question}</p>
        <p className="mt-1 whitespace-pre-wrap break-words">{turn.answer.slice(0,800)}</p>
       </div>)}
       <p className="font-semibold">{ar?"ملخص ميزانيتك":"Budget summary"}</p>
       <p>{shareNumbers&&summary?(ar?"الأرقام الظاهرة في الجدول أعلاه فقط":"Only the numeric figures shown above"):
        (ar?"لن تُرسل أرقام الميزانية":"Not included")}</p>
       <p className="text-muted-foreground">{ar?
        "المعاينة لا تعني إرسالاً. يلزم اختيار الموافقة والضغط على إرسال. لا تُدرج أسماء أفراد العائلة أو تفاصيل السجلات المحلية آلياً.":
        "Opening this preview does not send anything. You must separately consent and click Send. No local family names or detailed records are added automatically."}</p>
      </div>
     </details>
     <label className="flex items-start gap-2 rounded-xl bg-[#F8F4EC] p-3 text-xs leading-relaxed">
      <input type="checkbox" className="mt-0.5 size-4 shrink-0" checked={consent}
       onChange={e=>setConsent(e.target.checked)}/>
      <span>{ar?
       "أوافق لهذا الطلب على إرسال سؤالي كما في المعاينة، ومعه الرسائل السابقة وملخص الأرقام فقط إذا اخترتهما بنفسي. أفهم أن إجابة الذكاء الاصطناعي قد تخطئ.":
       "For this request I agree to send the previewed question, plus my separately selected conversation history and numeric summary if enabled, to an AI provider through Dabberna. I understand the model can make mistakes."}</span>
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
