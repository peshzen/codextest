# Dev Kanban (teaching app)

No-backend Kanban board for developers. Pure HTML/CSS/JS, plus a tiny Python static server.

## Features
- Client-side login
- Pages: login, board, settings, about, privacy
- Columns: Backlog, In Progress, Review, Done
- Create/delete tasks, move between columns
- Drag & Drop (HTML5)
- Filters: assignee, priority
- Light/Dark theme (with intentional bug: switching doesn't apply until reload)
- Extra backlog seed tasks
- Local persistence with migration from legacy key

## Run locally
```bash
python3 serve.py
# Then open http://localhost:8000/index.html
```
