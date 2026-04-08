// js/script.js — Todo Life Dashboard logic

// ─── Clock Widget ────────────────────────────────────────────────────────────

/** @type {number|null} Stored interval ID to prevent duplicate clock intervals */
let clockIntervalId = null;

/**
 * Formats a Date object as HH:MM:SS with zero-padded values.
 * @param {Date} date
 * @returns {string} e.g. "09:05:03"
 */
export function formatTime(date) {
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  const ss = String(date.getSeconds()).padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
}

/**
 * Formats a Date object as a full date string, e.g. "Monday, 14 July 2025".
 * @param {Date} date
 * @returns {string}
 */
export function formatDate(date) {
  return date.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Starts the real-time clock, updating #clock and #date every second.
 * Calls the update function immediately so there is no 1-second delay on init.
 * Guards against duplicate intervals using clockIntervalId.
 */
export function initClock() {
  if (clockIntervalId !== null) return;

  function updateClock() {
    const now = new Date();
    const clockEl = document.getElementById('clock');
    const dateEl = document.getElementById('date');
    if (clockEl) clockEl.textContent = formatTime(now);
    if (dateEl) dateEl.textContent = formatDate(now);
  }

  updateClock(); // immediate first render — no 1-second delay
  clockIntervalId = setInterval(updateClock, 1000);
}

// ─── Greeting Widget ─────────────────────────────────────────────────────────

/**
 * Returns the greeting phrase for a given hour (0–23).
 * Morning: 5–11, Afternoon: 12–15, Evening: 16–18, Night: 19–23 and 0–4.
 * @param {number} hour - Integer in range [0, 23]
 * @returns {string}
 */
export function getGreeting(hour) {
  if (hour >= 5 && hour <= 11) return 'Good Morning';
  if (hour >= 12 && hour <= 15) return 'Good Afternoon';
  if (hour >= 16 && hour <= 18) return 'Good Evening';
  return 'Good Night';
}

/**
 * Builds the full greeting text, appending the name if non-empty.
 * @param {number} hour - Integer in range [0, 23]
 * @param {string} name - User's name (may be empty)
 * @returns {string} e.g. "Good Morning, Alex" or "Good Morning"
 */
export function buildGreetingText(hour, name) {
  const phrase = getGreeting(hour);
  return name && name.trim() ? `${phrase}, ${name}` : phrase;
}

/**
 * Reads the saved user name from localStorage.
 * @returns {string} The saved name, or empty string on failure/missing.
 */
export function loadName() {
  try {
    return localStorage.getItem('dashboard_name') || '';
  } catch (e) {
    console.warn('loadName: failed to read from localStorage', e);
    return '';
  }
}

/**
 * Saves the user name to localStorage.
 * @param {string} name
 */
export function saveName(name) {
  try {
    localStorage.setItem('dashboard_name', name);
  } catch (e) {
    console.error('saveName: failed to write to localStorage', e);
  }
}

/**
 * Initialises the greeting widget.
 * - No name saved: shows a pulsing "Tap to set your name" CTA
 * - Name saved: shows greeting with subtle edit hint
 * - Clicking/tapping anywhere on the wrap opens the name input
 */
export function initGreeting() {
  const greetingEl   = document.getElementById('greeting');
  const greetingWrap = document.getElementById('greeting-wrap');
  const editHint     = document.getElementById('greeting-edit-hint');
  const nameEditRow  = document.getElementById('name-edit-row');
  const nameInput    = document.getElementById('name-input');
  const btnSave      = document.getElementById('btn-save-name');

  /** Refresh greeting text and CTA state based on current name */
  function updateGreeting(name) {
    const hasName = name && name.trim();
    if (greetingEl) {
      greetingEl.textContent = hasName
        ? buildGreetingText(new Date().getHours(), name)
        : getGreeting(new Date().getHours());
    }
    // Toggle no-name CTA mode
    if (greetingWrap) {
      greetingWrap.classList.toggle('no-name', !hasName);
    }
    // Edit hint: always visible on mobile (no hover), subtle on desktop
    if (editHint) {
      editHint.textContent = hasName ? '✎' : '';
    }
  }

  function showNameInput() {
    if (!nameEditRow || !nameInput) return;
    nameInput.value = loadName();
    nameEditRow.hidden = false;
    nameInput.focus();
    nameInput.select();
    if (greetingWrap) greetingWrap.classList.remove('no-name');
  }

  function hideNameInput() {
    if (nameEditRow) nameEditRow.hidden = true;
    // Re-evaluate CTA state after hiding
    updateGreeting(loadName());
  }

  function commitName() {
    const value = nameInput ? nameInput.value.trim() : '';
    saveName(value);
    updateGreeting(value);
    hideNameInput();
  }

  // Initial render
  updateGreeting(loadName());

  if (greetingWrap) {
    greetingWrap.addEventListener('click', showNameInput);
    greetingWrap.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); showNameInput(); }
    });
  }

  if (btnSave) btnSave.addEventListener('click', commitName);

  if (nameInput) {
    nameInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') commitName();
      if (e.key === 'Escape') { saveName(nameInput.value.trim()); hideNameInput(); }
    });
    nameInput.addEventListener('blur', () => setTimeout(() => {
      if (!nameEditRow?.hidden) commitName();
    }, 150));
  }
}

