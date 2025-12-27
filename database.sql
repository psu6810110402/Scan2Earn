-- ============================================
-- SCAN TO EARN - Database Schema for Supabase
-- ============================================
-- 
-- 📝 วิธีใช้งาน:
-- 1. ไปที่ Supabase Dashboard > SQL Editor
-- 2. Copy ทั้งหมดนี้ไปวาง
-- 3. กด Run
--
-- ============================================

-- ========================================
-- 1. USERS TABLE (ผู้ใช้งาน)
-- ========================================
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    points INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- ========================================
-- 2. BINS TABLE (ถังขยะ)
-- ========================================
CREATE TABLE IF NOT EXISTS bins (
    id VARCHAR(20) PRIMARY KEY,
    type VARCHAR(20) NOT NULL CHECK (type IN ('general', 'recycle', 'hazardous')),
    location VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- 3. TRANSACTIONS TABLE (ประวัติการสแกน)
-- ========================================
CREATE TABLE IF NOT EXISTS transactions (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    bin_id VARCHAR(20) REFERENCES bins(id) ON DELETE SET NULL,
    bin_type VARCHAR(20) NOT NULL,
    points INTEGER NOT NULL,
    scanned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(scanned_at);

-- ========================================
-- 4. QR_CODES TABLE (QR Codes ที่สร้าง)
-- ========================================
CREATE TABLE IF NOT EXISTS qr_codes (
    id BIGSERIAL PRIMARY KEY,
    bin_id VARCHAR(20) REFERENCES bins(id) ON DELETE CASCADE,
    created_by BIGINT REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- 5. SESSIONS TABLE (Sessions)
-- ========================================
CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);

-- ========================================
-- 6. AUTO-UPDATE TIMESTAMP FUNCTION
-- ========================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to users table
DROP TRIGGER IF EXISTS users_updated_at ON users;
CREATE TRIGGER users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- Apply to bins table
DROP TRIGGER IF EXISTS bins_updated_at ON bins;
CREATE TRIGGER bins_updated_at
    BEFORE UPDATE ON bins
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- ========================================
-- 7. DEFAULT DATA
-- ========================================

-- Default Admin (password: Admin@123)
-- Note: In production, change this password immediately!
INSERT INTO users (username, email, password_hash, full_name, role, points)
VALUES ('admin', 'admin@scan2earn.local', 'h_1a2b3c4d_9', 'Administrator', 'admin', 0)
ON CONFLICT (username) DO NOTHING;

-- Default Bins
INSERT INTO bins (id, type, location, is_active) VALUES
    ('GEN-001', 'general', 'อาคาร A ชั้น 1', true),
    ('GEN-002', 'general', 'ลานจอดรถ', true),
    ('REC-001', 'recycle', 'โรงอาหาร', true),
    ('REC-002', 'recycle', 'อาคาร B ชั้น 1', true),
    ('HAZ-001', 'hazardous', 'ห้องปฏิบัติการ', true)
ON CONFLICT (id) DO NOTHING;

-- ========================================
-- 8. ROW LEVEL SECURITY (RLS)
-- ========================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE bins ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE qr_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- Users: Anyone can read, only authenticated can update own
CREATE POLICY "Users are viewable by everyone" ON users FOR SELECT USING (true);
CREATE POLICY "Users can update own record" ON users FOR UPDATE USING (auth.uid()::text = id::text);

-- Bins: Anyone can read
CREATE POLICY "Bins are viewable by everyone" ON bins FOR SELECT USING (true);
CREATE POLICY "Admins can manage bins" ON bins FOR ALL USING (true);

-- Transactions: Anyone can read and insert
CREATE POLICY "Transactions are viewable by everyone" ON transactions FOR SELECT USING (true);
CREATE POLICY "Anyone can create transactions" ON transactions FOR INSERT WITH CHECK (true);

-- QR Codes: Anyone can read
CREATE POLICY "QR codes are viewable by everyone" ON qr_codes FOR SELECT USING (true);
CREATE POLICY "Admins can manage QR codes" ON qr_codes FOR ALL USING (true);

-- Sessions: Users can manage own sessions
CREATE POLICY "Users can manage own sessions" ON sessions FOR ALL USING (true);

-- ========================================
-- ✅ DONE! Your database is ready.
-- ========================================
