package com.subscription.auth.service.impl;

import com.subscription.auth.dto.StaffCreateRequest;
import com.subscription.auth.dto.UpdateUserStatusRequest;
import com.subscription.auth.dto.UserResponse;
import com.subscription.auth.exception.BadRequestException;
import com.subscription.auth.exception.ResourceNotFoundException;
import com.subscription.auth.model.Role;
import com.subscription.auth.model.User;
import com.subscription.auth.model.UserStatus;
import com.subscription.auth.repository.UserRepository;
import com.subscription.auth.service.UserService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class UserServiceImpl implements UserService {

    private static final Logger log = LoggerFactory.getLogger(UserServiceImpl.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserServiceImpl(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional(readOnly = true)
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public List<UserResponse> getAllUsers() {
        return userRepository.findAll().stream()
                .map(this::mapToUserResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    @PreAuthorize("hasRole('ADMIN')")
    public UserResponse createStaff(StaffCreateRequest request) {
        String email = request.getEmail().trim().toLowerCase();

        if (userRepository.existsByEmail(email)) {
            throw new BadRequestException("An account with this email address already exists");
        }

        User staffUser = new User(
                request.getFullName().trim(),
                email,
                passwordEncoder.encode(request.getPassword()),
                Role.STAFF,
                UserStatus.ACTIVE
        );

        User savedUser = userRepository.save(staffUser);
        log.info("Administrator created new STAFF account with email: {}", email);

        return mapToUserResponse(savedUser);
    }

    @Override
    @Transactional
    @PreAuthorize("hasRole('ADMIN')")
    public UserResponse updateUserStatus(Long userId, UpdateUserStatusRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + userId));

        // Prevent locking or disabling the root Admin
        if (user.getRole() == Role.ADMIN && request.getStatus() != UserStatus.ACTIVE) {
            throw new BadRequestException("Administrator accounts cannot be deactivated");
        }

        user.setStatus(request.getStatus());
        User updated = userRepository.save(user);

        log.info("Administrator updated status of user ID {} to {}", userId, request.getStatus());
        return mapToUserResponse(updated);
    }

    private UserResponse mapToUserResponse(User user) {
        return new UserResponse(
                user.getId(),
                user.getEmail(),
                user.getFullName(),
                user.getRole(),
                user.getStatus(),
                user.getCreatedAt()
        );
    }
}
