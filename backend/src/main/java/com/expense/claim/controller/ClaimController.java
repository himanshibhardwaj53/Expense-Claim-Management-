package com.expense.claim.controller;

import com.expense.claim.dto.*;
import com.expense.claim.entity.ClaimStatus;
import com.expense.claim.entity.User;
import com.expense.claim.service.AuditLogService;
import com.expense.claim.service.ClaimService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.core.io.InputStreamResource;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayInputStream;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/claims")
@Tag(name = "Claims", description = "Endpoints for managing expense claims, approval workflows, receipts, audit logs, and CSV export")
public class ClaimController {

    private final ClaimService claimService;
    private final AuditLogService auditLogService;

    public ClaimController(ClaimService claimService, AuditLogService auditLogService) {
        this.claimService = claimService;
        this.auditLogService = auditLogService;
    }

    @PostMapping
    @PreAuthorize("hasRole('EMPLOYEE')")
    @Operation(summary = "Create claim", description = "Create a new expense claim. Only employees can create claims.")
    public ResponseEntity<ClaimResponseDTO> createClaim(
            @Valid @RequestBody ClaimCreateRequest request,
            @AuthenticationPrincipal User currentUser) {
        ClaimResponseDTO response = claimService.createClaim(request, currentUser);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @GetMapping
    @Operation(summary = "List claims", description = "List claims with pagination, status filter, keyword search, and manager date/employee filters.")
    public ResponseEntity<PageResponse<ClaimResponseDTO>> getClaims(
            @AuthenticationPrincipal User currentUser,
            @RequestParam(required = false) ClaimStatus status,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Long employeeId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt,desc") String sort) {

        String[] sortParams = sort.split(",");
        Sort.Direction direction = sortParams.length > 1 && sortParams[1].equalsIgnoreCase("asc") ?
                Sort.Direction.ASC : Sort.Direction.DESC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortParams[0]));

        PageResponse<ClaimResponseDTO> response = claimService.getClaims(
                currentUser, status, search, employeeId, startDate, endDate, pageable
        );
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get claim details", description = "Get claim details by ID. Employees can only access their own claim.")
    public ResponseEntity<ClaimResponseDTO> getClaimById(
            @PathVariable Long id,
            @AuthenticationPrincipal User currentUser) {
        ClaimResponseDTO response = claimService.getClaimById(id, currentUser);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('EMPLOYEE')")
    @Operation(summary = "Update claim", description = "Edit an existing claim. Allowed only while status is PENDING.")
    public ResponseEntity<ClaimResponseDTO> updateClaim(
            @PathVariable Long id,
            @Valid @RequestBody ClaimUpdateRequest request,
            @AuthenticationPrincipal User currentUser) {
        ClaimResponseDTO response = claimService.updateClaim(id, request, currentUser);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('EMPLOYEE')")
    @Operation(summary = "Delete claim", description = "Delete a claim. Allowed only while status is PENDING.")
    public ResponseEntity<Void> deleteClaim(
            @PathVariable Long id,
            @AuthenticationPrincipal User currentUser) {
        claimService.deleteClaim(id, currentUser);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/review")
    @PreAuthorize("hasRole('MANAGER')")
    @Operation(summary = "Review claim (Approve/Reject)", description = "Manager approves or rejects a claim. Rejection comment is mandatory.")
    public ResponseEntity<ClaimResponseDTO> reviewClaim(
            @PathVariable Long id,
            @Valid @RequestBody ClaimStatusUpdateRequest request,
            @AuthenticationPrincipal User currentManager) {
        ClaimResponseDTO response = claimService.reviewClaim(id, request, currentManager);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/approve")
    @PreAuthorize("hasRole('MANAGER')")
    @Operation(summary = "Approve claim", description = "Shortcut endpoint to approve a claim.")
    public ResponseEntity<ClaimResponseDTO> approveClaim(
            @PathVariable Long id,
            @RequestBody(required = false) ClaimStatusUpdateRequest request,
            @AuthenticationPrincipal User currentManager) {
        ClaimStatusUpdateRequest updateRequest = new ClaimStatusUpdateRequest(
                ClaimStatus.APPROVED,
                request != null ? request.getComment() : null
        );
        ClaimResponseDTO response = claimService.reviewClaim(id, updateRequest, currentManager);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/reject")
    @PreAuthorize("hasRole('MANAGER')")
    @Operation(summary = "Reject claim", description = "Reject a claim. Comment is mandatory.")
    public ResponseEntity<ClaimResponseDTO> rejectClaim(
            @PathVariable Long id,
            @Valid @RequestBody ClaimStatusUpdateRequest request,
            @AuthenticationPrincipal User currentManager) {
        request.setStatus(ClaimStatus.REJECTED);
        ClaimResponseDTO response = claimService.reviewClaim(id, request, currentManager);
        return ResponseEntity.ok(response);
    }

    @PostMapping(value = "/{id}/receipt", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('EMPLOYEE')")
    @Operation(summary = "Attach receipt", description = "Upload receipt (JPEG, PNG, WEBP, or PDF, max 5MB) for a pending claim.")
    public ResponseEntity<ClaimResponseDTO> attachReceipt(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal User currentUser) {
        ClaimResponseDTO response = claimService.attachReceipt(id, file, currentUser);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}/receipt")
    @Operation(summary = "Download or view receipt", description = "Retrieve attached receipt file for a claim.")
    public ResponseEntity<Resource> getReceipt(
            @PathVariable Long id,
            @AuthenticationPrincipal User currentUser) {
        ClaimResponseDTO claim = claimService.getClaimById(id, currentUser);
        Resource resource = claimService.getReceiptResource(id, currentUser);

        String contentType = claim.getReceiptContentType() != null ?
                claim.getReceiptContentType() : "application/octet-stream";

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + claim.getReceiptOriginalName() + "\"")
                .body(resource);
    }

    @GetMapping("/{id}/audit-logs")
    @Operation(summary = "Get audit logs timeline", description = "Retrieve full audit history timeline for a claim.")
    public ResponseEntity<List<AuditLogDTO>> getAuditLogs(
            @PathVariable Long id,
            @AuthenticationPrincipal User currentUser) {
        // Enforce ownership check
        claimService.getClaimById(id, currentUser);
        List<AuditLogDTO> auditLogs = auditLogService.getAuditLogsForClaim(id);
        return ResponseEntity.ok(auditLogs);
    }

    @GetMapping("/export/csv")
    @PreAuthorize("hasRole('MANAGER')")
    @Operation(summary = "Export claims to CSV", description = "Download claims data as CSV file with applied filters.")
    public ResponseEntity<InputStreamResource> exportClaims(
            @AuthenticationPrincipal User currentUser,
            @RequestParam(required = false) ClaimStatus status,
            @RequestParam(required = false) Long employeeId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {

        ByteArrayInputStream in = claimService.exportClaimsToCsv(currentUser, status, employeeId, startDate, endDate);

        HttpHeaders headers = new HttpHeaders();
        headers.add("Content-Disposition", "attachment; filename=claims_export_" + LocalDate.now() + ".csv");

        return ResponseEntity.ok()
                .headers(headers)
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(new InputStreamResource(in));
    }
}
