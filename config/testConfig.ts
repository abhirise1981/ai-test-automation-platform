export const testConfig = {
  baseUrl: process.env.BASE_URL || 'https://automationexercise.com',
  email: process.env.TEST_EMAIL || 'toptal_sdet_test_user@gmail.com',
  password: process.env.TEST_PASSWORD || 'Password123!',
  username: process.env.TEST_USERNAME || 'Abhishek Kumar',
  searchCriteria: [
    process.env.SEARCH_CRITERIA_1 || 'tshirt',
    process.env.SEARCH_CRITERIA_2 || 'jeans',
    process.env.SEARCH_CRITERIA_3 || 'dress'
  ],
  payment: {
    cardName: process.env.CARD_NAME || 'Abhishek Kumar',
    cardNumber: process.env.CARD_NUMBER || '4111111111111111',
    cvc: process.env.CARD_CVC || '311',
    expiryMonth: process.env.CARD_EXPIRY_MONTH || '12',
    expiryYear: process.env.CARD_EXPIRY_YEAR || '2030'
  }
};
