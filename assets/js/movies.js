/* ============================================================
   CINEVA — Movie Data Layer
   - MOVIES_DATA: dữ liệu phim mẫu (fiction, video CC của Blender)
   - MovieDB: API đọc/ghi (admin overlay qua LocalStorage)
   - Art: sinh poster/backdrop SVG aurora-gradient (không cần ảnh)
   ============================================================ */
"use strict";

/* ---------- Demo video nguồn mở (Blender Foundation, CC) ---------- */
const CC_VIDEOS = [
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4"
];
const vid = i => CC_VIDEOS[i % CC_VIDEOS.length];

/* ---------- Bảng dịch thể loại ---------- */
const GENRE_VI = {
  "Action": "Hành động", "Adventure": "Phiêu lưu", "Animation": "Hoạt hình",
  "Comedy": "Hài", "Crime": "Hình sự", "Drama": "Chính kịch",
  "Fantasy": "Giả tưởng", "Horror": "Kinh dị", "Mystery": "Bí ẩn",
  "Romance": "Lãng mạn", "Sci-Fi": "Viễn tưởng", "Thriller": "Giật gân",
  "Family": "Gia đình"
};
const COUNTRY_VI = {
  "Vietnam": "Việt Nam", "USA": "Âu Mỹ", "Korea": "Hàn Quốc",
  "Japan": "Nhật Bản", "UK": "Âu Mỹ", "Norway": "Âu Mỹ", "France": "Âu Mỹ"
};

