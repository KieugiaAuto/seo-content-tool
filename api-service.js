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
                case 'kieugiaauto': // SEO Kỹ thuật (4 Câu)
                    yeuCau = `
                    - Câu 1: Giải thích phụ tùng này là gì, nằm ở đâu hoặc có chức năng gì.
                    - Câu 2: Nêu rõ các dấu hiệu nhận biết khi nào cần phải thay thế.
                    - Câu 3: Khẳng định sự tương thích chính xác với dòng xe ${tenXe}.
                    - Câu 4: Nêu lợi ích của việc thay thế phụ tùng mới đối với xe.`;
                    break;
                    case 'phutunggiare': // SEO Phụ tùng thay thế
                    yeuCau = `
                    - Câu 1: Giới thiệu phụ tùng này là bộ phận thay thế cho chi tiết trên xe.
                    - Câu 2: Nêu vai trò của phụ tùng khi xe cần sửa chữa hoặc thay thế do hư hỏng.
                    - Câu 3: Nhấn mạnh việc lựa chọn đúng phụ tùng thay thế giúp xe vận hành ổn định trở lại.`;
                break;
                case 'banphutung': // SEO Gara / Thợ (3 Câu)
                    yeuCau = `
                    - Câu 1: Nêu vai trò của phụ tùng đối với quá trình vận hành hoặc bảo vệ xe.
                    - Câu 2: Nhấn mạnh sản phẩm có thông số kích thước chuẩn xác, giúp việc lắp đặt dễ dàng, không cần chế cháo.
                    - Câu 3: Khẳng định đây là vật tư chất lượng, cực kỳ phù hợp và được các gara sửa xe ưu tiên lựa chọn.`;
                    break;
                case 'phutungotokieugia': // SEO Đời xe (3 Câu)
                    yeuCau = `
                    - Câu 1: Giới thiệu tổng quan về chi tiết/phụ tùng này trên xe.
                    - Câu 2: Nêu rõ các trường hợp hoặc tình trạng nào thì cần phải thay thế phụ tùng này.
                    - Câu 3: Nhấn mạnh độ tương thích chuẩn xác 100% với form xe ${tenXe} đời ${doiXe}.`;
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
            - Đoạn văn từ 3 đến 4 câu hoàn chỉnh.
            - Tổng số từ tối đa 80 từ.
            - Mỗi câu phải kết thúc bằng dấu chấm.

            ĐỊNH DẠNG TRẢ VỀ:
            - Chỉ trả về duy nhất 1 đoạn văn.
            - Không xuống dòng giữa các câu.
            - Không dùng ký tự đặc biệt như *, #, <, >.
            - Không thêm tiêu đề hoặc lời giải thích.`;
            
            try {
                const res = await fetch(API_BASE, {
                method: 'POST',
                body: JSON.stringify({ action: 'gemini', prompt: prompt })
                });
                const data = await res.json();
                if (data.status === "success" && data.moTa) {
                return data.moTa.replace(/</g, "").replace(/>/g, "").trim();
                }
            } catch (err) {
                console.error('Lỗi gọi Gemini:', err);
            }
            return `${h1Text} là phụ tùng chất lượng cao, đảm bảo hiệu suất vận hành ổn định cho xe.`;
            }
