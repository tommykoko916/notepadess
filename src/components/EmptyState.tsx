
import { Button } from '@/components/ui/button';
import { FileText, Plus } from 'lucide-react';

interface EmptyStateProps {
  createNewNote: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({ createNewNote }) => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6">
      <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-6">
        <FileText className="h-10 w-10 text-muted-foreground" />
      </div>
      
      <h2 className="text-2xl font-bold mb-2">No Note Selected</h2>
      <p className="text-muted-foreground text-center mb-6 max-w-md">
        Select an existing note from the sidebar or create a new one to get started.
      </p>
      
      <Button onClick={createNewNote}>
        <Plus className="h-4 w-4 mr-2" /> Create a New Note
      </Button>
    </div>
  );
};

export default EmptyState;
