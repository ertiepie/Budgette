import { formatCurrency, formatPercent } from "../lib/format";
import type { AccountTotal } from "../types/budget";

type AccountBreakdownProps = {
  accountTotals: AccountTotal[];
};

export function AccountBreakdown({ accountTotals }: AccountBreakdownProps) {
  const totalSpent = accountTotals.reduce(
    (sum, account) => sum + account.total,
    0,
  );

  return (
    <section className="rounded-lg border border-white/70 bg-white/85 p-4 shadow-soft backdrop-blur">
      <h2 className="text-xl font-semibold text-slate-950">Account breakdown</h2>
      {accountTotals.length > 0 ? (
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                <th className="py-2 pr-3">Account</th>
                <th className="py-2 pr-3 text-right">Total spent</th>
                <th className="py-2 text-right">Percentage</th>
              </tr>
            </thead>
            <tbody>
              {accountTotals.map((account) => (
                <tr
                  key={account.account}
                  className="border-b border-slate-100 last:border-0"
                >
                  <td className="py-2 pr-3 font-medium text-slate-900">
                    {account.account}
                  </td>
                  <td className="py-2 pr-3 text-right font-semibold text-slate-900">
                    {formatCurrency(account.total)}
                  </td>
                  <td className="py-2 text-right text-slate-600">
                    {formatPercent(account.percentage)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-slate-300 text-slate-950">
                <td className="py-2 pr-3 font-semibold">Total</td>
                <td className="py-2 pr-3 text-right font-bold">
                  {formatCurrency(totalSpent)}
                </td>
                <td className="py-2 text-right font-semibold">
                  {formatPercent(100)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      ) : (
        <p className="py-8 text-center text-sm text-slate-500">
          No positive spending to group by account yet.
        </p>
      )}
    </section>
  );
}
