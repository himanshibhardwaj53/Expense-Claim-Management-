import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Modal } from 'react-native';
import { colors } from '../../theme/colors';
import { claimApi } from '../../api/claimApi';
import { StatusBadge } from '../../components/StatusBadge';

export const AllClaimsScreen = ({ onSelectClaim }) => {
  const [claims, setClaims] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState(null);

  // Review modal
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [reviewAction, setReviewAction] = useState('APPROVE');
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState(null);

  const fetchClaims = async (
    targetPage = page,
    targetStatus = statusFilter,
    targetSearch = search,
    targetStart = startDate,
    targetEnd = endDate
  ) => {
    try {
      setLoading(true);
      setError(null);
      const params = {
        page: targetPage,
        size: 10,
        sort: 'createdAt,desc',
      };
      if (targetStatus) params.status = targetStatus;
      if (targetSearch.trim()) params.search = targetSearch.trim();
      if (targetStart.trim()) params.startDate = targetStart.trim();
      if (targetEnd.trim()) params.endDate = targetEnd.trim();

      const data = await claimApi.getClaims(params);
      setClaims(data.content || []);
      setTotalPages(data.totalPages || 1);
      setTotalElements(data.totalElements || 0);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load organization claims');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClaims(0, statusFilter, search, startDate, endDate);
    setPage(0);
  }, [statusFilter]);

  const handleApplyFilters = () => {
    fetchClaims(0, statusFilter, search, startDate, endDate);
    setPage(0);
  };

  const handleResetFilters = () => {
    setStatusFilter('');
    setSearch('');
    setStartDate('');
    setEndDate('');
    fetchClaims(0, '', '', '', '');
    setPage(0);
  };

  // Requirement 20: CSV Export
  const handleExportCsv = async () => {
    try {
      setExporting(true);
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (startDate.trim()) params.startDate = startDate.trim();
      if (endDate.trim()) params.endDate = endDate.trim();

      const blob = await claimApi.exportCsv(params);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `claims_export_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('Failed to export CSV: ' + (err.message || 'Error'));
    } finally {
      setExporting(false);
    }
  };

  const openReviewModal = (claim, action) => {
    setSelectedClaim(claim);
    setReviewAction(action);
    setReviewComment('');
    setReviewError(null);
  };

  const handleReviewSubmit = async () => {
    if (!selectedClaim) return;
    setReviewError(null);

    // Requirement 9: A comment is mandatory when rejecting
    if (reviewAction === 'REJECT' && !reviewComment.trim()) {
      setReviewError('Rejection comment is mandatory when rejecting a claim.');
      return;
    }

    try {
      setReviewSubmitting(true);
      if (reviewAction === 'APPROVE') {
        await claimApi.approveClaim(selectedClaim.id, reviewComment.trim());
      } else {
        await claimApi.rejectClaim(selectedClaim.id, reviewComment.trim());
      }
      setSelectedClaim(null);
      fetchClaims(page, statusFilter, search, startDate, endDate);
    } catch (err) {
      setReviewError(err.response?.data?.message || err.message || 'Operation failed');
    } finally {
      setReviewSubmitting(false);
    }
  };

  const formatCurrency = (val) => {
    const num = parseFloat(val) || 0;
    return `$${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>All Employee Claims</Text>
          <Text style={styles.subtitle}>
            Review, approve, or reject employee expense claims ({totalElements} total)
          </Text>
        </View>

        {/* CSV Export Button (Requirement 20) */}
        <TouchableOpacity
          style={styles.exportBtn}
          onPress={handleExportCsv}
          disabled={exporting}
        >
          {exporting ? (
            <ActivityIndicator size="small" color={colors.textWhite} />
          ) : (
            <Text style={styles.exportBtnText}>📥 Export to CSV</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Filter Card (Requirement 8) */}
      <View style={styles.filterCard}>
        {/* Top search & status */}
        <View style={styles.filterRow}>
          <TextInput
            style={[styles.input, { flex: 2 }]}
            placeholder="Search by title, description or keywords..."
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={handleApplyFilters}
          />
          <View style={styles.statusPills}>
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

        {/* Date range filter */}
        <View style={styles.dateRow}>
          <View style={styles.dateCol}>
            <Text style={styles.dateLabel}>Start Date (From)</Text>
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD"
              value={startDate}
              onChangeText={setStartDate}
            />
          </View>
          <View style={styles.dateCol}>
            <Text style={styles.dateLabel}>End Date (To)</Text>
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD"
              value={endDate}
              onChangeText={setEndDate}
            />
          </View>
          <View style={styles.filterBtnGroup}>
            <TouchableOpacity style={styles.applyBtn} onPress={handleApplyFilters}>
              <Text style={styles.applyBtnText}>Filter</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.resetBtn} onPress={handleResetFilters}>
              <Text style={styles.resetBtnText}>Reset</Text>
            </TouchableOpacity>
          </View>
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
          <Text style={styles.emptyTitle}>No expense claims found</Text>
          <Text style={styles.emptySubtitle}>No records match your selected filters.</Text>
        </View>
      ) : (
        <View style={styles.claimsList}>
          {claims.map((claim) => {
            const isPending = claim.status === 'PENDING';

            return (
              <View key={claim.id} style={styles.claimCard}>
                <View style={styles.cardHeader}>
                  <View style={styles.claimMainInfo}>
                    <View style={styles.claimTagRow}>
                      <Text style={styles.claimIdText}>#{claim.id}</Text>
                      <StatusBadge status={claim.status} />
                      <Text style={styles.categoryBadge}>{claim.category?.replace('_', ' ')}</Text>
                      {claim.hasReceipt && <Text style={styles.receiptIndicator}>📎 Receipt</Text>}
                    </View>
                    <Text style={styles.claimTitleText}>{claim.title}</Text>
                    <Text style={styles.employeeInfo}>
                      By <Text style={{ fontWeight: '700' }}>{claim.employee?.name}</Text> ({claim.employee?.email}) • Expense Date: {claim.expenseDate}
                    </Text>
                  </View>

                  <View style={styles.claimAmountCol}>
                    <Text style={styles.amountText}>{formatCurrency(claim.amount)}</Text>
                  </View>
                </View>

                {claim.description ? (
                  <Text style={styles.descText} numberOfLines={2}>
                    {claim.description}
                  </Text>
                ) : null}

                {claim.status === 'REJECTED' && claim.rejectionComment && (
                  <View style={styles.rejectionBox}>
                    <Text style={styles.rejectionText}>
                      <Text style={{ fontWeight: 'bold' }}>Rejection comment: </Text>
                      {claim.rejectionComment}
                    </Text>
                  </View>
                )}

                {/* Card Action Controls (Requirement 9 & 14) */}
                <View style={styles.actionsBar}>
                  <TouchableOpacity
                    style={styles.detailBtn}
                    onPress={() => onSelectClaim(claim.id)}
                  >
                    <Text style={styles.detailBtnText}>View Details & Audit Trail →</Text>
                  </TouchableOpacity>

                  {/* Approve / Reject buttons (Manager only, while Pending) */}
                  {isPending && (
                    <View style={styles.reviewBtns}>
                      <TouchableOpacity
                        style={styles.quickApproveBtn}
                        onPress={() => openReviewModal(claim, 'APPROVE')}
                      >
                        <Text style={styles.quickApproveBtnText}>✓ Approve</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.quickRejectBtn}
                        onPress={() => openReviewModal(claim, 'REJECT')}
                      >
                        <Text style={styles.quickRejectBtnText}>✕ Reject</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <View style={styles.paginationRow}>
          <TouchableOpacity
            style={[styles.pageBtn, page === 0 && styles.pageBtnDisabled]}
            onPress={() => {
              if (page > 0) {
                setPage(page - 1);
                fetchClaims(page - 1, statusFilter, search, startDate, endDate);
              }
            }}
            disabled={page === 0}
          >
            <Text style={[styles.pageBtnText, page === 0 && styles.pageBtnTextDisabled]}>← Previous</Text>
          </TouchableOpacity>

          <Text style={styles.pageIndicator}>Page {page + 1} of {totalPages}</Text>

          <TouchableOpacity
            style={[styles.pageBtn, page >= totalPages - 1 && styles.pageBtnDisabled]}
            onPress={() => {
              if (page < totalPages - 1) {
                setPage(page + 1);
                fetchClaims(page + 1, statusFilter, search, startDate, endDate);
              }
            }}
            disabled={page >= totalPages - 1}
          >
            <Text style={[styles.pageBtnText, page >= totalPages - 1 && styles.pageBtnTextDisabled]}>Next →</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Review Modal */}
      {selectedClaim && (
        <Modal
          visible={!!selectedClaim}
          transparent
          animationType="fade"
          onRequestClose={() => setSelectedClaim(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>
                {reviewAction === 'APPROVE' ? 'Approve Claim' : 'Reject Claim'}
              </Text>
              <Text style={styles.modalSub}>
                Claim #{selectedClaim.id}: "{selectedClaim.title}" for {formatCurrency(selectedClaim.amount)}
              </Text>

              {reviewError && (
                <View style={styles.modalErrorBox}>
                  <Text style={styles.modalErrorText}>⚠️ {reviewError}</Text>
                </View>
              )}

              <View style={styles.modalInputGroup}>
                <Text style={styles.modalLabel}>
                  {reviewAction === 'REJECT'
                    ? 'Rejection Comment (Mandatory *)'
                    : 'Approval Note (Optional)'}
                </Text>
                <TextInput
                  style={[styles.input, styles.modalTextArea]}
                  placeholder={
                    reviewAction === 'REJECT'
                      ? 'Please specify reasons for rejection...'
                      : 'Optional feedback...'
                  }
                  value={reviewComment}
                  onChangeText={setReviewComment}
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={styles.modalCancelBtn}
                  onPress={() => setSelectedClaim(null)}
                  disabled={reviewSubmitting}
                >
                  <Text style={styles.modalCancelBtnText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.modalConfirmBtn,
                    reviewAction === 'APPROVE' ? styles.btnApprove : styles.btnReject,
                  ]}
                  onPress={handleReviewSubmit}
                  disabled={reviewSubmitting}
                >
                  {reviewSubmitting ? (
                    <ActivityIndicator color={colors.textWhite} />
                  ) : (
                    <Text style={styles.modalConfirmBtnText}>
                      {reviewAction === 'APPROVE' ? 'Confirm Approval' : 'Confirm Rejection'}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
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
  exportBtn: {
    backgroundColor: colors.secondary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  exportBtnText: {
    color: colors.textWhite,
    fontWeight: '700',
    fontSize: 13,
  },
  filterCard: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  input: {
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: colors.text,
  },
  statusPills: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
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
  dateRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
    flexWrap: 'wrap',
  },
  dateCol: {
    flex: 1,
    minWidth: 140,
    gap: 4,
  },
  dateLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  filterBtnGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  applyBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 8,
  },
  applyBtnText: {
    color: colors.textWhite,
    fontWeight: '600',
    fontSize: 13,
  },
  resetBtn: {
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 8,
  },
  resetBtnText: {
    color: colors.textSecondary,
    fontWeight: '600',
    fontSize: 13,
  },
  errorBox: {
    backgroundColor: colors.dangerLight,
    padding: 12,
    borderRadius: 8,
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
  claimsList: {
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
  claimMainInfo: {
    flex: 1,
    minWidth: 240,
    gap: 4,
  },
  claimTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  claimIdText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textMuted,
  },
  categoryBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primaryDark,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  receiptIndicator: {
    fontSize: 11,
    color: colors.secondary,
    fontWeight: '600',
  },
  claimTitleText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginTop: 2,
  },
  employeeInfo: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  claimAmountCol: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  descText: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  rejectionBox: {
    backgroundColor: colors.dangerLight,
    padding: 8,
    borderRadius: 6,
    borderLeftWidth: 4,
    borderLeftColor: colors.danger,
  },
  rejectionText: {
    fontSize: 12,
    color: colors.dangerDark,
  },
  actionsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    flexWrap: 'wrap',
    gap: 8,
  },
  detailBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.border,
  },
  detailBtnText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  reviewBtns: {
    flexDirection: 'row',
    gap: 8,
  },
  quickApproveBtn: {
    backgroundColor: colors.successLight,
    borderWidth: 1,
    borderColor: colors.success,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 6,
  },
  quickApproveBtnText: {
    color: colors.successDark,
    fontSize: 12,
    fontWeight: '700',
  },
  quickRejectBtn: {
    backgroundColor: colors.dangerLight,
    borderWidth: 1,
    borderColor: colors.danger,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 6,
  },
  quickRejectBtnText: {
    color: colors.dangerDark,
    fontSize: 12,
    fontWeight: '700',
  },
  paginationRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    marginTop: 8,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 24,
    maxWidth: 480,
    width: '100%',
    gap: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  modalSub: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  modalErrorBox: {
    backgroundColor: colors.dangerLight,
    padding: 10,
    borderRadius: 6,
  },
  modalErrorText: {
    fontSize: 12,
    color: colors.dangerDark,
  },
  modalInputGroup: {
    gap: 6,
  },
  modalLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  modalTextArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 8,
  },
  modalCancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalCancelBtnText: {
    color: colors.textSecondary,
    fontWeight: '600',
    fontSize: 13,
  },
  modalConfirmBtn: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 6,
  },
  btnApprove: {
    backgroundColor: colors.success,
  },
  btnReject: {
    backgroundColor: colors.danger,
  },
  modalConfirmBtnText: {
    color: colors.textWhite,
    fontWeight: '700',
    fontSize: 13,
  },
});
