import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { colors } from '../../theme/colors';
import { claimApi } from '../../api/claimApi';
import { StatusBadge } from '../../components/StatusBadge';

export const MyClaimsScreen = ({ onSelectClaim, onEditClaim, onNavigateCreateClaim }) => {
  const [claims, setClaims] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  const fetchClaims = async (currentPage = page, currentStatus = statusFilter, currentSearch = search) => {
    try {
      setLoading(true);
      setError(null);
      const params = {
        page: currentPage,
        size: 8,
        sort: 'createdAt,desc',
      };
      if (currentStatus) params.status = currentStatus;
      if (currentSearch.trim()) params.search = currentSearch.trim();

      const data = await claimApi.getClaims(params);
      setClaims(data.content || []);
      setTotalPages(data.totalPages || 1);
      setTotalElements(data.totalElements || 0);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load claims');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClaims(0, statusFilter, search);
    setPage(0);
  }, [statusFilter]);

  const handleSearchSubmit = () => {
    fetchClaims(0, statusFilter, search);
    setPage(0);
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete claim: "${title}"?`)) {
      return;
    }
    try {
      setActionLoading(id);
      await claimApi.deleteClaim(id);
      fetchClaims(page, statusFilter, search);
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to delete claim');
    } finally {
      setActionLoading(null);
    }
  };

  const handlePrevPage = () => {
    if (page > 0) {
      const nextP = page - 1;
      setPage(nextP);
      fetchClaims(nextP, statusFilter, search);
    }
  };

  const handleNextPage = () => {
    if (page < totalPages - 1) {
      const nextP = page + 1;
      setPage(nextP);
      fetchClaims(nextP, statusFilter, search);
    }
  };

  const formatCurrency = (val) => {
    const num = parseFloat(val) || 0;
    return `$${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header bar */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>My Claims</Text>
          <Text style={styles.subtitle}>
            Showing {totalElements} expense claim{totalElements === 1 ? '' : 's'}
          </Text>
        </View>
        <TouchableOpacity style={styles.newBtn} onPress={onNavigateCreateClaim}>
          <Text style={styles.newBtnText}>+ New Claim</Text>
        </TouchableOpacity>
      </View>

      {/* Filter & Search Bar */}
      <View style={styles.filterCard}>
        {/* Search */}
        <View style={styles.searchRow}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search claims by title or description..."
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={handleSearchSubmit}
          />
          <TouchableOpacity style={styles.searchBtn} onPress={handleSearchSubmit}>
            <Text style={styles.searchBtnText}>Search</Text>
          </TouchableOpacity>
        </View>

        {/* Status Pills */}
        <View style={styles.statusPillsRow}>
          <Text style={styles.filterLabel}>Status:</Text>
          {['', 'PENDING', 'APPROVED', 'REJECTED'].map((st) => (
            <TouchableOpacity
              key={st}
              style={[styles.pill, statusFilter === st && styles.pillActive]}
              onPress={() => setStatusFilter(st)}
            >
              <Text style={[styles.pillText, statusFilter === st && styles.pillTextActive]}>
                {st === '' ? 'ALL' : st}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>⚠️ {error}</Text>
        </View>
      )}

      {/* Claims List */}
      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Fetching claims...</Text>
        </View>
      ) : claims.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyIcon}>📂</Text>
          <Text style={styles.emptyTitle}>No claims match your criteria</Text>
          <Text style={styles.emptySubtitle}>Try adjusting your search terms or filters.</Text>
        </View>
      ) : (
        <View style={styles.claimsGrid}>
          {claims.map((claim) => {
            const isPending = claim.status === 'PENDING';

            return (
              <View key={claim.id} style={styles.claimCard}>
                <View style={styles.cardHeader}>
                  <View style={styles.cardHeaderLeft}>
                    <Text style={styles.claimTitle}>{claim.title}</Text>
                    <View style={styles.metaRow}>
                      <Text style={styles.claimCategory}>{claim.category}</Text>
                      <Text style={styles.bullet}>•</Text>
                      <Text style={styles.claimDate}>Expense Date: {claim.expenseDate}</Text>
                      {claim.hasReceipt && (
                        <>
                          <Text style={styles.bullet}>•</Text>
                          <Text style={styles.receiptTag}>📎 Receipt attached</Text>
                        </>
                      )}
                    </View>
                  </View>
                  <View style={styles.cardHeaderRight}>
                    <Text style={styles.amountText}>{formatCurrency(claim.amount)}</Text>
                    <StatusBadge status={claim.status} />
                  </View>
                </View>

                {claim.description ? (
                  <Text style={styles.descriptionText} numberOfLines={2}>
                    {claim.description}
                  </Text>
                ) : null}

                {claim.status === 'REJECTED' && claim.rejectionComment && (
                  <View style={styles.rejectedReasonBox}>
                    <Text style={styles.rejectedReasonLabel}>Rejection Reason:</Text>
                    <Text style={styles.rejectedReasonText}>{claim.rejectionComment}</Text>
                  </View>
                )}

                {/* Card Actions (Requirement 6 & 14) */}
                <View style={styles.cardActions}>
                  <TouchableOpacity
                    style={styles.actionBtnOutline}
                    onPress={() => onSelectClaim(claim.id)}
                  >
                    <Text style={styles.actionBtnOutlineText}>View Details & Timeline</Text>
                  </TouchableOpacity>

                  {/* Edit/Delete allowed ONLY while Pending (Requirement 6) */}
                  {isPending && (
                    <View style={styles.pendingActions}>
                      <TouchableOpacity
                        style={styles.editBtn}
                        onPress={() => onEditClaim(claim)}
                      >
                        <Text style={styles.editBtnText}>✏️ Edit</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.deleteBtn}
                        onPress={() => handleDelete(claim.id, claim.title)}
                        disabled={actionLoading === claim.id}
                      >
                        <Text style={styles.deleteBtnText}>
                          {actionLoading === claim.id ? '...' : '🗑️ Delete'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <View style={styles.paginationRow}>
          <TouchableOpacity
            style={[styles.pageBtn, page === 0 && styles.pageBtnDisabled]}
            onPress={handlePrevPage}
            disabled={page === 0}
          >
            <Text style={[styles.pageBtnText, page === 0 && styles.pageBtnTextDisabled]}>
              ← Previous
            </Text>
          </TouchableOpacity>

          <Text style={styles.pageIndicator}>
            Page {page + 1} of {totalPages}
          </Text>

          <TouchableOpacity
            style={[styles.pageBtn, page >= totalPages - 1 && styles.pageBtnDisabled]}
            onPress={handleNextPage}
            disabled={page >= totalPages - 1}
          >
            <Text style={[styles.pageBtnText, page >= totalPages - 1 && styles.pageBtnTextDisabled]}>
              Next →
            </Text>
          </TouchableOpacity>
        </View>
      )}
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
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    marginTop: 2,
  },
  newBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  newBtnText: {
    color: colors.textWhite,
    fontSize: 14,
    fontWeight: '700',
  },
  filterCard: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  searchRow: {
    flexDirection: 'row',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: colors.text,
  },
  searchBtn: {
    backgroundColor: colors.secondary,
    paddingHorizontal: 16,
    justifyContent: 'center',
    borderRadius: 8,
  },
  searchBtnText: {
    color: colors.textWhite,
    fontWeight: '600',
    fontSize: 13,
  },
  statusPillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    marginRight: 4,
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  pillTextActive: {
    color: colors.textWhite,
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
  centerBox: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: colors.textSecondary,
    fontSize: 14,
  },
  emptyCard: {
    backgroundColor: colors.surface,
    padding: 36,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyIcon: {
    fontSize: 36,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },
  emptySubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
  },
  claimsGrid: {
    gap: 12,
  },
  claimCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
    gap: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: 10,
  },
  cardHeaderLeft: {
    flex: 1,
    minWidth: 200,
  },
  claimTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  claimCategory: {
    fontSize: 12,
    color: colors.primaryDark,
    fontWeight: '600',
  },
  bullet: {
    fontSize: 10,
    color: colors.textMuted,
  },
  claimDate: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  receiptTag: {
    fontSize: 11,
    color: colors.secondary,
    fontWeight: '600',
  },
  cardHeaderRight: {
    alignItems: 'flex-end',
    gap: 6,
  },
  amountText: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  descriptionText: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  rejectedReasonBox: {
    backgroundColor: colors.dangerLight,
    padding: 10,
    borderRadius: 6,
    borderLeftWidth: 4,
    borderLeftColor: colors.danger,
  },
  rejectedReasonLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.dangerDark,
    marginBottom: 2,
  },
  rejectedReasonText: {
    fontSize: 12,
    color: colors.dangerDark,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    flexWrap: 'wrap',
    gap: 8,
  },
  actionBtnOutline: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSubtle,
  },
  actionBtnOutlineText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  pendingActions: {
    flexDirection: 'row',
    gap: 8,
  },
  editBtn: {
    backgroundColor: colors.warningLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.warning,
  },
  editBtnText: {
    color: colors.warningDark,
    fontSize: 12,
    fontWeight: '700',
  },
  deleteBtn: {
    backgroundColor: colors.dangerLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.danger,
  },
  deleteBtnText: {
    color: colors.dangerDark,
    fontSize: 12,
    fontWeight: '700',
  },
  paginationRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    gap: 16,
  },
  pageBtn: {
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pageBtnDisabled: {
    opacity: 0.4,
  },
  pageBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  pageBtnTextDisabled: {
    color: colors.textMuted,
  },
  pageIndicator: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '600',
  },
});
