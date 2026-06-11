import type { MonthlySummary } from "../types/budget";
import { formatCurrency } from "../lib/format";

type SummaryCardsProps = {
  summary: MonthlySummary;
};

const cards = [
  { key: "totalAvailable", label: "Total available" },
  { key: "totalSpent", label: "Spent" },
  { key: "remaining", label: "Remaining" },
  { key: "availablePerDay", label: "Available per day" },
] as const;

export function SummaryCards({ summary }: SummaryCardsProps) {
  return (
    <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {cards.map((card) => {
        const value = summary[card.key];
        const isNegative = value < 0;

        return (
          <article
            key={card.key}
            className="rounded-lg border border-white/70 bg-white/85 p-4 shadow-soft backdrop-blur"
          >
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              {card.label}
            </p>
            <p
              className={`mt-2 text-2xl font-semibold ${
                isNegative ? "text-rose-600" : "text-slate-950"
              }`}
            >
              {formatCurrency(value)}
            </p>
            {card.key === "availablePerDay" && summary.isPastMonth ? (
              <p className="mt-1 text-xs text-slate-500">Month closed</p>
            ) : null}
          </article>
        );
      })}
    </section>
  );
}
