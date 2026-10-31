# Subscription Management System - Module 2 Setup & Testing Guide

## 1. Environment & Prerequisites
- **Java**: JDK 17 or higher (`java -version`)
- **Maven**: 3.8+ (`mvn -version`)
- **Node.js**: 18+ & npm (`node -v`)
- **MySQL**: 8.0+ / MariaDB (Running on `localhost:3306`)
- **Base Package**: `com.subscription`
- **Database**: `subscription_management`

---

## 2. Database Initialization
1. Ensure your local MySQL server is started (e.g. via XAMPP or native service).
2. Execute the schema script located at `database/schema.sql`:
```bash
mysql -u root -p < database/schema.sql
```
*(If no password is set, simply press Enter when prompted).*

This creates the `subscription_management` database with tables:
- `products`, `product_variants`
- `plans`, `plan_products`
- `quotation_templates`, `quotations`, `quotation_lines`
- `subscriptions`, `subscription_lines`, `subscription_history`
- Shared references: `customers`, `users`

It also inserts initial seed data demonstrating products, brand variants (with +560.00 configurable adjustment), active/expired plans, quotations, and subscriptions.

---

## 3. Backend Execution & Unit Tests

### Running the Unit Tests
Navigate to the `backend` folder and run Maven test:
```bash
cd backend
mvn clean test
```
All unit tests in:
- `com.subscription.product.ProductServiceTest`
- `com.subscription.subscription.PlanServiceTest`
- `com.subscription.subscription.SubscriptionLifecycleTest`
will execute and verify price validation, configurable variant additions, plan availability guards, and status transitions.

### Running the Spring Boot Application
```bash
mvn spring-boot:run
```
The server will start on port `8080`.
Verify health by accessing:
`http://localhost:8080/api/products`

---

## 4. Frontend Integration Guide (For Team Member 1)

Module 2 provides clean, self-contained components in `frontend/src/pages/` and services in `frontend/src/services/`.

In the main application (`App.jsx`), configure routes to point to Module 2 pages:

```jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import {
  Products,
  ProductDetails,
  ProductVariants,
  Plans,
  Quotations,
  QuotationForm,
  Subscriptions,
  SubscriptionDetails
} from './pages';
import './styles/design-system.css';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/products" element={<Products />} />
        <Route path="/products/:productId" element={<ProductDetails />} />
        <Route path="/products/:productId/variants" element={<ProductVariants />} />
        <Route path="/plans" element={<Plans />} />
        <Route path="/quotations" element={<Quotations />} />
        <Route path="/quotations/new" element={<QuotationForm />} />
        <Route path="/quotations/:quotationId/edit" element={<QuotationForm />} />
        <Route path="/subscriptions" element={<Subscriptions />} />
        <Route path="/subscriptions/:subscriptionId" element={<SubscriptionDetails />} />
        <Route path="*" element={<Navigate to="/subscriptions" replace />} />
      </Routes>
    </Router>
  );
}
```

---

## 5. End-to-End Verification Scenarios

### Scenario 1: Product & Configurable Brand Variant
1. Open the **Products** page (`/products`).
2. Click **+ Add New Product** and enter:
   - Name: `High-Performance Edge Firewall`
   - Type: `PHYSICAL`
   - Sales Price: `3500.00`
   - Cost Price: `1800.00`
3. Click **Manage Variants** on the newly created product.
4. Add a Brand variant:
   - Name: `Brand Enterprise Pro`
   - Type: `BRAND`
   - Value: `Fortinet-Certified`
   - Price Adjustment: `560.00` (Configurable brand amount)
5. **Verify**: Total effective price evaluates to `$4060.00` ($3500.00 + $560.00).

### Scenario 2: Plan Availability & Customer Selection Protection
1. Open the **Plans** page (`/plans`).
2. Inspect the existing `Legacy Starter Plan (Retired)` (Status: `INACTIVE`, Expiry in 2025).
3. Try creating a quotation using this plan:
   - **Expected Result**: System rejects the selection with error: `"Plan is not active. Customers cannot select inactive plans."`
4. Select `Professional Monthly SaaS` (Status: `ACTIVE`, valid until 2027).
   - **Expected Result**: Selection succeeds and reveals minimum quantity threshold (1 unit).

### Scenario 3: Quotation Creation & Conversion to Subscription
1. Open **Quotations** (`/quotations`) and click **+ Create New Quotation**.
2. Select Customer `Acme Innovations Ltd` and Plan `Professional Monthly SaaS`.
3. Add a product line with the Brand variant (+560.00) configured in Scenario 1.
4. Set Tax Rate to `10.00%`.
5. Save the quotation. Notice its initial status is `DRAFT`.
6. Click **Mark Sent**, then click **Accept**.
7. Once `ACCEPTED`, click **Convert to Sub**.
8. **Verify**:
   - A new Subscription is generated with status `CONFIRMED`.
   - The quotation is marked `CONVERTED`.
   - All line items, taxes, and customer links are intact.

### Scenario 4: Full Subscription Lifecycle Progression
1. Open **Subscription Details** (`/subscriptions/{id}`).
2. Verify the visual timeline stepper displays:
   `DRAFT` → `QUOTATION` → `CONFIRMED` → `ACTIVE` → `CLOSED`
3. Click **Activate Subscription**:
   - State moves from `CONFIRMED` to `ACTIVE`.
   - An audit log entry is written to `subscription_history`.
4. Click **Pause Subscription**:
   - Status updates to `PAUSED`.
5. Click **Resume Subscription**:
   - Status transitions back to `ACTIVE`.
6. Click **Renew Subscription**:
   - Expiry date is extended by 1 month.
   - `billingCyclesCompleted` increments to 1.
   - `nextBillingDate` advances accurately for Module 3 invoice generation.
7. Click **Early Close**:
   - Enter reason: "Client completed project ahead of schedule."
   - Status becomes `CLOSED` (terminal state).
   - Verify subsequent attempts to activate or pause are blocked by `InvalidStateTransitionException`.

### Scenario 5: Automated Plan Closure Policy
1. In `Plans`, set a plan with `autoClose = true` and `autoCloseAfterCycles = 1`.
2. When a subscription completes 1 cycle, call:
   `POST /api/subscriptions/process-auto-close` (or wait for the daily scheduler).
3. **Verify**: The subscription is automatically moved to `CLOSED` with audit rationale:
   `"Automatic closure: Maximum billing cycles (1) completed."`
