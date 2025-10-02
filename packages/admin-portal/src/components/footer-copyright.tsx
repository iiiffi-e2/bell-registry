/**
 * Copyright © 2025 Bell Registry. All rights reserved.
 * Unauthorized copying, distribution, modification, or use is prohibited.
 * Proprietary and confidential.
 */

import React from 'react';

export function FooterCopyright() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="mt-auto py-4 border-t border-gray-200 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center text-sm text-gray-600">
          © {currentYear} Bell Registry. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
