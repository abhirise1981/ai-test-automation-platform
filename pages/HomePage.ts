import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';
import { ROUTES, LOCATORS } from '../config/uiConstants';

export class HomePage extends BasePage {
  private readonly myAccountDropdown: Locator;
  private readonly loginLink: Locator;
  private readonly logoutLink: Locator;
  private readonly searchInput: Locator;
  private readonly searchButton: Locator;
  private readonly productItems: Locator;
  private readonly cartLink: Locator;

  constructor(page: Page) {
    super(page);
    this.myAccountDropdown = this.page.locator(LOCATORS.NAV.MY_ACCOUNT);
    this.loginLink = this.page.getByRole('link', { name: LOCATORS.NAV.LOGIN_LINK_TEXT }).first();
    this.logoutLink = this.page.getByRole('link', { name: LOCATORS.NAV.LOGOUT_LINK_TEXT, exact: true }).first();
    
    this.searchInput = this.page.locator(LOCATORS.HOME.SEARCH_INPUT);
    this.searchButton = this.page.locator(LOCATORS.HOME.SEARCH_BUTTON);
    this.productItems = this.page.locator(LOCATORS.HOME.PRODUCT_ITEMS);
    this.cartLink = this.page.getByRole('link', { name: LOCATORS.NAV.CART_LINK_TEXT });
  }

  async navigateToProducts(): Promise<void> {
    await this.navigateTo(ROUTES.PRODUCTS);
  }

  async navigateToCart(): Promise<void> {
    await this.navigateTo(ROUTES.CART);
  }

  async navigateToLogin(): Promise<void> {
    await this.navigateTo(ROUTES.LOGIN);
  }

  async navigateToRegister(): Promise<void> {
    await this.navigateTo(ROUTES.REGISTER);
  }

  async navigateToLogout(): Promise<void> {
    await this.navigateTo(ROUTES.LOGOUT);
  }

  async isLoggedIn(): Promise<boolean> {
    try {
      await this.myAccountDropdown.click();
      await this.logoutLink.waitFor({ state: 'visible', timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  async getLoggedInUsername(): Promise<string> {
    return ''; // Not easily visible on OpenCart top bar
  }

  async searchProduct(criteria: string): Promise<void> {
    await this.searchInput.fill(criteria);
    await this.searchButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  async getSearchedProductsCount(): Promise<number> {
    return await this.productItems.count();
  }

  async addFirstSearchedProductToCart(): Promise<void> {
    const firstProductCartBtn = this.page.locator(LOCATORS.HOME.FIRST_PRODUCT_CART_BTN).first();
    const successAlert = this.page.locator(LOCATORS.HOME.SUCCESS_ALERT);

    await firstProductCartBtn.click();
    
    // Playwright Best Practice: Use Promise.race for branching state instead of try/catch timeouts.
    // This immediately resolves as soon as EITHER the alert appears OR the URL changes, eliminating artificial delays.
    const outcome = await Promise.race([
      this.page.waitForURL(ROUTES.PRODUCT_DETAILS_REGEX, { timeout: 15000 }).then(() => 'redirect'),
      successAlert.waitFor({ state: 'visible', timeout: 15000 }).then(() => 'success')
    ]);

    if (outcome === 'redirect') {
      // If the product requires options (like HP's delivery date), it redirects. Add it from here.
      await this.page.locator(LOCATORS.PRODUCT_PAGE.ADD_TO_CART_BTN).click();
      await expect(successAlert).toBeVisible();
    }
  }
}
