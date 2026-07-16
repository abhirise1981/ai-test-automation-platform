import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';
import { ROUTES, LOCATORS } from '../config/uiConstants';
import { testConfig } from '../config/testConfig';

export class LoginPage extends BasePage {
  readonly loginEmailInput: Locator;
  readonly loginPasswordInput: Locator;
  readonly loginButton: Locator;

  // Registration Form
  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly emailInput: Locator;
  readonly telephoneInput: Locator;
  readonly passwordInput: Locator;
  readonly confirmPasswordInput: Locator;
  readonly agreeTermsCheckbox: Locator;
  readonly continueButton: Locator;

  constructor(page: Page) {
    super(page);
    // Login
    this.loginEmailInput = this.page.locator(LOCATORS.LOGIN_PAGE.EMAIL_INPUT);
    this.loginPasswordInput = this.page.locator(LOCATORS.LOGIN_PAGE.PASSWORD_INPUT);
    this.loginButton = this.page.locator(LOCATORS.LOGIN_PAGE.LOGIN_BTN);

    // Register
    this.firstNameInput = this.page.locator(LOCATORS.REGISTER_PAGE.FIRSTNAME);
    this.lastNameInput = this.page.locator(LOCATORS.REGISTER_PAGE.LASTNAME);
    this.emailInput = this.page.locator(LOCATORS.REGISTER_PAGE.EMAIL);
    this.telephoneInput = this.page.locator(LOCATORS.REGISTER_PAGE.TELEPHONE);
    this.passwordInput = this.page.locator(LOCATORS.REGISTER_PAGE.PASSWORD);
    this.confirmPasswordInput = this.page.locator(LOCATORS.REGISTER_PAGE.CONFIRM_PASSWORD);
    this.agreeTermsCheckbox = this.page.locator(LOCATORS.REGISTER_PAGE.AGREE_CHECKBOX);
    this.continueButton = this.page.locator(LOCATORS.REGISTER_PAGE.CONTINUE_BTN);
  }

  async login(email: string, password: string): Promise<void> {
    await this.loginEmailInput.fill(email);
    await this.loginPasswordInput.fill(password);
    await this.loginButton.click();
  }

  async signUpAndRegister(
    name: string,
    email: string,
    password: string
  ): Promise<void> {
    // OpenCart requires more fields for registration. We'll derive them.
    const nameParts = name.split(' ');
    const firstName = nameParts[0] || testConfig.registration.firstName;
    const lastName = nameParts[1] || testConfig.registration.lastName;

    await this.firstNameInput.fill(firstName);
    await this.lastNameInput.fill(lastName);
    await this.emailInput.fill(email);
    await this.telephoneInput.fill(testConfig.registration.mobile);
    await this.passwordInput.fill(password);
    await this.confirmPasswordInput.fill(password);
    
    // Playwright's check() sometimes fails on custom styled checkboxes if they rely on JS click events
    await this.agreeTermsCheckbox.click();
    await this.continueButton.click();
    
    // Wait for the success page to load explicitly instead of networkidle
    await this.page.waitForURL(ROUTES.ACCOUNT_SUCCESS_REGEX, { timeout: 15000 });
  }
}