/* ---------- Dữ liệu phim mẫu (24 phim hư cấu) ---------- */
const MOVIES_DATA = [
  { id: 1, title: "Dạ Khúc Sài Gòn", originalTitle: "Saigon Nocturne", year: 2026, rating: 8.7, duration: "118 phút", country: "Vietnam", genres: ["Drama", "Romance"], quality: ["HD", "4K"], description: "Một nhạc công piano già và cô ca sĩ trẻ tình cờ gặp nhau trong quán bar cuối cùng còn chơi nhạc sống ở Sài Gòn. Giữa những giai điệu đêm muộn, họ cùng viết nên bản dạ khúc về tình yêu, mất mát và hy vọng.", trailerUrl: vid(5), videoUrl: vid(0), type: "movie", featured: true, isNew: true, director: "Trần Minh Quân", cast: ["Lê Hạ Vy", "Nguyễn Thanh Sơn", "Phạm Mai Anh"], palette: 0 },
  { id: 2, title: "Neon Horizon", originalTitle: "Neon Horizon", year: 2026, rating: 9.1, duration: "142 phút", country: "USA", genres: ["Sci-Fi", "Action"], quality: ["HD", "4K"], description: "Năm 2189, phi hành gia Ava Reyes thức dậy trên trạm quỹ đạo bỏ hoang và phát hiện Trái Đất đã im lặng suốt 40 năm. Hành trình trở về nhà buộc cô đối mặt với trí tuệ nhân tạo đang tái định nghĩa loài người.", trailerUrl: vid(5), videoUrl: vid(1), type: "movie", featured: true, isNew: true, director: "Sofia Lindqvist", cast: ["Maya Chen", "Daniel Okafor", "Rhea Kapoor"], palette: 1 },
  { id: 3, title: "Hồi Ức Đại Dương", originalTitle: "Ocean of Memories", year: 2025, rating: 8.2, duration: "105 phút", country: "Vietnam", genres: ["Adventure", "Family"], quality: ["HD"], description: "Cậu bé miền biển Phú Yên cùng ông nội thực hiện chuyến hải trình cuối cùng trên con thuyền gỗ gia truyền, khám phá những rạn san hô kỳ ảo và bí mật gia đình bị chôn giấu dưới đáy đại dương.", trailerUrl: vid(5), videoUrl: vid(2), type: "movie", featured: true, isNew: false, director: "Võ Hoài Nam", cast: ["Bùi Gia Bảo", "NSND Hữu Châu", "Trịnh Thảo"], palette: 2 },
  { id: 4, title: "Seoul Midnight Run", originalTitle: "서울 미드나잇 런", year: 2026, rating: 8.9, duration: "8 tập", country: "Korea", genres: ["Action", "Crime"], quality: ["HD", "4K"], description: "Một tài xế giao hàng đêm vô tình trở thành nhân chứng duy nhất của đường dây rửa tiền xuyên quốc gia. Mỗi đêm, anh phải chạy đua với thời gian để bảo vệ gia đình và phanh phui sự thật.", trailerUrl: vid(5), videoUrl: vid(3), type: "series", featured: true, isNew: true, director: "Park Ji-hoon", cast: ["Kang Min-seok", "Yoon Da-eun", "Choi Byung-ho"], palette: 3, seasons: [ { season: 1, episodes: 8 }, { season: 2, episodes: 6 } ] },
  { id: 5, title: "Sakura Protocol", originalTitle: "サクラ・プロトコル", year: 2025, rating: 8.8, duration: "98 phút", country: "Japan", genres: ["Animation", "Sci-Fi"], quality: ["HD", "4K"], description: "Tại Tokyo tương lai nơi ký ức có thể lưu trữ như dữ liệu, nữ sinh Hana phát hiện ký ức về người mẹ đã mất của mình bị đánh cắp — và kẻ trộm chính là phiên bản số hóa của bà.", trailerUrl: vid(5), videoUrl: vid(4), type: "movie", featured: true, isNew: true, director: "Aoi Takahashi", cast: ["Rin Hayasaka", "Kenta Mori", "Yui Nakamura"], palette: 4 },
  { id: 6, title: "The Last Cartographer", originalTitle: "The Last Cartographer", year: 2024, rating: 8.4, duration: "127 phút", country: "UK", genres: ["Adventure", "Mystery"], quality: ["HD"], description: "Nhà vẽ bản đồ cuối cùng của Hội Địa lý Hoàng gia nhận nhiệm vụ lập bản đồ hòn đảo không tồn tại trên bất kỳ hải đồ nào — nơi la bàn quay ngược và thời gian trôi theo thủy triều.", trailerUrl: vid(5), videoUrl: vid(0), type: "movie", featured: false, isNew: false, director: "Eleanor Whitmore", cast: ["James Ashcroft", "Priya Nair", "Tom Bellamy"], palette: 5 },
  { id: 7, title: "Gió Qua Miền Ký Ức", originalTitle: "Winds of Yesterday", year: 2024, rating: 7.9, duration: "112 phút", country: "Vietnam", genres: ["Drama"], quality: ["HD"], description: "Ba chị em trở về căn nhà cổ ở Hội An sau 20 năm xa cách để thực hiện di nguyện của mẹ. Những cơn gió mùa thổi qua phố cổ dần hé lộ bí mật khiến gia đình họ ly tán năm xưa.", trailerUrl: vid(5), videoUrl: vid(1), type: "movie", featured: false, isNew: false, director: "Lương Thu Trang", cast: ["Hồng Ánh", "Kaity Nguyễn", "Thanh Trúc"], palette: 6 },
  { id: 8, title: "Quantum Café", originalTitle: "Quantum Café", year: 2026, rating: 8.1, duration: "96 phút", country: "USA", genres: ["Comedy", "Sci-Fi"], quality: ["HD", "4K"], description: "Quán cà phê nhỏ ở Brooklyn có chiếc máy pha espresso vô tình mở cổng đến các vũ trụ song song. Mỗi ly cà phê là một phiên bản khác của chính bạn ghé thăm.", trailerUrl: vid(5), videoUrl: vid(2), type: "movie", featured: false, isNew: true, director: "Marcus Feld", cast: ["Zoe Tran", "Adam Kowalski", "Nina Deveraux"], palette: 7 },
  { id: 9, title: "Hàn Giang Truy Kích", originalTitle: "한강 추격전", year: 2025, rating: 8.6, duration: "134 phút", country: "Korea", genres: ["Thriller", "Crime"], quality: ["HD", "4K"], description: "Nữ thanh tra Seo Yeon-woo có 24 giờ để truy tìm kẻ bắt cóc dọc sông Hàn trước khi thủy triều dâng nhấn chìm mọi chứng cứ — và cả con tin.", trailerUrl: vid(5), videoUrl: vid(3), type: "movie", featured: false, isNew: false, director: "Kim Tae-won", cast: ["Lee Soo-jin", "Jung Hae-min", "Oh Kwang-su"], palette: 8 },
  { id: 10, title: "Tsukimi Diner", originalTitle: "月見食堂", year: 2025, rating: 8.5, duration: "12 tập", country: "Japan", genres: ["Drama", "Family"], quality: ["HD"], description: "Quán ăn khuya nhỏ dưới chân núi Phú Sĩ chỉ mở cửa vào những đêm trăng tròn. Mỗi thực khách mang theo một câu chuyện, và bà chủ quán luôn có món ăn chữa lành dành riêng cho họ.", trailerUrl: vid(5), videoUrl: vid(4), type: "series", featured: false, isNew: false, director: "Haruki Sato", cast: ["Michiko Ando", "Sora Fujimoto", "Ren Ishida"], palette: 9, seasons: [ { season: 1, episodes: 12 } ] },
  { id: 11, title: "Aurora Down", originalTitle: "Aurora Down", year: 2026, rating: 8.3, duration: "121 phút", country: "Norway", genres: ["Thriller", "Mystery"], quality: ["HD", "4K"], description: "Trạm nghiên cứu Bắc Cực mất liên lạc giữa đêm cực quang rực rỡ nhất thập kỷ. Đội cứu hộ đến nơi chỉ tìm thấy 6 chiếc ghế xếp quanh bàn ăn còn nóng — và không một bóng người.", trailerUrl: vid(5), videoUrl: vid(0), type: "movie", featured: false, isNew: true, director: "Ingrid Solberg", cast: ["Erik Nystrøm", "Freya Dahl", "Lars Wenger"], palette: 10 },
  { id: 12, title: "Chú Bé Rồng Giấy", originalTitle: "The Paper Dragon Boy", year: 2025, rating: 8.8, duration: "89 phút", country: "Vietnam", genres: ["Animation", "Family"], quality: ["HD", "4K"], description: "Cậu bé làng nghề Đông Hồ gấp được chú rồng giấy biết bay từ tờ giấy điệp cuối cùng của ông nội. Cả hai bay qua những miền cổ tích Việt Nam để tìm lại sắc màu đã mất của làng tranh.", trailerUrl: vid(5), videoUrl: vid(1), type: "movie", featured: true, isNew: false, director: "Đặng Nhật Linh", cast: ["Gia Khiêm (lồng tiếng)", "NSƯT Thành Lộc (lồng tiếng)"], palette: 11 },
  { id: 13, title: "Crimson Circuit", originalTitle: "Crimson Circuit", year: 2024, rating: 7.8, duration: "116 phút", country: "USA", genres: ["Action", "Thriller"], quality: ["HD"], description: "Tay đua công thức điện bị cấm thi đấu buộc phải tham gia giải đua ngầm xuyên sa mạc Nevada để cứu em gái khỏi tập đoàn cá cược đứng sau mọi đường đua.", trailerUrl: vid(5), videoUrl: vid(2), type: "movie", featured: false, isNew: false, director: "Ray Delgado", cast: ["Chris Vance", "Amara Diallo", "Ken Watabe"], palette: 12 },
  { id: 14, title: "Người Gác Hải Đăng", originalTitle: "The Lighthouse Keeper", year: 2026, rating: 8.0, duration: "108 phút", country: "Vietnam", genres: ["Mystery", "Drama"], quality: ["HD"], description: "Người gác hải đăng cô độc trên đảo Lý Sơn nhận được những bức thư không người gửi, mỗi bức tiên đoán chính xác một con tàu sắp gặp nạn. Bức thư thứ bảy viết về chính con tàu chở con gái ông.", trailerUrl: vid(5), videoUrl: vid(3), type: "movie", featured: false, isNew: true, director: "Phan Đăng Khoa", cast: ["Quang Tuấn", "Ngô Lan Hương", "Hứa Vĩ Văn"], palette: 13 },
  { id: 15, title: "Dodam Village", originalTitle: "도담 마을", year: 2025, rating: 8.4, duration: "10 tập", country: "Korea", genres: ["Comedy", "Romance"], quality: ["HD"], description: "Nữ CEO startup kiệt sức về ngôi làng ven biển thừa kế quán tạp hóa của bà ngoại, nơi cô liên tục đụng độ anh trưởng thôn khó tính — người hóa ra là mối tình đầu thời cấp ba.", trailerUrl: vid(5), videoUrl: vid(4), type: "series", featured: false, isNew: false, director: "Shin Ha-eun", cast: ["Bae Su-min", "Ryu Jun-ho", "Kim Ok-bun"], palette: 14, seasons: [ { season: 1, episodes: 10 } ] },
  { id: 16, title: "Kaiju Kindergarten", originalTitle: "怪獣幼稚園", year: 2026, rating: 8.2, duration: "92 phút", country: "Japan", genres: ["Animation", "Comedy"], quality: ["HD", "4K"], description: "Trường mẫu giáo duy nhất ở Nhật dành cho quái vật kaiju con. Cô giáo mới toanh phải học cách dỗ dành những em bé cao 3 mét biết phun lửa mỗi khi khóc nhè.", trailerUrl: vid(5), videoUrl: vid(0), type: "movie", featured: false, isNew: true, director: "Taro Kimura", cast: ["Aya Shibata (lồng tiếng)", "Goro Tanaka (lồng tiếng)"], palette: 15 },
  { id: 17, title: "Static Bloom", originalTitle: "Static Bloom", year: 2024, rating: 7.6, duration: "103 phút", country: "USA", genres: ["Horror", "Mystery"], quality: ["HD"], description: "Sau cơn bão từ, mọi màn hình trong thị trấn Milfield chỉ phát một khu vườn tĩnh lặng. Những ai nhìn quá lâu bắt đầu mơ thấy mình đang đứng giữa khu vườn ấy — và có người không tỉnh lại.", trailerUrl: vid(5), videoUrl: vid(1), type: "movie", featured: false, isNew: false, director: "Hannah Voss", cast: ["Liam Porter", "Dana Reyes", "Miles Chen"], palette: 16 },
  { id: 18, title: "Vũ Điệu Mưa Rào", originalTitle: "Dancing in the Rain", year: 2025, rating: 7.7, duration: "101 phút", country: "Vietnam", genres: ["Romance", "Comedy"], quality: ["HD"], description: "Anh chàng kỹ sư thời tiết cứng nhắc cá cược với cô vũ công đường phố rằng anh có thể dự đoán chính xác mọi cơn mưa Sài Gòn. Phần thưởng: một điệu nhảy dưới mưa — thứ anh sợ nhất đời.", trailerUrl: vid(5), videoUrl: vid(2), type: "movie", featured: false, isNew: false, director: "Nguyễn Khánh Hòa", cast: ["Trần Ngọc Vàng", "Amee", "Lê Giang"], palette: 17 },
  { id: 19, title: "The Silent Meridian", originalTitle: "The Silent Meridian", year: 2024, rating: 8.5, duration: "138 phút", country: "France", genres: ["Drama"], quality: ["HD", "4K"], description: "Nữ nhiếp ảnh gia chiến trường giải nghệ đi bộ dọc kinh tuyến gốc từ Bắc xuống Nam, chụp lại 100 con người sống lặng lẽ trên đường ranh vô hình chia đôi thế giới.", trailerUrl: vid(5), videoUrl: vid(3), type: "movie", featured: false, isNew: false, director: "Céline Marchand", cast: ["Isabelle Fournier", "Kwame Mensah", "Elena Petrova"], palette: 18 },
  { id: 20, title: "Hyperlane", originalTitle: "Hyperlane", year: 2026, rating: 9.0, duration: "6 tập", country: "USA", genres: ["Sci-Fi", "Thriller"], quality: ["HD", "4K"], description: "Tuyến tàu siêu tốc xuyên lục địa đầu tiên khởi hành với 800 hành khách. Ở tốc độ 2.000 km/h, một hành khách biến mất khỏi toa tàu kín — và camera ghi lại anh ta vẫn đang ngồi đó.", trailerUrl: vid(5), videoUrl: vid(4), type: "series", featured: true, isNew: true, director: "Ava DuMont", cast: ["Oscar Reid", "Sanaa Whitfield", "Jun Park"], palette: 19, seasons: [ { season: 1, episodes: 6 } ] },
  { id: 21, title: "Bếp Nhà Ngoại", originalTitle: "Grandma's Kitchen", year: 2025, rating: 8.3, duration: "95 phút", country: "Vietnam", genres: ["Family", "Drama"], quality: ["HD"], description: "Đầu bếp nhà hàng Michelin trở về Cần Thơ chăm bà ngoại bị lẫn, người chỉ còn nhớ được các công thức nấu ăn. Mỗi món ăn họ nấu cùng nhau đánh thức một mảnh ký ức gia đình.", trailerUrl: vid(5), videoUrl: vid(0), type: "movie", featured: false, isNew: false, director: "Huỳnh Tuấn Anh", cast: ["NSND Kim Xuân", "Liên Bỉnh Phát", "Oanh Kiều"], palette: 20 },
  { id: 22, title: "Moonrise Heist", originalTitle: "문라이즈 하이스트", year: 2026, rating: 8.1, duration: "125 phút", country: "Korea", genres: ["Crime", "Comedy"], quality: ["HD", "4K"], description: "Băng trộm nghiệp dư gồm ông chú tiệm gà rán, bà thím tiệm giặt và cậu sinh viên thất nghiệp lên kế hoạch trộm viên ngọc trăng — mà không biết ba băng trộm chuyên nghiệp khác cũng chọn đúng đêm đó.", trailerUrl: vid(5), videoUrl: vid(1), type: "movie", featured: false, isNew: true, director: "Lee Chang-min", cast: ["Song Dae-ho", "Park Mi-ran", "Ahn Woo-jin"], palette: 21 },
  { id: 23, title: "Paper Planets", originalTitle: "紙の惑星", year: 2024, rating: 8.6, duration: "104 phút", country: "Japan", genres: ["Animation", "Adventure"], quality: ["HD", "4K"], description: "Hai anh em gấp những hành tinh bằng giấy origami và thả lên trời mỗi đêm. Một đêm nọ, các hành tinh giấy không rơi xuống nữa — chúng bắt đầu quay quanh thị trấn như một hệ mặt trời tí hon.", trailerUrl: vid(5), videoUrl: vid(2), type: "movie", featured: false, isNew: false, director: "Yuki Hoshino", cast: ["Kaito Suzuki (lồng tiếng)", "Mei Okada (lồng tiếng)"], palette: 22 },
  { id: 24, title: "Emberfall", originalTitle: "Emberfall", year: 2026, rating: 8.7, duration: "149 phút", country: "USA", genres: ["Fantasy", "Adventure"], quality: ["HD", "4K"], description: "Khi tro tàn từ ngọn núi lửa cổ bắt đầu rơi như tuyết, cô thợ rèn cuối cùng của vương quốc phát hiện mỗi bông tro chứa một tia lửa của con rồng đã ngủ say ngàn năm dưới lòng đất.", trailerUrl: vid(5), videoUrl: vid(3), type: "movie", featured: true, isNew: true, director: "Nathaniel Cross", cast: ["Saoirse Bell", "Idris Kane", "Lucia Moreno"], palette: 23 }
];

