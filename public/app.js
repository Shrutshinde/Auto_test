// ===== URL ROWS =====
function addUrlRow() {
  const container = document.getElementById('url-inputs');
  const idx = container.children.length;
  const row = document.createElement('div');
  row.className = 'input-row';
  row.dataset.index = idx;
  row.innerHTML = `
    <div class="input-group">
      <label>Website URL</label>
      <input type="url" class="url-input" placeholder="https://example.com" autocomplete="url">
    </div>
    <button class="btn-icon btn-remove" onclick="removeRow(this)" title="Remove" aria-label="Remove URL">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
    </button>
  `;
  container.appendChild(row);
  row.style.animation = 'fadeUp 0.3s ease both';
  row.querySelector('input').focus();
}

// ===== API ROWS =====
function addApiRow() {
  const container = document.getElementById('api-inputs');
  const idx = container.children.length;
  const row = document.createElement('div');
  row.className = 'api-row';
  row.dataset.index = idx;
  row.innerHTML = `
    <div class="api-row-top">
      <div class="input-group input-method">
        <label>Method</label>
        <select class="api-method" onchange="toggleBodyField(this)">
          <option value="GET">GET</option>
          <option value="POST">POST</option>
          <option value="PUT">PUT</option>
          <option value="PATCH">PATCH</option>
          <option value="DELETE">DELETE</option>
        </select>
      </div>
      <div class="input-group input-endpoint">
        <label>API Endpoint</label>
        <input type="url" class="api-endpoint" placeholder="https://api.example.com/data" autocomplete="url">
      </div>
      <button class="btn-icon btn-remove" onclick="removeRow(this)" title="Remove" aria-label="Remove API">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
    <div class="api-body-field hidden">
      <div class="input-group">
        <label>Request Body (JSON)</label>
        <textarea class="api-body" rows="3" placeholder='{"title": "foo", "body": "bar", "userId": 1}'></textarea>
      </div>
    </div>
  `;
  container.appendChild(row);
  row.style.animation = 'fadeUp 0.3s ease both';
  row.querySelector('.api-endpoint').focus();
}

// ===== TOGGLE BODY FIELD =====
function toggleBodyField(selectEl) {
  const row = selectEl.closest('.api-row');
  const bodyField = row.querySelector('.api-body-field');
  const method = selectEl.value;
  if (['POST', 'PUT', 'PATCH'].includes(method)) {
    bodyField.classList.remove('hidden');
  } else {
    bodyField.classList.add('hidden');
  }
}

// ===== REMOVE ROW =====
function removeRow(btn) {
  const row = btn.closest('.input-row, .api-row');
  const container = row.parentElement;
  if (container.children.length <= 1) return; // Keep at least one
  row.style.animation = 'fadeOut 0.2s ease forwards';
  setTimeout(() => row.remove(), 200);
}

// ===== COLLECT INPUTS =====
function collectInputs() {
  const urls = [];
  document.querySelectorAll('.url-input').forEach(input => {
    const val = input.value.trim();
    if (val) urls.push(val);
  });

  const apis = [];
  document.querySelectorAll('.api-row').forEach(row => {
    const endpoint = row.querySelector('.api-endpoint').value.trim();
    if (!endpoint) return;
    const method = row.querySelector('.api-method').value;
    const bodyEl = row.querySelector('.api-body');
    const body = bodyEl ? bodyEl.value.trim() : '';
    apis.push({ endpoint, method, body: body || undefined });
  });

  return { urls, apis };
}

// ===== RUN TESTS =====
async function runTests() {
  const { urls, apis } = collectInputs();

  if (urls.length === 0 && apis.length === 0) {
    shakeButton();
    return;
  }

  const btn = document.getElementById('run-btn');
  const termSection = document.getElementById('terminal-section');
  const termContent = document.getElementById('terminal-content');
  const cursor = document.getElementById('cursor');
  const resultsSection = document.getElementById('results-section');

  // Reset UI
  btn.classList.add('running');
  btn.querySelector('.btn-run-icon').textContent = '⟳';
  btn.querySelector('.btn-run-text').textContent = 'Running Tests...';
  termSection.classList.remove('hidden');
  resultsSection.classList.add('hidden');
  termContent.innerHTML = '';
  cursor.style.display = 'inline-block';

  // Update header badge
  const badge = document.querySelector('.header-badge');
  badge.innerHTML = '<span class="status-dot" style="background:var(--yellow);"></span>Running...';
  badge.style.color = 'var(--yellow)';
  badge.style.background = 'rgba(234, 179, 8, 0.1)';
  badge.style.borderColor = 'rgba(234, 179, 8, 0.2)';

  termSection.scrollIntoView({ behavior: 'smooth', block: 'start' });

  try {
    const response = await fetch('/api/run-tests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ urls, apis }),
    });

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop(); // Keep incomplete line

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
            if (data.type === 'log' || data.type === 'error') {
              appendTerminal(termContent, data.message, data.type);
            }
            if (data.type === 'done') {
              onTestsDone(data.code);
            }
          } catch (e) { /* skip malformed */ }
        }
      }
    }
  } catch (err) {
    appendTerminal(termContent, `\nConnection error: ${err.message}\n`, 'error');
    onTestsDone(1);
  }
}

