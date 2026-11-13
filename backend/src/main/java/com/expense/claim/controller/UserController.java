package com.expense.claim.controller;

import com.expense.claim.dto.PageResponse;
import com.expense.claim.dto.UserDTO;
import com.expense.claim.entity.User;
import com.expense.claim.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@PreAuthorize("hasRole('MANAGER')")
@Tag(name = "User Management", description = "Manager operations for listing and activating/deactivating users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping
    @Operation(summary = "List users", description = "Manager views all users with search and pagination.")
    public ResponseEntity<PageResponse<UserDTO>> getUsers(
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt,desc") String sort) {

        String[] sortParams = sort.split(",");
        Sort.Direction direction = sortParams.length > 1 && sortParams[1].equalsIgnoreCase("asc") ?
                Sort.Direction.ASC : Sort.Direction.DESC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortParams[0]));

        PageResponse<UserDTO> response = userService.getUsers(search, pageable);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get user by ID", description = "Manager retrieves user details by ID.")
    public ResponseEntity<UserDTO> getUserById(@PathVariable Long id) {
        UserDTO user = userService.getUserById(id);
        return ResponseEntity.ok(user);
    }

    @PatchMapping("/{id}/status")
    @Operation(summary = "Activate/Deactivate user", description = "Manager activates or deactivates a user account. Deactivated users cannot log in.")
    public ResponseEntity<UserDTO> toggleUserStatus(
            @PathVariable Long id,
            @RequestParam boolean active,
            @AuthenticationPrincipal User currentManager) {
        UserDTO updatedUser = userService.toggleUserStatus(id, active, currentManager);
        return ResponseEntity.ok(updatedUser);
    }
}
