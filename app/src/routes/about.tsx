import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About this pilot — Wafferli V13" },
      { name: "description", content: "What works in the Wafferli V13 personal pilot, what isn't live yet, and privacy notes." },
      { property: "og:title", content: "About the Wafferli V13 pilot" },
      { property: "og:description", content: "Working features, limitations and how to test." },
    ],
  }),
  component: About,
});

const working = [
  "Home ask box — keyword-based routing (not AI)",
  "My Money — income, savings %, categories, expenses, live calculations (this device only)",
  "Shopping list with totals and 'record as expense' (this device only)",
  "Smart Buy — manual price + delivery comparison vs budget",
  "My Space — household member profiles (this device only)",
  "Wafferli Together — shared vote links stored in the cloud, usable across phones without an account",
];
const notLive = [
  "AI assistant / AI receipt or product photo extraction",
  "Live online prices or real savings figures",
  "Real restaurant data, reviews, prices or reservations (listings are samples)",
  "Accounts, cloud sync of money data, multi-user household sharing",
  "Payments of any kind",
];

function About() {
  return (
    <AppShell title="About this pilot">
      <section className="card-soft p-4"><h2 className="text-lg font-semibold">Working now</h2><ul className="mt-2 list-disc space-y-1 ps-5 text-sm">{working.map((w) => <li key={w}>{w}</li>)}</ul></section>
      <section className="card-soft mt-4 p-4"><h2 className="text-lg font-semibold">Not connected yet</h2><ul className="mt-2 list-disc space-y-1 ps-5 text-sm">{notLive.map((w) => <li key={w}>{w}</li>)}</ul></section>
      <section className="card-soft mt-4 p-4 text-sm">
        <h2 className="text-lg font-semibold">Privacy</h2>
        <p className="mt-1">Money, shopping and household data are stored only in this browser. Clearing site data erases them — use fictional figures. A vote stores only: outing title, date, area, option names, optional organizer name, and each guest's choice + optional first name. Budget and "who pays" stay on the organizer's device.</p>
      </section>
      <section className="card-soft mt-4 p-4 text-sm">
        <h2 className="text-lg font-semibold">How to test</h2>
        <ol className="mt-1 list-decimal space-y-1 ps-5"><li>Explore → Wafferli Together → create a vote.</li><li>Copy the vote link or send via WhatsApp.</li><li>Open it on another phone, vote, then watch your organizer page update.</li></ol>
      </section>
    </AppShell>
  );
}