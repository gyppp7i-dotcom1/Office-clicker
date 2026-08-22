

// ======================= ПЕРЕКЛЮЧЕНИЕ ТЕМЫ =======================
document.addEventListener('DOMContentLoaded', () => {
    (function initEntryOverlay() {
        const overlay = document.getElementById('entryOverlay');
        if (!overlay) return;

        // Если нужно показывать только один раз – раскомментируйте строки с localStorage
        /*
        if (localStorage.getItem('entryShown') === 'true') {
            overlay.style.display = 'none';
            return;
        }
        */

        requestAnimationFrame(() => {
            overlay.classList.add('visible');
        });

        const closeOverlay = () => {
            if (overlay.classList.contains('fade-out')) return;
            overlay.classList.remove('visible');
            overlay.classList.add('fade-out');
            setTimeout(() => {
                overlay.style.display = 'none';
            }, 600);
            // localStorage.setItem('entryShown', 'true');
        };

        overlay.addEventListener('click', closeOverlay);
        overlay.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' || e.key === 'Enter') {
                e.preventDefault();
                closeOverlay();
            }
        });
        overlay.setAttribute('tabindex', '0');
        overlay.focus();
    })();
    const toggleBtn = document.getElementById('themeToggle');
    // Проверяем сохранённую тему
    const savedTheme = localStorage.getItem('theme') || 'light';
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-theme');
        toggleBtn.textContent = '☀️ Светлая';
    } else {
        document.body.classList.remove('dark-theme');
        toggleBtn.textContent = '🌙 Тёмная';
    }

    toggleBtn.addEventListener('click', () => {
        const isDark = document.body.classList.toggle('dark-theme');
        if (isDark) {
            toggleBtn.textContent = '☀️ Светлая';
            localStorage.setItem('theme', 'dark');
        } else {
            toggleBtn.textContent = '🌙 Тёмная';
            localStorage.setItem('theme', 'light');
        }
    });
});
// Внутри класса Game добавьте метод



// ======================= КОНФИГУРАЦИЯ =======================


// ======================= КЛАСС BUILDING =======================


// ======================= КЛАСС GAME =======================
class Game {
    constructor() {
        this.count = 0;
        this.totalEarnedThisPrestige = 0; // +++ НОВОЕ: суммарный доход за текущий цикл престижа +++
        this.stress = 0;
        this.experience = 0;
        this.careerLevel = 0;
        this.prestigePoints = 0;
        this.coffeeCost = 20;

        // Новые механики
        this.coffeeStreak = 0;
        this.coffeeLoverAchievementUnlocked = false;
        this.peace = 0;
        this.lastActionTime = Date.now();
        this.yogaLevel = 0;
        this.yogaUpgradeLevel = 0;
        this.experienceAfterMax = 0;
        this.experienceAfterMaxThreshold = POST_MAX_EXP_BASE;
        this.globalIncomeMultiplier = 1;
        this.prestigeUpgradesPurchased = {};
        this.masteryTab = 'cycle';
        this.coffeePour = 0; // 0 = чашка готова; >0 = сколько секунд ещё наливается
        this.buffLevel = 0;
        this.buffTimer = 0;
        this.debuffActive = false;
        this.debuffTimer = 0;
        this.buyAmount = 1;
        this.cheat = { click: 1, passive: 1, exp: 1 };
        this.lastClickTime = 0;
        this.lastUpdateTime = Date.now();


        this.coachMultiplier = 1;
        this.emergenceMultiplier = 1;
        this.emergence2Multiplier = 1;
        this.hasReached100Stress = false;

        this.stressLocked = false;
        this.stressLockTimer = 0;
        this.stressHundredLockUsed = false;

        this.prestigeUnlocked = false;

        this.upgradeMultiplier = 1;
        this.upgrades = [];
        this.upgradeElements = [];

        this.buildings = new Map();
        this.clickComponents = {};
        this.passiveComponents = {};
        this.clickPower = 1;
        this.passiveIncome = 0;

        this.initBuildings();
        this.initUpgrades();

        // +++ НОВОЕ: сколько секунд игрок отсутствовал (заполняется в loadGame) +++
        this.pendingOfflineSeconds = 0;

        // +++ НОВОЕ: подтягиваем сохранённый прогресс из localStorage, если он есть +++
        this.loadedFromSave = loadGame(this);

        // Совместимость со старыми сейвами.
        if (!this.lastActionTime || !isFinite(this.lastActionTime)) this.lastActionTime = Date.now();
        if (this.careerLevel >= CAREERS.length - 1 && this.experience > 0) {
            this.experienceAfterMax += this.experience;
            this.experience = 0;
        }

        this.installBuildingMultiplierOverrides();

        this.cacheDOM();
        this.bindEvents();

        this.createUpgradeElements();


        // +++ НОВОЕ: сразу показываем статус сохранения +++
        if (this.dom.saveStatus) {
            this.dom.saveStatus.textContent = this.loadedFromSave
                ? '✅ Загружено сохранение'
                : '🆕 Новая игра — автосохранение включено';
        }
    }

    initBuildings() {
        for (const [id, config] of Object.entries(BUILDINGS)) {
            this.buildings.set(id, new Building(id, config));
        }
    }

    initUpgrades() {
        const upgradeDefs = [
            { id: 'stressResist1', name: 'Стрессоустойчивость I', icon: '🛡️', description: 'Уменьшает накопление стресса на 30%', price: 5000, multiplier: 1, unlockCondition: g => g.hasReached100Stress === true, effectText: () => '−30% к накоплению стресса' },
            { id: 'coach', name: 'ИИ-коуч', icon: '֍', description: '+5% к эффективности курсов за каждые 10 лвл AI-ассистентов <br> +5% за каждые 5 AI-ЭВМ', price: 2e9, multiplier: 1, unlockCondition: g => g.careerLevel >= 5, effectText: g => `+${(Math.round((g.coachMultiplier - 1) * 1000) / 10)}% опыта за клик` },
            { id: 'emergence', name: 'Эмерджентность', icon: 'η', description: 'Добавляет 1% к доходу за каждые 35 лвл (кроме курсов и зала)', price: 1e9, multiplier: 1, unlockCondition: g => g.count >= 200e6, effectText: g => `+${(Math.round((g.emergenceMultiplier - 1) * 1000) / 10)}% дохода` },
            { id: 'emergence2', name: 'Эмерджентность II', icon: 'η²', description: '+1% к доходу за каждое улучшение зданий', price: 10e12, multiplier: 1, unlockCondition: g => g.count >= 500e9, effectText: g => `+${(Math.round((g.emergence2Multiplier - 1) * 1000) / 10)}% дохода` },
            { id: 'eduDiscount', name: 'Скидка на образование', icon: '🎓', description: 'Стоимость курсов и их улучшений в 3333 раза меньше', price: 50e9, multiplier: 1, unlockCondition: g => g.count >= 5e9, effectText: () => 'Курсы и их улучшения дешевле в 3333 раза' },
            { id: 'coffeeMaster', name: 'Кофеман', icon: '☕', description: '1с заваривания; +1% к снятию стресса и +2% к силе/длительности кофе за каждый уровень зала.', price: COFFEE_MASTER_PRICE, multiplier: 1, unlockCondition: g => g.coffeeLoverAchievementUnlocked === true, effectText: g => `Зал: +${g.getGymLevel()}% к стрессу, +${g.getGymLevel() * 2}% к силе и длительности баффа` },
            { id: 'yogaAccess', name: 'Записаться на занятие йоги', icon: '🧘', description: 'Открывает покупку занятий йоги в разделе «Хобби».', price: 1, currency: 'kpi', prestige: true, multiplier: 1, unlockCondition: g => g.prestigePoints > 0, effectText: () => 'Доступна йога и шкала «Покой»' },
            { id: 'govProcurement', name: 'Госзакупка', icon: '🏛️', description: 'Открывает кнопку «Купить всё на максимум» — скупает разом все доступные здания, их улучшения и занятия йоги на весь баланс.', price: 1000, currency: 'kpi', prestige: true, multiplier: 1, unlockCondition: g => g.prestigePoints > 0, effectText: () => 'Доступна кнопка «Купить всё на максимум»' }
        ];
        this.upgrades = upgradeDefs.map(u => ({ ...u, purchased: !!(u.prestige && this.prestigeUpgradesPurchased[u.id]), revealed: false }));
    }

    installBuildingMultiplierOverrides() {
        if (typeof Building === 'undefined' || !Building.prototype) return;
        Building.prototype.getSourceMultiplier = function () {
            const level = Math.max(0, Math.floor(Number(this.upgradeLevel) || 0));
            if (level <= 0) return 1;
            // Хобби (зал, курсы) сохраняют прежний множитель ×2 за уровень
            if (this.stats?.special === 'gym' || this.stats?.special === 'course' || this.stats?.hobbyUpgrade) return Math.pow(2, level);
            // Все здания разделов «Рабочее место» и «Команда» (включая ai, processing, office, aiComputer, dataCenter) — ×10 за уровень
            return Math.pow(3.5, level);
        };
    }

    getStressIncomeMultiplier() {
        if (this.stress > 70) return 0.5;
        if (this.stress > 30) return 0.8;
        return 1.0;
    }

    computeEmergenceMultiplier() {
        const emergenceUpgrade = this.upgrades.find(u => u.id === 'emergence');
        if (!emergenceUpgrade || !emergenceUpgrade.purchased) {
            this.emergenceMultiplier = 1;
            return;
        }

        let totalLevels = 0;
        for (const [id, b] of this.buildings) {
            if (id === 'gym' || id === 'course') continue;
            totalLevels += b.level;
        }
        this.emergenceMultiplier = 1 + Math.floor(totalLevels / 35) * 0.01;
    }

    computeEmergence2Multiplier() {
        const upgrade = this.upgrades.find(u => u.id === 'emergence2');
        if (!upgrade || !upgrade.purchased) {
            this.emergence2Multiplier = 1;
            return;
        }

        let totalUpgrades = 0;
        for (const b of this.buildings.values()) {
            totalUpgrades += b.upgradeLevel;   // все улучшения зданий
        }
        // +1% за каждое улучшение (т.е. множитель 0.01 за штуку)
        this.emergence2Multiplier = 1 + totalUpgrades * 0.01;
    }

