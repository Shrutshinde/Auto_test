#!/usr/bin/env node

const { Command } = require('commander');
const { execSync } = require('child_process');
const chalk = require('chalk');
const fs = require('fs');
const path = require('path');

const program = new Command();

program
  .name('autotest')
  .description(chalk.cyan('🚀 AutoTest — Automated Testing Framework powered by Playwright'))
  .version('1.0.0');

program
  .option('-u, --url <urls...>', 'One or more URLs to test (space-separated)')
  .option('-a, --api <endpoints...>', 'One or more API endpoints to test (space-separated)')
  .option('-m, --methods <methods...>', 'HTTP methods for API tests (default: GET). Provide one per API endpoint.')
  .option('-b, --body <json>', 'JSON request body for POST/PUT API tests')
  .option('-H, --headers <json>', 'Custom headers as JSON string')
  .option('--headed', 'Run tests in headed (visible) browser mode')
  .action(async (options) => {
    console.log('');
    console.log(chalk.cyan.bold('╔══════════════════════════════════════════════════╗'));
    console.log(chalk.cyan.bold('║') + chalk.white.bold('   🧪 AutoTest — Playwright Testing Framework    ') + chalk.cyan.bold('║'));
    console.log(chalk.cyan.bold('╚══════════════════════════════════════════════════╝'));
    console.log('');

    if (!options.url && !options.api) {
      console.log(chalk.yellow('⚠  No inputs provided. Please specify at least one --url or --api.'));
      console.log('');
      console.log(chalk.gray('Usage Examples:'));
      console.log(chalk.green('  node src/cli.js --url https://example.com'));
      console.log(chalk.green('  node src/cli.js --api https://jsonplaceholder.typicode.com/todos/1'));
      console.log(chalk.green('  node src/cli.js --api https://jsonplaceholder.typicode.com/posts --methods POST --body "{\\\"title\\\":\\\"foo\\\"}"'));
      console.log(chalk.gray('  (Note: On Windows, use backslashes to escape quotes inside the body)'));
      console.log('');
      process.exit(1);
    }

    // Build environment variables to pass to Playwright
    const env = { ...process.env };

    if (options.url) {
      env.TEST_URLS = JSON.stringify(options.url);
      console.log(chalk.white('  📌 URLs to test:'));
      options.url.forEach(u => console.log(chalk.green(`     → ${u}`)));
    }

    if (options.api) {
      env.TEST_APIS = JSON.stringify(options.api);
      console.log(chalk.white('  📌 API Endpoints to test:'));
      options.api.forEach(a => console.log(chalk.green(`     → ${a}`)));
    }

    if (options.methods) {
      env.TEST_METHODS = JSON.stringify(options.methods);
    }

    if (options.body) {
      env.TEST_BODY = options.body;
    }

    if (options.headers) {
      env.TEST_HEADERS = options.headers;
    }

    console.log('');
    console.log(chalk.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
    console.log(chalk.white.bold('  🔄 Running tests...'));
    console.log(chalk.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
    console.log('');

    try {
      const headedFlag = options.headed ? ' --headed' : '';
      execSync(`npx playwright test${headedFlag}`, {
        env,
        stdio: 'inherit',
        cwd: path.resolve(__dirname, '..'),
      });
    } catch (err) {
      // Playwright exits with non-zero if tests fail — that's expected
    }

    // Generate summary report
    generateSummary();
  });

function generateSummary() {
  const resultsPath = path.resolve(__dirname, '..', 'test-results', 'results.json');

  if (!fs.existsSync(resultsPath)) {
    console.log(chalk.yellow('\n⚠  No results file found. Skipping summary.\n'));
    return;
  }

  try {
    const raw = fs.readFileSync(resultsPath, 'utf-8');
    const data = JSON.parse(raw);

    let total = 0;
    let passed = 0;
    let failed = 0;
    let skipped = 0;
    let flaky = 0;
    const failures = [];

    // Walk suites recursively
    function walkSuites(suites) {
      for (const suite of suites) {
        if (suite.specs) {
          for (const spec of suite.specs) {
            for (const test of spec.tests) {
              total++;
              const status = test.status;
              if (status === 'expected') passed++;
              else if (status === 'unexpected') {
                failed++;
                failures.push({
                  title: spec.title,
                  file: spec.file,
                  error: test.results?.[0]?.error?.message || 'Unknown error',
                });
              }
              else if (status === 'skipped') skipped++;
              else if (status === 'flaky') { flaky++; passed++; }
            }
          }
        }
        if (suite.suites) walkSuites(suite.suites);
      }
    }

    if (data.suites) walkSuites(data.suites);

    const accuracy = total > 0 ? ((passed / total) * 100).toFixed(1) : '0.0';

    console.log('');
    console.log(chalk.cyan.bold('╔══════════════════════════════════════════════════╗'));
    console.log(chalk.cyan.bold('║') + chalk.white.bold('          📊 TEST RESULTS SUMMARY                ') + chalk.cyan.bold('║'));
    console.log(chalk.cyan.bold('╠══════════════════════════════════════════════════╣'));
    console.log(chalk.cyan.bold('║') + `  Total Tests:    ${chalk.white.bold(String(total).padStart(5))}                        ` + chalk.cyan.bold('║'));
    console.log(chalk.cyan.bold('║') + `  ${chalk.green('✅ Passed:')}       ${chalk.green.bold(String(passed).padStart(5))}                        ` + chalk.cyan.bold('║'));
    console.log(chalk.cyan.bold('║') + `  ${chalk.red('❌ Failed:')}       ${chalk.red.bold(String(failed).padStart(5))}                        ` + chalk.cyan.bold('║'));
    console.log(chalk.cyan.bold('║') + `  ${chalk.yellow('⏭  Skipped:')}      ${chalk.yellow.bold(String(skipped).padStart(5))}                        ` + chalk.cyan.bold('║'));
    console.log(chalk.cyan.bold('║') + `  ${chalk.magenta('🔄 Flaky:')}        ${chalk.magenta.bold(String(flaky).padStart(5))}                        ` + chalk.cyan.bold('║'));
    console.log(chalk.cyan.bold('║') + `                                                  ` + chalk.cyan.bold('║'));
    
    const accColor = accuracy >= 80 ? chalk.green : accuracy >= 50 ? chalk.yellow : chalk.red;
    console.log(chalk.cyan.bold('║') + `  🎯 Accuracy:   ${accColor.bold(accuracy + '%')}                          ` + chalk.cyan.bold('║'));
    console.log(chalk.cyan.bold('╚══════════════════════════════════════════════════╝'));

    if (failures.length > 0) {
      console.log('');
      console.log(chalk.red.bold('  ❌ FAILED TESTS:'));
      console.log(chalk.red('  ─────────────────────────────────────────────'));
      failures.forEach((f, i) => {
        console.log(chalk.red(`  ${i + 1}. ${f.title}`));
        console.log(chalk.gray(`     File: ${f.file}`));
        console.log(chalk.gray(`     Error: ${f.error.substring(0, 200)}`));
        console.log('');
      });
    }

    console.log(chalk.cyan('\n  📄 Full HTML Report: ') + chalk.underline('playwright-report/index.html'));
    console.log(chalk.gray('     Run ') + chalk.green('npm run report') + chalk.gray(' to open it in your browser.\n'));
  } catch (e) {
    console.log(chalk.yellow(`\n⚠  Could not parse results: ${e.message}\n`));
  }
}

program.parse(process.argv);