/* ---------- Bảng màu aurora cho poster tự sinh ---------- */
const ART_PALETTES = [
  ["#7f1d3a", "#3b1d5e", "#0e7490"], ["#1e3a8a", "#7c3aed", "#0891b2"],
  ["#065f46", "#0e7490", "#1e40af"], ["#7f1d1d", "#9d174d", "#312e81"],
  ["#be185d", "#7c3aed", "#1d4ed8"], ["#92400e", "#7f1d3a", "#1e3a8a"],
  ["#3f6212", "#065f46", "#155e75"], ["#6d28d9", "#be185d", "#c2410c"],
  ["#0f172a", "#334155", "#0e7490"], ["#831843", "#4c1d95", "#075985"],
  ["#064e3b", "#155e75", "#4c1d95"], ["#b45309", "#be123c", "#6d28d9"],
  ["#991b1b", "#7f1d3a", "#18181b"], ["#0c4a6e", "#164e63", "#1e1b4b"],
  ["#9d174d", "#c2410c", "#854d0e"], ["#4d7c0f", "#0d9488", "#2563eb"],
  ["#18181b", "#3f3f46", "#7f1d3a"], ["#0369a1", "#7c3aed", "#db2777"],
  ["#44403c", "#78716c", "#1c1917"], ["#1e1b4b", "#312e81", "#0e7490"],
  ["#78350f", "#92400e", "#365314"], ["#1e40af", "#eab308", "#0f172a"],
  ["#5b21b6", "#0891b2", "#f472b6"], ["#7c2d12", "#b91c1c", "#450a0a"]
];

