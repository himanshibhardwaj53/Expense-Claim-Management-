package com.expense.claim.controller;

import com.expense.claim.dto.AuthResponse;
import com.expense.claim.dto.LoginRequest;
import com.expense.claim.dto.RefreshTokenRequest;
import com.expense.claim.dto.RegisterRequest;
import com.expense.claim.dto.UserDTO;
import com.expense.claim.entity.User;
import com.expense.claim.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@Tag(name = "Authentication", description = "Endpoints for user registration, authentication, token refresh, and profile retrieval")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    @Operation(summary = "Register new employee", description = "Every new user registers with the ROLE_EMPLOYEE role.")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        AuthResponse response = authService.register(request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @PostMapping("/login")
    @Operation(summary = "Authenticate user", description = "Authenticate using email and password to receive JWT access and refresh tokens.")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/refresh")
    @Operation(summary = "Refresh JWT access token", description = "Provide a valid refresh token to obtain a refreshed access token.")
    public ResponseEntity<AuthResponse> refreshToken(@Valid @RequestBody RefreshTokenRequest request) {
        AuthResponse response = authService.refreshToken(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/me")
    @Operation(summary = "Get current user profile", description = "Retrieve profile details of the authenticated user.")
    public ResponseEntity<UserDTO> getCurrentUser(@AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(UserDTO.fromEntity(currentUser));
    }
}
