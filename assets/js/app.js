/* ============================================================
   CINEVA — App Core
   - Layout chung: header, drawer, bottom-nav, footer, boot screen
   - UI kit: toast, modal, ripple, magnetic, reveal, lazy image
   - Render: movie card, rail, grid
   - Page controllers: home, browse, movie detail, login, profile
   ============================================================ */
"use strict";

/* ============ UI KIT ============ */
const UI = (() => {
  /* ---- Toast ---- */
  function toast(message, type = "info") {
    let stack = document.querySelector(".toast-stack");
    if (!stack) {
      stack = document.createElement("div");
      stack.className = "toast-stack";
      stack.setAttribute("aria-live", "polite");
      document.body.appendChild(stack);
    }
    const icons = { success: "fa-circle-check", info: "fa-circle-info", error: "fa-circle-exclamation" };
    const el = document.createElement("div");
    el.className = `toast ${type}`;
    el.innerHTML = `<i class="fa-solid ${icons[type] || icons.info} t-ico"></i><span></span>`;
    el.querySelector("span").textContent = message;
    stack.appendChild(el);
    setTimeout(() => {
      el.classList.add("leaving");
      el.addEventListener("animationend", () => el.remove(), { once: true });
    }, 2800);
  }

  /* ---- Modal (trailer) ---- */
  function openTrailer(movie) {
    closeModal();
    const modal = document.createElement("div");
    modal.className = "modal open";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("aria-label", `Trailer ${movie.title}`);
    modal.innerHTML = `
      <div class="modal-backdrop" data-close></div>
      <div class="modal-box">
        <button class="btn btn-icon modal-close" data-close aria-label="Đóng"><i class="fa-solid fa-xmark"></i></button>
        <div class="trailer-frame">
          <video controls autoplay playsinline preload="metadata"></video>
        </div>
      </div>`;
    const video = modal.querySelector("video");
    if (movie.trailerUrl) {
      video.src = movie.trailerUrl;
    } else {
      modal.querySelector(".trailer-frame").innerHTML =
        `<div class="empty-state" style="padding:4rem 2rem"><h3>Chưa có trailer</h3><p>Trailer của phim này sẽ được cập nhật sớm.</p></div>`;
    }
    modal.addEventListener("click", e => { if (e.target.closest("[data-close]")) closeModal(); });
    document.addEventListener("keydown", escClose);
    document.body.appendChild(modal);
    document.body.style.overflow = "hidden";
  }
  function escClose(e) { if (e.key === "Escape") closeModal(); }
  function closeModal() {
    const m = document.querySelector(".modal");
    if (m) {
      const v = m.querySelector("video");
      if (v) { v.pause(); v.src = ""; }
      m.remove();
    }
    document.removeEventListener("keydown", escClose);
    document.body.style.overflow = "";
  }

  /* ---- Ripple ---- */
  function initRipple() {
    document.addEventListener("pointerdown", e => {
      const btn = e.target.closest(".btn");
      if (!btn) return;
      const rect = btn.getBoundingClientRect();
      const ink = document.createElement("span");
      const size = Math.max(rect.width, rect.height);
      ink.className = "ripple-ink";
      ink.style.width = ink.style.height = size + "px";
      ink.style.left = (e.clientX - rect.left - size / 2) + "px";
      ink.style.top = (e.clientY - rect.top - size / 2) + "px";
      btn.appendChild(ink);
      ink.addEventListener("animationend", () => ink.remove(), { once: true });
      // Haptic nhẹ trên thiết bị hỗ trợ
      if (navigator.vibrate) try { navigator.vibrate(8); } catch {}
    });
  }

  /* ---- Magnetic buttons (desktop, pointer fine) ---- */
  function initMagnetic() {
    if (!matchMedia("(hover:hover) and (pointer:fine)").matches) return;
    document.addEventListener("pointermove", e => {
      const el = e.target.closest(".magnetic");
      document.querySelectorAll(".magnetic").forEach(m => {
        if (m !== el) { m.style.setProperty("--mx", "0px"); m.style.setProperty("--my", "0px"); }
      });
      if (!el) return;
      const r = el.getBoundingClientRect();
      const dx = (e.clientX - r.left - r.width / 2) * 0.18;
      const dy = (e.clientY - r.top - r.height / 2) * 0.18;
      el.style.setProperty("--mx", dx.toFixed(1) + "px");
      el.style.setProperty("--my", dy.toFixed(1) + "px");
    });
  }

  /* ---- 3D tilt cho movie card (desktop) ---- */
  function initCardTilt() {
    if (!matchMedia("(hover:hover) and (pointer:fine)").matches) return;
    document.addEventListener("pointermove", e => {
      const card = e.target.closest(".movie-card");
      if (!card) return;
      const r = card.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width - 0.5) * 12;   // -6 → 6 deg
      const y = ((e.clientY - r.top) / r.height - 0.5) * -10;  // -5 → 5 deg
      card.style.transform = `translateY(-8px) perspective(900px) rotateY(${x.toFixed(2)}deg) rotateX(${y.toFixed(2)}deg)`;
    });
    document.addEventListener("pointerleave", e => {
      const card = e.target.closest && e.target.closest(".movie-card");
      if (card) card.style.transform = "";
    });
    // Reset khi rời card bằng cách track qua class :hover
    document.addEventListener("mouseout", e => {
      const card = e.target.closest && e.target.closest(".movie-card");
      const to = e.relatedTarget;
      if (card && (!to || !card.contains(to))) card.style.transform = "";
    });
  }

  /* ---- Parallax cho hero background theo scroll ---- */
  function initHeroParallax() {
    const hero = document.getElementById("hero");
    if (!hero) return;
    let ticking = false;
    const update = () => {
      const r = hero.getBoundingClientRect();
      if (r.bottom > 0 && r.top < window.innerHeight) {
        const offset = r.top * 0.18;
        const bg = hero.querySelector(".hero-bg");
        if (bg) bg.style.transform = `translate3d(0, ${offset.toFixed(1)}px, 0)`;
      }
      ticking = false;
    };
    window.addEventListener("scroll", () => {
      if (!ticking) { requestAnimationFrame(update); ticking = true; }
    }, { passive: true });
    update();
  }

  /* ---- Scroll reveal ---- */
  let revealObserver = null;
  function observeReveals(root = document) {
    if (!("IntersectionObserver" in window)) {
      root.querySelectorAll(".reveal, .reveal-stagger").forEach(el => el.classList.add("in-view"));
      return;
    }
    if (!revealObserver) {
      revealObserver = new IntersectionObserver(entries => {
        entries.forEach(en => {
          if (en.isIntersecting) {
            en.target.classList.add("in-view");
            revealObserver.unobserve(en.target);
          }
        });
      }, { rootMargin: "0px 0px -8% 0px", threshold: 0.05 });
    }
    root.querySelectorAll(".reveal:not(.in-view), .reveal-stagger:not(.in-view)").forEach(el => revealObserver.observe(el));
  }

  /* ---- Lazy image fade-in ---- */
  function bindLazyImages(root = document) {
    root.querySelectorAll("img.lazy-img:not(.loaded)").forEach(img => {
      if (img.complete && img.naturalWidth) img.classList.add("loaded");
      else img.addEventListener("load", () => img.classList.add("loaded"), { once: true });
    });
  }

  /* ---- Debounce ---- */
  const debounce = (fn, ms = 250) => {
    let t;
    return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
  };

  return { toast, openTrailer, closeModal, initRipple, initMagnetic, initCardTilt, initHeroParallax, observeReveals, bindLazyImages, debounce };
})();

