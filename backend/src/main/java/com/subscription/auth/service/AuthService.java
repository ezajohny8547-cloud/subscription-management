package com.subscription.auth.service;

import com.subscription.auth.dto.*;

public interface AuthService {

    AuthResponse login(LoginRequest request);

    ApiResponse<Void> register(RegisterRequest request);

    ApiResponse<Void> logout();

    ApiResponse<Void> forgotPassword(ForgotPasswordRequest request);

    ApiResponse<Void> resetPassword(ResetPasswordRequest request);
}
