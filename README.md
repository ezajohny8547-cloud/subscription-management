# Subscription Management System - Module 3: Invoicing, Recurring Billing, Tax, Discounts & Payments

Welcome to **Module 3** of the shared Subscription Management System. This module is responsible for the complete financial lifecycle: invoice creation and management, recurring subscription billing, tax calculations, promotional discounts, payment recording and allocations, and invoice status and overdue tracking.

---

## 1. Compliance with System Architecture & Rules

- **Fixed Technology Stack:**
  - Frontend: React + Vite + JavaScript
  - Styling: Standard CSS with custom design system variables
  - Backend: Java 17 + Spring Boot 3.2+
  - Build Tool: Maven
  - Database: MySQL 8.0+ (`subscription_management`)
  - API Protocol: REST + JSON with camelCase fields
  - Backend Base Package: `com.subscription`
- **Mandatory Shared Design System:**
  - Font: Inter
  - Typography: Page title (24px, 700), Section heading (20px, 600), Card heading (16px, 600), Body (14px, 400), Labels (13px, 500), Buttons (14px, 600), Helper text (12px, 400)
  - Color Palette: Main Background `#F5EDE0`, Card `#FFFBF5`, Secondary Background `#EAD9C3`, Primary Text `#3B2A1E`, Secondary Text `#7A5C46`, Borders `#C7AE8F`, Primary Accent `#6E2A3A`, Success `#2C4A3B`, Highlight `#C4972F`, Secondary Accent `#A9684F`
  - Radii: 12px panel radius, 8px button radius
- **Module Independence & Integration:**
  - Uses shared models (`Customer`, `Subscription`, `Product`) from Modules 1 & 2 without duplicating them.
  - Does not overwrite or recreate `App.jsx`, `main.jsx`, `package.json`, or global navigations.
  - Exposes `/api/invoices/summary` and `/api/payments/summary` for immediate dashboard integration.

---

## 2. Implemented Features

### 1. Invoice Management
- Full invoice data model with unique invoice number generation (`INV-YYYYMM-XXXX`).
- Customer snapshots (name, email, billing address).
- Subscription linking, invoice dates, due dates, billing periods.
- Dynamic product line items with unit prices, quantities, subtotal, discounts, and taxes.
- Complete financial record preservation with status progression: `DRAFT` → `CONFIRMED` → `PAID` (and cancellation where permitted).
- Confirmation, cancellation, sending, and print/export layouts.

### 2. Recurring Billing Engine
- Identifies active subscriptions due for billing across `DAILY`, `WEEKLY`, `MONTHLY`, and `YEARLY` intervals.
- Generates invoices atomically in `CONFIRMED` status.
- Uses `billing_period_records` with a unique database constraint `(subscription_id, period_start, period_end)` to guarantee **zero duplicate billing**.
- Advances `nextBillingDate` to ensure legitimately due subscriptions are never skipped.
- Background scheduler `BillingScheduler` with configurable cron expression (`billing.cron`).
- Manual operator trigger endpoint (`POST /api/invoices/billing/trigger-run`).

### 3. Configurable Tax & Discount Calculations
- Configurable tax rules (`TaxRule`) by country and state; dynamically computes tax breakdowns without hardcoding rates.
- Comprehensive discount rules (`Discount`) supporting:
  - Fixed-amount and percentage discounts
  - Minimum purchase amount and minimum item quantity
  - Start and end validity dates
  - Usage caps (`maxUsageCount`) with optimistic/pessimistic concurrency protection
  - Product-specific and subscription-specific restrictions
- Accurate decimal precision using Java `BigDecimal` (`HALF_UP`, scale 2).

### 4. Payment Management & Allocations
- Records payments against confirmed invoices (`CREDIT_CARD`, `BANK_TRANSFER`, `CASH`, `CHECK`, `ONLINE_GATEWAY`, `OTHER`).
- Supports multiple partial payments.
- Strict ledger integrity: `Outstanding balance = Total payable − Total payments allocated`.
- Prohibits overpayment (`amount > outstandingBalance`), zero/negative amounts, and duplicate transaction references.
- Automatically marks invoices as `PAID` once the outstanding balance reaches `$0.00`.

