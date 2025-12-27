/* ============================================
   SCAN TO EARN - Application Logic with Auth
   ============================================ */

// Application State
const AppState = {
    currentUser: null,
    theme: 'dark',
    currentSection: 'home'
};

// Initialize Application
function init() {
    loadTheme();
    loadCurrentUser();
    updateUI();
    bindEvents();
}

// ============================================
// THEME MANAGEMENT
// ============================================
function loadTheme() {
    const savedTheme = localStorage.getItem('s2eTheme') || 'dark';
    AppState.theme = savedTheme;
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon();
}

function toggleTheme() {
    AppState.theme = AppState.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', AppState.theme);
    localStorage.setItem('s2eTheme', AppState.theme);
    updateThemeIcon();
}

function updateThemeIcon() {
    const icon = document.getElementById('themeIcon');
    if (icon) {
        icon.textContent = AppState.theme === 'dark' ? '🌙' : '☀️';
    }
}

// ============================================
// USER MANAGEMENT
// ============================================
function loadCurrentUser() {
    const session = localStorage.getItem('s2eSession');
    if (session) {
        try {
            const parsed = JSON.parse(session);
            const users = getUsers();
            const user = users.find(u => u.id === parsed.userId);
            if (user && parsed.expires > Date.now()) {
                AppState.currentUser = user;
                showLoggedInState();
            } else {
                localStorage.removeItem('s2eSession');
            }
        } catch (e) {
            localStorage.removeItem('s2eSession');
        }
    }
}

function getUsers() {
    const data = localStorage.getItem('s2eUsers');
    if (data) {
        return JSON.parse(data);
    }
    // Create default admin
    const defaultAdmin = {
        id: 1,
        username: 'admin',
        email: 'admin@scan2earn.com',
        fullName: 'Administrator',
        password: hashPassword('Admin@123'),
        role: 'admin',
        points: 0,
        transactions: [],
        createdAt: new Date().toISOString()
    };
    localStorage.setItem('s2eUsers', JSON.stringify([defaultAdmin]));
    return [defaultAdmin];
}

function saveUsers(users) {
    localStorage.setItem('s2eUsers', JSON.stringify(users));
}

function hashPassword(password) {
    // Simple hash for demo (in production use bcrypt on server)
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
        const char = password.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return 'h_' + Math.abs(hash).toString(36) + '_' + password.length;
}

function verifyPassword(password, hash) {
    return hashPassword(password) === hash;
}

// ============================================
// AUTH FUNCTIONS
// ============================================
function login(emailOrUsername, password) {
    const users = getUsers();
    const user = users.find(u => 
        (u.email.toLowerCase() === emailOrUsername.toLowerCase() || 
         u.username.toLowerCase() === emailOrUsername.toLowerCase())
    );
    
    if (!user) {
        return { success: false, error: 'ไม่พบบัญชีนี้ในระบบ' };
    }
    
    if (!verifyPassword(password, user.password)) {
        return { success: false, error: 'รหัสผ่านไม่ถูกต้อง' };
    }
    
    // Create session
    const session = {
        userId: user.id,
        expires: Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 days
    };
    localStorage.setItem('s2eSession', JSON.stringify(session));
    
    AppState.currentUser = user;
    showLoggedInState();
    
    return { success: true, user };
}

function register(data) {
    const users = getUsers();
    
    // Validate username
    if (!/^[a-zA-Z0-9_]{4,20}$/.test(data.username)) {
        return { success: false, error: 'ชื่อผู้ใช้ต้องเป็นภาษาอังกฤษ 4-20 ตัวอักษร' };
    }
    
    // Check if username exists
    if (users.find(u => u.username.toLowerCase() === data.username.toLowerCase())) {
        return { success: false, error: 'ชื่อผู้ใช้นี้ถูกใช้แล้ว' };
    }
    
    // Check if email exists
    if (users.find(u => u.email.toLowerCase() === data.email.toLowerCase())) {
        return { success: false, error: 'อีเมลนี้ถูกใช้แล้ว' };
    }
    
    // Validate password strength
    const strength = checkPasswordStrength(data.password);
    if (strength.score < 3) {
        return { success: false, error: 'รหัสผ่านไม่แข็งแรงพอ กรุณาใช้รหัสผ่านที่มีตัวพิมพ์ใหญ่ พิมพ์เล็ก ตัวเลข และอักขระพิเศษ' };
    }
    
    // Create user
    const newUser = {
        id: Date.now(),
        username: data.username,
        email: data.email,
        fullName: data.fullName,
        password: hashPassword(data.password),
        role: 'user',
        points: 0,
        transactions: [],
        createdAt: new Date().toISOString()
    };
    
    users.push(newUser);
    saveUsers(users);
    
    // Auto login
    return login(data.email, data.password);
}

