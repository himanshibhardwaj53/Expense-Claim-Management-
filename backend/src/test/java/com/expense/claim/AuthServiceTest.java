package com.expense.claim;

import com.expense.claim.dto.AuthResponse;
import com.expense.claim.dto.LoginRequest;
import com.expense.claim.dto.RegisterRequest;
import com.expense.claim.entity.Role;
import com.expense.claim.entity.User;
import com.expense.claim.exception.BusinessException;
import com.expense.claim.exception.UnauthorizedException;
import com.expense.claim.repository.UserRepository;
import com.expense.claim.service.AuthService;
import com.expense.claim.util.JwtUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtUtil jwtUtil;

    @InjectMocks
    private AuthService authService;

    private User activeUser;

    @BeforeEach
    void setUp() {
        activeUser = new User();
        activeUser.setId(1L);
        activeUser.setName("Alice Employee");
        activeUser.setEmail("alice@company.com");
        activeUser.setPassword("encodedPassword123");
        activeUser.setRole(Role.ROLE_EMPLOYEE);
        activeUser.setActive(true);
    }

    @Test
    @DisplayName("Registration succeeds and assigns ROLE_EMPLOYEE")
    void testRegisterSuccess() {
        RegisterRequest request = new RegisterRequest("Alice Employee", "alice@company.com", "Password123");

        when(userRepository.existsByEmail("alice@company.com")).thenReturn(false);
        when(passwordEncoder.encode("Password123")).thenReturn("encodedPassword123");
        when(userRepository.save(any(User.class))).thenReturn(activeUser);
        when(jwtUtil.generateAccessToken(any(), any(), any())).thenReturn("mock-access-token");
        when(jwtUtil.generateRefreshToken(any(), any())).thenReturn("mock-refresh-token");
        when(jwtUtil.getAccessTokenExpirationMs()).thenReturn(3600000L);

        AuthResponse response = authService.register(request);

        assertNotNull(response);
        assertEquals("mock-access-token", response.getAccessToken());
        assertEquals("mock-refresh-token", response.getRefreshToken());
        assertEquals(Role.ROLE_EMPLOYEE, response.getUser().getRole());
        verify(userRepository).save(argThat(u -> u.getRole() == Role.ROLE_EMPLOYEE));
    }

    @Test
    @DisplayName("Registration with duplicate email throws BusinessException")
    void testRegisterDuplicateEmailThrowsBusinessException() {
        RegisterRequest request = new RegisterRequest("Alice Employee", "alice@company.com", "Password123");
        when(userRepository.existsByEmail("alice@company.com")).thenReturn(true);

        assertThrows(BusinessException.class, () -> authService.register(request));
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    @DisplayName("Login with valid credentials returns tokens")
    void testLoginSuccess() {
        LoginRequest request = new LoginRequest("alice@company.com", "Password123");

        when(userRepository.findByEmail("alice@company.com")).thenReturn(Optional.of(activeUser));
        when(passwordEncoder.matches("Password123", "encodedPassword123")).thenReturn(true);
        when(jwtUtil.generateAccessToken(any(), any(), any())).thenReturn("mock-access-token");
        when(jwtUtil.generateRefreshToken(any(), any())).thenReturn("mock-refresh-token");
        when(jwtUtil.getAccessTokenExpirationMs()).thenReturn(3600000L);

        AuthResponse response = authService.login(request);

        assertNotNull(response);
        assertEquals("mock-access-token", response.getAccessToken());
        assertEquals("alice@company.com", response.getUser().getEmail());
    }

    @Test
    @DisplayName("Deactivated user cannot log in (throws UnauthorizedException)")
    void testLoginDeactivatedUserThrowsUnauthorizedException() {
        User deactivatedUser = new User();
        deactivatedUser.setEmail("inactive@company.com");
        deactivatedUser.setActive(false);

        LoginRequest request = new LoginRequest("inactive@company.com", "Password123");
        when(userRepository.findByEmail("inactive@company.com")).thenReturn(Optional.of(deactivatedUser));

        UnauthorizedException exception = assertThrows(UnauthorizedException.class, () -> authService.login(request));
        assertTrue(exception.getMessage().contains("deactivated"));
        verify(passwordEncoder, never()).matches(anyString(), anyString());
    }
}
