// 參數設定
const alpha = 0.1;   // 學習率
const gamma = 0.9;   // 折扣因子
const epsilon = 0.2; // 探索率

// Q 與次數用 Map 儲存（稀疏）
const Q = new Map();
const counts = new Map();

// 產生箱子資訊（動態計算，不實際存十億箱子）
function getBoxInfo(id) {
  const cost = 100 + (id % 901); // 100~1000
  const seed = (id * 9301 + 49297) % 233280;
  const rewardRate = 0.5 + (seed / 233280); // 0.5~1.5
  return { id: `box${id}`, cost, rewardRate };
}

function getQ(boxId) {
  return Q.has(boxId) ? Q.get(boxId) : 0;
}

function getCount(boxId) {
  return counts.has(boxId) ? counts.get(boxId) : 0;
}

function updateQ(boxId, newQ) {
  Q.set(boxId, newQ);
}

function incrementCount(boxId) {
  counts.set(boxId, getCount(boxId) + 1);
}

// 抽樣 10 箱子
function sampleBoxes(n = 10) {
  const sampled = new Set();
  while (sampled.size < n) {
    const id = Math.floor(Math.random() * 1_000_000_000) + 1;
    sampled.add(id);
  }
  return Array.from(sampled).map(getBoxInfo);
}

// ε-greedy 選箱子
function chooseBox(candidates) {
  if (Math.random() < epsilon) {
    return candidates[Math.floor(Math.random() * candidates.length)];
  }
  let bestBox = candidates[0];
  let bestQ = getQ(bestBox.id);
  for (const box of candidates) {
    const q = getQ(box.id);
    if (q > bestQ) {
      bestBox = box;
      bestQ = q;
    }
  }
  return bestBox;
}

// 模擬開箱回報
function openBox(box) {
  return box.cost * box.rewardRate;
}

// 更新 Q 值 (簡化版)
function updateQLearning(box, reward) {
  const oldQ = getQ(box.id);
  // 這裡maxQNext設為0（可優化為狀態估計）
  const maxQNext = 0;
  const newQ = oldQ + alpha * (reward + gamma * maxQNext - oldQ);
  updateQ(box.id, newQ);
  incrementCount(box.id);
}
