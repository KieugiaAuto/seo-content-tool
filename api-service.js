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
                // KỊCH BẢN 1: Phong cách "Chuyên gia Kỹ thuật" (Hệ thống -> Vai trò -> Dấu hiệu -> Giải pháp)
                `
                        - Đoạn 1: Mở đầu bằng việc dẫn dắt về một hệ thống liên quan trên xe ${tenXe}, sau đó giới thiệu ${h1Text} và giải thích cặn kẽ chức năng, vị trí lắp đặt của nó. (Lưu ý: Chỉ dùng tên phụ tùng đầy đủ 1 lần duy nhất ở đoạn này).
                        - Đoạn 2: Liệt kê các dấu hiệu cảnh báo khi chi tiết này bị xuống cấp hoặc hư hỏng (bắt buộc trình bày bằng danh sách <ul> <li> để người đọc dễ theo dõi).
                        - Đoạn 3: Khẳng định sự tương thích hoàn hảo của sản phẩm thay thế này đối với form xe ${tenXe}, giúp khôi phục sự êm ái và vận hành ổn định. (Tuyệt đối không lặp lại tên đầy đủ của phụ tùng, hãy dùng các từ như "sản phẩm", "linh kiện này", "bộ phận này").
                        - Đoạn 4: Đưa ra lời khuyên ngắn gọn từ chuyên gia về chu kỳ kiểm tra và bảo dưỡng.`,

                // KỊCH BẢN 2: Phong cách "Bắt bệnh & Chữa trị" (Dấu hiệu hư hỏng -> Nguyên nhân/Vai trò -> Giải pháp)
                `
                        - Đoạn 1: Mở đầu bằng cách nêu bật ngay những phiền toái, tiếng kêu lạ hoặc sự cố mà tài xế thường gặp phải khi vận hành (Dùng danh sách <ul> <li>). Sau đó chốt lại nguyên nhân chính là do hỏng ${h1Text}. (Chỉ dùng tên đầy đủ ở đoạn này).
                        - Đoạn 2: Giải thích ngược lại về mặt kỹ thuật: tại sao bộ phận này lại quan trọng đến vậy và nó đảm nhận nhiệm vụ gì để hệ thống hoạt động trơn tru. (Sử dụng các đại từ thay thế).
                        - Đoạn 3: Đưa ra giải pháp dứt điểm bằng việc thay mới cụm linh kiện chuẩn xác, thiết kế tối ưu riêng cho hệ thống của xe ${tenXe}.
                        - Đoạn 4: Nhấn mạnh lợi ích kinh tế (tiết kiệm chi phí sửa chữa cụm lớn về sau) nếu thay thế kịp thời ngay khi có dấu hiệu hỏng hóc.`,

                // KỊCH BẢN 3: Phong cách "Đề cao chất lượng & Sự an toàn" (Tương thích -> Rủi ro -> Nguyên lý)
                `
                        - Đoạn 1: Khẳng định ngay từ đầu ${h1Text} là phụ tùng thay thế đạt chuẩn kỹ thuật, lắp ráp vừa vặn và đồng bộ 100% cho cấu hình của dòng xe ${tenXe}. (Chỉ dùng tên đầy đủ ở đoạn này).
                        - Đoạn 2: Đi sâu phân tích kỹ thuật: chi tiết này hoạt động ra sao để bảo vệ xe, tối ưu hiệu suất hoặc đảm bảo an toàn cho người lái. (Chỉ dùng các từ như "chi tiết này", "cụm phụ tùng này").
                        - Đoạn 3: Cảnh báo những rủi ro nguy hiểm tiềm ẩn hoặc nguy cơ hư hỏng lây lan sang các bộ phận khác nếu tiếp tục cố chấp sử dụng linh kiện đã kém chất lượng (Trình bày rủi ro bằng danh sách <ul> <li>).
                        - Đoạn 4: Tổng kết lại giá trị cốt lõi mang lại (sự an tâm, bền bỉ) và nhắc nhở việc chăm sóc, bảo dưỡng xe đúng định kỳ.`
            ];

            // Lệnh bốc thăm ngẫu nhiên 1 kịch bản
            yeuCau = kichBanKieuGia[Math.floor(Math.random() * kichBanKieuGia.length)];
            break;
        case 'phutunggiare': // SEO Mã sản phẩm
            yeuCau = `
                    - Câu 1: Giới thiệu trực diện sản phẩm với mã phụ tùng ${ma} chuyên dụng.
                    - Câu 2: Phân tích việc sử dụng đúng mã ${ma} giúp đảm bảo thông số hình học và tính đồng bộ cao nhất khi ráp lên xe.
                    - Câu 3: Khẳng định đây là mã phụ tùng chuẩn xác, loại bỏ hoàn toàn rủi ro sai lệch so với hệ thống nguyên bản.`;
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
            - Từ khóa chính "${h1Text}" được phép xuất hiện TỐI ĐA 2 LẦN (1 lần ở câu đầu để nhận diện, và 1 lần ở câu cuối để khẳng định chất lượng).
            - Ở phần thân bài, TUYỆT ĐỐI KHÔNG lặp lại từ khóa "${h1Text}". Bắt buộc phải linh hoạt dùng các từ thay thế PHÙ HỢP VỚI ĐẶC THÙ SẢN PHẨM như: "bộ phận này", "sản phẩm này", "phụ tùng", "linh kiện này", hoặc gọi tên ngắn gọn theo chức năng (ví dụ: thay vì gọi cả cụm dài, chỉ cần gọi là "đèn báo rẽ", "cụm đèn", "bơm nước", "càng A"...). Hạn chế tối đa dùng từ "chi tiết máy" trừ khi đó thực sự là bộ phận cơ khí bên trong động cơ.            
            - Không được thay đổi hoặc viết sai tên sản phẩm.
            - Văn phong kết hợp giữa "chuyên gia kỹ thuật" và "nhà phân phối uy tín": Vừa chỉ ra đúng bệnh của xe, vừa làm nổi bật ưu điểm (độ bền, chuẩn form, dễ lắp ráp) để thuyết phục người mua (dù là khách lẻ hay thợ Gara) tin tưởng lựa chọn.
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