/* ============ RENDER HELPERS ============ */
const Render = (() => {
  const esc = s => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

  /* ---- Movie card ---- */
  function card(movie, opts = {}) {
    const inList = typeof Watchlist !== "undefined" && Watchlist.has(movie.id);
    const q = movie.quality?.includes("4K") ? "4K" : (movie.quality?.[0] || "HD");
    const progress = opts.progress != null
      ? `<div class="card-progress" aria-label="Đã xem ${Math.round(opts.progress)}%"><span style="width:${opts.progress}%"></span></div>` : "";
    return `
    <article class="movie-card" data-id="${movie.id}" data-genre="${(movie.genres && movie.genres[0]) || ""}" tabindex="0" aria-label="${esc(movie.title)} (${movie.year})">
      <div class="card-poster">
        <img class="lazy-img" src="${Art.poster(movie)}" alt="Poster phim ${esc(movie.title)}" loading="lazy" width="600" height="900">
        <div class="card-badges">
          <span class="badge badge-quality">${q}</span>
          ${movie.isNew ? `<span class="badge badge-new">MỚI</span>` : movie.type === "series" ? `<span class="badge badge-type">PHIM BỘ</span>` : ""}
        </div>
        <div class="card-overlay">
          <div class="overlay-actions">
            <button class="btn btn-icon" data-act="play" aria-label="Xem ngay ${esc(movie.title)}"><i class="fa-solid fa-play"></i></button>
            <button class="btn btn-icon ${inList ? "in-list" : ""}" data-act="list" aria-label="${inList ? "Xóa khỏi" : "Thêm vào"} danh sách"><i class="fa-solid ${inList ? "fa-check" : "fa-plus"}"></i></button>
            <button class="btn btn-icon" data-act="info" aria-label="Chi tiết ${esc(movie.title)}"><i class="fa-solid fa-circle-info"></i></button>
          </div>
          <div class="overlay-genres">${movie.genres.map(genreVi).join(" · ")}</div>
        </div>
        ${progress}
      </div>
      <div class="card-info">
        <h3 class="card-title">${esc(movie.title)}</h3>
        <div class="card-meta">
          <span><i class="fa-solid fa-star star" aria-hidden="true"></i> ${movie.rating.toFixed(1)}</span>
          <span aria-hidden="true">·</span>
          <span>${movie.year}</span>
        </div>
      </div>
    </article>`;
  }

  /* ---- Horizontal rail section ---- */
  function railSection({ id, title, movies, link }) {
    if (!movies.length) return "";
    return `
    <section class="section reveal" id="${id}" aria-label="${esc(title)}">
      <div class="container">
        <div class="section-head">
          <h2 class="section-title">${esc(title)}</h2>
          ${link ? `<a class="section-link" href="${link}">Xem tất cả <i class="fa-solid fa-arrow-right"></i></a>` : ""}
        </div>
        <div class="rail-wrap">
          <button class="rail-arrow prev" aria-label="Cuộn trái"><i class="fa-solid fa-chevron-left"></i></button>
          <div class="rail reveal-stagger">${movies.map(m => card(m)).join("")}</div>
          <button class="rail-arrow next" aria-label="Cuộn phải"><i class="fa-solid fa-chevron-right"></i></button>
        </div>
      </div>
    </section>`;
  }

  /* ---- Skeletons ---- */
  function skeletonRail(count = 7) {
    return `<div class="rail">${Array.from({ length: count }, () =>
      `<div class="sk-card"><div class="skeleton sk-poster"></div><div class="skeleton sk-line"></div><div class="skeleton sk-line short"></div></div>`).join("")}</div>`;
  }

  return { card, railSection, skeletonRail, esc };
})();

/* ============ RAIL SCROLL ============ */
function initRails(root = document) {
  root.querySelectorAll(".rail-wrap").forEach(wrap => {
    if (wrap.dataset.railBound) return;
    wrap.dataset.railBound = "1";
    const rail = wrap.querySelector(".rail");
    const prev = wrap.querySelector(".rail-arrow.prev");
    const next = wrap.querySelector(".rail-arrow.next");
    if (!rail || !prev || !next) return;
    const step = () => Math.max(rail.clientWidth * 0.85, 300);
    prev.addEventListener("click", () => rail.scrollBy({ left: -step(), behavior: "smooth" }));
    next.addEventListener("click", () => rail.scrollBy({ left: step(), behavior: "smooth" }));
    const update = () => {
      prev.toggleAttribute("disabled", rail.scrollLeft < 10);
      next.toggleAttribute("disabled", rail.scrollLeft > rail.scrollWidth - rail.clientWidth - 10);
    };
    rail.addEventListener("scroll", UI.debounce(update, 80), { passive: true });
    update();
  });
}

/* ============ CARD ACTIONS (event delegation) ============ */
function initCardActions() {
  document.addEventListener("click", e => {
    const card = e.target.closest(".movie-card");
    if (!card) return;
    const id = Number(card.dataset.id);
    const actBtn = e.target.closest("[data-act]");
    if (actBtn) {
      e.preventDefault(); e.stopPropagation();
      const act = actBtn.dataset.act;
      if (act === "play") location.href = `watch.html?id=${id}`;
      else if (act === "info") location.href = `movie.html?id=${id}`;
      else if (act === "list" && typeof Watchlist !== "undefined") {
        const movie = MovieDB.byId(id);
        const added = Watchlist.toggle(id);
        actBtn.classList.toggle("in-list", added);
        actBtn.innerHTML = `<i class="fa-solid ${added ? "fa-check" : "fa-plus"}"></i>`;
        UI.toast(added ? `Đã thêm "${movie.title}" vào danh sách` : `Đã xóa "${movie.title}" khỏi danh sách`, added ? "success" : "info");
        document.dispatchEvent(new CustomEvent("watchlist:change"));
        if (navigator.vibrate) try { navigator.vibrate(added ? [10, 50, 10] : 12); } catch {}
      }
      return;
    }
    // Touch tap toggle overlay để hiện action trên mobile
    if (matchMedia("(hover:none)").matches) {
      const isActive = card.classList.contains("touch-open");
      document.querySelectorAll(".movie-card.touch-open").forEach(c => c.classList.remove("touch-open"));
      if (!isActive) {
        card.classList.add("touch-open");
        // Tự ẩn sau 3s nếu không tương tác
        clearTimeout(card._tt);
        card._tt = setTimeout(() => card.classList.remove("touch-open"), 3000);
        return;
      }
    }
    location.href = `movie.html?id=${id}`;
  });
  // Keyboard: Enter mở chi tiết
  document.addEventListener("keydown", e => {
    if (e.key !== "Enter") return;
    const card = e.target.closest?.(".movie-card");
    if (card && e.target === card) location.href = `movie.html?id=${card.dataset.id}`;
  });
}

