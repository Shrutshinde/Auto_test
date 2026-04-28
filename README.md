# AutoTest — Automated Testing Framework 🧪

A powerful, automated testing framework powered by **Playwright** that lets you test any **URL** or **API endpoint** dynamically from the command line. It generates detailed **HTML reports** showing pass/fail status, accuracy metrics, and error details.

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
npx playwright install chromium
```

### 2. Run Tests

npm run dashboard -  run the program


**Test a URL:**
```bash
node src/cli.js --url https://example.com
```

**Test an API:**
```bash
node src/cli.js --api https://jsonplaceholder.typicode.com/todos/1
```

**Test multiple URLs and APIs:**
```bash
node src/cli.js --url https://example.com https://google.com --api https://jsonplaceholder.typicode.com/todos/1
```

**Test a POST API with body:**
```bash
node src/cli.js --api https://jsonplaceholder.typicode.com/posts --methods POST --body '{"title":"foo","body":"bar","userId":1}'
```

**Run in headed mode (visible browser):**
```bash
node src/cli.js --url https://example.com --headed
```

---

## 📊 Reports

After tests run, you get:

1. **Console Summary** — Instant pass/fail/accuracy displayed in terminal
2. **HTML Report** — Detailed interactive report with screenshots and traces

Open the HTML report:
```bash
npm run report
```

---

## 🧪 What Gets Tested?

### URL Tests (10 checks per URL)
| # | Test | Description |
|---|------|-------------|
| 1 | Page Load | Verifies the page loads without errors |
| 2 | HTTP Status | Checks for 200 OK response |
| 3 | Title Tag | Ensures page has a `<title>` |
| 4 | Console Errors | Catches critical JavaScript errors |
| 5 | Performance | Page must load within 10 seconds |
| 6 | Body Content | Page must have visible content |
| 7 | Broken Images | Detects images that fail to load |
| 8 | Responsive | Tests mobile viewport (375px) |
| 9 | Meta Description | Checks for SEO meta description |
| 10 | HTTPS | Verifies secure connection |

### API Tests (10 checks per endpoint)
| # | Test | Description |
|---|------|-------------|
| 1 | Success Status | Response status < 400 |
| 2 | Status 200 | Checks for 200/201/202/204 |
| 3 | Response Time | Must respond within 5 seconds |
| 4 | Valid JSON | Response body is valid JSON |
| 5 | Content-Type | Has proper Content-Type header |
| 6 | Non-empty Body | Response body is not empty |
| 7 | Valid Headers | Response has headers |
| 8 | No Server Error | No 5xx status codes |
| 9 | Structure Check | JSON is object or array |
| 10 | Security Headers | Checks server info exposure |

---

## 🛠️ CLI Options

| Option | Description | Example |
|--------|-------------|---------|
| `--url <urls...>` | URLs to test | `--url https://example.com` |
| `--api <endpoints...>` | API endpoints to test | `--api https://api.example.com/data` |
| `--methods <methods...>` | HTTP methods (GET, POST, etc.) | `--methods POST` |
| `--body <json>` | Request body for POST/PUT | `--body '{"key":"value"}'` |
| `--headers <json>` | Custom request headers | `--headers '{"Auth":"Bearer token"}'` |
| `--headed` | Show browser window | `--headed` |

---

## 📁 Project Structure

```
autotest/
├── src/
│   └── cli.js              # CLI entry point
├── tests/
│   ├── url.spec.js          # URL test suite (10 tests per URL)
│   └── api.spec.js          # API test suite (10 tests per API)
├── playwright-report/       # Generated HTML reports
├── test-results/            # JSON test results
├── playwright.config.js     # Playwright configuration
├── package.json
└── README.md
```

---

## 📜 License

MIT
