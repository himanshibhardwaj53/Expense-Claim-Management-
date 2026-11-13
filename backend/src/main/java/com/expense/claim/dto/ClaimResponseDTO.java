package com.expense.claim.dto;

import com.expense.claim.entity.Claim;
import com.expense.claim.entity.ClaimCategory;
import com.expense.claim.entity.ClaimStatus;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public class ClaimResponseDTO {
    private Long id;
    private String title;
    private BigDecimal amount;
    private ClaimCategory category;
    private LocalDate expenseDate;
    private String description;
    private ClaimStatus status;
    private String rejectionComment;
    private String receiptFileName;
    private String receiptOriginalName;
    private String receiptContentType;
    private Long receiptFileSize;
    private boolean hasReceipt;
    private UserDTO employee;
    private UserDTO reviewedBy;
    private LocalDateTime reviewedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public ClaimResponseDTO() {
    }

    public static ClaimResponseDTO fromEntity(Claim claim) {
        if (claim == null) return null;

        ClaimResponseDTO dto = new ClaimResponseDTO();
        dto.setId(claim.getId());
        dto.setTitle(claim.getTitle());
        dto.setAmount(claim.getAmount());
        dto.setCategory(claim.getCategory());
        dto.setExpenseDate(claim.getExpenseDate());
        dto.setDescription(claim.getDescription());
        dto.setStatus(claim.getStatus());
        dto.setRejectionComment(claim.getRejectionComment());
        dto.setReceiptFileName(claim.getReceiptFileName());
        dto.setReceiptOriginalName(claim.getReceiptOriginalName());
        dto.setReceiptContentType(claim.getReceiptContentType());
        dto.setReceiptFileSize(claim.getReceiptFileSize());
        dto.setHasReceipt(claim.getReceiptFileName() != null && !claim.getReceiptFileName().isEmpty());
        dto.setEmployee(UserDTO.fromEntity(claim.getEmployee()));
        dto.setReviewedBy(UserDTO.fromEntity(claim.getReviewedBy()));
        dto.setReviewedAt(claim.getReviewedAt());
        dto.setCreatedAt(claim.getCreatedAt());
        dto.setUpdatedAt(claim.getUpdatedAt());
        return dto;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public ClaimCategory getCategory() {
        return category;
    }

    public void setCategory(ClaimCategory category) {
        this.category = category;
    }

    public LocalDate getExpenseDate() {
        return expenseDate;
    }

    public void setExpenseDate(LocalDate expenseDate) {
        this.expenseDate = expenseDate;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public ClaimStatus getStatus() {
        return status;
    }

    public void setStatus(ClaimStatus status) {
        this.status = status;
    }

    public String getRejectionComment() {
        return rejectionComment;
    }

    public void setRejectionComment(String rejectionComment) {
        this.rejectionComment = rejectionComment;
    }

    public String getReceiptFileName() {
        return receiptFileName;
    }

    public void setReceiptFileName(String receiptFileName) {
        this.receiptFileName = receiptFileName;
    }

    public String getReceiptOriginalName() {
        return receiptOriginalName;
    }

    public void setReceiptOriginalName(String receiptOriginalName) {
        this.receiptOriginalName = receiptOriginalName;
    }

    public String getReceiptContentType() {
        return receiptContentType;
    }

    public void setReceiptContentType(String receiptContentType) {
        this.receiptContentType = receiptContentType;
    }

    public Long getReceiptFileSize() {
        return receiptFileSize;
    }

    public void setReceiptFileSize(Long receiptFileSize) {
        this.receiptFileSize = receiptFileSize;
    }

    public boolean isHasReceipt() {
        return hasReceipt;
    }

    public void setHasReceipt(boolean hasReceipt) {
        this.hasReceipt = hasReceipt;
    }

    public UserDTO getEmployee() {
        return employee;
    }

    public void setEmployee(UserDTO employee) {
        this.employee = employee;
    }

    public UserDTO getReviewedBy() {
        return reviewedBy;
    }

    public void setReviewedBy(UserDTO reviewedBy) {
        this.reviewedBy = reviewedBy;
    }

    public LocalDateTime getReviewedAt() {
        return reviewedAt;
    }

    public void setReviewedAt(LocalDateTime reviewedAt) {
        this.reviewedAt = reviewedAt;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
