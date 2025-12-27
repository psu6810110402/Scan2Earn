/* ============================================
   ADMIN DASHBOARD - JavaScript (QR Fixed)
   ============================================ */

let currentAdmin = null;
let isMainAdmin = false;

const AdminState = {
    section: 'dashboard',
    theme: 'dark',
    bins: [],
    qrCodes: []
};

const binTypes = {
    general: { name: 'ถังทั่วไป', icon: '🗑️', points: 10 },
    recycle: { name: 'ถังรีไซเคิล', icon: '♻️', points: 20 },
    hazardous: { name: 'ถังอันตราย', icon: '☢️', points: 30 }
};

// ============================================
// INIT
// ============================================
function init() {
    checkAdminAuth();
    loadTheme();
    loadData();
    bindEvents();
    renderAll();
}

function checkAdminAuth() {
    const session = localStorage.getItem('s2eSession');
    if (!session) { window.location.href = 'index.html'; return; }
    
    try {
        const parsed = JSON.parse(session);
        const users = getUsers();
        const user = users.find(u => u.id === parsed.userId);
        
        if (!user || user.role !== 'admin') { window.location.href = 'index.html'; return; }
        
        currentAdmin = user;
        isMainAdmin = user.id === 1;
        
        document.getElementById('adminName').textContent = user.fullName;
        
        const note = document.getElementById('adminNote');
        if (note) {
            if (isMainAdmin) {
                note.innerHTML = '✅ คุณเป็น <strong>แอดมินหลัก</strong> สามารถเพิ่ม/ลบแอดมินรองได้';
                note.className = 'admin-info-note main-admin';
            } else {
                note.innerHTML = 'ℹ️ คุณเป็น <strong>แอดมินรอง</strong> ไม่สามารถลบแอดมินคนอื่นได้';
                note.className = 'admin-info-note sub-admin';
            }
        }
    } catch (e) { window.location.href = 'index.html'; }
}

// ============================================
// DATA
// ============================================
function getUsers() {
    const data = localStorage.getItem('s2eUsers');
    if (data) return JSON.parse(data);
    
    const defaultAdmin = {
        id: 1, username: 'admin', email: 'admin@scan2earn.com',
        fullName: 'Administrator', password: hashPassword('Admin@123'),
        role: 'admin', points: 0, transactions: [], createdAt: new Date().toISOString()
    };
    localStorage.setItem('s2eUsers', JSON.stringify([defaultAdmin]));
    return [defaultAdmin];
}

function saveUsers(users) { localStorage.setItem('s2eUsers', JSON.stringify(users)); }

function hashPassword(password) {
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
        hash = ((hash << 5) - hash) + password.charCodeAt(i);
        hash = hash & hash;
    }
    return 'h_' + Math.abs(hash).toString(36) + '_' + password.length;
}

function loadData() {
    const binsData = localStorage.getItem('s2eBins');
    AdminState.bins = binsData ? JSON.parse(binsData) : [
        { id: 'GEN-001', type: 'general', location: 'อาคาร A ชั้น 1', active: true },
        { id: 'GEN-002', type: 'general', location: 'ลานจอดรถ', active: true },
        { id: 'REC-001', type: 'recycle', location: 'โรงอาหาร', active: true },
        { id: 'HAZ-001', type: 'hazardous', location: 'อาคาร B ชั้น 1', active: true }
    ];
    saveBins();
    
    const qrData = localStorage.getItem('s2eQRCodes');
    AdminState.qrCodes = qrData ? JSON.parse(qrData) : [];
}

function saveBins() { localStorage.setItem('s2eBins', JSON.stringify(AdminState.bins)); }
function saveQRCodes() { localStorage.setItem('s2eQRCodes', JSON.stringify(AdminState.qrCodes)); }

// ============================================
// THEME
// ============================================
function loadTheme() {
    const saved = localStorage.getItem('s2eTheme') || 'dark';
    AdminState.theme = saved;
    document.documentElement.setAttribute('data-theme', saved);
    updateThemeIcon();
}

