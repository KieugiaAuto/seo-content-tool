            // ==========================================
            // KẾT NỐI DATABASE GOOGLE SHEETS & API
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

            // Kiểm tra sản phẩm đã tồn tại trên website WordPress chưa (qua Google Apps Script)
async function kgCheckProductOnWebsite(website, ma, ten) {
    if (!KG_CHECK_SKU_SITES.has(website)) return { existsSku: false, existsName: false };
    try {
      const url = API_BASE + '?action=checkProduct&website=' + encodeURIComponent(website) +
      '&ma=' + encodeURIComponent(ma || '') + '&ten=' + encodeURIComponent(ten || '');
      const res = await fetch(url);
      const data = await res.json();
      // TRẢ VỀ TOÀN BỘ DATA (chứa existsSku và existsName) THAY VÌ CHỈ BOOLEAN
      return data; 
    } catch (err) {
      console.error('Lỗi kiểm tra sản phẩm trên website:', err);
      return { existsSku: false, existsName: false }; // Lỗi mạng thì cho qua
    }
  }

            // 1. HÀM GỌI GEMINI: ÉP LOGIC CHUẨN 4 WEB VÀ THIẾT QUÂN LUẬT VỀ ĐỘ DÀI
            async function layGioiThieuTuGemini(ten, thuonghieu, xuatxu, website, ma, hang, dong, dateText, h1Text) {
            let yeuCau = "";
            let tenXe = `${hang} ${dong}`.trim();
            let doiXe = dateText ? dateText.trim() : "";
            let phongCach = "";

            if (STYLE_MAP[website]) {
                const styles = STYLE_MAP[website];
                phongCach = styles[Math.floor(Math.random() * styles.length)];
            }
                // Phân luồng logic cực kỳ sắc bén cho 4 website
                switch (website) {
                case 'kieugiaauto': 
                    // Tạo mảng 3 kịch bản để AI xáo trộn cấu trúc bài viết, chống dập khuôn
                    const kichBanKieuGia = [
                        // KỊCH BẢN 1: Truyền thống (Vai trò -> Dấu hiệu -> Tương thích)
                        `
                        - Đoạn 1: Giải thích cặn kẽ nguyên lý hoạt động, chức năng kỹ thuật và vị trí lắp đặt chính xác của ${h1Text}.
                        - Đoạn 2: Liệt kê các dấu hiệu cảnh báo phụ tùng đã xuống cấp (trình bày phần này bằng danh sách <ul> <li> để dễ đọc).
                        - Đoạn 3: Khẳng định sự tương thích hoàn hảo cho xe ${tenXe} và phân tích lợi ích khi thay mới (êm ái, an toàn).
                        - Đoạn 4: Lời khuyên từ chuyên gia về chu kỳ kiểm tra và bảo dưỡng.`,
                        
                        // KỊCH BẢN 2: Đánh mạnh vào Nỗi đau trước (Dấu hiệu -> Vai trò -> Giải pháp)
                        `
                        - Đoạn 1: Mở đầu bằng việc nêu bật các vấn đề, tiếng kêu lạ hoặc dấu hiệu hư hỏng thường gặp khiến chủ xe phải kiểm tra và thay thế ${h1Text} (Dùng danh sách <ul> <li> để liệt kê các dấu hiệu này).
                        - Đoạn 2: Giải thích ngược lại về mặt kỹ thuật: tại sao phụ tùng này lại quan trọng đến vậy và nó nằm ở vị trí nào trên xe.
                        - Đoạn 3: Đưa ra giải pháp bằng việc thay mới sản phẩm chuẩn form, tương thích 100% với dòng xe ${tenXe} giúp dứt điểm tình trạng hư hỏng.
                        - Đoạn 4: Nhấn mạnh lợi ích kinh tế lâu dài và khuyến cáo bảo dưỡng định kỳ.`,
                        
                        // KỊCH BẢN 3: Đề cao Giải pháp trước (Tương thích -> Vai trò -> Cảnh báo)
                        `
                        - Đoạn 1: Khẳng định ngay đây là phụ tùng thay thế chuẩn xác, được thiết kế tối ưu và tương thích tuyệt đối cho hệ thống của dòng xe ${tenXe}.
                        - Đoạn 2: Đi sâu vào phân tích kỹ thuật: ${h1Text} đảm nhận chức năng gì và nguyên lý hoạt động ra sao.
                        - Đoạn 3: Cảnh báo những rủi ro nguy hiểm hoặc hao tổn chi phí nếu không thay thế kịp thời (Trình bày các rủi ro bằng danh sách <ul> <li>).
                        - Đoạn 4: Tổng kết lại giá trị cốt lõi mang lại cho người lái và nhắc nhở việc chăm sóc xe đúng cách.`
                    ];
                    
                    // Lệnh bốc thăm ngẫu nhiên 1 kịch bản
                    yeuCau = kichBanKieuGia[Math.floor(Math.random() * kichBanKieuGia.length)];
                    break;
                    case 'phutunggiare': // SEO Phụ tùng thay thế
                    yeuCau = `
                    - Câu 1: Giới thiệu đây là giải pháp thay thế hoàn hảo cho chi tiết cũ đã hỏng hóc hoặc xuống cấp.
                    - Câu 2: Nhấn mạnh vào độ bền ổn định và khả năng vận hành tin cậy với mức chi phí đầu tư hợp lý.
                    - Câu 3: Khẳng định sản phẩm giúp phục hồi chức năng xe nhanh chóng, là lựa chọn thay thế kinh tế và hiệu quả.`;
                break;
                case 'banphutung': // SEO Gara / Thợ (3 Câu)
                    yeuCau = `
                    - Câu 1: Nêu vai trò của phụ tùng đối với quá trình vận hành hoặc bảo vệ xe.
                    - Câu 2: Nhấn mạnh sản phẩm có thông số kích thước chuẩn xác, giúp việc lắp đặt dễ dàng, không cần chế cháo.
                    - Câu 3: Khẳng định đây là vật tư chất lượng, cực kỳ phù hợp và được các gara sửa xe ưu tiên lựa chọn.`;
                    break;
                case 'phutungotokieugia': // SEO Đời xe (3 Câu)
                    yeuCau = `
                    - Câu 1: Xác nhận phụ tùng này được thiết kế riêng biệt cho dòng xe ${tenXe}.
                    - Câu 2: Nhấn mạnh sự chuẩn xác về thông số kỹ thuật cho các phiên bản đời xe ${doiXe}.
                    - Câu 3: Khẳng định lắp đặt chuẩn phom 100%, giúp xe giữ được nguyên bản và ổn định theo đúng đời xe.`;
                    break;
                case 'shopee':
                case 'shopee2':
                    yeuCau = `
                    - Câu 1: Giới thiệu đây là phụ tùng thay thế chất lượng cao.
                    - Câu 2: Nhấn mạnh việc thao tác lắp đặt dễ dàng, nhanh chóng.
                    - Câu 3: Khẳng định tương thích hoàn hảo với xe ${tenXe} và có độ bền bỉ cao.`;
                    break;
                default:
                    yeuCau = `Viết giới thiệu ngắn gọn về phụ tùng.`;
                }

            /// PROMPT ĐÃ ĐƯỢC TỐI ƯU CỰC KỲ KHOA HỌC VÀ CHẶT CHẼ
            let doDaiCau = (website === 'kieugiaauto') ? "chia làm 3 đến 4 đoạn văn chi tiết" : "từ 3 đến 4 câu";
            let soTuToiDa = (website === 'kieugiaauto') ? "350 từ" : "80 từ";
            let dinhDangHtml = (website === 'kieugiaauto') 
                ? "- Sử dụng các thẻ HTML <p> để chia 2-3 đoạn văn. Dùng <ul> và <li> để liệt kê các dấu hiệu hư hỏng hoặc lợi ích cho chuyên nghiệp."
                : "- Chỉ trả về duy nhất 1 đoạn văn văn bản thuần, không xuống dòng, không dùng thẻ HTML.";
                let quyTacDong = (website === 'kieugiaauto')
                ? "- Nội dung cần trình bày thoáng, dễ đọc bằng các thẻ HTML.\n- TUYỆT ĐỐI KHÔNG nhắc đến các con số về năm sản xuất hoặc đời xe (ví dụ: 2018, 2026, 2018-2026) trong bài viết."
                : "- Không xuống dòng giữa các câu, không dùng ký tự đặc biệt.";  
            const prompt = `Bạn là chuyên gia phụ tùng ô tô và kỹ thuật sửa chữa xe.

            PHONG CÁCH VIẾT:
            ${phongCach}

            TÊN SẢN PHẨM:
            ${h1Text}

            NHIỆM VỤ:
            Viết 1 đoạn mô tả ngắn giới thiệu sản phẩm phụ tùng ô tô.

            QUY TẮC BẮT BUỘC:
            - Tên sản phẩm "${h1Text}" phải xuất hiện trong đoạn văn.
            - Không được thay đổi hoặc viết sai tên sản phẩm.
            - Văn phong tự nhiên, chuyên nghiệp như người viết thật.

            YÊU CẦU NỘI DUNG:
            ${yeuCau}

            QUY TẮC VIẾT CÂU:
            - Không lặp lại mẫu mở đầu quen thuộc như "${h1Text} là..."
            - Có thể bắt đầu đoạn văn theo nhiều cách khác nhau:
            + vai trò của phụ tùng trong hệ thống xe
            + tình huống sửa chữa hoặc bảo dưỡng
            + cấu tạo của hệ thống xe
            + chức năng của phụ tùng
            - Cấu trúc câu cần đa dạng và tự nhiên.

            ĐỘ DÀI:
            - Đoạn văn ${doDaiCau} hoàn chỉnh.
            - Tổng số từ tối đa ${soTuToiDa}.
            - Mỗi câu phải kết thúc bằng dấu chấm.

            ĐỊNH DẠNG TRẢ VỀ:
            ${dinhDangHtml}
            ${quyTacDong}
            - Không dùng ký tự đặc biệt như *, #.
            - Tuyệt đối không thêm tiêu đề hoặc lời giải thích ngoài nội dung phụ tùng.`;
            
            try {
                const res = await fetch(API_BASE, {
                    method: 'POST',
                    body: JSON.stringify({ 
                        action: 'gemini', 
                        prompt: prompt,
                        temperature: 0.7, // Giữ độ sáng tạo cho nội dung
                        max_tokens: 1000  // Nới lỏng giới hạn để web chính không bị ngắt chữ
                    })
                });
                
                const data = await res.json();
                
                if (data.status === "success" && data.moTa) {
                    // LOGIC XỬ LÝ ĐỊNH DẠNG RIÊNG CHO TỪNG WEB
                    if (website === 'kieugiaauto') {
                        // Web chính: Giữ nguyên thẻ <p>, <ul>, <li> để hiển thị chuyên nghiệp
                        return data.moTa.trim(); 
                    } else {
                        // Web vệ tinh: Xóa sạch các thẻ < > để lấy văn bản thuần 1 đoạn duy nhất
                        return data.moTa.replace(/</g, "").replace(/>/g, "").trim();
                    }
                }
            } catch (err) {
                console.error('Lỗi gọi Gemini:', err);
            }
            // Nội dung dự phòng nếu API lỗi
            return `${h1Text} là phụ tùng chất lượng cao, đảm bảo hiệu suất vận hành ổn định cho xe.`;
        }