function logout() {
    localStorage.removeItem('s2eSession');
    AppState.currentUser = null;
    showLoggedOutState();
    closeUserDropdown();
}

function showLoggedInState() {
    const btnLogin = document.getElementById('btnShowLogin');
    const navLoggedIn = document.getElementById('navUserLoggedIn');
    const userInitial = document.getElementById('userInitial');
    const dropdownName = document.getElementById('dropdownName');
    const dropdownEmail = document.getElementById('dropdownEmail');
    const menuAdmin = document.getElementById('menuAdmin');
    
    if (btnLogin) btnLogin.style.display = 'none';
    if (navLoggedIn) navLoggedIn.style.display = 'flex';
    
    if (AppState.currentUser) {
        if (userInitial) userInitial.textContent = AppState.currentUser.fullName.charAt(0).toUpperCase();
        if (dropdownName) dropdownName.textContent = AppState.currentUser.fullName;
        if (dropdownEmail) dropdownEmail.textContent = AppState.currentUser.email;
        if (menuAdmin) {
            menuAdmin.style.display = AppState.currentUser.role === 'admin' ? 'block' : 'none';
        }
    }
    
    updateUI();
}

function showLoggedOutState() {
    const btnLogin = document.getElementById('btnShowLogin');
    const navLoggedIn = document.getElementById('navUserLoggedIn');
    
    if (btnLogin) btnLogin.style.display = 'block';
    if (navLoggedIn) navLoggedIn.style.display = 'none';
    
    updateUI();
}

// ============================================
// PASSWORD VALIDATION
// ============================================
function checkPasswordStrength(password) {
    const rules = {
        length: password.length >= 8,
        upper: /[A-Z]/.test(password),
        lower: /[a-z]/.test(password),
        number: /[0-9]/.test(password),
        special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };
    
    const score = Object.values(rules).filter(Boolean).length;
    let strength = 'weak';
    let text = 'อ่อนมาก';
    
    if (score >= 5) { strength = 'strong'; text = 'แข็งแรงมาก'; }
    else if (score >= 4) { strength = 'good'; text = 'ดี'; }
    else if (score >= 3) { strength = 'fair'; text = 'พอใช้'; }
    else if (score >= 2) { strength = 'weak'; text = 'อ่อน'; }
    
    return { score, strength, text, rules };
}

function updatePasswordStrengthUI() {
    const password = document.getElementById('regPassword')?.value || '';
    const result = checkPasswordStrength(password);
    
    const fill = document.getElementById('strengthFill');
    const text = document.getElementById('strengthText');
    
    if (fill) {
        fill.className = 'strength-fill ' + result.strength;
    }
    if (text) {
        text.textContent = result.text;
    }
    
    // Update rules
    Object.keys(result.rules).forEach(rule => {
        const el = document.getElementById('rule-' + rule);
        if (el) {
            el.classList.toggle('valid', result.rules[rule]);
        }
    });
    
    updateRegisterButton();
}

function updateRegisterButton() {
    const btn = document.getElementById('btnRegister');
    if (!btn) return;
    
    const password = document.getElementById('regPassword')?.value || '';
    const confirm = document.getElementById('regConfirmPassword')?.value || '';
    const username = document.getElementById('regUsername')?.value || '';
    const email = document.getElementById('regEmail')?.value || '';
    const fullName = document.getElementById('regFullName')?.value || '';
    const terms = document.getElementById('agreeTerms')?.checked || false;
    
    const strength = checkPasswordStrength(password);
    const isValid = username.length >= 4 && 
                    email.includes('@') && 
                    fullName.length >= 2 &&
                    strength.score >= 3 && 
                    password === confirm && 
                    terms;
    
    btn.disabled = !isValid;
}