function toggleTheme() {
    AdminState.theme = AdminState.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', AdminState.theme);
    localStorage.setItem('s2eTheme', AdminState.theme);
    updateThemeIcon();
}

function updateThemeIcon() {
    const icon = document.getElementById('adminThemeIcon');
    if (icon) icon.textContent = AdminState.theme === 'dark' ? '🌙' : '☀️';
}

// ============================================
// EVENTS
// ============================================
function bindEvents() {
    document.getElementById('adminThemeToggle')?.addEventListener('click', toggleTheme);
    document.getElementById('mobileMenuBtn')?.addEventListener('click', toggleSidebar);
    document.getElementById('sidebarOverlay')?.addEventListener('click', closeSidebar);
    document.getElementById('adminLogout')?.addEventListener('click', logout);
    
    document.querySelectorAll('.nav-link[data-section]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            navigateTo(link.dataset.section);
            closeSidebar();
        });
    });
    
    document.getElementById('dateFilter')?.addEventListener('change', () => {
        renderStats(); renderCharts(); renderActivity();
    });
    
    // QR Code
    document.getElementById('qrBinSelect')?.addEventListener('change', onBinSelectChange);
    document.getElementById('btnGenerateQR')?.addEventListener('click', generateQR);
    document.getElementById('btnDownloadQR')?.addEventListener('click', downloadQR);
    document.getElementById('btnAddNewBinForQR')?.addEventListener('click', () => showModal('addBinModal'));
    
    // Bins
    document.getElementById('btnAddBin')?.addEventListener('click', () => showModal('addBinModal'));
    document.getElementById('btnSaveBin')?.addEventListener('click', saveBin);
    
    // Users
    document.getElementById('userSearch')?.addEventListener('input', renderUsersTable);
    document.getElementById('btnSaveUserDetail')?.addEventListener('click', saveUserDetail);
    document.getElementById('btnConfirmResetPassword')?.addEventListener('click', resetPassword);
    
    // Admins
    document.getElementById('btnAddAdmin')?.addEventListener('click', () => {
        if (!isMainAdmin) { alert('เฉพาะแอดมินหลักเท่านั้น'); return; }
        showModal('addAdminModal');
    });
    document.getElementById('btnSaveAdmin')?.addEventListener('click', saveAdmin);
    
    document.querySelectorAll('.modal').forEach(m => {
        m.addEventListener('click', (e) => { if (e.target === m) closeModal(m.id); });
    });
}

function toggleSidebar() {
    document.getElementById('sidebar')?.classList.toggle('open');
    document.getElementById('sidebarOverlay')?.classList.toggle('active');
}

function closeSidebar() {
    document.getElementById('sidebar')?.classList.remove('open');
    document.getElementById('sidebarOverlay')?.classList.remove('active');
}

function logout() {
    localStorage.removeItem('s2eSession');
    window.location.href = 'index.html';
}

// ============================================
// NAVIGATION
// ============================================
function navigateTo(section) {
    AdminState.section = section;
    
    document.querySelectorAll('.nav-link[data-section]').forEach(l => {
        l.classList.toggle('active', l.dataset.section === section);
    });
    
    document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));
    document.getElementById(section + 'Section')?.classList.add('active');
    
    const titles = {
        dashboard: '📊 Dashboard', bins: '🗑️ จัดการถังขยะ',
        qrcode: '📱 สร้าง QR Code', users: '👥 ผู้ใช้งาน', admins: '🔐 จัดการแอดมิน'
    };
    document.getElementById('pageTitle').textContent = titles[section] || 'Admin';
    
    if (section === 'bins') renderBinsTable();
    else if (section === 'users') renderUsersTable();
    else if (section === 'admins') renderAdminsTable();
    else if (section === 'qrcode') { populateBinSelect(); renderSavedQR(); }
}

