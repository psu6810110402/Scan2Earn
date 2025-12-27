/* ============================================
   SCAN TO EARN - Configuration File
   ============================================
   
   📝 วิธีใช้งาน:
   1. สมัคร Supabase ที่ https://supabase.com (ฟรี)
   2. สร้าง Project ใหม่
   3. ไปที่ Settings > API
   4. Copy "Project URL" และ "anon public" key มาใส่ด้านล่าง
   5. ไปที่ SQL Editor แล้วรัน database.sql
   
   ============================================ */

const CONFIG = {
    // ========================================
    // 🔧 SUPABASE SETTINGS (แก้ไขตรงนี้!)
    // ========================================
    
    // Project URL (เช่น https://abcdefgh.supabase.co)
    SUPABASE_URL: '',
    
    // Anon/Public Key (ไม่ใช่ service_role key!)
    SUPABASE_ANON_KEY: '',
    
    // ========================================
    // ⚙️ APP SETTINGS
    // ========================================
    
    // ชื่อแอป
    APP_NAME: 'Scan to Earn',
    
    // ภาษาเริ่มต้น
    DEFAULT_LANGUAGE: 'th',
    
    // Theme เริ่มต้น ('dark' หรือ 'light')
    DEFAULT_THEME: 'dark',
    
    // ========================================
    // 👤 DEFAULT ADMIN (สร้างอัตโนมัติครั้งแรก)
    // ========================================
    
    DEFAULT_ADMIN: {
        username: 'admin',
        email: 'admin@scan2earn.local',
        password: 'Admin@123',
        fullName: 'Administrator'
    },
    
    // ========================================
    // 🗑️ BIN TYPES & POINTS
    // ========================================
    
    BIN_TYPES: {
        general: { name: 'ถังทั่วไป', icon: '🗑️', points: 10, color: '#6b7280' },
        recycle: { name: 'ถังรีไซเคิล', icon: '♻️', points: 20, color: '#10b981' },
        hazardous: { name: 'ถังอันตราย', icon: '☢️', points: 30, color: '#ef4444' }
    },
    
    // ========================================
    // 🔒 SECURITY SETTINGS
    // ========================================
    
    // Session timeout (milliseconds) - 7 days
    SESSION_TIMEOUT: 7 * 24 * 60 * 60 * 1000,
    
    // Minimum password length
    MIN_PASSWORD_LENGTH: 6,
    
    // ========================================
    // 📊 FEATURES (เปิด/ปิด features)
    // ========================================
    
    FEATURES: {
        // เปิดใช้งาน QR Scanner
        QR_SCANNER: true,
        
        // เปิดใช้งาน User Guide
        USER_GUIDE: true,
        
        // เปิดใช้งาน Theme Toggle
        THEME_TOGGLE: true,
        
        // เปิดใช้งาน Admin Panel
        ADMIN_PANEL: true
    }
};

// ========================================
// 🔍 VALIDATION (ตรวจสอบ config)
// ========================================

function validateConfig() {
    const errors = [];
    
    if (!CONFIG.SUPABASE_URL) {
        errors.push('❌ กรุณาใส่ SUPABASE_URL ใน config.js');
    }
    
    if (!CONFIG.SUPABASE_ANON_KEY) {
        errors.push('❌ กรุณาใส่ SUPABASE_ANON_KEY ใน config.js');
    }
    
    if (errors.length > 0) {
        console.warn('⚠️ CONFIG WARNINGS:');
        errors.forEach(e => console.warn(e));
        return false;
    }
    
    console.log('✅ Config validated successfully');
    return true;
}

// Check if Supabase is configured
function isSupabaseConfigured() {
    return CONFIG.SUPABASE_URL && CONFIG.SUPABASE_ANON_KEY;
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CONFIG, validateConfig, isSupabaseConfigured };
}
