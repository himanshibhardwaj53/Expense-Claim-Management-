package com.expense.claim;

import com.expense.claim.dto.ClaimCreateRequest;
import com.expense.claim.dto.ClaimResponseDTO;
import com.expense.claim.dto.ClaimStatusUpdateRequest;
import com.expense.claim.dto.ClaimUpdateRequest;
import com.expense.claim.entity.*;
import com.expense.claim.exception.BusinessException;
import com.expense.claim.repository.ClaimRepository;
import com.expense.claim.service.AuditLogService;
import com.expense.claim.service.ClaimService;
import com.expense.claim.service.FileStorageService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ClaimServiceTest {

    @Mock
    private ClaimRepository claimRepository;

    @Mock
    private AuditLogService auditLogService;

    @Mock
    private FileStorageService fileStorageService;

    @InjectMocks
    private ClaimService claimService;

    private User employee1;
    private User employee2;
    private User manager;
    private Claim pendingClaim;

    @BeforeEach
    void setUp() {
        employee1 = new User(1L, "Emp One", "emp1@company.com", "pass", Role.ROLE_EMPLOYEE, true);
        employee2 = new User(2L, "Emp Two", "emp2@company.com", "pass", Role.ROLE_EMPLOYEE, true);
        manager = new User(3L, "Manager", "manager@company.com", "pass", Role.ROLE_MANAGER, true);

        pendingClaim = new Claim();
        pendingClaim.setId(10L);
        pendingClaim.setTitle("Conference travel");
        pendingClaim.setAmount(new BigDecimal("250.00"));
        pendingClaim.setCategory(ClaimCategory.TRAVEL);
        pendingClaim.setExpenseDate(LocalDate.now());
        pendingClaim.setStatus(ClaimStatus.PENDING);
        pendingClaim.setEmployee(employee1);
    }

    @Test
    @DisplayName("Create claim successfully sets PENDING status and logs audit")
    void testCreateClaimSuccess() {
        ClaimCreateRequest request = new ClaimCreateRequest(
                "Conference travel",
                new BigDecimal("250.00"),
                ClaimCategory.TRAVEL,
                LocalDate.now(),
                "Attending conference"
        );

        when(claimRepository.save(any(Claim.class))).thenReturn(pendingClaim);

        ClaimResponseDTO result = claimService.createClaim(request, employee1);

        assertNotNull(result);
        assertEquals(ClaimStatus.PENDING, result.getStatus());
        verify(claimRepository).save(any(Claim.class));
        verify(auditLogService).logAction(eq(10L), eq("Conference travel"), eq(AuditAction.CREATED), anyString(), anyString(), anyString());
    }

    @Test
    @DisplayName("Editing a claim is allowed when status is PENDING")
    void testUpdateClaimSuccessWhenPending() {
        ClaimUpdateRequest updateRequest = new ClaimUpdateRequest(
                "Updated Title",
                new BigDecimal("300.00"),
                ClaimCategory.MEALS,
                LocalDate.now(),
                "Updated description"
        );

        when(claimRepository.findById(10L)).thenReturn(Optional.of(pendingClaim));
        when(claimRepository.save(any(Claim.class))).thenReturn(pendingClaim);

        ClaimResponseDTO result = claimService.updateClaim(10L, updateRequest, employee1);

        assertNotNull(result);
        verify(claimRepository).save(any(Claim.class));
        verify(auditLogService).logAction(eq(10L), anyString(), eq(AuditAction.UPDATED), anyString(), anyString(), anyString());
    }

    @Test
    @DisplayName("Editing an APPROVED or REJECTED claim throws BusinessException")
    void testUpdateClaimFailsWhenNotPending() {
        pendingClaim.setStatus(ClaimStatus.APPROVED);
        when(claimRepository.findById(10L)).thenReturn(Optional.of(pendingClaim));

        ClaimUpdateRequest updateRequest = new ClaimUpdateRequest(
                "Updated Title",
                new BigDecimal("300.00"),
                ClaimCategory.MEALS,
                LocalDate.now(),
                "Updated description"
        );

        assertThrows(BusinessException.class, () -> claimService.updateClaim(10L, updateRequest, employee1));
        verify(claimRepository, never()).save(any(Claim.class));
    }

    @Test
    @DisplayName("Rejecting a claim without a mandatory comment throws BusinessException")
    void testRejectClaimWithoutCommentThrowsBusinessException() {
        when(claimRepository.findById(10L)).thenReturn(Optional.of(pendingClaim));

        ClaimStatusUpdateRequest request = new ClaimStatusUpdateRequest(ClaimStatus.REJECTED, "   ");

        assertThrows(BusinessException.class, () -> claimService.reviewClaim(10L, request, manager));
        verify(claimRepository, never()).save(any(Claim.class));
    }

    @Test
    @DisplayName("Manager approves a claim successfully")
    void testApproveClaimSuccess() {
        when(claimRepository.findById(10L)).thenReturn(Optional.of(pendingClaim));
        when(claimRepository.save(any(Claim.class))).thenReturn(pendingClaim);

        ClaimStatusUpdateRequest request = new ClaimStatusUpdateRequest(ClaimStatus.APPROVED, "Looks good");
        ClaimResponseDTO result = claimService.reviewClaim(10L, request, manager);

        assertNotNull(result);
        verify(claimRepository).save(argThat(c -> c.getStatus() == ClaimStatus.APPROVED));
        verify(auditLogService).logAction(eq(10L), anyString(), eq(AuditAction.APPROVED), eq(manager.getEmail()), anyString(), anyString());
    }

    @Test
    @DisplayName("Employee cannot access another employee's claim (throws AccessDeniedException)")
    void testEmployeeCannotAccessAnotherEmployeeClaim() {
        when(claimRepository.findById(10L)).thenReturn(Optional.of(pendingClaim));

        // employee2 tries to access employee1's claim
        assertThrows(AccessDeniedException.class, () -> claimService.getClaimById(10L, employee2));
    }
}
