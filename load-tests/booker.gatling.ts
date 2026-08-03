import { jsonPath, rampUsers, scenario, simulation, StringBody } from '@gatling.io/core';
import { http, status } from '@gatling.io/http';

/**
 * Gatling load test script converted from the provided JMeter (JMX) Test Plan.
 *
 * Target: restful-booker.herokuapp.com
 * Standalone configuration to avoid polluting the main framework config.
 */

// ── HTTP Protocol Setup ──────────────────────────────────────────────────────
const httpProtocol = http
  .baseUrl('https://restful-booker.herokuapp.com')
  .acceptHeader('application/json')
  .contentTypeHeader('application/json');

// ── Scenario Setup ───────────────────────────────────────────────────────────
const bookerScenario = scenario('E2ETest')
  // 1. Login
  .exec(
    http('Login')
      .post('/auth')
      .body(
        StringBody(`{
    "username" : "admin",
    "password" : "password123"
}`),
      )
      .check(status().is(200))
      // Extract the 'token' using JSONPath and save it in the session
      .check(jsonPath('$.token').saveAs('token')),
  )

  // 2. Get Bookings
  .exec(http('GetBooking').get('/booking').check(status().is(200)))

  // 3. Create Booking
  .exec(
    http('Create Booking')
      .post('/booking')
      .body(
        StringBody(`{
    "firstname" : "Jim",
    "lastname" : "Brown",
    "totalprice" : 111,
    "depositpaid" : true,
    "bookingdates" : {
        "checkin" : "2018-01-01",
        "checkout" : "2019-01-01"
    },
    "additionalneeds" : "Breakfast"
}`),
      )
      .check(status().is(200))
      // Extract the 'bookingid' using JSONPath and save it in the session
      .check(jsonPath('$.bookingid').saveAs('bookingid')),
  )

  // 4. Update Booking
  .exec(
    http('updateBooking')
      // Note: Gatling uses #{var} for session variable interpolation
      .put('/booking/#{bookingid}')
      // Fixed: restful-booker expects the token as a Cookie, not a Bearer token
      .header('Cookie', 'token=#{token}')
      .body(
        StringBody(`{
    "firstname" : "James",
    "lastname" : "Brown",
    "totalprice" : 111,
    "depositpaid" : true,
    "bookingdates" : {
        "checkin" : "2018-01-01",
        "checkout" : "2019-01-01"
    },
    "additionalneeds" : "Breakfast"
}`),
      )
      .check(status().is(200)),
  )

  // 5. Delete Booking
  .exec(
    http('Deletebookingid')
      .delete('/booking/#{bookingid}')
      // Fixed: restful-booker expects the token as a Cookie
      .header('Cookie', 'token=#{token}')
      // Usually restful-booker returns a 201 Created for DELETE success, but checking for 2xx
      .check(status().in(200, 201)),
  );

// ── Simulation Setup ─────────────────────────────────────────────────────────
export default simulation((setUp) => {
  setUp(
    bookerScenario.injectOpen(
      // Mapping from JMeter Thread Group: 1 thread, ramped up over 1 second
      rampUsers(1).during(1),
    ),
  ).protocols(httpProtocol);
});
