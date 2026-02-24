import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AccountLogoutButton } from '@/components/account-logout-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useExpenses } from '@/context/ExpenseContext';
import { formatCurrency } from '@/lib/format-currency';
import {
  getPeriodDateRange,
  isDateInRange,
  PERIOD_LABELS,
  type PeriodType,
} from '@/lib/period-utils';
import { useColorScheme } from '@/hooks/use-color-scheme';
import {
  CATEGORY_COLORS,
  CATEGORY_LABELS,
  EXPENSE_CATEGORIES,
  getCategoryLabel,
  INCOME_CATEGORIES,
  INCOME_CATEGORY_COLORS,
  INCOME_CATEGORY_LABELS,
  type Expense,
  type ExpenseCategory,
  type IncomeCategory,
} from '@/types/expense';

const PERIODS: PeriodType[] = ['week', 'month', 'quarter', 'semi', 'year'];

function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  if (diff < 7) return `${diff} days ago`;
  return d.toLocaleDateString();
}

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { expenses, isLoading } = useExpenses();
  const router = useRouter();
  const [period, setPeriod] = useState<PeriodType>('month');

  const { start, end } = useMemo(() => getPeriodDateRange(period), [period]);

  const filtered = useMemo(
    () => expenses.filter((e) => isDateInRange(e.date, start, end)),
    [expenses, start, end]
  );

  const periodIncome = useMemo(
    () => filtered.filter((e) => e.amount > 0).reduce((sum, e) => sum + e.amount, 0),
    [filtered]
  );

  const periodExpenses = useMemo(
    () =>
      Math.abs(
        filtered
          .filter((e) => e.amount < 0)
          .reduce((sum, e) => sum + e.amount, 0)
      ),
    [filtered]
  );

  const netSavings = periodIncome - periodExpenses;

  const incomeByCategory = useMemo(() => {
    const map: Partial<Record<IncomeCategory, number>> = {};
    filtered
      .filter((e) => e.amount > 0)
      .forEach((e) => {
        const cat = INCOME_CATEGORIES.includes(e.category as IncomeCategory)
          ? (e.category as IncomeCategory)
          : 'other';
        map[cat] = (map[cat] ?? 0) + e.amount;
      });
    return INCOME_CATEGORIES.map((c) => ({
      category: c,
      total: map[c] ?? 0,
      label: INCOME_CATEGORY_LABELS[c],
      color: INCOME_CATEGORY_COLORS[c],
    })).filter((x) => x.total > 0);
  }, [filtered]);

  const expenseByCategory = useMemo(() => {
    const map: Partial<Record<ExpenseCategory, number>> = {};
    filtered
      .filter((e) => e.amount < 0)
      .forEach((e) => {
        const cat = EXPENSE_CATEGORIES.includes(e.category as ExpenseCategory)
          ? (e.category as ExpenseCategory)
          : 'other';
        map[cat] = (map[cat] ?? 0) + Math.abs(e.amount);
      });
    return EXPENSE_CATEGORIES.map((c) => ({
      category: c,
      total: map[c] ?? 0,
      label: CATEGORY_LABELS[c],
      color: CATEGORY_COLORS[c],
    })).filter((x) => x.total > 0);
  }, [filtered]);

  const topIncomeCategory = useMemo(
    () =>
      incomeByCategory.length > 0
        ? incomeByCategory.reduce((a, b) => (a.total >= b.total ? a : b))
        : null,
    [incomeByCategory]
  );

  const topExpenseCategory = useMemo(
    () =>
      expenseByCategory.length > 0
        ? expenseByCategory.reduce((a, b) => (a.total >= b.total ? a : b))
        : null,
    [expenseByCategory]
  );

  const maxIncome = Math.max(...incomeByCategory.map((x) => x.total), 1);
  const maxExpense = Math.max(...expenseByCategory.map((x) => x.total), 1);

  const recentExpenses = useMemo(
    () => [...filtered].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5),
    [filtered]
  );

  if (isLoading) {
    return (
      <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
        <View style={[styles.header, styles.headerLoading]}>
          <ThemedText type="title" style={styles.headerTitle}>
            Personal Expense Tracker
          </ThemedText>
          <AccountLogoutButton />
        </View>
        <View style={[styles.centered, { flex: 1 }]}>
          <ActivityIndicator size="large" color={colors.tint} />
          <ThemedText style={styles.loadingText}>Loading…</ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <ThemedText type="title" style={styles.headerTitle}>
            Dashboard
          </ThemedText>
          <ThemedText style={styles.headerSubtitle}>
            {PERIOD_LABELS[period]} overview
          </ThemedText>
        </View>
        <AccountLogoutButton />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 88 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Period filter */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.periodRow}
        >
          {PERIODS.map((p) => (
            <Pressable
              key={p}
              onPress={() => setPeriod(p)}
              style={[
                styles.periodChip,
                {
                  backgroundColor:
                    period === p ? colors.tint : colorScheme === 'dark' ? '#2A2A2A' : '#F0F0F0',
                },
              ]}
            >
              <ThemedText
                style={[
                  styles.periodChipText,
                  { color: period === p ? '#FFFFFF' : undefined },
                ]}
              >
                {PERIOD_LABELS[p]}
              </ThemedText>
            </Pressable>
          ))}
        </ScrollView>

        {/* Balance card */}
        <ThemedView
          style={[
            styles.card,
            styles.balanceCard,
            {
              backgroundColor: colorScheme === 'dark' ? '#1E2A2E' : '#E8F4F8',
            },
          ]}
        >
          <ThemedText style={styles.balanceLabel}>Net ({PERIOD_LABELS[period]})</ThemedText>
          <ThemedText
            style={[
              styles.balanceAmount,
              { color: netSavings >= 0 ? '#2E7D32' : '#C62828' },
            ]}
          >
            {netSavings >= 0 ? '+' : '-'}
            {formatCurrency(netSavings)}
          </ThemedText>
          <View style={styles.monthlyRow}>
            <View style={styles.monthlyItem}>
              <ThemedText style={styles.monthlyLabel}>Income</ThemedText>
              <ThemedText style={[styles.monthlyValue, { color: '#2E7D32' }]}>
                +{formatCurrency(periodIncome)}
              </ThemedText>
            </View>
            <View style={[styles.monthlyDivider, { backgroundColor: colors.icon }]} />
            <View style={styles.monthlyItem}>
              <ThemedText style={styles.monthlyLabel}>Expenses</ThemedText>
              <ThemedText style={[styles.monthlyValue, { color: '#C62828' }]}>
                -{formatCurrency(periodExpenses)}
              </ThemedText>
            </View>
          </View>
        </ThemedView>

        {/* Summary cards */}
        <View style={styles.summaryRow}>
          <ThemedView
            style={[
              styles.summaryCard,
              { backgroundColor: colorScheme === 'dark' ? '#1E2A2E' : '#F5F5F5' },
            ]}
          >
            <ThemedText style={styles.summaryLabel}>Top Income</ThemedText>
            <ThemedText style={styles.summaryValue} numberOfLines={1}>
              {topIncomeCategory?.label ?? '—'}
            </ThemedText>
            <ThemedText style={[styles.summaryAmount, { color: '#2E7D32' }]}>
              {topIncomeCategory ? formatCurrency(topIncomeCategory.total) : '—'}
            </ThemedText>
          </ThemedView>
          <ThemedView
            style={[
              styles.summaryCard,
              { backgroundColor: colorScheme === 'dark' ? '#1E2A2E' : '#F5F5F5' },
            ]}
          >
            <ThemedText style={styles.summaryLabel}>Top Spending</ThemedText>
            <ThemedText style={styles.summaryValue} numberOfLines={1}>
              {topExpenseCategory?.label ?? '—'}
            </ThemedText>
            <ThemedText style={[styles.summaryAmount, { color: '#C62828' }]}>
              {topExpenseCategory ? formatCurrency(topExpenseCategory.total) : '—'}
            </ThemedText>
          </ThemedView>
        </View>

        {/* Income by category bar chart */}
        <ThemedText type="subtitle" style={styles.sectionTitle}>
          Income by category
        </ThemedText>
        <ThemedView style={styles.card}>
          {incomeByCategory.length === 0 ? (
            <ThemedText style={styles.emptyChart}>No income in this period</ThemedText>
          ) : (
            incomeByCategory.map((item) => (
              <View key={item.category} style={styles.barRow}>
                <ThemedText style={styles.barLabel} numberOfLines={1}>
                  {item.label}
                </ThemedText>
                <View
                  style={[
                    styles.barTrack,
                    { backgroundColor: colorScheme === 'dark' ? '#2A2A2A' : '#E0E0E0' },
                  ]}
                >
                  <View
                    style={[
                      styles.barFill,
                      {
                        width: `${(item.total / maxIncome) * 100}%`,
                        backgroundColor: item.color,
                      },
                    ]}
                  />
                </View>
                <ThemedText style={styles.barValue}>{formatCurrency(item.total)}</ThemedText>
              </View>
            ))
          )}
        </ThemedView>

        {/* Expense by category bar chart */}
        <ThemedText type="subtitle" style={styles.sectionTitle}>
          Expenses by category
        </ThemedText>
        <ThemedView style={styles.card}>
          {expenseByCategory.length === 0 ? (
            <ThemedText style={styles.emptyChart}>No expenses in this period</ThemedText>
          ) : (
            expenseByCategory.map((item) => (
              <View key={item.category} style={styles.barRow}>
                <ThemedText style={styles.barLabel} numberOfLines={1}>
                  {item.label}
                </ThemedText>
                <View
                  style={[
                    styles.barTrack,
                    { backgroundColor: colorScheme === 'dark' ? '#2A2A2A' : '#E0E0E0' },
                  ]}
                >
                  <View
                    style={[
                      styles.barFill,
                      {
                        width: `${(item.total / maxExpense) * 100}%`,
                        backgroundColor: item.color,
                      },
                    ]}
                  />
                </View>
                <ThemedText style={styles.barValue}>{formatCurrency(item.total)}</ThemedText>
              </View>
            ))
          )}
        </ThemedView>

        {/* Recent transactions */}
        <ThemedText type="subtitle" style={styles.sectionTitle}>
          Recent transactions
        </ThemedText>
        <ThemedView style={styles.card}>
          {recentExpenses.map((item) => (
            <TransactionRow key={item.id} item={item} />
          ))}
        </ThemedView>

        <View style={styles.footer}>
          <ThemedText
            style={[styles.linkText, { color: colors.tint }]}
            onPress={() => router.push('/(tabs)/explore')}
          >
            View all transactions →
          </ThemedText>
        </View>
      </ScrollView>

      <Pressable
        style={[styles.fab, { backgroundColor: colors.tint }]}
        onPress={() => router.push('/modal')}
      >
        <ThemedText style={styles.fabText}>＋</ThemedText>
      </Pressable>
    </ThemedView>
  );
}

