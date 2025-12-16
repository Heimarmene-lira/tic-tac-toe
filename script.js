// --- НАСТРОЙКИ TELEGRAM (Заполните своими данными) ---
const TELEGRAM_BOT_TOKEN = 8504925989:AAF-isr5TpYcnfZk8ivLYY8p9ditrMMztFY; 
const TELEGRAM_CHAT_ID = 1234088555;     

// --- ИГРОВАЯ ЛОГИКА ---
const boardElement = document.getElementById('board');
const cells = document.querySelectorAll('.cell');
const statusDisplay = document.getElementById('status');
const modal = document.getElementById('modal');
const modalTitle = document.getElementById('modal-title');
const modalMessage = document.getElementById('modal-message');
const promoContainer = document.getElementById('promo-container');
const promoDisplay = document.getElementById('promo-code-display');
const restartBtn = document.getElementById('restart-btn');

let gameState = ["", "", "", "", "", "", "", "", ""];
let gameActive = true;
const PLAYER = "X";
const COMPUTER = "O";

// Выигрышные комбинации
const winningConditions = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
];

// Слушатели событий
cells.forEach(cell => cell.addEventListener('click', handleCellClick));
restartBtn.addEventListener('click', restartGame);

function handleCellClick(clickedCellEvent) {
    const clickedCell = clickedCellEvent.target;
    const clickedCellIndex = parseInt(clickedCell.getAttribute('data-index'));

    if (gameState[clickedCellIndex] !== "" || !gameActive) {
        return;
    }

    handlePlayerMove(clickedCell, clickedCellIndex);
    
    if (gameActive) {
        // Небольшая задержка перед ходом компьютера для реалистичности
        statusDisplay.innerText = "Компьютер думает...";
        setTimeout(computerMove, 600);
    }
}

function handlePlayerMove(cell, index) {
    gameState[index] = PLAYER;
    cell.innerText = PLAYER;
    cell.classList.add('x');
    checkResult();
}

function computerMove() {
    if (!gameActive) return;

    // Простой ИИ: пытается найти пустые клетки
    let availableCells = gameState.map((val, idx) => val === "" ? idx : null).filter(val => val !== null);
    
    if (availableCells.length > 0) {
        // Рандомный выбор клетки (чтобы можно было выиграть)
        const randomIndex = Math.floor(Math.random() * availableCells.length);
        const moveIndex = availableCells[randomIndex];

        gameState[moveIndex] = COMPUTER;
        const cell = document.querySelector(`.cell[data-index='${moveIndex}']`);
        cell.innerText = COMPUTER;
        cell.classList.add('o');
        
        checkResult();
        if (gameActive) statusDisplay.innerText = "Ваш ход (X)";
    }
}

function checkResult() {
    let roundWon = false;
    let winner = null;

    for (let i = 0; i <= 7; i++) {
        const winCondition = winningConditions[i];
        let a = gameState[winCondition[0]];
        let b = gameState[winCondition[1]];
        let c = gameState[winCondition[2]];

        if (a === '' || b === '' || c === '') continue;
        if (a === b && b === c) {
            roundWon = true;
            winner = a;
            break;
        }
    }

    if (roundWon) {
        endGame(winner === PLAYER ? 'win' : 'loss');
        return;
    }

    let roundDraw = !gameState.includes("");
    if (roundDraw) {
        endGame('draw');
        return;
    }
}

function generatePromoCode() {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    for (let i = 0; i < 5; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

function endGame(result) {
    gameActive = false;
    modal.classList.add('active');

    if (result === 'win') {
        const promo = generatePromoCode();
        modalTitle.innerText = "Поздравляем!";
        modalMessage.innerText = "Вы выиграли! Вот ваш подарок:";
        promoContainer.classList.remove('hidden');
        promoDisplay.innerText = promo;
        
        // Отправка в Telegram
        sendToTelegram(`🎉 Победа! Промокод выдан: ${promo}`);
    } else if (result === 'loss') {
        modalTitle.innerText = "Увы...";
        modalMessage.innerText = "В этот раз компьютер оказался хитрее.";
        promoContainer.classList.add('hidden');
        
        // Отправка в Telegram
        sendToTelegram(`😔 Проигрыш`);
    } else {
        modalTitle.innerText = "Ничья";
        modalMessage.innerText = "Победила дружба.";
        promoContainer.classList.add('hidden');
    }
}

function restartGame() {
    gameActive = true;
    gameState = ["", "", "", "", "", "", "", "", ""];
    statusDisplay.innerText = "Ваш ход (X)";
    cells.forEach(cell => {
        cell.innerText = "";
        cell.classList.remove('x', 'o');
    });
    modal.classList.remove('active');
}

// Функция отправки в Telegram
function sendToTelegram(message) {
    if (TELEGRAM_BOT_TOKEN === 'YOUR_BOT_TOKEN_HERE') {
        console.warn("Токен бота не установлен. Сообщение не отправлено.");
        return;
    }

    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    
    fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            chat_id: TELEGRAM_CHAT_ID,
            text: message
        })
    })
    .then(response => {
        if (!response.ok) console.error("Ошибка отправки в Telegram");
    })
    .catch(error => console.error("Ошибка сети:", error));
}
