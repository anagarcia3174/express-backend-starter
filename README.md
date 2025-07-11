# Express TypeScript Starter Template

This is a comprehensive Express.js starter template built with TypeScript, featuring authentication, email services, and essential middleware for rapid API development.

## Tech Stack

- **Runtime:** Node.js
- **Language:** TypeScript
- **Framework:** Express.js
- **Database:** MongoDB with Mongoose
- **Authentication:** JWT (JSON Web Tokens)
- **Email Service:** AWS SES (Simple Email Service)
- **Logging:** Winston

## Project Structure

```
src/
├── config/         # Configuration files
├── controllers/    # Request handlers
├── middleware/     # Custom middleware
├── models/         # Mongoose models
├── routes/         # API routes
├── services/       # Business logic
├── types/          # TypeScript type definitions
├── utils/          # Utility functions
├── views/          # Email templates (EJS)
└── server.ts       # Application entry point
```

## Features

- **Authentication System:** Complete JWT-based auth with access/refresh tokens
- **Email Service:** Email verification and password reset functionality
- **User Management:** User registration, login, and profile management
- **Security:** Rate limiting, input validation, and error handling
- **Email Templates:** Pre-built EJS templates for common email scenarios
- **TypeScript:** Full TypeScript support with proper typing
- **Logging:** Winston-based logging system
- **Environment Configuration:** Centralized config management

## Prerequisites

- Node.js (v14 or higher)
- MongoDB
- AWS SES credentials (for email functionality)

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the root directory with the following variables:
   ```
   PORT=3000
   NODE_ENV=development
   MONGO_URL=your-mongo-url
   ACCESS_TOKEN_SECRET=your-jwt-access-token-secret
   REFRESH_TOKEN_SECRET=your-jwt-refresh-token-secret
   EMAIL_VERIFICATION_TOKEN_SECRET=your-email-verification-token-secret
   AWS_ACCESS_KEY_ID=your-aws-access-key-id
   AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key
   AWS_REGION=your-aws-region
   EMAIL_FROM=your-from-email
   VERIFICATION_LINK=your-verification-url
   ```

## Running the Application

Development mode:
```bash
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout

### Email
- `GET /api/email/verify-email` - Verification link
- `POST /api/email/resend-verification` - Resend verification email link

### Password Reset
- `POST /api/password/change-password` - Change password with token and current password
- `POST /api/password/forgot-password` - Send reset password link
- `GET /api/password/reset-password` - Open reset password link
- `POST /api/password/reset-password` - Submit reset password form

### Token Management
- `POST /api/token/refresh-token` - Refresh JWT tokens

## Security Features

- JWT-based authentication with access/refresh token pattern
- Password hashing with bcrypt
- Rate limiting to prevent abuse
- Input validation and sanitization
- Comprehensive error handling
- Secure email token generation

## Development

The project uses:
- TypeScript for type safety
- ESLint for code linting
- Prettier for code formatting
- Nodemon for development auto-reload

## Dependencies

### Production
- express: Web framework
- mongoose: MongoDB ODM
- jsonwebtoken: JWT authentication
- bcrypt: Password hashing
- cors: Cross-origin resource sharing
- dotenv: Environment variables
- winston: Logging
- aws-sdk: AWS services integration
- nodemailer: Email functionality
- express-rate-limit: Rate limiting
- helmet: Security headers
- joi: Input validation

### Development
- typescript: TypeScript support
- nodemon: Development server
- eslint: Code linting
- prettier: Code formatting
- ts-node: TypeScript execution
- @types/*: TypeScript type definitions


## Customization

This template provides a solid foundation for building APIs with:
- Ready-to-use authentication system
- Email functionality with templates
- Proper error handling and logging
- TypeScript configuration
- Security best practices

Simply modify the controllers, models, and routes to fit your specific use case.

## API Documentation

For detailed API documentation including endpoints, request/response examples, and user flows, see [API.md](API.md).
