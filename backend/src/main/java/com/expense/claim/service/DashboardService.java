package com.expense.claim.service;

import com.expense.claim.dto.CategorySummaryDTO;
import com.expense.claim.dto.EmployeeDashboardDTO;
import com.expense.claim.dto.ManagerDashboardDTO;
import com.expense.claim.dto.MonthlySummaryDTO;
import com.expense.claim.entity.Claim;
import com.expense.claim.entity.ClaimCategory;
import com.expense.claim.entity.ClaimStatus;
import com.expense.claim.entity.User;
import com.expense.claim.repository.ClaimRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class DashboardService {

    private final ClaimRepository claimRepository;

    public DashboardService(ClaimRepository claimRepository) {
        this.claimRepository = claimRepository;
    }

    @Transactional(readOnly = true)
    public EmployeeDashboardDTO getEmployeeDashboard(User employee) {
        Long empId = employee.getId();
        BigDecimal totalClaimed = claimRepository.sumAmountByEmployeeId(empId);
        BigDecimal approvedAmount = claimRepository.sumAmountByEmployeeIdAndStatus(empId, ClaimStatus.APPROVED);
        BigDecimal rejectedAmount = claimRepository.sumAmountByEmployeeIdAndStatus(empId, ClaimStatus.REJECTED);
        BigDecimal pendingAmount = claimRepository.sumAmountByEmployeeIdAndStatus(empId, ClaimStatus.PENDING);

        List<Claim> employeeClaims = claimRepository.findByEmployeeIdOrderByExpenseDateDesc(empId);
        long totalCount = employeeClaims.size();
        long approvedCount = employeeClaims.stream().filter(c -> c.getStatus() == ClaimStatus.APPROVED).count();
        long rejectedCount = employeeClaims.stream().filter(c -> c.getStatus() == ClaimStatus.REJECTED).count();
        long pendingCount = employeeClaims.stream().filter(c -> c.getStatus() == ClaimStatus.PENDING).count();

        return new EmployeeDashboardDTO(
                totalClaimed != null ? totalClaimed : BigDecimal.ZERO,
                approvedAmount != null ? approvedAmount : BigDecimal.ZERO,
                rejectedAmount != null ? rejectedAmount : BigDecimal.ZERO,
                pendingAmount != null ? pendingAmount : BigDecimal.ZERO,
                totalCount,
                approvedCount,
                rejectedCount,
                pendingCount
        );
    }

    @Transactional(readOnly = true)
    public ManagerDashboardDTO getManagerDashboard() {
        ManagerDashboardDTO dto = new ManagerDashboardDTO();

        List<Claim> allClaims = claimRepository.findAll();
        dto.setTotalClaims(allClaims.size());

        BigDecimal totalAmount = allClaims.stream()
                .map(Claim::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        dto.setTotalAmount(totalAmount);

        // Counts & Amounts by status
        Map<String, Long> statusCounts = new HashMap<>();
        Map<String, BigDecimal> statusAmounts = new HashMap<>();

        for (ClaimStatus status : ClaimStatus.values()) {
            statusCounts.put(status.name(), 0L);
            statusAmounts.put(status.name(), BigDecimal.ZERO);
        }

        for (Claim claim : allClaims) {
            String s = claim.getStatus().name();
            statusCounts.put(s, statusCounts.get(s) + 1);
            statusAmounts.put(s, statusAmounts.get(s).add(claim.getAmount()));
        }
        dto.setStatusCounts(statusCounts);
        dto.setStatusAmounts(statusAmounts);

        // Totals by Category
        Map<ClaimCategory, List<Claim>> byCategory = allClaims.stream()
                .collect(Collectors.groupingBy(Claim::getCategory));

        List<CategorySummaryDTO> categorySummaries = new ArrayList<>();
        for (ClaimCategory cat : ClaimCategory.values()) {
            List<Claim> claimsInCat = byCategory.getOrDefault(cat, Collections.emptyList());
            BigDecimal catTotal = claimsInCat.stream()
                    .map(Claim::getAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            categorySummaries.add(new CategorySummaryDTO(cat, catTotal, claimsInCat.size()));
        }
        dto.setCategorySummaries(categorySummaries);

        // Monthly Summary
        DateTimeFormatter monthFormatter = DateTimeFormatter.ofPattern("yyyy-MM");
        Map<String, List<Claim>> byMonth = allClaims.stream()
                .collect(Collectors.groupingBy(c -> c.getExpenseDate().format(monthFormatter)));

        List<MonthlySummaryDTO> monthlySummaries = byMonth.entrySet().stream()
                .sorted(Map.Entry.comparingByKey())
                .map(entry -> {
                    String month = entry.getKey();
                    List<Claim> claims = entry.getValue();
                    BigDecimal monthTotal = claims.stream().map(Claim::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
                    BigDecimal approved = claims.stream().filter(c -> c.getStatus() == ClaimStatus.APPROVED).map(Claim::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
                    BigDecimal pending = claims.stream().filter(c -> c.getStatus() == ClaimStatus.PENDING).map(Claim::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
                    BigDecimal rejected = claims.stream().filter(c -> c.getStatus() == ClaimStatus.REJECTED).map(Claim::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
                    return new MonthlySummaryDTO(month, monthTotal, claims.size(), approved, pending, rejected);
                })
                .collect(Collectors.toList());

        dto.setMonthlySummaries(monthlySummaries);

        return dto;
    }
}
