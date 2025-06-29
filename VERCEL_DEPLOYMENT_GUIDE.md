# Vercel Deployment Guide - Monorepo with Prisma

## 🎯 Overview

This guide covers deploying the Bell Registry monorepo to Vercel with proper Prisma client initialization.

## ✅ Pre-deployment Checklist

### 1. **Prisma Client Generation Fixed**
- ✅ Added `postinstall` scripts to all packages
- ✅ Updated Vercel build commands
- ✅ Centralized Prisma client imports
- ✅ Fixed all enum imports (16+ files)

### 2. **Monorepo Structure**
```
BellRegistry/
├── packages/
│   ├── main-app/          # Main application
│   ├── admin-portal/      # Admin dashboard  
│   └── shared/           # Shared utilities & Prisma
└── package.json          # Root workspace config
```

## 🚀 Vercel Project Setup

### **Main Application Deployment**

1. **Create/Update Vercel Project**
   - Project name: `bell-registry-main`
   - Root Directory: `packages/main-app`
   - Framework: `Next.js`

2. **Build Settings**
   - Build Command: `cd ../.. && npm run build:shared && npm run db:generate && npm run build:main`
   - Output Directory: `packages/main-app/.next`
   - Install Command: `cd ../.. && npm install`
   - ✅ Enable "Include files outside the root directory in the Build Step"

3. **Environment Variables**
   ```bash
   # Database
   DATABASE_URL="your-postgres-connection-string"
   
   # Authentication
   NEXTAUTH_SECRET="your-secret-key"
   NEXTAUTH_URL="https://your-domain.vercel.app"
   
   # External Services
   OPENAI_API_KEY="your-openai-key"
   RESEND_API_KEY="your-resend-key"
   TWILIO_ACCOUNT_SID="your-twilio-sid"
   TWILIO_AUTH_TOKEN="your-twilio-token"
   
   # File Upload (optional)
   AWS_ACCESS_KEY_ID="your-aws-key"
   AWS_SECRET_ACCESS_KEY="your-aws-secret"
   AWS_REGION="us-east-1"
   AWS_S3_BUCKET="your-bucket-name"
   
   # Stripe (optional)
   STRIPE_SECRET_KEY="your-stripe-secret"
   STRIPE_PUBLISHABLE_KEY="your-stripe-public"
   STRIPE_WEBHOOK_SECRET="your-webhook-secret"
   ```

### **Admin Portal Deployment**

1. **Create Vercel Project**
   - Project name: `bell-registry-admin`
   - Root Directory: `packages/admin-portal`
   - Framework: `Next.js`

2. **Build Settings**
   - Build Command: `cd ../.. && npm run build:shared && npm run db:generate && npm run build:admin`
   - Output Directory: `packages/admin-portal/.next`
   - Install Command: `cd ../.. && npm install`
   - ✅ Enable "Include files outside the root directory in the Build Step"

3. **Environment Variables**
   ```bash
   # Database
   DATABASE_URL="same-as-main-app"
   
   # Authentication
   NEXTAUTH_SECRET="same-as-main-app"
   NEXTAUTH_URL="https://admin-domain.vercel.app"
   
   # Admin Access
   ADMIN_EMAIL="your-admin-email@example.com"
   ```

## 🔧 Prisma Client Fixes Applied

### **1. Postinstall Scripts Added**
- `packages/main-app/package.json`: `"postinstall": "npm run db:generate"`
- `packages/shared/package.json`: `"postinstall": "prisma generate"`
- Root `package.json`: `"postinstall": "npm run db:generate --workspace=packages/shared"`

### **2. Centralized Prisma Imports**
All files now import from the shared package:
```typescript
// ✅ Correct
import { prisma } from '@/lib/prisma';
import { UserRole, JobStatus } from '@bell-registry/shared';

// ❌ Wrong (causes initialization errors)
import { PrismaClient, UserRole } from '@prisma/client';
```

### **3. Build Commands Updated**
- **Main App**: `npm run build:shared && npm run db:generate && next build`
- **Vercel**: `cd ../.. && npm run build:shared && npm run db:generate && npm run build:main`

## 🧪 Testing Deployment

### **Local Verification**
```bash
# Test Prisma client accessibility
cd packages/main-app
npm run verify-prisma

# Test build process
npm run build
```

### **Deployment Verification**
1. Check Vercel build logs for:
   - ✅ `✔ Generated Prisma Client`
   - ✅ `✓ Compiled successfully`
   - ✅ `✓ Generating static pages`

2. Test API endpoints:
   - `https://your-domain.vercel.app/api/test-prisma`
   - `https://your-domain.vercel.app/api/debug/jobs`

## 🐛 Troubleshooting

### **Common Issues**

1. **"@prisma/client did not initialize yet"**
   - ✅ **Fixed**: Postinstall scripts ensure generation
   - ✅ **Fixed**: Centralized imports prevent multiple clients

2. **"Module not found" during build**
   - Ensure environment variables are set
   - Verify build command includes all steps

3. **Database connection issues**
   - Verify `DATABASE_URL` in environment variables
   - Ensure database is accessible from Vercel

### **Debug Commands**
```bash
# Check Prisma client generation
cd packages/shared
npm run db:generate

# Verify imports work
cd packages/main-app
npm run verify-prisma

# Test full build
npm run build
```

## 📋 Deployment Steps

1. **Push your code** to GitHub
2. **Create Vercel projects** with settings above
3. **Add environment variables** to both projects
4. **Deploy and monitor** build logs
5. **Test functionality** on deployed URLs

## ✅ Success Indicators

- ✅ Build completes without errors
- ✅ Prisma client generates successfully
- ✅ All pages load correctly
- ✅ Database connections work
- ✅ API routes respond properly

## 🎉 Ready for Production!

Your monorepo is now fully configured for Vercel deployment with all Prisma client initialization issues resolved. 