function kgLoadDescStore() {
  return window.kgGlobalStore || {};
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

function kgGuardCopy(copyButton, opts = {}) {
  const { silent = false, threshold = 0.65 } = opts;
  const website = copyButton.dataset.website || document.getElementById('website').value;
  const ten = (document.getElementById('ten')?.value || '').trim();
  const ma = (document.getElementById('ma')?.value || '').trim();
  const pkey = copyButton.dataset.productKey || kgMakeProductKey(ten, ma);

  const descRaw = copyButton.dataset.descHtml || '';
  // Trả về false luôn nếu thiếu thông tin hoặc web không cần track
  if (!pkey || !descRaw || !KG_TRACK_SITES.has(website)) return { guarded: false };

  const dup = kgIsDuplicateDesc(pkey, website, descRaw, threshold);
  const isUpdate = document.getElementById('modeUpdate') && document.getElementById('modeUpdate').checked;

  // ĐIỂM SỬA CHỐT HẠ: Nếu nó báo trùng với CHÍNH WEB ĐANG CHỌN -> Mở khóa cho copy luôn, không cần hỏi nhiều!
  if (dup.duplicate && dup.conflictSite && dup.conflictSite.includes("CHÍNH WEB NÀY")) {
    return { guarded: false };
  }

  // CHỈ KHÓA VÀ BÁO LỖI NẾU: Trùng với một web KHÁC (vd: phutunggiare, banphutung...) VÀ không tích ô Sửa bài
  if (dup.duplicate && !isUpdate) {
    if (!silent) {
      alert(`❌ Mô tả trùng/gần trùng (${Math.round(dup.similarity * 100)}%) với web "${dup.conflictSite}".\nKhông cho copy. Bấm "Tạo nội dung" lại để ra mô tả khác.`);
    }
    return { guarded: true, dup };
  }

  return { guarded: false };
}

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
  let moTa = await layGioiThieuTuGemini(ten, thuonghieu, xuatxu, website, ma, hang, dong, dateText, h1Text);

  // Vẫn GIỮ NGUYÊN logic chèn link nội bộ cực xịn
  if (website === 'kieugiaauto' || website === 'phutungotokieugia') {
    const linkTrangChu = website === 'kieugiaauto' ? 'https://kieugiaauto.vn' : 'https://phutungotokieugia.vn';
    if (hang) {
      const hangRegex = new RegExp(`\\b${hang.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b(?![^<]*>)`, 'i');
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
      const year1 = parseInt(nam1);
      const year2 = parseInt(nam2);
      const khoangCach = year2 - year1;

      // Đảm bảo tên xe gọn gàng, không bị dư khoảng trắng
      const tenXeDayDu = `${hang} ${dong}`.trim();

      if (khoangCach <= 3 && khoangCach >= 0) {
        // Dưới hoặc bằng 3 năm (VD: 2007 - 2010): Liệt kê chi tiết
        const list = [];
        for (let y = year1; y <= year2; y++) {
          list.push(`${tenXeDayDu} ${y}`);
        }
        return `<h3>Phù hợp với các dòng xe:</h3><p>${list.join(', ')}</p>`;
      } else if (khoangCach > 3) {
        // Trên 3 năm (VD: 2007 - 2016): Ghi tóm tắt Từ... đến...
        return `<h3>Phù hợp với các dòng xe:</h3><p>Từ ${tenXeDayDu} ${year1} đến ${tenXeDayDu} ${year2}</p>`;
      }
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

// 3. SỬA HÀM TẠO NỘI DUNG: Nâng cấp thành async để chờ AI viết xong
async function taoNoiDung() {
  const ten = document.getElementById('ten').value.trim();
  const ma = document.getElementById('ma').value.trim();
  const thuonghieu = document.getElementById('thuonghieu').value
    .replace(/\s*chính\s+hãng\s*/gi, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
  const xuatxu = document.getElementById('xuatxu').value.trim();
  const website = document.getElementById('website').value;

  if (!ten || !ma || !thuonghieu || !xuatxu) {
    hienThongBao("⚠️ Vui lòng nhập đầy đủ thông tin!", 'error');
    return;
  }

  // ========================================================
  // THÊM ĐOẠN NÀY: DỌN DẸP SẠCH BÀI CŨ NGAY KHI BẤM NÚT TẠO
  // ========================================================
  document.getElementById('preview').innerHTML = '';
  document.getElementById('copyButton').style.display = 'none';
  if (document.getElementById('short-preview')) document.getElementById('short-preview').style.display = 'none';
  if (document.getElementById('copyShortButton')) document.getElementById('copyShortButton').style.display = 'none';
  // ========================================================

  // Khóa nút tạo nội dung 
  const btnTao = document.querySelector('button[onclick="taoNoiDung()"]');
  btnTao.innerText = "⏳ Đang kiểm tra dữ liệu...";
  btnTao.disabled = true;

  const yearRegex = /(\d{4})(?:\D+(\d{4}))?$/i;
  const yearMatch = ten.match(yearRegex);

  let tenPhuTung = ten.trim();
  let dateText = '';
  let nam1 = '';
  let nam2 = '';

  if (yearMatch) {
    nam1 = yearMatch[1];
    nam2 = yearMatch[2] || '';
    dateText = nam2 ? ` ${nam1}-${nam2}` : ` ${nam1}`;
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

  // 1. TẠO H1 & SLUG
  let h1Text = ten;
  let slugGoiY = "";

  // Kiểm tra xem tên sản phẩm có chứa các dấu bọc từ khóa phụ không
  const regexNgoac = /(\(.*?\)|\[.*?\]|".*?"|'.*?'|:.*?:)/g;
  const coNgoac = regexNgoac.test(tenPhuTung);

  // Hàm con siêu ngắn để gọt sạch mọi loại ngoặc và tạo Slug chuẩn
  const taoSlug = (chuoi) => removeVietnameseTones(chuoi.replace(regexNgoac, '')).toLowerCase().replace(/[^a-z0-9\s.-]/g, ' ').trim().replace(/[\s.]+/g, '-').replace(/-+/g, '-').replace(/^-+|-+$/g, '');

  switch (website) {
    case 'kieugiaauto':
      let tenGocKieuGia = tenPhuTung.replace(/chính hãng|oem|cao cấp|nhập khẩu/gi, '').trim();
      let brandLower = thuonghieu.toLowerCase();
      let hangLower = hang.toLowerCase();

      // Không tự gắn nhãn nguồn gốc như "chính hãng"/"OEM" nếu đầu vào không có căn cứ chứng minh
      h1Text = `${tenGocKieuGia} ${dateText}`.replace(/\s+/g, ' ').trim();

      if (coNgoac) slugGoiY = taoSlug(tenGocKieuGia + dateText);
      break;

    case 'phutungotokieugia':
      // Ý tưởng mới: Gắn đuôi "chuẩn form đời xe"
      h1Text = `${tenPhuTung} ${dateText} chuẩn form đời xe`.replace(/\s+/g, ' ').trim();

      if (coNgoac) {
        let dateSlug = dateText ? dateText.trim().replace(/[\s./]+/g, '-') : "";
        slugGoiY = dateSlug ? `${taoSlug(tenPhuTung)}-${dateSlug}-chuan-form` : taoSlug(tenPhuTung);
      }
      break;

    case 'phutunggiare':
      let tenGocGiaRe = tenPhuTung.replace(/(phụ tùng )?thay thế/gi, '').trim();
      // Nhồi mã sản phẩm vào H1 thay vì chữ "phụ tùng thay thế"
      h1Text = `${tenGocGiaRe} ${dateText} mã ${ma}`.replace(/\s+/g, ' ').trim();
      // Đưa mã sản phẩm vào URL (Slug)
      slugGoiY = taoSlug(`${tenGocGiaRe}-${dateText}-ma-${ma}`);
      break;

    case 'banphutung':
      // Ý tưởng mới: Đổi gạch ngang thành " đến " và gắn đuôi "giá tốt"
      let dateTuDen = dateText ? dateText.replace('-', ' đến ') : '';
      h1Text = `${tenPhuTung} ${dateTuDen} giá tốt`.replace(/\s+/g, ' ').trim();

      if (coNgoac) slugGoiY = taoSlug(tenPhuTung + dateText);
      break;

    case 'shopee':
    case 'shopee2':
      h1Text = ten;
      break;
  }

  // Chốt lọc từ/cụm quảng cáo rủi ro trong tiêu đề của 4 website
  if (KG_TRACK_SITES.has(website)) {
    h1Text = kgSanitizeComplianceText(h1Text);
  }

  // ========================================================
  // TỐI ƯU HÓA: CHỈ KIỂM TRA TRÙNG TÊN TRÊN WEB (BỎ LOG TẠM VÀ BỎ MÃ SKU)
  // ========================================================
  const pkey = kgMakeProductKey(ten, ma);
  const cacheKeyName = website + "___name___" + h1Text; // Lưu cache theo đúng tên h1Text của từng web
  const isUpdate = document.getElementById('modeUpdate') && document.getElementById('modeUpdate').checked;
  let moTaTuDong = "";

  if (isUpdate) {
    hienThongBao("🛠 Chế độ sửa bài: Bỏ qua kiểm tra, gọi AI viết lại...", "success");
  } else {
    // CHỈ KIỂM TRA TÊN TRÊN WEB QUA API SHEETS
    if (KG_CHECK_SKU_SITES.has(website)) {

      // 1. Kiểm tra siêu tốc trong bộ nhớ đệm (Cache nội bộ)
      if (window.kgNameCache && window.kgNameCache.has(cacheKeyName)) {
        hienThongBao(`🚫 LỖI: Tên bài "<b>${h1Text}</b>" đã tồn tại trên web.`, "error");
        btnTao.innerText = "Tạo nội dung";
        btnTao.disabled = false;
        return;
      }

      // 2. Gửi lệnh check TÊN lên Google Sheets (Truyền mã = rỗng để API bỏ qua bước quét SKU)
      const checkResult = await kgCheckProductOnWebsite(website, "", h1Text);

      // Xử lý báo lỗi nếu trùng Tên
      if (checkResult.existsName) {
        if (!window.kgNameCache) window.kgNameCache = new Set();
        window.kgNameCache.add(cacheKeyName);
        hienThongBao(`🚫 LỖI: Tên bài "<b>${h1Text}</b>" đã tồn tại trên web.`, "error");
        btnTao.innerText = "Tạo nội dung";
        btnTao.disabled = false;
        return;
      }
    }
  }

  // GỌI AI GEMINI VIẾT BÀI MỚI (Chỉ chạy khi tên chưa tồn tại)
  if (!moTaTuDong) {
    hienThongBao("⏳ Đang viết bài, vui lòng đợi...", "success");
    moTaTuDong = await sinhMoTaTuDong(ten, thuonghieu, xuatxu, ma, h1Text);
  }

  window.__kg_last_auto_desc = {
    productKey: pkey,
    website,
    descHtml: moTaTuDong
  };

  const danhSachXe = sinhDanhSachXe(ten, thuonghieu, website === 'shopee' || website === 'shopee2' || website === 'phutungotokieugia');

  let content = '';
  let copyContent = '';

  // --- BÊN DƯỚI GIỮ NGUYÊN 100% CẤU TRÚC HTML CỦA TỪNG TRANG ---
  if (website === 'kieugiaauto') {
    content = `<h1><strong>${h1Text}</strong></h1>
              <h2><strong>Thông Số Kỹ Thuật ${tenPhuTung}</strong></h2>
              <p><strong>Mã sản phẩm:</strong> ${ma}</p>
              <p><strong>Thương hiệu:</strong> ${thuonghieu}</p>
              <p><strong>Xuất xứ:</strong> ${xuatxu}</p>
          ${moTaTuDong}

          <h3>Tại sao nên chọn mua tại Kiều Gia Auto?</h3>
          <ul>
            <li>Thông tin sản phẩm được đối chiếu theo mã, thương hiệu và thông số cung cấp.</li>
            <li>Kích thước và vị trí lắp được đối chiếu để hỗ trợ lắp ráp phù hợp.</li>
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
    content = `<h1><strong>${h1Text}</strong></h1>
            <h2><strong>Khả Năng Lắp Ráp & Tương Thích Của ${tenPhuTung}</strong></h2>
            <p><strong>Mã sản phẩm:</strong> ${ma}</p>
            <p><strong>Thương hiệu:</strong> ${thuonghieu}</p>
            <p><strong>Xuất xứ:</strong> ${xuatxu}</p>
          ${moTaTuDong}
          ${danhSachXe}

          <h3>Khả năng lắp ráp theo form xe</h3>
          <p>
          Sản phẩm <strong>${h1Text}</strong> được mô tả theo kích thước và thông số của đời xe này. Việc đối chiếu đúng thông tin phụ tùng giúp quá trình lắp ráp thuận tiện và phù hợp với các chi tiết xung quanh, hạn chế phải can thiệp vào kết cấu xe.
          </p>

          <h3>Khôi phục trạng thái hoạt động và thẩm mỹ</h3>
          <p>
          Trong quá trình sử dụng, các bộ phận trên xe có thể bị hư hỏng do sự cố va chạm, tác động của môi trường hoặc hao mòn tự nhiên theo thời gian. Việc thay mới <strong>${h1Text}</strong> đúng đời xe là một phương án phù hợp để hỗ trợ khôi phục chức năng hoạt động và duy trì sự đồng bộ, thẩm mỹ cho tổng thể chiếc xe.
          </p>

          <h3>Ưu điểm khi sử dụng sản phẩm</h3>
          <ul>
            <li>Thiết kế được đối chiếu theo cấu hình và đời xe.</li>
            <li>Thông tin chất liệu được mô tả theo sản phẩm và nhu cầu sử dụng.</li>
            <li>Hỗ trợ các chi tiết liên quan duy trì trạng thái vận hành ổn định.</li>
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
    content = `<h1><strong>${h1Text}</strong></h1>
          <h2><strong>Thông Tin Phân Phối Sỉ ${tenPhuTung}</strong></h2>
          <p><strong>Mã sản phẩm:</strong> ${ma}</p>
          <p><strong>Thương hiệu:</strong> ${thuonghieu}</p>
          <p><strong>Xuất xứ:</strong> ${xuatxu}</p>

          ${moTaTuDong}

          <h3>Cung ứng sỉ ${h1Text} cho Gara & Trung tâm dịch vụ</h3>
          <p>
          Trong quá trình tiếp nhận sửa chữa, bảo dưỡng định kỳ hoặc phục hồi xe sau va chạm, <strong>${h1Text}</strong> là hạng mục vật tư đòi hỏi tính chính xác cao về mặt thông số. Chúng tôi cung cấp sản phẩm theo thông tin mã và thông số để thợ kỹ thuật thuận tiện đối chiếu trước khi lắp ráp, hạn chế việc phải căn chỉnh hoặc thay đổi kết cấu.
          </p>

          <h3>Chính sách ưu đãi dành riêng cho thợ và Gara</h3>
          <ul>
            <li><strong>Sẵn kho số lượng lớn:</strong> Không để anh em thợ phải chờ đợi, tránh tình trạng xe nằm cầu lâu chiếm diện tích xưởng.</li>
            <li><strong>Hỗ trợ giao hàng:</strong> Hỗ trợ giao hàng nhanh nội thành Hà Nội và gửi chành xe hoặc xe khách đi tỉnh tùy điều kiện thực tế.</li>
            <li><strong>Chiết khấu linh hoạt:</strong> Báo giá sỉ theo số lượng và chính sách áp dụng tại từng thời điểm.</li>
            <li><strong>Hậu mãi rõ ràng:</strong> Hỗ trợ bảo hành và đối chiếu mã sản phẩm trước khi xuất kho.</li>
          </ul>

          <p>
          Quý đối tác cần lấy sỉ <strong>${h1Text}</strong> hoặc nhập hàng định kỳ, vui lòng liên hệ trực tiếp phòng kinh doanh để nhận báo giá tại thời điểm đặt hàng.
          </p>

          <p>
          📍 <strong>Kho tổng:</strong> 84 Kim Ngưu, Hai Bà Trưng, Hà Nội<br>
          📞 <strong>Liên hệ báo giá sỉ & đặt hàng:</strong> 0898.153.555 – 0914.153.555 – 0378.05.6666
          </p>`;
    copyContent = content;

  } else if (website === 'phutunggiare') {
    content = `<h1><strong>${h1Text}</strong></h1>
              <h2><strong>Thông Số Mã Kỹ Thuật ${tenPhuTung}</strong></h2>
              <p><strong>Mã sản phẩm:</strong> ${ma}</p>
              <p><strong>Thương hiệu:</strong> ${thuonghieu}</p>
              <p><strong>Xuất xứ:</strong> ${xuatxu}</p>
              
              ${moTaTuDong}
              
              <h3>Tại sao cần thay thế đúng mã phụ tùng ${ma}?</h3>
              <p>
              Trong quá trình bảo dưỡng và sửa chữa ô tô, việc tra cứu và thay thế đúng mã sản phẩm là yếu tố tiên quyết. Sản phẩm mang mã <strong>${ma}</strong> cần được đối chiếu về kích thước, vị trí ngàm chốt và thông số kỹ thuật trước khi lắp. Việc sử dụng đúng mã giúp kỹ thuật viên thao tác thuận tiện và hạn chế phải chỉnh sửa kết cấu xe.
              </p>
              
              <h3>Ưu điểm khi sử dụng đúng mã kỹ thuật</h3>
              <ul>
              <li><strong>Khả năng đối chiếu mã:</strong> Hỗ trợ hạn chế sai lệch form dáng hoặc khác biệt thông số.</li>
              <li><strong>Tiết kiệm thời gian:</strong> Thợ sửa chữa thao tác nhanh gọn, xe không phải nằm cầu lâu.</li>
              <li><strong>Đồng bộ nguyên bản:</strong> Giữ nguyên được giá trị và hiệu suất hoạt động ban đầu của hệ thống.</li>
              </ul>
              
              <h4>Hỗ trợ tra mã & Giao hàng</h4>
              <ul>
              <li>Nhận tra cứu mã phụ tùng chính xác theo số khung (VIN) của xe.</li>
              <li>Hỗ trợ giao hàng nhanh nội thành và ship COD đến nhiều tỉnh, thành.</li>
              </ul>
              
              <p>
              📍 <strong>Kho phân phối:</strong> Ngõ 84 Kim Ngưu, Hai Bà Trưng, Hà Nội<br>
              📞 <strong>Hotline tra mã & đặt hàng:</strong> 0378.05.6666 – 0914.153.555
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

    // Dọn dẹp thẻ HTML để tạo bản Copy thuần Text
    let plainMoTaTuDongShopee = moTaTuDong.replace(/<strong>(.*?)<\/strong>/g, '**$1**').replace(/<[^>]+>/g, '').trim();
    let plainDanhSachXeShopee = danhSachXe.replace(/<strong>(.*?)<\/strong>/g, '**$1**').replace(/<[^>]+>/g, '').trim();

    copyContent = `**${ten}**
Mã sản phẩm: ${ma}
Thương hiệu: ${thuonghieu}
Xuất xứ: ${xuatxu}

${plainMoTaTuDongShopee}

${plainDanhSachXeShopee}

✔️ Kiều Gia Auto - Phụ tùng ô tô chính hãng, giá tốt nhất
- Cung cấp “${ten}” chất lượng vượt trội, giá cả cạnh tranh.
- Khuyên dùng phụ tùng có nguồn gốc rõ ràng để đảm bảo hiệu suất và độ bền.
- Nhập khẩu và phân phối phụ tùng chính hãng tới nhiều gara trên toàn quốc.
- Đội ngũ nhân viên am hiểu kỹ thuật, tư vấn tận tâm, chuyên nghiệp.

✔️ Chính sách bảo hành:
- Bảo hành 1 đổi 1 trong 7 ngày nếu phát hiện lỗi từ nhà sản xuất.
- Sản phẩm được đổi trả trong vòng 7 ngày, với điều kiện còn nguyên vẹn, chưa lắp ráp, không trầy xước, còn nguyên bao bì.

✔️ Lưu ý:
- Khi mở sản phẩm, vui lòng quay video để đảm bảo quyền lợi đổi trả nếu có lỗi từ nhà cung cấp.
- Quý khách vui lòng đánh giá sản phẩm để nhận thêm ưu đãi từ shop!

✔️ Cam kết của Kiều Gia Auto:
- Đội ngũ tư vấn chuyên nghiệp, mang đến trải nghiệm tuyệt vời cho khách hàng.
- Hoàn tiền hoặc đổi sản phẩm mới nếu quý khách không hài lòng vì lỗi sản phẩm.
- Thương hiệu uy tín, đáng tin cậy.

✔️ Đảm bảo từ Kiều Gia Auto:
- Hình ảnh “${ten}” đúng 100% với thực tế.
- Chất lượng sản phẩm đảm bảo tuyệt đối.
- Hỗ trợ đổi trả theo chính sách quy định.
- Giao hàng nhanh chóng trên toàn quốc.

Chân thành cảm ơn quý khách đã tin tưởng và đồng hành cùng Kiều Gia Auto!`;

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

  // Lớp chốt cuối: dù AI hay template có lọt từ rủi ro, không cho copy/hiển thị ra 4 website
  if (KG_TRACK_SITES.has(website)) {
    content = kgSanitizeComplianceHtml(content);
    copyContent = kgSanitizeComplianceHtml(copyContent);
  }

  content = content.replace(/<li>(.*?)\.\s*<\/li>/g, '<li>$1</li>');
  document.getElementById('preview').innerHTML = content;

  const copyButton = document.getElementById('copyButton');
  copyButton.dataset.content = copyContent;
  copyButton.dataset.productKey = pkey;
  copyButton.dataset.website = website;
  copyButton.dataset.descHtml = moTaTuDong || '';

  copyButton.style.display = 'none';

  // ========================================================
  // KIỂM TRA ĐỂ HIỆN NÚT COPY
  // ========================================================
  const g = kgGuardCopy(copyButton, { silent: true });

  if (g.guarded) {
    if (g.dup.conflictSite.includes("CHÍNH WEB NÀY")) {
      // Log ảo thì cho phép hiện Copy
      copyButton.style.display = 'block';
    } else {
      hienThongBao(`❌ Nội dung bị trùng lặp với web <b>${g.dup.conflictSite}</b>!<br>Bấm "Tạo nội dung" lại để ra câu chữ khác.`, 'error');
    }
  } else {
    copyButton.style.display = 'block';
  }

  // ========================================================
  // ĐẨY MÔ TẢ NGẮN VÀ SLUG SANG KHUNG RIÊNG CHO NHÂN VIÊN COPY
  // ========================================================
  const shortPreview = document.getElementById('short-preview');
  const copyShortButton = document.getElementById('copyShortButton');

  let moTaNganText = "";

  // Tùy biến Mô tả ngắn cực chuẩn SEO cho từng Web
  switch (website) {
    case 'kieugiaauto':
      moTaNganText = `Sản phẩm ${h1Text} thương hiệu ${thuonghieu}. Thông tin sản phẩm được công bố để khách hàng tham khảo và đối chiếu trước khi lắp. Kiều Gia Auto hỗ trợ tư vấn và bảo hành theo chính sách.`;
      break;
    case 'banphutung':
      moTaNganText = `Cung cấp sỉ lẻ ${h1Text}. Sản phẩm được mô tả theo mã và thông số để thợ gara đối chiếu trước khi lắp. Hỗ trợ giao hàng theo địa chỉ khách hàng cung cấp.`;
      break;
    case 'phutunggiare':
      moTaNganText = `Cung cấp ${h1Text} thương hiệu ${thuonghieu}. Khách hàng nên đối chiếu đúng mã và thông số kỹ thuật để hỗ trợ quá trình lắp ráp phù hợp với hệ thống xe.`;
      break;
    case 'phutungotokieugia':
      moTaNganText = `Sản phẩm ${h1Text} thương hiệu ${thuonghieu}. Cần đối chiếu form xe, đời xe và thông số kỹ thuật trước khi lắp để hỗ trợ quá trình lắp ráp phù hợp và vận hành ổn định.`;
      break;
    default:
      moTaNganText = `Sản phẩm ${h1Text} thương hiệu ${thuonghieu}. Phụ tùng thay thế chất lượng cao, giúp xe vận hành ổn định và an toàn.`;
  }

  if (KG_TRACK_SITES.has(website)) {
    moTaNganText = kgSanitizeComplianceText(moTaNganText);
  }

  // 2. HIỂN THỊ MÔ TẢ NGẮN & SLUG
  if (shortPreview && copyShortButton) {
    if (website === 'shopee' || website === 'shopee2') {
      shortPreview.style.display = 'none';
      copyShortButton.style.display = 'none';
    } else {
      let htmlHienThi = `<strong>💡 Mô tả ngắn gọn:</strong> ${moTaNganText}`;

      // Nếu có Slug thì gài thêm HTML và khóa nút Mô tả ngắn
      if (slugGoiY) {
        // Gài trạng thái: Bắt buộc copy slug và hiện tại là chưa copy
        copyShortButton.dataset.requireSlug = "true";
        copyShortButton.dataset.slugCopied = "false";

        htmlHienThi += `<div style="margin-top: 12px; padding: 10px; background: #fff4ed; border: 1px dashed #f97316; border-radius: 4px;">
                    <strong style="color: #c2410c;">🔗 Đường dẫn (Slug):</strong> <code style="font-weight: bold; color: #000;">${slugGoiY}</code>
                    <button onclick="navigator.clipboard.writeText('${slugGoiY}'); document.getElementById('copyShortButton').dataset.slugCopied = 'true'; hienThongBao('✅ Đã copy Slug!')" style="margin-left: 10px; cursor: pointer; padding: 2px 8px; background: #f97316; color: white; border: none; border-radius: 3px; font-size: 11px;">Copy Slug</button>
                  </div>`;
      } else {
        // Nếu web không sinh ra Slug (như Kieugiaauto khi không có ngoặc) thì không khóa
        copyShortButton.dataset.requireSlug = "false";
        copyShortButton.dataset.slugCopied = "true";
      }

      shortPreview.innerHTML = htmlHienThi;
      shortPreview.style.display = 'block';
      copyShortButton.dataset.content = moTaNganText;
      copyShortButton.style.display = 'block';
    }
  }

  // 3. DỌN DẸP & MỞ KHÓA GIAO DIỆN
  // Tự động bỏ tích ô sửa bài sau khi tạo thành công
  const checkboxSuaBai = document.getElementById('modeUpdate');
  if (checkboxSuaBai) checkboxSuaBai.checked = false;

  btnTao.innerText = "Tạo nội dung";
  btnTao.disabled = false;
  hienThongBao("✅ Đã tạo nội dung thành công!", "success");
}
