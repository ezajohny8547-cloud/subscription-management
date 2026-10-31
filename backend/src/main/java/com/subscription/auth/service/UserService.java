package com.subscription.auth.service;

import com.subscription.auth.dto.StaffCreateRequest;
import com.subscription.auth.dto.UpdateUserStatusRequest;
import com.subscription.auth.dto.UserResponse;

import java.util.List;

public interface UserService {

    List<UserResponse> getAllUsers();

    UserResponse createStaff(StaffCreateRequest request);

    UserResponse updateUserStatus(Long userId, UpdateUserStatusRequest request);
}