/* ============ CARD SECTION PARALLAX (rail title drift) ============ */
function initSectionParallax() {
  if (!matchMedia("(hover:hover) and (pointer:fine)").matches) return;
  let ticking = false;
  const update = () => {
    document.querySelectorAll(".section-title").forEach(t => {
      const r = t.getBoundingClientRect();
      if (r.bottom < 0 || r.top > window.innerHeight) return;
      const offset = (r.top - window.innerHeight / 2) / window.innerHeight;
      t.style.setProperty("--tilt", `translateY(${(-offset * 4).toFixed(2)}px)`);
      // Section title drift dùng CSS variable
      t.style.transform = `translateY(${(-offset * 4).toFixed(2)}px)`;
    });
    ticking = false;
  };
  window.addEventListener("scroll", () => {
    if (!ticking) { requestAnimationFrame(update); ticking = true; }
  }, { passive: true });
  update();
}

/* ============ LAYOUT (header / footer / navs) ============ */
const Layout = (() => {
  const page = document.body.dataset.page || "";

  function headerHTML() {
    const active = p => (page === p ? "active" : "");
    const genreLinks = Object.keys(GENRE_VI).map(g =>
      `<a href="browse.html?genre=${encodeURIComponent(g)}">${genreVi(g)}</a>`).join("");
    const countryLinks = ["Vietnam", "Korea", "Japan", "USA"].map(c =>
      `<a href="browse.html?country=${encodeURIComponent(c)}">${countryVi(c)}</a>`).join("");
    const yearLinks = [2026, 2025, 2024].map(y =>
      `<a href="browse.html?year=${y}">${y}</a>`).join("");
    return `
    <div class="container header-inner">
      <a class="logo" href="index.html" aria-label="CINEVA - Trang chủ">
        <span class="logo-mark"><i class="fa-solid fa-clapperboard"></i></span>
        <span>CINEVA</span>
      </a>
      <nav class="main-nav" aria-label="Điều hướng chính">
        <a href="index.html" class="${active("home")}">Trang chủ</a>
        <a href="browse.html?sort=newest" class="${active("new")}">Phim mới</a>
        <a href="browse.html?type=movie">Phim lẻ</a>
        <a href="browse.html?type=series">Phim bộ</a>
        <div class="nav-drop">
          <a href="browse.html" class="${active("browse")}">Thể loại</a>
          <div class="nav-drop-menu">${genreLinks}</div>
        </div>
        <div class="nav-drop">
          <a href="browse.html">Quốc gia</a>
          <div class="nav-drop-menu" style="grid-template-columns:1fr">${countryLinks}</div>
        </div>
        <div class="nav-drop">
          <a href="browse.html">Năm</a>
          <div class="nav-drop-menu" style="grid-template-columns:1fr">${yearLinks}</div>
        </div>
      </nav>
      <div class="header-actions">
        <button class="btn btn-icon mobile-search-toggle" aria-label="Tìm kiếm" data-search-toggle><i class="fa-solid fa-magnifying-glass"></i></button>
        <div class="header-search" role="search">
          <i class="fa-solid fa-magnifying-glass search-ico" aria-hidden="true"></i>
          <input type="search" id="global-search" placeholder="Tìm phim, thể loại..." autocomplete="off" aria-label="Tìm kiếm phim">
          <div class="search-suggest" id="search-suggest" role="listbox" aria-label="Gợi ý tìm kiếm"></div>
        </div>
        <button class="btn btn-icon theme-toggle-btn" data-theme-toggle aria-label="Chuyển giao diện sáng/tối"><i class="fa-solid fa-moon"></i></button>
        <a class="btn btn-icon" href="watchlist.html" aria-label="Danh sách của tôi"><i class="fa-solid fa-bookmark"></i></a>
        <a class="avatar-btn" href="profile.html" aria-label="Hồ sơ cá nhân">C</a>
        <button class="btn btn-icon hamburger" aria-label="Mở menu" data-drawer-open><i class="fa-solid fa-bars"></i></button>
      </div>
    </div>`;
  }

  function drawerHTML() {
    return `
    <div class="drawer-backdrop" data-drawer-close></div>
    <div class="drawer-panel">
      <button class="btn btn-icon drawer-close" aria-label="Đóng menu" data-drawer-close><i class="fa-solid fa-xmark"></i></button>
      <a class="logo" href="index.html" style="margin-bottom:1.5rem"><span class="logo-mark"><i class="fa-solid fa-clapperboard"></i></span> CINEVA</a>
      <nav aria-label="Menu di động">
        <a href="index.html"><i class="fa-solid fa-house"></i> Trang chủ</a>
        <a href="browse.html?sort=newest"><i class="fa-solid fa-fire"></i> Phim mới</a>
        <a href="browse.html?type=movie"><i class="fa-solid fa-film"></i> Phim lẻ</a>
        <a href="browse.html?type=series"><i class="fa-solid fa-tv"></i> Phim bộ</a>
        <a href="browse.html"><i class="fa-solid fa-layer-group"></i> Thể loại</a>
        <a href="watchlist.html"><i class="fa-solid fa-bookmark"></i> Danh sách</a>
        <a href="history.html"><i class="fa-solid fa-clock-rotate-left"></i> Lịch sử</a>
        <a href="profile.html"><i class="fa-solid fa-user"></i> Hồ sơ</a>
        <a href="login.html"><i class="fa-solid fa-right-to-bracket"></i> Đăng nhập</a>
        <a href="admin.html"><i class="fa-solid fa-gauge"></i> Quản trị</a>
      </nav>
      <div style="margin-top:1.5rem;padding-top:1.5rem;border-top:1px solid var(--glass-border)">
        <button class="btn" data-theme-toggle style="width:100%"><i class="fa-solid fa-moon"></i> Đổi giao diện</button>
      </div>
    </div>`;
  }

  function bottomNavHTML() {
    const active = p => (page === p ? "active" : "");
    return `
    <ul>
      <li><a href="index.html" class="${active("home")}"><i class="fa-solid fa-house"></i>Trang chủ</a></li>
      <li><a href="browse.html" class="${active("browse")}"><i class="fa-solid fa-compass"></i>Khám phá</a></li>
      <li><a href="#" data-search-toggle class="${active("search")}"><i class="fa-solid fa-magnifying-glass"></i>Tìm kiếm</a></li>
      <li><a href="watchlist.html" class="${active("watchlist")}"><i class="fa-solid fa-bookmark"></i>Danh sách</a></li>
      <li><a href="profile.html" class="${active("profile")}"><i class="fa-solid fa-user"></i>Hồ sơ</a></li>
    </ul>`;
  }

  function footerHTML() {
    return `
    <div class="container">
      <div class="footer-grid">
        <div class="footer-brand">
          <a class="logo" href="index.html"><span class="logo-mark"><i class="fa-solid fa-clapperboard"></i></span> CINEVA</a>
          <p>Nền tảng thư viện phim demo với trải nghiệm điện ảnh cao cấp. Toàn bộ nội dung phim là hư cấu; video demo sử dụng nguồn mở được cấp phép Creative Commons.</p>
          <div class="footer-socials" aria-label="Mạng xã hội">
            <a href="#" aria-label="Facebook"><i class="fa-brands fa-facebook-f"></i></a>
            <a href="#" aria-label="Instagram"><i class="fa-brands fa-instagram"></i></a>
            <a href="#" aria-label="YouTube"><i class="fa-brands fa-youtube"></i></a>
            <a href="#" aria-label="Discord"><i class="fa-brands fa-discord"></i></a>
            <a href="#" aria-label="TikTok"><i class="fa-brands fa-tiktok"></i></a>
          </div>
        </div>
        <div class="footer-col">
          <h4>Khám phá</h4>
          <a href="browse.html?sort=newest">Phim mới</a>
          <a href="browse.html?type=movie">Phim lẻ</a>
          <a href="browse.html?type=series">Phim bộ</a>
          <a href="browse.html?sort=rating">Đánh giá cao</a>
        </div>
        <div class="footer-col">
          <h4>Thể loại</h4>
          <a href="browse.html?genre=Action">Hành động</a>
          <a href="browse.html?genre=Animation">Hoạt hình</a>
          <a href="browse.html?genre=Sci-Fi">Viễn tưởng</a>
          <a href="browse.html?genre=Romance">Lãng mạn</a>
        </div>
        <div class="footer-col">
          <h4>Tài khoản</h4>
          <a href="profile.html">Hồ sơ</a>
          <a href="watchlist.html">Danh sách của tôi</a>
          <a href="history.html">Lịch sử xem</a>
          <a href="login.html">Đăng nhập</a>
        </div>
      </div>
      <div class="footer-bottom">
        <span>© 2026 CINEVA — Website demo, không lưu trữ nội dung có bản quyền trái phép.</span>
        <span>Thiết kế với <i class="fa-solid fa-heart" style="color:var(--crimson)"></i> tại Việt Nam</span>
      </div>
    </div>`;
  }

  function mount() {
    // Header
    const header = document.querySelector(".site-header");
    if (header) {
      header.innerHTML = headerHTML();
      const onScroll = () => header.classList.toggle("scrolled", window.scrollY > 24);
      window.addEventListener("scroll", onScroll, { passive: true });
      onScroll();
    }
    // Drawer
    let drawer = document.querySelector(".mobile-drawer");
    if (!drawer) {
      drawer = document.createElement("div");
      drawer.className = "mobile-drawer";
      drawer.innerHTML = drawerHTML();
      document.body.appendChild(drawer);
    }
    document.addEventListener("click", e => {
      if (e.target.closest("[data-drawer-open]")) { drawer.classList.add("open"); document.body.style.overflow = "hidden"; }
      if (e.target.closest("[data-drawer-close]")) { drawer.classList.remove("open"); document.body.style.overflow = ""; }
    });
    // Bottom nav
    let bnav = document.querySelector(".bottom-nav");
    if (!bnav) {
      bnav = document.createElement("nav");
      bnav.className = "bottom-nav";
      bnav.setAttribute("aria-label", "Điều hướng di động");
      document.body.appendChild(bnav);
    }
    bnav.innerHTML = bottomNavHTML();
    // Footer
    const footer = document.querySelector(".site-footer");
    if (footer) footer.innerHTML = footerHTML();
    // Mobile search toggle
    document.addEventListener("click", e => {
      const t = e.target.closest("[data-search-toggle]");
      if (!t) return;
      e.preventDefault();
      const hs = document.querySelector(".header-search");
      if (!hs) return;
      hs.classList.toggle("mobile-open");
      if (hs.classList.contains("mobile-open")) hs.querySelector("input")?.focus();
    });
    // Page transition: fade khi rời trang
    document.addEventListener("click", e => {
      const a = e.target.closest("a[href]");
      if (!a || a.target === "_blank" || a.href.startsWith("javascript") || a.getAttribute("href")?.startsWith("#")) return;
      if (a.hostname !== location.hostname) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey) return;
      const href = a.getAttribute("href");
      if (!href || href.startsWith("#") || a.hasAttribute("data-search-toggle")) return;
      e.preventDefault();
      document.body.classList.add("page-leaving");
      setTimeout(() => { location.href = a.href; }, 180);
    });
  }

  return { mount };
})();

