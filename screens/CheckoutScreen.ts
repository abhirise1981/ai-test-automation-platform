/**
 * CheckoutScreen.ts — Mobile Checkout Screen Object
 */
import { BaseScreen } from './BaseScreen';
import { MOBILE_SELECTORS } from '../config/mobileSelectors';

const SEL = MOBILE_SELECTORS.CHECKOUT;

export class CheckoutScreen extends BaseScreen {
  get addressInput() {
    return this.selector(SEL.android.ADDRESS_LINE1, SEL.ios.ADDRESS_LINE1);
  }
  get cityInput() {
    return this.selector(SEL.android.CITY_INPUT, SEL.ios.CITY_INPUT);
  }
  get zipcodeInput() {
    return this.selector(SEL.android.ZIPCODE_INPUT, SEL.ios.ZIPCODE_INPUT);
  }
  get cardNumberInput() {
    return this.selector(SEL.android.CARD_NUMBER, SEL.ios.CARD_NUMBER);
  }
  get cardExpiryInput() {
    return this.selector(SEL.android.CARD_EXPIRY, SEL.ios.CARD_EXPIRY);
  }
  get cardCvcInput() {
    return this.selector(SEL.android.CARD_CVC, SEL.ios.CARD_CVC);
  }
  get placeOrderButton() {
    return this.selector(SEL.android.PLACE_ORDER_BTN, SEL.ios.PLACE_ORDER_BTN);
  }
  get orderConfirmation() {
    return this.selector(SEL.android.ORDER_CONFIRMATION, SEL.ios.ORDER_CONFIRMATION);
  }
  get orderId() {
    return this.selector(SEL.android.ORDER_ID, SEL.ios.ORDER_ID);
  }

  async fillShippingAddress(address: string, city: string, zipcode: string): Promise<void> {
    await this.addressInput.setValue(address);
    await this.cityInput.setValue(city);
    await this.zipcodeInput.setValue(zipcode);
    await this.hideKeyboard();
  }

  async fillPaymentDetails(cardNumber: string, expiry: string, cvc: string): Promise<void> {
    await this.scrollToElement(SEL.android.CARD_NUMBER, SEL.ios.CARD_NUMBER);
    await this.cardNumberInput.setValue(cardNumber);
    await this.cardExpiryInput.setValue(expiry);
    await this.cardCvcInput.setValue(cvc);
    await this.hideKeyboard();
  }

  async placeOrder(): Promise<void> {
    await this.scrollToElement(SEL.android.PLACE_ORDER_BTN, SEL.ios.PLACE_ORDER_BTN);
    await this.placeOrderButton.click();
  }

  async isOrderConfirmed(): Promise<boolean> {
    try {
      await this.orderConfirmation.waitForDisplayed({ timeout: 15000 });
      return true;
    } catch {
      return false;
    }
  }

  async getOrderId(): Promise<string> {
    return this.orderId.getText();
  }

  async completeCheckout(
    address: string,
    city: string,
    zipcode: string,
    cardNumber: string,
    expiry: string,
    cvc: string,
  ): Promise<void> {
    await this.fillShippingAddress(address, city, zipcode);
    await this.fillPaymentDetails(cardNumber, expiry, cvc);
    await this.placeOrder();
  }

  override async waitForScreen(timeout = 10000): Promise<void> {
    await this.addressInput.waitForDisplayed({ timeout });
  }
}
