import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import NoteEditor from '@/components/NoteEditor';
import ThemeToggle from '@/components/ThemeToggle';
import NoteControls from '@/components/NoteControls';
import NoteStats from '@/components/NoteStats';
import { toast } from '@/components/ui/sonner';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Note, HistoryEntry } from '@/types/noteTypes';
import EmptyState from '@/components/EmptyState';

const Index = () => {
  const [notes, setNotes] = useLocalStorage<Note[]>('notes', []);
  const [activeNoteId, setActiveNoteId] = useLocalStorage<string | null>('activeNoteId', null);
  const [isAutocompleteEnabled, setIsAutocompleteEnabled] = useLocalStorage('autocompleteEnabled', true);
  
  const activeNote = notes.find(note => note.id === activeNoteId) || null;
  
  const createNewNote = () => {
    const newNote: Note = {
      id: Date.now().toString(),
      title: 'Untitled Note',
      content: '',
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
      history: [],
    };
    
    setNotes([...notes, newNote]);
    setActiveNoteId(newNote.id);
    toast.success('New note created');
  };

  const updateNoteContent = (id: string, content: string) => {
    setNotes(notes.map(note => {
      if (note.id === id) {
        const currentContent = note.content;
        const newHistory = [...note.history];
        
        if (currentContent !== content) {
          if (newHistory.length >= 10) {
            newHistory.shift();
          }
          
          const historyEntry: HistoryEntry = {
            content: currentContent,
            timestamp: new Date().toISOString()
          };
          
          newHistory.push(historyEntry);
        }
        
        return {
          ...note,
          content,
          updated: new Date().toISOString(),
          history: newHistory,
        };
      }
      return note;
    }));
  };

  const updateNoteTitle = (id: string, title: string) => {
    setNotes(notes.map(note => 
      note.id === id 
        ? { ...note, title, updated: new Date().toISOString() } 
        : note
    ));
  };

  const deleteNote = (id: string) => {
    const noteToDelete = notes.find(note => note.id === id);
    if (!noteToDelete) return;
    
    if (confirm(`Are you sure you want to delete "${noteToDelete.title}"?`)) {
      const updatedNotes = notes.filter(note => note.id !== id);
      setNotes(updatedNotes);
      
      if (activeNoteId === id) {
        setActiveNoteId(updatedNotes.length > 0 ? updatedNotes[0].id : null);
      }
      
      toast.success('Note deleted');
    }
  };

  const downloadNote = (id: string) => {
    const note = notes.find(note => note.id === id);
    if (!note) return;
    
    const blob = new Blob([note.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    
    a.href = url;
    a.download = `${note.title.replace(/[^\w\s]/gi, '')}.txt`;
    document.body.appendChild(a);
    a.click();
    
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Note downloaded successfully');
  };

  const exportAllNotes = () => {
    const blob = new Blob([JSON.stringify(notes, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    
    a.href = url;
    a.download = 'notepad-backup.json';
    document.body.appendChild(a);
    a.click();
    
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('All notes exported successfully');
  };

  const importNotes = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedNotes = JSON.parse(e.target?.result as string);
        if (Array.isArray(importedNotes)) {
          setNotes([...notes, ...importedNotes]);
          toast.success(`Imported ${importedNotes.length} notes successfully`);
        } else {
          toast.error('Invalid notes format');
        }
      } catch (error) {
        toast.error('Failed to import notes');
        console.error(error);
      }
    };
    reader.readAsText(file);
  };

  const restoreFromHistory = (noteId: string, historyIndex: number) => {
    setNotes(notes.map(note => {
      if (note.id === noteId && note.history[historyIndex]) {
        const restoredContent = note.history[historyIndex].content;
        
        const newHistory = note.history.slice(0, historyIndex);
        
        return {
          ...note,
          content: restoredContent,
          updated: new Date().toISOString(),
          history: newHistory
        };
      }
      return note;
    }));
    
    toast.success('Note restored from history');
  };

  useEffect(() => {
    if (notes.length === 0) {
      createNewNote();
    } else if (activeNoteId === null && notes.length > 0) {
      setActiveNoteId(notes[0].id);
    }
  }, [notes.length]);

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar 
        notes={notes}
        activeNoteId={activeNoteId}
        setActiveNoteId={setActiveNoteId}
        createNewNote={createNewNote}
        deleteNote={deleteNote}
        exportAllNotes={exportAllNotes}
        importNotes={importNotes}
      />
      
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b">
          <h1 className="text-xl font-bold">Sleek Notes</h1>
          <ThemeToggle />
        </div>
        
        {activeNote ? (
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            <div className="px-6 pt-6">
              <input 
                type="text" 
                value={activeNote.title} 
                onChange={(e) => updateNoteTitle(activeNote.id, e.target.value)}
                className="w-full text-2xl font-semibold bg-transparent border-none outline-none mb-2"
                placeholder="Note Title"
              />
              <NoteStats content={activeNote.content} />
            </div>
            
            <div className="flex-1 overflow-hidden px-6">
              <NoteEditor 
                note={activeNote}
                updateContent={(content) => updateNoteContent(activeNote.id, content)} 
                isAutocompleteEnabled={isAutocompleteEnabled}
              />
            </div>
            
            <NoteControls 
              note={activeNote}
              downloadNote={() => downloadNote(activeNote.id)}
              restoreFromHistory={restoreFromHistory}
              isAutocompleteEnabled={isAutocompleteEnabled}
              setIsAutocompleteEnabled={setIsAutocompleteEnabled}
            />
          </div>
        ) : (
          <EmptyState createNewNote={createNewNote} />
        )}
      </main>
    </div>
  );
};

export default Index;
