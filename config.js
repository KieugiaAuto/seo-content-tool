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
// THÊM DÒNG NÀY: Bộ nhớ tạm để lưu Tên sản phẩm đã check
if (!window.kgNameCache) window.kgNameCache = new Set();
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
const STYLE_MAP = {
    kieugiaauto: [
        "Viết theo phong cách kỹ thuật ô tô, giải thích vai trò của phụ tùng trong hệ thống xe.",
        "Viết theo phong cách phân tích vận hành của xe và tầm quan trọng của phụ tùng.",
        "Viết theo phong cách kỹ thuật chuyên sâu như tài liệu kỹ thuật ô tô."
    ],
    phutunggiare: [
        "Viết theo phong cách chuyên gia kỹ thuật, nhấn mạnh tầm quan trọng của việc tra cứu và thay thế đúng mã sản phẩm.",
        "Viết tập trung vào tính chính xác tuyệt đối khi khớp đúng mã phụ tùng cho hệ thống xe.",
        "Viết theo phong cách dành cho thợ gara, làm nổi bật thông số mã kỹ thuật để đảm bảo lắp ráp ăn khớp 100%."
    ],
    banphutung: [
        "Viết theo góc nhìn của thợ sửa xe tại gara.",
        "Viết theo phong cách kỹ thuật sửa chữa ô tô.",
        "Viết theo góc nhìn của quá trình bảo dưỡng và thay thế phụ tùng."
    ],
    phutungotokieugia: [
        "Viết theo phong cách giải thích phụ tùng theo đời xe.",
        "Viết theo phong cách kỹ thuật nhấn mạnh sự tương thích với đời xe.",
        "Viết theo phong cách mô tả cấu tạo và sự phù hợp với dòng xe."
    ],
    shopee: [
        "Viết theo phong cách bán hàng dễ hiểu cho người dùng.",
        "Viết theo phong cách mô tả sản phẩm rõ ràng và dễ đọc.",
        "Viết theo phong cách giới thiệu sản phẩm thương mại điện tử."
    ],
    shopee2: [
        "Viết theo phong cách bán hàng dễ hiểu cho người dùng.",
        "Viết theo phong cách mô tả sản phẩm rõ ràng và dễ đọc.",
        "Viết theo phong cách giới thiệu sản phẩm thương mại điện tử."
    ]
};
