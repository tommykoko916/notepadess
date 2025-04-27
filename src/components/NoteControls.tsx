
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Note } from '@/types/noteTypes';
import { Download, History, Settings } from 'lucide-react';
import { format } from 'date-fns';

interface NoteControlsProps {
  note: Note;
  downloadNote: () => void;
  restoreFromHistory: (noteId: string, historyIndex: number) => void;
  isAutocompleteEnabled: boolean;
  setIsAutocompleteEnabled: (enabled: boolean) => void;
}

const NoteControls: React.FC<NoteControlsProps> = ({
  note,
  downloadNote,
  restoreFromHistory,
  isAutocompleteEnabled,
  setIsAutocompleteEnabled,
}) => {
  const [activeTab, setActiveTab] = useState('history');

  const handleToggleAutocomplete = () => {
    setIsAutocompleteEnabled(!isAutocompleteEnabled);
  };

  return (
    <div className="border-t border-border p-4 flex justify-between items-center">
      <div className="text-sm text-muted-foreground">
        Last updated: {format(new Date(note.updated), 'MMM d, yyyy h:mm a')}
      </div>
      
      <div className="flex gap-2">
        <Button 
          variant="outline" 
          size="sm"
          onClick={downloadNote}
        >
          <Download className="h-4 w-4 mr-2" /> Download
        </Button>
        
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <History className="h-4 w-4 mr-2" /> History
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Note History & Settings</DialogTitle>
            </DialogHeader>
            
            <Tabs defaultValue="history" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="history">History</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>
              
              <TabsContent value="history">
                <div className="mt-2">
                  {note.history.length > 0 ? (
                    <ScrollArea className="h-[300px]">
                      {note.history.map((entry, index) => (
                        <div
                          key={index}
                          className="p-3 border-b cursor-pointer hover:bg-accent transition-colors"
                          onClick={() => restoreFromHistory(note.id, index)}
                        >
                          <div className="text-xs text-muted-foreground mb-1">
                            {format(new Date(entry.timestamp), 'MMM d, yyyy h:mm:ss a')}
                          </div>
                          <div className="text-sm line-clamp-2">
                            {entry.content.substring(0, 100)}
                            {entry.content.length > 100 ? '...' : ''}
                          </div>
                        </div>
                      ))}
                    </ScrollArea>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No history available yet
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="settings">
                <div className="space-y-4 py-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="autocomplete">Autocomplete</Label>
                      <p className="text-xs text-muted-foreground">
                        Show word suggestions while typing
                      </p>
                    </div>
                    <Switch
                      id="autocomplete"
                      checked={isAutocompleteEnabled}
                      onCheckedChange={handleToggleAutocomplete}
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default NoteControls;
