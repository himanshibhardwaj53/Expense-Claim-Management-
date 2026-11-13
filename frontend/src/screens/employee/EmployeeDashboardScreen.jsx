import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { colors } from '../../theme/colors';
import { dashboardApi } from '../../api/dashboardApi';
import { claimApi } from '../../api/claimApi';
import { StatCard } from '../../components/StatCard';
import { StatusBadge } from '../../components/StatusBadge';
import { useAuth } from '../../context/AuthContext';

export const EmployeeDashboardScreen = ({ onNavigateCreateClaim, onNavigateClaims, onSelectClaim }) => {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState(null);
  const [recentClaims, setRecentClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const loadData = async () => {
    try {
      setError(null);
      const [dashData, claimsData] = await Promise.all([
        dashboardApi.getEmployeeDashboard(),
        claimApi.getClaims({ page: 0, size: 5, sort: 'createdAt,desc' }),
      ]);
      setMetrics(dashData);
      setRecentClaims(claimsData.content || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load dashboard data');
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
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading dashboard metrics...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Welcome Banner */}
      <View style={styles.banner}>
        <View>
          <Text style={styles.greeting}>Hello, {user?.name} 👋</Text>
          <Text style={styles.bannerSubtitle}>Here is your expense claims summary</Text>
        </View>
        <TouchableOpacity style={styles.newClaimBtn} onPress={onNavigateCreateClaim}>
          <Text style={styles.newClaimBtnText}>+ New Claim</Text>
        </TouchableOpacity>
      </View>

      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>⚠️ {error}</Text>
        </View>
      )}

      {/* Requirement 12: Employee Totals Stat Cards */}
      <View style={styles.statsGrid}>
        <StatCard
          title="Total Claimed"
          value={formatCurrency(metrics?.totalClaimedAmount)}
          count={metrics?.totalClaims}
          color={colors.primary}
          iconText="💳"
        />
        <StatCard
          title="Approved"
          value={formatCurrency(metrics?.totalApprovedAmount)}
          count={metrics?.approvedClaims}
          color={colors.success}
          iconText="✅"
        />
        <StatCard
          title="Pending"
          value={formatCurrency(metrics?.totalPendingAmount)}
          count={metrics?.pendingClaims}
          color={colors.warning}
          iconText="⏳"
        />
        <StatCard
          title="Rejected"
          value={formatCurrency(metrics?.totalRejectedAmount)}
          count={metrics?.rejectedClaims}
          color={colors.danger}
          iconText="❌"
        />
      </View>

      {/* Recent Claims Section */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Submissions</Text>
          <TouchableOpacity onPress={onNavigateClaims}>
            <Text style={styles.viewAllText}>View All Claims →</Text>
          </TouchableOpacity>
        </View>

        {recentClaims.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📂</Text>
            <Text style={styles.emptyTitle}>No expense claims yet</Text>
            <Text style={styles.emptySubtext}>Submit your first claim to get reimbursed!</Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={onNavigateCreateClaim}>
              <Text style={styles.emptyBtnText}>Create Expense Claim</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.claimsList}>
            {recentClaims.map((claim) => (
              <TouchableOpacity
                key={claim.id}
                style={styles.claimRow}
                onPress={() => onSelectClaim(claim.id)}
              >
                <View style={styles.claimLeft}>
                  <Text style={styles.claimTitle} numberOfLines={1}>{claim.title}</Text>
                  <View style={styles.claimMeta}>
                    <Text style={styles.claimDate}>Date: {claim.expenseDate}</Text>
                    <Text style={styles.bullet}>•</Text>
                    <Text style={styles.claimCategory}>{claim.category}</Text>
                    {claim.hasReceipt && (
                      <>
                        <Text style={styles.bullet}>•</Text>
                        <Text style={styles.receiptTag}>📎 Receipt</Text>
                      </>
                    )}
                  </View>
                </View>

                <View style={styles.claimRight}>
                  <Text style={styles.claimAmount}>{formatCurrency(claim.amount)}</Text>
                  <StatusBadge status={claim.status} />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
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
  centerContainer: {
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
  greeting: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
  },
  bannerSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
  },
  newClaimBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
  },
  newClaimBtnText: {
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
  sectionCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  claimsList: {
    gap: 10,
  },
  claimRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    backgroundColor: colors.surfaceSubtle,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    flexWrap: 'wrap',
    gap: 10,
  },
  claimLeft: {
    flex: 1,
    minWidth: 200,
  },
  claimTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  claimMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  claimDate: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  bullet: {
    fontSize: 10,
    color: colors.textMuted,
  },
  claimCategory: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  receiptTag: {
    fontSize: 11,
    color: colors.primaryDark,
    fontWeight: '600',
  },
  claimRight: {
    alignItems: 'flex-end',
    gap: 6,
  },
  claimAmount: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 32,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },
  emptySubtext: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
    marginBottom: 16,
  },
  emptyBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 8,
  },
  emptyBtnText: {
    color: colors.textWhite,
    fontWeight: '600',
    fontSize: 13,
  },
});
