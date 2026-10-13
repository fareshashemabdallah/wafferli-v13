import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Copy, MessageCircle, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Tally } from "@/components/Tally";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getAdmin, voteUrl, waLink, type SavedOuting } from "@/lib/outings";
import { readLocal } from "@/lib/storage";

export const Route = createFileRoute("/together/$adminToken")({
  ssr: false,
  head: () => ({ meta: [{ title: "Organizer results — Dabberna Together" }, { name: "robots", content: "noindex" }, { name: "description", content: "Private organizer dashboard for your outing vote." }] }),
  component: AdminPage,
});

function AdminPage() {
  const { adminToken } = Route.useParams();
  const q = useQuery({ queryKey: ["admin", adminToken], queryFn: () => getAdmin(adminToken), refetchInterval: 5000 });
  const [local, setLocal] = useState<SavedOuting | undefined>();
  useEffect(() => setLocal(readLocal<SavedOuting[]>("outings", []).find((o) => o.admin_token === adminToken)), [adminToken]);

  if (q.isPending) return <AppShell title="Results"><Skeleton className="h-64 rounded-2xl" /></AppShell>;
  if (q.isError) return <AppShell title="Results"><p className="text-destructive">{q.error.message}</p><Button className="mt-3" onClick={() => q.refetch()}>Try again</Button></AppShell>;
  const d = q.data;
  if (!d || !d.vote_token) return <AppShell title="Results"><p>This organizer link is invalid.</p><Link to="/explore/together" className="text-brand">Create a new vote</Link></AppShell>;
  const url = voteUrl(d.vote_token);
  const pays: Record<string, string> = { later: "Decide later", equal: "Equal split", separate: "Everyone pays own", host: "Host pays" };

  return (
    <AppShell title={d.title}>
      <p className="text-sm text-muted-foreground">{[d.event_at?.replace("T", " · "), d.neighborhood].filter(Boolean).join(" · ")}</p>
      <section className="card-soft mt-4 p-4">
        <h2 className="font-semibold">Share with friends</h2>
        <p className="mt-1 break-all rounded-lg bg-muted p-2 text-sm" data-testid="vote-url">{url}</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Button asChild size="lg"><a href={waLink(d.title, url)} target="_blank" rel="noreferrer"><MessageCircle className="size-4" /> WhatsApp</a></Button>
          <Button size="lg" variant="outline" onClick={() => navigator.clipboard.writeText(url).then(() => toast.success("Vote link copied"), () => toast.error("Copy failed — long-press the link instead"))}><Copy className="size-4" /> Copy vote link</Button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">Keep this page's address private — it's your organizer link. Friends only get the vote link.</p>
      </section>
      <section className="card-soft mt-4 p-4">
        <div className="flex items-center justify-between"><h2 className="font-semibold">Live tally</h2>
          <Button size="sm" variant="ghost" onClick={() => q.refetch()} aria-label="Refresh"><RefreshCw className={`size-4 ${q.isFetching ? "animate-spin" : ""}`} /></Button></div>
        <div className="mt-2"><Tally options={d.options} total={d.total_votes} friends={d.friend_count} showVoters /></div>
        <p className="mt-3 text-xs text-muted-foreground">Updates every 5 seconds.</p>
      </section>
      {local && (local.budget || local.whoPays) && (
        <section className="card-soft mt-4 p-4 text-sm">
          <h2 className="font-semibold">Private notes (this device only)</h2>
          {local.budget && <p className="mt-1">Budget: {local.budget}</p>}
          {local.whoPays && <p>Who pays: {pays[local.whoPays]}</p>}
        </section>
      )}
    </AppShell>
  );
}