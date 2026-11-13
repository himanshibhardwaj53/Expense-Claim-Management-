package com.expense.claim.service;

import com.expense.claim.dto.*;
import com.expense.claim.entity.*;
import com.expense.claim.exception.BusinessException;
import com.expense.claim.exception.ResourceNotFoundException;
import com.expense.claim.repository.ClaimRepository;
import com.expense.claim.repository.UserRepository;
import com.expense.claim.util.CsvExportUtil;
import jakarta.persistence.criteria.Predicate;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayInputStream;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ClaimService {

    private final ClaimRepository claimRepository;
    private final UserRepository userRepository;
    private final AuditLogService auditLogService;
    private final FileStorageService fileStorageService;

    public ClaimService(
            ClaimRepository claimRepository,
            UserRepository userRepository,
            AuditLogService auditLogService,
            FileStorageService fileStorageService) {
        this.claimRepository = claimRepository;
        this.userRepository = userRepository;
        this.auditLogService = auditLogService;
        this.fileStorageService = fileStorageService;
    }

    @Transactional
    public ClaimResponseDTO createClaim(ClaimCreateRequest request, User employee) {
        Claim claim = new Claim();
        claim.setTitle(request.getTitle().trim());
        claim.setAmount(request.getAmount());
        claim.setCategory(request.getCategory());
        claim.setExpenseDate(request.getExpenseDate());
        claim.setDescription(request.getDescription());
        claim.setStatus(ClaimStatus.PENDING);
        claim.setEmployee(employee);

        Claim savedClaim = claimRepository.save(claim);

        auditLogService.logAction(
                savedClaim.getId(),
                savedClaim.getTitle(),
                AuditAction.CREATED,
                employee.getEmail(),
                employee.getRole().name(),
                "Claim created with amount: $" + savedClaim.getAmount() + " in category: " + savedClaim.getCategory()
        );

        return ClaimResponseDTO.fromEntity(savedClaim);
    }

    @Transactional
    public ClaimResponseDTO updateClaim(Long claimId, ClaimUpdateRequest request, User user) {
        Claim claim = getClaimEntityAndCheckAccess(claimId, user);

        // Requirement 6: Editing allowed ONLY while status is Pending
        if (claim.getStatus() != ClaimStatus.PENDING) {
            throw new BusinessException("Cannot edit claim. Only claims with PENDING status can be edited.");
        }

        claim.setTitle(request.getTitle().trim());
        claim.setAmount(request.getAmount());
        claim.setCategory(request.getCategory());
        claim.setExpenseDate(request.getExpenseDate());
        claim.setDescription(request.getDescription());

        Claim updatedClaim = claimRepository.save(claim);

        auditLogService.logAction(
                updatedClaim.getId(),
                updatedClaim.getTitle(),
                AuditAction.UPDATED,
                user.getEmail(),
                user.getRole().name(),
                "Claim updated with new amount: $" + updatedClaim.getAmount()
        );

        return ClaimResponseDTO.fromEntity(updatedClaim);
    }

    @Transactional
    public void deleteClaim(Long claimId, User user) {
        Claim claim = getClaimEntityAndCheckAccess(claimId, user);

        // Requirement 6: Deleting allowed ONLY while status is Pending
        if (claim.getStatus() != ClaimStatus.PENDING) {
            throw new BusinessException("Cannot delete claim. Only claims with PENDING status can be deleted.");
        }

        // Delete associated receipt file if present
        if (claim.getReceiptFileName() != null) {
            fileStorageService.deleteFile(claim.getReceiptFileName());
        }

        auditLogService.logAction(
                claim.getId(),
                claim.getTitle(),
                AuditAction.DELETED,
                user.getEmail(),
                user.getRole().name(),
                "Claim deleted by " + user.getEmail()
        );

        claimRepository.delete(claim);
    }

    @Transactional(readOnly = true)
    public ClaimResponseDTO getClaimById(Long claimId, User user) {
        Claim claim = getClaimEntityAndCheckAccess(claimId, user);
        return ClaimResponseDTO.fromEntity(claim);
    }

    @Transactional(readOnly = true)
    public PageResponse<ClaimResponseDTO> getClaims(
            User currentUser,
            ClaimStatus status,
            String search,
            Long employeeId,
            LocalDate startDate,
            LocalDate endDate,
            Pageable pageable) {

        Specification<Claim> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // Requirement 5: Employee can only view their own claims
            if (currentUser.getRole() == Role.ROLE_EMPLOYEE) {
                predicates.add(cb.equal(root.get("employee").get("id"), currentUser.getId()));
            } else if (employeeId != null) {
                // Manager filtering by specific employee
                predicates.add(cb.equal(root.get("employee").get("id"), employeeId));
            }

            // Filter by Status
            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }

            // Search by title or description
            if (search != null && !search.trim().isEmpty()) {
                String pattern = "%" + search.trim().toLowerCase() + "%";
                Predicate titleLike = cb.like(cb.lower(root.get("title")), pattern);
                Predicate descLike = cb.like(cb.lower(root.get("description")), pattern);
                predicates.add(cb.or(titleLike, descLike));
            }

            // Filter by Date Range (expenseDate)
            if (startDate != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("expenseDate"), startDate));
            }
            if (endDate != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("expenseDate"), endDate));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<Claim> claimPage = claimRepository.findAll(spec, pageable);
        return PageResponse.from(claimPage.map(ClaimResponseDTO::fromEntity));
    }

    @Transactional
    public ClaimResponseDTO reviewClaim(Long claimId, ClaimStatusUpdateRequest request, User manager) {
        if (manager.getRole() != Role.ROLE_MANAGER) {
            throw new AccessDeniedException("Only managers can approve or reject claims");
        }

        Claim claim = claimRepository.findById(claimId)
                .orElseThrow(() -> new ResourceNotFoundException("Claim not found with id: " + claimId));

        // Requirement 9: An approved or rejected claim cannot be changed again
        if (claim.getStatus() != ClaimStatus.PENDING) {
            throw new BusinessException("Claim has already been reviewed (" + claim.getStatus() + ") and cannot be changed again.");
        }

        if (request.getStatus() == ClaimStatus.PENDING) {
            throw new BusinessException("Cannot review claim with PENDING status. Must be APPROVED or REJECTED.");
        }

        // Requirement 9: A comment is mandatory when rejecting
        if (request.getStatus() == ClaimStatus.REJECTED) {
            if (request.getComment() == null || request.getComment().trim().isEmpty()) {
                throw new BusinessException("Rejection comment is mandatory when rejecting a claim.");
            }
            claim.setRejectionComment(request.getComment().trim());
        } else {
            claim.setRejectionComment(request.getComment() != null ? request.getComment().trim() : null);
        }

        claim.setStatus(request.getStatus());
        claim.setReviewedBy(manager);
        claim.setReviewedAt(LocalDateTime.now());

        Claim savedClaim = claimRepository.save(claim);

        AuditAction action = (request.getStatus() == ClaimStatus.APPROVED) ? AuditAction.APPROVED : AuditAction.REJECTED;
        String details = (request.getStatus() == ClaimStatus.APPROVED)
                ? "Claim approved by manager " + manager.getName()
                : "Claim rejected with comment: " + claim.getRejectionComment();

        auditLogService.logAction(
                savedClaim.getId(),
                savedClaim.getTitle(),
                action,
                manager.getEmail(),
                manager.getRole().name(),
                details
        );

        return ClaimResponseDTO.fromEntity(savedClaim);
    }

    @Transactional
    public ClaimResponseDTO attachReceipt(Long claimId, MultipartFile file, User user) {
        Claim claim = getClaimEntityAndCheckAccess(claimId, user);

        // Can only attach receipt while Pending
        if (claim.getStatus() != ClaimStatus.PENDING) {
            throw new BusinessException("Cannot attach receipt to an already " + claim.getStatus() + " claim.");
        }

        // Remove old receipt if exists
        if (claim.getReceiptFileName() != null) {
            fileStorageService.deleteFile(claim.getReceiptFileName());
        }

        String storedFileName = fileStorageService.storeFile(file);
        claim.setReceiptFileName(storedFileName);
        claim.setReceiptOriginalName(file.getOriginalFilename());
        claim.setReceiptContentType(file.getContentType());
        claim.setReceiptFileSize(file.getSize());

        Claim updatedClaim = claimRepository.save(claim);

        auditLogService.logAction(
                updatedClaim.getId(),
                updatedClaim.getTitle(),
                AuditAction.RECEIPT_ATTACHED,
                user.getEmail(),
                user.getRole().name(),
                "Attached receipt: " + file.getOriginalFilename() + " (" + (file.getSize() / 1024) + " KB)"
        );

        return ClaimResponseDTO.fromEntity(updatedClaim);
    }

    @Transactional(readOnly = true)
    public Resource getReceiptResource(Long claimId, User user) {
        Claim claim = getClaimEntityAndCheckAccess(claimId, user);
        if (claim.getReceiptFileName() == null) {
            throw new ResourceNotFoundException("No receipt attached to claim #" + claimId);
        }
        return fileStorageService.loadFileAsResource(claim.getReceiptFileName());
    }

    @Transactional(readOnly = true)
    public ByteArrayInputStream exportClaimsToCsv(
            User currentUser,
            ClaimStatus status,
            Long employeeId,
            LocalDate startDate,
            LocalDate endDate) {

        // Get unpaged list with filters applied
        PageResponse<ClaimResponseDTO> pageResponse = getClaims(
                currentUser,
                status,
                null,
                employeeId,
                startDate,
                endDate,
                PageRequest.of(0, 10000, Sort.by(Sort.Direction.DESC, "createdAt"))
        );

        return CsvExportUtil.claimsToCsv(pageResponse.getContent());
    }

    // Helper to check ownership & access
    public Claim getClaimEntityAndCheckAccess(Long claimId, User user) {
        Claim claim = claimRepository.findById(claimId)
                .orElseThrow(() -> new ResourceNotFoundException("Claim not found with id: " + claimId));

        // Requirement 5: An employee can only view and manage their own claims. Accessing another user's claim must return 403 or 404.
        if (user.getRole() == Role.ROLE_EMPLOYEE && !claim.getEmployee().getId().equals(user.getId())) {
            throw new AccessDeniedException("Access denied. You can only view and manage your own claims.");
        }

        return claim;
    }
}
