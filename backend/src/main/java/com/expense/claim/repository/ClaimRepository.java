package com.expense.claim.repository;

import com.expense.claim.entity.Claim;
import com.expense.claim.entity.ClaimCategory;
import com.expense.claim.entity.ClaimStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

@Repository
public interface ClaimRepository extends JpaRepository<Claim, Long>, JpaSpecificationExecutor<Claim> {

    List<Claim> findByEmployeeIdOrderByExpenseDateDesc(Long employeeId);

    long countByEmployeeId(Long employeeId);

    @Query("SELECT COALESCE(SUM(c.amount), 0) FROM Claim c WHERE c.employee.id = :employeeId")
    BigDecimal sumAmountByEmployeeId(@Param("employeeId") Long employeeId);

    @Query("SELECT COALESCE(SUM(c.amount), 0) FROM Claim c WHERE c.employee.id = :employeeId AND c.status = :status")
    BigDecimal sumAmountByEmployeeIdAndStatus(@Param("employeeId") Long employeeId, @Param("status") ClaimStatus status);

    long countByStatus(ClaimStatus status);

    @Query("SELECT COALESCE(SUM(c.amount), 0) FROM Claim c WHERE c.status = :status")
    BigDecimal sumAmountByStatus(@Param("status") ClaimStatus status);

    @Query("SELECT c.category, COALESCE(SUM(c.amount), 0), COUNT(c) FROM Claim c GROUP BY c.category")
    List<Object[]> sumAmountGroupedByCategory();

    @Query("SELECT c.status, COUNT(c), COALESCE(SUM(c.amount), 0) FROM Claim c GROUP BY c.status")
    List<Object[]> countAndSumGroupedByStatus();
}
