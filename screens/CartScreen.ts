/**
 * CartScreen.ts — Mobile Shopping Cart Screen Object
 */
import { BaseScreen } from './BaseScreen';
import { MOBILE_SELECTORS } from '../config/mobileSelectors';

const SEL = MOBILE_SELECTORS.CART;

export class CartScreen extends BaseScreen {
  get cartItems() {
    return this.selectorAll(SEL.android.CART_ITEM, SEL.ios.CART_ITEM);
  }
  get totalPrice() {
    return this.selector(SEL.android.TOTAL_PRICE, SEL.ios.TOTAL_PRICE);
  }
  get checkoutButton() {
    return this.selector(SEL.android.CHECKOUT_BTN, SEL.ios.CHECKOUT_BTN);
  }
  get emptyCartMessage() {
    return this.selector(SEL.android.EMPTY_CART_MSG, SEL.ios.EMPTY_CART_MSG);
  }

  async getCartItemCount(): Promise<number> {
    const items = await this.cartItems;
    // @ts-ignore
    return items.length;
  }

  async removeFirstItem(): Promise<void> {
    const removeBtn = this.selector(SEL.android.REMOVE_BTN, SEL.ios.REMOVE_BTN);
    await removeBtn.click();
  }

  async swipeToDeleteFirstItem(): Promise<void> {
    const items = await this.cartItems;
    // @ts-ignore
    if (items.length > 0) {
      // @ts-ignore
      await this.swipeLeftOnElement(items[0]);
    }
  }

  async increaseQuantity(): Promise<void> {
    const btn = this.selector(SEL.android.QUANTITY_INCREASE, SEL.ios.QUANTITY_INCREASE);
    await btn.click();
  }

  async decreaseQuantity(): Promise<void> {
    const btn = this.selector(SEL.android.QUANTITY_DECREASE, SEL.ios.QUANTITY_DECREASE);
    await btn.click();
  }

  async getTotalPriceText(): Promise<string> {
    return this.totalPrice.getText();
  }

  async proceedToCheckout(): Promise<void> {
    await this.checkoutButton.click();
  }

  async isCartEmpty(): Promise<boolean> {
    return this.emptyCartMessage.isDisplayed();
  }

  override async waitForScreen(timeout = 10000): Promise<void> {
    // Wait for either cart items or empty message
    await driver.pause(500);
  }
}
