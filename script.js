// Конфигурация игры
const CONFIG = {
    PLAYER_SYMBOL: '❌',
    AI_SYMBOL: '⭕',
    WINNING_PATTERNS: [
        [0, 1, 2], [3, 4, 5], [6, 7, 8], // Горизонтали
        [0, 3, 6], [1, 4, 7], [2, 5, 8], // Вертикали
        [0, 4, 8], [2, 4, 6]             // Диагонали
    ]
};

// Состояние игры
let gameState = {
    board: Array(9).fill(''),
    currentPlayer: CONFIG.PLAYER_SYMBOL,
    gameActive: true,
    isPlayerTurn: true,
    botToken: '',
    chatId: '',
    stats: {
        wins: 0,
        losses: 0,
        promos: 0
    }
};

// DOM элементы
const elements = {
    board: document.getElementById('board'),
    gameStatus: document.getElementById('gameStatus'),
    winNotification: document.getElementById('winNotification'),
    loseNotification: document.getElementById('loseNotification'),
    promoCode: document.getElementById('promoCode'),
    botTokenInput: document.getElementById('botToken'),
    manualChatIdInput: document.getElementById('manualChatId'),
    chatIdDisplay: document.getElementById('chatIdDisplay'),
    autoDetectBtn: document.getElementById('autoDetectBtn'),
    saveConfigBtn: document.getElementById('saveConfigBtn'),
    configStatus: document.getElementById('configStatus'),
    botConfigSection: document.getElementById('botConfigSection'),
    newGameBtn: document.getElementById('newGameBtn'),
    toggleConfigBtn: document.getElementById('toggleConfigBtn'),
    continueBtn: document.getElementById('continueBtn'),
    playAgainBtn: document.getElementById('playAgainBtn'),
    instructionsModal: document.getElementById('instructionsModal'),
    closeInstructionsBtn: document.getElementById('closeInstructionsBtn'),
    viewInstructions: document.getElementById('viewInstructions'),
    resetStats: document.getElementById('resetStats'),
    winsCount: document.getElementById('winsCount'),
    lossesCount: document.getElementById('lossesCount'),
    promosCount: document.getElementById('promosCount')
};

// Инициализация игры
function initGame() {
    gameState.board = Array(9).fill('');
    gameState.currentPlayer = CONFIG.PLAYER_SYMBOL;
    gameState.gameActive = true;
    gameState.isPlayerTurn = true;
    
    // Очищаем ячейки
    document.querySelectorAll('.cell').forEach(cell => {
        cell.textContent = '';
        cell.classList.remove('taken');
        cell.addEventListener('click', handleCellClick, { once: true });
    });
    
    updateGameStatus('Ваш ход');
    elements.winNotification.classList.add('hidden');
    elements.loseNotification.classList.add('hidden');
    
    // Показываем или скрываем настройки
    if (!gameState.botToken) {
        elements.botConfigSection.style.display = 'block';
    } else {
        elements.botConfigSection.style.display = 'none';
    }
}

// Обработка клика по ячейке
function handleCellClick(e) {
    if (!gameState.gameActive || !gameState.isPlayerTurn) return;
    
    const cell = e.target;
    const index = parseInt(cell.dataset.index);
    
    if (gameState.board[index] !== '') return;
    
    // Ход игрока
    makeMove(cell, index, CONFIG.PLAYER_SYMBOL);
    
    // Проверка победы игрока
    if (checkWin(CONFIG.PLAYER_SYMBOL)) {
        handleWin();
        return;
    }
    
    // Проверка ничьей
    if (isBoardFull()) {
        handleDraw();
        return;
    }
    
    // Ход компьютера
    gameState.isPlayerTurn = false;
    updateGameStatus('Ход компьютера...');
    
    setTimeout(() => {
        if (gameState.gameActive) {
            makeAiMove();
        }
    }, 800);
}

