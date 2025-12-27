/* ============================================
   SCAN TO EARN - Supabase Database Helper
   ============================================
   
   This file handles all database operations.
   It works with both Supabase and localStorage fallback.
   
   ============================================ */

// Database instance
let supabase = null;
let useLocalStorage = true;

// ============================================
// INITIALIZATION
// ============================================

async function initDatabase() {
    // Check if Supabase is configured
    if (isSupabaseConfigured()) {
        try {
            // Load Supabase client
            const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
            supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);
            useLocalStorage = false;
            console.log('✅ Connected to Supabase');
            return true;
        } catch (error) {
            console.warn('⚠️ Failed to connect to Supabase, using localStorage:', error);
            useLocalStorage = true;
        }
    } else {
        console.log('ℹ️ Supabase not configured, using localStorage');
        useLocalStorage = true;
    }
    return false;
}

// ============================================
// USER OPERATIONS
// ============================================

const DB = {
    // Get all users
    async getUsers() {
        if (useLocalStorage) {
            return getLocalUsers();
        }
        
        const { data, error } = await supabase.from('users').select('*').order('id');
        if (error) { console.error(error); return getLocalUsers(); }
        return data.map(mapUserFromDB);
    },
    
    // Get user by ID
    async getUserById(id) {
        if (useLocalStorage) {
            return getLocalUsers().find(u => u.id === id);
        }
        
        const { data, error } = await supabase.from('users').select('*').eq('id', id).single();
        if (error) return null;
        return mapUserFromDB(data);
    },
    
    // Get user by email or username
    async getUserByEmailOrUsername(emailOrUsername) {
        if (useLocalStorage) {
            const users = getLocalUsers();
            return users.find(u => 
                u.email.toLowerCase() === emailOrUsername.toLowerCase() ||
                u.username.toLowerCase() === emailOrUsername.toLowerCase()
            );
        }
        
        const { data, error } = await supabase.from('users')
            .select('*')
            .or(`email.ilike.${emailOrUsername},username.ilike.${emailOrUsername}`)
            .single();
        if (error) return null;
        return mapUserFromDB(data);
    },
    
    // Create user
    async createUser(userData) {
        if (useLocalStorage) {
            const users = getLocalUsers();
            
            // Check duplicates
            if (users.find(u => u.username.toLowerCase() === userData.username.toLowerCase())) {
                return { success: false, error: 'Username นี้มีอยู่แล้ว' };
            }
            if (users.find(u => u.email.toLowerCase() === userData.email.toLowerCase())) {
                return { success: false, error: 'Email นี้มีอยู่แล้ว' };
            }
            
            const newUser = {
                id: Date.now(),
                ...userData,
                password: hashPassword(userData.password),
                role: userData.role || 'user',
                points: 0,
                transactions: [],
                createdAt: new Date().toISOString()
            };
            
            users.push(newUser);
            saveLocalUsers(users);
            return { success: true, user: newUser };
        }
        
        // Supabase
        const { data, error } = await supabase.from('users').insert({
            username: userData.username,
            email: userData.email,
            password_hash: hashPassword(userData.password),
            full_name: userData.fullName,
            role: userData.role || 'user',
            points: 0
        }).select().single();
        
        if (error) {
            if (error.code === '23505') {
                return { success: false, error: 'Username หรือ Email นี้มีอยู่แล้ว' };
            }
            return { success: false, error: error.message };
        }
        
        return { success: true, user: mapUserFromDB(data) };
    },
    
    // Update user
    async updateUser(id, updates) {
        if (useLocalStorage) {
            const users = getLocalUsers();
            const idx = users.findIndex(u => u.id === id);
            if (idx < 0) return { success: false, error: 'ไม่พบผู้ใช้' };
            
            users[idx] = { ...users[idx], ...updates };
            saveLocalUsers(users);
            return { success: true, user: users[idx] };
        }
        
        const dbUpdates = {};
        if (updates.email) dbUpdates.email = updates.email;
        if (updates.fullName) dbUpdates.full_name = updates.fullName;
        if (updates.points !== undefined) dbUpdates.points = updates.points;
        if (updates.role) dbUpdates.role = updates.role;
        if (updates.password) dbUpdates.password_hash = hashPassword(updates.password);
        
        const { data, error } = await supabase.from('users')
            .update(dbUpdates)
            .eq('id', id)
            .select()
            .single();
        
        if (error) return { success: false, error: error.message };
        return { success: true, user: mapUserFromDB(data) };
    },
    
    // ============================================
    // BIN OPERATIONS
    // ============================================
    
    async getBins() {
        if (useLocalStorage) {
            return getLocalBins();
        }
        
        const { data, error } = await supabase.from('bins').select('*').order('id');
        if (error) { console.error(error); return getLocalBins(); }
        return data.map(b => ({
            id: b.id,
            type: b.type,
            location: b.location || '',
            active: b.is_active
        }));
    },
    
    async createBin(binData) {
        if (useLocalStorage) {
            const bins = getLocalBins();
            if (bins.find(b => b.id === binData.id)) {
                return { success: false, error: 'รหัสถังนี้มีอยู่แล้ว' };
            }
            bins.push({ ...binData, active: true });
            saveLocalBins(bins);
            return { success: true };
        }
        
        const { error } = await supabase.from('bins').insert({
            id: binData.id,
            type: binData.type,
            location: binData.location,
            is_active: true
        });
        
        if (error) {
            if (error.code === '23505') return { success: false, error: 'รหัสถังนี้มีอยู่แล้ว' };
            return { success: false, error: error.message };
        }
        return { success: true };
    },
    
    async updateBin(id, updates) {
        if (useLocalStorage) {
            const bins = getLocalBins();
            const idx = bins.findIndex(b => b.id === id);
            if (idx < 0) return { success: false };
            bins[idx] = { ...bins[idx], ...updates };
            saveLocalBins(bins);
            return { success: true };
        }
        
        const dbUpdates = {};
        if (updates.location) dbUpdates.location = updates.location;
        if (updates.active !== undefined) dbUpdates.is_active = updates.active;
        if (updates.type) dbUpdates.type = updates.type;
        
        const { error } = await supabase.from('bins').update(dbUpdates).eq('id', id);
        return { success: !error };
    },
    
    async deleteBin(id) {
        if (useLocalStorage) {
            const bins = getLocalBins().filter(b => b.id !== id);
            saveLocalBins(bins);
            return { success: true };
        }
        
        const { error } = await supabase.from('bins').delete().eq('id', id);
        return { success: !error };
    },
    
    // ============================================
    // TRANSACTION OPERATIONS
    // ============================================
    
    async addTransaction(userId, binId, binType, points) {
        if (useLocalStorage) {
            const users = getLocalUsers();
            const idx = users.findIndex(u => u.id === userId);
            if (idx < 0) return { success: false };
            
            const tx = {
                id: Date.now(),
                binId,
                type: binType,
                points,
                timestamp: new Date().toISOString(),
                icon: CONFIG.BIN_TYPES[binType]?.icon || '🗑️',
                typeName: CONFIG.BIN_TYPES[binType]?.name || binType
            };
            
            users[idx].points = (users[idx].points || 0) + points;
            users[idx].transactions = users[idx].transactions || [];
            users[idx].transactions.unshift(tx);
            
            saveLocalUsers(users);
            return { success: true, transaction: tx, newPoints: users[idx].points };
        }
        
        // Supabase: Add transaction
        const { data: txData, error: txError } = await supabase.from('transactions').insert({
            user_id: userId,
            bin_id: binId,
            bin_type: binType,
            points: points
        }).select().single();
        
        if (txError) return { success: false, error: txError.message };
        
        // Update user points
        const { data: user } = await supabase.from('users')
            .select('points')
            .eq('id', userId)
            .single();
        
        const newPoints = (user?.points || 0) + points;
        await supabase.from('users').update({ points: newPoints }).eq('id', userId);
        
        return { success: true, transaction: txData, newPoints };
    },
    
    async getTransactions(filters = {}) {
        if (useLocalStorage) {
            const users = getLocalUsers();
            let allTx = [];
            users.forEach(u => {
                if (u.transactions) {
                    allTx = allTx.concat(u.transactions.map(tx => ({ 
                        ...tx, 
                        userId: u.id, 
                        userName: u.fullName 
                    })));
                }
            });
            
            // Apply filters
            if (filters.userId) {
                allTx = allTx.filter(tx => tx.userId === filters.userId);
            }
            if (filters.dateFrom) {
                allTx = allTx.filter(tx => new Date(tx.timestamp) >= new Date(filters.dateFrom));
            }
            
            return allTx.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        }
        
        let query = supabase.from('transactions')
            .select('*, users(full_name)')
            .order('scanned_at', { ascending: false });
        
        if (filters.userId) query = query.eq('user_id', filters.userId);
        if (filters.limit) query = query.limit(filters.limit);
        
        const { data, error } = await query;
        if (error) return [];
        
        return data.map(tx => ({
            id: tx.id,
            userId: tx.user_id,
            userName: tx.users?.full_name || 'Unknown',
            binId: tx.bin_id,
            type: tx.bin_type,
            points: tx.points,
            timestamp: tx.scanned_at,
            icon: CONFIG.BIN_TYPES[tx.bin_type]?.icon || '🗑️',
            typeName: CONFIG.BIN_TYPES[tx.bin_type]?.name || tx.bin_type
        }));
    },
    
    // ============================================
    // SESSION OPERATIONS
    // ============================================
    
    async createSession(userId) {
        const sessionId = generateSessionId();
        const expires = Date.now() + CONFIG.SESSION_TIMEOUT;
        
        if (useLocalStorage) {
            localStorage.setItem('s2eSession', JSON.stringify({ 
                sessionId, 
                userId, 
                expires 
            }));
            return { success: true, sessionId };
        }
        
        const { error } = await supabase.from('sessions').insert({
            id: sessionId,
            user_id: userId,
            expires_at: new Date(expires).toISOString()
        });
        
        if (!error) {
            localStorage.setItem('s2eSession', JSON.stringify({ sessionId, userId, expires }));
        }
        
        return { success: !error, sessionId };
    },
    
    async validateSession() {
        const session = localStorage.getItem('s2eSession');
        if (!session) return null;
        
        try {
            const parsed = JSON.parse(session);
            if (parsed.expires < Date.now()) {
                localStorage.removeItem('s2eSession');
                return null;
            }
            
            const user = await this.getUserById(parsed.userId);
            return user;
        } catch {
            return null;
        }
    },
    
    async destroySession() {
        const session = localStorage.getItem('s2eSession');
        localStorage.removeItem('s2eSession');
        
        if (!useLocalStorage && session) {
            try {
                const parsed = JSON.parse(session);
                await supabase.from('sessions').delete().eq('id', parsed.sessionId);
            } catch {}
        }
    }
};

