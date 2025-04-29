
// Type definitions (for reference only, not needed in vanilla JS)
/**
 * @typedef {Object} HistoryEntry
 * @property {string} content - Note content
 * @property {string} timestamp - ISO timestamp
 */

/**
 * @typedef {Object} Note
 * @property {string} id - Unique identifier
 * @property {string} title - Note title
 * @property {string} content - Note content
 * @property {string} created - ISO timestamp
 * @property {string} updated - ISO timestamp
 * @property {HistoryEntry[]} history - Version history
 */

/**
 * @typedef {Object} AutocompleteOption
 * @property {string} text - Suggested text
 * @property {number} index - Position in the text
 */

// DOM references
const sidebar = document.getElementById('sidebar');
const sidebarToggle = document.getElementById('sidebarToggle');
const sidebarOverlay = document.getElementById('sidebarOverlay');
const notesList = document.getElementById('notesList');
const newNoteBtn = document.getElementById('newNoteBtn');
const emptyStateNewBtn = document.getElementById('emptyStateNewBtn');
const exportAllBtn = document.getElementById('exportAllBtn');
const importBtn = document.getElementById('importBtn');
const importFileInput = document.getElementById('importFileInput');
const themeToggle = document.getElementById('themeToggle');
const noteTitle = document.getElementById('noteTitle');
const noteContent = document.getElementById('noteContent');
const wordCount = document.getElementById('wordCount');
const charCount = document.getElementById('charCount');
const readingTime = document.getElementById('readingTime');
const downloadNoteBtn = document.getElementById('downloadNoteBtn');
const historyBtn = document.getElementById('historyBtn');
const historyPanel = document.getElementById('historyPanel');
const historyList = document.getElementById('historyList');
const closeHistoryBtn = document.getElementById('closeHistoryBtn');
const autocompleteToggle = document.getElementById('autocompleteToggle');
const autoCompleteContainer = document.getElementById('autoCompleteContainer');
const editorContainer = document.getElementById('editorContainer');
const emptyState = document.getElementById('emptyState');
const deleteModal = document.getElementById('deleteModal');
const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
const toastContainer = document.getElementById('toastContainer');

// App state
let notes = [];
let activeNoteId = null;
let isAutocompleteEnabled = true;
let pendingDeleteId = null;
let wordSet = new Set(); // For autocomplete dictionary
let contentChangeTimer = null;
let currentAutocompleteOptions = [];
let currentAutocompleteIndex = -1;

// Initialize the application
function init() {
  loadNotes();
  setupEventListeners();
  checkTheme();
  renderNotesList();
  
  // Auto-select first note or create one if none exist
  if (notes.length === 0) {
    createNewNote();
  } else {
    // Check if there was an active note saved
    const savedActiveNoteId = localStorage.getItem('activeNoteId');
    if (savedActiveNoteId && notes.find(note => note.id === savedActiveNoteId)) {
      setActiveNoteId(savedActiveNoteId);
    } else {
      setActiveNoteId(notes[0].id);
    }
  }
  
  // Check for mobile view
  handleResize();
}

// Load notes from localStorage
function loadNotes() {
  const savedNotes = localStorage.getItem('notes');
  notes = savedNotes ? JSON.parse(savedNotes) : [];
  isAutocompleteEnabled = localStorage.getItem('autocompleteEnabled') !== 'false';
  autocompleteToggle.checked = isAutocompleteEnabled;
  
  // Build initial word set for autocomplete from existing notes
  notes.forEach(note => {
    const words = note.content.split(/\s+/).filter(word => word.length > 3);
    words.forEach(word => wordSet.add(word.toLowerCase()));
  });
}

// Save notes to localStorage
function saveNotes() {
  localStorage.setItem('notes', JSON.stringify(notes));
}

