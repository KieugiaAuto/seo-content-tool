function kgFormatHang(str) {
    return (str || '').replace(/_/g, '-').split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
}

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

// =========================================================
// BỘ LỌC NỘI DUNG QUẢNG CÁO / TUYÊN BỐ TUYỆT ĐỐI
// Áp dụng cho 4 website: kieugiaauto, phutunggiare,
// banphutung, phutungotokieugia.
// Mục tiêu: không để nội dung xuất bản chứa các claim khó chứng minh.
// =========================================================
function kgSanitizeComplianceText(input) {
    let s = (input || '').toString();

    const replacements = [
        [/\bphụ\s+tùng\s+chính\s+hãng\b/gi, 'phụ tùng'],
        [/\bchính\s+hãng\b/gi, ''],
        [/\bgiá\s+rẻ\s+nhất\b/gi, 'mức giá phù hợp'],
        [/\brẻ\s+nhất\b/gi, 'phù hợp'],
        [/\bgiá\s+tốt\s+nhất\b/gi, 'mức giá phù hợp'],
        [/\btốt\s+nhất\b/gi, 'tốt'],
        [/\bcao\s+nhất\b/gi, 'cao'],
        [/\buy\s+tín\s+hàng\s+đầu\b/gi, 'uy tín'],
        [/\bhàng\s+đầu\b/gi, 'phù hợp'],
        [/\bđúng\s+100%\s+với\s+thực\s+tế\b/gi, 'được sử dụng để tham khảo sản phẩm thực tế'],
        [/\btrùng\s+khớp\s+100%\b/gi, 'phù hợp về thông số'],
        [/\bđồng\s+bộ\s+100%\b/gi, 'phù hợp với cấu hình'],
        [/\bchuẩn\s+phom\s+100%\b/gi, 'phù hợp về kích thước và vị trí lắp'],
        [/\bchính\s+xác\s+100%\b/gi, 'phù hợp về thông số'],
        [/100\s*%/g, ''],
        [/\bchính\s+xác\s+tuyệt\s+đối\b/gi, 'phù hợp về thông số'],
        [/\bđảm\s+bảo\s+tuyệt\s+đối\b/gi, 'được kiểm tra'],
        [/\băn\s+khớp\s+tuyệt\s+đối\b/gi, 'lắp ráp phù hợp'],
        [/\btuyệt\s+đối\b/gi, ''],
        [/\btương\s+thích\s+hoàn\s+hảo\b/gi, 'phù hợp với xe'],
        [/\bhoàn\s+hảo\b/gi, 'phù hợp'],
        [/\bgiải\s+pháp\s+tối\s+ưu\b/gi, 'giải pháp phù hợp'],
        [/\btối\s+ưu\b/gi, 'phù hợp'],
        [/\bđồng\s+bộ\s+hoàn\s+toàn\b/gi, 'phù hợp với cấu hình'],
        [/\bhoàn\s+toàn\b/gi, ''],
        [/\bchất\s+lượng\s+vượt\s+trội\b/gi, 'chất lượng'],
        [/\bvượt\s+trội\b/gi, 'tốt'],
        [/\bgiao\s+hàng\s+siêu\s+tốc\b/gi, 'hỗ trợ giao hàng nhanh'],
        [/\bgiao\s+hàng\s+hỏa\s+tốc\b/gi, 'hỗ trợ giao hàng nhanh'],
        [/\bship\s+cực\s+nhanh\b/gi, 'hỗ trợ giao hàng nhanh'],
        [/\bsiêu\s+tốc\b/gi, 'nhanh'],
        [/\bhỏa\s+tốc\b/gi, 'nhanh'],
        [/\bchuẩn\s+xác\b/gi, 'phù hợp'],
        [/\bcam\s+kết\s+chất\s+lượng\b/gi, 'thông tin chất lượng'],
    ];

    for (const [re, to] of replacements) s = s.replace(re, to);

    return s
        .replace(/\s{2,}/g, ' ')
        .replace(/\s+([,.;:!?])/g, '$1')
        .replace(/([.!?])\s*([.!?])+/g, '$1')
        .trim();
}

function kgSanitizeComplianceHtml(html) {
    const raw = (html || '').toString();
    try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(raw, 'text/html');
        const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT);
        const nodes = [];
        while (walker.nextNode()) nodes.push(walker.currentNode);
        nodes.forEach(node => {
            node.nodeValue = kgSanitizeComplianceText(node.nodeValue);
        });
        return doc.body.innerHTML.trim();
    } catch (e) {
        console.warn('Không thể lọc HTML theo text node:', e);
        return kgSanitizeComplianceText(raw);
    }
}
