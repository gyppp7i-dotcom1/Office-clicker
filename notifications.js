// ======================= TOAST-УВЕДОМЛЕНИЯ =======================

class ToastManager {
    constructor() {
        this.container = document.createElement('div');
        this.container.className = 'toast-container';
        this.container.setAttribute('aria-live', 'polite');
        this.container.setAttribute('aria-atomic', 'false');
        document.body.appendChild(this.container);

        this.maxToasts = 5;
    }

    show(options = {}) {
        const icon = options.icon || 'ℹ️';
        const text = options.text || '';
        const type = ['info', 'success', 'warning'].includes(options.type)
            ? options.type
            : 'info';

        const duration = Math.max(
            500,
            Number(options.duration) || 3000
        );

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.setAttribute('role', 'status');

        const iconElement = document.createElement('span');
        iconElement.className = 'toast-icon';
        iconElement.textContent = icon;

        const textElement = document.createElement('span');
        textElement.className = 'toast-text';
        textElement.textContent = text;

        const closeButton = document.createElement('button');
        closeButton.className = 'toast-close';
        closeButton.type = 'button';
        closeButton.textContent = '×';
        closeButton.setAttribute('aria-label', 'Закрыть уведомление');

        toast.append(iconElement, textElement, closeButton);
        this.container.appendChild(toast);

        while (this.container.children.length > this.maxToasts) {
            this.container.firstElementChild.remove();
        }

        requestAnimationFrame(() => {
            toast.classList.add('toast-visible');
        });

        let closed = false;
        let timer = null;

        const close = () => {
            if (closed) return;
            closed = true;

            if (timer) clearTimeout(timer);

            toast.classList.remove('toast-visible');
            toast.classList.add('toast-leaving');

            setTimeout(() => {
                toast.remove();
            }, 250);
        };

        closeButton.addEventListener('click', close);
        timer = setTimeout(close, duration);

        return close;
    }
}

const toastManager = new ToastManager();

function showToast(options) {
    return toastManager.show(options);
}


// ======================= МОДАЛЬНЫЕ УВЕДОМЛЕНИЯ =======================

class NotificationManager {
    constructor() {
        this.storageKey = 'officePlanktonNotificationsShown';
        this.shown = this.loadShown();
        this.queue = [];
        this.isShowing = false;
        this.overlay = null;
        this.currentConfig = null;
        this._buildDOM();
    }

    loadShown() {
        try {
            const raw = localStorage.getItem(this.storageKey);
            const parsed = raw ? JSON.parse(raw) : [];
            return new Set(Array.isArray(parsed) ? parsed : []);
        } catch (e) {
            return new Set();
        }
    }

    saveShown() {
        try {
            localStorage.setItem(
                this.storageKey,
                JSON.stringify([...this.shown])
            );
        } catch (e) {
            console.warn('Не удалось сохранить уведомления:', e);
        }
    }

    hasShown(id) {
        return this.shown.has(id);
    }

    markShown(id) {
        this.shown.add(id);
        this.saveShown();
    }

    _buildDOM() {
        const overlay = document.createElement('div');
        overlay.className = 'notif-overlay';

        overlay.innerHTML = `
            <div class="notif-modal" role="dialog" aria-modal="true">
                <div class="notif-icon" id="notifIcon">📢</div>
                <div class="notif-title" id="notifTitle">Уведомление</div>
                <div class="notif-text" id="notifText"></div>
                <div class="notif-buttons" id="notifButtons"></div>
            </div>
        `;

        document.body.appendChild(overlay);
        this.overlay = overlay;
    }

    notify(config) {
        if (!config) return;

        if (
            config.once &&
            config.id &&
            this.hasShown(config.id)
        ) {
            return;
        }

        this.queue.push(config);
        this.processQueue();
    }

    processQueue() {
        if (this.isShowing || this.queue.length === 0) return;

        this.isShowing = true;
        this.render(this.queue.shift());
    }

    render(config) {
        this.currentConfig = config;

        const icon = this.overlay.querySelector('#notifIcon');
        const title = this.overlay.querySelector('#notifTitle');
        const text = this.overlay.querySelector('#notifText');
        const buttons = this.overlay.querySelector('#notifButtons');
        const modal = this.overlay.querySelector('.notif-modal');

        icon.textContent = config.icon || '📢';
        title.textContent = config.title || 'Уведомление';
        text.innerHTML = config.text || '';
        buttons.innerHTML = '';

        const buttonConfigs = config.buttons?.length
            ? config.buttons
            : [{ text: 'ОК', primary: true }];

        buttonConfigs.forEach(buttonConfig => {
            const button = document.createElement('button');

            button.className =
                'notif-btn' +
                (buttonConfig.primary ? ' notif-btn-primary' : '');

            button.type = 'button';
            button.textContent = buttonConfig.text || 'ОК';

            button.addEventListener('click', () => {
                this.close();

                if (typeof buttonConfig.onClick === 'function') {
                    buttonConfig.onClick();
                }
            });

            buttons.appendChild(button);
        });

        this.overlay.classList.add('visible');

        requestAnimationFrame(() => {
            modal.classList.add('notif-enter');
        });

        this.playSound(config.sound);
    }

    close() {
        const config = this.currentConfig;
        const modal = this.overlay.querySelector('.notif-modal');

        this.overlay.classList.remove('visible');
        modal.classList.remove('notif-enter');

        if (config?.once && config.id) {
            this.markShown(config.id);
        }

        this.currentConfig = null;
        this.isShowing = false;

        setTimeout(() => this.processQueue(), 200);
    }

    playSound(type) {
        try {
            if (typeof playTone !== 'function') return;

            if (type === 'success') {
                playTone(659.25, 0.1, 'triangle', 0.1, 0);
                playTone(880, 0.14, 'triangle', 0.1, 0.09);
            } else if (type === 'warning') {
                playTone(300, 0.12, 'sawtooth', 0.08, 0);
                playTone(220, 0.16, 'sawtooth', 0.07, 0.08);
            } else {
                playTone(784, 0.09, 'sine', 0.09, 0);
                playTone(1046.5, 0.12, 'sine', 0.08, 0.06);
            }
        } catch (e) {
            // Звук не должен ломать игру
        }
    }
}

const notificationManager = new NotificationManager();