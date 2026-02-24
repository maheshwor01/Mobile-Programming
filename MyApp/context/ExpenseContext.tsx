import { off, onValue, push, ref, remove, update } from 'firebase/database';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { useAuth } from '@/context/AuthContext';
import { getFirebaseDatabase } from '@/lib/firebase';
import type { Expense, ExpenseCategory, TransactionCategory } from '@/types/expense';

interface ExpenseContextValue {
  expenses: Expense[];
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  addExpense: (expense: Omit<Expense, 'id'>) => Promise<void>;
  updateExpense: (id: string, updates: Partial<Omit<Expense, 'id'>>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  clearAll: () => Promise<void>;
  getCategoryTotal: (category: ExpenseCategory) => number;
  recentExpenses: Expense[];
  isLoading: boolean;
  error: string | null;
}

const ExpenseContext = createContext<ExpenseContextValue | null>(null);

function snapshotToExpenses(snapshot: Record<string, Record<string, unknown>>): Expense[] {
  if (!snapshot) return [];
  return Object.entries(snapshot).map(([id, data]) => ({
    id,
    title: (data.title as string) ?? '',
    amount: (data.amount as number) ?? 0,
    category: (data.category as TransactionCategory) ?? 'other',
    date: (data.date as string) ?? '',
    note: (data.note as string) || undefined,
  }));
}

export function ExpenseProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const db = getFirebaseDatabase();

  useEffect(() => {
    if (!user) {
      setExpenses([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    const expensesRef = ref(db, `users/${user.uid}/expenses`);
    setError(null);

    const unsubscribe = onValue(
      expensesRef,
      (snapshot) => {
        const val = snapshot.val();
        const list = val ? snapshotToExpenses(val) : [];
        list.sort((a, b) => b.date.localeCompare(a.date));
        setExpenses(list);
        setIsLoading(false);
      },
      (err) => {
        setError(err.message ?? 'Failed to load expenses');
        setIsLoading(false);
      }
    );

    return () => off(expensesRef);
  }, [user?.uid]);

  const totalBalance = useMemo(
    () => expenses.reduce((sum, e) => sum + e.amount, 0),
    [expenses]
  );

  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const monthlyIncome = useMemo(
    () =>
      expenses
        .filter((e) => e.amount > 0 && e.date.startsWith(currentMonth))
        .reduce((sum, e) => sum + e.amount, 0),
    [expenses, currentMonth]
  );

  const monthlyExpenses = useMemo(
    () =>
      Math.abs(
        expenses
          .filter((e) => e.amount < 0 && e.date.startsWith(currentMonth))
          .reduce((sum, e) => sum + e.amount, 0)
      ),
    [expenses, currentMonth]
  );

  const addExpense = useCallback(
    async (expense: Omit<Expense, 'id'>) => {
      if (!user) throw new Error('Must be signed in to add expenses');
      setError(null);
      const expensesRef = ref(db, `users/${user.uid}/expenses`);
      try {
        await push(expensesRef, {
          title: expense.title,
          amount: expense.amount,
          category: expense.category,
          date: expense.date,
          note: expense.note ?? null,
        });
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Failed to add expense';
        setError(msg);
        throw e;
      }
    },
    [user?.uid]
  );

  const updateExpense = useCallback(
    async (id: string, updates: Partial<Omit<Expense, 'id'>>) => {
      if (!user) throw new Error('Must be signed in to update expenses');
      setError(null);
      const expenseRef = ref(db, `users/${user.uid}/expenses/${id}`);
      const payload: Record<string, unknown> = {};
      if (updates.title !== undefined) payload.title = updates.title;
      if (updates.amount !== undefined) payload.amount = updates.amount;
      if (updates.category !== undefined) payload.category = updates.category;
      if (updates.date !== undefined) payload.date = updates.date;
      if (updates.note !== undefined) payload.note = updates.note ?? null;
      try {
        await update(expenseRef, payload);
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Failed to update expense';
        setError(msg);
        throw e;
      }
    },
    [user?.uid]
  );

  const deleteExpense = useCallback(
    async (id: string) => {
      if (!user) throw new Error('Must be signed in to delete expenses');
      setError(null);
      const expenseRef = ref(db, `users/${user.uid}/expenses/${id}`);
      try {
        await remove(expenseRef);
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Failed to delete expense';
        setError(msg);
        throw e;
      }
    },
    [user?.uid]
  );

  const clearAll = useCallback(async () => {
    if (!user) throw new Error('Must be signed in to clear expenses');
    setError(null);
    const expensesRef = ref(db, `users/${user.uid}/expenses`);
    try {
      await remove(expensesRef);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to clear expenses';
      setError(msg);
      throw e;
    }
  }, [user?.uid]);

  const getCategoryTotal = useCallback(
    (category: ExpenseCategory) =>
      Math.abs(
        expenses
          .filter(
            (e) =>
              e.category === category && e.amount < 0 && e.date.startsWith(currentMonth)
          )
          .reduce((sum, e) => sum + e.amount, 0)
      ),
    [expenses, currentMonth]
  );

  const recentExpenses = useMemo(
    () => [...expenses].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5),
    [expenses]
  );

  const value = useMemo(
    () => ({
      expenses,
      totalBalance,
      monthlyIncome,
      monthlyExpenses,
      addExpense,
      updateExpense,
      deleteExpense,
      clearAll,
      getCategoryTotal,
      recentExpenses,
      isLoading,
      error,
    }),
    [
      expenses,
      totalBalance,
      monthlyIncome,
      monthlyExpenses,
      addExpense,
      updateExpense,
      deleteExpense,
      clearAll,
      getCategoryTotal,
      recentExpenses,
      isLoading,
      error,
    ]
  );

  return <ExpenseContext.Provider value={value}>{children}</ExpenseContext.Provider>;
}

export function useExpenses() {
  const ctx = useContext(ExpenseContext);
  if (!ctx) throw new Error('useExpenses must be used within ExpenseProvider');
  return ctx;
}
