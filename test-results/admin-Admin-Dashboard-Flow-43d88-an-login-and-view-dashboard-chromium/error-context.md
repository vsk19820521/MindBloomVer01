# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: admin.spec.js >> Admin Dashboard Flow >> Admin can login and view dashboard
- Location: tests\e2e\admin.spec.js:45:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator:  locator('#admin-view')
Expected: visible
Received: hidden
Timeout:  5000ms

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('#admin-view')
    13 × locator resolved to <div id="admin-view" class="glass-panel">…</div>
       - unexpected value "hidden"

```

```yaml
- text: ✨ 💖
- banner:
  - text: "Mind's Bloom 🌸 $ 0 Coins Age Group : 8-9 yrs Hello, ⚡ Pikachu"
  - strong
  - text: "! 👋"
  - button "Sign Out"
  - navigation:
    - button "⚡ Play Puzzles"
    - button "📚 Puzzle History"
    - button "👧 Kids Zone"
    - button "⚙️ Parent Zone"
- button "◀" [disabled]
- heading "Day 1" [level=2]
- button "▶" [disabled]
- text: "1"
- heading "The Unicorn's Rainbow Path" [level=4]
- text: 💎 10 Coins ⚡ 2
- heading "Bella the Cat's Yarn Basket" [level=4]
- text: 💎 20 Coins 🔒 3
- heading "Rocky's T-Rex Cave Sign" [level=4]
- text: 💎 10 Coins 🔒 4
- heading "Crafty Scissors" [level=4]
- text: 💎 10 Coins 🔒 5
- heading "Three Little Birds" [level=4]
- text: 💎 20 Coins 🔒
- heading "The Unicorn's Rainbow Path" [level=3]
- text: "Logical Thinking Easy 💎 10 Coins ⏱️ Target Time: 20s ⏳ 4s"
- paragraph: "Rainbow Sparkle the Unicorn can only step on clouds that form a repeating pattern: Red, Blue, Yellow, Red, Blue, Yellow. She is standing on a Red cloud. What are the colors of the next three clouds she must step on to cross the sky?"
- button "Blue, Yellow, Red"
- button "Red, Blue, Yellow"
- button "Yellow, Red, Blue"
- button "Blue, Red, Yellow"
- button "Submit Answer 🌟"
- button "💡 Need a Hint? (2 left)"
- button "⚠️ Report Puzzle"
- heading "🔒 Explanation Locked" [level=3]
- paragraph: You can view the full detailed answer and explanation tomorrow!
- heading "🌟 LEVEL UP! 🌟" [level=2]
- paragraph: Lily, you are doing amazing! You have earned enough coins to unlock a new stage level!
- text: 🐰
- heading "Brain Bunny" [level=3]
- paragraph: You have accumulated 150 gold coins!
- button "Keep Playing! 🎉"
- textbox "Search users by name/username..."
- combobox:
  - option "All Age Bands" [selected]
  - option "4-5"
  - option "6-7"
  - option "8-9"
- table:
  - rowgroup:
    - row "Username Name Age Band Progress Parent Email Parent Phone Country Last Login":
      - columnheader "Username"
      - columnheader "Name"
      - columnheader "Age Band"
      - columnheader "Progress"
      - columnheader "Parent Email"
      - columnheader "Parent Phone"
      - columnheader "Country"
      - columnheader "Last Login"
  - rowgroup
```

# Test source

```ts
  1  | const { test, expect } = require('@playwright/test');
  2  | 
  3  | test.describe('Admin Dashboard Flow', () => {
  4  | 
  5  |   test.beforeEach(async ({ page }) => {
  6  |     // Mock the admin login
  7  |     await page.route('**/api/login', async route => {
  8  |       await route.fulfill({
  9  |         status: 200,
  10 |         json: { success: true, user: { username: '__admin__' } }
  11 |       });
  12 |     });
  13 | 
  14 |     // Mock admin users data
  15 |     await page.route('**/api/admin-users', async route => {
  16 |       await route.fulfill({
  17 |         status: 200,
  18 |         json: [
  19 |           { username: 'testuser', profile: { childFirstName: 'Test' }, game_state: { level: 1 } }
  20 |         ]
  21 |       });
  22 |     });
  23 | 
  24 |     // Mock admin puzzles data
  25 |     await page.route('**/api/admin-puzzles', async route => {
  26 |       await route.fulfill({
  27 |         status: 200,
  28 |         json: [
  29 |           { id: 'p1', sourceBand: '8-9', difficulty: 'Hard' }
  30 |         ]
  31 |       });
  32 |     });
  33 | 
  34 |     // Mock admin failures data
  35 |     await page.route('**/api/admin-failures', async route => {
  36 |       await route.fulfill({
  37 |         status: 200,
  38 |         json: [
  39 |           { puzzle_id: 'p1', fail_count: 5, users: ['testuser'] }
  40 |         ]
  41 |       });
  42 |     });
  43 |   });
  44 | 
  45 |   test('Admin can login and view dashboard', async ({ page }) => {
  46 |     page.on('console', msg => console.log('BROWSER:', msg.text()));
  47 |     await page.goto('/');
  48 | 
  49 |     // Open Auth Modal
  50 |     await page.click('#btn-show-auth');
  51 |     
  52 |     // Verify app.js content from server
  53 |     const appJsContent = await page.evaluate(async () => {
  54 |       const res = await fetch('/logic/app.js');
  55 |       return await res.text();
  56 |     });
  57 |     console.log("SERVER APP.JS HAS ADMIN CHECK:", appJsContent.includes("__admin__"));
  58 | 
  59 |     // Login as Admin
  60 |     await page.fill('#login-username', 'vsk19820521');
  61 |     await page.fill('#login-password', 'Windows123!');
  62 |     await page.click('#login-form button[type="submit"]');
  63 | 
  64 |     // Wait for either the admin view to show or an auth error
  65 |     const adminView = page.locator('#admin-view');
  66 |     const authError = page.locator('#auth-error');
  67 |     
  68 |     try {
  69 |       await Promise.race([
> 70 |         expect(adminView).toBeVisible({ timeout: 5000 }),
     |                           ^ Error: expect(locator).toBeVisible() failed
  71 |         expect(authError).toBeVisible({ timeout: 5000 }).then(async () => {
  72 |           if (await authError.isVisible()) {
  73 |             const errText = await authError.innerText();
  74 |             console.error("AUTH ERROR:", errText);
  75 |             throw new Error("Login failed: " + errText);
  76 |           }
  77 |         })
  78 |       ]);
  79 |     } catch (e) {
  80 |       console.log("LOCAL_STORAGE:", await page.evaluate(() => JSON.stringify(localStorage)));
  81 |       console.log("CURRENT_USER_GLOBAL:", await page.evaluate(() => typeof currentUser !== 'undefined' ? JSON.stringify(currentUser) : 'undefined'));
  82 |       console.log("HTML DUMP:", await page.evaluate(() => document.body.innerHTML));
  83 |       throw e;
  84 |     }
  85 | 
  86 |     // Check tabs
  87 |     await expect(page.locator('#tab-admin-users')).toBeVisible();
  88 |     await expect(page.locator('#tab-admin-puzzles')).toBeVisible();
  89 |     
  90 |     // Check user data loaded
  91 |     await expect(page.locator('#admin-users-table tbody tr')).toHaveCount(1);
  92 |     
  93 |     // Switch to puzzles tab
  94 |     await page.click('#tab-admin-puzzles');
  95 |     await expect(page.locator('#admin-puzzles-table tbody tr')).toHaveCount(1);
  96 |   });
  97 | });
  98 | 
```