/* ============ BOOT SCREEN ============ */
function bootScreen() {
  const boot = document.querySelector(".boot-screen");
  if (!boot) return;
  // Thêm 3 orb particles để có hiệu ứng gradient động
  if (!boot.querySelector(".boot-orb")) {
    ["a", "b", "c"].forEach(k => {
      const orb = document.createElement("div");
      orb.className = `boot-orb ${k}`;
      boot.appendChild(orb);
    });
  }
  const done = () => {
    boot.classList.add("done");
    setTimeout(() => boot.remove(), 600);
  };
  if (document.readyState === "complete") setTimeout(done, 350);
  else window.addEventListener("load", () => setTimeout(done, 350));
  // Fail-safe: không bao giờ kẹt quá 2.5s
  setTimeout(done, 2500);
}

/* ============ PAGE: HOME ============ */
const HomePage = (() => {
  let heroMovies = [];
  let heroIndex = 0;
  let heroTimer = null;

  function heroSlideHTML(m, i) {
    return `<div class="hero-slide ${i === 0 ? "active" : ""}" data-i="${i}">
      <img src="${Art.backdrop(m)}" alt="" width="1600" height="900" ${i === 0 ? "" : 'loading="lazy"'}>
    </div>`;
  }

  function heroContentHTML(m) {
    const inList = Watchlist.has(m.id);
    return `
      <p class="hero-eyebrow">${m.type === "series" ? "Series nổi bật" : "Phim nổi bật"} · ${countryVi(m.country)}</p>
      <h1 class="display-title">${Render.esc(m.title)}</h1>
      <div class="hero-meta">
        <span class="rating-badge"><i class="fa-solid fa-star"></i> ${m.rating.toFixed(1)}</span>
        <span>${m.year}</span><span class="dot"></span>
        <span>${m.duration}</span><span class="dot"></span>
        <span>${countryVi(m.country)}</span>
      </div>
      <div class="hero-genres">${m.genres.map(g => `<a class="genre-chip" href="browse.html?genre=${encodeURIComponent(g)}">${genreVi(g)}</a>`).join("")}</div>
      <p class="hero-desc">${Render.esc(m.description)}</p>
      <div class="hero-actions">
        <a class="btn btn-primary btn-lg magnetic" href="watch.html?id=${m.id}"><i class="fa-solid fa-play"></i> Xem ngay</a>
        <button class="btn btn-glass btn-lg magnetic" data-hero-trailer><i class="fa-solid fa-film"></i> Trailer</button>
        <button class="btn btn-glass btn-icon btn-lg magnetic" data-hero-list aria-label="${inList ? "Xóa khỏi" : "Thêm vào"} danh sách" style="width:54px;height:54px">
          <i class="fa-solid ${inList ? "fa-check" : "fa-plus"}"></i>
        </button>
      </div>`;
  }

  function switchHero(i, hero) {
    if (i === heroIndex) return;
    heroIndex = i;
    const m = heroMovies[i];
    hero.querySelectorAll(".hero-slide").forEach(s => s.classList.toggle("active", Number(s.dataset.i) === i));
    hero.querySelectorAll(".hero-dots button").forEach((d, di) => {
      d.classList.toggle("active", di === i);
      // restart progress animation
      d.style.animation = "none";
      // eslint-disable-next-line no-unused-expressions
      d.offsetHeight;
      d.style.animation = "";
    });
    const num = hero.querySelector("#hero-counter-num");
    if (num) num.textContent = String(i + 1).padStart(2, "0");
    const content = hero.querySelector(".hero-content");
    hero.classList.add("switching");
    setTimeout(() => {
      content.innerHTML = heroContentHTML(m);
      hero.classList.remove("switching");
    }, 200);
  }

  function startAutoplay(hero) {
    stopAutoplay();
    heroTimer = setInterval(() => {
      switchHero((heroIndex + 1) % heroMovies.length, hero);
    }, 7000);
  }
  function stopAutoplay() { if (heroTimer) clearInterval(heroTimer); }

  function renderHero() {
    const hero = document.getElementById("hero");
    if (!hero) return;
    heroMovies = MovieDB.featured().slice(0, 5);
    if (!heroMovies.length) heroMovies = MovieDB.topRated().slice(0, 5);
    const m = heroMovies[0];
    const pad = n => String(n).padStart(2, "0");
    hero.innerHTML = `
      <div class="hero-bg">${heroMovies.map(heroSlideHTML).join("")}</div>
      <div class="container hero-content">${heroContentHTML(m)}</div>
      <div class="hero-counter" aria-hidden="true">
        <span id="hero-counter-num">01</span>
        <small>/ ${pad(heroMovies.length)}</small>
      </div>
      <div class="hero-dots" role="tablist" aria-label="Chọn phim nổi bật">
        ${heroMovies.map((mv, i) => `<button role="tab" aria-label="Phim ${Render.esc(mv.title)}" class="${i === 0 ? "active" : ""}" data-dot="${i}"></button>`).join("")}
      </div>`;
    hero.addEventListener("click", e => {
      const dot = e.target.closest("[data-dot]");
      if (dot) { switchHero(Number(dot.dataset.dot), hero); startAutoplay(hero); return; }
      if (e.target.closest("[data-hero-trailer]")) UI.openTrailer(heroMovies[heroIndex]);
      if (e.target.closest("[data-hero-list]")) {
        const mv = heroMovies[heroIndex];
        const added = Watchlist.toggle(mv.id);
        const btn = hero.querySelector("[data-hero-list]");
        btn.innerHTML = `<i class="fa-solid ${added ? "fa-check" : "fa-plus"}"></i>`;
        UI.toast(added ? `Đã thêm "${mv.title}" vào danh sách` : `Đã xóa "${mv.title}" khỏi danh sách`, added ? "success" : "info");
      }
    });
    hero.addEventListener("mouseenter", stopAutoplay);
    hero.addEventListener("mouseleave", () => startAutoplay(hero));
    startAutoplay(hero);
    // Swipe trên mobile
    let touchX = null;
    hero.addEventListener("touchstart", e => { touchX = e.touches[0].clientX; }, { passive: true });
    hero.addEventListener("touchend", e => {
      if (touchX == null) return;
      const dx = e.changedTouches[0].clientX - touchX;
      if (Math.abs(dx) > 60) {
        switchHero((heroIndex + (dx < 0 ? 1 : heroMovies.length - 1)) % heroMovies.length, hero);
        startAutoplay(hero);
      }
      touchX = null;
    }, { passive: true });
  }

  function renderSections() {
    const mount = document.getElementById("home-sections");
    if (!mount) return;
    const cw = History.continueList();
    const sections = [];
    if (cw.length) {
      sections.push(`
      <section class="section reveal" aria-label="Tiếp tục xem">
        <div class="container">
          <div class="section-head">
            <h2 class="section-title">Tiếp tục xem</h2>
            <a class="section-link" href="history.html">Lịch sử <i class="fa-solid fa-arrow-right"></i></a>
          </div>
          <div class="rail-wrap">
            <button class="rail-arrow prev" aria-label="Cuộn trái"><i class="fa-solid fa-chevron-left"></i></button>
            <div class="rail reveal-stagger">
              ${cw.map(item => {
                const m = MovieDB.byId(item.movieId);
                return m ? Render.card(m, { progress: item.percent }) : "";
              }).join("")}
            </div>
            <button class="rail-arrow next" aria-label="Cuộn phải"><i class="fa-solid fa-chevron-right"></i></button>
          </div>
        </div>
      </section>`);
    }
    const defs = [
      { id: "sec-new", title: "Mới cập nhật", movies: MovieDB.newest().slice(0, 12), link: "browse.html?sort=newest" },
      { id: "sec-popular", title: "Phổ biến", movies: MovieDB.popular().slice(0, 12), link: "browse.html?sort=popular" },
      { id: "sec-top", title: "Được đánh giá cao", movies: MovieDB.topRated().slice(0, 12), link: "browse.html?sort=rating" },
      { id: "sec-action", title: "Phim hành động", movies: MovieDB.byGenre("Action"), link: "browse.html?genre=Action" },
      { id: "sec-comedy", title: "Phim hài", movies: MovieDB.byGenre("Comedy"), link: "browse.html?genre=Comedy" },
      { id: "sec-scifi", title: "Khoa học viễn tưởng", movies: MovieDB.byGenre("Sci-Fi"), link: "browse.html?genre=Sci-Fi" },
      { id: "sec-anim", title: "Phim hoạt hình", movies: MovieDB.byGenre("Animation"), link: "browse.html?genre=Animation" },
      { id: "sec-adv", title: "Phim phiêu lưu", movies: MovieDB.byGenre("Adventure"), link: "browse.html?genre=Adventure" },
      { id: "sec-family", title: "Phim gia đình", movies: MovieDB.byGenre("Family"), link: "browse.html?genre=Family" },
      { id: "sec-vn", title: "Phim Việt Nam", movies: MovieDB.byCountry("Vietnam"), link: "browse.html?country=Vietnam" },
      { id: "sec-kr", title: "Phim Hàn Quốc", movies: MovieDB.byCountry("Korea"), link: "browse.html?country=Korea" },
      { id: "sec-jp", title: "Phim Nhật Bản", movies: MovieDB.byCountry("Japan"), link: "browse.html?country=Japan" },
      { id: "sec-us", title: "Phim Âu Mỹ", movies: MovieDB.byCountry(["USA", "UK", "France", "Norway"]), link: "browse.html?country=USA" }
    ];
    defs.forEach(d => sections.push(Render.railSection(d)));
    mount.innerHTML = sections.join("");
    initRails(mount);
    UI.observeReveals(mount);
    UI.bindLazyImages(mount);
  }

  function init() {
    renderHero();
    renderSections();
    document.addEventListener("watchlist:change", () => {
      // đồng bộ icon hero khi watchlist đổi từ card khác
      const hero = document.getElementById("hero");
      const btn = hero?.querySelector("[data-hero-list]");
      if (btn && heroMovies[heroIndex]) {
        const inList = Watchlist.has(heroMovies[heroIndex].id);
        btn.innerHTML = `<i class="fa-solid ${inList ? "fa-check" : "fa-plus"}"></i>`;
      }
    });
  }

  return { init };
})();