/* ---------- Sinh poster / backdrop SVG data-URI ---------- */
const Art = (() => {
  const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  // Pseudo-random ổn định theo seed để mỗi phim có bố cục riêng
  const rand = seed => { let x = Math.sin(seed * 9301 + 49297) * 233280; return x - Math.floor(x); };

  function svg(movie, w, h, isBackdrop) {
    const p = ART_PALETTES[(movie.palette ?? movie.id) % ART_PALETTES.length];
    const id = movie.id || 1;
    const blobs = [];
    for (let i = 0; i < 4; i++) {
      const cx = rand(id * 7 + i) * w, cy = rand(id * 13 + i) * h;
      const r = (0.35 + rand(id * 3 + i) * 0.4) * Math.min(w, h);
      blobs.push(`<circle cx="${cx.toFixed(0)}" cy="${cy.toFixed(0)}" r="${r.toFixed(0)}" fill="${p[i % 3]}" opacity="0.55"/>`);
    }
    const title = esc(movie.title || "");
    const fs = isBackdrop ? 64 : Math.max(30, 52 - title.length);
    const words = title.split(" ");
    // ngắt dòng cho poster dọc
    const lines = []; let cur = "";
    const maxChar = isBackdrop ? 26 : 13;
    for (const wd of words) { if ((cur + " " + wd).trim().length > maxChar && cur) { lines.push(cur); cur = wd; } else cur = (cur + " " + wd).trim(); }
    if (cur) lines.push(cur);
    const textY = isBackdrop ? h * 0.78 : h * 0.72;
    const textEls = lines.map((l, i) =>
      `<text x="${isBackdrop ? 70 : w / 2}" y="${textY + i * (fs * 1.18)}" font-family="Georgia,serif" font-size="${fs}" font-weight="700" fill="#fff" ${isBackdrop ? "" : 'text-anchor="middle"'} opacity="0.96">${esc(l)}</text>`).join("");
    const meta = `<text x="${isBackdrop ? 70 : w / 2}" y="${textY + lines.length * (fs * 1.18) + 8}" font-family="Arial,sans-serif" font-size="${isBackdrop ? 26 : 20}" fill="#ffffffb0" ${isBackdrop ? "" : 'text-anchor="middle"'} letter-spacing="4">${movie.year || ""} · CINEVA</text>`;
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">` +
      `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${p[0]}"/><stop offset="0.55" stop-color="${p[1]}"/><stop offset="1" stop-color="${p[2]}"/></linearGradient>` +
      `<filter id="b"><feGaussianBlur stdDeviation="${isBackdrop ? 90 : 60}"/></filter>` +
      `<linearGradient id="v" x1="0" y1="0" x2="0" y2="1"><stop offset="0.4" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.75"/></linearGradient></defs>` +
      `<rect width="${w}" height="${h}" fill="url(#g)"/><g filter="url(#b)">${blobs.join("")}</g>` +
      `<rect width="${w}" height="${h}" fill="url(#v)"/>` +
      `<circle cx="${w / 2}" cy="${isBackdrop ? h * 0.42 : h * 0.4}" r="${isBackdrop ? 54 : 44}" fill="none" stroke="#ffffff55" stroke-width="2"/>` +
      `<path d="M${w / 2 - (isBackdrop ? 14 : 11)} ${isBackdrop ? h * 0.42 - 20 : h * 0.4 - 16} l${isBackdrop ? 34 : 28} ${isBackdrop ? 20 : 16} l-${isBackdrop ? 34 : 28} ${isBackdrop ? 20 : 16} z" fill="#ffffff88"/>` +
      textEls + meta + `</svg>`;
  }

  const uri = s => "data:image/svg+xml;charset=utf-8," + encodeURIComponent(s);
  return {
    poster: m => (m.poster && !m.poster.startsWith("assets/")) ? m.poster : uri(svg(m, 600, 900, false)),
    backdrop: m => (m.backdrop && !m.backdrop.startsWith("assets/")) ? m.backdrop : uri(svg(m, 1600, 900, true))
  };
})();

