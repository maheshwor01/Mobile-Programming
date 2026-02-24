import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useColorScheme } from '@/hooks/use-color-scheme';

export function AccountLogoutButton() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { signOut } = useAuth();
  const router = useRouter();
  const [visible, setVisible] = useState(false);

  const bgSheet = colorScheme === 'dark' ? '#1E1E1E' : '#FFFFFF';
  const bgOverlay = 'rgba(0,0,0,0.5)';

  function openMenu() {
    setVisible(true);
  }

  function closeMenu() {
    setVisible(false);
  }

  function handleLogout() {
    closeMenu();
    signOut().then(() => router.replace('/(auth)/login'));
  }

  return (
    <>
      <TouchableOpacity
        onPress={openMenu}
        style={styles.button}
        hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
        activeOpacity={0.6}
        accessibilityLabel="Account"
        accessibilityHint="Opens account menu"
      >
        <IconSymbol name="person.circle.fill" size={28} color={colors.tint} />
      </TouchableOpacity>

      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={closeMenu}
      >
        <Pressable style={[styles.overlay, { backgroundColor: bgOverlay }]} onPress={closeMenu}>
          <Pressable
            style={[styles.sheet, { backgroundColor: bgSheet }]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={[styles.handle, { backgroundColor: colors.icon }]} />
            <ThemedText style={styles.sheetTitle}>Account</ThemedText>

            <Pressable
              style={[styles.option, styles.optionDestructive]}
              onPress={handleLogout}
              android_ripple={{ color: 'rgba(198,40,40,0.2)' }}
            >
              <ThemedText style={styles.logoutText}>Log out</ThemedText>
            </Pressable>

            <Pressable
              style={[styles.option, styles.optionCancel]}
              onPress={closeMenu}
              android_ripple={{ color: 'rgba(0,0,0,0.05)' }}
            >
              <ThemedText style={styles.cancelText}>Cancel</ThemedText>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    padding: 8,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 34,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
    opacity: 0.4,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    opacity: 0.8,
  },
  option: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  optionDestructive: {
    backgroundColor: 'rgba(198,40,40,0.1)',
  },
  optionCancel: {
    backgroundColor: 'rgba(128,128,128,0.1)',
  },
  logoutText: {
    color: '#C62828',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '500',
  },
});
