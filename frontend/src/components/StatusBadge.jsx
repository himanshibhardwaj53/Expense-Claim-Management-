import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

export const StatusBadge = ({ status }) => {
  let bg = colors.warningLight;
  let text = colors.warningDark;
  let label = 'PENDING';

  if (status === 'APPROVED') {
    bg = colors.successLight;
    text = colors.successDark;
    label = 'APPROVED';
  } else if (status === 'REJECTED') {
    bg = colors.dangerLight;
    text = colors.dangerDark;
    label = 'REJECTED';
  }

  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <View style={[styles.dot, { backgroundColor: text }]} />
      <Text style={[styles.text, { color: text }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  text: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
