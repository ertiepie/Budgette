import { format, isBefore, isSameDay, isSameMonth, startOfDay } from "date-fns";
import type { Expense, MonthKey } from "../types/budget";
import {
  getCalendarDays,
  getDailyExpenseTotal,
  parseMonthKey,
} from "../lib/budget";
import { formatCurrency } from "../lib/format";

type CalendarViewProps = {
  expenses: Expense[];
  selectedMonth: MonthKey;
};

const weekdayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function CalendarView({ expenses, selectedMonth }: CalendarViewProps) {
  const days = getCalendarDays(selectedMonth);
  const monthDate = parseMonthKey(selectedMonth);
  const today = startOfDay(new Date());

  return (
    <section className="rounded-lg border border-white/70 bg-white/85 p-4 shadow-soft backdrop-blur">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-slate-950">Calendar</h2>
        <p className="text-sm text-slate-500">{format(monthDate, "MMMM yyyy")}</p>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
        {weekdayLabels.map((weekday) => (
          <div key={weekday} className="py-1">
            {weekday}
          </div>
        ))}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-1">
        {days.map((day) => {
          const isOutsideMonth = !isSameMonth(day, monthDate);
          const isPast = isBefore(day, today);
          const isToday = isSameDay(day, today);
          const dailyTotal = getDailyExpenseTotal(expenses, day);

          return (
            <div
              key={day.toISOString()}
              className={`relative min-h-20 rounded-md border p-2 text-left ${
                isToday
                  ? "border-sky-400 bg-sky-50"
                  : "border-white/70 bg-white/75"
              } ${isOutsideMonth ? "opacity-30" : ""} ${
                isPast ? "text-slate-400" : "text-slate-900"
              }`}
            >
              {isPast ? (
                <span className="pointer-events-none absolute inset-x-1 top-1/2 h-px -rotate-12 bg-slate-300" />
              ) : null}
              <div className="relative flex items-center justify-between gap-1">
                <span className={`text-sm font-semibold ${isToday ? "text-sky-700" : ""}`}>
                  {format(day, "d")}
                </span>
                {isToday ? (
                  <span className="rounded-full bg-sky-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                    Today
                  </span>
                ) : null}
              </div>
              {dailyTotal !== 0 && isSameMonth(day, monthDate) ? (
                <p
                  className={`relative mt-3 text-xs font-semibold ${
                    dailyTotal < 0 ? "text-emerald-700" : "text-rose-600"
                  }`}
                >
                  {formatCurrency(dailyTotal)}
                </p>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}
