/**
 * mobileSelectors.ts — Centralized Mobile Selectors
 *
 * Equivalent of uiConstants.ts for native mobile apps.
 * All Android resource-id and iOS accessibility-id selectors are defined here.
 * Screen Object classes reference these — NEVER hardcode selectors in tests or screens.
 *
 * Structure: Each screen section has `android` and `ios` sub-objects
 * for cross-platform selector resolution via BaseScreen.selector().
 */

export const MOBILE_SELECTORS = {
  LOGIN: {
    android: {
      EMAIL_INPUT: 'com.app:id/input_email',
      PASSWORD_INPUT: 'com.app:id/input_password',
      LOGIN_BTN: 'com.app:id/btn_login',
      SIGNUP_LINK: 'com.app:id/link_signup',
      ERROR_MESSAGE: 'com.app:id/error_message',
      FORGOT_PASSWORD: 'com.app:id/link_forgot_password',
    },
    ios: {
      EMAIL_INPUT: 'emailTextField',
      PASSWORD_INPUT: 'passwordTextField',
      LOGIN_BTN: 'loginButton',
      SIGNUP_LINK: 'signUpLink',
      ERROR_MESSAGE: 'errorMessageLabel',
      FORGOT_PASSWORD: 'forgotPasswordLink',
    },
  },

  REGISTRATION: {
    android: {
      FIRSTNAME_INPUT: 'com.app:id/input_firstname',
      LASTNAME_INPUT: 'com.app:id/input_lastname',
      EMAIL_INPUT: 'com.app:id/input_email',
      PHONE_INPUT: 'com.app:id/input_phone',
      PASSWORD_INPUT: 'com.app:id/input_password',
      CONFIRM_PASSWORD: 'com.app:id/input_confirm_password',
      TERMS_CHECKBOX: 'com.app:id/checkbox_terms',
      REGISTER_BTN: 'com.app:id/btn_register',
    },
    ios: {
      FIRSTNAME_INPUT: 'firstNameTextField',
      LASTNAME_INPUT: 'lastNameTextField',
      EMAIL_INPUT: 'emailTextField',
      PHONE_INPUT: 'phoneTextField',
      PASSWORD_INPUT: 'passwordTextField',
      CONFIRM_PASSWORD: 'confirmPasswordTextField',
      TERMS_CHECKBOX: 'termsCheckbox',
      REGISTER_BTN: 'registerButton',
    },
  },

  HOME: {
    android: {
      SEARCH_INPUT: 'com.app:id/search_input',
      SEARCH_BTN: 'com.app:id/btn_search',
      PRODUCT_LIST: 'com.app:id/recycler_products',
      PRODUCT_ITEM: 'com.app:id/product_item',
      PRODUCT_NAME: 'com.app:id/product_name',
      PRODUCT_PRICE: 'com.app:id/product_price',
      ADD_TO_CART_BTN: 'com.app:id/btn_add_to_cart',
      CART_BADGE: 'com.app:id/cart_badge',
      BOTTOM_NAV_HOME: 'com.app:id/nav_home',
      BOTTOM_NAV_CART: 'com.app:id/nav_cart',
      BOTTOM_NAV_ACCOUNT: 'com.app:id/nav_account',
      HAMBURGER_MENU: 'com.app:id/btn_menu',
      PULL_TO_REFRESH: 'com.app:id/swipe_refresh',
    },
    ios: {
      SEARCH_INPUT: 'searchTextField',
      SEARCH_BTN: 'searchButton',
      PRODUCT_LIST: 'productCollectionView',
      PRODUCT_ITEM: 'productCell',
      PRODUCT_NAME: 'productNameLabel',
      PRODUCT_PRICE: 'productPriceLabel',
      ADD_TO_CART_BTN: 'addToCartButton',
      CART_BADGE: 'cartBadgeLabel',
      BOTTOM_NAV_HOME: 'homeTab',
      BOTTOM_NAV_CART: 'cartTab',
      BOTTOM_NAV_ACCOUNT: 'accountTab',
      HAMBURGER_MENU: 'menuButton',
      PULL_TO_REFRESH: 'pullToRefreshControl',
    },
  },

  CART: {
    android: {
      CART_ITEM_LIST: 'com.app:id/recycler_cart',
      CART_ITEM: 'com.app:id/cart_item',
      ITEM_NAME: 'com.app:id/cart_item_name',
      ITEM_QUANTITY: 'com.app:id/cart_item_quantity',
      ITEM_PRICE: 'com.app:id/cart_item_price',
      REMOVE_BTN: 'com.app:id/btn_remove',
      QUANTITY_INCREASE: 'com.app:id/btn_qty_increase',
      QUANTITY_DECREASE: 'com.app:id/btn_qty_decrease',
      TOTAL_PRICE: 'com.app:id/total_price',
      CHECKOUT_BTN: 'com.app:id/btn_checkout',
      EMPTY_CART_MSG: 'com.app:id/empty_cart_message',
    },
    ios: {
      CART_ITEM_LIST: 'cartTableView',
      CART_ITEM: 'cartItemCell',
      ITEM_NAME: 'cartItemNameLabel',
      ITEM_QUANTITY: 'cartItemQuantityLabel',
      ITEM_PRICE: 'cartItemPriceLabel',
      REMOVE_BTN: 'removeButton',
      QUANTITY_INCREASE: 'increaseQuantityButton',
      QUANTITY_DECREASE: 'decreaseQuantityButton',
      TOTAL_PRICE: 'totalPriceLabel',
      CHECKOUT_BTN: 'checkoutButton',
      EMPTY_CART_MSG: 'emptyCartLabel',
    },
  },

  CHECKOUT: {
    android: {
      ADDRESS_LINE1: 'com.app:id/input_address',
      CITY_INPUT: 'com.app:id/input_city',
      ZIPCODE_INPUT: 'com.app:id/input_zipcode',
      COUNTRY_DROPDOWN: 'com.app:id/spinner_country',
      CARD_NUMBER: 'com.app:id/input_card_number',
      CARD_EXPIRY: 'com.app:id/input_card_expiry',
      CARD_CVC: 'com.app:id/input_card_cvc',
      PLACE_ORDER_BTN: 'com.app:id/btn_place_order',
      ORDER_CONFIRMATION: 'com.app:id/order_confirmation',
      ORDER_ID: 'com.app:id/order_id',
    },
    ios: {
      ADDRESS_LINE1: 'addressTextField',
      CITY_INPUT: 'cityTextField',
      ZIPCODE_INPUT: 'zipcodeTextField',
      COUNTRY_DROPDOWN: 'countryPicker',
      CARD_NUMBER: 'cardNumberTextField',
      CARD_EXPIRY: 'cardExpiryTextField',
      CARD_CVC: 'cardCvcTextField',
      PLACE_ORDER_BTN: 'placeOrderButton',
      ORDER_CONFIRMATION: 'orderConfirmationView',
      ORDER_ID: 'orderIdLabel',
    },
  },
};

/** Helper type for platform-specific selector access */
export type MobilePlatform = 'android' | 'ios';
