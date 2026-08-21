// ======================= ЗВУКОВОЙ МОДУЛЬ =======================
let audioCtx = null;

function ensureAudioCtx() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    return audioCtx;
}

function playTone(freq, duration = 0.08, type = 'sine', gain = 0.12, delay = 0) {
    const ctx = ensureAudioCtx();
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

function playClickSound() {
    try { playTone(880, 0.08, 'sine', 0.12); } catch (e) {}
}

function playBuyBuildingSound() {
    try {
        playTone(520, 0.07, 'triangle', 0.12, 0);
        playTone(780, 0.09, 'triangle', 0.12, 0.05);
    } catch (e) {}
}

function playBuildingUpgradeSound() {
    try {
        playTone(660, 0.05, 'square', 0.10, 0);
        playTone(990, 0.08, 'square', 0.10, 0.045);
    } catch (e) {}
}

function playQuantitySelectSound() {
    try { playTone(420, 0.045, 'sine', 0.08, 0); } catch (e) {}
}

function playCoffeeSound() {
    try {
        playTone(300, 0.09, 'sine', 0.10, 0);
        playTone(230, 0.14, 'sine', 0.08, 0.07);
    } catch (e) {}
}

function playGeneralUpgradeSound() {
    try {
        playTone(523.25, 0.12, 'triangle', 0.11, 0);
        playTone(659.25, 0.12, 'triangle', 0.11, 0.07);
        playTone(783.99, 0.18, 'triangle', 0.11, 0.14);
    } catch (e) {}
}

function playInsufficientFundsSound() {
    try {
        playTone(260, 0.09, 'sine', 0.06, 0);
        playTone(180, 0.13, 'sine', 0.05, 0.06);
    } catch (e) {}
}

function playIconClickSound() {
    try {
        playTone(1046.50, 0.12, 'sine', 0.05, 0);
        playTone(1318.51, 0.14, 'sine', 0.045, 0.05);
    } catch (e) {}
}

function playBackgroundClickSound() {
    try {
        const ctx = ensureAudioCtx();
        const duration = 0.06;
        const bufferSize = Math.max(1, Math.floor(ctx.sampleRate * duration));
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
        }
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 700;
        const gainNode = ctx.createGain();
        gainNode.gain.setValueAtTime(0.05, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
        noise.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(ctx.destination);
        noise.start(ctx.currentTime);
        noise.stop(ctx.currentTime + duration);
    } catch (e) {}
}

function playBriefcaseSound() {
    try {
        const ctx = ensureAudioCtx();
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
        filter.frequency.value = 2200;
        const gainNode = ctx.createGain();
        gainNode.gain.setValueAtTime(0.045, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
        noise.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(ctx.destination);
        noise.start(ctx.currentTime);
        noise.stop(ctx.currentTime + duration);
        playTone(190, 0.045, 'square', 0.035, 0.015);
    } catch (e) {}
}

function playBalanceCoinSound() {
    try {
        playTone(1567.98, 0.05, 'square', 0.05, 0);
        playTone(2093.00, 0.09, 'triangle', 0.06, 0.045);
        playTone(2637.02, 0.12, 'sine', 0.04, 0.09);
    } catch (e) {}
}

function playOfflineEarningsSound() {
    try {
        playTone(523.25, 0.10, 'triangle', 0.10, 0);
        playTone(659.25, 0.10, 'triangle', 0.10, 0.09);
        playTone(783.99, 0.10, 'triangle', 0.10, 0.18);
        playTone(1046.50, 0.16, 'triangle', 0.11, 0.27);
    } catch (e) {}
}