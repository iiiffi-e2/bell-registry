# Bell Registry Monorepo Setup Guide

## Overview

This document outlines the implementation of the Bell Registry platform as a monorepo with separate main application and admin portal, incorporating security best practices and deployment strategies.

## Architecture

```
bell-registry/
├── packages/
│   ├── shared/                    # Shared code, types, database
│   │   ├── src/
│   │   │   ├── types/            # Common TypeScript types
│   │   │   ├── lib/              # Shared utilities and services
│   │   │   ├── database/         # Prisma schema and migrations
│   │   │   └── components/       # Shared UI components
│   │   └── package.json
│   ├── main-app/                 # Current Next.js application
│   │   ├── src/
│   │   ├── vercel.json
│   │   └── package.json
│   └── admin-portal/             # New admin service
│       ├── src/
│       ├── vercel.json
│       └── package.json
├── package.json                  # Root workspace configuration
└── README.md
```

## Security Features Implemented

### 1. **Separate Authentication for Admin Portal**
- Different JWT secrets for admin vs main app
- Shorter session timeouts (2 hours vs default)
- Admin-only authentication provider
- Strict role validation at multiple levels

### 2. **Database Security**
- Admin audit logging for all actions
- Profile and job approval workflows
- Soft deletes with admin oversight
- Read-only replica support ready

### 3. **Admin Approval Workflows**
- **Profile Status**: PENDING → APPROVED/REJECTED/SUSPENDED
- **Job Status**: PENDING → APPROVED/REJECTED
- All admin actions logged with IP and user agent

### 4. **Enhanced Schema Changes**
```sql
-- New fields added to existing tables
ALTER TABLE "CandidateProfile" ADD COLUMN "status" "ProfileStatus" DEFAULT 'PENDING';
ALTER TABLE "CandidateProfile" ADD COLUMN "approvedAt" TIMESTAMP;
ALTER TABLE "CandidateProfile" ADD COLUMN "approvedBy" TEXT;

ALTER TABLE "Job" ADD COLUMN "adminStatus" "JobAdminStatus" DEFAULT 'PENDING';
ALTER TABLE "Job" ADD COLUMN "approvedAt" TIMESTAMP;
ALTER TABLE "Job" ADD COLUMN "approvedBy" TEXT;

-- New audit table
CREATE TABLE "AdminAuditLog" (
  "id" TEXT PRIMARY KEY,
  "adminId" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "targetId" TEXT,
  "targetType" TEXT,
  "details" JSONB,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "createdAt" TIMESTAMP DEFAULT now()
);
```

## Setup Instructions

### 1. **Initial Setup**
```bash
# Install dependencies for all packages
npm install

# Generate Prisma client
npm run db:generate --workspace=packages/shared

# Run database migrations
npm run db:migrate --workspace=packages/shared
```

### 2. **Development**
```bash
# Start main app only
npm run dev:main

# Start admin portal only  
npm run dev:admin

# Start both applications
npm run dev:both
```

### 3. **Building**
```bash
# Build all packages
npm run build

# Build specific packages
npm run build:main
npm run build:admin
```

## Environment Variables

### **Main App (.env.local)**
```env
# Database
DATABASE_URL="postgresql://..."

# Auth
NEXTAUTH_SECRET="your-main-secret"
NEXTAUTH_URL="https://bellregistry.com"

# Admin Portal API
ADMIN_API_URL="https://admin.bellregistry.com"

# Existing variables...
STRIPE_SECRET_KEY="..."
TWILIO_ACCOUNT_SID="..."
# etc.
```

### **Admin Portal (.env.local)**
```env
# Database (same as main app)
DATABASE_URL="postgresql://..."

# Admin Auth (different secrets)
ADMIN_JWT_SECRET="your-admin-secret"
NEXTAUTH_SECRET="your-admin-nextauth-secret"
NEXTAUTH_URL="https://admin.bellregistry.com"

# Main App API
MAIN_API_URL="https://bellregistry.com"

# Security
ADMIN_ALLOWED_IPS="192.168.1.0/24,10.0.0.0/8"
ADMIN_ALLOWED_EMAILS="admin1@example.com,admin2@example.com"
```

## Deployment Strategy

### **Option 1: Vercel Monorepo (Recommended)**

1. **Create Two Vercel Projects:**
   - **Main App Project**: 
     - Root Directory: `packages/main-app`
     - Domain: `bellregistry.com`
   - **Admin Portal Project**: 
     - Root Directory: `packages/admin-portal`
     - Domain: `admin.bellregistry.com`

