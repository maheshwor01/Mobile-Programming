export type ExpenseCategory =
  | 'food'
  | 'transport'
  | 'bills'
  | 'shopping'
  | 'entertainment'
  | 'health'
  | 'other';

export type IncomeCategory =
  | 'salary'
  | 'pocket_money'
  | 'freelance'
  | 'investment'
  | 'gift'
  | 'side_hustle'
  | 'other';

export type TransactionCategory = ExpenseCategory | IncomeCategory;

export interface Expense {
  id: string;
  title: string;
  amount: number;
  category: TransactionCategory;
  date: string; // ISO date
  note?: string;
}

export interface CategorySummary {
  category: ExpenseCategory;
  label: string;
  total: number;
  color: string;
}

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'food',
  'transport',
  'bills',
  'shopping',
  'entertainment',
  'health',
  'other',
];

export const INCOME_CATEGORIES: IncomeCategory[] = [
  'salary',
  'pocket_money',
  'freelance',
  'investment',
  'gift',
  'side_hustle',
  'other',
];

export const CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  food: 'Food & Dining',
  transport: 'Transport',
  bills: 'Bills & Utilities',
  shopping: 'Shopping',
  entertainment: 'Entertainment',
  health: 'Health',
  other: 'Other',
};

export const INCOME_CATEGORY_LABELS: Record<IncomeCategory, string> = {
  salary: 'Salary',
  pocket_money: 'Pocket Money',
  freelance: 'Freelance',
  investment: 'Investment Returns',
  gift: 'Gift',
  side_hustle: 'Side Hustle',
  other: 'Other',
};

export const CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  food: '#FF6B6B',
  transport: '#4ECDC4',
  bills: '#45B7D1',
  shopping: '#96CEB4',
  entertainment: '#FFEAA7',
  health: '#DDA0DD',
  other: '#B2B2B2',
};

export const INCOME_CATEGORY_COLORS: Record<IncomeCategory, string> = {
  salary: '#2E7D32',
  pocket_money: '#388E3C',
  freelance: '#43A047',
  investment: '#66BB6A',
  gift: '#81C784',
  side_hustle: '#A5D6A7',
  other: '#B2B2B2',
};

/** Get display label for any transaction category (income or expense) */
export function getCategoryLabel(category: TransactionCategory, isIncome: boolean): string {
  if (isIncome && category in INCOME_CATEGORY_LABELS) {
    return INCOME_CATEGORY_LABELS[category as IncomeCategory];
  }
  return category in CATEGORY_LABELS ? CATEGORY_LABELS[category as ExpenseCategory] : 'Other';
}