    computeCoachMultiplier() {
        const coachUpgrade = this.upgrades.find(u => u.id === 'coach');
        if (!coachUpgrade || !coachUpgrade.purchased) {
            this.coachMultiplier = 1;
            return;
        }

        const ai = this.buildings.get('ai');
        const aiComputer = this.buildings.get('aiComputer');
        const aiLevel = ai ? ai.level : 0;
        const aiComputerLevel = aiComputer ? aiComputer.level : 0;

        const bonus = Math.floor(aiLevel / 10) * 0.05   // 1% за каждые 10 уровней AI-ассистента
            + Math.floor(aiComputerLevel / 5) * 0.05; // 5% за каждые 5 уровней AI-ЭВМ

        this.coachMultiplier = 1 + bonus;
    }

    cacheDOM() {
        this.dom = {
            counter: document.getElementById('counter'),
            balanceCoin: document.getElementById('balanceCoin'),
            cpsDisplay: document.getElementById('cpsDisplay'),
            clickPowerDisplay: document.getElementById('clickPowerDisplay'),
            stressValue: document.getElementById('stressValue'),
            stressFill: document.getElementById('stressFill'),
            careerCount: document.getElementById('careerCount'),
            careerName: document.getElementById('careerName'),
            careerMult: document.getElementById('careerMult'),
            expFill: document.getElementById('expFill'),
            expBarLabel: document.getElementById('expBarLabel'),
            postMaxExpBar: document.getElementById('postMaxExpBar'),
            postMaxExpFill: document.getElementById('postMaxExpFill'),
            postMaxExpBarLabel: document.getElementById('postMaxExpBarLabel'),
            globalIncomeDisplay: document.getElementById('globalIncomeDisplay'),
            peaceDisplay: document.getElementById('peaceDisplay'),
            peaceBar: document.getElementById('peaceBar'),
            peaceValue: document.getElementById('peaceValue'),
            peaceFill: document.getElementById('peaceFill'),
            peaceHint: document.getElementById('peaceHint'),
            yogaShop: document.getElementById('shop-yoga'),
            yogaIcon: document.getElementById('yogaIcon'),
            yogaLvl: document.getElementById('yogaLvl'),
            yogaCost: document.getElementById('yogaCost'),
            yogaBuyPrice: document.getElementById('yogaBuyPrice'),
            yogaUpgradeLvl: document.getElementById('yogaUpgradeLvl'),
            yogaUpgradePrice: document.getElementById('yogaUpgradePrice'),
            buyYogaButton: document.getElementById('buyYogaButton'),
            upgradeYogaButton: document.getElementById('upgradeYogaButton'),
            prestigePoints: document.getElementById('prestigePoints'),
            prestigeInfo: document.getElementById('prestigeInfo'),
            prestigeButton: document.getElementById('prestigeButton'),
            prestigeSharesBadge: document.getElementById('prestigeSharesBadge'),
            prestigeKpiDetails: document.getElementById('prestigeKpiDetails'),
            clickButton: document.getElementById('clickButton'),
            coffeeButton: document.getElementById('coffeeButton'),
            coffeeCostText: document.getElementById('coffeeCostText'),
            coffeeEffectContainer: document.getElementById('coffeeEffectContainer'),
            coffeeEffectLabel: document.getElementById('coffeeEffectLabel'),
            coffeeEffectFill: document.getElementById('coffeeEffectFill'),
            coffeeCupFill: document.getElementById('coffeeCupFill'),
            coffeeCupLabel: document.getElementById('coffeeCupLabel'),
            coffeeCupWrap: document.getElementById('coffeeCupWrap'),
            cheatInput: document.getElementById('cheatInput'),
            cheatButton: document.getElementById('cheatButton'),
            cheatClickMultDisplay: document.getElementById('cheatClickMultDisplay'),
            cheatPassiveMultDisplay: document.getElementById('cheatPassiveMultDisplay'),
            cheatExpMultDisplay: document.getElementById('cheatExpMultDisplay'),
            upgradesContainer: document.getElementById('upgradesContainer'),
            prestigeUpgradesContainer: document.getElementById('prestigeUpgradesContainer'),
            prestigeSection: document.getElementById('prestigeSection'),
            buyAllButton: document.getElementById('buyAllButton'),
            saveStatus: document.getElementById('saveStatus'),
            saveNowButton: document.getElementById('saveNowButton'),
            deleteSaveButton: document.getElementById('deleteSaveButton')
        };
        for (const [key, el] of Object.entries(this.dom)) {
            if (!el) console.warn(`DOM элемент "${key}" не найден`);
        }
    }



    createUpgradeElements() {
        const container = this.dom.upgradesContainer;
        if (!container) return;
        container.innerHTML = '';
        this.upgradeElements = [];

        this.upgrades.forEach((u, index) => {
            const square = document.createElement('div');
            square.className = 'upgrade-square';
            square.dataset.id = u.id;
            square.dataset.index = index;
            square.innerHTML = `<span class="upgrade-icon">${u.icon}</span>`;
            square.style.display = 'none';

            square.addEventListener('mouseenter', (e) => showTooltip(e, index));
            square.addEventListener('mousemove', (e) => moveTooltip(e));
            square.addEventListener('mouseleave', () => hideTooltip());
            square.addEventListener('click', (e) => {
                square.classList.add('pressed');
                setTimeout(() => square.classList.remove('pressed'), 200);

                // +++ НОВОЕ: приятная искорка и нежный звук при клике — работает и для
                // недоступных/некупленных улучшений, и для уже купленных +++
                try {
                    const rect = square.getBoundingClientRect();
                    showIconSparkle(rect.left + rect.width / 2, rect.top);
                    playIconClickSound();
                } catch (err) {
                    console.warn('Эффект клика не сработал:', err);
                }

                this.purchaseUpgradeItem(index);
            });

            container.appendChild(square);
            this.upgradeElements.push(square);
        });
    }

    updateUpgradeElements() {
        this.upgrades.forEach((u, index) => {
            const el = this.upgradeElements[index];
            if (!el) return;

            if (!u.revealed) {
                if (u.unlockCondition && u.unlockCondition(this)) {
                    u.revealed = true;
                }
            }

            if (u.revealed) {
                el.style.display = '';
                el.classList.toggle('purchased', u.purchased);
            } else {
                el.style.display = 'none';
            }
        });
    }








