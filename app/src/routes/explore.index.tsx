import { createFileRoute, Link } from "@tanstack/react-router";
import { ListChecks, ShoppingBag, Users, UtensilsCrossed } from "lucide-react";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/explore/")({
  head: () => ({
    meta: [
      { title: "Explore — Dabberna" },
      { name: "description", content: "Explore places and experiences; plan child-aware family or friends outings; compare shopping choices." },
      { property: "og:title", content: "Explore — Dabberna" },
      { property: "og:description", content: "Decide what to buy and where to go." },
    ],
  }),
  component: Explore,
});

const items = [
  { to: "/explore/together" as const, title: "Dabberna Together", desc: "Plan any outing. Choose whether children are joining and who the activity is for, then vote as a group.", icon: Users, live: "Child-aware planning & group voting" },
  { to: "/explore/smartbuy" as const, title: "Smart Buy", desc: "Compare options by total cost incl. delivery or travel.", icon: ShoppingBag, live: "Manual comparison" },
  { to: "/explore/shopping" as const, title: "Shopping List", desc: "Grocery basket with quantities and running total.", icon: ListChecks, live: "Saved on device" },
  { to: "/explore/restaurants" as const, title: "Food & Café Discovery", desc: "Explore real place searches and cuisines across Jordan.", icon: UtensilsCrossed, live: "Google Maps links / optional Geoapify" },
];

function Explore() {
  return (
    <AppShell title="Explore">
      <div className="grid gap-3 sm:grid-cols-2">
        {items.map(({ to, title, desc, icon: Icon, live }) => (
          <Link key={to} to={to} className="card-soft flex gap-4 p-4 transition hover:-translate-y-0.5">
            <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-mint text-brand"><Icon className="size-6" /></span>
            <span>
              <span className="block font-semibold">{title}</span>
              <span className="block text-sm text-muted-foreground">{desc}</span>
              <span className="mt-1 inline-block rounded-full bg-lime px-2 text-[11px] font-semibold text-ink">{live}</span>
            </span>
          </Link>
        ))}
      </div>
    </AppShell>
  );
}