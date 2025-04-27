
export interface HistoryEntry {
  content: string;
  timestamp: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  created: string;
  updated: string;
  history: HistoryEntry[];
}

export interface AutocompleteOption {
  text: string;
  index: number;
}