    bindEvents() {
        // +++ ИЗМЕНЕНО: передаём событие в handleClick +++
        this.dom.clickButton.addEventListener('click', (e) => this.handleClick(e));
        this.dom.coffeeButton.addEventListener('click', () => this.drinkCoffee());
        this.dom.buyYogaButton?.addEventListener('click', () => this.purchaseYogaLesson());
        this.dom.upgradeYogaButton?.addEventListener('click', () => this.purchaseYogaUpgrade());
        this.dom.buyAllButton?.addEventListener('click', () => this.buyMaxEverything());
        // +++ НОВОЕ: клик по самой чашке тоже наливает/пьёт кофе +++
        if (this.dom.coffeeCupWrap) {
            this.dom.coffeeCupWrap.addEventListener('click', () => this.drinkCoffee());
        }
        this.dom.prestigeButton.addEventListener('click', () => this.prestige());

        // +++ НОВОЕ: клик по плашке KPI показывает/скрывает описание бонусов +++
        if (this.dom.prestigeSharesBadge) {
            this.dom.prestigeSharesBadge.addEventListener('click', () => this.toggleKpiDetails());
            this.dom.prestigeSharesBadge.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.toggleKpiDetails();
                }
            });
        }
        this.dom.cheatButton.addEventListener('click', () => this.applyCheat());

        document.querySelectorAll('.mastery-tab').forEach(btn => {
            btn.addEventListener('click', () => {
                const tab = btn.dataset.masteryTab;
                if (!tab) return;
                if (tab === 'prestige' && this.prestigePoints <= 0) return;
                this.masteryTab = tab;
                this.updateMasteryTabs();
                this.createUpgradeElements();
            });
        });

        // +++ НОВОЕ: ручное сохранение и удаление сохранения +++
        if (this.dom.saveNowButton) {
            this.dom.saveNowButton.addEventListener('click', () => {
                const ok = saveGame(this);
                updateSaveStatus(this, ok ? '✅ Сохранено вручную' : '⚠️ Не удалось сохранить');
                setTimeout(() => updateSaveStatus(this), 2000);
            });
        }
        if (this.dom.deleteSaveButton) {
            this.dom.deleteSaveButton.addEventListener('click', () => {
                const confirmed = window.confirm('Удалить сохранение и начать игру заново? Это действие необратимо.');
                if (!confirmed) return;
                deleteSave();
                this.hardReset();
                updateSaveStatus(this, '🗑️ Сохранение удалено. Начинаем заново.');
            });
        }

        for (const [id, b] of this.buildings) {
            if (b.dom.btn) {
                b.dom.btn.addEventListener('click', () => this.purchaseBuilding(id));
            }
            if (b.dom.multBtn) {
                b.dom.multBtn.addEventListener('click', () => this.purchaseUpgrade(id));
            }
        }

        document.querySelectorAll('.quantity-btn:not(#buyAllButton)').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const text = e.target.textContent.trim();
                let amount;
                if (text === 'Макс') {
                    amount = -1;
                } else if (text.startsWith('x')) {
                    amount = parseInt(text.slice(1), 10);
                    if (isNaN(amount)) amount = 1;
                } else {
                    amount = 1;
                }
                this.buyAmount = amount;
                document.querySelectorAll('.quantity-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                playQuantitySelectSound();
                this.updateUI();
            });
        });
        document.querySelector('.quantity-btn')?.classList.add('active');

        // +++ НОВОЕ: приятный клик по иконкам зданий (просто для удовольствия, без эффекта на игру) +++
        // ВАЖНО: портфель (id="briefcaseIcon") тоже подходит под селектор span[id$="Icon"],
        // поэтому явно исключаем его — у портфеля свой собственный эффект (см. ниже), и нам
        // не нужны здесь лишние искорки-смайлики и их звук поверх звука портфеля.
        document.querySelectorAll('span[id$="Icon"]:not(#briefcaseIcon)').forEach(icon => {
            icon.addEventListener('click', (e) => this.handleIconClick(e, icon));
        });

        // +++ НОВОЕ: клик по портфелю в заголовке — открывается, вылетают страницы +++
        const briefcaseIcon = document.getElementById('briefcaseIcon');
        if (briefcaseIcon) {
            briefcaseIcon.addEventListener('click', (e) => this.handleBriefcaseClick(e));
        }

        // +++ НОВОЕ: монетка рядом с балансом — уникально кликабельна, со своим звуком +++
        if (this.dom.balanceCoin) {
            this.dom.balanceCoin.addEventListener('click', (e) => this.handleBalanceCoinClick(e));
        }

        // +++ НОВОЕ: клик по фону страницы – разлетающиеся частицы + тихий стук +++
        // Срабатывает только вне интерактивных элементов, чтобы не мешать основным кнопкам
        document.addEventListener('click', (e) => {
            const interactiveSelector = 'button, input, a, select, textarea, ' +
                '.quantity-btn, .upgrade-square, span[id$="Icon"], .theme-toggle, .coffee-cup-wrap, .briefcase-icon, .balance-coin';
            if (e.target.closest(interactiveSelector)) return;
            this.handleBackgroundClick(e);
        });
    }
    // +++ НОВОЕ: универсальный проигрыватель одной ноты (используется всеми звуками) +++






    // +++ НОВОЕ: лёгкая искорка, всплывающая рядом с иконкой при клике +++


    // +++ НОВОЕ: обработчик клика по иконке здания — просто приятная мелочь, на игру не влияет +++
    handleIconClick(event, iconEl) {
        try {
            // Перезапускаем анимацию "поп"
            iconEl.classList.remove('icon-pop');
            void iconEl.offsetWidth; // форсируем reflow, чтобы анимация сыграла заново
            iconEl.classList.add('icon-pop');

            const rect = iconEl.getBoundingClientRect();
            showIconSparkle(rect.left + rect.width / 2, rect.top);

            playIconClickSound();
        } catch (e) {
            // Декоративный эффект не должен ломать игру
            console.warn('Эффект иконки не сработал:', e);
        }
    }

    // +++ НОВОЕ: тихий звук клика по фону — как будто лёгкий стук кирпичиков +++
    playBackgroundClickSound() {
        try {
            const ctx = this.ensureAudioCtx();
            const duration = 0.06;
            const bufferSize = Math.max(1, Math.floor(ctx.sampleRate * duration));
            const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                // затухающий белый шум – даёт глухой, "материальный" стук
                data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
            }

            const noise = ctx.createBufferSource();
            noise.buffer = buffer;

            const filter = ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.value = 700; // приглушаем верх – звук становится "деревянно-каменным"

            const gainNode = ctx.createGain();
            gainNode.gain.setValueAtTime(0.05, ctx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

            noise.connect(filter);
            filter.connect(gainNode);
            gainNode.connect(ctx.destination);

            noise.start(ctx.currentTime);
            noise.stop(ctx.currentTime + duration);
        } catch (e) {
            console.warn('Звук не воспроизведён:', e);
        }
    }

    // +++ НОВОЕ: маленькие частицы, разлетающиеся во все стороны при клике по фону +++


    // +++ НОВОЕ: обработчик клика по фону страницы (мимо кнопок, иконок и т.д.) +++
    handleBackgroundClick(event) {
        try {
            spawnBackgroundParticles(event.clientX, event.clientY);
            playBackgroundClickSound();
        } catch (e) {
            console.warn('Эффект фона не сработал:', e);
        }
    }

    // +++ НОВОЕ: клик по портфелю в заголовке — открывается, из него вылетают страницы +++
    handleBriefcaseClick(event) {
        try {
            const icon = event.currentTarget;
            icon.classList.remove('opening');
            void icon.offsetWidth; // форсируем reflow, чтобы анимация сыграла заново при повторном клике
            icon.classList.add('opening');

            const rect = icon.getBoundingClientRect();
            spawnBriefcasePapers(rect.left + rect.width / 2, rect.top + rect.height / 2);
            playBriefcaseSound();
        } catch (e) {
            console.warn('Эффект портфеля не сработал:', e);
        }
    }

    // +++ НОВОЕ: страницы, вылетающие из открытого портфеля +++


    // +++ НОВОЕ: звук открытия портфеля — лёгкий шорох бумаги + щелчок замка +++
    playBriefcaseSound() {
        try {
            const ctx = this.ensureAudioCtx();
            const duration = 0.14;
            const bufferSize = Math.max(1, Math.floor(ctx.sampleRate * duration));
            const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
            }

            const noise = ctx.createBufferSource();
            noise.buffer = buffer;

            const filter = ctx.createBiquadFilter();
            filter.type = 'highpass';
            filter.frequency.value = 2200; // высокие частоты — шорох бумаги, а не глухой стук

            const gainNode = ctx.createGain();
            gainNode.gain.setValueAtTime(0.045, ctx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

            noise.connect(filter);
            filter.connect(gainNode);
            gainNode.connect(ctx.destination);

            noise.start(ctx.currentTime);
            noise.stop(ctx.currentTime + duration);

            // короткий щелчок замка портфеля
            playTone(190, 0.045, 'square', 0.035, 0.015);
        } catch (e) {
            console.warn('Звук не воспроизведён:', e);
        }
    }

    // +++ НОВОЕ: клик по монетке рядом с балансом — уникальный эффект, на игру не влияет +++
    handleBalanceCoinClick(event) {
        try {
            const coin = event.currentTarget;
            coin.classList.remove('coin-spin');
            void coin.offsetWidth; // форсируем reflow, чтобы анимация сыграла заново при повторном клике
            coin.classList.add('coin-spin');

            const rect = coin.getBoundingClientRect();
            this.spawnCoinSparkle(rect.left + rect.width / 2, rect.top);

            playBalanceCoinSound();
        } catch (e) {
            console.warn('Эффект монетки не сработал:', e);
        }
    }

    // +++ НОВОЕ: искорка-монетка, всплывающая при клике по балансу +++
    spawnCoinSparkle(x, y) {
        const symbols = ['🪙', '✨'];
        const symbol = symbols[Math.floor(Math.random() * symbols.length)];

        const el = document.createElement('div');
        el.className = 'icon-sparkle';
        el.textContent = symbol;

        const offsetX = (Math.random() - 0.5) * 30;
        el.style.left = (x + offsetX) + 'px';
        el.style.top = (y - 6) + 'px';

        document.body.appendChild(el);

        setTimeout(() => {
            if (el.parentNode) el.parentNode.removeChild(el);
        }, 700);
    }

    // +++ НОВОЕ: уникальный звенящий "динь" монетки — не похож ни на один другой звук в игре +++
    playBalanceCoinSound() {
        try {
            playTone(1567.98, 0.05, 'square', 0.05, 0);      // G6
            playTone(2093.00, 0.09, 'triangle', 0.06, 0.045); // C7
            playTone(2637.02, 0.12, 'sine', 0.04, 0.09);      // E7 — переливчатый хвостик
        } catch (e) {
            console.warn('Звук не воспроизведён:', e);
        }
    }

    getPrestigeBonus() {
        return 1 + (this.prestigePoints * 0.1);
    }

    // +++ НОВОЕ: бонус к опыту от очков KPI (1 KPI = +2% к опыту) +++
    getPrestigeExpBonus() {
        return 1 + (this.prestigePoints * 0.02);
    }
    // +++ НОВАЯ ФОРМУЛА ПРЕСТИЖА +++
    getPrestigeEarned(base) {
        if (base <= 0) return 0;
        const log = Math.log10(base);
        if (log <= 0) return 0; // для base < 1 даём 0
        return Math.floor((1 + log / 10) * Math.cbrt(base) * log / (1.2e6*5));
    }

    // +++ НОВОЕ: сколько опыта даёт один клик (используется и для начисления, и для отображения в магазине) +++
    getExpPerClick() {
        const course = this.buildings.get('course');
        const courseLvl = course ? course.level : 0;
        const courseUpgradeLvl = course ? course.upgradeLevel : 0;
        const courseEffectMult = Math.pow(2, courseUpgradeLvl);
        const prestigeExpBonus = this.getPrestigeExpBonus();
        return (1 + courseLvl) * this.cheat.exp * this.coachMultiplier * courseEffectMult * prestigeExpBonus;
    }

    // +++ НОВОЕ: показать/скрыть описание бонусов KPI +++
    toggleKpiDetails() {
        if (!this.dom.prestigeKpiDetails) return;
        const isOpen = this.dom.prestigeKpiDetails.style.display !== 'none';
        if (isOpen) {
            this.dom.prestigeKpiDetails.style.display = 'none';
        } else {
            this.updateKpiDetails();
            this.dom.prestigeKpiDetails.style.display = 'block';
        }
    }

    // +++ НОВОЕ: пересчёт текста описания бонусов KPI +++
    updateKpiDetails() {
        if (!this.dom.prestigeKpiDetails) return;
        const incomePercent = Math.round(this.prestigePoints * 10 * 10) / 10;
        const expPercent = Math.round(this.prestigePoints * 2 * 10) / 10;
        this.dom.prestigeKpiDetails.innerHTML =
            `+${formatNumber(incomePercent)}% ко всему доходу<br>` +
            `+${formatNumber(expPercent)}% к опыту`;
    }

    getGymLevel() { const gym = this.buildings.get('gym'); return gym ? gym.level : 0; }
    isUpgradePurchased(id) { const u = this.upgrades.find(x => x.id === id); return !!(u && u.purchased); }
    getCoffeePourDuration() { return this.isUpgradePurchased('coffeeMaster') ? COFFEE_MASTER_POUR_DURATION : COFFEE_POUR_DURATION; }
    getCoffeeStressReduction() { return COFFEE_STRESS_REDUCTION * (this.isUpgradePurchased('coffeeMaster') ? (1 + this.getGymLevel() * 0.01) : 1); }
    getCoffeeBuffStrengthMultiplier() { return this.isUpgradePurchased('coffeeMaster') ? (1 + this.getGymLevel() * COFFEE_BUFF_STRENGTH_PER_GYM_LEVEL) : 1; }
    getCoffeeBuffDuration() { return BUFF_DURATION * (this.isUpgradePurchased('coffeeMaster') ? (1 + this.getGymLevel() * COFFEE_BUFF_DURATION_PER_GYM_LEVEL) : 1); }
    getCoffeeIncomeMultiplier() {
        if (this.debuffActive) return DEBUFF_MALUS;
        if (this.buffLevel > 0) return 1 + this.buffLevel * 0.10 * this.getCoffeeBuffStrengthMultiplier();
        return 1;
    }
    getPeaceIncomeMultiplier() {
        if (!this.isPeaceUnlocked()) return 1;
        return 1 + Math.max(0, Math.min(100, this.peace)) * PEACE_INCOME_PER_PERCENT;
    }
    getEffectiveYogaLevel() {
        // Каждый уровень обычной йоги даёт +1% к базовой скорости,
        // а каждый уровень улучшения утраивает весь эффект йоги.
        const baseYogaEffect = Math.max(0, this.yogaLevel);
        const upgradeMultiplier = Math.pow(3, Math.max(0, this.yogaUpgradeLevel));
        return baseYogaEffect * upgradeMultiplier;
    }
    getYogaPurchasePrice() { return YOGA_PURCHASE_BASE_COST * Math.pow(YOGA_PURCHASE_COST_MULT, this.yogaLevel); }
    getYogaUpgradePrice() { return this.yogaLevel <= 0 ? null : YOGA_PURCHASE_BASE_COST * YOGA_UPGRADE_COST_MULT * Math.pow(YOGA_PURCHASE_COST_MULT, this.yogaUpgradeLevel); }
    hasYogaAccess() { return this.prestigeUpgradesPurchased.yogaAccess === true; }
    hasGovProcurement() { return this.prestigeUpgradesPurchased.govProcurement === true; }
    isPeaceUnlocked() { return this.hasYogaAccess() && this.yogaLevel > 0; }

    // +++ НОВОЕ: массовая покупка занятий йоги (аналог Building.getBulkCost/getMaxAffordable) +++
    getYogaBulkCost(quantity) {
        const base = YOGA_PURCHASE_BASE_COST;
        const mult = YOGA_PURCHASE_COST_MULT;
        return Math.ceil(base * Math.pow(mult, this.yogaLevel) * ((Math.pow(mult, quantity) - 1) / (mult - 1)));
    }

    getMaxAffordableYoga() {
        if (this.count < this.getYogaBulkCost(1)) return 0;
        let max = 1;
        while (this.getYogaBulkCost(max * 2) <= this.count && max < 100000) {
            max *= 2;
        }
        while (this.getYogaBulkCost(max + 1) <= this.count && max < 100000) {
            max++;
        }
        return max;
    }

    getStressAccumulationMultiplier() {
        return this.debuffActive ? DEBUFF_STRESS_MULT : 1;
    }

    updateStress(delta) {
        if (this.stress >= 100) {
            if (!this.stressLocked && !this.stressHundredLockUsed) {
                this.stressLocked = true;
                this.stressLockTimer = 3;
                this.stressHundredLockUsed = true;
            }
            if (this.stressLocked) {
                return;
            }
        } else {
            this.stressLocked = false;
            this.stressLockTimer = 0;
            this.stressHundredLockUsed = false;
        }

        const gym = this.buildings.get('gym');
        const gymLvl = gym ? gym.level : 0;
        const gymUpgradeLvl = gym ? gym.upgradeLevel : 0;
        // +++ НОВОЕ: улучшения зала удваивают эффект самого зала (за каждый уровень улучшения) +++
        const gymEffectMult = Math.pow(2, gymUpgradeLvl);
        const decayRate = STRESS_DECAY_BASE * (1 + (Math.pow(1.1, gymLvl) - 1) * gymEffectMult);
        const decayAmount = decayRate * delta;
        this.stress = Math.max(0, this.stress - decayAmount);
    }

    updateStats() {
        const prestigeMult = this.getPrestigeBonus();
        const careerInfo = CAREERS[this.careerLevel];
        const coffeeMult = this.getCoffeeIncomeMultiplier();
        const peaceMult = this.getPeaceIncomeMultiplier();
        const globalIncomeMult = this.globalIncomeMultiplier;

        this.computeEmergenceMultiplier();
        this.computeEmergence2Multiplier();
        this.computeCoachMultiplier();

        // +++ НОВОЕ: скидка на образование — курсы и их улучшения дешевле в 33 раза +++
        const eduDiscountUpgrade = this.upgrades.find(u => u.id === 'eduDiscount');
        const course = this.buildings.get('course');
        if (course) {
            course.costDiscount = (eduDiscountUpgrade && eduDiscountUpgrade.purchased) ? (1 / 3333) : 1;
        }

        let baseClickTotal = 1;
        this.clickComponents = {};

        for (const [id, b] of this.buildings) {
            if (b.stats.clickPower) {
                const sourceMult = b.getSourceMultiplier();
                const base = b.level * b.stats.clickPower * sourceMult;
                const contribution = base * careerInfo.clickMult * prestigeMult * this.cheat.click * coffeeMult * this.upgradeMultiplier * this.emergenceMultiplier * this.emergence2Multiplier * peaceMult * globalIncomeMult;
                this.clickComponents[id] = contribution;
                baseClickTotal += base;
            }
        }

        this.clickPower = baseClickTotal * careerInfo.clickMult * prestigeMult * this.cheat.click * coffeeMult * this.upgradeMultiplier * this.emergenceMultiplier * this.emergence2Multiplier * peaceMult * globalIncomeMult;

        let totalBasePassive = 0;
        this.passiveComponents = {};

        for (const [id, b] of this.buildings) {
            if (b.stats.cps) {
                const sourceMult = b.getSourceMultiplier();
                const base = b.level * b.stats.cps * sourceMult;
                const contribution = base * careerInfo.clickMult * prestigeMult * this.cheat.passive * coffeeMult * this.upgradeMultiplier * this.emergenceMultiplier * this.emergence2Multiplier * peaceMult * globalIncomeMult;
                this.passiveComponents[id] = contribution;
                totalBasePassive += base;
            }
        }

        this.passiveIncome = totalBasePassive * careerInfo.clickMult * prestigeMult * this.cheat.passive * coffeeMult * this.upgradeMultiplier * this.emergenceMultiplier * this.emergence2Multiplier * peaceMult * globalIncomeMult;
        // Сохраняем базовые значения (без штрафа) для внутренних расчётов
        this.baseClickPower = this.clickPower;
        this.basePassiveIncome = this.passiveIncome;

        // Применяем штраф от стресса для отображения
        const stressMult = this.getStressIncomeMultiplier();
        this.clickPower = this.baseClickPower * stressMult;
        this.passiveIncome = this.basePassiveIncome * stressMult;
    }

    checkCareerAdvancement() {
        while (this.careerLevel < CAREERS.length - 1 && this.experience >= CAREERS[this.careerLevel].nextExp) {
            this.experience -= CAREERS[this.careerLevel].nextExp;
            this.careerLevel++;
        }
        if (this.careerLevel >= CAREERS.length - 1) {
            this.experienceAfterMax += Math.max(0, this.experience);
            this.experience = 0;
            if (this.experienceAfterMax >= this.experienceAfterMaxThreshold) {
                this.globalIncomeMultiplier *= POST_MAX_INCOME_MULT;
                this.experienceAfterMax = 0;
                this.experienceAfterMaxThreshold *= POST_MAX_EXP_GROWTH;
            }
        }
    }

    // +++ НОВЫЙ МЕТОД: отображение всплывающего текста +++


    // +++ ИЗМЕНЕНО: убран двойной штраф, добавлен вызов всплывающего текста +++
    handleClick(event) {
        try {
            playClickSound();
        } catch (e) {
            // игнорируем
        }



        const now = Date.now();
        if (now - this.lastClickTime < 25) {
            this.dom.clickButton.style.transform = 'scale(0.95)';
            setTimeout(() => this.dom.clickButton.style.transform = '', 100);
            return;
        }
        this.lastClickTime = now;
        this.coffeeStreak = 0;
        this.lastActionTime = now;
        this.peace = Math.max(0, this.peace * PEACE_WORK_MULT);

        if (this.stress >= 100) { this.updateUI(); return; }

        // clickPower уже учитывает все множители и штраф от стресса
        const power = this.clickPower;

        this.count += power;
        this.totalEarnedThisPrestige += power;

        // Опыт
        this.computeCoachMultiplier();
        this.experience += this.getExpPerClick();
        this.checkCareerAdvancement();

        // Стресс
        let stressGain = 0.5 * this.getStressAccumulationMultiplier();
        const resistUpgrade = this.upgrades.find(u => u.id === 'stressResist1');
        if (resistUpgrade && resistUpgrade.purchased) {
            stressGain *= 0.7;
        }
        this.stress = Math.min(100, this.stress + stressGain);
        if (this.stress >= 100 && !this.hasReached100Stress) {
            this.hasReached100Stress = true;

            // +++ НОВОЕ: уведомление о достижении предела стресса +++
            notificationManager.notify({
                id: 'stress-100',
                once: true,
                icon: '😵',
                title: 'Предел возможностей',
                sound: 'warning',
                text: 'Стресс достиг 100%. Доход сильно упал. Выпейте кофе или дождитесь снижения стресса — теперь вам доступно улучшение «Стрессоустойчивость I».'
            });
        }

        // Обновляем UI (пересчитывает clickPower для следующих кликов)
        this.updateUI();

        // Показываем всплывающий текст с силой клика (форматируем число)
        const formatted = '+' + formatNumber(power);
        if (event) {
            // Если есть событие мыши – используем его координаты
            showFloatingText(event.clientX, event.clientY, formatted);
        } else {
            // Для мобильных или тестов – центр кнопки
            showFloatingText(undefined, undefined, formatted);
        }
    }

    drinkCoffee() {
        // +++ НОВОЕ: чашку нельзя выпить, пока кофе ещё наливается +++
        if (this.coffeePour > 0) {
            playInsufficientFundsSound();
            return;
        }
        if (this.count < this.coffeeCost) {
            playInsufficientFundsSound();
            return;
        }
        this.count -= this.coffeeCost;
        this.coffeeCost = Math.ceil(this.coffeeCost * COFFEE_COST_MULT);
        playCoffeeSound();
        // Чашка выпита — она пустеет и снова начинает наливаться
        this.coffeePour = this.getCoffeePourDuration();
        this.lastActionTime = Date.now();
        this.coffeeStreak++;
        if (this.coffeeStreak >= COFFEE_STREAK_REQUIRED) {
            const wasUnlocked = this.coffeeLoverAchievementUnlocked;
            this.coffeeLoverAchievementUnlocked = true;

            // +++ НОВОЕ: уведомление о новом достижении +++
            if (!wasUnlocked) {
                notificationManager.notify({
                    id: 'achievement-coffee-lover',
                    once: true,
                    icon: '☕',
                    title: 'Достижение: Любитель кофе',
                    sound: 'success',
                    text: 'Вы выпили 15 чашек кофе подряд без единого клика «Работать!». Открыт доступ к улучшению «Кофеман».'
                });
            }
        }
        const coffeeStressReduction = this.getCoffeeStressReduction();

        // Если активен дебафф – только снижаем стресс
        if (this.debuffActive) {
            if (this.stress > 0) {
                this.stress = Math.max(0, this.stress - coffeeStressReduction);
            }
            this.updateUI();
            return;
        }

        // Стресс > 0 – кофе уходит на снижение стресса, бафф не трогаем
        if (this.stress > 0) {
            this.stress = Math.max(0, this.stress - coffeeStressReduction);
            // Даже если стресс стал 0 – бафф не добавляем
            this.updateUI();
            return;
        }

        // Стресс == 0 – работаем с баффом / дебаффом
        if (this.buffLevel < 10) {
            this.buffLevel++;
            this.buffTimer = this.getCoffeeBuffDuration();  // обновляем таймер с бонусом зала
        } else {
            // Переход в дебафф
            this.debuffActive = true;
            this.debuffTimer = DEBUFF_DURATION;
            this.buffLevel = 0;
            this.buffTimer = 0;
        }
        this.updateUI();
    }

    purchaseBuilding(id) {
        const b = this.buildings.get(id);
        if (!b) return;

        let quantity = this.buyAmount;
        if (quantity === -1) {
            quantity = b.getMaxAffordable(this.count);
            if (quantity === 0) {
                playInsufficientFundsSound();
                return;
            }
        }

        const cost = b.getBulkCost(quantity);
        if (this.count >= cost) {
            this.count -= cost;
            b.level += quantity;
            playBuyBuildingSound();
            this.updateUI();
        } else {
            playInsufficientFundsSound();
        }
    }

    purchaseUpgrade(id) {
        const b = this.buildings.get(id);
        if (!b) return;

        // +++ НОВОЕ: улучшения для зала/курсов — своя, более простая логика цены +++
        if (b.stats.hobbyUpgrade) {
            const price = b.getHobbyUpgradePrice();
            if (this.count >= price) {
                this.count -= price;
                b.upgradeLevel++;
                playBuildingUpgradeSound();
                this.updateUI();
            } else {
                playInsufficientFundsSound();
            }
            return;
        }

        if (!b.stats.upgradeType) return;

        const nextData = b.getUpgradeData(b.upgradeLevel + 1);
        if (!nextData || !nextData.available) return; // недоступно по условию – это не про деньги

        if (this.count >= nextData.price) {
            this.count -= nextData.price;
            b.upgradeLevel++;
            playBuildingUpgradeSound();
            this.updateUI();
        } else {
            playInsufficientFundsSound();
        }
    }

    purchaseUpgradeItem(index) {
        const upgrade = this.upgrades[index];
        if (!upgrade || upgrade.purchased) return;
        if (upgrade.prestige && this.prestigePoints <= 0) { playInsufficientFundsSound(); return; }
        const canAfford = upgrade.currency === 'kpi' ? this.prestigePoints >= upgrade.price : this.count >= upgrade.price;
        if (!canAfford) { playInsufficientFundsSound(); return; }
        if (upgrade.currency === 'kpi') { this.prestigePoints -= upgrade.price; this.prestigeUpgradesPurchased[upgrade.id] = true; }
        else this.count -= upgrade.price;
        upgrade.purchased = true; upgrade.revealed = true;
        if (!['emergence', 'stressResist1', 'emergence2', 'coach', 'eduDiscount', 'coffeeMaster', 'yogaAccess', 'govProcurement'].includes(upgrade.id)) this.upgradeMultiplier *= upgrade.multiplier;
        playGeneralUpgradeSound(); this.updateUI(); saveGame(this);
    }

    purchaseYogaLesson() {
        if (!this.hasYogaAccess()) return;

        let quantity = this.buyAmount;
        if (quantity === -1) {
            quantity = this.getMaxAffordableYoga();
            if (quantity === 0) { playInsufficientFundsSound(); return; }
        }

        const cost = this.getYogaBulkCost(quantity);
        if (this.count >= cost) {
            this.count -= cost;
            this.yogaLevel += quantity;
            playGeneralUpgradeSound();
            this.updateUI();
        } else {
            playInsufficientFundsSound();
        }
    }

    purchaseYogaUpgrade() {
        if (!this.hasYogaAccess()) return;
        const price = this.getYogaUpgradePrice();
        if (price === null || this.count < price) { playInsufficientFundsSound(); return; }
        this.count -= price; this.yogaUpgradeLevel++; playGeneralUpgradeSound(); this.updateUI();
    }

    // +++ НОВОЕ: «Госзакупка» — скупает всё доступное (здания, их улучшения, занятия йоги) на весь баланс +++
    buyMaxEverything() {
        if (!this.hasGovProcurement()) return;

        let anyPurchase = false;
        let changedOverall = true;
        let outerIterations = 0;

        while (changedOverall && outerIterations < 200) {
            changedOverall = false;
            outerIterations++;

            // Собираем всех кандидатов на покупку с ценой их "следующего шага"
            const candidates = [];

            for (const b of this.buildings.values()) {
                const levelCost = b.getBulkCost(1);
                if (this.count >= levelCost) {
                    candidates.push({ price: levelCost, type: 'buildingLevel', building: b });
                }

                if (b.stats.hobbyUpgrade) {
                    const price = b.getHobbyUpgradePrice();
                    if (price !== null && this.count >= price) {
                        candidates.push({ price, type: 'hobbyUpgrade', building: b });
                    }
                } else if (b.stats.upgradeType) {
                    const next = b.getUpgradeData(b.upgradeLevel + 1);
                    if (next && next.available && this.count >= next.price) {
                        candidates.push({ price: next.price, type: 'buildingUpgrade', building: b });
                    }
                }
            }

            if (this.hasYogaAccess()) {
                const lessonCost = this.getYogaBulkCost(1);
                if (this.count >= lessonCost) {
                    candidates.push({ price: lessonCost, type: 'yogaLesson' });
                }
                const upgradeCost = this.getYogaUpgradePrice();
                if (upgradeCost !== null && this.count >= upgradeCost) {
                    candidates.push({ price: upgradeCost, type: 'yogaUpgrade' });
                }
            }

            if (candidates.length === 0) break;

            // Сначала самое дорогое, а на сдачу — остальное по убыванию цены
            candidates.sort((a, b) => b.price - a.price);

            for (const c of candidates) {
                if (c.type === 'buildingLevel') {
                    const b = c.building;
                    const maxQty = b.getMaxAffordable(this.count);
                    if (maxQty > 0) {
                        const cost = b.getBulkCost(maxQty);
                        if (this.count >= cost) {
                            this.count -= cost;
                            b.level += maxQty;
                            changedOverall = true; anyPurchase = true;
                        }
                    }
                } else if (c.type === 'hobbyUpgrade') {
                    const b = c.building;
                    let price = b.getHobbyUpgradePrice();
                    while (price !== null && this.count >= price) {
                        this.count -= price;
                        b.upgradeLevel++;
                        changedOverall = true; anyPurchase = true;
                        price = b.getHobbyUpgradePrice();
                    }
                } else if (c.type === 'buildingUpgrade') {
                    const b = c.building;
                    let next = b.getUpgradeData(b.upgradeLevel + 1);
                    while (next && next.available && this.count >= next.price) {
                        this.count -= next.price;
                        b.upgradeLevel++;
                        changedOverall = true; anyPurchase = true;
                        next = b.getUpgradeData(b.upgradeLevel + 1);
                    }
                } else if (c.type === 'yogaLesson') {
                    const maxYoga = this.getMaxAffordableYoga();
                    if (maxYoga > 0) {
                        const cost = this.getYogaBulkCost(maxYoga);
                        if (this.count >= cost) {
                            this.count -= cost;
                            this.yogaLevel += maxYoga;
                            changedOverall = true; anyPurchase = true;
                        }
                    }
                } else if (c.type === 'yogaUpgrade') {
                    let upPrice = this.getYogaUpgradePrice();
                    while (upPrice !== null && this.count >= upPrice) {
                        this.count -= upPrice;
                        this.yogaUpgradeLevel++;
                        changedOverall = true; anyPurchase = true;
                        upPrice = this.getYogaUpgradePrice();
                    }
                }
            }
        }

        if (anyPurchase) {
            playBuyBuildingSound();
            this.updateUI();
            saveGame(this);
        } else {
            playInsufficientFundsSound();
        }
    }

    updatePeace(delta) {
        if (this.getEffectiveYogaLevel() <= 0) return;
        const idleSeconds = Math.max(0, (Date.now() - this.lastActionTime) / 1000);
        if (idleSeconds < 60) return;
        const yogaEffectLevels = this.getEffectiveYogaLevel();
        const speedMultiplier = 1 + yogaEffectLevels * YOGA_PEACE_SPEED_PER_LEVEL;
        this.peace = Math.min(100, this.peace + PEACE_PER_SECOND * speedMultiplier * delta);
    }

    prestige() {
        if (this.careerLevel < CAREERS.length - 1 || this.totalEarnedThisPrestige < PRESTIGE_COST_PER_SHARE) {
            playInsufficientFundsSound();
            return;
        }

        const base = this.totalEarnedThisPrestige;
        const earned = this.getPrestigeEarned(base);

        // +++ НОВОЕ: уведомление перед сбросом, показывается один раз +++
        const doPrestige = () => {
            if (earned > 0) {
                this.prestigePoints += earned;
            }
            this.reset();
            saveGame(this);
        };

        notificationManager.notify({
            id: 'prestige-first',
            once: true,
            icon: '🚀',
            title: 'Основание корпорации',
            sound: 'success',
            text: `Вы собираетесь обнулить текущий прогресс и получить <strong>${formatNumber(earned)} KPI</strong>.<br>` +
                `Здания, баланс, стресс и опыт будут сброшены. Улучшения мастерства (кроме престижных) и достижения сохранятся.`,
            buttons: [
                { text: 'Отмена', onClick: () => { } },
                { text: 'Основать корпорацию', primary: true, onClick: doPrestige }
            ]
        });

        // Если уведомление уже было показано ранее — выполняем престиж сразу
        if (notificationManager.hasShown('prestige-first')) {
            doPrestige();
        }
    }

    reset() {
        this.count = 0;
        this.totalEarnedThisPrestige = 0;
        this.stress = 0;
        this.experience = 0;
        this.careerLevel = 0;
        this.coffeeCost = 20;
        this.coffeeStreak = 0;
        this.peace = 0;
        this.lastActionTime = Date.now();
        this.yogaLevel = 0;
        this.yogaUpgradeLevel = 0;
        this.experienceAfterMax = 0;
        this.experienceAfterMaxThreshold = POST_MAX_EXP_BASE;
        this.coffeePour = 0;
        this.buffLevel = 0;
        this.buffTimer = 0;
        this.debuffActive = false;
        this.debuffTimer = 0;
        this.upgradeMultiplier = 1;
        this.upgrades.forEach(u => {
            if (u.prestige) { u.purchased = !!this.prestigeUpgradesPurchased[u.id]; u.revealed = this.prestigePoints > 0; }
            else { u.purchased = false; u.revealed = false; }
        });

        for (const b of this.buildings.values()) {
            b.level = 0;
            b.upgradeLevel = 0;
        }
        this.stressLocked = false;
        this.stressLockTimer = 0;
        this.stressHundredLockUsed = false;
        this.hasReached100Stress = false;

        this.updateUI();
    }

    // +++ НОВОЕ: полный сброс, включая престиж — используется при удалении сохранения +++
    hardReset() {
        this.prestigePoints = 0;
        this.prestigeUnlocked = false;
        this.prestigeUpgradesPurchased = {};
        this.coffeeLoverAchievementUnlocked = false;
        this.globalIncomeMultiplier = 1;
        this.reset();
    }

    // +++ НОВОЕ: собираем данные для сохранения (только долгосрочный прогресс) +++


    // +++ НОВОЕ: применяем загруженные данные к текущей игре +++
    // Короткоживущие эффекты (баффы/дебаффы/налив кофе/блокировка стресса) намеренно
    // не сохраняются — они привязаны к текущей сессии и сбрасываются на старте.


    // +++ НОВОЕ: сохранение в localStorage +++


    // +++ НОВОЕ: загрузка из localStorage. Возвращает true, если сохранение было найдено +++


    // +++ НОВОЕ: удаление сохранения +++


    // +++ НОВОЕ: обновление текста статуса сохранения +++


    // +++ НОВОЕ: приятный звук "С возвращением!" — восходящий аккорд +++
    playOfflineEarningsSound() {
        try {
            playTone(523.25, 0.10, 'triangle', 0.10, 0);     // C5
            playTone(659.25, 0.10, 'triangle', 0.10, 0.09);  // E5
            playTone(783.99, 0.10, 'triangle', 0.10, 0.18);  // G5
            playTone(1046.50, 0.16, 'triangle', 0.11, 0.27); // C6
        } catch (e) {
            console.warn('Звук не воспроизведён:', e);
        }
    }

    applyCheat() {
        let val = parseInt(this.dom.cheatInput.value, 10);
        if (isNaN(val) || val < 1) val = 1;
        if (val > 1_000_000) val = 1_000_000;
        this.dom.cheatInput.value = val;

        this.cheat.click = val;
        this.cheat.passive = val;
        this.cheat.exp = val;

        this.dom.cheatClickMultDisplay.textContent = val;
        this.dom.cheatPassiveMultDisplay.textContent = val;
        this.dom.cheatExpMultDisplay.textContent = val;

        this.updateUI();
    }

    updateCoffeeEffect() {
        let label = '☕ Нет эффекта';
        let fillColor = '#4caf50';
        let percent = 0;
        let visible = false;

        if (this.debuffActive) {
            label = '⚠️ Дебафф: -50% дохода, +100% стресса';
            fillColor = '#f44336';
            percent = (this.debuffTimer / DEBUFF_DURATION) * 100;
            visible = true;
        } else if (this.buffLevel > 0) {
            const perStackPercent = 10 * this.getCoffeeBuffStrengthMultiplier();
            const bonusPercent = this.buffLevel * perStackPercent;
            const perStackLabel = Number.isInteger(perStackPercent)
                ? `${perStackPercent}`
                : `${Math.round(perStackPercent * 10) / 10}`;
            label = `✅ +${bonusPercent}% дохода (${perStackLabel}% за стак)`;
            fillColor = '#4caf50';
            percent = (this.buffTimer / this.getCoffeeBuffDuration()) * 100;
            visible = true;
        }

        if (this.dom.coffeeEffectContainer) {
            this.dom.coffeeEffectContainer.style.display = visible ? 'block' : 'none';
        }
        const remaining = this.debuffActive ? this.debuffTimer : this.buffTimer;
        if (this.dom.coffeeEffectLabel) {
            this.dom.coffeeEffectLabel.textContent = label + (visible ? ` (${Math.ceil(remaining)}с)` : '');
        }
        if (this.dom.coffeeEffectFill) {
            this.dom.coffeeEffectFill.style.width = percent + '%';
            this.dom.coffeeEffectFill.style.backgroundColor = fillColor;
        }
    }

    // +++ НОВОЕ: обновление шкалы опыта карьеры +++
    updateExpBar() {
        const nextExp = CAREERS[this.careerLevel].nextExp;
        if (isNaN(nextExp)) {
            if (this.dom.expFill) this.dom.expFill.style.width = '100%';
            if (this.dom.expBarLabel) this.dom.expBarLabel.textContent = 'MAX — Директор филиала';
            this.updatePostMaxExpBar(); return;
        }
        const pct = nextExp > 0 ? Math.max(0, Math.min(100, this.experience / nextExp * 100)) : 0;
        if (this.dom.expFill) this.dom.expFill.style.width = pct + '%';
        if (this.dom.expBarLabel) this.dom.expBarLabel.textContent = `${formatNumber(Math.floor(this.experience))} / ${formatNumber(nextExp)}`;
        this.updatePostMaxExpBar();
    }

    updatePostMaxExpBar() {
        const isMax = this.careerLevel >= CAREERS.length - 1;
        if (!this.dom.postMaxExpBar) return;
        this.dom.postMaxExpBar.style.display = isMax ? 'block' : 'none';
        if (!isMax) return;
        const pct = this.experienceAfterMaxThreshold > 0 ? Math.max(0, Math.min(100, this.experienceAfterMax / this.experienceAfterMaxThreshold * 100)) : 0;
        if (this.dom.postMaxExpFill) this.dom.postMaxExpFill.style.width = pct + '%';
        if (this.dom.postMaxExpBarLabel) this.dom.postMaxExpBarLabel.textContent = `После максимума: ${formatNumber(Math.floor(this.experienceAfterMax))} / ${formatNumber(this.experienceAfterMaxThreshold)}`;
    }

    updatePeaceUI() {
        const unlocked = this.isPeaceUnlocked();
        if (this.dom.peaceDisplay) this.dom.peaceDisplay.style.display = unlocked ? '' : 'none';
        if (this.dom.peaceBar) this.dom.peaceBar.style.display = unlocked ? '' : 'none';
        if (this.dom.peaceHint) this.dom.peaceHint.style.display = unlocked ? '' : 'none';
        if (!unlocked) return;

        const peace = Math.max(0, Math.min(100, this.peace));
        if (this.dom.peaceValue) this.dom.peaceValue.textContent = peace.toFixed(1);
        if (this.dom.peaceFill) this.dom.peaceFill.style.width = peace + '%';

        const idleSeconds = Math.max(0, (Date.now() - this.lastActionTime) / 1000);
        const remaining = Math.max(0, 60 - idleSeconds);
        if (this.dom.peaceHint) {
            if (remaining > 0) this.dom.peaceHint.textContent = `Покой начнёт расти через ${Math.ceil(remaining)}с без действий. Бонус дохода: +${formatNumber(peace * 3)}%.`;
            else this.dom.peaceHint.textContent = `Покой восстанавливается. Бонус дохода: +${formatNumber(peace * 3)}%.`;
        }
    }

    updateYogaUI() {
        const visible = this.hasYogaAccess();
        if (this.dom.yogaShop) this.dom.yogaShop.style.display = visible ? 'flex' : 'none';
        if (this.dom.buyAllButton) this.dom.buyAllButton.style.display = this.hasGovProcurement() ? '' : 'none';
        if (!visible) return;

        if (this.dom.yogaLvl) this.dom.yogaLvl.textContent = this.yogaLevel;

        // Иконка красится по уровню улучшения йоги, как у зала/курсов
        const iconColor = this.yogaUpgradeLevel === 0 ? 'gray' : UPGRADE_COLORS[(this.yogaUpgradeLevel - 1) % UPGRADE_COLORS.length];
        if (this.dom.yogaIcon) this.dom.yogaIcon.style.backgroundColor = iconColor;

        let displayQuantity = this.buyAmount;
        let displayCost;
        let disabled;
        if (this.buyAmount === -1) {
            displayQuantity = this.getMaxAffordableYoga();
            if (displayQuantity === 0) {
                displayCost = this.getYogaBulkCost(1);
                disabled = true;
            } else {
                displayCost = this.getYogaBulkCost(displayQuantity);
                disabled = this.count < displayCost;
            }
        } else {
            displayCost = this.getYogaBulkCost(this.buyAmount);
            disabled = this.count < displayCost;
        }

        if (this.dom.yogaCost) this.dom.yogaCost.textContent = formatNumber(displayCost);

        if (this.dom.buyYogaButton) {
            let btnText;
            if (this.buyAmount === -1) {
                btnText = displayQuantity > 0
                    ? `Занятие макс (${displayQuantity}) (Цена: ${formatNumber(displayCost)})`
                    : `Занятие макс (0) (Цена за 1: ${formatNumber(displayCost)})`;
            } else if (this.buyAmount === 1) {
                btnText = `Занятие (${formatNumber(displayCost)})`;
            } else {
                btnText = `Занятие x${this.buyAmount} (${formatNumber(displayCost)})`;
            }
            this.dom.buyYogaButton.innerHTML = btnText;
            this.dom.buyYogaButton.disabled = disabled;
        }

        const upgradePrice = this.getYogaUpgradePrice();
        if (this.dom.yogaUpgradeLvl) this.dom.yogaUpgradeLvl.textContent = this.yogaUpgradeLevel;
        if (this.dom.yogaUpgradePrice) this.dom.yogaUpgradePrice.textContent = upgradePrice === null ? '—' : formatNumber(upgradePrice);
        if (this.dom.upgradeYogaButton) this.dom.upgradeYogaButton.disabled = upgradePrice === null || this.count < upgradePrice;
    }

    // +++ НОВОЕ: обновление визуала "наливающейся" чашки кофе +++
    updateCoffeeCup() {
        const ready = this.coffeePour <= 0;
        const fillPercent = ready
            ? 100
            : Math.max(0, 100 - (this.coffeePour / this.getCoffeePourDuration()) * 100);

        if (this.dom.coffeeCupFill) {
            this.dom.coffeeCupFill.style.height = fillPercent + '%';
            this.dom.coffeeCupFill.classList.toggle('ready', ready);
        }
        if (this.dom.coffeeCupLabel) {
            this.dom.coffeeCupLabel.textContent = ready
                ? 'Готово ☕'
                : `Наливается... ${Math.ceil(this.coffeePour)}с`;
        }
    }

    updateUpgradeUI(b) {
        const next = b.getUpgradeData(b.upgradeLevel + 1);

        if (b.upgradeLevel === 0) {
            if (b.dom.icon) b.dom.icon.style.backgroundColor = 'gray';
        } else {
            const current = b.getUpgradeData(b.upgradeLevel);
            if (b.dom.icon && current) b.dom.icon.style.backgroundColor = current.color;
        }

        if (b.dom.upgradeLvl) b.dom.upgradeLvl.textContent = b.upgradeLevel;

        if (next) {
            if (b.dom.multPrice) b.dom.multPrice.textContent = formatNumber(next.price);
            const canAfford = this.count >= next.price;
            const available = next.available;
            if (b.dom.multBtn) {
                b.dom.multBtn.disabled = !(available && canAfford);
                b.dom.multBtn.style.backgroundColor = next.color;
                b.dom.multBtn.innerHTML = `Улучшить (${formatNumber(next.price)})`;
                if (!available) {
                    b.dom.multBtn.innerHTML = `Улучшить (требуется ${next.required} зданий)`;
                    b.dom.multBtn.disabled = true;
                }
            }
        } else {
            if (b.dom.multPrice) b.dom.multPrice.textContent = '∞';
            if (b.dom.multBtn) {
                b.dom.multBtn.disabled = true;
                b.dom.multBtn.innerHTML = 'MAX';
            }
        }
    }

    // +++ НОВОЕ: обновление UI улучшений для зала/курсов (иконка + кнопка, без требований по уровню) +++
    updateHobbyUpgradeUI(b) {
        const price = b.getHobbyUpgradePrice();
        if (price === null) return;

        const color = b.upgradeLevel === 0 ? 'gray' : UPGRADE_COLORS[(b.upgradeLevel - 1) % UPGRADE_COLORS.length];
        if (b.dom.icon) b.dom.icon.style.backgroundColor = color;
        if (b.dom.upgradeLvl) b.dom.upgradeLvl.textContent = b.upgradeLevel;

        const canAfford = this.count >= price;
        if (b.dom.multPrice) b.dom.multPrice.textContent = formatNumber(price);
        if (b.dom.multBtn) {
            b.dom.multBtn.disabled = !canAfford;
            b.dom.multBtn.style.backgroundColor = color;
            b.dom.multBtn.innerHTML = `Улучшить (${formatNumber(price)})`;
        }
    }

    updateBuildingUI(b, totalPassive) {
        if (b.dom.lvl) b.dom.lvl.textContent = b.level;

        let displayQuantity = this.buyAmount;
        let displayCost;
        let disabled;

        if (this.buyAmount === -1) {
            displayQuantity = b.getMaxAffordable(this.count);
            if (displayQuantity === 0) {
                displayCost = b.getBulkCost(1);
                disabled = true;
            } else {
                displayCost = b.getBulkCost(displayQuantity);
                disabled = this.count < displayCost;
            }
        } else {
            displayCost = b.getBulkCost(this.buyAmount);
            disabled = this.count < displayCost;
        }

        if (b.dom.cost) b.dom.cost.textContent = formatNumber(displayCost);

        if (b.dom.btn) {
            let btnText;
            if (this.buyAmount === -1) {
                if (displayQuantity > 0) {
                    btnText = `Купить макс (${displayQuantity}) (Цена: ${formatNumber(displayCost)})`;
                } else {
                    btnText = `Купить макс (0) (Цена за 1: ${formatNumber(displayCost)})`;
                }
            } else if (this.buyAmount === 1) {
                btnText = `Купить (Цена: ${formatNumber(displayCost)})`;
            } else {
                btnText = `Купить x${this.buyAmount} (Цена: ${formatNumber(displayCost)})`;
            }
            b.dom.btn.innerHTML = btnText;
            b.dom.btn.disabled = disabled;
        }

        if (b.stats.upgradeType) {
            this.updateUpgradeUI(b);
        } else if (b.stats.hobbyUpgrade) {
            this.updateHobbyUpgradeUI(b);
        }

        if (b.stats.clickPower && b.dom.info) {
            b.dom.info.textContent = `Вклад в клик: +${formatNumber(this.clickComponents[b.id] || 0)}`;
        }
        if (b.stats.cps && b.dom.info) {
            const val = this.passiveComponents[b.id] || 0;
            const pct = totalPassive > 0 ? (val / totalPassive * 100).toFixed(1) : '0.0';
            b.dom.info.textContent = `CPS: ${formatNumber(val)} (${pct}%)`;
        }
        // +++ НОВОЕ: сколько опыта в итоге даёт клик (Курсы) +++
        if (b.stats.special === 'course' && b.dom.info) {
            b.dom.info.textContent = `Опыт за клик: +${formatNumber(this.getExpPerClick())}`;
        }
    }

    updateVisibility() {
        for (const b of this.buildings.values()) {
            if (!b.dom.shop) continue;
            if (b.stats.alwaysVisible) {
                b.dom.shop.style.display = 'flex';
            } else if (b.id === 'dataCenter') {
                // Дата-центр открывается при накоплении 10 Qa (10e15)
                if (b.level > 0 || this.count >= 10e15) {
                    b.dom.shop.style.display = 'flex';
                } else {
                    b.dom.shop.style.display = 'none';
                }
            } else {
                const costOne = b.getBulkCost(1);
                if (b.level > 0 || this.count >= costOne * 0.1) {
                    b.dom.shop.style.display = 'flex';
                } else {
                    b.dom.shop.style.display = 'none';
                }
            }
        }
    }

    updateUI() {
        try {
            this.updateStats();

            this.dom.counter.textContent = formatNumber(Math.floor(this.count));
            this.dom.cpsDisplay.textContent = formatNumber(this.passiveIncome);
            this.dom.clickPowerDisplay.textContent = formatNumber(this.clickPower);

            this.stress = Math.max(0, Math.min(100, this.stress));
            this.dom.stressValue.textContent = Math.floor(this.stress);
            this.dom.stressFill.style.width = this.stress + '%';

            const stress = this.stress;
            let color = '';
            if (stress >= 100) {
                color = '#8B0000';
            } else if (stress > 70) {
                color = '#FF0000';
            } else if (stress > 30) {
                color = '#FFA500';
            }
            this.dom.clickPowerDisplay.style.color = color;
            this.dom.cpsDisplay.style.color = color;

            const totalCareers = CAREERS.length;
            const mult = CAREERS[this.careerLevel].clickMult;
            if (this.dom.careerCount) this.dom.careerCount.textContent = `(${this.careerLevel + 1}/${totalCareers})`;
            if (this.dom.careerName) this.dom.careerName.textContent = CAREERS[this.careerLevel].title;
            if (this.dom.careerMult) this.dom.careerMult.textContent = `×${formatNumber(mult)}`;

            this.updateExpBar();
            this.updatePeaceUI();
            this.updateYogaUI();
            if (this.dom.globalIncomeDisplay) this.dom.globalIncomeDisplay.textContent = this.isPeaceUnlocked() ? `Глобальный доход: ×${formatNumber(this.globalIncomeMultiplier)} · Покой +${formatNumber(this.peace * 3)}%` : `Глобальный доход: ×${formatNumber(this.globalIncomeMultiplier)}`;
            this.dom.prestigePoints.textContent = formatNumber(this.prestigePoints);
            this.updateMasteryTabs();

            this.updateCoffeeEffect();

            if (this.count >= 200e9) {
                this.prestigeUnlocked = true;
            }
            if (this.dom.prestigeSection) {
                this.dom.prestigeSection.style.display = this.prestigeUnlocked ? 'block' : 'none';
            }

            const totalPassive = Object.values(this.passiveComponents).reduce((a, b) => a + b, 0);
            for (const b of this.buildings.values()) {
                this.updateBuildingUI(b, totalPassive);
            }

            this.dom.coffeeButton.disabled = this.count < this.coffeeCost || this.coffeePour > 0;
            this.dom.coffeeCostText.textContent = formatNumber(this.coffeeCost);
            this.updateCoffeeCup();

            const canPrestige = this.careerLevel >= CAREERS.length - 1 && this.totalEarnedThisPrestige >= PRESTIGE_COST_PER_SHARE;
            this.dom.prestigeButton.disabled = !canPrestige;
            const base = Math.max(0, this.totalEarnedThisPrestige);
            const shares = this.getPrestigeEarned(base);
            const requiredCareerTitle = CAREERS[CAREERS.length - 1].title;
            this.dom.prestigeInfo.textContent = `Требуется должность: ${requiredCareerTitle}. Сейчас вы получите ${formatNumber(shares)} KPI.`;

            // +++ НОВОЕ: если описание бонусов KPI открыто — держим его актуальным +++
            if (this.dom.prestigeKpiDetails && this.dom.prestigeKpiDetails.style.display !== 'none') {
                this.updateKpiDetails();
            }

            this.dom.cheatClickMultDisplay.textContent = this.cheat.click;
            this.dom.cheatPassiveMultDisplay.textContent = this.cheat.passive;
            this.dom.cheatExpMultDisplay.textContent = this.cheat.exp;

            this.updateUpgradeElements();
            this.updateVisibility();
        } catch (e) {
            console.error('Ошибка в updateUI:', e);
        }
    }

    // +++ ИЗМЕНЕНО: убран двойной штраф для пассивного дохода +++
    gameLoop() {
        try {
            const now = Date.now();
            const delta = (now - this.lastUpdateTime) / 1000;
            this.lastUpdateTime = now;

            if (this.stressLocked) {
                this.stressLockTimer -= delta;
                if (this.stressLockTimer <= 0) {
                    this.stressLocked = false;
                    this.stressLockTimer = 0;
                }
            }

            if (this.buffLevel > 0) {
                this.buffTimer -= delta;
                if (this.buffTimer <= 0) {
                    this.buffLevel = 0;
                    this.buffTimer = 0;
                }
            }

            if (this.debuffActive) {
                this.debuffTimer -= delta;
                if (this.debuffTimer <= 0) {
                    this.debuffActive = false;
                    this.debuffTimer = 0;
                }
            }

            // +++ НОВОЕ: обратный отсчёт до готовности следующей чашки кофе +++
            if (this.coffeePour > 0) {
                this.coffeePour -= delta;
                if (this.coffeePour < 0) this.coffeePour = 0;
            }

            this.updatePeace(delta);

            if (this.stress < 100) {
                // passiveIncome уже включает штраф от стресса
                const earned = this.passiveIncome * delta;
                this.count += earned;
                this.totalEarnedThisPrestige += earned;
            }

            this.updateStress(delta);
            this.updateUI();
        } catch (e) {
            console.error('Ошибка в gameLoop:', e);
        }

        setTimeout(() => this.gameLoop(), 100);
    }

    start() {
        // +++ НОВОЕ: считаем и начисляем офлайн-доход до первой отрисовки +++
        applyOfflineEarnings(this);

        this.updateUI();
        this.gameLoop();

        // +++ НОВОЕ: автосохранение по таймеру и перед закрытием вкладки +++
        setInterval(() => {
            saveGame(this);
            updateSaveStatus(this);
        }, AUTOSAVE_INTERVAL_MS);

        window.addEventListener('beforeunload', () => saveGame(this));
        window.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden') saveGame(this);
        });

        console.log('Игра запущена! Стресс будет уменьшаться со временем.');
    }
}



