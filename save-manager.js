// ======================= МЕНЕДЖЕР СОХРАНЕНИЙ =======================

// ---------- Получение данных для сохранения ----------
function getSaveData(game) {
    const buildingsData = {};
    for (const [id, b] of game.buildings) {
        buildingsData[id] = { level: b.level, upgradeLevel: b.upgradeLevel };
    }

    const upgradesData = game.upgrades.map(u => ({
        id: u.id,
        purchased: u.purchased,
        revealed: u.revealed
    }));

    return {
        version: SAVE_VERSION,
        savedAt: Date.now(),
        count: game.count,
        stress: game.stress,
        experience: game.experience,
        careerLevel: game.careerLevel,
        prestigePoints: game.prestigePoints,
        prestigeUnlocked: game.prestigeUnlocked,
        coffeeCost: game.coffeeCost,
        buyAmount: game.buyAmount,
        hasReached100Stress: game.hasReached100Stress,
        stressHundredLockUsed: game.stressHundredLockUsed,
        upgradeMultiplier: game.upgradeMultiplier,

        // Новые долговременные механики
        coffeeStreak: game.coffeeStreak,
        coffeeLoverAchievementUnlocked: game.coffeeLoverAchievementUnlocked,
        peace: game.peace,
        lastActionTime: game.lastActionTime,
        yogaLevel: game.yogaLevel,
        yogaUpgradeLevel: game.yogaUpgradeLevel,
        experienceAfterMax: game.experienceAfterMax,
        experienceAfterMaxThreshold: game.experienceAfterMaxThreshold,
        globalIncomeMultiplier: game.globalIncomeMultiplier,
        prestigeUpgradesPurchased: { ...game.prestigeUpgradesPurchased },

        buildings: buildingsData,
        upgrades: upgradesData
    };
}

// ---------- Применение загруженных данных ----------
function applySaveData(game, data) {
    if (!data || typeof data !== 'object') return;

    if (typeof data.count === 'number' && isFinite(data.count)) game.count = data.count;
    if (typeof data.stress === 'number' && isFinite(data.stress)) game.stress = data.stress;
    if (typeof data.experience === 'number' && isFinite(data.experience)) game.experience = data.experience;
    if (typeof data.careerLevel === 'number' && isFinite(data.careerLevel)) game.careerLevel = data.careerLevel;
    if (typeof data.prestigePoints === 'number' && isFinite(data.prestigePoints)) game.prestigePoints = data.prestigePoints;
    if (typeof data.prestigeUnlocked === 'boolean') game.prestigeUnlocked = data.prestigeUnlocked;
    if (typeof data.coffeeCost === 'number' && isFinite(data.coffeeCost)) game.coffeeCost = data.coffeeCost;
    if (typeof data.buyAmount === 'number' && isFinite(data.buyAmount)) game.buyAmount = data.buyAmount;
    if (typeof data.hasReached100Stress === 'boolean') game.hasReached100Stress = data.hasReached100Stress;
    if (typeof data.stressHundredLockUsed === 'boolean') game.stressHundredLockUsed = data.stressHundredLockUsed;
    if (typeof data.upgradeMultiplier === 'number' && isFinite(data.upgradeMultiplier)) game.upgradeMultiplier = data.upgradeMultiplier;

    // Новые поля имеют безопасные значения по умолчанию, поэтому старые сейвы совместимы.
    if (typeof data.coffeeStreak === 'number' && isFinite(data.coffeeStreak)) game.coffeeStreak = Math.max(0, Math.floor(data.coffeeStreak));
    if (typeof data.coffeeLoverAchievementUnlocked === 'boolean') game.coffeeLoverAchievementUnlocked = data.coffeeLoverAchievementUnlocked;
    if (typeof data.peace === 'number' && isFinite(data.peace)) game.peace = Math.max(0, Math.min(100, data.peace));
    if (typeof data.lastActionTime === 'number' && isFinite(data.lastActionTime)) game.lastActionTime = data.lastActionTime;
    if (typeof data.yogaLevel === 'number' && isFinite(data.yogaLevel)) game.yogaLevel = Math.max(0, Math.floor(data.yogaLevel));
    if (typeof data.yogaUpgradeLevel === 'number' && isFinite(data.yogaUpgradeLevel)) game.yogaUpgradeLevel = Math.max(0, Math.floor(data.yogaUpgradeLevel));
    if (typeof data.experienceAfterMax === 'number' && isFinite(data.experienceAfterMax)) game.experienceAfterMax = Math.max(0, data.experienceAfterMax);
    if (typeof data.experienceAfterMaxThreshold === 'number' && isFinite(data.experienceAfterMaxThreshold)) game.experienceAfterMaxThreshold = Math.max(POST_MAX_EXP_BASE, data.experienceAfterMaxThreshold);
    if (typeof data.globalIncomeMultiplier === 'number' && isFinite(data.globalIncomeMultiplier)) game.globalIncomeMultiplier = Math.max(1, data.globalIncomeMultiplier);
    if (data.prestigeUpgradesPurchased && typeof data.prestigeUpgradesPurchased === 'object') {
        game.prestigeUpgradesPurchased = { ...game.prestigeUpgradesPurchased, ...data.prestigeUpgradesPurchased };
    }

    if (data.buildings && typeof data.buildings === 'object') {
        for (const [id, b] of game.buildings) {
            const saved = data.buildings[id];
            if (!saved) continue;
            if (typeof saved.level === 'number' && isFinite(saved.level)) b.level = saved.level;
            if (typeof saved.upgradeLevel === 'number' && isFinite(saved.upgradeLevel)) b.upgradeLevel = saved.upgradeLevel;
        }
    }

    if (Array.isArray(data.upgrades)) {
        for (const savedU of data.upgrades) {
            const u = game.upgrades.find(x => x.id === savedU.id);
            if (!u) continue;
            u.purchased = !!savedU.purchased;
            u.revealed = !!savedU.revealed;
        }
    }
}

