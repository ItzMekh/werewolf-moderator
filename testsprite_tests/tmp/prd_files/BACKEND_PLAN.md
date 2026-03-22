# Backend & Database Architecture Plan
เอกสารนี้อธิบายแผนการสเกลและพัฒนาระบบหลังบ้าน (Backend) และฐานข้อมูล (Database) อย่างละเอียด เพื่อรองรับผู้เล่นจำนวนมากขึ้นและแก้ปัญหาระบบล่มระหว่างเล่น

---

## 1. การปรับปรุงสถาปัตยกรรม Database (Database Evolution)

ปัจจุบันระบบใช้ **SQLite** ซึ่งเหมาะสำหรับการทำ MVP (Minimum Viable Product) แต่เมื่อมีผู้เล่นจริง ควรเปลี่ยนไปใช้ **MongoDB (Atlas)** แทน เนื่องจากข้อมูลของแอปประเภท Real-time Game จะมีลักษณะเป็น Document (JSON) ที่ยืดหยุ่นสูง ซึ่งเข้ากันได้ดีกับ MongoDB

### 1.1 เปลี่ยน Database Provider เป็น MongoDB
- **ออปชัน A (ใช้ Prisma):** ใน `prisma/schema.prisma` เปลี่ยน `provider = "sqlite"` เป็น `provider = "mongodb"` และเชื่อมต่อผ่าน Connection String ของ MongoDB Atlas
- **ออปชัน B (ใช้ Mongoose/Native Driver):** เลิกใช้ Prisma และเปลี่ยนไปใช้ Mongoose ชั่วคราว ซึ่งจะยืดหยุ่นกว่ามากในการเก็บ Game State ที่โครงสร้างอาจเปลี่ยนตลอดเวลา

### 1.2 การออกแบบ Schema / Data Model เพิ่มเติม
เพิ่ม Collection (Model) และ Field ให้รองรับฟีเจอร์ใหม่ๆ (ตัวอย่างเป็น Prisma Schema สำหรับ MongoDB):

```prisma
// 1. ตาราง Achievements/Titles
model PlayerAchievement {
  id         String   @id @default(auto()) @map("_id") @db.ObjectId
  playerId   String   @db.ObjectId
  player     Player   @relation(fields: [playerId], references: [id])
  title      String   // เช่น "Master Wolf", "Savior"
  unlockedAt DateTime @default(now())

  @@unique([playerId, title])
}

// 2. ปรับ Player ให้เก็บสถิติแยก (จะได้ไม่ต้องคำนวณใหม่ทุกครั้ง)
model Player {
  id           String              @id @default(auto()) @map("_id") @db.ObjectId
  username     String              @unique
  passwordHash String
  matchesPlayed Int                @default(0)
  matchesWon    Int                @default(0)
  achievements  PlayerAchievement[]
  // ... fields อื่นๆ ...
}

// 3. เพิ่ม Field ใน GameEvent ให้รองรับรายละเอียดของบทบาทใหม่
model GameEvent {
  id         String   @id @default(auto()) @map("_id") @db.ObjectId
  // ... fields เดิม ...
  subAction String? // เช่น ใช้ยาพิษ (poison), ยาชุบ (heal) สำหรับแม่มด
}
```

---

## 2. การจัดการ Game State เชิงลึก (Persistent State)

ปัญหาที่ใหญ่ที่สุดของบอท / เกมที่ใช้ Socket ล้วนๆ คือ **"เมื่อ Server Restart เกมทั้งหมดที่หลุดกลางคันจะหายไปแบบกู่ไม่กลับ"**

### 2.1 ใช้ Redis เข้ามาคั่น State
แทนที่จะเก็บตัวแปร `const rooms = new Map();` ไว้ใน RAM ของ Node.js ให้ย้ายไปเก็บใน **Redis** (In-memory Data Store)
- **JSON Storage:** บันทึก `room.gameState` ลง Redis เป็น JSON Format
- **Flow การทำงาน:**
  1. ทุกครั้งที่มีการกระทำ (เช่น โหวต, เปลี่ยน Phase) ให้อัปเดต State ลง Redis
  2. หาก Node.js ร่วงและตื่นขึ้นมาใหม่ ให้ดึง Room State ทั้งหมดจาก Redis กลับมาที่ `gameManager.js`
  3. ผู้เล่นที่เชื่อมต่อ Socket เข้ามาใหม่ จะถูกพาเข้าสู่ห้องเดิมและ State เดิมทันทีไร้รอยต่อ

---

## 3. การรองรับผู้เล่นจำนวนมาก (Scaling WebSockets)

เมื่อมีคนเล่นพร้อมกัน (Concurrent Users) เกิน 2,000 คน Node.js instance เดียวอาจจะรับโหลดไม่ไหวและกิน CPU สูงมาก

### 3.1 การทำ Horizontal Scaling
- ถ้าระบบรันบน Docker / Cloud (เช่น AWS ECS หรือ Render) ให้เปิด Server 2-3 เครื่อง
- **ปัญหาที่ตามมา:** Socket ของผู้เล่น A อาจจะวิ่งไปเครื่อง 1 ส่วนผู้ดำเนินเกมวิ่งไปเครื่อง 2 ทำให้คุยกันไม่รู้เรื่อง
- **ทางแก้:** ใช้ `@socket.io/redis-adapter` 
  - ให้ Socket.io ทุกเครื่องคุยกันผ่าน Redis Pub/Sub
  - ผู้เล่นจะเชื่อมต่อเข้าเครื่องไหนก็ได้ ข้อมูลในห้อง (Room) จะซิงค์ข้ามเซิร์ฟเวอร์แบบ Real-time ทันที

---

## 4. ความปลอดภัย (Security & Validation)

เกมที่มีการแข่งขันมักจะมีการโกง (Client Manipulation) ควรรัดกุม API และ Socket ให้มากขึ้น

### 4.1 Strict Payload Validation
- ใช้ **Zod** หรือ **Joi** ในการตรวจสอบตอนรับ Socket Events 
- ตัวอย่างการป้องกัน:
  - ฝั่ง Client ส่งข้อมูลว่า `day-vote: โหวตฆ่าคนตาย`
  - Backend ต้องเช็คเสมอว่าคนที่กดโหวต **"ยังมีชีวิตอยู่หรือไม่"** และ **"เป้าหมายยังมีชีวิตอยู่หรือไม่"** (ปัจจุบันมีเช็คเบื้องต้นแล้ว แต่ต้องทำทุก Events)

### 4.2 Rate Limiting (ป้องกันการยิงเซิร์ฟ)
- ใส่ `express-rate-limit` ในหน้า API Login / Register
- จำกัดจำนวนการสร้างห้อง (Create Room) ต่อ 1 IP ตัวอย่างเช่น 5 ห้อง / นาที ป้องกันบอทสร้างห้องขยะจน Memory เต็ม

---

## 📋 สรุปแผนงานที่ควรทำ (Step-by-Step Execution)
1. ติดตั้ง `mongodb` หรือ `mongoose` (หรือปรับ `@prisma/client` ไปใช้ MongoDB) และเชื่อมข้อมูลเข้ากับ MongoDB Atlas
2. ตั้งค่า Redis Server (เช่น บน Upstash หรือ ElastiCache)
3. รื้อโค้ดใน `gameManager.js` ให้ Getter/Setter ทำงานผ่าน Redis (ใช้คำสั่ง `redis.set` และ `redis.get`) หรือเก็บลง MongoDB แบบ Real-time
4. เพิ่ม Zod Validation ในทุก Socket Payload ใน `index.js`
