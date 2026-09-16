import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class HomePage extends BasePage {
  private readonly productsLink: Locator;
  private readonly cartLink: Locator;
  private readonly loginLink: Locator;
  private readonly logoutLink: Locator;
  private readonly loggedInUserText: Locator;

  // Search locators (on /products page)
  private readonly searchInput: Locator;
  private readonly searchButton: Locator;
  private readonly searchedProductsHeader: Locator;
  private readonly productItems: Locator;

  constructor(page: Page) {
    super(page);
    this.productsLink = this.page.getByRole('link', { name: 'Products' });
    this.cartLink = this.page.getByRole('link', { name: 'Cart' }).first();
    this.loginLink = this.page.getByRole('link', { name: 'Signup / Login' });
    this.logoutLink = this.page.getByRole('link', { name: 'Logout' });
    this.loggedInUserText = this.page.getByText('Logged in as');

    this.searchInput = this.page.locator('#search_product');
    this.searchButton = this.page.locator('#submit_search');
    this.searchedProductsHeader = this.page.getByRole('heading', { name: 'Searched Products' });
    this.productItems = this.page.locator('.features_items .col-sm-4');
  }

  async clickProducts(): Promise<void> {
    // Navigate directly to avoid Google Vignette Ad overlays hijacking link clicks
    await this.page.goto('https://automationexercise.com/products', { waitUntil: 'domcontentloaded' });
  }

  async clickCart(): Promise<void> {
    // Navigate directly to avoid Google Vignette Ad overlays hijacking link clicks
    await this.page.goto('https://automationexercise.com/view_cart', { waitUntil: 'domcontentloaded' });
  }

  async clickLogin(): Promise<void> {
    // Navigate directly to avoid Google Vignette Ad overlays hijacking link clicks
    await this.page.goto('https://automationexercise.com/login', { waitUntil: 'domcontentloaded' });
  }

  async clickLogout(): Promise<void> {
    // Navigate directly to avoid Google Vignette Ad overlays hijacking link clicks
    await this.page.goto('https://automationexercise.com/logout', { waitUntil: 'domcontentloaded' });
  }

  async isLoggedIn(): Promise<boolean> {
    try {
      await this.loggedInUserText.waitFor({ state: 'visible', timeout: 8000 });
      return true;
    } catch {
      return false;
    }
  }

  async getLoggedInUsername(): Promise<string> {
    const text = await this.loggedInUserText.textContent();
    return text ? text.replace('Logged in as ', '').trim() : '';
  }

  async searchProduct(criteria: string): Promise<void> {
    await this.searchInput.fill(criteria);
    await this.searchButton.click();
    await this.searchedProductsHeader.waitFor({ state: 'visible' });
  }

  async getSearchedProductsCount(): Promise<number> {
    return await this.productItems.count();
  }

  async addFirstSearchedProductToCart(): Promise<void> {
    // Click 'View Product' on the first item to avoid home page overlay flakiness
    const firstProduct = this.productItems.first();
    await firstProduct.getByRole('link', { name: 'View Product' }).click();
    
    // This site uses legacy jQuery for the Add to Cart functionality.
    // If we click too fast, the event listener isn't attached yet and the click is ignored.
    // We use Playwright's expect.poll to safely retry the click until the cart modal actually appears.
    const addToCartButton = this.page.getByRole('button', { name: 'Add to cart' });
    const cartModal = this.page.locator('#cartModal');
    
    // Use Playwright's native auto-retrying expect block (expect.toPass).
    // This is the cleanest way to handle legacy site race conditions. 
    // It will repeatedly click and check for the modal until it succeeds, eliminating the need for complex loops.
    await expect(async () => {
      await addToCartButton.click();
      await expect(cartModal).toBeVisible();
    }).toPass();
    
    // Click "Continue Shopping" to close the modal safely
    const continueButton = this.page.getByRole('button', { name: 'Continue Shopping' });
    await continueButton.click();
  }
}