function TransactionRow({ item }: { item: Expense }) {
  const colorScheme = useColorScheme();
  const isIncome = item.amount > 0;
  const color = isIncome ? '#2E7D32' : '#C62828';

  return (
    <View style={styles.transactionRow}>
      <View
        style={[
          styles.transactionIcon,
          {
            backgroundColor: (colorScheme === 'dark' ? '#2A2A2A' : '#EEEEEE') as string,
          },
        ]}
      >
        <ThemedText style={styles.transactionIconText}>
          {item.title.charAt(0).toUpperCase()}
        </ThemedText>
      </View>
      <View style={styles.transactionContent}>
        <ThemedText style={styles.transactionTitle}>{item.title}</ThemedText>
        <ThemedText style={styles.transactionDate}>
          {formatDate(item.date)} · {getCategoryLabel(item.category, item.amount > 0)}
        </ThemedText>
      </View>
      <ThemedText style={[styles.transactionAmount, { color }]}>
        {isIncome ? '+' : '-'}
        {formatCurrency(item.amount)}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, opacity: 0.8 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerLeft: { flex: 1 },
  headerLoading: { paddingBottom: 8 },
  headerTitle: { fontSize: 28 },
  headerSubtitle: { marginTop: 4, opacity: 0.8 },
  periodRow: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 16,
    paddingHorizontal: 4,
  },
  periodChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  periodChipText: { fontSize: 14, fontWeight: '500' },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 8, gap: 20 },
  card: {
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  balanceCard: { paddingVertical: 24 },
  balanceLabel: {
    fontSize: 14,
    opacity: 0.8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  balanceAmount: { fontSize: 32, fontWeight: '700', marginTop: 4 },
  monthlyRow: { flexDirection: 'row', marginTop: 20, alignItems: 'center' },
  monthlyItem: { flex: 1, alignItems: 'center' },
  monthlyLabel: { fontSize: 12, opacity: 0.7 },
  monthlyValue: { fontSize: 16, fontWeight: '600', marginTop: 2 },
  monthlyDivider: { width: 1, height: 32, opacity: 0.3 },
  summaryRow: { flexDirection: 'row', gap: 12 },
  summaryCard: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
  },
  summaryLabel: { fontSize: 12, opacity: 0.7 },
  summaryValue: { fontSize: 14, fontWeight: '600', marginTop: 4 },
  summaryAmount: { fontSize: 16, fontWeight: '700', marginTop: 2 },
  sectionTitle: { marginBottom: 4, fontSize: 18 },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  barLabel: { width: 100, fontSize: 13 },
  barTrack: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginHorizontal: 8,
  },
  barFill: { height: '100%', borderRadius: 4 },
  barValue: { fontSize: 13, fontWeight: '600', width: 70, textAlign: 'right' },
  emptyChart: { textAlign: 'center', opacity: 0.7, paddingVertical: 16 },
  transactionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(128,128,128,0.2)',
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  transactionIconText: { fontSize: 16, fontWeight: '600' },
  transactionContent: { flex: 1 },
  transactionTitle: { fontSize: 16, fontWeight: '500' },
  transactionDate: { fontSize: 12, opacity: 0.7, marginTop: 2 },
  transactionAmount: { fontSize: 16, fontWeight: '600' },
  footer: { alignItems: 'center', paddingVertical: 16 },
  linkText: { fontSize: 16, fontWeight: '500' },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 32,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  fabText: { fontSize: 28, color: '#FFFFFF', marginTop: -2 },
});
