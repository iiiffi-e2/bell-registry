/**
 * Copyright © 2025 Bell Registry. All rights reserved.
 * Unauthorized copying, distribution, modification, or use is prohibited.
 * Proprietary and confidential.
 */

#!/usr/bin/env node

/**
 * CORS Test Script
 * 
 * This script tests if the S3 CORS configuration is working properly.
 * Run this script to verify that direct uploads to S3 will work.
 * 
 * Usage: node scripts/test-cors.js
 */

const https = require('https');

console.log("🧪 Testing S3 CORS Configuration");
console.log("================================\n");

// Test CORS preflight request to S3
const testCorsPreflight = () => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'bell-registry-bucket.s3.us-east-2.amazonaws.com',
      port: 443,
      path: '/uploads/test-file.mp4',
      method: 'OPTIONS',
      headers: {
        'Origin': 'https://app.bellregistry.com',
        'Access-Control-Request-Method': 'PUT',
        'Access-Control-Request-Headers': 'Content-Type'
      }
    };

    const req = https.request(options, (res) => {
      console.log(`📡 CORS Preflight Response Status: ${res.statusCode}`);
      console.log(`📋 CORS Headers:`);
      
      const corsHeaders = [
        'access-control-allow-origin',
        'access-control-allow-methods',
        'access-control-allow-headers',
        'access-control-max-age'
      ];
      
      corsHeaders.forEach(header => {
        const value = res.headers[header];
        if (value) {
          console.log(`   ✅ ${header}: ${value}`);
        } else {
          console.log(`   ❌ ${header}: Not present`);
        }
      });
      
      if (res.statusCode === 200 && res.headers['access-control-allow-origin']) {
        console.log("\n✅ CORS configuration appears to be working!");
        resolve(true);
      } else {
        console.log("\n❌ CORS configuration needs attention.");
        resolve(false);
      }
    });

    req.on('error', (error) => {
      console.log(`❌ Error testing CORS: ${error.message}`);
      reject(error);
    });

    req.end();
  });
};

// Run the test
testCorsPreflight()
  .then((success) => {
    if (success) {
      console.log("\n🎉 You can now enable direct S3 uploads by setting enableDirectUpload = true in the upload components.");
    } else {
      console.log("\n🔧 Please check your S3 CORS configuration:");
      console.log("   1. Go to AWS S3 Console");
      console.log("   2. Find bucket: bell-registry-bucket");
      console.log("   3. Permissions tab → CORS");
      console.log("   4. Ensure the configuration includes your domain");
      console.log("   5. Wait 5-10 minutes for changes to propagate");
    }
  })
  .catch((error) => {
    console.log(`\n❌ Test failed: ${error.message}`);
  });
