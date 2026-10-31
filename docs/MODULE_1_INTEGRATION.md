# Module 1: Authentication & User Management — Integration & API Guide

## 1. Overview & Architectural Boundaries

Module 1 establishes the security foundation, role-based authorization, session management, and user governance for the shared **Subscription Management System**.

This module is designed strictly according to the agreed multi-module architecture:
- Base Java Package: `com.subscription.auth`
- Database: `subscription_management`
- Roles Supported: `ADMIN`, `STAFF`, `CUSTOMER`
- Authentication Mechanism: Stateless Spring Security 6 with JSON Web Tokens (JWT)
- Password Policy: Hashed with BCrypt (strength 10), minimum 9 characters (> 8), at least one uppercase letter, one lowercase letter, and one special character.
- Design System: Exact tokens mapped to CSS variables (`variables.css` and `auth.css`), 12px panel radius, 8px button radius.

---

## 2. Mandatory Design System Tokens

All Module 1 views strictly consume the shared `:root` variables:

```css
:root {
  --color-background: #F5EDE0;
  --color-card: #FFFBF5;
  --color-secondary-background: #EAD9C3;
  --color-text-primary: #3B2A1E;
  --color-text-secondary: #7A5C46;
  --color-border: #C7AE8F;
  --color-primary: #6E2A3A;
  --color-success: #2C4A3B;
  --color-highlight: #C4972F;
  --color-secondary-accent: #A9684F;
  --font-family: 'Inter', sans-serif;
  --font-size-title: 24px;
  --font-size-heading: 20px;
  --font-size-body: 14px;
  --font-size-label: 13px;
  --font-size-small: 12px;
  --radius-panel: 12px;
  --radius-button: 8px;
}
```

---

## 3. Database Schema & Migration

Database file: `database/schema.sql`
Target Database: `subscription_management`

### Setup Command:
```bash
mysql -u root -p < database/schema.sql
```

### Table Definitions:

#### `users` Table
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `BIGINT` | `AUTO_INCREMENT, PRIMARY KEY` | Unique User ID |
| `full_name` | `VARCHAR(100)` | `NOT NULL` | User's full display name |
| `email` | `VARCHAR(150)` | `NOT NULL, UNIQUE` | Unique login email |
| `password_hash`| `VARCHAR(255)` | `NOT NULL` | BCrypt password hash |
| `role` | `ENUM('ADMIN', 'STAFF', 'CUSTOMER')` | `NOT NULL, DEFAULT 'CUSTOMER'` | Account authority level |
| `status` | `ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED')`| `NOT NULL, DEFAULT 'ACTIVE'` | Operational status |
| `created_at` | `TIMESTAMP` | `DEFAULT CURRENT_TIMESTAMP` | Account creation time |
| `updated_at` | `TIMESTAMP` | `ON UPDATE CURRENT_TIMESTAMP` | Last updated time |

#### `password_reset_tokens` Table
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `BIGINT` | `AUTO_INCREMENT, PRIMARY KEY` | Unique record ID |
| `token` | `VARCHAR(100)` | `NOT NULL, UNIQUE` | Cryptographic UUID reset token |
| `user_id` | `BIGINT` | `NOT NULL, FK -> users(id) ON DELETE CASCADE`| Target user |
| `expiry_date` | `TIMESTAMP` | `NOT NULL` | Expiration (15 minutes window) |
| `used` | `BOOLEAN` | `NOT NULL, DEFAULT FALSE` | Flag preventing replay attacks |
| `created_at` | `TIMESTAMP` | `DEFAULT CURRENT_TIMESTAMP` | Issuance timestamp |

### Initial Seed Administrator:
- **Email**: `admin@subscription.com`
- **Password**: `Admin@12345`
- **Role**: `ADMIN`

---

## 4. REST API Documentation

All request and response payloads use `application/json` with standard `camelCase` properties.

### 4.1 Register Account
- **Endpoint**: `POST /api/auth/register`
- **Access**: Public
- **Request Body**:
```json
{
  "fullName": "Jane Doe",
  "email": "jane.doe@example.com",
  "password": "Password@123"
}
```
- **Validation**:
  - `fullName`: Required, 2-100 characters.
  - `email`: Required, valid email format, unique in database.
  - `password`: Required, >8 chars, 1 uppercase, 1 lowercase, 1 special character.
