import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '../../theme/colors';

export const AccessDeniedScreen = ({ onNavigateHome }) => {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.icon}>🚫</Text>
        <Text style={styles.code}>403</Text>
        <Text style={styles.title}>Access Denied</Text>
        <Text style={styles.message}>
          You do not have sufficient permissions to view or perform operations on this resource.
          Access rules are strictly enforced for your role.
        </Text>
        <TouchableOpacity style={styles.homeBtn} onPress={onNavigateHome}>
          <Text style={styles.homeBtnText}>Return to Dashboard</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: colors.bg,
  },
  card: {
    backgroundColor: colors.surface,
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
    maxWidth: 440,
    width: '100%',
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
  icon: {
    fontSize: 48,
    marginBottom: 8,
  },
  code: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.danger,
    letterSpacing: 2,
    marginBottom: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  homeBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  homeBtnText: {
    color: colors.textWhite,
    fontWeight: '600',
    fontSize: 14,
  },
});
