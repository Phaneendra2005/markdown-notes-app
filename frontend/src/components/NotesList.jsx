import React from 'react';

function formatDate(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function NotesList({ notes, activeId, onSelect, onCreate, onDelete, loading }) {
  if (loading) {
    return (
      <div className="notes-list">
        <div className="notes-loading">Loading…</div>
      </div>
    );
  }

  return (
    <div className="notes-list">
      <div className="notes-list-header">
        <span className="notes-count">{notes.length} note{notes.length !== 1 ? 's' : ''}</span>
        <button className="btn-new" onClick={onCreate} title="New note">
          + New
        </button>
      </div>

      {notes.length === 0 ? (
        <div className="notes-empty">
          <p>No notes yet.</p>
          <p>Click <strong>+ New</strong> to get started.</p>
        </div>
      ) : (
        <ul className="notes-items">
          {notes.map((note) => (
            <li
              key={note.id}
              className={`note-item ${note.id === activeId ? 'active' : ''}`}
              onClick={() => onSelect(note.id)}
            >
              <div className="note-item-body">
                <span className="note-item-title">{note.title || 'Untitled Note'}</span>
                <span className="note-item-date">{formatDate(note.updated_at)}</span>
              </div>
              <button
                className="note-item-delete"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(note.id, note.title);
                }}
                aria-label={`Delete "${note.title}"`}
                title="Delete note"
              >
                🗑
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default NotesList;
