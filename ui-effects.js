// ======================= ВИЗУАЛЬНЫЕ ЭФФЕКТЫ =======================

// ---------- Всплывающий текст при клике ----------
function showFloatingText(x, y, text, clickButton) {
    if (x === undefined || y === undefined) {
        const rect = clickButton.getBoundingClientRect();
        x = rect.left + rect.width / 2;
        y = rect.top - 10;
    }
    const el = document.createElement('div');
    el.className = 'floating-text';
    el.textContent = text;
    const offsetX = (Math.random() - 0.5) * 60;
    const offsetY = (Math.random() - 0.5) * 30;
    el.style.left = (x + offsetX) + 'px';
    el.style.top = (y + offsetY) + 'px';
    document.body.appendChild(el);
    setTimeout(() => { if (el.parentNode) el.parentNode.removeChild(el); }, 1200);
}

// ---------- Искорка при клике по иконке ----------
function showIconSparkle(x, y) {
    const sparkles = ['✨', '💫', '⭐', '🌟'];
    const symbol = sparkles[Math.floor(Math.random() * sparkles.length)];
    const el = document.createElement('div');
    el.className = 'icon-sparkle';
    el.textContent = symbol;
    const offsetX = (Math.random() - 0.5) * 30;
    el.style.left = (x + offsetX) + 'px';
    el.style.top = (y - 6) + 'px';
    document.body.appendChild(el);
    setTimeout(() => { if (el.parentNode) el.parentNode.removeChild(el); }, 700);
}

// ---------- Частицы при клике по фону ----------
function spawnBackgroundParticles(x, y) {
    const colors = ['#ff9800', '#2196f3', '#4caf50', '#9b59b6', '#d9534f', '#ffc107', '#8B4513'];
    const count = 8 + Math.floor(Math.random() * 4);
    for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.6;
        const distance = 24 + Math.random() * 36;
        const dx = Math.cos(angle) * distance;
        const dy = Math.sin(angle) * distance;
        const rot = (Math.random() - 0.5) * 360;
        const size = 5 + Math.random() * 4;
        const particle = document.createElement('div');
        particle.className = 'bg-particle';
        particle.style.left = x + 'px';
        particle.style.top = y + 'px';
        particle.style.width = size + 'px';
        particle.style.height = size + 'px';
        particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        particle.style.setProperty('--dx', dx + 'px');
        particle.style.setProperty('--dy', dy + 'px');
        particle.style.setProperty('--rot', rot + 'deg');
        document.body.appendChild(particle);
        setTimeout(() => { if (particle.parentNode) particle.parentNode.removeChild(particle); }, 600);
    }
}

// ---------- Страницы из портфеля ----------
function spawnBriefcasePapers(x, y) {
    const paperEmoji = '📄';
    const count = 6 + Math.floor(Math.random() * 3);
    for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.6;
        const distance = 45 + Math.random() * 45;
        const dx = Math.cos(angle) * distance;
        const dy = Math.sin(angle) * distance - 15;
        const rot = (Math.random() - 0.5) * 360;
        const el = document.createElement('div');
        el.className = 'briefcase-paper';
        el.textContent = paperEmoji;
        el.style.left = x + 'px';
        el.style.top = y + 'px';
        el.style.setProperty('--dx', dx + 'px');
        el.style.setProperty('--dy', dy + 'px');
        el.style.setProperty('--rot', rot + 'deg');
        document.body.appendChild(el);
        setTimeout(() => { if (el.parentNode) el.parentNode.removeChild(el); }, 950);
    }
}

// ---------- Тултип для улучшений мастерства ----------
let tooltipElement = null;

function createTooltip() {
    if (tooltipElement) return tooltipElement;
    const tooltip = document.createElement('div');
    tooltip.id = 'upgradeTooltip';
    tooltip.innerHTML = `
        <div class="tooltip-name"></div>
        <div class="tooltip-desc"></div>
        <div class="tooltip-price"></div>
        <div class="tooltip-status"></div>
    `;
    document.body.appendChild(tooltip);
    tooltipElement = tooltip;
    return tooltip;
}

function showTooltip(e, upgrade, game) {
    const t = tooltipElement || createTooltip();
    if (!upgrade || !upgrade.revealed) {
        t.style.display = 'none';
        return;
    }
    const nameEl = t.querySelector('.tooltip-name');
    const descEl = t.querySelector('.tooltip-desc');
    const priceEl = t.querySelector('.tooltip-price');
    const statusEl = t.querySelector('.tooltip-status');

    nameEl.textContent = upgrade.icon + ' ' + upgrade.name;

    let description = upgrade.description;
    if (upgrade.id === 'emergence' && upgrade.purchased) {
        const bonusPercent = ((game.emergenceMultiplier - 1) * 100).toFixed(0);
        description = upgrade.description + '<br>+' + bonusPercent + '%';
    }
    if (upgrade.id === 'emergence2' && upgrade.purchased) {
        const bonusPercent = ((game.emergence2Multiplier - 1) * 100).toFixed(0);
        description = upgrade.description + '<br>+' + bonusPercent + '%';
    }
    if (upgrade.id === 'coach' && upgrade.purchased) {
        const bonusPercent = ((game.coachMultiplier - 1) * 100).toFixed(0);
        description = upgrade.description + '<br>+' + bonusPercent + '%';
    }
    descEl.innerHTML = description;

    if (upgrade.purchased) {
        priceEl.textContent = '✅ Куплено';
        statusEl.textContent = '';
    } else {
        priceEl.textContent = `Цена: ${formatNumber(upgrade.price)}`;
        statusEl.textContent = `Нажмите для покупки`;
    }
    t.style.display = 'block';
    updateTooltipPosition(e.clientX, e.clientY);
}

function moveTooltip(e) {
    const t = tooltipElement;
    if (t && t.style.display === 'block') {
        updateTooltipPosition(e.clientX, e.clientY);
    }
}

function hideTooltip() {
    const t = tooltipElement;
    if (t) t.style.display = 'none';
}

function updateTooltipPosition(x, y) {
    const t = tooltipElement;
    if (!t) return;
    let left = x + 16;
    let top = y - 10;
    const rect = t.getBoundingClientRect();
    const winW = window.innerWidth;
    const winH = window.innerHeight;
    if (left + rect.width > winW - 10) {
        left = x - rect.width - 16;
    }
    if (top + rect.height > winH - 10) {
        top = winH - rect.height - 10;
    }
    if (top < 10) top = 10;
    t.style.left = left + 'px';
    t.style.top = top + 'px';
}