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
    
    // =========================
    // HÀM SAO CHÉP VÀ GHI DATABASE
    // =========================
    async function saoChepNoiDung() {
        const copyButton = document.getElementById('copyButton');
    
        const g = kgGuardCopy(copyButton, { silent: false });
        if (g.guarded) return;
    
        const website = copyButton.dataset.website || document.getElementById('website').value;
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
