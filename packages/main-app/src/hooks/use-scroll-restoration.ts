/**
 * Copyright © 2025 Bell Registry. All rights reserved.
 * Unauthorized copying, distribution, modification, or use is prohibited.
 * Proprietary and confidential.
 */

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Hook to restore scroll position to top when navigating between pages
 * This fixes the issue where scroll position is maintained during client-side navigation
 */
export function useScrollRestoration() {
  const pathname = usePathname();

  useEffect(() => {
    // Scroll to top when pathname changes
    // Use requestAnimationFrame to ensure DOM is ready
    const scrollToTop = () => {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    };
    
    // Try immediate scroll first
    scrollToTop();
    
    // Also try after a brief delay to handle any async content loading
    const timeoutId = setTimeout(scrollToTop, 0);
    
    return () => clearTimeout(timeoutId);
  }, [pathname]);
}