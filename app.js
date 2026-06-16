/* ═══════════════════════════════════════════════
   FLOWCOACH v2 — APP.JS
   AI Chat · Pose Tracking · Rewards System
═══════════════════════════════════════════════ */

/* ── GROQ CONFIG ── */
const GROQ_API_KEY = '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';
const GROQ_MODEL   = 'llama-3.3-70b-versatile';
const GROQ_URL     = 'https://api.groq.com/openai/v1/chat/completions';

const SYSTEM_PROMPT = `You are FlowCoach, a warm, expert AI personal trainer and wellness coach. You guide users on fitness, nutrition, sleep, and mindfulness with science-backed advice. Be concise (2-3 short paragraphs), motivating, specific, and use relevant emojis. If a user mentions pain or injury, advise consulting a doctor.`;

/* ── ROUTINE META ── */
const ROUTINE_META = {
  fitness:     { icon:'🏋️', label:'Morning Workout',     color:'rgba(45,186,110,0.18)', defaultTime:'06:30' },
  nutrition:   { icon:'🥗', label:'Nutrition Check-in',  color:'rgba(251,191,36,0.18)', defaultTime:'12:00' },
  mindfulness: { icon:'🧠', label:'Mindfulness Session', color:'rgba(139,92,246,0.18)', defaultTime:'19:00' },
  sleep:       { icon:'🌙', label:'Sleep Wind-down',     color:'rgba(56,189,248,0.18)', defaultTime:'21:30' },
  hydration:   { icon:'💧', label:'Hydration Check',     color:'rgba(14,165,233,0.18)', defaultTime:'10:00' },
  stretch:     { icon:'🤸', label:'Morning Stretch',     color:'rgba(244,114,182,0.18)', defaultTime:'07:00' },
};

/* ── CHARACTERS ── */
const CHARACTERS = [
  { id:'seed',   emoji:'🌱', name:'Seedling',  req:0,   reqLbl:'Starter',    lore:'Your journey begins here.' },
  { id:'spark',  emoji:'⚡', name:'Sparky',    req:3,   reqLbl:'Level 3',    lore:'You\'re building momentum!' },
  { id:'fire',   emoji:'🔥', name:'Blaze',     req:5,   reqLbl:'Level 5',    lore:'The fire within you burns bright.' },
  { id:'storm',  emoji:'⚡🌩', name:'Storm',  req:8,   reqLbl:'Level 8',    lore:'Unstoppable force of nature.' },
  { id:'beast',  emoji:'🦁', name:'Lionheart', req:10,  reqLbl:'Level 10',   lore:'You lead the pack.' },
  { id:'legend', emoji:'👑', name:'Legend',    req:15,  reqLbl:'Level 15',   lore:'Your legacy inspires others.' },
  { id:'cosmos', emoji:'🌌', name:'Cosmos',    req:20,  reqLbl:'Level 20',   lore:'You have transcended limits.' },
  { id:'phoenix',emoji:'🦅', name:'Phoenix',   req:25,  reqLbl:'Level 25',   lore:'Reborn from the ashes.' },
  { id:'myth',   emoji:'🐉', name:'Mythic',    req:50,  reqLbl:'Level 50',   lore:'Mythic. Undeniable. Eternal.' },
];

/* ── ACHIEVEMENTS ── */
const ACHIEVEMENTS = [
  { id:'first_workout', icon:'🏆', name:'First Rep',       desc:'Complete your first exercise session',  xp:50,  check: s => s.totalReps >= 1 },
  { id:'streak3',       icon:'🔥', name:'3-Day Streak',    desc:'Train 3 days in a row',                 xp:100, check: s => s.streak >= 3 },
  { id:'reps50',        icon:'💪', name:'Fifty Reps',      desc:'Reach 50 total reps tracked',           xp:150, check: s => s.totalReps >= 50 },
  { id:'reps200',       icon:'🦾', name:'Iron Will',       desc:'Reach 200 total reps tracked',          xp:300, check: s => s.totalReps >= 200 },
  { id:'streak7',       icon:'⚡', name:'Week Warrior',    desc:'Train 7 days in a row',                 xp:250, check: s => s.streak >= 7 },
  { id:'chat10',        icon:'🗣️',  name:'Chatterbox',      desc:'Have 10 conversations with your coach', xp:75,  check: s => s.chatMessages >= 10 },
  { id:'routines_all',  icon:'🌟', name:'All-rounder',     desc:'Complete all 4 routine types in one day',xp:200, check: s => s.routinesCompletedTypes >= 4 },
  { id:'level5',        icon:'🎯', name:'Level 5 Reached', desc:'Reach player level 5',                  xp:0,   check: s => s.level >= 5 },
  { id:'level10',       icon:'🏅', name:'Decade',          desc:'Reach player level 10',                 xp:500, check: s => s.level >= 10 },
];

