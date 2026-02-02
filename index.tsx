import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useExpenses } from '@/context/ExpenseContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import {
    CATEGORY_COLORS,
    CATEGORY_LABELS,
    type Expense,
    type ExpenseCategory,
} from '@/types/expense';

const CATEGORIES: ExpenseCategory[] = [
  'food',
  'transport',
  'bills',
  'shopping',
  'entertainment',
  'health',
  'other',
];

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(Math.abs(amount));
}

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
  const {
    totalBalance,
    monthlyIncome,
    monthlyExpenses,
    getCategoryTotal,
    recentExpenses,
  } = useExpenses();
  const router = useRouter();

  const maxCategory = Math.max(
    ...CATEGORIES.map((c) => getCategoryTotal(c)),
    1
  );

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <ThemedText type="title" style={styles.headerTitle}>
          Personal Expense Tracker
        </ThemedText>
        <ThemedText style={styles.headerSubtitle}>
          Your spending at a glance
        </ThemedText>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
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
          <ThemedText style={styles.balanceLabel}>Total Balance</ThemedText>
          <ThemedText
            style={[
              styles.balanceAmount,
              { color: totalBalance >= 0 ? '#2E7D32' : '#C62828' },
            ]}
          >
            {totalBalance >= 0 ? '+' : '-'}
            {formatCurrency(totalBalance)}
          </ThemedText>
          <View style={styles.monthlyRow}>
            <View style={styles.monthlyItem}>
              <ThemedText style={styles.monthlyLabel}>Income (month)</ThemedText>
              <ThemedText style={[styles.monthlyValue, { color: '#2E7D32' }]}>
                +{formatCurrency(monthlyIncome)}
              </ThemedText>
            </View>
            <View style={[styles.monthlyDivider, { backgroundColor: colors.icon }]} />
            <View style={styles.monthlyItem}>
              <ThemedText style={styles.monthlyLabel}>Expenses (month)</ThemedText>
              <ThemedText style={[styles.monthlyValue, { color: '#C62828' }]}>
                -{formatCurrency(monthlyExpenses)}
              </ThemedText>
            </View>
          </View>
        </ThemedView>

        {/* Spending by category */}
        <ThemedText type="subtitle" style={styles.sectionTitle}>
          Spending by category
        </ThemedText>
        <ThemedView style={styles.card}>
          {CATEGORIES.map((cat) => {
            const total = getCategoryTotal(cat);
            const pct = maxCategory > 0 ? total / maxCategory : 0;
            return (
              <View key={cat} style={styles.categoryRow}>
                <View
                  style={[
                    styles.categoryDot,
                    { backgroundColor: CATEGORY_COLORS[cat] },
                  ]}
                />
                <View style={styles.categoryContent}>
                  <View style={styles.categoryHeader}>
                    <ThemedText style={styles.categoryLabel}>
                      {CATEGORY_LABELS[cat]}
                    </ThemedText>
                    <ThemedText style={styles.categoryAmount}>
                      {formatCurrency(total)}
                    </ThemedText>
                  </View>
                  <View
                    style={[
                      styles.categoryBarBg,
                      { backgroundColor: colorScheme === 'dark' ? '#2A2A2A' : '#E0E0E0' },
                    ]}
                  >
                    <View
                      style={[
                        styles.categoryBarFill,
                        {
                          width: `${pct * 100}%`,
                          backgroundColor: CATEGORY_COLORS[cat],
                        },
                      ]}
                    />
                  </View>
                </View>
              </View>
            );
          })}
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
          {formatDate(item.date)} · {CATEGORY_LABELS[item.category]}
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
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 28,
  },
  headerSubtitle: {
    marginTop: 4,
    opacity: 0.8,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    gap: 20,
  },
  card: {
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  balanceCard: {
    paddingVertical: 24,
  },
  balanceLabel: {
    fontSize: 14,
    opacity: 0.8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: '700',
    marginTop: 4,
  },
  monthlyRow: {
    flexDirection: 'row',
    marginTop: 20,
    alignItems: 'center',
  },
  monthlyItem: {
    flex: 1,
    alignItems: 'center',
  },
  monthlyLabel: {
    fontSize: 12,
    opacity: 0.7,
  },
  monthlyValue: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 2,
  },
  monthlyDivider: {
    width: 1,
    height: 32,
    opacity: 0.3,
  },
  sectionTitle: {
    marginBottom: 4,
    fontSize: 18,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  categoryDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 12,
  },
  categoryContent: {
    flex: 1,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  categoryLabel: {
    fontSize: 14,
  },
  categoryAmount: {
    fontSize: 14,
    fontWeight: '600',
  },
  categoryBarBg: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  categoryBarFill: {
    height: '100%',
    borderRadius: 3,
    minWidth: 4,
  },
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
  transactionIconText: {
    fontSize: 16,
    fontWeight: '600',
  },
  transactionContent: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  transactionDate: {
    fontSize: 12,
    opacity: 0.7,
    marginTop: 2,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  linkText: {
    fontSize: 16,
    fontWeight: '500',
  },
});
