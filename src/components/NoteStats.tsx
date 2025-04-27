
import { useState, useEffect } from 'react';

interface NoteStatsProps {
  content: string;
}

const NoteStats: React.FC<NoteStatsProps> = ({ content }) => {
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [readingTime, setReadingTime] = useState('');

  useEffect(() => {
    // Calculate word count (excluding blank spaces)
    const words = content
      .trim()
      .split(/\s+/)
      .filter(word => word.length > 0);
    setWordCount(words.length);
    
    // Calculate character count (including spaces)
    setCharCount(content.length);
    
    // Calculate reading time (average reading speed: 200 words per minute)
    const minutes = Math.ceil(words.length / 200);
    setReadingTime(minutes < 1 ? 'less than 1 min' : `${minutes} min`);
  }, [content]);

  return (
    <div className="flex gap-4 text-xs text-muted-foreground mb-2">
      <span>{wordCount} words</span>
      <span>{charCount} characters</span>
      <span>{readingTime} read</span>
    </div>
  );
};

export default NoteStats;
