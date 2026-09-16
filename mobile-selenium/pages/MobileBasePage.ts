import { WebDriver, WebElement, By, until } from 'selenium-webdriver';

export class MobileBasePage {
  protected driver: WebDriver;
  protected defaultTimeoutMs = 15000;

  constructor(driver: WebDriver) {
    this.driver = driver;
  }

  async open(url: string): Promise<void> {
    await this.driver.get(url);
    await this.dismissAdOverlays();
  }

  async dismissAdOverlays(): Promise<void> {
    try {
      await this.driver.executeScript(`
        try {
          const ads = document.querySelectorAll('iframe[id*="aswift"], iframe[src*="googleads"], iframe[src*="doubleclick"], .adsbygoogle, [id*="ad_position"]');
          ads.forEach(e => e.remove());
        } catch(e) {}
      `);
    } catch {
      // ignore
    }
  }

  async waitVisible(locator: By): Promise<WebElement> {
    await this.dismissAdOverlays();
    const el = await this.driver.wait(until.elementLocated(locator), this.defaultTimeoutMs);
    await this.driver.wait(until.elementIsVisible(el), this.defaultTimeoutMs);
    return el;
  }

  async clickWhenReady(locator: By): Promise<void> {
    await this.dismissAdOverlays();
    const el = await this.waitVisible(locator);
    await this.driver.wait(until.elementIsEnabled(el), this.defaultTimeoutMs);
    try {
      await el.click();
    } catch (err) {
      await this.dismissAdOverlays();
      try {
        await el.click();
      } catch (e2) {
        // Fallback to JS click if element click is still intercepted by ads/overlays
        await this.driver.executeScript('arguments[0].click();', el);
      }
    }
  }

  async typeText(locator: By, text: string): Promise<void> {
    await this.dismissAdOverlays();
    const el = await this.waitVisible(locator);
    await el.clear();
    await el.sendKeys(text);
  }

  async getTitle(): Promise<string> {
    return this.driver.getTitle();
  }
}