/* ── THEMES ── */
const THEMES = [
  { id:'default',  label:'Forest',   gradient:'linear-gradient(135deg,#2dba6e,#4dd9a0)' },
  { id:'dawn',     label:'Dawn',     gradient:'linear-gradient(135deg,#f97316,#facc15)' },
  { id:'ocean',    label:'Ocean',    gradient:'linear-gradient(135deg,#0ea5e9,#6366f1)' },
  { id:'lavender', label:'Lavender', gradient:'linear-gradient(135deg,#a855f7,#ec4899)' },
  { id:'rose',     label:'Rose',     gradient:'linear-gradient(135deg,#f43f5e,#fb923c)' },
  { id:'neon',     label:'Neon',     gradient:'linear-gradient(135deg,#22c55e,#84cc16)' },
  { id:'cosmic',   label:'Cosmic',   gradient:'linear-gradient(135deg,#7c3aed,#db2777)' },
];

/* ══════════════════════════════════════
   GAME STATE
══════════════════════════════════════ */
let state = {
  // profile
  userName: '',
  selectedChar: 'seed',
  currentTheme: 'default',

  // routines
  selectedRoutines: ['fitness','nutrition','mindfulness','sleep'],
  scheduleData: {},
  completedToday: [],

  // rewards
  xp: 0,
  level: 1,
  totalReps: 0,
  streak: 0,
  lastActiveDate: null,
  chatMessages: 0,
  routinesCompletedTypes: 0,
  earnedAchievements: [],

  // chat
  chatHistory: [{ role:'system', content: SYSTEM_PROMPT }],
};

function loadState() {
  try {
    const saved = localStorage.getItem('flowcoach_v2');
    if (saved) Object.assign(state, JSON.parse(saved));
  } catch(e) {}
}

function saveState() {
  try {
    const toSave = { ...state };
    delete toSave.chatHistory; // don't persist full chat
    localStorage.setItem('flowcoach_v2', JSON.stringify(toSave));
  } catch(e) {}
}

/* ══════════════════════════════════════
   XP & LEVELING
══════════════════════════════════════ */
function xpForLevel(lvl) { return lvl * lvl * 80; }
function totalXpForLevel(lvl) {
  let total = 0;
  for (let i = 1; i < lvl; i++) total += xpForLevel(i);
  return total;
}

function addXP(amount, reason='') {
  const prevLevel = state.level;
  state.xp += amount;

  // recalculate level
  let lvl = 1;
  while (state.xp >= totalXpForLevel(lvl + 1)) lvl++;
  state.level = lvl;

  // XP popup
  showXpPopup('+' + amount + ' XP' + (reason ? ' · ' + reason : ''));

  // level up?
  if (state.level > prevLevel) {
    setTimeout(() => showLevelUpModal(state.level), 800);
  }

  updateXpBar();
  checkAchievements();
  saveState();
}

function getXpProgress() {
  const lvlStart = totalXpForLevel(state.level);
  const lvlEnd   = totalXpForLevel(state.level + 1);
  return { current: state.xp - lvlStart, needed: lvlEnd - lvlStart };
}

function updateXpBar() {
  const { current, needed } = getXpProgress();
  const pct = Math.min(100, Math.round((current / needed) * 100));
  const fill = document.getElementById('xpFill');
  const pts  = document.getElementById('xpPoints');
  const lvl  = document.getElementById('xpLevel');
  if (fill) fill.style.width = pct + '%';
  if (pts)  pts.textContent  = current + ' / ' + needed + ' XP';
  if (lvl)  lvl.textContent  = '⚡ Level ' + state.level;
}

/* ══════════════════════════════════════
   ACHIEVEMENTS
══════════════════════════════════════ */
function checkAchievements() {
  ACHIEVEMENTS.forEach(ach => {
    if (!state.earnedAchievements.includes(ach.id) && ach.check(state)) {
      state.earnedAchievements.push(ach.id);
      if (ach.xp > 0) addXP(ach.xp, ach.name);
      showToast('🏆 Achievement: ' + ach.name);
    }
  });
  renderAchievements();
}

