import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

const getActionConfig = (action) => {
  switch (action) {
    case 'CREATED':
      return { color: colors.secondary, label: 'Claim Created', icon: '📝' };
    case 'UPDATED':
      return { color: colors.warning, label: 'Claim Edited', icon: '✏️' };
    case 'DELETED':
      return { color: colors.danger, label: 'Claim Deleted', icon: '🗑️' };
    case 'APPROVED':
      return { color: colors.success, label: 'Claim Approved', icon: '✅' };
    case 'REJECTED':
      return { color: colors.danger, label: 'Claim Rejected', icon: '❌' };
    case 'RECEIPT_ATTACHED':
      return { color: colors.primary, label: 'Receipt Attached', icon: '📎' };
    default:
      return { color: colors.textSecondary, label: action, icon: '📌' };
  }
};

const formatDateTime = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const AuditTimeline = ({ logs = [] }) => {
  if (!logs || logs.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No activity recorded yet.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Audit Trail Timeline</Text>
      <View style={styles.timeline}>
        {logs.map((log, index) => {
          const config = getActionConfig(log.action);
          const isLast = index === logs.length - 1;

          return (
            <View key={log.id || index} style={styles.itemRow}>
              {/* Left timeline bar and icon */}
              <View style={styles.lineCol}>
                <View style={[styles.iconCircle, { borderColor: config.color }]}>
                  <Text style={styles.icon}>{config.icon}</Text>
                </View>
                {!isLast && <View style={styles.verticalLine} />}
              </View>

              {/* Right content card */}
              <View style={styles.contentCol}>
                <View style={styles.headerRow}>
                  <Text style={[styles.actionTitle, { color: config.color }]}>
                    {config.label}
                  </Text>
                  <Text style={styles.timestamp}>{formatDateTime(log.timestamp)}</Text>
                </View>

                <View style={styles.actorRow}>
                  <Text style={styles.actorName}>{log.performedBy}</Text>
                  {log.userRole && (
                    <View style={styles.roleTag}>
                      <Text style={styles.roleTagText}>{log.userRole.replace('ROLE_', '')}</Text>
                    </View>
                  )}
                </View>

                {log.details ? (
                  <Text style={styles.detailsText}>{log.details}</Text>
                ) : null}
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
  },
  timeline: {
    paddingLeft: 4,
  },
  itemRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  lineCol: {
    alignItems: 'center',
    marginRight: 14,
    width: 28,
  },
  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.surface,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  icon: {
    fontSize: 12,
  },
  verticalLine: {
    width: 2,
    flex: 1,
    backgroundColor: colors.border,
    marginTop: 2,
  },
  contentCol: {
    flex: 1,
    backgroundColor: colors.surfaceSubtle,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
    flexWrap: 'wrap',
    gap: 4,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  timestamp: {
    fontSize: 11,
    color: colors.textMuted,
  },
  actorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 6,
  },
  actorName: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  roleTag: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  roleTagText: {
    fontSize: 10,
    color: colors.primaryDark,
    fontWeight: '600',
  },
  detailsText: {
    fontSize: 13,
    color: colors.text,
    marginTop: 4,
    lineHeight: 18,
  },
  emptyContainer: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 14,
  },
});
