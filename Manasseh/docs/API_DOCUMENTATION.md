# Subscription Management System - Module 2 API Documentation

## Overview
Module 2 is responsible for:
1. **Product & Configurable Variant Management**
2. **Subscription Plan Management** (with strict availability windows & auto-closure policies)
3. **Quotation Management** (reusable templates, line item pricing, taxes, and subscription conversion)
4. **Subscription Lifecycle Management** (`DRAFT → QUOTATION → CONFIRMED → ACTIVE → CLOSED`, pausing/resuming, renewals, and accurate billing dates for Module 3 invoice generation)

Base URL: `http://localhost:8080`  
Standard JSON Response Envelope:
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... },
  "timestamp": "2026-10-31T11:30:00"
}
```

---

## 1. Product & Variant Endpoints (`/api/products`)

### `GET /api/products`
Retrieves products with optional search and filters.
- **Query Parameters**:
  - `search` (string, optional): Fuzzy search by product name or notes.
  - `type` (string, optional): `PHYSICAL`, `DIGITAL`, or `SERVICE`.
  - `available` (boolean, optional): `true` or `false`.
- **Response**: Array of `ProductDTO`.

### `GET /api/products/{id}`
Retrieves a single product with all its associated variants.

### `POST /api/products`
Creates a new product.
- **Request Body**:
```json
{
  "name": "Enterprise Cloud Backup",
  "type": "DIGITAL",
  "salesPrice": 1200.00,
  "costPrice": 450.00,
  "notes": "Automated offsite backup with AES-256 encryption.",
  "isAvailable": true
}
```
- **Validation**:
  - `name`: Required, non-blank.
  - `type`: Required (`PHYSICAL`, `DIGITAL`, `SERVICE`).
  - `salesPrice`: Required, strictly `> 0.00`.
  - `costPrice`: Required, `>= 0.00`.

### `PUT /api/products/{id}`
Updates product details.

### `PATCH /api/products/{id}/availability`
Toggles active availability status of the product.

### `DELETE /api/products/{id}`
Deletes a product and cascades to its variants.

---

### Product Variants Sub-resource (`/api/products/{productId}/variants`)

### `GET /api/products/{productId}/variants`
Retrieves all configured variants for a product.

### `POST /api/products/{productId}/variants`
Adds a variant with a configurable price adjustment.
- **Example: Brand variant adding 560.00**:
```json
{
  "variantName": "Enterprise Brand Edition",
  "variantType": "BRAND",
  "variantValue": "Acme Enterprise",
  "priceAdjustment": 560.00,
  "sku": "ECB-BRAND-560",
  "stockQuantity": 9999,
  "isAvailable": true
}
```
- **Effective Price**: Evaluated as `product.salesPrice + variant.priceAdjustment` ($1200 + $560 = $1760.00).

### `PUT /api/products/{productId}/variants/{variantId}`
Updates variant attributes, price adjustment, or stock.

### `DELETE /api/products/{productId}/variants/{variantId}`
Removes a product variant.

---

## 2. Subscription Plan Endpoints (`/api/plans`)

### `GET /api/plans`
Retrieves plans with optional filtering.
- **Query Parameters**:
  - `search` (string, optional): Search by plan name or code.
  - `interval` (string, optional): `DAILY`, `WEEKLY`, `MONTHLY`, `YEARLY`.
  - `status` (string, optional): `ACTIVE`, `INACTIVE`, `ARCHIVED`.

### `GET /api/plans/available`
Retrieves only plans that are strictly `ACTIVE` and whose availability window includes the current date (`availabilityStartDate <= today <= availabilityEndDate`).

### `POST /api/plans`
Creates a subscription plan.
- **Request Body**:
```json
{
  "planName": "Professional Monthly SaaS",
  "planCode": "PLAN-PRO-M",
  "description": "Monthly subscription covering cloud backup and DevOps SLA.",
  "price": 1999.00,
  "billingInterval": "MONTHLY",
  "minimumQuantity": 1,
  "availabilityStartDate": "2026-01-01",
  "availabilityEndDate": "2027-12-31",
  "autoClose": false,
  "autoCloseAfterCycles": null,
  "status": "ACTIVE",
  "productIds": [1, 3]
}
```
- **Validation**:
  - `planCode`: Unique.
  - `billingInterval`: Must be one of `DAILY`, `WEEKLY`, `MONTHLY`, `YEARLY`.
  - `price`: `> 0.00`.
  - `minimumQuantity`: `>= 1`.
  - `availabilityEndDate` must be `>= availabilityStartDate`.

### `PATCH /api/plans/{id}/status?status={ACTIVE|INACTIVE|ARCHIVED}`
Updates the plan lifecycle status. Inactive plans are blocked from customer quotation/subscription.

---

## 3. Quotation Endpoints (`/api/quotations`)

### `GET /api/quotations`
Lists sales quotations with search, customer, and status filters.

### `POST /api/quotations`
Creates a quotation. Validates that the selected plan is active and available today.
- **Request Body**:
```json
{
  "customerId": 1,
  "customerName": "Acme Innovations Ltd",
  "customerEmail": "alice@acmeinnovations.com",
  "planId": 1,
  "quotationDate": "2026-10-31",
  "validUntil": "2026-11-30",
  "paymentTerms": "NET_30",
  "notes": "Standard commercial proposal.",
  "lines": [
    {
      "productId": 1,
      "variantId": 2,
      "quantity": 1,
      "unitPrice": 1760.00,
      "taxRate": 10.00
    }
  ]
}
```

### `POST /api/quotations/{id}/convert`
**Converts an ACCEPTED quotation into an active subscription.**
- Creates a new Subscription in `CONFIRMED` status with identical lines, pricing, and terms.
- Advances quotation status to `CONVERTED`.
- Sets initial `nextBillingDate` equal to `startDate` (ready for Module 3 invoice generation).

### `GET /api/quotations/templates`
Retrieves standardized quotation templates.

---

## 4. Subscription Lifecycle Endpoints (`/api/subscriptions`)

### Lifecycle State Machine Rules
```
                ┌───────────────┐
                │     DRAFT     │
                └───────┬───────┘
                        │
                ┌───────▼───────┐
                │   QUOTATION   │
                └───────┬───────┘
                        │
                ┌───────▼───────┐
                │   CONFIRMED   │
                └───────┬───────┘
                        │
                ┌───────▼───────┐ ◄────── (Resume) ──────┐
                │    ACTIVE     ├───────────────────────►│  PAUSED  │
                └───────┬───────┘ ────── (Pause) ───────►└─────┬────┘
                        │                                      │
                        │ (Close / Auto-Close / Terminate)     │
                        ▼                                      ▼
                ┌───────────────────────────────────────────────┐
                │                    CLOSED                     │
                └───────────────────────────────────────────────┘
