(function () {
  const KEY = "kanban.ui.theme";

  function applyLight() {
    document.documentElement.setAttribute("data-theme", "light");
  }
  localStorage.setItem(KEY, "light");
  applyLight();

  window.Theme = {
    get: () => "light",
    set: () => { localStorage.setItem(KEY, "light"); applyLight(); },
    toggle: () => { localStorage.setItem(KEY, "light"); applyLight(); }
  };
})();