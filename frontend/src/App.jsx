import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import NotesList from './components/NotesList';
import SearchBar from './components/SearchBar';
import Editor from "./components/Editor";
import Preview from './components/Preview';
import useDebounce from './hooks/useDebounce';
import { notesApi } from './api/notesApi';
import './App.css';

const AUTOSAVE_DELAY = 500;
const SEARCH_DELAY = 300;

function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
  const [notes, setNotes] = useState([]);
  const [activeNote, setActiveNote] = useState(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [saveStatus, setSaveStatus] = useState('idle'); // 'idle' | 'saving' | 'saved' | 'error'
  const [listLoading, setListLoading] = useState(true);
  const [error, setError] = useState(null);

  const debouncedContent = useDebounce(content, AUTOSAVE_DELAY);
  const debouncedTitle = useDebounce(title, AUTOSAVE_DELAY);
  const debouncedSearch = useDebounce(searchQuery, SEARCH_DELAY);

  // Apply theme to document root
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Load note list on mount
  useEffect(() => {
    loadNotes();
  }, []);

  // Trigger search when debounced query changes
  useEffect(() => {
    if (debouncedSearch.trim()) {
      handleSearch(debouncedSearch);
    } else {
      loadNotes();
    }
  }, [debouncedSearch]);

  // Auto-save when debounced values change (only when a note is open)
  useEffect(() => {
    if (!activeNote) return;
    const isDirty =
      debouncedContent !== activeNote.content || debouncedTitle !== activeNote.title;
    if (!isDirty) return;

    saveNote(activeNote.id, debouncedTitle, debouncedContent);
  }, [debouncedContent, debouncedTitle]);

  async function loadNotes() {
    try {
      setListLoading(true);
      const data = await notesApi.getAll();
      setNotes(data);
      setError(null);
    } catch {
      setError('Failed to load notes. Is the server running?');
    } finally {
      setListLoading(false);
    }
  }

  async function handleSearch(q) {
    try {
      const data = await notesApi.search(q);
      setNotes(data);
    } catch {
      // Silently fall back to showing all notes on search error
      loadNotes();
    }
  }

  async function handleSelectNote(id) {
    try {
      const note = await notesApi.getById(id);
      setActiveNote(note);
      setTitle(note.title);
      setContent(note.content);
      setSaveStatus('idle');
    } catch {
      setError('Failed to load note.');
    }
  }

  async function handleCreateNote() {
    try {
      const note = await notesApi.create({
        title: 'Untitled Note',
        content: '# Untitled Note\n\nStart writing here…',
      });
      setNotes((prev) => [{ id: note.id, title: note.title, updated_at: note.updated_at }, ...prev]);
      setActiveNote(note);
      setTitle(note.title);
      setContent(note.content);
      setSaveStatus('idle');
      setSearchQuery('');
    } catch {
      setError('Failed to create note.');
    }
  }

  async function handleDeleteNote(id, noteTitle) {
    if (!window.confirm(`Delete "${noteTitle}"? This cannot be undone.`)) return;
    try {
      await notesApi.remove(id);
      setNotes((prev) => prev.filter((n) => n.id !== id));
      if (activeNote?.id === id) {
        setActiveNote(null);
        setTitle('');
        setContent('');
        setSaveStatus('idle');
      }
    } catch {
      setError('Failed to delete note.');
    }
  }

  const saveNote = useCallback(async (id, newTitle, newContent) => {
    setSaveStatus('saving');
    try {
      const updated = await notesApi.update(id, { title: newTitle, content: newContent });
      setActiveNote(updated);
      setNotes((prev) =>
        prev.map((n) =>
          n.id === id ? { id: updated.id, title: updated.title, updated_at: updated.updated_at } : n
        )
      );
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch {
      setSaveStatus('error');
    }
  }, []);

  const handleToggleTheme = () => setTheme((t) => (t === 'light' ? 'dark' : 'light'));

  return (
    <div className="app">
      <Navbar theme={theme} onToggleTheme={handleToggleTheme} />

      {error && (
        <div className="global-error" role="alert">
          {error}
          <button className="error-dismiss" onClick={() => setError(null)}>✕</button>
        </div>
      )}

      <div className="workspace">
        {/* Sidebar */}
        <aside className="sidebar">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            onClear={() => setSearchQuery('')}
          />
          <NotesList
            notes={notes}
            activeId={activeNote?.id}
            onSelect={handleSelectNote}
            onCreate={handleCreateNote}
            onDelete={handleDeleteNote}
            loading={listLoading}
          />
        </aside>

        {/* Main editing area */}
        <main className="main-area">
          {activeNote ? (
            <>
              <Editor
                title={title}
                content={content}
                saveStatus={saveStatus}
                onChange={setContent}
                onTitleChange={setTitle}
              />
              <Preview content={content} />
            </>
          ) : (
            <div className="empty-state">
              <div className="empty-state-inner">
                <span className="empty-state-icon">📄</span>
                <h2>No note selected</h2>
                <p>Choose a note from the sidebar or create a new one to get started.</p>
                <button className="btn-primary" onClick={handleCreateNote}>
                  + Create your first note
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