// ============================================
// EVENT BINDINGS
// ============================================
function bindEvents() {
    // Theme Toggle
    document.getElementById('themeToggle')?.addEventListener('click', toggleTheme);
    
    // Login Button
    document.getElementById('btnShowLogin')?.addEventListener('click', () => showModal('loginModal'));
    
    // Close Modals
    document.getElementById('btnCloseLogin')?.addEventListener('click', () => closeModal('loginModal'));
    document.getElementById('btnCloseRegister')?.addEventListener('click', () => closeModal('registerModal'));
    document.getElementById('btnCloseTerms')?.addEventListener('click', () => closeModal('termsModal'));
    document.getElementById('btnCloseScanner')?.addEventListener('click', closeScanner);
    document.getElementById('btnCloseSuccess')?.addEventListener('click', () => closeModal('successModal'));
    
    // Auth Links
    document.getElementById('linkToRegister')?.addEventListener('click', (e) => {
        e.preventDefault();
        closeModal('loginModal');
        showModal('registerModal');
    });
    
    document.getElementById('linkToLogin')?.addEventListener('click', (e) => {
        e.preventDefault();
        closeModal('registerModal');
        showModal('loginModal');
    });
    
    document.getElementById('linkTerms')?.addEventListener('click', (e) => {
        e.preventDefault();
        showModal('termsModal');
    });
    
    document.getElementById('linkPrivacy')?.addEventListener('click', (e) => {
        e.preventDefault();
        showModal('termsModal');
    });
    
    // Accept Terms
    document.getElementById('btnAcceptTerms')?.addEventListener('click', () => {
        document.getElementById('agreeTerms').checked = true;
        closeModal('termsModal');
        updateRegisterButton();
    });
    
    // Login Form
    document.getElementById('btnLogin')?.addEventListener('click', handleLogin);
    
    // Register Form
    document.getElementById('btnRegister')?.addEventListener('click', handleRegister);
    document.getElementById('regPassword')?.addEventListener('input', updatePasswordStrengthUI);
    document.getElementById('regConfirmPassword')?.addEventListener('input', updateRegisterButton);
    document.getElementById('regUsername')?.addEventListener('input', updateRegisterButton);
    document.getElementById('regEmail')?.addEventListener('input', updateRegisterButton);
    document.getElementById('regFullName')?.addEventListener('input', updateRegisterButton);
    document.getElementById('agreeTerms')?.addEventListener('change', updateRegisterButton);
    
    // Password Toggles
    document.querySelectorAll('.toggle-password').forEach(btn => {
        btn.addEventListener('click', function() {
            const input = this.parentElement.querySelector('input');
            if (input.type === 'password') {
                input.type = 'text';
                this.textContent = '🙈';
            } else {
                input.type = 'password';
                this.textContent = '👁️';
            }
        });
    });
    
    // User Menu
    document.getElementById('userMenuBtn')?.addEventListener('click', toggleUserDropdown);
    document.getElementById('menuLogout')?.addEventListener('click', (e) => {
        e.preventDefault();
        logout();
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        const dropdown = document.getElementById('userDropdown');
        const btn = document.getElementById('userMenuBtn');
        if (dropdown && !dropdown.contains(e.target) && e.target !== btn) {
            dropdown.style.display = 'none';
        }
    });
    
    // Navigation
    document.getElementById('navHome')?.addEventListener('click', () => navigateTo('home'));
    document.getElementById('navGuide')?.addEventListener('click', () => navigateTo('guide'));
    
    // Scan Buttons
    document.getElementById('btnScan')?.addEventListener('click', openScanner);
    document.getElementById('btnScanNav')?.addEventListener('click', openScanner);
    document.getElementById('btnManualSubmit')?.addEventListener('click', handleManualSubmit);
    
    // Close modals on backdrop click
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    });
    
    // Profile Events
    document.getElementById('menuProfile')?.addEventListener('click', (e) => {
        e.preventDefault();
        closeUserDropdown();
        openProfile();
    });
    document.getElementById('btnCloseProfile')?.addEventListener('click', () => closeModal('profileModal'));
}

