# 🌼 TOKYO HOUSE — ระบบร้านขนมโตเกียว

เว็บแอปร้านขนมโตเกียว มี 2 บทบาท (ลูกค้า / แอดมิน) พร้อมระบบสแกน QR สั่งอาหาร,
สรุปยอดเงิน, จัดการเมนู และสถิติคาดการณ์การขาย

เขียนด้วย **React + Vite + Tailwind CSS + Framer Motion + Recharts** และหลังบ้าน **Supabase**

---

## ✨ ฟีเจอร์

### ฝั่งลูกค้า
- **หน้าแรก** — Hero สไตล์ SWEET & CRISPY พร้อมรูปลอยแอนิเมชัน + เมนูแนะนำ
- **สั่งอาหาร** — เลือกเมนู ค้นหา กรอง (หวาน/คาว) เพิ่มลงตะกร้า
- **สแกน QR สั่งอาหาร** — สแกน QR ที่โต๊ะ → เข้าหน้าสั่งอาหารในนามโต๊ะนั้นทันที (`/table/:id`)
- **ตะกร้า + ชำระเงิน** — ยืนยันออเดอร์ แล้วได้ **QR PromptPay** สำหรับชำระเงิน
- **ช่องทางติดต่อ** — Facebook / TikTok / โทร / แผนที่

### ฝั่งแอดมิน (ต้องล็อกอิน)
- **แดชบอร์ด** — ออเดอร์ล่าสุด (เปลี่ยนสถานะได้), การ์ดสรุป, กราฟยอดขาย, กราฟคาดการณ์
- **ยอดขาย** — เลือกช่วงวันที่, กราฟต้นทุน/ยอดขาย, สรุปจำนวนเงินทั้งหมด
- **เมนู** — เพิ่ม/ลบ/แก้ไขเมนูแบบ inline, เปิด-ปิดการขาย, ค้นหา, กรอง, EXPORT CSV, บันทึก
- **สร้าง QR ติดโต๊ะ** — หน้า `/table` (ตอนล็อกอินแอดมิน) สร้าง QR ของแต่ละโต๊ะเพื่อพิมพ์ไปติด

> เข้าหน้าแอดมิน: คลิก **"เข้าสู่ระบบแอดมิน"** ที่ footer → ใส่รหัส (ค่าเริ่มต้น `admin1234`)

---

## 🚀 เริ่มใช้งาน

```bash
npm install
npm run dev
```

เปิด http://localhost:5173

> ยังไม่ต้องตั้งค่า Supabase ก็ใช้ได้ทันที — ระบบจะใช้ **ข้อมูลตัวอย่าง (mock)**
> ที่เก็บไว้ในเบราว์เซอร์ (สั่งออเดอร์/แก้เมนูแล้วยังอยู่จนกว่าจะล้าง)

---

## 🔌 เชื่อมต่อ Supabase (ของจริง)

1. สร้างโปรเจกต์ที่ https://supabase.com
2. เปิด **SQL Editor** แล้วรันไฟล์ [`supabase/schema.sql`](supabase/schema.sql)
   (สร้างตาราง `menu_items`, `orders`, `expenses` + ข้อมูลตัวอย่าง)
3. คัดลอก `.env.example` เป็น `.env` แล้วใส่ค่าจาก **Project Settings → API**

```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
VITE_ADMIN_PASSWORD=รหัสแอดมินของคุณ
```

4. `npm run dev` ใหม่ — ระบบจะสลับไปอ่าน/เขียน Supabase อัตโนมัติ

> **หมายเหตุความปลอดภัย:** schema เดโมเปิด RLS ให้ `anon` อ่าน/เขียนได้เพื่อความง่าย
> ก่อนขึ้นใช้งานจริงควรจำกัดสิทธิ์ (เช่น เขียน orders ได้เฉพาะ insert,
> แก้ menu/สถานะได้เฉพาะผู้ที่ล็อกอินด้วย Supabase Auth)

---

## 📁 โครงสร้างโปรเจกต์

```
src/
├─ components/     Navbar, Footer, Hero, OrdersTable, Charts, StatusSelect
├─ context/        AppContext (บทบาท, โต๊ะ, ตะกร้า, ล็อกอินแอดมิน)
├─ lib/            supabase.js, data.js (สลับ Supabase/mock), mockData.js
├─ pages/          Home, Order, Checkout, Contact, TableSelect, Login
│  └─ admin/       Dashboard, Sales, MenuManage
└─ App.jsx         เส้นทาง (routing) + guard หน้าแอดมิน
public/images/     LOGO, background, products/*
supabase/schema.sql
```

## 🛠️ Build

```bash
npm run build      # ได้ไฟล์ใน dist/
npm run preview    # ทดสอบ build
```
