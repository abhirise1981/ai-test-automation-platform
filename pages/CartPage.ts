import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';
import { ROUTES, LOCATORS } from '../config/uiConstants';

export class CartPage extends BasePage {
  private readonly checkoutButton: Locator;
  private readonly cartItemRows: Locator;
  private readonly itemNames: Locator;

  constructor(page: Page) {
    super(page);
    this.checkoutButton = this.page.getByRole('link', { name: LOCATORS.CART.CHECKOUT_BTN_TEXT, exact: true });
    this.cartItemRows = this.page.locator(LOCATORS.CART.TABLE_ROWS);
    this.itemNames = this.page.locator(LOCATORS.CART.ITEM_NAMES);
  }

  async proceedToCheckout(): Promise<void> {
    await this.checkoutButton.click();
  }

  async removeFirstProduct(): Promise<void> {
    const removeBtn = this.page.locator(LOCATORS.CART.REMOVE_BTN).first();
    await removeBtn.click();
    // Wait for the cart to update
    await this.page.waitForLoadState('networkidle');
  }

  async getCartItemsCount(): Promise<number> {
    return await this.cartItemRows.count();
  }

  async getCartItemNames(): Promise<string[]> {
    const count = await this.itemNames.count();
    const names: string[] = [];
    for (let i = 0; i < count; i++) {
      const name = await this.itemNames.nth(i).textContent();
      if (name) names.push(name.trim());
    }
    return names;
  }
}