// ============================================
// UI FUNCTIONS
// ============================================
function showModal(id) {
    const modal = document.getElementById(id);
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeModal(id) {
    const modal = document.getElementById(id);
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

function toggleUserDropdown() {
    const dropdown = document.getElementById('userDropdown');
    if (dropdown) {
        dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
    }
}

function closeUserDropdown() {
    const dropdown = document.getElementById('userDropdown');
    if (dropdown) {
        dropdown.style.display = 'none';
    }
}

function navigateTo(section) {
    AppState.currentSection = section;
    
    // Update nav active states
    document.querySelectorAll('.bottom-nav .nav-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Hide all sections
    const heroSection = document.getElementById('heroSection');
    const dashboardSection = document.getElementById('dashboardSection');
    const guideSection = document.getElementById('guideSection');
    
    if (heroSection) heroSection.style.display = 'none';
    if (dashboardSection) dashboardSection.style.display = 'none';
    if (guideSection) guideSection.style.display = 'none';
    
    if (section === 'home') {
        document.getElementById('navHome')?.classList.add('active');
        if (heroSection) heroSection.style.display = 'block';
        if (dashboardSection) dashboardSection.style.display = 'block';
    } else if (section === 'guide') {
        document.getElementById('navGuide')?.classList.add('active');
        if (guideSection) guideSection.style.display = 'block';
    }
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ============================================
// AUTH HANDLERS
// ============================================
function handleLogin() {
    const email = document.getElementById('loginEmail')?.value || '';
    const password = document.getElementById('loginPassword')?.value || '';
    const errorEl = document.getElementById('loginError');
    
    if (!email || !password) {
        if (errorEl) {
            errorEl.textContent = 'กรุณากรอกข้อมูลให้ครบ';
            errorEl.style.display = 'block';
        }
        return;
    }
    
    const result = login(email, password);
    
    if (result.success) {
        closeModal('loginModal');
        // Clear form
        document.getElementById('loginEmail').value = '';
        document.getElementById('loginPassword').value = '';
        if (errorEl) errorEl.style.display = 'none';
    } else {
        if (errorEl) {
            errorEl.textContent = result.error;
            errorEl.style.display = 'block';
        }
    }
}

function handleRegister() {
    const data = {
        username: document.getElementById('regUsername')?.value || '',
        email: document.getElementById('regEmail')?.value || '',
        fullName: document.getElementById('regFullName')?.value || '',
        password: document.getElementById('regPassword')?.value || ''
    };
    const confirmPassword = document.getElementById('regConfirmPassword')?.value || '';
    const errorEl = document.getElementById('registerError');
    
    if (data.password !== confirmPassword) {
        if (errorEl) {
            errorEl.textContent = 'รหัสผ่านไม่ตรงกัน';
            errorEl.style.display = 'block';
        }
        return;
    }
    
    const result = register(data);
    
    if (result.success) {
        closeModal('registerModal');
        // Clear form
        ['regUsername', 'regEmail', 'regFullName', 'regPassword', 'regConfirmPassword'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = '';
        });
        document.getElementById('agreeTerms').checked = false;
        if (errorEl) errorEl.style.display = 'none';
    } else {
        if (errorEl) {
            errorEl.textContent = result.error;
            errorEl.style.display = 'block';
        }
    }
}

// ============================================
// SCANNER FUNCTIONS
// ============================================
let html5QrCode = null;
let cameraAvailable = false;

function openScanner() {
    if (!AppState.currentUser) {
        showModal('loginModal');
        return;
    }
    
    showModal('scannerModal');
    
    // Always show manual input first (for best UX on all devices)
    const manualInput = document.getElementById('manualInput');
    if (manualInput) manualInput.style.display = 'block';
    
    // Try to start camera as bonus feature
    tryStartCamera();
}

function closeScanner() {
    closeModal('scannerModal');
    stopQRScanner();
}

async function tryStartCamera() {
    const qrReader = document.getElementById('qrReader');
    const status = document.getElementById('scannerStatus');
    
    // Check if camera is supported
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        showCameraNotAvailable('เบราว์เซอร์ไม่รองรับกล้อง');
        return;
    }
    
    // Check HTTPS (required for camera on iOS)
    if (location.protocol !== 'https:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
        showCameraNotAvailable('ต้องใช้ HTTPS สำหรับกล้อง');
        return;
    }
    
    if (status) status.textContent = 'กำลังขอสิทธิ์กล้อง...';
    
    // Try to check camera permission first
    try {
        // Request camera permission
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment' }
        });
        
        // Stop the test stream
        stream.getTracks().forEach(track => track.stop());
        
        // Camera works! Now start QR scanner
        if (typeof Html5Qrcode !== 'undefined') {
            html5QrCode = new Html5Qrcode("qrReader");
            
            html5QrCode.start(
                { facingMode: "environment" },
                { 
                    fps: 10, 
                    qrbox: { width: 200, height: 200 },
                    aspectRatio: 1
                },
                (decodedText) => handleQRScan(decodedText),
                () => {} // Ignore errors during scanning
            ).then(() => {
                cameraAvailable = true;
                if (status) {
                    status.textContent = '📸 กล้องพร้อม - หันไปที่ QR Code';
                    status.style.color = '#10b981';
                }
            }).catch((err) => {
                console.log('QR Scanner error:', err);
                showCameraNotAvailable('ไม่สามารถเริ่มกล้องได้');
            });
        } else {
            showCameraNotAvailable('ไม่พบ QR Scanner Library');
        }
    } catch (err) {
        console.log('Camera permission denied:', err);
        if (err.name === 'NotAllowedError') {
            showCameraNotAvailable('ไม่ได้รับอนุญาตใช้กล้อง');
        } else if (err.name === 'NotFoundError') {
            showCameraNotAvailable('ไม่พบกล้อง');
        } else {
            showCameraNotAvailable('กล้องไม่พร้อมใช้งาน');
        }
    }
}

