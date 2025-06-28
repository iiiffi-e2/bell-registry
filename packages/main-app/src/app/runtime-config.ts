// This configuration ensures proper handling of dynamic behavior
export const dynamic = 'force-dynamic'
export const runtime = 'edge'
export const preferredRegion = 'auto'

// Disable static page generation
export const generateStaticParams = () => {
  return []
} 