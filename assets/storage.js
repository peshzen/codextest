// Storage helpers (localStorage). Bug fixed + migration + extra backlog tasks.
window.Storage = (() => {
  const KEY = "kanban.tasks.v1";      // canonical key
  const OLD_KEY = "kanban.task.v1";   // legacy (buggy) key

  function sampleTasks() {
    return [
      { id: crypto.randomUUID(), title: "Setup repo & CI", assignee: "Alice", priority: "High", tags: ["setup","ci"], status: "backlog" },
      { id: crypto.randomUUID(), title: "Implement auth (client-only)", assignee: "Bob", priority: "Medium", tags: ["auth"], status: "inprogress" },
      { id: crypto.randomUUID(), title: "Add drag & drop", assignee: "Carol", priority: "High", tags: ["ux"], status: "review" },
      { id: crypto.randomUUID(), title: "Polish styles", assignee: "Alice", priority: "Low", tags: ["ui"], status: "done" },
      { id: crypto.randomUUID(), title: "Create issue templates", assignee: "Carol", priority: "Low", tags: ["repo","docs"], status: "backlog" },
      { id: crypto.randomUUID(), title: "Define code owners", assignee: "Bob", priority: "Medium", tags: ["repo","governance"], status: "backlog" },
      { id: crypto.randomUUID(), title: "Add accessibility checks", assignee: "Alice", priority: "High", tags: ["a11y","testing"], status: "backlog" },
      { id: crypto.randomUUID(), title: "Write contribution guide", assignee: "", priority: "Low", tags: ["docs"], status: "backlog" },
      { id: crypto.randomUUID(), title: "Implement keyboard DnD", assignee: "Carol", priority: "Medium", tags: ["ux"], status: "backlog" },
      { id: crypto.randomUUID(), title: "Add task details modal", assignee: "Bob", priority: "Medium", tags: ["ui"], status: "backlog" }
    ];
  }

  function loadTasks() {
    try {
      let raw = localStorage.getItem(KEY);
      if (!raw) {
        const legacy = localStorage.getItem(OLD_KEY);
        if (legacy) { localStorage.setItem(KEY, legacy); localStorage.removeItem(OLD_KEY); raw = legacy; }
      }
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  }

  function saveTasks(tasks) { localStorage.setItem(KEY, JSON.stringify(tasks || [])); }

  return { loadTasks, saveTasks, sampleTasks };
})();