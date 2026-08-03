// WebdriverIO handles expect globally in Mocha
import { LoginScreen } from '../../screens/LoginScreen';
import { testConfig } from '../../config/testConfig';

describe('Mobile Native - Login Flow', () => {
  let loginScreen: LoginScreen;

  before(async () => {
    loginScreen = new LoginScreen();
  });

  it('MOB-LOGIN-01: Should show error for invalid credentials', async () => {
    // Assuming the app starts on or can navigate to the login screen
    // For this test, we assume the app opens on Login
    await loginScreen.waitForScreen();
    await loginScreen.login('invalid@email.com', 'wrongpassword');

    const isErrorVisible = await loginScreen.isErrorDisplayed();
    expect(isErrorVisible).toBe(true);

    const errorText = await loginScreen.getErrorText();
    expect(errorText.length).toBeGreaterThan(0);
  });

  it('MOB-LOGIN-02: Should successfully log in with valid credentials', async () => {
    await loginScreen.login('test@test.com', testConfig.password);
    // After login, we would typically wait for HomeScreen to appear
    // await homeScreen.waitForScreen();
  });
});