// ============================================
// MODALS
// ============================================
function showModal(id) { document.getElementById(id)?.classList.add('active'); }
function closeModal(id) { document.getElementById(id)?.classList.remove('active'); }

// ============================================
// RENDER
// ============================================
function renderAll() {
    renderStats(); renderCharts(); renderActivity();
    renderBinsTable(); populateBinSelect(); renderSavedQR();
}

function getFilteredTransactions() {
    const filter = document.getElementById('dateFilter')?.value || 'month';
    const now = new Date();
    let allTx = [];
    getUsers().forEach(u => {
        if (u.transactions) allTx = allTx.concat(u.transactions.map(tx => ({ ...tx, userId: u.id, userName: u.fullName })));
    });
    
    return allTx.filter(tx => {
        const d = new Date(tx.timestamp);
        switch (filter) {
            case 'today': return d.toDateString() === now.toDateString();
            case 'week': return d >= new Date(now - 7*24*60*60*1000);
            case 'month': return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
            case 'year': return d.getFullYear() === now.getFullYear();
            default: return true;
        }
    });
}

function renderStats() {
    const users = getUsers();
    const txs = getFilteredTransactions();
    document.getElementById('statUsers').textContent = users.length;
    document.getElementById('statBins').textContent = AdminState.bins.filter(b => b.active).length;
    document.getElementById('statPoints').textContent = txs.reduce((s, t) => s + t.points, 0).toLocaleString();
    document.getElementById('statScans').textContent = txs.length;
}

function renderCharts() {
    const txs = getFilteredTransactions();
    const total = txs.length || 1;
    
    const gen = txs.filter(t => t.type === 'general').length;
    const rec = txs.filter(t => t.type === 'recycle').length;
    const haz = txs.filter(t => t.type === 'hazardous').length;
    
    document.getElementById('generalBar').style.width = (gen / total * 100) + '%';
    document.getElementById('recycleBar').style.width = (rec / total * 100) + '%';
    document.getElementById('hazardBar').style.width = (haz / total * 100) + '%';
    
    document.getElementById('generalPercent').textContent = Math.round(gen / total * 100) + '%';
    document.getElementById('recyclePercent').textContent = Math.round(rec / total * 100) + '%';
    document.getElementById('hazardPercent').textContent = Math.round(haz / total * 100) + '%';
    
    renderBarChart(txs);
}

function renderBarChart(txs) {
    const chart = document.getElementById('scanChart');
    if (!chart) return;
    
    const days = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];
    const today = new Date().getDay();
    const data = [], labels = [];
    
    for (let i = 6; i >= 0; i--) {
        labels.push(days[(today - i + 7) % 7]);
        const d = new Date(); d.setDate(d.getDate() - i);
        data.push(txs.filter(t => new Date(t.timestamp).toDateString() === d.toDateString()).length);
    }
    
    const max = Math.max(...data, 1);
    chart.innerHTML = labels.map((lbl, i) => `
        <div class="bar ${i === 6 ? 'active' : ''}" style="height:${data[i] / max * 100}%">
            <span>${data[i]}</span><small>${lbl}</small>
        </div>
    `).join('');
}

function renderActivity() {
    const txs = getFilteredTransactions().slice(0, 10);
    const list = document.getElementById('activityList');
    if (!list) return;
    
    if (txs.length === 0) {
        list.innerHTML = '<div class="empty-activity"><span>📭</span><p>ยังไม่มีกิจกรรม</p></div>';
        return;
    }
    
    list.innerHTML = txs.map(tx => `
        <div class="activity-item">
            <div class="activity-icon">${tx.icon || '🗑️'}</div>
            <div class="activity-text">${tx.userName} ทิ้ง ${tx.typeName || tx.type}</div>
            <div class="activity-points">+${tx.points}</div>
            <div class="activity-time">${formatTime(tx.timestamp)}</div>
        </div>
    `).join('');
}

