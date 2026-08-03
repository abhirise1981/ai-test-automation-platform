import { expect, test } from '@playwright/test';
import { HomePage } from '../../pages/HomePage';
import { LoginPage } from '../../pages/LoginPage';
import { CartPage } from '../../pages/CartPage';
import { CheckoutPage } from '../../pages/CheckoutPage';
import { testConfig } from '../../config/testConfig';
import { LOCATORS, ROUTES } from '../../config/uiConstants';

test.describe('E-Commerce Critical Flow Tests', () => {
  let homePage: HomePage;
  let loginPage: LoginPage;
  let cartPage: CartPage;
  let checkoutPage: CheckoutPage;
  let dynamicUserEmail: string;

  test.beforeEach(async ({ page }, testInfo) => {
    homePage = new HomePage(page);
    loginPage = new LoginPage(page);
    cartPage = new CartPage(page);
    checkoutPage = new CheckoutPage(page);

    // Generate a strictly unique email combining timestamp, worker index, and a random string.
    const randomSuffix = Math.random().toString(36).substring(2, 7);
    dynamicUserEmail = `toptal_user_${Date.now()}_w${testInfo.workerIndex}_${randomSuffix}@gmail.com`;

    // Navigate to the base URL
    await homePage.navigateTo('/');
  });

  test('TC-01: User Registration and Login Flow', async () => {
    await homePage.navigateToRegister();

    await loginPage.signUpAndRegister(testConfig.username, dynamicUserEmail, testConfig.password);

    // Verify logged in state
    expect(await homePage.isLoggedIn()).toBe(true);

    // Perform Logout and Login to verify login credentials work
    await homePage.navigateToLogout();
    await homePage.navigateToLogin();
    await loginPage.login(dynamicUserEmail, testConfig.password);

    // Re-verify login success
    expect(await homePage.isLoggedIn()).toBe(true);
  });

  test('TC-02: Negative Login Flow with Invalid Credentials', async ({ page }) => {
    await homePage.navigateToLogin();

    // Attempt login with invalid credentials
    await loginPage.login(testConfig.negative.invalidEmail, testConfig.negative.invalidPassword);

    const errorAlert = page.locator(LOCATORS.HOME.ALERT_DANGER);
    await expect(errorAlert).toBeVisible();
  });

  // Data-Driven Parameterized Tests for Search
  for (const criteria of testConfig.searchCriteria) {
    test(`TC-03, TC-04, TC-05: Product Search for criteria: ${criteria}`, async () => {
      await homePage.navigateToProducts();
      await homePage.searchProduct(criteria);

      const resultsCount = await homePage.getSearchedProductsCount();
      expect(resultsCount).toBeGreaterThan(0);
      console.log(`Search criteria "${criteria}" returned ${resultsCount} results.`);
    });
  }

  test('TC-06: Add Product to Cart and Complete Checkout Flow', async () => {
    // 1. Signup / Register first to proceed to checkout smoothly later
    await homePage.navigateToRegister();
    await loginPage.signUpAndRegister(testConfig.username, dynamicUserEmail, testConfig.password);

    // 2. Search for a product (First criteria)
    await homePage.navigateToProducts();
    const searchTarget = testConfig.searchCriteria[1]; // iPhone (MacBook is out of stock)
    await homePage.searchProduct(searchTarget);

    // 3. Add the product to the cart
    await homePage.addFirstSearchedProductToCart();

    // 4. Navigate to cart and verify items
    await homePage.navigateToCart();
    const cartCount = await cartPage.getCartItemsCount();
    expect(cartCount).toBeGreaterThan(0);

    // 5. Proceed to checkout page
    await cartPage.proceedToCheckout();

    // 6. Complete accordion checkout flow
    await checkoutPage.completeCheckoutFlow();

    // 7. Verify order was confirmed successfully
    const isConfirmed = await checkoutPage.isOrderPlacedSuccessfully();
    expect(isConfirmed).toBe(true);
    console.log('Order successfully placed and confirmed!');
  });

  test('TC-07: Remove Product from Cart', async ({ page }) => {
    await homePage.navigateToProducts();
    await homePage.searchProduct(testConfig.searchCriteria[0]); // MacBook
    await homePage.addFirstSearchedProductToCart();

    await homePage.navigateToCart();
    const cartItemRows = page.locator(LOCATORS.CART.TABLE_ROWS);
    expect(await cartItemRows.count()).toBeGreaterThan(0);

    // Remove one product
    await cartPage.removeFirstProduct();
    // Since we only added 1 item anonymously, the cart should become completely empty!
    const emptyMsg = page.locator(LOCATORS.HOME.CONTENT_PARAGRAPH).first();
    await expect(emptyMsg).toContainText('Your shopping cart is empty!');
  });

  test('TC-08: Navigate Categories and Verify Products', async ({ page }) => {
    await homePage.navigateTo('/');

    // Instead of hover, navigate directly to laptops & notebooks category via URL
    // since the nav bar can be finicky on different viewports in headless mode.
    await page.goto(ROUTES.CATEGORY_LAPTOPS);

    // Verify we arrived at category page and products exist
    await expect(page).toHaveURL(new RegExp(ROUTES.CATEGORY_LAPTOPS.replace('?', '\\?')));
    const products = page.locator(LOCATORS.HOME.PRODUCT_ITEMS);
    expect(await products.count()).toBeGreaterThan(0);
  });

  test('TC-09: Contact Us Form Submission', async ({ page }) => {
    await page.goto(ROUTES.CONTACT);

    await page.locator(LOCATORS.CONTACT.NAME_INPUT).fill(testConfig.username);
    await page.locator(LOCATORS.CONTACT.EMAIL_INPUT).fill(testConfig.negative.contactEmail);
    await page.locator(LOCATORS.CONTACT.ENQUIRY_INPUT).fill(testConfig.negative.contactEnquiry);

    await page.locator(LOCATORS.CONTACT.SUBMIT_BTN).click();

    // OpenCart Contact success redirects to a success page
    await page.waitForURL(new RegExp(ROUTES.CONTACT_SUCCESS.replace('?', '\\?')));
    await expect(page.locator(LOCATORS.HOME.CONTENT_HEADING)).toHaveText('Contact Us');
    await expect(page.getByRole('link', { name: LOCATORS.NAV.CONTINUE_LINK_TEXT })).toBeVisible();
  });

  test('TC-10: Add Product to Wishlist (Requires Login)', async ({ page }) => {
    await homePage.navigateToRegister();
    await loginPage.signUpAndRegister(testConfig.username, dynamicUserEmail, testConfig.password);

    // Search and add to wishlist
    await homePage.navigateToProducts();
    await homePage.searchProduct(testConfig.searchCriteria[1]);

    // The wishlist button has an onclick containing 'wishlist.add'
    await page.locator(LOCATORS.WISHLIST.ADD_BTN).first().click();

    // Wait for success alert overlay
    const successAlert = page.locator(LOCATORS.HOME.SUCCESS_ALERT);
    await expect(successAlert).toBeVisible();

    // Verify it appears on the Wishlist page
    await page.goto(ROUTES.WISHLIST);
    const wishlistRows = page.locator(LOCATORS.WISHLIST.TABLE_ROWS);
    expect(await wishlistRows.count()).toBeGreaterThan(0);
  });

  test('TC-11: [Negative] Search for Non-Existent Product', async ({ page }) => {
    await homePage.navigateToProducts();
    await homePage.searchProduct(testConfig.negative.invalidProduct);
    const msg = page.locator(LOCATORS.HOME.CONTENT_PARAGRAPH).nth(1);
    await expect(msg).toHaveText(/There is no product that matches the search criteria/);
  });

  test('TC-12: [Negative] Checkout with Empty Cart', async ({ page }) => {
    await homePage.navigateToCart();

    // Attempting to proceed to checkout when cart is empty
    // Often there's no checkout button, or clicking it redirects to cart.
    // Let's explicitly try to navigate to checkout via URL
    await page.goto(ROUTES.CHECKOUT);

    // It should redirect back to cart if empty
    await expect(page).toHaveURL(new RegExp(ROUTES.CART.replace('?', '\\?')));
    const msg = page.locator(LOCATORS.HOME.CONTENT_PARAGRAPH).first();
    await expect(msg).toContainText('Your shopping cart is empty!');
  });

  test('TC-13: [Negative] Register with Existing Email', async ({ page }) => {
    await homePage.navigateToRegister();
    // Generate a fresh unique email specifically for this negative test to guarantee it's not registered
    // by a previous test run on this environment.
    const existingEmail = 'existing_' + Date.now() + '@example.com';
    await loginPage.signUpAndRegister(testConfig.username, existingEmail, testConfig.password);

    // Register AGAIN with same email
    await homePage.navigateToLogout();
    await homePage.navigateToRegister();

    // Fill form manually so we don't wait for success URL
    await loginPage.firstNameInput.fill(testConfig.registration.firstName);
    await loginPage.lastNameInput.fill(testConfig.registration.lastName);
    await loginPage.emailInput.fill(existingEmail);
    await loginPage.telephoneInput.fill(testConfig.registration.mobile);
    await loginPage.passwordInput.fill(testConfig.password);
    await loginPage.confirmPasswordInput.fill(testConfig.password);
    await loginPage.agreeTermsCheckbox.click();
    await loginPage.continueButton.click();

    const alert = page.locator(LOCATORS.HOME.ALERT_DANGER);
    await expect(alert).toContainText('Warning: E-Mail Address is already registered!');
  });

  test('TC-14: [Negative] Register with Mismatched Passwords', async ({ page }) => {
    await homePage.navigateToRegister();
    await loginPage.firstNameInput.fill(testConfig.registration.firstName);
    await loginPage.lastNameInput.fill(testConfig.registration.lastName);
    await loginPage.emailInput.fill(testConfig.negative.invalidEmail);
    await loginPage.telephoneInput.fill(testConfig.registration.mobile);
    await loginPage.passwordInput.fill(testConfig.password);
    await loginPage.confirmPasswordInput.fill(testConfig.negative.mismatchedPassword); // Mismatch
    await loginPage.agreeTermsCheckbox.click();
    await loginPage.continueButton.click();

    const errorMsg = page.locator(LOCATORS.HOME.TEXT_DANGER).first();
    await expect(errorMsg).toContainText('Password confirmation does not match password!');
  });

  test('TC-15: [Negative] Submit Contact Form Empty', async ({ page }) => {
    await page.goto(ROUTES.CONTACT);
    await page.locator(LOCATORS.CONTACT.SUBMIT_BTN).click();

    // Verify required field errors appear
    const nameError = page.locator(LOCATORS.HOME.TEXT_DANGER).nth(0);
    const emailError = page.locator(LOCATORS.HOME.TEXT_DANGER).nth(1);
    const enquiryError = page.locator(LOCATORS.HOME.TEXT_DANGER).nth(2);

    await expect(nameError).toBeVisible();
    await expect(emailError).toBeVisible();
    await expect(enquiryError).toBeVisible();
  });

  test('TC-16: [Negative] Add Out of Stock Item and Checkout', async ({ page }) => {
    await homePage.navigateToProducts();
    // iMac is known to trigger the *** out of stock warning on OpenCart demo
    await homePage.searchProduct(testConfig.negative.outOfStockProduct);
    await homePage.addFirstSearchedProductToCart();
    await homePage.navigateToCart();

    const errorAlert = page.locator(LOCATORS.HOME.ALERT_DANGER);
    await expect(errorAlert).toContainText('Products marked with *** are not available');

    // Attempt to checkout
    await cartPage.proceedToCheckout();

    // Should block checkout and return to cart
    await expect(page).toHaveURL(new RegExp(ROUTES.CART.replace('?', '\\?')));
  });

  test('TC-17: [Corner Case] Login with Empty Credentials', async ({ page }) => {
    await homePage.navigateToLogin();
    await loginPage.loginButton.click();

    const errorAlert = page.locator(LOCATORS.HOME.ALERT_DANGER);
    await expect(errorAlert).toContainText('Warning: No match for E-Mail Address and/or Password.');
  });

  test('TC-18: [Corner Case] Subscribe to Newsletter', async ({ page }) => {
    await homePage.navigateToRegister();
    const randomEmail = 'newsletter_' + Date.now() + '@example.com';
    await loginPage.signUpAndRegister(testConfig.username, randomEmail, testConfig.password);

    await page.goto(ROUTES.NEWSLETTER);
    await page.locator(LOCATORS.ACCOUNT.NEWSLETTER_YES).click(); // Yes
    await page.locator(LOCATORS.ACCOUNT.SUBMIT_BTN).click(); // Continue

    const successAlert = page.locator(LOCATORS.HOME.SUCCESS_ALERT);
    await expect(successAlert).toContainText('Success: Your newsletter subscription has been successfully updated!');
  });

  test('TC-19: [Corner Case] Add Product to Compare', async ({ page }) => {
    // Navigate explicitly to the demo home page, because beforeEach '/' goes to the root domain!
    await homePage.navigateTo(ROUTES.HOME);

    // 1st button is 'Add to Cart', 2nd is 'Wish List', 3rd is 'Compare this Product'
    await page.locator(LOCATORS.HOME.COMPARE_BTN).first().click({ force: true });

    // Wait for the success alert to appear
    const successMsg = page.locator(LOCATORS.HOME.SUCCESS_ALERT);
    await expect(successMsg).toContainText('Success: You have added');
  });

  test('TC-20: [Corner Case] Navigate to Brands (Manufacturers) Page', async ({ page }) => {
    // Navigate explicitly to the demo home page
    await homePage.navigateTo(ROUTES.HOME);

    // Click the Brands link in the footer
    await page.locator(LOCATORS.HOME.BRANDS_LINK).click({ force: true });

    // Verify we navigated to the correct page
    await expect(page.locator(LOCATORS.HOME.CONTENT_HEADING)).toHaveText('Find Your Favorite Brand');
  });
});
