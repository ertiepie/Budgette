import type { Account } from "../lib/accounts";

export type MonthKey = string;

export type BudgetMonth = {
  id: MonthKey;
  baseAmount: number;
};

export type Expense = {
  id: string;
  date: string;
  account?: Account;
  category: string;
  description: string;
  cost: number;
  isMonthly?: boolean;
  isVariableMonthly?: boolean;
  isProjected?: boolean;
  recurringExpenseId?: string;
  recurrenceEndMonth?: MonthKey;
};

export type BudgetData = {
  months: BudgetMonth[];
  expenses: Expense[];
};

export type MonthlySummary = {
  baseAmount: number;
  rolloverFromPreviousMonth: number;
  totalAvailable: number;
  totalSpent: number;
  remaining: number;
  daysRemaining: number;
  availablePerDay: number;
  nextMonthRollover: number;
  isPastMonth: boolean;
};

export type WeeklyTotal = {
  label: string;
  startDate: string;
  endDate: string;
  total: number;
};

export type MonthlyTotal = {
  monthKey: MonthKey;
  total: number;
};

export type CategoryTotal = {
  category: string;
  total: number;
  percentage: number;
};

export type AccountTotal = {
  account: string;
  total: number;
  percentage: number;
};

export type AnnualCategoryTotal = {
  category: string;
  annualizedTotal: number;
  averageMonthly: number;
  monthCount: number;
  total: number;
};

export type AnnualCategoryMode = "completed" | "tracked";
