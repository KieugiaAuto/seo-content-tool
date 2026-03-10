    // Hàm tự động kiểm tra xem web nào đang được chọn để ẩn/hiện ô Sửa Bài
    function kiemTraWebSuaBai() {
      const website = document.getElementById('website').value;
      const khungSuaBai = document.getElementById('khung-sua-bai');
      const nutSuaBai = document.getElementById('modeUpdate');

      // Nếu chọn 1 trong 2 web Shopee
      if (website === 'shopee' || website === 'shopee2') {
        khungSuaBai.style.display = 'none'; // Giấu ô sửa bài đi
        nutSuaBai.checked = false;          // Tự động bỏ tích (phòng hờ nhân viên đang tích mà chuyển web)
      } else {
        // Nếu là 4 web chính
        khungSuaBai.style.display = 'block'; // Hiện lại bình thường
      }
    }

    // Chạy hàm này 1 lần ngay khi mở file để hệ thống set trạng thái chuẩn từ đầu
    document.addEventListener('DOMContentLoaded', kiemTraWebSuaBai);

    function hienThongBao(text, loai = 'success') {
      let toast = document.getElementById("kg-toast");
      // Tự động tạo thẻ div thông báo nếu chưa có
      if (!toast) {
        toast = document.createElement("div");
        toast.id = "kg-toast";
        document.body.appendChild(toast);
      }
      
      // Cho phép dùng thẻ <br> để xuống dòng
      toast.innerHTML = text;
      
      // Chọn màu nền tùy theo loại thông báo
      if (loai === 'error') {
        toast.style.backgroundColor = "#dc3545"; // Màu đỏ cho lỗi
        toast.style.color = "#fff";
      } else {
        toast.style.backgroundColor = "#28a745"; // Màu xanh cho thành công
        toast.style.color = "#fff";
      }

      toast.className = "show"; // Hiển thị thông báo
      
      // Tự động ẩn đi sau 3.5 giây (để lâu hơn chút cho nhân viên kịp đọc lỗi dài)
      setTimeout(function() {
        toast.className = toast.className.replace("show", "");
      }, 3500);
    }
    // ==========================================
    // HẰNG SỐ CHUNG
    // ==========================================
    const CAR_BRANDS = 'ac|acura|aeolus|alfa_romeo|alpine|aston_martin|audi|bac|bahman|baic|bentley|bmw|bollinger|brilliance|bugatti|buick|byd|cadillac|callaway|carver|chery|chevrolet|chrysler|citroen|cupra|daihatsu|dodge|ds|ferrari|fiat|fisker|ford|geely|genesis|gmc|haval|hino|honda|hummer|hyundai|infiniti|isuzu|jaguar|jeep|kia|lamborghini|land_rover|lexus|lincoln|lotus|lucid|maserati|maybach|mazda|mclaren|mercedes_benz|mg|mini|mitsubishi|nissan|opel|pagani|peugeot|porsche|ram|renault|rivian|rolls_royce|saic|seat|skoda|smart|ssangyong|subaru|suzuki|tesla|toyota|vinfast|volkswagen|volvo|daewoo|mercedes';
    const CAR_BRAND_REGEX_FULL = new RegExp(`(.*?)(${CAR_BRANDS})[\\s-]+([a-zA-Z0-9\\s.]+)(?:\\s+(\\d{4})(?:\\D+(\\d{4}))?)?$`, 'i');
    const CAR_BRAND_REGEX_SIMPLE = new RegExp(`(.*?)(${CAR_BRANDS})[\\s-]+([a-zA-Z0-9\\s.]+)`, 'i');
    const CAR_BRAND_REGEX_WITH_YEARS = new RegExp(`(${CAR_BRANDS})(?:[\\s-]+([a-zA-Z0-9\\s]+?))?(?:[\\s-]*(\\d{4})(?:[\\s-]*(\\d{4}))?)?$`, 'i');

    const API_BASE = "https://script.google.com/macros/s/AKfycbxGQotAz4BAQM12Y9kYBWknA6RoJ7zU0s9AmjWI-sBYKBayxq6EKsywxYOxBWFlcbZazQ/exec";
    const KG_TRACK_SITES = new Set(['kieugiaauto', 'phutunggiare', 'banphutung', 'phutungotokieugia']);
    // Bộ nhớ tạm lưu các mã SKU đã được Google Sheets xác nhận là an toàn trong phiên làm việc
    if (!window.kgSkuCache) window.kgSkuCache = new Set();
    // Các website cần quét kiểm tra trùng mã SKU (Tìm siêu tốc trong Google Sheets)
    const KG_CHECK_SKU_SITES = new Set(['kieugiaauto', 'phutunggiare', 'banphutung', 'phutungotokieugia']);
    const KG_TTL_MS = 365 * 24 * 60 * 60 * 1000;
    const MAX_REROLL = 8;

    const HANG_XE_MAP = {
      ac: ["Ace", "Cobra"], acura: ["ILX", "MDX", "NSX", "RDX", "TLX"], aeolus: ["A30", "A60", "AX7"], alfa_romeo: ["Giulia", "Stelvio", "Tonale"],
      alpine: ["A110"], aston_martin: ["DB11", "DBS", "Vantage", "Valhalla"], audi: ["A3", "A4", "A6", "Q3", "Q5", "Q7", "e-tron"],
      bac: ["Mono"], bahman: ["Faw", "Capra"], baic: ["X55", "BJ40", "Senova", "M50"], bentley: ["Bentayga", "Continental GT", "Flying Spur"],
      bmw: ["3 Series", "5 Series", "7 Series", "X1", "X3", "X5", "i4", "iX"], bollinger: ["B1", "B2"], brilliance: ["V5", "H530"],
      bugatti: ["Chiron", "Divo"], buick: ["Enclave", "Encore", "Envision"], byd: ["F0", "F3", "Dolphin", "Atto 3", "Seal", "Han"],
      cadillac: ["Escalade", "CTS", "XT5", "CT5", "Lyriq"], callaway: ["Corvette C7", "Camaro"], carver: ["One"],
      chery: ["QQ", "Arrizo 3", "Arrizo 5", "Arrizo 6", "Tiggo 2", "Tiggo 3", "Tiggo 4", "Tiggo 5", "Tiggo 7", "Tiggo 8", "Omoda 5"],
      chevrolet: ["Spark", "Aveo", "Cruze", "Lacetti", "Optra", "Captiva", "Orlando", "Colorado", "Trailblazer", "Camaro", "Corvette", "Equinox", "Traverse", "Silverado", "Tahoe", "Suburban"],
      chrysler: ["300", "Pacifica", "Voyager"], citroen: ["C3", "C4", "C5 Aircross", "Berlingo"], cupra: ["Formentor", "Leon", "Born"],
      daihatsu: ["Terios", "Mira"], dodge: ["Challenger", "Charger", "Durango", "Ram"], ds: ["DS3", "DS4", "DS7 Crossback"],
      ferrari: ["488", "812 Superfast", "Portofino", "Roma", "SF90"], fiat: ["500", "Panda", "Tipo"], fisker: ["Ocean"],
      ford: ["Bronco", "Escape", "Explorer", "F-150", "Mustang", "Ranger"], geely: ["Coolray", "Emgrand", "Azkarra", "Tugella"],
      genesis: ["G70", "G80", "GV70", "GV80"], gmc: ["Acadia", "Sierra", "Yukon", "Terrain"], haval: ["H6", "H9", "Jolion"],
      hino: ["300", "500", "700", "Dutro", "XZU", "FG", "FL", "FM", "GH", "SH"], honda: ["Brio", "City", "Civic", "Accord", "CR-V", "HR-V", "BR-V", "Pilot", "Odyssey", "Jazz"],
      hummer: ["H2", "H3", "EV"], hyundai: ["Grand i10", "Accent", "Elantra", "Sonata", "Azera", "i20", "i30", "Creta", "Kona", "Tucson", "Santa Fe", "Palisade", "Stargazer", "Custin", "Staria", "Solati", "County", "Mighty", "Porter H150", "Universe", "Ioniq 5", "Ioniq 6", "Kona Electric"],
      infiniti: ["Q30", "Q50", "Q60", "QX30", "QX50", "QX55", "QX60", "QX70", "QX80"], isuzu: ["D-Max", "MU-X", "N-Series", "F-Series", "Q-Series", "EXZ", "FRR", "FVR", "Giga"],
      jaguar: ["XE", "XF", "XJ", "F-Type", "E-Pace", "F-Pace", "I-Pace"], jeep: ["Cherokee", "Compass", "Grand Cherokee", "Wrangler"],
      kia: ["Morning", "Soluto", "Rio", "Cerato", "K3", "K5", "Optima", "Carens", "Rondo", "Seltos", "Sportage", "Sorento", "Carnival", "Sedona", "Soul", "Spectra"],
      lamborghini: ["Aventador", "Huracan", "Urus"], land_rover: ["Defender", "Discovery", "Discovery Sport", "Range Rover", "Range Rover Sport", "Range Rover Velar", "Range Rover Evoque"],
      lexus: ["ES", "IS", "GS", "LS", "NX", "RX", "GX", "LX", "UX", "RC", "LC"], lincoln: ["Aviator", "Corsair", "Navigator"],
      lotus: ["Emira", "Evora", "Exige"], lucid: ["Air"], maserati: ["Ghibli", "Levante", "Quattroporte"], maybach: ["GLS 600", "S-Class"],
      mazda: ["2", "3", "6", "CX-3", "CX-30", "CX-5", "CX-8", "CX-9", "MX-5", "BT-50"], mclaren: ["570S", "720S", "Artura"],
      mercedes_benz: ["A-Class", "B-Class", "C-Class", "E-Class", "S-Class", "CLA", "CLS", "GLA", "GLB", "GLC", "GLE", "GLS", "G-Class", "V-Class", "Maybach"],
      mg: ["ZS", "HS", "MG5", "MG4 EV", "5"], mini: ["Cooper", "Countryman", "Clubman"],
      mitsubishi: ["Attrage", "Mirage", "Lancer", "Xpander", "Xpander Cross", "Outlander", "Outlander Sport", "Pajero", "Pajero Sport", "Triton", "Zinger"],
      nissan: ["Almera", "Sunny", "Teana", "Navara", "Terra", "X-Trail", "Juke", "Murano", "Patrol", "Livina"],
      opel: ["Astra", "Corsa", "Mokka"], pagani: ["Huayra", "Utopia"], peugeot: ["2008", "3008", "5008", "408"],
      porsche: ["911", "Cayenne", "Macan", "Panamera", "Taycan"], ram: ["1500", "2500", "3500"], renault: ["Captur", "Duster", "Megane", "Talisman"],
      rivian: ["R1S", "R1T"], rolls_royce: ["Cullinan", "Ghost", "Phantom"], saic: ["Maxus", "Roewe"], seat: ["Arona", "Ibiza", "Leon"],
      skoda: ["Kodiaq", "Octavia", "Superb"], smart: ["Fortwo", "Forfour"], ssangyong: ["Korando", "Rexton", "Tivoli"],
      subaru: ["Ascent", "Forester", "Outback", "WRX"], suzuki: ["Ciaz", "Swift", "Ertiga", "XL7", "Vitara", "Carry", "Super Carry Truck", "APV", "Jimny", "500kg", "7chỗ"],
      tesla: ["Model 3", "Model S", "Model X", "Model Y"],
      toyota: ["Vios", "Yaris", "Wigo", "Corolla", "Corolla Altis", "Corolla Cross", "Camry", "Avanza", "Veloz", "Innova", "Innova Cross", "Rush", "Fortuner", "Hilux", "Land Cruiser", "Raize", "RAV4", "Zace"],
      vinfast: ["Fadil", "Lux A2.0", "Lux SA2.0", "VF e34", "VF8", "VF9"], volkswagen: ["Golf", "Passat", "Polo", "Tiguan", "Touareg"],
      volvo: ["S60", "S90", "XC40", "XC60", "XC90"], daewoo: ["Matiz", "Lacetti", "Gentra", "Nubira", "Lanos", "Magnus", "Tosca"]
    };

    function kgFormatHang(str) {
      return (str || '').replace(/_/g, '-').split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
    }

    // ==========================================
    // HÀM TIỆN ÍCH
    // ==========================================
    function removeVietnameseTones(str) {
      return str
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'D');
    }

    function kgNormalizeText(s) {
      return (s || '')
        .toString()
        .replace(/<[^>]*>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase();
    }

    // ===== NEAR DUPLICATE CHECK (Jaccard >= 80%) =====
    function kgTokenize(s) {
      const t = removeVietnameseTones(kgNormalizeText(s))
        .replace(/[^a-z0-9\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      if (!t) return [];
      return t.split(' ').filter(w => w.length >= 2);
    }

    function kgJaccardSim(a, b) {
      const A = new Set(kgTokenize(a));
      const B = new Set(kgTokenize(b));

      if (A.size === 0 || B.size === 0) return 0;

      let inter = 0;
      for (const x of A) if (B.has(x)) inter++;

      const uni = A.size + B.size - inter;
      return uni ? (inter / uni) : 0;
    }

    function kgKeyNormalize(s) {
      return removeVietnameseTones((s || '').toString())
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '')
        .trim();
    }

    function kgMakeProductKey(ten, ma) {
      const sku = kgKeyNormalize(ma);
      if (sku) return `sku__${sku}`;

      const name = kgKeyNormalize(ten);
      return `name__${name}`;
    }

    // ==========================================
    // KẾT NỐI DATABASE GOOGLE SHEETS
    // ==========================================
    if (!window.kgGlobalStore) window.kgGlobalStore = {};

    // Tải lịch sử viết bài từ Sheets (ĐÃ TRANG BỊ CHỐNG CACHE)
    async function loadDataFromSheets() {
      try {
        // Thêm tham số thời gian để ép Google Sheets trả về dữ liệu mới nhất, không dùng đồ cũ
        const response = await fetch(API_BASE + "?nocache=" + Date.now());
        const data = await response.json();

        // Trộn dữ liệu thay vì xóa đè, đảm bảo không quên bài nhân viên vừa copy xong
        for (let pkey in data) {
          if (!window.kgGlobalStore[pkey]) window.kgGlobalStore[pkey] = {};
          for (let site in data[pkey]) {
            if (!window.kgGlobalStore[pkey][site]) {
              window.kgGlobalStore[pkey][site] = data[pkey][site];
            }
          }
        }
        console.log("✅ Đã tải dữ liệu đồng bộ MỚI NHẤT từ Google Sheets!");
      } catch (err) {
        console.error("❌ Lỗi tải dữ liệu mạng:", err);
      }
    }
    loadDataFromSheets(); // Chạy ngay khi bật tool

    function kgLoadDescStore() {
      return window.kgGlobalStore || {};
    }

    // Hàm lưu bài lên Google Sheets (Đã thêm chức năng Gắn tên nhân viên)
    function kgCommitDesc(productKey, website, descHtml) {
      const productName = document.getElementById('ten').value.trim();
      const productCode = document.getElementById('ma').value.trim();
      
      // Lấy tên nhân viên đang đăng nhập từ bộ nhớ
      const employeeName = localStorage.getItem('kg_login_name') || "Không rõ";

      if (!window.kgGlobalStore[productKey]) window.kgGlobalStore[productKey] = {};
      window.kgGlobalStore[productKey][website] = {
        desc: kgNormalizeText(descHtml),
        ts: Date.now()
      };

      fetch(API_BASE, {
        method: 'POST',
        mode: 'no-cors', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productKey: productKey,
          productName: productName,
          productCode: productCode,
          website: website,
          desc: kgNormalizeText(descHtml),
          employeeName: employeeName // Đóng gói tên nhân viên gửi đi
        })
      }).then(() => console.log("☁️ Đã lưu dữ liệu kèm tên nhân viên!"));
    }

    // Hàm check trùng dữ liệu (Thiết Quân Luật tuyệt đối)
    function kgIsDuplicateDesc(productKey, website, descHtml, threshold = 0.8) {
      let store = kgLoadDescStore();
      const used = store[productKey] || {};
      const curN = kgNormalizeText(descHtml);
      const now = Date.now();

      // 1. TRÙNG MÃ TRÊN CÙNG 1 WEB -> KHÓA LUÔN (Độ trễ = 0s)
      if (used[website]) {
        return { duplicate: true, conflictSite: "CHÍNH WEB NÀY! (Mã sản phẩm đã được copy)", similarity: 1, exact: true };
      }

      // 2. CHECK CHÉO CÁC WEB: Tối ưu Delay Tokenize
      let curTokens = null; // Trì hoãn việc băm chữ (tiết kiệm tài nguyên)

      for (const [site, saved] of Object.entries(used)) {
        if (!saved || site === website) continue;
        const ts = (typeof saved === 'object' && saved.ts) ? saved.ts : now; 
        if (now - ts > KG_TTL_MS) continue; 

        const savedDescN = (typeof saved === 'object' && saved.desc) ? saved.desc : String(saved);

        // NẾU GIỐNG HỆT NHAU -> CHẶN LUÔN (Không cần chạy thuật toán Jaccard)
        if (savedDescN === curN) {
          return { duplicate: true, conflictSite: site, similarity: 1, exact: true };
        }

        // CHỈ TÍNH TOÁN % KHI KHÔNG GIỐNG HỆT 100%
        if (!curTokens) curTokens = new Set(kgTokenize(curN));
        const savedTokens = new Set(kgTokenize(savedDescN));

        let inter = 0;
        for (const x of curTokens) if (savedTokens.has(x)) inter++;
        const sim = inter / (curTokens.size + savedTokens.size - inter);

        if (sim >= threshold) {
          return { duplicate: true, conflictSite: site, similarity: sim, exact: false };
        }
      }

      return { duplicate: false, similarity: 0, exact: false };
    }