// Set up event listeners
function setupEventListeners() {
  // Mobile sidebar toggle
  sidebarToggle.addEventListener('click', toggleSidebar);
  sidebarOverlay.addEventListener('click', closeSidebar);
  
  // Note actions
  newNoteBtn.addEventListener('click', createNewNote);
  emptyStateNewBtn.addEventListener('click', createNewNote);
  noteTitle.addEventListener('input', updateActiveNoteTitle);
  noteContent.addEventListener('input', handleNoteContentChange);
  
  // Autocomplete
  autocompleteToggle.addEventListener('change', toggleAutocomplete);
  noteContent.addEventListener('keydown', handleKeyDown);
  document.addEventListener('click', (e) => {
    if (!autoCompleteContainer.contains(e.target)) {
      hideAutocomplete();
    }
  });
  
  // Note controls
  downloadNoteBtn.addEventListener('click', downloadActiveNote);
  historyBtn.addEventListener('click', toggleHistoryPanel);
  closeHistoryBtn.addEventListener('click', toggleHistoryPanel);
  
  // Import/Export
  exportAllBtn.addEventListener('click', exportAllNotes);
  importBtn.addEventListener('click', () => importFileInput.click());
  importFileInput.addEventListener('change', importNotes);
  
  // Theme
  themeToggle.addEventListener('click', toggleTheme);
  
  // Delete modal
  confirmDeleteBtn.addEventListener('click', confirmDelete);
  cancelDeleteBtn.addEventListener('click', cancelDelete);
  
  // Responsive design
  window.addEventListener('resize', handleResize);
}

// Create a new note
function createNewNote() {
  const newNote = {
    id: Date.now().toString(),
    title: 'Untitled Note',
    content: '',
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
    history: [],
  };
  
  notes.unshift(newNote);
  saveNotes();
  renderNotesList();
  setActiveNoteId(newNote.id);
  showToast('New note created', 'success');
  
  // Focus title for editing
  noteTitle.focus();
  
  // Close sidebar on mobile after creating note
  if (window.innerWidth <= 768) {
    closeSidebar();
  }
}

// Set active note by ID
function setActiveNoteId(id) {
  activeNoteId = id;
  localStorage.setItem('activeNoteId', id);
  renderActiveNote();
  updateActiveNoteInList();
  
  // Show editor or empty state
  if (id) {
    editorContainer.style.display = 'flex';
    emptyState.style.display = 'none';
  } else {
    editorContainer.style.display = 'none';
    emptyState.style.display = 'flex';
  }
}

// Render the active note
function renderActiveNote() {
  if (!activeNoteId) return;
  
  const note = notes.find(note => note.id === activeNoteId);
  if (!note) return;
  
  noteTitle.value = note.title;
  noteContent.value = note.content;
  updateNoteStats();
}

// Update the active note's title
function updateActiveNoteTitle(event) {
  if (!activeNoteId) return;
  
  const title = event.target.value.trim() || 'Untitled Note';
  
  notes = notes.map(note => 
    note.id === activeNoteId 
      ? { ...note, title, updated: new Date().toISOString() } 
      : note
  );
  
  saveNotes();
  renderNotesList();
}

// Handle note content change with debounce
function handleNoteContentChange() {
  if (!activeNoteId) return;
  
  // Update stats immediately
  updateNoteStats();
  
  // Extract words for autocomplete dictionary
  const words = noteContent.value.split(/\s+/).filter(word => word.length > 3);
  words.forEach(word => wordSet.add(word.toLowerCase()));
  
  // Show autocomplete if enabled and typing
  if (isAutocompleteEnabled) {
    showAutocompleteOptions();
  }
  
  // Debounce saving changes
  clearTimeout(contentChangeTimer);
  contentChangeTimer = setTimeout(() => {
    updateNoteContent();
  }, 1000);
}

// Update note content and history
function updateNoteContent() {
  if (!activeNoteId) return;
  
  const content = noteContent.value;
  const noteIndex = notes.findIndex(note => note.id === activeNoteId);
  
  if (noteIndex === -1) return;
  
  const note = notes[noteIndex];
  const currentContent = note.content;
  
  // Only update if content actually changed
  if (currentContent !== content) {
    const newHistory = [...note.history];
    
    // Add current content to history (limit to 10 entries)
    if (currentContent) {
      if (newHistory.length >= 10) {
        newHistory.shift();
      }
      
      newHistory.push({
        content: currentContent,
        timestamp: new Date().toISOString()
      });
    }
    
    // Update the note
    notes[noteIndex] = {
      ...note,
      content,
      updated: new Date().toISOString(),
      history: newHistory
    };
    
    saveNotes();
  }
}