/* ══════════════════════════════════════
   WELCOME + ONBOARDING
══════════════════════════════════════ */
function updateNamePreview(val) {
  document.getElementById('namePreview').textContent = val.trim() || 'friend';
}

function startOnboard() {
  const name = document.getElementById('nameInput').value.trim();
  if (!name) { document.getElementById('nameInput').focus(); return; }
  state.userName = name;
  transitionTo('welcomeScreen', 'onboardScreen');
}

function toggleChip(el) {
  const id = el.dataset.id;
  el.classList.toggle('on');
  if (el.classList.contains('on')) {
    if (!state.selectedRoutines.includes(id)) state.selectedRoutines.push(id);
  } else {
    state.selectedRoutines = state.selectedRoutines.filter(r => r !== id);
  }
}

function goToSchedule() {
  if (state.selectedRoutines.length === 0) { showToast('Pick at least one routine!'); return; }
  buildSetupSchedule();
  transitionTo('onboardScreen', 'scheduleScreen');
}

function buildSetupSchedule() {
  const list = document.getElementById('setupSchedList');
  list.innerHTML = '';
  state.selectedRoutines.forEach(id => {
    const m = ROUTINE_META[id];
    state.scheduleData[id] = state.scheduleData[id] || m.defaultTime;
    const row = document.createElement('div');
    row.className = 'sched-setup-row';
    row.innerHTML = `
      <div class="sched-icon">${m.icon}</div>
      <div class="sched-body">
        <div class="sched-name">${m.label}</div>
        <input class="time-inp" type="time" value="${state.scheduleData[id]}"
          onchange="state.scheduleData['${id}']=this.value" style="margin-top:6px;">
      </div>`;
    list.appendChild(row);
  });
}

function launchApp() {
  // streak logic
  const today = new Date().toDateString();
  if (state.lastActiveDate !== today) {
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    state.streak = state.lastActiveDate === yesterday ? state.streak + 1 : 1;
    state.lastActiveDate = today;
    state.completedToday = [];
  }
  saveState();
  initApp();
  transitionTo('scheduleScreen', 'appScreen');
  addXP(20, 'Daily login');
}

/* ══════════════════════════════════════
   MAIN APP INIT
══════════════════════════════════════ */
function initApp() {
  // Greet
  const h = new Date().getHours();
  const greet = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  document.getElementById('topGreet').textContent = greet;
  document.getElementById('topName').innerHTML = `Hey, <span>${state.userName}</span> 👋`;

  // Hero
  const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  document.getElementById('heroDow').textContent = days[new Date().getDay()];
  document.getElementById('heroTitle').textContent = greet + ', ' + state.userName + '!';
  document.getElementById('heroSub').textContent = state.selectedRoutines.length + ' routines scheduled today';

  const pills = document.getElementById('heroPills');
  pills.innerHTML = '';
  state.selectedRoutines.slice(0,3).forEach(id => {
    const pill = document.createElement('div');
    pill.className = 'hero-pill';
    pill.textContent = ROUTINE_META[id].icon + ' ' + ROUTINE_META[id].label.split(' ')[0];
    pills.appendChild(pill);
  });

  buildTodayRoutines();
  buildAppSchedule();
  updateXpBar();
  renderProfileTab();
  renderAchievements();
  buildThemeSwatches('appThemePalette');
  updateProgressBar();

  // Set initial chat greeting with name
  const msgs = document.getElementById('messages');
  msgs.innerHTML = '';
  addMessage('ai', `Hey ${state.userName}! 👋 I'm your AI coach, powered by Groq.\n\nTap any routine card, ask me about your workout, nutrition, sleep, or mindfulness — I'm here to guide you every step of the way!`);
}

