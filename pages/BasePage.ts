import { Page, Locator } from '@playwright/test';

/**
 * BasePage — Foundation class for all Page Object Models.
 *
 * Every page class MUST extend this base. It provides:
 *  - The shared `page` fixture for all child classes.
 *  - The `navigateTo(path)` method as the SINGLE standard way to navigate.
 *    All child class navigation methods must call `this.navigateTo()` instead
 *    of calling `this.page.goto()` directly. This ensures consistent
 *    `waitUntil: 'domcontentloaded'` behavior across the entire framework.
 */
export class BasePage {
  protected readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Standard navigation method. All Page Objects MUST use this for navigation.
   * Uses relative paths — the baseURL is resolved from playwright.config.ts.
   * @param path — relative path e.g. '/', '/login', '/products'
   */
  async navigateTo(path: string): Promise<void> {
    await this.page.goto(path, { waitUntil: 'domcontentloaded' });
  }

  /**
   * Returns the current page title.
   */
  async getPageTitle(): Promise<string> {
    return await this.page.title();
  }

  /**
   * Returns the current page URL.
   */
  async getPageUrl(): Promise<string> {
    return this.page.url();
  }

  /**
   * Waits for the page to reach the domcontentloaded state.
   * Useful after form submissions or navigation-triggering actions.
   */
  async waitForPageLoad(): Promise<void> {
    await this.page.waitForLoadState('domcontentloaded');
  }
}
