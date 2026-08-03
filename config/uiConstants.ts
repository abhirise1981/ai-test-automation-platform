/**
 * uiConstants.ts
 *
 * Centralized repository for all structural locators and routing paths.
 * Decoupling these from the Page Object classes ensures zero hardcoded
 * string literals exist in the class logic, meeting the strictest
 * automation framework standards.
 */

export const ROUTES = {
  CATEGORY_LAPTOPS: 'index.php?route=product/category&path=18',
  HOME: 'index.php?route=common/home',
  PRODUCTS: 'index.php?route=product/search',
  CART: 'index.php?route=checkout/cart',
  LOGIN: 'index.php?route=account/login',
  REGISTER: 'index.php?route=account/register',
  LOGOUT: 'index.php?route=account/logout',
  CHECKOUT: 'index.php?route=checkout/checkout',
  ORDER_PLACED: 'index.php?route=checkout/success',
  CONTACT: 'index.php?route=information/contact',
  CONTACT_SUCCESS: 'index.php?route=information/contact/success',
  WISHLIST: 'index.php?route=account/wishlist',
  NEWSLETTER: 'index.php?route=account/newsletter',
  PRODUCT_DETAILS_REGEX: /route=product\/product/,
  ACCOUNT_SUCCESS_REGEX: /route=account\/success/,
};

export const LOCATORS = {
  CART: {
    TABLE_ROWS: '.table-bordered tbody tr',
    ITEM_NAMES: '.table-bordered tbody tr td.text-left a',
    REMOVE_BTN: '.table-responsive .btn-danger',
    EMPTY_MSG: '#content p',
    CHECKOUT_BTN_TEXT: 'Checkout',
  },
  HOME: {
    SEARCH_INPUT: '#search input[name="search"]',
    SEARCH_BUTTON: '#search button',
    PRODUCT_ITEMS: '.product-layout',
    ADD_TO_CART_BTN: 'button[onclick^="cart.add"]',
    SUCCESS_ALERT: '.alert-success',
    ALERT_DANGER: '.alert-danger',
    TEXT_DANGER: '.text-danger',
    CONTENT_PARAGRAPH: '#content p',
    CONTENT_HEADING: '#content h1',
    COMPARE_BTN: 'button[data-original-title="Compare this Product"]',
    BRANDS_LINK: 'a[href*="route=product/manufacturer"]',
    FIRST_PRODUCT_CART_BTN: '.product-layout .button-group button',
  },
  PRODUCT_PAGE: {
    ADD_TO_CART_BTN: '#button-cart',
  },
  CHECKOUT: {
    PAYMENT_METHOD_RADIO: 'input[name="payment_method"][value="cod"]',
    AGREE_TERMS_CHECKBOX: 'input[name="agree"]',
    CONFIRM_BTN: '#button-confirm',
    BILLING_FIRSTNAME: '#input-payment-firstname',
    BILLING_LASTNAME: '#input-payment-lastname',
    BILLING_ADDRESS_1: '#input-payment-address-1',
    BILLING_CITY: '#input-payment-city',
    BILLING_POSTCODE: '#input-payment-postcode',
    BILLING_COUNTRY: '#input-payment-country',
    BILLING_ZONE: '#input-payment-zone',
    BTN_BILLING_CONTINUE: '#button-payment-address',
    BTN_SHIPPING_CONTINUE: '#button-shipping-address',
    BTN_SHIPPING_METHOD_CONTINUE: '#button-shipping-method',
    BTN_PAYMENT_METHOD_CONTINUE: '#button-payment-method',
    SUCCESS_HEADING_TEXT: 'Your order has been placed!',
  },
  CONTACT: {
    NAME_INPUT: '#input-name',
    EMAIL_INPUT: '#input-email',
    ENQUIRY_INPUT: '#input-enquiry',
    SUBMIT_BTN: 'input[type="submit"]',
    SUCCESS_MSG: '#content p',
  },
  ACCOUNT: {
    NEWSLETTER_YES: 'input[name="newsletter"][value="1"]',
    SUBMIT_BTN: 'input[type="submit"]',
  },
  WISHLIST: {
    ADD_BTN: 'button[onclick^="wishlist.add"]',
    TABLE_ROWS: '.table-bordered tbody tr',
  },
  NAV: {
    MY_ACCOUNT: 'a[title="My Account"]',
    SHOPPING_CART: 'a:has-text("Shopping Cart")',
    LOGIN_LINK_TEXT: 'Login',
    LOGOUT_LINK_TEXT: 'Logout',
    CART_LINK_TEXT: 'Shopping Cart',
    CONTINUE_LINK_TEXT: 'Continue',
  },
  LOGIN_PAGE: {
    EMAIL_INPUT: '#input-email',
    PASSWORD_INPUT: '#input-password',
    LOGIN_BTN: 'input[value="Login"]',
  },
  REGISTER_PAGE: {
    FIRSTNAME: '#input-firstname',
    LASTNAME: '#input-lastname',
    EMAIL: '#input-email',
    TELEPHONE: '#input-telephone',
    PASSWORD: '#input-password',
    CONFIRM_PASSWORD: '#input-confirm',
    AGREE_CHECKBOX: '.pull-right input[name="agree"]',
    CONTINUE_BTN: '.pull-right input[value="Continue"]',
  },
};
