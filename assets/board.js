/* Board logic: drag/drop, CRUD, filters (no search) */
Auth.requireLogin();

const currentUser = Auth.currentUser();
document.getElementById("currentUser").textContent = currentUser?.email || "";
document.getElementById("logoutBtn").onclick = () => { Auth.logout(); location.href = "index.html"; };

const state = { tasks: [], filter: { assignee: "", priority: "" } };

// Load tasks; if missing/invalid, seed and persist samples so they show up immediately
try {
  const loaded = Storage.loadTasks();
  if (Array.isArray(loaded) && loaded.length > 0) {
    state.tasks = loaded;
  } else {
    state.tasks = Storage.sampleTasks();
    Storage.saveTasks(state.tasks);
  }
} catch (e) {
  console.error("Failed to load tasks, seeding samples", e);
  state.tasks = Storage.sampleTasks();
  Storage.saveTasks(state.tasks);
}

const els = {
  template: document.getElementById("taskTemplate"),
  zones: {
    backlog: document.getElementById("col-backlog"),
    inprogress: document.getElementById("col-inprogress"),
    review: document.getElementById("col-review"),
    done: document.getElementById("col-done"),
  },
  newForm: document.getElementById("newTaskForm"),
  inputs: {
    title: document.getElementById("titleInput"),
    assignee: document.getElementById("assigneeInput"),
    priority: document.getElementById("priorityInput"),
    tags: document.getElementById("tagsInput"),
    fAssignee: document.getElementById("filterAssignee"),
    fPriority: document.getElementById("filterPriority"),
  },
  clearFilters: document.getElementById("clearFilters")
};

function render() {
  Object.values(els.zones).forEach(z => z.innerHTML = "");

  const filtered = state.tasks.filter(t => {
    if (state.filter.assignee && t.assignee !== state.filter.assignee) return false;
    if (state.filter.priority && t.priority !== state.filter.priority) return false;
    return true;
  });

  for (const task of filtered) {
    const frag = els.template.content.cloneNode(true);
    const el = frag.querySelector(".task");
    el.dataset.id = task.id;
    el.querySelector(".title").textContent = task.title;
    el.querySelector(".assignee").textContent = task.assignee || "Unassigned";
    el.querySelector(".priority").textContent = task.priority || "None";
    el.querySelector(".tags").textContent = (task.tags || []).map(t => "#" + t).join(" ");

    el.querySelector(".delete").onclick = () => {
      state.tasks = state.tasks.filter(x => x.id !== task.id);
      Storage.saveTasks(state.tasks);
      render();
    };
    el.querySelector(".move-left").onclick = () => { moveTask(task.id, -1); };
    el.querySelector(".move-right").onclick = () => { moveTask(task.id, +1); };

    el.addEventListener("dragstart", ev => { ev.dataTransfer.setData("text/plain", task.id); });

    const col = (task.status && els.zones[task.status]) ? task.status : "backlog";
    els.zones[col].appendChild(frag);
  }
}

function moveTask(id, delta) {
  const order = ["backlog","inprogress","review","done"];
  const t = state.tasks.find(x => x.id === id);
  if (!t) return;
  const idx = Math.max(0, Math.min(3, order.indexOf(t.status) + delta));
  t.status = order[idx];
  Storage.saveTasks(state.tasks);
  render();
}

for (const [status, zone] of Object.entries(els.zones)) {
  zone.addEventListener("dragover", ev => { ev.preventDefault(); zone.classList.add("drag-over"); });
  zone.addEventListener("dragleave", () => zone.classList.remove("drag-over"));
  zone.addEventListener("drop", ev => {
    ev.preventDefault();
    zone.classList.remove("drag-over");
    const id = ev.dataTransfer.getData("text/plain");
    const t = state.tasks.find(x => x.id === id);
    if (t) { t.status = status; Storage.saveTasks(state.tasks); render(); }
  });
}

els.newForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const title = els.inputs.title.value.trim();
  if (!title) return;
  const task = {
    id: crypto.randomUUID(),
    title,
    assignee: els.inputs.assignee.value || "",
    priority: els.inputs.priority.value || "",
    tags: (els.inputs.tags.value || "").split(/\s+/).filter(Boolean),
    status: "backlog"
  };
  state.tasks.unshift(task);
  Storage.saveTasks(state.tasks);
  els.inputs.title.value = "";
  els.inputs.tags.value = "";
  render();
});

els.inputs.fAssignee.addEventListener("change", () => { state.filter.assignee = els.inputs.fAssignee.value; render(); });
els.inputs.fPriority.addEventListener("change", () => { state.filter.priority = els.inputs.fPriority.value; render(); });
els.clearFilters.addEventListener("click", () => {
  state.filter = { assignee: "", priority: "" };
  els.inputs.fAssignee.value = "";
  els.inputs.fPriority.value = "";
  render();
});

render();