/* ============ PAGE: BROWSE ============ */
const BrowsePage = (() => {
  const state = { genre: "", country: "", year: "", rating: "", quality: "", type: "", sort: "", q: "" };

  function readURL() {
    const p = new URLSearchParams(location.search);
    ["genre", "country", "year", "rating", "quality", "type", "sort", "q"].forEach(k => {
      if (p.has(k)) state[k] = p.get(k);
    });
  }

  function applyFilters() {
    let list = MovieDB.all();
    if (state.q) list = MovieDB.search(state.q);
    if (state.genre) list = list.filter(m => m.genres.includes(state.genre));
    if (state.country) list = list.filter(m => m.country === state.country);
    if (state.year) list = list.filter(m => String(m.year) === String(state.year));
    if (state.rating) list = list.filter(m => m.rating >= Number(state.rating));
    if (state.quality) list = list.filter(m => m.quality.includes(state.quality));
    if (state.type) list = list.filter(m => m.type === state.type);
    if (state.sort === "newest") list = [...list].sort((a, b) => b.year - a.year || b.id - a.id);
    else if (state.sort === "rating") list = [...list].sort((a, b) => b.rating - a.rating);
    else if (state.sort === "popular") list = [...list].sort((a, b) => (b.rating * 7 + b.year % 100) - (a.rating * 7 + a.year % 100));
    else if (state.sort === "az") list = [...list].sort((a, b) => a.title.localeCompare(b.title, "vi"));
    return list;
  }

  function renderResults() {
    const grid = document.getElementById("browse-grid");
    const count = document.getElementById("result-count");
    if (!grid) return;
    // Loading state ngắn để mượt
    grid.innerHTML = `<div class="spinner" role="status" aria-label="Đang tải"></div>`;
    requestAnimationFrame(() => {
      const list = applyFilters();
      if (count) count.textContent = list.length ? `Tìm thấy ${list.length} phim` : "";
      if (!list.length) {
        grid.innerHTML = `
        <div class="empty-state" style="grid-column:1/-1">
          <div class="empty-ico"><i class="fa-solid fa-film"></i></div>
          <h3>Không tìm thấy phim phù hợp</h3>
          <p>Thử điều chỉnh bộ lọc hoặc từ khóa tìm kiếm khác.</p>
          <button class="btn btn-primary" id="empty-reset">Đặt lại bộ lọc</button>
        </div>`;
        document.getElementById("empty-reset")?.addEventListener("click", resetFilters);
        return;
      }
      grid.innerHTML = list.map(m => Render.card(m)).join("");
      UI.bindLazyImages(grid);
    });
  }

  function syncForm() {
    const set = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };
    set("f-genre", state.genre); set("f-country", state.country);
    set("f-year", state.year); set("f-rating", state.rating);
    set("f-quality", state.quality); set("f-type", state.type); set("f-sort", state.sort || "");
  }

  function readForm() {
    const get = id => document.getElementById(id)?.value || "";
    state.genre = get("f-genre"); state.country = get("f-country");
    state.year = get("f-year"); state.rating = get("f-rating");
    state.quality = get("f-quality"); state.type = get("f-type"); state.sort = get("f-sort");
  }

  function pushURL() {
    const p = new URLSearchParams();
    Object.entries(state).forEach(([k, v]) => { if (v) p.set(k, v); });
    history.replaceState(null, "", "browse.html" + (p.toString() ? "?" + p.toString() : ""));
  }

  function resetFilters() {
    Object.keys(state).forEach(k => state[k] = "");
    syncForm(); pushURL(); renderResults();
    UI.toast("Đã đặt lại bộ lọc", "info");
  }

  function buildFilterOptions() {
    const genres = ["Action", "Adventure", "Animation", "Comedy", "Crime", "Drama", "Fantasy", "Horror", "Mystery", "Romance", "Sci-Fi", "Thriller"];
    const gSel = document.getElementById("f-genre");
    if (gSel) gSel.innerHTML = `<option value="">Tất cả</option>` + genres.map(g => `<option value="${g}">${genreVi(g)}</option>`).join("");
    const countries = [...new Set(MovieDB.all().map(m => m.country))];
    const cSel = document.getElementById("f-country");
    if (cSel) cSel.innerHTML = `<option value="">Tất cả</option>` + countries.map(c => `<option value="${c}">${countryVi(c)}</option>`).join("");
    const years = [...new Set(MovieDB.all().map(m => m.year))].sort((a, b) => b - a);
    const ySel = document.getElementById("f-year");
    if (ySel) ySel.innerHTML = `<option value="">Tất cả</option>` + years.map(y => `<option value="${y}">${y}</option>`).join("");
  }

  function init() {
    readURL();
    buildFilterOptions();
    syncForm();
    renderResults();
    document.getElementById("filter-apply")?.addEventListener("click", () => {
      readForm(); pushURL(); renderResults();
    });
    document.getElementById("filter-reset")?.addEventListener("click", resetFilters);
    // Nếu có query search từ URL, hiển thị trong ô search trang
    if (state.q) {
      const inp = document.getElementById("global-search");
      if (inp) inp.value = state.q;
    }
  }

  return { init, get state() { return state; }, renderResults };
})();

