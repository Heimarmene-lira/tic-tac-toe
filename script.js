const board = document.getElementById("board");
const message = document.getElementById("message");
const restartBtn = document.getElementById("restart");
const drawBtn = document.getElementById("draw");

const BOT_TOKEN = "PASTE_BOT_TOKEN_HERE";
let CHAT_ID = null;

let cells = [];
let gameActive = true;

// --- Получаем chat_id автоматически ---
async function fetchChatId() {
  try {
    const res = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/getUpdates`
    );
    const data = await res.json();
    const lastUpdate = data.result[data.result.length - 1];
    CHAT_ID = lastUpdate.message.chat.id;
  } catch (e) {
    console.error("Не удалось получить chat_id");
  }
}

fetchChatId();

// --- Отправка в Telegram ---
function sendToTelegram(text) {
  if (!CHAT_ID) return;
  fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: CHAT_ID,
      text
    })
  });
}

function generatePromoCode() {
  return Math.floor(10000 + Math.random() * 90000);
}

function checkWin(symbol) {
  const wins = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6]
  ];
  return wins.some(combo => combo.every(i => cells[i] === symbol));
}

function computerMove() {
  const empty = cells
    .map((v, i) => v === "" ? i : null)
    .filter(v => v !== null);

  if (empty.length === 0) return;

  const move = empty[Math.floor(Math.random() * empty.length)];
  cells[move] = "O";
  render();

  if (checkWin("O")) {
    gameActive = false;
    message.textContent = "Вы проиграли 😔";
    sendToTelegram("Проигрыш");
    endGame();
  }
}

function handleClick(index) {
  if (!gameActive || cells[index] !== "") return;

  cells[index] = "X";
  render();

  if (checkWin("X")) {
    gameActive = false;
    const code = generatePromoCode();
    message.textContent = `🎉 Победа! Ваш промокод: ${code}`;
    sendToTelegram(`Победа! Промокод выдан: ${code}`);
    endGame();
    return;
  }

  setTimeout(computerMove, 450);
}

function render() {
  board.innerHTML = "";
  cells.forEach((value, index) => {
    const cell = document.createElement("div");
    cell.className = `cell ${value}`;
    cell.textContent = value;
    cell.onclick = () => handleClick(index);
    board.appendChild(cell);
  });
}

function endGame() {
  restartBtn.classList.remove("hidden");
  drawBtn.classList.add("hidden");
}

function restart() {
  cells = Array(9).fill("");
  gameActive = true;
  message.textContent = "";
  restartBtn.classList.add("hidden");
  drawBtn.classList.remove("hidden");
  render();
}

drawBtn.onclick = () => {
  gameActive = false;
  message.textContent = "🤝 Зафиксирована ничья";
  sendToTelegram("Ничья");
  endGame();
};

restartBtn.onclick = restart;

restart();
