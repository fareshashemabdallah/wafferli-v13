import { useI18n } from "@/lib/i18n";
import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { LocalDataControls } from "@/components/LocalDataControls";
import { PrivateVaultPanel } from "@/components/PrivateVaultPanel";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About this pilot — Dabberna V13" },
      { name: "description", content: "What works in the Dabberna V13 personal pilot, what isn't live yet, and privacy notes." },
      { property: "og:title", content: "About the Dabberna V13 pilot" },
      { property: "og:description", content: "Working features, limitations and how to test." },
    ],
  }),
  component: About,
});

const working = [
  "My Day — financial snapshot, weather and helpful family suggestions",
  "Our Finances — income, commitments, expenses and cash-flow planning (this device only)",
  "My Basket — plan quantities, review totals and record an expense (this device only)",
  "Compare & Choose — manual total-cost comparison; quality must be evaluated separately",
  "My Family — household profiles and preferences (this device only)",
  "Plan Together — share outing votes and organize child-aware experiences",
];
const notLive = [
  "AI assistant / AI receipt or product photo extraction",
  "Live online prices or real savings figures",
  "Automated provider reviews, verified prices or bookings (third-party directory links are available)",
  "Shared family financial accounts and cross-device sync (group accounts are separate)",
  "Payments of any kind",
];

function About() {
  const { tr } = useI18n();
  return (
    <AppShell title={tr("About this pilot")}>
      <section className="card-soft p-4"><h2 className="text-lg font-semibold">{tr("Working now")}</h2><ul className="mt-2 list-disc space-y-1 ps-5 text-sm">{working.map((w) => <li key={w}>{tr(w)}</li>)}</ul></section>
      <section className="card-soft mt-4 p-4"><h2 className="text-lg font-semibold">{tr("Not connected yet")}</h2><ul className="mt-2 list-disc space-y-1 ps-5 text-sm">{notLive.map((w) => <li key={w}>{tr(w)}</li>)}</ul></section>
      <section className="card-soft mt-4 p-4 text-sm">
        <h2 className="text-lg font-semibold">{tr("Privacy")}</h2>
        <p className="mt-1">{tr("Money, shopping and household data are stored only in this browser. Clearing site data erases them — use fictional figures. A vote stores only: outing title, date, area, option names, optional organizer name, and each guest's choice + optional first name. Budget and \"who pays\" stay on the organizer's device.")}</p>
      </section>
      <LocalDataControls/>
      <PrivateVaultPanel/>
      <section className="card-soft mt-4 p-4 text-sm">
        <h2 className="text-lg font-semibold">{tr("How to test")}</h2>
        <ol className="mt-1 list-decimal space-y-1 ps-5"><li>{tr("Discover → Plan Together → create a vote.")}</li><li>{tr("Copy the vote link or send via WhatsApp.")}</li><li>{tr("Open it on another phone, vote, then watch your organizer page update.")}</li></ol>
      </section>
    </AppShell>
  );
}