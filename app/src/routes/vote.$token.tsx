import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Check, Languages } from "lucide-react";
import { useEffect, useState } from "react";
import { Logo } from "@/components/Logo";
import { Tally } from "@/components/Tally";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useI18n } from "@/lib/i18n";
import { castVote, getVote } from "@/lib/outings";
import { readLocal, writeLocal } from "@/lib/storage";

export const Route = createFileRoute("/vote/$token")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Vote: where should we go? — Dabberna Together" },
      { name: "description", content: "Pick one place for our outing. No account needed." },
      { property: "og:title", content: "Where should we go? Vote now" },
      { property: "og:description", content: "Pick one restaurant for our outing — takes 10 seconds, no account." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: VotePage,
});

function VotePage() {
  const { tr } = useI18n();
  const { token } = Route.useParams();
  const { t, lang, setLang } = useI18n();
  const q = useQuery({ queryKey: ["vote", token], queryFn: () => getVote(token), refetchInterval: 5000 });
  const [pick, setPick] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [justVoted, setJustVoted] = useState(false);
  useEffect(() => setName(readLocal("voterName", "")), []);
  const mine = q.data?.my_option_id ?? null;
  useEffect(() => { if (mine && pick === null) setPick(mine); }, [mine, pick]);

  const shell = (c: React.ReactNode) => (
    <div className="mx-auto min-h-dvh max-w-lg px-4 pb-safe pt-safe">
      <header className="flex h-16 items-center justify-between">
        <Logo />
        <button onClick={() => setLang(lang === "en" ? "ar" : "en")} className="inline-flex h-10 items-center gap-1 rounded-full border bg-card px-3 text-sm"><Languages className="size-4" />{lang === "en" ? "العربية" : "English"}</button>
      </header>
      {c}
    </div>
  );

  if (q.isPending) return shell(<div className="space-y-3"><Skeleton className="h-24 rounded-2xl" /><Skeleton className="h-16 rounded-2xl" /><Skeleton className="h-16 rounded-2xl" /></div>);
  if (q.isError) return shell(<div className="card-soft p-5"><p className="text-destructive">{q.error.message}</p><Button className="mt-3" onClick={() => q.refetch()}>{tr("Try again")}</Button></div>);
  const d = q.data;
  if (!d) return shell(<div className="card-soft p-5">{t("notFound")}</div>);

  const submit = async () => {
    if (!pick) return setErr("Please choose one option.");
    setBusy(true); setErr("");
    try {
      await castVote(token, pick, name);
      writeLocal("voterName", name);
      setJustVoted(true);
      await q.refetch();
    } catch (x) { setErr(x instanceof Error ? x.message : "Could not save vote."); }
    finally { setBusy(false); }
  };

  return shell(
    <>
      <section className="hero-surface rounded-3xl p-5">
        <h1 className="text-2xl font-semibold">{d.title}</h1>
        <p className="mt-1 text-sm opacity-85">{[d.event_at?.replace("T", " · "), d.neighborhood].filter(Boolean).join(" · ")}</p>
        {d.organizer_name && <p className="mt-1 text-sm opacity-85">{t("organizer")}: {d.organizer_name}</p>}
      </section>
      <h2 className="mt-5 text-lg font-semibold">{t("voteFor")}</h2>
      <div role="radiogroup" className="mt-2 space-y-2">
        {d.options.map((o) => (
          <button key={o.id} role="radio" aria-checked={pick === o.id} onClick={() => setPick(o.id)}
            className={`flex w-full items-center gap-3 rounded-2xl border-2 bg-card p-4 text-start transition ${pick === o.id ? "border-brand bg-mint" : "border-border"}`}>
            <span className={`grid size-6 shrink-0 place-items-center rounded-full border-2 ${pick === o.id ? "border-brand bg-brand text-primary-foreground" : "border-input"}`}>{pick === o.id && <Check className="size-4" />}</span>
            <span><span className="block font-medium">{o.name}</span>{o.note && <span className="block text-xs text-muted-foreground">{o.note}</span>}</span>
          </button>
        ))}
      </div>
      <label className="mt-4 block text-sm font-medium">{t("yourName")}
        <Input className="mt-1.5 h-11 bg-card" maxLength={30} value={name} onChange={(e) => setName(e.target.value)} />
      </label>
      {err && <p className="mt-2 text-sm text-destructive" role="alert">{err}</p>}
      <Button size="lg" className="mt-4 h-12 w-full" onClick={submit} disabled={busy}>{busy ? "…" : mine ? t("changeVote") : t("submitVote")}</Button>
      {justVoted && <p className="mt-2 text-center text-sm font-medium text-brand" role="status">{t("thanks")}</p>}
      {mine && (
        <section className="card-soft mt-5 p-4">
          <h2 className="mb-2 font-semibold">{t("results")}</h2>
          <Tally options={d.options} total={d.total_votes} friends={d.friend_count} mine={mine} />
        </section>
      )}
      <p className="my-6 text-center text-xs text-muted-foreground">{t("noAccount")}</p>
    </>,
  );
}