/* ============ PAGE: MOVIE DETAIL ============ */
const MoviePage = (() => {
  function init() {
    const id = new URLSearchParams(location.search).get("id");
    const movie = MovieDB.byId(id);
    const mount = document.getElementById("movie-detail");
    if (!mount) return;
    if (!movie) {
      mount.innerHTML = `
      <div class="empty-state" style="padding-top:calc(var(--header-h) + 6rem)">
        <div class="empty-ico"><i class="fa-solid fa-film"></i></div>
        <h3>Không tìm thấy phim</h3>
        <p>Phim bạn tìm không tồn tại hoặc đã bị gỡ.</p>
        <a class="btn btn-primary" href="index.html">Về trang chủ</a>
      </div>`;
      return;
    }
    document.title = `${movie.title} (${movie.year}) — CINEVA`;
    const inList = Watchlist.has(movie.id);
    const epInfo = movie.type === "series" && movie.seasons
      ? movie.seasons.map(s => `Mùa ${s.season}: ${s.episodes} tập`).join(" · ")
      : movie.duration;

    mount.innerHTML = `
    <section class="detail-hero">
      <div class="hero-bg"><img src="${Art.backdrop(movie)}" alt="" width="1600" height="900"></div>
      <div class="container detail-layout">
        <div class="detail-poster reveal in-view">
          <img src="${Art.poster(movie)}" alt="Poster phim ${Render.esc(movie.title)}" width="600" height="900">
        </div>
        <div class="detail-info hero-content">
          <p class="hero-eyebrow">${movie.type === "series" ? "Phim bộ" : "Phim lẻ"} · ${countryVi(movie.country)}</p>
          <h1 class="display-title">${Render.esc(movie.title)}</h1>
          <p class="detail-sub">${Render.esc(movie.originalTitle || "")}</p>
          <div class="hero-meta">
            <span class="rating-badge"><i class="fa-solid fa-star"></i> ${movie.rating.toFixed(1)}</span>
            <span>${movie.year}</span><span class="dot"></span>
            <span>${epInfo}</span><span class="dot"></span>
            <span>${movie.quality.join(" / ")}</span>
          </div>
          <div class="hero-genres">${movie.genres.map(g => `<a class="genre-chip" href="browse.html?genre=${encodeURIComponent(g)}">${genreVi(g)}</a>`).join("")}</div>
          <div class="hero-actions" style="margin-top:1.5rem">
            <a class="btn btn-primary btn-lg magnetic" href="watch.html?id=${movie.id}"><i class="fa-solid fa-play"></i> Xem phim</a>
            <button class="btn btn-glass btn-lg magnetic" id="btn-trailer"><i class="fa-solid fa-film"></i> Trailer</button>
            <button class="btn btn-glass btn-lg magnetic" id="btn-watchlist">
              <i class="fa-solid ${inList ? "fa-check" : "fa-plus"}"></i> <span>${inList ? "Đã lưu" : "Danh sách"}</span>
            </button>
          </div>
        </div>
      </div>
    </section>
    <div class="container detail-body">
      <div>
        <h2 class="section-title" style="margin-bottom:1.2rem">Nội dung</h2>
        <p class="detail-desc">${Render.esc(movie.description)}</p>
        <h2 class="section-title" style="margin:2.2rem 0 1.2rem">Diễn viên</h2>
        <div class="cast-list">
          ${(movie.cast || []).map(c => `<span class="cast-chip"><span class="ava">${Render.esc(c.charAt(0))}</span>${Render.esc(c)}</span>`).join("") || `<p style="color:var(--text-3)">Đang cập nhật.</p>`}
        </div>
      </div>
      <aside class="side-card">
        <h3 style="margin-bottom:1.2rem">Thông tin</h3>
        <dl class="info-list">
          <div class="row"><dt>Đạo diễn</dt><dd>${Render.esc(movie.director || "Đang cập nhật")}</dd></div>
          <div class="row"><dt>Quốc gia</dt><dd>${countryVi(movie.country)}</dd></div>
          <div class="row"><dt>Năm</dt><dd>${movie.year}</dd></div>
          <div class="row"><dt>Thời lượng</dt><dd>${epInfo}</dd></div>
          <div class="row"><dt>Chất lượng</dt><dd>${movie.quality.join(", ")}</dd></div>
          <div class="row"><dt>Thể loại</dt><dd>${movie.genres.map(genreVi).join(", ")}</dd></div>
        </dl>
      </aside>
    </div>
    <div id="related-mount"></div>`;

    document.getElementById("btn-trailer").addEventListener("click", () => UI.openTrailer(movie));
    document.getElementById("btn-watchlist").addEventListener("click", e => {
      const added = Watchlist.toggle(movie.id);
      const btn = e.currentTarget;
      btn.innerHTML = `<i class="fa-solid ${added ? "fa-check" : "fa-plus"}"></i> <span>${added ? "Đã lưu" : "Danh sách"}</span>`;
      UI.toast(added ? `Đã thêm "${movie.title}" vào danh sách` : `Đã xóa "${movie.title}" khỏi danh sách`, added ? "success" : "info");
    });

    // Phim liên quan (cùng thể loại)
    const related = MovieDB.all()
      .filter(m => m.id !== movie.id && m.genres.some(g => movie.genres.includes(g)))
      .slice(0, 12);
    document.getElementById("related-mount").innerHTML =
      Render.railSection({ id: "sec-related", title: "Có thể bạn sẽ thích", movies: related });
    initRails(mount);
    UI.observeReveals(mount);
    UI.bindLazyImages(mount);
  }
  return { init };
})();

