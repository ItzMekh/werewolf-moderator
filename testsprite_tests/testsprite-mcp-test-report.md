# TestSprite AI Testing Report (MCP)

---

## 1️⃣ Document Metadata

| Field | Value |
|-------|-------|
| **Project Name** | werewolf-moderator |
| **Date** | 2026-03-23 |
| **Prepared by** | TestSprite AI Team |
| **Test Type** | Frontend (E2E) |
| **Total Tests Run** | 30 |
| **Pass Rate** | 46.67% (14 / 30) |
| **Fail Rate** | 53.33% (16 / 30) |

---

## 2️⃣ Requirement Validation Summary

---

### REQ-1: Home Navigation

#### TC001 — Navigate from Home to Create Room page
- **Test Code:** [TC001_Navigate_from_Home_to_Create_Room_page.py](./TC001_Navigate_from_Home_to_Create_Room_page.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/1d33db4e-105e-41be-9a02-6be949bca90c/22a4a99f-b7cb-424d-aded-9734c7862380
- **Status:** ✅ Passed
- **Analysis / Findings:** The "Create Room" button on the Home page correctly navigates to `/create`. Routing and link rendering work as expected.

---

#### TC002 — Navigate from Home to Join Room page
- **Test Code:** [TC002_Navigate_from_Home_to_Join_Room_page.py](./TC002_Navigate_from_Home_to_Join_Room_page.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/1d33db4e-105e-41be-9a02-6be949bca90c/475fdf8e-e069-46a7-9710-897390816183
- **Status:** ✅ Passed
- **Analysis / Findings:** The "Join Room" button on the Home page correctly navigates to `/join`. Routing is functional.

---

#### TC003 — Toggle language on Home updates visible UI text
- **Test Code:** [TC003_Toggle_language_on_Home_updates_visible_UI_text.py](./TC003_Toggle_language_on_Home_updates_visible_UI_text.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/1d33db4e-105e-41be-9a02-6be949bca90c/2e6262f2-4385-4134-8517-52c58c1cbc9f
- **Status:** ✅ Passed
- **Analysis / Findings:** The language toggle button on the Home page correctly switches UI text between Thai and English. The i18n context updates the DOM as expected.

---

#### TC004 — Language toggle persists when navigating to Join Room
- **Test Code:** [TC004_Language_toggle_persists_when_navigating_to_Join_Room.py](./TC004_Language_toggle_persists_when_navigating_to_Join_Room.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/1d33db4e-105e-41be-9a02-6be949bca90c/781701e1-73b8-471f-a35e-2d1046a1afb3
- **Status:** ✅ Passed
- **Analysis / Findings:** The selected language is preserved in context when navigating from Home to Join Room. The `LanguageProvider` in `main.jsx` correctly persists language state across route changes.

---

### REQ-2: User Authentication (Login / Register)

#### TC006 — Login with valid username/password shows logged-in state in header
- **Test Code:** [TC006_Login_with_valid_usernamepassword_shows_logged_in_state_in_header.py](./TC006_Login_with_valid_usernamepassword_shows_logged_in_state_in_header.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/1d33db4e-105e-41be-9a02-6be949bca90c/45e8dae0-72df-4cba-8781-5c1945de8f9c
- **Status:** ❌ Failed
- **Analysis / Findings:** The backend server (`http://localhost:3001`) was not running during the test, causing all `POST /api/login` requests to return a "Connection error". This is an environment issue — the test itself is correct but requires the backend to be running alongside the frontend preview server.

---

#### TC007 — Login with invalid username/password shows an error message
- **Test Code:** [TC007_Login_with_invalid_usernamepassword_shows_an_error_message.py](./TC007_Login_with_invalid_usernamepassword_shows_an_error_message.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/1d33db4e-105e-41be-9a02-6be949bca90c/cf012efc-27da-45a4-aa9f-3fa3eccaf985
- **Status:** ❌ Failed
- **Analysis / Findings:** The app shows "Connection error" instead of an "invalid credentials" message because the backend is not reachable. Additionally, the error message content depends on the server response — the frontend passes the server's `data.error` string directly, so it cannot show a proper invalid-credentials message without a live backend.

---

#### TC008 — Register a new account with username/password shows logged-in state
- **Test Code:** [TC008_Register_a_new_account_with_usernamepassword_shows_logged_in_state.py](./TC008_Register_a_new_account_with_usernamepassword_shows_logged_in_state.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/1d33db4e-105e-41be-9a02-6be949bca90c/b5bb285a-0101-449d-b103-0215a297e54e
- **Status:** ❌ Failed
- **Analysis / Findings:** Registration failed due to backend unavailability ("Connection error"). Additionally, the username input has a `maxLength={20}` which truncated the test username `new_user_test_2026_0` — a minor UX consideration but not a bug. Root cause is the same: backend must be running for auth to work.

---

#### TC009 — Toggle language between Thai and English updates the login page text
- **Test Code:** [TC009_Toggle_language_between_Thai_and_English_updates_the_login_page_text.py](./TC009_Toggle_language_between_Thai_and_English_updates_the_login_page_text.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/1d33db4e-105e-41be-9a02-6be949bca90c/7ca2e3f5-83d0-4f2e-80f0-7ae8c45042e6
- **Status:** ❌ Failed
- **Analysis / Findings:** The language toggle button (`.lang-toggle`) on the Login page was not detected as an interactive element by the test runner. The button exists in the DOM (same pattern as Home/JoinRoom pages which passed TC003/TC004), but the test tool could not locate or interact with it. This may be a z-index/overlay or element accessibility issue specific to the Login page layout.

---

#### TC010 — Back button returns from Login page to Home page
- **Test Code:** [TC010_Back_button_returns_from_Login_page_to_Home_page.py](./TC010_Back_button_returns_from_Login_page_to_Home_page.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/1d33db4e-105e-41be-9a02-6be949bca90c/bb3881a4-c3a4-4892-9b10-656bd6f79950
- **Status:** ✅ Passed
- **Analysis / Findings:** The back button (`← Back`) on the Login page correctly navigates to `/`. Navigation works as expected.

---

#### TC011 — Register mode can be opened and shows Register button
- **Test Code:** [TC011_Register_mode_can_be_opened_and_shows_Register_button.py](./TC011_Register_mode_can_be_opened_and_shows_Register_button.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/1d33db4e-105e-41be-9a02-6be949bca90c/12dd1e4f-5140-4774-a53a-9c9c43367483
- **Status:** ✅ Passed
- **Analysis / Findings:** Clicking the "Don't have an account?" toggle correctly switches the form to Register mode and shows the Register submit button. The `isRegister` state toggle works correctly.

---

#### TC012 — Login mode is available and shows Login button
- **Test Code:** [TC012_Login_mode_is_available_and_shows_Login_button.py](./TC012_Login_mode_is_available_and_shows_Login_button.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/1d33db4e-105e-41be-9a02-6be949bca90c/1cf0f913-4c96-4218-b471-53461041c8f0
- **Status:** ✅ Passed
- **Analysis / Findings:** The Login page correctly defaults to Login mode and shows the Login submit button. The initial state renders as expected.

---

### REQ-3: Create Room / Lobby

#### TC013 — Create room lobby shows an auto-generated room code
- **Test Code:** [TC013_Create_room_lobby_shows_an_auto_generated_room_code.py](./TC013_Create_room_lobby_shows_an_auto_generated_room_code.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/1d33db4e-105e-41be-9a02-6be949bca90c/330c1c68-330a-42b7-ab18-5e6ae4655a77
- **Status:** ❌ Failed
- **Analysis / Findings:** The Create Room page stays in a perpetual loading state ("กำลังสร้างห้อง...") because the `create-room` Socket.io event never receives a response — the backend server is not running. The room code, copy button, and role config UI only render after a successful socket callback. Root cause: backend unavailability.

---

#### TC014 — Role controls and total role count display are visible
- **Test Code:** [TC014_Role_controls_and_total_role_count_display_are_visible.py](./TC014_Role_controls_and_total_role_count_display_are_visible.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/1d33db4e-105e-41be-9a02-6be949bca90c/8229e574-3587-4fad-8af9-c638ad3c42e5
- **Status:** ❌ Failed
- **Analysis / Findings:** Same root cause as TC013 — the role config UI (Werewolf/Seer/Bodyguard/Villager counters, total count, Start Game button) is conditionally rendered only after the room code is received via socket. Without a live backend the page never leaves the loading placeholder.

---

#### TC015 — Start Game is blocked when requirements are not met
- **Test Code:** [TC015_Start_Game_is_blocked_when_requirements_are_not_met_role_count_mismatch__insufficient_players.py](./TC015_Start_Game_is_blocked_when_requirements_are_not_met_role_count_mismatch__insufficient_players.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/1d33db4e-105e-41be-9a02-6be949bca90c/a00a1e58-0192-41be-a289-1f900d62fe12
- **Status:** ❌ Failed
- **Analysis / Findings:** Cannot test Start Game validation because the lobby UI never renders without a backend socket connection. This validation logic exists in the code (`players.length < 4 || totalRoles !== players.length`) but is untestable in a backend-disconnected environment.

---

#### TC016 — Back button returns to Home from Create Room
- **Test Code:** [TC016_Back_button_returns_to_Home_from_Create_Room.py](./TC016_Back_button_returns_to_Home_from_Create_Room.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/1d33db4e-105e-41be-9a02-6be949bca90c/755840c1-4d21-4eef-be3c-0dda5cc43c62
- **Status:** ✅ Passed
- **Analysis / Findings:** The back button is rendered unconditionally on the Create Room page and correctly navigates to `/` even while in the loading state. Navigation works as expected.

---

#### TC017 — Language toggle switches lobby UI language
- **Test Code:** [TC017_Language_toggle_switches_lobby_UI_language.py](./TC017_Language_toggle_switches_lobby_UI_language.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/1d33db4e-105e-41be-9a02-6be949bca90c/1d5cd05b-cae0-4f02-a640-2d09acf18aa1
- **Status:** ✅ Passed
- **Analysis / Findings:** The language toggle button on the Create Room page (rendered unconditionally) correctly switches the UI language. This test was able to pass because it only tests the toggle button itself, not socket-dependent content.

---

### REQ-4: Join Room

#### TC018 — Join Room page loads and accepts valid-looking room code and player name
- **Test Code:** [TC018_Join_Room_page_loads_and_accepts_valid_looking_room_code_and_player_name.py](./TC018_Join_Room_page_loads_and_accepts_valid_looking_room_code_and_player_name.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/1d33db4e-105e-41be-9a02-6be949bca90c/f835b04b-dd02-4cd2-b295-c947d04a0a05
- **Status:** ✅ Passed
- **Analysis / Findings:** The Join Room form renders correctly, accepts a 4-digit numeric room code and a player name. Input fields and form structure work as expected.

---

#### TC019 — Room not found shows an error message
- **Test Code:** [TC019_Room_not_found_shows_an_error_message.py](./TC019_Room_not_found_shows_an_error_message.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/1d33db4e-105e-41be-9a02-6be949bca90c/e0b3b21a-d041-4cf1-be5f-8446697a66d1
- **Status:** ❌ Failed
- **Analysis / Findings:** After submitting the join form, the UI stays in "กำลังเข้าร่วม..." (joining...) state because the `join-room` socket event never receives a response from the backend. The error message ("Room not found") would normally come from the server callback — without a live backend, it never arrives. Additionally, the error message, when it does appear, may be in Thai ("ไม่พบห้อง"), while the test searches for the English word "not".

---

#### TC020 — Joining blocked after game started shows an error message
- **Test Code:** [TC020_Joining_blocked_after_game_started_shows_an_error_message.py](./TC020_Joining_blocked_after_game_started_shows_an_error_message.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/1d33db4e-105e-41be-9a02-6be949bca90c/c06c1e4b-5bcf-4978-9e56-4d35b0167ff4
- **Status:** ❌ Failed
- **Analysis / Findings:** Same root cause as TC019 — no backend response means the UI stays in the loading state. Additionally, the error for joining a started game is localized and may not contain the English word "started".

---

#### TC021 — Back button returns to Home page
- **Test Code:** [TC021_Back_button_returns_to_Home_page.py](./TC021_Back_button_returns_to_Home_page.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/1d33db4e-105e-41be-9a02-6be949bca90c/780c90f8-9931-4f37-ad42-5a10774d2d0e
- **Status:** ✅ Passed
- **Analysis / Findings:** The back button on the Join Room page correctly navigates back to `/`.

---

#### TC022 — Room code input rejects non-numeric characters
- **Test Code:** [TC022_Room_code_input_rejects_non_numeric_characters.py](./TC022_Room_code_input_rejects_non_numeric_characters.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/1d33db4e-105e-41be-9a02-6be949bca90c/96d0fcd5-d19e-460f-94a8-cb17e3048fe1
- **Status:** ✅ Passed
- **Analysis / Findings:** The room code input correctly strips non-numeric characters via `.replace(/\D/g, '')` in the `onChange` handler. Client-side input filtering works correctly.

---

#### TC023 — Room code length is limited to 4 digits
- **Test Code:** [TC023_Room_code_length_is_limited_to_4_digits.py](./TC023_Room_code_length_is_limited_to_4_digits.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/1d33db4e-105e-41be-9a02-6be949bca90c/6ff0eb12-a012-4be4-90f7-62ecfc571b81
- **Status:** ✅ Passed
- **Analysis / Findings:** The room code input correctly enforces a 4-character limit via `.slice(0, 4)` and `maxLength={4}`. Length restriction works correctly.

---

#### TC024 — Player name length is limited to 20 characters
- **Test Code:** [TC024_Player_name_length_is_limited_to_20_characters.py](./TC024_Player_name_length_is_limited_to_20_characters.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/1d33db4e-105e-41be-9a02-6be949bca90c/02448476-4dc5-4169-a1a6-7c0c3135f64c
- **Status:** ✅ Passed
- **Analysis / Findings:** Player name input correctly limits to 20 characters via `.slice(0, 20)` and `maxLength={20}`. Works as expected.

---

#### TC025 — Missing required fields prevents join or shows validation message
- **Test Code:** [TC025_Missing_required_fields_prevents_join_or_shows_validation_message.py](./TC025_Missing_required_fields_prevents_join_or_shows_validation_message.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/1d33db4e-105e-41be-9a02-6be949bca90c/f212b17f-3e58-41c6-ad39-bb5dac621162
- **Status:** ❌ Failed
- **Analysis / Findings:** The Join button is correctly `disabled` when fields are empty (preventing submission), but the app shows no visible validation error message — it simply keeps the button disabled. The test expected an error message to appear, which is a UX gap. Additionally, the disabled button was not detectable as a clickable interactive element by the test runner, which is expected behavior for a `disabled` element.

---

### REQ-5: Moderator Dashboard / Game Flow

#### TC027 — Moderator view shows player list and assigned roles
- **Test Code:** [TC027_Moderator_view_shows_player_list_and_assigned_roles.py](./TC027_Moderator_view_shows_player_list_and_assigned_roles.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/1d33db4e-105e-41be-9a02-6be949bca90c/fbf8b36c-777f-49f6-a91f-1fe5470c7bcd
- **Status:** ❌ Failed
- **Analysis / Findings:** The moderator dashboard at `/moderator/:roomCode` requires a full game session started via Socket.io. Without a running backend, the test got stuck on the Create Room loading screen and never navigated to the moderator view. All three game phase tests (TC027, TC028, TC029) share this same root cause.

---

#### TC028 — Start Night begins night phase and shows sub-phase progression labels
- **Test Code:** [TC028_Start_Night_begins_night_phase_and_shows_sub_phase_progression_labels.py](./TC028_Start_Night_begins_night_phase_and_shows_sub_phase_progression_labels.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/1d33db4e-105e-41be-9a02-6be949bca90c/50f72e47-980b-4fa4-bfc9-8fb2449a12a0
- **Status:** ❌ Failed
- **Analysis / Findings:** The night phase UI is entirely driven by Socket.io events (`night-started`, sub-phase progression). Without a live backend connection, none of the game phase controls can be reached or interacted with.

---

#### TC029 — Resolve Night blocked when actions are not submitted
- **Test Code:** [TC029_Resolve_Night_blocked_when_actions_are_not_submitted.py](./TC029_Resolve_Night_blocked_when_actions_are_not_submitted.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/1d33db4e-105e-41be-9a02-6be949bca90c/8ba732b0-04d8-4c94-a0ba-e5d445a63469
- **Status:** ❌ Failed
- **Analysis / Findings:** Cannot verify Resolve Night blocking behavior without a live backend and an active game session. The entire moderator game flow is WebSocket-driven and untestable in a disconnected environment.

---

### REQ-6: User Profile & Stats

#### TC031 — View overall stats and per-role breakdown on Profile page (authenticated)
- **Test Code:** [TC031_View_overall_stats_and_per_role_breakdown_on_Profile_page_authenticated.py](./TC031_View_overall_stats_and_per_role_breakdown_on_Profile_page_authenticated.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/1d33db4e-105e-41be-9a02-6be949bca90c/6c91e093-5655-4cb0-8cdb-780712249e4b
- **Status:** ❌ Failed
- **Analysis / Findings:** Login fails with "Connection error" because the backend is not running, so the profile page cannot be reached. The `GET /api/me/stats` endpoint also requires a live backend. Both auth and stats fetching are blocked by the same environment issue.

---

#### TC032 — Profile page shows win rate and role stats section (authenticated)
- **Test Code:** [TC032_Profile_page_shows_win_rate_and_role_stats_section_authenticated.py](./TC032_Profile_page_shows_win_rate_and_role_stats_section_authenticated.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/1d33db4e-105e-41be-9a02-6be949bca90c/38c1d33d-51e4-4518-9a85-ecc57896927e
- **Status:** ❌ Failed
- **Analysis / Findings:** Same root cause as TC031 — backend unavailability prevents login and subsequent profile stat loading. The submit button was also reported as unstable/inaccessible as an interactive element during repeated login attempts.

---

#### TC033 — Logout from Profile redirects to Login
- **Test Code:** [TC033_Logout_from_Profile_redirects_to_Login.py](./TC033_Logout_from_Profile_redirects_to_Login.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/1d33db4e-105e-41be-9a02-6be949bca90c/16f6b26c-45dc-41f8-93c4-ef1f3cf3a5ad
- **Status:** ❌ Failed
- **Analysis / Findings:** Login prerequisite failed due to backend unavailability. Note: the logout function itself (`handleLogout`) is purely client-side — it clears localStorage and redirects to `/`. This would likely pass if the auth precondition could be fulfilled. The redirect target after logout goes to `/` (Home), not `/login` — this could also be a functional bug worth verifying.

---

## 3️⃣ Coverage & Matching Metrics

- **Pass rate: 46.67%** (14 passed / 30 total)

| Requirement | Total Tests | ✅ Passed | ❌ Failed |
|---|---|---|---|
| REQ-1: Home Navigation | 4 | 4 | 0 |
| REQ-2: User Authentication | 7 | 3 | 4 |
| REQ-3: Create Room / Lobby | 5 | 2 | 3 |
| REQ-4: Join Room | 8 | 5 | 3 |
| REQ-5: Moderator Dashboard / Game Flow | 3 | 0 | 3 |
| REQ-6: User Profile & Stats | 3 | 0 | 3 |
| **Total** | **30** | **14** | **16** |

---

## 4️⃣ Key Gaps / Risks

### 🔴 Critical — Backend Not Running During Tests (Root Cause of ~12 Failures)
The single biggest issue: the Express + Socket.io backend (`server/`) was not running when tests executed. The Vite preview server was live on port 5173, but the API server on port 3001 was not started. This caused:
- All login/register attempts → "Connection error"
- All socket-based features (create room, join room error responses, game phases) → perpetual loading state
- All profile/stats pages → unreachable

**Fix:** Before running TestSprite tests, start the backend server (`cd server && npm start`) alongside the frontend preview server. Both must be running simultaneously.

### 🟠 High — Localized Error Messages Fail English Keyword Assertions (TC019, TC020)
The app defaults to Thai (`th`) language. Error messages from the server (e.g., "ไม่พบห้อง" for "Room not found", join-blocked messages) are in Thai when the default language is active. Test assertions searching for English substrings like `"room"`, `"not"`, `"started"` will fail against Thai text.

**Fix:** Either ensure tests run with the language set to English, or make error message assertions language-agnostic (e.g., check for the CSS class `.error-msg` being visible rather than its text content).

### 🟠 High — Logout Redirects to Home, Not Login (TC033 — Potential Bug)
The `handleLogout` function in `Profile.jsx` navigates to `'/'` (Home page) after clearing localStorage. TC033 expected a redirect to `/login`. This is a functional discrepancy — depending on product intent, logout should either go to Home (current) or Login (expected by test).

**Fix:** Confirm intended post-logout destination and align the code or the test accordingly.

### 🟡 Medium — Join Form Shows No Validation Message for Empty Fields (TC025)
When the room code or player name fields are empty, the Join button is `disabled` (correct), but no visible error message is displayed. The test expected a validation message. This is a UX gap — users get no feedback explaining why the button is disabled.

**Fix:** Add a visible helper text or inline error message below the form when fields are empty and submission is attempted (e.g., on focus-loss/blur).

### 🟡 Medium — Language Toggle Button Not Detectable on Login Page (TC009)
The `.lang-toggle` button on the Login page was not recognized as an interactive element by the test runner, even though the same button pattern passes on Home (TC003) and Create Room (TC017) pages. This suggests the Login page layout may have a z-index, overlay, or rendering order issue that obscures the button from automated accessibility queries.

**Fix:** Inspect the Login page layout for any element that may be covering the language toggle button, and ensure it has a proper accessible role or `aria-label`.

### 🟢 Low — Socket.io Game Flow Requires Multi-Client Test Setup
The Moderator Dashboard and Player View features are entirely WebSocket-driven and require multiple simultaneous socket connections (moderator + N players) to test meaningfully. Standard frontend E2E tests cannot easily simulate this without a test-aware backend fixture or mock socket server.

**Fix:** For game flow testing, consider adding integration tests in the backend (`server/`) using Socket.io test clients, or use a dedicated test room setup script that seeds game state before tests run.