/* ══════════════════════════════════════
   TODAY ROUTINES
══════════════════════════════════════ */
function buildTodayRoutines() {
  const wrap = document.getElementById('todayRoutines');
  wrap.innerHTML = '';
  const now = new Date();
  const cur = now.getHours() * 60 + now.getMinutes();

  state.selectedRoutines.forEach(id => {
    const m = ROUTINE_META[id];
    const t = state.scheduleData[id] || m.defaultTime;
    const [hh, mm] = t.split(':').map(Number);
    const diff = (hh * 60 + mm) - cur;
    const done = state.completedToday.includes(id);

    let badge, badgeClass;
    if (done) { badge='Done ✓'; badgeClass='badge-done'; }
    else if (diff < 0 && diff > -90) { badge='Now!'; badgeClass='badge-now'; }
    else if (diff >= 0 && diff <= 120) { badge = diff < 60 ? `In ${diff}m` : `In ${Math.round(diff/60)}h`; badgeClass='badge-soon'; }
    else { badge = formatTime(hh, mm); badgeClass='badge-later'; }

    const card = document.createElement('div');
    card.className = 'routine-card' + (done ? ' done' : '');
    card.innerHTML = `
      <div class="rc-icon" style="background:${m.color}">${m.icon}</div>
      <div class="rc-body">
        <div class="rc-title">${m.label}</div>
        <div class="rc-meta">${formatTime(hh,mm)} · daily${done ? ' · +20 XP earned' : ''}</div>
      </div>
      <div class="rc-badge ${badgeClass}">${badge}</div>`;
    card.onclick = () => {
      if (!done) markRoutineDone(id);
      switchTab('tabCoach', document.querySelector('[data-tab="tabCoach"]'));
      const q = `I'm about to do my ${m.label}. Give me a quick personalized plan.`;
      document.getElementById('chatInput').value = q;
      setTimeout(sendMessage, 400);
    };
    wrap.appendChild(card);
  });
}

function markRoutineDone(id) {
  if (state.completedToday.includes(id)) return;
  state.completedToday.push(id);
  state.routinesCompletedTypes = new Set(state.completedToday.map(i => ROUTINE_META[i] ? 'typed' : i)).size;
  addXP(20, ROUTINE_META[id]?.label || 'Routine');
  buildTodayRoutines();
  updateProgressBar();
  checkAchievements();
  saveState();
}

function updateProgressBar() {
  const total = state.selectedRoutines.length;
  const done  = state.completedToday.length;
  const pct   = total ? Math.round((done / total) * 100) : 0;
  const fill  = document.getElementById('dayProgressFill');
  const lbl   = document.getElementById('dayProgressLbl');
  const pctEl = document.getElementById('dayProgressPct');
  if (fill)  fill.style.width = pct + '%';
  if (lbl)   lbl.textContent  = `${done} of ${total} routines done`;
  if (pctEl) pctEl.textContent = pct + '%';
}

/* ══════════════════════════════════════
   SCHEDULE TAB
══════════════════════════════════════ */
function buildAppSchedule() {
  const wrap = document.getElementById('appSchedList');
  wrap.innerHTML = '';
  state.selectedRoutines.forEach(id => appendSchedCard(id, wrap));
}

function appendSchedCard(id, wrap) {
  const m = ROUTINE_META[id];
  const t = state.scheduleData[id] || m.defaultTime;
  const card = document.createElement('div');
  card.className = 'sched-card';
  card.id = 'scard-' + id;
  card.innerHTML = `
    <div class="sched-icon-box" style="background:${m.color}">${m.icon}</div>
    <div class="sched-body">
      <div class="sched-title">${m.label}</div>
      <div class="sched-time-row">
        <input class="sched-time-inp" type="time" value="${t}"
          onchange="updateSchedTime('${id}',this.value)">
        <span style="font-size:12px;color:var(--text3)">daily</span>
      </div>
    </div>
    <div class="toggle-sw on" id="tog-${id}" onclick="toggleSchedItem('${id}',this)"></div>`;
  wrap.appendChild(card);
}

function updateSchedTime(id, val) {
  state.scheduleData[id] = val;
  buildTodayRoutines();
  saveState();
  showToast('⏰ Schedule updated!');
}

function toggleSchedItem(id, el) {
  el.classList.toggle('on');
  if (!el.classList.contains('on')) {
    state.selectedRoutines = state.selectedRoutines.filter(r => r !== id);
  } else {
    if (!state.selectedRoutines.includes(id)) state.selectedRoutines.push(id);
  }
  buildTodayRoutines();
  updateProgressBar();
  saveState();
}

function toggleAddForm() {
  document.getElementById('addRoutineForm').classList.toggle('open');
}

function addNewRoutine() {
  const name = document.getElementById('newRName').value.trim();
  const time = document.getElementById('newRTime').value;
  const cat  = document.getElementById('newRCat').value;
  if (!name) { showToast('Enter a routine name'); return; }
  const cid = 'custom_' + Date.now();
  ROUTINE_META[cid] = { ...ROUTINE_META[cat], label: name, defaultTime: time };
  state.scheduleData[cid] = time;
  state.selectedRoutines.push(cid);
  buildTodayRoutines();
  appendSchedCard(cid, document.getElementById('appSchedList'));
  updateProgressBar();
  document.getElementById('newRName').value = '';
  document.getElementById('addRoutineForm').classList.remove('open');
  saveState();
  showToast('Routine added! 🎉');
}

