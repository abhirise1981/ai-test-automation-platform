# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: ui/ecommerce.spec.ts >> E-Commerce Critical Flow Tests >> TC-08: Navigate Categories and Verify Products
- Location: tests/ui/ecommerce.spec.ts:115:7

# Error details

```
Test timeout of 30000ms exceeded while running "beforeEach" hook.
```

```
Error: page.goto: net::ERR_ABORTED; maybe frame was detached?
Call log:
  - navigating to "https://tutorialsninja.com/", waiting until "domcontentloaded"

```

# Test source

```ts
  1  | import type { Page} from '@playwright/test';
  2  | import { Locator } from '@playwright/test';
  3  | 
  4  | /**
  5  |  * BasePage — Foundation class for all Page Object Models.
  6  |  *
  7  |  * Every page class MUST extend this base. It provides:
  8  |  *  - The shared `page` fixture for all child classes.
  9  |  *  - The `navigateTo(path)` method as the SINGLE standard way to navigate.
  10 |  *    All child class navigation methods must call `this.navigateTo()` instead
  11 |  *    of calling `this.page.goto()` directly. This ensures consistent
  12 |  *    `waitUntil: 'domcontentloaded'` behavior across the entire framework.
  13 |  */
  14 | export class BasePage {
  15 |   protected readonly page: Page;
  16 | 
  17 |   constructor(page: Page) {
  18 |     this.page = page;
  19 |   }
  20 | 
  21 |   /**
  22 |    * Standard navigation method. All Page Objects MUST use this for navigation.
  23 |    * Uses relative paths — the baseURL is resolved from playwright.config.ts.
  24 |    * @param path — relative path e.g. '/', '/login', '/products'
  25 |    */
  26 |   async navigateTo(path: string): Promise<void> {
> 27 |     await this.page.goto(path, { waitUntil: 'domcontentloaded' });
     |                     ^ Error: page.goto: net::ERR_ABORTED; maybe frame was detached?
  28 |   }
  29 | 
  30 |   /**
  31 |    * Returns the current page title.
  32 |    */
  33 |   async getPageTitle(): Promise<string> {
  34 |     return await this.page.title();
  35 |   }
  36 | 
  37 |   /**
  38 |    * Returns the current page URL.
  39 |    */
  40 |   async getPageUrl(): Promise<string> {
  41 |     return this.page.url();
  42 |   }
  43 | 
  44 |   /**
  45 |    * Waits for the page to reach the domcontentloaded state.
  46 |    * Useful after form submissions or navigation-triggering actions.
  47 |    */
  48 |   async waitForPageLoad(): Promise<void> {
  49 |     await this.page.waitForLoadState('domcontentloaded');
  50 |   }
  51 | }
  52 | 
```