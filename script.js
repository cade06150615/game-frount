const API_BASE = 'http://localhost:3000/api'; // 改成你的後端網址

const canvas = document.getElementById('monkeyCanvas');
const ctx = canvas.getContext('2d');
const openBtn = document.getElementById('openBtn');
const resultDiv = document.getElementById('result');
const timerDiv = document.getElementById('timer');
const backpackDiv = document.getElementById('backpack');
const marketDiv = document.getElementById('market');

const monkeys = [
  { name: "懶猴", rarity: "common", chance: 60, color: "#999", eyeColor: "#555", mouth: "flat" },
  { name: "電眼猴", rarity: "rare", chance: 25, color: "#3498db", eyeColor: "#1c5db6", mouth: "smile" },
  { name: "烈焰猿", rarity: "epic", chance: 10, color: "#9b59b6", eyeColor: "#6e328e", mouth: "smile" },
  { name: "星靈王", rarity: "legendary", chance: 5, color: "#f1c40f", eyeColor: "#b38b00", mouth: "smile" },
];

let backpack = [];
let market = [];
const cooldownSeconds = 60;
let cooldown = 0;
let cooldownInterval = null;

// 畫猴子
function drawMonkey(monkey) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = monkey.color;
  ctx.beginPath();
  ctx.arc(100, 100, 70, 0, 2 * Math.PI);
  ctx.fill();

  ctx.fillStyle = monkey.eyeColor;
  ctx.beginPath();
  ctx.arc(65, 80, 15, 0, 2 * Math.PI);
  ctx.arc(135, 80, 15, 0, 2 * Math.PI);
  ctx.fill();

  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 6;
  ctx.beginPath();
  if (monkey.mouth === "smile") {
    ctx.arc(100, 130, 30, 0, Math.PI);
  } else if (monkey.mouth === "flat") {
    ctx.moveTo(70, 140);
    ctx.lineTo(130, 140);
  }
  ctx.stroke();
}

// 抽一隻猴子，依機率
function rollMonkey() {
  const rand = Math.random() * 100;
  let sum = 0;
  for (const m of monkeys) {
    sum += m.chance;
    if (rand <= sum) return m;
  }
  return monkeys[0]; // 萬一沒中
}

// 顯示背包
function renderBackpack() {
  backpackDiv.innerHTML = "";
  if (backpack.length === 0) {
    backpackDiv.textContent = "背包空空如也";
    return;
  }
  backpack.forEach(item => {
    const div = document.createElement("div");
    div.className = "item " + item.rarity;
    div.innerHTML = `
      ${item.name}
      <input class="price" type="number" min="1" placeholder="定價" id="price-${item.id}" />
      <button onclick="listItem('${item.id}')">上架</button>
    `;
    backpackDiv.appendChild(div);
  });
}

// 顯示市場
function renderMarket() {
  marketDiv.innerHTML = "";
  if (market.length === 0) {
    marketDiv.textContent = "市場目前沒有物品";
    return;
  }
  market.forEach(item => {
    const div = document.createElement("div");
    div.className = "item " + item.rarity;
    div.textContent = `${item.name} — ${item.price} 🍌`;
    div.onclick = () => buyItem(item.id);
    marketDiv.appendChild(div);
  });
}

// 開箱
async function openBox() {
  if (cooldown > 0) return;
  const monkey = rollMonkey();
  drawMonkey(monkey);
  resultDiv.textContent = `你開到了：${monkey.name} (${monkey.rarity})！`;

  // 新增至背包，產生唯一ID
  const newItem = {
    id: crypto.randomUUID(),
    name: monkey.name,
    rarity: monkey.rarity,
  };
  backpack.push(newItem);
  renderBackpack();

  cooldown = cooldownSeconds;
  openBtn.disabled = true;
  updateTimer();

  cooldownInterval = setInterval(() => {
    cooldown--;
    updateTimer();
    if (cooldown <= 0) {
      clearInterval(cooldownInterval);
      openBtn.disabled = false;
      timerDiv.textContent = "";
    }
  }, 1000);
}

// 更新倒數計時文字
function updateTimer() {
  timerDiv.textContent = cooldown > 0 ? `冷卻時間：${cooldown} 秒` : "";
}

// 背包物品上架市場
async function listItem(id) {
  const item = backpack.find(i => i.id === id);
  const priceInput = document.getElementById(`price-${id}`);
  const price = Number(priceInput.value);
  if (!price || price <= 0) {
    alert("請輸入有效價格！");
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/market`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: item.id,
        name: item.name,
        rarity: item.rarity,
        price,
      }),
    });
    const data = await res.json();
    if (data.success) {
      backpack = backpack.filter(i => i.id !== id);
      await fetchMarket();
      renderBackpack();
      alert("上架成功！");
    } else {
      alert(data.msg || "上架失敗");
    }
  } catch (e) {
    alert("伺服器錯誤，請稍後再試");
  }
}

// 從後端取得市場資料
async function fetchMarket() {
  try {
    const res = await fetch(`${API_BASE}/market`);
    market = await res.json();
    renderMarket();
  } catch {
    marketDiv.textContent = "無法取得市場資料";
  }
}

// 購買市場物品
async function buyItem(id) {
  if (!confirm("確認購買？")) return;

  try {
    const res = await fetch(`${API_BASE}/market/buy`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    const data = await res.json();
    if (data.success) {
      backpack.push({
        id: data.item.id,
        name: data.item.name,
        rarity: data.item.rarity,
      });
      await fetchMarket();
      renderBackpack();
      alert(`成功購買 ${data.item.name}`);
    } else {
      alert(data.msg || "購買失敗");
    }
  } catch {
    alert("伺服器錯誤，請稍後再試");
  }
}

// 初始化
function init() {
  drawMonkey({ color: "#888", eyeColor: "#444", mouth: "flat" });
  fetchMarket();
  renderBackpack();
  openBtn.onclick = openBox;
}

init();