/* ══════════════════════════════════════
   PROFILE / REWARDS TAB
══════════════════════════════════════ */
function renderProfileTab() {
  const char = CHARACTERS.find(c => c.id === state.selectedChar) || CHARACTERS[0];

  document.getElementById('profileName').textContent = state.userName;
  document.getElementById('profileAvatar').textContent = char.emoji;

  const rankEl = document.getElementById('rankBadge');
  if (rankEl) rankEl.textContent = '👑 ' + getRankTitle();

  const stats = [
    { id:'statXP',     val: state.xp },
    { id:'statStreak', val: state.streak + 'd' },
    { id:'statReps',   val: state.totalReps },
  ];
  stats.forEach(s => { const el = document.getElementById(s.id); if(el) el.textContent = s.val; });

  renderCharacters();
  renderAchievements();
}

function getRankTitle() {
  const lvl = state.level;
  if (lvl >= 50) return 'Mythic Legend';
  if (lvl >= 25) return 'Phoenix';
  if (lvl >= 20) return 'Cosmic';
  if (lvl >= 15) return 'Grand Champion';
  if (lvl >= 10) return 'Elite Athlete';
  if (lvl >= 8)  return 'Pro Trainer';
  if (lvl >= 5)  return 'Rising Star';
  if (lvl >= 3)  return 'Challenger';
  return 'Newcomer';
}

function renderCharacters() {
  const grid = document.getElementById('charsGrid');
  if (!grid) return;
  grid.innerHTML = '';
  CHARACTERS.forEach(c => {
    const unlocked = state.level >= c.req;
    const active = state.selectedChar === c.id;
    const card = document.createElement('div');
    card.className = 'char-card' + (unlocked ? ' unlocked' : '');
    card.innerHTML = `
      <span class="char-emoji" style="${!unlocked?'filter:grayscale(1);opacity:0.4':''}">${c.emoji}</span>
      <div class="char-name">${c.name}</div>
      <div class="char-req">${unlocked ? c.lore.slice(0,24)+'…' : c.reqLbl}</div>
      ${active && unlocked ? '<div style="position:absolute;top:6px;right:6px;font-size:10px;background:var(--accent);color:#000;padding:2px 7px;border-radius:10px;font-weight:700;">Active</div>' : ''}
      ${!unlocked ? '<div class="char-locked-overlay">🔒</div>' : ''}`;
    if (unlocked) card.onclick = () => selectCharacter(c.id);
    grid.appendChild(card);
  });
}

function selectCharacter(id) {
  state.selectedChar = id;
  saveState();
  renderCharacters();
  const char = CHARACTERS.find(c => c.id === id);
  document.getElementById('profileAvatar').textContent = char.emoji;
  showToast('Character: ' + char.name + ' ' + char.emoji);
}

function renderAchievements() {
  const list = document.getElementById('achList');
  if (!list) return;
  list.innerHTML = '';
  ACHIEVEMENTS.forEach(ach => {
    const earned = state.earnedAchievements.includes(ach.id);
    const row = document.createElement('div');
    row.className = 'ach-row' + (earned ? ' earned' : '');
    row.innerHTML = `
      <div class="ach-icon" style="${earned?'':'filter:grayscale(1);opacity:0.4'}">${ach.icon}</div>
      <div class="ach-body">
        <div class="ach-name">${ach.name}</div>
        <div class="ach-desc">${ach.desc}</div>
      </div>
      <div class="ach-xp">${ach.xp > 0 ? '+'+ach.xp+' XP' : earned ? '✓' : '—'}</div>`;
    list.appendChild(row);
  });
}

/* ══════════════════════════════════════
   CAMERA / POSE TRACKING
══════════════════════════════════════ */
let camStream = null;
let poseNet = null;
let animFrameId = null;
let trackingActive = false;
let currentExercise = 'squat';
let repCount = 0;
let poseState = 'up'; // up / down
let lastPoseAngle = 0;

