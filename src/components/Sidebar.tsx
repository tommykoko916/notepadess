
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Note } from '@/types/noteTypes';
import { Plus, Download, Upload, Trash2, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { useIsMobile } from '@/hooks/use-mobile';

interface SidebarProps {
  notes: Note[];
  activeNoteId: string | null;
  setActiveNoteId: (id: string) => void;
  createNewNote: () => void;
  deleteNote: (id: string) => void;
  exportAllNotes: () => void;
  importNotes: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  notes,
  activeNoteId,
  setActiveNoteId,
  createNewNote,
  deleteNote,
  exportAllNotes,
  importNotes,
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const isMobile = useIsMobile();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Auto-close sidebar on mobile
  React.useEffect(() => {
    if (isMobile) {
      setIsOpen(false);
    } else {
      setIsOpen(true);
    }
  }, [isMobile]);
  
  // Handle import button click
  const handleImportClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  return (
    <>
      {/* Mobile sidebar toggle */}
      {isMobile && (
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="fixed top-4 left-4 z-30 bg-primary text-primary-foreground rounded-full w-10 h-10 flex items-center justify-center shadow-lg"
        >
          <FileText className="w-5 h-5" />
        </button>
      )}
      
      <div 
        className={cn(
          "bg-sidebar border-r border-sidebar-border transition-all duration-300 flex flex-col h-screen",
          isOpen ? "w-64" : "w-0 opacity-0",
          isMobile && isOpen ? "fixed inset-y-0 left-0 z-20" : ""
        )}
      >
        <div className="p-4 border-b border-sidebar-border">
          <Button 
            onClick={createNewNote}
            className="w-full gap-2"
          >
            <Plus className="h-4 w-4" /> New Note
          </Button>
        </div>
        
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            {notes.length > 0 ? (
              <div className="py-2">
                {notes.map(note => (
                  <div
                    key={note.id}
                    onClick={() => setActiveNoteId(note.id)}
                    className={cn(
                      "flex items-start justify-between px-4 py-3 cursor-pointer group",
                      activeNoteId === note.id ? "bg-sidebar-accent text-sidebar-accent-foreground" : "hover:bg-sidebar/80",
                    )}
                  >
                    <div className="overflow-hidden">
                      <h3 className="font-medium truncate">{note.title || "Untitled Note"}</h3>
                      <p className="text-xs text-sidebar-foreground/70 truncate">
                        {format(new Date(note.updated), 'MMM d, yyyy · h:mm a')}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNote(note.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-sidebar-foreground/70 hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 px-4 text-center text-sidebar-foreground/70">
                <p>No notes yet</p>
              </div>
            )}
          </ScrollArea>
        </div>
        
        <div className="p-4 border-t border-sidebar-border space-y-2">
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1 gap-2"
              onClick={exportAllNotes}
            >
              <Download className="h-4 w-4" /> Export
            </Button>
            
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1 gap-2"
              onClick={handleImportClick}
            >
              <Upload className="h-4 w-4" /> Import
            </Button>
            
            <input
              type="file"
              accept=".json"
              ref={fileInputRef}
              onChange={importNotes}
              style={{ display: 'none' }}
            />
          </div>
        </div>
      </div>
      
      {/* Overlay for mobile */}
      {isMobile && isOpen && (
        <div 
          className="fixed inset-0 bg-black/40 z-10"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
};

export default Sidebar;