- **Success Response** (`201 Created`):
```json
{
  "success": true,
  "message": "Registration successful. Please log in with your credentials.",
  "data": null,
  "timestamp": "2026-10-31T10:30:00Z"
}
```

### 4.2 Login
- **Endpoint**: `POST /api/auth/login`
- **Access**: Public
- **Request Body**:
```json
{
  "email": "admin@subscription.com",
  "password": "Admin@12345"
}
```
- **Success Response** (`200 OK`):
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsIn...",
  "tokenType": "Bearer",
  "userId": 1,
  "email": "admin@subscription.com",
  "fullName": "System Administrator",
  "role": "ADMIN"
}
```

### 4.3 Logout
- **Endpoint**: `POST /api/auth/logout`
- **Access**: Public / Authenticated
- **Success Response** (`200 OK`):
```json
{
  "success": true,
  "message": "Successfully logged out",
  "data": null,
  "timestamp": "2026-10-31T10:31:00Z"
}
```

### 4.4 Forgot Password
- **Endpoint**: `POST /api/auth/forgot-password`
- **Access**: Public
- **Request Body**:
```json
{
  "email": "jane.doe@example.com"
}
```
- **Behavior**: Generates a secure random 15-minute token, invalidates prior tokens for that user, and triggers email delivery. Raw tokens are never printed to application logs.
- **Success Response** (`200 OK`):
```json
{
  "success": true,
  "message": "If an account exists with this email, a password reset link has been dispatched.",
  "data": null,
  "timestamp": "2026-10-31T10:32:00Z"
}
```

### 4.5 Reset Password
- **Endpoint**: `POST /api/auth/reset-password`
- **Access**: Public
- **Request Body**:
```json
{
  "token": "4e75bb87-6fa8-48b2-b131-4ecda258673a",
  "newPassword": "NewPassword@2026"
}
```
- **Behavior**: Validates token existence, expiration, and unused status. Hashes new password with BCrypt and marks token as used.
- **Success Response** (`200 OK`):
```json
{
  "success": true,
  "message": "Password has been reset successfully. You can now log in.",
  "data": null,
  "timestamp": "2026-10-31T10:33:00Z"
}
```

### 4.6 List Users
- **Endpoint**: `GET /api/users`
- **Access**: Requires `ADMIN` or `STAFF` role (`Authorization: Bearer <token>`)
- **Success Response** (`200 OK`):
```json
{
  "success": true,
  "message": "User list retrieved successfully",
  "data": [
    {
      "userId": 1,
      "email": "admin@subscription.com",
      "fullName": "System Administrator",
      "role": "ADMIN",
      "status": "ACTIVE",
      "createdAt": "2026-10-31T10:00:00Z"
    }
  ],
  "timestamp": "2026-10-31T10:34:00Z"
}
```

### 4.7 Create Staff Member
- **Endpoint**: `POST /api/users/staff`
- **Access**: Strictly restricted to `ADMIN` role (`Authorization: Bearer <token>`)
- **Request Body**:
```json
{
  "fullName": "Support Staff Member",
  "email": "staff1@subscription.com",
  "password": "StaffPassword@123"
}
```
- **Success Response** (`201 Created`):
```json
{
  "success": true,
  "message": "Staff account created successfully",
  "data": {
    "userId": 2,
    "email": "staff1@subscription.com",
    "fullName": "Support Staff Member",
    "role": "STAFF",
    "status": "ACTIVE",
    "createdAt": "2026-10-31T10:35:00Z"
  },
  "timestamp": "2026-10-31T10:35:00Z"
}
```

### 4.8 Update User Status
- **Endpoint**: `PUT /api/users/{userId}/status`
- **Access**: Strictly restricted to `ADMIN` role (`Authorization: Bearer <token>`)
- **Request Body**:
```json
{
  "status": "INACTIVE"
}
```
- **Success Response** (`200 OK`):
```json
{
  "success": true,
  "message": "User status updated successfully",
  "data": {
    "userId": 2,
    "status": "INACTIVE"
  },
  "timestamp": "2026-10-31T10:36:00Z"
}
```

---

## 5. Integration Contract for Other Modules (Modules 2, 3, 4)

### 5.1 Backend Integration (Spring Security Context)

Modules 2, 3, and 4 (e.g., Subscription Plans, Billing, Invoicing) can extract the authenticated user anywhere in the Spring Boot application using Spring Security:

```java
import com.subscription.auth.security.UserPrincipal;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

