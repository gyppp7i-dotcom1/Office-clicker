// ======================= УТИЛИТЫ =======================
const suffixes = [
    '', ' К', ' М', ' В', ' Т', ' Qa', ' Qi',
    ' Sx', ' Sp', ' Oc', ' No', ' Dc'
];

// +++ НОВОЕ: склонение русских слов по числу (1 минута / 2 минуты / 5 минут) +++
function pluralizeRu(n, one, few, many) {
    const mod10 = n % 10;
    const mod100 = n % 100;
    if (mod10 === 1 && mod100 !== 11) return one;
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few;
    return many;
}

// +++ НОВОЕ: форматирование длительности офлайн-периода в читаемый вид +++
function formatOfflineDuration(totalSeconds) {
    const totalMinutes = Math.max(1, Math.floor(totalSeconds / 60));
    if (totalMinutes < 60) {
        return `${totalMinutes} ${pluralizeRu(totalMinutes, 'минуту', 'минуты', 'минут')}`;
    }
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    const hourStr = `${hours} ${pluralizeRu(hours, 'час', 'часа', 'часов')}`;
    if (mins === 0) return hourStr;
    return `${hourStr} ${mins} ${pluralizeRu(mins, 'минуту', 'минуты', 'минут')}`;
}

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
// Внутри класса Game добавьте метод

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
const COFFEE_POUR_DURATION = 3; // кд на "выпить кофе" (сек) — кофе наливается заново после каждой чашки
const BUFF_DURATION = 35;
const DEBUFF_DURATION = 45;
const DEBUFF_MALUS = 0.50;
const DEBUFF_STRESS_MULT = 2;
const PRESTIGE_COST_PER_SHARE = 10 ** 12;

const STRESS_DECAY_BASE = 0.5;
const STRESS_DECAY_GYM_BONUS = 0.10;

// ======================= ЛОКАЛЬНЫЕ СОХРАНЕНИЯ =======================
const SAVE_KEY = 'officePlanktonSave';
const SAVE_VERSION = 1;
const AUTOSAVE_INTERVAL_MS = 15000; // автосохранение каждые 15 секунд
const MAX_OFFLINE_SECONDS = 24 * 60 * 60; // офлайн-доход считается не более чем за 24 часа
const MIN_OFFLINE_SECONDS_TO_NOTIFY = 60; // не показываем плашку за отсутствие короче минуты