// ============================================
// HELPER FUNCTIONS
// ============================================

function hashPassword(password) {
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
        hash = ((hash << 5) - hash) + password.charCodeAt(i);
        hash = hash & hash;
    }
    return 'h_' + Math.abs(hash).toString(36) + '_' + password.length;
}

function verifyPassword(password, hash) {
    return hashPassword(password) === hash;
}

function generateSessionId() {
    return 'sess_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 9);
}

function mapUserFromDB(dbUser) {
    return {
        id: dbUser.id,
        username: dbUser.username,
        email: dbUser.email,
        fullName: dbUser.full_name,
        password: dbUser.password_hash,
        role: dbUser.role,
        points: dbUser.points || 0,
        createdAt: dbUser.created_at,
        transactions: []
    };
}

// ============================================
// LOCAL STORAGE HELPERS
// ============================================

function getLocalUsers() {
    const data = localStorage.getItem('s2eUsers');
    if (data) return JSON.parse(data);
    
    // Create default admin
    const defaultAdmin = {
        id: 1,
        username: CONFIG.DEFAULT_ADMIN.username,
        email: CONFIG.DEFAULT_ADMIN.email,
        fullName: CONFIG.DEFAULT_ADMIN.fullName,
        password: hashPassword(CONFIG.DEFAULT_ADMIN.password),
        role: 'admin',
        points: 0,
        transactions: [],
        createdAt: new Date().toISOString()
    };
    
    localStorage.setItem('s2eUsers', JSON.stringify([defaultAdmin]));
    return [defaultAdmin];
}

function saveLocalUsers(users) {
    localStorage.setItem('s2eUsers', JSON.stringify(users));
}

function getLocalBins() {
    const data = localStorage.getItem('s2eBins');
    if (data) return JSON.parse(data);
    
    const defaultBins = [
        { id: 'GEN-001', type: 'general', location: 'อาคาร A ชั้น 1', active: true },
        { id: 'GEN-002', type: 'general', location: 'ลานจอดรถ', active: true },
        { id: 'REC-001', type: 'recycle', location: 'โรงอาหาร', active: true },
        { id: 'HAZ-001', type: 'hazardous', location: 'อาคาร B ชั้น 1', active: true }
    ];
    
    localStorage.setItem('s2eBins', JSON.stringify(defaultBins));
    return defaultBins;
}

function saveLocalBins(bins) {
    localStorage.setItem('s2eBins', JSON.stringify(bins));
}

function getLocalQRCodes() {
    const data = localStorage.getItem('s2eQRCodes');
    return data ? JSON.parse(data) : [];
}

function saveLocalQRCodes(codes) {
    localStorage.setItem('s2eQRCodes', JSON.stringify(codes));
}

// ============================================
// EXPORT
// ============================================

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { DB, initDatabase, hashPassword, verifyPassword };
}
