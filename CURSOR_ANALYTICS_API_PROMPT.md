# Backend Analytics API Implementation Prompt

## Project Context

You are working on a shipment management system backend. The frontend is built with React/TypeScript and needs these analytics endpoints to power a new dashboard. The backend uses Firebase Authentication for JWT token validation.

## Required API Endpoints

Create 7 new analytics endpoints. All endpoints require Firebase JWT authentication via Bearer token in the Authorization header.

---

## 1. Air Shipments Analytics

**Endpoint:** `GET /api/analytics/shipments/air`

**Query Parameters:**
- `startDate` (optional): ISO date string for period start
- `endDate` (optional): ISO date string for period end

**Response:**
```json
{
  "totalShipments": 1250,
  "totalKG": 45230.5,
  "statusBreakdown": {
    "pending": 120,
    "processing": 85,
    "in transit": 340,
    "arrived at destination warehouse": 180,
    "out for delivery": 95,
    "delivered": 430
  },
  "chartData": [
    { "date": "2024-01", "shipments": 180, "kg": 6500 },
    { "date": "2024-02", "shipments": 210, "kg": 7200 },
    { "date": "2024-03", "shipments": 195, "kg": 6800 }
  ]
}
```

**Logic:**
- Filter shipments where `shippingMethod = "air"`
- Sum `weight` field for totalKG
- Group by `status` for statusBreakdown
- Group by month for chartData

---

## 2. Sea Shipments Analytics

**Endpoint:** `GET /api/analytics/shipments/sea`

**Query Parameters:**
- `startDate` (optional): ISO date string for period start
- `endDate` (optional): ISO date string for period end

**Response:**
```json
{
  "totalShipments": 890,
  "totalCBM": 12450.75,
  "statusBreakdown": {
    "pending": 45,
    "processing": 60,
    "in transit": 280,
    "arrived at destination warehouse": 150,
    "out for delivery": 55,
    "delivered": 300
  },
  "chartData": [
    { "date": "2024-01", "shipments": 120, "cbm": 1800 },
    { "date": "2024-02", "shipments": 145, "cbm": 2100 },
    { "date": "2024-03", "shipments": 130, "cbm": 1950 }
  ]
}
```

**Logic:**
- Filter shipments where `shippingMethod = "sea"`
- Sum `cbm` field for totalCBM
- Group by `status` for statusBreakdown
- Group by month for chartData

---

## 3. Customer Growth Analytics

**Endpoint:** `GET /api/analytics/customers/growth`

**Query Parameters:**
- `period` (optional): `"daily"` | `"weekly"` | `"monthly"` (default: `"monthly"`)
- `startDate` (optional): ISO date string
- `endDate` (optional): ISO date string

**Response:**
```json
{
  "totalCustomers": 3450,
  "newCustomersThisPeriod": 127,
  "growthPercentage": 3.8,
  "chartData": [
    { "date": "2024-01", "newCustomers": 95, "totalCustomers": 3100 },
    { "date": "2024-02", "newCustomers": 112, "totalCustomers": 3212 },
    { "date": "2024-03", "newCustomers": 127, "totalCustomers": 3339 }
  ]
}
```

**Logic:**
- Count users where `role = "customer"`
- Use `createdAt` field for growth tracking
- Calculate `growthPercentage` as (newCustomersThisPeriod / previousPeriodTotal) * 100
- Group by period for chartData with running total

---

## 4. Wallet Balance Summary

**Endpoint:** `GET /api/analytics/wallets/balance-summary`

**Query Parameters:** None

**Response:**
```json
{
  "totalWallets": 3200,
  "positiveBalanceCount": 2100,
  "negativeBalanceCount": 450,
  "zeroBalanceCount": 650,
  "totalPositiveBalance": 125000.50,
  "totalNegativeBalance": -15230.75,
  "netBalance": 109769.75,
  "distribution": [
    { "range": "< -1000", "count": 25 },
    { "range": "-1000 to -100", "count": 85 },
    { "range": "-100 to 0", "count": 340 },
    { "range": "0", "count": 650 },
    { "range": "0 to 100", "count": 520 },
    { "range": "100 to 1000", "count": 980 },
    { "range": "> 1000", "count": 600 }
  ]
}
```

**Logic:**
- Query all wallets and their `balance` field
- Group by positive (> 0), negative (< 0), zero (= 0)
- Sum balances for each group
- Create distribution buckets

---

## 5. Invoice Summary

**Endpoint:** `GET /api/analytics/invoices/summary`

**Query Parameters:**
- `startDate` (optional): ISO date string
- `endDate` (optional): ISO date string

