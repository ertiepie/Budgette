import { format } from "date-fns";
import { formatCurrency } from "../lib/format";
import { parseMonthKey } from "../lib/budget";
import type {
  AnnualCategoryMode,
  AnnualCategoryTotal,
  MonthKey,
} from "../types/budget";

type AnnualCategoryPlanningProps = {
  categoryTotals: AnnualCategoryTotal[];
  mode: AnnualCategoryMode;
  selectedMonth: MonthKey;
  onModeChange: (mode: AnnualCategoryMode) => void;
};

export function AnnualCategoryPlanning({
  categoryTotals,
  mode,
  selectedMonth,
  onModeChange,
}: AnnualCategoryPlanningProps) {
  const selectedYear = format(parseMonthKey(selectedMonth), "yyyy");
  const monthCount = categoryTotals[0]?.monthCount ?? 0;
  const countedLabel = mode === "completed" ? "completed months" : "tracked months";
  const totals = categoryTotals.reduce(
    (nextTotals, category) => ({
      annualizedTotal: nextTotals.annualizedTotal + category.annualizedTotal,
      averageMonthly: nextTotals.averageMonthly + category.averageMonthly,
      total: nextTotals.total + category.total,
    }),
    { annualizedTotal: 0, averageMonthly: 0, total: 0 },
  );

  return (
    <section className="min-w-0 rounded-lg border border-white/70 bg-white/85 p-4 shadow-soft backdrop-blur">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-950">
            Annual category planning
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {selectedYear} spend across {countedLabel}, with monthly averages
            and annualized estimates.
          </p>
        </div>
        <div className="flex flex-col items-start gap-2 sm:items-end">
          <div className="flex rounded-md border border-slate-200 bg-white/75 p-1 text-xs font-semibold">
            {(["completed", "tracked"] as AnnualCategoryMode[]).map((option) => (
              <button
                key={option}
                className={`rounded px-2.5 py-1 transition ${
                  mode === option
                    ? "bg-sky-600 text-white"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
                type="button"
                onClick={() => onModeChange(option)}
              >
                {option === "completed" ? "Completed" : "Tracked"}
              </button>
            ))}
          </div>
          <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
            {monthCount} {monthCount === 1 ? "month" : "months"} counted
          </span>
        </div>
      </div>

      {categoryTotals.length > 0 ? (
        <div className="mt-3 overflow-x-auto">
          <table className="w-full table-fixed text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                <th className="w-[28%] py-2 pr-3">Category</th>
                <th className="w-[24%] py-2 pr-3 text-right">{selectedYear} total</th>
                <th className="w-[24%] py-2 pr-3 text-right">Avg / month</th>
                <th className="w-[24%] py-2 text-right">Annualized</th>
              </tr>
            </thead>
            <tbody>
              {categoryTotals.map((category) => (
                <tr
                  key={category.category}
                  className="border-b border-slate-100 last:border-0"
                >
                  <td className="break-words py-2 pr-3 font-medium text-slate-900">
                    {category.category}
                  </td>
                  <td className="break-words py-2 pr-3 text-right text-slate-700">
                    {formatCurrency(category.total)}
                  </td>
                  <td className="break-words py-2 pr-3 text-right font-semibold text-slate-900">
                    {formatCurrency(category.averageMonthly)}
                  </td>
                  <td className="break-words py-2 text-right font-semibold text-sky-700">
                    {formatCurrency(category.annualizedTotal)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-slate-300 bg-slate-50/80 font-semibold text-slate-950">
                <td className="break-words py-2 pr-3">Total</td>
                <td className="break-words py-2 pr-3 text-right">
                  {formatCurrency(totals.total)}
                </td>
                <td className="break-words py-2 pr-3 text-right">
                  {formatCurrency(totals.averageMonthly)}
                </td>
                <td className="break-words py-2 text-right text-sky-700">
                  {formatCurrency(totals.annualizedTotal)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      ) : (
        <p className="py-8 text-center text-sm text-slate-500">
          No positive spending to annualize for {selectedYear} yet.
        </p>
      )}
    </section>
  );
}