const BUILDINGS = {
    equip: {
        name: 'Оборудование', icon: '⌨️', baseCost: 100, costMult: 1.12, clickPower: 0.2,
        upgradeType: 'standard', alwaysVisible: true,
        dom: { lvl: 'equipLvl', cost: 'equipCost', btn: 'upgradeEquip', multBtn: 'upgradeEquipMult', multPrice: 'equipMultPrice', upgradeLvl: 'equipUpgradeLvl', icon: 'equipIcon', info: 'equipClickInfo', shop: 'shop-equip' }
    },
    coffeeMachine: {
        name: 'Кофе-машина', icon: '☕', baseCost: 1000, costMult: 1.14, clickPower: 3,
        upgradeType: 'standard', alwaysVisible: true,
        dom: { lvl: 'coffeeMachineLvl', cost: 'coffeeMachineCost', btn: 'upgradeCoffeeMachine', multBtn: 'upgradeCoffeeMachineMult', multPrice: 'coffeeMachineMultPrice', upgradeLvl: 'coffeeMachineUpgradeLvl', icon: 'coffeeMachineIcon', info: 'coffeeClickInfo', shop: 'shop-coffee' }
    },
    secretary: {
        name: 'Личный секретарь', icon: '👔', baseCost: 15000, costMult: 1.15, clickPower: 50,
        upgradeType: 'standard',
        dom: { lvl: 'secretaryLvl', cost: 'secretaryCost', btn: 'upgradeSecretary', multBtn: 'upgradeSecretaryMult', multPrice: 'secretaryMultPrice', upgradeLvl: 'secretaryUpgradeLvl', icon: 'secretaryIcon', info: 'secretaryClickInfo', shop: 'shop-secretary' }
    },
    aiComputer: {
        name: 'AI-ЭВМ', icon: '🖥️', baseCost: 1e10, costMult: 1.3, clickPower: 3 * 10 ** 6,
        upgradeType: 'aiComputer',
        dom: { lvl: 'aiComputerLvl', cost: 'aiComputerCost', btn: 'upgradeAIComputer', multBtn: 'upgradeAIComputerMult', multPrice: 'aiComputerMultPrice', upgradeLvl: 'aiComputerUpgradeLvl', icon: 'aiComputerIcon', info: 'aiComputerClickInfo', shop: 'shop-aiComputer' }
    },
    staff: {
        name: 'Персонал', icon: '👥', baseCost: 150, costMult: 1.11, cps: 1,
        upgradeType: 'standard', alwaysVisible: true,
        dom: { lvl: 'staffLvl', cost: 'staffCost', btn: 'upgradeStaff', multBtn: 'upgradeStaffMult', multPrice: 'staffMultPrice', upgradeLvl: 'staffUpgradeLvl', icon: 'staffIcon', info: 'staffCpsInfo', shop: 'shop-staff' }
    },
    auto: {
        name: 'Отдел автоматизации', icon: '🤖', baseCost: 1000, costMult: 1.13, cps: 10,
        upgradeType: 'standard',
        dom: { lvl: 'autoLvl', cost: 'autoCost', btn: 'upgradeAuto', multBtn: 'upgradeAutoMult', multPrice: 'autoMultPrice', upgradeLvl: 'autoUpgradeLvl', icon: 'autoIcon', info: 'autoCpsInfo', shop: 'shop-auto' }
    },
    robot: {
        name: 'Роботы-помощники', icon: '🦾', baseCost: 60000, costMult: 1.134, cps: 400,
        upgradeType: 'standard',
        dom: { lvl: 'robotLvl', cost: 'robotCost', btn: 'upgradeRobot', multBtn: 'upgradeRobotMult', multPrice: 'robotMultPrice', upgradeLvl: 'robotUpgradeLvl', icon: 'robotIcon', info: 'robotCpsInfo', shop: 'shop-robot' }
    },
    ai: {
        name: 'AI-ассистент', icon: '🧠', baseCost: 999999, costMult: 1.17, cps: 9999,
        upgradeType: 'ai',
        dom: { lvl: 'aiLvl', cost: 'aiCost', btn: 'upgradeAI', multBtn: 'upgradeAIMult', multPrice: 'aiMultPrice', upgradeLvl: 'aiUpgradeLvl', icon: 'aiIcon', info: 'aiCpsInfo', shop: 'shop-ai' }
    },
    processing: {
        name: 'Отдел обработки', icon: '⚙️', baseCost: 1.5e8, costMult: 1.2, cps: 300000,
        upgradeType: 'processing',
        dom: { lvl: 'processingLvl', cost: 'processingCost', btn: 'upgradeProcessing', multBtn: 'upgradeProcessingMult', multPrice: 'processingMultPrice', upgradeLvl: 'processingUpgradeLvl', icon: 'processingIcon', info: 'processingCpsInfo', shop: 'shop-processing' }
    },
    office: {
        name: 'Собственный офис', icon: '🏢', baseCost: 1e10, costMult: 1.35, cps: 1e8,
        upgradeType: 'office',
        dom: { lvl: 'officeLvl', cost: 'officeCost', btn: 'upgradeOffice', multBtn: 'upgradeOfficeMult', multPrice: 'officeMultPrice', upgradeLvl: 'officeUpgradeLvl', icon: 'officeIcon', info: 'officeCpsInfo', shop: 'shop-office' }
    },
    gym: {
        name: 'Спортзал', icon: '🏋️', baseCost: 1000, costMult: 10, special: 'gym', alwaysVisible: true,
        hobbyUpgrade: { baseCost: 100000, costMult: 200 },
        dom: { lvl: 'gymLvl', cost: 'gymCost', btn: 'upgradeGym', multBtn: 'upgradeGymMult', multPrice: 'gymMultPrice', upgradeLvl: 'gymUpgradeLvl', icon: 'gymIcon', shop: 'shop-gym' }
    },
    course: {
        name: 'Курсы', icon: '📚', baseCost: 500, costMult: 4, special: 'course', alwaysVisible: true,
        hobbyUpgrade: { baseCost: 4000, costMult: 4000 },
        dom: { lvl: 'courseLvl', cost: 'courseCost', btn: 'upgradeCourse', multBtn: 'upgradeCourseMult', multPrice: 'courseMultPrice', upgradeLvl: 'courseUpgradeLvl', icon: 'courseIcon', info: 'courseExpInfo', shop: 'shop-course' }
    }
};

