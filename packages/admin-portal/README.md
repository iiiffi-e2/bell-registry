# Bell Registry Admin Portal

A secure administrative interface for managing the Bell Registry platform with real-time data integration.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL database (shared with main app)
- Admin user account created

### Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment** (`.env.local`):
   ```bash
   DATABASE_URL="postgresql://postgres:R0sslynr0x*54@localhost:5432/bellregistry_db"
   NEXTAUTH_URL="http://localhost:3001"
   NEXTAUTH_SECRET="admin-portal-secret-32-chars-minimum-for-nextauth-security-2024"
   ADMIN_JWT_SECRET="admin-jwt-different-secret-32-chars-minimum-for-security-2024"
   NODE_ENV="development"
   ```

3. **Start the admin portal**:
   ```bash
   npm run dev
   ```

4. **Access**: http://localhost:3001

## 🔑 Default Admin Credentials

- **Email**: `admin@bellregistry.com`
- **Password**: `AdminPassword123!`

## 📊 Features

- **Real-time Statistics**: Live data from Bell Registry database
- **User Management**: View and manage platform users
- **Secure Authentication**: Admin-only access with JWT tokens
- **Dashboard Analytics**: Platform metrics and activity monitoring

## 🛡️ Security

- Role-based access control (ADMIN role required)
- JWT token authentication with 2-hour expiration
- Custom middleware for route protection
- Secure session management

## 🏗️ Architecture

- **Frontend**: Next.js 14 with TypeScript
- **Authentication**: NextAuth.js with custom admin configuration
- **Database**: Shared PostgreSQL with main app via Prisma
- **Security**: Custom middleware with JWT validation

## 📝 Available Scripts

- `npm run dev` - Start development server on port 3001
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## 🔧 Development

The admin portal is part of the Bell Registry monorepo and shares:
- Database schema via `@bell-registry/shared`
- Common types and utilities
- Prisma client configuration

For detailed implementation information, see `ADMIN_PORTAL_REAL_DATA_INTEGRATION.md`. 