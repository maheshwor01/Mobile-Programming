import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useExpenses } from '@/context/ExpenseContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import {
  CATEGORY_LABELS,
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  INCOME_CATEGORY_LABELS,
  type TransactionCategory,
} from '@/types/expense';

type Params = {
  id?: string | string[];
};

export default function ExpenseFormModal() {
  const router = useRouter();
  const { id: idParam } = useLocalSearchParams<Params>();
  const id = Array.isArray(idParam) ? idParam[0] : idParam;
  const { expenses, addExpense, updateExpense, deleteExpense } = useExpenses();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const editing = Boolean(id);

  const existing = useMemo(
    () => (editing && id ? expenses.find((e) => e.id === id) : undefined),
    [editing, expenses, id],
  );

  const [title, setTitle] = useState(existing?.title ?? '');
  const [amount, setAmount] = useState(existing ? String(Math.abs(existing.amount)) : '');
  const [isIncome, setIsIncome] = useState(existing ? existing.amount > 0 : false);
  const [category, setCategory] = useState<TransactionCategory>(existing?.category ?? 'food');
  const [date, setDate] = useState(
    existing?.date ?? new Date().toISOString().slice(0, 10),
  );
  const [note, setNote] = useState(existing?.note ?? '');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (existing) {
      setTitle(existing.title);
      setAmount(String(Math.abs(existing.amount)));
      setIsIncome(existing.amount > 0);
      setCategory(existing.category);
      setDate(existing.date);
      setNote(existing.note ?? '');
    } else {
      setTitle('');
      setAmount('');
      setIsIncome(false);
      setCategory('food');
      setDate(new Date().toISOString().slice(0, 10));
      setNote('');
    }
  }, [id, existing?.id]);

  function handleTypeChange(income: boolean) {
    setIsIncome(income);
    setCategory(income ? 'salary' : 'food');
  }

  async function handleSave() {
    const numeric = Number(amount.replace(',', '.'));
    if (!title.trim()) {
      setSaveError('Please enter a title.');
      return;
    }
    if (!amount || Number.isNaN(numeric) || numeric <= 0) {
      setSaveError('Please enter a valid amount.');
      return;
    }
    setSaveError(null);
    setSaving(true);
    const signedAmount = isIncome ? Math.abs(numeric) : -Math.abs(numeric);
    try {
      if (editing && existing) {
        await updateExpense(existing.id, {
          title: title.trim(),
          amount: signedAmount,
          category,
          date,
          note: note.trim() || undefined,
        });
      } else {
        await addExpense({
          title: title.trim(),
          amount: signedAmount,
          category,
          date,
          note: note.trim() || undefined,
        });
      }
      setSaveError(null);
      router.back();
    } catch {
      setSaveError('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!editing || !existing) return;
    setSaveError(null);
    setSaving(true);
    try {
      await deleteExpense(existing.id);
      router.back();
    } catch {
      setSaveError('Failed to delete. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  const bgCard = colorScheme === 'dark' ? '#1E1E1E' : '#FFFFFF';

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.select({ ios: 'padding', android: undefined })}
    >
      <ThemedView style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <ThemedText type="title" style={styles.title}>
            {editing ? 'Edit transaction' : 'Add transaction'}
          </ThemedText>

          <View style={[styles.card, { backgroundColor: bgCard }]}>
            <ThemedText style={styles.label}>Title</ThemedText>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder={isIncome ? 'e.g. Monthly Salary' : 'e.g. Groceries'}
              placeholderTextColor={colors.icon}
              style={[styles.input, { borderColor: colors.icon, color: colors.text }]}
            />

            <View style={styles.row}>
              <View style={[styles.rowItem, { marginRight: 8 }]}>
                <ThemedText style={styles.label}>Amount</ThemedText>
                <TextInput
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="decimal-pad"
                  placeholder="0.00"
                  placeholderTextColor={colors.icon}
                  style={[styles.input, { borderColor: colors.icon, color: colors.text }]}
                />
              </View>
              <View style={[styles.rowItem, { marginLeft: 8 }]}>
                <ThemedText style={styles.label}>Type</ThemedText>
                <View style={styles.segmentRow}>
                  <SegmentButton
                    label="Expense"
                    selected={!isIncome}
                    onPress={() => handleTypeChange(false)}
                    tint={colors.tint}
                  />
                  <SegmentButton
                    label="Income"
                    selected={isIncome}
                    onPress={() => handleTypeChange(true)}
                    tint={colors.tint}
                  />
                </View>
              </View>
            </View>

            <ThemedText style={styles.label}>
              Category
              {isIncome ? ' (Income)' : ' (Expense)'}
            </ThemedText>
            <View style={styles.chipRow}>
              {isIncome
                ? INCOME_CATEGORIES.map((c) => (
                    <Chip
                      key={c}
                      label={INCOME_CATEGORY_LABELS[c]}
                      selected={category === c}
                      onPress={() => setCategory(c)}
                      tint={colors.tint}
                    />
                  ))
                : EXPENSE_CATEGORIES.map((c) => (
                    <Chip
                      key={c}
                      label={CATEGORY_LABELS[c]}
                      selected={category === c}
                      onPress={() => setCategory(c)}
                      tint={colors.tint}
                    />
                  ))}
            </View>

            <ThemedText style={styles.label}>Date</ThemedText>
            <TextInput
              value={date}
              onChangeText={setDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.icon}
              style={[styles.input, { borderColor: colors.icon, color: colors.text }]}
            />

            <ThemedText style={styles.label}>Note (optional)</ThemedText>
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="Add a note…"
              placeholderTextColor={colors.icon}
              style={[
                styles.input,
                styles.noteInput,
                { borderColor: colors.icon, color: colors.text },
              ]}
              multiline
            />
          </View>

          {saveError && (
            <ThemedText style={[styles.errorText, { color: '#C62828' }]}>{saveError}</ThemedText>
          )}
          <View style={styles.buttonsRow}>
            {editing && (
              <Pressable
                style={[styles.button, styles.deleteButton]}
                onPress={handleDelete}
                disabled={saving}
              >
                <ThemedText style={styles.deleteText}>Delete</ThemedText>
              </Pressable>
            )}
            <Pressable
              style={[
                styles.button,
                styles.primaryButton,
                { backgroundColor: colors.tint, opacity: saving ? 0.7 : 1 },
              ]}
              onPress={handleSave}
              disabled={saving}
            >
              <ThemedText style={styles.primaryText}>
                {saving ? 'Saving…' : editing ? 'Save changes' : 'Add'}
              </ThemedText>
            </Pressable>
          </View>
        </ScrollView>
      </ThemedView>
    </KeyboardAvoidingView>
  );
}

function SegmentButton({
  label,
  selected,
  onPress,
  tint,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  tint: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.segmentButton,
        {
          backgroundColor: selected ? tint : 'transparent',
          borderColor: tint,
        },
      ]}
    >
      <ThemedText
        style={[
          styles.segmentLabel,
          { color: selected ? '#FFFFFF' : undefined },
        ]}
      >
        {label}
      </ThemedText>
    </Pressable>
  );
}

function Chip({
  label,
  selected,
  onPress,
  tint,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  tint: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        {
          backgroundColor: selected ? tint : 'transparent',
          borderColor: tint,
        },
      ]}
    >
      <ThemedText
        style={[
          styles.chipLabel,
          { color: selected ? '#FFFFFF' : undefined },
        ]}
      >
        {label}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
  },
  title: {
    marginBottom: 16,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  label: {
    fontSize: 14,
    marginTop: 12,
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  noteInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    marginTop: 8,
  },
  rowItem: {
    flex: 1,
  },
  segmentRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  segmentButton: {
    flex: 1,
    borderRadius: 999,
    borderWidth: 1,
    paddingVertical: 8,
    alignItems: 'center',
  },
  segmentLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  chipLabel: {
    fontSize: 13,
  },
  errorText: {
    fontSize: 14,
    marginTop: 12,
    marginBottom: 4,
  },
  buttonsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 20,
    gap: 12,
  },
  button: {
    borderRadius: 999,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  primaryButton: {},
  primaryText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButton: {
    borderWidth: 1,
    borderColor: '#C62828',
  },
  deleteText: {
    color: '#C62828',
    fontSize: 16,
    fontWeight: '500',
  },
})
