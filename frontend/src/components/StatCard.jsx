import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

export const StatCard = ({ title, value, count, color = colors.primary, iconText }) => {
  return (
    <View style={[styles.card, { borderTopColor: color, borderTopWidth: 4 }]}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {iconText && (
          <View style={[styles.iconContainer, { backgroundColor: `${color}15` }]}>
            <Text style={[styles.iconText, { color }]}>{iconText}</Text>
          </View>
        )}
      </View>
      <Text style={styles.value}>{value}</Text>
      {count !== undefined && (
        <Text style={styles.countText}>{count} claim{count === 1 ? '' : 's'}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    flex: 1,
    minWidth: 160,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  iconContainer: {
    width: 28,
    height: 28,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  value: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  countText: {
    fontSize: 12,
    color: colors.textMuted,
  },
});