```

### `GET /api/subscriptions`
Lists subscriptions with search, status, and customer filters.

### `GET /api/subscriptions/{id}`
Returns full subscription details, line items, and audit history (`subscription_history`).

### `POST /api/subscriptions/{id}/activate`
Transitions from `CONFIRMED` to `ACTIVE`.

### `POST /api/subscriptions/{id}/pause`
Transitions an `ACTIVE` subscription to `PAUSED`.
- **Request Body**: `{"reason": "Customer requested hold"}`

### `POST /api/subscriptions/{id}/resume`
Resumes a `PAUSED` subscription back to `ACTIVE`.

### `POST /api/subscriptions/{id}/renew`
Renews an `ACTIVE` subscription:
- Extends `expiryDate` by the plan's `billingInterval`.
- Advances `nextBillingDate` accurately for Module 3.
- Increments `billingCyclesCompleted`.

### `POST /api/subscriptions/{id}/close`
Performs early closure / termination. Transitions to `CLOSED` and records `closedAt` timestamp and reason.

### `POST /api/subscriptions/process-auto-close`
On-demand trigger for the automated plan closure policy. Evaluates active subscriptions against expiration dates and cycle limits.

---

## 5. Module 3 Billing Integration Handoff
Module 3 (Billing & Invoicing) queries subscriptions where:
`status = 'ACTIVE' AND nextBillingDate <= CURRENT_DATE`
Module 2 guarantees:
- `nextBillingDate` is calculated and maintained based on `billingInterval` (`DAILY`, `WEEKLY`, `MONTHLY`, `YEARLY`).
- Accurate `subtotal`, `taxTotal`, `totalAmount`, `paymentTerms`, and line item breakdowns are stored.
- Invoice generation and payment processing remain strictly the responsibility of Module 3.
