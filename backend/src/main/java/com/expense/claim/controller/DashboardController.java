package com.expense.claim.controller;

import com.expense.claim.dto.EmployeeDashboardDTO;
import com.expense.claim.dto.ManagerDashboardDTO;
import com.expense.claim.entity.User;
import com.expense.claim.service.DashboardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard")
@Tag(name = "Dashboard", description = "Role-specific dashboard metrics for employees and managers")
public class DashboardController {

    private final DashboardService dashboardService;

    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @GetMapping("/employee")
    @PreAuthorize("hasRole('EMPLOYEE')")
    @Operation(summary = "Employee dashboard metrics", description = "Get totals for claimed, approved, rejected, and pending amounts for the logged-in employee.")
    public ResponseEntity<EmployeeDashboardDTO> getEmployeeDashboard(@AuthenticationPrincipal User currentUser) {
        EmployeeDashboardDTO dashboard = dashboardService.getEmployeeDashboard(currentUser);
        return ResponseEntity.ok(dashboard);
    }

    @GetMapping("/manager")
    @PreAuthorize("hasRole('MANAGER')")
    @Operation(summary = "Manager dashboard metrics", description = "Get counts by status, totals by category, and monthly summary for the organization.")
    public ResponseEntity<ManagerDashboardDTO> getManagerDashboard() {
        ManagerDashboardDTO dashboard = dashboardService.getManagerDashboard();
        return ResponseEntity.ok(dashboard);
    }
}
