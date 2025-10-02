> Copyright © 2025 Bell Registry. All rights reserved.
> Unauthorized copying, distribution, modification, or use is prohibited.
> Proprietary and confidential.
>

# 🛠 Fixing Prisma Client Issue for 2FA

## Issue Description
You're seeing this error: `TypeError: Cannot read properties of undefined (reading 'call')`

This is happening because the Prisma client can't access the new 2FA fields we added to the database schema.

## Root Cause
Windows file permission issue preventing Prisma client regeneration:
```
EPERM: operation not permitted, rename 'query_engine-windows.dll.node.tmp...'
```

## 🔧 Solution Steps

### Step 1: Stop All Node Processes
```bash
# Stop the development server
Ctrl + C

# Kill any remaining Node processes
taskkill /f /im node.exe
```

### Step 2: Clear Prisma Client Cache
```bash
# Delete the generated Prisma client
rmdir /s "node_modules\.prisma"

# Or manually delete the folder:
# C:\Users\openi\OneDrive\BellRegistry\node_modules\.prisma\client
```

### Step 3: Regenerate Prisma Client
```bash
# Regenerate the client (run as Administrator if needed)
npx prisma generate

# If that fails, try:
npx prisma generate --force-version=latest
```

### Step 4: Alternative - Run as Administrator
1. Open PowerShell as Administrator
2. Navigate to your project: `cd C:\Users\openi\OneDrive\BellRegistry`
3. Run: `npx prisma generate`

### Step 5: Verify Database Schema
```bash
# Check if the 2FA fields exist in the database
npx prisma db push

# View the current schema
npx prisma studio
```

### Step 6: Re-enable 2FA in Code
Once Prisma client is working, update `src/components/auth/login-form-with-2fa.tsx`:

```typescript
const checkUserHas2FA = async (email: string): Promise<{ has2FA: boolean; phone?: string }> => {
  // Remove the temporary return and uncomment the real implementation
  try {
    const response = await fetch('/api/auth/check-2fa', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    
    if (response.ok) {
      const data = await response.json();
      return { has2FA: data.has2FA, phone: data.phone };
    }
    return { has2FA: false };
  } catch (error) {
    console.error('Error checking 2FA status:', error);
    return { has2FA: false };
  }
};
```

### Step 7: Update API Routes
Restore the full 2FA fields in `src/app/api/auth/check-2fa/route.ts`:

```typescript
const user = await prisma.user.findUnique({
  where: { email },
  select: {
    id: true,
    twoFactorEnabled: true,
    twoFactorPhone: true,
    isDeleted: true
  }
});

// ... rest of the implementation
```

## 🧪 Testing After Fix

### 1. Test Prisma Client
```bash
curl http://localhost:3000/api/test-prisma
```
Should return: `{"success":true,"message":"Prisma is working","userCount":X}`

### 2. Test 2FA Check
```bash
curl -X POST http://localhost:3000/api/auth/check-2fa \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

### 3. Test Login Page
- Visit `/login`
- Should load without errors
- Try logging in with existing credentials

## 🎯 Current Status

**✅ What's Working:**
- Login page loads without crashing
- Normal login (without 2FA) works
- All 2FA API routes are created

**⏳ What's Temporarily Disabled:**
- 2FA checking during login (returns `has2FA: false`)
- Full 2FA verification flow

**🎯 What to Enable After Fix:**
- Uncomment the real 2FA checking logic
- Update API routes to use 2FA fields
- Test complete 2FA flow

## 🚀 Once Fixed, Full 2FA Will Work

After resolving the Prisma client issue, your users will experience:

1. **Normal Login** → Enter email/password → Dashboard (if no 2FA)
2. **2FA Login** → Enter email/password → SMS code → Enter code → Dashboard

The infrastructure is complete - we just need to resolve the Windows file permission issue!

## 🆘 If Still Having Issues

1. **Restart your computer** (to release any file locks)
2. **Run PowerShell as Administrator**
3. **Try WSL** if you have it installed
4. **Use Docker** for development environment
5. **Contact support** with the exact error message

---

## 📞 Quick Fix Summary

```bash
# 1. Stop everything
taskkill /f /im node.exe

# 2. Delete Prisma client
rmdir /s "node_modules\.prisma"

# 3. Regenerate (as Administrator)
npx prisma generate

# 4. Start server
npm run dev

# 5. Test
curl http://localhost:3000/api/test-prisma
```

Once this works, your 2FA implementation will be fully functional! 🎉 