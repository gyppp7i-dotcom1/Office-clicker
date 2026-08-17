// ======================= УТИЛИТЫ =======================
const suffixes = [
    '', ' К', ' М', ' В', ' Т', ' Qa', ' Qi',
    ' Sx', ' Sp', ' Oc', ' No', ' Dc'
];
// ======================= ПЕРЕКЛЮЧЕНИЕ ТЕМЫ =======================
document.addEventListener('DOMContentLoaded', () => {
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

function formatNumber(num) {
    if (num < 0) return '-' + formatNumber(-num);
    if (num < 1000) {
        if (Number.isInteger(num)) return num.toString();
        return num.toFixed(1).replace(/\.0$/, '');
    }
    let tier = Math.floor(Math.log10(num) / 3);
    if (tier >= suffixes.length) tier = suffixes.length - 1;
    const value = num / Math.pow(10, tier * 3);
    return value.toFixed(2).replace(/\.00$/, '').replace(/\.0$/, '') + suffixes[tier];
}

// ======================= КОНФИГУРАЦИЯ =======================
const CAREERS = [
    { title: "Стажёр", clickMult: 1, nextExp: 500 },
    { title: "Специалист", clickMult: 2, nextExp: 1200 },
    { title: "Старший специалист", clickMult: 4, nextExp: 2500 },
    { title: "Менеджер", clickMult: 8, nextExp: 5000 },
    { title: "Старший менеджер", clickMult: 16, nextExp: 11000 },
    { title: "Заместитель руководителя отдела", clickMult: 32, nextExp: 25000 },
    { title: "Руководитель отдела", clickMult: 64, nextExp: 55000 },
    { title: "Заместитель начальника управления", clickMult: 128, nextExp: 120000 },
    { title: "Начальник управления", clickMult: 256, nextExp: 250000 },
    { title: "Советник директора", clickMult: 512, nextExp: 500000 },
    { title: "Заместитель директора", clickMult: 1024, nextExp: 1000000 },
    { title: "Первый заместитель директора", clickMult: 2048, nextExp: 2000000 },
    { title: "Директор филиала", clickMult: 4096, nextExp: NaN }
];

const UPGRADE_THRESHOLDS = [10, 25, 50, 75, 100, 150, 200];
const UPGRADE_COLORS = ['gray', 'green', 'blue', 'purple', 'gold', 'red'];
const UPGRADE_MULTS = [2, 2.5, 2, 2, 2.5, 2, 2];

const UPGRADE_TYPE_PARAMS = {
    standard: { upto: 35, after: 50 },
    ai: { upto: 110, after: 150 },
    processing: { upto: 160, after: 210 },
    office: { upto: 168, after: 221 },
    aiComputer: { upto: 168, after: 221 }
};

const COFFEE_COST_MULT = 1.03;
const COFFEE_STRESS_REDUCTION = 15;
const BUFF_DURATION = 35;
const DEBUFF_DURATION = 45;
const DEBUFF_MALUS = 0.50;
const DEBUFF_STRESS_MULT = 2;
const PRESTIGE_COST_PER_SHARE = 10 ** 12;

const STRESS_DECAY_BASE = 0.5;
const STRESS_DECAY_GYM_BONUS = 0.10;

const BUILDINGS = {
    equip: {
        name: 'Оборудование', icon: '🖥', baseCost: 100, costMult: 1.12, clickPower: 0.5,
        upgradeType: 'standard', alwaysVisible: true,
        dom: { lvl: 'equipLvl', cost: 'equipCost', btn: 'upgradeEquip', multBtn: 'upgradeEquipMult', multPrice: 'equipMultPrice', upgradeLvl: 'equipUpgradeLvl', icon: 'equipIcon', info: 'equipClickInfo', shop: 'shop-equip' }
    },
    coffeeMachine: {
        name: 'Кофе-машина', icon: '☕', baseCost: 500, costMult: 1.14, clickPower: 2,
        upgradeType: 'standard', alwaysVisible: true,
        dom: { lvl: 'coffeeMachineLvl', cost: 'coffeeMachineCost', btn: 'upgradeCoffeeMachine', multBtn: 'upgradeCoffeeMachineMult', multPrice: 'coffeeMachineMultPrice', upgradeLvl: 'coffeeMachineUpgradeLvl', icon: 'coffeeMachineIcon', info: 'coffeeClickInfo', shop: 'shop-coffee' }
    },
    secretary: {
        name: 'Личный секретарь', icon: '👔', baseCost: 2000, costMult: 1.15, clickPower: 8,
        upgradeType: 'standard',
        dom: { lvl: 'secretaryLvl', cost: 'secretaryCost', btn: 'upgradeSecretary', multBtn: 'upgradeSecretaryMult', multPrice: 'secretaryMultPrice', upgradeLvl: 'secretaryUpgradeLvl', icon: 'secretaryIcon', info: 'secretaryClickInfo', shop: 'shop-secretary' }
    },
    aiComputer: {
        name: 'AI-ЭВМ', icon: '🖥️', baseCost: 35e8, costMult: 1.52, clickPower: 50000,
        upgradeType: 'aiComputer',
        dom: { lvl: 'aiComputerLvl', cost: 'aiComputerCost', btn: 'upgradeAIComputer', multBtn: 'upgradeAIComputerMult', multPrice: 'aiComputerMultPrice', upgradeLvl: 'aiComputerUpgradeLvl', icon: 'aiComputerIcon', info: 'aiComputerClickInfo', shop: 'shop-aiComputer' }
    },
    staff: {
        name: 'Персонал', icon: '👥', baseCost: 150, costMult: 1.11, cps: 1,
        upgradeType: 'standard', alwaysVisible: true,
        dom: { lvl: 'staffLvl', cost: 'staffCost', btn: 'upgradeStaff', multBtn: 'upgradeStaffMult', multPrice: 'staffMultPrice', upgradeLvl: 'staffUpgradeLvl', icon: 'staffIcon', info: 'staffCpsInfo', shop: 'shop-staff' }
    },
    auto: {
        name: 'Отдел автоматизации', icon: '🤖', baseCost: 800, costMult: 1.13, cps: 5,
        upgradeType: 'standard',
        dom: { lvl: 'autoLvl', cost: 'autoCost', btn: 'upgradeAuto', multBtn: 'upgradeAutoMult', multPrice: 'autoMultPrice', upgradeLvl: 'autoUpgradeLvl', icon: 'autoIcon', info: 'autoCpsInfo', shop: 'shop-auto' }
    },
    robot: {
        name: 'Роботы-помощники', icon: '🦾', baseCost: 4000, costMult: 1.134, cps: 20,
        upgradeType: 'standard',
        dom: { lvl: 'robotLvl', cost: 'robotCost', btn: 'upgradeRobot', multBtn: 'upgradeRobotMult', multPrice: 'robotMultPrice', upgradeLvl: 'robotUpgradeLvl', icon: 'robotIcon', info: 'robotCpsInfo', shop: 'shop-robot' }
    },
    ai: {
        name: 'AI-ассистент', icon: '🧠', baseCost: 70000, costMult: 1.35, cps: 300,
        upgradeType: 'ai',
        dom: { lvl: 'aiLvl', cost: 'aiCost', btn: 'upgradeAI', multBtn: 'upgradeAIMult', multPrice: 'aiMultPrice', upgradeLvl: 'aiUpgradeLvl', icon: 'aiIcon', info: 'aiCpsInfo', shop: 'shop-ai' }
    },
    processing: {
        name: 'Отдел обработки', icon: '⚙️', baseCost: 1.5e6, costMult: 1.45, cps: 7000,
        upgradeType: 'processing',
        dom: { lvl: 'processingLvl', cost: 'processingCost', btn: 'upgradeProcessing', multBtn: 'upgradeProcessingMult', multPrice: 'processingMultPrice', upgradeLvl: 'processingUpgradeLvl', icon: 'processingIcon', info: 'processingCpsInfo', shop: 'shop-processing' }
    },
    office: {
        name: 'Собственный офис', icon: '🏢', baseCost: 1e10, costMult: 1.51, cps: 400000,
        upgradeType: 'office',
        dom: { lvl: 'officeLvl', cost: 'officeCost', btn: 'upgradeOffice', multBtn: 'upgradeOfficeMult', multPrice: 'officeMultPrice', upgradeLvl: 'officeUpgradeLvl', icon: 'officeIcon', info: 'officeCpsInfo', shop: 'shop-office' }
    },
    gym: {
        name: 'Спортзал', icon: '🏋️', baseCost: 1000, costMult: 10, special: 'gym', alwaysVisible: true,
        dom: { lvl: 'gymLvl', cost: 'gymCost', btn: 'upgradeGym', shop: 'shop-gym' }
    },
    course: {
        name: 'Курсы', icon: '📚', baseCost: 500, costMult: 4, special: 'course', alwaysVisible: true,
        dom: { lvl: 'courseLvl', cost: 'courseCost', btn: 'upgradeCourse', shop: 'shop-course' }
    }
};

// ======================= КЛАСС BUILDING =======================
class Building {
    constructor(id, stats) {
        this.id = id;
        this.stats = stats;
        this.level = 0;
        this.upgradeLevel = 0;

        this.dom = {};
        if (stats.dom) {
            for (const [key, val] of Object.entries(stats.dom)) {
                this.dom[key] = document.getElementById(val);
                if (!this.dom[key] && key !== 'info' && key !== 'multPrice' && key !== 'upgradeLvl' && key !== 'icon') {
                    console.warn(`Элемент с id "${val}" не найден для здания "${id}"`);
                }
            }
        }
    }

    getBulkCost(quantity) {
        const { baseCost, costMult } = this.stats;
        return Math.ceil(baseCost * (costMult ** this.level) * ((costMult ** quantity - 1) / (costMult - 1)));
    }

    getMaxAffordable(money) {
        if (money < this.getBulkCost(1)) return 0;
        let max = 1;
        while (this.getBulkCost(max * 2) <= money && max < 100000) {
            max *= 2;
        }
        while (this.getBulkCost(max + 1) <= money && max < 100000) {
            max++;
        }
        return max;
    }

    getSourceMultiplier() {
        let mult = 1;
        for (let i = 1; i <= this.upgradeLevel; i++) {
            if (i <= UPGRADE_THRESHOLDS.length) {
                mult *= UPGRADE_MULTS[i - 1];
            } else {
                mult *= 2;
            }
        }
        return mult;
    }

    getUpgradeData(targetLvl = this.upgradeLevel + 1) {
        let lvl = targetLvl;
        if (lvl === 0) lvl = 1;
        if (lvl < 1) return null;

        const { baseCost, upgradeType } = this.stats;
        const params = UPGRADE_TYPE_PARAMS[upgradeType] || UPGRADE_TYPE_PARAMS.standard;
        const basePrice = baseCost * 10;

        let required;
        if (lvl <= UPGRADE_THRESHOLDS.length) {
            required = UPGRADE_THRESHOLDS[lvl - 1];
        } else {
            required = UPGRADE_THRESHOLDS[UPGRADE_THRESHOLDS.length - 1];
        }

        let price;
        if (lvl <= UPGRADE_THRESHOLDS.length) {
            price = basePrice * 10 * Math.pow(params.upto, lvl - 1);
        } else {
            price = basePrice * 10 * Math.pow(params.upto, UPGRADE_THRESHOLDS.length - 1) * Math.pow(params.after, lvl - UPGRADE_THRESHOLDS.length);
        }
        price = Math.ceil(price);

        let mult;
        if (lvl <= UPGRADE_THRESHOLDS.length) {
            mult = UPGRADE_MULTS[lvl - 1];
        } else {
            mult = 2;
        }

        let color;
        if (required === 75) {
            color = 'brown';
        } else if (required === 150) {
            color = 'pink';
        } else if (required >= 200) {
            color = 'red';
        } else {
            const colorIndex = lvl % UPGRADE_COLORS.length;
            color = UPGRADE_COLORS[colorIndex];
        }

        return {
            level: lvl,
            required,
            available: this.level >= required,
            price,
            mult,
            color
        };
    }
}

// ======================= КЛАСС GAME =======================
class Game {
    constructor() {
        this.count = 0;
        this.stress = 0;
        this.experience = 0;
        this.careerLevel = 0;
        this.prestigePoints = 0;
        this.coffeeCost = 20;
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
        this.cacheDOM();
        this.bindEvents();
        this.createTooltip();
        this.createUpgradeElements();
    }

    initBuildings() {
        for (const [id, config] of Object.entries(BUILDINGS)) {
            this.buildings.set(id, new Building(id, config));
        }
    }

    initUpgrades() {
        // ===== ИЗМЕНЕНО: улучшения переставлены в порядке появления =====
        const upgradeDefs = [
            {
                id: 'stressResist1',
                name: 'Стрессоустойчивость I',
                icon: '🛡️',
                description: 'Уменьшает накопление стресса на 30%',
                price: 5000,
                multiplier: 1,
                unlockCondition: (game) => game.hasReached100Stress === true
            },
            {
                id: 'coach',
                name: 'ИИ-коуч',
                icon: '֍',
                description: '+1% к эффективности курсов за каждые 10 лвл AI-ассистентов <br> +5% за каждые 5 AI-ЭВМ',
                price: 20e9,  // 20B
                multiplier: 1,
                unlockCondition: (game) => game.careerLevel >= 5   // 5-я должность: "Заместитель руководителя отдела"
            },
            {
                id: 'emergence',
                name: 'Эмерджентность',
                icon: 'η',
                description: 'Добавляет 1% к доходу за каждые 100 лвл (кроме курсов и зала)',
                price: 1e9,
                multiplier: 1,
                unlockCondition: (game) => game.count >= 200e6
            },
            {
                id: 'emergence2',
                name: 'Эмерджентность II',
                icon: 'η²',
                description: '+1% к доходу за каждое улучшение зданий',
                price: 10e12,           // 10 Т
                multiplier: 1,
                unlockCondition: (game) => game.count >= 500e9   // 500B
            }
        ];
        this.upgrades = upgradeDefs.map(u => ({ ...u, purchased: false, revealed: false }));
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
        this.emergenceMultiplier = 1 + Math.floor(totalLevels / 100) * 0.01;
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

        const bonus = Math.floor(aiLevel / 10) * 0.01   // 1% за каждые 10 уровней AI-ассистента
            + Math.floor(aiComputerLevel / 5) * 0.05; // 5% за каждые 5 уровней AI-ЭВМ

        this.coachMultiplier = 1 + bonus;
    }
    cacheDOM() {
        this.dom = {
            counter: document.getElementById('counter'),
            cpsDisplay: document.getElementById('cpsDisplay'),
            clickPowerDisplay: document.getElementById('clickPowerDisplay'),
            stressValue: document.getElementById('stressValue'),
            stressFill: document.getElementById('stressFill'),
            careerTitle: document.getElementById('careerTitle'),
            expValue: document.getElementById('expValue'),
            expNeed: document.getElementById('expNeed'),
            prestigePoints: document.getElementById('prestigePoints'),
            prestigeInfo: document.getElementById('prestigeInfo'),
            prestigeButton: document.getElementById('prestigeButton'),
            clickButton: document.getElementById('clickButton'),
            coffeeButton: document.getElementById('coffeeButton'),
            coffeeCostText: document.getElementById('coffeeCostText'),
            coffeeEffectContainer: document.getElementById('coffeeEffectContainer'),
            coffeeEffectLabel: document.getElementById('coffeeEffectLabel'),
            coffeeEffectFill: document.getElementById('coffeeEffectFill'),
            cheatInput: document.getElementById('cheatInput'),
            cheatButton: document.getElementById('cheatButton'),
            cheatClickMultDisplay: document.getElementById('cheatClickMultDisplay'),
            cheatPassiveMultDisplay: document.getElementById('cheatPassiveMultDisplay'),
            cheatExpMultDisplay: document.getElementById('cheatExpMultDisplay'),
            upgradesContainer: document.getElementById('upgradesContainer'),
            prestigeSection: document.getElementById('prestigeSection')
        };
        for (const [key, el] of Object.entries(this.dom)) {
            if (!el) console.warn(`DOM элемент "${key}" не найден`);
        }
    }

    createTooltip() {
        const tooltip = document.createElement('div');
        tooltip.id = 'upgradeTooltip';
        tooltip.innerHTML = `
            <div class="tooltip-name"></div>
            <div class="tooltip-desc"></div>
            <div class="tooltip-price"></div>
            <div class="tooltip-status"></div>
        `;
        document.body.appendChild(tooltip);
        this.tooltip = tooltip;
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

            square.addEventListener('mouseenter', (e) => this.showTooltip(e, index));
            square.addEventListener('mousemove', (e) => this.moveTooltip(e));
            square.addEventListener('mouseleave', () => this.hideTooltip());
            square.addEventListener('click', () => {
                square.classList.add('pressed');
                setTimeout(() => square.classList.remove('pressed'), 200);
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

    showTooltip(e, index) {
        const u = this.upgrades[index];
        if (!u || !u.revealed) return;
        const t = this.tooltip;
        if (!t) return;
        const nameEl = t.querySelector('.tooltip-name');
        const descEl = t.querySelector('.tooltip-desc');
        const priceEl = t.querySelector('.tooltip-price');
        const statusEl = t.querySelector('.tooltip-status');

        nameEl.textContent = u.icon + ' ' + u.name;

        // ===== ДОПОЛНЯЕМ ОПИСАНИЕ ДЛЯ ЭМЕРДЖЕНТНОСТИ =====
        let description = u.description;
        if (u.id === 'emergence' && u.purchased) {
            const bonusPercent = ((this.emergenceMultiplier - 1) * 100).toFixed(0);
            description = u.description + '<br>+' + bonusPercent + '%';
        }
        if (u.id === 'emergence2' && u.purchased) {
            const bonusPercent = ((this.emergence2Multiplier - 1) * 100).toFixed(0);
            description = u.description + '<br>+' + bonusPercent + '%';
        }
        if (u.id === 'coach' && u.purchased) {
            const bonusPercent = ((this.coachMultiplier - 1) * 100).toFixed(0);
            description = u.description + '<br>+' + bonusPercent + '%';
        }
        descEl.innerHTML = description; // используем innerHTML, чтобы <br> работал

        if (u.purchased) {
            priceEl.textContent = '✅ Куплено';
            statusEl.textContent = '';
        } else {
            priceEl.textContent = `Цена: ${formatNumber(u.price)}`;
            statusEl.textContent = `Нажмите для покупки`;
        }
        t.style.display = 'block';
        this.updateTooltipPosition(e.clientX, e.clientY);
    }

    moveTooltip(e) {
        if (this.tooltip && this.tooltip.style.display === 'block') {
            this.updateTooltipPosition(e.clientX, e.clientY);
        }
    }

    hideTooltip() {
        if (this.tooltip) this.tooltip.style.display = 'none';
    }

    updateTooltipPosition(x, y) {
        if (!this.tooltip) return;
        const t = this.tooltip;
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

    bindEvents() {
        this.dom.clickButton.addEventListener('click', () => this.handleClick());
        this.dom.coffeeButton.addEventListener('click', () => this.drinkCoffee());
        this.dom.prestigeButton.addEventListener('click', () => this.prestige());
        this.dom.cheatButton.addEventListener('click', () => this.applyCheat());

        for (const [id, b] of this.buildings) {
            if (b.dom.btn) {
                b.dom.btn.addEventListener('click', () => this.purchaseBuilding(id));
            }
            if (b.dom.multBtn) {
                b.dom.multBtn.addEventListener('click', () => this.purchaseUpgrade(id));
            }
        }

        document.querySelectorAll('.quantity-btn').forEach(btn => {
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
                this.updateUI();
            });
        });
        document.querySelector('.quantity-btn')?.classList.add('active');
    }

    getPrestigeBonus() {
        return 1 + (this.prestigePoints * 0.1);
    }

    getCoffeeIncomeMultiplier() {
        if (this.debuffActive) return DEBUFF_MALUS;
        if (this.buffLevel > 0) return 1 + this.buffLevel * 0.10;
        return 1;
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
        const decayRate = STRESS_DECAY_BASE * Math.pow(1.1, gymLvl);
        const decayAmount = decayRate * delta;
        this.stress = Math.max(0, this.stress - decayAmount);
    }

    updateStats() {
        const prestigeMult = this.getPrestigeBonus();
        const careerInfo = CAREERS[this.careerLevel];
        const coffeeMult = this.getCoffeeIncomeMultiplier();

        this.computeEmergenceMultiplier();
        this.computeEmergence2Multiplier();
        this.computeCoachMultiplier();
        let baseClickTotal = 1;
        this.clickComponents = {};

        for (const [id, b] of this.buildings) {
            if (b.stats.clickPower) {
                const sourceMult = b.getSourceMultiplier();
                const base = b.level * b.stats.clickPower * sourceMult;
                const contribution = base * careerInfo.clickMult * prestigeMult * this.cheat.click * coffeeMult * this.upgradeMultiplier;
                this.clickComponents[id] = contribution;
                baseClickTotal += base;
            }
        }

        this.clickPower = baseClickTotal * careerInfo.clickMult * prestigeMult * this.cheat.click * coffeeMult * this.upgradeMultiplier * this.emergenceMultiplier * this.emergence2Multiplier;

        let totalBasePassive = 0;
        this.passiveComponents = {};

        for (const [id, b] of this.buildings) {
            if (b.stats.cps) {
                const sourceMult = b.getSourceMultiplier();
                const base = b.level * b.stats.cps * sourceMult;
                const contribution = base * careerInfo.clickMult * prestigeMult * this.cheat.passive * coffeeMult * this.upgradeMultiplier;
                this.passiveComponents[id] = contribution;
                totalBasePassive += base;
            }
        }

        this.passiveIncome = totalBasePassive * careerInfo.clickMult * prestigeMult * this.cheat.passive * coffeeMult * this.upgradeMultiplier * this.emergenceMultiplier * this.emergence2Multiplier;
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
    }

    handleClick() {
        const now = Date.now();
        if (now - this.lastClickTime < 25) {
            this.dom.clickButton.style.transform = 'scale(0.95)';
            setTimeout(() => this.dom.clickButton.style.transform = '', 100);
            return;
        }
        this.lastClickTime = now;

        if (this.stress >= 100) return;

        let incomeMultiplier = 1;
        if (this.stress > 70) incomeMultiplier = 0.5;
        else if (this.stress > 30) incomeMultiplier = 0.8;

        this.count += this.clickPower * incomeMultiplier;

        const course = this.buildings.get('course');
        const courseLvl = course ? course.level : 0;

        this.computeCoachMultiplier(); // пересчитываем множитель перед использованием
        this.experience += (1 + courseLvl) * this.cheat.exp * this.coachMultiplier;
        this.checkCareerAdvancement();

        const stressMult = this.getStressAccumulationMultiplier();
        let stressGain = 0.5 * stressMult;

        const resistUpgrade = this.upgrades.find(u => u.id === 'stressResist1');
        if (resistUpgrade && resistUpgrade.purchased) {
            stressGain *= 0.7;
        }

        this.stress = Math.min(100, this.stress + stressGain);

        if (this.stress >= 100 && !this.hasReached100Stress) {
            this.hasReached100Stress = true;
        }

        this.updateUI();
    }

    drinkCoffee() {
        if (this.count < this.coffeeCost) return;
        this.count -= this.coffeeCost;
        this.coffeeCost = Math.ceil(this.coffeeCost * COFFEE_COST_MULT);

        // Если активен дебафф – только снижаем стресс
        if (this.debuffActive) {
            if (this.stress > 0) {
                this.stress = Math.max(0, this.stress - COFFEE_STRESS_REDUCTION);
            }
            this.updateUI();
            return;
        }

        // Стресс > 0 – кофе уходит на снижение стресса, бафф не трогаем
        if (this.stress > 0) {
            this.stress = Math.max(0, this.stress - COFFEE_STRESS_REDUCTION);
            // Даже если стресс стал 0 – бафф не добавляем
            this.updateUI();
            return;
        }

        // Стресс == 0 – работаем с баффом / дебаффом
        if (this.buffLevel < 10) {
            this.buffLevel++;
            this.buffTimer = BUFF_DURATION;  // обновляем таймер до полной длительности
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
            if (quantity === 0) return;
        }

        const cost = b.getBulkCost(quantity);
        if (this.count >= cost) {
            this.count -= cost;
            b.level += quantity;
            this.updateUI();
        }
    }

    purchaseUpgrade(id) {
        const b = this.buildings.get(id);
        if (!b || !b.stats.upgradeType) return;

        const nextData = b.getUpgradeData(b.upgradeLevel + 1);
        if (!nextData || !nextData.available) return;

        if (this.count >= nextData.price) {
            this.count -= nextData.price;
            b.upgradeLevel++;
            this.updateUI();
        }
    }

    purchaseUpgradeItem(index) {
        const upgrade = this.upgrades[index];
        if (!upgrade) return;
        if (upgrade.purchased) return;
        if (this.count < upgrade.price) return;

        this.count -= upgrade.price;
        upgrade.purchased = true;
        // Для стрессоустойчивости и эмерджентности не применяем фиксированный множитель
        if (upgrade.id !== 'emergence' && upgrade.id !== 'stressResist1' && upgrade.id !== 'emergence2' && upgrade.id !== 'coach') {
            this.upgradeMultiplier *= upgrade.multiplier;
        }
        this.updateUI();
    }

    prestige() {
        if (this.careerLevel < CAREERS.length - 1 || this.count < PRESTIGE_COST_PER_SHARE) return;

        const earned = Math.floor((1.01 * Math.cbrt(this.count) * (Math.log10(this.count))) / (120000 + (this.count ** (1 / 6))));
        if (earned > 0) {
            this.prestigePoints += earned;
        }

        this.reset();
    }

    reset() {
        this.count = 0;
        this.stress = 0;
        this.experience = 0;
        this.careerLevel = 0;
        this.coffeeCost = 20;
        this.buffLevel = 0;
        this.buffTimer = 0;
        this.debuffActive = false;
        this.debuffTimer = 0;
        this.upgradeMultiplier = 1;
        this.upgrades.forEach(u => { u.purchased = false; u.revealed = false; });

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
            const bonusPercent = this.buffLevel * 10;
            label = `✅ Бафф: +${bonusPercent}% дохода`;
            fillColor = '#4caf50';
            percent = (this.buffTimer / BUFF_DURATION) * 100;
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
        }

        if (b.stats.clickPower && b.dom.info) {
            b.dom.info.textContent = `Вклад в клик: +${formatNumber(this.clickComponents[b.id] || 0)}`;
        }
        if (b.stats.cps && b.dom.info) {
            const val = this.passiveComponents[b.id] || 0;
            const pct = totalPassive > 0 ? (val / totalPassive * 100).toFixed(1) : '0.0';
            b.dom.info.textContent = `CPS: ${formatNumber(val)} (${pct}%)`;
        }
    }

    updateVisibility() {
        for (const b of this.buildings.values()) {
            if (!b.dom.shop) continue;
            if (b.stats.alwaysVisible) {
                b.dom.shop.style.display = 'flex';
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
            this.dom.careerTitle.textContent = `${CAREERS[this.careerLevel].title} (${this.careerLevel + 1}/${totalCareers}) ×${formatNumber(CAREERS[this.careerLevel].clickMult)}`;

            this.dom.expValue.textContent = formatNumber(Math.floor(this.experience));
            this.dom.expNeed.textContent = isNaN(CAREERS[this.careerLevel].nextExp) ? 'MAX' : formatNumber(CAREERS[this.careerLevel].nextExp);
            this.dom.prestigePoints.textContent = formatNumber(this.prestigePoints);

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

            this.dom.coffeeButton.disabled = this.count < this.coffeeCost;
            this.dom.coffeeCostText.textContent = formatNumber(this.coffeeCost);

            const canPrestige = this.careerLevel >= CAREERS.length - 1 && this.count >= PRESTIGE_COST_PER_SHARE;
            this.dom.prestigeButton.disabled = !canPrestige;
            const shares = Math.floor((1.01 * Math.cbrt(this.count) * (Math.log10(this.count))) / (120000 + (this.count ** (1 / 6))));
            this.dom.prestigeInfo.textContent = `Стоимость 1 акции: ${formatNumber(PRESTIGE_COST_PER_SHARE)} монет. Сейчас вы получите ${formatNumber(shares)} акций.`;

            this.dom.cheatClickMultDisplay.textContent = this.cheat.click;
            this.dom.cheatPassiveMultDisplay.textContent = this.cheat.passive;
            this.dom.cheatExpMultDisplay.textContent = this.cheat.exp;

            this.updateUpgradeElements();
            this.updateVisibility();
        } catch (e) {
            console.error('Ошибка в updateUI:', e);
        }
    }

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

            if (this.stress < 100) {
                let incomeMultiplier = 1;
                if (this.stress > 70) incomeMultiplier = 0.5;
                else if (this.stress > 30) incomeMultiplier = 0.8;
                this.count += this.passiveIncome * delta * incomeMultiplier;
            }

            this.updateStress(delta);
            this.updateUI();
        } catch (e) {
            console.error('Ошибка в gameLoop:', e);
        }

        setTimeout(() => this.gameLoop(), 100);
    }

    start() {
        this.updateUI();
        this.gameLoop();
        console.log('Игра запущена! Стресс будет уменьшаться со временем.');
    }
}

// ======================= ЗАПУСК =======================
document.addEventListener('DOMContentLoaded', () => {
    const game = new Game();
    game.start();
});