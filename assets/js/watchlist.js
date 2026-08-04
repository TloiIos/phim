/* ============================================================
   CINEVA — Watchlist (LocalStorage: cineva_watchlist)
   ============================================================ */
"use strict";

const Watchlist = (() => {
  const KEY = "cineva_watchlist";

  function list() {
    try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; }
  }
  function save(ids) {
    try { localStorage.setItem(KEY, JSON.stringify(ids)); } catch { /* ignore */ }
  }
  function has(id) { return list().includes(Number(id)); }
  function add(id) {
    id = Number(id);
    const ids = list();
    if (!ids.includes(id)) { ids.unshift(id); save(ids); }
  }
  function remove(id) {
    id = Number(id);
    save(list().filter(x => x !== id));
  }
  /** @returns {boolean} true nếu vừa thêm, false nếu vừa xóa */
  function toggle(id) {
    if (has(id)) { remove(id); return false; }
    add(id); return true;
  }
  function clear() { save([]); }

  return { list, has, add, remove, toggle, clear };
})();

/* ---- Trang watchlist.html ---- */
const WatchlistPage = (() => {
  function render() {
    const grid = document.getElementById("watchlist-grid");
    if (!grid) return;
    const movies = Watchlist.list().map(id => MovieDB.byId(id)).filter(Boolean);
    const count = document.getElementById("wl-count");
    if (count) count.textContent = movies.length ? `${movies.length} phim đã lưu` : "";
    if (!movies.length) {
      grid.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1">
        <div class="empty-ico"><i class="fa-solid fa-bookmark"></i></div>
        <h3>Danh sách của bạn đang trống</h3>
        <p>Nhấn nút <i class="fa-solid fa-plus"></i> trên phim bất kỳ để lưu vào đây và xem sau.</p>
        <a class="btn btn-primary" href="browse.html">Khám phá phim ngay</a>
      </div>`;
      return;
    }
    grid.innerHTML = movies.map(m => Render.card(m)).join("");
    UI.bindLazyImages(grid);
  }

  function init() {
    if (!document.getElementById("watchlist-grid")) return;
    render();
    document.addEventListener("watchlist:change", render);
    document.getElementById("wl-clear")?.addEventListener("click", () => {
      if (!Watchlist.list().length) return;
      if (!confirm("Xóa toàn bộ danh sách đã lưu?")) return;
      Watchlist.clear();
      UI.toast("Đã xóa toàn bộ danh sách", "info");
      render();
    });
  }
  return { init };
})();

document.addEventListener("DOMContentLoaded", WatchlistPage.init);
