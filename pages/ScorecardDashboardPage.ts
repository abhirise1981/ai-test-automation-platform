import { Page, Locator, expect } from '@playwright/test';

export class ScorecardDashboardPage {
  readonly page: Page;
  readonly datePickerInput: Locator;
  readonly categoryFilterDropdown: Locator;
  readonly totalSalesMetricCard: Locator;
  readonly mtdSalesMetricCard: Locator;
  readonly prevYearSalesMetricCard: Locator;
  readonly applyFiltersButton: Locator;
  readonly loadingSpinner: Locator;

  constructor(page: Page) {
    this.page = page;
    // Locators for the Dashboard UI
    this.datePickerInput = page.locator('#dashboard-date-picker');
    this.categoryFilterDropdown = page.locator('#category-filter-select');
    this.applyFiltersButton = page.getByRole('button', { name: 'Apply Filters' });
    this.totalSalesMetricCard = page.locator('[data-testid="metric-total-sales"] .value');
    this.mtdSalesMetricCard = page.locator('[data-testid="metric-mtd-sales"] .value');
    this.prevYearSalesMetricCard = page.locator('[data-testid="metric-prev-year-sales"] .value');
    this.loadingSpinner = page.locator('.spinner');
  }

  /**
   * Navigates to the Scorecard Analytics Dashboard.
   */
  async navigate() {
    await this.page.goto('/analytics/scorecard');
  }

  /**
   * The T-1 Data Strategy: Calculates yesterday's date and inputs it into the Date Picker.
   */
  async selectTMinus1Date() {
    // Calculate T-1 (Yesterday)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Format to YYYY-MM-DD
    const formattedDate = yesterday.toISOString().split('T')[0];
    
    // Interact with UI
    await this.datePickerInput.fill(formattedDate);
  }

  /**
   * Filters the dashboard by a specific retail category (e.g., 'Proprietary Beverages').
   */
  async filterByCategory(category: string) {
    await this.categoryFilterDropdown.selectOption({ label: category });
    await this.applyFiltersButton.click();
    
    // Wait for the backend S3 data to load into the UI
    await this.loadingSpinner.waitFor({ state: 'hidden' });
  }

  /**
   * Extracts the calculated math from the UI card for Daily Sales assertion.
   */
  async getActualTotalSales(): Promise<number> {
    const rawText = await this.totalSalesMetricCard.textContent();
    if (!rawText) throw new Error('Total sales metric is completely empty in the UI!');
    return parseFloat(rawText.replace('$', '').replace(/,/g, ''));
  }

  /**
   * Extracts the calculated Month-To-Date (MTD) math from the UI card.
   */
  async getActualMtdSales(): Promise<number> {
    const rawText = await this.mtdSalesMetricCard.textContent();
    if (!rawText) throw new Error('MTD sales metric is completely empty in the UI!');
    return parseFloat(rawText.replace('$', '').replace(/,/g, ''));
  }

  /**
   * Extracts the calculated Previous Year math from the UI card.
   */
  async getActualPrevYearSales(): Promise<number> {
    const rawText = await this.prevYearSalesMetricCard.textContent();
    if (!rawText) throw new Error('Previous Year sales metric is completely empty in the UI!');
    return parseFloat(rawText.replace('$', '').replace(/,/g, ''));
  }
}