**Response:**
```json
{
  "totalInvoices": 5670,
  "totalDueAmount": 89500.25,
  "paidAmount": 72300.00,
  "unpaidAmount": 17200.25,
  "statusBreakdown": {
    "paid": 4200,
    "partially_paid": 320,
    "unpaid": 890,
    "cancelled": 260
  },
  "chartData": [
    { "date": "2024-01", "issued": 450, "paid": 380, "amount": 28500 },
    { "date": "2024-02", "issued": 520, "paid": 445, "amount": 32100 },
    { "date": "2024-03", "issued": 490, "paid": 410, "amount": 29800 }
  ]
}
```

**Logic:**
- Query invoices within date range
- Sum `totalAmount` for totalDueAmount
- Sum `paidAmount` field for paidAmount
- Calculate unpaidAmount = totalDueAmount - paidAmount
- Group by `status` for statusBreakdown
- Group by month for chartData

---

## 6. Air vs Sea Comparison

**Endpoint:** `GET /api/analytics/shipments/comparison`

**Query Parameters:**
- `period` (optional): `"daily"` | `"weekly"` | `"monthly"` (default: `"monthly"`)
- `startDate` (optional): ISO date string
- `endDate` (optional): ISO date string

**Response:**
```json
{
  "summary": {
    "air": { "total": 1250, "percentage": 58.4 },
    "sea": { "total": 890, "percentage": 41.6 }
  },
  "chartData": [
    { "date": "2024-01", "air": 180, "sea": 120 },
    { "date": "2024-02", "air": 210, "sea": 145 },
    { "date": "2024-03", "air": 195, "sea": 130 }
  ]
}
```

**Logic:**
- Query all shipments within date range
- Group by `shippingMethod` (air/sea)
- Calculate percentages
- Group by period for chartData

---

## 7. Delivered Packages Total

**Endpoint:** `GET /api/analytics/shipments/delivered`

**Query Parameters:**
- `period` (optional): `"today"` | `"week"` | `"month"` | `"year"` | `"all"` (default: `"month"`)

**Response:**
```json
{
  "totalDelivered": 4320,
  "periodDelivered": 430,
  "periodLabel": "This Month",
  "comparisonWithPreviousPeriod": {
    "previous": 385,
    "change": 45,
    "percentageChange": 11.7
  }
}
```

**Logic:**
- Filter shipments where `status = "delivered"`
- Apply period filter to `deliveredAt` or `updatedAt` timestamp
- Compare with previous equivalent period
- Calculate percentage change

---

## Authentication

All endpoints require Firebase JWT authentication:

```javascript
// Middleware example
const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const token = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};
```

---

## Error Response Format

All errors should follow this format:

```json
{
  "error": "Error message here",
  "code": "ERROR_CODE",
  "details": {} // Optional additional info
}
```

**Common error codes:**
- `UNAUTHORIZED` - Missing or invalid token
- `FORBIDDEN` - User lacks permission
- `INVALID_PARAMS` - Invalid query parameters
- `INTERNAL_ERROR` - Server error

---

## Database Schema Reference

### Shipments Collection/Table
- `id`: string (primary key)
- `esn`: string (external shipment number)
- `shippingMethod`: "air" | "sea"
- `status`: string (see status values below)
- `weight`: number (in KG, for air shipments)
- `cbm`: number (cubic meters, for sea shipments)
- `createdAt`: timestamp
- `updatedAt`: timestamp
- `deliveredAt`: timestamp (nullable)
- `userId`: string (customer reference)

### Status Values
- `"pending"`
- `"processing"`
- `"in transit"`
- `"arrived at destination warehouse"`
- `"out for delivery"`
- `"delivered"`

### Users Collection/Table
- `id`: string (primary key)
- `email`: string
- `role`: "admin" | "customer" | "employee"
- `createdAt`: timestamp
- `status`: "active" | "inactive"

### Wallets Collection/Table
- `id`: string (primary key)
- `userId`: string (user reference)
- `balance`: number (can be negative)
- `currency`: string (default: "LYD")
- `createdAt`: timestamp
- `updatedAt`: timestamp

### Invoices Collection/Table
- `id`: string (primary key)
- `invoiceNumber`: string
- `userId`: string (customer reference)
- `totalAmount`: number
- `paidAmount`: number
- `status`: "paid" | "partially_paid" | "unpaid" | "cancelled"
- `createdAt`: timestamp
- `updatedAt`: timestamp

---

## Implementation Notes

1. **Date Handling**: All dates should be handled in UTC. Frontend will send ISO 8601 strings.

2. **Caching**: Consider caching frequently accessed analytics for 5-15 minutes.

3. **Pagination**: These analytics endpoints don't need pagination as they return aggregated data.

4. **Performance**: Use database aggregation pipelines/queries rather than fetching all documents and processing in memory.

5. **Timezone**: Store all timestamps in UTC. The frontend handles timezone conversion for display.

6. **Currency**: All monetary values are in LYD (Libyan Dinar). No conversion needed.
