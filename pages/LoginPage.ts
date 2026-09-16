import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class LoginPage extends BasePage {
  private readonly loginEmailInput: Locator;
  private readonly loginPasswordInput: Locator;
  private readonly loginButton: Locator;

  private readonly signupNameInput: Locator;
  private readonly signupEmailInput: Locator;
  private readonly signupButton: Locator;

  // Account creation details locators
  private readonly genderMrRadio: Locator;
  private readonly passwordInput: Locator;
  private readonly daysSelect: Locator;
  private readonly monthsSelect: Locator;
  private readonly yearsSelect: Locator;
  private readonly firstNameInput: Locator;
  private readonly lastNameInput: Locator;
  private readonly addressInput: Locator;
  private readonly countrySelect: Locator;
  private readonly stateInput: Locator;
  private readonly cityInput: Locator;
  private readonly zipcodeInput: Locator;
  private readonly mobileInput: Locator;
  private readonly createAccountButton: Locator;
  private readonly accountCreatedHeader: Locator;
  private readonly continueButton: Locator;

  constructor(page: Page) {
    super(page);
    this.loginEmailInput = this.page.getByTestId('login-email');
    this.loginPasswordInput = this.page.getByTestId('login-password');
    this.loginButton = this.page.getByTestId('login-button');

    this.signupNameInput = this.page.getByTestId('signup-name');
    this.signupEmailInput = this.page.getByTestId('signup-email');
    this.signupButton = this.page.getByTestId('signup-button');

    this.genderMrRadio = this.page.locator('#id_gender1');
    this.passwordInput = this.page.locator('#password');
    this.daysSelect = this.page.locator('#days'); 
    this.monthsSelect = this.page.locator('#months');
    this.yearsSelect = this.page.locator('#years');
    this.firstNameInput = this.page.locator('#first_name');
    this.lastNameInput = this.page.locator('#last_name');
    this.addressInput = this.page.locator('#address1');
    this.countrySelect = this.page.locator('#country');
    this.stateInput = this.page.locator('#state');
    this.cityInput = this.page.locator('#city');
    this.zipcodeInput = this.page.locator('#zipcode');
    this.mobileInput = this.page.locator('#mobile_number');
    this.createAccountButton = this.page.getByTestId('create-account');
    this.accountCreatedHeader = this.page.getByText('Account Created!');
    this.continueButton = this.page.getByTestId('continue-button');
  }

  async login(email: string, password: string): Promise<void> {
    await this.loginEmailInput.fill(email);
    await this.loginPasswordInput.fill(password);
    await this.loginButton.click();
    // Bypass Google Vignette Ads if they hijack the login form submit navigation
    if (this.page.url().includes('#google_vignette')) {
      await this.page.goto('https://automationexercise.com/', { waitUntil: 'domcontentloaded' });
    }
  }

  async signUpAndRegister(name: string, email: string, password: string): Promise<void> {
    await this.signupNameInput.fill(name);
    await this.signupEmailInput.fill(email);
    await this.signupButton.click();
    // Bypass Google Vignette Ads if they hijack the signup step 1 click navigation
    if (this.page.url().includes('#google_vignette')) {
      await this.page.goto('https://automationexercise.com/signup', { waitUntil: 'domcontentloaded' });
    }

    // Fill registration form
    await this.genderMrRadio.click();
    await this.passwordInput.fill(password);
    await this.daysSelect.selectOption('10');
    await this.monthsSelect.selectOption('5');
    await this.yearsSelect.selectOption('1995');
    await this.firstNameInput.fill('Abhishek');
    await this.lastNameInput.fill('Kumar');
    await this.addressInput.fill('123 QA Test Lane');
    await this.countrySelect.selectOption('United States');
    await this.stateInput.fill('California');
    await this.cityInput.fill('San Francisco');
    await this.zipcodeInput.fill('94101');
    await this.mobileInput.fill('1234567890');
    
    await this.createAccountButton.click();
    await this.accountCreatedHeader.waitFor({ state: 'visible' });
    
    // Navigate directly to avoid Google Vignette Ad overlays hijacking the continue click navigation
    await this.page.goto('https://automationexercise.com/', { waitUntil: 'domcontentloaded' });
  }
}