/**
 * Plays a short, pleasant two-tone chime using the Web Audio API.
 * No external files needed — synthesised entirely in the browser.
 */
function playDoneChime() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();

    function playTone(freq, startTime, duration, gainVal) {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(gainVal, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
      osc.start(startTime);
      osc.stop(startTime + duration);
    }

    // Two ascending tones — cheerful "ding-dong"
    playTone(523.25, ctx.currentTime,        0.35, 0.4); // C5
    playTone(783.99, ctx.currentTime + 0.22, 0.5,  0.35); // G5
  } catch (e) {
    // Audio not available — silently ignore
  }
}

/**
 * Requests browser notification permission if not already granted.
 * Fires a notification when the Pomodoro session ends.
 */
function notifyTimerDone() {
  if (!('Notification' in window)) return;

  function send() {
    new Notification('🍅 Pomodoro complete!', {
      body: 'Great focus session. Time for a break!',
      icon: '', // no external icon needed
    });
  }

  if (Notification.permission === 'granted') {
    send();
  } else if (Notification.permission !== 'denied') {
    Notification.requestPermission().then(p => { if (p === 'granted') send(); });
  }
}

/**
 * Triggers the end-of-session celebration:
 * - Visual pulse on the timer display
 * - Chime sound
 * - Browser notification
 */
function onTimerDone() {
  playDoneChime();
  notifyTimerDone();

  const display = document.getElementById('timer-display');
  if (display) {
    display.classList.remove('timer-done-pulse');
    void display.offsetWidth; // reflow to restart animation
    display.classList.add('timer-done-pulse');
    display.addEventListener('animationend', () => display.classList.remove('timer-done-pulse'), { once: true });
  }
}

/** @type {number} Remaining seconds on the timer (default 25 minutes) */
export let timerSeconds = 1500;

/** @type {number|null} Stored interval ID; null when timer is not running */
export let timerIntervalId = null;

/**
 * Formats a number of seconds as a MM:SS string.
 * Different from formatTime (which takes a Date); this takes raw seconds.
 * @param {number} seconds - Total seconds remaining
 * @returns {string} e.g. "25:00" or "04:59"
 */
export function formatTimerDisplay(seconds) {
  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');
  return `${mm}:${ss}`;
}

/**
 * Decrements timerSeconds by one and updates #timer-display.
 * If the timer has reached zero, clears the interval and re-enables #btn-start.
 */
export function tick() {
  if (timerSeconds <= 0) {
    clearInterval(timerIntervalId);
    timerIntervalId = null;
    const btnStart = document.getElementById('btn-start');
    if (btnStart) btnStart.disabled = false;
    onTimerDone();
    return;
  }
  timerSeconds -= 1;
  const display = document.getElementById('timer-display');
  if (display) display.textContent = formatTimerDisplay(timerSeconds);
}

/**
 * Starts the Pomodoro countdown.
 * Guards against duplicate intervals — returns early if already running.
 */
export function startTimer() {
  if (timerIntervalId !== null) return;
  const btnStart = document.getElementById('btn-start');
  if (btnStart) btnStart.disabled = true;
  timerIntervalId = setInterval(tick, 1000);
}

/**
 * Pauses the Pomodoro countdown at the current value.
 * Clears the interval and re-enables #btn-start.
 */
export function pauseTimer() {
  clearInterval(timerIntervalId);
  timerIntervalId = null;
  const btnStart = document.getElementById('btn-start');
  if (btnStart) btnStart.disabled = false;
}