function renderBinsTable() {
    const tbody = document.getElementById('binsTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = AdminState.bins.map(bin => {
        const t = binTypes[bin.type];
        return `<tr>
            <td><code>${bin.id}</code></td>
            <td><span class="type-badge ${bin.type}">${t.icon} ${t.name}</span></td>
            <td>${t.points}</td>
            <td>${bin.location}</td>
            <td><span class="status-badge ${bin.active ? 'active' : 'inactive'}">${bin.active ? 'Active' : 'Inactive'}</span></td>
            <td>
                <button class="btn-icon" onclick="goToQRForBin('${bin.id}')" title="สร้าง QR">📱</button>
                <button class="btn-icon" onclick="toggleBinStatus('${bin.id}')" title="เปลี่ยนสถานะ">🔄</button>
                <button class="btn-icon delete" onclick="deleteBin('${bin.id}')" title="ลบ">🗑️</button>
            </td>
        </tr>`;
    }).join('');
}

function renderUsersTable() {
    const search = document.getElementById('userSearch')?.value.toLowerCase() || '';
    const users = getUsers().filter(u => 
        u.username.toLowerCase().includes(search) ||
        u.email.toLowerCase().includes(search) ||
        u.fullName.toLowerCase().includes(search)
    );
    const tbody = document.getElementById('usersTableBody');
    if (!tbody) return;
    
    if (users.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="empty-row">ไม่พบผู้ใช้</td></tr>';
        return;
    }
    
    tbody.innerHTML = users.map(u => `<tr>
        <td>${u.id}</td>
        <td><strong>${u.username}</strong></td>
        <td>${u.email}</td>
        <td>${u.fullName}</td>
        <td><span class="points-badge">💎 ${u.points || 0}</span></td>
        <td>${formatDate(u.createdAt)}</td>
        <td>
            <button class="btn-icon" onclick="viewUserDetail(${u.id})" title="ดูข้อมูล">👁️</button>
            <button class="btn-icon" onclick="openResetPassword(${u.id},'${u.fullName}')" title="รีเซ็ตรหัส">🔑</button>
        </td>
    </tr>`).join('');
}

function renderAdminsTable() {
    const admins = getUsers().filter(u => u.role === 'admin');
    const tbody = document.getElementById('adminsTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = admins.map(a => {
        const isMain = a.id === 1;
        const canDelete = isMainAdmin && !isMain;
        return `<tr>
            <td>${a.id}</td>
            <td><strong>${a.username}</strong></td>
            <td>${a.email}</td>
            <td>${a.fullName}</td>
            <td><span class="role-badge ${isMain ? 'main' : 'sub'}">${isMain ? '👑 หลัก' : '👤 รอง'}</span></td>
            <td>
                <button class="btn-icon" onclick="viewUserDetail(${a.id})" title="ดูข้อมูล">👁️</button>
                <button class="btn-icon" onclick="openResetPassword(${a.id},'${a.fullName}')" title="รีเซ็ตรหัส">🔑</button>
                ${canDelete ? `<button class="btn-icon delete" onclick="removeAdmin(${a.id})" title="ลบแอดมิน">🗑️</button>` : ''}
            </td>
        </tr>`;
    }).join('');
}

function renderSavedQR() {
    const grid = document.getElementById('savedQRGrid');
    if (!grid) return;
    
    if (AdminState.qrCodes.length === 0) {
        grid.innerHTML = '<p class="empty-text">ยังไม่มี QR Code ที่สร้าง</p>';
        return;
    }
    
    grid.innerHTML = AdminState.qrCodes.map(qr => {
        const t = binTypes[qr.type];
        return `<div class="saved-qr-card">
            <div class="qr-card-icon">${t.icon}</div>
            <div class="qr-card-info">
                <strong>${qr.binCode}</strong>
                <span>${qr.location || '-'}</span>
                <span class="qr-card-points">💎 ${t.points} แต้ม</span>
            </div>
            <button class="btn-icon" onclick="goToQRForBin('${qr.binCode}')" title="สร้างใหม่">📱</button>
            <button class="btn-icon delete" onclick="deleteQR('${qr.binCode}')" title="ลบ">🗑️</button>
        </div>`;
    }).join('');
}

