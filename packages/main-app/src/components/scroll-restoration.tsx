/**
 * Copyright © 2025 Bell Registry. All rights reserved.
 * Unauthorized copying, distribution, modification, or use is prohibited.
 * Proprietary and confidential.
 */

"use client";

import { useScrollRestoration } from "@/hooks/use-scroll-restoration";

/**
 * Component to handle scroll restoration across the entire app
 * This should be included at the root level to ensure all navigation
 * resets scroll position to the top of the page
 */
export function ScrollRestoration() {
  useScrollRestoration();
  return null;
}