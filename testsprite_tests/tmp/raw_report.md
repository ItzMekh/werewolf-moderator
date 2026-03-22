
# TestSprite AI Testing Report(MCP)

---

## 1️⃣ Document Metadata
- **Project Name:** werewolf-moderator
- **Date:** 2026-03-23
- **Prepared by:** TestSprite AI Team

---

## 2️⃣ Requirement Validation Summary

#### Test TC001 Navigate from Home to Create Room page
- **Test Code:** [TC001_Navigate_from_Home_to_Create_Room_page.py](./TC001_Navigate_from_Home_to_Create_Room_page.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/1d33db4e-105e-41be-9a02-6be949bca90c/22a4a99f-b7cb-424d-aded-9734c7862380
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC002 Navigate from Home to Join Room page
- **Test Code:** [TC002_Navigate_from_Home_to_Join_Room_page.py](./TC002_Navigate_from_Home_to_Join_Room_page.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/1d33db4e-105e-41be-9a02-6be949bca90c/475fdf8e-e069-46a7-9710-897390816183
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC006 Login with valid username/password shows logged-in state in header
- **Test Code:** [TC006_Login_with_valid_usernamepassword_shows_logged_in_state_in_header.py](./TC006_Login_with_valid_usernamepassword_shows_logged_in_state_in_header.py)
- **Test Error:** TEST FAILURE

ASSERTIONS:
- Connection error message displayed on the login form prevented authentication.
- Login could not be completed after 3 submission attempts (Enter/click/Enter) and the server did not accept credentials.
- Username button not present in the header after login attempts, so user is not logged in.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/1d33db4e-105e-41be-9a02-6be949bca90c/45e8dae0-72df-4cba-8781-5c1945de8f9c
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC007 Login with invalid username/password shows an error message
- **Test Code:** [TC007_Login_with_invalid_usernamepassword_shows_an_error_message.py](./TC007_Login_with_invalid_usernamepassword_shows_an_error_message.py)
- **Test Error:** TEST FAILURE

ASSERTIONS:
- Error message after submitting credentials is not the expected invalid-credentials message; the page displays 'Connection error' instead.
- The substring 'invalid' (case-insensitive) was not found anywhere visible on the login page after submitting the test credentials.
- The visible error appears to indicate a connection problem rather than credential validation failure, so the expected behavior for invalid credentials is not present.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/1d33db4e-105e-41be-9a02-6be949bca90c/cf012efc-27da-45a4-aa9f-3fa3eccaf985
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC008 Register a new account with username/password shows logged-in state
- **Test Code:** [TC008_Register_a_new_account_with_usernamepassword_shows_logged_in_state.py](./TC008_Register_a_new_account_with_usernamepassword_shows_logged_in_state.py)
- **Test Error:** TEST FAILURE

ASSERTIONS:
- Registration failed - 'Connection error' message displayed below the password field during registration
- Registration form remained visible after submitting the registration form
- Username input value was truncated to 'new_user_test_2026_0' due to maxlength and did not match intended username
- No username button visible in the header after registration attempt indicating the user is not logged in
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/1d33db4e-105e-41be-9a02-6be949bca90c/b5bb285a-0101-449d-b103-0215a297e54e
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC013 Create room lobby shows an auto-generated room code
- **Test Code:** [TC013_Create_room_lobby_shows_an_auto_generated_room_code.py](./TC013_Create_room_lobby_shows_an_auto_generated_room_code.py)
- **Test Error:** TEST FAILURE

ASSERTIONS:
- Room Code text not found on Create Room page after waiting
- Room code value element not present on page
- Copy button not found on Create Room page
- Create Room page remained in loading state 'กำลังสร้างห้อง...' after waiting
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/1d33db4e-105e-41be-9a02-6be949bca90c/330c1c68-330a-42b7-ab18-5e6ae4655a77
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC014 Role controls and total role count display are visible
- **Test Code:** [TC014_Role_controls_and_total_role_count_display_are_visible.py](./TC014_Role_controls_and_total_role_count_display_are_visible.py)
- **Test Error:** TEST FAILURE

ASSERTIONS:
- Role adjustment controls (plus/minus) not found on the /create (lobby) page.
- Role labels 'Werewolf', 'Seer', 'Bodyguard', and 'Villager' are not visible on the page.
- 'Total' role count indicator is not present on the page.
- 'Start Game' button is not present on the page.
- The page displays a loading/placeholder state ('กำลังสร้างห้อง...') and an empty central container instead of the expected lobby controls.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/1d33db4e-105e-41be-9a02-6be949bca90c/8229e574-3587-4fad-8af9-c638ad3c42e5
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC015 Start Game is blocked when requirements are not met (role count mismatch / insufficient players)
- **Test Code:** [TC015_Start_Game_is_blocked_when_requirements_are_not_met_role_count_mismatch__insufficient_players.py](./TC015_Start_Game_is_blocked_when_requirements_are_not_met_role_count_mismatch__insufficient_players.py)
- **Test Error:** TEST FAILURE

ASSERTIONS:
- Role count adjustment controls (e.g., '+'/'-') are not present on the /create page; only interactive elements found are index 65 (EN) and index 66 (กลับ).
- Start Game button is not present on the /create page; cannot attempt to start the game.
- No visible UI or error message indicating the start is blocked or showing the text "disabled" when role/player counts mismatch.
- The create room page displays loading text ('กำลังสร้างห้อง...') and an empty role selection area, preventing completion of the verification steps.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/1d33db4e-105e-41be-9a02-6be949bca90c/a00a1e58-0192-41be-a289-1f900d62fe12
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC018 Join Room page loads and accepts valid-looking room code and player name
- **Test Code:** [TC018_Join_Room_page_loads_and_accepts_valid_looking_room_code_and_player_name.py](./TC018_Join_Room_page_loads_and_accepts_valid_looking_room_code_and_player_name.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/1d33db4e-105e-41be-9a02-6be949bca90c/f835b04b-dd02-4cd2-b295-c947d04a0a05
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC019 Room not found shows an error message
- **Test Code:** [TC019_Room_not_found_shows_an_error_message.py](./TC019_Room_not_found_shows_an_error_message.py)
- **Test Error:** TEST FAILURE

ASSERTIONS:
- Expected visible error message containing the words 'room' and 'not' after attempting to join an invalid room code, but no such text was found on the page.
- The page remains in the loading state 'กำลังเข้าร่วม...' after the join attempt and did not display an error or redirect to an error page.
- No visible navigation or UI change occurred that indicates a room-not-found condition was presented to the user.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/1d33db4e-105e-41be-9a02-6be949bca90c/e0b3b21a-d041-4cf1-be5f-8446697a66d1
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC021 Back button returns to Home page
- **Test Code:** [TC021_Back_button_returns_to_Home_page.py](./TC021_Back_button_returns_to_Home_page.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/1d33db4e-105e-41be-9a02-6be949bca90c/780c90f8-9931-4f37-ad42-5a10774d2d0e
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC025 Missing required fields prevents join or shows validation message
- **Test Code:** [TC025_Missing_required_fields_prevents_join_or_shows_validation_message.py](./TC025_Missing_required_fields_prevents_join_or_shows_validation_message.py)
- **Test Error:** TEST FAILURE

ASSERTIONS:
- Submit button not found on page as an interactive element; the visible 'เข้าร่วม' control has no clickable index.
- No visible validation or error message displayed after submitting the join form with both fields empty and after submitting with room code '1234' but missing player name.
- No navigation or server-side error response occurred after submission (URL remained /join), indicating no visible validation flow was triggered.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/1d33db4e-105e-41be-9a02-6be949bca90c/f212b17f-3e58-41c6-ad39-bb5dac621162
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC027 Moderator view shows player list and assigned roles
- **Test Code:** [TC027_Moderator_view_shows_player_list_and_assigned_roles.py](./TC027_Moderator_view_shows_player_list_and_assigned_roles.py)
- **Test Error:** TEST FAILURE

ASSERTIONS:
- Moderator dashboard did not display the 'Room Code' label on the /create page; only the loading text 'กำลังสร้างห้อง...' is visible.
- Player list element is not present or visible on the moderator page after room creation attempt.
- The text 'Players' is not found on the page following room creation.
- The text 'Roles' is not found on the page following room creation.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/1d33db4e-105e-41be-9a02-6be949bca90c/fbf8b36c-777f-49f6-a91f-1fe5470c7bcd
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC028 Start Night begins night phase and shows sub-phase progression labels
- **Test Code:** [TC028_Start_Night_begins_night_phase_and_shows_sub_phase_progression_labels.py](./TC028_Start_Night_begins_night_phase_and_shows_sub_phase_progression_labels.py)
- **Test Error:** TEST FAILURE

ASSERTIONS:
- Start Night button not found on page
- Room controls did not render after creating the room; only 'EN' and 'กลับ' (Back) buttons are present
- Unable to start night phase because no control exists to initiate it
- Could not verify 'Night', 'Werewolf', 'Bodyguard', or 'Seer' text because the night phase did not begin

- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/1d33db4e-105e-41be-9a02-6be949bca90c/50f72e47-980b-4fa4-bfc9-8fb2449a12a0
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC029 Resolve Night blocked when actions are not submitted
- **Test Code:** [TC029_Resolve_Night_blocked_when_actions_are_not_submitted.py](./TC029_Resolve_Night_blocked_when_actions_are_not_submitted.py)
- **Test Error:** TEST FAILURE

ASSERTIONS:
- Start Night button not found on page
- Resolve Night button not found on page
- Expected error message containing 'cannot' not visible on page

- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/1d33db4e-105e-41be-9a02-6be949bca90c/8ba732b0-04d8-4c94-a0ba-e5d445a63469
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC031 View overall stats and per-role breakdown on Profile page (authenticated)
- **Test Code:** [TC031_View_overall_stats_and_per_role_breakdown_on_Profile_page_authenticated.py](./TC031_View_overall_stats_and_per_role_breakdown_on_Profile_page_authenticated.py)
- **Test Error:** TEST FAILURE

ASSERTIONS:
- Login failed - application displayed a 'Connection error' message and did not navigate to the profile page
- No visible submit/login button on the current login page; only 'Sign up' and 'Back' buttons are interactive
- Repeated login attempts (Enter press and clicking submit) did not authenticate the user
- Profile page (/profile) could not be reached, so 'Games', 'Wins', and 'Losses' could not be verified
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/1d33db4e-105e-41be-9a02-6be949bca90c/6c91e093-5655-4cb0-8cdb-780712249e4b
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC032 Profile page shows win rate and role stats section (authenticated)
- **Test Code:** [TC032_Profile_page_shows_win_rate_and_role_stats_section_authenticated.py](./TC032_Profile_page_shows_win_rate_and_role_stats_section_authenticated.py)
- **Test Error:** TEST FAILURE

ASSERTIONS:
- Login failed - 'Connection error' message displayed on the login page, preventing authentication.
- Submit action unreliable - the page's submit control is not accessible as a stable interactive element for successful login.
- Profile page was not reached after multiple login attempts (Enter key and click attempts performed).
- Provided credentials could not be authenticated after repeated attempts, so required profile-level UI checks (Win, Rate, Role) could not be performed.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/1d33db4e-105e-41be-9a02-6be949bca90c/38c1d33d-51e4-4518-9a85-ecc57896927e
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC033 Logout from Profile redirects to Login
- **Test Code:** [TC033_Logout_from_Profile_redirects_to_Login.py](./TC033_Logout_from_Profile_redirects_to_Login.py)
- **Test Error:** TEST FAILURE

ASSERTIONS:
- Login failed - 'Connection error' message displayed on the login form preventing authentication.
- Submit/login button did not navigate to /profile; the current URL remains '/login' after submit attempts.
- Profile page and Logout control are not present, so logout cannot be tested.
- Direct navigation to /profile did not load profile content; authentication must succeed before logout can be verified.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/1d33db4e-105e-41be-9a02-6be949bca90c/16f6b26c-45dc-41f8-93c4-ef1f3cf3a5ad
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC003 Toggle language on Home updates visible UI text
- **Test Code:** [TC003_Toggle_language_on_Home_updates_visible_UI_text.py](./TC003_Toggle_language_on_Home_updates_visible_UI_text.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/1d33db4e-105e-41be-9a02-6be949bca90c/2e6262f2-4385-4134-8517-52c58c1cbc9f
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC004 Language toggle persists when navigating to Join Room
- **Test Code:** [TC004_Language_toggle_persists_when_navigating_to_Join_Room.py](./TC004_Language_toggle_persists_when_navigating_to_Join_Room.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/1d33db4e-105e-41be-9a02-6be949bca90c/781701e1-73b8-471f-a35e-2d1046a1afb3
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC009 Toggle language between Thai and English updates the login page text
- **Test Code:** [TC009_Toggle_language_between_Thai_and_English_updates_the_login_page_text.py](./TC009_Toggle_language_between_Thai_and_English_updates_the_login_page_text.py)
- **Test Error:** TEST FAILURE

ASSERTIONS:
- Language toggle button not found in page interactive elements; only username/password inputs and navigation buttons are available.
- Unable to toggle the UI back to Thai because no clickable control corresponds to the top-right language indicator.
- Could not verify Thai text 'เข้าสู่ระบบ' because the UI could not be switched to Thai.
- No alternative navigation element or link on the page leads to a language switch.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/1d33db4e-105e-41be-9a02-6be949bca90c/7ca2e3f5-83d0-4f2e-80f0-7ae8c45042e6
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC010 Back button returns from Login page to Home page
- **Test Code:** [TC010_Back_button_returns_from_Login_page_to_Home_page.py](./TC010_Back_button_returns_from_Login_page_to_Home_page.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/1d33db4e-105e-41be-9a02-6be949bca90c/bb3881a4-c3a4-4892-9b10-656bd6f79950
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC011 Register mode can be opened and shows Register button
- **Test Code:** [TC011_Register_mode_can_be_opened_and_shows_Register_button.py](./TC011_Register_mode_can_be_opened_and_shows_Register_button.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/1d33db4e-105e-41be-9a02-6be949bca90c/12dd1e4f-5140-4774-a53a-9c9c43367483
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC012 Login mode is available and shows Login button
- **Test Code:** [TC012_Login_mode_is_available_and_shows_Login_button.py](./TC012_Login_mode_is_available_and_shows_Login_button.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/1d33db4e-105e-41be-9a02-6be949bca90c/1cf0f913-4c96-4218-b471-53461041c8f0
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC016 Back button returns to Home from Create Room
- **Test Code:** [TC016_Back_button_returns_to_Home_from_Create_Room.py](./TC016_Back_button_returns_to_Home_from_Create_Room.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/1d33db4e-105e-41be-9a02-6be949bca90c/755840c1-4d21-4eef-be3c-0dda5cc43c62
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC017 Language toggle switches lobby UI language
- **Test Code:** [TC017_Language_toggle_switches_lobby_UI_language.py](./TC017_Language_toggle_switches_lobby_UI_language.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/1d33db4e-105e-41be-9a02-6be949bca90c/1d5cd05b-cae0-4f02-a640-2d09acf18aa1
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC020 Joining blocked after game started shows an error message
- **Test Code:** [TC020_Joining_blocked_after_game_started_shows_an_error_message.py](./TC020_Joining_blocked_after_game_started_shows_an_error_message.py)
- **Test Error:** TEST FAILURE

ASSERTIONS:
- Expected error message containing the word 'started' was not found on the page after submitting the join form.
- Join button not found as a separate interactive element on the page, preventing a direct click-based verification of the join action.
- Page displays persistent loading indicator 'กำลังเข้าร่วม...' after multiple waits, indicating the UI did not render a final error state.
- Search and scroll attempts to locate the word 'started' were performed twice and returned NOT FOUND.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/1d33db4e-105e-41be-9a02-6be949bca90c/c06c1e4b-5bcf-4978-9e56-4d35b0167ff4
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC022 Room code input rejects non-numeric characters
- **Test Code:** [TC022_Room_code_input_rejects_non_numeric_characters.py](./TC022_Room_code_input_rejects_non_numeric_characters.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/1d33db4e-105e-41be-9a02-6be949bca90c/96d0fcd5-d19e-460f-94a8-cb17e3048fe1
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC023 Room code length is limited to 4 digits
- **Test Code:** [TC023_Room_code_length_is_limited_to_4_digits.py](./TC023_Room_code_length_is_limited_to_4_digits.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/1d33db4e-105e-41be-9a02-6be949bca90c/6ff0eb12-a012-4be4-90f7-62ecfc571b81
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC024 Player name length is limited to 20 characters
- **Test Code:** [TC024_Player_name_length_is_limited_to_20_characters.py](./TC024_Player_name_length_is_limited_to_20_characters.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/1d33db4e-105e-41be-9a02-6be949bca90c/02448476-4dc5-4169-a1a6-7c0c3135f64c
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---


## 3️⃣ Coverage & Matching Metrics

- **46.67** of tests passed

| Requirement        | Total Tests | ✅ Passed | ❌ Failed  |
|--------------------|-------------|-----------|------------|
| ...                | ...         | ...       | ...        |
---


## 4️⃣ Key Gaps / Risks
{AI_GNERATED_KET_GAPS_AND_RISKS}
---