/**
 * Resets the Pomodoro timer back to 25:00.
 * Clears any running interval, resets state, and updates the display.
 */
export function resetTimer() {
  clearInterval(timerIntervalId);
  timerIntervalId = null;
  timerSeconds = 1500;
  const display = document.getElementById('timer-display');
  if (display) display.textContent = '25:00';
  const btnStart = document.getElementById('btn-start');
  if (btnStart) btnStart.disabled = false;
}

/**
 * Initialises the Pomodoro widget:
 * - Sets #timer-display to "25:00"
 * - Wires click listeners for Start, Pause, and Reset buttons
 */
export function initPomodoro() {
  const display = document.getElementById('timer-display');
  if (display) display.textContent = '25:00';

  const btnStart = document.getElementById('btn-start');
  const btnPause = document.getElementById('btn-pause');
  const btnReset = document.getElementById('btn-reset');

  if (btnStart) btnStart.addEventListener('click', startTimer);
  if (btnPause) btnPause.addEventListener('click', pauseTimer);
  if (btnReset) btnReset.addEventListener('click', resetTimer);
}

// ─── Confirm Dialog ──────────────────────────────────────────────────────────

/**
 * Shows a cute custom confirm dialog and resolves with true (confirmed) or false (cancelled).
 * @param {string} message - The question to display
 * @returns {Promise<boolean>}
 */
function confirmDelete(message = 'Delete this item?') {
  return new Promise(resolve => {
    const overlay  = document.getElementById('confirm-overlay');
    const msgEl    = document.getElementById('confirm-msg');
    const btnOk    = document.getElementById('confirm-ok');
    const btnCancel = document.getElementById('confirm-cancel');
    if (!overlay || !btnOk || !btnCancel) { resolve(true); return; }

    if (msgEl) msgEl.textContent = message;
    overlay.hidden = false;

    // Focus the cancel button by default (safer)
    btnCancel.focus();

    function cleanup(result) {
      overlay.hidden = true;
      btnOk.removeEventListener('click', onOk);
      btnCancel.removeEventListener('click', onCancel);
      overlay.removeEventListener('click', onBackdrop);
      document.removeEventListener('keydown', onKey);
      resolve(result);
    }

    const onOk      = () => cleanup(true);
    const onCancel  = () => cleanup(false);
    const onBackdrop = (e) => { if (e.target === overlay) cleanup(false); };
    const onKey     = (e) => {
      if (e.key === 'Escape') cleanup(false);
      if (e.key === 'Enter' && document.activeElement === btnOk) cleanup(true);
    };

    btnOk.addEventListener('click', onOk);
    btnCancel.addEventListener('click', onCancel);
    overlay.addEventListener('click', onBackdrop);
    document.addEventListener('keydown', onKey);
  });
}

// ─── Todo List ───────────────────────────────────────────────────────────────

/** @type {Array<{id: string, text: string, completed: boolean}>} In-memory task array */
export let tasks = [];

/**
 * Reads tasks from localStorage key `dashboard_todos`.
 * @returns {Array<{id: string, text: string, completed: boolean}>}
 */
export function loadTasks() {
  try {
    const raw = localStorage.getItem('dashboard_todos');
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.warn('loadTasks: failed to read from localStorage', e);
    return [];
  }
}

/**
 * Serialises the tasks array to localStorage key `dashboard_todos`.
 * @param {Array<{id: string, text: string, completed: boolean}>} tasks
 */
export function saveTasks(tasks) {
  try {
    localStorage.setItem('dashboard_todos', JSON.stringify(tasks));
  } catch (e) {
    console.error('saveTasks: failed to write to localStorage', e);
  }
}

/**
 * Adds a new task to the in-memory array and persists it.
 * Returns null if text is empty/whitespace or a case-insensitive duplicate exists.
 * @param {string} text
 * @returns {{id: string, text: string, completed: boolean}|null}
 */
export function addTask(text) {
  const trimmed = text.trim();
  if (!trimmed) return null;
  const lower = trimmed.toLowerCase();
  if (tasks.some(t => t.text.toLowerCase() === lower)) return null;
  const task = { id: crypto.randomUUID(), text: trimmed, completed: false };
  tasks.push(task);
  saveTasks(tasks);
  return task;
}

/**
 * Flips the `completed` state of the task with the given id.
 * Fires a celebration animation when marking as complete.
 * Updates only that task's DOM element.
 * @param {string} id
 */