// Calculate and update note stats
function updateNoteStats() {
  const content = noteContent.value;
  
  // Calculate word count (excluding blank spaces)
  const words = content.trim().split(/\s+/).filter(word => word.length > 0);
  const wordsCount = words.length;
  
  // Calculate character count (including spaces)
  const charsCount = content.length;
  
  // Calculate reading time (average reading speed: 200 words per minute)
  const minutes = Math.ceil(wordsCount / 200);
  const readingTimeText = minutes < 1 ? 'less than 1 min' : `${minutes} min`;
  
  // Update UI
  wordCount.textContent = `${wordsCount} words`;
  charCount.textContent = `${charsCount} characters`;
  readingTime.textContent = `${readingTimeText} read`;
}

// Render the notes list in sidebar
function renderNotesList() {
  notesList.innerHTML = '';
  
  if (notes.length === 0) {
    notesList.innerHTML = `
      <div class="empty-notes">
        <p class="text-center p-4 text-muted-foreground">No notes yet</p>
      </div>
    `;
    return;
  }
  
  notes.forEach(note => {
    const noteItem = document.createElement('div');
    noteItem.className = `note-item${activeNoteId === note.id ? ' active' : ''}`;
    noteItem.dataset.id = note.id;
    
    const date = new Date(note.updated);
    const formattedDate = `${date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    })} · ${date.toLocaleTimeString('en-US', { 
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })}`;
    
    noteItem.innerHTML = `
      <div class="note-item-content">
        <h3 class="note-item-title">${note.title || 'Untitled Note'}</h3>
        <p class="note-item-date">${formattedDate}</p>
      </div>
      <button class="delete-note-btn" data-id="${note.id}">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 6h18"></path>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path>
          <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          <line x1="10" y1="11" x2="10" y2="17"></line>
          <line x1="14" y1="11" x2="14" y2="17"></line>
        </svg>
      </button>
    `;
    
    notesList.appendChild(noteItem);
    
    // Add click event to select note
    noteItem.addEventListener('click', (event) => {
      if (!event.target.closest('.delete-note-btn')) {
        setActiveNoteId(note.id);
        
        // Close sidebar on mobile after selecting note
        if (window.innerWidth <= 768) {
          closeSidebar();
        }
      }
    });
    
    // Add click event to delete button
    const deleteBtn = noteItem.querySelector('.delete-note-btn');
    deleteBtn.addEventListener('click', (event) => {
      event.stopPropagation();
      showDeleteModal(note.id);
    });
  });
}

// Highlight active note in list
function updateActiveNoteInList() {
  // Remove active class from all notes
  document.querySelectorAll('.note-item').forEach(item => {
    item.classList.remove('active');
  });
  
  // Add active class to current note
  if (activeNoteId) {
    const activeItem = document.querySelector(`.note-item[data-id="${activeNoteId}"]`);
    if (activeItem) activeItem.classList.add('active');
  }
}

// Delete note
function deleteNote(id) {
  const noteToDelete = notes.find(note => note.id === id);
  if (!noteToDelete) return;
  
  // Remove the note
  notes = notes.filter(note => note.id !== id);
  saveNotes();
  renderNotesList();
  
  // Show success message
  showToast(`Note "${noteToDelete.title}" deleted`, 'success');
  
  // If the active note was deleted, select another one
  if (activeNoteId === id) {
    setActiveNoteId(notes.length > 0 ? notes[0].id : null);
  }
}

