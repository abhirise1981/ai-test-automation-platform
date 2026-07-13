# E-Commerce and API Test Suite Documentation

This document describes the test cases, flows, and scenarios implemented in the automated test suite.

---

## Part 1: UI E-Commerce Critical Flows

### Test Case 1: User Registration & Login Flow
- **Description**: Verify that a new user can sign up, register an account, log out, and log back in successfully.
- **Steps**:
  1. Navigate to the homepage (`https://automationexercise.com/`).
  2. Click on the "Signup / Login" link.
  3. Fill in a unique name and dynamic email (`toptal_user_[timestamp]@gmail.com`) under the "New User Signup!" section and click "Signup".
  4. Fill in account details: password, address, city, state, zip code, mobile number, etc.
  5. Click "Create Account" and verify the success message header is visible.
  6. Click "Continue" to return to the homepage.
  7. Verify the user is logged in (header shows "Logged in as [username]").
  8. Click "Logout" and verify the user is redirected to `/login` or logged out state.
  9. Log back in using the registered credentials.
  10. Verify the header shows "Logged in as [username]" again.
- **Expected Results**:
  - Account is successfully created.
  - Login works consistently with the new credentials.

---

### Test Case 2: Product Search by Three Different Criteria
- **Description**: Verify that products can be successfully searched by three different keywords and at least one matching product is returned for each.
- **Keywords**: `tshirt`, `jeans`, `dress`
- **Steps**:
  1. Navigate to the Products page (`https://automationexercise.com/products`).
  2. For each keyword:
     a. Enter the keyword in the search bar.
     b. Submit the search (click the magnifying glass button or press Enter).
     c. Verify that the "Searched Products" header is visible.
     d. Retrieve the count of returned product items.
     e. Assert that the count is greater than 0.
- **Expected Results**:
  - The search executes successfully for all three keywords.
  - Search results are displayed, showing matching products for each criteria.

---

### Test Case 3: Add Product to Cart & Complete Checkout Flow
- **Description**: Verify that a logged-in user can search for a product, add it to the shopping cart, proceed to checkout, enter order comments, fill payment details, and confirm the order.
- **Steps**:
  1. Navigate to the "Signup / Login" link and register a new dynamic user to ensure clean state.
  2. Navigate to the Products page (`https://automationexercise.com/products`).
  3. Search for the keyword `tshirt`.
  4. Click "Add to cart" on the first returned product container.
  5. Wait for the confirmation modal to appear and click "Continue Shopping".
  6. Navigate to the Cart page (`https://automationexercise.com/view_cart`).
  7. Verify that exactly 1 item is in the cart and matches the added product description.
  8. Click "Proceed to Checkout".
  9. Enter an order comment (e.g., "Test Order for Abhishek Kumar - Toptal Assessment").
  10. Click "Place Order" to redirect to the Payment page.
  11. Fill in card name, number, CVC, expiry month, and expiry year.
  12. Click "Pay and Confirm Order".
  13. Verify that the order confirmation success message (`ORDER PLACED!`) is displayed.
- **Expected Results**:
  - Product is successfully added to cart.
  - Cart item count and description are correct.
  - Payment and checkout are successfully completed, resulting in an order confirmation.

---

## Part 2: REST API Location & Geocoding Flows

### Test Case 4: GET - Retrieve Coordinates for Valid Location
- **Endpoint**: `https://nominatim.openstreetmap.org/search`
- **Description**: Verify that querying the geocoding endpoint with a valid location name (e.g., "London") returns a `200 OK` status and a valid JSON array of coordinates.
- **Expected Results**:
  - HTTP Status: `200 OK`
  - Body is a JSON array containing at least one item.
  - The returned object has properties: `lat`, `lon`, and `display_name`.

---

### Test Case 5: GET - Invalid Endpoint Path Simulation
- **Endpoint**: `https://nominatim.openstreetmap.org/invalid_endpoint_path_for_testing`
- **Description**: Verify that querying an invalid endpoint returns a `404 Not Found` status.
- **Expected Results**:
  - HTTP Status: `404 Not Found`

---

### Test Case 6: GET - Unauthorized Access Simulation
- **Endpoint**: `https://postman-echo.com/basic-auth`
- **Description**: Verify that attempting to access a basic-auth secured endpoint without authorization headers returns a `401 Unauthorized` status.
- **Expected Results**:
  - HTTP Status: `401 Unauthorized`

---

### Test Case 7: POST - Resource Creation Simulation
- **Endpoint**: `https://jsonplaceholder.typicode.com/posts`
- **Description**: Verify that sending a POST request with new location metadata successfully creates the resource.
- **Expected Results**:
  - HTTP Status: `201 Created`
  - Response body contains the posted fields (`title`, `body`, `userId`) and an auto-generated `id`.

---

### Test Case 8: PUT - Resource Modification Simulation
- **Endpoint**: `https://jsonplaceholder.typicode.com/posts/1`
- **Description**: Verify that sending a PUT request updates the existing resource properties.
- **Expected Results**:
  - HTTP Status: `200 OK`
  - Response body echoes the updated field values.

---

### Test Case 9: DELETE - Resource Deletion Simulation
- **Endpoint**: `https://jsonplaceholder.typicode.com/posts/1`
- **Description**: Verify that sending a DELETE request deletes the specified resource.
- **Expected Results**:
  - HTTP Status: `200 OK`
