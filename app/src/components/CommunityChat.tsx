import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Flag, MessagesSquare, Send, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { getCommunityMessages, hideCommunityContent, reportCommunityContent, sendCommunityMessage, type CommunityMessage } from "@/lib/community";

type Props={groupId:string;currentUserId:string;kind:"general"|"outing"|"advice";topic:string};
export function CommunityChat({groupId,currentUserId,kind,topic}:Props) {
  const {lang}=useI18n();const ar=lang==="ar";
  const [messages,setMessages]=useState<CommunityMessage[]>([]),[body,setBody]=useState("");
  const [busy,setBusy]=useState(false),[error,setError]=useState(""),[ready,setReady]=useState(false);
  const [scope,setScope]=useState<"general"|"context">(kind==="general"?"general":"context");
  const contextKind=scope==="general"?"general":kind;
  const contextTopic=scope==="general"?"":topic;
  const reload=useCallback(async()=>{
    try {
      const result=await getCommunityMessages(groupId,contextKind,contextTopic);
      setMessages([...result].reverse());
      setError("");setReady(true);
    }catch(e){setError(e instanceof Error?e.message:"Could not load messages");setReady(true);}
  },[groupId,contextKind,contextTopic]);
  useEffect(()=>{void reload();const timer=setInterval(()=>void reload(),10000);return ()=>clearInterval(timer);},[reload]);
  const send=async(e:FormEvent)=>{
    e.preventDefault();if(body.trim().length<2||busy)return;
    setBusy(true);setError("");
    try{await sendCommunityMessage(groupId,contextKind,contextTopic,body.trim());setBody("");await reload();}
    catch(x){setError(x instanceof Error?x.message:"Could not send message");}
    finally{setBusy(false);}
  };
  const moderate=async(kind:"report"|"hide",message:CommunityMessage)=>{
    if(kind==="report"&&!window.confirm(ar?"هل تريد الإبلاغ عن رسالة مسيئة أو مضللة؟":"Report this message as abusive or misleading?"))return;
    try{
      if(kind==="report")await reportCommunityContent("message",message.id,"Potentially abusive or misleading");
      else await hideCommunityContent("message",message.id);
      await reload();
    }catch(x){setError(x instanceof Error?x.message:"Action unavailable");}
  };
  return <div className="card-soft overflow-hidden">
    <header className="border-b border-border bg-mint/50 p-4">
      <h3 className="flex items-center gap-2 font-semibold"><MessagesSquare className="size-5 text-brand"/>{ar?"نقاش المجموعة":"Private group discussion"}</h3>
      <p className="mt-1 text-xs text-muted-foreground">{ar?"الأعضاء فقط يمكنهم مشاهدة الرسائل. لا ترتبط هذه المحادثة ببيانات ميزانيتك.":"Messages are visible to group members only. Your financial details are never shared."}</p>
      {kind!=="general" && <div className="mt-3 flex flex-wrap gap-2">
        <Button size="sm" variant={scope==="general"?"default":"outline"} onClick={()=>setScope("general")}>{ar?"النقاش العام":"General chat"}</Button>
        <Button size="sm" variant={scope==="context"?"default":"outline"} onClick={()=>setScope("context")}>{ar?"محادثة حول":"Discuss"}: {topic||kind}</Button>
      </div>}
    </header>
    <div className="max-h-[420px] min-h-[180px] space-y-3 overflow-y-auto bg-background/40 p-4" aria-live="polite">
      {!ready?<p className="text-sm text-muted-foreground">{ar?"جارٍ تحميل الرسائل...":"Loading messages…"}</p>:
      messages.length===0?<p className="text-sm text-muted-foreground">{ar?"لا توجد رسائل هنا بعد. ابدأ الحوار مع أعضاء مجموعتك.":"No messages in this conversation yet. Start a discussion with your group."}</p>:
      messages.map(message=><article key={message.id} className={"max-w-[94%] rounded-2xl border p-3 text-sm "+(message.author_id===currentUserId?"ms-auto border-brand/20 bg-mint/70":"border-border bg-card")}>
        <div className="flex items-center justify-between gap-2">
          <span className="font-semibold text-brand">{message.display_name}</span>
          <time className="text-[11px] text-muted-foreground">{new Date(message.created_at).toLocaleString(ar?"ar-JO":"en-GB",{dateStyle:"short",timeStyle:"short"})}</time>
        </div>
        <p className="mt-1 whitespace-pre-wrap break-words text-ink">{message.body}</p>
        <div className="mt-2 flex justify-end gap-2">
          {message.author_id===currentUserId&&<button onClick={()=>void moderate("hide",message)} className="text-xs text-muted-foreground" aria-label={ar?"إزالة رسالتي":"Remove my message"}><Trash2 className="size-3.5"/></button>}
          {message.author_id!==currentUserId&&<button onClick={()=>void moderate("report",message)} className="text-xs text-muted-foreground" aria-label={ar?"إبلاغ":"Report"}><Flag className="size-3.5"/></button>}
        </div>
      </article>)}
    </div>
    <form onSubmit={send} className="border-t border-border p-3">
      <label className="sr-only" htmlFor="group-message">{ar?"رسالتك":"Your message"}</label>
      <textarea id="group-message" maxLength={1200} required minLength={2} rows={2} value={body} onChange={e=>setBody(e.target.value)}
        className="w-full resize-y rounded-xl border border-border bg-card p-3 text-sm" placeholder={ar?"اسأل عن تجربة أو شارك اقتراحاً...":"Ask for experiences or suggest an outing…"} />
      <div className="mt-2 flex items-center justify-between gap-2"><p className="text-xs text-muted-foreground">{ar?"محادثة خاصة للأعضاء · بدون معلومات حساسة":"Members only · Please avoid sensitive details"}</p>
        <Button disabled={busy||body.trim().length<2} type="submit"><Send className="size-4"/>{ar?"إرسال":"Send"}</Button>
      </div>
    </form>
    {error&&<p role="alert" className="border-t p-3 text-sm text-destructive">{error}</p>}
  </div>;
}