// ===== APPEND TO TERMINAL =====
function appendTerminal(container, text, type) {
  const lines = text.split('\n');
  for (const line of lines) {
    if (!line) continue;
    const span = document.createElement('div');
    span.textContent = line;

    // Color code
    if (line.includes('ok') || line.includes('passed') || line.includes('✅') || line.includes('Passed')) {
      span.className = 'line-ok';
    } else if (line.includes('fail') || line.includes('❌') || line.includes('Error') || type === 'error') {
      span.className = 'line-err';
    } else if (line.includes('skip') || line.includes('⏭') || line.includes('-  ')) {
      span.className = 'line-skip';
    } else if (line.includes('━') || line.includes('╔') || line.includes('║') || line.includes('╚') || line.includes('🔄') || line.includes('📊')) {
      span.className = 'line-info';
    }

    container.appendChild(span);
  }

  // Auto-scroll
  const terminal = document.getElementById('terminal');
  terminal.scrollTop = terminal.scrollHeight;
}

// ===== ON TESTS DONE =====
function onTestsDone(code) {
  const btn = document.getElementById('run-btn');
  btn.classList.remove('running');
  btn.querySelector('.btn-run-icon').textContent = '▶';
  btn.querySelector('.btn-run-text').textContent = 'Run All Tests';

  document.getElementById('cursor').style.display = 'none';

  // Update header badge
  const badge = document.querySelector('.header-badge');
  badge.innerHTML = '<span class="status-dot"></span>Ready';
  badge.style.color = 'var(--green)';
  badge.style.background = 'var(--green-glow)';
  badge.style.borderColor = 'rgba(34, 197, 94, 0.2)';

  // Parse results from terminal output
  parseAndShowResults();
}

// ===== PARSE RESULTS =====
function parseAndShowResults() {
  const termText = document.getElementById('terminal-content').textContent;

  // Extract counts from terminal output
  const passedMatch = termText.match(/(\d+)\s+passed/);
  const failedMatch = termText.match(/(\d+)\s+failed/);
  const skippedMatch = termText.match(/(\d+)\s+skipped/);

  const passed = passedMatch ? parseInt(passedMatch[1]) : 0;
  const failed = failedMatch ? parseInt(failedMatch[1]) : 0;
  const skipped = skippedMatch ? parseInt(skippedMatch[1]) : 0;
  const total = passed + failed + skipped;
  const accuracy = total > 0 ? ((passed / total) * 100).toFixed(1) : '0.0';

  // Show results section
  const section = document.getElementById('results-section');
  section.classList.remove('hidden');

  // Animate the numbers
  animateValue('res-total', total);
  animateValue('res-passed', passed);
  animateValue('res-failed', failed);
  document.getElementById('res-accuracy').textContent = accuracy + '%';

  section.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// ===== ANIMATE VALUE =====
function animateValue(id, target) {
  const el = document.getElementById(id);
  let current = 0;
  const duration = 600;
  const step = Math.max(1, Math.floor(target / (duration / 30)));
  const interval = setInterval(() => {
    current += step;
    if (current >= target) {
      current = target;
      clearInterval(interval);
    }
    el.textContent = current;
  }, 30);
}

// ===== CLEAR TERMINAL =====
function clearTerminal() {
  document.getElementById('terminal-content').innerHTML = '';
  document.getElementById('results-section').classList.add('hidden');
}

// ===== SHAKE BUTTON =====
function shakeButton() {
  const btn = document.getElementById('run-btn');
  btn.style.animation = 'shake 0.4s ease';
  setTimeout(() => btn.style.animation = '', 400);
}

// Add shake keyframe dynamically
const style = document.createElement('style');
style.textContent = `
  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    20% { transform: translateX(-8px); }
    40% { transform: translateX(8px); }
    60% { transform: translateX(-6px); }
    80% { transform: translateX(6px); }
  }
  @keyframes fadeOut {
    to { opacity: 0; transform: translateY(-10px); height: 0; margin: 0; padding: 0; overflow: hidden; }
  }
`;
document.head.appendChild(style);
