import React, { useRef } from 'react';

const TOOLBAR_ACTIONS = [
  { label: 'B',         title: 'Bold',           type: 'inline', prefix: '**',    suffix: '**',      snippet: 'bold text'   },
  { label: 'I',         title: 'Italic',          type: 'inline', prefix: '_',     suffix: '_',       snippet: 'italic text' },
  { label: 'S',         title: 'Strikethrough',   type: 'inline', prefix: '~~',    suffix: '~~',      snippet: 'strikethrough' },
  { label: 'H1',        title: 'Heading 1',       type: 'block',  prefix: '# '                                               },
  { label: 'H2',        title: 'Heading 2',       type: 'block',  prefix: '## '                                              },
  { label: 'H3',        title: 'Heading 3',       type: 'block',  prefix: '### '                                             },
  { label: '`code`',    title: 'Inline code',     type: 'inline', prefix: '`',     suffix: '`',       snippet: 'code'        },
  { label: '``` ```',   title: 'Code block',      type: 'fence'                                                              },
  { label: '─ HR',      title: 'Horizontal rule', type: 'insert', text: '\n\n---\n\n'                                        },
  { label: '• List',    title: 'Bullet list',     type: 'block',  prefix: '- '                                               },
  { label: '1. List',   title: 'Ordered list',    type: 'block',  prefix: '1. '                                              },
  { label: '☐ Task',    title: 'Task list',       type: 'block',  prefix: '- [ ] '                                           },
  { label: '> Quote',   title: 'Blockquote',      type: 'block',  prefix: '> '                                               },
  { label: '🔗 Link',   title: 'Link',            type: 'link'                                                               },
];

// ─── helpers ────────────────────────────────────────────────────────────────

function restoreCursor(textarea, start, end) {
  requestAnimationFrame(() => {
    textarea.focus();
    textarea.setSelectionRange(start, end);
  });
}

// ─── action handlers — one clear function per type ──────────────────────────

function applyInsert(textarea, text, content, onChange) {
  const { selectionStart: s } = textarea;
  const next = content.slice(0, s) + text + content.slice(s);
  onChange(next);
  restoreCursor(textarea, s + text.length, s + text.length);
}

function applyInline(textarea, action, content, onChange) {
  const { selectionStart: s, selectionEnd: e } = textarea;
  const { prefix, suffix, snippet } = action;
  const before = content.slice(0, s);
  const sel    = content.slice(s, e);
  const after  = content.slice(e);

  // Toggle off: selection already wrapped (user selected **hello**)
  if (sel.startsWith(prefix) && sel.endsWith(suffix) && sel.length > prefix.length + suffix.length) {
    const inner = sel.slice(prefix.length, sel.length - suffix.length);
    onChange(before + inner + after);
    restoreCursor(textarea, s, s + inner.length);
    return;
  }

  // Toggle off: markers sit just outside the selection (cursor inside **hello**)
  if (before.endsWith(prefix) && after.startsWith(suffix)) {
    const stripped = before.slice(0, before.length - prefix.length) + sel + after.slice(suffix.length);
    onChange(stripped);
    restoreCursor(textarea, s - prefix.length, s - prefix.length + sel.length);
    return;
  }

  // Apply
  const word = sel || snippet;
  onChange(before + prefix + word + suffix + after);
  restoreCursor(textarea, s + prefix.length, s + prefix.length + word.length);
}

function applyBlock(textarea, action, content, onChange) {
  const { selectionStart: s, selectionEnd: e } = textarea;
  const { prefix } = action;

  // Find start of the line the cursor is on
  const lineStart = content.lastIndexOf('\n', s - 1) + 1;
  const lineText  = content.slice(lineStart);

  if (lineText.startsWith(prefix)) {
    // Toggle off — strip the prefix
    const next =
      content.slice(0, lineStart) +
      content.slice(lineStart + prefix.length);
    onChange(next);
    restoreCursor(
      textarea,
      Math.max(lineStart, s - prefix.length),
      Math.max(lineStart, e - prefix.length),
    );
  } else {
    // Toggle on — prepend the prefix to the line
    // If there's a selection, keep it; otherwise insert a placeholder word
    const sel         = content.slice(s, e);
    const insertWord  = sel || 'text';
    const lineEnd     = content.indexOf('\n', s);
    const restOfLine  = lineEnd === -1 ? content.slice(lineStart) : content.slice(lineStart, lineEnd);

    let next;
    if (sel) {
      // Just add prefix at the line start, preserve the selection
      next = content.slice(0, lineStart) + prefix + content.slice(lineStart);
      onChange(next);
      restoreCursor(textarea, s + prefix.length, e + prefix.length);
    } else {
      // Replace whatever is on the line with prefix + placeholder
      const afterLine = lineEnd === -1 ? '' : content.slice(lineEnd);
      next = content.slice(0, lineStart) + prefix + (restOfLine || insertWord) + afterLine;
      const wordStart = lineStart + prefix.length;
      const wordEnd   = wordStart + (restOfLine || insertWord).length;
      onChange(next);
      restoreCursor(textarea, wordStart, wordEnd);
    }
  }
}

