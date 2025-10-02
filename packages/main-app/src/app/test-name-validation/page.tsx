/**
 * Copyright © 2025 Bell Registry. All rights reserved.
 * Unauthorized copying, distribution, modification, or use is prohibited.
 * Proprietary and confidential.
 */

"use client";

import { testNameValidation } from "@/lib/utils";

export default function TestNameValidationPage() {
  const runTests = () => {
    testNameValidation();
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            Name Validation Test
          </h1>
          
          <p className="text-gray-600 mb-6">
            This page tests the name validation function that prevents users from including their first name, last name, or full name in their bio and about me fields.
          </p>

          <button
            onClick={runTests}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Run Tests
          </button>

          <div className="mt-6 p-4 bg-gray-100 rounded-md">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Test Cases:</h2>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• &ldquo;My name is John and I love cooking&rdquo; (should fail - contains first name)</li>
              <li>• &ldquo;I am a professional Doe with 10 years experience&rdquo; (should fail - contains last name)</li>
              <li>• &ldquo;John Doe is a great chef&rdquo; (should fail - contains full name)</li>
              <li>• &ldquo;I am a professional chef with 10 years experience&rdquo; (should pass)</li>
              <li>• &ldquo;My colleague Johnny is great&rdquo; (should pass - partial match)</li>
            </ul>
          </div>

          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
            <h2 className="text-lg font-semibold text-yellow-800 mb-2">How it works:</h2>
            <p className="text-sm text-yellow-700">
              The validation function checks if a user&apos;s first name, last name, or full name appears in text fields like bio, &ldquo;What I&apos;m Seeking&rdquo;, &ldquo;Why I Enjoy This Work&rdquo;, &ldquo;What Sets Me Apart&rdquo;, and &ldquo;Ideal Environment&rdquo;. 
              It uses case-insensitive matching and provides specific error messages telling users exactly what needs to be removed.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 