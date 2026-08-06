/**
 * accessibility.spec.ts — Enterprise WCAG 2.1 AA Accessibility Test Suite
 *
 * Tests:
 *   1. Full Page Accessibility Auditing (Section 508 & WCAG 2.1 AA compliance)
 *   2. Component-Scoped A11y Verification (Login / Checkout Modal)
 *   3. Color Contrast & ARIA Landmark Validation
 *   4. Zero Critical Severity Violations Assertion
 */

import { test, expect } from '@playwright/test';
import { A11yAuditor } from '../../utils/A11yAuditor';

test.describe('WCAG 2.1 AA Enterprise Accessibility (a11y) Suite', () => {
  let a11yAuditor: A11yAuditor;

  test.beforeEach(async () => {
    a11yAuditor = new A11yAuditor();
  });

  test('TC-A11Y-01: Should audit Clinical SaaS Portal for WCAG 2.1 AA compliance', async ({ page }) => {
    // Render an accessible healthcare clinical portal UI
    await page.setContent(`
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <title>Clinical AI SaaS Dashboard</title>
        </head>
        <body>
          <header role="banner">
            <h1>Clinical AI Transcription & Patient Management</h1>
            <nav aria-label="Main Navigation">
              <ul>
                <li><a href="#patients">Patients</a></li>
                <li><a href="#billing">Billing</a></li>
              </ul>
            </nav>
          </header>
          <main role="main">
            <section aria-labelledby="form-heading">
              <h2 id="form-heading">Physician Login</h2>
              <form>
                <label for="doctor-email">Doctor Email</label>
                <input id="doctor-email" type="email" placeholder="dr.smith@hospital.org" required />

                <label for="doctor-password">Password</label>
                <input id="doctor-password" type="password" required />

                <button type="submit" aria-label="Sign in to Clinical Portal" style="background-color: #004085; color: #ffffff; padding: 10px 20px;">Sign In</button>
              </form>
            </section>
          </main>
          <footer role="contentinfo">
            <p>&copy; 2026 Clinical Health Systems. All rights reserved.</p>
          </footer>
        </body>
      </html>
    `);

    const report = await a11yAuditor.auditPage(page, {
      includeTags: ['wcag2a', 'wcag2aa', 'wcag21aa', 'section508'],
    });

    expect(report.passesCount).toBeGreaterThan(0);
    expect(report.criticalCount).toBe(0);
    expect(report.seriousCount).toBe(0);

    // Assert zero blocking violations
    a11yAuditor.assertZeroCriticalViolations(report);
  });

  test('TC-A11Y-02: Should detect accessibility violations on non-compliant elements', async ({ page }) => {
    // Render intentionally inaccessible component (missing form label, missing alt text, low contrast)
    await page.setContent(`
      <!DOCTYPE html>
      <html lang="en">
        <head><title>Flawed Page</title></head>
        <body>
          <!-- Missing alt tag on image -->
          <img src="logo.png" />
          <!-- Missing label for input -->
          <input type="text" placeholder="No label input" />
          <!-- Low contrast button (light grey text on white background) -->
          <button style="background-color: #ffffff; color: #f0f0f0;">Click Me</button>
        </body>
      </html>
    `);

    const report = await a11yAuditor.auditPage(page);

    expect(report.violationsCount).toBeGreaterThan(0);
    const violationIds = report.violations.map((v) => v.id);

    // Verify Axe-Core correctly flagged the defects
    expect(violationIds).toContain('image-alt');
    expect(violationIds).toContain('color-contrast');
  });

  test('TC-A11Y-03: Should audit scoped component with exclusion selectors', async ({ page }) => {
    await page.setContent(`
      <!DOCTYPE html>
      <html lang="en">
        <head><title>Modal Scope</title></head>
        <body>
          <div id="third-party-ad-widget" style="color: #eee; background: #fff;">Uncontrolled 3rd party ad</div>
          <dialog id="payment-modal" open aria-labelledby="modal-title">
            <h2 id="modal-title">Stripe Payment Checkout</h2>
            <form>
              <label for="card-holder">Cardholder Name</label>
              <input id="card-holder" type="text" value="Dr. John Doe" />
              <button type="button" style="background-color: #1a365d; color: #ffffff;">Pay $499</button>
            </form>
          </dialog>
        </body>
      </html>
    `);

    // Audit only the payment modal and exclude third-party widgets
    const report = await a11yAuditor.auditPage(page, {
      scopeSelector: '#payment-modal',
      excludeSelectors: ['#third-party-ad-widget'],
    });

    expect(report.criticalCount).toBe(0);
    expect(report.seriousCount).toBe(0);
  });

  test('TC-A11Y-04: Should verify logical Keyboard Navigation & Tab Focus Order (WCAG 2.1.1 & 2.4.7)', async ({ page }) => {
    await page.setContent(`
      <!DOCTYPE html>
      <html lang="en">
        <body>
          <form id="checkout-form">
            <input id="first-name" type="text" placeholder="First Name" />
            <input id="last-name" type="text" placeholder="Last Name" />
            <button id="btn-submit" type="submit">Submit</button>
          </form>
        </body>
      </html>
    `);

    // Verify sequential Tab focus: first-name -> last-name -> btn-submit
    await a11yAuditor.assertKeyboardNavigation(page, ['#first-name', '#last-name', '#btn-submit']);
  });

  test('TC-A11Y-05: Should enforce 48x48px Minimum Touch Target Size (WCAG 2.5.5 & Mobile Guidelines)', async ({ page }) => {
    await page.setContent(`
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <style>
            .accessible-touch-btn {
              min-width: 48px;
              min-height: 48px;
              padding: 12px 24px;
              background-color: #004085;
              color: #ffffff;
              border: none;
              font-size: 16px;
              cursor: pointer;
            }
          </style>
        </head>
        <body>
          <button id="btn-upgrade" class="accessible-touch-btn">Upgrade Plan</button>
        </body>
      </html>
    `);

    // Assert button has at least 48x48px bounding box
    await a11yAuditor.assertTouchTargetSize(page, '#btn-upgrade', 48, 48);
  });

  test('TC-A11Y-06: Should verify 4.5:1 minimum color contrast ratio for normal text (WCAG 1.4.3)', async ({ page }) => {
    await page.setContent(`
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <style>
            /* High Contrast: Dark Navy text (#002244) on Light background (#ffffff) = 14.5:1 ratio */
            .high-contrast-text {
              background-color: #ffffff;
              color: #002244;
              font-size: 16px;
            }
          </style>
        </head>
        <body>
          <p class="high-contrast-text">High Contrast Clinical Records & Patient Summary</p>
        </body>
      </html>
    `);

    const report = await a11yAuditor.auditPage(page, {
      includeTags: ['wcag2aa'],
    });

    const contrastViolations = report.violations.filter((v) => v.id === 'color-contrast');
    expect(contrastViolations.length).toBe(0);
  });
});