export function toggleTask(id) {
  const task = tasks.find(t => t.id === id);
  if (!task) return;
  task.completed = !task.completed;
  saveTasks(tasks);

  const li = document.querySelector(`[data-task-id="${id}"]`);
  if (li) {
    li.classList.toggle('completed', task.completed);
    const cb = li.querySelector('input[type="checkbox"]');
    if (cb) cb.checked = task.completed;
    // Only celebrate when completing, not when unchecking
    if (task.completed) celebrateTask(li);
  }
  updateProgress();
}

/**
 * Updates the text of the task with the given id.
 * Returns null if newText is empty or a duplicate (excluding the current task).
 * Updates only that task's DOM element.
 * @param {string} id
 * @param {string} newText
 * @returns {{id: string, text: string, completed: boolean}|null}
 */
export function editTask(id, newText) {
  const trimmed = newText.trim();
  if (!trimmed) return null;
  const lower = trimmed.toLowerCase();
  if (tasks.some(t => t.id !== id && t.text.toLowerCase() === lower)) return null;

  const task = tasks.find(t => t.id === id);
  if (!task) return null;
  task.text = trimmed;
  saveTasks(tasks);

  const li = document.querySelector(`[data-task-id="${id}"]`);
  if (li) {
    const span = li.querySelector('.task-text');
    if (span) span.textContent = trimmed;
  }
  return task;
}

/**
 * Removes the task with the given id from the array and the DOM.
 * Asks for confirmation first.
 * @param {string} id
 */
export async function deleteTask(id) {
  const task = tasks.find(t => t.id === id);
  const label = task ? `"${task.text}"` : 'this task';
  const confirmed = await confirmDelete(`Delete ${label}?`);
  if (!confirmed) return;
  tasks = tasks.filter(t => t.id !== id);
  saveTasks(tasks);
  const li = document.querySelector(`[data-task-id="${id}"]`);
  if (li) li.remove();
  updateProgress();
}

/**
 * Fires a mini confetti burst originating from the given element.
 * Creates 12 particles that fly outward and fade, then removes themselves.
 * @param {HTMLElement} originEl - The element to burst from
 */
