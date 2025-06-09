'use client'

import { linkifyText } from '@/lib/url-utils'

export default function TestUrlLinkifyPage() {
  const testMessages = [
    "Hello, please check out this website: https://example.com",
    "You can visit http://github.com for more info",
    "Multiple URLs: https://google.com and https://stackoverflow.com are useful",
    "No URLs in this message",
    "Mixed content: Visit https://nextjs.org for docs and let me know what you think!",
    "URL at start: https://vercel.com is a great platform",
    "URL at end: Check out this cool site https://typescript.org"
  ]

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">URL Linkification Test</h1>
      
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold mb-4">Test Messages (Own Message Style)</h2>
          <div className="space-y-4">
            {testMessages.map((message, index) => (
              <div key={index} className="flex justify-end">
                <div className="max-w-[70%] rounded-lg px-4 py-2 bg-blue-500 text-white">
                  <p className="text-sm">{linkifyText(message, true)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">Test Messages (Other User Style)</h2>
          <div className="space-y-4">
            {testMessages.map((message, index) => (
              <div key={index} className="flex justify-start">
                <div className="max-w-[70%] rounded-lg px-4 py-2 bg-gray-100 text-gray-900">
                  <p className="text-sm">{linkifyText(message, false)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h3 className="font-semibold text-yellow-800 mb-2">Test Instructions:</h3>
        <ul className="text-yellow-700 text-sm space-y-1">
          <li>• URLs should be clickable and colored differently</li>
          <li>• Links should open in a new tab when clicked</li>
          <li>• Blue messages (own) should have light blue links</li>
          <li>• Gray messages (others) should have dark blue links</li>
          <li>• URLs should have hover effects</li>
        </ul>
      </div>
    </div>
  )
} 