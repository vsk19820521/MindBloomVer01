const { test, expect } = require('@playwright/test');

test.describe('Admin Dashboard Flow', () => {

  test.beforeEach(async ({ page }) => {
    // Mock the admin login
    await page.route('**/api/login', async route => {
      await route.fulfill({
        status: 200,
        json: { success: true, user: { username: '__admin__' } }
      });
    });

    // Mock admin users data
    await page.route('**/api/admin-users', async route => {
      await route.fulfill({
        status: 200,
        json: [
          { username: 'testuser', profile: { childFirstName: 'Test' }, game_state: { level: 1 } }
        ]
      });
    });

    // Mock admin puzzles data
    await page.route('**/api/admin-puzzles', async route => {
      await route.fulfill({
        status: 200,
        json: [
          { id: 'p1', sourceBand: '8-9', difficulty: 'Hard' }
        ]
      });
    });

    // Mock admin failures data
    await page.route('**/api/admin-failures', async route => {
      await route.fulfill({
        status: 200,
        json: [
          { puzzle_id: 'p1', fail_count: 5, users: ['testuser'] }
        ]
      });
    });
  });

  test('Admin can login and view dashboard', async ({ page }) => {
    page.on('console', msg => console.log('BROWSER:', msg.text()));
    await page.goto('/');

    // Open Auth Modal
    await page.click('#btn-show-auth');
    
    // Verify app.js content from server
    const appJsContent = await page.evaluate(async () => {
      const res = await fetch('/logic/app.js');
      return await res.text();
    });
    console.log("SERVER APP.JS HAS ADMIN CHECK:", appJsContent.includes("__admin__"));

    // Login as Admin
    await page.fill('#login-username', 'vsk19820521');
    await page.fill('#login-password', 'Windows123!');
    await page.click('#login-form button[type="submit"]');

    // Wait for either the admin view to show or an auth error
    const adminView = page.locator('#admin-view');
    const authError = page.locator('#auth-error');
    
    try {
      await Promise.race([
        expect(adminView).toBeVisible({ timeout: 5000 }),
        expect(authError).toBeVisible({ timeout: 5000 }).then(async () => {
          if (await authError.isVisible()) {
            const errText = await authError.innerText();
            console.error("AUTH ERROR:", errText);
            throw new Error("Login failed: " + errText);
          }
        })
      ]);
    } catch (e) {
      console.log("LOCAL_STORAGE:", await page.evaluate(() => JSON.stringify(localStorage)));
      console.log("CURRENT_USER_GLOBAL:", await page.evaluate(() => typeof currentUser !== 'undefined' ? JSON.stringify(currentUser) : 'undefined'));
      console.log("HTML DUMP:", await page.evaluate(() => document.body.innerHTML));
      throw e;
    }

    // Check tabs
    await expect(page.locator('#tab-admin-users')).toBeVisible();
    await expect(page.locator('#tab-admin-puzzles')).toBeVisible();
    
    // Check user data loaded
    await expect(page.locator('#admin-users-table tbody tr')).toHaveCount(1);
    
    // Switch to puzzles tab
    await page.click('#tab-admin-puzzles');
    await expect(page.locator('#admin-puzzles-table tbody tr')).toHaveCount(1);
  });
});
