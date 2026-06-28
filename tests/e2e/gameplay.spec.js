const { test, expect } = require('@playwright/test');

test.describe('Gameplay Flow', () => {

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
            parentCode: "1234",
            childFirstName: "Play",
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

  test('Play 5 puzzles with mixed correctness', async ({ page }) => {
    // Generate unique username to avoid conflicts
    const username = `player_${Date.now()}`;
    
    await page.goto('/');
    await page.click('#tab-register');
    await page.fill('#parent-email', 'test@parent.com');
    await page.fill('#parent-phone', '1234567890');
    await page.fill('#parent-code', '1234');
    await page.fill('#reg-username', username);
    await page.fill('#reg-password', 'test1234');
    await page.fill('#reg-confirm-password', 'test1234');
    await page.fill('#child-first-name', 'Playwright');
    await page.fill('#child-last-name', 'Test');
    await page.selectOption('#child-country', 'United States');
    await page.selectOption('#child-culture', 'United States');
    await page.click('#register-form button[type="submit"]');
    
    await expect(page.locator('#main-view')).toBeVisible();

    // Verify Kids Zone New UI Elements
    await page.click('#tab-kids');
    await expect(page.locator('#kids-level-progress')).toBeVisible();
    await expect(page.locator('#kids-consistency-score')).toBeVisible();
    await expect(page.locator('#kids-consistency-percentage')).toContainText('%');
    await page.click('#tab-play');

    // The puzzle strip should have 5 puzzles
    const puzzleCards = page.locator('.puzzle-card');
    await expect(puzzleCards).toHaveCount(5);

    // --- Puzzle 1: Multiple Choice (Correct) ---
    // Click first puzzle
    await puzzleCards.nth(0).click();
    await expect(page.locator('#active-puzzle-arena')).toBeVisible();
    
    // Verify Puzzle Timer exists and starts with 0s
    await expect(page.locator('#puzzle-timer-display')).toBeVisible();
    await expect(page.locator('#puzzle-timer-display')).toContainText('0s');
    
    // Select Option A (Correct answer for d1_q1)
    await page.locator('#mc-container .option-btn').nth(0).click();
    
    // Accept the alert dialog automatically
    page.once('dialog', async dialog => {
      expect(dialog.message()).toMatch(/(Correct|Awesome)/);
      await dialog.accept();
    });
    await page.click('#btn-submit-answer');
    
    // Ensure puzzle 1 is marked complete
    await expect(puzzleCards.nth(0)).toHaveClass(/completed/);


    // --- Puzzle 2: Multiple Choice (Wrong) ---
    await puzzleCards.nth(1).click();
    
    // Select Option A (Wrong answer for d1_q2, which is B)
    await page.locator('#mc-container .option-btn').nth(1).click();
    
    page.once('dialog', async dialog => {
      expect(dialog.message()).toContain('Oops');
      await dialog.accept();
    });
    await page.click('#btn-submit-answer');
    
    // Ensure puzzle 2 is marked incorrect
    await expect(puzzleCards.nth(1)).toHaveClass(/incorrect/);


    // --- Puzzle 3: Drawing (Pending) ---
    // Mock the upload-drawing endpoint since we don't have a real Supabase bucket for tests
    await page.route('/api/upload-drawing', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, path: 'drawings/test/mock.png' })
      });
    });

    await puzzleCards.nth(2).click();
    
    // We just click submit for drawing
    page.once('dialog', async dialog => {
      expect(dialog.message()).toContain('Super! Drawing submitted');
      await dialog.accept();
    });
    await page.click('#btn-submit-answer');
    
    await expect(puzzleCards.nth(2)).toHaveClass(/completed/);


    // --- Puzzle 4: Multiple Choice (Correct) ---
    await puzzleCards.nth(3).click();
    
    // Select Option B (Correct)
    await page.locator('#mc-container .option-btn').nth(1).click();
    
    page.once('dialog', async dialog => {
      expect(dialog.message()).toMatch(/(Correct|Awesome)/);
      await dialog.accept();
    });
    await page.click('#btn-submit-answer');
    
    await expect(puzzleCards.nth(3)).toHaveClass(/completed/);


    // --- Puzzle 5: Text Input (Correct) ---
    await puzzleCards.nth(4).click();
    
    // Type 'Ruby' (Correct answer for d1_q5)
    await page.fill('#text-answer-input', 'Ruby');
    
    // Two dialogs will appear: one for correct answer, one for day completion!
    const dialogs = [];
    page.on('dialog', async dialog => {
      dialogs.push(dialog.message());
      await dialog.accept();
    });
    
    await page.click('#btn-submit-answer');
    
    // Wait for the completion alert timeout (800ms)
    await page.waitForTimeout(1000);
    
    expect(dialogs.some(m => /(Correct|Awesome)/.test(m))).toBeTruthy();
    expect(dialogs.some(m => m.includes('completed all 5 puzzles'))).toBeTruthy();
    
    // Ensure the next day button is still disabled since we don't unlock Day 2 until tomorrow!
    await expect(page.locator('#btn-next-day')).toBeDisabled();
  });

});
