import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { colors } from '../theme/colors';
import { claimApi } from '../api/claimApi';

export const ReceiptModal = ({ visible, claim, onClose }) => {
  const [blobUrl, setBlobUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (visible && claim && claim.hasReceipt) {
      setLoading(true);
      setError(null);
      claimApi
        .getReceiptBlob(claim.id)
        .then((blob) => {
          const url = URL.createObjectURL(blob);
          setBlobUrl(url);
        })
        .catch((err) => {
          setError('Failed to load receipt file: ' + (err.message || 'Unknown error'));
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
        setBlobUrl(null);
      }
    }

    return () => {
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [visible, claim?.id]);

  if (!visible || !claim) return null;

  const isPdf = claim.receiptContentType === 'application/pdf' ||
    (claim.receiptOriginalName && claim.receiptOriginalName.toLowerCase().endsWith('.pdf'));

  const handleDownload = () => {
    if (!blobUrl) return;
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = claim.receiptOriginalName || `receipt_${claim.id}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Attached Receipt</Text>
              <Text style={styles.subtitle}>{claim.receiptOriginalName || 'Receipt file'}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Content Area */}
          <View style={styles.body}>
            {loading && (
              <View style={styles.centerBox}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>Fetching receipt...</Text>
              </View>
            )}

            {error && (
              <View style={styles.centerBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {!loading && !error && blobUrl && (
              <View style={styles.previewContainer}>
                {isPdf ? (
                  <View style={styles.pdfPlaceholder}>
                    <Text style={styles.pdfIcon}>📄</Text>
                    <Text style={styles.pdfNotice}>PDF Document Ready</Text>
                    <Text style={styles.pdfSubtext}>
                      Click the download button below to inspect this document.
                    </Text>
                    <TouchableOpacity style={styles.openTabBtn} onPress={() => window.open(blobUrl, '_blank')}>
                      <Text style={styles.openTabBtnText}>Open in New Tab ↗</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <Image
                    source={{ uri: blobUrl }}
                    style={styles.imagePreview}
                    resizeMode="contain"
                  />
                )}
              </View>
            )}
          </View>

          {/* Footer Actions */}
          <View style={styles.footer}>
            {blobUrl && (
              <TouchableOpacity style={styles.downloadBtn} onPress={handleDownload}>
                <Text style={styles.downloadBtnText}>⬇ Download File</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.dismissBtn} onPress={onClose}>
              <Text style={styles.dismissBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    width: '100%',
    maxWidth: 640,
    maxHeight: '90%',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  subtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  closeBtn: {
    padding: 8,
    borderRadius: 8,
  },
  closeBtnText: {
    fontSize: 18,
    color: colors.textSecondary,
    fontWeight: 'bold',
  },
  body: {
    minHeight: 320,
    maxHeight: 460,
    justifyContent: 'center',
    backgroundColor: colors.surfaceSubtle,
  },
  previewContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  imagePreview: {
    width: '100%',
    height: 380,
  },
  pdfPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  pdfIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  pdfNotice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 6,
  },
  pdfSubtext: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
  },
  openTabBtn: {
    backgroundColor: colors.secondaryLight,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  openTabBtnText: {
    color: colors.secondary,
    fontWeight: '600',
    fontSize: 14,
  },
  centerBox: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.textSecondary,
  },
  errorText: {
    color: colors.danger,
    fontSize: 14,
    textAlign: 'center',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 12,
  },
  downloadBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  downloadBtnText: {
    color: colors.textWhite,
    fontWeight: '600',
    fontSize: 14,
  },
  dismissBtn: {
    backgroundColor: colors.surfaceSubtle,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dismissBtnText: {
    color: colors.textSecondary,
    fontWeight: '600',
    fontSize: 14,
  },
});
