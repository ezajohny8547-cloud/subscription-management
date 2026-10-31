# Setup, Deployment & Testing Guide

This guide walks through configuring, building, running, and testing Module 3 (Billing, Invoicing, Tax, Discounts, Payments & Recurring Billing) of the Subscription Management System.

---

## 1. Prerequisites

- **Java Development Kit (JDK):** Version 17 or higher
- **Build Tool:** Apache Maven 3.8+
- **Database:** MySQL 8.0+
- **Frontend Environment:** Node.js 18+ and npm / pnpm
- **Base Package:** `com.subscription`

---

## 2. Database Setup

1. Start your local or containerized MySQL server.
2. Initialize the `subscription_management` database and execute the schema DDL script:

```bash
# Using MySQL CLI:
mysql -u root -p < backend/src/main/resources/schema.sql
```

Or execute `schema.sql` via MySQL Workbench / phpMyAdmin / DBeaver.

The schema script will automatically:
- Create the database `subscription_management` if it does not exist.
- Create shared tables from Modules 1 & 2 (`customers`, `products`, `subscriptions`).
- Create Module 3 tables (`tax_rules`, `discounts`, `invoices`, `invoice_lines`, `payments`, `payment_allocations`, `discount_usages`, `billing_period_records`).
- Seed standard tax rules, sample discount rules, sample customers, products, and subscriptions.

---

## 3. Backend Configuration & Execution

### 3.1. Database Connection Configuration
Check `backend/src/main/resources/application.yml` and adjust credentials if needed:

```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/subscription_management?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true
    username: ${DB_USERNAME:root}
    password: ${DB_PASSWORD:root}
```

### 3.2. Automated Recurring Billing Scheduler Configuration
The scheduler automatically runs the recurring billing cycle daily at 2:00 AM by default:

```yaml
billing:
  # Cron expression: Seconds Minutes Hours DayOfMonth Month DayOfWeek
  cron: "0 0 2 * * ?"
  enabled: true
```

To change frequency during testing (e.g., every 5 minutes):
```yaml
billing:
  cron: "0 */5 * * * ?"
```

### 3.3. Build & Run the Backend
From the `backend/` directory:

```bash
# Build the project
mvn clean package -DskipTests

# Run the Spring Boot application
mvn spring-boot:run
```

The application starts on `http://localhost:8080`.

---

## 4. Running the Automated Tests

Module 3 includes comprehensive automated unit and integration tests executing against an in-memory MySQL-mode H2 database:

To run all tests:
```bash
mvn test
```

### Included Test Suites:

1. **`InvoiceCalculationTest`** (`com.subscription.billing.InvoiceCalculationTest`):
   - Verifies invoice subtotal calculation across multiple line items.
   - Verifies percentage-based discount calculation (e.g. 20% off).
   - Verifies fixed-amount discount calculation (e.g. $15.00 off).
   - Verifies net taxable calculation and configurable tax rule calculation with `BigDecimal` precision.
   - Verifies invoice status transitions (`DRAFT` → `CONFIRMED`).

2. **`DuplicateBillingPreventionTest`** (`com.subscription.billing.DuplicateBillingPreventionTest`):
   - Validates that subscriptions due for billing generate invoices for the current period.
   - Verifies that running recurring billing again for the same period safely detects and skips duplicate invoices.
   - Verifies that database uniqueness constraints (`uk_sub_period`) prevent duplicate billing under concurrent retries.
   - Validates that cancelled/ineligible subscriptions are never billed.
   - Tests interval periods for `DAILY`, `WEEKLY`, `MONTHLY`, and `YEARLY` subscriptions.

3. **`DiscountLimitAndConcurrencyTest`** (`com.subscription.billing.DiscountLimitAndConcurrencyTest`):
   - Validates that discounts stop applying once `maxUsageCount` is reached.
   - Verifies rejection of expired discounts (outside start/end date window).
   - Verifies minimum purchase amount and minimum quantity rules.
   - Validates product-specific and subscription-specific discount restrictions.

4. **`PartialPaymentAndOverpaymentTest`** (`com.subscription.payment.PartialPaymentAndOverpaymentTest`):
   - Validates partial payments: multiple payments sequentially reducing the outstanding balance.
   - Verifies that when `outstandingBalance` reaches `$0.00`, status transitions automatically to `PAID`.
   - Verifies that overpayments (`paymentAmount > outstandingBalance`) are strictly rejected.
   - Verifies rejection of zero or negative payment amounts.
   - Verifies duplicate payment reference prevention.

---

## 5. Frontend Integration & Usage

### 5.1. File Structure
The required Module 3 files are:
- `frontend/src/pages/Invoices.jsx`
- `frontend/src/pages/InvoiceDetails.jsx`
- `frontend/src/pages/Discounts.jsx`
- `frontend/src/pages/Payments.jsx`
- `frontend/src/services/invoiceService.js`
- `frontend/src/services/discountService.js`
- `frontend/src/services/paymentService.js`
- `frontend/src/services/apiClient.js`
- `frontend/src/styles/design-system.css`

### 5.2. Routing Integration
To connect Module 3 into your application's router (e.g. React Router), import the pages:

```jsx
import Invoices from './pages/Invoices';
import InvoiceDetails from './pages/InvoiceDetails';
import Discounts from './pages/Discounts';
import Payments from './pages/Payments';

// Example React Router routes:
<Route path="/invoices" element={<Invoices onNavigateToDetails={(id) => navigate(`/invoices/${id}`)} />} />
<Route path="/invoices/:id" element={<InvoiceDetails invoiceId={params.id} onBack={() => navigate('/invoices')} />} />
<Route path="/discounts" element={<Discounts />} />
<Route path="/payments" element={<Payments onNavigateToInvoice={(id) => navigate(`/invoices/${id}`)} />} />
```

---

## 6. End-to-End Walkthrough of Key Workflows

### Workflow 1: Create, Confirm, and Settle an Invoice
1. Navigate to **Invoices** (`/invoices`).
2. Click **+ Create Draft Invoice**.
3. Select Customer ID (e.g. `1`), enter product line items, and optionally provide discount code `WELCOME10`.
4. Click **Create Draft Invoice**. The invoice appears in `DRAFT` status.
5. Click **View** to inspect details, then click **Confirm Invoice**. Status changes to `CONFIRMED`.
6. Click **Record Payment**, enter a partial amount (e.g. `$50.00`). Status reflects `CONFIRMED` with badge `PARTIAL`.
7. Record the second installment for the remaining outstanding balance. Status automatically transitions to `PAID`.

### Workflow 2: Automated Recurring Billing Run
1. Ensure active subscriptions exist with `nextBillingDate <= today`.
2. Either wait for the scheduled background job (`@Scheduled` cron) or navigate to **Invoices** and click **Recurring Billing Run** → **Execute Billing Cycle Now**.
3. Review the execution summary: generated invoices count, skipped duplicates count, and newly created invoice numbers.
4. Verify in the database that `billing_period_records` has captured the cycle, and the subscription's `next_billing_date` has advanced to the next interval.

### Workflow 3: Discount Rule Creation and Validation
1. Navigate to **Discounts** (`/discounts`).
2. Click **+ Create Discount Rule**, enter code (e.g. `PROMO50`), 50% discount, max usage limit of `5`.
3. Use the **Test Discount Evaluation Engine** box at the bottom of the page to simulate applying `PROMO50` on a `$120.00` subtotal to verify instant deduction calculation.
