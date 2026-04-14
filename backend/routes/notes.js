const express = require('express');
const router = express.Router();
const { getDb } = require('../db/database');

// GET /api/notes — list all notes (id, title, updated_at only)
router.get('/', (req, res, next) => {
  try {
    const db = getDb();
    const notes = db
      .prepare('SELECT id, title, updated_at FROM notes ORDER BY updated_at DESC')
      .all();
    res.json({ success: true, data: notes });
  } catch (err) {
    next(err);
  }
});

// GET /api/notes/search?q=term — full-text search
router.get('/search', (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q || !q.trim()) {
      return res.status(400).json({ success: false, error: 'Search query is required' });
    }

    const db = getDb();
    const term = `%${q.trim()}%`;
    const notes = db
      .prepare(
        `SELECT id, title, updated_at FROM notes
         WHERE title LIKE ? OR content LIKE ?
         ORDER BY updated_at DESC`
      )
      .all(term, term);

    res.json({ success: true, data: notes });
  } catch (err) {
    next(err);
  }
});

// GET /api/notes/:id — single note with full content
router.get('/:id', (req, res, next) => {
  try {
    const db = getDb();
    const note = db.prepare('SELECT * FROM notes WHERE id = ?').get(req.params.id);

    if (!note) {
      return res.status(404).json({ success: false, error: 'Note not found' });
    }

    res.json({ success: true, data: note });
  } catch (err) {
    next(err);
  }
});

// POST /api/notes — create new note
router.post('/', (req, res, next) => {
  try {
    const { title = 'Untitled Note', content = '' } = req.body;

    if (typeof title !== 'string' || typeof content !== 'string') {
      return res.status(400).json({ success: false, error: 'Title and content must be strings' });
    }

    const db = getDb();
    const result = db
      .prepare('INSERT INTO notes (title, content) VALUES (?, ?)')
      .run(title.trim() || 'Untitled Note', content);

    const note = db.prepare('SELECT * FROM notes WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ success: true, data: note });
  } catch (err) {
    next(err);
  }
});

// PUT /api/notes/:id — update note
router.put('/:id', (req, res, next) => {
  try {
    const db = getDb();
    const existing = db.prepare('SELECT id FROM notes WHERE id = ?').get(req.params.id);

    if (!existing) {
      return res.status(404).json({ success: false, error: 'Note not found' });
    }

    const { title, content } = req.body;

    if (title !== undefined && typeof title !== 'string') {
      return res.status(400).json({ success: false, error: 'Title must be a string' });
    }
    if (content !== undefined && typeof content !== 'string') {
      return res.status(400).json({ success: false, error: 'Content must be a string' });
    }

    db.prepare(
      `UPDATE notes SET
        title = COALESCE(?, title),
        content = COALESCE(?, content)
       WHERE id = ?`
    ).run(
      title !== undefined ? title.trim() || 'Untitled Note' : null,
      content !== undefined ? content : null,
      req.params.id
    );

    const updated = db.prepare('SELECT * FROM notes WHERE id = ?').get(req.params.id);
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/notes/:id — delete note
router.delete('/:id', (req, res, next) => {
  try {
    const db = getDb();
    const existing = db.prepare('SELECT id FROM notes WHERE id = ?').get(req.params.id);

    if (!existing) {
      return res.status(404).json({ success: false, error: 'Note not found' });
    }

    db.prepare('DELETE FROM notes WHERE id = ?').run(req.params.id);
    res.json({ success: true, data: { id: parseInt(req.params.id, 10) } });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
