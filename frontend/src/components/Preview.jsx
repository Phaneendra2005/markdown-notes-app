import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

function Preview({ content }) {
  if (!content.trim()) {
    return (
      <div className="preview-panel preview-empty">
        <div className="preview-empty-state">
          <span className="preview-empty-icon">👁️</span>
          <p>Preview will appear here as you type.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="preview-panel">
      <div className="preview-header">
        <span className="preview-label">Preview</span>
      </div>
      <div className="preview-content">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
          a: ({ node, children, ...props }) => (
          <a {...props} target="_blank" rel="noopener noreferrer">
            {children}
          </a>
        ),
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    </div>
  );
}

export default Preview;
