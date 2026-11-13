package com.expense.claim.repository;

import com.expense.claim.entity.ClaimAuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ClaimAuditLogRepository extends JpaRepository<ClaimAuditLog, Long> {
    List<ClaimAuditLog> findByClaimIdOrderByTimestampDesc(Long claimId);
}
