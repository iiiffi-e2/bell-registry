import React from 'react'

// Regular expression to match URLs
const URL_REGEX = /(https?:\/\/[^\s]+)/g

// Function to detect if text contains URLs
export function containsUrls(text: string): boolean {
  const regex = new RegExp(URL_REGEX.source, 'g')
  return regex.test(text)
}

// Function to convert text with URLs into React elements with clickable links
export function linkifyText(text: string, isOwnMessage: boolean = false): React.ReactNode[] {
  if (!containsUrls(text)) {
    return [text]
  }

  const regex = new RegExp(URL_REGEX.source, 'g')
  const parts = text.split(regex)
  
  return parts.map((part, index) => {
    const urlRegex = new RegExp(URL_REGEX.source)
    if (urlRegex.test(part)) {
      // Different styles for own messages vs others
      const linkClassName = isOwnMessage 
        ? 'text-blue-100 hover:text-white underline break-all'
        : 'text-blue-600 hover:text-blue-800 underline break-all'
      
      return React.createElement('a', {
        key: index,
        href: part,
        target: '_blank',
        rel: 'noopener noreferrer',
        className: linkClassName
      }, part)
    }
    return part
  })
}

// Function to validate URL format
export function isValidUrl(string: string): boolean {
  try {
    const url = new URL(string)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch (_) {
    return false
  }
} 