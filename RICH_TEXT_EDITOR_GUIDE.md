> Copyright © 2025 Bell Registry. All rights reserved.
> Unauthorized copying, distribution, modification, or use is prohibited.
> Proprietary and confidential.
>

# WYSIWYG Rich Text Editor for Job Descriptions

## Overview

The job description field now supports a true WYSIWYG (What You See Is What You Get) editor that allows employers to create visually appealing and structured job postings. The editor shows the actual formatted text while you're typing, making it much more intuitive to use.

## Features

The WYSIWYG editor provides:
- **Bold text** with real-time visual feedback
- **Italic text** with real-time visual feedback  
- **Bullet points** with proper list formatting
- **Live preview** - you see exactly how the text will appear
- **Keyboard shortcuts** for quick formatting
- **Clean, simple interface** without overwhelming options

## How to Use

### In the Job Posting Form

1. **Bold Text**: 
   - Select the text you want to make bold
   - Click the **B** button in the toolbar, or press Ctrl+B
   - The text will immediately appear bold in the editor

2. **Italic Text**:
   - Select the text you want to make italic
   - Click the *I* button in the toolbar, or press Ctrl+I
   - The text will immediately appear italic in the editor

3. **Bullet Points**:
   - Click the bullet list button in the toolbar
   - Start typing to create a bullet point
   - Press Enter to add more bullet points
   - Press Enter twice to exit the bullet list

### Keyboard Shortcuts

- `Ctrl+B` (or `Cmd+B` on Mac): Make selected text bold
- `Ctrl+I` (or `Cmd+I` on Mac): Make selected text italic
- `Enter`: Create new line or bullet point
- `Shift+Enter`: Create new line without creating a new paragraph

### Example Usage

**What you see in the editor:**
- "About the Role:" appears in **bold**
- "Estate Manager" appears in *italic*
- "Key Responsibilities:" appears in **bold**
- Bullet points are properly formatted as a list with actual bullet symbols

**What gets saved:**
The editor automatically converts the formatted content to a simple markdown-like format for storage:
```
**About the Role:**
We are seeking an experienced *Estate Manager* to oversee our luxury property.

**Key Responsibilities:**
• Manage daily operations of the estate
• Supervise household staff
• Coordinate with vendors and contractors
• Maintain property standards
```

## Technical Details

- **TipTap Editor**: Built on top of the popular TipTap rich text editor framework
- **Real-time Preview**: You see the actual formatting as you type
- **Simple Storage**: Content is automatically converted to a lightweight markdown-like format for database storage
- **Consistent Display**: The same formatting is preserved when viewing job postings
- **Security**: Only allows safe formatting options (bold, italic, lists) to prevent XSS attacks

## Where It's Used

The WYSIWYG editor is available in:
- Job posting form (`/dashboard/employer/jobs/post`)
- Job editing form (`/dashboard/employer/jobs/[slug]/edit`)

The formatted text is displayed in:
- Public job details page (`/jobs/[slug]`)
- Dashboard job details page (`/dashboard/jobs/[slug]`)
- Employer job details page (`/dashboard/employer/jobs/[slug]`)

## Benefits

1. **Intuitive Experience**: See exactly how your text will look while editing
2. **Better Readability**: Bold headings and bullet points make job descriptions easier to scan
3. **Professional Appearance**: Properly formatted job postings look more professional
4. **Structured Information**: Bullet points help organize requirements and responsibilities
5. **User-Friendly**: Simple formatting options that don't overwhelm users
6. **No Learning Curve**: Works like familiar word processors

## Migration from Previous Version

If you have existing job descriptions with the old markdown-like format (`**bold**`, `*italic*`, `• bullets`), they will automatically be converted to the new WYSIWYG format when you edit them. The display of existing job postings remains unchanged.

## Troubleshooting

- **Editor not loading**: Make sure you have a stable internet connection as TipTap requires some external dependencies
- **Formatting not working**: Try refreshing the page if the editor seems unresponsive
- **Keyboard shortcuts not working**: Make sure you're using Ctrl (Windows/Linux) or Cmd (Mac) with the letter keys 