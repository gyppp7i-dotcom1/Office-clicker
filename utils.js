// ======================= УТИЛИТЫ =======================
const suffixes = [
    '', ' К', ' М', ' В', ' Т', ' Qa', ' Qi',
    ' Sx', ' Sp', ' Oc', ' No', ' Dc'
];

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

function pluralizeRu(n, one, few, many) {
    const mod10 = n % 10;
    const mod100 = n % 100;
    if (mod10 === 1 && mod100 !== 11) return one;
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few;
    return many;
}

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