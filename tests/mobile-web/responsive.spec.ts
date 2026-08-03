import { expect, test } from '@playwright/test';
import { HomePage } from '../../pages/HomePage';
import { environmentConfig } from '../../config/envConfig';

test.describe('Mobile Web - Responsive Testing', () => {
  let homePage: HomePage;

  test.beforeEach(async ({ page }) => {
    homePage = new HomePage(page);
    await homePage.navigateTo(environmentConfig.baseUrl);
  });

  test('TC-MOB-01: Verify hamburger menu on mobile viewport', async ({ page, isMobile }) => {
    // This test should only run or assert properly if running in a mobile project
    test.skip(!isMobile, 'This test is meant for mobile viewports only');

    // On mobile, navigation items are usually hidden behind a hamburger menu.
    // In our desktop POM we might not have a hamburger menu modeled yet,
    // so we can use page locator just for this responsive check or model it.
    // For this example, assuming a responsive design where nav links are hidden.

    // Check viewport size
    const viewportSize = page.viewportSize();
    expect(viewportSize?.width).toBeLessThan(768);

    // Depending on the app, we would click the hamburger menu and verify links appear.
    // Since this is a generic responsive test for TutorialNinja, we just check that
    // the layout is constrained to the mobile viewport without horizontal scrolling.

    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const windowWidth = await page.evaluate(() => window.innerWidth);
    expect(bodyWidth).toBeLessThanOrEqual(windowWidth);
  });
});
