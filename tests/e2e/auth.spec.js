const { test, expect } = require('@playwright/test');

test.describe('Auth Flow', () => {

  test.beforeEach(async ({ page }) => {
    await page.route('**/api/register', async route => {
      await route.fulfill({ status: 200, json: { success: true } });
    });
    await page.route('**/api/login', async route => {
      await route.fulfill({ 
        status: 200, 
        json: { 
          success: true, 
          user: {
            parentCode: "9999",
            childFirstName: "E2E",
            childLastName: "Test",
            game_state: {
              currentDay: 1,
              unlockedUpToDay: 1,
              completedPuzzles: {},
              coins: 0, level: 1, theme: 'unicorn'
            }
          } 
        } 
      });
    });
    await page.route('**/api/save-user', async route => {
      await route.fulfill({ status: 200, json: { success: true } });
    });
  });

  test('Parent registration and login', async ({ page }) => {
    page.on('console', msg => console.log('BROWSER:', msg.text()));
    
    await page.goto('/');

    // Ensure we are on the auth screen
    await expect(page.locator('#auth-view')).toBeVisible();

    // Switch to Register tab
    await page.click('#tab-register');
    
    // Fill Parent details
    await page.fill('#parent-email', 'testparent@mindbloom.com');
    await page.fill('#parent-phone', '1234567890');
    await page.fill('#parent-code', '9999');
    
    // Fill Child details
    const username = `e2e_test_${Date.now()}`;
    await page.fill('#reg-username', username);
    await page.fill('#reg-password', 'password123');
    await page.fill('#reg-confirm-password', 'password123');
    await page.fill('#child-first-name', 'E2E');
    await page.fill('#child-last-name', 'Test');
    await page.selectOption('#child-country', 'United States');
    await page.selectOption('#child-culture', 'United States');
    await page.selectOption('#child-birth-month', '8');
    await page.selectOption('#child-birth-year', '2018');
    
    const isValid = await page.evaluate(() => document.getElementById('register-form').reportValidity());
    console.log("IS VALID:", isValid);
    if (!isValid) {
      const invalidId = await page.evaluate(() => document.querySelector('#register-form :invalid').id);
      console.log("INVALID FIELD:", invalidId);
    }
    
    // Submit
    await page.click('#register-form button[type="submit"]');

    // Wait for either main app or an auth error
    const mainView = page.locator('#main-view');
    const authError = page.locator('#auth-error');
    
    await Promise.race([
      expect(mainView).toBeVisible({ timeout: 10000 }),
      expect(authError).toBeVisible({ timeout: 10000 }).then(async () => {
        if (await authError.isVisible()) {
          const errText = await authError.innerText();
          console.error("AUTH ERROR:", errText);
          throw new Error("Registration failed: " + errText);
        }
      })
    ]);

    // Wait for main app to appear
    await expect(page.locator('#main-view')).toBeVisible();
    await expect(page.locator('#child-welcome-banner')).toContainText('E2E Test');

    // Logout
    await page.click('#btn-logout');
    await expect(page.locator('#auth-view')).toBeVisible();

    // Login with the new account
    await page.fill('#login-username', username);
    await page.fill('#login-password', 'password123');
    await page.click('#login-form button[type="submit"]');

    // Should be back in
    await expect(page.locator('#main-view')).toBeVisible();
  });

});
