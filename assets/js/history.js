/* ============================================================
   CINEVA — Lịch sử xem + tiến trình "Tiếp tục xem"
   LocalStorage:
   - cineva_history  : [{movieId, s, ep, at}]           (mới nhất trước)
   - cineva_progress : { "id" | "id_s_ep": {t, d, at} } (giây hiện tại / tổng)
   ============================================================ */
"use strict";

const History = (() => {
  const H_KEY = "cineva_history";
  const P_KEY = "cineva_progress";
  const MAX = 60;

  const read = (k, fb) => { try { return JSON.parse(localStorage.getItem(k)) ?? fb; } catch { return fb; } };
  const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* ignore */ } };

  function list() { return read(H_KEY, []); }

  function record(movieId, s = null, ep = null) {
    movieId = Number(movieId);
    let hist = list().filter(h => !(h.movieId === movieId && h.s === s && h.ep === ep));
    hist.unshift({ movieId, s, ep, at: Date.now() });
    if (hist.length > MAX) hist = hist.slice(0, MAX);
    write(H_KEY, hist);
  }

  function removeEntry(index) {
    const hist = list();
    hist.splice(index, 1);
    write(H_KEY, hist);
  }

  function progressKey(movieId, s, ep) {
    return s != null && ep != null ? `${movieId}_${s}_${ep}` : String(movieId);
  }

  function saveProgress(movieId, s, ep, time, duration) {
    if (!duration || duration < 30) return;
    const all = read(P_KEY, {});
    const key = progressKey(movieId, s, ep);
    if (time / duration > 0.96) delete all[key]; // xem xong → bỏ khỏi "tiếp tục xem"
    else all[key] = { t: Math.floor(time), d: Math.floor(duration), at: Date.now() };
    write(P_KEY, all);
  }

  function getProgress(movieId, s, ep) {
    return read(P_KEY, {})[progressKey(movieId, s, ep)] || null;
  }

  /** Danh sách "Tiếp tục xem": mỗi phim 1 mục, mới nhất trước */
  function continueList() {
    const all = read(P_KEY, {});
    const byMovie = new Map();
    Object.entries(all).forEach(([key, v]) => {
      const [movieId, s, ep] = key.split("_").map(Number);
      const prev = byMovie.get(movieId);
      if (!prev || v.at > prev.at) {
        byMovie.set(movieId, {
          movieId, s: isNaN(s) ? null : s, ep: isNaN(ep) ? null : ep,
          t: v.t, d: v.d, at: v.at,
          percent: Math.min(100, Math.round((v.t / v.d) * 100))
        });
      }
    });
    return [...byMovie.values()].sort((a, b) => b.at - a.at).slice(0, 12);
  }

  function clearAll() { write(H_KEY, []); write(P_KEY, {}); }

  return { list, record, removeEntry, saveProgress, getProgress, continueList, clearAll };
})();

/* ---- Trang history.html ---- */
const HistoryPage = (() => {
  function timeAgo(ts) {
    const s = Math.floor((Date.now() - ts) / 1000);
    if (s < 60) return "Vừa xong";
    if (s < 3600) return `${Math.floor(s / 60)} phút trước`;
    if (s < 86400) return `${Math.floor(s / 3600)} giờ trước`;
    if (s < 604800) return `${Math.floor(s / 86400)} ngày trước`;
    return new Date(ts).toLocaleDateString("vi-VN");
  }

  function render() {
    const wrap = document.getElementById("history-list");
    if (!wrap) return;
    const hist = History.list();
    if (!hist.length) {
      wrap.innerHTML = `
      <div class="empty-state">
        <div class="empty-ico"><i class="fa-solid fa-clock-rotate-left"></i></div>
        <h3>Chưa có lịch sử xem</h3>
        <p>Các phim bạn đã xem sẽ xuất hiện tại đây.</p>
        <a class="btn btn-primary" href="browse.html">Bắt đầu xem phim</a>
      </div>`;
      document.getElementById("hist-clear")?.classList.add("hide");
      return;
    }
    document.getElementById("hist-clear")?.classList.remove("hide");
    wrap.innerHTML = hist.map((h, i) => {
      const m = MovieDB.byId(h.movieId);
      if (!m) return "";
      const prog = History.getProgress(h.movieId, h.s, h.ep);
      const pct = prog ? Math.min(100, Math.round((prog.t / prog.d) * 100)) : 100;
      const epLabel = h.s != null ? ` — Mùa ${h.s} · Tập ${h.ep}` : "";
      const watchHref = h.s != null ? `watch.html?id=${m.id}&s=${h.s}&ep=${h.ep}` : `watch.html?id=${m.id}`;
      return `
      <div class="history-row reveal in-view" data-index="${i}">
        <a href="movie.html?id=${m.id}" class="h-poster" aria-label="${Render.esc(m.title)}">
          <img class="lazy-img" src="${Art.poster(m)}" alt="" width="72" height="104" loading="lazy">
        </a>
        <div class="h-info">
          <a class="h-title" href="movie.html?id=${m.id}">${Render.esc(m.title)}${epLabel}</a>
          <div class="h-time"><i class="fa-solid fa-clock"></i> ${timeAgo(h.at)} · ${pct >= 96 ? "Đã xem xong" : `Đã xem ${pct}%`}</div>
          <div class="h-progress"><span style="width:${pct}%"></span></div>
        </div>
        <div class="h-actions">
          <a class="btn btn-icon" href="${watchHref}" aria-label="Xem tiếp"><i class="fa-solid fa-play"></i></a>
          <button class="btn btn-icon" data-remove="${i}" aria-label="Xóa khỏi lịch sử"><i class="fa-solid fa-trash-can"></i></button>
        </div>
      </div>`;
    }).join("");
    UI.bindLazyImages(wrap);
  }

  function init() {
    const wrap = document.getElementById("history-list");
    if (!wrap) return;
    render();
    wrap.addEventListener("click", e => {
      const btn = e.target.closest("[data-remove]");
      if (!btn) return;
      History.removeEntry(Number(btn.dataset.remove));
      UI.toast("Đã xóa khỏi lịch sử", "info");
      render();
    });
    document.getElementById("hist-clear")?.addEventListener("click", () => {
      if (!confirm("Xóa toàn bộ lịch sử xem và tiến trình?")) return;
      History.clearAll();
      UI.toast("Đã xóa toàn bộ lịch sử", "success");
      render();
    });
  }
  return { init };
})();

document.addEventListener("DOMContentLoaded", HistoryPage.init);