2. **Configure Build Commands:**
   - **Install Command**: `cd ../.. && npm install`
   - **Build Command**: `cd ../.. && npm run build:main` (or `build:admin`)

3. **DNS Configuration:**
   ```
   Type: CNAME
   Name: admin
   Value: cname.vercel-dns.com
   ```

### **Option 2: GitHub Actions**
See the GitHub Actions workflow in `.github/workflows/deploy.yml` for automated deployment with change detection.

## Admin Portal Features

### **Dashboard Overview**
- System statistics and metrics
- Recent admin actions
- Pending approvals summary
- User activity monitoring

### **Profile Management**
- View all professional profiles
- Approve/reject new profiles
- Suspend/unsuspend profiles
- View profile details and history

### **Job Management**
- Review job postings before publication
- Approve/reject job listings
- Monitor job performance metrics
- Manage job categories

### **User Management**
- View all users across roles
- Suspend/activate accounts
- View user activity logs
- Manage admin permissions

### **Analytics & Reporting**
- User registration trends
- Job posting statistics
- Application conversion rates
- System usage metrics

## Security Considerations

### **Access Control**
- IP whitelisting for admin portal
- Two-factor authentication required
- Role-based permissions
- Session timeout management

### **Audit Trail**
- All admin actions logged
- IP address and user agent tracking
- Detailed action history
- Exportable audit reports

### **Data Protection**
- Soft deletes for data recovery
- Confirmation dialogs for destructive actions
- Regular automated backups
- Data retention policies

## API Endpoints

### **Admin-Specific APIs** (Main App)
```
POST /api/admin/profiles/{id}/approve
POST /api/admin/profiles/{id}/reject
GET  /api/admin/profiles/pending
POST /api/admin/jobs/{id}/approve
POST /api/admin/jobs/{id}/reject
GET  /api/admin/jobs/pending
GET  /api/admin/analytics
GET  /api/admin/users
POST /api/admin/users/{id}/suspend
GET  /api/admin/audit-logs
```

### **Admin Portal APIs** (Admin App)
```
GET  /api/dashboard/stats
GET  /api/auth/session
POST /api/auth/signin
POST /api/auth/signout
```

## Testing

### **Unit Tests**
```bash
npm run test --workspace=packages/shared
npm run test --workspace=packages/main-app
```

### **Integration Tests**
- Admin authentication flow
- Profile approval workflow
- Job approval workflow
- Audit logging functionality

## Migration Path

### **Phase 1: Foundation** ✅
- [x] Monorepo structure setup
- [x] Shared package creation
- [x] Database schema updates
- [x] Admin authentication

### **Phase 2: Basic Admin Portal**
- [ ] Admin login interface
- [ ] Dashboard with basic stats
- [ ] Profile list and approval UI
- [ ] Job list and approval UI

### **Phase 3: Advanced Features**
- [ ] Analytics dashboard
- [ ] User management interface
- [ ] Audit log viewer
- [ ] Bulk operations

### **Phase 4: Production Ready**
- [ ] Production deployment
- [ ] Monitoring and alerting
- [ ] Performance optimization
- [ ] Documentation completion

## Troubleshooting

### **Common Issues**

1. **Prisma Client Not Found**
   ```bash
   npm run db:generate --workspace=packages/shared
   ```

2. **Build Failures**
   ```bash
   npm run build:shared
   npm run build:main
   ```

3. **Type Errors**
   - Ensure shared package is built
   - Check tsconfig.json paths
   - Verify workspace dependencies

### **Development Tips**

1. **Hot Reload**: Both apps support hot reload in development
2. **Debugging**: Use different ports (3000 for main, 3001 for admin)
3. **Database**: Shared database ensures data consistency
4. **Types**: Shared types package ensures type safety

## Next Steps

1. **Install Dependencies**: Run `npm install` to set up the workspace
2. **Database Migration**: Update your database with the new schema
3. **Environment Setup**: Configure environment variables for both apps
4. **Development**: Start building the admin portal interface
5. **Deployment**: Set up Vercel projects for both applications

## Support

For questions or issues with the monorepo setup:
1. Check this documentation first
2. Review the package.json files for script commands
3. Consult the individual package README files
4. Check environment variable configuration

---

**Note**: This setup provides a solid foundation for the admin portal while maintaining security best practices and enabling independent scaling of both applications. 