// Show delete confirmation modal
function showDeleteModal(id) {
  pendingDeleteId = id;
  const note = notes.find(note => note.id === id);
  
  if (note) {
    deleteModal.querySelector('p').textContent = 
      `Are you sure you want to delete "${note.title}"? This action cannot be undone.`;
    
    deleteModal.classList.add('active');
  }
}

// Confirm note deletion
function confirmDelete() {
  if (pendingDeleteId) {
    deleteNote(pendingDeleteId);
    pendingDeleteId = null;
    deleteModal.classList.remove('active');
  }
}

// Cancel note deletion
function cancelDelete() {
  pendingDeleteId = null;
  deleteModal.classList.remove('active');
}

// Download active note as txt file
function downloadActiveNote() {
  if (!activeNoteId) return;
  
  const note = notes.find(note => note.id === activeNoteId);
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
  
  showToast('Note downloaded successfully', 'success');
}

// Export all notes as JSON file
function exportAllNotes() {
  if (notes.length === 0) {
    showToast('No notes to export', 'error');
    return;
  }
  
  const blob = new Blob([JSON.stringify(notes, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  
  a.href = url;
  a.download = 'notepad-backup.json';
  document.body.appendChild(a);
  a.click();
  
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  showToast('All notes exported successfully', 'success');
}

// Import notes from JSON file
function importNotes(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const importedNotes = JSON.parse(e.target.result);
      if (Array.isArray(importedNotes)) {
        // Merge imported notes with existing ones
        const newNotes = [...notes];
        
        importedNotes.forEach(importedNote => {
          // Check if note already exists (by id)
          const existingIndex = newNotes.findIndex(n => n.id === importedNote.id);
          
          if (existingIndex === -1) {
            // Add new note
            newNotes.push(importedNote);
          }
        });
        
        // Update notes
        notes = newNotes;
        saveNotes();
        renderNotesList();
        
        // Select first imported note if no active note
        if (!activeNoteId && importedNotes.length > 0) {
          setActiveNoteId(importedNotes[0].id);
        }
        
        showToast(`Imported ${importedNotes.length} notes successfully`, 'success');
      } else {
        showToast('Invalid notes format', 'error');
      }
    } catch (error) {
      console.error('Failed to import notes:', error);
      showToast('Failed to import notes', 'error');
    }
    
    // Reset file input
    importFileInput.value = '';
  };
  
  reader.readAsText(file);
}

// Toggle history panel
function toggleHistoryPanel() {
  const isVisible = historyPanel.style.display === 'block';
  
  if (isVisible) {
    historyPanel.style.display = 'none';
  } else {
    if (!activeNoteId) return;
    
    const note = notes.find(note => note.id === activeNoteId);
    if (!note || note.history.length === 0) {
      showToast('No history available for this note', 'error');
      return;
    }
    
    renderHistoryList(note.history);
    historyPanel.style.display = 'block';
  }
}

// Render history list
function renderHistoryList(history) {
  historyList.innerHTML = '';
  
  // Display history entries from newest to oldest
  history.slice().reverse().forEach((entry, index) => {
    const date = new Date(entry.timestamp);
    const formattedDate = `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
    const previewText = entry.content.substring(0, 50) + (entry.content.length > 50 ? '...' : '');
    
    const historyItem = document.createElement('div');
    historyItem.className = 'history-item';
    historyItem.dataset.index = history.length - 1 - index; // Reverse index to match original array
    
    historyItem.innerHTML = `
      <div class="history-item-header">
        <span class="history-item-time">${formattedDate}</span>
      </div>
      <div class="history-item-preview">${previewText}</div>
    `;
    
    historyItem.addEventListener('click', () => {
      restoreFromHistory(parseInt(historyItem.dataset.index));
      toggleHistoryPanel();
    });
    
    historyList.appendChild(historyItem);
  });
}

// Restore note from history
function restoreFromHistory(historyIndex) {
  if (!activeNoteId) return;
  
  const noteIndex = notes.findIndex(note => note.id === activeNoteId);
  if (noteIndex === -1) return;
  
  const note = notes[noteIndex];
  
  if (!note.history[historyIndex]) return;
  
  // Get the content from history
  const restoredContent = note.history[historyIndex].content;
  
  // Remove all history entries after the restored one
  const newHistory = note.history.slice(0, historyIndex);
  
  // Update the note
  notes[noteIndex] = {
    ...note,
    content: restoredContent,
    updated: new Date().toISOString(),
    history: newHistory
  };
  
  saveNotes();
  renderActiveNote();
  showToast('Note restored from history', 'success');
}

// Toggle autocomplete feature
function toggleAutocomplete(event) {
  isAutocompleteEnabled = event.target.checked;
  localStorage.setItem('autocompleteEnabled', isAutocompleteEnabled);
  
  if (!isAutocompleteEnabled) {
    hideAutocomplete();
  }
}

// Show autocomplete options
function showAutocompleteOptions() {
  if (!isAutocompleteEnabled || !noteContent.value) {
    hideAutocomplete();
    return;
  }
  
  // Get cursor position
  const cursorPosition = noteContent.selectionStart;
  
  // Get the word being typed
  const textUntilCursor = noteContent.value.substring(0, cursorPosition);
  const words = textUntilCursor.split(/\s+/);
  const currentWord = words[words.length - 1].toLowerCase();
  
  // Only show suggestions for words longer than 2 characters
  if (currentWord.length < 3) {
    hideAutocomplete();
    return;
  }
  
  // Find matching words in our dictionary
  const matches = Array.from(wordSet)
    .filter(word => word.startsWith(currentWord) && word !== currentWord)
    .slice(0, 5); // Limit to 5 suggestions
  
  if (matches.length === 0) {
    hideAutocomplete();
    return;
  }
  
  // Position the autocomplete container near the cursor
  positionAutocompleteContainer();
  
  // Generate options
  autoCompleteContainer.innerHTML = '';
  currentAutocompleteOptions = [];
  currentAutocompleteIndex = -1;
  
  matches.forEach((match, index) => {
    const option = document.createElement('div');
    option.className = 'autocomplete-option';
    option.textContent = match;
    option.dataset.index = index;
    
    option.addEventListener('click', () => {
      applyAutocomplete(match);
    });
    
    autoCompleteContainer.appendChild(option);
    currentAutocompleteOptions.push({
      text: match,
      index: cursorPosition - currentWord.length
    });
  });
  
  autoCompleteContainer.style.display = 'block';
}

// Position autocomplete container near cursor
function positionAutocompleteContainer() {
  // Get text area position and cursor position
  const textAreaRect = noteContent.getBoundingClientRect();
  const cursorPosition = noteContent.selectionStart;
  
  // Create a temporary element to measure text dimensions
  const tempSpan = document.createElement('span');
  tempSpan.style.visibility = 'hidden';
  tempSpan.style.position = 'absolute';
  tempSpan.style.whiteSpace = 'pre';
  tempSpan.style.font = window.getComputedStyle(noteContent).font;
  
  // Get text before cursor and measure its width/height
  const textBeforeCursor = noteContent.value.substring(0, cursorPosition);
  tempSpan.textContent = textBeforeCursor;
  document.body.appendChild(tempSpan);
  
  // Calculate position - need to handle newlines
  const lines = textBeforeCursor.split('\n');
  const lineHeight = parseInt(window.getComputedStyle(noteContent).lineHeight);
  const lineCount = lines.length - 1; // Zero-based
  
  // Position just below the cursor
  const top = textAreaRect.top + lineCount * lineHeight + lineHeight + window.scrollY;
  
  // For horizontal position, measure the width of the last line
  tempSpan.textContent = lines[lines.length - 1];
  const left = textAreaRect.left + tempSpan.offsetWidth + window.scrollX;
  
  document.body.removeChild(tempSpan);
  
  // Set position of autocomplete container
  autoCompleteContainer.style.top = `${top}px`;
  autoCompleteContainer.style.left = `${left}px`;
}

// Handle keyboard navigation in autocomplete
function handleKeyDown(event) {
  if (!autoCompleteContainer.style.display || autoCompleteContainer.style.display === 'none') {
    return;
  }
  
  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault();
      navigateAutocomplete(1);
      break;
    case 'ArrowUp':
      event.preventDefault();
      navigateAutocomplete(-1);
      break;
    case 'Enter':
      if (currentAutocompleteIndex >= 0) {
        event.preventDefault();
        const selectedOption = currentAutocompleteOptions[currentAutocompleteIndex];
        if (selectedOption) {
          applyAutocomplete(selectedOption.text);
        }
      }
      break;
    case 'Escape':
      hideAutocomplete();
      break;
  }
}

// Navigate through autocomplete options
function navigateAutocomplete(direction) {
  // Remove active class from all options
  document.querySelectorAll('.autocomplete-option').forEach(option => {
    option.classList.remove('active');
  });
  
  // Update the index
  currentAutocompleteIndex += direction;
  if (currentAutocompleteIndex < 0) currentAutocompleteIndex = currentAutocompleteOptions.length - 1;
  if (currentAutocompleteIndex >= currentAutocompleteOptions.length) currentAutocompleteIndex = 0;
  
  // Add active class to selected option
  const options = document.querySelectorAll('.autocomplete-option');
  if (options[currentAutocompleteIndex]) {
    options[currentAutocompleteIndex].classList.add('active');
  }
}

// Apply autocomplete suggestion
function applyAutocomplete(suggestion) {
  if (!activeNoteId || currentAutocompleteOptions.length === 0) return;
  
  const option = currentAutocompleteOptions[0]; // We use position from first option
  const cursorPosition = noteContent.selectionStart;
  
  // Get the word being typed
  const textUntilCursor = noteContent.value.substring(0, cursorPosition);
  const words = textUntilCursor.split(/\s+/);
  const currentWord = words[words.length - 1];
  
  // Replace the current word with suggestion
  const beforeWord = noteContent.value.substring(0, cursorPosition - currentWord.length);
  const afterWord = noteContent.value.substring(cursorPosition);
  
  noteContent.value = beforeWord + suggestion + afterWord;
  
  // Place cursor after inserted word
  const newPosition = beforeWord.length + suggestion.length;
  noteContent.setSelectionRange(newPosition, newPosition);
  
  // Hide autocomplete and update
  hideAutocomplete();
  handleNoteContentChange();
}

// Hide autocomplete options
function hideAutocomplete() {
  autoCompleteContainer.style.display = 'none';
  currentAutocompleteOptions = [];
  currentAutocompleteIndex = -1;
}

// Toggle sidebar (for mobile)
function toggleSidebar() {
  sidebar.classList.toggle('open');
  sidebarOverlay.classList.toggle('active');
}

// Close sidebar (for mobile)
function closeSidebar() {
  sidebar.classList.remove('open');
  sidebarOverlay.classList.remove('active');
}

// Toggle between light and dark themes
function toggleTheme() {
  const isDark = document.body.classList.toggle('dark');
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
}

// Check and set theme from localStorage
function checkTheme() {
  const savedTheme = localStorage.getItem('theme');
  
  if (savedTheme === 'dark') {
    document.body.classList.add('dark');
  } else if (savedTheme === 'light') {
    document.body.classList.remove('dark');
  } else {
    // Check system preference
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      document.body.classList.add('dark');
    }
  }
}

// Show toast notification
function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  
  toastContainer.appendChild(toast);
  
  // Remove after 3 seconds
  setTimeout(() => {
    toast.style.animation = 'slide-out 0.3s ease-out forwards';
    
    toast.addEventListener('animationend', () => {
      if (toastContainer.contains(toast)) {
        toastContainer.removeChild(toast);
      }
    });
  }, 3000);
}

// Handle window resize
function handleResize() {
  if (window.innerWidth <= 768) {
    sidebar.classList.remove('open');
    sidebarOverlay.classList.remove('active');
    sidebarToggle.style.display = 'flex';
  } else {
    sidebar.classList.add('open');
    sidebarToggle.style.display = 'none';
  }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', init);
