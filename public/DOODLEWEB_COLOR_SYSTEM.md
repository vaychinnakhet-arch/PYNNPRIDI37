# 🎨 คู่มือระบบสีและการออกแบบสไตล์ DoodleWeb (Design System Cheat Sheet)
**โครงการ:** PYNN PRIDI 37  
**แรงบันดาลใจ:** [DoodleWeb (doodleweb.io)](https://doodleweb.io/services/web-design-and-development)  
**ไฟล์ CSS หลัก:** `doodle_theme.css`  
**ไฟล์สเปกทางการ:** `DESIGN.md`

---

## 1. พาเลตสีหลัก (Core Color Palette)

### 📄 กระดาษและพื้นผิว (Canvas & Surface)
| ชื่อสี | ตัวอย่างโค้ดสี | CSS Variable | คลาส Tailwind แนะนำ | หน้าที่และการใช้งาน |
|---|---|---|---|---|
| **Warm Cream** | `#FAF5EE` | `--dw-cream` | `bg-[#FAF5EE]` | **พื้นหลังผืนผ้าใบหลักของทั้งหน้าเว็บ** (โทนกระดาษครีมอบอุ่น สบายตา ไม่ขาวจ้า) |
| **Deep Cream Tint** | `#F6E9D7` | `--dw-cream-deep` | `bg-[#F6E9D7]` | หัวตารางแถวแรก (Sticky Header), พื้นหลังชิป, กรอบคัดกรอง |
| **Paper White** | `#FFFFFF` | `--dw-white` | `bg-white` | แผ่นการ์ดลอย (Cards), กล่องสถิติ KPI, ป็อปอัป Modal |
| **Soft Grid Line** | `#E2D9CC` | `--dw-border-soft` | `border-[#E2D9CC]` | เส้นตารางภายใน เส้นคั่นเนื้อหาแบบไม่รบกวนสายตา |

---

### 🖋️ สีหมึกและโครงสร้าง (Deep Navy Ink - แทนสีดำสนิท)
> 💡 **หัวใจของ DoodleWeb**: จะ **ไม่ใช้สีดำสนิท (`#000000`) หรือ Slate ทึบ** แต่จะใช้ **Deep Navy `#1D2B45`** เป็นสีหมึกสำหรับเส้นขอบ ตัวหนังสือ และเงา เพื่อให้งานดูคราฟต์ พรีเมียม และมีชีวิตชีวา

| ชื่อสี | โค้ดสี | CSS Variable | หน้าที่ |
|---|---|---|---|
| **Deep Navy Ink** | `#1D2B45` | `--dw-navy` | เส้นขอบการ์ด 2px/2.5px, เงาบล็อกทึบ (`shadow-[..._#1D2B45]`), ข้อความหัวเรื่อง |
| **Secondary Slate** | `#3E4B69` | `--dw-navy-secondary` | คำอธิบายรอง, ซับไตเติล, ข้อมูลเมตา |
| **Muted Ink** | `#8C9AA8` | `--dw-navy-muted` | หัวตารางย่อยภาษาอังกฤษ (เช่น `DATE`, `ACTUAL`), ตัวหนังสือข้อความใบ้ |

---

### 🍊 สีส้ม Tangerine (Signature Accent สีเอกลักษณ์)
> 🌟 **จุดเด่นที่สุด**: สีส้มแมนดารินสดใส ถูกใช้เป็น Accent หลักที่สะดุดตา และเป็น **สีของเงาที่เด้งขึ้นมาเวลาเอาเมาส์ชี้ (Hover Shadow Pop)**!

| รหัสสี | โทน | การใช้งาน |
|---|---|---|
| `#F26B2A` | **Tangerine Primary** | ปุ่มหลัก (Primary CTA), ตัวหนังสือไฮไลต์ (เช่น `PRIDI 37`), ขอบช่องวันที่ปัจจุบัน (Today), **สีเงา Hover (`hover:shadow-[6px_6px_0px_#F26B2A]`)**, สี Hilight คลุมข้อความ |
| `#FFE8D6` | Tangerine Soft Tint | พื้นหลังแถบตารางวันที่กำลังเลือก, กล่องเน้นข้อความ |
| `#FFF3EB` | Tangerine Ultra Light | พื้นหลังเซลล์ข้อมูลวันปัจจุบันในตาราง Ledger |

---

### 🌈 สีหมวดหมู่และสถานะงาน (Functional Accents)

| หมวดหมู่ | โค้ดสีหลัก | โค้ดสีพื้นหลังอ่อน | โค้ดตัวหนังสือ | นำไปใช้ในส่วน |
|---|---|---|---|---|
| **🟢 Teal (สด / ก้าวหน้า)** | `#40C4C4` | `#E8F8F5` | `#0E5E57` | ป้ายสถานะระบบสด (`doodle-dot-live`), แถบเปอร์เซ็นต์เสาเข็ม |
| **🟡 Gold (เด่น / ระบบ)** | `#F7B844` | `#FEF3C7` | `#78350F` | ป้ายระบบออนไลน์, คอลัมน์ยอดรวม (TOTAL), ตัวเลขเตือน |
| **🌿 Emerald (เสร็จสมบูรณ์)** | `#10B981` | `#D1FAE5` | `#064E3B` | จำนวนเสาเข็มที่ตอกจริงแล้ว, การตรวจผ่านฉลุย |
| **🔴 Coral Red (เตือน / คลาดเคลื่อน)** | `#E64C3C` | `#FEE2E2` | `#991B1B` | ค่าเยื้องศูนย์ (Variance), รายการงานที่เกินเกณฑ์กำหนด, งาน Defect |
| **🔵 Blueprint Blue (แผนงาน)** | `#3B82F6` | `#EEF4FF` | `#1E3A8A` | ตัวเลขแผนงานสะสม, แผนรายวัน, ลิงก์โมเดล 3D |

---

## 2. กฎความโค้งมนและรูปทรง (Geometry & Shapes)

- **🚫 ห้ามใช้มุมฉากแหลม 0px เด็ดขาด**: สไตล์ DoodleWeb จะไม่มีมุมเหลี่ยมคมแบบมังงะ
- **💊 รูปทรงแคปซูลมน (Pills - `rounded-full`)**:
  - ปุ่มกดทุกปุ่ม (Buttons)
  - ป้ายแท็กสถานะ (Status Chips)
  - แถบความคืบหน้า (Progress Bars)
- **🔲 รูปทรงมุมมน Squircle (`rounded-2xl` ถึง `rounded-3xl`)**:
  - การ์ดหลัก (Hero Cards): `rounded-3xl` (`24px`)
  - การ์ดย่อยและกล่องสถิติ: `rounded-2xl` (`16px`)
  - ตาราง Ledger ภายนอก: `rounded-2xl` (`overflow-hidden`)

---

## 3. มิติและฟิสิกส์การสัมผัส (Tactile Physics & Shadows)

DoodleWeb ใช้ **เงาบล็อกทึบ (Solid Zero-Blur Shadow)** ที่เสมือนชิ้นกระดาษหรือสติกเกอร์แปะทับกัน:

```css
/* เงาปกติของการ์ด */
box-shadow: 4px 4px 0px #1D2B45;

/* เงาปกติของการ์ด Hero */
box-shadow: 6px 6px 0px #1D2B45;

/* เงาของปุ่มกดปกติ */
box-shadow: 3px 3px 0px #1D2B45;

/* 🔥 ท่าไม้ตาย DoodleWeb: เมื่อเมาส์ชี้ (Hover) เงาจะเปลี่ยนเป็นสีส้มและยกตัวขึ้น! */
transform: translate(-2px, -2px);
box-shadow: 6px 6px 0px #F26B2A;

/* เมื่อกดคลิก (Active / Pressed) ยุบตัวลง */
transform: translate(2px, 2px);
box-shadow: 1px 1px 0px #1D2B45;
```

---

## 4. แบบอักษร (Typography)

1. **ฟอนต์หัวเรื่องสไตล์นิตยสาร (Editorial Serif)**:
   - ฟอนต์: `'Fraunces', Georgia, serif`
   - จุดเด่น: หรูหรา อบอุ่น มีสไตล์ เส้นหนาบางชัดเจน
   - ใช้กับ: ชื่อโครงการ `PYNN PRIDI 37`, ตัวเลขไฮไลต์ใหญ่
2. **ฟอนต์เนื้อหาและปุ่ม (Modern Geometric Sans)**:
   - ฟอนต์: `'DM Sans', 'Prompt', 'Sarabun', sans-serif`
   - จุดเด่น: อ่านง่าย ทันสมัย รองรับภาษาไทยสมบูรณ์แบบ
   - ใช้กับ: ข้อความในการ์ด ปุ่มกด หัวตาราง
3. **ฟอนต์ตัวเลขเทคนิคและพิกัด (Technical Mono)**:
   - ฟอนต์: `'Space Mono', monospace`
   - จุดเด่น: ฟอนต์พิมพ์ดีด/ตารางตัวเลขที่มีความกว้างเท่ากัน
   - ใช้กับ: พิกัดเสาเข็ม, วันที่, เปอร์เซ็นต์ความคืบหน้า

---

## 5. คลาสสำเร็จรูปใน `doodle_theme.css` ที่หยิบไปใช้ได้ทันที

| Class Name | ลักษณะ | โค้ดตัวอย่าง |
|---|---|---|
| `.doodle-card` | การ์ดสีขาว ขอบมน เงาสีกรมท่า | `<div class="doodle-card p-5">...</div>` |
| `.doodle-card-hero` | การ์ด Hero ขนาดใหญ่ ขอบหนา 2.5px เงา 6px | `<div class="doodle-card-hero p-6">...</div>` |
| `.doodle-btn` | ปุ่มแคปซูลมนสีขาว ขอบกรมท่า Hover เด้งเงาส้ม | `<button class="doodle-btn">ดูรายละเอียด</button>` |
| `.doodle-btn-orange` | ปุ่มแคปซูลมนสีส้มสดใส ข้อความขาว สำหรับ Primary CTA | `<a class="doodle-btn doodle-btn-orange">เปิดโมเดล 3D</a>` |
| `.doodle-pill` | ชิปป้ายข้อความทรงมนขนาดกะทัดรัด | `<span class="doodle-pill doodle-pill-teal">LIVE</span>` |
| `.doodle-metric-tile` | กล่องสถิติ KPI ยกตัวและเปลี่ยนเงาส้มเมื่อ Hover | `<div class="doodle-metric-tile">...</div>` |
| `.doodle-annotation` | ข้อความเน้นสไตล์ลายมือ ฟอนต์เอียงสีส้ม พร้อมดาว `✦` | `<span class="doodle-annotation">✦ Senior Edition</span>` |
