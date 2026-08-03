/**
 * HomeScreen.ts — Mobile Home / Product Browsing Screen Object
 */
import { BaseScreen } from './BaseScreen';
import { MOBILE_SELECTORS } from '../config/mobileSelectors';

const SEL = MOBILE_SELECTORS.HOME;

export class HomeScreen extends BaseScreen {
  get searchInput() {
    return this.selector(SEL.android.SEARCH_INPUT, SEL.ios.SEARCH_INPUT);
  }
  get searchButton() {
    return this.selector(SEL.android.SEARCH_BTN, SEL.ios.SEARCH_BTN);
  }
  get productList() {
    return this.selector(SEL.android.PRODUCT_LIST, SEL.ios.PRODUCT_LIST);
  }
  get productItems() {
    return this.selectorAll(SEL.android.PRODUCT_ITEM, SEL.ios.PRODUCT_ITEM);
  }
  get cartBadge() {
    return this.selector(SEL.android.CART_BADGE, SEL.ios.CART_BADGE);
  }
  get navHome() {
    return this.selector(SEL.android.BOTTOM_NAV_HOME, SEL.ios.BOTTOM_NAV_HOME);
  }
  get navCart() {
    return this.selector(SEL.android.BOTTOM_NAV_CART, SEL.ios.BOTTOM_NAV_CART);
  }
  get navAccount() {
    return this.selector(SEL.android.BOTTOM_NAV_ACCOUNT, SEL.ios.BOTTOM_NAV_ACCOUNT);
  }

  async searchProduct(keyword: string): Promise<void> {
    await this.searchInput.setValue(keyword);
    await this.hideKeyboard();
    await this.searchButton.click();
    await driver.pause(1000);
  }

  async getProductCount(): Promise<number> {
    const items = await this.productItems;
    return items.length;
  }

  async addFirstProductToCart(): Promise<void> {
    const addBtn = this.selector(SEL.android.ADD_TO_CART_BTN, SEL.ios.ADD_TO_CART_BTN);
    await addBtn.click();
  }

  async navigateToCart(): Promise<void> {
    await this.navCart.click();
  }
  async navigateToAccount(): Promise<void> {
    await this.navAccount.click();
  }
  async navigateToHome(): Promise<void> {
    await this.navHome.click();
  }

  async pullToRefresh(): Promise<void> {
    await this.swipeDown(0.5);
  }

  async getCartBadgeCount(): Promise<number> {
    try {
      const text = await this.cartBadge.getText();
      return parseInt(text, 10) || 0;
    } catch {
      return 0;
    }
  }

  override async waitForScreen(timeout = 10000): Promise<void> {
    await this.productList.waitForDisplayed({ timeout });
  }
}