// ================================================================
// ДОБАВЛЕННЫЙ UI-ЛОЙ: разделы магазина, карточки мастерства,
// достижения. Игровая логика и существующие методы не изменяются.
// ================================================================

// Карточки глобальных улучшений в стиле достижений.
Game.prototype.updateMasteryTabs = function () {
    const prestigeUnlocked = this.prestigePoints > 0;
    if (!prestigeUnlocked && this.masteryTab === 'prestige') this.masteryTab = 'cycle';

    document.querySelectorAll('.mastery-tab').forEach(btn => {
        const tab = btn.dataset.masteryTab;
        btn.classList.toggle('active', tab === this.masteryTab);
        if (tab === 'prestige') {
            btn.style.display = prestigeUnlocked ? '' : 'none';
        }
    });

    if (this.dom.upgradesContainer) {
        this.dom.upgradesContainer.style.display = this.masteryTab === 'cycle' ? 'contents' : 'none';
    }
    if (this.dom.prestigeUpgradesContainer) {
        this.dom.prestigeUpgradesContainer.style.display = this.masteryTab === 'prestige' ? 'contents' : 'none';
    }
};

Game.prototype.createUpgradeElements = function () {
    const cycleContainer = this.dom.upgradesContainer;
    const prestigeContainer = this.dom.prestigeUpgradesContainer;
    if (!cycleContainer || !prestigeContainer) return;

    cycleContainer.innerHTML = '';
    prestigeContainer.innerHTML = '';
    this.upgradeElements = [];

    const renderUpgrade = (u, index, target) => {
        const card = document.createElement('article');
        card.className = `mastery-card${u.prestige ? ' prestige-card' : ''}`;
        card.dataset.id = u.id; card.dataset.index = index;
        card.innerHTML = `<div class="mastery-card-icon">${u.icon}</div><div class="mastery-card-content"><span class="mastery-card-tag" data-prestige-tag>${u.prestige ? '[Престиж]' : ''}</span><div class="mastery-card-title">${u.name}</div><div class="mastery-card-description">${u.description}</div><div class="mastery-card-effect" data-effect></div></div><div class="mastery-card-footer"><span class="mastery-card-price" data-price></span><button class="mastery-buy-btn" type="button" data-buy>Купить</button></div>`;
        card.querySelector('[data-buy]').addEventListener('click', e => { e.stopPropagation(); card.classList.add('pressed'); setTimeout(() => card.classList.remove('pressed'), 180); this.purchaseUpgradeItem(index); });
        target.appendChild(card);
        this.upgradeElements[index] = card;
    };

    this.upgrades.forEach((u, index) => {
        renderUpgrade(u, index, u.prestige ? prestigeContainer : cycleContainer);
    });
    this.updateMasteryTabs();
};

