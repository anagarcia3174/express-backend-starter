# API Documentation

This document provides comprehensive documentation for the Express TypeScript Starter Template API.

## Base URL

```
http://localhost:3000/api
```

## Authentication

This API uses JWT (JSON Web Tokens) for authentication with an access/refresh token pattern:

- **Access Token**: Short-lived token for API requests (expires in 15 minutes)
- **Refresh Token**: Long-lived token for obtaining new access tokens (expires in 7 days)

### Authentication Headers

For protected endpoints, include the access token in the Authorization header:

```
Authorization: Bearer <access_token>
```

## Rate Limiting

- **Auth endpoints**: 5 requests per 15 minutes per IP
- **Email endpoints**: 3 requests per 15 minutes per IP  
- **Password endpoints**: 3 requests per 15 minutes per IP
- **Token endpoints**: 5 requests per 15 minutes per IP

## User Journey Flows

### 1. New User Registration → Email Verification
```
POST /auth/register → GET /email/verify-email → POST /auth/login
```

### 2. Existing User Login → Normal Usage
```
POST /auth/login → POST /token/refresh-token (as needed) → POST /auth/logout
```

### 3. Password Reset Flow
```
POST /password/forgot-password → GET /password/reset-password → POST /password/reset-password → POST /auth/login
```

### 4. Change Password (Logged In)
```
POST /auth/login → POST /password/change-password → POST /auth/logout
```

### 5. Resend Email Verification
```
POST /auth/login → POST /email/resend-verification → GET /email/verify-email
```

---

## Authentication Endpoints

### Register User

**`POST /auth/register`**

Creates a new user account and sends email verification.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "Password123!",
  "name": "John Doe"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully. Please verify your email.",
  "data": {
    "user": {
      "id": "userId",
      "email": "user@example.com",
      "name": "John Doe",
      "isVerified": false
    }
  }
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "Password123!",
    "name": "John Doe"
  }'
```

### Login User

**`POST /auth/login`**

Authenticates user and returns JWT tokens.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "Password123!"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "userId",
      "email": "user@example.com",
      "name": "John Doe",
      "isVerified": true
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "Password123!"
  }'
```

### Logout User

**`POST /auth/logout`**

Invalidates user's refresh token and logs them out.

**Headers:**
- `Authorization: Bearer <access_token>`

**Response (200):**
```json
{
  "success": true,
  "message": "Logout successful"
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:3000/api/auth/logout \
  -H "Authorization: Bearer <access_token>"
```

---

## Email Endpoints

### Verify Email

**`GET /email/verify-email`**

Verifies user's email address via token from email link.

**Query Parameters:**
- `token` (required): Email verification token

**Response (200):**
```json
{
  "success": true,
  "message": "Email verified successfully"
}
```

**cURL Example:**
```bash
curl "http://localhost:3000/api/email/verify-email?token=<verification_token>"
```

### Resend Verification Email

**`POST /email/resend-verification`**

Sends a new email verification link to user.

**Headers:**
- `Authorization: Bearer <access_token>`

**Response (200):**
```json
{
  "success": true,
  "message": "Verification email sent successfully"
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:3000/api/email/resend-verification \
  -H "Authorization: Bearer <access_token>"
```

---

## Password Endpoints

### Change Password

**`POST /password/change-password`**

Changes user's password (requires current password).

**Headers:**
- `Authorization: Bearer <access_token>`

**Request Body:**
```json
{
  "currentPassword": "OldPassword123!",
  "newPassword": "NewPassword123!"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:3000/api/password/change-password \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "currentPassword": "OldPassword123!",
    "newPassword": "NewPassword123!"
  }'
```

### Forgot Password

**`POST /password/forgot-password`**

Sends password reset email to user.

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Password reset email sent successfully"
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:3000/api/password/forgot-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com"
  }'
```

### Show Reset Password Form

**`GET /password/reset-password`**

Displays password reset form (typically renders HTML page).

**Query Parameters:**
- `token` (required): Password reset token

**Response (200):**
```html
<!-- HTML form for password reset -->
```

**cURL Example:**
```bash
curl "http://localhost:3000/api/password/reset-password?token=<reset_token>"
```

### Reset Password

**`POST /password/reset-password`**

Resets user's password using reset token.

**Query Parameters:**
- `token` (required): Password reset token

**Request Body:**
```json
{
  "newPassword": "NewPassword123!"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Password reset successfully"
}
```

**cURL Example:**
```bash
curl -X POST "http://localhost:3000/api/password/reset-password?token=<reset_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "newPassword": "NewPassword123!"
  }'
```

---

## Token Endpoints

### Refresh Token

**`POST /token/refresh-token`**

Generates new access and refresh tokens using refresh token.

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Tokens refreshed successfully",
  "data": {
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:3000/api/token/refresh-token \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }'
```

---

## Error Responses

All endpoints return consistent error responses:

### Validation Error (400)
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Email is required"
    },
    {
      "field": "password",
      "message": "Password must be at least 8 characters"
    }
  ]
}
```

### Authentication Error (401)
```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

### Authorization Error (403)
```json
{
  "success": false,
  "message": "Access denied. Invalid token"
}
```

### Not Found Error (404)
```json
{
  "success": false,
  "message": "User not found"
}
```

### Rate Limit Error (429)
```json
{
  "success": false,
  "message": "Too many requests. Please try again later."
}
```

### Server Error (500)
```json
{
  "success": false,
  "message": "Internal server error"
}
```

---

## Testing with Postman

### Environment Variables
Set up these variables in your Postman environment:

- `base_url`: `http://localhost:3000/api`
- `access_token`: (set after login)
- `refresh_token`: (set after login)

### Collection Order
1. Register new user
2. Verify email (check your email for link)
3. Login user (save tokens)
4. Test protected endpoints
5. Refresh tokens when needed
6. Test password reset flow
7. Logout user

---

## Common Use Cases

### Frontend Integration

**Login Flow:**
```javascript
// Login
const loginResponse = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password })
});

const { data } = await loginResponse.json();
// Store tokens securely
localStorage.setItem('accessToken', data.tokens.accessToken);
localStorage.setItem('refreshToken', data.tokens.refreshToken);
```

**Making Authenticated Requests:**
```javascript
const response = await fetch('/api/protected-endpoint', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
  }
});
```

**Token Refresh:**
```javascript
const refreshResponse = await fetch('/api/token/refresh-token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    refreshToken: localStorage.getItem('refreshToken') 
  })
});
```

### Password Requirements

Passwords must meet these criteria:
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter  
- At least one number
- At least one special character

### Email Templates

The API includes pre-built email templates for:
- Email verification
- Password reset
- Verification success/expiry notifications

Templates are located in `src/views/email/` and `src/views/password/`. 