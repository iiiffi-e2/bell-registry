# Twilio SMS Two-Factor Authentication Setup Guide

This guide walks you through setting up SMS-based two-factor authentication using Twilio for your Bell Registry application.

## 🚀 Quick Start

### 1. Create Twilio Account
1. Go to [https://www.twilio.com/](https://www.twilio.com/)
2. Sign up for a free account
3. Verify your email and phone number

### 2. Get Your Credentials
1. Log into your Twilio Console
2. From the dashboard, copy your:
   - **Account SID** (starts with "AC...")
   - **Auth Token** (click eye icon to reveal)

### 3. Create a Verify Service
1. Go to **Verify** > **Services** in the left sidebar
2. Click "Create new service"
3. Give it a name like "Bell Registry 2FA"
4. Click "Create service"
5. Copy the **Service SID** (starts with "VA...")

### 4. Configure Environment Variables
Create/update your `.env.local` file:

```bash
# Twilio Configuration
TWILIO_ACCOUNT_SID=your_account_sid_here
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_VERIFY_SERVICE_SID=your_verify_service_sid_here
```

**Example:**
```bash
TWILIO_ACCOUNT_SID=AC1234567890abcdef1234567890abcdef
TWILIO_AUTH_TOKEN=1234567890abcdef1234567890abcdef
TWILIO_VERIFY_SERVICE_SID=VA1234567890abcdef1234567890abcdef
```

### 5. Test Your Setup
1. Start your development server: `npm run dev`
2. Test Verify service: `curl http://localhost:3000/api/test-verify-service`
3. Go to Settings page when logged in
4. Click "Enable Two-Factor Authentication"
5. Enter your phone number and test

## 🧪 Testing

### Test Verify Functionality
Use the test endpoint (development only):

```bash
curl -X POST http://localhost:3000/api/test-sms \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "+15551234567"}'
```

This will send a verification code that you can then verify manually in the Twilio Console.

## 📱 How It Works

### For Users:
1. **Enable 2FA**: Go to Settings → Two-Factor Authentication
2. **Enter phone number**: Include country code (e.g., +1 for US)
3. **Verify**: Enter the 6-digit code received via SMS
4. **Save backup codes**: Download and store safely
5. **Login**: After password, enter SMS code or backup code

### For Developers:
- **Database**: User table fields added (no verification table needed)
- **Twilio Verify API**: Handles all verification logic and state
- **API Routes**: 
  - `/api/auth/2fa/setup` - Send verification code to phone
  - `/api/auth/2fa/verify-setup` - Complete setup with code verification
  - `/api/auth/2fa/verify` - Verify during login (supports backup codes)
  - `/api/auth/2fa/send-code` - Send new verification code during login
  - `/api/auth/2fa/status` - Get user's 2FA status
  - `/api/auth/2fa/disable` - Disable 2FA
- **Components**: `TwoFactorSetup` for UI

## 🔒 Security Features

- ✅ **Twilio Verify API** (industry-leading security)
- ✅ **Time-limited codes** (10 minutes expiry)
- ✅ **Built-in fraud protection**
- ✅ **Rate limiting and abuse prevention**
- ✅ **Backup codes** (10 one-time use codes)
- ✅ **Global delivery optimization**
- ✅ **Automatic retry logic**
- ✅ **Multiple verification channels** (SMS, Voice, Email)

## 💰 Pricing

**Twilio Verify Costs (as of 2024):**
- Verification attempts: ~$0.05 per verification
- No base monthly fees
- No phone number needed
- Built-in fraud protection included

**Estimated monthly cost for 1000 users:**
- Verifications: ~$100 (assuming 2 verifications per login)
- **Total: ~$100/month**

*Note: Higher cost than basic SMS but includes advanced security features*

## 🛠 Troubleshooting

### Common Issues:

**"Invalid credentials" error:**
- Double-check your Account SID and Auth Token
- Ensure no extra spaces in environment variables

**"Failed to send verification code" error:**
- Verify your Verify Service SID is correct
- Check Twilio account balance
- Ensure the phone number format is correct (+1234567890)
- Check if the phone number is blocked or invalid

**"Invalid phone number" error:**
- Must include country code
- US format: +1234567890
- International: +[country_code][number]

### Debugging:
1. Check browser console for errors
2. Check server logs for Twilio responses
3. Verify environment variables are loaded
4. Test with the `/api/test-sms` endpoint

## 🌍 International Support

The system supports international phone numbers:
- **US/Canada**: +1234567890
- **UK**: +441234567890
- **Australia**: +61234567890
- **Germany**: +491234567890

Just ensure the country code is included.

## 📋 Database Schema

The following fields were added to the User table:

```sql
-- Added to User table
twoFactorEnabled      Boolean   @default(false)
twoFactorPhone        String?
twoFactorSecret       String?
twoFactorBackupCodes  String[]
```

**Note:** No separate verification table needed - Twilio Verify handles all verification state management.

## 🚦 What's Next?

Consider these enhancements:
1. **App-based 2FA** (Google Authenticator, Authy)
2. **Email 2FA** as fallback
3. **Trusted devices** (remember for 30 days)
4. **Admin 2FA requirements** for certain roles
5. **SMS templates** customization
6. **Multiple phone numbers** per user

---

## ✅ Setup Complete!

Your SMS-based 2FA is now ready. Users can enable it in their Settings page, and it will be required at login for enhanced security.

**Need help?** Check the troubleshooting section above or review the Twilio documentation. 