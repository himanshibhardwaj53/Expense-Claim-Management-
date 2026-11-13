package com.expense.claim.dto;

import java.math.BigDecimal;

public class MonthlySummaryDTO {
    private String month; // e.g. "2026-11"
    private BigDecimal totalAmount;
    private long count;
    private BigDecimal approvedAmount;
    private BigDecimal pendingAmount;
    private BigDecimal rejectedAmount;

    public MonthlySummaryDTO() {
    }

    public MonthlySummaryDTO(String month, BigDecimal totalAmount, long count, BigDecimal approvedAmount, BigDecimal pendingAmount, BigDecimal rejectedAmount) {
        this.month = month;
        this.totalAmount = totalAmount;
        this.count = count;
        this.approvedAmount = approvedAmount;
        this.pendingAmount = pendingAmount;
        this.rejectedAmount = rejectedAmount;
    }

    public String getMonth() {
        return month;
    }

    public void setMonth(String month) {
        this.month = month;
    }

    public BigDecimal getTotalAmount() {
        return totalAmount;
    }

    public void setTotalAmount(BigDecimal totalAmount) {
        this.totalAmount = totalAmount;
    }

    public long getCount() {
        return count;
    }

    public void setCount(long count) {
        this.count = count;
    }

    public BigDecimal getApprovedAmount() {
        return approvedAmount;
    }

    public void setApprovedAmount(BigDecimal approvedAmount) {
        this.approvedAmount = approvedAmount;
    }

    public BigDecimal getPendingAmount() {
        return pendingAmount;
    }

    public void setPendingAmount(BigDecimal pendingAmount) {
        this.pendingAmount = pendingAmount;
    }

    public BigDecimal getRejectedAmount() {
        return rejectedAmount;
    }

    public void setRejectedAmount(BigDecimal rejectedAmount) {
        this.rejectedAmount = rejectedAmount;
    }
}
