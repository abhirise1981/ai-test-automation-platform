import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class CartPage extends BasePage {
  private readonly proceedToCheckoutButton: Locator;
  private readonly cartRows: Locator;

  constructor(page: Page) {
    super(page);
    this.proceedToCheckoutButton = this.page.getByText('Proceed To Checkout');
    this.cartRows = this.page.locator('#cart_info_table tbody tr'); // Complex nested rows are best kept as CSS
  }

  async proceedToCheckout(): Promise<void> {
    await this.proceedToCheckoutButton.click();
    // Bypass Google Vignette Ads if they hijack the checkout navigation
    if (this.page.url().includes('#google_vignette')) {
      await this.page.goto('https://automationexercise.com/checkout', { waitUntil: 'domcontentloaded' });
    }
  }

  async getCartItemsCount(): Promise<number> {
    return await this.cartRows.count();
  }

  async getCartItemNames(): Promise<string[]> {
    const texts = await this.cartRows.getByRole('heading').allTextContents();
    return texts.map(text => text.trim()).filter(text => text.length > 0);
  }
}
