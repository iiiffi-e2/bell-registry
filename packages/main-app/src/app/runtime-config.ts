/**
 * Copyright © 2025 Bell Registry. All rights reserved.
 * Unauthorized copying, distribution, modification, or use is prohibited.
 * Proprietary and confidential.
 */

// This configuration ensures proper handling of dynamic behavior
export const dynamic = 'force-dynamic'
export const runtime = 'edge'
export const preferredRegion = 'auto'

// Disable static page generation
export const generateStaticParams = () => {
  return []
} 