function stopQRScanner() {
    if (html5QrCode) {
        html5QrCode.stop().catch(() => {});
        html5QrCode = null;
    }
    cameraAvailable = false;
}

function showCameraNotAvailable(reason) {
    const qrReader = document.getElementById('qrReader');
    const status = document.getElementById('scannerStatus');
    
    if (qrReader) {
        qrReader.innerHTML = `
            <div class="camera-unavailable">
                <div class="camera-icon">📷</div>
                <p class="camera-reason">${reason}</p>
                <p class="camera-hint">กรุณาเลือกประเภทถังด้านล่าง</p>
            </div>
        `;
    }
    
    if (status) {
        status.textContent = '';
    }
}

function handleQRScan(qrData) {
    closeScanner();
    
    let binInfo = null;
    try {
        const parsed = JSON.parse(qrData);
        if (parsed.type && parsed.points) {
            binInfo = parsed;
        }
    } catch (e) {
        // Use default
    }
    
    if (!binInfo) {
        binInfo = { type: 'general', points: 10 };
    }
    
    processTransaction(binInfo.type, binInfo.points);
}

// Bin lookup storage
let currentBinLookup = null;

function lookupBinCode() {
    const binCode = document.getElementById('manualBinCode')?.value.trim().toUpperCase();
    const preview = document.getElementById('binPreview');
    const status = document.getElementById('binStatus');
    const submitBtn = document.getElementById('btnManualSubmit');
    
    // Reset
    currentBinLookup = null;
    if (preview) preview.style.display = 'none';
    if (status) status.innerHTML = '';
    if (submitBtn) submitBtn.disabled = true;
    
    if (!binCode || binCode.length < 3) {
        return;
    }
    
    // Get bins from storage
    const binsData = localStorage.getItem('s2eBins');
    const bins = binsData ? JSON.parse(binsData) : [];
    
    // Find bin by code
    const bin = bins.find(b => b.id === binCode);
    
    const binTypes = {
        general: { name: 'ถังทั่วไป', icon: '🗑️', points: 10 },
        recycle: { name: 'ถังรีไซเคิล', icon: '♻️', points: 20 },
        hazardous: { name: 'ถังอันตราย', icon: '☢️', points: 30 }
    };
    
    if (bin && bin.active !== false) {
        // Found in database
        const typeInfo = binTypes[bin.type] || binTypes.general;
        currentBinLookup = { ...bin, ...typeInfo };
        
        if (preview) {
            preview.style.display = 'flex';
            document.getElementById('binPreviewIcon').textContent = typeInfo.icon;
            document.getElementById('binPreviewType').textContent = typeInfo.name;
            document.getElementById('binPreviewLocation').textContent = bin.location || '-';
            document.getElementById('binPreviewPoints').textContent = '+' + typeInfo.points;
        }
        
        if (status) {
            status.innerHTML = '<span class="status-success">✅ พบถังในระบบ</span>';
        }
        
        if (submitBtn) submitBtn.disabled = false;
    } else {
        // Not found
        if (status) {
            status.innerHTML = '<span class="status-error">❌ ไม่พบรหัส "' + binCode + '" ในระบบ</span>';
        }
        if (submitBtn) submitBtn.disabled = true;
    }
}