Game.prototype.canAffordUpgrade = function (u) { return u.currency === 'kpi' ? this.prestigePoints >= u.price : this.count >= u.price; };
Game.prototype.updateUpgradeElements = function () {
    this.upgrades.forEach((u, index) => {
        const el = this.upgradeElements[index]; if (!el) return;
        const unlocked = u.prestige ? this.prestigePoints > 0 : (u.revealed || !u.unlockCondition || u.unlockCondition(this));
        if (unlocked) u.revealed = true;
        const currentTab = u.prestige ? 'prestige' : 'cycle';
        const visible = unlocked && currentTab === this.masteryTab;
        el.style.display = visible ? '' : 'none';
        el.classList.toggle('purchased', u.purchased);
        el.classList.toggle('unaffordable', !u.purchased && !this.canAffordUpgrade(u));
        const tag = el.querySelector('[data-prestige-tag]'), price = el.querySelector('[data-price]'), effect = el.querySelector('[data-effect]'), buy = el.querySelector('[data-buy]');
        if (tag) tag.style.display = u.prestige ? 'inline-block' : 'none';
        if (u.purchased) { price.textContent = '✓ Куплено'; buy.textContent = 'Куплено'; buy.disabled = true; effect.textContent = u.effectText ? `Сейчас: ${u.effectText(this)}` : 'Способность активна'; }
        else { price.textContent = `Цена: ${formatNumber(u.price)} ${u.currency === 'kpi' ? 'KPI' : 'монет'}`; buy.textContent = 'Купить'; buy.disabled = !this.canAffordUpgrade(u); effect.textContent = u.prestige ? 'Престижное улучшение — сохраняется после престижа.' : ''; }
    });
    this.updateMasteryTabs();
};

