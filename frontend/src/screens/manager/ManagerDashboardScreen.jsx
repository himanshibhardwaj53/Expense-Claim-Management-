import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { colors } from '../../theme/colors';
import { dashboardApi } from '../../api/dashboardApi';
import { StatCard } from '../../components/StatCard';
import { useAuth } from '../../context/AuthContext';

export const ManagerDashboardScreen = ({ onNavigateAllClaims, onNavigateUsers }) => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const loadData = async () => {
    try {
      setError(null);
      const res = await dashboardApi.getManagerDashboard();
      setData(res);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load manager metrics');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const formatCurrency = (val) => {
    const num = parseFloat(val) || 0;
    return `$${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  if (loading) {
    return (
      <View style={styles.centerBox}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Compiling organizational metrics...</Text>
      </View>
    );
  }

  const statusCounts = data?.statusCounts || {};
  const statusAmounts = data?.statusAmounts || {};
  const categorySummaries = data?.categorySummaries || [];
  const monthlySummaries = data?.monthlySummaries || [];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Banner */}
      <View style={styles.banner}>
        <View>
          <Text style={styles.title}>Manager Executive Dashboard 📊</Text>
          <Text style={styles.subtitle}>Overview of company-wide expense claims and approval pipeline</Text>
        </View>
        <View style={styles.bannerActions}>
          <TouchableOpacity style={styles.reviewBtn} onPress={onNavigateAllClaims}>
            <Text style={styles.reviewBtnText}>Review Claims →</Text>
          </TouchableOpacity>
        </View>
      </View>

      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>⚠️ {error}</Text>
        </View>
      )}

      {/* Requirement 12: Counts by status & Totals */}
      <View style={styles.statsGrid}>
        <StatCard
          title="Total Claims Volume"
          value={formatCurrency(data?.totalAmount)}
          count={data?.totalClaims}
          color={colors.primary}
          iconText="🏢"
        />
        <StatCard
          title="Pending Approval"
          value={formatCurrency(statusAmounts['PENDING'])}
          count={statusCounts['PENDING'] || 0}
          color={colors.warning}
          iconText="⏳"
        />
        <StatCard
          title="Approved Claims"
          value={formatCurrency(statusAmounts['APPROVED'])}
          count={statusCounts['APPROVED'] || 0}
          color={colors.success}
          iconText="✅"
        />
        <StatCard
          title="Rejected Claims"
          value={formatCurrency(statusAmounts['REJECTED'])}
          count={statusCounts['REJECTED'] || 0}
          color={colors.danger}
          iconText="❌"
        />
      </View>

      {/* Two Column Layout: Categories & Monthly Summary */}
      <View style={styles.columnsRow}>
        {/* Requirement 12: Totals by Category */}
        <View style={[styles.card, { flex: 1, minWidth: 320 }]}>
          <Text style={styles.cardTitle}>Spending by Category</Text>
          <Text style={styles.cardSub}>Expense distribution across departmental categories</Text>

          <View style={styles.categoryList}>
            {categorySummaries.map((cat) => {
              const totalAmt = parseFloat(data?.totalAmount) || 1;
              const catAmt = parseFloat(cat.totalAmount) || 0;
              const percent = Math.min(100, Math.round((catAmt / totalAmt) * 100)) || 0;

              return (
                <View key={cat.category} style={styles.catRow}>
                  <View style={styles.catHeader}>
                    <Text style={styles.catName}>{cat.categoryName.replace('_', ' ')}</Text>
                    <View style={styles.catValues}>
                      <Text style={styles.catAmount}>{formatCurrency(cat.totalAmount)}</Text>
                      <Text style={styles.catCount}>({cat.count})</Text>
                    </View>
                  </View>
                  {/* Progress track */}
                  <View style={styles.progressTrack}>
                    <View style={[styles.progressBar, { width: `${percent}%` }]} />
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Requirement 12: Monthly Summary */}
        <View style={[styles.card, { flex: 1, minWidth: 320 }]}>
          <Text style={styles.cardTitle}>Monthly Expenditure Summary</Text>
          <Text style={styles.cardSub}>Historical trend and status distribution by month</Text>

          {monthlySummaries.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>No monthly claims recorded yet.</Text>
            </View>
          ) : (
            <View style={styles.table}>
              <View style={styles.tableHeaderRow}>
                <Text style={[styles.tableTh, { flex: 1.2 }]}>Month</Text>
                <Text style={[styles.tableTh, { flex: 1 }]}>Claims</Text>
                <Text style={[styles.tableTh, { flex: 1.5, textAlign: 'right' }]}>Total</Text>
                <Text style={[styles.tableTh, { flex: 1.5, textAlign: 'right' }]}>Approved</Text>
              </View>

              {monthlySummaries.map((m) => (
                <View key={m.month} style={styles.tableRow}>
                  <Text style={[styles.tableTdBold, { flex: 1.2 }]}>{m.month}</Text>
                  <Text style={[styles.tableTd, { flex: 1 }]}>{m.count}</Text>
                  <Text style={[styles.tableTd, { flex: 1.5, textAlign: 'right', fontWeight: '700' }]}>
                    {formatCurrency(m.totalAmount)}
                  </Text>
                  <Text style={[styles.tableTdSuccess, { flex: 1.5, textAlign: 'right' }]}>
                    {formatCurrency(m.approvedAmount)}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
    padding: 20,
    gap: 20,
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    backgroundColor: colors.bg,
  },
  loadingText: {
    marginTop: 12,
    color: colors.textSecondary,
    fontSize: 14,
  },
  banner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    flexWrap: 'wrap',
    gap: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
  },
  bannerActions: {
    flexDirection: 'row',
    gap: 10,
  },
  reviewBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  reviewBtnText: {
    color: colors.textWhite,
    fontSize: 14,
    fontWeight: '700',
  },
  errorBox: {
    backgroundColor: colors.dangerLight,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fca5a5',
  },
  errorText: {
    color: colors.dangerDark,
    fontSize: 13,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  columnsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
  },
  cardSub: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
    marginBottom: 16,
  },
  categoryList: {
    gap: 14,
  },
  catRow: {
    gap: 6,
  },
  catHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  catName: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  catValues: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  catAmount: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  catCount: {
    fontSize: 11,
    color: colors.textMuted,
  },
  progressTrack: {
    height: 8,
    backgroundColor: colors.surfaceSubtle,
    borderRadius: 4,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  progressBar: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  table: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    overflow: 'hidden',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceSubtle,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tableTh: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    alignItems: 'center',
  },
  tableTd: {
    fontSize: 13,
    color: colors.text,
  },
  tableTdBold: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  tableTdSuccess: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.successDark,
  },
  emptyBox: {
    padding: 30,
    alignItems: 'center',
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 13,
  },
});
