import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, TextInput, Modal } from 'react-native';
import { colors } from '../../theme/colors';
import { claimApi } from '../../api/claimApi';
import { StatusBadge } from '../../components/StatusBadge';
import { AuditTimeline } from '../../components/AuditTimeline';
import { ReceiptModal } from '../../components/ReceiptModal';
import { useAuth } from '../../context/AuthContext';

export const ClaimDetailScreen = ({ claimId, onBack, onEdit }) => {
  const { user, isManager, isEmployee } = useAuth();

  const [claim, setClaim] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Receipt Modal state
  const [receiptVisible, setReceiptVisible] = useState(false);

  // Review Modal state (Approve / Reject)
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [reviewAction, setReviewAction] = useState('APPROVE'); // 'APPROVE' or 'REJECT'
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState(null);

  const loadClaimData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [claimData, logsData] = await Promise.all([
        claimApi.getClaimById(claimId),
        claimApi.getAuditLogs(claimId),
      ]);
      setClaim(claimData);
      setAuditLogs(logsData || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load claim details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClaimData();
  }, [claimId]);

  const handleOpenReview = (action) => {
    setReviewAction(action);
    setReviewComment('');
    setReviewError(null);
    setReviewModalVisible(true);
  };

  const handleReviewSubmit = async () => {
    setReviewError(null);
    // Requirement 9: A comment is mandatory when rejecting
    if (reviewAction === 'REJECT' && !reviewComment.trim()) {
      setReviewError('Rejection comment is mandatory when rejecting a claim.');
      return;
    }

    try {
      setReviewSubmitting(true);
      if (reviewAction === 'APPROVE') {
        await claimApi.approveClaim(claim.id, reviewComment.trim());
      } else {
        await claimApi.rejectClaim(claim.id, reviewComment.trim());
      }
      setReviewModalVisible(false);
      loadClaimData();
    } catch (err) {
      setReviewError(err.response?.data?.message || err.message || 'Failed to review claim');
    } finally {
      setReviewSubmitting(false);
    }
  };

  const formatCurrency = (val) => {
    const num = parseFloat(val) || 0;
    return `$${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  if (loading) {
    return (
      <View style={styles.centerBox}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading claim details...</Text>
      </View>
    );
  }

  if (error || !claim) {
    return (
      <View style={styles.centerBox}>
        <Text style={styles.errorText}>⚠️ {error || 'Claim not found'}</Text>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Text style={styles.backBtnText}>← Back to Claims</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isPending = claim.status === 'PENDING';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Back button bar */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backLink} onPress={onBack}>
          <Text style={styles.backLinkText}>← Back to list</Text>
        </TouchableOpacity>
        <View style={styles.topRight}>
          {isEmployee && isPending && (
            <TouchableOpacity style={styles.editBtn} onPress={() => onEdit(claim)}>
              <Text style={styles.editBtnText}>✏️ Edit Claim</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Main Claim Detail Card */}
      <View style={styles.mainCard}>
        <View style={styles.cardHeader}>
          <View style={styles.titleCol}>
            <View style={styles.claimNumberRow}>
              <Text style={styles.claimNumber}>CLAIM #{claim.id}</Text>
              <StatusBadge status={claim.status} />
            </View>
            <Text style={styles.claimTitle}>{claim.title}</Text>
          </View>
          <View style={styles.amountCol}>
            <Text style={styles.amountLabel}>Claim Amount</Text>
            <Text style={styles.amountValue}>{formatCurrency(claim.amount)}</Text>
          </View>
        </View>

        {/* Info Grid */}
        <View style={styles.infoGrid}>
          <View style={styles.infoCol}>
            <Text style={styles.infoLabel}>Category</Text>
            <Text style={styles.infoValue}>{claim.category?.replace('_', ' ')}</Text>
          </View>

          <View style={styles.infoCol}>
            <Text style={styles.infoLabel}>Expense Date</Text>
            <Text style={styles.infoValue}>{claim.expenseDate}</Text>
          </View>

          <View style={styles.infoCol}>
            <Text style={styles.infoLabel}>Submitted By</Text>
            <Text style={styles.infoValue}>{claim.employee?.name || 'N/A'}</Text>
            <Text style={styles.infoSubtext}>{claim.employee?.email}</Text>
          </View>

          <View style={styles.infoCol}>
            <Text style={styles.infoLabel}>Submission Date</Text>
            <Text style={styles.infoValue}>
              {claim.createdAt ? new Date(claim.createdAt).toLocaleDateString() : 'N/A'}
            </Text>
          </View>
        </View>

        {/* Description */}
        {claim.description ? (
          <View style={styles.sectionBlock}>
            <Text style={styles.sectionHeading}>Description</Text>
            <Text style={styles.descriptionText}>{claim.description}</Text>
          </View>
        ) : null}

        {/* Review Outcome (if Approved or Rejected) */}
        {claim.status !== 'PENDING' && (
          <View
            style={[
              styles.reviewOutcomeCard,
              claim.status === 'APPROVED' ? styles.outcomeApproved : styles.outcomeRejected,
            ]}
          >
            <Text style={styles.outcomeHeading}>
              {claim.status === 'APPROVED' ? '✅ Claim Approved' : '❌ Claim Rejected'}
            </Text>
            <Text style={styles.outcomeMeta}>
              Reviewed by <Text style={{ fontWeight: 'bold' }}>{claim.reviewedBy?.name || 'Manager'}</Text> on{' '}
              {claim.reviewedAt ? new Date(claim.reviewedAt).toLocaleString() : 'N/A'}
            </Text>
            {claim.rejectionComment && (
              <View style={styles.rejectionCommentBox}>
                <Text style={styles.rejectionCommentLabel}>Reason / Feedback:</Text>
                <Text style={styles.rejectionCommentText}>{claim.rejectionComment}</Text>
              </View>
            )}
          </View>
        )}

        {/* Receipt Attachment Row (Requirement 10) */}
        <View style={styles.receiptSection}>
          <View style={styles.receiptHeader}>
            <Text style={styles.sectionHeading}>Supporting Document / Receipt</Text>
            {claim.hasReceipt ? (
              <TouchableOpacity
                style={styles.viewReceiptBtn}
                onPress={() => setReceiptVisible(true)}
              >
                <Text style={styles.viewReceiptBtnText}>👁️ View / Download Receipt</Text>
              </TouchableOpacity>
            ) : (
              <Text style={styles.noReceiptText}>No receipt attached</Text>
            )}
          </View>
          {claim.hasReceipt && (
            <Text style={styles.receiptFileName}>
              📎 {claim.receiptOriginalName} ({Math.round(claim.receiptFileSize / 1024)} KB)
            </Text>
          )}
        </View>

        {/* Manager Review Action Bar (Requirement 9) */}
        {isManager && isPending && (
          <View style={styles.managerActionBox}>
            <View>
              <Text style={styles.managerActionTitle}>Manager Review Required</Text>
              <Text style={styles.managerActionSub}>
                Approve this claim for reimbursement or reject with mandatory feedback.
              </Text>
            </View>
            <View style={styles.managerActionButtons}>
              <TouchableOpacity
                style={styles.approveBtn}
                onPress={() => handleOpenReview('APPROVE')}
              >
                <Text style={styles.approveBtnText}>✓ Approve Claim</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.rejectBtn}
                onPress={() => handleOpenReview('REJECT')}
              >
                <Text style={styles.rejectBtnText}>✕ Reject Claim</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      {/* Requirement 11: Audit Timeline */}
      <AuditTimeline logs={auditLogs} />

      {/* Receipt Viewer Modal */}
      <ReceiptModal
        visible={receiptVisible}
        claim={claim}
        onClose={() => setReceiptVisible(false)}
      />

      {/* Manager Review Modal */}
      <Modal
        visible={reviewModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setReviewModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.reviewModalCard}>
            <Text style={styles.modalTitle}>
              {reviewAction === 'APPROVE' ? 'Approve Expense Claim' : 'Reject Expense Claim'}
            </Text>
            <Text style={styles.modalSub}>
              Claim #{claim.id} • {claim.title} ({formatCurrency(claim.amount)})
            </Text>

            {reviewError && (
              <View style={styles.modalErrorBox}>
                <Text style={styles.modalErrorText}>⚠️ {reviewError}</Text>
              </View>
            )}

            <View style={styles.modalInputGroup}>
              <Text style={styles.modalLabel}>
                {reviewAction === 'REJECT' ? 'Rejection Reason (Mandatory *)' : 'Approval Note (Optional)'}
              </Text>
              <TextInput
                style={[styles.input, styles.modalTextArea]}
                placeholder={
                  reviewAction === 'REJECT'
                    ? 'State clearly why this claim is rejected...'
                    : 'Add optional message or comments...'
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
                onPress={() => setReviewModalVisible(false)}
                disabled={reviewSubmitting}
              >
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalConfirmBtn,
                  reviewAction === 'APPROVE' ? styles.confirmApprove : styles.confirmReject,
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
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    maxWidth: 900,
    width: '100%',
    alignSelf: 'center',
    padding: 20,
    gap: 16,
  },
  centerBox: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: colors.textSecondary,
    fontSize: 14,
  },
  errorText: {
    color: colors.danger,
    fontSize: 15,
    marginBottom: 16,
  },
  backBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  backBtnText: {
    color: colors.textWhite,
    fontWeight: '600',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backLink: {
    paddingVertical: 6,
  },
  backLinkText: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 14,
  },
  topRight: {
    flexDirection: 'row',
    gap: 8,
  },
  editBtn: {
    backgroundColor: colors.warningLight,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.warning,
  },
  editBtnText: {
    color: colors.warningDark,
    fontSize: 13,
    fontWeight: '700',
  },
  mainCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    gap: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: 16,
    flexWrap: 'wrap',
    gap: 12,
  },
  titleCol: {
    flex: 1,
    minWidth: 240,
  },
  claimNumberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 6,
  },
  claimNumber: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textSecondary,
    letterSpacing: 0.5,
  },
  claimTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
  },
  amountCol: {
    alignItems: 'flex-end',
  },
  amountLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  amountValue: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.primary,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    backgroundColor: colors.surfaceSubtle,
    padding: 16,
    borderRadius: 12,
  },
  infoCol: {
    flex: 1,
    minWidth: 150,
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  infoSubtext: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  sectionBlock: {
    gap: 6,
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  descriptionText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  reviewOutcomeCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  outcomeApproved: {
    backgroundColor: colors.successLight,
    borderColor: '#a7f3d0',
  },
  outcomeRejected: {
    backgroundColor: colors.dangerLight,
    borderColor: '#fca5a5',
  },
  outcomeHeading: {
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.text,
  },
  outcomeMeta: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  rejectionCommentBox: {
    marginTop: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#fca5a5',
  },
  rejectionCommentLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.dangerDark,
  },
  rejectionCommentText: {
    fontSize: 13,
    color: colors.dangerDark,
    marginTop: 2,
  },
  receiptSection: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    gap: 8,
  },
  receiptHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  viewReceiptBtn: {
    backgroundColor: colors.secondaryLight,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 6,
  },
  viewReceiptBtnText: {
    color: colors.secondary,
    fontWeight: '700',
    fontSize: 13,
  },
  noReceiptText: {
    fontSize: 13,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  receiptFileName: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  managerActionBox: {
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fde68a',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
  },
  managerActionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.warningDark,
  },
  managerActionSub: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  managerActionButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  approveBtn: {
    backgroundColor: colors.success,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  approveBtnText: {
    color: colors.textWhite,
    fontSize: 13,
    fontWeight: '700',
  },
  rejectBtn: {
    backgroundColor: colors.danger,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  rejectBtnText: {
    color: colors.textWhite,
    fontSize: 13,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  reviewModalCard: {
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
  confirmApprove: {
    backgroundColor: colors.success,
  },
  confirmReject: {
    backgroundColor: colors.danger,
  },
  modalConfirmBtnText: {
    color: colors.textWhite,
    fontWeight: '700',
    fontSize: 13,
  },
});