### 5. Status & Overdue Tracking
- Filterable views for: Draft, Confirmed, Paid, Partially Paid, Unpaid, and Overdue invoices.
- Automated overdue detection based on reference date and due date.
- Summary API endpoints for dashboard widgets and executive summaries.

---

## 3. Project File Structure

```
├── backend/
│   ├── pom.xml                                // Maven configuration
│   └── src/
│       ├── main/
│       │   ├── java/com/subscription/
│       │   │   ├── SubscriptionApplication.java
│       │   │   ├── common/                    // DTOs and global exception handling
│       │   │   ├── model/                     // Shared models (Customer, Product, Subscription)
│       │   │   ├── repository/                // Shared repositories
│       │   │   ├── billing/                   // Module 3 Billing & Invoicing
│       │   │   │   ├── entity/                // Invoice, InvoiceLine, TaxRule, Discount, etc.
│       │   │   │   ├── repository/
│       │   │   │   ├── dto/
│       │   │   │   ├── service/               // InvoiceService, DiscountService, RecurringBillingService
│       │   │   │   ├── scheduler/             // BillingScheduler
│       │   │   │   └── controller/            // InvoiceController, DiscountController, TaxRuleController
│       │   │   └── payment/                   // Module 3 Payments
│       │   │       ├── entity/                // Payment, PaymentMethod, PaymentRecordStatus
│       │   │       ├── repository/
│       │   │       ├── dto/
│       │   │       ├── service/               // PaymentService
│       │   │       └── controller/            // PaymentController
│       │   └── resources/
│       │       ├── application.yml
│       │       ├── application-test.yml
│       │       └── schema.sql                 // Unified database DDL and seed data
│       └── test/java/com/subscription/
│           ├── billing/
│           │   ├── InvoiceCalculationTest.java         // Totals, tax, discounts, BigDecimal
│           │   ├── DuplicateBillingPreventionTest.java // Recurring intervals, deduplication
│           │   └── DiscountLimitAndConcurrencyTest.java // Usage limits, caps, expiration
│           └── payment/
│               └── PartialPaymentAndOverpaymentTest.java // Partial payments, overpayment rejection
│
├── frontend/
│   └── src/
│       ├── pages/
│       │   ├── Invoices.jsx                   // Invoice list, tabs, quick pay, modals
│       │   ├── InvoiceDetails.jsx             // Detailed printable invoice view
│       │   ├── Discounts.jsx                  // Discount rules management and live tester
│       │   └── Payments.jsx                   // Payments table and allocation recorder
│       ├── services/
│       │   ├── apiClient.js                   // Shared fetch/REST client
│       │   ├── invoiceService.js
│       │   ├── discountService.js
│       │   └── paymentService.js
│       └── styles/
│           └── design-system.css              // Mandatory design system standard CSS
│
├── database/
│   └── schema.sql                             // MySQL schema DDL & seed script
│
├── docs/
│   ├── API_DOCUMENTATION.md                   // REST API JSON contract documentation
│   ├── DATABASE_SCHEMA.md                     // Entity-relationship and table dictionary
│   └── SETUP_AND_TESTING.md                   // Build, run, and testing walkthroughs
└── README.md
```

---

## 4. Verification & Testing

Module 3 includes 4 dedicated integration test suites matching all criteria:
- `mvn test` executes all test cases verifying:
  1. Duplicate billing prevention and interval cycle progression.
  2. Partial payments and overpayment rejection.
  3. Discount caps, expiration, minimum purchase, and quantity rules.
  4. Invoice calculations, tax rules, and status transitions.

For step-by-step instructions, see [`docs/SETUP_AND_TESTING.md`](docs/SETUP_AND_TESTING.md) and [`docs/API_DOCUMENTATION.md`](docs/API_DOCUMENTATION.md).
