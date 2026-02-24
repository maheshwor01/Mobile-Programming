import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AccountLogoutButton } from '@/components/account-logout-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useExpenses } from '@/context/ExpenseContext';
import { formatCurrency } from '@/lib/format-currency';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getCategoryLabel, type Expense } from '@/types/expense';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function TransactionItem({
  item,
  colorScheme,
  onPress,
}: {
  item: Expense;
  colorScheme: 'light' | 'dark' | null;
  onPress: () => void;
}) {
  const isIncome = item.amount > 0;
  const color = isIncome ? '#2E7D32' : '#C62828';
  const bg = colorScheme === 'dark' ? '#2A2A2A' : '#EEEEEE';

  return (
    <Pressable style={styles.transactionRow} onPress={onPress}>
      <View style={[styles.transactionIcon, { backgroundColor: bg }]}>
        <ThemedText style={styles.transactionIconText}>
          {item.title.charAt(0).toUpperCase()}
        </ThemedText>
      </View>
      <View style={styles.transactionContent}>
        <ThemedText style={styles.transactionTitle}>{item.title}</ThemedText>
        <ThemedText style={styles.transactionMeta}>
          {formatDate(item.date)} · {getCategoryLabel(item.category, item.amount > 0)}
        </ThemedText>
      </View>
      <ThemedText style={[styles.transactionAmount, { color }]}>
        {isIncome ? '+' : '-'}
        {formatCurrency(item.amount)}
      </ThemedText>
    </Pressable>
  );
}

export default function TransactionsScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { expenses } = useExpenses();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = useMemo(() => {
    const sorted = [...expenses].sort((a, b) => b.date.localeCompare(a.date));
    if (!searchQuery.trim()) return sorted;
    const q = searchQuery.trim().toLowerCase();
    return sorted.filter(
      (e) =>
        e.title.toLowerCase().includes(q) ||
        getCategoryLabel(e.category, e.amount > 0).toLowerCase().includes(q) ||
        e.date.includes(q) ||
        (e.note && e.note.toLowerCase().includes(q))
    );
  }, [expenses, searchQuery]);

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <ThemedText type="title" style={styles.headerTitle}>
            Transactions
          </ThemedText>
          <ThemedText style={styles.headerSubtitle}>
            {filtered.length} of {expenses.length} entries
          </ThemedText>
        </View>
        <AccountLogoutButton />
      </View>
      <View style={[styles.searchWrap, { backgroundColor: colorScheme === 'dark' ? '#1E1E1E' : '#F5F5F5' }]}>
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search by title, category, date..."
          placeholderTextColor={colors.icon}
          style={[styles.searchInput, { color: colors.text }]}
        />
      </View>
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + 24 },
        ]}
        renderItem={({ item }) => (
          <TransactionItem
            item={item}
            colorScheme={colorScheme}
            onPress={() => router.push(`/modal?id=${item.id}`)}
          />
        )}
        ItemSeparatorComponent={() => (
          <View style={styles.separator} />
        )}
        ListEmptyComponent={
          <ThemedText style={styles.empty}>
            {searchQuery.trim() ? 'No matching transactions.' : 'No transactions yet.'}
          </ThemedText>
        }
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
  },
  headerSubtitle: {
    marginTop: 4,
    opacity: 0.8,
    fontSize: 14,
  },
  searchWrap: {
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 12,
    paddingHorizontal: 14,
  },
  searchInput: {
    fontSize: 16,
    paddingVertical: 12,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  transactionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },
  transactionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  transactionIconText: {
    fontSize: 18,
    fontWeight: '600',
  },
  transactionContent: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  transactionMeta: {
    fontSize: 13,
    opacity: 0.7,
    marginTop: 2,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '600',
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(128,128,128,0.2)',
  },
  empty: {
    textAlign: 'center',
    paddingVertical: 40,
    opacity: 0.7,
  },
});
