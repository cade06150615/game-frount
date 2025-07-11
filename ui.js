let currentBoxes = sampleBoxes();

const boxSelectionDiv = document.getElementById('box-selection');
const resultDiv = document.getElementById('result');
const openBoxBtn = document.getElementById('open-box-btn');
const saveBtn = document.getElementById('save-btn');
const loadBtn = document.getElementById('load-btn');
const resetBtn = document.getElementById('reset-btn');

// 顯示箱子資訊
function renderBoxes(boxes) {
  boxSelectionDiv.innerHTML = '';
  boxes.forEach(box => {
    const div = document.createElement('div');
    div.className = 'p-3 bg-blue-100 rounded text-center cursor-pointer';
    div.innerHTML = `
      <div class="font-bold">${box.id}</div>
      <div>成本: ${box.cost}</div>
      <div>平均報酬率: ${box.rewardRate.toFixed(2)}</div>
      <div>Q值: ${getQ(box.id).toFixed(2)}</div>
      <div>選擇次數: ${getCount(box.id)}</div>
    `;
    boxSelectionDiv.appendChild(div);
  });
}

renderBoxes(currentBoxes);

openBoxBtn.addEventListener('click', () => {
  const chosenBox = chooseBox(currentBoxes);
  const reward = openBox(chosenBox);
  updateQLearning(chosenBox, reward);
  resultDiv.textContent = `猴子選擇了 ${chosenBox.id}，開出價值 ${reward.toFixed(2)} CP`;
  currentBoxes = sampleBoxes();
  renderBoxes(currentBoxes);
  updateCharts();
});

resetBtn.addEventListener('click', () => {
  Q.clear();
  counts.clear();
  resultDiv.textContent = '學習資料已重置';
  renderBoxes(currentBoxes);
  updateCharts();
});

saveBtn.addEventListener('click', async () => {
  try {
    // 轉成普通物件才能用 JSON 傳輸
    const Q_obj = Object.fromEntries(Q);
    const counts_obj = Object.fromEntries(counts);

    const res = await fetch('http://localhost:5000/api/monkey', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ Q: Q_obj, counts: counts_obj }),
    });
    const data = await res.json();
    alert(data.message || '儲存成功');
  } catch (err) {
    alert('儲存失敗: ' + err.message);
  }
});

loadBtn.addEventListener('click', async () => {
  try {
    const res = await fetch('http://localhost:5000/api/monkey');
    if (!res.ok) throw new Error('無法載入資料');
    const data = await res.json();

    Q.clear();
    counts.clear();

    // 從物件恢復 Map
    Object.entries(data.Q).forEach(([k, v]) => Q.set(k, v));
    Object.entries(data.counts).forEach(([k, v]) => counts.set(k, v));

    resultDiv.textContent = '學習資料已載入';
    renderBoxes(currentBoxes);
    updateCharts();
  } catch (err) {
    alert('載入失敗: ' + err.message);
  }
});

// Chart.js 設定
const ctxQ = document.getElementById('qChart').getContext('2d');
const ctxCount = document.getElementById('countChart').getContext('2d');

let qChart = new Chart(ctxQ, {
  type: 'bar',
  data: { labels: [], datasets: [{ label: 'Q 值', data: [], backgroundColor: 'rgba(54, 162, 235, 0.7)' }] },
  options: { responsive: true, scales: { y: { beginAtZero: true } } }
});

let countChart = new Chart(ctxCount, {
  type: 'bar',
  data: { labels: [], datasets: [{ label: '選擇次數', data: [], backgroundColor: 'rgba(255, 99, 132, 0.7)' }] },
  options: { responsive: true, scales: { y: { beginAtZero: true } } }
});

function updateCharts() {
  const topBoxes = currentBoxes;
  qChart.data.labels = topBoxes.map(b => b.id);
  qChart.data.datasets[0].data = topBoxes.map(b => getQ(b.id).toFixed(2));
  countChart.data.labels = topBoxes.map(b => b.id);
  countChart.data.datasets[0].data = topBoxes.map(b => getCount(b.id));
  qChart.update();
  countChart.update();
}

updateCharts();