function applyFence(textarea, content, onChange) {
  const { selectionStart: s, selectionEnd: e } = textarea;
  const sel    = content.slice(s, e);
  const before = content.slice(0, s);
  const after  = content.slice(e);

  // Toggle off: selected text is a complete fenced block
  const fenceRe = /^```[\w]*\n([\s\S]*)\n```$/;
  if (fenceRe.test(sel)) {
    const inner = sel.replace(/^```[\w]*\n/, '').replace(/\n```$/, '');
    onChange(before + inner + after);
    restoreCursor(textarea, s, s + inner.length);
    return;
  }

  // Insert a proper fenced block with newlines
  const lang  = 'js';
  const inner = sel || '// your code here';
  // Ensure the block is on its own lines
  const needNewlineBefore = before.length > 0 && !before.endsWith('\n');
  const needNewlineAfter  = after.length  > 0 && !after.startsWith('\n');

  const blockOpen  = (needNewlineBefore ? '\n' : '') + '```' + lang + '\n';
  const blockClose = '\n```' + (needNewlineAfter ? '\n' : '');
  const block      = blockOpen + inner + blockClose;

  onChange(before + block + after);

  // Place cursor selecting the inner content
  const innerStart = s + blockOpen.length;
  const innerEnd   = innerStart + inner.length;
  restoreCursor(textarea, innerStart, innerEnd);
}

function applyLink(textarea, content, onChange) {
  const { selectionStart: s, selectionEnd: e } = textarea;
  const sel    = content.slice(s, e);
  const before = content.slice(0, s);
  const after  = content.slice(e);

  // Toggle off: selection looks like [text](url)
  const linkRe = /^\[(.+?)\]\((.+?)\)$/;
  if (linkRe.test(sel)) {
    const linkText = sel.replace(linkRe, '$1');
    onChange(before + linkText + after);
    restoreCursor(textarea, s, s + linkText.length);
    return;
  }

  // Toggle off: cursor is inside [text](url) — scan outward
  const fullText   = content;
  const linkPattern = /\[([^\]]+)\]\(([^)]+)\)/g;
  let match;
  while ((match = linkPattern.exec(fullText)) !== null) {
    if (match.index <= s && linkPattern.lastIndex >= e) {
      // Cursor is inside this link — unwrap it
      const linkText = match[1];
      onChange(fullText.slice(0, match.index) + linkText + fullText.slice(linkPattern.lastIndex));
      restoreCursor(textarea, match.index, match.index + linkText.length);
      return;
    }
  }

  // Apply: wrap selection or placeholder
  const linkText = sel || 'link text';
  const inserted = '[' + linkText + '](url)';
  onChange(before + inserted + after);

  // Select just the "url" part so user can type the URL immediately
  const urlStart = s + 1 + linkText.length + 2; // past "[linkText]("
  const urlEnd   = urlStart + 3;                 // length of "url"
  restoreCursor(textarea, urlStart, urlEnd);
}

// ─── dispatcher ─────────────────────────────────────────────────────────────

function applyAction(textarea, action, content, onChange) {
  switch (action.type) {
    case 'insert': return applyInsert(textarea, action.text, content, onChange);
    case 'inline': return applyInline(textarea, action, content, onChange);
    case 'block':  return applyBlock(textarea, action, content, onChange);
    case 'fence':  return applyFence(textarea, content, onChange);
    case 'link':   return applyLink(textarea, content, onChange);
    default: break;
  }
}

// ─── component ──────────────────────────────────────────────────────────────

function Editor({ title, content, saveStatus, onChange, onTitleChange }) {
  const textareaRef = useRef(null);

  function handleToolbarClick(action) {
    if (!textareaRef.current) return;
    applyAction(textareaRef.current, action, content, onChange);
  }

  return (
    <div className="editor-panel">
      <div className="editor-header">
        <input
          className="editor-title"
          type="text"
          placeholder="Note title…"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          aria-label="Note title"
        />
        <span className={`save-status ${saveStatus}`} aria-live="polite">
          {saveStatus === 'saving' && 'Saving…'}
          {saveStatus === 'saved' && 'Saved ✓'}
          {saveStatus === 'error' && 'Save failed ✕'}
        </span>
      </div>

      <div className="toolbar" role="toolbar" aria-label="Markdown formatting">
        {TOOLBAR_ACTIONS.map((action) => (
          <button
            key={action.title}
            className="toolbar-btn"
            title={action.title}
            aria-label={action.title}
            onMouseDown={(e) => {
              e.preventDefault(); // keep textarea focused so selectionStart/End stay valid
              handleToolbarClick(action);
            }}
          >
            {action.label}
          </button>
        ))}
      </div>

      <textarea
        ref={textareaRef}
        className="editor-textarea"
        placeholder={`Write in **Markdown**…\n\n# Start with a heading\n\n- Add bullet points\n- _Italicize_ or **bold** text\n\n> Blockquotes work too\n\n\`\`\`js\nconst hello = 'world';\n\`\`\``}
        value={content}
        onChange={(e) => onChange(e.target.value)}
        spellCheck="true"
        aria-label="Note content"
      />
    </div>
  );
}

export default Editor;