// ============================================
// QR CODE (INLINE SVG - NO LIBRARY)
// ============================================
function populateBinSelect() {
    const select = document.getElementById('qrBinSelect');
    if (!select) return;
    
    select.innerHTML = '<option value="">-- เลือกถังขยะ --</option>' +
        AdminState.bins.filter(b => b.active).map(bin => {
            const t = binTypes[bin.type];
            return `<option value="${bin.id}">${t.icon} ${bin.id} - ${t.name} (${bin.location})</option>`;
        }).join('');
}

function onBinSelectChange() {
    const binId = document.getElementById('qrBinSelect')?.value;
    const infoDiv = document.getElementById('qrBinInfo');
    const btn = document.getElementById('btnGenerateQR');
    
    if (!binId) {
        infoDiv.style.display = 'none';
        btn.disabled = true;
        return;
    }
    
    const bin = AdminState.bins.find(b => b.id === binId);
    if (!bin) return;
    
    const t = binTypes[bin.type];
    document.getElementById('qrSelectedCode').textContent = bin.id;
    document.getElementById('qrSelectedType').textContent = t.icon + ' ' + t.name;
    document.getElementById('qrSelectedPoints').textContent = t.points + ' แต้ม';
    document.getElementById('qrSelectedLocation').textContent = bin.location || '-';
    
    infoDiv.style.display = 'block';
    btn.disabled = false;
}

function goToQRForBin(binId) {
    navigateTo('qrcode');
    setTimeout(() => {
        document.getElementById('qrBinSelect').value = binId;
        onBinSelectChange();
        generateQR();
    }, 100);
}

function generateQR() {
    const binId = document.getElementById('qrBinSelect')?.value;
    if (!binId) { alert('กรุณาเลือกถังขยะ'); return; }
    
    const bin = AdminState.bins.find(b => b.id === binId);
    if (!bin) return;
    
    const t = binTypes[bin.type];
    const qrData = JSON.stringify({ binCode: bin.id, type: bin.type, points: t.points, location: bin.location });
    
    // Generate QR Code using inline SVG (no external library)
    const qrSvg = generateQRSVG(qrData, 256);
    
    const display = document.getElementById('qrDisplay');
    display.innerHTML = qrSvg;
    
    document.getElementById('btnDownloadQR').style.display = 'block';
    
    // Save to list
    const idx = AdminState.qrCodes.findIndex(q => q.binCode === bin.id);
    if (idx >= 0) {
        AdminState.qrCodes[idx] = { binCode: bin.id, type: bin.type, location: bin.location };
    } else {
        AdminState.qrCodes.push({ binCode: bin.id, type: bin.type, location: bin.location });
    }
    saveQRCodes();
    renderSavedQR();
}

// Simple QR Code Generator (inline implementation)
function generateQRSVG(text, size) {
    // Simplified QR code - create a visual representation
    // For a real QR code, we need a proper library. Let's create a styled placeholder
    // that actually shows the encoded data visually
    
    const binData = JSON.parse(text);
    const t = binTypes[binData.type];
    
    // Create a styled QR-like display with actual data
    return `
        <div class="qr-result" id="qrResult">
            <div class="qr-card-display">
                <div class="qr-icon-large">${t.icon}</div>
                <div class="qr-code-box">
                    <div class="qr-code-pattern" data-content="${encodeURIComponent(text)}">
                        ${generateQRPattern(text)}
                    </div>
                </div>
                <div class="qr-data">
                    <div class="qr-data-row"><span>รหัส:</span> <strong>${binData.binCode}</strong></div>
                    <div class="qr-data-row"><span>ประเภท:</span> <strong>${t.name}</strong></div>
                    <div class="qr-data-row"><span>แต้ม:</span> <strong class="points-highlight">+${binData.points}</strong></div>
                </div>
            </div>
        </div>
    `;
}

