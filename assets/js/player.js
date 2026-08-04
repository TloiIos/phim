/* ============================================================
   CINEVA — Custom Video Player (watch.html)
   - Điều khiển tùy biến: play/seek/volume/speed/PiP/fullscreen
   - Theater mode, auto-hide UI, phím tắt
   - Lưu tiến trình (Tiếp tục xem) + ghi lịch sử
   - Phim bộ: chọn mùa/tập, tự chuyển tập
   ============================================================ */
"use strict";

/* Fallback URLs chung cho player — dùng khi:
   1) Movie có videoUrl = "local://..." nhưng IndexedDB không có file
      (phim upload cục bộ trên thiết bị khác — không xem được ở đây)
   2) Tất cả URL trong mảng fallback đều lỗi
   Ưu tiên: archive.org → test-videos.co.uk → w3schools (đã verify 200). */
const PLAYER_FALLBACKS = [
  "https://archive.org/download/BigBuckBunny_124/Content/big_buck_bunny_720p_surround.mp4",
  "https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/720/Big_Buck_Bunny_720_10s_1MB.mp4",
  "https://test-videos.co.uk/vids/sintel/mp4/h264/720/Sintel_720_10s_1MB.mp4",
  "https://www.w3schools.com/html/mov_bbb.mp4",
  "https://www.w3schools.com/html/movie.mp4"
];

