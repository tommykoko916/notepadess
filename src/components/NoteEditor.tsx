
import { useState, useEffect, useRef } from 'react';
import { Note, AutocompleteOption } from '@/types/noteTypes';
import { Textarea } from '@/components/ui/textarea';

interface NoteEditorProps {
  note: Note;
  updateContent: (content: string) => void;
  isAutocompleteEnabled: boolean;
}

const NoteEditor: React.FC<NoteEditorProps> = ({ 
  note,
  updateContent,
  isAutocompleteEnabled
}) => {
  const [content, setContent] = useState(note.content);
  const [autoSaveTimer, setAutoSaveTimer] = useState<NodeJS.Timeout | null>(null);
  const [wordSuggestions, setWordSuggestions] = useState<AutocompleteOption[]>([]);
  const [cursorPosition, setCursorPosition] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const [dictWords, setDictWords] = useState<Set<string>>(new Set());
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Update content when note changes
  useEffect(() => {
    setContent(note.content);
  }, [note.id, note.content]);

  // Handle auto-save
  useEffect(() => {
    // Clear existing timer
    if (autoSaveTimer) {
      clearTimeout(autoSaveTimer);
    }
    
    // Set new timer to save after 2 seconds of inactivity
    const timer = setTimeout(() => {
      updateContent(content);
    }, 2000);
    
    setAutoSaveTimer(timer);
    
    // Cleanup on unmount
    return () => {
      if (autoSaveTimer) {
        clearTimeout(autoSaveTimer);
      }
    };
  }, [content]);

  // Build word dictionary from user input
  useEffect(() => {
    if (!isAutocompleteEnabled) return;
    
    const words = content
      .split(/\s+/)
      .filter(word => word.length > 3)
      .map(word => word.toLowerCase().replace(/[^a-z]/g, ''));
    
    setDictWords(new Set([...dictWords, ...words]));
  }, [content, isAutocompleteEnabled]);

  // Handle content changes and autocomplete suggestions
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent(newContent);
    
    if (isAutocompleteEnabled) {
      generateWordSuggestions(newContent, e.target);
    } else {
      setWordSuggestions([]);
    }
  };

  // Generate word suggestions based on current input
  const generateWordSuggestions = (text: string, textArea: HTMLTextAreaElement) => {
    const cursorPos = textArea.selectionStart;
    const textBeforeCursor = text.substring(0, cursorPos);
    
    // Find the word being typed
    const match = textBeforeCursor.match(/\b(\w{2,})$/);
    
    if (match && match[1]) {
      const currentWord = match[1].toLowerCase();
      
      if (currentWord.length >= 2) {
        // Get matching words from dictionary
        const matches = Array.from(dictWords)
          .filter(word => 
            word.startsWith(currentWord) && 
            word !== currentWord
          )
          .slice(0, 5)
          .map(word => ({
            text: word,
            index: match.index || 0
          }));
        
        setWordSuggestions(matches);
        
        // Calculate position for suggestion popup
        const cursorCoords = getCursorCoordinates(textArea, cursorPos);
        setCursorPosition(cursorCoords);
      } else {
        setWordSuggestions([]);
      }
    } else {
      setWordSuggestions([]);
    }
  };

  // Get cursor coordinates for positioning the suggestion popup
  const getCursorCoordinates = (textarea: HTMLTextAreaElement, cursorPos: number) => {
    // Create a copy of the textarea to measure text position
    const div = document.createElement('div');
    const span = document.createElement('span');
    
    // Copy textarea styles
    const styles = window.getComputedStyle(textarea);
    for (const style of styles) {
      div.style[style as any] = styles.getPropertyValue(style);
    }
    
    // Set content and positioning
    div.style.position = 'absolute';
    div.style.visibility = 'hidden';
    div.style.whiteSpace = 'pre-wrap';
    
    const text = textarea.value.substring(0, cursorPos);
    div.textContent = text;
    span.textContent = '|';
    div.appendChild(span);
    document.body.appendChild(div);
    
    // Get position
    const rect = span.getBoundingClientRect();
    
    // Cleanup
    document.body.removeChild(div);
    
    return {
      top: rect.top + window.scrollY + 20,
      left: rect.left + window.scrollX
    };
  };

  // Apply a suggested word
  const applySuggestion = (suggestion: AutocompleteOption) => {
    const cursorPos = textareaRef.current?.selectionStart || 0;
    const textBeforeCursor = content.substring(0, cursorPos);
    
    // Find the partial word
    const match = textBeforeCursor.match(/\b(\w+)$/);
    
    if (match) {
      const partialWord = match[1];
      const startPos = cursorPos - partialWord.length;
      
      // Replace the partial word with the suggestion
      const newContent = 
        content.substring(0, startPos) + 
        suggestion.text + 
        content.substring(cursorPos);
      
      setContent(newContent);
      setWordSuggestions([]);
      
      // Move cursor to end of inserted word
      setTimeout(() => {
        if (textareaRef.current) {
          const newPos = startPos + suggestion.text.length;
          textareaRef.current.focus();
          textareaRef.current.setSelectionRange(newPos, newPos);
        }
      }, 0);
    }
  };

  return (
    <div className="relative h-full">
      <Textarea
        ref={textareaRef}
        value={content}
        onChange={handleContentChange}
        placeholder="Start typing your notes..."
        className="w-full h-full min-h-[calc(100vh-12rem)] resize-none border-none rounded-none focus-visible:ring-0 focus-visible:ring-offset-0 text-base"
      />
      
      {wordSuggestions.length > 0 && (
        <div 
          className="absolute bg-popover border rounded shadow-md p-1 z-10"
          style={{
            top: `${cursorPosition.top}px`,
            left: `${cursorPosition.left}px`,
            position: 'fixed'
          }}
        >
          {wordSuggestions.map((suggestion, index) => (
            <div
              key={index}
              className="px-2 py-1 cursor-pointer hover:bg-accent rounded text-sm"
              onClick={() => applySuggestion(suggestion)}
            >
              {suggestion.text}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NoteEditor;