/* ============ ADMIN AUTH ============ */
const AdminAuth = (() => {
  const KEY = "cineva_admin_auth";
  // Tài khoản admin mặc định (chỉ dùng cho demo client-side)
  const ADMIN_CREDENTIALS = { username: "admin", password: "cineva2024" };

  function isLoggedIn() {
    try { return JSON.parse(localStorage.getItem(KEY))?.loggedIn === true; }
    catch { return false; }
  }

  function login(username, password) {
    if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
      localStorage.setItem(KEY, JSON.stringify({ loggedIn: true, username, time: Date.now() }));
      return true;
    }
    return false;
  }

  function logout() {
    localStorage.removeItem(KEY);
  }

  function user() {
    try { return JSON.parse(localStorage.getItem(KEY)) || null; }
    catch { return null; }
  }

  return { isLoggedIn, login, logout, user };
})();

/* ============ USER AUTH ============ */
const UserAuth = (() => {
  const USERS_KEY = "cineva_users";
  const SESSION_KEY = "cineva_user";

  /** Lấy danh sách user đã đăng ký */
  function _users() {
    try { return JSON.parse(localStorage.getItem(USERS_KEY)) || []; }
    catch { return []; }
  }

  function _saveUsers(users) {
    try { localStorage.setItem(USERS_KEY, JSON.stringify(users)); }
    catch { /* ignore */ }
  }

  /** Đăng ký tài khoản mới */
  function register(email, password, name) {
    const users = _users();
    if (users.find(u => u.email === email)) return { ok: false, error: "Email đã được đăng ký." };
    if (password.length < 6) return { ok: false, error: "Mật khẩu phải có ít nhất 6 ký tự." };
    const user = { email, password, name, createdAt: Date.now() };
    users.push(user);
    _saveUsers(users);
    // Tự động đăng nhập sau khi đăng ký
    _setSession(user);
    return { ok: true };
  }

  /** Đăng nhập */
  function login(email, password) {
    const users = _users();
    const user = users.find(u => u.email === email && u.password === password);
    if (!user) return { ok: false, error: "Email hoặc mật khẩu không đúng." };
    _setSession(user);
    return { ok: true };
  }

  function _setSession(user) {
    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify({
        name: user.name,
        email: user.email,
        loggedIn: true,
        time: Date.now()
      }));
    } catch { /* ignore */ }
  }

  function logout() {
    localStorage.removeItem(SESSION_KEY);
  }

  function isLoggedIn() {
    try { return JSON.parse(localStorage.getItem(SESSION_KEY))?.loggedIn === true; }
    catch { return false; }
  }

  function user() {
    try { return JSON.parse(localStorage.getItem(SESSION_KEY)) || { name: "Khách CINEVA", email: "guest@cineva.demo" }; }
    catch { return { name: "Khách CINEVA", email: "guest@cineva.demo" }; }
  }

  return { register, login, logout, isLoggedIn, user };
})();