const EXERCISE_CONFIGS = {
  squat:     { name:'Squats',     upAngle:160, downAngle:110, joint:['leftHip','leftKnee','leftAnkle'] },
  pushup:    { name:'Push-ups',   upAngle:160, downAngle:90,  joint:['leftShoulder','leftElbow','leftWrist'] },
  curl:      { name:'Bicep Curl', upAngle:160, downAngle:60,  joint:['leftShoulder','leftElbow','leftWrist'] },
  lunge:     { name:'Lunges',     upAngle:170, downAngle:100, joint:['leftHip','leftKnee','leftAnkle'] },
};

async function startCamera() {
  const overlay = document.getElementById('camOverlay');
  const startBtn = document.getElementById('startCamBtn');
  const stopBtn  = document.getElementById('stopCamBtn');

  try {
    overlay.innerHTML = `<div class="cam-overlay-icon">⏳</div><div class="cam-overlay-text">Loading AI pose engine…</div>`;

    // get camera
    camStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode:'user', width:640, height:480 } });
    const video = document.getElementById('camVideo');
    video.srcObject = camStream;
    await video.play();

    // load posenet
    if (!poseNet) {
      poseNet = await posenet.load({ architecture:'MobileNetV1', outputStride:16, inputResolution:{width:320,height:240}, multiplier:0.75 });
    }

    overlay.classList.add('hidden');
    startBtn.style.display = 'none';
    stopBtn.style.display  = 'flex';
    trackingActive = true;
    repCount = 0;
    poseState = 'up';
    updateCamStats();
    trackPose();
  } catch(e) {
    overlay.innerHTML = `<div class="cam-overlay-icon">🚫</div><div class="cam-overlay-text">${e.name === 'NotAllowedError' ? 'Camera permission denied. Please allow camera access.' : 'Could not start camera: '+e.message}</div>`;
  }
}

async function trackPose() {
  if (!trackingActive) return;
  const video  = document.getElementById('camVideo');
  const canvas = document.getElementById('poseCanvas');
  const ctx    = canvas.getContext('2d');

  canvas.width  = video.videoWidth  || 640;
  canvas.height = video.videoHeight || 480;

  try {
    const pose = await poseNet.estimateSinglePose(video, { flipHorizontal: true });
    drawPose(ctx, canvas, pose);
    analyzeRep(pose);
  } catch(e) {}

  animFrameId = requestAnimationFrame(trackPose);
}

function drawPose(ctx, canvas, pose) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (!pose || pose.score < 0.2) return;

  const kps = {};
  pose.keypoints.forEach(kp => { kps[kp.part] = kp; });

  // Draw skeleton connections
  const connections = [
    ['leftShoulder','rightShoulder'],
    ['leftShoulder','leftElbow'], ['leftElbow','leftWrist'],
    ['rightShoulder','rightElbow'], ['rightElbow','rightWrist'],
    ['leftShoulder','leftHip'], ['rightShoulder','rightHip'],
    ['leftHip','rightHip'],
    ['leftHip','leftKnee'], ['leftKnee','leftAnkle'],
    ['rightHip','rightKnee'], ['rightKnee','rightAnkle'],
  ];

  ctx.lineWidth = 3;
  ctx.strokeStyle = 'var(--accent)';
  connections.forEach(([a,b]) => {
    const pa = kps[a]; const pb = kps[b];
    if (pa && pb && pa.score > 0.3 && pb.score > 0.3) {
      ctx.beginPath();
      ctx.moveTo(pa.position.x, pa.position.y);
      ctx.lineTo(pb.position.x, pb.position.y);
      ctx.stroke();
    }
  });

  // Draw keypoints
  pose.keypoints.forEach(kp => {
    if (kp.score > 0.35) {
      ctx.beginPath();
      ctx.arc(kp.position.x, kp.position.y, 5, 0, 2 * Math.PI);
      ctx.fillStyle = '#fff';
      ctx.fill();
      ctx.strokeStyle = 'var(--accent)';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  });
}

function analyzeRep(pose) {
  const cfg = EXERCISE_CONFIGS[currentExercise];
  const kps = {};
  pose.keypoints.forEach(kp => { kps[kp.part] = kp; });

  const [p1n, p2n, p3n] = cfg.joint;
  const p1 = kps[p1n], p2 = kps[p2n], p3 = kps[p3n];

  if (!p1 || !p2 || !p3 || p1.score < 0.3 || p2.score < 0.3 || p3.score < 0.3) {
    updatePoseStatus(false, 'Position yourself in camera view');
    return;
  }

  const angle = calcAngle(p1.position, p2.position, p3.position);
  lastPoseAngle = angle;

  // Rep detection: up->down->up = 1 rep
  const goodForm = pose.score > 0.35;
  updatePoseStatus(goodForm, goodForm ? `Angle: ${Math.round(angle)}°` : 'Adjust your position');

  if (poseState === 'up' && angle < cfg.downAngle) {
    poseState = 'down';
  } else if (poseState === 'down' && angle > cfg.upAngle) {
    poseState = 'up';
    repCount++;
    state.totalReps++;
    updateCamStats();
    flashRep();
    addXP(2, cfg.name);
    checkAchievements();
    saveState();
  }
}

