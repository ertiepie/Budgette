import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { WeeklyTotal } from "../types/budget";
import { formatCurrency } from "../lib/format";

type WeeklyTotalsProps = {
  weeklyTotals: WeeklyTotal[];
};

export function WeeklyTotals({ weeklyTotals }: WeeklyTotalsProps) {
  return (
    <section className="rounded-lg border border-white/70 bg-white/85 p-4 shadow-soft backdrop-blur">
      <h2 className="text-xl font-semibold text-slate-950">Weekly totals</h2>
      <div className="mt-3 h-56">
        <ResponsiveContainer height="100%" width="100%">
          <LineChart data={weeklyTotals} margin={{ left: 0, right: 10, top: 10 }}>
            <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" />
            <XAxis dataKey="label" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} tickFormatter={(value) => `$${value}`} />
            <Tooltip formatter={(value) => formatCurrency(Number(value))} />
            <Line
              dataKey="total"
              dot={{ r: 4 }}
              stroke="#0284c7"
              strokeWidth={3}
              type="monotone"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {weeklyTotals.map((week) => (
          <div
            key={week.label}
            className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2 text-sm"
          >
            <span className="font-medium text-slate-700">
              {week.label}{" "}
              <span className="font-normal text-slate-500">
                ({week.startDate.slice(5)} to {week.endDate.slice(5)})
              </span>
            </span>
            <span className="font-semibold text-slate-950">
              {formatCurrency(week.total)}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
