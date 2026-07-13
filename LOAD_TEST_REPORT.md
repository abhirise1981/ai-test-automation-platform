# Part 3: Load Testing Assessment Report

## 1. Explain the test in detail
Using **Gatling** (with the modern JavaScript/TypeScript SDK), we implemented a load test designed to simulate a high-traffic event on the target E-Commerce web application (`https://automationexercise.com/`). 

The test scenario (`load-tests/ecommerce.gatling.ts`) is configured with the following parameters:
- **Target Endpoint:** `GET /` (The application homepage)
- **Injection Profile:** `rampUsers(1000).during(15)` - This injects exactly 1,000 concurrent virtual users into the system over a tight 15-second window to simulate a sudden, massive spike in traffic.
- **Assertions:** We configured CI/CD gates requiring a 95% success rate and a maximum response time of < 2 seconds.

## 2. Did the load test have an impact on web application response time?
**Yes, a massive impact.** The dummy server was unable to handle the 1,000-user spike and effectively crashed under the load, yielding a classic DDoS scenario.

**Performance Degradation Metrics:**
- Under a light load (50 users), the server maintained a healthy mean response time of **~578ms**.
- Under the heavy load (1,000 users), the mean response time skyrocketed to **3,378ms** for successful requests, with max response times hitting **4,436ms**.
- **Failure Rate:** The server buckled, returning **452 errors (HTTP 503 Service Unavailable)**. Only 54.8% of the requests succeeded. 
- As expected, Gatling correctly marked the test as **FAILED (Code 2)** because our CI/CD assertions (95% success rate, <2000ms max response) were severely breached.

## 3. What is the optimal application response time for modern-day web applications?
According to industry standards (such as Google's Core Web Vitals and Nielsen Norman Group research):
- **< 100ms:** Feels instantaneous to the user. This is the optimal target for API endpoints and microservices.
- **< 1 second:** The user's flow of thought stays seamless. This is the optimal target for full page loads (Time to First Byte and Largest Contentful Paint).
- **> 2 seconds:** User abandonment rates increase exponentially. E-commerce sites (like the one tested here) risk severe revenue loss if page loads consistently breach the 2-3 second mark. 

## 4. Analyze a few HTTP/S responses
During the test, Gatling recorded the following response distributions:
* **HTTP 200 (OK):** 548 users successfully received the homepage payload. However, due to thread exhaustion on the target server, these successful responses were heavily delayed (average 3.3 seconds).
* **HTTP 503 (Service Unavailable):** 452 users received this error. A 503 indicates that the web server (likely Nginx or Apache acting as a reverse proxy for `automationexercise.com`) was actively refusing connections because its worker pool was completely exhausted by the sudden influx of 1,000 concurrent TCP connections.
