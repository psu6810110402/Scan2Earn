# 🌿 Scan to Earn - QR Points Collection System

ระบบสะสมแต้มจากการทิ้งขยะด้วยการสแกน QR Code

![Scan to Earn](https://img.shields.io/badge/Version-1.0.0-green)
![License](https://img.shields.io/badge/License-MIT-blue)

## 📋 Features

- ✅ สแกน QR Code เพื่อสะสมแต้ม
- ✅ ระบบสมาชิก (สมัคร/เข้าสู่ระบบ)
- ✅ Admin Dashboard สำหรับจัดการระบบ
- ✅ สร้าง QR Code สำหรับถังขยะ
- ✅ รองรับ Light/Dark Mode
- ✅ Responsive Design

---

## 🚀 Quick Start (ทดสอบบนเครื่อง)

```bash
# 1. Clone หรือ Download โปรเจค
cd scan-to-earn

# 2. รันเซิร์ฟเวอร์
npx serve .

# 3. เปิด http://localhost:3000
```

**Default Admin Login:**

- Username: `admin`
- Password: `Admin@123`

---

## ☁️ Deploy (Production)

### Step 1: สร้าง Supabase Project

1. ไปที่ [supabase.com](https://supabase.com) และสมัครสมาชิก (ฟรี)
2. กด "New Project" และตั้งชื่อ
3. รอให้ Project สร้างเสร็จ (~2 นาที)

### Step 2: สร้างตาราง Database

1. ไปที่ **SQL Editor** ใน Supabase Dashboard
2. Copy เนื้อหาจากไฟล์ `database.sql`
3. วางแล้วกด **Run**

### Step 3: ตั้งค่า Config

1. ไปที่ **Settings > API** ใน Supabase
2. Copy **Project URL** และ **anon/public key**
3. เปิดไฟล์ `config.js` และใส่ค่า:

```javascript
const CONFIG = {
  SUPABASE_URL: "https://xxxxx.supabase.co", // ใส่ URL ที่ได้
  SUPABASE_ANON_KEY: "eyJhbGciOi...", // ใส่ Key ที่ได้
  // ...
};
```

### Step 4: Deploy

**Option A: Vercel (แนะนำ)**

```bash
npm i -g vercel
vercel
```

**Option B: Netlify**

1. ไปที่ [netlify.com](https://netlify.com)
2. ลาก folder โปรเจคไปวาง

**Option C: GitHub Pages**

1. Push ไป GitHub
2. Settings > Pages > Deploy from main branch

---

## 📁 Project Structure

```
scan-to-earn/
├── index.html      # หน้าหลัก (User App)
├── admin.html      # Admin Dashboard
├── config.js       # ⭐ ตั้งค่า Supabase ที่นี่
├── database.sql    # SQL สำหรับสร้างตาราง
├── supabase.js     # Database Helper
├── app.js          # User App Logic
├── admin.js        # Admin Dashboard Logic
├── styles.css      # User App Styles
├── admin.css       # Admin Dashboard Styles
└── README.md       # คุณกำลังอ่านอยู่
```

---

## ⚙️ Configuration

### Bin Types (ประเภทถังขยะ)

แก้ไขใน `config.js`:

```javascript
BIN_TYPES: {
    general: { name: 'ถังทั่วไป', icon: '🗑️', points: 10 },
    recycle: { name: 'ถังรีไซเคิล', icon: '♻️', points: 20 },
    hazardous: { name: 'ถังอันตราย', icon: '☢️', points: 30 },
    // เพิ่มประเภทใหม่ได้ที่นี่
}
```

### Default Admin

แก้ไขใน `config.js`:

```javascript
DEFAULT_ADMIN: {
    username: 'admin',
    email: 'admin@yourcompany.com',
    password: 'YourSecurePassword123!',
    fullName: 'ชื่อแอดมิน'
}
```

---

## 🔒 Security Notes

1. **อย่าเปิดเผย SUPABASE_KEY ใน public repository**
2. เปลี่ยนรหัส Admin ทันทีหลัง deploy
3. ใช้ Row Level Security (RLS) ที่ตั้งค่าไว้ใน database.sql

---

## 📱 QR Code Format

QR Code ที่สร้างจะมีข้อมูลในรูปแบบ JSON:

```json
{
  "binCode": "GEN-001",
  "type": "general",
  "points": 10,
  "location": "อาคาร A ชั้น 1"
}
```

---

## 🛠️ Tech Stack

- **Frontend:** HTML, CSS, JavaScript (Vanilla)
- **Database:** Supabase (PostgreSQL) / localStorage fallback
- **Fonts:** Kanit, Inter (Google Fonts)
- **Icons:** Emoji-based

---

## 📄 License

MIT License - ใช้งานได้อิสระ

---

## 🤝 Support

หากมีปัญหาหรือข้อสงสัย สามารถเปิด Issue ได้ที่ GitHub