// ---------- Сохранение ----------
function saveGame(game) {
    try {
        const data = getSaveData(game);
        localStorage.setItem(SAVE_KEY, JSON.stringify(data));
        return true;
    } catch (e) {
        console.warn('Не удалось сохранить игру:', e);
        return false;
    }
}

// ---------- Загрузка ----------
function loadGame(game) {
    try {
        const raw = localStorage.getItem(SAVE_KEY);
        if (!raw) return false;
        const data = JSON.parse(raw);
        if (!data || typeof data !== 'object') return false;
        applySaveData(game, data);

        // Офлайн-доход
        if (typeof data.savedAt === 'number' && isFinite(data.savedAt)) {
            const elapsedSec = Math.max(0, (Date.now() - data.savedAt) / 1000);
            game.pendingOfflineSeconds = Math.min(elapsedSec, MAX_OFFLINE_SECONDS);
        }
        return true;
    } catch (e) {
        console.warn('Не удалось загрузить сохранение (возможно, оно повреждено):', e);
        return false;
    }
}

// ---------- Удаление сохранения ----------
function deleteSave() {
    try {
        localStorage.removeItem(SAVE_KEY);
        return true;
    } catch (e) {
        console.warn('Не удалось удалить сохранение:', e);
        return false;
    }
}

// ---------- Обновление статуса сохранения ----------
function updateSaveStatus(game, customText) {
    if (!game.dom.saveStatus) return;
    if (customText) {
        game.dom.saveStatus.textContent = customText;
        return;
    }
    const time = new Date().toLocaleTimeString('ru-RU');
    game.dom.saveStatus.textContent = `Автосохранение включено · последнее сохранение: ${time}`;
}

// ---------- Модалка офлайн-дохода ----------
function createOfflineModal(game) {
    const overlay = document.createElement('div');
    overlay.id = 'offlineModalOverlay';
    overlay.className = 'offline-modal-overlay';
    overlay.innerHTML = `
        <div class="offline-modal">
            <div class="offline-modal-icon">💰</div>
            <div class="offline-modal-title">С возвращением!</div>
            <div class="offline-modal-text" id="offlineModalText"></div>
            <button class="offline-modal-btn" id="offlineModalOkBtn">Окей</button>
        </div>
    `;
    document.body.appendChild(overlay);
    game.offlineModal = overlay;

    const okBtn = overlay.querySelector('#offlineModalOkBtn');
    okBtn.addEventListener('click', () => hideOfflineModal(game));
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) hideOfflineModal(game);
    });
}

function showOfflineModal(game, offlineSeconds, earnings) {
    if (!game.offlineModal) return;
    const textEl = game.offlineModal.querySelector('#offlineModalText');
    const durationLabel = formatOfflineDuration(offlineSeconds);
    if (textEl) {
        textEl.innerHTML = `Вас не было ${durationLabel}.<br>Вы заработали <strong>${formatNumber(Math.floor(earnings))}</strong> монет.`;
    }
    game.offlineModal.classList.add('visible');
    playOfflineEarningsSound();
}

function hideOfflineModal(game) {
    if (!game.offlineModal) return;
    game.offlineModal.classList.remove('visible');
}

// ---------- Применение офлайн-заработка ----------
function applyOfflineEarnings(game) {
    if (!game.pendingOfflineSeconds || game.pendingOfflineSeconds < MIN_OFFLINE_SECONDS_TO_NOTIFY) {
        game.pendingOfflineSeconds = 0;
        return;
    }

    game.updateStats();
    const offlineSeconds = game.pendingOfflineSeconds;
    const earnings = game.passiveIncome * offlineSeconds;

    if (earnings > 0) {
        game.count += earnings;
        saveGame(game);
    }
    if (earnings >= 1) {
        showOfflineModal(game, offlineSeconds, earnings);
    }
    game.pendingOfflineSeconds = 0;
}