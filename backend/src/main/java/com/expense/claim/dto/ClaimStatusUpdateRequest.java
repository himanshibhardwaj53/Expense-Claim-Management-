package com.expense.claim.dto;

import com.expense.claim.entity.ClaimStatus;
import jakarta.validation.constraints.NotNull;

public class ClaimStatusUpdateRequest {

    @NotNull(message = "Status is required (APPROVED or REJECTED)")
    private ClaimStatus status;

    private String comment;

    public ClaimStatusUpdateRequest() {
    }

    public ClaimStatusUpdateRequest(ClaimStatus status, String comment) {
        this.status = status;
        this.comment = comment;
    }

    public ClaimStatus getStatus() {
        return status;
    }

    public void setStatus(ClaimStatus status) {
        this.status = status;
    }

    public String getComment() {
        return comment;
    }

    public void setComment(String comment) {
        this.comment = comment;
    }
}
