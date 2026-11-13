import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { colors } from '../../theme/colors';
import { claimApi } from '../../api/claimApi';

const CATEGORIES = [
  'TRAVEL',
  'MEALS',
  'EQUIPMENT',
  'TRAINING',
  'MEDICAL',
  'OFFICE_SUPPLIES',
  'OTHER',
];

export const CreateEditClaimScreen = ({ claimToEdit, onDone, onCancel }) => {
  const isEditing = !!claimToEdit;

  const [title, setTitle] = useState(claimToEdit?.title || '');
  const [amount, setAmount] = useState(claimToEdit?.amount ? String(claimToEdit.amount) : '');
  const [category, setCategory] = useState(claimToEdit?.category || 'TRAVEL');
  const [expenseDate, setExpenseDate] = useState(
    claimToEdit?.expenseDate || new Date().toISOString().split('T')[0]
  );
  const [description, setDescription] = useState(claimToEdit?.description || '');
  const [receiptFile, setReceiptFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});

  const fileInputRef = useRef(null);

  const validate = () => {
    const errors = {};
    if (!title.trim() || title.trim().length < 3) {
      errors.title = 'Title must be at least 3 characters long';
    }
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      errors.amount = 'Amount must be a positive number greater than 0';
    }
    if (!category) {
      errors.category = 'Please select a category';
    }
    if (!expenseDate) {
      errors.expenseDate = 'Expense date is required';
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Requirement 10: File type and size validation
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'application/pdf'];
    if (!allowedTypes.includes(file.type.toLowerCase())) {
      setError('Invalid file type. Only JPEG, PNG, WEBP images and PDF documents are allowed.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('File size exceeds the 5MB limit.');
      return;
    }

    setError(null);
    setReceiptFile(file);
  };

  const handleSubmit = async () => {
    setError(null);
    if (!validate()) return;

    try {
      setLoading(true);
      const payload = {
        title: title.trim(),
        amount: parseFloat(amount),
        category,
        expenseDate,
        description: description.trim(),
      };

      let savedClaim;
      if (isEditing) {
        savedClaim = await claimApi.updateClaim(claimToEdit.id, payload);
      } else {
        savedClaim = await claimApi.createClaim(payload);
      }

      // If a receipt file was chosen, upload it
      if (receiptFile && savedClaim?.id) {
        await claimApi.uploadReceipt(savedClaim.id, receiptFile);
      }

      onDone(savedClaim);
    } catch (err) {
      const respData = err.response?.data;
      if (respData?.validationErrors) {
        setValidationErrors(respData.validationErrors);
      }
      setError(respData?.message || err.message || 'Operation failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{isEditing ? 'Edit Expense Claim' : 'Create Expense Claim'}</Text>
          <Text style={styles.subtitle}>
            {isEditing
              ? `Update pending claim #${claimToEdit.id}`
              : 'Enter details and attach supporting receipts for reimbursement'}
          </Text>
        </View>

        {error && (
          <View style={styles.errorAlert}>
            <Text style={styles.errorText}>⚠️ {error}</Text>
          </View>
        )}

        {/* Title */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>
            Claim Title <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={[styles.input, validationErrors.title && styles.inputError]}
            placeholder="e.g., Client Dinner at Downtown Bistro"
            value={title}
            onChangeText={setTitle}
          />
          {validationErrors.title && (
            <Text style={styles.fieldErrorText}>{validationErrors.title}</Text>
          )}
        </View>

        {/* Amount & Date Row */}
        <View style={styles.row}>
          <View style={[styles.formGroup, { flex: 1 }]}>
            <Text style={styles.label}>
              Amount ($) <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[styles.input, validationErrors.amount && styles.inputError]}
              placeholder="0.00"
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
            />
            {validationErrors.amount && (
              <Text style={styles.fieldErrorText}>{validationErrors.amount}</Text>
            )}
          </View>

          <View style={[styles.formGroup, { flex: 1 }]}>
            <Text style={styles.label}>
              Expense Date <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[styles.input, validationErrors.expenseDate && styles.inputError]}
              placeholder="YYYY-MM-DD"
              value={expenseDate}
              onChangeText={setExpenseDate}
            />
            {validationErrors.expenseDate && (
              <Text style={styles.fieldErrorText}>{validationErrors.expenseDate}</Text>
            )}
          </View>
        </View>

        {/* Category Selector */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>
            Expense Category <Text style={styles.required}>*</Text>
          </Text>
          <View style={styles.categoryPills}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[styles.catPill, category === cat && styles.catPillActive]}
                onPress={() => setCategory(cat)}
              >
                <Text style={[styles.catPillText, category === cat && styles.catPillTextActive]}>
                  {cat.replace('_', ' ')}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Description */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Description / Business Purpose</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Provide context or explanation for this business expense..."
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
          />
        </View>

        {/* Receipt Attachment (Requirement 10) */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Attach Receipt (PDF, PNG, JPG - max 5MB)</Text>
          <View style={styles.uploadBox}>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*,application/pdf"
              style={{ display: 'none' }}
            />
            <TouchableOpacity
              style={styles.chooseFileBtn}
              onPress={() => fileInputRef.current?.click()}
            >
              <Text style={styles.chooseFileBtnText}>📎 Choose Receipt File</Text>
            </TouchableOpacity>

            <Text style={styles.fileNameText}>
              {receiptFile
                ? `Selected: ${receiptFile.name} (${(receiptFile.size / 1024).toFixed(1)} KB)`
                : claimToEdit?.hasReceipt
                ? `Current file: ${claimToEdit.receiptOriginalName || 'Receipt attached'}`
                : 'No file selected'}
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={onCancel}
            disabled={loading}
          >
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.textWhite} />
            ) : (
              <Text style={styles.submitBtnText}>
                {isEditing ? 'Save Changes' : 'Submit Claim'}
              </Text>
            )}
          </TouchableOpacity>
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
    maxWidth: 760,
    width: '100%',
    alignSelf: 'center',
    padding: 20,
  },
  card: {
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
    gap: 18,
  },
  header: {
    marginBottom: 6,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
  },
  errorAlert: {
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
  formGroup: {
    gap: 6,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  required: {
    color: colors.danger,
  },
  input: {
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.text,
  },
  inputError: {
    borderColor: colors.danger,
    backgroundColor: '#fff5f5',
  },
  fieldErrorText: {
    fontSize: 11,
    color: colors.danger,
    marginTop: 2,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  categoryPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  catPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.border,
  },
  catPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  catPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  catPillTextActive: {
    color: colors.textWhite,
  },
  uploadBox: {
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
  },
  chooseFileBtn: {
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chooseFileBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  fileNameText: {
    fontSize: 12,
    color: colors.textSecondary,
    flex: 1,
    minWidth: 180,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 16,
  },
  cancelBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  submitBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 130,
    alignItems: 'center',
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    color: colors.textWhite,
    fontSize: 14,
    fontWeight: '700',
  },
});
