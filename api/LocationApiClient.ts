import { APIRequestContext, APIResponse } from '@playwright/test';
import { environmentConfig } from '../config/envConfig';
import { testConfig } from '../config/testConfig';

/**
 * LocationApiClient — API Object Model (Service Client Layer)
 *
 * This class is the SINGLE SOURCE for all HTTP calls in the API test suite.
 * Test specs NEVER call request.get() or request.post() directly.
 * They call methods on this client, which keeps test files clean and assertion-focused.
 *
 * All base URLs come from testConfig, which is environment-driven.
 * Switching from QA to PROD requires zero changes in this file.
 */
export class LocationApiClient {
  private readonly request: APIRequestContext;
  private readonly osmBaseUrl: string;
  private readonly jsonplaceholderBaseUrl: string;
  private readonly authTestBaseUrl: string;

  private readonly defaultHeaders: Record<string, string> = {
    'User-Agent': testConfig.api.userAgent,
    'Content-Type': 'application/json'
  };

  constructor(request: APIRequestContext) {
    this.request = request;
    // URLs come from playwright.config.ts (single environment config source)
    this.osmBaseUrl = environmentConfig.geocodingBaseUrl;
    this.jsonplaceholderBaseUrl = environmentConfig.restMockBaseUrl;
    this.authTestBaseUrl = environmentConfig.authTestBaseUrl;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // GEOCODING SERVICE — Nominatim OpenStreetMap
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * GET /search — Retrieve coordinates for a city name
   * @param city — The city to geocode (e.g., 'London', 'Tokyo')
   */
  async searchLocation(city: string): Promise<APIResponse> {
    return await this.request.get(`${this.osmBaseUrl}/search`, {
      headers: this.defaultHeaders,
      params: { q: city, format: 'json', limit: 1 }
    });
  }

  /**
   * GET /invalid_endpoint — Intentionally hit a non-existent path (expects 404)
   */
  async searchInvalidEndpoint(): Promise<APIResponse> {
    return await this.request.get(`${this.osmBaseUrl}/invalid_endpoint_path_for_testing`, {
      headers: this.defaultHeaders
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // AUTHENTICATION — Postman Echo
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * GET /basic-auth — Access a password-protected resource WITHOUT credentials (expects 401)
   */
  async accessProtectedEndpointWithoutAuth(): Promise<APIResponse> {
    return await this.request.get(`${this.authTestBaseUrl}/basic-auth`);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // REST MOCK — JSONPlaceholder CRUD Operations
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * POST /posts — Create a new location resource (expects 201 Created)
   */
  async createLocation(data: object): Promise<APIResponse> {
    return await this.request.post(`${this.jsonplaceholderBaseUrl}/posts`, {
      headers: this.defaultHeaders,
      data
    });
  }

  /**
   * PUT /posts/:id — Update an existing location resource (expects 200 OK)
   */
  async updateLocation(id: number, data: object): Promise<APIResponse> {
    return await this.request.put(`${this.jsonplaceholderBaseUrl}/posts/${id}`, {
      headers: this.defaultHeaders,
      data
    });
  }

  /**
   * DELETE /posts/:id — Delete a location resource (expects 200 OK)
   */
  async deleteLocation(id: number): Promise<APIResponse> {
    return await this.request.delete(`${this.jsonplaceholderBaseUrl}/posts/${id}`, {
      headers: this.defaultHeaders
    });
  }

  /**
   * GET /posts/:id — Retrieve a specific location resource by ID (expects 200 OK)
   */
  async getLocationById(id: number): Promise<APIResponse> {
    return await this.request.get(`${this.jsonplaceholderBaseUrl}/posts/${id}`, {
      headers: this.defaultHeaders
    });
  }

  /**
   * GET /posts — Retrieve all location resources (expects 200 OK)
   */
  async getAllLocations(): Promise<APIResponse> {
    return await this.request.get(`${this.jsonplaceholderBaseUrl}/posts`, {
      headers: this.defaultHeaders
    });
  }

  // --- New Methods Added for Expanded API Tests ---
  
  /**
   * GET /reverse - Reverse Geocoding
   */
  async reverseGeocode(lat: number, lon: number): Promise<APIResponse> {
    return await this.request.get(`${this.osmBaseUrl}/reverse`, {
      headers: this.defaultHeaders,
      params: { lat, lon, format: 'json' }
    });
  }

  /**
   * GET /basic-auth - With Credentials
   */
  async accessProtectedEndpointWithAuth(username: string, password: string): Promise<APIResponse> {
    const encoded = Buffer.from(`${username}:${password}`).toString('base64');
    return await this.request.get(`${this.authTestBaseUrl}/basic-auth`, {
      headers: { ...this.defaultHeaders, 'Authorization': `Basic ${encoded}` }
    });
  }

  /**
   * PATCH /posts/:id - Partial Update
   */
  async patchLocation(id: number, data: object): Promise<APIResponse> {
    return await this.request.patch(`${this.jsonplaceholderBaseUrl}/posts/${id}`, {
      headers: this.defaultHeaders,
      data
    });
  }

  /**
   * GET /posts - With Query Params
   */
  async getLocationsByQuery(params: Record<string, string | number>): Promise<APIResponse> {
    return await this.request.get(`${this.jsonplaceholderBaseUrl}/posts`, {
      headers: this.defaultHeaders,
      params
    });
  }

}
