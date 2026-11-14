// Utility to trigger client-side file downloads (Standalone HTML + Source Zip + Question Bank CSV)

import { generateQuestionSet, QUESTION_MODES } from './questionGenerator';
import { QuestionModeId } from '../types/game';

export function triggerBlobDownload(content: string | Blob, filename: string, mimeType = 'text/html;charset=utf-8') {
  const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export function downloadAllQuestionBanksCSV() {
  const modes: QuestionModeId[] = ['ADD_20', 'ADD_50', 'ADD_100', 'NUMBER_SENSE', 'MULTIPLY_DIGITS'];
  const rows: string[] = ['題庫模式,題號,題目,正確答案,干擾選項,左跑道選項,右跑道選項'];

  modes.forEach((mId) => {
    const cfg = QUESTION_MODES[mId];
    const list = generateQuestionSet(mId, 20);
    list.forEach((q) => {
      rows.push(
        `"${cfg.title}",${q.index},"${q.prompt}",${q.correctAnswer},${q.wrongAnswer},${q.leftOption},${q.rightOption}`
      );
    });
  });

  // Add UTF-8 BOM so Excel opens Chinese characters cleanly
  const csvContent = '\uFEFF' + rows.join('\n');
  triggerBlobDownload(csvContent, '數學橋樑軍團_四大題庫清單.csv', 'text/csv;charset=utf-8');
}

export function downloadStandaloneGameHTML() {
  const html = `<!doctype html>
<html lang="zh-HK">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>數學橋樑軍團大作戰 — 獨立離線版</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@500;700;900&family=Outfit:wght@700;800;900&display=swap" rel="stylesheet" />
  <style>
    body {
      font-family: 'Noto Sans TC', 'Outfit', sans-serif;
      user-select: none;
      background: #0B1320;
      color: #fff;
      margin: 0;
    }
    .font-display { font-family: 'Outfit', 'Noto Sans TC', sans-serif; }
    .stroke-arcade-text {
      color: #ffffff;
      -webkit-text-stroke: 4px #1d2636;
      paint-order: stroke fill;
      text-shadow: 0 3px 0 #1d2636, 0 5px 8px rgba(0,0,0,0.35);
    }
    @keyframes marchBounce {
      0%, 100% { transform: translateY(0px) rotate(0deg); }
      25% { transform: translateY(-4px) rotate(-2deg); }
      50% { transform: translateY(0px) rotate(0deg); }
      75% { transform: translateY(-4px) rotate(2deg); }
    }
    @keyframes legStepLeft {
      0%, 100% { transform: translateY(0px); }
      50% { transform: translateY(-3.5px); }
    }
    @keyframes legStepRight {
      0%, 100% { transform: translateY(-3.5px); }
      50% { transform: translateY(0px); }
    }
    @keyframes bridgeDashScroll {
      0% { stroke-dashoffset: 36; }
      100% { stroke-dashoffset: 0; }
    }
    .animate-march { animation: marchBounce 0.36s infinite ease-in-out; }
    .animate-leg-left { animation: legStepLeft 0.28s infinite ease-in-out; }
    .animate-leg-right { animation: legStepRight 0.28s infinite ease-in-out; }
    .animate-bridge-dash { animation: bridgeDashScroll 0.55s infinite linear; }
  </style>
</head>
<body class="min-h-screen flex flex-col lg:flex-row items-center justify-center gap-6 p-3">
  <aside class="w-full max-w-[400px] lg:max-w-[340px] bg-[#152238] border-2 border-white/20 rounded-2xl p-4 space-y-3 shadow-xl">
    <h1 class="text-xl font-black">數學橋樑軍團大作戰</h1>
    <p class="text-xs text-slate-300">獨立離線版 · 雙擊即可喺電腦或平板直接遊玩</p>
    <div>
      <div class="text-xs font-bold text-amber-300 mb-1.5">每題跑動選擇時間：</div>
      <div class="grid grid-cols-4 gap-1.5" id="time-buttons"></div>
    </div>
    <div>
      <div class="text-xs font-bold text-amber-300 mb-1.5">選擇題目範圍：</div>
      <div class="grid grid-cols-2 lg:grid-cols-1 gap-2" id="mode-buttons"></div>
    </div>
  </aside>

  <main class="relative w-full max-w-[412px] h-[700px] rounded-[28px] overflow-hidden shadow-2xl border-4 border-[#1E293B] bg-[#38A7F8] flex flex-col">
    <div id="scene-container" class="absolute inset-0"></div>
    <div class="relative z-30 pt-3 px-2.5 space-y-2">
      <div class="flex items-center gap-2">
        <button id="restart-btn" class="w-11 h-11 rounded-2xl bg-amber-400 border-[3px] border-[#1A2436] font-black text-slate-950 text-xs cursor-pointer">重開</button>
        <div class="flex-1 h-11 bg-[#1A2436] border-[3px] border-white rounded-2xl px-3.5 flex items-center justify-between">
          <span class="font-display font-black text-amber-400 text-lg">🛡️ <span id="hud-troops">14</span></span>
          <span class="font-display font-black text-amber-400 text-lg">⭐ <span id="hud-score">100</span></span>
          <span class="font-black text-white text-sm" id="hud-weapon">💥 重裝散彈槍</span>
        </div>
      </div>
      <div class="w-full bg-[#131F33] border-[3.5px] border-white rounded-[22px] px-3.5 pt-2 pb-3 shadow-2xl">
        <div class="flex items-center justify-between mb-1">
          <span class="font-display font-black text-[#93B4E8] text-sm" id="hud-q">Q 1/10</span>
          <span class="font-display font-black text-lg text-[#4ADE80]" id="hud-timer">8.0秒</span>
        </div>
        <div id="question-box" class="flex items-center justify-center gap-2 py-1"></div>
        <div class="w-full h-2 bg-slate-800 rounded-full overflow-hidden mt-2 border border-white/20">
          <div id="timer-bar" class="h-full bg-gradient-to-r from-emerald-400 to-sky-400" style="width:100%"></div>
        </div>
      </div>
    </div>

    <div class="relative z-30 mt-auto pb-4 px-2.5 flex flex-col items-center">
      <div class="mb-2"><span class="stroke-arcade-text font-black text-xl">選擇跑道</span></div>
      <div class="w-full grid grid-cols-2 gap-2.5 mb-3">
        <button id="btn-left" class="h-[60px] rounded-2xl bg-[#1A73F0] border-[3.5px] border-white font-display font-black text-white text-3xl cursor-pointer"></button>
        <button id="btn-right" class="h-[60px] rounded-2xl bg-[#1A73F0] border-[3.5px] border-white font-display font-black text-white text-3xl cursor-pointer"></button>
      </div>
      <button id="btn-advance" class="w-[56%] h-[54px] rounded-full bg-gradient-to-b from-[#FAD046] to-[#EAA918] border-[3.5px] border-[#1B2538] font-black text-[#3F2B08] text-2xl cursor-pointer">前進 ⏩</button>
    </div>
  </main>

  <script>
    const MODES = {
      ADD_20: { title: '二十位加數', min: 5, max: 20 },
      ADD_50: { title: '五十位加數', min: 21, max: 50 },
      ADD_100: { title: '一百位內加數', min: 51, max: 100 },
      NUMBER_SENSE: { title: '基礎數感題', min: 2, max: 20 }
    };
    let currentMode = 'ADD_20';
    let duration = 8;
    let questions = [];
    let qIdx = 0;
    let troops = 16;
    let score = 120;
    let lane = 'LEFT';
    let progress = 0.05;
    let advancing = false;

    function rand(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }

    function buildQuestions() {
      questions = [];
      for (let i = 1; i <= 10; i++) {
        if (currentMode === 'NUMBER_SENSE') {
          const n = i === 5 ? 8 : rand(3, 20);
          const ans = n - 1;
          const wrong = n;
          const cLane = Math.random() < 0.5 ? 'LEFT' : 'RIGHT';
          questions.push({ index: i, prompt: n + ' 的前一個數是？', left: cLane === 'LEFT' ? ans : wrong, right: cLane === 'RIGHT' ? ans : wrong, cLane, ans });
        } else {
          const cfg = MODES[currentMode];
          const sum = rand(cfg.min, cfg.max);
          const a = rand(2, sum - 2);
          const b = sum - a;
          const wrong = sum + (Math.random() < 0.5 ? 1 : -1);
          const cLane = Math.random() < 0.5 ? 'LEFT' : 'RIGHT';
          questions.push({ index: i, numA: a, numB: b, prompt: a + ' + ' + b + ' = ?', left: cLane === 'LEFT' ? sum : wrong, right: cLane === 'RIGHT' ? sum : wrong, cLane, ans: sum });
        }
      }
    }

    function start(mode) {
      currentMode = mode;
      buildQuestions();
      qIdx = 0;
      troops = 16;
      score = 120;
      progress = 0.05;
      advancing = false;
      renderUI();
    }

    function renderUI() {
      const q = questions[qIdx];
      document.getElementById('hud-troops').textContent = troops;
      document.getElementById('hud-score').textContent = score;
      document.getElementById('hud-q').textContent = 'Q ' + q.index + '/10 · ' + MODES[currentMode].title;
      document.getElementById('btn-left').textContent = q.left;
      document.getElementById('btn-right').textContent = q.right;
      document.getElementById('btn-left').style.borderColor = lane === 'LEFT' ? '#FCD34D' : '#FFFFFF';
      document.getElementById('btn-right').style.borderColor = lane === 'RIGHT' ? '#FCD34D' : '#FFFFFF';

      const qBox = document.getElementById('question-box');
      if (q.numA !== undefined) {
        qBox.innerHTML = '<div class="px-3 py-1 rounded-xl bg-[#1E3252] border-2 border-sky-300 font-display font-black text-3xl">' + q.numA + '</div>' +
          '<span class="font-display font-black text-amber-400 text-3xl">+</span>' +
          '<div class="px-3 py-1 rounded-xl bg-[#1E3252] border-2 border-sky-300 font-display font-black text-3xl">' + q.numB + '</div>' +
          '<span class="font-display font-black text-white text-2xl">=</span>' +
          '<div class="px-2.5 py-1 rounded-xl bg-amber-400 text-slate-950 font-display font-black text-3xl">?</div>';
      } else {
        qBox.innerHTML = '<h2 class="font-display font-black text-2xl text-white py-1">' + q.prompt + '</h2>';
      }

      // Render Time & Mode buttons
      document.getElementById('time-buttons').innerHTML = [5,8,10,15].map(s =>
        '<button onclick="setDur('+s+')" class="py-1.5 rounded-xl font-black text-xs border-2 cursor-pointer ' + (duration===s ? 'bg-amber-400 text-slate-950 border-white' : 'bg-[#0F192A] text-white border-white/20') + '">' + s + ' 秒</button>'
      ).join('');

      document.getElementById('mode-buttons').innerHTML = Object.keys(MODES).map(m =>
        '<button onclick="start(\\''+m+'\\')" class="px-3 py-2 rounded-xl border-2 text-left font-black text-sm cursor-pointer ' + (currentMode===m ? 'bg-[#1973F3] border-white' : 'bg-[#0F192A] border-white/20') + '">' + MODES[m].title + '</button>'
      ).join('');
    }

    window.setDur = function(s) { duration = s; progress = 0.05; renderUI(); };
    window.start = start;

    document.getElementById('btn-left').onclick = () => { lane = 'LEFT'; renderUI(); };
    document.getElementById('btn-right').onclick = () => { lane = 'RIGHT'; renderUI(); };
    document.getElementById('btn-advance').onclick = () => { advancing = true; };
    document.getElementById('restart-btn').onclick = () => start(currentMode);

    let last = performance.now();
    function loop(now) {
      const dt = (now - last) / 1000;
      last = now;
      const q = questions[qIdx];
      progress += dt * (advancing ? 2.4 : 1 / duration);
      if (progress >= 1) {
        if (lane === q.cLane) { troops += 4; score += 120; }
        else { troops = Math.max(1, troops - 3); }
        progress = 0.05;
        advancing = false;
        qIdx = (qIdx + 1) % questions.length;
        renderUI();
      }
      const leftSec = Math.max(0, (1 - progress) * duration);
      document.getElementById('hud-timer').textContent = leftSec.toFixed(1) + '秒';
      document.getElementById('timer-bar').style.width = Math.max(0, (1 - progress) * 100) + '%';

      const gateTop = 26 + Math.pow(progress, 1.15) * 27;
      const gateScale = 0.54 + Math.pow(progress, 1.15) * 0.54;
      const squadX = lane === 'LEFT' ? -65 : 65;

      document.getElementById('scene-container').innerHTML = \`
        <svg viewBox="0 0 400 700" preserveAspectRatio="none" class="absolute inset-0 w-full h-full">
          <rect x="0" y="0" width="400" height="700" fill="#38A7F8" />
          <polygon points="158,150 242,150 376,700 24,700" fill="#7D6247" />
          <polygon points="172,150 228,150 346,700 54,700" fill="#B99D7B" />
          <line x1="200" y1="165" x2="200" y2="690" stroke="#917557" stroke-width="2.5" stroke-dasharray="18 18" class="animate-bridge-dash" />
        </svg>
        <div style="top:\${gateTop}%; transform:translateY(-50%) scale(\${gateScale})" class="absolute left-0 right-0 flex justify-around px-10">
          <div class="w-[76px] h-[70px] rounded-t-xl bg-[#1974F2] border-4 border-white flex items-center justify-center font-display font-black text-3xl text-white shadow-lg">\${q.left}</div>
          <div class="w-[76px] h-[70px] rounded-t-xl bg-[#1974F2] border-4 border-white flex items-center justify-center font-display font-black text-3xl text-white shadow-lg">\${q.right}</div>
        </div>
        <div style="transform:translate3d(\${squadX}px, 0, 0)" class="absolute top-[56%] left-1/2 -translate-x-1/2 flex flex-col items-center transition-transform duration-150">
          <div class="px-3.5 py-0.5 rounded-full bg-[#242F3E] border border-white/30 font-display font-black text-lg">\${troops}</div>
          <div class="grid grid-cols-5 gap-1 mt-1 animate-march">
            \${Array.from({length: Math.min(20, troops)}).map(() => '<div class="w-5 h-7 rounded bg-[#1D4ED8] border border-white/60"></div>').join('')}
          </div>
        </div>
      \`;
      requestAnimationFrame(loop);
    }

    start('ADD_20');
    requestAnimationFrame(loop);
  </script>
</body>
</html>`;

  triggerBlobDownload(html, '數學橋樑軍團大作戰_獨立單檔版.html', 'text/html;charset=utf-8');
}
