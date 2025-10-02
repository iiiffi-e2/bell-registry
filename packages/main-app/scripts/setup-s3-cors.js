/**
 * Copyright © 2025 Bell Registry. All rights reserved.
 * Unauthorized copying, distribution, modification, or use is prohibited.
 * Proprietary and confidential.
 */

#!/usr/bin/env node

/**
 * S3 CORS Configuration Script
 * 
 * This script helps you configure CORS for your S3 bucket to allow direct uploads.
 * Run this script to get the CORS configuration JSON that you need to apply in AWS Console.
 * 
 * Usage: node scripts/setup-s3-cors.js
 */

const corsConfiguration = {
  "CORSRules": [
    {
      "AllowedHeaders": ["*"],
      "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
      "AllowedOrigins": [
        "https://app.bellregistry.com",
        "https://bellregistry.com",
        "http://localhost:3000" // For development
      ],
      "ExposeHeaders": ["ETag"],
      "MaxAgeSeconds": 3000
    }
  ]
};

console.log("🔧 S3 CORS Configuration");
console.log("========================\n");
console.log("To fix the CORS issue, you need to configure your S3 bucket with the following CORS policy:\n");
console.log(JSON.stringify(corsConfiguration, null, 2));
console.log("\n📋 Steps to apply this configuration:");
console.log("1. Go to AWS S3 Console");
console.log("2. Find your bucket: bell-registry-bucket");
console.log("3. Click on the 'Permissions' tab");
console.log("4. Scroll down to 'Cross-origin resource sharing (CORS)'");
console.log("5. Click 'Edit' and paste the above JSON configuration");
console.log("6. Save changes");
console.log("\n⚠️  Note: This configuration allows uploads from your production domain and localhost for development.");
console.log("\n✅ After applying this configuration, large file uploads (over 4MB) should work without CORS errors.");