// ======================= КЛАСС BUILDING =======================
class Building {
    constructor(id, stats) {
        this.id = id;
        this.stats = stats;
        this.level = 0;
        this.upgradeLevel = 0;
        this.costDiscount = 1; // +++ НОВОЕ: множитель скидки на стоимость (напр. "Скидка на образование") +++

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
    // Внутри класса Game добавьте метод

    getBulkCost(quantity) {
        const { baseCost, costMult } = this.stats;
        return Math.ceil(baseCost * this.costDiscount * (costMult ** this.level) * ((costMult ** quantity - 1) / (costMult - 1)));
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

    // +++ НОВОЕ: цена улучшения для "хобби"-покупок (зал/курсы) — без требований по уровню +++
    getHobbyUpgradePrice() {
        const cfg = this.stats.hobbyUpgrade;
        if (!cfg) return null;
        return Math.ceil(cfg.baseCost * this.costDiscount * Math.pow(cfg.costMult, this.upgradeLevel));
    }

    getUpgradeData(targetLvl = this.upgradeLevel + 1) {
        let lvl = targetLvl;
        if (lvl === 0) lvl = 1;
        if (lvl < 1) return null;

        const { baseCost, upgradeType } = this.stats;
        const params = UPGRADE_TYPE_PARAMS[upgradeType] || UPGRADE_TYPE_PARAMS.standard;
        const basePrice = baseCost * 10;

        const STEP_AFTER_LAST = 25;
        let required;
        if (lvl <= UPGRADE_THRESHOLDS.length) {
            required = UPGRADE_THRESHOLDS[lvl - 1];
        } else {
            const lastThreshold = UPGRADE_THRESHOLDS[UPGRADE_THRESHOLDS.length - 1];
            const extraLevels = (lvl - UPGRADE_THRESHOLDS.length) * STEP_AFTER_LAST;
            required = lastThreshold + extraLevels;
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
        this.coffeePour = 0; // 0 = чашка готова; >0 = сколько секунд ещё наливается
        this.buffLevel = 0;
        this.buffTimer = 0;
        this.debuffActive = false;
        this.debuffTimer = 0;
        this.buyAmount = 1;
        this.cheat = { click: 1, passive: 1, exp: 1 };
        this.lastClickTime = 0;
        this.lastUpdateTime = Date.now();
        this.audioCtx = null;

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
        this.loadedFromSave = this.loadGame();

        this.cacheDOM();
        this.bindEvents();
        this.createTooltip();
        this.createUpgradeElements();
        this.createOfflineModal();

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
        // ===== ИЗМЕНЕНО: улучшения переставлены в порядке появления =====
        const upgradeDefs = [
            {
                id: 'stressResist1',
                name: 'Стрессоустойчивость I',
                icon: '🛡️',
                description: 'Уменьшает накопление стресса на 30%',
                price: 5000,
                multiplier: 1,
                unlockCondition: (game) => game.hasReached100Stress === true,
                effectText: () => '−30% к накоплению стресса'
            },
            {
                id: 'coach',
                name: 'ИИ-коуч',
                icon: '֍',
                description: '+5% к эффективности курсов за каждые 10 лвл AI-ассистентов <br> +5% за каждые 5 AI-ЭВМ',
                price: 2e9,  // 20B
                multiplier: 1,
                unlockCondition: (game) => game.careerLevel >= 5,   // 5-я должность: "Заместитель руководителя отдела"
                effectText: (game) => `+${(Math.round((game.coachMultiplier - 1) * 1000) / 10)}% опыта за клик`
            },
            {
                id: 'emergence',
                name: 'Эмерджентность',
                icon: 'η',
                description: 'Добавляет 1% к доходу за каждые 35 лвл (кроме курсов и зала)',
                price: 1e9,
                multiplier: 1,
                unlockCondition: (game) => game.count >= 200e6,
                effectText: (game) => `+${(Math.round((game.emergenceMultiplier - 1) * 1000) / 10)}% дохода`
            },
            {
                id: 'emergence2',
                name: 'Эмерджентность II',
                icon: 'η²',
                description: '+1% к доходу за каждое улучшение зданий',
                price: 10e12,           // 10 Т
                multiplier: 1,
                unlockCondition: (game) => game.count >= 500e9,   // 500B
                effectText: (game) => `+${(Math.round((game.emergence2Multiplier - 1) * 1000) / 10)}% дохода`
            },
            {
                id: 'eduDiscount',
                name: 'Скидка на образование',
                icon: '🎓',
                description: 'Стоимость курсов и их улучшений в 3333 раза меньше',
                price: 50e9,   // 50B
                multiplier: 1,
                unlockCondition: (game) => game.count >= 5e9,   // 5B
                effectText: () => 'Курсы и их улучшения дешевле в 3333 раза'
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
            prestigeSection: document.getElementById('prestigeSection'),
            saveStatus: document.getElementById('saveStatus'),
            saveNowButton: document.getElementById('saveNowButton'),
            deleteSaveButton: document.getElementById('deleteSaveButton')
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
            square.addEventListener('click', (e) => {
                square.classList.add('pressed');
                setTimeout(() => square.classList.remove('pressed'), 200);

                // +++ НОВОЕ: приятная искорка и нежный звук при клике — работает и для
                // недоступных/некупленных улучшений, и для уже купленных +++
                try {
                    const rect = square.getBoundingClientRect();
                    this.showIconSparkle(rect.left + rect.width / 2, rect.top);
                    this.playIconClickSound();
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
        // +++ ИЗМЕНЕНО: передаём событие в handleClick +++
        this.dom.clickButton.addEventListener('click', (e) => this.handleClick(e));
        this.dom.coffeeButton.addEventListener('click', () => this.drinkCoffee());
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

        // +++ НОВОЕ: ручное сохранение и удаление сохранения +++
        if (this.dom.saveNowButton) {
            this.dom.saveNowButton.addEventListener('click', () => {
                const ok = this.saveGame();
                this.updateSaveStatus(ok ? '✅ Сохранено вручную' : '⚠️ Не удалось сохранить');
                setTimeout(() => this.updateSaveStatus(), 2000);
            });
        }
        if (this.dom.deleteSaveButton) {
            this.dom.deleteSaveButton.addEventListener('click', () => {
                const confirmed = window.confirm('Удалить сохранение и начать игру заново? Это действие необратимо.');
                if (!confirmed) return;
                this.deleteSave();
                this.hardReset();
                this.updateSaveStatus('🗑️ Сохранение удалено. Начинаем заново.');
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
                this.playQuantitySelectSound();
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
    ensureAudioCtx() {
        if (!this.audioCtx) {
            this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        // Если контекст приостановлен (бывает на мобильных), возобновляем
        if (this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }
        return this.audioCtx;
    }

    playTone(freq, duration = 0.08, type = 'sine', gain = 0.12, delay = 0) {
        const ctx = this.ensureAudioCtx();
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        oscillator.type = type;
        oscillator.frequency.value = freq;
        const startTime = ctx.currentTime + delay;
        gainNode.gain.setValueAtTime(gain, startTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        oscillator.start(startTime);
        oscillator.stop(startTime + duration);
    }

    playClickSound() {
        try {
            this.playTone(880, 0.08, 'sine', 0.12);
        } catch (e) {
            // Любая ошибка звука не должна влиять на игру
            console.warn('Звук не воспроизведён:', e);
        }
    }

    // +++ НОВОЕ: звук покупки здания +++
    playBuyBuildingSound() {
        try {
            this.playTone(520, 0.07, 'triangle', 0.12, 0);
            this.playTone(780, 0.09, 'triangle', 0.12, 0.05);
        } catch (e) {
            console.warn('Звук не воспроизведён:', e);
        }
    }

    // +++ НОВОЕ: звук покупки улучшения здания (множитель) +++
    playBuildingUpgradeSound() {
        try {
            this.playTone(660, 0.05, 'square', 0.10, 0);
            this.playTone(990, 0.08, 'square', 0.10, 0.045);
        } catch (e) {
            console.warn('Звук не воспроизведён:', e);
        }
    }

    // +++ НОВОЕ: звук выбора количества покупки (x1, x10, Макс...) +++
    playQuantitySelectSound() {
        try {
            this.playTone(420, 0.045, 'sine', 0.08, 0);
        } catch (e) {
            console.warn('Звук не воспроизведён:', e);
        }
    }

    // +++ НОВОЕ: звук выпитого кофе +++
    playCoffeeSound() {
        try {
            this.playTone(300, 0.09, 'sine', 0.10, 0);
            this.playTone(230, 0.14, 'sine', 0.08, 0.07);
        } catch (e) {
            console.warn('Звук не воспроизведён:', e);
        }
    }

    // +++ НОВОЕ: звук покупки общего улучшения (квадратики) — короткий аккорд +++
    playGeneralUpgradeSound() {
        try {
            this.playTone(523.25, 0.12, 'triangle', 0.11, 0);     // C5
            this.playTone(659.25, 0.12, 'triangle', 0.11, 0.07);  // E5
            this.playTone(783.99, 0.18, 'triangle', 0.11, 0.14);  // G5
        } catch (e) {
            console.warn('Звук не воспроизведён:', e);
        }
    }

    // +++ НОВОЕ: тихий "отказной" звук при нехватке средств на покупку (в т.ч. престиж) +++
    playInsufficientFundsSound() {
        try {
            this.playTone(260, 0.09, 'sine', 0.06, 0);
            this.playTone(180, 0.13, 'sine', 0.05, 0.06);
        } catch (e) {
            console.warn('Звук не воспроизведён:', e);
        }
    }

    // +++ НОВОЕ: нежный звук клика по иконке здания (просто приятная мелочь) +++
    playIconClickSound() {
        try {
            this.playTone(1046.50, 0.12, 'sine', 0.05, 0);     // C6
            this.playTone(1318.51, 0.14, 'sine', 0.045, 0.05); // E6
        } catch (e) {
            console.warn('Звук не воспроизведён:', e);
        }
    }

    // +++ НОВОЕ: лёгкая искорка, всплывающая рядом с иконкой при клике +++
    showIconSparkle(x, y) {
        const sparkles = ['✨', '💫', '⭐', '🌟'];
        const symbol = sparkles[Math.floor(Math.random() * sparkles.length)];

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

    // +++ НОВОЕ: обработчик клика по иконке здания — просто приятная мелочь, на игру не влияет +++
    handleIconClick(event, iconEl) {
        try {
            // Перезапускаем анимацию "поп"
            iconEl.classList.remove('icon-pop');
            void iconEl.offsetWidth; // форсируем reflow, чтобы анимация сыграла заново
            iconEl.classList.add('icon-pop');

            const rect = iconEl.getBoundingClientRect();
            this.showIconSparkle(rect.left + rect.width / 2, rect.top);

            this.playIconClickSound();
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
    spawnBackgroundParticles(x, y) {
        const colors = ['#ff9800', '#2196f3', '#4caf50', '#9b59b6', '#d9534f', '#ffc107', '#8B4513'];
        const count = 8 + Math.floor(Math.random() * 4); // 8-11 частиц

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
            setTimeout(() => {
                if (particle.parentNode) particle.parentNode.removeChild(particle);
            }, 600);
        }
    }

    // +++ НОВОЕ: обработчик клика по фону страницы (мимо кнопок, иконок и т.д.) +++
    handleBackgroundClick(event) {
        try {
            this.spawnBackgroundParticles(event.clientX, event.clientY);
            this.playBackgroundClickSound();
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
            this.spawnBriefcasePapers(rect.left + rect.width / 2, rect.top + rect.height / 2);
            this.playBriefcaseSound();
        } catch (e) {
            console.warn('Эффект портфеля не сработал:', e);
        }
    }

    // +++ НОВОЕ: страницы, вылетающие из открытого портфеля +++
    spawnBriefcasePapers(x, y) {
        const paperEmoji = '📄'; // один и тот же лист, без разных смайликов
        const count = 6 + Math.floor(Math.random() * 3); // 6-8 листов

        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.6;
            const distance = 45 + Math.random() * 45;
            const dx = Math.cos(angle) * distance;
            const dy = Math.sin(angle) * distance - 15; // немного вверх перед "падением"
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
            setTimeout(() => {
                if (el.parentNode) el.parentNode.removeChild(el);
            }, 950);
        }
    }

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
            this.playTone(190, 0.045, 'square', 0.035, 0.015);
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

            this.playBalanceCoinSound();
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
            this.playTone(1567.98, 0.05, 'square', 0.05, 0);      // G6
            this.playTone(2093.00, 0.09, 'triangle', 0.06, 0.045); // C7
            this.playTone(2637.02, 0.12, 'sine', 0.04, 0.09);      // E7 — переливчатый хвостик
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

    // +++ НОВЫЙ МЕТОД: отображение всплывающего текста +++
    showFloatingText(x, y, text) {
        // Если координаты не переданы, берём центр кнопки
        if (x === undefined || y === undefined) {
            const rect = this.dom.clickButton.getBoundingClientRect();
            x = rect.left + rect.width / 2;
            y = rect.top - 10;
        }

        const el = document.createElement('div');
        el.className = 'floating-text';
        el.textContent = text;

        // Небольшое случайное смещение, чтобы текст не накладывался
        const offsetX = (Math.random() - 0.5) * 60;
        const offsetY = (Math.random() - 0.5) * 30;

        el.style.left = (x + offsetX) + 'px';
        el.style.top = (y + offsetY) + 'px';

        document.body.appendChild(el);

        // Удаляем элемент после завершения анимации
        setTimeout(() => {
            if (el.parentNode) el.parentNode.removeChild(el);
        }, 1200);
    }

    // +++ ИЗМЕНЕНО: убран двойной штраф, добавлен вызов всплывающего текста +++
    handleClick(event) {
        try {
            this.playClickSound();
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

        if (this.stress >= 100) return;

        // clickPower уже учитывает все множители и штраф от стресса
        const power = this.clickPower;

        this.count += power;

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
        }

        // Обновляем UI (пересчитывает clickPower для следующих кликов)
        this.updateUI();

        // Показываем всплывающий текст с силой клика (форматируем число)
        const formatted = '+' + formatNumber(power);
        if (event) {
            // Если есть событие мыши – используем его координаты
            this.showFloatingText(event.clientX, event.clientY, formatted);
        } else {
            // Для мобильных или тестов – центр кнопки
            this.showFloatingText(undefined, undefined, formatted);
        }
    }

    drinkCoffee() {
        // +++ НОВОЕ: чашку нельзя выпить, пока кофе ещё наливается +++
        if (this.coffeePour > 0) {
            this.playInsufficientFundsSound();
            return;
        }
        if (this.count < this.coffeeCost) {
            this.playInsufficientFundsSound();
            return;
        }
        this.count -= this.coffeeCost;
        this.coffeeCost = Math.ceil(this.coffeeCost * COFFEE_COST_MULT);
        this.playCoffeeSound();
        // Чашка выпита — она пустеет и снова начинает наливаться
        this.coffeePour = COFFEE_POUR_DURATION;

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
            if (quantity === 0) {
                this.playInsufficientFundsSound();
                return;
            }
        }

        const cost = b.getBulkCost(quantity);
        if (this.count >= cost) {
            this.count -= cost;
            b.level += quantity;
            this.playBuyBuildingSound();
            this.updateUI();
        } else {
            this.playInsufficientFundsSound();
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
                this.playBuildingUpgradeSound();
                this.updateUI();
            } else {
                this.playInsufficientFundsSound();
            }
            return;
        }

        if (!b.stats.upgradeType) return;

        const nextData = b.getUpgradeData(b.upgradeLevel + 1);
        if (!nextData || !nextData.available) return; // недоступно по условию – это не про деньги

        if (this.count >= nextData.price) {
            this.count -= nextData.price;
            b.upgradeLevel++;
            this.playBuildingUpgradeSound();
            this.updateUI();
        } else {
            this.playInsufficientFundsSound();
        }
    }

    purchaseUpgradeItem(index) {
        const upgrade = this.upgrades[index];
        if (!upgrade) return;
        if (upgrade.purchased) return;
        if (this.count < upgrade.price) {
            this.playInsufficientFundsSound();
            return;
        }

        this.count -= upgrade.price;
        upgrade.purchased = true;
        // Для стрессоустойчивости и эмерджентности не применяем фиксированный множитель
        if (upgrade.id !== 'emergence' && upgrade.id !== 'stressResist1' && upgrade.id !== 'emergence2' && upgrade.id !== 'coach' && upgrade.id !== 'eduDiscount') {
            this.upgradeMultiplier *= upgrade.multiplier;
        }
        this.playGeneralUpgradeSound();
        this.updateUI();
    }

    prestige() {
        if (this.careerLevel < CAREERS.length - 1 || this.count < PRESTIGE_COST_PER_SHARE) {
            this.playInsufficientFundsSound();
            return;
        }

        const earned = Math.floor((1.01 * Math.cbrt(this.count) * (Math.log10(this.count))) / (120000 + (this.count ** (1 / 6))));
        if (earned > 0) {
            this.prestigePoints += earned;
        }

        this.reset();
        this.saveGame(); // сохраняем сразу после престижа
    }

    reset() {
        this.count = 0;
        this.stress = 0;
        this.experience = 0;
        this.careerLevel = 0;
        this.coffeeCost = 20;
        this.coffeePour = 0;
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

    // +++ НОВОЕ: полный сброс, включая престиж — используется при удалении сохранения +++
    hardReset() {
        this.prestigePoints = 0;
        this.prestigeUnlocked = false;
        this.reset();
    }

    // +++ НОВОЕ: собираем данные для сохранения (только долгосрочный прогресс) +++
    getSaveData() {
        const buildingsData = {};
        for (const [id, b] of this.buildings) {
            buildingsData[id] = { level: b.level, upgradeLevel: b.upgradeLevel };
        }

        const upgradesData = this.upgrades.map(u => ({
            id: u.id,
            purchased: u.purchased,
            revealed: u.revealed
        }));

        return {
            version: SAVE_VERSION,
            savedAt: Date.now(),
            count: this.count,
            stress: this.stress,
            experience: this.experience,
            careerLevel: this.careerLevel,
            prestigePoints: this.prestigePoints,
            prestigeUnlocked: this.prestigeUnlocked,
            coffeeCost: this.coffeeCost,
            buyAmount: this.buyAmount,
            hasReached100Stress: this.hasReached100Stress,
            stressHundredLockUsed: this.stressHundredLockUsed,
            upgradeMultiplier: this.upgradeMultiplier,
            buildings: buildingsData,
            upgrades: upgradesData
        };
    }

    // +++ НОВОЕ: применяем загруженные данные к текущей игре +++
    // Короткоживущие эффекты (баффы/дебаффы/налив кофе/блокировка стресса) намеренно
    // не сохраняются — они привязаны к текущей сессии и сбрасываются на старте.
    applySaveData(data) {
        if (!data || typeof data !== 'object') return;

        if (typeof data.count === 'number' && isFinite(data.count)) this.count = data.count;
        if (typeof data.stress === 'number' && isFinite(data.stress)) this.stress = data.stress;
        if (typeof data.experience === 'number' && isFinite(data.experience)) this.experience = data.experience;
        if (typeof data.careerLevel === 'number' && isFinite(data.careerLevel)) this.careerLevel = data.careerLevel;
        if (typeof data.prestigePoints === 'number' && isFinite(data.prestigePoints)) this.prestigePoints = data.prestigePoints;
        if (typeof data.prestigeUnlocked === 'boolean') this.prestigeUnlocked = data.prestigeUnlocked;
        if (typeof data.coffeeCost === 'number' && isFinite(data.coffeeCost)) this.coffeeCost = data.coffeeCost;
        if (typeof data.buyAmount === 'number' && isFinite(data.buyAmount)) this.buyAmount = data.buyAmount;
        if (typeof data.hasReached100Stress === 'boolean') this.hasReached100Stress = data.hasReached100Stress;
        if (typeof data.stressHundredLockUsed === 'boolean') this.stressHundredLockUsed = data.stressHundredLockUsed;
        if (typeof data.upgradeMultiplier === 'number' && isFinite(data.upgradeMultiplier)) this.upgradeMultiplier = data.upgradeMultiplier;

        if (data.buildings && typeof data.buildings === 'object') {
            for (const [id, b] of this.buildings) {
                const saved = data.buildings[id];
                if (!saved) continue;
                if (typeof saved.level === 'number' && isFinite(saved.level)) b.level = saved.level;
                if (typeof saved.upgradeLevel === 'number' && isFinite(saved.upgradeLevel)) b.upgradeLevel = saved.upgradeLevel;
            }
        }

        if (Array.isArray(data.upgrades)) {
            for (const savedU of data.upgrades) {
                const u = this.upgrades.find(x => x.id === savedU.id);
                if (!u) continue;
                u.purchased = !!savedU.purchased;
                u.revealed = !!savedU.revealed;
            }
        }
    }

    // +++ НОВОЕ: сохранение в localStorage +++
    saveGame() {
        try {
            const data = this.getSaveData();
            localStorage.setItem(SAVE_KEY, JSON.stringify(data));
            return true;
        } catch (e) {
            console.warn('Не удалось сохранить игру:', e);
            return false;
        }
    }

    // +++ НОВОЕ: загрузка из localStorage. Возвращает true, если сохранение было найдено +++
    loadGame() {
        try {
            const raw = localStorage.getItem(SAVE_KEY);
            if (!raw) return false;
            const data = JSON.parse(raw);
            if (!data || typeof data !== 'object') return false;
            this.applySaveData(data);

            // +++ НОВОЕ: считаем, сколько секунд прошло с последнего сохранения (для офлайн-дохода) +++
            if (typeof data.savedAt === 'number' && isFinite(data.savedAt)) {
                const elapsedSec = Math.max(0, (Date.now() - data.savedAt) / 1000);
                this.pendingOfflineSeconds = Math.min(elapsedSec, MAX_OFFLINE_SECONDS);
            }

            return true;
        } catch (e) {
            console.warn('Не удалось загрузить сохранение (возможно, оно повреждено):', e);
            return false;
        }
    }

    // +++ НОВОЕ: удаление сохранения +++
    deleteSave() {
        try {
            localStorage.removeItem(SAVE_KEY);
            return true;
        } catch (e) {
            console.warn('Не удалось удалить сохранение:', e);
            return false;
        }
    }

    // +++ НОВОЕ: обновление текста статуса сохранения +++
    updateSaveStatus(customText) {
        if (!this.dom.saveStatus) return;
        if (customText) {
            this.dom.saveStatus.textContent = customText;
            return;
        }
        const time = new Date().toLocaleTimeString('ru-RU');
        this.dom.saveStatus.textContent = `Автосохранение включено · последнее сохранение: ${time}`;
    }

    // +++ НОВОЕ: создаём модалку офлайн-дохода один раз (аналогично createTooltip) +++
    createOfflineModal() {
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
        this.offlineModal = overlay;

        const okBtn = overlay.querySelector('#offlineModalOkBtn');
        okBtn.addEventListener('click', () => this.hideOfflineModal());
        // Клик по фону тоже закрывает модалку
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) this.hideOfflineModal();
        });
    }

    showOfflineModal(offlineSeconds, earnings) {
        if (!this.offlineModal) return;
        const textEl = this.offlineModal.querySelector('#offlineModalText');
        const durationLabel = formatOfflineDuration(offlineSeconds);
        if (textEl) {
            textEl.innerHTML = `Вас не было ${durationLabel}.<br>Вы заработали <strong>${formatNumber(Math.floor(earnings))}</strong> монет.`;
        }
        this.offlineModal.classList.add('visible');
        this.playOfflineEarningsSound();
    }

    hideOfflineModal() {
        if (!this.offlineModal) return;
        this.offlineModal.classList.remove('visible');
    }

    // +++ НОВОЕ: считаем и начисляем офлайн-доход при запуске игры +++
    applyOfflineEarnings() {
        if (!this.pendingOfflineSeconds || this.pendingOfflineSeconds < MIN_OFFLINE_SECONDS_TO_NOTIFY) {
            this.pendingOfflineSeconds = 0;
            return;
        }

        // Пересчитываем доход на основе восстановленных зданий/бонусов
        this.updateStats();

        const offlineSeconds = this.pendingOfflineSeconds;
        const earnings = this.passiveIncome * offlineSeconds;

        if (earnings > 0) {
            this.count += earnings;
            this.saveGame();
        }
        // Плашку показываем только если сумма заметна (от 1 монеты)
        if (earnings >= 1) {
            this.showOfflineModal(offlineSeconds, earnings);
        }

        this.pendingOfflineSeconds = 0;
    }

    // +++ НОВОЕ: приятный звук "С возвращением!" — восходящий аккорд +++
    playOfflineEarningsSound() {
        try {
            this.playTone(523.25, 0.10, 'triangle', 0.10, 0);     // C5
            this.playTone(659.25, 0.10, 'triangle', 0.10, 0.09);  // E5
            this.playTone(783.99, 0.10, 'triangle', 0.10, 0.18);  // G5
            this.playTone(1046.50, 0.16, 'triangle', 0.11, 0.27); // C6
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
            const bonusPercent = this.buffLevel * 10;
            label = `✅ +${bonusPercent}% дохода`;
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

    // +++ НОВОЕ: обновление шкалы опыта карьеры +++
    updateExpBar() {
        const nextExp = CAREERS[this.careerLevel].nextExp;

        if (isNaN(nextExp)) {
            // Максимальная должность — шкала заполнена полностью
            if (this.dom.expFill) this.dom.expFill.style.width = '100%';
            if (this.dom.expBarLabel) this.dom.expBarLabel.textContent = 'MAX';
            return;
        }

        const pct = nextExp > 0 ? Math.max(0, Math.min(100, (this.experience / nextExp) * 100)) : 0;
        if (this.dom.expFill) this.dom.expFill.style.width = pct + '%';
        if (this.dom.expBarLabel) {
            this.dom.expBarLabel.textContent = `${formatNumber(Math.floor(this.experience))} / ${formatNumber(nextExp)}`;
        }
    }

    // +++ НОВОЕ: обновление визуала "наливающейся" чашки кофе +++
    updateCoffeeCup() {
        const ready = this.coffeePour <= 0;
        const fillPercent = ready
            ? 100
            : Math.max(0, 100 - (this.coffeePour / COFFEE_POUR_DURATION) * 100);

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

            this.dom.coffeeButton.disabled = this.count < this.coffeeCost || this.coffeePour > 0;
            this.dom.coffeeCostText.textContent = formatNumber(this.coffeeCost);
            this.updateCoffeeCup();

            const canPrestige = this.careerLevel >= CAREERS.length - 1 && this.count >= PRESTIGE_COST_PER_SHARE;
            this.dom.prestigeButton.disabled = !canPrestige;
            const shares = Math.floor((1.01 * Math.cbrt(this.count) * (Math.log10(this.count))) / (120000 + (this.count ** (1 / 6))));
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

            if (this.stress < 100) {
                // passiveIncome уже включает штраф от стресса
                this.count += this.passiveIncome * delta;
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
        this.applyOfflineEarnings();

        this.updateUI();
        this.gameLoop();

        // +++ НОВОЕ: автосохранение по таймеру и перед закрытием вкладки +++
        setInterval(() => {
            this.saveGame();
            this.updateSaveStatus();
        }, AUTOSAVE_INTERVAL_MS);

        window.addEventListener('beforeunload', () => this.saveGame());
        window.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden') this.saveGame();
        });

        console.log('Игра запущена! Стресс будет уменьшаться со временем.');
    }
}



// ================================================================
// ДОБАВЛЕННЫЙ UI-ЛОЙ: разделы магазина, карточки мастерства,
// достижения. Игровая логика и существующие методы не изменяются.
// ================================================================

// Карточки глобальных улучшений в стиле достижений.
Game.prototype.createUpgradeElements = function () {
    const container = this.dom.upgradesContainer;
    if (!container) return;
    container.innerHTML = '';
    this.upgradeElements = [];

    this.upgrades.forEach((u, index) => {
        const card = document.createElement('article');
        card.className = 'mastery-card';
        card.dataset.id = u.id;
        card.dataset.index = index;
        card.innerHTML = `
            <div class="mastery-card-icon">${u.icon}</div>
            <div class="mastery-card-content">
                <div class="mastery-card-title">${u.name}</div>
                <div class="mastery-card-description">${u.description}</div>
                <div class="mastery-card-effect" data-effect></div>
            </div>
            <div class="mastery-card-footer">
                <span class="mastery-card-price" data-price></span>
                <button class="mastery-buy-btn" type="button" data-buy>Купить</button>
            </div>`;

        card.querySelector('[data-buy]').addEventListener('click', (e) => {
            e.stopPropagation();
            card.classList.add('pressed');
            setTimeout(() => card.classList.remove('pressed'), 180);
            this.purchaseUpgradeItem(index);
        });

        container.appendChild(card);
        this.upgradeElements.push(card);
    });
};

Game.prototype.updateUpgradeElements = function () {
    this.upgrades.forEach((u, index) => {
        const el = this.upgradeElements[index];
        if (!el) return;

        if (!u.revealed && u.unlockCondition && u.unlockCondition(this)) {
            u.revealed = true;
        }

        el.style.display = u.revealed ? '' : 'none';
        el.classList.toggle('purchased', u.purchased);
        el.classList.toggle('unaffordable', !u.purchased && this.count < u.price);

        const price = el.querySelector('[data-price]');
        const effect = el.querySelector('[data-effect]');
        const buy = el.querySelector('[data-buy]');

        if (u.purchased) {
            price.textContent = '✓ Куплено';
            buy.textContent = 'Куплено';
            buy.disabled = true;
            effect.textContent = u.effectText ? `Сейчас: ${u.effectText(this)}` : 'Способность активна';
        } else {
            price.textContent = `Цена: ${formatNumber(u.price)}`;
            buy.textContent = 'Купить';
            buy.disabled = this.count < u.price;
            effect.textContent = u.required ? `Требуется уровень: ${formatNumber(u.required)}` : '';
        }
    });
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
        { icon:'👣', name:'Первый шаг', description:'Нажать кнопку «Работать!» хотя бы один раз.', check:g => g.count > 0 || g.experience > 0 },
        { icon:'💼', name:'Карьерист', description:'Получить должность не ниже менеджера.', check:g => g.careerLevel >= 3 },
        { icon:'👥', name:'Начальник', description:'Купить хотя бы одну единицу пассивного дохода.', check:g => ['staff','auto','robot','ai','processing','office'].some(id => (g.buildings.get(id)?.level || 0) > 0) },
        { icon:'😵', name:'Предел возможностей', description:'Достичь 100% стресса.', check:g => g.hasReached100Stress === true },
        { icon:'✨', name:'Мастер своего дела', description:'Купить хотя бы одно улучшение Мастерства.', check:g => g.upgrades.some(u => u.purchased) },
        { icon:'🚀', name:'Корпорация', description:'Совершить престиж.', check:g => g.prestigePoints > 0 },
    ];

    list.innerHTML = '';
    const els = achievements.map(a => {
        const el = document.createElement('article');
        el.className = 'achievement-card locked';
        el.innerHTML = `<div class="achievement-icon">${a.icon}</div><div class="achievement-body"><strong>${a.name}</strong><span>${a.description}</span></div><div class="achievement-status">🔒</div>`;
        list.appendChild(el);
        return el;
    });

    const refresh = () => {
        let unlocked = 0;
        achievements.forEach((a, i) => {
            const done = !!a.check(game);
            if (done) unlocked++;
            els[i].classList.toggle('unlocked', done);
            els[i].classList.toggle('locked', !done);
            els[i].querySelector('.achievement-status').textContent = done ? '✓' : '🔒';
        });
        progress.textContent = `${unlocked} / ${achievements.length}`;
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