// Совершение хода
function makeMove(cell, index, symbol) {
    gameState.board[index] = symbol;
    cell.textContent = symbol;
    cell.classList.add('taken');
    gameState.currentPlayer = symbol === CONFIG.PLAYER_SYMBOL ? CONFIG.AI_SYMBOL : CONFIG.PLAYER_SYMBOL;
}

// Ход ИИ (компьютера)
function makeAiMove() {
    if (!gameState.gameActive) return;
    
    // Пытаемся выиграть
    let move = findWinningMove(CONFIG.AI_SYMBOL);
    
    // Если не можем выиграть, блокируем игрока
    if (move === -1) {
        move = findWinningMove(CONFIG.PLAYER_SYMBOL);
    }
    
    // Если нечего блокировать, делаем случайный ход
    if (move === -1) {
        const emptyCells = gameState.board
            .map((val, idx) => val === '' ? idx : null)
            .filter(val => val !== null);
        
        if (emptyCells.length > 0) {
            move = emptyCells[Math.floor(Math.random() * emptyCells.length)];
        }
    }
    
    if (move !== -1) {
        const aiCell = document.querySelector(`.cell[data-index="${move}"]`);
        makeMove(aiCell, move, CONFIG.AI_SYMBOL);
        
        // Проверка победы компьютера
        if (checkWin(CONFIG.AI_SYMBOL)) {
            handleLoss();
            return;
        }
        
        // Проверка ничьей
        if (isBoardFull()) {
            handleDraw();
            return;
        }
    }
    
    gameState.isPlayerTurn = true;
    updateGameStatus('Ваш ход');
}

// Поиск выигрышного хода
function findWinningMove(symbol) {
    for (const pattern of CONFIG.WINNING_PATTERNS) {
        const [a, b, c] = pattern;
        const cells = [gameState.board[a], gameState.board[b], gameState.board[c]];
        
        // Считаем сколько клеток занято нужным символом
        const symbolCount = cells.filter(cell => cell === symbol).length;
        
        // Считаем сколько клеток пустые
        const emptyCount = cells.filter(cell => cell === '').length;
        
        // Если две клетки заняты символом и одна пустая, это выигрышный ход
        if (symbolCount === 2 && emptyCount === 1) {
            const emptyIndex = pattern[cells.findIndex(cell => cell === '')];
            return emptyIndex;
        }
    }
    
    return -1;
}

// Проверка победы
function checkWin(symbol) {
    return CONFIG.WINNING_PATTERNS.some(pattern =>
        pattern.every(index => gameState.board[index] === symbol)
    );
}

// Проверка заполнения поля
function isBoardFull() {
    return gameState.board.every(cell => cell !== '');
}

// Обновление статуса игры
function updateGameStatus(message) {
    elements.gameStatus.textContent = message;
}

// Обработка победы
async function handleWin() {
    gameState.gameActive = false;
    updateGameStatus('🎉 Вы победили!');
    
    // Генерируем промокод
    const promoCode = generatePromoCode();
    elements.promoCode.textContent = promoCode;
    elements.winNotification.classList.remove('hidden');
    
    // Обновляем статистику
    gameState.stats.wins++;
    gameState.stats.promos++;
    updateStats();
    saveStats();
    
    // Отправляем уведомление в Telegram
    if (gameState.botToken && gameState.chatId) {
        await sendTelegramNotification('win', promoCode);
    }
}

// Обработка поражения
async function handleLoss() {
    gameState.gameActive = false;
    updateGameStatus('💔 Вы проиграли');
    elements.loseNotification.classList.remove('hidden');
    
    // Обновляем статистику
    gameState.stats.losses++;
    updateStats();
    saveStats();
    
    // Отправляем уведомление в Telegram
    if (gameState.botToken && gameState.chatId) {
        await sendTelegramNotification('lose');
    }
}