function calcAngle(a, b, c) {
  const rad = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
  let angle = Math.abs(rad * 180 / Math.PI);
  if (angle > 180) angle = 360 - angle;
  return angle;
}

function flashRep() {
  const el = document.getElementById('repFlash');
  if (!el) return;
  el.textContent = repCount;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 700);
}

function updateCamStats() {
  const repEl   = document.getElementById('statRepsLive');
  const totalEl = document.getElementById('statTotalReps');
  const xpEl    = document.getElementById('statCamXP');
  if (repEl)   repEl.textContent   = repCount;
  if (totalEl) totalEl.textContent = state.totalReps;
  if (xpEl)    xpEl.textContent    = state.xp;
}

function updatePoseStatus(good, msg) {
  const dot = document.getElementById('poseDot');
  const txt = document.getElementById('poseTxt');
  if (dot) { dot.className = 'pose-dot ' + (good ? 'good' : 'bad'); }
  if (txt) txt.textContent = msg;
}

function stopCamera() {
  trackingActive = false;
  if (animFrameId) cancelAnimationFrame(animFrameId);
  if (camStream) { camStream.getTracks().forEach(t => t.stop()); camStream = null; }
  const video = document.getElementById('camVideo');
  if (video) video.srcObject = null;
  const overlay = document.getElementById('camOverlay');
  if (overlay) {
    overlay.innerHTML = `<div class="cam-overlay-icon">📷</div><div class="cam-overlay-text">Camera stopped. ${repCount} reps completed!</div>`;
    overlay.classList.remove('hidden');
  }
  document.getElementById('startCamBtn').style.display = 'flex';
  document.getElementById('stopCamBtn').style.display  = 'none';
  if (repCount > 0) {
    markRoutineDone('fitness');
    showToast(`🏋️ ${repCount} reps done! +${repCount*2} XP`);
  }
}

