# Module 3: Invoicing, Billing & Payment API Documentation

This document defines the complete RESTful JSON API specifications for Module 3 (Billing, Invoicing, Tax, Discounts, Payments, and Recurring Billing Cycles) of the shared Subscription Management System.

All request and response payloads use **camelCase** JSON formatting according to the agreed architectural standard.

Base URL prefix: `/api`

---

## 1. Unified Response Envelope

All API responses are wrapped in a standard response envelope:

```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... },
  "timestamp": "2026-10-31T10:45:00"
}
```

When an error occurs:
```json
{
  "success": false,
  "message": "Overpayment rejected. Payment amount of $150.00 exceeds current outstanding balance of $100.00",
  "data": null,
  "timestamp": "2026-10-31T10:45:00"
}
```

---

## 2. Invoices API (`/api/invoices`)

### 2.1. List Invoices with Filter
`GET /api/invoices`

**Query Parameters:**
- `status` (optional): Filter by invoice status or payment tracking filter:
  - `DRAFT`: Draft invoices
  - `CONFIRMED`: Confirmed invoices
  - `PAID`: Fully paid invoices
  - `CANCELLED`: Cancelled invoices
  - `PARTIALLY_PAID`: Invoices with `amountPaid > 0` and `amountPaid < totalAmount`
  - `UNPAID`: Invoices with `amountPaid == 0` and `status == 'CONFIRMED'`
  - `OVERDUE`: Invoices with `status == 'CONFIRMED'`, `dueDate < CURRENT_DATE`, and `outstandingBalance > 0`
- `customerId` (optional, Long): Filter by customer ID
- `subscriptionId` (optional, Long): Filter by subscription ID

**Sample Response (`200 OK`):**
```json
{
  "success": true,
  "message": "Operation successful",
  "data": [
    {
      "id": 1,
      "invoiceNumber": "INV-202610-0001",
      "subscriptionId": 1,
      "subscriptionNumber": "SUB-2026-0001",
      "customerId": 1,
      "customerName": "Acme Corporation",
      "customerEmail": "billing@acme.com",
      "billingAddress": "100 Enterprise Way, Suite 400, San Francisco, CA",
      "invoiceDate": "2026-10-01",
      "dueDate": "2026-10-31",
      "billingPeriodStart": "2026-10-01",
      "billingPeriodEnd": "2026-10-31",
      "subtotal": 98.00,
      "taxRate": 10.00,
      "taxAmount": 9.80,
      "taxRuleName": "Standard VAT",
      "discountCode": null,
      "discountAmount": 0.00,
      "totalAmount": 107.80,
      "amountPaid": 50.00,
      "outstandingBalance": 57.80,
      "status": "CONFIRMED",
      "paymentStatus": "PARTIALLY_PAID",
      "overdue": false,
      "sentAt": "2026-10-02T09:30:00",
      "notes": "Automated recurring billing",
      "lines": [
        {
          "id": 1,
          "productId": 1,
          "productName": "Starter SaaS Tier",
          "description": "Monthly recurring fee",
          "quantity": 2,
          "unitPrice": 49.00,
          "subtotal": 98.00,
          "taxRate": 10.00,
          "taxAmount": 9.80,
          "discountAmount": 0.00,
          "lineTotal": 98.00
        }
      ],
      "createdAt": "2026-10-01T02:00:00",
      "updatedAt": "2026-10-15T14:20:00"
    }
  ]
}
```

---

### 2.2. Get Invoice Summary (For Dashboard & KPI Integration)
`GET /api/invoices/summary`

Designed specifically for the Dashboard module to retrieve aggregate financial and invoice metrics.

**Sample Response (`200 OK`):**
```json
{
  "success": true,
  "message": "Invoice summary retrieved successfully",
  "data": {
    "totalInvoices": 128,
    "totalAmountSum": 45290.00,
    "totalPaidSum": 38140.00,
    "outstandingBalanceSum": 7150.00,
    "draftCount": 4,
    "confirmedCount": 32,
    "paidCount": 92,
    "partiallyPaidCount": 10,
    "unpaidCount": 22,
    "overdueCount": 6,
    "overdueAmountSum": 2180.00
  }
}
```

