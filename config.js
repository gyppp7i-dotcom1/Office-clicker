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
const UPGRADE_MULTS = [3.5, 3.5, 3.5, 3.5, 3.5, 3.5, 3.5];
const NONSTANDARD_UPGRADE_MULTS = [2, 2.5, 2, 2, 2.5, 2, 2];

const UPGRADE_TYPE_PARAMS = {
    standard: { upto: 35, after: 50 },
    ai: { upto: 110, after: 150 },
    processing: { upto: 160, after: 210 },
    office: { upto: 168, after: 221 },
    aiComputer: { upto: 168, after: 221 }
};

const COFFEE_COST_MULT = 1.03;
const COFFEE_STRESS_REDUCTION = 15;
const COFFEE_POUR_DURATION = 3;
const BUFF_DURATION = 35;
const DEBUFF_DURATION = 45;
const DEBUFF_MALUS = 0.50;
const DEBUFF_STRESS_MULT = 2;
const PRESTIGE_COST_PER_SHARE = 5*10 ** 15;

const STRESS_DECAY_BASE = 0.5;
const STRESS_DECAY_GYM_BONUS = 0.10;

// ======================= НОВЫЕ МЕХАНИКИ =======================
const COFFEE_MASTER_PRICE = 1e12;
const COFFEE_STREAK_REQUIRED = 15;
const COFFEE_MASTER_POUR_DURATION = 1;
const COFFEE_BUFF_STRENGTH_PER_GYM_LEVEL = 0.1;
const COFFEE_BUFF_DURATION_PER_GYM_LEVEL = 0.05;
const YOGA_PURCHASE_BASE_COST = 1e6;
const YOGA_PURCHASE_COST_MULT = 200;
const YOGA_UPGRADE_COST_MULT = 100; // Улучшение: 100 × базовая цена × 1000^текущий уровень улучшения
const YOGA_PEACE_SPEED_PER_LEVEL = 0.01;
const PEACE_FILL_DELAY_MS = 60 * 1000;
const PEACE_BASE_FILL_SECONDS = 100;
const PEACE_PER_SECOND = 1 / PEACE_BASE_FILL_SECONDS; // 100% за 100 секунд без уровней йоги
const PEACE_INCOME_PER_PERCENT = 0.03;
const PEACE_WORK_MULT = 0.70;
const POST_MAX_EXP_BASE = 300e6;
const POST_MAX_EXP_GROWTH = 30;
const POST_MAX_INCOME_MULT = 2;

const SAVE_KEY = 'officePlanktonSave';
const SAVE_VERSION = 2;
const AUTOSAVE_INTERVAL_MS = 15000;
const MAX_OFFLINE_SECONDS = 24 * 60 * 60;
const MIN_OFFLINE_SECONDS_TO_NOTIFY = 60;

