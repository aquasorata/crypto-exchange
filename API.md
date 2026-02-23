# 📡 Crypto Exchange API Documentation
### This is an example of an **`API.md`** written in **production style**, with a clear structure and ready to copy and paste for immediate use 👇
---
Base URL:
```

[http://localhost:3000](http://localhost:3000)

```

# Authentication:

All protected routes require:

```

Authorization: Bearer <JWT_TOKEN>

````

---

# 🔐 Authentication

## 1️⃣ Register

**POST** `/auth/register`

### Request

```json
{
  "name": "John Doe",
  "email": "john@test.com",
  "password": "password123"
}
````

### Response

```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "id": 10,
    "name": "John Doe",
    "email": "john@test.com"
  }
}
```

---

## 2️⃣ Login

**POST** `/auth/login`

### Request

```json
{
  "email": "john@test.com",
  "password": "password123"
}
```

### Response

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "jwt_token_here"
  }
}
```

---

## 3️⃣ Get Current User

**GET** `/auth/me`

🔒 Requires Authentication

### Response

```json
{
  "success": true,
  "data": {
    "id": 10,
    "name": "John Doe",
    "role": "USER"
  }
}
```

---

# 📈 Orders

### I recommend using the admin account for the following tests, as the wallet has sufficient balance for API testing.
**POST** `/auth/login`

```json
{
  "email": "admin@test.com",
  "password": "admin123"
}
```

## 4️⃣ Create Order

**POST** `/api/orders`

🔒 Requires Authentication

### Request

```json
{
  "clientOrderId": "clientOrder-001",
  "currencyId": 1,
  "orderType": "BUY",
  "price": "1500000.00",
  "amount": "0.01"
}
```

### Response

```json
{
  "success": true,
  "message": "Order created successfully",
  "data": {
    "id": 55,
    "status": "OPEN",
    "remainingAmount": "0.01"
  }
}
```

---

## 5️⃣ Cancel Order

**DELETE** `/api/orders`

🔒 Requires Authentication

### Request

```json
{
  "orderId": 55
}
```

### Response

```json
{
  "success": true,
  "message": "Order cancelled successfully"
}
```

---

## 6️⃣ Get Order By ID

**GET** `/api/orders/:id`

🔒 Requires Authentication

Example:

```
GET /api/orders/55
```

### Response

```json
{
  "success": true,
  "data": {
    "id": 55,
    "orderType": "BUY",
    "status": "OPEN",
    "price": "1500000.00",
    "amount": "0.01"
  }
}
```

---

## 7️⃣ Get Order Book

**GET** `/api/orders/book/:currencyId`

Example:

```
GET /api/orders/book/1
```

### Response

```json
{
  "success": true,
  "data": {
    "bids": [
      {
        "price": "1490000.00",
        "totalAmount": "0.5"
      }
    ],
    "asks": [
      {
        "price": "1510000.00",
        "totalAmount": "0.3"
      }
    ]
  }
}
```

---

# 💸 Transfers

## 8️⃣ Internal Transfer

**POST** `/transfer/internal`

🔒 Requires Authentication

### Request

```json
{
  "toUserId": 5,
  "currencyId": 4,
  "amount": "1000.00"
}
```

### Response

```json
{
  "success": true,
  "message": "Transfer completed successfully"
}
```

---

## 9️⃣ External Transfer (Withdraw)

**POST** `/transfer/external`

🔒 Requires Authentication

### Request

```json
{
  "currencyId": 1,
  "amount": "0.02",
  "toAddress": "bc1xxxxxxxxxxx"
}
```

### Response

```json
{
  "success": true,
  "message": "Withdrawal request created",
  "data": {
    "status": "PENDING"
  }
}
```

---

# 📊 Admin Dashboard

🔒 Requires ADMIN Role

### This is the admin account for testing the Admin Dashboard.

**POST** `/auth/login`

```json
{
  "email": "admin@test.com",
  "password": "admin123"
}
```

---

## 🔟 Overview

**GET** `/dashboard/overview`

```json
{
  "success": true,
  "data": {
    "totalUsers": 100,
    "totalOrders": 250,
    "totalTrades": 180,
    "totalVolume": "12500000.00"
  }
}
```

---

## 1️⃣1️⃣ Recent Transactions

**GET** `/dashboard/transactions`

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "userId": 3,
      "type": "TRADE",
      "amount": "0.01"
    }
  ]
}
```

---

## 1️⃣2️⃣ Volume by Currency

**GET** `/dashboard/volume`

```json
{
  "success": true,
  "data": [
    {
      "currency": "BTC",
      "volume": "150.23"
    }
  ]
}
```

---

## 1️⃣3️⃣ System Health

**GET** `/dashboard/system/health`

```json
{
  "success": true,
  "data": {
    "status": "OK",
    "database": "CONNECTED",
    "uptime": 123456
  }
}
```

---

# ❌ Common Error Response

```json
{
  "success": false,
  "message": "Insufficient balance"
}
```

Possible HTTP Status Codes:

* 200 OK
* 201 Created
* 400 Bad Request
* 401 Unauthorized
* 403 Forbidden
* 404 Not Found
* 500 Internal Server Error

---