---

### 2.3. Get Invoice Details by ID
`GET /api/invoices/{id}`

Returns the full invoice detail including lines, tax breakdown, and customer details.

**Sample Response (`200 OK`):**
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    "id": 1,
    "invoiceNumber": "INV-202610-0001",
    "subscriptionId": 1,
    "subscriptionNumber": "SUB-2026-0001",
    "customerId": 1,
    "customerName": "Acme Corporation",
    "customerEmail": "billing@acme.com",
    "billingAddress": "100 Enterprise Way, Suite 400, San Francisco, CA",
    "invoiceDate": "2026-10-01",
    "dueDate": "2026-10-31",
    "billingPeriodStart": "2026-10-01",
    "billingPeriodEnd": "2026-10-31",
    "subtotal": 100.00,
    "taxRate": 10.00,
    "taxAmount": 8.00,
    "taxRuleName": "Standard VAT",
    "discountCode": "SAVE20",
    "discountAmount": 20.00,
    "totalAmount": 88.00,
    "amountPaid": 0.00,
    "outstandingBalance": 88.00,
    "status": "CONFIRMED",
    "paymentStatus": "UNPAID",
    "overdue": false,
    "sentAt": null,
    "notes": "Annual subscription plan",
    "lines": [ ... ],
    "createdAt": "2026-10-01T02:00:00",
    "updatedAt": "2026-10-01T02:00:00"
  }
}
```

---

### 2.4. Create Draft Invoice
`POST /api/invoices`

**Request Body:**
```json
{
  "customerId": 1,
  "subscriptionId": 1,
  "invoiceDate": "2026-10-31",
  "dueDate": "2026-11-30",
  "billingPeriodStart": "2026-11-01",
  "billingPeriodEnd": "2026-11-30",
  "discountCode": "WELCOME10",
  "notes": "Custom subscription invoice",
  "lines": [
    {
      "productId": 1,
      "productName": "Starter SaaS Tier",
      "description": "Monthly subscription seat",
      "quantity": 2,
      "unitPrice": 49.00
    }
  ]
}
```

**Status Code:** `201 Created`

---

### 2.5. Confirm Invoice
`PUT /api/invoices/{id}/confirm`

Transitions status from `DRAFT` to `CONFIRMED`.
If a discount code was included, records discount usage atomically and checks usage limits.
If total payable is `0.00`, automatically transitions invoice to `PAID`.

**Status Code:** `200 OK`

---

### 2.6. Cancel Invoice
`PUT /api/invoices/{id}/cancel`

Cancels an invoice where permitted:
- `DRAFT` invoices can always be cancelled.
- `CONFIRMED` invoices can be cancelled ONLY IF `amountPaid == 0.00`.
- `PAID` invoices cannot be cancelled (must issue credit note / refund).

**Request Body (optional):**
```json
{
  "reason": "Customer requested plan tier change"
}
```

**Status Code:** `200 OK` (or `422 Unprocessable Entity` if cancellation is prohibited)

---

### 2.7. Send Invoice
`PUT /api/invoices/{id}/send`

Dispatches invoice notification and stamps `sentAt = CURRENT_TIMESTAMP`.

**Status Code:** `200 OK`

---

### 2.8. Trigger Recurring Billing Cycle
`POST /api/invoices/billing/trigger-run`

Manual trigger for operations/admins to immediately run the recurring billing cycle.

**Query Parameters:**
- `date` (optional, `YYYY-MM-DD`): Reference date. Subscriptions with `nextBillingDate <= date` and status `ACTIVE` are billed. Defaults to today's date.

**Sample Response (`200 OK`):**
```json
{
  "success": true,
  "message": "Recurring billing executed successfully",
  "data": {
    "runDate": "2026-10-31",
    "eligibleSubscriptionsCount": 5,
    "generatedInvoicesCount": 4,
    "skippedDuplicatesCount": 1,
    "failedCount": 0,
    "generatedInvoiceNumbers": [
      "INV-REC-202610-0012",
      "INV-REC-202610-0013",
      "INV-REC-202610-0014",
      "INV-REC-202610-0015"
    ],
    "errorMessages": []
  }
}
```

---

## 3. Payments API (`/api/invoices/{id}/payments` & `/api/payments`)

### 3.1. Record Payment Against Invoice
`POST /api/invoices/{id}/payments`

Records a payment against a confirmed invoice.
Updates `amountPaid` and `outstandingBalance = totalAmount - amountPaid`.
If outstanding balance reaches `0.00`, status is automatically updated to `PAID`.

**Validation Rules:**
- Invoice must exist and be in `CONFIRMED` status.
- Amount must be `> 0.00`.
- Overpayments are rejected (`amount <= outstandingBalance`).
- Duplicate `paymentReference` submissions are rejected.

**Request Body:**
```json
{
  "paymentReference": "PAY-202610-8472",
  "paymentMethod": "CREDIT_CARD",
  "amount": 57.80,
  "paymentDate": "2026-10-31T11:00:00",
  "notes": "Cleared payment transaction"
}
```

**Sample Response (`201 Created`):**
```json
{
  "success": true,
  "message": "Payment recorded successfully",
  "data": {
    "id": 12,
    "paymentReference": "PAY-202610-8472",
    "invoiceId": 1,
    "invoiceNumber": "INV-202610-0001",
    "paymentMethod": "CREDIT_CARD",
    "amount": 57.80,
    "paymentDate": "2026-10-31T11:00:00",
    "notes": "Cleared payment transaction",
    "status": "COMPLETED",
    "outstandingBalanceAfterPayment": 0.00,
    "invoiceStatusAfterPayment": "PAID",
    "createdAt": "2026-10-31T11:00:02"
  }
}
```

---

### 3.2. Get Payments by Invoice
`GET /api/invoices/{id}/payments`

Returns all payments allocated to the given invoice.

---

### 3.3. Get All Payments
`GET /api/payments`

Returns all payments recorded across the system.

---

### 3.4. Get Payment Summary Metrics
`GET /api/payments/summary`

Returns total payments count and total collected sum.

**Sample Response (`200 OK`):**
```json
{
  "success": true,
  "message": "Payment summary retrieved",
  "data": {
    "totalPaymentsCount": 142,
    "totalAmountCollected": 38140.00
  }
}
```

---

## 4. Discounts API (`/api/discounts`)

### 4.1. List Discounts
`GET /api/discounts`

Lists all discount rules with their usage counts, limits, expiration, and status.

---

### 4.2. Create Discount Rule
`POST /api/discounts`

**Request Body:**
```json
{
  "code": "FALL25",
  "description": "25% off fall promotion",
  "discountType": "PERCENTAGE",
  "discountValue": 25.00,
  "minPurchaseAmount": 50.00,
  "minQuantity": 1,
  "startDate": "2026-09-01",
  "endDate": "2026-11-30",
  "maxUsageCount": 200,
  "applicableProductId": null,
  "applicableSubscriptionId": null
}
```

**Status Code:** `201 Created`

---

### 4.3. Toggle Discount Active State
`PUT /api/discounts/{id}/toggle`

Enables or disables a discount rule.

---

### 4.4. Validate Discount Code
`GET /api/discounts/validate?code=FALL25&subtotal=100.00&quantity=1`

Evaluates discount eligibility and calculates net deduction.

**Sample Response (`200 OK`):**
```json
{
  "success": true,
  "message": "Discount code is valid",
  "data": {
    "code": "FALL25",
    "valid": true,
    "discountAmount": 25.00,
    "netSubtotal": 75.00
  }
}
```
