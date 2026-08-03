// WebdriverIO handles expect globally in Mocha
import { HomeScreen } from '../../screens/HomeScreen';
import { CartScreen } from '../../screens/CartScreen';
import { CheckoutScreen } from '../../screens/CheckoutScreen';
import { testConfig } from '../../config/testConfig';

describe('Mobile Native - E-commerce Flow', () => {
  let homeScreen: HomeScreen;
  let cartScreen: CartScreen;
  let checkoutScreen: CheckoutScreen;

  before(async () => {
    homeScreen = new HomeScreen();
    cartScreen = new CartScreen();
    checkoutScreen = new CheckoutScreen();
  });

  it('MOB-ECOM-01: Should search for a product and add to cart', async () => {
    await homeScreen.waitForScreen();
    await homeScreen.searchProduct(testConfig.searchCriteria[0]);

    const count = await homeScreen.getProductCount();
    expect(count).toBeGreaterThan(0);

    await homeScreen.addFirstProductToCart();

    // Verify badge updates (may need a small wait)
    await driver.pause(1000);
    const badgeCount = await homeScreen.getCartBadgeCount();
    expect(badgeCount).toBeGreaterThan(0);
  });

  it('MOB-ECOM-02: Should proceed to checkout from cart', async () => {
    await homeScreen.navigateToCart();
    await cartScreen.waitForScreen();

    const isCartEmpty = await cartScreen.isCartEmpty();
    expect(isCartEmpty).toBe(false);

    await cartScreen.proceedToCheckout();
    await checkoutScreen.waitForScreen();
  });
});
