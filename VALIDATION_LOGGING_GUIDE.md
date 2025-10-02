> Copyright © 2025 Bell Registry. All rights reserved.
> Unauthorized copying, distribution, modification, or use is prohibited.
> Proprietary and confidential.
>

# Validation Error Logging Guide

This guide explains how to set up and analyze validation error logging for the profile form to identify where users are getting stuck.

## 🚀 Quick Setup

### 1. Enable Logging in Production

Add this to your production environment to capture logs:

```bash
# Redirect console output to log file
pm2 start app.js --log logs/app.log --error logs/error.log

# Or with Docker
docker run -v ./logs:/app/logs your-app

# Or with systemd
systemd-cat -t "bell-registry" node app.js
```

### 2. Log Analysis Commands

```bash
# Install the analysis script
chmod +x scripts/analyze-validation-logs.js

# Basic analysis
node scripts/analyze-validation-logs.js

# Get summary statistics
node scripts/analyze-validation-logs.js --format=summary

# Filter by specific error types
node scripts/analyze-validation-logs.js --filter="REQUIRED_FIELD"
node scripts/analyze-validation-logs.js --filter="SHORT_BIO"
node scripts/analyze-validation-logs.js --filter="INCOMPLETE_PROFILE"

# Export to JSON for further analysis
node scripts/analyze-validation-logs.js --format=json > validation-errors.json
```

## 📊 What Gets Logged

### Server-Side Logs
- **User Context**: ID, email, role, session info
- **Validation Errors**: Field names, error messages, attempted values
- **Form Analysis**: Provided fields, missing required fields, field lengths
- **Technical Context**: IP address, user agent, referrer
- **Categorization**: Error types, common issues, user segments

### Client-Side Logs
- **Browser Context**: User agent, referrer, form completion percentage
- **Validation State**: All form errors, field values
- **User Journey**: Attempt number, time on page

## 🔍 Common Search Patterns

### Find Most Problematic Fields
```bash
# Fields with most errors
node scripts/analyze-validation-logs.js --format=summary | grep "Fields with Most Errors" -A 20
```

### Identify Incomplete Profiles
```bash
# Users struggling with profile completion
node scripts/analyze-validation-logs.js --filter="INCOMPLETE_PROFILE"
```

### Track Bio Length Issues
```bash
# Users with bio length problems
node scripts/analyze-validation-logs.js --filter="SHORT_BIO"
```

### Analyze by User Type
```bash
# Employer/agency issues
node scripts/analyze-validation-logs.js --filter="EMPLOYER"

# New candidate issues
node scripts/analyze-validation-logs.js --filter="NEW_CANDIDATE"
```

## 📈 Log Analysis Examples

### Example 1: Daily Validation Error Report
```bash
#!/bin/bash
# daily-validation-report.sh

echo "=== Daily Validation Error Report ==="
echo "Date: $(date)"
echo ""

# Get today's errors
TODAY=$(date +%Y-%m-%d)
grep "$TODAY" logs/app.log | grep "VALIDATION_ERROR" | wc -l | xargs echo "Total errors today:"

# Get summary
node scripts/analyze-validation-logs.js --format=summary
```

### Example 2: Real-time Error Monitoring
```bash
# Watch for validation errors in real-time
tail -f logs/app.log | grep "VALIDATION_ERROR"
```

### Example 3: Error Frequency Analysis
```bash
# Count errors by hour
grep "VALIDATION_ERROR" logs/app.log | cut -d'"' -f4 | cut -d'T' -f2 | cut -d':' -f1 | sort | uniq -c
```

## 🎯 Key Metrics to Track

### 1. **Error Volume**
- Total validation errors per day/hour
- Error rate (errors per profile save attempt)

### 2. **Error Types**
- `REQUIRED_FIELD` - Missing required fields
- `MIN_LENGTH` - Text too short (especially bio)
- `MAX_LENGTH` - Text too long
- `INVALID_FORMAT` - Format validation failures

### 3. **Problem Fields**
- Most commonly failing fields
- Fields causing the most user frustration

### 4. **User Segments**
- `NEW_CANDIDATE` - Brand new users
- `PARTIAL_CANDIDATE` - Users who started but didn't finish
- `EMPLOYER`/`AGENCY` - Business users

### 5. **Common Issues**
- `INCOMPLETE_PROFILE` - Users missing multiple required fields
- `SHORT_BIO` - Users struggling with bio length requirement
- `LOCATION_VALIDATION` - Location field issues

## 🛠 Troubleshooting

### Logs Not Appearing?
1. Check console output redirection
2. Verify file permissions on log directory
3. Ensure the logging code is being executed

### Too Many Logs?
```bash
# Filter to only validation errors
grep "VALIDATION_ERROR" logs/app.log > logs/validation-only.log
```

### Log File Too Large?
```bash
# Rotate logs daily
logrotate -f /etc/logrotate.d/your-app

# Or manually
mv logs/app.log logs/app-$(date +%Y%m%d).log
touch logs/app.log
```

## 📋 Action Items Based on Common Findings

### High `REQUIRED_FIELD` Errors
- Review which fields are truly required
- Improve field labeling and help text
- Add better visual indicators for required fields

### High `SHORT_BIO` Errors
- Consider reducing minimum bio length
- Add character counter with suggestions
- Provide bio templates or examples

### High `INCOMPLETE_PROFILE` Errors
- Implement progressive disclosure
- Add save-as-draft functionality
- Improve onboarding flow

### Location Validation Issues
- Check location autocomplete functionality
- Provide better location format examples
- Consider making location optional for certain user types

## 🔧 Advanced Analysis

### Custom Queries
```bash
# Find users who tried multiple times
grep "VALIDATION_ERROR" logs/app.log | jq -r '.userId' | sort | uniq -c | sort -nr | head -10

# Error patterns by time of day
grep "VALIDATION_ERROR" logs/app.log | jq -r '.timestamp' | cut -d'T' -f2 | cut -d':' -f1 | sort | uniq -c

# Most common error messages
grep "VALIDATION_ERROR" logs/app.log | jq -r '.validationErrors[].message' | sort | uniq -c | sort -nr | head -20
```

### Integration with Monitoring Tools
```bash
# Send to Slack webhook
node scripts/analyze-validation-logs.js --format=summary | curl -X POST -H 'Content-type: application/json' --data '{"text":"'"$(cat)"'"}' $SLACK_WEBHOOK_URL

# Send to monitoring service
node scripts/analyze-validation-logs.js --format=json | curl -X POST -H 'Content-Type: application/json' -d @- $MONITORING_ENDPOINT
```

## 📞 Support

If you need help analyzing the logs or want to add more specific tracking, the logs are structured JSON that can be easily parsed and analyzed with standard tools.
