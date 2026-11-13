package com.expense.claim.service;

import com.expense.claim.dto.AuthResponse;
import com.expense.claim.dto.LoginRequest;
import com.expense.claim.dto.RefreshTokenRequest;
import com.expense.claim.dto.RegisterRequest;
import com.expense.claim.dto.UserDTO;
import com.expense.claim.entity.Role;
import com.expense.claim.entity.User;
import com.expense.claim.exception.BusinessException;
import com.expense.claim.exception.UnauthorizedException;
import com.expense.claim.repository.UserRepository;
import com.expense.claim.util.JwtUtil;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtUtil jwtUtil) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String email = request.getEmail().trim().toLowerCase();
        if (userRepository.existsByEmail(email)) {
            throw new BusinessException("An account with email " + email + " already exists");
        }

        User user = new User();
        user.setName(request.getName().trim());
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        // Requirement 4: Every new user registers as an Employee
        user.setRole(Role.ROLE_EMPLOYEE);
        user.setActive(true);

        User savedUser = userRepository.save(user);

        String accessToken = jwtUtil.generateAccessToken(savedUser, savedUser.getId(), savedUser.getRole().name());
        String refreshToken = jwtUtil.generateRefreshToken(savedUser, savedUser.getId());

        return new AuthResponse(
                accessToken,
                refreshToken,
                jwtUtil.getAccessTokenExpirationMs(),
                UserDTO.fromEntity(savedUser)
        );
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        String email = request.getEmail().trim().toLowerCase();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UnauthorizedException("Invalid email or password"));

        // Requirement 13: A deactivated user cannot log in
        if (!user.isActive()) {
            throw new UnauthorizedException("Your account is deactivated. Please contact your manager.");
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new UnauthorizedException("Invalid email or password");
        }

        String accessToken = jwtUtil.generateAccessToken(user, user.getId(), user.getRole().name());
        String refreshToken = jwtUtil.generateRefreshToken(user, user.getId());

        return new AuthResponse(
                accessToken,
                refreshToken,
                jwtUtil.getAccessTokenExpirationMs(),
                UserDTO.fromEntity(user)
        );
    }

    @Transactional(readOnly = true)
    public AuthResponse refreshToken(RefreshTokenRequest request) {
        String refreshToken = request.getRefreshToken();
        if (refreshToken == null || !jwtUtil.validateToken(refreshToken)) {
            throw new UnauthorizedException("Invalid or expired refresh token");
        }

        String tokenType = jwtUtil.getTokenType(refreshToken);
        if (!"REFRESH".equals(tokenType)) {
            throw new UnauthorizedException("Provided token is not a refresh token");
        }

        String email = jwtUtil.getUsernameFromToken(refreshToken);
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UnauthorizedException("User not found for refresh token"));

        if (!user.isActive()) {
            throw new UnauthorizedException("User account is deactivated");
        }

        String newAccessToken = jwtUtil.generateAccessToken(user, user.getId(), user.getRole().name());
        String newRefreshToken = jwtUtil.generateRefreshToken(user, user.getId());

        return new AuthResponse(
                newAccessToken,
                newRefreshToken,
                jwtUtil.getAccessTokenExpirationMs(),
                UserDTO.fromEntity(user)
        );
    }
}
