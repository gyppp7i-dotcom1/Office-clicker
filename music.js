document.addEventListener('DOMContentLoaded', () => {
    const music = document.getElementById('bgMusic');
    const musicToggle = document.getElementById('musicToggle');
    const volumeSlider = document.getElementById('musicVolume');

    if (!music || !musicToggle) return;

    // --- Громкость ---
    const savedVolume = localStorage.getItem('musicVolume');
    const parsedVolume = Number(savedVolume);
    const initialVolume =
        savedVolume === null || !Number.isFinite(parsedVolume)
            ? 0.2
            : Math.max(0, Math.min(1, parsedVolume));

    music.volume = initialVolume;

    if (volumeSlider) {
        volumeSlider.value = initialVolume;
        volumeSlider.addEventListener('input', () => {
            const volume = Math.max(0, Math.min(1, Number(volumeSlider.value)));
            music.volume = volume;
            localStorage.setItem('musicVolume', String(volume));
        });
    }

    // --- Состояние включения / выключения ---
    const getStoredEnabled = () => {
        const stored = localStorage.getItem('musicEnabled');
        // Если значение не сохранено – по умолчанию true (включена)
        if (stored === null) return true;
        return stored === 'true';
    };

    let musicEnabled = getStoredEnabled();

    // --- Функция обновления текста кнопки ---
    const updateButton = () => {
        musicToggle.textContent = musicEnabled
            ? '🔊 Музыка: вкл.'
            : '🎵 Музыка: выкл.';
    };

    // --- Функция попытки запуска (если музыка включена) ---
    const tryPlay = () => {
        if (!musicEnabled) return;
        music.play().catch(() => {
            // Ошибка автовоспроизведения – игнорируем, позже запустится по клику
        });
        updateButton();
    };

    // --- Функция остановки (пауза) ---
    const tryPause = () => {
        music.pause();
        updateButton();
    };

    // --- Управление воспроизведением в зависимости от musicEnabled ---
    const syncPlayback = () => {
        if (musicEnabled) {
            // Если музыка на паузе – пробуем запустить
            if (music.paused) {
                music.play().catch(() => {});
            }
        } else {
            // Если выключена – ставим на паузу
            if (!music.paused) {
                music.pause();
            }
        }
        updateButton();
    };

    // --- Загрузка: применяем сохранённое состояние ---
    syncPlayback();

    // --- Клик по кнопке переключения ---
    musicToggle.addEventListener('click', (event) => {
        event.stopPropagation();

        // Инвертируем состояние
        musicEnabled = !musicEnabled;
        localStorage.setItem('musicEnabled', String(musicEnabled));

        // Применяем изменение
        syncPlayback();
    });

    // --- Автоматический запуск при первом взаимодействии с игрой ---
    document.addEventListener('pointerdown', (event) => {
        // Если клик по кнопке переключения – не перехватываем (она уже обработана выше)
        if (event.target.closest('#musicToggle')) return;

        // Если музыка включена, но не играет – пытаемся запустить
        if (musicEnabled && music.paused) {
            music.play().catch(() => {});
            updateButton();
        }
    });

    // --- При скрытии вкладки ставим на паузу, при возврате возобновляем (если включена) ---
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
            // Просто ставим на паузу, не меняя musicEnabled
            if (!music.paused) {
                music.pause();
            }
        } else {
            // Вкладка снова видна – если музыка включена, пробуем возобновить
            if (musicEnabled && music.paused) {
                music.play().catch(() => {});
            }
            updateButton();
        }
    });

    // --- Первоначальное обновление кнопки ---
    updateButton();
});