// Inside any service or controller method:
Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

if (authentication != null && authentication.getPrincipal() instanceof UserPrincipal principal) {
    Long currentUserId = principal.getId();
    String currentUserEmail = principal.getUsername();
    Role role = principal.getRole();
    
    // Perform module operations linked to currentUserId...
}
```

#### Method-level Security Annotations:
Other modules can secure their endpoints directly with:
```java
@PreAuthorize("hasRole('ADMIN')")
@PostMapping("/api/subscriptions/plans")
public ResponseEntity<?> createPlan(...) { ... }

@PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
@GetMapping("/api/subscriptions/reports")
public ResponseEntity<?> getReports(...) { ... }

@PreAuthorize("isAuthenticated()")
@GetMapping("/api/subscriptions/my-subscriptions")
public ResponseEntity<?> getCustomerSubscriptions(...) { ... }
```

### 5.2 Frontend Integration (React + Vite)

#### Making Authenticated API Calls:
Other modules can import the shared `apiClient` which automatically attaches the `Authorization: Bearer <token>` header:

```javascript
import apiClient from '../services/apiClient';

// GET request
const plans = await apiClient.get('/subscriptions/plans');

// POST request
const subscription = await apiClient.post('/subscriptions/subscribe', {
  planId: 42,
  paymentMethodId: 'pm_xyz'
});
```

#### Checking User Permissions in React Components:
```javascript
import authService from '../services/authService';

const user = authService.getCurrentUser();
const isAdmin = authService.hasRole('ADMIN');
const isStaffOrAdmin = authService.hasRole(['ADMIN', 'STAFF']);
```

#### Protecting Routes:
Wrap module routes in `ProtectedRoute.jsx`:
```jsx
import { Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import UserManagement from './pages/UserManagement';

<Routes>
  {/* Available to any authenticated user */}
  <Route
    path="/dashboard"
    element={
      <ProtectedRoute>
        <DashboardPage />
      </ProtectedRoute>
    }
  />

  {/* Restricted to Admin only */}
  <Route
    path="/users"
    element={
      <ProtectedRoute allowedRoles={['ADMIN', 'STAFF']}>
        <UserManagement />
      </ProtectedRoute>
    }
  />
</Routes>
```

---

## 6. Environment Variables

| Variable | Default Value | Description |
|---|---|---|
| `SPRING_DATASOURCE_URL` | `jdbc:mysql://localhost:3306/subscription_management?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true` | MySQL JDBC connection string |
| `SPRING_DATASOURCE_USERNAME` | `root` | Database user |
| `SPRING_DATASOURCE_PASSWORD` | `root` | Database password |
| `JWT_SECRET` | `404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970` | 256-bit Hex secret key for HMAC-SHA256 |
| `JWT_EXPIRATION_MS` | `86400000` (24h) | JWT validity window |
| `JWT_RESET_EXPIRATION_MS` | `900000` (15m) | Password reset token expiration |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:5173,http://localhost:3000` | Allowed web origins |
| `VITE_API_BASE_URL` | `http://localhost:8080/api` | Frontend API target |

---

## 7. How to Run and Test

### 1. Database Setup
```bash
mysql -u root -p < database/schema.sql
```

### 2. Backend Execution
```bash
cd backend
mvn spring-boot:run
```
Backend will start on `http://localhost:8080`.

### 3. Frontend Execution
Ensure the frontend files are imported into your application router:
```bash
cd frontend
npm run dev
```
Navigate to `http://localhost:5173/login` or test login with the initial Administrator account:
- **Email**: `admin@subscription.com`
- **Password**: `Admin@12345`
