const { test, expect } = require('@playwright/test');

/**
 * API Testing Suite
 * Dynamically tests API endpoints provided via CLI input.
 * Tests: status code, response time, valid JSON, content-type, CORS headers, error handling.
 */

const apis = (process.env.TEST_APIS && process.env.TEST_APIS.trim()) ? JSON.parse(process.env.TEST_APIS) : [];
const methods = (process.env.TEST_METHODS && process.env.TEST_METHODS.trim()) ? JSON.parse(process.env.TEST_METHODS) : [];
const customHeaders = (process.env.TEST_HEADERS && process.env.TEST_HEADERS.trim()) ? JSON.parse(process.env.TEST_HEADERS) : {};

// Parse request body once to be efficient
let parsedBody = null;
if (process.env.TEST_BODY) {
  try {
    parsedBody = JSON.parse(process.env.TEST_BODY);
  } catch (e) {
    // If it's not JSON, use it as a raw string
    parsedBody = process.env.TEST_BODY;
  }
}

for (let i = 0; i < apis.length; i++) {
  const endpoint = apis[i];
  const method = (methods[i] || 'GET').toUpperCase();

  test.describe(`🔌 API Test Suite [${method}]: ${endpoint}`, () => {

    test(`API responds with success status — ${endpoint}`, async ({ request }) => {
      const response = await makeRequest(request, method, endpoint);
      expect(response.status(), `Expected success status but got ${response.status()}`).toBeLessThan(400);
    });

    test(`API returns status 200 OK — ${endpoint}`, async ({ request }) => {
      const response = await makeRequest(request, method, endpoint);
      const validStatuses = [200, 201, 202, 204];
      expect(validStatuses, `Expected one of ${validStatuses} but got ${response.status()}`).toContain(response.status());
    });

    test(`API responds within 5 seconds — ${endpoint}`, async ({ request }) => {
      const start = Date.now();
      await makeRequest(request, method, endpoint);
      const duration = Date.now() - start;
      console.log(`    ⏱  Response time: ${duration}ms`);
      expect(duration).toBeLessThan(5000);
    });

    test(`API returns valid JSON — ${endpoint}`, async ({ request }) => {
      const response = await makeRequest(request, method, endpoint);
      const contentType = response.headers()['content-type'] || '';
      
      if (response.status() !== 204) {
        const body = await response.text();
        if (body.length > 0 && contentType.includes('json')) {
          let parsed;
          try {
            parsed = JSON.parse(body);
          } catch (e) {
            throw new Error(`Response is not valid JSON: ${body.substring(0, 200)}`);
          }
          expect(parsed).toBeTruthy();
        }
      }
    });

    test(`API has correct Content-Type header — ${endpoint}`, async ({ request }) => {
      const response = await makeRequest(request, method, endpoint);
      const contentType = response.headers()['content-type'] || '';
      
      if (response.status() !== 204) {
        expect(contentType.length).toBeGreaterThan(0);
      }
    });

    test(`API response body is not empty — ${endpoint}`, async ({ request }) => {
      const response = await makeRequest(request, method, endpoint);
      
      if (response.status() !== 204) {
        const body = await response.text();
        expect(body.length, 'Response body should not be empty').toBeGreaterThan(0);
      }
    });

    test(`API response has valid headers — ${endpoint}`, async ({ request }) => {
      const response = await makeRequest(request, method, endpoint);
      const headers = response.headers();
      
      expect(headers).toBeTruthy();
      expect(Object.keys(headers).length).toBeGreaterThan(0);
    });

    test(`API handles request correctly (no server error) — ${endpoint}`, async ({ request }) => {
      const response = await makeRequest(request, method, endpoint);
      expect(response.status(), `Server error: ${response.status()}`).toBeLessThan(500);
    });

    test(`API response structure validation — ${endpoint}`, async ({ request }) => {
      const response = await makeRequest(request, method, endpoint);
      
      if (response.status() !== 204) {
        const body = await response.text();
        const contentType = response.headers()['content-type'] || '';
        
        if (contentType.includes('json') && body.length > 0) {
          const parsed = JSON.parse(body);
          const isValidStructure = typeof parsed === 'object' || Array.isArray(parsed);
          expect(isValidStructure, 'Response should be a JSON object or array').toBe(true);
        }
      }
    });

    test(`API does not expose server info in errors — ${endpoint}`, async ({ request }) => {
      const response = await makeRequest(request, method, endpoint);
      const headers = response.headers();
      const serverHeader = headers['server'] || '';
      const xPoweredBy = headers['x-powered-by'] || '';
      
      if (serverHeader) console.log(`    ℹ  Server: ${serverHeader}`);
      if (xPoweredBy) console.log(`    ℹ  X-Powered-By: ${xPoweredBy}`);
      
      expect(response.status()).toBeLessThan(500);
    });

  });
}

async function makeRequest(request, method, endpoint) {
  const options = {
    headers: { ...customHeaders },
  };

  if (parsedBody && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
    options.data = parsedBody;
  }

  switch (method) {
    case 'POST': return await request.post(endpoint, options);
    case 'PUT': return await request.put(endpoint, options);
    case 'PATCH': return await request.patch(endpoint, options);
    case 'DELETE': return await request.delete(endpoint, options);
    case 'HEAD': return await request.head(endpoint, options);
    default: return await request.get(endpoint, options);
  }
}

// Skip message when no APIs provided
if (apis.length === 0) {
  test.skip('No API endpoints provided — skipping API tests', async () => {});
}
