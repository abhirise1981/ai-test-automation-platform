/**
 * LoginScreen.ts — Mobile Login Screen Object
 *
 * Handles all interactions on the login/registration screens
 * for both Android and iOS native apps.
 */
import { BaseScreen } from './BaseScreen';
import { MOBILE_SELECTORS } from '../config/mobileSelectors';

const SEL = MOBILE_SELECTORS.LOGIN;
const REG_SEL = MOBILE_SELECTORS.REGISTRATION;

export class LoginScreen extends BaseScreen {
  // ─── Login Elements ──────────────────────────────────────────────────────

  get emailInput() {
    return this.selector(SEL.android.EMAIL_INPUT, SEL.ios.EMAIL_INPUT);
  }

  get passwordInput() {
    return this.selector(SEL.android.PASSWORD_INPUT, SEL.ios.PASSWORD_INPUT);
  }

  get loginButton() {
    return this.selector(SEL.android.LOGIN_BTN, SEL.ios.LOGIN_BTN);
  }

  get signUpLink() {
    return this.selector(SEL.android.SIGNUP_LINK, SEL.ios.SIGNUP_LINK);
  }

  get errorMessage() {
    return this.selector(SEL.android.ERROR_MESSAGE, SEL.ios.ERROR_MESSAGE);
  }

  // ─── Registration Elements ───────────────────────────────────────────────

  get firstNameInput() {
    return this.selector(REG_SEL.android.FIRSTNAME_INPUT, REG_SEL.ios.FIRSTNAME_INPUT);
  }

  get lastNameInput() {
    return this.selector(REG_SEL.android.LASTNAME_INPUT, REG_SEL.ios.LASTNAME_INPUT);
  }

  get regEmailInput() {
    return this.selector(REG_SEL.android.EMAIL_INPUT, REG_SEL.ios.EMAIL_INPUT);
  }

  get phoneInput() {
    return this.selector(REG_SEL.android.PHONE_INPUT, REG_SEL.ios.PHONE_INPUT);
  }

  get regPasswordInput() {
    return this.selector(REG_SEL.android.PASSWORD_INPUT, REG_SEL.ios.PASSWORD_INPUT);
  }

  get confirmPasswordInput() {
    return this.selector(REG_SEL.android.CONFIRM_PASSWORD, REG_SEL.ios.CONFIRM_PASSWORD);
  }

  get termsCheckbox() {
    return this.selector(REG_SEL.android.TERMS_CHECKBOX, REG_SEL.ios.TERMS_CHECKBOX);
  }

  get registerButton() {
    return this.selector(REG_SEL.android.REGISTER_BTN, REG_SEL.ios.REGISTER_BTN);
  }

  // ─── Actions ─────────────────────────────────────────────────────────────

  /**
   * Login with email and password.
   */
  async login(email: string, password: string): Promise<void> {
    await this.emailInput.setValue(email);
    await this.passwordInput.setValue(password);
    await this.hideKeyboard();
    await this.loginButton.click();
  }

  /**
   * Navigate to the registration screen.
   */
  async navigateToSignUp(): Promise<void> {
    await this.signUpLink.click();
  }

  /**
   * Complete the full registration flow.
   */
  async register(firstName: string, lastName: string, email: string, phone: string, password: string): Promise<void> {
    await this.firstNameInput.setValue(firstName);
    await this.lastNameInput.setValue(lastName);
    await this.regEmailInput.setValue(email);
    await this.phoneInput.setValue(phone);
    await this.regPasswordInput.setValue(password);
    await this.confirmPasswordInput.setValue(password);
    await this.hideKeyboard();
    await this.termsCheckbox.click();
    await this.registerButton.click();
  }

  /**
   * Check if the login error message is displayed.
   */
  async isErrorDisplayed(): Promise<boolean> {
    return this.errorMessage.isDisplayed();
  }

  /**
   * Get the error message text.
   */
  async getErrorText(): Promise<string> {
    return this.errorMessage.getText();
  }

  /** Wait for the login screen to be fully loaded. */
  override async waitForScreen(timeout = 10000): Promise<void> {
    await this.emailInput.waitForDisplayed({ timeout });
  }
}
