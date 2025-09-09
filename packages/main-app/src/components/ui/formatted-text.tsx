interface FormattedTextProps {
  text: string | null;
  className?: string;
}

export function FormattedText({ text, className = "text-gray-700" }: FormattedTextProps) {
  if (!text) return null;
  
  // Normalize the text by handling different types of line breaks
  const normalizedText = text
    .replace(/\r\n/g, '\n') // Convert Windows line endings to Unix
    .replace(/\r/g, '\n');  // Convert Mac line endings to Unix
  
  // Split by double line breaks (actual paragraph breaks) first
  const paragraphs = normalizedText
    .split(/\n\s*\n/) // Split on double line breaks (with optional whitespace between)
    .map(paragraph => {
      // For each paragraph, join single line breaks with spaces
      // This handles copy-pasted text where each line has a line break but should be one paragraph
      return paragraph
        .split(/\n/)
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .join(' ');
    })
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