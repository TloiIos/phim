/* ============================================================
   CINEVA — Theme Manager (Dark / Light, lưu LocalStorage)
   Nạp sớm trong <head> để tránh flash sai theme.
   ============================================================ */
"use strict";

const Theme = (() => {
  const KEY = "cineva_theme";

  function get() {
    try { return localStorage.getItem(KEY) || "dark"; } catch { return "dark"; }
  }
  function apply(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    // Cập nhật icon các nút toggle nếu đã render
    document.querySelectorAll("[data-theme-toggle] i").forEach(i => {
      i.className = theme === "dark" ? "fa-solid fa-moon" : "fa-solid fa-sun";
    });
    document.querySelectorAll("[data-theme-switch]").forEach(sw => {
      sw.setAttribute("aria-checked", theme === "light" ? "true" : "false");
    });
  }
  function set(theme) {
    try { localStorage.setItem(KEY, theme); } catch { /* private mode */ }
    apply(theme);
  }
  function toggle() {
    set(get() === "dark" ? "light" : "dark");
  }
  function init() {
    apply(get());
    document.addEventListener("click", e => {
      const btn = e.target.closest("[data-theme-toggle], [data-theme-switch]");
      if (btn) toggle();
    });
  }

  return { get, set, toggle, init };
})();

// Áp dụng ngay khi script chạy (trước DOMContentLoaded) để tránh nháy màu
Theme.set(Theme.get());
document.addEventListener("DOMContentLoaded", Theme.init);