const Player = (() => {
  let movie, video, shell, season = null, episode = null;
  let hideTimer = null;
  let saveTimer = null;

  const $ = sel => document.querySelector(sel);
  const fmt = s => {
    if (!isFinite(s)) return "0:00";
    s = Math.floor(s);
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
    return h ? `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}` : `${m}:${String(sec).padStart(2, "0")}`;
  };

  /* ---------- UI markup ---------- */
  function playerHTML() {
    return `
    <video id="cv-video" playsinline webkit-playsinline preload="metadata" crossorigin="anonymous" x5-video-player-type="h5" x5-video-orientation="portrait-sec"></video>
    <div class="player-ui">
      <div class="player-top">
        <a class="btn btn-icon btn-glass" href="movie.html?id=${movie.id}" aria-label="Quay lại"><i class="fa-solid fa-arrow-left"></i></a>
        <div class="pt-title">
          <strong id="pt-name"></strong>
          <span id="pt-sub"></span>
        </div>
      </div>
      <div class="player-center">
        <button class="big-play" id="big-play" aria-label="Phát"><i class="fa-solid fa-play"></i></button>
      </div>
      <div class="player-bottom">
        <div class="seek-row">
          <span class="time-label" id="t-cur">0:00</span>
          <div class="seek-bar" id="seek" role="slider" aria-label="Thanh tua" tabindex="0"
               aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">
            <div class="seek-track"></div>
            <div class="seek-buffer"></div>
            <div class="seek-fill"></div>
            <div class="seek-thumb"></div>
          </div>
          <span class="time-label" id="t-dur">0:00</span>
        </div>
        <div class="controls-row">
          <button class="pc-btn" id="c-play" aria-label="Phát / Tạm dừng"><i class="fa-solid fa-play"></i></button>
          <button class="pc-btn" id="c-back" aria-label="Lùi 10 giây"><i class="fa-solid fa-rotate-left"></i></button>
          <button class="pc-btn" id="c-fwd" aria-label="Tới 10 giây"><i class="fa-solid fa-rotate-right"></i></button>
          <div class="volume-wrap">
            <button class="pc-btn" id="c-mute" aria-label="Tắt / Bật tiếng"><i class="fa-solid fa-volume-high"></i></button>
            <input class="volume-slider" id="c-vol" type="range" min="0" max="1" step="0.05" value="1" aria-label="Âm lượng">
          </div>
          <span class="time-label" id="t-mini"></span>
          <div class="controls-spacer"></div>
          <div style="position:relative">
            <button class="pc-btn" id="c-speed" aria-label="Tốc độ phát"><i class="fa-solid fa-gauge-high"></i></button>
            <div class="player-pop" id="pop-speed">
              <div class="pop-title">Tốc độ phát</div>
              ${[0.5, 0.75, 1, 1.25, 1.5, 2].map(s =>
                `<button class="pop-item ${s === 1 ? "active" : ""}" data-speed="${s}">${s === 1 ? "Chuẩn" : s + "x"}</button>`).join("")}
            </div>
          </div>
          <div style="position:relative">
            <button class="pc-btn" id="c-quality" aria-label="Chất lượng"><i class="fa-solid fa-sliders"></i></button>
            <div class="player-pop" id="pop-quality">
              <div class="pop-title">Chất lượng</div>
              ${(movie.quality || ["HD"]).map((q, i) =>
                `<button class="pop-item ${i === 0 ? "active" : ""}" data-quality="${q}">${q}</button>`).join("")}
            </div>
          </div>
          <button class="pc-btn" id="c-theater" aria-label="Chế độ rạp" title="Chế độ rạp (T)"><i class="fa-solid fa-rectangle-wide" style="display:none"></i><i class="fa-solid fa-film"></i></button>
          <button class="pc-btn" id="c-pip" aria-label="Hình trong hình"><i class="fa-solid fa-clone"></i></button>
          <button class="pc-btn" id="c-full" aria-label="Toàn màn hình (F)"><i class="fa-solid fa-expand"></i></button>
        </div>
      </div>
    </div>`;
  }

  function episodePanelHTML() {
    if (movie.type !== "series" || !movie.seasons) return "";
    return `
    <div class="episode-panel" id="ep-panel">
      <div class="season-tabs" id="season-tabs">
        ${movie.seasons.map(s =>
          `<button class="season-tab ${s.season === season ? "active" : ""}" data-season="${s.season}">Mùa ${s.season}</button>`).join("")}
      </div>
      <div class="episode-grid" id="ep-grid"></div>
      <div class="ep-nav">
        <button class="btn btn-glass" id="ep-prev"><i class="fa-solid fa-backward-step"></i> Tập trước</button>
        <button class="btn btn-glass" id="ep-next">Tập sau <i class="fa-solid fa-forward-step"></i></button>
      </div>
    </div>`;
  }

  function renderEpGrid() {
    const grid = $("#ep-grid");
    if (!grid) return;
    const s = movie.seasons.find(x => x.season === season);
    grid.innerHTML = Array.from({ length: s.episodes }, (_, i) => {
      const ep = i + 1;
      const prog = History.getProgress(movie.id, season, ep);
      const watched = prog && prog.t / prog.d > 0.05;
      return `<button class="ep-btn ${ep === episode ? "active" : ""}" data-ep="${ep}" aria-label="Tập ${ep}">
        ${ep}${watched ? `<span class="ep-dot"></span>` : ""}
      </button>`;
    }).join("");
  }

  /* ---------- Load source ---------- */
  function currentLabel() {
    return season != null ? `Mùa ${season} · Tập ${episode}` : (movie.quality?.[0] || "HD");
  }

  function loadSource(resume = true) {
    const setSource = (src, isFirstTry = false) => {
      video.src = src;
      $("#pt-name").textContent = movie.title;
      $("#pt-sub").textContent = currentLabel();
      document.title = `Xem ${movie.title}${season != null ? ` - Mùa ${season} Tập ${episode}` : ""} — CINEVA`;
      const prog = resume ? History.getProgress(movie.id, season, episode) : null;
      video.addEventListener("loadedmetadata", () => {
        if (prog && prog.t > 5 && prog.t < video.duration - 10) {
          video.currentTime = prog.t;
          UI.toast(`Tiếp tục từ ${fmt(prog.t)}`, "info");
        }
        // Ẩn overlay lỗi nếu có
        const err = document.getElementById("video-error-overlay");
        if (err) err.style.display = "none";
      }, { once: true });
      History.record(movie.id, season, episode);
      const p = new URLSearchParams({ id: movie.id });
      if (season != null) { p.set("s", season); p.set("ep", episode); }
      history.replaceState(null, "", "watch.html?" + p.toString());
    };

    if (movie.videoUrl && movie.videoUrl.startsWith("local://")) {
      const key = movie.videoUrl.replace("local://", "");
      VideoStore.getURL(key).then(url => {
        if (url) {
          // Đúng thiết bị đã upload — phát file local
          setSource(url, true);
          _fallbackChain = [];
          _currentSrc = url;
        } else {
          // File chỉ có trên thiết bị đã upload (desktop). Trên mobile/thiết bị
          // khác, IndexedDB không có → thử fallback online thay vì thất bại.
          UI.toast("Video này chỉ lưu cục bộ trên thiết bị upload. Đang phát bản demo.", "info");
          const first = PLAYER_FALLBACKS[0];
          setSource(first, true);
          _fallbackChain = PLAYER_FALLBACKS.slice(1);
          _currentSrc = first;
        }
      });
    } else if (Array.isArray(movie.videoUrl)) {
      // Mảng URL fallback (phim demo mặc định)
      const first = movie.videoUrl[0];
      setSource(first, true);
      // Nối thêm PLAYER_FALLBACKS phòng khi tất cả URL trong phim đều lỗi
      _fallbackChain = [...movie.videoUrl.slice(1), ...PLAYER_FALLBACKS];
      _currentSrc = first;
    } else {
      // Single URL
      setSource(movie.videoUrl, true);
      _fallbackChain = [...PLAYER_FALLBACKS];
      _currentSrc = movie.videoUrl;
    }
  }

  // State cho fallback chain
  let _fallbackChain = [];
  let _currentSrc = "";

  function tryNextFallback() {
    if (_fallbackChain.length === 0) {
      showVideoError();
      return false;
    }
    const next = _fallbackChain.shift();
    console.warn(`[Player] source failed: ${_currentSrc}. Trying: ${next}`);
    _currentSrc = next;
    video.src = next;
    return true;
  }

  function showVideoError() {
    let overlay = document.getElementById("video-error-overlay");
    if (!overlay) {
      overlay = document.createElement("div");
      overlay.id = "video-error-overlay";
      overlay.className = "video-error";
      overlay.innerHTML = `
        <i class="fa-solid fa-triangle-exclamation"></i>
        <h3>Không thể phát video</h3>
        <p>Nguồn video có thể đang bị chặn bởi mạng của bạn hoặc định dạng không được hỗ trợ.<br>Trên điện thoại, hãy thử chuyển Wi-Fi hoặc mạng 4G.</p>
        <div class="video-error-actions">
          <button class="btn btn-primary" id="ver-retry"><i class="fa-solid fa-rotate-right"></i> Thử lại</button>
          <button class="btn btn-glass" id="ver-next"><i class="fa-solid fa-forward"></i> Nguồn khác</button>
        </div>`;
      shell?.appendChild(overlay);
      overlay.querySelector("#ver-retry")?.addEventListener("click", () => {
        overlay.style.display = "none";
        loadSource(true);
      });
      overlay.querySelector("#ver-next")?.addEventListener("click", () => {
        overlay.style.display = "none";
        tryNextFallback();
      });
    }
    overlay.style.display = "flex";
  }

  function gotoEpisode(s, ep, autoplay = false) {
    const sd = movie.seasons?.find(x => x.season === s);
    if (!sd || ep < 1 || ep > sd.episodes) return false;
    season = s; episode = ep;
    $("#season-tabs")?.querySelectorAll(".season-tab").forEach(t =>
      t.classList.toggle("active", Number(t.dataset.season) === s));
    renderEpGrid();
    loadSource(true);
    if (autoplay) video.play().catch(() => {});
    return true;
  }

  function nextEpisode(autoplay = true) {
    if (season == null) return false;
    const sd = movie.seasons.find(x => x.season === season);
    if (episode < sd.episodes) return gotoEpisode(season, episode + 1, autoplay);
    const idx = movie.seasons.findIndex(x => x.season === season);
    if (idx < movie.seasons.length - 1) return gotoEpisode(movie.seasons[idx + 1].season, 1, autoplay);
    return false;
  }
  function prevEpisode() {
    if (season == null) return false;
    if (episode > 1) return gotoEpisode(season, episode - 1, true);
    const idx = movie.seasons.findIndex(x => x.season === season);
    if (idx > 0) {
      const prev = movie.seasons[idx - 1];
      return gotoEpisode(prev.season, prev.episodes, true);
    }
    return false;
  }

  /* ---------- Controls ---------- */
  function togglePlay() { video.paused ? video.play().catch(() => {}) : video.pause(); }

  function updatePlayIcons() {
    const ic = video.paused ? "fa-play" : "fa-pause";
    $("#c-play").innerHTML = `<i class="fa-solid ${ic}"></i>`;
    $("#big-play").innerHTML = `<i class="fa-solid ${ic}"></i>`;
    shell.classList.toggle("playing", !video.paused);
  }

  function updateSeek() {
    const pct = video.duration ? (video.currentTime / video.duration) * 100 : 0;
    const seek = $("#seek");
    seek.style.setProperty("--seek-fill", pct + "%");
    seek.setAttribute("aria-valuenow", Math.round(pct));
    $("#t-cur").textContent = fmt(video.currentTime);
    $("#t-dur").textContent = fmt(video.duration);
    $("#t-mini").textContent = `${fmt(video.currentTime)} / ${fmt(video.duration)}`;
    if (video.buffered.length && video.duration) {
      const buf = (video.buffered.end(video.buffered.length - 1) / video.duration) * 100;
      seek.style.setProperty("--buffer-fill", buf + "%");
    }
  }

  function seekTo(clientX) {
    const seek = $("#seek");
    const r = seek.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (clientX - r.left) / r.width));
    if (video.duration) video.currentTime = ratio * video.duration;
    updateSeek();
  }

  function updateVolumeIcon() {
    const i = video.muted || video.volume === 0 ? "fa-volume-xmark"
      : video.volume < 0.5 ? "fa-volume-low" : "fa-volume-high";
    $("#c-mute").innerHTML = `<i class="fa-solid ${i}"></i>`;
    $("#c-vol").value = video.muted ? 0 : video.volume;
  }

  function showUI() {
    shell.classList.remove("hide-ui");
    clearTimeout(hideTimer);
    if (!video.paused) {
      hideTimer = setTimeout(() => {
        if (!document.querySelector(".player-pop.open")) shell.classList.add("hide-ui");
      }, 2800);
    }
  }

  function closePops() {
    document.querySelectorAll(".player-pop.open").forEach(p => p.classList.remove("open"));
  }

  function saveProgressNow() {
    if (video.duration) History.saveProgress(movie.id, season, episode, video.currentTime, video.duration);
  }

  /* ---------- Bind events ---------- */
  function bind() {
    // Play / pause
    $("#c-play").addEventListener("click", togglePlay);
    $("#big-play").addEventListener("click", togglePlay);
    video.addEventListener("click", () => { togglePlay(); showUI(); });
    video.addEventListener("dblclick", () => $("#c-full").click());
    video.addEventListener("play", updatePlayIcons);
    video.addEventListener("pause", () => { updatePlayIcons(); showUI(); saveProgressNow(); });
    video.addEventListener("timeupdate", updateSeek);
    video.addEventListener("progress", updateSeek);
    video.addEventListener("volumechange", updateVolumeIcon);
    video.addEventListener("waiting", () => $("#big-play").innerHTML = `<span class="spinner" style="width:30px;height:30px;border-width:3px"></span>`);
    video.addEventListener("playing", updatePlayIcons);
    video.addEventListener("error", () => {
      // Thử fallback kế tiếp nếu có; nếu không thì hiện overlay
      if (_fallbackChain && _fallbackChain.length > 0) {
        tryNextFallback();
      } else {
        showVideoError();
      }
    });
    video.addEventListener("ended", () => {
      saveProgressNow();
      if (season != null) {
        if (nextEpisode(true)) UI.toast("Đang phát tập tiếp theo...", "info");
        else UI.toast("Bạn đã xem hết bộ phim này!", "success");
      }
      updatePlayIcons();
    });

    // Lưu tiến trình định kỳ
    saveTimer = setInterval(() => { if (!video.paused) saveProgressNow(); }, 5000);
    window.addEventListener("beforeunload", saveProgressNow);
    document.addEventListener("visibilitychange", () => { if (document.hidden) saveProgressNow(); });

    // Skip
    $("#c-back").addEventListener("click", () => { video.currentTime = Math.max(0, video.currentTime - 10); });
    $("#c-fwd").addEventListener("click", () => { video.currentTime = Math.min(video.duration || 0, video.currentTime + 10); });

    // Seek bar (pointer)
    const seek = $("#seek");
    let dragging = false;
    seek.addEventListener("pointerdown", e => { dragging = true; seek.setPointerCapture(e.pointerId); seekTo(e.clientX); });
    seek.addEventListener("pointermove", e => { if (dragging) seekTo(e.clientX); });
    seek.addEventListener("pointerup", () => { dragging = false; });
    seek.addEventListener("keydown", e => {
      if (e.key === "ArrowRight") { e.preventDefault(); video.currentTime += 5; }
      if (e.key === "ArrowLeft") { e.preventDefault(); video.currentTime -= 5; }
    });

    // Volume
    $("#c-mute").addEventListener("click", () => { video.muted = !video.muted; });
    $("#c-vol").addEventListener("input", e => {
      video.volume = Number(e.target.value);
      video.muted = video.volume === 0;
    });

    // Speed / quality popovers
    const popBtn = (btnId, popId) => {
      $(btnId).addEventListener("click", e => {
        e.stopPropagation();
        const pop = $(popId);
        const wasOpen = pop.classList.contains("open");
        closePops();
        if (!wasOpen) pop.classList.add("open");
      });
    };
    popBtn("#c-speed", "#pop-speed");
    popBtn("#c-quality", "#pop-quality");
    $("#pop-speed").addEventListener("click", e => {
      const item = e.target.closest("[data-speed]");
      if (!item) return;
      video.playbackRate = Number(item.dataset.speed);
      $("#pop-speed").querySelectorAll(".pop-item").forEach(p => p.classList.toggle("active", p === item));
      UI.toast(`Tốc độ phát: ${item.textContent.trim()}`, "info");
      closePops();
    });
    $("#pop-quality").addEventListener("click", e => {
      const item = e.target.closest("[data-quality]");
      if (!item) return;
      // Demo: một nguồn video duy nhất, giữ nguyên thời điểm khi "đổi chất lượng"
      const t = video.currentTime, playing = !video.paused;
      $("#pop-quality").querySelectorAll(".pop-item").forEach(p => p.classList.toggle("active", p === item));
      video.addEventListener("loadedmetadata", () => { video.currentTime = t; if (playing) video.play().catch(() => {}); }, { once: true });
      video.src = movie.videoUrl;
      UI.toast(`Chất lượng: ${item.dataset.quality}`, "success");
      closePops();
    });
    document.addEventListener("click", closePops);

    // Theater
    $("#c-theater").addEventListener("click", () => {
      const layout = document.querySelector(".watch-layout");
      layout?.classList.toggle("theater");
      $("#c-theater").classList.toggle("active");
    });

    // PiP
    $("#c-pip").addEventListener("click", async () => {
      try {
        if (document.pictureInPictureElement) await document.exitPictureInPicture();
        else if (document.pictureInPictureEnabled) await video.requestPictureInPicture();
        else UI.toast("Trình duyệt không hỗ trợ hình trong hình", "error");
      } catch { UI.toast("Không thể bật hình trong hình", "error"); }
    });

    // Fullscreen
    $("#c-full").addEventListener("click", () => {
      if (document.fullscreenElement) document.exitFullscreen();
      else shell.requestFullscreen?.().catch(() => UI.toast("Không thể bật toàn màn hình", "error"));
    });
    document.addEventListener("fullscreenchange", () => {
      $("#c-full").innerHTML = `<i class="fa-solid ${document.fullscreenElement ? "fa-compress" : "fa-expand"}"></i>`;
    });

    // Auto-hide UI
    shell.addEventListener("pointermove", showUI);
    shell.addEventListener("pointerleave", () => { if (!video.paused) shell.classList.add("hide-ui"); });

    // Keyboard shortcuts
    document.addEventListener("keydown", e => {
      if (e.target.matches("input, textarea, select")) return;
      switch (e.key.toLowerCase()) {
        case " ": case "k": e.preventDefault(); togglePlay(); showUI(); break;
        case "arrowright": video.currentTime += 10; showUI(); break;
        case "arrowleft": video.currentTime -= 10; showUI(); break;
        case "arrowup": e.preventDefault(); video.volume = Math.min(1, video.volume + 0.1); video.muted = false; break;
        case "arrowdown": e.preventDefault(); video.volume = Math.max(0, video.volume - 0.1); break;
        case "m": video.muted = !video.muted; break;
        case "f": $("#c-full").click(); break;
        case "t": $("#c-theater").click(); break;
        case "n": if (season != null) nextEpisode(true); break;
      }
    });

    // Episodes
    $("#season-tabs")?.addEventListener("click", e => {
      const tab = e.target.closest("[data-season]");
      if (tab) gotoEpisode(Number(tab.dataset.season), 1, false);
    });
    $("#ep-grid")?.addEventListener("click", e => {
      const btn = e.target.closest("[data-ep]");
      if (btn) gotoEpisode(season, Number(btn.dataset.ep), true);
    });
    $("#ep-prev")?.addEventListener("click", () => { if (!prevEpisode()) UI.toast("Đây là tập đầu tiên", "info"); });
    $("#ep-next")?.addEventListener("click", () => { if (!nextEpisode(true)) UI.toast("Đây là tập cuối cùng", "info"); });
  }

  /* ---------- Init ---------- */
  function init() {
    const mount = document.getElementById("watch-mount");
    if (!mount) return;
    const params = new URLSearchParams(location.search);
    movie = MovieDB.byId(params.get("id"));
    if (!movie) {
      mount.innerHTML = `
      <div class="empty-state" style="padding-top:8rem">
        <div class="empty-ico"><i class="fa-solid fa-film"></i></div>
        <h3>Không tìm thấy phim</h3>
        <p>Phim bạn muốn xem không tồn tại.</p>
        <a class="btn btn-primary" href="index.html">Về trang chủ</a>
      </div>`;
      return;
    }
    if (movie.type === "series" && movie.seasons?.length) {
      season = Number(params.get("s")) || movie.seasons[0].season;
      episode = Number(params.get("ep")) || 1;
      if (!movie.seasons.find(x => x.season === season)) season = movie.seasons[0].season;
      const sd = movie.seasons.find(x => x.season === season);
      if (episode < 1 || episode > sd.episodes) episode = 1;
    }

    mount.innerHTML = `
    <div class="watch-layout">
      <div class="watch-main">
        <div class="player-shell" id="player-shell">${playerHTML()}</div>
        ${episodePanelHTML()}
        <div class="watch-info container" style="padding-left:0;padding-right:0">
          <h1 class="section-title" style="font-size:1.6rem;margin:1.4rem 0 .5rem">${Render.esc(movie.title)}</h1>
          <div class="hero-meta" style="margin-bottom:.8rem">
            <span class="rating-badge"><i class="fa-solid fa-star"></i> ${movie.rating.toFixed(1)}</span>
            <span>${movie.year}</span><span class="dot"></span>
            <span>${countryVi(movie.country)}</span><span class="dot"></span>
            <span>${movie.genres.map(genreVi).join(", ")}</span>
          </div>
          <p class="detail-desc" style="max-width:900px">${Render.esc(movie.description)}</p>
        </div>
        <div id="watch-related"></div>
      </div>
    </div>`;

    shell = $("#player-shell");
    video = $("#cv-video");
    if (movie.type === "series") renderEpGrid();
    bind();
    loadSource(true);
    updateVolumeIcon();
    updatePlayIcons();

    // Phim liên quan
    const related = MovieDB.all()
      .filter(m => m.id !== movie.id && m.genres.some(g => movie.genres.includes(g)))
      .slice(0, 10);
    document.getElementById("watch-related").innerHTML =
      Render.railSection({ id: "sec-watch-related", title: "Xem tiếp theo", movies: related });
    initRails(mount);
    UI.observeReveals(mount);
    UI.bindLazyImages(mount);
  }

  return { init };
})();

document.addEventListener("DOMContentLoaded", () => {
  if (document.body.dataset.page === "watch") Player.init();
});
