/**
 * BaseScreen.ts — Foundation Class for All Mobile Screen Objects
 *
 * Every mobile screen class MUST extend this base. It provides:
 *  - Cross-platform selector resolution (Android resource-id vs iOS accessibility-id)
 *  - Common mobile gestures: swipe, scroll, tap, longPress
 *  - Platform detection (Android vs iOS)
 *  - Keyboard management
 *
 * This is the mobile equivalent of BasePage.ts for web testing.
 */

export class BaseScreen {
  // ─── Platform Detection ──────────────────────────────────────────────────

  /** Returns true if the current test is running on an Android device. */
  protected get isAndroid(): boolean {
    return driver.isAndroid;
  }

  /** Returns true if the current test is running on an iOS device. */
  protected get isIOS(): boolean {
    return driver.isIOS;
  }

  /** Returns the current platform name for logging. */
  protected get platformName(): string {
    return this.isAndroid ? 'Android' : 'iOS';
  }

  // ─── Cross-Platform Selector ─────────────────────────────────────────────

  /**
   * Resolve a cross-platform element selector.
   * Uses Android resource-id for Android and accessibility-id for iOS.
   *
   * @param androidId — Android resource-id (e.g., 'com.app:id/btn_login')
   * @param iosAccessibilityId — iOS accessibility identifier (e.g., 'loginButton')
   */
  protected selector(androidId: string, iosAccessibilityId: string) {
    const query = this.isAndroid ? `android=new UiSelector().resourceId("${androidId}")` : `~${iosAccessibilityId}`;
    return $(query);
  }

  protected selectorAll(androidId: string, iosAccessibilityId: string) {
    const query = this.isAndroid ? `android=new UiSelector().resourceId("${androidId}")` : `~${iosAccessibilityId}`;
    return $$(query);
  }

  protected byText(text: string) {
    const query = this.isAndroid
      ? `android=new UiSelector().text("${text}")`
      : `-ios predicate string:label == "${text}"`;
    return $(query);
  }

  protected byPartialText(text: string) {
    const query = this.isAndroid
      ? `android=new UiSelector().textContains("${text}")`
      : `-ios predicate string:label CONTAINS "${text}"`;
    return $(query);
  }

  // ─── Gestures ────────────────────────────────────────────────────────────

  /**
   * Swipe up on the screen (scroll down to reveal more content).
   */
  async swipeUp(percentage = 0.7): Promise<void> {
    const { width, height } = await driver.getWindowSize();
    const startX = width / 2;
    const startY = height * (0.5 + percentage / 2);
    const endY = height * (0.5 - percentage / 2);

    await driver.performActions([
      {
        type: 'pointer',
        id: 'finger1',
        parameters: { pointerType: 'touch' },
        actions: [
          { type: 'pointerMove', duration: 0, x: startX, y: startY },
          { type: 'pointerDown', button: 0 },
          { type: 'pause', duration: 100 },
          { type: 'pointerMove', duration: 500, x: startX, y: endY },
          { type: 'pointerUp', button: 0 },
        ],
      },
    ]);
    await driver.releaseActions();
  }

  /**
   * Swipe down on the screen (scroll up or pull-to-refresh).
   */
  async swipeDown(percentage = 0.7): Promise<void> {
    const { width, height } = await driver.getWindowSize();
    const startX = width / 2;
    const startY = height * (0.5 - percentage / 2);
    const endY = height * (0.5 + percentage / 2);

    await driver.performActions([
      {
        type: 'pointer',
        id: 'finger1',
        parameters: { pointerType: 'touch' },
        actions: [
          { type: 'pointerMove', duration: 0, x: startX, y: startY },
          { type: 'pointerDown', button: 0 },
          { type: 'pause', duration: 100 },
          { type: 'pointerMove', duration: 500, x: startX, y: endY },
          { type: 'pointerUp', button: 0 },
        ],
      },
    ]);
    await driver.releaseActions();
  }

  /**
   * Swipe left on a specific element (e.g., swipe-to-delete in a list).
   */
  async swipeLeftOnElement(element: any): Promise<void> {
    const location = await element.getLocation();
    const size = await element.getSize();
    const startX = location.x + size.width * 0.8;
    const endX = location.x + size.width * 0.2;
    const centerY = location.y + size.height / 2;

    await driver.performActions([
      {
        type: 'pointer',
        id: 'finger1',
        parameters: { pointerType: 'touch' },
        actions: [
          { type: 'pointerMove', duration: 0, x: startX, y: centerY },
          { type: 'pointerDown', button: 0 },
          { type: 'pause', duration: 100 },
          { type: 'pointerMove', duration: 300, x: endX, y: centerY },
          { type: 'pointerUp', button: 0 },
        ],
      },
    ]);
    await driver.releaseActions();
  }

  /**
   * Scroll to an element by repeatedly swiping up until it is visible.
   */
  async scrollToElement(androidId: string, iosAccessibilityId: string, maxScrolls = 5): Promise<void> {
    for (let i = 0; i < maxScrolls; i++) {
      const element = this.selector(androidId, iosAccessibilityId);
      if (await element.isDisplayed()) {
        return;
      }
      await this.swipeUp(0.5);
    }
    throw new Error(
      `Element not found after ${maxScrolls} scrolls: ${this.isAndroid ? androidId : iosAccessibilityId}`,
    );
  }

  /**
   * Tap at specific coordinates on the screen.
   */
  async tapByCoordinates(x: number, y: number): Promise<void> {
    await driver.performActions([
      {
        type: 'pointer',
        id: 'finger1',
        parameters: { pointerType: 'touch' },
        actions: [
          { type: 'pointerMove', duration: 0, x, y },
          { type: 'pointerDown', button: 0 },
          { type: 'pause', duration: 100 },
          { type: 'pointerUp', button: 0 },
        ],
      },
    ]);
    await driver.releaseActions();
  }

  /**
   * Long-press on an element for context menus.
   */
  async longPress(element: WebdriverIO.Element, durationMs = 1500): Promise<void> {
    const location = await element.getLocation();
    const size = await element.getSize();
    const centerX = location.x + size.width / 2;
    const centerY = location.y + size.height / 2;

    await driver.performActions([
      {
        type: 'pointer',
        id: 'finger1',
        parameters: { pointerType: 'touch' },
        actions: [
          { type: 'pointerMove', duration: 0, x: centerX, y: centerY },
          { type: 'pointerDown', button: 0 },
          { type: 'pause', duration: durationMs },
          { type: 'pointerUp', button: 0 },
        ],
      },
    ]);
    await driver.releaseActions();
  }

  // ─── Keyboard ────────────────────────────────────────────────────────────

  /** Hide the on-screen keyboard. */
  async hideKeyboard(): Promise<void> {
    try {
      if (this.isAndroid) {
        await driver.hideKeyboard();
      } else {
        // iOS: Tap on a non-interactive area to dismiss
        const { width, height } = await driver.getWindowSize();
        await this.tapByCoordinates(width / 2, height * 0.1);
      }
    } catch {
      // Keyboard may not be visible — ignore
    }
  }

  // ─── Waits ───────────────────────────────────────────────────────────────

  /**
   * Wait for the screen to be fully loaded.
   * Override in child classes for screen-specific load indicators.
   */
  async waitForScreen(timeout = 10000): Promise<void> {
    await driver.pause(500); // Minimal pause for animation completion
  }

  /**
   * Wait for an element to be displayed.
   */
  async waitForElement(androidId: string, iosAccessibilityId: string, timeout = 10000): Promise<void> {
    const element = this.selector(androidId, iosAccessibilityId);
    await element.waitForDisplayed({ timeout });
  }
}
