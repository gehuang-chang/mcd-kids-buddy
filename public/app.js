// 麦麦带娃官 前端逻辑（零依赖）
const $ = (id) => document.getElementById(id);

function tag(text, cls) { const s = document.createElement('span'); s.className = 'tag ' + (cls || ''); s.textContent = text; return s; }

// —— Tab 切换 ——
document.querySelectorAll('.tab').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    $('tab-' + btn.dataset.tab).classList.add('active');
    if (btn.dataset.tab === 'play') loadPlay();
  });
});

// —— 模块1 儿童营养餐推荐 ——
async function loadMeal() {
  const age = $('age').value || 5;
  const scene = $('scene').value;
  $('meal-list').innerHTML = '<div class="loading">加载中…</div>';
  try {
    const r = await fetch(`/api/meal/recommend?age=${encodeURIComponent(age)}&scene=${encodeURIComponent(scene)}`);
    const d = await r.json();
    $('meal-tip').textContent = (d.source === 'mcp' ? '✅ 真实官方营养数据 · ' : '⚠️ 演示数据 · ') + (d.tip || '');
    const box = $('meal-list');
    box.innerHTML = '';
    (d.recommendations || []).forEach(m => {
      const card = document.createElement('div');
      card.className = 'card' + (m.calWarn ? ' warn' : '');
      const title = document.createElement('div');
      title.className = 'card-title';
      title.textContent = m.name;
      card.appendChild(title);
      const meta = document.createElement('div');
      meta.className = 'meta';
      meta.appendChild(tag(m.energyKcal + ' kcal', m.calWarn ? 'red' : 'green'));
      meta.appendChild(tag('蛋白 ' + m.protein + 'g'));
      meta.appendChild(tag('脂肪 ' + m.fat + 'g'));
      meta.appendChild(tag('碳水 ' + m.carbohydrate + 'g'));
      meta.appendChild(tag('钠 ' + m.sodium + 'mg'));
      meta.appendChild(tag('钙 ' + m.calcium + 'mg'));
      card.appendChild(meta);
      if (m.warnings && m.warnings.length) {
        const w = document.createElement('div');
        w.className = 'warn-text';
        w.textContent = '⚠️ ' + m.warnings.join('；');
        card.appendChild(w);
      }
      box.appendChild(card);
    });
  } catch (e) {
    $('meal-list').innerHTML = '<div class="loading">请求失败：' + e.message + '</div>';
  }
}
$('btn-meal').addEventListener('click', loadMeal);

// —— 模块2 当期亲子玩乐雷达 ——
async function loadPlay() {
  $('play-list').innerHTML = '<div class="loading">加载中…</div>';
  try {
    const r = await fetch('/api/activities');
    const d = await r.json();
    $('play-tip').textContent = (d.source === 'mcp' ? '✅ 真实官方活动数据 · ' : '⚠️ 演示数据 · ') + (d.tip || '');
    const box = $('play-list');
    box.innerHTML = '';
    (d.items || []).forEach(a => {
      const card = document.createElement('div');
      card.className = 'card play-card';
      const title = document.createElement('div');
      title.className = 'card-title';
      title.textContent = a.title;
      card.appendChild(title);
      if (a.date) { const dt = document.createElement('div'); dt.className = 'date'; dt.textContent = a.date; card.appendChild(dt); }
      const desc = document.createElement('div');
      desc.className = 'desc';
      desc.textContent = a.desc;
      card.appendChild(desc);
      if (a.image) { const img = document.createElement('img'); img.src = a.image; img.className = 'act-img'; img.alt = a.title; card.appendChild(img); }
      box.appendChild(card);
    });
  } catch (e) {
    $('play-list').innerHTML = '<div class="loading">请求失败：' + e.message + '</div>';
  }
}
$('btn-play').addEventListener('click', loadPlay);

// 初始加载
loadMeal();