function selectExercise(id, btn) {
  currentExercise = id;
  repCount = 0;
  poseState = 'up';
  document.querySelectorAll('.ex-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  updateCamStats();
}

/* ══════════════════════════════════════
   GROQ CHAT
══════════════════════════════════════ */
function addMessage(role, text) {
  const msgs = document.getElementById('messages');
  const wrap = document.createElement('div');
  wrap.className = 'msg ' + role;
  const now = new Date().toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' });
  wrap.innerHTML = `<div class="msg-bubble">${text.replace(/\n/g,'<br>')}</div><div class="msg-time">${now}</div>`;
  msgs.appendChild(wrap);
  msgs.scrollTop = msgs.scrollHeight;
}

function showTyping() {
  const msgs = document.getElementById('messages');
  const t = document.createElement('div');
  t.className = 'typing-indicator'; t.id = 'typingDots';
  t.innerHTML = '<span></span><span></span><span></span>';
  msgs.appendChild(t); msgs.scrollTop = msgs.scrollHeight;
}
function hideTyping() { const t = document.getElementById('typingDots'); if (t) t.remove(); }

function sendQuick(msg) {
  document.getElementById('chatInput').value = msg;
  sendMessage();
}

async function sendMessage() {
  const input = document.getElementById('chatInput');
  const text = input.value.trim();
  if (!text) return;
  input.value = ''; input.style.height = 'auto';

  addMessage('user', text);
  state.chatHistory.push({ role:'user', content: text });
  state.chatMessages++;

  document.getElementById('sendBtn').disabled = true;
  document.getElementById('quickChips').style.display = 'none';
  showTyping();

  try {
    const res = await fetch(GROQ_URL, {
      method: 'POST',
      headers: { 'Content-Type':'application/json', 'Authorization':`Bearer ${GROQ_API_KEY}` },
      body: JSON.stringify({ model:GROQ_MODEL, max_tokens:800, temperature:0.75, messages: state.chatHistory })
    });
    const data = await res.json();
    hideTyping();
    if (data.error) {
      addMessage('ai', '⚠️ ' + (data.error.message || 'Something went wrong.'));
    } else {
      const reply = data.choices[0].message.content;
      state.chatHistory.push({ role:'assistant', content: reply });
      addMessage('ai', reply);
      addXP(5, 'Coach chat');
      checkAchievements();
    }
  } catch(e) {
    hideTyping();
    addMessage('ai', '⚠️ Connection error. Please try again.');
  }
  document.getElementById('sendBtn').disabled = false;
}

/* ══════════════════════════════════════
   THEMES
══════════════════════════════════════ */
function buildThemeSwatches(containerId) {
  const wrap = document.getElementById(containerId);
  if (!wrap) return;
  wrap.innerHTML = '';
  THEMES.forEach(th => {
    const sw = document.createElement('div');
    sw.className = 't-swatch' + (state.currentTheme === th.id ? ' active' : '');
    sw.style.background = th.gradient;
    sw.title = th.label;
    sw.innerHTML = '<span class="check">✓</span>';
    sw.onclick = () => applyTheme(th.id);
    wrap.appendChild(sw);
  });
}

function applyTheme(id) {
  state.currentTheme = id;
  document.documentElement.dataset.theme = id === 'default' ? '' : id;
  document.querySelectorAll('.t-swatch').forEach(sw => {
    sw.classList.toggle('active', sw.title === THEMES.find(t=>t.id===id)?.label);
  });
  saveState();
  showToast('Theme applied ✨');
}

/* ══════════════════════════════════════
   UI HELPERS
══════════════════════════════════════ */
function switchTab(id, btn) {
  document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  if (btn) btn.classList.add('active');
  // refresh profile if switching to rewards
  if (id === 'tabRewards') { renderProfileTab(); }
}

function transitionTo(from, to) {
  const fromEl = document.getElementById(from);
  const toEl   = document.getElementById(to);
  fromEl.classList.add('slide-out');
  setTimeout(() => {
    fromEl.classList.add('hidden');
    fromEl.classList.remove('slide-out');
    toEl.classList.remove('hidden');
  }, 480);
}

function formatTime(h, m) {
  const ap = h >= 12 ? 'PM' : 'AM';
  return `${h % 12 || 12}:${String(m).padStart(2,'0')} ${ap}`;
}

function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg; t.classList.add('show');
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove('show'), 2500);
}

function showXpPopup(msg) {
  const p = document.getElementById('xpPopup');
  p.textContent = msg; p.classList.add('show');
  clearTimeout(p._timer);
  p._timer = setTimeout(() => p.classList.remove('show'), 1800);
}

function showLevelUpModal(lvl) {
  const char = CHARACTERS.filter(c => c.req <= lvl).pop();
  document.getElementById('modalEmoji').textContent = char.emoji;
  document.getElementById('modalTitle').textContent = 'Level ' + lvl + '!';
  document.getElementById('modalSub').textContent = `You've reached Level ${lvl}!\nRank: ${getRankTitle()}\n${char.lore}`;
  document.getElementById('levelModal').classList.add('open');
  renderCharacters();
}

function closeModal() {
  document.getElementById('levelModal').classList.remove('open');
}

function resetApp() {
  if (confirm('Reset FlowCoach and start fresh? All progress will be lost.')) {
    localStorage.removeItem('flowcoach_v2');
    location.reload();
  }
}

function requestNotifications() {
  if ('Notification' in window) {
    Notification.requestPermission().then(p => {
      showToast(p === 'granted' ? '🔔 Reminders enabled!' : 'Notifications blocked.');
    });
  } else {
    showToast('Notifications not supported on this browser.');
  }
}

/* ══════════════════════════════════════
   BOOT
══════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  loadState();
  applyTheme(state.currentTheme || 'default');

  // Build onboard theme swatches
  buildThemeSwatches('onboardThemePalette');

  // Mark pre-selected routine chips
  document.querySelectorAll('.routine-chip').forEach(chip => {
    if (state.selectedRoutines.includes(chip.dataset.id)) chip.classList.add('on');
  });

  // Chat textarea auto-resize
  const ta = document.getElementById('chatInput');
  if (ta) {
    ta.addEventListener('input', () => {
      ta.style.height = 'auto';
      ta.style.height = Math.min(ta.scrollHeight, 96) + 'px';
    });
    ta.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
    });
  }

  // If returning user, skip to app
  if (state.userName) {
    document.getElementById('welcomeScreen').classList.add('hidden');
    launchApp();
    document.getElementById('appScreen').classList.remove('hidden');
  }
});
