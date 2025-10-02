/**
 * Copyright © 2025 Bell Registry. All rights reserved.
 * Unauthorized copying, distribution, modification, or use is prohibited.
 * Proprietary and confidential.
 */

#!/usr/bin/env node

/**
 * S3 Upload Test Script
 * 
 * This script tests the S3 pre-signed URL generation and upload process.
 * It will help identify what's causing the 400 error.
 * 
 * Usage: node scripts/test-s3-upload.js
 */

const https = require('https');

console.log("🧪 Testing S3 Pre-signed URL Generation");
console.log("=====================================\n");

// Test the pre-signed URL API endpoint
const testPresignedUrl = async () => {
  try {
    // Create a test file blob
    const testFile = new Blob(['test content'], { type: 'video/mp4' });
    
    const response = await fetch('http://localhost:3000/api/upload/presigned-url', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fileName: 'test-video.mp4',
        fileType: 'video/mp4',
        uploadType: 'media',
      }),
    });

    if (!response.ok) {
      throw new Error(`Pre-signed URL API failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log("✅ Pre-signed URL generated successfully");
    console.log(`📁 File name: ${data.fileName}`);
    console.log(`🔗 File URL: ${data.fileUrl}`);
    console.log(`⏰ Pre-signed URL expires in 5 minutes`);
    
    return data;
  } catch (error) {
    console.log(`❌ Pre-signed URL generation failed: ${error.message}`);
    return null;
  }
};

// Test S3 upload with the pre-signed URL
const testS3Upload = async (presignedData) => {
  if (!presignedData) return false;

  try {
    const testContent = 'This is a test file for S3 upload';
    
    const response = await fetch(presignedData.presignedUrl, {
      method: 'PUT',
      body: testContent,
      headers: {
        'Content-Type': 'video/mp4',
      },
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");
      console.log(`❌ S3 upload failed: ${response.status} ${response.statusText}`);
      console.log(`📋 Error details: ${errorText}`);
      return false;
    }

    console.log("✅ S3 upload successful!");
    console.log(`🔗 File accessible at: ${presignedData.fileUrl}`);
    return true;
  } catch (error) {
    console.log(`❌ S3 upload error: ${error.message}`);
    return false;
  }
};

// Run the tests
const runTests = async () => {
  console.log("1️⃣ Testing pre-signed URL generation...");
  const presignedData = await testPresignedUrl();
  
  if (presignedData) {
    console.log("\n2️⃣ Testing S3 upload...");
    const uploadSuccess = await testS3Upload(presignedData);
    
    if (uploadSuccess) {
      console.log("\n🎉 All tests passed! S3 uploads should work.");
    } else {
      console.log("\n🔧 S3 upload failed. Check the error details above.");
      console.log("Common issues:");
      console.log("  - S3 bucket permissions");
      console.log("  - AWS credentials");
      console.log("  - Bucket CORS configuration");
      console.log("  - Pre-signed URL parameters");
    }
  }
};

// Check if we're in a browser environment
if (typeof fetch === 'undefined') {
  console.log("❌ This script requires a browser environment with fetch API");
  console.log("💡 Run this test in your browser's developer console instead");
  console.log("\n📋 Manual test steps:");
  console.log("1. Open your app in the browser");
  console.log("2. Open Developer Tools (F12)");
  console.log("3. Go to Console tab");
  console.log("4. Copy and paste this script");
  console.log("5. Press Enter to run");
} else {
  runTests();
}
