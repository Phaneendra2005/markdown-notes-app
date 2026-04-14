import React from 'react';

function Navbar({ theme, onToggleTheme }) {
  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <span className="navbar-icon">📝</span>
        <span className="navbar-title">MarkNotes</span>
      </div>
      <div className="navbar-actions">
        <button
          className="theme-toggle"
          onClick={onToggleTheme}
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
      </div>
    </nav>
  );
}

export default Navbar;