// ======================= КОНФИГУРАЦИЯ ЗДАНИЙ =======================
const BUILDINGS = {
    equip: {
        name: 'Оборудование', icon: '⌨️', baseCost: 100, costMult: 1.12, clickPower: 0.2,
        upgradeType: 'standard', alwaysVisible: true,
        dom: { lvl: 'equipLvl', cost: 'equipCost', btn: 'upgradeEquip', multBtn: 'upgradeEquipMult', multPrice: 'equipMultPrice', upgradeLvl: 'equipUpgradeLvl', icon: 'equipIcon', info: 'equipClickInfo', shop: 'shop-equip' }
    },
    coffeeMachine: {
        name: 'Кофе-машина', icon: '☕', baseCost: 10000, costMult: 1.14, clickPower: 3,
        upgradeType: 'standard', alwaysVisible: true,
        dom: { lvl: 'coffeeMachineLvl', cost: 'coffeeMachineCost', btn: 'upgradeCoffeeMachine', multBtn: 'upgradeCoffeeMachineMult', multPrice: 'coffeeMachineMultPrice', upgradeLvl: 'coffeeMachineUpgradeLvl', icon: 'coffeeMachineIcon', info: 'coffeeClickInfo', shop: 'shop-coffee' }
    },
    secretary: {
        name: 'Личный секретарь', icon: '👔', baseCost: 150000, costMult: 1.15, clickPower: 50,
        upgradeType: 'standard',
        dom: { lvl: 'secretaryLvl', cost: 'secretaryCost', btn: 'upgradeSecretary', multBtn: 'upgradeSecretaryMult', multPrice: 'secretaryMultPrice', upgradeLvl: 'secretaryUpgradeLvl', icon: 'secretaryIcon', info: 'secretaryClickInfo', shop: 'shop-secretary' }
    },
    aiComputer: {
        name: 'AI-ЭВМ', icon: '🖥️', baseCost: 1e10, costMult: 1.3, clickPower: 10 * 10 ** 6,
        upgradeType: 'aiComputer',
        dom: { lvl: 'aiComputerLvl', cost: 'aiComputerCost', btn: 'upgradeAIComputer', multBtn: 'upgradeAIComputerMult', multPrice: 'aiComputerMultPrice', upgradeLvl: 'aiComputerUpgradeLvl', icon: 'aiComputerIcon', info: 'aiComputerClickInfo', shop: 'shop-aiComputer' }
    },
    staff: {
        name: 'Персонал', icon: '👥', baseCost: 150, costMult: 1.11, cps: 1,
        upgradeType: 'standard', alwaysVisible: true,
        dom: { lvl: 'staffLvl', cost: 'staffCost', btn: 'upgradeStaff', multBtn: 'upgradeStaffMult', multPrice: 'staffMultPrice', upgradeLvl: 'staffUpgradeLvl', icon: 'staffIcon', info: 'staffCpsInfo', shop: 'shop-staff' }
    },
    auto: {
        name: 'Отдел автоматизации', icon: '🤖', baseCost: 10000, costMult: 1.13, cps: 10,
        upgradeType: 'standard',
        dom: { lvl: 'autoLvl', cost: 'autoCost', btn: 'upgradeAuto', multBtn: 'upgradeAutoMult', multPrice: 'autoMultPrice', upgradeLvl: 'autoUpgradeLvl', icon: 'autoIcon', info: 'autoCpsInfo', shop: 'shop-auto' }
    },
    robot: {
        name: 'Роботы-помощники', icon: '🦾', baseCost: 600000, costMult: 1.134, cps: 400,
        upgradeType: 'standard',
        dom: { lvl: 'robotLvl', cost: 'robotCost', btn: 'upgradeRobot', multBtn: 'upgradeRobotMult', multPrice: 'robotMultPrice', upgradeLvl: 'robotUpgradeLvl', icon: 'robotIcon', info: 'robotCpsInfo', shop: 'shop-robot' }
    },
    ai: {
        name: 'AI-ассистент', icon: '🧠', baseCost: 10999980, costMult: 1.17, cps: 9999,
        upgradeType: 'ai',
        dom: { lvl: 'aiLvl', cost: 'aiCost', btn: 'upgradeAI', multBtn: 'upgradeAIMult', multPrice: 'aiMultPrice', upgradeLvl: 'aiUpgradeLvl', icon: 'aiIcon', info: 'aiCpsInfo', shop: 'shop-ai' }
    },
    processing: {
        name: 'Отдел обработки', icon: '⚙️', baseCost: 1.5e9, costMult: 1.2, cps: 300000,
        upgradeType: 'processing',
        dom: { lvl: 'processingLvl', cost: 'processingCost', btn: 'upgradeProcessing', multBtn: 'upgradeProcessingMult', multPrice: 'processingMultPrice', upgradeLvl: 'processingUpgradeLvl', icon: 'processingIcon', info: 'processingCpsInfo', shop: 'shop-processing' }
    },
    office: {
        name: 'Собственный офис', icon: '🏢', baseCost: 1e11, costMult: 1.35, cps: 1e7,
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
    },
    dataCenter: {
        name: 'Дата-центр',
        icon: '🏢',
        baseCost: 20000e15,      // 900 Qa × 20
        costMult: 1.4,
        cps: 1000e9,            // 15 Qa
        upgradeType: 'standard',
        alwaysVisible: false,
        dom: {
            lvl: 'dataCenterLvl',
            cost: 'dataCenterCost',
            btn: 'upgradeDataCenter',
            multBtn: 'upgradeDataCenterMult',
            multPrice: 'dataCenterMultPrice',
            upgradeLvl: 'dataCenterUpgradeLvl',
            icon: 'dataCenterIcon',
            info: 'dataCenterCpsInfo',
            shop: 'shop-dataCenter'
        }
    }
};