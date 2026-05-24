Auth.requireLogin();

document.getElementById("currentUser").textContent = Auth.currentUser()?.email || "";
document.getElementById("logoutLink").onclick = (e) => { e.preventDefault(); Auth.logout(); location.href = "index.html"; };

const STATUS_ORDER = ["backlog", "inprogress", "review", "done"];
const DEFAULT_LABEL = "Unassigned";

function buildSummary(tasks) {
  const summary = new Map();

  for (const task of tasks) {
    const assignee = (task.assignee || "").trim() || DEFAULT_LABEL;
    if (!summary.has(assignee)) {
      summary.set(assignee, { backlog: 0, inprogress: 0, review: 0, done: 0, total: 0 });
    }

    const row = summary.get(assignee);
    const status = STATUS_ORDER.includes(task.status) ? task.status : "backlog";
    row[status] += 1;
    row.total += 1;
  }

  return [...summary.entries()].sort((a, b) => a[0].localeCompare(b[0]));
}

function render() {
  const tasks = Storage.loadTasks();
  const cardsHost = document.getElementById("summaryCards");
  const template = document.getElementById("summaryCardTemplate");

  cardsHost.innerHTML = "";

  const summary = buildSummary(tasks);
  if (summary.length === 0) {
    cardsHost.innerHTML = '<p class="muted">No tasks available yet.</p>';
    return;
  }

  for (const [assignee, counts] of summary) {
    const frag = template.content.cloneNode(true);
    frag.querySelector(".assignee-name").textContent = assignee;
    frag.querySelector(".count-backlog").textContent = counts.backlog;
    frag.querySelector(".count-inprogress").textContent = counts.inprogress;
    frag.querySelector(".count-review").textContent = counts.review;
    frag.querySelector(".count-done").textContent = counts.done;
    frag.querySelector(".count-total").textContent = counts.total;

    const link = frag.querySelector(".board-link");
    const assigneeFilter = assignee === DEFAULT_LABEL ? "" : assignee;
    link.href = `board.html${assigneeFilter ? `?assignee=${encodeURIComponent(assigneeFilter)}` : ""}`;

    cardsHost.appendChild(frag);
  }
}

render();
