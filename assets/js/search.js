/* ============================================================
   CINEVA — Realtime Search (debounce + suggestions dropdown)
   ============================================================ */
"use strict";

const Search = (() => {
  let input, box;
  let activeIndex = -1;

  const escHTML = s => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

  function highlight(text, q) {
    const idx = text.toLowerCase().indexOf(q.toLowerCase());
    if (idx < 0) return escHTML(text);
    return escHTML(text.slice(0, idx)) + "<mark>" + escHTML(text.slice(idx, idx + q.length)) + "</mark>" + escHTML(text.slice(idx + q.length));
  }

  function render(results, q) {
    activeIndex = -1;
    if (!q) { close(); return; }
    if (!results.length) {
      box.innerHTML = `<div class="suggest-empty"><i class="fa-solid fa-magnifying-glass"></i><br>Không tìm thấy kết quả cho "<strong>${escHTML(q)}</strong>"</div>`;
      box.classList.add("open");
      return;
    }
    box.innerHTML = results.slice(0, 7).map(m => `
      <a class="suggest-item" href="movie.html?id=${m.id}" role="option">
        <img src="${Art.poster(m)}" alt="" width="42" height="62" loading="lazy">
        <div class="s-info">
          <div class="s-title">${highlight(m.title, q)}</div>
          <div class="s-meta">${m.year} · <i class="fa-solid fa-star" style="color:var(--gold)"></i> ${m.rating.toFixed(1)} · ${m.genres.slice(0, 2).map(genreVi).join(", ")}</div>
        </div>
        <span class="badge badge-quality">${m.quality?.includes("4K") ? "4K" : "HD"}</span>
      </a>`).join("") +
      `<a class="suggest-item" href="browse.html?q=${encodeURIComponent(q)}" style="justify-content:center;color:var(--cyan)">
        Xem tất cả ${results.length} kết quả <i class="fa-solid fa-arrow-right"></i>
      </a>`;
    box.classList.add("open");
  }

  function close() {
    box?.classList.remove("open");
    activeIndex = -1;
  }

  function doSearch(q) {
    q = q.trim();
    if (!q) { close(); return; }
    // Trạng thái đang tìm
    box.innerHTML = `<div class="suggest-empty"><span class="spinner" style="width:22px;height:22px;border-width:2px;margin:0 auto"></span></div>`;
    box.classList.add("open");
    const results = MovieDB.search(q);
    render(results, q);
  }

  function moveActive(dir) {
    const items = [...box.querySelectorAll(".suggest-item")];
    if (!items.length) return;
    activeIndex = (activeIndex + dir + items.length) % items.length;
    items.forEach((it, i) => it.classList.toggle("active", i === activeIndex));
    items[activeIndex].scrollIntoView({ block: "nearest" });
  }

  function init() {
    input = document.getElementById("global-search");
    box = document.getElementById("search-suggest");
    if (!input || !box) return;

    const debounced = UI.debounce(() => doSearch(input.value), 250);
    input.addEventListener("input", debounced);
    input.addEventListener("focus", () => { if (input.value.trim()) doSearch(input.value); });

    input.addEventListener("keydown", e => {
      if (e.key === "ArrowDown") { e.preventDefault(); moveActive(1); }
      else if (e.key === "ArrowUp") { e.preventDefault(); moveActive(-1); }
      else if (e.key === "Enter") {
        e.preventDefault();
        const active = box.querySelector(".suggest-item.active");
        if (active) location.href = active.href;
        else if (input.value.trim()) location.href = `browse.html?q=${encodeURIComponent(input.value.trim())}`;
      } else if (e.key === "Escape") {
        close();
        input.blur();
      }
    });

    document.addEventListener("click", e => {
      if (!e.target.closest(".header-search")) close();
    });
  }

  return { init };
})();

document.addEventListener("DOMContentLoaded", Search.init);
