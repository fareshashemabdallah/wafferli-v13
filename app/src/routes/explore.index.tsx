import { useI18n } from "@/lib/i18n";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ListChecks, MessageCircle, ShoppingBag, Stethoscope, Users, UtensilsCrossed } from "lucide-react";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/explore/")({
  head: () => ({
    meta: [
      { title: "Discover — Dabberna" },
      { name: "description", content: "Explore places and experiences; plan child-aware family or friends outings; compare shopping choices." },
      { property: "og:title", content: "Discover — Dabberna" },
      { property: "og:description", content: "Decide what to buy and where to go." },
    ],
  }),
  component: Explore,
});

const items = [
  { to: "/explore/together" as const, title: "Plan Together", desc: "Find an experience worth sharing. Consider the children, total cost and everyone’s preferences.", icon: Users, live: "Child-aware planning & group voting" },
  { to: "/explore/smartbuy" as const, title: "Compare & Choose", desc: "Compare the full cost, then consider quality, suitability and convenience—not just price.", icon: ShoppingBag, live: "Manual comparison" },
  { to: "/explore/shopping" as const, title: "My Basket", desc: "Stay organized and know your basket’s estimated total before checking out.", icon: ListChecks, live: "Saved on device" },
  { to: "/explore/restaurants" as const, title: "Eat & Enjoy", desc: "Discover places and cuisines that suit your family and the occasion.", icon: UtensilsCrossed, live: "Google Maps links / optional Geoapify" },
  { to: "/community" as const, title: "Family & Friends Circles", desc: "Invitation-only chat for parents and friends, including outing and advice conversations.", icon: MessageCircle, live: "Shared across signed-in members" },
  { to: "/experience" as const, title: "Community Experiences", desc: "Learn from personal opinions on the exact place, doctor, service or product you research.", icon: MessageCircle, live: "Item-specific, not a public feed" },
  { to: "/explore/services" as const, title: "Find the Right Service", desc: "Look for services based on your real needs, not just price or popularity.", icon: Stethoscope, live: "Third-party directory links — no AI review analysis yet" },
];

function Explore() {
  const { tr } = useI18n();
  return (
    <AppShell title={tr("Discover")}>
      <p className="mb-5 text-sm text-muted-foreground">{tr("Discover experiences, services and purchases that fit your family—not just the lowest price.")}</p>
      <div className="grid gap-3 sm:grid-cols-2">
        {items.map(({ to, title, desc, icon: Icon, live }) => (
          <Link key={to} to={to} className="card-soft flex gap-4 p-4 transition hover:-translate-y-0.5">
            <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-mint text-brand"><Icon className="size-6" /></span>
            <span>
              <span className="block font-semibold">{tr(title)}</span>
              <span className="block text-sm text-muted-foreground">{tr(desc)}</span>
              <span className="mt-1 inline-block rounded-full bg-lime px-2 text-[11px] font-semibold text-ink">{tr(live)}</span>
            </span>
          </Link>
        ))}
      </div>
    </AppShell>
  );
}