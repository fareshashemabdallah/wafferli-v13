import { useI18n } from "@/lib/i18n";
import type { VoteOption } from "@/lib/outings";

export function Tally({ options, total, friends, mine, showVoters }: { options: VoteOption[]; total: number; friends: number; mine?: string | null; showVoters?: boolean }) {
  const { tr } = useI18n();
  const max = Math.max(0, ...options.map((o) => o.votes));
  return (
    <div>
      <p className="text-sm text-muted-foreground"><span className="font-semibold text-ink">{total}/{friends}</span> {tr("voted")}</p>
      <ul className="mt-3 space-y-3">
        {options.map((o) => {
          const pct = total ? Math.round((o.votes / total) * 100) : 0;
          return (
            <li key={o.id}>
              <div className="flex justify-between gap-2 text-sm">
                <span className="font-medium">{o.name}{o.id === mine && " · "+tr("your pick")}{max > 0 && o.votes === max && " 🏆"}</span>
                <span className="tabular-nums text-muted-foreground">{o.votes} · {pct}%</span>
              </div>
              <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-brand-2 transition-all" style={{ width: `${pct}%` }} />
              </div>
              {showVoters && o.voters && o.voters.length > 0 && <p className="mt-1 text-xs text-muted-foreground">{o.voters.join(", ")}</p>}
            </li>
          );
        })}
      </ul>
    </div>
  );
}