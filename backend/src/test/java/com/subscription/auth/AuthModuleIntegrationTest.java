package com.subscription.auth;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.subscription.auth.dto.*;
import com.subscription.auth.model.PasswordResetToken;
import com.subscription.auth.model.Role;
import com.subscription.auth.model.User;
import com.subscription.auth.model.UserStatus;
import com.subscription.auth.repository.PasswordResetTokenRepository;
import com.subscription.auth.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.time.Instant;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class AuthModuleIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordResetTokenRepository tokenRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @BeforeEach
    void setUp() {
        tokenRepository.deleteAll();
        userRepository.deleteAll();

        // Seed initial Admin
        User admin = new User(
                "System Admin",
                "admin@subscription.com",
                passwordEncoder.encode("Admin@12345"),
                Role.ADMIN,
                UserStatus.ACTIVE
        );
        userRepository.save(admin);
    }

    @Test
    @DisplayName("Registration - Success with valid complex password")
    void testRegisterSuccess() throws Exception {
        RegisterRequest req = new RegisterRequest("Alice Wonderland", "alice@example.com", "SecurePass@2026");

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.message", containsString("Registration successful")));

        User savedUser = userRepository.findByEmail("alice@example.com").orElse(null);
        assertThat(savedUser).isNotNull();
        assertThat(savedUser.getRole()).isEqualTo(Role.CUSTOMER);
        // Password must be hashed with BCrypt, not stored in plaintext
        assertThat(savedUser.getPasswordHash()).isNotEqualTo("SecurePass@2026");
        assertThat(passwordEncoder.matches("SecurePass@2026", savedUser.getPasswordHash())).isTrue();
    }

    @Test
    @DisplayName("Registration - Fails when password does not meet complexity criteria")
    void testRegisterPasswordCriteriaFailure() throws Exception {
        // Less than 9 characters
        RegisterRequest shortReq = new RegisterRequest("Bob", "bob@example.com", "Pass@1");
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(shortReq)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.password", notNullValue()));

        // Missing special character
        RegisterRequest noSpecialReq = new RegisterRequest("Bob", "bob2@example.com", "Password123");
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(noSpecialReq)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.password", notNullValue()));
    }

    @Test
    @DisplayName("Registration - Fails when email is already registered")
    void testRegisterDuplicateEmail() throws Exception {
        RegisterRequest req = new RegisterRequest("Duplicate Admin", "admin@subscription.com", "Admin@12345");

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.message", containsString("already exists")));
    }

    @Test
    @DisplayName("Login - Success returns JWT and User details with camelCase fields")
    void testLoginSuccess() throws Exception {
        LoginRequest req = new LoginRequest("admin@subscription.com", "Admin@12345");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token", notNullValue()))
                .andExpect(jsonPath("$.tokenType", is("Bearer")))
                .andExpect(jsonPath("$.email", is("admin@subscription.com")))
                .andExpect(jsonPath("$.role", is("ADMIN")))
                .andExpect(jsonPath("$.userId", notNullValue()))
                .andExpect(jsonPath("$.fullName", is("System Admin")));
    }

    @Test
    @DisplayName("Login - Fails on invalid credentials")
    void testLoginFailure() throws Exception {
        LoginRequest req = new LoginRequest("admin@subscription.com", "WrongPassword@123");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.message", containsString("Invalid email or password")));
    }

    @Test
    @DisplayName("Role-based Access - Only ADMIN can create STAFF accounts; CUSTOMER gets 403")
    void testOnlyAdminCanCreateStaff() throws Exception {
        // Create a customer
        User customer = new User("Customer Charlie", "charlie@example.com",
                passwordEncoder.encode("CustomerPass@123"), Role.CUSTOMER, UserStatus.ACTIVE);
        userRepository.save(customer);

        // Get Customer Token
        LoginRequest custLogin = new LoginRequest("charlie@example.com", "CustomerPass@123");
        MvcResult custResult = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(custLogin)))
                .andExpect(status().isOk())
                .andReturn();
        AuthResponse custAuth = objectMapper.readValue(custResult.getResponse().getContentAsString(), AuthResponse.class);

        // Customer attempts to create Staff -> 403 Forbidden
        StaffCreateRequest staffReq = new StaffCreateRequest("New Staff", "staff.member@example.com", "StaffPass@12345");
        mockMvc.perform(post("/api/users/staff")
                        .header("Authorization", "Bearer " + custAuth.getToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(staffReq)))
                .andExpect(status().isForbidden());

        // Now Admin creates Staff -> 201 Created
        LoginRequest adminLogin = new LoginRequest("admin@subscription.com", "Admin@12345");
        MvcResult adminResult = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(adminLogin)))
                .andExpect(status().isOk())
                .andReturn();
        AuthResponse adminAuth = objectMapper.readValue(adminResult.getResponse().getContentAsString(), AuthResponse.class);

        mockMvc.perform(post("/api/users/staff")
                        .header("Authorization", "Bearer " + adminAuth.getToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(staffReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.role", is("STAFF")))
                .andExpect(jsonPath("$.data.email", is("staff.member@example.com")));

        // Verify Staff was created in DB
        User staffInDb = userRepository.findByEmail("staff.member@example.com").orElse(null);
        assertThat(staffInDb).isNotNull();
        assertThat(staffInDb.getRole()).isEqualTo(Role.STAFF);
    }

    @Test
    @DisplayName("Role-based Access - Listing users allowed for ADMIN and STAFF, forbidden for CUSTOMER")
    void testUserListingPermissions() throws Exception {
        // Customer login
        User customer = new User("Customer Dan", "dan@example.com",
                passwordEncoder.encode("DanPassword@123"), Role.CUSTOMER, UserStatus.ACTIVE);
        userRepository.save(customer);

        LoginRequest custLogin = new LoginRequest("dan@example.com", "DanPassword@123");
        MvcResult custResult = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(custLogin)))
                .andExpect(status().isOk())
                .andReturn();
        AuthResponse custAuth = objectMapper.readValue(custResult.getResponse().getContentAsString(), AuthResponse.class);

        // Customer gets 403 Forbidden on GET /api/users
        mockMvc.perform(get("/api/users")
                        .header("Authorization", "Bearer " + custAuth.getToken()))
                .andExpect(status().isForbidden());

        // Admin gets 200 OK on GET /api/users
        LoginRequest adminLogin = new LoginRequest("admin@subscription.com", "Admin@12345");
        MvcResult adminResult = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(adminLogin)))
                .andExpect(status().isOk())
                .andReturn();
        AuthResponse adminAuth = objectMapper.readValue(adminResult.getResponse().getContentAsString(), AuthResponse.class);

        mockMvc.perform(get("/api/users")
                        .header("Authorization", "Bearer " + adminAuth.getToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data", hasSize(greaterThanOrEqualTo(2))));
    }

    @Test
    @DisplayName("Password Reset Flow - Forgot password, token validation, reset and login with new password")
    void testPasswordResetFlow() throws Exception {
        // 1. Request forgot password
        ForgotPasswordRequest forgotReq = new ForgotPasswordRequest("admin@subscription.com");
        mockMvc.perform(post("/api/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(forgotReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)));

        // Retrieve token from database
        User admin = userRepository.findByEmail("admin@subscription.com").orElseThrow();
        PasswordResetToken tokenRecord = tokenRepository.findAll().stream()
                .filter(t -> t.getUser().getId().equals(admin.getId()) && !t.isUsed())
                .findFirst()
                .orElse(null);
        assertThat(tokenRecord).isNotNull();
        assertThat(tokenRecord.isExpired()).isFalse();

        // 2. Perform password reset with valid token
        ResetPasswordRequest resetReq = new ResetPasswordRequest(tokenRecord.getToken(), "NewAdminSecret@2026");
        mockMvc.perform(post("/api/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(resetReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.message", containsString("Password has been reset successfully")));

        // 3. Re-using the same token should fail
        mockMvc.perform(post("/api/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(resetReq)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success", is(false)));

        // 4. Old password should fail to log in
        LoginRequest oldLogin = new LoginRequest("admin@subscription.com", "Admin@12345");
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(oldLogin)))
                .andExpect(status().isUnauthorized());

        // 5. New password should successfully log in
        LoginRequest newLogin = new LoginRequest("admin@subscription.com", "NewAdminSecret@2026");
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(newLogin)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token", notNullValue()));
    }

    @Test
    @DisplayName("Logout endpoint acknowledged")
    void testLogout() throws Exception {
        mockMvc.perform(post("/api/auth/logout"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)));
    }
}
