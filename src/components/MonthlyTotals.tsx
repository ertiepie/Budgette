import { format } from "date-fns";
import { parseMonthKey } from "../lib/budget";
import { formatCurrency } from "../lib/format";
import type { MonthKey, MonthlyTotal } from "../types/budget";

type MonthlyTotalsProps = {
  monthlyTotals: MonthlyTotal[];
  selectedMonth: MonthKey;
};

export function MonthlyTotals({
  monthlyTotals,
  selectedMonth,
}: MonthlyTotalsProps) {
  const yearToDateTotal = monthlyTotals.reduce(
    (sum, month) => sum + month.total,
    0,
  );
  const firstMonth = monthlyTotals[0]?.monthKey;
  const dateRange = firstMonth
    ? `${format(parseMonthKey(firstMonth), "MMMM")} through ${format(
        parseMonthKey(selectedMonth),
        "MMMM yyyy",
      )}`
    : format(parseMonthKey(selectedMonth), "yyyy");

  return (
    <section className="rounded-lg border border-white/70 bg-white/85 p-4 shadow-soft backdrop-blur">
      <h2 className="text-xl font-semibold text-slate-950">
        Monthly totals to date
      </h2>
      <p className="mt-1 text-sm text-slate-500">{dateRange}</p>
      {monthlyTotals.length > 0 ? (
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                <th className="py-2 pr-3">Month</th>
                <th className="py-2 text-right">Total spent</th>
              </tr>
            </thead>
            <tbody>
              {monthlyTotals.map((month) => (
                <tr
                  key={month.monthKey}
                  className={`border-b border-slate-100 last:border-0 ${
                    month.monthKey === selectedMonth
                      ? "current-month-row bg-sky-50/80"
                      : ""
                  }`}
                >
                  <td className="py-2 pr-3 font-medium text-slate-900">
                    {format(parseMonthKey(month.monthKey), "MMMM")}
                  </td>
                  <td className="py-2 text-right font-semibold text-slate-900">
                    {formatCurrency(month.total)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-slate-300 bg-slate-50/80 font-semibold text-slate-950">
                <td className="py-2 pr-3">Year to date</td>
                <td className="py-2 text-right font-bold text-sky-700">
                  {formatCurrency(yearToDateTotal)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      ) : (
        <p className="py-8 text-center text-sm text-slate-500">
          No tracked monthly spending yet.
        </p>
      )}
    </section>
  );
}