/* ---------- FirebaseDB: đồng bộ dữ liệu qua Firebase Realtime Database ---------- */
const FirebaseDB = (() => {
  const BASE = "https://keyb-2f31d-default-rtdb.asia-southeast1.firebasedatabase.app";
  const PATH = "/movies.json";

  async function fetchAll() {
    const res = await fetch(BASE + PATH);
    if (!res.ok) throw new Error(`Firebase fetch error: ${res.status}`);
    const data = await res.json();
    // Firebase RTDB trả về object keyed by id, hoặc null nếu rỗng
    if (!data || typeof data !== "object") return [];
    return Object.values(data);
  }

  async function saveAll(movies) {
    const res = await fetch(BASE + PATH, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(movies)
    });
    if (!res.ok) throw new Error(`Firebase save error: ${res.status}`);
  }

  async function seedIfEmpty() {
    try {
      const existing = await fetchAll();
      if (existing.length === 0) {
        await saveAll(MOVIES_DATA.map(m => ({ ...m })));
        return MOVIES_DATA.map(m => ({ ...m }));
      }
      return existing;
    } catch {
      return null; // fallback
    }
  }

  return { fetchAll, saveAll, seedIfEmpty };
})();

/* ---------- MovieDB: nguồn dữ liệu hợp nhất (Firebase → localStorage → MOVIES_DATA) ---------- */
const MovieDB = (() => {
  const KEY = "cineva_admin_movies";
  let cache = null;
  let firebaseReady = false;

  function overlay() {
    try { return JSON.parse(localStorage.getItem(KEY)) || null; } catch { return null; }
  }

  function saveLocal(list) {
    try { localStorage.setItem(KEY, JSON.stringify(list)); } catch (e) { console.error("Không thể lưu localStorage:", e); }
  }

  async function syncFromFirebase() {
    try {
      const data = await FirebaseDB.seedIfEmpty();
      if (data && data.length > 0) {
        cache = data;
        saveLocal(data);
        firebaseReady = true;
        console.log(`✅ Đã đồng bộ ${data.length} phim từ Firebase`);
        return data;
      }
    } catch (err) {
      console.warn("⚠️ Không kết nối được Firebase, dùng dữ liệu cục bộ:", err.message);
    }
    return null;
  }

  function all() {
    if (cache) return cache;
    const ov = overlay();
    // Nếu có dữ liệu trong localStorage (kể cả mảng rỗng) thì dùng, ngược lại dùng mặc định
    cache = (ov !== null && Array.isArray(ov)) ? ov : MOVIES_DATA.map(m => ({ ...m }));
    return cache;
  }

  function save(list) {
    cache = list;
    saveLocal(list);
    // Đồng bộ lên Firebase (fire-and-forget)
    if (firebaseReady) {
      FirebaseDB.saveAll(list).catch(err => console.warn("Không đồng bộ được Firebase:", err.message));
    }
  }

  // Khởi tạo: đồng bộ từ Firebase
  syncFromFirebase().then(data => {
    if (data) {
      // Cập nhật cache nếu chưa có ai gọi all() trước
      if (!cache) cache = data;
      // Phát sự kiện để các trang đã render cập nhật lại
      document.dispatchEvent(new CustomEvent("movies:synced", { detail: data }));
    }
  });

  return {
    all,
    byId: id => all().find(m => m.id === Number(id)) || null,
    featured: () => all().filter(m => m.featured),
    newest: () => [...all()].sort((a, b) => b.year - a.year || b.id - a.id),
    topRated: () => [...all()].sort((a, b) => b.rating - a.rating),
    popular: () => [...all()].sort((a, b) => (b.rating * 7 + b.year % 100) - (a.rating * 7 + a.year % 100)),
    byGenre: g => all().filter(m => m.genres.includes(g)),
    byCountry: c => all().filter(m => (Array.isArray(c) ? c : [c]).includes(m.country)),
    byType: t => all().filter(m => m.type === t),
    search: q => {
      q = q.trim().toLowerCase();
      if (!q) return [];
      return all().filter(m =>
        m.title.toLowerCase().includes(q) ||
        (m.originalTitle || "").toLowerCase().includes(q) ||
        m.genres.some(g => (GENRE_VI[g] || g).toLowerCase().includes(q) || g.toLowerCase().includes(q)) ||
        String(m.year).includes(q)
      );
    },
    add(movie) {
      const list = all();
      movie.id = Math.max(0, ...list.map(m => m.id)) + 1;
      list.push(movie); save(list); return movie;
    },
    update(id, patch) {
      const list = all();
      const i = list.findIndex(m => m.id === Number(id));
      if (i === -1) return null;
      list[i] = { ...list[i], ...patch }; save(list); return list[i];
    },
    remove(id) {
      save(all().filter(m => m.id !== Number(id)));
    },
    reset() {
      localStorage.removeItem(KEY); cache = null;
    },
    saveData(list) {
      save(list);
    },
    isReady: () => firebaseReady,
    onReady: function(cb) {
      if (firebaseReady) { cb(); return; }
      document.addEventListener("movies:synced", () => cb(), { once: true });
    }
  };
})();