function initShopSectionsUI() {
    const container = document.querySelector('.shop-container');
    if (!container) return;
    const tabs = [...container.querySelectorAll('.shop-section-tab')];
    const panels = [...container.querySelectorAll('[data-shop-section-panel]')];

    const open = (id) => {
        container.classList.add('section-open');
        tabs.forEach(t => t.classList.toggle('active', t.dataset.shopSection === id));
        panels.forEach(p => p.classList.toggle('active', p.dataset.shopSectionPanel === id));

        // +++ НОВОЕ: уведомление при первом открытии вкладки «Мастерство» +++
        if (id === 'mastery') {
            notificationManager.notify({
                id: 'mastery-tab-first-open',
                once: true,
                icon: '✨',
                title: 'Раздел «Мастерство»',
                sound: 'info',
                text: 'Здесь появляются постоянные улучшения — они открываются по мере роста бизнеса и остаются активными до конца текущего цикла (а престижные — навсегда).'
            });
        }
    };
    const close = () => {
        container.classList.remove('section-open');
        tabs.forEach(t => t.classList.remove('active'));
        panels.forEach(p => p.classList.remove('active'));
    };

    tabs.forEach(t => t.addEventListener('click', () => open(t.dataset.shopSection)));
    container.querySelectorAll('[data-shop-back]').forEach(b => b.addEventListener('click', close));
    close();
}

