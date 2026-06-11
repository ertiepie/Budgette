import { format } from "date-fns";
import type { BudgetMonth, MonthKey } from "../types/budget";
import { parseMonthKey } from "../lib/budget";

type MonthSetupProps = {
  baseAmount: number;
  months: BudgetMonth[];
  selectedMonth: MonthKey;
  onBaseAmountChange: (value: number) => void;
  onMonthChange: (monthKey: MonthKey) => void;
};

export function MonthSetup({
  baseAmount,
  months,
  selectedMonth,
  onBaseAmountChange,
  onMonthChange,
}: MonthSetupProps) {
  function openMonthPicker(event: React.MouseEvent<HTMLInputElement>) {
    try {
      event.currentTarget.showPicker?.();
    } catch {
      event.currentTarget.focus();
    }
  }

  return (
    <section className="rounded-lg border border-white/70 bg-white/85 p-4 shadow-soft backdrop-blur">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="flex-1">
          <span className="text-sm font-medium text-slate-700">Selected month</span>
          <input
            className="mt-1 w-full cursor-pointer rounded-md border border-slate-300 px-3 py-2 text-sm outline-none ring-sky-500 transition focus:ring-2"
            list="budget-months"
            type="month"
            value={selectedMonth}
            onChange={(event) => onMonthChange(event.target.value)}
            onClick={openMonthPicker}
          />
          <datalist id="budget-months">
            {months.map((month) => (
              <option key={month.id} value={month.id}>
                {format(parseMonthKey(month.id), "MMMM yyyy")}
              </option>
            ))}
          </datalist>
        </label>
        <label className="flex-1">
          <span className="text-sm font-medium text-slate-700">Initial Budget</span>
          <input
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none ring-sky-500 transition focus:ring-2"
            min="0"
            step="0.01"
            type="number"
            value={baseAmount}
            onChange={(event) => onBaseAmountChange(Number(event.target.value))}
          />
        </label>
      </div>
    </section>
  );
}
