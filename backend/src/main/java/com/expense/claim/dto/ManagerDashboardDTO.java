package com.expense.claim.dto;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class ManagerDashboardDTO {
    private long totalClaims;
    private BigDecimal totalAmount;
    private Map<String, Long> statusCounts;
    private Map<String, BigDecimal> statusAmounts;
    private List<CategorySummaryDTO> categorySummaries;
    private List<MonthlySummaryDTO> monthlySummaries;

    public ManagerDashboardDTO() {
        this.statusCounts = new HashMap<>();
        this.statusAmounts = new HashMap<>();
        this.categorySummaries = new ArrayList<>();
        this.monthlySummaries = new ArrayList<>();
        this.totalAmount = BigDecimal.ZERO;
    }

    public long getTotalClaims() {
        return totalClaims;
    }

    public void setTotalClaims(long totalClaims) {
        this.totalClaims = totalClaims;
    }

    public BigDecimal getTotalAmount() {
        return totalAmount;
    }

    public void setTotalAmount(BigDecimal totalAmount) {
        this.totalAmount = totalAmount;
    }

    public Map<String, Long> getStatusCounts() {
        return statusCounts;
    }

    public void setStatusCounts(Map<String, Long> statusCounts) {
        this.statusCounts = statusCounts;
    }

    public Map<String, BigDecimal> getStatusAmounts() {
        return statusAmounts;
    }

    public void setStatusAmounts(Map<String, BigDecimal> statusAmounts) {
        this.statusAmounts = statusAmounts;
    }

    public List<CategorySummaryDTO> getCategorySummaries() {
        return categorySummaries;
    }

    public void setCategorySummaries(List<CategorySummaryDTO> categorySummaries) {
        this.categorySummaries = categorySummaries;
    }

    public List<MonthlySummaryDTO> getMonthlySummaries() {
        return monthlySummaries;
    }

    public void setMonthlySummaries(List<MonthlySummaryDTO> monthlySummaries) {
        this.monthlySummaries = monthlySummaries;
    }
}
