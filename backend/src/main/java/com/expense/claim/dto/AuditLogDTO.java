package com.expense.claim.dto;

import com.expense.claim.entity.AuditAction;
import com.expense.claim.entity.ClaimAuditLog;

import java.time.LocalDateTime;

public class AuditLogDTO {
    private Long id;
    private Long claimId;
    private String claimTitle;
    private AuditAction action;
    private String performedBy;
    private String userRole;
    private String details;
    private LocalDateTime timestamp;

    public AuditLogDTO() {
    }

    public static AuditLogDTO fromEntity(ClaimAuditLog log) {
        if (log == null) return null;
        AuditLogDTO dto = new AuditLogDTO();
        dto.setId(log.getId());
        dto.setClaimId(log.getClaimId());
        dto.setClaimTitle(log.getClaimTitle());
        dto.setAction(log.getAction());
        dto.setPerformedBy(log.getPerformedBy());
        dto.setUserRole(log.getUserRole());
        dto.setDetails(log.getDetails());
        dto.setTimestamp(log.getTimestamp());
        return dto;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getClaimId() {
        return claimId;
    }

    public void setClaimId(Long claimId) {
        this.claimId = claimId;
    }

    public String getClaimTitle() {
        return claimTitle;
    }

    public void setClaimTitle(String claimTitle) {
        this.claimTitle = claimTitle;
    }

    public AuditAction getAction() {
        return action;
    }

    public void setAction(AuditAction action) {
        this.action = action;
    }

    public String getPerformedBy() {
        return performedBy;
    }

    public void setPerformedBy(String performedBy) {
        this.performedBy = performedBy;
    }

    public String getUserRole() {
        return userRole;
    }

    public void setUserRole(String userRole) {
        this.userRole = userRole;
    }

    public String getDetails() {
        return details;
    }

    public void setDetails(String details) {
        this.details = details;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }
}
