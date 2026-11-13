package com.expense.claim.dto;

import com.expense.claim.entity.ClaimCategory;

import java.math.BigDecimal;

public class CategorySummaryDTO {
    private ClaimCategory category;
    private String categoryName;
    private BigDecimal totalAmount;
    private long count;

    public CategorySummaryDTO() {
    }

    public CategorySummaryDTO(ClaimCategory category, BigDecimal totalAmount, long count) {
        this.category = category;
        this.categoryName = category != null ? category.name() : "OTHER";
        this.totalAmount = totalAmount;
        this.count = count;
    }

    public ClaimCategory getCategory() {
        return category;
    }

    public void setCategory(ClaimCategory category) {
        this.category = category;
    }

    public String getCategoryName() {
        return categoryName;
    }

    public void setCategoryName(String categoryName) {
        this.categoryName = categoryName;
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
}
