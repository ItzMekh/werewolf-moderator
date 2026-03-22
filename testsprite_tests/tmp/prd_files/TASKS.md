# Werewolf Moderator - Task Tracker
รายการสิ่งที่ต้องทำในการพัฒนาโปรเจกต์ (ย้ายมาจากหน้าเก่า)

## 🎯 Planning
- [x] Research requirements and design architecture
- [x] Create implementation plan
- [x] Get user approval on plan
- [x] Draft backend scaling plan
- [x] Draft database schema updates

## 💻 Execution
- [x] Initialize project (Vite + React frontend, Express + Socket.io backend)
- [x] Set up MongoDB Atlas cluster and connection
- [x] Build backend: Room management, game state, Socket.io events
- [x] Build frontend: UI pages (Home, Create Room, Join Room, Game)
- [x] Implement game logic (role assignment, night/day phases, voting)
- [x] Style the app with premium dark theme design
- [x] Polish animations and responsive mobile design
- [x] **[UI Fix]** แก้ไขปัญหาไพ่บทบาท (Role Card) โชว์ก่อนเวลา: ซ่อนหน้าไพ่เป็นค่าเริ่มต้น ใช้ระบบกดค้าง 600ms (Hold to Reveal) + progress ring + haptic feedback
- [x] **[UX]** ระบบสั่น (Haptic Feedback): จอมือถือสั่นเตือน 2 ครั้งเมื่อถึงตาของผู้เล่นในกลางคืน

## ✅ Verification
- [ ] Test game flow end-to-end in browser
- [ ] Verify mobile responsiveness
- [ ] Create walkthrough
