import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class CheckoutPage extends BasePage {
  private readonly commentTextArea: Locator;
  private readonly placeOrderButton: Locator;

  // Payment page locators
  private readonly cardNameInput: Locator;
  private readonly cardNumberInput: Locator;
  private readonly cvcInput: Locator;
  private readonly expiryMonthInput: Locator;
  private readonly expiryYearInput: Locator;
  private readonly payButton: Locator;

  // Order confirmation locators
  private readonly successMessageHeader: Locator;

  constructor(page: Page) {
    super(page);
    // Fallback: Using CSS attribute selector because this element lacks a data-qa ID and aria-label
    this.commentTextArea = this.page.locator('textarea[name="message"]');
    this.placeOrderButton = this.page.getByRole('link', { name: 'Place Order' });

    this.cardNameInput = this.page.getByTestId('name-on-card');
    this.cardNumberInput = this.page.getByTestId('card-number');
    this.cvcInput = this.page.getByTestId('cvc');
    this.expiryMonthInput = this.page.getByTestId('expiry-month');
    this.expiryYearInput = this.page.getByTestId('expiry-year');
    this.payButton = this.page.getByTestId('pay-button');

    this.successMessageHeader = this.page.getByTestId('order-placed');
  }

  async enterCommentAndPlaceOrder(comment: string): Promise<void> {
    await this.commentTextArea.fill(comment);
    await this.placeOrderButton.click();
    // Bypass Google Vignette Ads if they hijack the place order navigation
    if (this.page.url().includes('#google_vignette')) {
      await this.page.goto('https://automationexercise.com/payment', { waitUntil: 'domcontentloaded' });
    }
  }

  async fillPaymentDetailsAndPay(
    name: string,
    number: string,
    cvc: string,
    month: string,
    year: string
  ): Promise<void> {
    await this.cardNameInput.fill(name);
    await this.cardNumberInput.fill(number);
    await this.cvcInput.fill(cvc);
    await this.expiryMonthInput.fill(month);
    await this.expiryYearInput.fill(year);
    await this.payButton.click();
    // Bypass Google Vignette Ads if they hijack the payment confirmation navigation
    if (this.page.url().includes('#google_vignette')) {
      await this.page.goto('https://automationexercise.com/order_placed', { waitUntil: 'domcontentloaded' });
    }
  }

  async isOrderPlacedSuccessfully(): Promise<boolean> {
    await this.successMessageHeader.waitFor({ state: 'visible' });
    return await this.successMessageHeader.isVisible();
  }
}