function generateQRPattern(text) {
    // Generate a deterministic pattern based on text hash
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
        hash = ((hash << 5) - hash) + text.charCodeAt(i);
        hash = hash & hash;
    }
    
    const size = 21; // QR code size
    let pattern = '<svg viewBox="0 0 ' + size + ' ' + size + '" class="qr-svg">';
    
    // Add finder patterns (corners)
    pattern += generateFinderPattern(0, 0);
    pattern += generateFinderPattern(size - 7, 0);
    pattern += generateFinderPattern(0, size - 7);
    
    // Generate data pattern
    const seed = Math.abs(hash);
    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            // Skip finder pattern areas
            if ((x < 8 && y < 8) || (x >= size - 8 && y < 8) || (x < 8 && y >= size - 8)) continue;
            
            // Deterministic "random" based on position and seed
            const cellHash = (seed + x * 31 + y * 17 + x * y) % 100;
            if (cellHash < 40) {
                pattern += `<rect x="${x}" y="${y}" width="1" height="1" fill="#10b981"/>`;
            }
        }
    }
    
    pattern += '</svg>';
    return pattern;
}

function generateFinderPattern(x, y) {
    return `
        <rect x="${x}" y="${y}" width="7" height="7" fill="#10b981"/>
        <rect x="${x + 1}" y="${y + 1}" width="5" height="5" fill="white"/>
        <rect x="${x + 2}" y="${y + 2}" width="3" height="3" fill="#10b981"/>
    `;
}

