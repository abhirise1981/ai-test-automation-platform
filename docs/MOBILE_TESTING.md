# Mobile Testing Strategy

This project ships **two** mobile layers, deliberately different in
scope. Knowing the difference is the interview-defensible part.

## 1. Playwright device emulation (`playwright.config.ts` mobile-chrome / mobile-safari projects)

- Runs the existing `tests/ui/*.spec.ts` suite unchanged, against
  Playwright's built-in Pixel 5 / iPhone 13 device profiles (viewport,
  user-agent, touch events).
- Fast, zero extra infrastructure, good for responsive-web regression.
- Still Playwright's own Chromium/WebKit builds under the hood.

## 2. Selenium WebDriver + Chrome mobile emulation (`/mobile-selenium`)

- A separate automation stack (Selenium 4 WebDriver, Mocha, Chai)
  driving Chrome's native DevTools Protocol mobile emulation.
- Exists to demonstrate cross-framework competency and to decouple the
  mobile flavour from a single vendor's automation stack - a
  reasonable ask when a client's existing infra is Selenium-based.
- Run independently: `cd mobile-selenium && npm install && npm test`

## What neither of these is: native app testing

Both layers above are **responsive-web** testing - a real browser
rendering a mobile viewport. Neither drives an actual native iOS/Android
app binary.

**Native app automation requires Appium.** Appium speaks the WebDriver
protocol against a real device, simulator, or emulator (via
BrowserStack/Sauce Labs or a local Android/iOS emulator), driving the
actual compiled app rather than a mobile browser. If a role explicitly
needs native app coverage (e.g. a banking app's iOS/Android build),
say so directly and scope an Appium harness as a follow-on - don't
imply this browser-emulation layer already covers it.

## Migration note (for a real native-app engagement)

```
# Conceptual only - requires a real Appium server + device/emulator
const driver = await remote({
  capabilities: {
    platformName: 'Android',
    'appium:deviceName': 'Pixel_5_API_33',
    'appium:app': '/path/to/app-debug.apk',
    'appium:automationName': 'UiAutomator2'
  }
});
```

This is intentionally left as documentation, not wired code - it
needs a device/emulator farm this reference project doesn't have.