// ==========================================
    // CÁC HÀM XỬ LÝ NỘI DUNG
    // ==========================================

    /// 1. HÀM GỌI GEMINI: ÉP LOGIC SEO VÀ TIÊU ĐỀ CHO TỪNG WEB (Đã xóa Thương hiệu & Xuất xứ khỏi Prompt)
    async function layGioiThieuTuGemini(ten, thuonghieu, xuatxu, website, ma, hang, dong, dateText, h1Text) {
      let yeuCau = "";
      let tenXe = `${hang} ${dong}`.trim();
      let doiXe = dateText ? dateText.trim() : "";

      // Phân luồng AI viết bài theo đúng logic SEO của bác
      switch (website) {
        case 'kieugiaauto':
          yeuCau = `
          - Mở đầu đoạn văn bằng cụm từ: "${h1Text} là..."
          - Logic 1: Giải thích công dụng phụ tùng (ví dụ: bảo vệ khu vực cản trước, hấp thụ lực).
          - Logic 2: Nêu dấu hiệu cần thay (nứt, vỡ, biến dạng do va chạm thì nên kiểm tra/thay thế kịp thời).
          - Logic 3: Nhấn mạnh sự tương thích với xe ${tenXe}, giúp lắp đặt chính xác và đồng bộ.`;
          break;
        case 'phutunggiare':
          yeuCau = `
          - Mở đầu đoạn văn bằng cụm từ: "${h1Text} là..."
          - Logic 1: Nêu công dụng hoàn thiện và bảo vệ của phụ tùng.
          - Logic 2: Nhấn mạnh sự tương thích với ${tenXe}, lắp đặt vừa vặn, hoạt động ổn định.
          - Logic 3: Khẳng định việc thay thế đúng mã giúp quá trình sửa chữa nhanh chóng và tiết kiệm chi phí hợp lý.`;
          break;
        case 'banphutung':
          yeuCau = `
          - Mở đầu đoạn văn bằng cụm từ: "${h1Text} là..."
          - Logic 1: Nêu vai trò phụ tùng (hoàn thiện, bảo vệ xe).
          - Logic 2: Nhấn mạnh sản phẩm sản xuất chuẩn kích thước thông số lắp đặt của ${tenXe}.
          - Logic 3: Khẳng định đây là phụ tùng thường được các gara lựa chọn để sửa chữa, phục hồi.`;
          break;
        case 'phutungotokieugia':
          yeuCau = `
          - Mở đầu đoạn văn bằng cụm từ: "${h1Text} là..."
          - Logic 1: Giới thiệu chi tiết nằm ở đâu, bảo vệ xe thế nào.
          - Logic 2: Nêu khi nào cần thay thế (nứt, vỡ, cong do va chạm) để đảm bảo an toàn, thẩm mỹ.
          - Logic 3: Nhấn mạnh tương thích chính xác với ${tenXe} đời ${doiXe}.`;
          break;
        case 'shopee':
        case 'shopee2':
          yeuCau = `
          - Mở đầu đoạn văn bằng cụm từ: "${h1Text} là..."
          - Giới thiệu phụ tùng chất lượng, dễ lắp ráp.
          - Nhấn mạnh sự vận hành ổn định và độ bền cao cho xe ${tenXe}.`;
          break;
        default:
          yeuCau = `Viết tự nhiên, mở đầu bằng "${h1Text} là..."`;
      }

      // ĐÃ XÓA DÒNG THƯƠNG HIỆU & XUẤT XỨ Ở ĐÂY
      const prompt = `Bạn là chuyên gia bán phụ tùng ô tô. Viết 1 đoạn văn ngắn (khoảng 3 câu hoàn chỉnh) để giới thiệu sản phẩm.
      
      YÊU CẦU BẮT BUỘC VỀ LOGIC (Phải tuân thủ tuyệt đối):
      ${yeuCau}

      LƯU Ý KỸ THUẬT QUAN TRỌNG:
      - Trả về 1 đoạn văn bản trơn liền mạch. Không xuống dòng.
      - Tuyệt đối KHÔNG dùng các ký tự đánh dấu (như *, #, -, <, >).
      - Không viết thêm bất kỳ tiêu đề nào. Phải viết câu trọn vẹn.`;
      
      try {
        const res = await fetch(API_BASE, {
          method: 'POST',
          body: JSON.stringify({ action: 'gemini', prompt: prompt })
        });
        const data = await res.json();
        if (data.status === "success" && data.moTa) {
          // Xóa dọn các ký tự < > (nếu AI lỡ tạo ra) để tránh lỗi đứt đoạn HTML
          return data.moTa.replace(/</g, "").replace(/>/g, "").trim();
        }
      } catch (err) {
        console.error('Lỗi gọi Gemini:', err);
      }
      return `${h1Text} là phụ tùng chất lượng cao, đảm bảo hiệu suất vận hành ổn định.`;
    }

    // 2. SỬA HÀM TẠO MÔ TẢ: Xóa moTaMau, dùng full sức mạnh Gemini + Giữ nguyên chèn link SEO
   // 2. SỬA HÀM TẠO MÔ TẢ: Xóa moTaMau, dùng full sức mạnh Gemini + Giữ nguyên chèn link SEO
    // Đã thêm h1Text vào tham số hàm
    async function sinhMoTaTuDong(ten, thuonghieu, xuatxu, ma, h1Text) {
      const website = document.getElementById('website').value;
      let hang = thuonghieu || '';
      let dong = '';
      let dateText = '';

      // Logic phân tích tên xe để lấy Đời, Dòng, Hãng
      const match = ten.match(CAR_BRAND_REGEX_FULL);
      if (match) {
        hang = kgFormatHang(match[2]);
        dong = match[3].trim();
        const nam1 = match[4] || '';
        const nam2 = match[5] || '';
        // Căn chỉnh lại dateText cho Gemini dễ đọc (vd: 2015-2017)
        dateText = nam1 ? (nam2 ? `${nam1}-${nam2}` : `${nam1}`) : '';
      } else {
        hang = thuonghieu;
        dong = ten.replace(hang, '').trim(); 
      }

      // Nhờ Gemini viết đoạn giới thiệu chuẩn theo ý đồ của từng web
      // Đã nạp thêm h1Text vào cuối dòng này để AI nhận diện được tiêu đề
      let moTa = await layGioiThieuTuGemini(ten, thuonghieu, xuatxu, website, ma, hang, dong, dateText, h1Text);

      // Vẫn GIỮ NGUYÊN logic chèn link nội bộ cực xịn của bác
      if (website === 'kieugiaauto' || website === 'phutungotokieugia') {
        const linkTrangChu = website === 'kieugiaauto' ? 'https://kieugiaauto.vn' : 'https://phutungotokieugia.vn';
        if (hang) {
          const hangRegex = new RegExp(`\\b${hang.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b(?![^<]*>)`, 'gi');
          moTa = moTa.replace(hangRegex, `<a href="${linkTrangChu}/${hang.toLowerCase().replace(/\s+/g, '-')}" target="_blank">${hang}</a>`);
        }
      }

      return `<p>${moTa}</p>`;
    }

    function sinhDanhSachXe(ten, thuonghieu, isShopee = false) {
      if (!isShopee) return '';
      if (!ten || !thuonghieu) return `<h3>Phù hợp với các dòng xe:</h3><p>Tương thích với các dòng xe thuộc thương hiệu ${thuonghieu}</p>`;

      ten = ten.toLowerCase();
      const match = ten.match(CAR_BRAND_REGEX_WITH_YEARS);
      if (match) {
        const hang = kgFormatHang(match[1]);
        const dong = match[2] ? match[2].trim().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ') : '';
        const nam1 = match[3] || '';
        const nam2 = match[4] || '';

        if (nam1 && nam2) {
          const list = [];
          for (let y = parseInt(nam1); y <= parseInt(nam2); y++) { list.push(`${hang} ${dong} ${y}`); }
          return `<h3>Phù hợp với các dòng xe:</h3><p>${list.join(', ')}</p>`;
        } else if (nam1) {
          return `<h3>Phù hợp với các dòng xe:</h3><p>${hang} ${dong} ${nam1}</p>`;
        } else {
          return `<h3>Phù hợp với các dòng xe:</h3><p>${dong ? `${hang} ${dong}` : hang}</p>`;
        }
      }

      const hangOnly = Object.keys(HANG_XE_MAP).find(h => ten.includes(h));
      if (hangOnly) {
        const dongXeList = HANG_XE_MAP[hangOnly].slice().sort((a, b) => b.length - a.length);
        const dongXe = dongXeList.find(dong => {
          const pattern = dong.toLowerCase().replace(/\s+/g, '\\s+');
          const regex = new RegExp(pattern, 'i');
          return regex.test(ten);
        });

        const hangUc = kgFormatHang(hangOnly);

        if (dongXe) {
          const matchedDong = ten.match(new RegExp(dongXe.toLowerCase().replace(/\s+/g, '\\s*'), 'i'));
          const finalDong = matchedDong
            ? matchedDong[0].split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')
            : dongXe;
          return `<h3>Phù hợp với các dòng xe:</h3><p>${hangUc} ${finalDong}</p>`;
        }
        return `<h3>Phù hợp với các dòng xe:</h3><p>${hangUc}</p>`;
      }
      return `<h3>Phù hợp với các dòng xe:</h3><p>Tương thích với các dòng xe thuộc thương hiệu ${thuonghieu}</p>`;
    }

    // Kiểm tra sản phẩm đã tồn tại trên website WordPress chưa (qua Google Apps Script)
    async function kgCheckProductOnWebsite(website, ma, ten) {
      if (!KG_CHECK_SKU_SITES.has(website)) return false;
      try {
        const url = API_BASE + '?action=checkProduct&website=' + encodeURIComponent(website) +
          '&ma=' + encodeURIComponent(ma || '') + '&ten=' + encodeURIComponent(ten || '');
        const res = await fetch(url);
        const data = await res.json();
        return !!data.exists;
      } catch (err) {
        console.error('Lỗi kiểm tra sản phẩm trên website:', err);
        return false; // Lỗi mạng -> cho phép copy (tránh chặn oan)
      }
    }

    function kgGuardCopy(copyButton, opts = {}) {
      const { silent = false, threshold = 0.65 } = opts;
      const website = copyButton.dataset.website || document.getElementById('website').value;
      const ten = (document.getElementById('ten')?.value || '').trim();
      const ma  = (document.getElementById('ma')?.value || '').trim();
      const pkey = copyButton.dataset.productKey || kgMakeProductKey(ten, ma);

      const descRaw = copyButton.dataset.descHtml || '';
      // Trả về false luôn nếu thiếu thông tin hoặc web không cần track
      if (!pkey || !descRaw || !KG_TRACK_SITES.has(website)) return { guarded: false };

      const dup = kgIsDuplicateDesc(pkey, website, descRaw, threshold);
      const isUpdate = document.getElementById('modeUpdate') && document.getElementById('modeUpdate').checked;

      if (dup.duplicate && !isUpdate) {
        if (!silent) {
          alert(`❌ Mô tả trùng/gần trùng (${Math.round(dup.similarity * 100)}%) với web "${dup.conflictSite}".\nKhông cho copy. Bấm "Tạo nội dung" lại để ra mô tả khác.`);
        }
        return { guarded: true, dup };
      }

      return { guarded: false };
    }

    // 3. SỬA HÀM TẠO NỘI DUNG: Nâng cấp thành async để chờ AI viết xong
    async function taoNoiDung() {
      const ten = document.getElementById('ten').value.trim();
      const ma = document.getElementById('ma').value.trim();
      const thuonghieu = document.getElementById('thuonghieu').value.trim();
      const xuatxu = document.getElementById('xuatxu').value.trim();
      const website = document.getElementById('website').value;

      if (!ten || !ma || !thuonghieu || !xuatxu) {
        hienThongBao("⚠️ Vui lòng nhập đầy đủ thông tin!", 'error');
        return;
      }

      // Khóa nút tạo nội dung và hiện thông báo
      const btnTao = document.querySelector('button[onclick="taoNoiDung()"]');
      const oldBtnText = btnTao.innerText;
      btnTao.innerText = "⏳ AI đang viết bài...";
      btnTao.disabled = true;
      hienThongBao("⏳ Đang kết nối AI Gemini để viết bài, vui lòng đợi...", "success");

      const yearRegex = /(\d{4})(?:\D+(\d{4}))?$/i;
      const yearMatch = ten.match(yearRegex);

      let tenPhuTung = ten.trim();
      let dateText = ''; 
      let nam1 = '';
      let nam2 = '';

      if (yearMatch) {
        nam1 = yearMatch[1];
        nam2 = yearMatch[2] || '';
        dateText = nam2 ? ` ${nam1}–${nam2}` : ` ${nam1}`;
        tenPhuTung = ten.replace(yearRegex, '').trim().replace(/\s+$/, '');
      }

      const match = tenPhuTung.match(CAR_BRAND_REGEX_SIMPLE);

      let hang = thuonghieu || '';
      let dong = '';

      if (match) {
        hang = kgFormatHang(match[2]);
        dong = match[3].trim();
      } else {
        hang = thuonghieu;
        dong = tenPhuTung.replace(hang, '').trim(); 
      }

      let h1Text = ten; 
      if (website === 'kieugiaauto') {
        h1Text = tenPhuTung.trim(); 
      } else if (website === 'phutunggiare') {
        h1Text = `${tenPhuTung} mã ${ma}`.trim(); 
      } else if (website === 'banphutung') {
        h1Text = `${tenPhuTung} giá tốt`.trim(); 
      } else if (website === 'phutungotokieugia') {
        h1Text = `${tenPhuTung}${dateText}`.trim(); 
      } else if (website === 'shopee' || website === 'shopee2') {
        h1Text = ten; 
      }

     // --- CHỜ GEMINI TRẢ KẾT QUẢ ---
     const moTaTuDong = await sinhMoTaTuDong(ten, thuonghieu, xuatxu, ma, h1Text);
      
      window.__kg_last_auto_desc = {
        productKey: kgMakeProductKey(ten, ma),
        website,
        descHtml: moTaTuDong
      };
      const danhSachXe = sinhDanhSachXe(ten, thuonghieu, website === 'shopee' || website === 'shopee2' || website === 'phutungotokieugia');

      let content = '';
      let copyContent = '';

      // --- BÊN DƯỚI GIỮ NGUYÊN 100% CẤU TRÚC HTML CỦA TỪNG TRANG ---
      if (website === 'kieugiaauto') {
        content = `<h2><strong>${h1Text}</strong></h2>
<p><strong>Mã sản phẩm:</strong> ${ma}</p>
<p><strong>Thương hiệu:</strong> ${thuonghieu}</p>
<p><strong>Xuất xứ:</strong> ${xuatxu}</p>
${moTaTuDong}

<h3>Tầm quan trọng của ${h1Text} đối với xe</h3>
<p>
<strong>Phụ tùng này</strong> là một chi tiết quan trọng trong tổng thể chiếc xe. Bộ phận này chịu trách nhiệm duy trì tính ổn định, đảm bảo sự đồng bộ và bảo vệ các cụm cơ cấu liên quan. Khi chi tiết này ở trạng thái tốt nhất, chiếc xe của bạn sẽ vận hành an toàn, giữ được tính thẩm mỹ và đạt hiệu suất đúng như thiết kế ban đầu.
</p>

<h3>Khi nào cần kiểm tra và thay thế?</h3>
<p>
Trong quá trình sử dụng, các bộ phận trên xe có thể bị xuống cấp do hao mòn tự nhiên, tác động của môi trường, hoặc hư hỏng đột xuất do va chạm. Dù là lỗi cơ khí, điện tử hay tổn hại về mặt ngoại quan, việc bộ phận này không còn giữ được trạng thái nguyên bản đều ảnh hưởng trực tiếp đến trải nghiệm lái và độ an toàn. Khi nhận thấy các dấu hiệu bất thường hoặc hư hại rõ rệt, <strong>${h1Text}</strong> cần được thay thế kịp thời để tránh làm giảm giá trị xe và ảnh hưởng đến các chi tiết liên đới.
</p>

<h3>Tại sao nên chọn mua tại Kiều Gia Auto?</h3>
<ul>
  <li>Sản phẩm được tuyển chọn kỹ lưỡng, độ bền cao, vật liệu chế tạo chuẩn xác.</li>
  <li>Kích thước hình học đồng bộ, lắp ráp vừa vặn, khôi phục hoàn toàn chức năng.</li>
  <li>Đội ngũ kỹ thuật hỗ trợ tư vấn bắt đúng "bệnh", mua đúng hàng.</li>
</ul>

<h4>Chính sách hỗ trợ khách hàng</h4>
<ul>
  <li>Bảo hành lỗi 1 đổi 1 theo đúng quy định của nhà sản xuất.</li>
  <li>Đổi trả trong 7 ngày nếu sản phẩm chưa lắp ráp và còn nguyên vẹn.</li>
</ul>

<p>
📍 <strong>Trụ sở:</strong> Ngõ 84 Kim Ngưu, Hai Bà Trưng, Hà Nội<br>
📞 <strong>Liên hệ tư vấn:</strong> 0914.153.555 – 0924.153.555 – 0898.153.555 – 0378.05.6666
</p>`;
        copyContent = content;

      } else if (website === 'phutungotokieugia') {
        content = `<h2><strong>${h1Text}</strong></h2>
<p><strong>Mã sản phẩm:</strong> ${ma}</p>
<p><strong>Thương hiệu:</strong> ${thuonghieu}</p>
<p><strong>Xuất xứ:</strong> ${xuatxu}</p>
${moTaTuDong}
${danhSachXe}

<h3>Tương thích chuẩn xác theo form xe nguyên bản</h3>
<p>
Sản phẩm <strong>${h1Text}</strong> được sản xuất đúng theo kích thước và thông số của đời xe này. Việc sử dụng phụ tùng chuẩn form giúp quá trình lắp ráp diễn ra nhanh chóng, ăn khớp tuyệt đối với các chi tiết xung quanh mà không cần phải can thiệp hay thay đổi kết cấu nguyên bản của xe.
</p>

<h3>Khôi phục trạng thái hoạt động và thẩm mỹ</h3>
<p>
Trong quá trình sử dụng, các bộ phận trên xe có thể bị hư hỏng do sự cố va chạm, tác động của môi trường hoặc hao mòn tự nhiên theo thời gian. Việc thay mới <strong>${h1Text}</strong> đúng đời xe là giải pháp tối ưu để khôi phục lại chức năng hoạt động, đảm bảo an toàn cũng như duy trì sự đồng bộ và thẩm mỹ cho tổng thể chiếc xe.
</p>

<h3>Ưu điểm khi sử dụng sản phẩm</h3>
<ul>
  <li>Thiết kế đồng bộ hoàn toàn với cấu hình và năm sản xuất của xe.</li>
  <li>Chất liệu đạt chuẩn, đáp ứng tốt các điều kiện vận hành và sử dụng tại Việt Nam.</li>
  <li>Bảo vệ các chi tiết liên quan, giúp xe duy trì tình trạng tốt nhất.</li>
</ul>

<h4>Chính sách bán hàng & Hỗ trợ kỹ thuật</h4>
<ul>
  <li>Tư vấn rõ ràng sự khác biệt giữa các form xe (form cũ / form mới) để tránh mua nhầm.</li>
  <li>Hỗ trợ đổi trả nếu sản phẩm có lỗi từ nhà sản xuất. Giao hàng tận nơi toàn quốc.</li>
</ul>

<p>
📍 <strong>Địa chỉ kho:</strong> Số 84 Ngõ Kim Ngưu, Hai Bà Trưng, Hà Nội<br>
📞 <strong>Hotline tư vấn đời xe & đặt hàng:</strong> 0924.153.555 – 0914.153.555
</p>`;
        copyContent = content;

      } else if (website === 'banphutung') {
        content = `<h2><strong>${h1Text}</strong></h2>
<p><strong>Mã sản phẩm:</strong> ${ma}</p>
<p><strong>Thương hiệu:</strong> ${thuonghieu}</p>
<p><strong>Xuất xứ:</strong> ${xuatxu}</p>

${moTaTuDong}

<h3>Cung ứng sỉ ${h1Text} cho Gara & Trung tâm dịch vụ</h3>
<p>
Trong quá trình tiếp nhận sửa chữa, bảo dưỡng định kỳ hoặc phục hồi xe sau va chạm, <strong>${h1Text}</strong> là hạng mục vật tư đòi hỏi tính chính xác cao về mặt thông số. Chúng tôi cung cấp nguồn hàng ổn định, thiết kế chuẩn O.E.M giúp thợ kỹ thuật thao tác lắp ráp nhanh chóng, hoàn thiện xe cho khách một cách trơn tru mà không tốn thời gian căn chỉnh hay chế cháo lại.
</p>

<h3>Chính sách ưu đãi dành riêng cho thợ và Gara</h3>
<ul>
  <li><strong>Sẵn kho số lượng lớn:</strong> Không để anh em thợ phải chờ đợi, tránh tình trạng xe nằm cầu lâu chiếm diện tích xưởng.</li>
  <li><strong>Giao hàng hỏa tốc:</strong> Ship cực nhanh nội thành Hà Nội, hỗ trợ gửi chành xe hoặc xe khách đi tỉnh ngay trong ngày.</li>
  <li><strong>Chiết khấu linh hoạt:</strong> Báo giá sỉ cạnh tranh cao, tối ưu biên độ lợi nhuận cho các xưởng dịch vụ.</li>
  <li><strong>Hậu mãi rõ ràng:</strong> Hỗ trợ bảo hành nhanh gọn, đối chiếu mã chuẩn xác ngay từ khâu xuất kho.</li>
</ul>

<p>
Quý đối tác cần lấy sỉ <strong>${h1Text}</strong> hoặc nhập hàng định kỳ, vui lòng liên hệ trực tiếp phòng kinh doanh để nhận báo giá tốt nhất hôm nay.
</p>

<p>
📍 <strong>Kho tổng:</strong> 84 Kim Ngưu, Hai Bà Trưng, Hà Nội<br>
📞 <strong>Liên hệ báo giá sỉ & đặt hàng:</strong> 0898.153.555 – 0914.153.555 – 0378.05.6666
</p>`;
        copyContent = content;

      } else if (website === 'phutunggiare') {
        content = `<h2><strong>${h1Text}</strong></h2>
<p><strong>Mã phụ tùng:</strong> ${ma}</p>
<p><strong>Thương hiệu:</strong> ${thuonghieu}</p>
<p><strong>Xuất xứ:</strong> ${xuatxu}</p>

${moTaTuDong}

<h3>Tầm quan trọng của việc thay đúng mã ${ma}</h3>
<p>
Trong quá trình bảo dưỡng và sửa chữa ô tô, việc sử dụng chính xác mã phụ tùng <strong>${ma}</strong> là yếu tố quyết định để đảm bảo sự đồng bộ của toàn bộ hệ thống. <strong>${h1Text}</strong> được sản xuất theo đúng tiêu chuẩn lắp ráp nguyên bản của nhà máy, giúp chi tiết thay thế khớp hoàn toàn với các cơ cấu nguyên bản trên xe.
</p>

<h3>Lợi ích khi sử dụng phụ tùng chuẩn mã</h3>
<ul>
  <li><strong>Lắp ráp chính xác 100%:</strong> Đảm bảo vừa khít vị trí bắt ốc và ngàm giữ, thợ kỹ thuật không cần mất công căn chỉnh hay can thiệp chế cháo.</li>
  <li><strong>Hoạt động ổn định:</strong> Khôi phục đúng chức năng và hiệu suất như thiết kế ban đầu của nhà sản xuất, không báo lỗi hệ thống.</li>
  <li><strong>Tiết kiệm chi phí:</strong> Chọn đúng mã ngay từ đầu giúp rút ngắn thời gian sửa chữa, tránh rủi ro lắp sai làm ảnh hưởng đến các chi tiết liên quan, kết hợp với mức giá luôn cực kỳ cạnh tranh tại hệ thống của chúng tôi.</li>
</ul>

<p>
<strong>Khuyến cáo trước khi mua:</strong> Để chắc chắn 100%, quý khách nên đối chiếu mã số in trên vỏ phụ tùng cũ. Nếu không rõ, quý khách có thể gửi số khung (VIN) để đội ngũ kỹ thuật tra cứu chính xác mã phụ tùng trên phần mềm chuyên dụng trước khi lên đơn.
</p>

<h4>Chính sách hỗ trợ & Giao hàng</h4>
<ul>
  <li>Cam kết đổi trả nhanh chóng nếu sản phẩm gửi đi không đúng với mã <strong>${ma}</strong> đã xác nhận.</li>
  <li>Giao hàng hỏa tốc nội thành, hỗ trợ Ship COD toàn quốc (được kiểm tra đúng mã, đúng hàng trước khi thanh toán).</li>
</ul>

<p>
📍 <strong>Kho phân phối:</strong> Ngõ 84 Kim Ngưu, Hai Bà Trưng, Hà Nội<br>
📞 <strong>Hotline tra mã số VIN & báo giá:</strong> 0378.05.6666 – 0914.153.555
</p>`;
        copyContent = content;
        
      } else if (website === 'shopee') {
        content = `<h2><strong>${ten}</strong></h2>
<p><strong>Mã sản phẩm:</strong> ${ma}</p>
<p><strong>Thương hiệu:</strong> ${thuonghieu}</p>
<p><strong>Xuất xứ:</strong> ${xuatxu}</p>
${moTaTuDong}
${danhSachXe}
<h3>✔️ Kiều Gia Auto - Phụ tùng ô tô chính hãng, giá tốt nhất</h3>
<ul>
  <li>Cung cấp “${ten}” chất lượng vượt trội, giá cả cạnh tranh.</li>
  <li>Khuyên dùng phụ tùng có nguồn gốc rõ ràng để đảm bảo hiệu suất và độ bền.</li>
  <li>Nhập khẩu và phân phối phụ tùng chính hãng tới nhiều gara trên toàn quốc.</li>
  <li>Đội ngũ nhân viên am hiểu kỹ thuật, tư vấn tận tâm, chuyên nghiệp.</li>
</ul>
<h3>✔️ Chính sách bảo hành:</h3>
<ul>
  <li>Bảo hành 1 đổi 1 trong 7 ngày nếu phát hiện lỗi từ nhà sản xuất.</li>
  <li>Sản phẩm được đổi trả trong vòng 7 ngày, với điều kiện còn nguyên vẹn, chưa lắp ráp, không trầy xước, còn nguyên bao bì.</li>
</ul>
<h3>✔️ Lưu ý:</h3>
<ul>
  <li>Khi mở sản phẩm, vui lòng quay video để đảm bảo quyền lợi đổi trả nếu có lỗi từ nhà cung cấp.</li>
  <li>Quý khách vui lòng đánh giá sản phẩm để nhận thêm ưu đãi từ shop!</li>
</ul>
<h3>✔️ Cam kết của Kiều Gia Auto:</h3>
<ul>
  <li>Đội ngũ tư vấn chuyên nghiệp, mang đến trải nghiệm tuyệt vời cho khách hàng.</li>
  <li>Hoàn tiền hoặc đổi sản phẩm mới nếu quý khách không hài lòng vì lỗi sản phẩm.</li>
  <li>Thương hiệu uy tín, đáng tin cậy.</li>
</ul>
<h3>✔️ Đảm bảo từ Kiều Gia Auto:</h3>
<ul>
  <li>Hình ảnh “${ten}” đúng 100% với thực tế.</li>
  <li>Chất lượng sản phẩm đảm bảo tuyệt đối.</li>
  <li>Hỗ trợ đổi trả theo chính sách quy định.</li>
  <li>Giao hàng nhanh chóng trên toàn quốc.</li>
</ul>
<p>Chân thành cảm ơn quý khách đã tin tưởng và đồng hành cùng Kiều Gia Auto!</p>`;
        copyContent = content;

      } else if (website === 'shopee2') {
        content = `<h2>${ten}</h2>
<p><strong>Mã phụ tùng:</strong> ${ma}</p>
<p><strong>Thương hiệu:</strong> ${thuonghieu}</p>
<p><strong>Xuất xứ:</strong> ${xuatxu}</p>
${moTaTuDong}
${danhSachXe}
<p>${ten} là phụ tùng quan trọng giúp xe vận hành ổn định và đảm bảo độ bền trong quá trình sử dụng.</p>

<h3>🔧 Đặc điểm sản phẩm</h3>
<ul>
<li>Thiết kế đúng tiêu chuẩn kỹ thuật của nhà sản xuất.</li>
<li>Độ bền cao, hoạt động ổn định.</li>
<li>Phù hợp lắp đặt cho nhiều dòng xe.</li>
<li>Dễ dàng thay thế tại các gara ô tô.</li>
</ul>

<h3>📦 Chính sách bán hàng</h3>
<ul>
<li>Sản phẩm được kiểm tra trước khi gửi.</li>
<li>Đóng gói cẩn thận khi vận chuyển.</li>
<li>Hỗ trợ đổi trả theo chính sách của sàn.</li>
</ul>

<h3>📌 Lưu ý khi đặt hàng</h3>
<ul>
<li>Vui lòng kiểm tra đúng mã phụ tùng trước khi đặt.</li>
<li>Nếu chưa chắc chắn, hãy liên hệ shop để được tư vấn.</li>
<li>Nên lắp đặt tại gara hoặc thợ kỹ thuật.</li>
</ul>

<p>Cảm ơn quý khách đã quan tâm sản phẩm!</p>`;
        
        let plainMoTaTuDong = moTaTuDong.replace(/<strong>(.*?)<\/strong>/g, '**$1**').replace(/<[^>]+>/g, '');
        let plainDanhSachXe = danhSachXe.replace(/<strong>(.*?)<\/strong>/g, '**$1**').replace(/<[^>]+>/g, '');

        copyContent = `**${ten}**\nMã sản phẩm: ${ma}\nThương hiệu: ${thuonghieu}\nXuất xứ: ${xuatxu}\n\n${plainMoTaTuDong}\n\n${plainDanhSachXe}\n\n**Đặc điểm sản phẩm**\n- Thiết kế đúng tiêu chuẩn kỹ thuật của nhà sản xuất.\n- Độ bền cao, hoạt động ổn định.\n- Phù hợp lắp đặt cho nhiều dòng xe.\n- Dễ dàng thay thế tại các gara ô tô.\n\n**Chính sách bán hàng**\n- Sản phẩm được kiểm tra trước khi gửi.\n- Đóng gói cẩn thận khi vận chuyển.\n- Hỗ trợ đổi trả theo chính sách của sàn.\n\n**Lưu ý khi đặt hàng**\n- Vui lòng kiểm tra đúng mã phụ tùng trước khi đặt.\n- Nếu chưa chắc chắn, hãy liên hệ shop để được tư vấn.\n- Nên lắp đặt tại gara hoặc thợ kỹ thuật.\n\nCảm ơn quý khách đã quan tâm sản phẩm!`;
      }

      content = content.replace(/<li>(.*?)\.\s*<\/li>/g, '<li>$1</li>');
      document.getElementById('preview').innerHTML = content;

      const copyButton = document.getElementById('copyButton');
      copyButton.dataset.content = copyContent;
      copyButton.dataset.productKey = kgMakeProductKey(ten, ma);
      copyButton.dataset.website    = website;
      copyButton.dataset.descHtml   = moTaTuDong || '';

      // Mặc định ẩn nút Copy
      copyButton.style.display = 'none';

      // Kiểm tra trùng nội bộ
      const isUpdate = document.getElementById('modeUpdate') && document.getElementById('modeUpdate').checked;
      const g = kgGuardCopy(copyButton, { silent: true });

      // Logic hiển thị gọn gàng và tự động quét "Log rác"
      if (g.guarded) {
        if (g.dup.conflictSite.includes("CHÍNH WEB NÀY")) {
          hienThongBao(`⏳ Đang đối chiếu kho SKU để xác minh Log...`, 'success');
          kgCheckProductOnWebsite(website, ma, ten).then(existsInSkuTab => {
            if (existsInSkuTab) {
              hienThongBao(`❌ Mã "<b>${ma}</b>" ĐÃ TỒN TẠI trên web ${website} (Đã đối chiếu với kho SKU)`, 'error');
            } else {
              const pkey = copyButton.dataset.productKey;
              if (window.kgGlobalStore[pkey] && window.kgGlobalStore[pkey][website]) {
                delete window.kgGlobalStore[pkey][website]; 
              }
              window.kgSkuCache.add(website + "___" + ma);
              copyButton.style.display = 'block';
              hienThongBao(`⚠️ Phát hiện Log ảo mã "<b>${ma}</b>" (do ai đó copy nhưng quên đăng). Đã mở khóa, bạn có thể Copy đè!`, 'success');
            }
          });
        } else {
          hienThongBao(`❌ Nội dung mô tả bị trùng lặp với web <b>${g.dup.conflictSite}</b>!<br>Bấm "Tạo nội dung" lại để ra câu chữ khác.`, 'error');
        }
      } else {
        if (KG_CHECK_SKU_SITES.has(website) && !isUpdate) {
          const cacheKey = website + "___" + ma;
          if (window.kgSkuCache.has(cacheKey)) {
            copyButton.style.display = 'block';
          } else {
            kgCheckProductOnWebsite(website, ma, ten).then(exists => {
              if (!exists) {
                window.kgSkuCache.add(cacheKey);
                copyButton.style.display = 'block'; 
              } else {
                hienThongBao(`❌ Mã "<b>${ma}</b>" ĐÃ TỒN TẠI trên web ${website}`, 'error');
              }
            });
          }
        } else {
          copyButton.style.display = 'block'; 
        }
      }

      // Mở khóa lại nút bấm sau khi AI viết xong và mọi check logic đã hoàn tất
      btnTao.innerText = "Tạo nội dung";
      btnTao.disabled = false;
      hienThongBao("✅ Đã tạo nội dung thành công!", "success");
    }
    // =========================
    // HÀM SAO CHÉP VÀ GHI DATABASE
    // =========================
    async function saoChepNoiDung() {
      const copyButton = document.getElementById('copyButton');

      const g = kgGuardCopy(copyButton, { silent: false });
      if (g.guarded) return;

      const website = copyButton.dataset.website || document.getElementById('website').value;
      const ten = (document.getElementById('ten')?.value || '').trim();
      const ma = (document.getElementById('ma')?.value || '').trim();

      // Đã xóa bỏ phần kiểm tra (await kgCheckProductOnWebsite) gây chậm ở đây
      // Vì đã được kiểm tra từ lúc ấn "Tạo nội dung" rồi

      let content = copyButton.dataset.content;

      if (!content) {
        alert('Chưa có nội dung để sao chép! Vui lòng tạo nội dung trước.');
        return;
      }

      if (KG_TRACK_SITES.has(website)) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(content, 'text/html');

        const removeEmptyNodes = (node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            if (['P', 'DIV', 'UL', 'LI'].includes(node.tagName)
              && !node.textContent.trim()
              && !node.querySelector('a, strong, em')) {
              node.remove();
              return;
            }
            Array.from(node.childNodes).forEach(removeEmptyNodes);
          }
        };
        removeEmptyNodes(doc.body);
        content = doc.body.innerHTML.trim().replace(/\n\s*\n/g, '\n').replace(/\s+$/gm, '');
      } else {
        content = content.trim().replace(/\n\s*\n/g, '\n').replace(/\s+$/gm, '');
      }

      const commitAfterCopy = () => {
        // Bỏ lệnh kiểm tra, LUÔN LUÔN lưu lịch sử lên Google Sheets cho TẤT CẢ website (bao gồm cả Shopee)
        const pkey = copyButton.dataset.productKey;
        const desc = copyButton.dataset.descHtml;
        if (pkey && desc) kgCommitDesc(pkey, website, desc); // Gọi hàm lưu lên Sheets
        
        // Gọi thông báo đẹp thay vì dùng alert
        hienThongBao('✅ Đã sao chép nội dung thành công!');
        copyButton.style.display = 'none';
      };

      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(content)
          .then(commitAfterCopy)
          .catch(err => {
            console.error('Lỗi sao chép clipboard:', err);
            if (fallbackCopy(content)) commitAfterCopy();
          });
      } else {
        if (fallbackCopy(content)) commitAfterCopy();
      }
    }

    function fallbackCopy(text) {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();

      try {
        const ok = document.execCommand('copy');
        if (!ok) alert('Không thể sao chép! Vui lòng thử lại hoặc sao chép thủ công.');
        return ok;
      } catch (err) {
        console.error('Lỗi sao chép dự phòng:', err);
        alert('Không thể sao chép! Vui lòng thử lại hoặc sao chép thủ công.');
        return false;
      } finally {
        document.body.removeChild(textArea);
      }
    }
    // =========================
    // HÀM XỬ LÝ ĐĂNG NHẬP
    // =========================
    async function xuLyDangNhap() {
      const user = document.getElementById('username').value.trim().toLowerCase();
      const pass = document.getElementById('password').value.trim();
      const btn = document.getElementById('btnLogin');
      const errorMsg = document.getElementById('login-error');

      if (!user || !pass) {
        errorMsg.innerText = "Vui lòng nhập đủ tài khoản và mật khẩu!";
        errorMsg.style.display = 'block';
        return;
      }

      btn.innerText = "Đang kiểm tra...";
      errorMsg.style.display = 'none';
      
      try {
        const response = await fetch(API_BASE + `?action=login&user=${encodeURIComponent(user)}&pass=${encodeURIComponent(pass)}`);
        const data = await response.json();

        if (data.status === "success") {
          document.getElementById('login-screen').style.display = 'none';
          document.getElementById('main-app').style.display = 'block';
          
          // NÂNG CẤP: Lưu trạng thái đăng nhập gắn với NGÀY HÔM NAY
          const homNay = new Date().toDateString();
          localStorage.setItem('kg_login_date', homNay);
          localStorage.setItem('kg_login_name', data.name);
          
          alert('Xin chào: ' + data.name);
        } else {
          errorMsg.innerText = "Sai tài khoản hoặc mật khẩu!";
          errorMsg.style.display = 'block';
          btn.innerText = "Đăng nhập";
        }
      } catch (err) {
        console.error("Lỗi đăng nhập:", err);
        errorMsg.innerText = "Lỗi hệ thống! Vui lòng báo quản lý kiểm tra lại link API.";
        errorMsg.style.display = 'block';
        btn.innerText = "Đăng nhập";
      }
    }

    // NÂNG CẤP: Tự động mở khóa nếu ngày lưu trữ trùng với NGÀY HÔM NAY
    const homNay = new Date().toDateString();
    if (localStorage.getItem('kg_login_date') === homNay) {
      document.getElementById('login-screen').style.display = 'none';
      document.getElementById('main-app').style.display = 'block';
    }
