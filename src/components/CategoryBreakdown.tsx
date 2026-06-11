import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import type { CategoryTotal } from "../types/budget";
import { formatCurrency, formatPercent } from "../lib/format";

type CategoryBreakdownProps = {
  categoryTotals: CategoryTotal[];
};

const colors = ["#0284c7", "#14b8a6", "#f97316", "#8b5cf6", "#ef4444", "#84cc16"];

type PieLabelProps = {
  cx?: number | string;
  cy?: number | string;
  fill?: string;
  midAngle?: number;
  outerRadius?: number | string;
  payload?: CategoryTotal;
};

function renderCategoryLabel({
  cx = 0,
  cy = 0,
  fill = "#94a3b8",
  midAngle = 0,
  outerRadius = 0,
  payload,
}: PieLabelProps) {
  if (!payload) {
    return null;
  }

  const centerX = Number(cx);
  const centerY = Number(cy);
  const angle = (-midAngle * Math.PI) / 180;
  const startRadius = Number(outerRadius) + 2;
  const endRadius = Number(outerRadius) + 18;
  const labelGap = 8;
  const labelSide = Math.cos(angle) >= 0 ? 1 : -1;
  const lineStartX = centerX + startRadius * Math.cos(angle);
  const lineStartY = centerY + startRadius * Math.sin(angle);
  const lineEndX = centerX + endRadius * Math.cos(angle);
  const lineEndY = centerY + endRadius * Math.sin(angle);
  const textX = lineEndX + labelGap * labelSide;

  return (
    <g>
      <line
        stroke={fill}
        strokeWidth={1}
        x1={lineStartX}
        x2={lineEndX}
        y1={lineStartY}
        y2={lineEndY}
      />
      <text
        dominantBaseline="central"
        fill="#475569"
        fontSize={10}
        fontWeight={600}
        textAnchor={labelSide > 0 ? "start" : "end"}
        x={textX}
        y={lineEndY}
      >
        {payload.category} {formatPercent(payload.percentage)}
      </text>
    </g>
  );
}

export function CategoryBreakdown({ categoryTotals }: CategoryBreakdownProps) {
  return (
    <section className="rounded-lg border border-white/70 bg-white/85 p-4 shadow-soft backdrop-blur">
      <h2 className="text-xl font-semibold text-slate-950">Category breakdown</h2>
      {categoryTotals.length > 0 ? (
        <>
          <div className="mt-3 h-56">
            <ResponsiveContainer height="100%" width="100%">
              <PieChart>
                <Pie
                  data={categoryTotals}
                  dataKey="total"
                  innerRadius={45}
                  nameKey="category"
                  outerRadius={82}
                  paddingAngle={2}
                  label={renderCategoryLabel}
                  labelLine={false}
                >
                  {categoryTotals.map((entry, index) => (
                    <Cell
                      key={entry.category}
                      fill={colors[index % colors.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, _name, item) => {
                    const payload = item.payload as CategoryTotal;
                    return [
                      `${formatCurrency(Number(value))} (${formatPercent(payload.percentage)})`,
                      payload.category,
                    ];
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                  <th className="py-2 pr-3">Category</th>
                  <th className="py-2 pr-3 text-right">Total spent</th>
                  <th className="py-2 text-right">Percentage</th>
                </tr>
              </thead>
              <tbody>
                {categoryTotals.map((category) => (
                  <tr
                    key={category.category}
                    className="border-b border-slate-100 last:border-0"
                  >
                    <td className="py-2 pr-3 font-medium text-slate-900">
                      {category.category}
                    </td>
                    <td className="py-2 pr-3 text-right font-semibold text-slate-900">
                      {formatCurrency(category.total)}
                    </td>
                    <td className="py-2 text-right text-slate-600">
                      {formatPercent(category.percentage)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <p className="py-8 text-center text-sm text-slate-500">
          No positive spending to categorize yet.
        </p>
      )}
    </section>
  );
}
