import {
  addDays,
  differenceInCalendarDays,
  endOfMonth,
  endOfWeek,
  format,
  getDate,
  isAfter,
  isBefore,
  isSameDay,
  isSameMonth,
  lastDayOfMonth,
  parseISO,
  setDate,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import type {
  AccountTotal,
  BudgetData,
  BudgetMonth,
  AnnualCategoryMode,
  AnnualCategoryTotal,
  CategoryTotal,
  Expense,
  MonthKey,
  MonthlyTotal,
  MonthlySummary,
  WeeklyTotal,
} from "../types/budget";

export const monthKeyFormat = "yyyy-MM";
export const inputDateFormat = "yyyy-MM-dd";

export function getMonthKey(date: Date) {
  return format(date, monthKeyFormat);
}

export function parseMonthKey(monthKey: MonthKey) {
  return parseISO(`${monthKey}-01`);
}

export function getExpenseMonthKey(expense: Expense) {
  return getMonthKey(parseISO(expense.date));
}

function getMonthlyOccurrenceDate(expense: Expense, monthKey: MonthKey) {
  const selectedMonth = parseMonthKey(monthKey);
  const originalDate = parseISO(expense.date);
  const dayOfMonth = Math.min(
    getDate(originalDate),
    getDate(lastDayOfMonth(selectedMonth)),
  );

  return format(setDate(selectedMonth, dayOfMonth), inputDateFormat);
}

export function getExpensesForMonth(expenses: Expense[], monthKey: MonthKey) {
  return expenses.flatMap((expense) => {
    const expenseMonthKey = getExpenseMonthKey(expense);

    if (expenseMonthKey === monthKey) {
      return [expense];
    }

    if (
      expense.isMonthly &&
      expenseMonthKey < monthKey &&
      (!expense.recurrenceEndMonth || monthKey <= expense.recurrenceEndMonth)
    ) {
      const hasMonthlyOverride = expenses.some(
        (item) =>
          item.recurringExpenseId === expense.id &&
          getExpenseMonthKey(item) === monthKey,
      );

      if (hasMonthlyOverride) {
        return [];
      }

      return [
        {
          ...expense,
          id: `${expense.id}:${monthKey}`,
          date: getMonthlyOccurrenceDate(expense, monthKey),
          isProjected: true,
          recurringExpenseId: expense.id,
        },
      ];
    }

    return [];
  });
}

export function sortExpensesByDate(expenses: Expense[]) {
  return [...expenses].sort((a, b) => {
    const byDate = b.date.localeCompare(a.date);
    return byDate === 0 ? a.category.localeCompare(b.category) : byDate;
  });
}

export function sumExpenses(expenses: Expense[]) {
  return expenses.reduce((total, expense) => total + expense.cost, 0);
}

export function getBaseAmount(months: BudgetMonth[], monthKey: MonthKey) {
  return months.find((month) => month.id === monthKey)?.baseAmount ?? 0;
}

export function getPreviousMonthKey(monthKey: MonthKey) {
  const month = parseMonthKey(monthKey);
  return getMonthKey(addDays(startOfMonth(month), -1));
}

export function calculateRolloverFromPreviousMonth(
  data: BudgetData,
  monthKey: MonthKey,
) {
  const monthKeys = new Set(data.months.map((month) => month.id));
  const previousMonthKey = getPreviousMonthKey(monthKey);

  if (!monthKeys.has(previousMonthKey)) {
    return 0;
  }

  return calculateMonthSummary(data, previousMonthKey).nextMonthRollover;
}

export function getDaysRemaining(monthKey: MonthKey, today = new Date()) {
  const monthDate = parseMonthKey(monthKey);
  const monthStart = startOfMonth(monthDate);
  const monthEnd = endOfMonth(monthDate);
  const todayStart = startOfMonth(today);

  if (isBefore(monthStart, todayStart)) {
    return 0;
  }

  if (isAfter(monthStart, todayStart)) {
    return differenceInCalendarDays(monthEnd, monthStart) + 1;
  }

  return differenceInCalendarDays(monthEnd, today) + 1;
}

export function calculateMonthSummary(
  data: BudgetData,
  monthKey: MonthKey,
  today = new Date(),
): MonthlySummary {
  const monthlyExpenses = getExpensesForMonth(data.expenses, monthKey);
  const baseAmount = getBaseAmount(data.months, monthKey);
  const rolloverFromPreviousMonth = calculateRolloverFromPreviousMonth(
    data,
    monthKey,
  );
  const totalAvailable = baseAmount + rolloverFromPreviousMonth;
  const totalSpent = sumExpenses(monthlyExpenses);
  const remaining = totalAvailable - totalSpent;
  const daysRemaining = getDaysRemaining(monthKey, today);

  return {
    baseAmount,
    rolloverFromPreviousMonth,
    totalAvailable,
    totalSpent,
    remaining,
    daysRemaining,
    availablePerDay: daysRemaining > 0 ? remaining / daysRemaining : 0,
    nextMonthRollover: remaining,
    isPastMonth: daysRemaining === 0 && isBefore(parseMonthKey(monthKey), startOfMonth(today)),
  };
}

export function getCalendarDays(monthKey: MonthKey) {
  const monthDate = parseMonthKey(monthKey);
  const firstCalendarDay = startOfWeek(startOfMonth(monthDate));
  const lastCalendarDay = endOfWeek(endOfMonth(monthDate));
  const days: Date[] = [];
  let cursor = firstCalendarDay;

  while (!isAfter(cursor, lastCalendarDay)) {
    days.push(cursor);
    cursor = addDays(cursor, 1);
  }

  return days;
}

export function getDailyExpenseTotal(expenses: Expense[], date: Date) {
  return sumExpenses(
    expenses.filter((expense) => isSameDay(parseISO(expense.date), date)),
  );
}

export function getWeeklyTotals(
  expenses: Expense[],
  monthKey: MonthKey,
): WeeklyTotal[] {
  const monthDate = parseMonthKey(monthKey);
  const monthStart = startOfMonth(monthDate);
  const monthEnd = endOfMonth(monthDate);
  const weeks: WeeklyTotal[] = [];
  let weekStart = startOfWeek(monthStart);
  let weekNumber = 1;

  while (!isAfter(weekStart, monthEnd)) {
    const weekEnd = endOfWeek(weekStart);
    const inMonthExpenses = expenses.filter((expense) => {
      const expenseDate = parseISO(expense.date);
      return (
        isSameMonth(expenseDate, monthDate) &&
        !isBefore(expenseDate, weekStart) &&
        !isAfter(expenseDate, weekEnd)
      );
    });

    weeks.push({
      label: `Week ${weekNumber}`,
      startDate: format(isBefore(weekStart, monthStart) ? monthStart : weekStart, inputDateFormat),
      endDate: format(isAfter(weekEnd, monthEnd) ? monthEnd : weekEnd, inputDateFormat),
      total: sumExpenses(inMonthExpenses),
    });
    weekStart = addDays(weekEnd, 1);
    weekNumber += 1;
  }

  return weeks;
}

export function getMonthlyTotalsToDate(
  data: BudgetData,
  monthKey: MonthKey,
): MonthlyTotal[] {
  const selectedYear = monthKey.slice(0, 4);

  return data.months
    .map((month) => month.id)
    .filter((id) => id.startsWith(`${selectedYear}-`) && id <= monthKey)
    .sort((a, b) => a.localeCompare(b))
    .map((id) => ({
      monthKey: id,
      total: sumExpenses(getExpensesForMonth(data.expenses, id)),
    }));
}

export function getCategoryTotals(expenses: Expense[]): CategoryTotal[] {
  const spendingOnly = expenses.filter((expense) => expense.cost > 0);
  const totalSpent = sumExpenses(spendingOnly);
  const grouped = spendingOnly.reduce<Record<string, number>>((groups, expense) => {
    groups[expense.category] = (groups[expense.category] ?? 0) + expense.cost;
    return groups;
  }, {});

  return Object.entries(grouped)
    .map(([category, total]) => ({
      category,
      total,
      percentage: totalSpent > 0 ? (total / totalSpent) * 100 : 0,
    }))
    .sort((a, b) => b.total - a.total);
}

export function getAccountTotals(expenses: Expense[]): AccountTotal[] {
  const spendingOnly = expenses.filter((expense) => expense.cost > 0);
  const totalSpent = sumExpenses(spendingOnly);
  const grouped = spendingOnly.reduce<Record<string, number>>((groups, expense) => {
    const account = expense.account ?? "Unassigned";
    groups[account] = (groups[account] ?? 0) + expense.cost;
    return groups;
  }, {});

  return Object.entries(grouped)
    .map(([account, total]) => ({
      account,
      total,
      percentage: totalSpent > 0 ? (total / totalSpent) * 100 : 0,
    }))
    .sort((a, b) => b.total - a.total);
}

export function getAnnualCategoryTotals(
  data: BudgetData,
  monthKey: MonthKey,
  mode: AnnualCategoryMode = "completed",
  today = new Date(),
): AnnualCategoryTotal[] {
  const selectedYear = monthKey.slice(0, 4);
  const currentMonthKey = getMonthKey(today);
  const yearMonthKeys = data.months
    .map((month) => month.id)
    .filter((id) => {
      if (!id.startsWith(`${selectedYear}-`)) {
        return false;
      }

      return mode === "tracked" || id < currentMonthKey;
    })
    .sort((a, b) => a.localeCompare(b));
  const monthCount = yearMonthKeys.length;

  if (monthCount === 0) {
    return [];
  }

  const grouped = yearMonthKeys
    .flatMap((yearMonthKey) => getExpensesForMonth(data.expenses, yearMonthKey))
    .filter((expense) => expense.cost > 0)
    .reduce<Record<string, number>>((groups, expense) => {
      groups[expense.category] = (groups[expense.category] ?? 0) + expense.cost;
      return groups;
    }, {});

  return Object.entries(grouped)
    .map(([category, total]) => {
      const averageMonthly = total / monthCount;

      return {
        category,
        annualizedTotal: averageMonthly * 12,
        averageMonthly,
        monthCount,
        total,
      };
    })
    .sort((a, b) => b.annualizedTotal - a.annualizedTotal);
}

export function upsertMonth(months: BudgetMonth[], updatedMonth: BudgetMonth) {
  const exists = months.some((month) => month.id === updatedMonth.id);
  const nextMonths = exists
    ? months.map((month) => (month.id === updatedMonth.id ? updatedMonth : month))
    : [...months, updatedMonth];

  return nextMonths.sort((a, b) => a.id.localeCompare(b.id));
}

export function ensureMonth(months: BudgetMonth[], monthKey: MonthKey) {
  if (months.some((month) => month.id === monthKey)) {
    return months;
  }

  return upsertMonth(months, { id: monthKey, baseAmount: 0 });
}
