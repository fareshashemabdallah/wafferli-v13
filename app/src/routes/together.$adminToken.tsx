import { useI18n } from "@/lib/i18n";
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
import { formatJod } from "@/lib/outingCosts";

export const Route = createFileRoute("/together/$adminToken")({
  ssr: false,
  head: () => ({ meta: [{ title: "Organizer results — Dabberna Together" }, { name: "robots", content: "noindex" }, { name: "description", content: "Private organizer dashboard for your outing vote." }] }),
  component: AdminPage,
});

function AdminPage() {
  const { tr } = useI18n();
  const { adminToken } = Route.useParams();
  const q = useQuery({ queryKey: ["admin", adminToken], queryFn: () => getAdmin(adminToken), refetchInterval: 5000 });
  const [local, setLocal] = useState<SavedOuting | undefined>();
  useEffect(() => setLocal(readLocal<SavedOuting[]>("outings", []).find((o) => o.admin_token === adminToken)), [adminToken]);

  if (q.isPending) return <AppShell title={tr("Results")}><Skeleton className="h-64 rounded-2xl" /></AppShell>;
  if (q.isError) return <AppShell title={tr("Results")}><p className="text-destructive">{q.error.message}</p><Button className="mt-3" onClick={() => q.refetch()}>{tr("Try again")}</Button></AppShell>;
  const d = q.data;
  if (!d || !d.vote_token) return <AppShell title={tr("Results")}><p>{tr("This organizer link is invalid.")}</p><Link to="/explore/together" className="text-brand">{tr("Create a new vote")}</Link></AppShell>;
  const url = voteUrl(d.vote_token);
  const pays: Record<string, string> = { later: "Decide later", equal: "Equal split", separate: "Everyone pays own", host: "Host pays" };

  return (
    <AppShell title={d.title}>
      <p className="text-sm text-muted-foreground">{[d.event_at?.replace("T", " · "), d.neighborhood].filter(Boolean).join(" · ")}</p>
      <Link to="/community" search={{kind:"outing",topic:d.title.slice(0,100),invite:undefined,category:"restaurant",item:"",area:""}} className="card-soft mt-4 flex items-start gap-3 p-4 text-sm hover:border-brand/40">
        <MessageCircle className="size-5 shrink-0 text-brand"/>
        <span><strong>{tr("Discuss this outing with a group")}</strong><span className="mt-1 block text-xs text-muted-foreground">{tr("Ask parents or friends for ideas before you choose a place. Only invited members can see the chat.")}</span></span>
      </Link>
      <section className="card-soft mt-4 p-4">
        <h2 className="font-semibold">{tr("Share with friends")}</h2>
        <p className="mt-1 break-all rounded-lg bg-muted p-2 text-sm" data-testid="vote-url">{url}</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Button asChild size="lg"><a href={waLink(d.title, url)} target="_blank" rel="noreferrer"><MessageCircle className="size-4" /> {tr("WhatsApp")}</a></Button>
          <Button size="lg" variant="outline" onClick={() => navigator.clipboard.writeText(url).then(() => toast.success(tr("Vote link copied")), () => toast.error(tr("Copy failed — long-press the link instead")))}><Copy className="size-4" /> {tr("Copy vote link")}</Button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">{tr("Keep this page's address private — it's your organizer link. Friends only get the vote link.")}</p>
      </section>
      <section className="card-soft mt-4 p-4">
        <div className="flex items-center justify-between"><h2 className="font-semibold">{tr("Live tally")}</h2>
          <Button size="sm" variant="ghost" onClick={() => q.refetch()} aria-label={tr("Refresh")}><RefreshCw className={`size-4 ${q.isFetching ? "animate-spin" : ""}`} /></Button></div>
        <div className="mt-2"><Tally options={d.options} total={d.total_votes} friends={d.friend_count} showVoters /></div>
        <p className="mt-3 text-xs text-muted-foreground">{tr("Updates every 5 seconds.")}</p>
      </section>
      {local && (
        <section className="card-soft mt-4 p-4 text-sm">
          <h2 className="font-semibold">{tr("Organizer-only planning notes")}</h2>
          <p className="mt-1 text-xs text-muted-foreground">{tr("These details are stored on this device and are not included in the shared vote.")}</p>
          {local.activity && <p className="mt-2">{tr("Outing type:")} {tr(({food:"Food & cafés",family:"Family & kids",entertainment:"Entertainment & events",outdoors:"Outdoor adventures",sports:"Sports & games",culture:"Culture & learning",trip:"Trips & experiences",other:"Other / undecided"} as const)[local.activity])}</p>}
          {local.budget && <p>{tr("Previous per-person budget note:")} {local.budget}</p>}
          {local.adultCount !== undefined && <div className="mt-3 rounded-xl border bg-muted/40 p-3">
            <h3 className="font-semibold">{tr("Private outing cost estimate · JOD")}</h3>
            <p className="mt-1">{tr("Adults attending:")} {local.adultCount}</p>
            {local.adultCostPerPerson !== undefined && <p>{tr("Adults:")} {local.adultCount} × {formatJod(local.adultCostPerPerson)} = {formatJod(local.adultCount * local.adultCostPerPerson)}</p>}
            {local.childrenAttendance === "yes" && <p>{tr("Children:")} {local.childCount ?? "?"}
              {local.childCostPerPerson !== undefined && local.childCount !== undefined
                ? " × " + formatJod(local.childCostPerPerson) + " = " + formatJod(local.childCostPerPerson * local.childCount)
                : " — "+tr("cost not entered")}</p>}
            {local.travelCost !== undefined && <p>{tr("Transport (group):")} {formatJod(local.travelCost)}</p>}
            {local.otherCost !== undefined && <p>{tr("Other shared costs:")} {formatJod(local.otherCost)}</p>}
            {local.estimatedTotal !== undefined
              ? <p className="mt-2 font-semibold">{tr("Estimated total:")} {formatJod(local.estimatedTotal)}</p>
              : <p className="mt-2 text-muted-foreground">{tr("Final estimate incomplete — check missing rates or child attendance.")}</p>}
            {local.totalBudget !== undefined && <p>{tr("Whole-outing spending limit:")} {formatJod(local.totalBudget)}</p>}
            {local.totalBudget !== undefined && local.estimatedTotal !== undefined && <p className={"font-semibold " + (local.estimatedTotal <= local.totalBudget ? "text-emerald-700 dark:text-emerald-300" : "text-destructive")}>
              {local.estimatedTotal <= local.totalBudget
                ? tr("Within budget by ") + formatJod(local.totalBudget - local.estimatedTotal)
                : tr("Over budget by ") + formatJod(local.estimatedTotal - local.totalBudget)}
            </p>}
            <p className="mt-2 text-xs text-muted-foreground">{tr("Estimated by the organizer, not verified live prices. These amounts are not shared with voters.")}</p>
          </div>}
          {local.whoPays && <p>{tr("Who pays:")} {tr(pays[local.whoPays]??"")}</p>}
          {local.childrenAttendance && <p>{tr("Children attending:")} {tr(({no:"No",yes:"Yes",unsure:"Not decided"} as const)[local.childrenAttendance])}</p>}
          {local.childrenAttendance === "yes" && <>
            {local.childrenFocus && <p>{tr("Focus:")} {tr(({children:"Children-focused",mixed:"Family / mixed",adults:"Adult-focused with children"} as const)[local.childrenFocus])}</p>}
            {local.childCount !== undefined && <p>{tr("Estimated children:")} {local.childCount}</p>}
            {local.ageBands && local.ageBands.length > 0 && <p>{tr("Age groups:")} {local.ageBands.join(", ")}</p>}
            {(local.stroller || local.quiet) && <p>{tr("Needs:")} {[local.stroller && tr("Stroller / step-free access"), local.quiet && tr("Quiet environment")].filter(Boolean).join("; ")}</p>}
            <p className="mt-2 rounded-lg bg-muted p-2 text-xs">{tr("Check age restrictions, smoke exposure, safe play areas, suitable facilities, travel needs and children's pricing before confirming.")}</p>
          </>}
          {local.childrenAttendance === "unsure" && <p className="mt-2 rounded-lg bg-muted p-2 text-xs">{tr("Confirm whether children will attend before selecting an adults-only or age-restricted venue.")}</p>}
        </section>
      )}
    </AppShell>
  );
}