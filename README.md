# 📝 MarkNotes — Markdown Notes Application

![MarkNotes Banner](https://via.placeholder.com/900x200/6c63ff/ffffff?text=MarkNotes+—+Live+Markdown+Editor)

> A clean, full-stack notes application with live Markdown preview, debounced auto-save, full-text search, and dark mode. Built as a fresher SDE assignment to demonstrate production-ready engineering practices.

---

## 🏷️ Tech Stack

![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-4.18-000000?logo=express&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-better--sqlite3-003B57?logo=sqlite&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)
![CSS3](https://img.shields.io/badge/CSS3-Custom_Properties-1572B6?logo=css3&logoColor=white)

---

## ✨ Features

| Feature | Status |
|---|---|
| Create, read, update, delete notes | ✅ Done |
| Live split-screen Markdown preview | ✅ Done |
| Debounced auto-save (500ms) with status indicator | ✅ Done |
| Full-text search via API | ✅ Done |
| Dark mode toggle with localStorage persistence | ✅ Done |
| GFM: tables, strikethrough, task lists, code blocks | ✅ Done |
| Relative timestamps on note cards | ✅ Done |
| Friendly empty states | ✅ Done |
| Consistent JSON API response envelope | ✅ Done |
| Centralised error handling middleware | ✅ Done |
| Auto-initialising SQLite database | ✅ Done |
| Note delete with confirmation dialog | ✅ Done |
| Keyboard-friendly, accessible markup | 🔜 Upcoming |
| Markdown export to `.md` file download | 🔜 Upcoming |
| Note tagging / categorisation | 🔜 Upcoming |
| Drag-and-drop note reordering | 🔜 Upcoming |
| Collaborative real-time editing (WebSockets) | 🔜 Upcoming |

---

## 🚀 Setup Instructions

### Prerequisites

- **Node.js** v18 or higher — [download](https://nodejs.org)
- **npm** v9 or higher (bundled with Node.js)
- A terminal / shell

---

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/markdown-notes-app.git
cd markdown-notes-app
```

---

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Copy the example env file and configure if needed
cp .env.example .env

# Start the development server (auto-restarts on changes)
npm run dev

# — or — start the production server
npm start
```

The API will be available at **http://localhost:5000**.

**Environment variables** (`.env`):

| Variable | Default | Description |
|---|---|---|
| `PORT` | `5000` | Port the Express server listens on |
| `NODE_ENV` | `development` | `development` or `production` |
| `DB_PATH` | `./db/notes.db` | Path to the SQLite database file |

> **Database** initialises automatically on first run — no migration step required.

---

### 3. Frontend Setup

Open a **new terminal tab**, then:

```bash
cd frontend

# Install dependencies
npm install

# Start the React development server
npm start
```

The app will open at **http://localhost:3000** and proxy API calls to `http://localhost:5000`.

---

### 4. Build for Production

```bash
# Frontend
cd frontend && npm run build
# Static files are output to frontend/build/

# Backend — serve build with a static middleware or deploy separately
cd backend && npm start
```

---

## 📡 API Reference

Base URL: `http://localhost:5000/api`

All responses follow this envelope:

```json
{ "success": true,  "data": { ... } }
{ "success": false, "error": "Human-readable message" }
```

| Method | Endpoint | Body | Description |
|---|---|---|---|
| `GET` | `/notes` | — | List all notes (`id`, `title`, `updated_at`) |
| `GET` | `/notes/:id` | — | Get a single note with full content |
| `POST` | `/notes` | `{ title?, content? }` | Create a new note |
| `PUT` | `/notes/:id` | `{ title?, content? }` | Update title and/or content |
| `DELETE` | `/notes/:id` | — | Delete a note |
| `GET` | `/notes/search?q=term` | — | Full-text search across title & content |
| `GET` | `/health` | — | Health check |

**Status codes used:** `200 OK`, `201 Created`, `400 Bad Request`, `404 Not Found`, `500 Internal Server Error`

---

## 🗂️ Folder Structure

```
markdown-notes-app/
├── backend/
│   ├── db/
│   │   └── database.js          # SQLite connection + schema init + WAL pragma
│   ├── routes/
│   │   └── notes.js             # All 6 REST endpoints
│   ├── middleware/
│   │   └── errorHandler.js      # Centralised Express error middleware
│   ├── app.js                   # Express setup, middleware chain, server start
│   ├── package.json
│   └── .env.example
│
├── frontend/
│   ├── public/
│   │   └── index.html
│   └── src/
│       ├── api/
│       │   └── notesApi.js      # All axios calls — zero API logic in components
│       ├── components/
│       │   ├── Navbar.jsx       # Brand + dark mode toggle
│       │   ├── SearchBar.jsx    # Controlled search input
│       │   ├── NotesList.jsx    # Sidebar list with relative timestamps
│       │   ├── Editor.jsx       # Title input + toolbar hints + textarea
│       │   └── Preview.jsx      # react-markdown + remark-gfm renderer
│       ├── hooks/
│       │   └── useDebounce.js   # Generic debounce hook (value, delay) → value
│       ├── App.jsx              # Root: state, effects, event handlers
│       ├── App.css              # All styles — CSS variables, dark mode, layout
│       └── index.js             # ReactDOM.createRoot entry point
│
└── README.md
```

---

## 🧠 Design Decisions

### 1. SQLite over PostgreSQL

SQLite with `better-sqlite3` was chosen over PostgreSQL for two reasons. First, it has **zero infrastructure overhead** — the database is a single file that initialises automatically on first run, meaning evaluators can clone and run without installing a database server. Second, `better-sqlite3` is synchronous, which removes the complexity of async database drivers and makes every query a simple function call. The trade-off is that SQLite doesn't support concurrent writes at scale, but for a personal notes application this is irrelevant.

### 2. Debounced auto-save over explicit "Save" button

Notes applications that require a manual save action lose data when users close the tab by habit. A 500ms debounced auto-save (via `useDebounce`) provides the best UX: the UI is instantly responsive, but network requests are batched — typing a 100-character sentence makes one API call, not 100. The subtle "Saving… / Saved ✓" status indicator keeps the user informed without stealing focus.

### 3. List endpoint returns partial data (no content field)

`GET /api/notes` intentionally omits the `content` column. A note sidebar only needs `id`, `title`, and `updated_at`. Fetching full content for every note in the list would be wasteful as content can be thousands of characters. The full content is fetched lazily in `GET /api/notes/:id` only when the user selects a note — a simple application of the **select only what you need** principle.

---

## 🎬 Demo Video Script

If recording a walkthrough, cover these beats in order:

1. Show the running app — create a new note
2. Type Markdown (headings, bold, code block, table) and show the live preview updating in real time
3. Pause typing — show "Saving…" become "Saved ✓" after 500ms
4. Type a keyword in the search bar and show the note list filter via the API
5. Toggle dark mode; refresh the page to show preference is persisted via `localStorage`
6. Delete a note via the trash icon (confirm the dialog)
7. Walk through: folder structure → `notesApi.js` → `routes/notes.js` → `database.js` → `useDebounce.js`
8. Explain one trade-off: *"I chose SQLite over PostgreSQL because this app's audience is a single user on a local machine — eliminating the database server as a setup dependency makes onboarding instant."*

---

## 📄 License

MIT © 2024 — free to use, modify, and distribute.
