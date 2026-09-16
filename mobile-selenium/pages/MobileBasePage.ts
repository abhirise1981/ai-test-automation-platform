import { WebDriver, WebElement, By, until } from 'selenium-webdriver';

export class MobileBasePage {
  protected driver: WebDriver;
  protected defaultTimeoutMs = 15000;

  constructor(driver: WebDriver) {
    this.driver = driver;
  }

  async open(url: string): Promise<void> {
    await this.driver.get(url);
  }

  async waitVisible(locator: By): Promise<WebElement> {
    const el = await this.driver.wait(until.elementLocated(locator), this.defaultTimeoutMs);
    await this.driver.wait(until.elementIsVisible(el), this.defaultTimeoutMs);
    return el;
  }

  async clickWhenReady(locator: By): Promise<void> {
    const el = await this.waitVisible(locator);
    await this.driver.wait(until.elementIsEnabled(el), this.defaultTimeoutMs);
    await el.click();
  }

  async typeText(locator: By, text: string): Promise<void> {
    const el = await this.waitVisible(locator);
    await el.clear();
    await el.sendKeys(text);
  }

  async getTitle(): Promise<string> {
    return this.driver.getTitle();
  }
}
