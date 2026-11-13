package com.expense.claim.dto;

import java.math.BigDecimal;

public class EmployeeDashboardDTO {
    private BigDecimal totalClaimedAmount;
    private BigDecimal totalApprovedAmount;
    private BigDecimal totalRejectedAmount;
    private BigDecimal totalPendingAmount;
    private long totalClaims;
    private long approvedClaims;
    private long rejectedClaims;
    private long pendingClaims;

    public EmployeeDashboardDTO() {
        this.totalClaimedAmount = BigDecimal.ZERO;
        this.totalApprovedAmount = BigDecimal.ZERO;
        this.totalRejectedAmount = BigDecimal.ZERO;
        this.totalPendingAmount = BigDecimal.ZERO;
    }

    public EmployeeDashboardDTO(BigDecimal totalClaimedAmount, BigDecimal totalApprovedAmount, BigDecimal totalRejectedAmount, BigDecimal totalPendingAmount, long totalClaims, long approvedClaims, long rejectedClaims, long pendingClaims) {
        this.totalClaimedAmount = totalClaimedAmount;
        this.totalApprovedAmount = totalApprovedAmount;
        this.totalRejectedAmount = totalRejectedAmount;
        this.totalPendingAmount = totalPendingAmount;
        this.totalClaims = totalClaims;
        this.approvedClaims = approvedClaims;
        this.rejectedClaims = rejectedClaims;
        this.pendingClaims = pendingClaims;
    }

    public BigDecimal getTotalClaimedAmount() {
        return totalClaimedAmount;
    }

    public void setTotalClaimedAmount(BigDecimal totalClaimedAmount) {
        this.totalClaimedAmount = totalClaimedAmount;
    }

    public BigDecimal getTotalApprovedAmount() {
        return totalApprovedAmount;
    }

    public void setTotalApprovedAmount(BigDecimal totalApprovedAmount) {
        this.totalApprovedAmount = totalApprovedAmount;
    }

    public BigDecimal getTotalRejectedAmount() {
        return totalRejectedAmount;
    }

    public void setTotalRejectedAmount(BigDecimal totalRejectedAmount) {
        this.totalRejectedAmount = totalRejectedAmount;
    }

    public BigDecimal getTotalPendingAmount() {
        return totalPendingAmount;
    }

    public void setTotalPendingAmount(BigDecimal totalPendingAmount) {
        this.totalPendingAmount = totalPendingAmount;
    }

    public long getTotalClaims() {
        return totalClaims;
    }

    public void setTotalClaims(long totalClaims) {
        this.totalClaims = totalClaims;
    }

    public long getApprovedClaims() {
        return approvedClaims;
    }

    public void setApprovedClaims(long approvedClaims) {
        this.approvedClaims = approvedClaims;
    }

    public long getRejectedClaims() {
        return rejectedClaims;
    }

    public void setRejectedClaims(long rejectedClaims) {
        this.rejectedClaims = rejectedClaims;
    }

    public long getPendingClaims() {
        return pendingClaims;
    }

    public void setPendingClaims(long pendingClaims) {
        this.pendingClaims = pendingClaims;
    }
}
