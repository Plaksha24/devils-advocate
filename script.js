async function analyze() {
  const idea = document.getElementById('ideaInput').value.trim();
  if (!idea) return;

  const btn = document.getElementById('analyzeBtn');
  const loading = document.getElementById('loading');
  const results = document.getElementById('results');
  const errorBox = document.getElementById('errorBox');

  btn.disabled = true;
  loading.classList.add('visible');
  results.classList.remove('visible');
  results.innerHTML = '';
  errorBox.classList.remove('visible');

  try {
    const response = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idea })
    });

    if (!response.ok) throw new Error(`Server error: ${response.status}`);

    const parsed = await response.json();
    if (parsed.error) throw new Error(parsed.error);

    renderResults(parsed);
    results.classList.add('visible');
    results.scrollIntoView({ behavior: 'smooth', block: 'start' });

  } catch (err) {
    errorBox.textContent = err.message || "Something went wrong. Please try again.";
    errorBox.classList.add('visible');
  } finally {
    btn.disabled = false;
    loading.classList.remove('visible');
  }
}

function renderResults(d) {
  const results = document.getElementById('results');
  results.innerHTML = `
    <div class="result-header">
      <h3>The Case Against You</h3>
      <span class="badge badge-red">Devil's Advocate</span>
    </div>

    <div class="cards">
      <div class="card counter">
        <span class="card-icon">⚔️</span>
        <h4>Counterarguments</h4>
        <ul>${d.counterarguments.map(x => `<li>${x}</li>`).join('')}</ul>
      </div>
      <div class="card risk">
        <span class="card-icon">⚠️</span>
        <h4>Real-World Risks</h4>
        <ul>${d.risks.map(x => `<li>${x}</li>`).join('')}</ul>
      </div>
      <div class="card ethics">
        <span class="card-icon">⚖️</span>
        <h4>Ethical Concerns</h4>
        <ul>${d.ethical_concerns.map(x => `<li>${x}</li>`).join('')}</ul>
      </div>
      <div class="card alt">
        <span class="card-icon">🔭</span>
        <h4>Alternative Perspectives</h4>
        <ul>${d.alternative_perspectives.map(x => `<li>${x}</li>`).join('')}</ul>
      </div>
      <div class="card danger full" style="background:#130a0a; border-top: 1px solid rgba(192,57,43,0.25);">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:14px;">
          <span class="card-icon" style="margin-bottom:0;font-size:1.9rem">🔥</span>
          <h4 style="margin-bottom:0;color:#e07060;">Most Dangerous Assumption</h4>
          <span class="badge badge-red" style="font-size:0.6rem;">Kill Shot</span>
        </div>
        <p class="body-text" style="font-size:1.05rem;color:#e8c0b0;font-weight:400;line-height:1.6;">${d.most_dangerous_assumption}</p>
      </div>
      <div class="card summary full">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:14px;">
          <span class="card-icon" style="margin-bottom:0">🎯</span>
          <h4 style="margin-bottom:0">Balanced Take</h4>
          <span class="badge badge-gold">Summary</span>
        </div>
        <p class="body-text">${d.balanced_summary}</p>
      </div>
    </div>

    <div style="margin-top:28px;display:flex;align-items:center;justify-content:center;gap:12px;flex-wrap:wrap;">
      <button class="cta" id="copyBtn" onclick="copyResults()" style="background:transparent;color:var(--text);border:1px solid var(--border);">📋 Copy Results</button>
      <button class="cta" id="shareBtn" onclick="shareResults()" style="background:transparent;color:var(--text);border:1px solid var(--border);">🔗 Share</button>
      <button class="cta" onclick="resetForm()" style="background:transparent;color:var(--muted);border:1px solid var(--border);">Try Another</button>
    </div>
  `;
}

document.getElementById('ideaInput').addEventListener('keydown', e => {
  if (e.key === 'Enter' && e.metaKey) analyze();
});

function resetForm() {
  document.getElementById('results').classList.remove('visible');
  document.getElementById('ideaInput').value = '';
  document.getElementById('ideaInput').focus();
  window.scrollTo({ top: document.getElementById('analyze').offsetTop - 80, behavior: 'smooth' });
}

function getResultsText() {
  const idea = document.getElementById('ideaInput').value.trim();
  const cards = document.querySelectorAll('#results .card');
  let text = `Devil's Advocate Analysis\n${'='.repeat(40)}\nIdea: ${idea}\n\n`;
  cards.forEach(card => {
    const title = card.querySelector('h4')?.textContent?.trim();
    if (!title) return;
    text += `${title}\n${'-'.repeat(title.length)}\n`;
    const items = card.querySelectorAll('li');
    if (items.length) {
      items.forEach(li => { text += `• ${li.textContent.trim()}\n`; });
    } else {
      const body = card.querySelector('.body-text')?.textContent?.trim();
      if (body) text += `${body}\n`;
    }
    text += '\n';
  });
  text += "\nGenerated by Devil's Advocate AI";
  return text;
}

async function copyResults() {
  const btn = document.getElementById('copyBtn');
  try {
    await navigator.clipboard.writeText(getResultsText());
    btn.textContent = '✅ Copied!';
    setTimeout(() => { btn.innerHTML = '📋 Copy Results'; }, 2000);
  } catch {
    btn.textContent = '❌ Try manually';
    setTimeout(() => { btn.innerHTML = '📋 Copy Results'; }, 2000);
  }
}

async function shareResults() {
  const btn = document.getElementById('shareBtn');
  const idea = document.getElementById('ideaInput').value.trim();
  const shareData = {
    title: "Devil's Advocate Analysis",
    text: `I stress-tested my idea: "${idea.slice(0,80)}${idea.length>80?'…':''}"\n\n${getResultsText()}`,
    url: window.location.href
  };
  if (navigator.share) {
    try { await navigator.share(shareData); } catch {}
  } else {
    await navigator.clipboard.writeText(shareData.text + '\n' + shareData.url);
    btn.textContent = '✅ Link Copied!';
    setTimeout(() => { btn.innerHTML = '🔗 Share'; }, 2000);
  }
}