function handleManualSubmit() {
    if (!currentBinLookup) {
        const binCode = document.getElementById('manualBinCode')?.value.trim().toUpperCase();
        if (!binCode) {
            showBinStatus('❌ กรุณากรอกรหัสถังขยะ', 'error');
            return;
        }
        showBinStatus('❌ ไม่พบรหัส "' + binCode + '" ในระบบ', 'error');
        return;
    }
    
    const binCode = currentBinLookup.id;
    const binType = currentBinLookup.type || 'general';
    const points = currentBinLookup.points || 10;
    
    closeScanner();
    document.getElementById('manualBinCode').value = '';
    currentBinLookup = null;
    
    processTransaction(binType, points, binCode);
}

function showBinStatus(message, type) {
    const status = document.getElementById('binStatus');
    if (status) {
        status.innerHTML = `<span class="status-${type}">${message}</span>`;
    }
}

function processTransaction(type, points, binCode = null) {
    if (!AppState.currentUser) return;
    
    // Update user points
    const users = getUsers();
    const userIndex = users.findIndex(u => u.id === AppState.currentUser.id);
    
    if (userIndex >= 0) {
        const transaction = {
            id: Date.now(),
            type,
            points,
            binCode: binCode || 'QR-SCAN',
            timestamp: new Date().toISOString(),
            icon: { general: '🗑️', recycle: '♻️', hazardous: '☢️' }[type],
            typeName: { general: 'ถังทั่วไป', recycle: 'ถังรีไซเคิล', hazardous: 'ถังอันตราย' }[type]
        };
        
        users[userIndex].points += points;
        users[userIndex].transactions = users[userIndex].transactions || [];
        users[userIndex].transactions.unshift(transaction);
        
        saveUsers(users);
        AppState.currentUser = users[userIndex];
        
        showSuccess(points, type);
        updateUI();
    }
}

function showSuccess(points, type) {
    const typeName = { general: 'ถังทั่วไป', recycle: 'ถังรีไซเคิล', hazardous: 'ถังอันตราย' }[type];
    
    document.getElementById('successMessage').textContent = `+${points} แต้ม`;
    document.getElementById('successType').textContent = `ประเภท: ${typeName}`;
    document.getElementById('totalPoints').textContent = AppState.currentUser?.points || 0;
    
    showModal('successModal');
}

// ============================================
// UPDATE UI
// ============================================
function updateUI() {
    const user = AppState.currentUser;
    const transactions = user?.transactions || [];
    const points = user?.points || 0;
    
    // Update points
    document.getElementById('navPoints')?.textContent && (document.getElementById('navPoints').textContent = points);
    document.getElementById('totalPointsDisplay')?.textContent && (document.getElementById('totalPointsDisplay').textContent = points);
    document.getElementById('totalScans')?.textContent && (document.getElementById('totalScans').textContent = transactions.length);
    document.getElementById('ecoScore')?.textContent && (document.getElementById('ecoScore').textContent = Math.floor(transactions.length * 2.5));
    
    // Render history
    const historyList = document.getElementById('historyList');
    if (historyList) {
        if (transactions.length === 0) {
            historyList.innerHTML = `
                <div class="empty-state">
                    <span class="empty-icon">📭</span>
                    <p>ยังไม่มีประวัติ</p>
                    <p class="empty-hint">เริ่มสแกน QR Code เพื่อสะสมแต้ม!</p>
                </div>
            `;
        } else {
            historyList.innerHTML = transactions.slice(0, 20).map(tx => `
                <div class="history-item">
                    <div class="history-icon">${tx.icon}</div>
                    <div class="history-info">
                        <div class="history-type">${tx.typeName}</div>
                        <div class="history-time">${formatTime(tx.timestamp)}</div>
                    </div>
                    <div class="history-points">+${tx.points}</div>
                </div>
            `).join('');
        }
    }
}

function formatTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'เมื่อกี้';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} นาทีที่แล้ว`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} ชม.ที่แล้ว`;
    
    return date.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
}

// ============================================
// PROFILE
// ============================================
function openProfile() {
    if (!AppState.currentUser) return;
    
    const user = AppState.currentUser;
    
    // Fill profile data
    document.getElementById('profileAvatar').textContent = user.fullName?.charAt(0).toUpperCase() || 'U';
    document.getElementById('profileUsername').textContent = '@' + user.username;
    document.getElementById('profileEmailDisplay').textContent = user.email;
    document.getElementById('profilePoints').textContent = user.points || 0;
    document.getElementById('profileScans').textContent = user.transactions?.length || 0;
    
    showModal('profileModal');
}

// Initialize on DOM Ready
document.addEventListener('DOMContentLoaded', init);

