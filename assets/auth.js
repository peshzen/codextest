window.Auth = (() => {
  const KEY = "kanban.session.user";
  const DEMO_USERS = new Set(["alice@dev.io", "bob@dev.io"]);
  function login(email, password) {
    return new Promise((resolve, reject) => {
      if (!email) return reject(new Error("Email is required."));
      if (DEMO_USERS.has(email.toLowerCase()) || email.includes("@")) {
        const user = { email };
        localStorage.setItem(KEY, JSON.stringify(user));
        resolve(user);
      } else { reject(new Error("Invalid credentials.")); }
    });
  }
  function logout() { localStorage.removeItem(KEY); }
  function currentUser() { try { return JSON.parse(localStorage.getItem(KEY)); } catch { return null; } }
  function requireLogin() { const u = currentUser(); if (!u) window.location.replace("index.html"); return !!u; }
  return { login, logout, currentUser, requireLogin };
})();