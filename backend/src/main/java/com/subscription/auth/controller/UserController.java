package com.subscription.auth.controller;

import com.subscription.auth.dto.StaffCreateRequest;
import com.subscription.auth.dto.UpdateUserStatusRequest;
import com.subscription.auth.dto.UserResponse;
import com.subscription.common.ApiResponse;
import com.subscription.common.exception.ResourceNotFoundException;
import com.subscription.entity.Role;
import com.subscription.entity.User;
import com.subscription.entity.UserStatus;
import com.subscription.repository.UserRepository;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserController(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF', 'MANAGER')")
    public ResponseEntity<ApiResponse<List<UserResponse>>> getAllUsers() {
        List<UserResponse> users = userRepository.findAll().stream()
                .map(UserResponse::fromUser)
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success("Users retrieved successfully", users));
    }

    @PostMapping("/staff")
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public ResponseEntity<ApiResponse<UserResponse>> createStaff(@Valid @RequestBody StaffCreateRequest request) {
        String email = request.getEmail().trim().toLowerCase();
        if (userRepository.existsByEmail(email)) {
            return ResponseEntity.badRequest().body(ApiResponse.error("A user with this email address already exists."));
        }

        User staff = new User(
                request.getFullName().trim(),
                email,
                passwordEncoder.encode(request.getPassword()),
                Role.STAFF,
                UserStatus.ACTIVE
        );
        User savedStaff = userRepository.save(staff);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Staff account created successfully", UserResponse.fromUser(savedStaff)));
    }

    @PutMapping("/{userId}/status")
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public ResponseEntity<ApiResponse<UserResponse>> updateUserStatus(
            @PathVariable Long userId,
            @Valid @RequestBody UpdateUserStatusRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + userId));

        user.setStatus(request.getStatus());
        User updatedUser = userRepository.save(user);

        return ResponseEntity.ok(ApiResponse.success("User status updated successfully", UserResponse.fromUser(updatedUser)));
    }
}
