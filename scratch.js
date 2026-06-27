const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:3000');
  
  await page.click('#tab-register');
  await page.fill('#parent-email', 'testparent@mindbloom.com');
  await page.fill('#parent-phone', '1234567890');
  await page.fill('#parent-code', '9999');
  await page.fill('#reg-username', 'e2e_test_user');
  await page.fill('#reg-password', 'password123');
  await page.fill('#reg-confirm-password', 'password123');
  await page.fill('#child-first-name', 'E2E');
  await page.fill('#child-last-name', 'Test');
  await page.selectOption('#child-country', 'United States');
  await page.selectOption('#child-culture', 'United States');
  
  const isValid = await page.evaluate(() => document.getElementById('register-form').reportValidity());
  console.log("Is form valid?", isValid);
  
  if (!isValid) {
     const invalidId = await page.evaluate(() => document.querySelector('#register-form :invalid').id);
     console.log("Invalid element ID:", invalidId);
  }
  
  await browser.close();
})();