// Обработка ничьей
function handleDraw() {
    gameState.gameActive = false;
    updateGameStatus('🤝 Ничья!');
    
    // Через секунду предлагаем новую игру
    setTimeout(() => {
        if (confirm('Ничья! Хотите сыграть ещё раз?')) {
            initGame();
        }
    }, 1000);
}

// Генерация промокода
function generatePromoCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = '';
    for (let i = 0; i < 5; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

// Автоматическое определение Chat ID
async function autoDetectChatId() {
    const token = elements.botTokenInput.value.trim();
    
    if (!token) {
        showConfigMessage('Введите токен бота сначала', 'error');
        return;
    }
    
    showConfigMessage('Определяю Chat ID...', 'info');
    
    try {
        // Получаем обновления от бота
        const response = await fetch(`https://api.telegram.org/bot${token}/getUpdates`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!data.ok) {
            throw new Error(data.description || 'Ошибка Telegram API');
        }
        
        const updates = data.result;
        
        if (updates.length === 0) {
            showConfigMessage(
                'Сообщений от бота не найдено. Напишите вашему боту "Привет" или "Старт" и попробуйте снова.',
                'error'
            );
            return;
        }
        
        // Берем последнее обновление
        const lastUpdate = updates[updates.length - 1];
        const chatId = lastUpdate.message?.chat?.id || lastUpdate.my_chat_member?.chat?.id;
        
        if (!chatId) {
            throw new Error('Не удалось извлечь Chat ID из обновлений');
        }
        
        // Показываем найденный Chat ID
        elements.chatIdDisplay.textContent = chatId;
        elements.manualChatIdInput.value = chatId;
        
        showConfigMessage(`Chat ID успешно определен: ${chatId}`, 'success');
        
        // Сохраняем токен и Chat ID в состоянии
        gameState.botToken = token;
        gameState.chatId = chatId.toString();
        
    } catch (error) {
        console.error('Ошибка при определении Chat ID:', error);
        showConfigMessage(`Ошибка: ${error.message}`, 'error');
    }
}

// Отправка уведомления в Telegram
async function sendTelegramNotification(result, promoCode = null) {
    if (!gameState.botToken || !gameState.chatId) {
        console.log('Telegram бот не настроен');
        return false;
    }
    
    let message;
    
    if (result === 'win') {
        message = `🎉 Победа в Крестиках-ноликах!\n\nВы выиграли промокод на скидку:\n\n<code>${promoCode}</code>\n\nСкопируйте его и используйте при следующей покупке!`;
    } else {
        message = '💔 К сожалению, в этот раз победа за компьютером.\n\nНе расстраивайтесь, попробуйте снова! Удачи!';
    }
    
    try {
        const url = `https://api.telegram.org/bot${gameState.botToken}/sendMessage`;
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chat_id: gameState.chatId,
                text: message,
                parse_mode: 'HTML',
                disable_web_page_preview: true
            })
        });
        
        const data = await response.json();
        
        if (!data.ok) {
            console.error('Ошибка Telegram API:', data);
            return false;
        }
        
        console.log('Уведомление отправлено в Telegram');
        return true;
        
    } catch (error) {
        console.error('Ошибка отправки в Telegram:', error);
        return false;
    }
}

// Сохранение настроек бота
function saveBotConfig() {
    const token = elements.botTokenInput.value.trim();
    let chatId = elements.manualChatIdInput.value.trim();
    
    if (!chatId && elements.chatIdDisplay.textContent !== 'Не определён') {
        chatId = elements.chatIdDisplay.textContent;
    }
    
    if (!token) {
        showConfigMessage('Введите токен бота', 'error');
        return;
    }
    
    if (!chatId) {
        showConfigMessage('Введите или определите Chat ID', 'error');
        return;
    }
    
    // Сохраняем в состоянии
    gameState.botToken = token;
    gameState.chatId = chatId;
    
    // Сохраняем в localStorage
    localStorage.setItem('ticTacToe_botToken', token);
    localStorage.setItem('ticTacToe_chatId', chatId);
    
    showConfigMessage('Настройки успешно сохранены!', 'success');
    
    // Скрываем панель настроек
    elements.botConfigSection.style.display = 'none';
}

