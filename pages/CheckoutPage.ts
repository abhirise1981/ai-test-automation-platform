import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';
import { LOCATORS } from '../config/uiConstants';
import { testConfig } from '../config/testConfig';

export class CheckoutPage extends BasePage {
  private readonly billingDetailsContinueBtn: Locator;
  private readonly deliveryDetailsContinueBtn: Locator;
  private readonly deliveryMethodContinueBtn: Locator;
  private readonly paymentMethodRadio: Locator;
  private readonly termsCheckbox: Locator;
  private readonly paymentMethodContinueBtn: Locator;
  private readonly confirmOrderBtn: Locator;
  private readonly successHeader: Locator;

  constructor(page: Page) {
    super(page);
    this.billingDetailsContinueBtn = this.page.locator(LOCATORS.CHECKOUT.BTN_BILLING_CONTINUE);
    this.deliveryDetailsContinueBtn = this.page.locator(LOCATORS.CHECKOUT.BTN_SHIPPING_CONTINUE);
    this.deliveryMethodContinueBtn = this.page.locator(LOCATORS.CHECKOUT.BTN_SHIPPING_METHOD_CONTINUE);
    this.paymentMethodRadio = this.page.locator(LOCATORS.CHECKOUT.PAYMENT_METHOD_RADIO);
    this.termsCheckbox = this.page.locator(LOCATORS.CHECKOUT.AGREE_TERMS_CHECKBOX);
    this.paymentMethodContinueBtn = this.page.locator(LOCATORS.CHECKOUT.BTN_PAYMENT_METHOD_CONTINUE);
    this.confirmOrderBtn = this.page.locator(LOCATORS.CHECKOUT.CONFIRM_BTN);
    this.successHeader = this.page.getByRole('heading', { name: LOCATORS.CHECKOUT.SUCCESS_HEADING_TEXT });
  }

  async completeCheckoutFlow(): Promise<void> {
    // Tutorials Ninja has a 6-step accordion checkout.
    
    // Step 2: Billing Details (Fill out new address form since new users don't have one)
    await this.page.locator(LOCATORS.CHECKOUT.BILLING_FIRSTNAME).waitFor({ state: 'visible' });
    await this.page.locator(LOCATORS.CHECKOUT.BILLING_FIRSTNAME).fill(testConfig.registration.firstName);
    await this.page.locator(LOCATORS.CHECKOUT.BILLING_LASTNAME).fill(testConfig.registration.lastName);
    await this.page.locator(LOCATORS.CHECKOUT.BILLING_ADDRESS_1).fill(testConfig.registration.address);
    await this.page.locator(LOCATORS.CHECKOUT.BILLING_CITY).fill(testConfig.registration.city);
    await this.page.locator(LOCATORS.CHECKOUT.BILLING_POSTCODE).fill(testConfig.registration.zipcode);
    await this.page.locator(LOCATORS.CHECKOUT.BILLING_COUNTRY).selectOption({ label: testConfig.registration.country });
    await this.page.waitForTimeout(1000); // Wait for regions to load
    await this.page.locator(LOCATORS.CHECKOUT.BILLING_ZONE).selectOption({ label: testConfig.registration.state });
    
    await this.billingDetailsContinueBtn.click();

    // Step 3: Delivery Details
    await this.deliveryDetailsContinueBtn.waitFor({ state: 'visible' });
    await this.deliveryDetailsContinueBtn.click();

    // Step 4: Delivery Method
    await this.deliveryMethodContinueBtn.waitFor({ state: 'visible' });
    await this.deliveryMethodContinueBtn.click();

    // Step 5: Payment Method
    await this.paymentMethodRadio.waitFor({ state: 'visible' });
    // Playwright's check() can fail on custom checkboxes, use click()
    await this.termsCheckbox.click();
    await this.paymentMethodContinueBtn.click();

    // Step 6: Confirm Order
    await this.confirmOrderBtn.waitFor({ state: 'visible' });
    await this.confirmOrderBtn.click();
  }

  async isOrderPlacedSuccessfully(): Promise<boolean> {
    try {
      await this.successHeader.waitFor({ state: 'visible', timeout: 10000 });
      return true;
    } catch {
      return false;
    }
  }
}
