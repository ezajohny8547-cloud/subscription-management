package com.subscription.auth.controller;

import com.subscription.auth.dto.ApiResponse;
import com.subscription.auth.dto.StaffCreateRequest;
import com.subscription.auth.dto.UpdateUserStatusRequest;
import com.subscription.auth.dto.UserResponse;
import com.subscription.auth.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controller handling user management operations and staff provisioning.
 */
@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    /**
     * GET /api/users
     * Retrieve all system accounts. Authorized for ADMIN and STAFF.
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<ApiResponse<List<UserResponse>>> getAllUsers() {
        List<UserResponse> users = userService.getAllUsers();
        return ResponseEntity.ok(ApiResponse.success("User list retrieved successfully", users));
    }

    /**
     * POST /api/users/staff
     * Create a new STAFF account. Restricted exclusively to ADMIN.
     */
    @PostMapping("/staff")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<UserResponse>> createStaff(@Valid @RequestBody StaffCreateRequest request) {
        UserResponse createdStaff = userService.createStaff(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Staff account created successfully", createdStaff));
    }

    /**
     * PUT /api/users/{userId}/status
     * Modify user account status (ACTIVE, INACTIVE, SUSPENDED). Restricted exclusively to ADMIN.
     */
    @PutMapping("/{userId}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<UserResponse>> updateUserStatus(
            @PathVariable Long userId,
            @Valid @RequestBody UpdateUserStatusRequest request) {
        UserResponse updated = userService.updateUserStatus(userId, request);
        return ResponseEntity.ok(ApiResponse.success("User status updated successfully", updated));
    }
}
