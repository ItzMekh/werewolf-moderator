# Backend & Database Architecture Plan
เอกสารนี้อธิบายแผนการใช้ฐานข้อมูล (Database) อย่างละเอียด รวมถึงแนวทางการสเกลและเพิ่มความปลอดภัย

---

## 1. Database Schema (Prisma + MongoDB Atlas)

ระบบเก็บข้อมูลของแอปพลิเคชันเลือกใช้ **MongoDB Atlas** ควบคู่ไปกับ **Prisma ORM** เพื่อจัดการ State และ History ของการเล่น เพราะ MongoDB รองรับข้อมูล JSON ได้ยืดหยุ่นมาก

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mongodb"
  url      = env("DATABASE_URL")
}

model Role {
  id             String       @id @default(auto()) @map("_id") @db.ObjectId
  name           String       @unique
  team           String       // "werewolf" | "village"
  description    String?
  hasNightAction Boolean      @default(false)
  createdAt      DateTime     @default(now())
  gamePlayers    GamePlayer[]
}

model Player {
  id           String              @id @default(auto()) @map("_id") @db.ObjectId
  username     String              @unique
  passwordHash String?
  matchesPlayed Int                @default(0)
  matchesWon    Int                @default(0)
  createdAt    DateTime            @default(now())
  achievements PlayerAchievement[]
  gamePlayers  GamePlayer[]
}

model PlayerAchievement {
  id         String   @id @default(auto()) @map("_id") @db.ObjectId
  playerId   String   @db.ObjectId
  player     Player   @relation(fields: [playerId], references: [id])
  title      String   // เช่น "Master Wolf", "Savior"
  unlockedAt DateTime @default(now())
  @@unique([playerId, title])
}

model Game {
  id          String       @id @default(auto()) @map("_id") @db.ObjectId
  roomCode    String
  status      String       // "lobby" | "playing" | "finished"
  winnerTeam  String?      // "werewolf" | "village" | null
  playerCount Int
  rounds      Int          @default(0)
  startedAt   DateTime?
  endedAt     DateTime?
  createdAt   DateTime     @default(now())
  gamePlayers GamePlayer[]
  gameEvents  GameEvent[]
}

model GamePlayer {
  id         String   @id @default(auto()) @map("_id") @db.ObjectId
  game       Game     @relation(fields: [gameId], references: [id])
  gameId     String   @db.ObjectId
  player     Player   @relation(fields: [playerId], references: [id])
  playerId   String   @db.ObjectId
  role       Role     @relation(fields: [roleId], references: [id])
  roleId     String   @db.ObjectId
  isAlive    Boolean  @default(true)
  deathRound Int?
  deathCause String?  // "werewolf" | "voted" | null
  isWinner   Boolean  @default(false)
}

model GameEvent {
  id        String   @id @default(auto()) @map("_id") @db.ObjectId
  game      Game     @relation(fields: [gameId], references: [id])
  gameId    String   @db.ObjectId
  round     Int
  phase     String   // "night" | "day"
  actorName String?
  targetName String?
  action    String   // "kill" | "check" | "save" | "protect" | "vote"
  subAction String?  // เช่นใช้ ยาพิษ ยาชุบของแม่มด
  result    String?
  createdAt DateTime @default(now())
}
```

---

## 2. การจัดการ Game State เชิงลึก (Persistent State / Redis)

ปัญหาที่ใหญ่ที่สุดของบอท / เกมที่ใช้ Socket ล้วนๆ คือ **"เมื่อ Server Restart เกมทั้งหมดที่หลุดกลางคันจะหายไปแบบกู่ไม่กลับ"**

### การนำ Redis เข้ามาคั่น State
แทนที่จะเก็บตัวแปร `const rooms = new Map();` ไว้ใน RAM ของ Node.js ให้ย้ายไปเก็บใน **Redis** (In-memory Data Store) หรือ MongoDB
- **Flow การทำงาน:**
  1. ทุกครั้งที่มีการแจกบทบาท โหวต หรือเปลี่ยน Phase ให้อัปเดต Object ข้อมูลลง Redis/MongoDB ทันที
  2. หากเซิร์ฟเวอร์ร่วงและระบบถูกเปิดขึ้นมาใหม่ ระบบจะเช็ค State ล่าสุดจาก DB
  3. ผู้เล่นที่เชื่อมต่อ Socket กลับเข้ามา จะถูกดึงหน้าจอกลับมาที่ Phase ล่าสุดอย่างเนียนๆ

---

## 3. การรองรับผู้เล่นจำนวนมาก (Scaling WebSockets)

เมื่อมีคนเล่นพร้อมกันหลักร้อย/หลักพันห้อง Node.js ตัวเดียวอาจรับไม่ไหว

### Horizontal Scaling
- ถ้าระบบรันบน Docker ให้เปิด Server 2-3 เครื่องช่วยกัน
- **ทางแก้ Socket ID ขาดการติดต่อ:** ใช้ `@socket.io/redis-adapter` 
  - ให้ Socket.io ทุกเครื่องคุยกันผ่านอินเตอร์คอมกลางของระบบ (Redis Pub/Sub)
  - นาย A อาจจะไปโผล่ที่ Server 1 ส่วนจอโทรศัพท์ของ Moderator โผล่ที่ Server 2 ทั้งคู่ก็ยังคุยเกมเดียวกันรู้เรื่อง

---

## 4. ความปลอดภัย (Security & Validation)

เกมที่มีการแข่งขันมักจะมีการโกง ควรรัดกุม API ให้มากขึ้น

1. **Strict Payload Validation:**
   - ใช้ **Zod** ตรวจสอบ Socket Events ทุกเส้น
   - Backend ต้อง Double-Check ว่าคนที่ส่งคำสั่งโหวต `"ยังมีชีวิตอยู่หรือไม่"` แทนที่จะเชื่อค่าที่ผู้เล่นแอบเปลี่ยนใน Client 100%

2. **Rate Limiting:**
   - ป้องกันสแปมสร้างห้อง (Create Room) สมมติจำกัด 5 ห้อง/นาที/IP ป้องกันบอทยิงห้องขยะจนฐานข้อมูลเต็ม
