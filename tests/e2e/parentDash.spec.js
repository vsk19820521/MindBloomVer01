const { test, expect } = require('@playwright/test');

test.describe('Parent Dashboard Metrics', () => {

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
            parentCode: "5555",
            childFirstName: "Dash",
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

  test('Metrics properly account for right vs wrong answers', async ({ page }) => {
    // 1. Setup a new user and answer some puzzles
    const username = `parent_test_${Date.now()}`;
    const parentCode = '5555';
    
    await page.goto('/');
    await page.click('#btn-show-auth');
    await page.click('#tab-register');
    await page.fill('#parent-email', 'metrics@parent.com');
    await page.fill('#parent-phone', '1234567890');
    await page.fill('#parent-code', parentCode);
    await page.fill('#reg-username', username);
    await page.fill('#reg-password', 'test1234');
    await page.fill('#reg-confirm-password', 'test1234');
    await page.fill('#child-first-name', 'MetricsTest');
    await page.fill('#child-last-name', 'Test');
    await page.selectOption('#child-country', 'United States');
    await page.selectOption('#child-culture', 'United States');
    await page.click('#register-form button[type="submit"]');
    
    await expect(page.locator('#main-view')).toBeVisible();

    const puzzleCards = page.locator('.puzzle-card');
    
    // --- Puzzle 1: Correct (MC) ---
    await puzzleCards.nth(0).click();
    await page.locator('#mc-container .option-btn').nth(0).click();
    page.once('dialog', async d => await d.accept());
    await page.click('#btn-submit-answer');
    await expect(puzzleCards.nth(0)).toHaveClass(/completed/);

    // --- Puzzle 2: Wrong (MC) ---
    await puzzleCards.nth(1).click();
    await page.locator('#mc-container .option-btn').nth(1).click();
    page.once('dialog', async d => await d.accept());
    await page.click('#btn-submit-answer');
    await expect(puzzleCards.nth(1)).toHaveClass(/incorrect/);

    // --- Puzzle 3: Drawing (Pending) ---
    await page.route('**/api/upload-drawing', async route => {
      await route.fulfill({ status: 200, json: { success: true, path: 'drawings/test/mock.png' } });
    });
    await page.route('**/api/get-drawing-url*', async route => {
      await route.fulfill({ status: 200, json: { success: true, url: 'data:image/png;base64,mock' } });
    });

    await puzzleCards.nth(2).click();
    page.once('dialog', async d => await d.accept());
    await page.click('#btn-submit-answer');
    await expect(puzzleCards.nth(2)).toHaveClass(/completed/);


    // 2. Navigate to Parent Dashboard
    await page.click('#tab-parent');
    await expect(page.locator('#parent-gate')).toBeVisible();

    // Enter PIN
    await page.fill('#parent-gate-input', parentCode);
    await page.click('#btn-parent-gate-submit');

    // Dashboard should be visible
    await expect(page.locator('#parent-dashboard-content')).toBeVisible();

    // 3. Verify Metrics
    // We played 1 correct Easy, 1 wrong Easy, and 1 Drawing (Hard) which is pending.
    // Progress Bar logic:
    // Puzzle 1 (Easy) = 1 correct out of 1 attempt -> 1/1
    // Puzzle 2 (Easy) = 0 correct out of 1 attempt -> 0/1
    // Total Easy = 1 solved / 2 attempts = 50%
    
    const difficultyStats = page.locator('#parent-difficulty-stats');
    
    // Check Easy stats
    await expect(difficultyStats).toContainText('Easy');
    // We expect it to say "1/2 (Solved: 50%)" because we made 2 attempts on Easy puzzles but only got 1 right.
    await expect(difficultyStats).toContainText('1/2');
    await expect(difficultyStats).toContainText('50%');

    // Check Hard stats (Drawing is Hard)
    // We submitted it, so attempt = 1, but correct = null (not true)
    await expect(difficultyStats).toContainText('Hard');
    // We expect "0/1 (Solved: 0%)"
    await expect(difficultyStats).toContainText('0/1');
    await expect(difficultyStats).toContainText('0%');

    // 4. Verify Review Queue exists for the drawing
    const reviewList = page.locator('#parent-review-list');
    await expect(reviewList).toContainText("Rocky's T-Rex Cave Sign");
    
    // 5. Verify Calendar has a dot for today
    const activeCalendarCells = page.locator('.calendar-day-cell.active-play');
    // There should be at least one cell with the active-play class
    expect(await activeCalendarCells.count()).toBeGreaterThan(0);
  });

});
