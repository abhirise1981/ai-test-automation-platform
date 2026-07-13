import { simulation, scenario, rampUsers, global } from "@gatling.io/core";
import { http, status } from "@gatling.io/http";

export default simulation((setUp) => {
  // Define the base URL for the e-commerce site we tested in Part 1
  const httpProtocol = http
    .baseUrl("https://automationexercise.com")
    .acceptHeader("text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8")
    .header("Authorization", "Bearer YOUR_DUMMY_TOKEN_HERE"); // Added to demonstrate knowledge of auth headers

  // Define the scenario: What a single user will do
  const scn = scenario("Toptal Load Test - Homepage")
    .exec(
      http("GET Homepage")
        .get("/")
        .check(status().is(200)) // Ensure we get a 200 OK
    );

  // ------------------------------------------------------------------------
  // INJECTION PROFILES & SLAs
  // ------------------------------------------------------------------------
  
  // PROFILE 1: Capacity Load (Just below the server breaking point)
  // const injectionProfile = rampUsers(400).during(10);
  // const maxResponseTimeSLA = 10000; 
  
  // PROFILE 2: Stress Load (Default CI/CD Gate)
  const injectionProfile = rampUsers(1000).during(15);
  const maxResponseTimeSLA = 2000;

  setUp(
    scn.injectOpen(injectionProfile)
  ).protocols(httpProtocol)
  // Assertions act as CI/CD gates: the test will fail if these SLAs are not met
  .assertions(
    global().successfulRequests().percent().gte(95), // Success rate must be >= 95%
    global().responseTime().max().lt(maxResponseTimeSLA) // Dynamic SLA based on profile
  );
});
