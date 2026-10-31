package com.subscription.auth.controller;

import com.subscription.auth.dto.*;
import com.subscription.common.ApiResponse;
import com.subscription.entity.PasswordResetToken;
import com.subscription.entity.Role;
import com.subscription.entity.User;
import com.subscription.entity.UserStatus;
import com.subscription.repository.PasswordResetTokenRepository;
import com.subscription.repository.UserRepository;
import com.subscription.security.CurrentUser;
import com.subscription.security.JwtTokenProvider;
import com.subscription.security.UserPrincipal;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider tokenProvider;
    private final UserRepository userRepository;
    private final PasswordResetTokenRepository tokenRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.jwt.reset-token-expiration-ms:900000}")
    private long resetTokenExpirationMs;

    public AuthController(AuthenticationManager authenticationManager,
                          JwtTokenProvider tokenProvider,
                          UserRepository userRepository,
                          PasswordResetTokenRepository tokenRepository,
                          PasswordEncoder passwordEncoder) {
        this.authenticationManager = authenticationManager;
        this.tokenProvider = tokenProvider;
        this.userRepository = userRepository;
        this.tokenRepository = tokenRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> authenticateUser(@Valid @RequestBody LoginRequest loginRequest) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        loginRequest.getEmail(),
                        loginRequest.getPassword()
                )
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = tokenProvider.generateToken(authentication);

        UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();
        AuthResponse authResponse = new AuthResponse(
                jwt,
                userPrincipal.getId(),
                userPrincipal.getName(),
                userPrincipal.getEmail(),
                userPrincipal.getRole().name()
        );

        return ResponseEntity.ok(ApiResponse.success("Authentication successful", authResponse));
    }

    @PostMapping("/register")
    @Transactional
    public ResponseEntity<ApiResponse<Void>> registerUser(@Valid @RequestBody RegisterRequest registerRequest) {
        String email = registerRequest.getEmail().trim().toLowerCase();
        if (userRepository.existsByEmail(email)) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error("An account with this email address already exists."));
        }

        User user = new User(
                registerRequest.getFullName().trim(),
                email,
                passwordEncoder.encode(registerRequest.getPassword()),
                Role.CUSTOMER,
                UserStatus.ACTIVE
        );
        userRepository.save(user);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Registration successful. Please log in with your credentials.", null));
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logoutUser() {
        SecurityContextHolder.clearContext();
        return ResponseEntity.ok(ApiResponse.success("Successfully logged out", null));
    }

    @PostMapping("/forgot-password")
    @Transactional
    public ResponseEntity<ApiResponse<Void>> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        String email = request.getEmail().trim().toLowerCase();
        Optional<User> userOpt = userRepository.findByEmail(email);

        if (userOpt.isPresent()) {
            User user = userOpt.get();
            tokenRepository.invalidatePreviousUserTokens(user);

            String token = UUID.randomUUID().toString();
            Instant expiry = Instant.now().plusMillis(resetTokenExpirationMs);
            tokenRepository.save(new PasswordResetToken(token, user, expiry));
        }

        return ResponseEntity.ok(ApiResponse.success(
                "If an account exists with this email, a password reset link has been dispatched.", null));
    }

    @PostMapping("/reset-password")
    @Transactional
    public ResponseEntity<ApiResponse<Void>> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        Optional<PasswordResetToken> tokenOpt = tokenRepository.findByTokenAndUsedFalse(request.getToken().trim());
        if (tokenOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Invalid or expired reset token."));
        }

        PasswordResetToken resetToken = tokenOpt.get();
        if (resetToken.isExpired()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("This password reset token has expired."));
        }

        User user = resetToken.getUser();
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        resetToken.setUsed(true);
        tokenRepository.save(resetToken);

        return ResponseEntity.ok(ApiResponse.success("Password has been reset successfully. You can now log in.", null));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<AuthResponse>> getCurrentUser(@CurrentUser UserPrincipal currentUser) {
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.error("Not authenticated"));
        }

        AuthResponse authResponse = new AuthResponse(
                null,
                currentUser.getId(),
                currentUser.getName(),
                currentUser.getEmail(),
                currentUser.getRole().name()
        );

        return ResponseEntity.ok(ApiResponse.success("Current user profile", authResponse));
    }
}
