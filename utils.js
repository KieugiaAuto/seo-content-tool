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
