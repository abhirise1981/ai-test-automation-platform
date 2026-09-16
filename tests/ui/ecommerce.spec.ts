import { test, expect } from '@playwright/test';
import { HomePage } from '../../pages/HomePage';
import { LoginPage } from '../../pages/LoginPage';
import { CartPage } from '../../pages/CartPage';
import { CheckoutPage } from '../../pages/CheckoutPage';
import { testConfig } from '../../config/testConfig';

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
    // This guarantees no collisions when multiple workers start at the exact same millisecond.
    const randomSuffix = Math.random().toString(36).substring(2, 7);
    dynamicUserEmail = `toptal_user_${Date.now()}_w${testInfo.workerIndex}_${randomSuffix}@gmail.com`;

    // Block Google Ads and external trackers selectively to prevent ad overlays without breaking font/resource loading
    await page.route('**/*googleadservices*', route => route.abort());
    await page.route('**/*googlesyndication*', route => route.abort());
    await page.route('**/*doubleclick*', route => route.abort());
    await page.route('**/*adservice*', route => route.abort());

    // Navigate to the base URL
    await homePage.navigateTo(testConfig.baseUrl);
  });

  test('User Registration and Login Flow', async () => {
    await homePage.clickLogin();
    
    // Perform registration using dynamic email to guarantee success on any fresh system
    await loginPage.signUpAndRegister(
      testConfig.username,
      dynamicUserEmail,
      testConfig.password
    );

    // Verify logged in state
    expect(await homePage.isLoggedIn()).toBe(true);
    expect(await homePage.getLoggedInUsername()).toBe(testConfig.username);

    // Perform Logout and Login to verify login credentials work
    await homePage.clickLogout();
    await homePage.clickLogin();
    await loginPage.login(dynamicUserEmail, testConfig.password);

    // Re-verify login success
    expect(await homePage.isLoggedIn()).toBe(true);
  });

  test('Product Search by Three Different Criteria', async () => {
    await homePage.clickProducts();

    for (const criteria of testConfig.searchCriteria) {
      await homePage.searchProduct(criteria);
      
      // Verify that at least one product is returned for the search criteria
      const resultsCount = await homePage.getSearchedProductsCount();
      expect(resultsCount).toBeGreaterThan(0);
      console.log(`Search criteria "${criteria}" returned ${resultsCount} results.`);
    }
  });

  test('Add Product to Cart and Complete Checkout Flow', async () => {
    // 1. Signup / Register first to proceed to checkout smoothly later
    await homePage.clickLogin();
    await loginPage.signUpAndRegister(
      testConfig.username,
      dynamicUserEmail,
      testConfig.password
    );

    // 2. Search for a product (First criteria)
    await homePage.clickProducts();
    const searchTarget = testConfig.searchCriteria[0];
    await homePage.searchProduct(searchTarget);

    // 3. Add the product to the cart
    await homePage.addFirstSearchedProductToCart();

    // 4. Navigate to cart and verify items
    await homePage.clickCart();
    const cartCount = await cartPage.getCartItemsCount();
    expect(cartCount).toBe(1);
    
    const cartItems = await cartPage.getCartItemNames();
    expect(cartItems.length).toBe(1);
    console.log(`Verified product in cart: ${cartItems[0]}`);

    // 5. Proceed to checkout page
    await cartPage.proceedToCheckout();

    // 6. Enter comments and place order
    const orderComment = `Test Order for ${testConfig.username} - Toptal Assessment`;
    await checkoutPage.enterCommentAndPlaceOrder(orderComment);

    // 7. Complete card payment details
    await checkoutPage.fillPaymentDetailsAndPay(
      testConfig.payment.cardName,
      testConfig.payment.cardNumber,
      testConfig.payment.cvc,
      testConfig.payment.expiryMonth,
      testConfig.payment.expiryYear
    );

    // 8. Verify order was confirmed successfully
    const isConfirmed = await checkoutPage.isOrderPlacedSuccessfully();
    expect(isConfirmed).toBe(true);
    console.log('Order successfully placed and confirmed!');
  });
});
