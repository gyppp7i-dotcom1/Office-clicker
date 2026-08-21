// ======================= КЛАСС BUILDING =======================
class Building {
    constructor(id, stats) {
        this.id = id;
        this.stats = stats;
        this.level = 0;
        this.upgradeLevel = 0;
        this.costDiscount = 1;
        this.dom = {};
        if (stats.dom) {
            for (const [key, val] of Object.entries(stats.dom)) {
                this.dom[key] = document.getElementById(val);
            }
        }
    }

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