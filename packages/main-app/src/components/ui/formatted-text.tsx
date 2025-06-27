interface FormattedTextProps {
  text: string | null;
  className?: string;
}

export function FormattedText({ text, className = "text-gray-700" }: FormattedTextProps) {
  if (!text) return null;
  
  // Split text by single line breaks (paragraph breaks)
  const paragraphs = text
    .split(/\n/) // Split on single line breaks
    .map(paragraph => paragraph.trim())
    .filter(paragraph => paragraph.length > 0);
  
  if (paragraphs.length === 0) return null;
  
  // If there's only one paragraph, render it as a single paragraph
  if (paragraphs.length === 1) {
    return <p className={`${className} leading-relaxed`}>{paragraphs[0]}</p>;
  }
  
  // If there are multiple paragraphs, render them with spacing
  return (
    <div className="space-y-4">
      {paragraphs.map((paragraph, index) => (
        <p key={index} className={`${className} leading-relaxed`}>
          {paragraph}
        </p>
      ))}
    </div>
  );
} 