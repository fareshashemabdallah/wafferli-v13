import {frenchUI} from "@/lib/french";
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
 if(!LIVE_AI_UI_ENABLED)return <details className="editorial-card mt-4 p-4 sm:p-5"
  aria-label={ar?"حالة المحادثة المباشرة":(lang==="fr"?frenchUI("Live AI status"):"Live AI status")}>
  <summary className="flex min-h-11 cursor-pointer items-center gap-3 text-sm font-semibold text-brand">
   <Bot className="size-5 shrink-0" aria-hidden="true"/>
   {ar?"عن المحادثة الذكية المباشرة (غير مفعّلة بعد)":(lang==="fr"?frenchUI("About live AI (not activated yet)"):"About live AI (not activated yet)")} +
  </summary>
  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{ar?"المحادثة المباشرة تحتاج خادماً مؤمناً ومفتاح خدمة خاصاً وضبط حدود الاستخدام. الإرشادات المحلية أعلاه تعمل الآن من دون إرسال بياناتك.":(lang==="fr"?frenchUI("Live conversation requires a secured server deployment, provider credentials and request limits. The guided advice above works now without uploading your family's data."):"Live conversation requires a secured server deployment, provider credentials and request limits. The guided advice above works now without uploading your family's data.")}</p>
 </details>;
 const signin=(e:FormEvent)=>{
  e.preventDefault();if(busy)return;
  setBusy(true);setError("");setMessage("");
  void supabase.auth.signInWithOtp({email:email.trim(),options:{
   emailRedirectTo:window.location.origin+import.meta.env.BASE_URL+"#/advisor"
  }}).then(({error})=>{
   if(error)throw error;
   setMessage(ar?"راجع بريدك الإلكتروني لفتح رابط الدخول.":(lang==="fr"?frenchUI("Check your email for a sign-in link."):"Check your email for a sign-in link."));
  }).catch(()=>setError(ar?"تعذّر إرسال رابط الدخول.":(lang==="fr"?frenchUI("Could not send a sign-in link."):"Could not send a sign-in link.")))
   .finally(()=>setBusy(false));
 };
 const send=(e:FormEvent)=>{
  e.preventDefault();
  if(busy||!user||!consent||question.trim().length<2)return;
  const currentQuestion=question.trim();
  const sensitive=detectSensitiveAiText(currentQuestion);
  if(sensitive){setError(ar?"قد يحتوي السؤال على بريد أو رقم هاتف أو معلومات بنكية أو بيانات تسجيل دخول. احذف المعلومات الحساسة وحاول مجدداً.":(lang==="fr"?frenchUI("Your question may contain an email address, phone, bank/card number or credential. Remove sensitive details and try again."):"Your question may contain an email address, phone, bank/card number or credential. Remove sensitive details and try again."));return;}
  const relevant=(!includeHistory?[]:history.slice(-2)).flatMap(({question:q,answer}):LiveAiTurn[]=>[
   {role:"user",content:q},{role:"assistant",content:answer.slice(0,800)}
  ]);
  const generation=++requestGeneration.current;
  setBusy(true);setError("");setMessage("");
  void askLiveFamilyAi({question:currentQuestion,language:lang,history:relevant,parentConsent:true,
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
 return <section className="editorial-card mt-5 p-4 sm:p-5" aria-label={ar?"المساعد الذكي المباشر":(lang==="fr"?frenchUI("Live family AI"):"Live family AI")}>
  <div className="flex items-start gap-3">
   <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#E8F1E6] text-brand"><Bot className="size-5"/></span>
   <div>
    <p className="section-eyebrow">{ar?"محادثة عند الطلب":(lang==="fr"?frenchUI("ON-DEMAND LIVE AI"):"ON-DEMAND LIVE AI")}</p>
    <h2 className="mt-1 text-lg font-semibold">{ar?"اسأل دبّرنا مباشرة":(lang==="fr"?frenchUI("Ask Dabberna's live AI"):"Ask Dabberna's live AI")}</h2>
    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{ar?"مساعد متصل عند الطلب، وليس رصيداً بنكياً موثوقاً أو أسعاراً مباشرة. لا تُرسل أسماء الأطفال أو بيانات صحية أو معلومات مصرفية. يُرسل السؤال وأي رسائل سابقة مختصرة إلى مزود الذكاء الاصطناعي عبر خادم دبّرنا.":(lang==="fr"?frenchUI("An on-demand AI conversation, not verified banking, live prices, medical advice or bookings. Avoid children's details, health records, passwords or account numbers. Your question and limited recent turns go to the AI provider through Dabberna's server."):"An on-demand AI conversation, not verified banking, live prices, medical advice or bookings. Avoid children's details, health records, passwords or account numbers. Your question and limited recent turns go to the AI provider through Dabberna's server.")}</p>
   </div>
  </div>
  {!authReady?<p className="mt-3 text-xs text-muted-foreground">{ar?"التحقق من تسجيل الدخول...":(lang==="fr"?frenchUI("Checking sign-in..."):"Checking sign-in...")}</p>:
   !user?<form onSubmit={signin} className="mt-4 grid gap-3 rounded-xl bg-[#F4F8F1] p-3">
    <p className="text-xs font-semibold"><LockKeyhole className="me-1 inline size-4"/>{ar?"سجل دخولك بالبريد لتأمين الاستخدام":(lang==="fr"?frenchUI("Sign in by email to protect AI usage"):"Sign in by email to protect AI usage")}</p>
    <label className="text-xs font-semibold">{ar?"البريد الإلكتروني":(lang==="fr"?frenchUI("Email"):"Email")}
     <input type="email" required autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)}
      className="mt-1 min-h-11 w-full rounded-xl border bg-white px-3"/>
    </label>
    <Button type="submit" disabled={busy}>{ar?"أرسل رابط الدخول":(lang==="fr"?frenchUI("Send sign-in link"):"Send sign-in link")}</Button>
   </form>:<>
    <p className="mt-3 text-xs text-muted-foreground">{ar?"تم تسجيل الدخول":(lang==="fr"?frenchUI("Signed in"):"Signed in")} · {user.email}</p>
    {history.length>0&&<div className="mt-4 space-y-3" role="log" aria-label={ar?"سجل المحادثة":(lang==="fr"?frenchUI("Conversation history"):"Conversation history")} aria-live="polite" aria-relevant="additions">
     {history.map((turn,i)=><article key={i} className="rounded-xl border border-[#DCE8DB] bg-[#F9FCF7] p-3">
      <p className="break-words text-xs font-semibold text-brand">{turn.question}</p>
      <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed">{turn.answer}</p>
     </article>)}
     <button type="button" className="inline-flex min-h-10 items-center gap-2 text-xs font-semibold text-brand underline"
      onClick={()=>setHistory([])}><Trash2 className="size-3.5"/>
      {ar?"امسح المحادثة من الشاشة":(lang==="fr"?frenchUI("Clear conversation from this screen"):"Clear conversation from this screen")}</button>
    </div>}
    <form onSubmit={send} className="mt-4 space-y-3">
     <label className="block text-xs font-semibold">{ar?"شو بتحب تسأل؟":(lang==="fr"?frenchUI("Your question"):"Your question")}
      <textarea rows={3} minLength={2} maxLength={600} required value={question}
       onChange={e=>setQuestion(e.target.value)} placeholder={ar?"كيف ننظّم مصاريف العودة للمدرسة؟":(lang==="fr"?frenchUI("How should we plan school supplies spending?"):"How should we plan school supplies spending?")}
       className="mt-1 w-full rounded-xl border border-input bg-white p-3 text-sm"/>
     </label>
     {summary&&<div className="rounded-xl border border-[#DDE8DC] bg-[#F6FAF5] p-3 text-xs">
      <label className="flex items-start gap-2">
       <input type="checkbox" checked={shareNumbers} onChange={e=>setShareNumbers(e.target.checked)}
        className="mt-0.5 size-4 shrink-0"/>
       <span>{ar?"أرسل ملخص الأرقام المالية التالية لهذا السؤال فقط (اختياري، غير مؤكدة من البنك)":(lang==="fr"?frenchUI("Also send this numeric budget summary for THIS question only (optional; not bank verified)"):"Also send this numeric budget summary for THIS question only (optional; not bank verified)")}</span>
      </label>
      {shareNumbers&&<dl className="mt-2 grid grid-cols-2 gap-2 rounded-lg bg-white p-2">
       <dt>{ar?"الدخل الشهري":(lang==="fr"?frenchUI("Monthly income"):"Monthly income")}</dt><dd>{summary.monthlyIncomeJod} JOD</dd>
       <dt>{ar?"المصاريف المخططة":(lang==="fr"?frenchUI("Expense plan"):"Expense plan")}</dt><dd>{summary.plannedExpensesJod} JOD</dd>
       <dt>{ar?"المصروف المسجل":(lang==="fr"?frenchUI("Recorded spending"):"Recorded spending")}</dt><dd>{summary.recordedSpentJod} JOD</dd>
       <dt>{ar?"هدف الادخار":(lang==="fr"?frenchUI("Savings target"):"Savings target")}</dt><dd>{summary.savingsTargetJod} JOD</dd>
       <dt>{ar?"عدد مواعيد الفواتير المسجلة":(lang==="fr"?frenchUI("Recorded bill schedules"):"Recorded bill schedules")}</dt><dd>{summary.recordedBillScheduleCount}</dd>
       {summary.cashOnHandJod!==undefined&&<><dt>{ar?"الرصيد الذي أدخلته":(lang==="fr"?frenchUI("Entered cash balance"):"Entered cash balance")}</dt><dd>{summary.cashOnHandJod} JOD</dd></>}
      </dl>}
     </div>}
     {history.length>0&&<label className="flex items-start gap-2 rounded-xl border border-[#DDE8DC] bg-[#F6FAF5] p-3 text-xs leading-relaxed">
      <input type="checkbox" checked={includeHistory} onChange={e=>setIncludeHistory(e.target.checked)}
       className="mt-0.5 size-4 shrink-0"/>
      <span>{ar?"أرسل آخر محادثتين (السؤال والرد) لإعطاء سياق لهذا الطلب فقط. هذا الخيار مغلق افتراضياً.":(lang==="fr"?frenchUI("Include the last two question-and-answer turns as context for this request only (optional; OFF by default)."):"Include the last two question-and-answer turns as context for this request only (optional; OFF by default).")}</span>
     </label>}
     <details className="rounded-xl border border-[#DDE8DC] bg-white p-3 text-xs">
      <summary className="min-h-9 cursor-pointer font-semibold text-brand">{ar?"راجع بالضبط ما سيُرسل قبل الموافقة":(lang==="fr"?frenchUI("Preview exactly what will be sent before consenting"):"Preview exactly what will be sent before consenting")}</summary>
      <div className="mt-2 space-y-2">
       <p className="font-semibold">{ar?"سؤالك":(lang==="fr"?frenchUI("Question"):"Question")}</p>
       <p className="whitespace-pre-wrap break-words">{question.trim()|| (ar?"لم تكتب سؤالاً بعد.":(lang==="fr"?frenchUI("No question entered yet."):"No question entered yet."))}</p>
       <p className="font-semibold">{ar?"الرسائل السابقة":(lang==="fr"?frenchUI("Previous conversation"):"Previous conversation")}</p>
       <p>{includeHistory&&history.length>0?(ar?"آخر محادثتين أدناه":(lang==="fr"?frenchUI("Last two exchanges below"):"Last two exchanges below")):(ar?"لن تُرسل":(lang==="fr"?frenchUI("Not included"):"Not included"))}</p>
       {includeHistory&&history.slice(-2).map((turn,i)=><div key={i} className="rounded-lg bg-[#F6FAF5] p-2">
        <p className="whitespace-pre-wrap break-words">{turn.question}</p>
        <p className="mt-1 whitespace-pre-wrap break-words">{turn.answer.slice(0,800)}</p>
       </div>)}
       <p className="font-semibold">{ar?"ملخص ميزانيتك":(lang==="fr"?frenchUI("Budget summary"):"Budget summary")}</p>
       <p>{shareNumbers&&summary?(ar?"الأرقام الظاهرة في الجدول أعلاه فقط":(lang==="fr"?frenchUI("Only the numeric figures shown above"):"Only the numeric figures shown above")):
        (ar?"لن تُرسل أرقام الميزانية":(lang==="fr"?frenchUI("Not included"):"Not included"))}</p>
       <p className="text-muted-foreground">{ar?"المعاينة لا تعني إرسالاً. يلزم اختيار الموافقة والضغط على إرسال. لا تُدرج أسماء أفراد العائلة أو تفاصيل السجلات المحلية آلياً.":(lang==="fr"?frenchUI("Opening this preview does not send anything. You must separately consent and click Send. No local family names or detailed records are added automatically."):"Opening this preview does not send anything. You must separately consent and click Send. No local family names or detailed records are added automatically.")}</p>
      </div>
     </details>
     <label className="flex items-start gap-2 rounded-xl bg-[#F8F4EC] p-3 text-xs leading-relaxed">
      <input type="checkbox" className="mt-0.5 size-4 shrink-0" checked={consent}
       onChange={e=>setConsent(e.target.checked)}/>
      <span>{ar?"أوافق لهذا الطلب على إرسال سؤالي كما في المعاينة، ومعه الرسائل السابقة وملخص الأرقام فقط إذا اخترتهما بنفسي. أفهم أن إجابة الذكاء الاصطناعي قد تخطئ.":(lang==="fr"?frenchUI("For this request I agree to send the previewed question, plus my separately selected conversation history and numeric summary if enabled, to an AI provider through Dabberna. I understand the model can make mistakes."):"For this request I agree to send the previewed question, plus my separately selected conversation history and numeric summary if enabled, to an AI provider through Dabberna. I understand the model can make mistakes.")}</span>
     </label>
     <Button type="submit" disabled={!consent||busy||!user||question.trim().length<2} aria-busy={busy}>
      <Send className="size-4"/>{busy?(ar?"جارٍ البحث عن جواب...":(lang==="fr"?frenchUI("Getting an answer..."):"Getting an answer...")):(ar?"اسأل الذكاء الاصطناعي":(lang==="fr"?frenchUI("Ask live AI"):"Ask live AI"))}
     </Button>
    </form>
   </>}
  {message&&<p className="mt-3 text-xs text-brand" role="status">{message}</p>}
  {error&&<p className="mt-3 rounded-lg bg-[#FFF1EA] p-3 text-xs text-[#985037]" role="alert"><ShieldAlert className="me-1 inline size-4"/>{error}</p>}
  <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">{ar?"المحادثة محفوظة مؤقتاً في هذه الشاشة فقط ولا يطلب دبّرنا من مزود الذكاء الاصطناعي تخزين ردوده. قد تُطبق سجلات تشغيل واحتفاظ لدى المزود حسب سياساته. لا يوجد ربط تلقائي بالميزانية أو الدفع أو ملفات العائلة.":(lang==="fr"?frenchUI("Conversation is kept in this screen only; the provider request uses store:false. Provider operational retention and safety policies may still apply. There is no automatic access to Money records, child profiles, purchases or payments."):"Conversation is kept in this screen only; the provider request uses store:false. Provider operational retention and safety policies may still apply. There is no automatic access to Money records, child profiles, purchases or payments.")}</p>
 </section>;
}
