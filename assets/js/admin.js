/* ============================================================
   CINEVA — Admin Panel (admin.html)
   Dashboard, quản lý phim (CRUD qua MovieDB + localStorage),
   người dùng (demo), cài đặt.
   ============================================================ */
"use strict";

const Admin = (() => {
  let currentTab = "dashboard";
  let tableState = { q: "", type: "", sort: "id" };
  let editingId = null;

  const $ = sel => document.querySelector(sel);
  const esc = Render.esc;

  /* ============ DASHBOARD ============ */
  function dashboardHTML() {
    const all = MovieDB.all();
    const movies = all.filter(m => m.type === "movie").length;
    const series = all.filter(m => m.type === "series").length;
    const avg = (all.reduce((s, m) => s + m.rating, 0) / all.length).toFixed(1);
    // Đếm theo thể loại
    const genreCount = {};
    all.forEach(m => m.genres.forEach(g => genreCount[g] = (genreCount[g] || 0) + 1));
    const topGenres = Object.entries(genreCount).sort((a, b) => b[1] - a[1]).slice(0, 8);
    const max = topGenres[0]?.[1] || 1;
    const recent = [...all].sort((a, b) => b.id - a.id).slice(0, 6);

    return `
    <div class="stat-cards reveal-stagger in-view">
      <div class="stat-card"><div class="s-ico" style="background:rgba(226,53,79,.15);color:var(--crimson)"><i class="fa-solid fa-film"></i></div><div><div class="s-num">${all.length}</div><div class="s-label">Tổng số phim</div></div></div>
      <div class="stat-card"><div class="s-ico" style="background:rgba(139,92,246,.15);color:var(--purple)"><i class="fa-solid fa-clapperboard"></i></div><div><div class="s-num">${movies}</div><div class="s-label">Phim lẻ</div></div></div>
      <div class="stat-card"><div class="s-ico" style="background:rgba(34,211,238,.15);color:var(--cyan)"><i class="fa-solid fa-tv"></i></div><div><div class="s-num">${series}</div><div class="s-label">Phim bộ</div></div></div>
      <div class="stat-card"><div class="s-ico" style="background:rgba(245,197,66,.15);color:var(--gold)"><i class="fa-solid fa-star"></i></div><div><div class="s-num">${avg}</div><div class="s-label">Điểm trung bình</div></div></div>
    </div>
    <div class="form-grid" style="margin-top:1.5rem;align-items:start">
      <div class="panel-card">
        <h3 style="margin-bottom:1.2rem">Phim theo thể loại</h3>
        <div class="chart-bars">
          ${topGenres.map(([g, n]) => `
          <div class="chart-bar-row">
            <span class="c-label">${genreVi(g)}</span>
            <div class="c-track"><span class="c-fill" style="width:${(n / max * 100).toFixed(0)}%"></span></div>
            <span class="c-num">${n}</span>
          </div>`).join("")}
        </div>
      </div>
      <div class="panel-card">
        <h3 style="margin-bottom:1.2rem">Mới thêm gần đây</h3>
        <div style="display:flex;flex-direction:column;gap:.8rem">
          ${recent.map(m => `
          <div style="display:flex;align-items:center;gap:.8rem">
            <img class="t-poster" src="${Art.poster(m)}" alt="" width="40" height="58">
            <div style="flex:1;min-width:0">
              <div style="font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(m.title)}</div>
              <div style="font-size:.8rem;color:var(--text-3)">${m.year} · ${genreVi(m.genres[0])}</div>
            </div>
            <span class="admin-badge ${m.type}">${m.type === "series" ? "Bộ" : "Lẻ"}</span>
          </div>`).join("")}
        </div>
      </div>
    </div>`;
  }

  /* ============ MOVIES TABLE ============ */
  function filteredMovies() {
    let list = MovieDB.all();
    if (tableState.q) {
      const q = tableState.q.toLowerCase();
      list = list.filter(m => m.title.toLowerCase().includes(q) || String(m.year).includes(q));
    }
    if (tableState.type) list = list.filter(m => m.type === tableState.type);
    if (tableState.sort === "title") list = [...list].sort((a, b) => a.title.localeCompare(b.title, "vi"));
    else if (tableState.sort === "year") list = [...list].sort((a, b) => b.year - a.year);
    else if (tableState.sort === "rating") list = [...list].sort((a, b) => b.rating - a.rating);
    else list = [...list].sort((a, b) => a.id - b.id);
    return list;
  }

  function moviesHTML() {
    return `
    <div class="panel-card" style="margin-bottom:1.2rem">
      <div class="filter-row" style="align-items:center">
        <input class="form-control" id="a-search" type="search" placeholder="Tìm theo tên, năm..." value="${esc(tableState.q)}" style="max-width:280px">
        <select class="form-control" id="a-type" style="max-width:160px">
          <option value="">Tất cả loại</option>
          <option value="movie" ${tableState.type === "movie" ? "selected" : ""}>Phim lẻ</option>
          <option value="series" ${tableState.type === "series" ? "selected" : ""}>Phim bộ</option>
        </select>
        <select class="form-control" id="a-sort" style="max-width:180px">
          <option value="id" ${tableState.sort === "id" ? "selected" : ""}>Sắp xếp: ID</option>
          <option value="title" ${tableState.sort === "title" ? "selected" : ""}>Tên A-Z</option>
          <option value="year" ${tableState.sort === "year" ? "selected" : ""}>Năm mới nhất</option>
          <option value="rating" ${tableState.sort === "rating" ? "selected" : ""}>Điểm cao nhất</option>
        </select>
        <div class="controls-spacer" style="flex:1"></div>
        <button class="btn btn-primary" id="a-add"><i class="fa-solid fa-plus"></i> Thêm phim</button>
      </div>
    </div>
    <div class="admin-table-wrap panel-card" style="padding:0;overflow-x:auto">
      <table class="admin-table">
        <thead><tr>
          <th>ID</th><th>Phim</th><th>Năm</th><th>Loại</th><th>Điểm</th><th>Thể loại</th><th style="text-align:right">Thao tác</th>
        </tr></thead>
        <tbody id="a-tbody"></tbody>
      </table>
    </div>`;
  }

  function renderTableRows() {
    const tbody = $("#a-tbody");
    if (!tbody) return;
    const list = filteredMovies();
    tbody.innerHTML = list.length ? list.map(m => `
      <tr>
        <td>${m.id}</td>
        <td>
          <div style="display:flex;align-items:center;gap:.7rem">
            <img class="t-poster" src="${Art.poster(m)}" alt="" width="36" height="52">
            <div>
              <div style="font-weight:600">${esc(m.title)}</div>
              <div style="font-size:.78rem;color:var(--text-3)">${esc(m.originalTitle || "")}</div>
            </div>
          </div>
        </td>
        <td>${m.year}</td>
        <td><span class="admin-badge ${m.type}">${m.type === "series" ? "Phim bộ" : "Phim lẻ"}</span></td>
        <td><i class="fa-solid fa-star" style="color:var(--gold)"></i> ${m.rating.toFixed(1)}</td>
        <td style="max-width:180px">${m.genres.slice(0, 3).map(genreVi).join(", ")}</td>
        <td style="text-align:right;white-space:nowrap">
          <button class="btn btn-icon" data-edit="${m.id}" aria-label="Sửa ${esc(m.title)}"><i class="fa-solid fa-pen"></i></button>
          <button class="btn btn-icon" data-del="${m.id}" aria-label="Xóa ${esc(m.title)}" style="color:var(--crimson)"><i class="fa-solid fa-trash-can"></i></button>
        </td>
      </tr>`).join("")
      : `<tr><td colspan="7" style="text-align:center;padding:2.5rem;color:var(--text-3)">Không có phim phù hợp</td></tr>`;
  }

  /* ============ MOVIE FORM ============ */
  function formHTML(m = null) {
    const genres = ["Action", "Adventure", "Animation", "Comedy", "Crime", "Drama", "Family", "Fantasy", "Horror", "Mystery", "Romance", "Sci-Fi", "Thriller"];
    const isSeries = m?.type === "series";
    return `
    <div class="panel-card">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1.5rem">
        <h3>${m ? `Sửa phim: ${esc(m.title)}` : "Thêm phim mới"}</h3>
        <button class="btn btn-glass" id="a-form-back"><i class="fa-solid fa-arrow-left"></i> Quay lại</button>
      </div>
      <form id="a-form" novalidate>
        <div class="form-grid">
          <div class="form-group"><label for="af-title">Tên phim *</label><input class="form-control" id="af-title" required value="${esc(m?.title || "")}"><span class="field-error">Vui lòng nhập tên phim</span></div>
          <div class="form-group"><label for="af-original">Tên gốc</label><input class="form-control" id="af-original" value="${esc(m?.originalTitle || "")}"></div>
          <div class="form-group"><label for="af-year">Năm *</label><input class="form-control" id="af-year" type="number" min="1900" max="2100" required value="${m?.year || 2026}"><span class="field-error">Năm không hợp lệ</span></div>
          <div class="form-group"><label for="af-rating">Điểm (0-10) *</label><input class="form-control" id="af-rating" type="number" min="0" max="10" step="0.1" required value="${m?.rating ?? 8.0}"><span class="field-error">Điểm từ 0 đến 10</span></div>
          <div class="form-group"><label for="af-duration">Thời lượng</label><input class="form-control" id="af-duration" placeholder="VD: 120 phút" value="${esc(m?.duration || "")}"></div>
          <div class="form-group"><label for="af-country">Quốc gia</label>
            <select class="form-control" id="af-country">
              ${["Vietnam", "USA", "Korea", "Japan", "UK", "France", "Norway"].map(c =>
                `<option value="${c}" ${m?.country === c ? "selected" : ""}>${countryVi(c)}</option>`).join("")}
            </select>
          </div>
          <div class="form-group"><label for="af-type">Loại</label>
            <select class="form-control" id="af-type">
              <option value="movie" ${!isSeries ? "selected" : ""}>Phim lẻ</option>
              <option value="series" ${isSeries ? "selected" : ""}>Phim bộ</option>
            </select>
          </div>
          <div class="form-group full"><label>Poster</label>
            <div class="poster-source" id="poster-source">
              <div class="poster-preview" id="poster-preview">
                <img id="poster-img" src="${m?.poster && !m.poster.startsWith('assets/') ? m.poster : Art.poster(m || { id: Date.now(), title: 'Chưa có ảnh', year: new Date().getFullYear(), palette: 0 })}" alt="Poster" width="200" height="300">
                <div class="poster-actions">
                  <button type="button" class="btn btn-sm btn-glass" id="a-capture-frame" style="display:none"><i class="fa-solid fa-camera"></i> Lấy ảnh từ video</button>
                  <button type="button" class="btn btn-sm btn-glass" id="a-remove-poster" style="display:none"><i class="fa-solid fa-trash"></i></button>
                </div>
              </div>
              <div class="poster-hint" id="poster-hint">Khi tải video lên, ảnh sẽ tự động được chụp từ video.</div>
            </div>
          </div>
          <div class="form-group"><label for="af-quality">Chất lượng (phẩy)</label><input class="form-control" id="af-quality" placeholder="4K, HD" value="${esc((m?.quality || ["HD"]).join(", "))}"></div>
          <div class="form-group full"><label>Thể loại *</label>
            <div class="hero-genres" id="af-genres" style="margin:0">
              ${genres.map(g => `<button type="button" class="genre-chip ${m?.genres?.includes(g) ? "active" : ""}" data-g="${g}">${genreVi(g)}</button>`).join("")}
            </div>
            <span class="field-error" id="af-genres-err" style="display:none">Chọn ít nhất 1 thể loại</span>
          </div>
          <div class="form-group full"><label for="af-desc">Mô tả *</label><textarea class="form-control" id="af-desc" rows="4" required>${esc(m?.description || "")}</textarea><span class="field-error">Vui lòng nhập mô tả</span></div>
          <div class="form-group"><label for="af-director">Đạo diễn</label><input class="form-control" id="af-director" value="${esc(m?.director || "")}"></div>
          <div class="form-group"><label for="af-cast">Diễn viên (phẩy)</label><input class="form-control" id="af-cast" value="${esc((m?.cast || []).join(", "))}"></div>
          <div class="form-group full">
            <label>Nguồn Video *</label>
            <div class="video-source-tabs">
              <button type="button" class="video-source-tab ${m?.videoUrl?.startsWith('local://') ? '' : 'active'}" data-vsrc="url"><i class="fa-solid fa-link"></i> URL</button>
              <button type="button" class="video-source-tab ${m?.videoUrl?.startsWith('local://') ? 'active' : ''}" data-vsrc="upload"><i class="fa-solid fa-upload"></i> Tải lên</button>
            </div>
            <div id="vs-url" style="${m?.videoUrl?.startsWith('local://') ? 'display:none' : ''}">
              <input class="form-control" id="af-video" type="url" required value="${esc(m?.videoUrl && !m.videoUrl.startsWith('local://') ? m.videoUrl : '')}" placeholder="https://...">
              <span class="field-error">Vui lòng nhập URL video hợp lệ</span>
            </div>
            <div id="vs-upload" style="${m?.videoUrl?.startsWith('local://') ? '' : 'display:none'}">
              <div class="upload-zone" id="upload-zone">
                <i class="fa-solid fa-cloud-arrow-up upload-ico"></i>
                <div class="upload-title">Kéo thả file video vào đây</div>
                <div class="upload-hint">Hỗ trợ MP4, WebM, MKV, MOV. Tối đa 2GB.</div>
                <input type="file" id="af-file" accept="video/mp4,video/webm,video/x-matroska,video/quicktime,.mkv,.mov">
              </div>
              <div class="upload-preview" id="upload-preview">
                <div class="up-thumb"><i class="fa-solid fa-film"></i></div>
                <div class="up-info">
                  <div class="up-name" id="up-name"></div>
                  <div class="up-size" id="up-size"></div>
                </div>
                <button type="button" class="up-remove" id="up-remove" title="Xóa file"><i class="fa-solid fa-xmark"></i></button>
              </div>
              <div class="upload-progress" id="upload-progress">
                <div class="up-bar" id="up-bar"></div>
              </div>
              <span class="field-error" id="af-file-err">Vui lòng chọn file video</span>
            </div>
          </div>
          <div class="form-group full"><label for="af-trailer">URL Trailer</label><input class="form-control" id="af-trailer" type="url" value="${esc(m?.trailerUrl || "")}"></div>
          <div class="form-group" id="af-seasons-wrap" style="${isSeries ? "" : "display:none"}">
            <label for="af-seasons">Số tập mỗi mùa (phẩy)</label>
            <input class="form-control" id="af-seasons" placeholder="VD: 8, 6" value="${esc((m?.seasons || []).map(s => s.episodes).join(", "))}">
          </div>
          <div class="form-group" style="display:flex;flex-direction:row;gap:1.5rem;align-items:center;padding-top:1.6rem">
            <label class="checkbox-wrap" style="margin:0"><input type="checkbox" id="af-featured" ${m?.featured ? "checked" : ""}> Nổi bật</label>
            <label class="checkbox-wrap" style="margin:0"><input type="checkbox" id="af-new" ${m?.isNew ? "checked" : ""}> Phim mới</label>
          </div>
        </div>
        <div style="display:flex;gap:.8rem;margin-top:1.6rem">
          <button class="btn btn-primary btn-lg" type="submit"><i class="fa-solid fa-floppy-disk"></i> ${m ? "Cập nhật" : "Thêm phim"}</button>
          <button class="btn btn-glass btn-lg" type="button" id="a-form-cancel">Hủy</button>
        </div>
      </form>
    </div>`;
  }

  function bindForm() {
    const currentMovie = editingId != null ? MovieDB.byId(editingId) : null;
    let videoSource = currentMovie?.videoUrl?.startsWith("local://") ? "upload" : "url";
    let uploadedFile = null;
    let capturedPoster = null; // Blob/dataURL của poster chụp từ video

    // Hiển thị nút chụp ảnh nếu đang ở tab upload
    const toggleCaptureBtn = () => {
      const btn = $("#a-capture-frame");
      if (btn) btn.style.display = (videoSource === "upload" && uploadedFile) ? "" : "none";
    };
    const toggleRemoveBtn = () => {
      const btn = $("#a-remove-poster");
      if (btn) btn.style.display = capturedPoster ? "" : "none";
    };
    toggleCaptureBtn();
    toggleRemoveBtn();

    // Genre chips
    $("#af-genres").addEventListener("click", e => {
      const chip = e.target.closest("[data-g]");
      if (chip) chip.classList.toggle("active");
    });

    // Video source tabs
    const srcTabs = document.querySelectorAll(".video-source-tab");
    if (srcTabs.length) {
      // Set initial active tab
      srcTabs.forEach(t => t.classList.toggle("active", t.dataset.vsrc === videoSource));
      $("#vs-url").style.display = videoSource === "url" ? "" : "none";
      $("#vs-upload").style.display = videoSource === "upload" ? "" : "none";

      srcTabs.forEach(tab => {
        tab.addEventListener("click", () => {
          videoSource = tab.dataset.vsrc;
          srcTabs.forEach(t => t.classList.remove("active"));
          tab.classList.add("active");
          $("#vs-url").style.display = videoSource === "url" ? "" : "none";
          $("#vs-upload").style.display = videoSource === "upload" ? "" : "none";
          toggleCaptureBtn();
        });
      });
    }

    // Upload zone: drag & drop
    const zone = $("#upload-zone");
    const fileInput = $("#af-file");
    if (zone && fileInput) {
      ["dragenter", "dragover"].forEach(ev => zone.addEventListener(ev, e => {
        e.preventDefault();
        zone.classList.add("drag-over");
      }));
      ["dragleave", "drop"].forEach(ev => zone.addEventListener(ev, e => {
        e.preventDefault();
        zone.classList.remove("drag-over");
      }));
      zone.addEventListener("drop", e => {
        const files = e.dataTransfer.files;
        if (files.length) handleFile(files[0]);
      });
      fileInput.addEventListener("change", () => {
        if (fileInput.files.length) handleFile(fileInput.files[0]);
      });
    }

    function handleFile(file) {
      const maxSize = 2 * 1024 * 1024 * 1024; // 2GB
      const allowed = ["video/mp4", "video/webm", "video/x-matroska", "video/quicktime"];
      const ext = file.name.split(".").pop().toLowerCase();
      const allowedExt = ["mp4", "webm", "mkv", "mov"];
      if (!allowed.includes(file.type) && !allowedExt.includes(ext)) {
        UI.toast("Định dạng không hỗ trợ. Chỉ chấp nhận MP4, WebM, MKV, MOV.", "error");
        return;
      }
      if (file.size > maxSize) {
        UI.toast("File quá lớn. Tối đa 2GB.", "error");
        return;
      }
      uploadedFile = file;
      $("#up-name").textContent = file.name;
      $("#up-size").textContent = formatSize(file.size);
      $("#upload-preview").classList.add("visible");
      $("#af-file-err").style.display = "none";
      toggleCaptureBtn();

      // Tự động chụp ảnh từ video
      captureFrameFromVideo(file);
    }

    async function captureFrameFromVideo(file) {
      try {
        const posterBlob = await VideoStore.captureFrame(file);
        const url = URL.createObjectURL(posterBlob);
        setPoster(url, posterBlob);
        $("#poster-hint").textContent = "Đã chụp ảnh tự động từ video. Nhấn nút bên dưới để chụp lại.";
      } catch (err) {
        console.warn("Không thể chụp ảnh tự động:", err);
        $("#poster-hint").textContent = "Nhấn nút bên dưới để chụp ảnh từ video.";
      }
    }

    function setPoster(url, blob) {
      capturedPoster = { url, blob };
      const img = $("#poster-img");
      if (img) img.src = url;
      toggleRemoveBtn();
    }

    function formatSize(bytes) {
      if (bytes < 1024) return bytes + " B";
      if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
      if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + " MB";
      return (bytes / 1073741824).toFixed(2) + " GB";
    }

    $("#up-remove")?.addEventListener("click", () => {
      uploadedFile = null;
      capturedPoster = null;
      $("#upload-preview").classList.remove("visible");
      fileInput.value = "";
      toggleCaptureBtn();
      toggleRemoveBtn();
      // Reset poster về SVG mặc định
      const img = $("#poster-img");
      if (img) img.src = Art.poster({ id: Date.now(), title: "Chưa có ảnh", year: new Date().getFullYear(), palette: 0 });
      $("#poster-hint").textContent = "Khi tải video lên, ảnh sẽ tự động được chụp từ video.";
    });
    // Nút chụp ảnh từ video
    $("#a-capture-frame")?.addEventListener("click", async () => {
      if (!uploadedFile) { UI.toast("Vui lòng chọn file video trước", "error"); return; }
      const btn = $("#a-capture-frame");
      btn.disabled = true;
      btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang chụp...';
      try {
        await captureFrameFromVideo(uploadedFile);
        UI.toast("Đã chụp ảnh từ video!", "success");
      } catch (err) {
        UI.toast("Không thể chụp ảnh. Vui lòng thử lại.", "error");
      } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-camera"></i> Lấy ảnh từ video';
      }
    });
    // Nút xóa poster
    $("#a-remove-poster")?.addEventListener("click", () => {
      if (capturedPoster?.url) URL.revokeObjectURL(capturedPoster.url);
      capturedPoster = null;
      toggleRemoveBtn();
      const img = $("#poster-img");
      if (img) img.src = Art.poster({ id: Date.now(), title: "Chưa có ảnh", year: new Date().getFullYear(), palette: 0 });
      $("#poster-hint").textContent = "Nhấn nút bên dưới để chụp ảnh từ video.";
    });
    $("#af-type").addEventListener("change", e => {
      $("#af-seasons-wrap").style.display = e.target.value === "series" ? "" : "none";
    });
    const back = () => { editingId = null; renderTab("movies"); };
    $("#a-form-back").addEventListener("click", back);
    $("#a-form-cancel").addEventListener("click", back);

    function blobToDataURL(blob) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    }

    $("#a-form").addEventListener("submit", async e => {
      e.preventDefault();
      let valid = true;
      const req = (id, test) => {
        const el = $(id), group = el.closest(".form-group");
        const ok = test(el.value.trim());
        group.classList.toggle("invalid", !ok);
        if (!ok) valid = false;
        return el.value.trim();
      };
      const title = req("#af-title", v => v.length > 0);
      const year = Number(req("#af-year", v => v >= 1900 && v <= 2100));
      const rating = Number(req("#af-rating", v => v !== "" && v >= 0 && v <= 10));
      const description = req("#af-desc", v => v.length > 0);

      // Validate video source
      let videoUrl = "";
      let videoLocalKey = "";
      if (videoSource === "url") {
        videoUrl = req("#af-video", v => /^https?:\/\/.+/.test(v));
      } else {
        if (!uploadedFile && !(editingId != null && currentMovie?.videoUrl?.startsWith("local://"))) {
          $("#af-file-err").style.display = "block";
          valid = false;
        } else {
          $("#af-file-err").style.display = "none";
        }
      }

      const genres = [...document.querySelectorAll("#af-genres .genre-chip.active")].map(c => c.dataset.g);
      $("#af-genres-err").style.display = genres.length ? "none" : "block";
      if (!genres.length) valid = false;
      if (!valid) { UI.toast("Vui lòng kiểm tra lại các trường bị lỗi", "error"); return; }

      const type = $("#af-type").value;
      const payload = {
        title, year, rating, description, genres, type,
        originalTitle: $("#af-original").value.trim() || title,
        duration: $("#af-duration").value.trim() || (type === "series" ? "45 phút/tập" : "110 phút"),
        country: $("#af-country").value,
        quality: $("#af-quality").value.split(",").map(s => s.trim()).filter(Boolean),
        trailerUrl: $("#af-trailer").value.trim(),
        director: $("#af-director").value.trim(),
        cast: $("#af-cast").value.split(",").map(s => s.trim()).filter(Boolean),
        featured: $("#af-featured").checked,
        isNew: $("#af-new").checked
      };
      if (!payload.quality.length) payload.quality = ["HD"];

      // Handle upload
      if (videoSource === "upload" && uploadedFile) {
        const progressBar = $("#up-bar");
        const progressWrap = $("#upload-progress");
        progressWrap.classList.add("visible");
        progressBar.style.width = "0%";
        try {
          // Simulate progress (IndexedDB writes are fast, but we show visual feedback)
          let progress = 0;
          const progressInterval = setInterval(() => {
            progress = Math.min(progress + Math.random() * 25, 85);
            progressBar.style.width = progress + "%";
          }, 200);
          // Store in IndexedDB
          videoLocalKey = "vid_" + Date.now();
          await VideoStore.put(videoLocalKey, uploadedFile);
          clearInterval(progressInterval);
          progressBar.style.width = "100%";
          await new Promise(r => setTimeout(r, 300));
          UI.toast("Đã tải video lên thành công!", "success");
        } catch (err) {
          console.error("Lỗi lưu video:", err);
          UI.toast("Lỗi khi lưu video. Vui lòng thử lại.", "error");
          progressWrap.classList.remove("visible");
          return;
        }
        progressWrap.classList.remove("visible");
        videoUrl = "local://" + videoLocalKey;
      } else if (videoSource === "upload" && editingId != null && currentMovie?.videoUrl?.startsWith("local://")) {
        videoUrl = currentMovie.videoUrl; // Keep existing local video
      }

      payload.videoUrl = videoUrl;

      // Lưu poster nếu có chụp từ video
      if (capturedPoster?.blob) {
        try {
          payload.poster = await blobToDataURL(capturedPoster.blob);
          payload.palette = undefined; // Không dùng palette SVG nữa
        } catch (err) {
          console.warn("Không thể lưu poster:", err);
        }
      } else if (editingId != null && currentMovie?.poster && !currentMovie.poster.startsWith("assets/")) {
        payload.poster = currentMovie.poster; // Giữ poster cũ
      }

      if (type === "series") {
        const eps = $("#af-seasons").value.split(",").map(s => Number(s.trim())).filter(n => n > 0);
        payload.seasons = (eps.length ? eps : [8]).map((n, i) => ({ season: i + 1, episodes: n }));
      } else {
        payload.seasons = undefined;
      }

      if (editingId != null) {
        MovieDB.update(editingId, payload);
        UI.toast(`Đã cập nhật "${title}"`, "success");
      } else {
        MovieDB.add(payload);
        UI.toast(`Đã thêm phim "${title}"`, "success");
      }
      editingId = null;
      renderTab("movies");
    });
  }

  /* ============ USERS (demo) ============ */
  function usersHTML() {
    const users = [
      { name: "Minh Anh", email: "minhanh@cineva.demo", role: "Admin", joined: "01/2025", active: true },
      { name: "Quốc Bảo", email: "qbao@cineva.demo", role: "Thành viên", joined: "03/2025", active: true },
      { name: "Thu Hà", email: "thuha@cineva.demo", role: "Thành viên", joined: "05/2025", active: true },
      { name: "Đức Long", email: "dlong@cineva.demo", role: "Thành viên", joined: "07/2025", active: false },
      { name: "Lan Phương", email: "lphuong@cineva.demo", role: "Kiểm duyệt", joined: "09/2025", active: true }
    ];
    return `
    <div class="admin-table-wrap panel-card" style="padding:0;overflow-x:auto">
      <table class="admin-table">
        <thead><tr><th>Người dùng</th><th>Email</th><th>Vai trò</th><th>Tham gia</th><th>Trạng thái</th></tr></thead>
        <tbody>
          ${users.map(u => `
          <tr>
            <td><div style="display:flex;align-items:center;gap:.7rem">
              <span class="avatar-btn" style="width:34px;height:34px;font-size:.85rem">${esc(u.name.charAt(0))}</span>
              <strong>${esc(u.name)}</strong>
            </div></td>
            <td>${esc(u.email)}</td>
            <td>${esc(u.role)}</td>
            <td>${u.joined}</td>
            <td><span class="admin-badge ${u.active ? "movie" : "series"}">${u.active ? "Hoạt động" : "Tạm khóa"}</span></td>
          </tr>`).join("")}
        </tbody>
      </table>
    </div>
    <p style="margin-top:1rem;color:var(--text-3);font-size:.85rem"><i class="fa-solid fa-circle-info"></i> Dữ liệu người dùng chỉ mang tính minh họa (demo).</p>`;
  }

  /* ============ SETTINGS ============ */
  function settingsHTML() {
    const movieCount = MovieDB.all().length;
    return `
    <div class="panel-card" style="max-width:640px">
      <h3 style="margin-bottom:1.2rem">Cài đặt hệ thống</h3>
      <div class="settings-list">
        <div class="setting-row">
          <div><strong>Giao diện tối</strong><p>Chuyển đổi giữa giao diện tối và sáng.</p></div>
          <button class="switch" data-theme-switch role="switch" aria-checked="${Theme.get() === "light" ? "true" : "false"}" aria-label="Giao diện sáng"><span class="knob"></span></button>
        </div>
        <div class="setting-row">
          <div><strong>Xuất dữ liệu phim</strong><p>Tải danh sách phim hiện tại dưới dạng JSON.</p></div>
          <button class="btn btn-glass" id="a-export"><i class="fa-solid fa-download"></i> Xuất JSON</button>
        </div>
        <div class="setting-row">
          <div><strong>Xóa toàn bộ phim</strong><p>Xóa tất cả ${movieCount} phim khỏi hệ thống. Hành động này không thể hoàn tác.</p></div>
          <button class="btn btn-glass" id="a-delete-all" style="color:var(--crimson)"><i class="fa-solid fa-trash"></i> Xóa tất cả</button>
        </div>
        <div class="setting-row">
          <div><strong>Khôi phục dữ liệu gốc</strong><p>Xóa mọi chỉnh sửa phim và trở về dữ liệu mặc định.</p></div>
          <button class="btn btn-glass" id="a-reset" style="color:var(--crimson)"><i class="fa-solid fa-rotate-left"></i> Khôi phục</button>
        </div>
      </div>
    </div>`;
  }

  /* ============ TAB ROUTING ============ */
  function renderTab(tab) {
    currentTab = tab;
    document.querySelectorAll(".admin-nav-btn").forEach(b =>
      b.classList.toggle("active", b.dataset.tab === tab));
    const titles = { dashboard: "Tổng quan", movies: "Quản lý phim", form: editingId != null ? "Sửa phim" : "Thêm phim", users: "Người dùng", settings: "Cài đặt" };
    const titleEl = $("#admin-title");
    if (titleEl) titleEl.textContent = titles[tab] || "Quản trị";
    const main = $("#admin-content");

    if (tab === "dashboard") main.innerHTML = dashboardHTML();
    else if (tab === "movies") {
      main.innerHTML = moviesHTML();
      renderTableRows();
      $("#a-search").addEventListener("input", UI.debounce(e => { tableState.q = e.target.value; renderTableRows(); }, 200));
      $("#a-type").addEventListener("change", e => { tableState.type = e.target.value; renderTableRows(); });
      $("#a-sort").addEventListener("change", e => { tableState.sort = e.target.value; renderTableRows(); });
      $("#a-add").addEventListener("click", () => { editingId = null; renderTab("form"); });
      $("#a-tbody").addEventListener("click", e => {
        const edit = e.target.closest("[data-edit]");
        const del = e.target.closest("[data-del]");
        if (edit) { editingId = Number(edit.dataset.edit); renderTab("form"); }
        else if (del) {
          const m = MovieDB.byId(del.dataset.del);
          if (m && confirm(`Xóa phim "${m.title}"?`)) {
            // Clean up local video if exists
            if (m.videoUrl && m.videoUrl.startsWith("local://")) {
              const key = m.videoUrl.replace("local://", "");
              VideoStore.remove(key).catch(() => {});
            }
            MovieDB.remove(m.id);
            UI.toast(`Đã xóa "${m.title}"`, "info");
            renderTableRows();
          }
        }
      });
    }
    else if (tab === "form") {
      main.innerHTML = formHTML(editingId != null ? MovieDB.byId(editingId) : null);
      bindForm();
    }
    else if (tab === "users") main.innerHTML = usersHTML();
    else if (tab === "settings") {
      main.innerHTML = settingsHTML();
      $("#a-export").addEventListener("click", () => {
        const blob = new Blob([JSON.stringify({ movies: MovieDB.all() }, null, 2)], { type: "application/json" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "cineva-movies.json";
        a.click();
        URL.revokeObjectURL(a.href);
        UI.toast("Đã xuất dữ liệu phim", "success");
      });
      $("#a-reset").addEventListener("click", () => {
        if (!confirm("Khôi phục toàn bộ dữ liệu phim về mặc định? Mọi chỉnh sửa sẽ bị mất.")) return;
        MovieDB.reset();
        UI.toast("Đã khôi phục dữ liệu gốc", "success");
        renderTab("dashboard");
      });
      $("#a-delete-all")?.addEventListener("click", () => {
        const count = MovieDB.all().length;
        if (count === 0) { UI.toast("Không có phim nào để xóa.", "info"); return; }
        if (!confirm(`Bạn có chắc muốn xóa TOÀN BỘ ${count} phim? Hành động này không thể hoàn tác!`)) return;
        // Xóa video local nếu có
        const movies = MovieDB.all();
        movies.forEach(m => {
          if (m.videoUrl && m.videoUrl.startsWith("local://")) {
            const key = m.videoUrl.replace("local://", "");
            VideoStore.remove(key).catch(() => {});
          }
        });
        MovieDB.saveData([]);
        UI.toast(`Đã xóa toàn bộ ${count} phim`, "success");
        renderTab("dashboard");
      });
    }
  }

  function init() {
    if (!document.getElementById("admin-content")) return;
    // Hiển thị tên admin
    const adminUser = AdminAuth.user();
    const avatar = document.getElementById("admin-avatar");
    if (avatar && adminUser) avatar.textContent = adminUser.username.charAt(0).toUpperCase();
    // Nút đăng xuất
    document.getElementById("admin-logout")?.addEventListener("click", () => {
      AdminAuth.logout();
      location.href = "login.html";
    });
    document.querySelectorAll(".admin-nav-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        if (btn.dataset.tab) renderTab(btn.dataset.tab);
      });
    });
    renderTab("dashboard");
  }

  return { init };
})();

document.addEventListener("DOMContentLoaded", Admin.init);
