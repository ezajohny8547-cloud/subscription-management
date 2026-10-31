package com.subscription.auth.service.impl;

import com.subscription.auth.dto.*;
import com.subscription.auth.exception.BadRequestException;
import com.subscription.auth.model.PasswordResetToken;
import com.subscription.auth.model.Role;
import com.subscription.auth.model.User;
import com.subscription.auth.model.UserStatus;
import com.subscription.auth.repository.PasswordResetTokenRepository;
import com.subscription.auth.repository.UserRepository;
import com.subscription.auth.security.JwtTokenProvider;
import com.subscription.auth.security.UserPrincipal;
import com.subscription.auth.service.AuthService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

@Service
public class AuthServiceImpl implements AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthServiceImpl.class);

    private final UserRepository userRepository;
    private final PasswordResetTokenRepository tokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider tokenProvider;
    private final long resetTokenExpirationMs;

    public AuthServiceImpl(
            UserRepository userRepository,
            PasswordResetTokenRepository tokenRepository,
            PasswordEncoder passwordEncoder,
            AuthenticationManager authenticationManager,
            JwtTokenProvider tokenProvider,
            @Value("${app.jwt.reset-token-expiration-ms:900000}") long resetTokenExpirationMs) {
        this.userRepository = userRepository;
        this.tokenRepository = tokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.tokenProvider = tokenProvider;
        this.resetTokenExpirationMs = resetTokenExpirationMs;
    }

    @Override
    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        // Authenticate credentials against UserDetailsServiceImpl
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail().trim(), request.getPassword())
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);

        String jwt = tokenProvider.generateToken(authentication);
        UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();

        log.info("User successfully authenticated with email: {}", userPrincipal.getUsername());

        return new AuthResponse(
                jwt,
                userPrincipal.getId(),
                userPrincipal.getUsername(),
                userPrincipal.getFullName(),
                userPrincipal.getRole()
        );
    }

    @Override
    @Transactional
    public ApiResponse<Void> register(RegisterRequest request) {
        String email = request.getEmail().trim().toLowerCase();

        if (userRepository.existsByEmail(email)) {
            throw new BadRequestException("An account with this email address already exists");
        }

        User user = new User(
                request.getFullName().trim(),
                email,
                passwordEncoder.encode(request.getPassword()),
                Role.CUSTOMER,
                UserStatus.ACTIVE
        );

        userRepository.save(user);

        log.info("Registered new customer account for email: {}", email);
        return ApiResponse.success("Registration successful. Please log in with your credentials.");
    }

    @Override
    public ApiResponse<Void> logout() {
        SecurityContextHolder.clearContext();
        return ApiResponse.success("Successfully logged out");
    }

    @Override
    @Transactional
    public ApiResponse<Void> forgotPassword(ForgotPasswordRequest request) {
        String email = request.getEmail().trim().toLowerCase();
        Optional<User> userOpt = userRepository.findByEmail(email);

        if (userOpt.isPresent()) {
            User user = userOpt.get();

            // Invalidate any active previous tokens for this user
            tokenRepository.invalidatePreviousUserTokens(user);

            // Generate cryptographically secure reset token
            String resetToken = UUID.randomUUID().toString();
            Instant expiryDate = Instant.now().plusMillis(resetTokenExpirationMs);

            PasswordResetToken prt = new PasswordResetToken(resetToken, user, expiryDate);
            tokenRepository.save(prt);

            // Dispatch reset link via email notification service (simulated delivery)
            // Notice: per specification, raw reset tokens and passwords are NEVER exposed in application logs!
            log.info("Dispatched password reset instructions for account: {}", email);
        } else {
            // Log subtle audit entry; do not leak user existence to client
            log.info("Password reset requested for unregistered email: {}", email);
        }

        return ApiResponse.success("If an account exists with this email, a password reset link has been dispatched.");
    }

    @Override
    @Transactional
    public ApiResponse<Void> resetPassword(ResetPasswordRequest request) {
        PasswordResetToken tokenRecord = tokenRepository.findByTokenAndUsedFalse(request.getToken().trim())
                .orElseThrow(() -> new BadRequestException("Invalid or expired reset token"));

        if (tokenRecord.isExpired()) {
            throw new BadRequestException("This password reset token has expired. Please request a new one.");
        }

        User user = tokenRecord.getUser();
        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        tokenRecord.setUsed(true);
        tokenRepository.save(tokenRecord);

        log.info("Password successfully reset for account ID: {}", user.getId());
        return ApiResponse.success("Password has been reset successfully. You can now log in.");
    }
}
