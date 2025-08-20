"use client";

import React, { useEffect, useState } from "react";
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { Button } from "./button";
import { Bold, Italic, List } from "lucide-react";
import { cn } from "@/lib/utils";

interface WysiwygEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: string;
}

export function WysiwygEditor({
  value,
  onChange,
  placeholder = "Enter text...",
  className,
  minHeight = "200px"
}: WysiwygEditorProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [activeFormats, setActiveFormats] = useState({
    bold: false,
    italic: false,
    bulletList: false,
  });

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        codeBlock: false,
        blockquote: false,
        horizontalRule: false,
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange(html);
    },
    onSelectionUpdate: ({ editor }) => {
      // Update active formats when selection changes
      setActiveFormats({
        bold: editor.isActive('bold'),
        italic: editor.isActive('italic'),
        bulletList: editor.isActive('bulletList'),
      });
    },
    immediatelyRender: false,
  });

  // Sync active formats when editor is ready
  useEffect(() => {
    if (editor) {
      setActiveFormats({
        bold: editor.isActive('bold'),
        italic: editor.isActive('italic'),
        bulletList: editor.isActive('bulletList'),
      });
    }
  }, [editor]);

  // Sync editor content when value prop changes externally
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      // Convert plain text to HTML if it's not already HTML
      const htmlContent = convertTextToHtml(value);
      // Clear the editor first, then insert the new content
      editor.commands.clearContent();
      editor.commands.insertContent(htmlContent);
    }
  }, [editor, value]);

  // Helper function to convert plain text to HTML while preserving formatting
  const convertTextToHtml = (text: string): string => {
    if (!text) return '';
    
    // Check if the text already contains HTML tags
    if (/<[^>]*>/.test(text)) {
      return text; // Already HTML, return as-is
    }
    
    // Convert plain text to HTML with proper paragraph breaks
    return text
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map(line => `<p>${line}</p>`)
      .join('');
  };

  // Don't render until component is mounted on client
  if (!isMounted || !editor) {
    return (
      <div className={cn("border rounded-md", className)}>
        <div className="flex items-center gap-1 p-2 border-b bg-gray-50 rounded-t-md">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled
            className="h-8 w-8 p-0"
            title="Bold (Ctrl+B)"
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled
            className="h-8 w-8 p-0"
            title="Italic (Ctrl+I)"
          >
            <Italic className="h-4 w-4" />
          </Button>
          <div className="w-px h-6 bg-gray-300 mx-1" />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled
            className="h-8 w-8 p-0"
            title="Bullet List"
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
        <div
          className="border-0 rounded-none rounded-b-md"
          style={{ minHeight }}
        >
          <div className="p-3 text-gray-500">
            {placeholder}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("border rounded-md", className)}>
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-2 border-b bg-gray-50 rounded-t-md">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            editor.chain().focus().toggleBold().run();
            // Immediately update the active state
            setActiveFormats(prev => ({
              ...prev,
              bold: !prev.bold
            }));
          }}
          className={cn(
            "h-8 w-8 p-0 transition-colors",
            activeFormats.bold 
              ? 'bg-blue-100 text-blue-700 border border-blue-200' 
              : 'hover:bg-gray-100'
          )}
          title="Bold (Ctrl+B)"
        >
          <Bold className={cn("h-4 w-4", activeFormats.bold ? 'font-bold' : '')} />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            editor.chain().focus().toggleItalic().run();
            // Immediately update the active state
            setActiveFormats(prev => ({
              ...prev,
              italic: !prev.italic
            }));
          }}
          className={cn(
            "h-8 w-8 p-0 transition-colors",
            activeFormats.italic 
              ? 'bg-blue-100 text-blue-700 border border-blue-200' 
              : 'hover:bg-gray-100'
          )}
          title="Italic (Ctrl+I)"
        >
          <Italic className={cn("h-4 w-4", activeFormats.italic ? 'italic' : '')} />
        </Button>
        <div className="w-px h-6 bg-gray-300 mx-1" />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            editor.chain().focus().toggleBulletList().run();
            // Immediately update the active state
            setActiveFormats(prev => ({
              ...prev,
              bulletList: !prev.bulletList
            }));
          }}
          className={cn(
            "h-8 w-8 p-0 transition-colors",
            activeFormats.bulletList 
              ? 'bg-blue-100 text-blue-700 border border-blue-200' 
              : 'hover:bg-gray-100'
          )}
          title="Bullet List"
        >
          <List className="h-4 w-4" />
        </Button>
      </div>

      {/* Editor Content */}
      <div 
        className="border-0 rounded-none rounded-b-md focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-0"
        style={{ minHeight }}
      >
        <EditorContent 
          editor={editor} 
          className="prose prose-sm max-w-none p-3 focus:outline-none"
        />
      </div>
    </div>
  );
} 