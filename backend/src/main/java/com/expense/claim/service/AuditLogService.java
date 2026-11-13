package com.expense.claim.service;

import com.expense.claim.dto.AuditLogDTO;
import com.expense.claim.entity.AuditAction;
import com.expense.claim.entity.ClaimAuditLog;
import com.expense.claim.repository.ClaimAuditLogRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class AuditLogService {

    private final ClaimAuditLogRepository auditLogRepository;

    public AuditLogService(ClaimAuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    @Transactional
    public void logAction(Long claimId, String claimTitle, AuditAction action, String performedBy, String userRole, String details) {
        ClaimAuditLog log = new ClaimAuditLog(claimId, claimTitle, action, performedBy, userRole, details);
        auditLogRepository.save(log);
    }

    @Transactional(readOnly = true)
    public List<AuditLogDTO> getAuditLogsForClaim(Long claimId) {
        return auditLogRepository.findByClaimIdOrderByTimestampDesc(claimId)
                .stream()
                .map(AuditLogDTO::fromEntity)
                .collect(Collectors.toList());
    }
}
