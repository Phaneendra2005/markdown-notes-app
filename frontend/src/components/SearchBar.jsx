import React from 'react';

function SearchBar({ value, onChange, onClear }) {
  return (
    <div className="search-bar">
      <span className="search-icon">🔍</span>
      <input
        type="text"
        className="search-input"
        placeholder="Search notes…"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Search notes"
      />
      {value && (
        <button className="search-clear" onClick={onClear} aria-label="Clear search">
          ✕
        </button>
      )}
    </div>
  );
}

export default SearchBar;