/* ---------- Helpers dùng chung ---------- */
const genreVi = g => GENRE_VI[g] || g;
const countryVi = c => COUNTRY_VI[c] || c;

/* ---------- VideoStore: IndexedDB cho file video upload ---------- */
const VideoStore = (() => {
  const DB_NAME = "cineva_videos";
  const STORE = "videos";
  let db = null;

  function open() {
    return new Promise((resolve, reject) => {
      if (db) return resolve(db);
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = e => {
        const d = e.target.result;
        if (!d.objectStoreNames.contains(STORE)) d.createObjectStore(STORE);
      };
      req.onsuccess = e => { db = e.target.result; resolve(db); };
      req.onerror = () => reject(req.error);
    });
  }

  async function put(key, blob) {
    const d = await open();
    return new Promise((resolve, reject) => {
      const tx = d.transaction(STORE, "readwrite");
      tx.objectStore(STORE).put(blob, String(key));
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async function get(key) {
    const d = await open();
    return new Promise((resolve, reject) => {
      const tx = d.transaction(STORE, "readonly");
      const req = tx.objectStore(STORE).get(String(key));
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  }

  async function remove(key) {
    const d = await open();
    return new Promise((resolve, reject) => {
      const tx = d.transaction(STORE, "readwrite");
      tx.objectStore(STORE).delete(String(key));
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async function getURL(key) {
    const blob = await get(key);
    return blob ? URL.createObjectURL(blob) : null;
  }

  /** Trích xuất khung hình từ video file tại giây thứ 1 (hoặc 10% thời lượng) */
  async function captureFrame(file) {
    return new Promise((resolve, reject) => {
      const video = document.createElement("video");
      video.preload = "metadata";
      video.muted = true;
      video.playsInline = true;
      const url = URL.createObjectURL(file);
      video.src = url;

      video.onloadedmetadata = () => {
        // Seek tới 10% thời lượng hoặc giây thứ 1
        const seekTime = Math.min(1, video.duration * 0.1);
        video.currentTime = seekTime;
      };

      video.onseeked = () => {
        const canvas = document.createElement("canvas");
        canvas.width = 600;
        canvas.height = 900;
        const ctx = canvas.getContext("2d");
        // Tính toán để crop thành tỉ lệ poster 2:3
        const vw = video.videoWidth, vh = video.videoHeight;
        const targetRatio = 2 / 3;
        let sw, sh, sx, sy;
        if (vw / vh > targetRatio) {
          sh = vh;
          sw = vh * targetRatio;
          sx = (vw - sw) / 2;
          sy = 0;
        } else {
          sw = vw;
          sh = vw / targetRatio;
          sx = 0;
          sy = (vh - sh) / 2;
        }
        ctx.drawImage(video, sx, sy, sw, sh, 0, 0, 600, 900);
        canvas.toBlob(blob => {
          URL.revokeObjectURL(url);
          if (blob) resolve(blob);
          else reject(new Error("Không thể tạo ảnh từ video"));
        }, "image/jpeg", 0.85);
      };

      video.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("Không thể đọc file video"));
      };
    });
  }

  return { put, get, remove, getURL, captureFrame };
})();