/* ============ PAGE: LOGIN ============ */
const LoginPage = (() => {
  function init() {
    const form = document.getElementById("login-form");
    if (!form) return;
    const submitBtn = form.querySelector("button[type='submit']");
    const titleEl = document.querySelector(".auth-card h1");
    const subtitleEl = document.querySelector(".auth-card > p");
    const nameGroup = document.getElementById("name-group");
    const nameInput = document.getElementById("login-name");
    const emailInput = document.getElementById("login-email");
    const emailLabel = document.querySelector("label[for='login-email']");
    const googleBtn = document.getElementById("btn-google");
    const divider = document.querySelector(".auth-divider");
    const toggleLink = document.getElementById("toggle-register");
    const demoNote = document.querySelector(".auth-card > p:last-of-type");
    let isRegisterMode = false;

    function setMode(register) {
      isRegisterMode = register;
      if (isRegisterMode) {
        if (nameGroup) nameGroup.style.display = "";
        emailLabel.textContent = "Email";
        emailInput.type = "email";
        emailInput.placeholder = "ban@email.com";
        emailInput.autocomplete = "email";
        titleEl.textContent = "Tạo tài khoản";
        subtitleEl.textContent = "Đăng ký để bắt đầu hành trình điện ảnh của bạn.";
        submitBtn.innerHTML = '<i class="fa-solid fa-user-plus"></i> Đăng ký';
        if (googleBtn) googleBtn.style.display = "";
        if (divider) divider.style.display = "";
        if (toggleLink) toggleLink.innerHTML = '<i class="fa-solid fa-right-to-bracket"></i> Đã có tài khoản?';
        if (demoNote) demoNote.textContent = "Đây là trang demo — mật khẩu được lưu cục bộ trên trình duyệt của bạn.";
      } else {
        if (nameGroup) nameGroup.style.display = "none";
        emailLabel.textContent = "Email";
        emailInput.type = "email";
        emailInput.placeholder = "ban@email.com";
        emailInput.autocomplete = "email";
        titleEl.textContent = "Chào mừng trở lại";
        subtitleEl.textContent = "Đăng nhập để tiếp tục hành trình điện ảnh của bạn.";
        submitBtn.innerHTML = '<i class="fa-solid fa-right-to-bracket"></i> Đăng nhập';
        if (googleBtn) googleBtn.style.display = "";
        if (divider) divider.style.display = "";
        if (toggleLink) toggleLink.innerHTML = '<i class="fa-solid fa-user-plus"></i> Chưa có tài khoản?';
        if (demoNote) demoNote.textContent = "Đây là trang demo — mật khẩu không được lưu trữ hay gửi đi bất cứ đâu.";
      }
    }

    // Toggle register / login
    toggleLink?.addEventListener("click", e => {
      e.preventDefault();
      setMode(!isRegisterMode);
    });

    form.addEventListener("submit", e => {
      e.preventDefault();
      const email = emailInput;
      const pass = document.getElementById("login-password");
      const name = nameInput;
      let valid = true;
      const emailGroup = email.closest(".form-group");
      const passGroup = pass.closest(".form-group");
      const nameGrp = nameGroup;
      emailGroup.classList.remove("invalid"); passGroup.classList.remove("invalid");
      if (nameGrp) nameGrp.classList.remove("invalid");

      const emailVal = email.value.trim();
      const passVal = pass.value;

      if (isRegisterMode) {
        // Register
        if (name && name.value.trim().length < 2) { nameGrp.classList.add("invalid"); valid = false; }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal)) { emailGroup.classList.add("invalid"); valid = false; }
        if (passVal.length < 6) { passGroup.classList.add("invalid"); valid = false; }
        if (!valid) return;
        const result = UserAuth.register(emailVal, passVal, (name?.value || emailVal.split("@")[0]).trim());
        if (result.ok) {
          UI.toast("Đăng ký thành công! Chào mừng bạn đến với CINEVA.", "success");
          setTimeout(() => location.href = "index.html", 900);
        } else {
          UI.toast(result.error, "error");
        }
      } else {
        // Login: kiểm tra admin trước
        if (AdminAuth.login(emailVal, passVal)) {
          UI.toast("Đăng nhập admin thành công!", "success");
          setTimeout(() => location.href = "admin.html", 700);
          return;
        }
        // User login
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal)) { emailGroup.classList.add("invalid"); valid = false; }
        if (passVal.length < 6) { passGroup.classList.add("invalid"); valid = false; }
        if (!valid) return;
        const result = UserAuth.login(emailVal, passVal);
        if (result.ok) {
          UI.toast(`Chào mừng trở lại, ${UserAuth.user().name}!`, "success");
          setTimeout(() => location.href = "index.html", 900);
        } else {
          UI.toast(result.error, "error");
        }
      }
    });
    document.getElementById("btn-google")?.addEventListener("click", () =>
      UI.toast("Đây là bản demo — đăng nhập Google chưa được kết nối.", "info"));
  }
  return { init };
})();

/* ============ PAGE: PROFILE ============ */
const ProfilePage = (() => {
  function init() {
    const mount = document.getElementById("profile-mount");
    if (!mount) return;
    const u = UserAuth.user();
    const wl = Watchlist.list();
    const hist = History.list();
    const cw = History.continueList();

    document.getElementById("p-ava").textContent = u.name.charAt(0).toUpperCase();
    document.getElementById("p-name").textContent = u.name;
    document.getElementById("p-email").textContent = u.email;
    document.getElementById("p-stat-wl").textContent = wl.length;
    document.getElementById("p-stat-hist").textContent = hist.length;
    document.getElementById("p-stat-cw").textContent = cw.length;

    const sections = [];
    if (cw.length) {
      sections.push(Render.railSection({
        id: "p-cw", title: "Tiếp tục xem",
        movies: cw.map(i => MovieDB.byId(i.movieId)).filter(Boolean), link: "history.html"
      }));
    }
    if (wl.length) {
      sections.push(Render.railSection({
        id: "p-wl", title: "Danh sách của tôi",
        movies: wl.map(id => MovieDB.byId(id)).filter(Boolean), link: "watchlist.html"
      }));
    }
    if (hist.length) {
      sections.push(Render.railSection({
        id: "p-hist", title: "Đã xem gần đây",
        movies: [...new Map(hist.map(h => [h.movieId, MovieDB.byId(h.movieId)])).values()].filter(Boolean).slice(0, 12),
        link: "history.html"
      }));
    }
    const secMount = document.getElementById("profile-sections");
    secMount.innerHTML = sections.join("") || `
      <div class="container"><div class="empty-state">
        <div class="empty-ico"><i class="fa-solid fa-clapperboard"></i></div>
        <h3>Chưa có hoạt động nào</h3>
        <p>Bắt đầu khám phá và lưu những bộ phim bạn yêu thích.</p>
        <a class="btn btn-primary" href="browse.html">Khám phá phim</a>
      </div></div>`;
    initRails(secMount);
    UI.observeReveals(secMount);
    UI.bindLazyImages(secMount);

    document.getElementById("btn-logout")?.addEventListener("click", () => {
      UserAuth.logout();
      UI.toast("Đã đăng xuất", "info");
      setTimeout(() => location.href = "login.html", 700);
    });
    document.getElementById("btn-clear-data")?.addEventListener("click", () => {
      if (!confirm("Xóa toàn bộ dữ liệu cục bộ (watchlist, lịch sử, tiến trình xem)?")) return;
      Watchlist.clear(); History.clearAll();
      UI.toast("Đã xóa toàn bộ dữ liệu cục bộ", "success");
      setTimeout(() => location.reload(), 800);
    });
  }
  return { init };
})();

/* ============ AUTH GUARD ============ */
function authGuard() {
  const page = document.body.dataset.page;
  // Không chặn trang login, admin (có guard riêng) và 404
  if (page === "login" || page === "admin" || page === "404") return;
  if (!UserAuth.isLoggedIn()) {
    location.href = "login.html";
  }
}

/* ============ BOOTSTRAP ============ */
document.addEventListener("DOMContentLoaded", () => {
  authGuard();
  bootScreen();
  Layout.mount();
  UI.initRipple();
  UI.initMagnetic();
  UI.initCardTilt();
  UI.initHeroParallax();
  initCardActions();
  initSectionParallax();
  UI.observeReveals();

  const page = document.body.dataset.page;
  try {
    if (page === "home") HomePage.init();
    else if (page === "browse") BrowsePage.init();
    else if (page === "movie") MoviePage.init();
    else if (page === "login") LoginPage.init();
    else if (page === "profile") ProfilePage.init();
  } catch (err) {
    console.error("Lỗi khởi tạo trang:", err);
    UI.toast("Có lỗi xảy ra khi tải trang. Vui lòng thử lại.", "error");
  }
  UI.bindLazyImages();
});
