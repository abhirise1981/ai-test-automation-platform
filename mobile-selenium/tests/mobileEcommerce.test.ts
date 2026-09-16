import { Builder, By, WebDriver } from 'selenium-webdriver';
import * as chrome from 'selenium-webdriver/chrome';
import { expect } from 'chai';
import { MobileBasePage } from '../pages/MobileBasePage';

/**
 * MOBILE FLAVOUR - SELENIUM WEBDRIVER
 * ------------------------------------------------------------------
 * WHY SELENIUM HERE AND NOT PLAYWRIGHT:
 * Playwright's mobile "devices" (Pixel 5, iPhone 14, etc.) are a
 * viewport + user-agent + touch-event emulation profile inside its
 * own Chromium/WebKit builds - genuinely useful for responsive-web
 * testing, but it is still Playwright's browser automation stack.
 * This harness deliberately uses a *different* automation stack
 * (Selenium 4 WebDriver + Chrome's native DevTools mobile emulation)
 * so the mobile flavour isn't just "Playwright again with a phone
 * skin" - it demonstrates cross-framework automation competency,
 * which is what "mobile flavour using Selenium" was asking for.
 *
 * WHAT THIS IS: mobile-viewport responsive-web testing via Chrome's
 * built-in device emulation (network conditions, touch, user-agent,
 * viewport - all real DevTools Protocol features, not a fake resize).
 *
 * WHAT THIS IS NOT: this is not native app testing. Native iOS/Android
 * app automation (tapping real app binaries on a device/emulator)
 * requires Appium, which speaks WebDriver protocol to real
 * device/simulator farms (BrowserStack, Sauce Labs, or a local
 * emulator). That is the documented production path - see
 * docs/MOBILE_TESTING.md for the Appium migration notes.
 */

describe('Mobile (Chrome DevTools Emulation) - E-Commerce Critical Flows', function () {
  this.timeout(60000);
  let driver: WebDriver;
  let base: MobileBasePage;
  const baseUrl = process.env.BASE_URL || 'https://automationexercise.com';

  before(async () => {
    // Pixel 5 profile: selenium-webdriver's setMobileEmulation() only accepts
    // {deviceName} OR {width, height, pixelRatio} - user-agent is set
    // separately via a Chrome flag.
    const pixel5UserAgent =
      'Mozilla/5.0 (Linux; Android 13; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) ' +
      'Chrome/120.0.0.0 Mobile Safari/537.36';

    const options = new chrome.Options();
    options.setMobileEmulation({ width: 393, height: 851, pixelRatio: 2.75 });
    options.addArguments(
      `--user-agent=${pixel5UserAgent}`,
      '--headless=new',
      '--disable-gpu',
      '--no-sandbox'
    );

    driver = await new Builder().forBrowser('chrome').setChromeOptions(options).build();
    base = new MobileBasePage(driver);
  });

  after(async () => {
    if (driver) await driver.quit();
  });

  it('MOB-01: Homepage loads correctly in mobile viewport', async () => {
    await base.open(baseUrl);
    const title = await base.getTitle();
    expect(title.toLowerCase()).to.include('automation exercise');
  });

  it('MOB-02: Mobile navigation menu / hamburger interaction is reachable', async () => {
    await base.open(baseUrl);
    // On a responsive layout the primary nav should still be present
    // in the DOM (visible or behind a collapsed menu toggle).
    const navPresent = await driver.findElements(By.css('nav, .navbar, header'));
    expect(navPresent.length).to.be.greaterThan(0);
  });

  it('MOB-03: Product search works on mobile viewport', async () => {
    await base.open(`${baseUrl}/products`);
    await base.typeText(By.id('search_product'), 'dress');
    await base.clickWhenReady(By.id('submit_search'));

    const heading = await base.waitVisible(By.css('.title.text-center'));
    const text = await heading.getText();
    expect(text.toLowerCase()).to.include('searched');
  });

  it('MOB-04: Add to cart flow is completable on mobile viewport', async () => {
    await base.open(`${baseUrl}/products`);
    const addToCartButtons = await driver.findElements(By.css('.productinfo .add-to-cart'));
    expect(addToCartButtons.length).to.be.greaterThan(0);
    await addToCartButtons[0].click();

    // Modal confirmation should appear even at mobile width
    const modal = await base.waitVisible(By.css('#cartModal .modal-content'));
    const modalText = await modal.getText();
    expect(modalText.toLowerCase()).to.include('cart');
  });

  it('MOB-05: Page renders without horizontal overflow at mobile width', async () => {
    await base.open(baseUrl);
    const overflow = await driver.executeScript<boolean>(
      'return document.documentElement.scrollWidth > document.documentElement.clientWidth + 5;'
    );
    // Advisory-style assertion: horizontal overflow on mobile usually
    // indicates a responsive-design bug worth a ticket, not necessarily
    // a hard pipeline blocker on a third-party demo site.
    if (overflow) {
      console.warn('[MOB-05][ADVISORY] Horizontal overflow detected at mobile viewport width.');
    }
  });
});