function burstConfetti(originEl) {
  const rect = originEl.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;

  // Cheerful palette matching the spring theme
  const colors = ['#7FB77E', '#F7C8A0', '#f9d56e', '#f28b82', '#a8d8ea', '#b5ead7', '#ffdac1'];
  const count = 14;

  for (let i = 0; i < count; i++) {
    const dot = document.createElement('span');
    dot.className = 'confetti-dot';

    // Random shape: circle or rect
    dot.style.cssText = `
      position: fixed;
      pointer-events: none;
      z-index: 9999;
      left: ${cx}px;
      top: ${cy}px;
      width: ${4 + Math.random() * 6}px;
      height: ${4 + Math.random() * 6}px;
      border-radius: ${Math.random() > 0.5 ? '50%' : '2px'};
      background: ${colors[Math.floor(Math.random() * colors.length)]};
      opacity: 1;
      transform: translate(-50%, -50%);
    `;

    document.body.appendChild(dot);

    // Random trajectory
    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.8;
    const dist  = 40 + Math.random() * 60;
    const dx    = Math.cos(angle) * dist;
    const dy    = Math.sin(angle) * dist - 20; // slight upward bias
    const rot   = (Math.random() - 0.5) * 360;
    const dur   = 500 + Math.random() * 300;

    dot.animate([
      { transform: `translate(-50%, -50%) rotate(0deg)`,           opacity: 1 },
      { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) rotate(${rot}deg)`, opacity: 0 },
    ], { duration: dur, easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)', fill: 'forwards' })
      .onfinish = () => dot.remove();
  }
}

/**
 * Plays the task-complete celebration on the given <li>:
 * - bounce + green glow animation on the row
 * - confetti burst from the checkbox area
 * @param {HTMLLIElement} li
 */
function celebrateTask(li) {
  // Remove any existing animation so re-completing re-triggers it
  li.classList.remove('task-celebrate');
  // Force reflow to restart animation
  void li.offsetWidth;
  li.classList.add('task-celebrate');
  li.addEventListener('animationend', () => li.classList.remove('task-celebrate'), { once: true });

  const cb = li.querySelector('input[type="checkbox"]');
  burstConfetti(cb || li);
}
const SVG_EDIT = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`;
const SVG_DELETE = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>`;
const SVG_SAVE  = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>`;
const SVG_LINK_DEL = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;

/**
 * Builds a single <li> element for a task.
 * Clicking the task text also toggles the checkbox.
 * @param {{id: string, text: string, completed: boolean}} task
 * @returns {HTMLLIElement}
 */
function buildTaskElement(task) {
  const li = document.createElement('li');
  li.className = `todo-item${task.completed ? ' completed' : ''}`;
  li.dataset.taskId = task.id;

  const cb = document.createElement('input');
  cb.type = 'checkbox';
  cb.checked = task.completed;
  cb.addEventListener('change', () => toggleTask(task.id));

  const span = document.createElement('span');
  span.className = 'task-text';
  span.textContent = task.text;
  // Clicking the text label also toggles the task
  span.addEventListener('click', () => toggleTask(task.id));

  const btnEdit = document.createElement('button');
  btnEdit.className = 'btn-edit';
  btnEdit.setAttribute('aria-label', 'Edit task');
  btnEdit.title = 'Edit task';
  btnEdit.innerHTML = SVG_EDIT;
  btnEdit.addEventListener('click', () => startInlineEdit(li, task.id));

  const btnDelete = document.createElement('button');
  btnDelete.className = 'btn-delete';
  btnDelete.setAttribute('aria-label', 'Delete task');
  btnDelete.title = 'Delete task';
  btnDelete.innerHTML = SVG_DELETE;
  btnDelete.addEventListener('click', () => deleteTask(task.id));

  li.append(cb, span, btnEdit, btnDelete);
  return li;
}

/**
 * Replaces the task text span with an inline input + save button.
 * - Edit button stays highlighted (is-editing class) while open.
 * - Clicking outside (blur) auto-commits after a short delay.
 * - Escape cancels and restores original text.
 * @param {HTMLLIElement} li
 * @param {string} id
 */
function startInlineEdit(li, id) {
  // Prevent opening a second edit on the same item
  if (li.querySelector('.edit-input')) return;

  const span = li.querySelector('.task-text');
  const btnEdit = li.querySelector('.btn-edit');
  if (!span || !btnEdit) return;

  const originalText = tasks.find(t => t.id === id)?.text ?? span.textContent;

  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'edit-input';
  input.value = originalText;

  const btnSave = document.createElement('button');
  btnSave.className = 'btn-save';
  btnSave.setAttribute('aria-label', 'Save task');
  btnSave.title = 'Save';
  btnSave.innerHTML = SVG_SAVE;

  span.replaceWith(input);
  btnEdit.replaceWith(btnSave);
  btnSave.classList.add('is-editing');
  input.focus();
  input.select();

  let committed = false;

  function commitEdit(cancel = false) {
    if (committed) return;
    committed = true;

    const newText = cancel ? originalText : input.value;
    const result = cancel ? null : editTask(id, newText);

    // Determine final text to display
    const finalText = (result !== null && !cancel)
      ? result.text
      : (tasks.find(t => t.id === id)?.text ?? originalText);

    const newSpan = document.createElement('span');
    newSpan.className = 'task-text';
    newSpan.textContent = finalText;
    newSpan.addEventListener('click', () => toggleTask(id));
    input.replaceWith(newSpan);

    const newBtnEdit = document.createElement('button');
    newBtnEdit.className = 'btn-edit';
    newBtnEdit.setAttribute('aria-label', 'Edit task');
    newBtnEdit.title = 'Edit task';
    newBtnEdit.innerHTML = SVG_EDIT;
    newBtnEdit.addEventListener('click', () => startInlineEdit(li, id));
    btnSave.replaceWith(newBtnEdit);
  }

  btnSave.addEventListener('click', () => commitEdit(false));

  input.addEventListener('keydown', e => {
    if (e.key === 'Enter')  { e.preventDefault(); commitEdit(false); }
    if (e.key === 'Escape') { e.preventDefault(); commitEdit(true); }
  });

  // Blur: commit after short delay so save-button click fires first
  input.addEventListener('blur', () => setTimeout(() => commitEdit(false), 150));
  btnSave.addEventListener('blur', () => setTimeout(() => commitEdit(false), 150));
}

/**
 * Updates the progress bar and score display based on current tasks array.
 * Shows emoji that evolves with progress, animates the fill, bumps emoji on change.
 */
function updateProgress() {
  const total     = tasks.length;
  const done      = tasks.filter(t => t.completed).length;
  const pct       = total === 0 ? 0 : Math.round((done / total) * 100);

  const progressEl = document.getElementById('todo-progress');
  const fillEl     = document.getElementById('progress-fill');
  const labelEl    = document.getElementById('progress-label');
  const pctEl      = document.getElementById('progress-pct');
  const emojiEl    = document.getElementById('progress-emoji');
  const trackEl    = document.querySelector('.progress-track');

  if (!progressEl) return;

  // Hide widget when no tasks
  if (total === 0) { progressEl.hidden = true; return; }
  progressEl.hidden = false;

  // Emoji ladder — gets more excited as progress grows
  const emoji =
    pct === 100 ? '🎉' :
    pct >= 80   ? '🔥' :
    pct >= 60   ? '💪' :
    pct >= 40   ? '😊' :
    pct >= 20   ? '🌿' :
                  '🌱';

  if (emojiEl && emojiEl.textContent !== emoji) {
    emojiEl.textContent = emoji;
    emojiEl.classList.remove('bump');
    void emojiEl.offsetWidth;
    emojiEl.classList.add('bump');
    emojiEl.addEventListener('animationend', () => emojiEl.classList.remove('bump'), { once: true });
  }

  if (labelEl) labelEl.textContent = `${done} / ${total} done`;
  if (pctEl)   pctEl.textContent   = `${pct}%`;
  if (fillEl) {
    fillEl.style.width = `${pct}%`;
    fillEl.classList.toggle('all-done', pct === 100);
  }
  if (trackEl) trackEl.setAttribute('aria-valuenow', pct);
}


export function renderTasks() {
  const list = document.getElementById('todo-list');
  if (!list) return;
  list.innerHTML = '';
  tasks.forEach(task => list.appendChild(buildTaskElement(task)));
  updateProgress();
}

/**
 * Initialises the Todo List widget:
 * - Loads tasks from localStorage into the in-memory array
 * - Renders all tasks
 * - Wires #btn-add-todo click and #todo-input Enter keydown to add tasks
 * - Shows inline error in #todo-error on validation failure; clears on success
 */
export function initTodoList() {
  tasks = loadTasks();
  renderTasks();

  const input = document.getElementById('todo-input');
  const btnAdd = document.getElementById('btn-add-todo');
  const errorEl = document.getElementById('todo-error');

  function attemptAdd() {
    const text = input ? input.value : '';
    const result = addTask(text);
    if (result === null) {
      if (errorEl) {
        errorEl.textContent = text.trim()
          ? 'A task with that name already exists.'
          : 'Task cannot be empty.';
      }
    } else {
      if (errorEl) errorEl.textContent = '';
      if (input) input.value = '';
      const list = document.getElementById('todo-list');
      if (list) list.appendChild(buildTaskElement(result));
      updateProgress();
    }
  }

  if (btnAdd) btnAdd.addEventListener('click', attemptAdd);
  if (input) {
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') attemptAdd();
    });
  }
}

// ─── Quick Links ─────────────────────────────────────────────────────────────

/** @type {Array<{id: string, name: string, url: string}>} In-memory links array */
export let links = [];

/**
 * Reads links from localStorage key `dashboard_links`.
 * @returns {Array<{id: string, name: string, url: string}>}
 */
export function loadLinks() {
  try {
    const raw = localStorage.getItem('dashboard_links');
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.warn('loadLinks: failed to read from localStorage', e);
    return [];
  }
}

/**
 * Serialises the links array to localStorage key `dashboard_links`.
 * @param {Array<{id: string, name: string, url: string}>} links
 */
export function saveLinks(links) {
  try {
    localStorage.setItem('dashboard_links', JSON.stringify(links));
  } catch (e) {
    console.error('saveLinks: failed to write to localStorage', e);
  }
}

/**
 * Adds a new link to the in-memory array and persists it.
 * Returns null if the URL does not start with http:// or https://.
 * @param {string} name
 * @param {string} url
 * @returns {{id: string, name: string, url: string}|null}
 */
export function addLink(name, url) {
  if (!url.startsWith('http://') && !url.startsWith('https://')) return null;
  const link = { id: crypto.randomUUID(), name, url };
  links.push(link);
  saveLinks(links);
  return link;
}

/**
 * Removes the link with the given id from the array, persists, and removes its DOM element.
 * Asks for confirmation first.
 * @param {string} id
 */
export async function deleteLink(id) {
  const link = links.find(l => l.id === id);
  const label = link ? `"${link.name}"` : 'this link';
  const confirmed = await confirmDelete(`Remove ${label}?`);
  if (!confirmed) return;
  links = links.filter(l => l.id !== id);
  saveLinks(links);
  const card = document.querySelector(`[data-link-id="${id}"]`);
  if (card) card.remove();
}

// Default quick links seeded on first load (only if localStorage is empty)
const DEFAULT_LINKS = [
  { name: 'YouTube',   url: 'https://youtube.com',    color: '#FF0000', icon: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1C24 15.9 24 12 24 12s0-3.9-.5-5.8zM9.7 15.5V8.5l6.3 3.5-6.3 3.5z"/></svg>` },
  { name: 'W3Schools', url: 'https://w3schools.com',  color: '#04AA6D', icon: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M1.5 0l2.3 20.4L12 24l8.2-3.6L22.5 0zm15.2 7H7.8l.3 2.7h8.3l-.9 8.1L12 19l-3.5-1.2-.2-2.8h2.6l.1 1.4 1 .3 1-.3.1-1.7H7.4L6.7 7h10.3z"/></svg>` },
  { name: 'GitHub',    url: 'https://github.com',     color: '#24292e', icon: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.44 9.8 8.2 11.38.6.1.82-.26.82-.58v-2.03c-3.34.72-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.74.08-.73.08-.73 1.2.08 1.84 1.24 1.84 1.24 1.07 1.83 2.8 1.3 3.49 1 .1-.78.42-1.3.76-1.6-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.12-.3-.54-1.52.12-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 3-.4c1.02 0 2.04.13 3 .4 2.28-1.55 3.29-1.23 3.29-1.23.66 1.66.24 2.88.12 3.18.77.84 1.24 1.91 1.24 3.22 0 4.61-2.81 5.63-5.48 5.92.43.37.81 1.1.81 2.22v3.29c0 .32.22.69.83.57C20.57 21.8 24 17.3 24 12c0-6.63-5.37-12-12-12z"/></svg>` },
  { name: 'MDN Docs',  url: 'https://developer.mozilla.org', color: '#0078D4', icon: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0zm0 2c5.52 0 10 4.48 10 10s-4.48 10-10 10S2 17.52 2 12 6.48 2 12 2zm-1 5v2H7v2h4v2H7v2h4v2h2v-2h4v-2h-4v-2h4V9h-4V7h-2z"/></svg>` },
];

/**
 * Builds a single iOS-style link card with colored icon.
 * @param {{id: string, name: string, url: string, color?: string, icon?: string}} link
 * @returns {HTMLDivElement}
 */
function buildLinkCard(link) {
  const card = document.createElement('div');
  card.className = 'link-card';
  card.dataset.linkId = link.id;

  // Colored icon bubble
  const iconBubble = document.createElement('div');
  iconBubble.className = 'link-icon-bubble';
  iconBubble.style.setProperty('--link-color', link.color || 'var(--color-primary)');

  if (link.icon) {
    iconBubble.innerHTML = link.icon;
  } else {
    // Fallback: first letter of name
    iconBubble.textContent = (link.name || '?')[0].toUpperCase();
    iconBubble.classList.add('link-icon-letter');
  }

  const a = document.createElement('a');
  a.href = link.url;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  a.className = 'link-card-anchor';
  a.title = link.url;

  const nameEl = document.createElement('span');
  nameEl.className = 'link-card-name';
  nameEl.textContent = link.name;

  a.appendChild(nameEl);

  const btnDelete = document.createElement('button');
  btnDelete.className = 'btn-delete-link';
  btnDelete.setAttribute('aria-label', 'Delete link');
  btnDelete.title = 'Remove link';
  btnDelete.innerHTML = SVG_LINK_DEL;
  btnDelete.addEventListener('click', (e) => {
    e.stopPropagation();
    deleteLink(link.id);
  });

  card.append(iconBubble, a, btnDelete);
  return card;
}

/**
 * Clears #links-container and re-renders all links from the in-memory array.
 */
export function renderLinks() {
  const container = document.getElementById('links-container');
  if (!container) return;
  container.innerHTML = '';
  links.forEach(link => container.appendChild(buildLinkCard(link)));
}

/**
 * Initialises the Quick Links widget:
 * - Loads links from localStorage into the in-memory array
 * - Renders all links
 * - Wires #btn-add-link click to add a link using #link-name-input and #link-url-input
 * - Shows inline error in #link-error if addLink returns null (invalid URL)
 * - Clears error and inputs on successful add; appends only the new card
 */
export function initQuickLinks() {
  links = loadLinks();

  // Seed default links on first load (when localStorage is empty)
  if (links.length === 0) {
    links = DEFAULT_LINKS.map(d => ({
      id: crypto.randomUUID(),
      name: d.name,
      url: d.url,
      color: d.color,
      icon: d.icon,
    }));
    saveLinks(links);
  }

  renderLinks();

  const nameInput = document.getElementById('link-name-input');
  const urlInput = document.getElementById('link-url-input');
  const btnAdd = document.getElementById('btn-add-link');
  const errorEl = document.getElementById('link-error');
  const container = document.getElementById('links-container');

  if (btnAdd) {
    btnAdd.addEventListener('click', () => {
      const name = nameInput ? nameInput.value.trim() : '';
      const url = urlInput ? urlInput.value.trim() : '';
      if (!name) { if (errorEl) errorEl.textContent = 'Link name cannot be empty.'; return; }
      const result = addLink(name, url);
      if (result === null) {
        if (errorEl) errorEl.textContent = 'URL must start with http:// or https://';
      } else {
        if (errorEl) errorEl.textContent = '';
        if (nameInput) nameInput.value = '';
        if (urlInput) urlInput.value = '';
        if (container) container.appendChild(buildLinkCard(result));
      }
    });
  }
}

// ─── Theme Toggle ─────────────────────────────────────────────────────────────

/**
 * Reads the saved theme preference from localStorage.
 * Defaults to 'light' if no preference is stored or on read failure.
 * @returns {'light'|'dark'}
 */
export function loadTheme() {
  try {
    const saved = localStorage.getItem('dashboard_theme');
    return saved === 'dark' ? 'dark' : 'light';
  } catch (e) {
    console.warn('loadTheme: failed to read from localStorage', e);
    return 'light';
  }
}

/**
 * Applies the given theme to the document and persists it to localStorage.
 * Sets data-theme="dark" on <html> for dark mode; removes it for light mode.
 * Updates #btn-theme-toggle label to reflect the current state.
 * @param {'light'|'dark'} theme
 */
export function applyTheme(theme) {
  if (theme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
  } else {
    document.documentElement.removeAttribute('data-theme');
  }

  try {
    localStorage.setItem('dashboard_theme', theme);
  } catch (e) {
    console.error('applyTheme: failed to write to localStorage', e);
  }

  // Update button icons: moon shown in light mode, sun in dark mode
  const iconMoon = document.getElementById('icon-moon');
  const iconSun  = document.getElementById('icon-sun');
  const btn = document.getElementById('btn-theme-toggle');
  if (btn) {
    if (theme === 'dark') {
      if (iconMoon) iconMoon.style.display = 'none';
      if (iconSun)  iconSun.style.display  = '';
      btn.setAttribute('aria-label', 'Switch to light mode');
      btn.title = 'Switch to light mode';
    } else {
      if (iconMoon) iconMoon.style.display = '';
      if (iconSun)  iconSun.style.display  = 'none';
      btn.setAttribute('aria-label', 'Switch to dark mode');
      btn.title = 'Switch to dark mode';
    }
  }
}

/**
 * Reads the current theme from the <html> element and toggles it.
 * Adds .theme-transitioning to <html> for the duration of the CSS transition
 * so all elements animate smoothly, then removes it to keep page-load instant.
 */
export function toggleTheme() {
  const html = document.documentElement;
  html.classList.add('theme-transitioning');
  const current = html.dataset.theme === 'dark' ? 'dark' : 'light';
  applyTheme(current === 'dark' ? 'light' : 'dark');
  // Remove after transition completes (matches 0.35s in CSS)
  setTimeout(() => html.classList.remove('theme-transitioning'), 400);
}

/**
 * Initialises the Theme Toggle widget.
 * Must run before other widgets to avoid a flash of wrong theme on load.
 * Loads the saved theme and applies it, then wires the toggle button.
 */
export function initTheme() {
  applyTheme(loadTheme());

  const btn = document.getElementById('btn-theme-toggle');
  if (btn) btn.addEventListener('click', toggleTheme);
}

// ─── Bootstrap ───────────────────────────────────────────────────────────────
// Initialise all widgets when the DOM is ready.
// initTheme runs first to apply the saved theme before any content renders.
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initClock();
  initGreeting();
  initPomodoro();
  initTodoList();
  initQuickLinks();
});