function initAchievementsUI(game) {
    const modal = document.getElementById('achievementsModal');
    const list = document.getElementById('achievementsList');
    const button = document.getElementById('achievementsButton');
    const close = document.getElementById('achievementsClose');
    const progress = document.getElementById('achievementsProgress');
    if (!modal || !list || !button) return;

    const achievements = [
        { icon: '👣', name: 'Первый шаг', description: 'Нажать кнопку «Работать!» хотя бы один раз.', check: g => g.count > 0 || g.experience > 0 },
        { icon: '💼', name: 'Карьерист', description: 'Получить должность не ниже менеджера.', check: g => g.careerLevel >= 3 },
        { icon: '👥', name: 'Начальник', description: 'Купить хотя бы одну единицу пассивного дохода.', check: g => ['staff', 'auto', 'robot', 'ai', 'processing', 'office'].some(id => (g.buildings.get(id)?.level || 0) > 0) },
        { icon: '😵', name: 'Предел возможностей', description: 'Достичь 100% стресса.', check: g => g.hasReached100Stress === true },
        { icon: '✨', name: 'Мастер своего дела', description: 'Купить хотя бы одно улучшение Мастерства.', check: g => g.upgrades.some(u => u.purchased) },
        { icon: '🚀', name: 'Корпорация', description: 'Совершить престиж.', check: g => g.prestigePoints > 0 },
        { icon: '☕', name: 'Любитель кофе', description: 'Выпить 15 чашек кофе подряд без кликов «Работать!».', check: g => g.coffeeLoverAchievementUnlocked === true || g.coffeeStreak >= COFFEE_STREAK_REQUIRED },
    ];

    list.innerHTML = '';
    const els = achievements.map(a => {
        const el = document.createElement('article');
        el.className = 'achievement-card locked';
        el.innerHTML = `<div class="achievement-icon">${a.icon}</div><div class="achievement-body"><strong>${a.name}</strong><span>${a.description}</span></div><div class="achievement-status">🔒</div>`;
        list.appendChild(el);
        return el;
    });

    let achievementsInitialized = false;
    const previousStates = new Map();

    const refresh = () => {
        let unlocked = 0;

        achievements.forEach((achievement, index) => {
            const done = !!achievement.check(game);
            const key = achievement.name;
            const wasDone = previousStates.get(key) === true;

            if (done) {
                unlocked++;
            }

            // Toast появляется только в момент получения достижения,
            // а не при каждой проверке состояния.
            if (achievementsInitialized && done && !wasDone) {
                playAchievementSound();
                showToast({
                    icon: achievement.icon,
                    text: `Достижение получено: ${achievement.name}`,
                    type: 'success',
                    duration: 3500
                });
            }

            previousStates.set(key, done);

            els[index].classList.toggle('unlocked', done);
            els[index].classList.toggle('locked', !done);

            const status = els[index].querySelector('.achievement-status');
            if (status) {
                status.textContent = done ? '✓' : '🔒';
            }
        });

        progress.textContent = `${unlocked} / ${achievements.length}`;
        achievementsInitialized = true;
    };

    const setOpen = (value) => {
        modal.classList.toggle('open', value);
        modal.setAttribute('aria-hidden', value ? 'false' : 'true');
        if (value) refresh();
    };
    button.addEventListener('click', () => setOpen(true));
    close?.addEventListener('click', () => setOpen(false));
    modal.addEventListener('click', e => { if (e.target.matches('[data-close-achievements]')) setOpen(false); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') setOpen(false); });
    refresh();
    setInterval(refresh, 500);
}

function initAddedUI(game) {
    initShopSectionsUI();
    initAchievementsUI(game);
}

// Запускаем только добавленные интерфейсные функции после существующей инициализации.

// ======================= ЗАПУСК =======================
document.addEventListener('DOMContentLoaded', () => {
    const game = new Game();
    game.start();
    initAddedUI(game);
});