// Загрузка сохраненных настроек
function loadSavedConfig() {
    const savedToken = localStorage.getItem('ticTacToe_botToken');
    const savedChatId = localStorage.getItem('ticTacToe_chatId');
    
    if (savedToken) {
        gameState.botToken = savedToken;
        elements.botTokenInput.value = savedToken;
    }
    
    if (savedChatId) {
        gameState.chatId = savedChatId;
        elements.chatIdDisplay.textContent = savedChatId;
        elements.manualChatIdInput.value = savedChatId;
    }
    
    // Загружаем статистику
    const savedStats = localStorage.getItem('ticTacToe_stats');
    if (savedStats) {
        gameState.stats = JSON.parse(savedStats);
        updateStats();
    }
}

// Обновление отображения статистики
function updateStats() {
    elements.winsCount.textContent = gameState.stats.wins;
    elements.lossesCount.textContent = gameState.stats.losses;
    elements.promosCount.textContent = gameState.stats.promos;
}

// Сохранение статистики
function saveStats() {
    localStorage.setItem('ticTacToe_stats', JSON.stringify(gameState.stats));
}

// Показ сообщения в настройках
function showConfigMessage(message, type = 'info') {
    elements.configStatus.textContent = message;
    elements.configStatus.className = 'status-message';
    
    if (type === 'success') {
        elements.configStatus.classList.add('success');
    } else if (type === 'error') {
        elements.configStatus.classList.add('error');
    }
}

// Инициализация событий
function initEventListeners() {
    // Кнопка автоопределения Chat ID
    elements.autoDetectBtn.addEventListener('click', autoDetectChatId);
    
    // Кнопка сохранения настроек
    elements.saveConfigBtn.addEventListener('click', saveBotConfig);
    
    // Кнопка новой игры
    elements.newGameBtn.addEventListener('click', initGame);
    
    // Кнопка переключения настроек
    elements.toggleConfigBtn.addEventListener('click', () => {
        elements.botConfigSection.style.display = 
            elements.botConfigSection.style.display === 'none' ? 'block' : 'none';
    });
    
    // Кнопки продолжения игры
    elements.continueBtn.addEventListener('click', initGame);
    elements.playAgainBtn.addEventListener('click', initGame);
    
    // Инструкции
    elements.viewInstructions.addEventListener('click', (e) => {
        e.preventDefault();
        elements.instructionsModal.classList.remove('hidden');
    });
    
    elements.closeInstructionsBtn.addEventListener('click', () => {
        elements.instructionsModal.classList.add('hidden');
    });
    
    // Сброс статистики
    elements.resetStats.addEventListener('click', (e) => {
        e.preventDefault();
        if (confirm('Вы уверены, что хотите сбросить статистику?')) {
            gameState.stats = { wins: 0, losses: 0, promos: 0 };
            updateStats();
            saveStats();
        }
    });
    
    // Закрытие модального окна при клике вне его
    elements.instructionsModal.addEventListener('click', (e) => {
        if (e.target === elements.instructionsModal) {
            elements.instructionsModal.classList.add('hidden');
        }
    });
    
    // Сохранение токена при изменении
    elements.botTokenInput.addEventListener('change', () => {
        localStorage.setItem('ticTacToe_botToken', elements.botTokenInput.value);
    });
}

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', () => {
    // Загружаем сохраненные настройки
    loadSavedConfig();
    
    // Инициализируем обработчики событий
    initEventListeners();
    
    // Запускаем игру
    initGame();
    
    // Показываем приветственное сообщение
    if (!gameState.botToken) {
        showConfigMessage('Настройте Telegram-бота для получения уведомлений о победах и промокодов!', 'info');
    }
});