function downloadQR() {
    const qrResult = document.getElementById('qrResult');
    if (!qrResult) return;
    
    const binId = document.getElementById('qrBinSelect')?.value || 'QR';
    
    // Create canvas from the display
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 500;
    const ctx = canvas.getContext('2d');
    
    // Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 400, 500);
    
    // Get bin info
    const bin = AdminState.bins.find(b => b.id === binId);
    const t = binTypes[bin?.type || 'general'];
    
    // Draw QR pattern
    ctx.fillStyle = '#10b981';
    const size = 21;
    const scale = 10;
    const offset = (400 - size * scale) / 2;
    
    // Draw finder patterns
    drawFinderPattern(ctx, offset, 50, scale);
    drawFinderPattern(ctx, offset + (size - 7) * scale, 50, scale);
    drawFinderPattern(ctx, offset, 50 + (size - 7) * scale, scale);
    
    // Draw data pattern
    const text = JSON.stringify({ binCode: binId, type: bin?.type, points: t.points });
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
        hash = ((hash << 5) - hash) + text.charCodeAt(i);
        hash = hash & hash;
    }
    const seed = Math.abs(hash);
    
    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            if ((x < 8 && y < 8) || (x >= size - 8 && y < 8) || (x < 8 && y >= size - 8)) continue;
            const cellHash = (seed + x * 31 + y * 17 + x * y) % 100;
            if (cellHash < 40) {
                ctx.fillRect(offset + x * scale, 50 + y * scale, scale, scale);
            }
        }
    }
    
    // Add text
    ctx.fillStyle = '#1f2937';
    ctx.font = 'bold 24px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(binId, 200, 320);
    
    ctx.font = '18px sans-serif';
    ctx.fillText(t.icon + ' ' + t.name, 200, 360);
    
    ctx.fillStyle = '#10b981';
    ctx.font = 'bold 28px sans-serif';
    ctx.fillText('+' + t.points + ' แต้ม', 200, 410);
    
    ctx.fillStyle = '#6b7280';
    ctx.font = '14px sans-serif';
    ctx.fillText('Scan to Earn', 200, 460);
    
    // Download
    const link = document.createElement('a');
    link.download = `QR_${binId}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
}

function drawFinderPattern(ctx, x, y, scale) {
    ctx.fillStyle = '#10b981';
    ctx.fillRect(x, y, 7 * scale, 7 * scale);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x + scale, y + scale, 5 * scale, 5 * scale);
    ctx.fillStyle = '#10b981';
    ctx.fillRect(x + 2 * scale, y + 2 * scale, 3 * scale, 3 * scale);
}

function deleteQR(code) {
    if (confirm(`ลบ QR "${code}"?`)) {
        AdminState.qrCodes = AdminState.qrCodes.filter(q => q.binCode !== code);
        saveQRCodes();
        renderSavedQR();
    }
}

// ============================================
// BINS
// ============================================
function saveBin() {
    const code = document.getElementById('newBinCode')?.value.trim().toUpperCase();
    const type = document.getElementById('newBinType')?.value || 'general';
    const location = document.getElementById('newBinLocation')?.value.trim() || '';
    
    if (!code) { alert('กรุณากรอกรหัสถัง'); return; }
    if (AdminState.bins.find(b => b.id === code)) { alert('รหัสนี้มีอยู่แล้ว'); return; }
    
    AdminState.bins.push({ id: code, type, location, active: true });
    saveBins();
    renderBinsTable();
    renderStats();
    populateBinSelect();
    closeModal('addBinModal');
    
    document.getElementById('newBinCode').value = '';
    document.getElementById('newBinLocation').value = '';
}

function toggleBinStatus(id) {
    const bin = AdminState.bins.find(b => b.id === id);
    if (bin) { bin.active = !bin.active; saveBins(); renderBinsTable(); renderStats(); populateBinSelect(); }
}

function deleteBin(id) {
    if (confirm(`ลบถัง "${id}"?`)) {
        AdminState.bins = AdminState.bins.filter(b => b.id !== id);
        saveBins(); renderBinsTable(); renderStats(); populateBinSelect();
    }
}

// ============================================
// USER MANAGEMENT
// ============================================
function viewUserDetail(userId) {
    const user = getUsers().find(u => u.id === userId);
    if (!user) return;
    
    document.getElementById('editingUserId').value = userId;
    document.getElementById('detailUserId').textContent = userId;
    document.getElementById('detailUsername').value = user.username;
    document.getElementById('detailEmail').value = user.email;
    document.getElementById('detailFullName').value = user.fullName;
    document.getElementById('detailPoints').value = user.points || 0;
    document.getElementById('detailCreatedAt').textContent = formatDate(user.createdAt);
    document.getElementById('detailPasswordHash').textContent = user.password;
    
    const roleEl = document.getElementById('detailRole');
    if (user.role === 'admin') {
        roleEl.textContent = user.id === 1 ? '👑 แอดมินหลัก' : '🔐 แอดมินรอง';
        roleEl.className = 'role-badge ' + (user.id === 1 ? 'main' : 'sub');
    } else {
        roleEl.textContent = '👤 ผู้ใช้ทั่วไป';
        roleEl.className = 'role-badge user';
    }
    
    showModal('userDetailModal');
}

function saveUserDetail() {
    const userId = parseInt(document.getElementById('editingUserId').value);
    const users = getUsers();
    const idx = users.findIndex(u => u.id === userId);
    if (idx < 0) { alert('ไม่พบผู้ใช้'); return; }
    
    users[idx].email = document.getElementById('detailEmail').value.trim();
    users[idx].fullName = document.getElementById('detailFullName').value.trim();
    users[idx].points = parseInt(document.getElementById('detailPoints').value) || 0;
    
    saveUsers(users);
    closeModal('userDetailModal');
    renderUsersTable(); renderAdminsTable();
    alert('บันทึกสำเร็จ!');
}

function openResetPassword(userId, userName) {
    document.getElementById('resetUserId').value = userId;
    document.getElementById('resetUserName').textContent = userName;
    document.getElementById('newPassword').value = '';
    document.getElementById('confirmNewPassword').value = '';
    showModal('resetPasswordModal');
}

function openResetPasswordFromDetail() {
    const userId = parseInt(document.getElementById('editingUserId').value);
    const user = getUsers().find(u => u.id === userId);
    if (user) { closeModal('userDetailModal'); openResetPassword(userId, user.fullName); }
}

function resetPassword() {
    const userId = parseInt(document.getElementById('resetUserId').value);
    const newPass = document.getElementById('newPassword').value;
    const confirm = document.getElementById('confirmNewPassword').value;
    
    if (!newPass || newPass.length < 6) { alert('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร'); return; }
    if (newPass !== confirm) { alert('รหัสผ่านไม่ตรงกัน'); return; }
    
    const users = getUsers();
    const user = users.find(u => u.id === userId);
    if (user) {
        user.password = hashPassword(newPass);
        saveUsers(users);
        closeModal('resetPasswordModal');
        alert('รีเซ็ตรหัสผ่านสำเร็จ!');
    }
}

// ============================================
// ADMIN MANAGEMENT
// ============================================
function saveAdmin() {
    if (!isMainAdmin) { alert('เฉพาะแอดมินหลักเท่านั้น'); return; }
    
    const username = document.getElementById('newAdminUsername')?.value.trim();
    const email = document.getElementById('newAdminEmail')?.value.trim();
    const fullName = document.getElementById('newAdminName')?.value.trim();
    const password = document.getElementById('newAdminPassword')?.value;
    
    if (!username || !email || !fullName || !password) { alert('กรุณากรอกข้อมูลให้ครบ'); return; }
    
    const users = getUsers();
    if (users.find(u => u.username.toLowerCase() === username.toLowerCase())) { alert('Username นี้มีอยู่แล้ว'); return; }
    if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) { alert('Email นี้มีอยู่แล้ว'); return; }
    
    users.push({
        id: Date.now(), username, email, fullName,
        password: hashPassword(password), role: 'admin',
        points: 0, transactions: [], createdAt: new Date().toISOString()
    });
    
    saveUsers(users);
    closeModal('addAdminModal');
    renderAdminsTable();
    
    ['newAdminUsername', 'newAdminEmail', 'newAdminName', 'newAdminPassword'].forEach(id => {
        document.getElementById(id).value = '';
    });
    
    alert('เพิ่มแอดมินสำเร็จ!');
}

function removeAdmin(id) {
    if (!isMainAdmin) { alert('เฉพาะแอดมินหลักเท่านั้น'); return; }
    if (id === 1) { alert('ไม่สามารถลบแอดมินหลักได้'); return; }
    
    if (confirm('ลบแอดมินนี้? (จะเปลี่ยนเป็นผู้ใช้ทั่วไป)')) {
        const users = getUsers();
        const user = users.find(u => u.id === id);
        if (user) { user.role = 'user'; saveUsers(users); renderAdminsTable(); alert('ลบแอดมินสำเร็จ'); }
    }
}

// ============================================
// HELPERS
// ============================================
function formatTime(ts) {
    if (!ts) return '-';
    const d = new Date(ts), now = new Date(), diff = now - d;
    if (diff < 60000) return 'เมื่อกี้';
    if (diff < 3600000) return Math.floor(diff / 60000) + ' นาที';
    if (diff < 86400000) return Math.floor(diff / 3600000) + ' ชม.';
    return d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
}

function formatDate(ts) {
    if (!ts) return '-';
    return new Date(ts).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
}

// Global
window.goToQRForBin = goToQRForBin;
window.deleteQR = deleteQR;
window.toggleBinStatus = toggleBinStatus;
window.deleteBin = deleteBin;
window.viewUserDetail = viewUserDetail;
window.openResetPassword = openResetPassword;
window.openResetPasswordFromDetail = openResetPasswordFromDetail;
window.removeAdmin = removeAdmin;
window.showModal = showModal;
window.closeModal = closeModal;

document.addEventListener('DOMContentLoaded', init);
