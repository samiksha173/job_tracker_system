// ─────────────────────────────────────────────
//  reminders.js  —  Job Tracker Reminder Engine
// ─────────────────────────────────────────────

const STORAGE_KEY = 'jobTrackerEvents';

// ── HELPERS ────────────────────────────────────
function loadEvents() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
  catch { return []; }
}

function saveEvents(events) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
}

function todayStr() {
  const t = new Date();
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
}

function daysDiff(dateStr) {
  const now = new Date(); now.setHours(0, 0, 0, 0);
  const then = new Date(dateStr + 'T00:00:00');
  return Math.round((then - now) / 86400000);
}

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}

const TYPE_META = {
  interview: { icon: '🟢', label: 'Interview', cls: 'interview' },
  deadline: { icon: '🔴', label: 'Deadline', cls: 'deadline' },
  reminder: { icon: '🔔', label: 'Reminder', cls: 'reminder' },
  offer: { icon: '🔵', label: 'Offer', cls: 'offer' },
};

// ── POPUP NOTIFICATION ─────────────────────────
function showPopup(title, message, type = 'info') {
  // Remove existing popup
  const old = document.getElementById('reminderPopup');
  if (old) old.remove();

  const colors = {
    urgent: { bg: '#fff0f3', border: '#ff4d8f', accent: '#ff4d8f', icon: '🚨' },
    warning: { bg: '#fffbea', border: '#f59e0b', accent: '#f59e0b', icon: '⚠️' },
    info: { bg: '#f0f4ff', border: '#6c63ff', accent: '#6c63ff', icon: '🔔' },
    success: { bg: '#f0fdf4', border: '#22c55e', accent: '#22c55e', icon: '✅' },
  };
  const c = colors[type] || colors.info;

  const popup = document.createElement('div');
  popup.id = 'reminderPopup';
  popup.innerHTML = `
    <div style="display:flex;align-items:flex-start;gap:12px;">
      <div style="font-size:1.4rem;line-height:1;">${c.icon}</div>
      <div style="flex:1;min-width:0;">
        <div style="font-weight:700;font-size:0.9rem;color:#1a1a2e;margin-bottom:3px;">${title}</div>
        <div style="font-size:0.8rem;color:#555570;line-height:1.4;">${message}</div>
      </div>
      <button onclick="this.closest('#reminderPopup').remove()"
        style="background:none;border:none;font-size:1rem;cursor:pointer;color:#aaa;padding:0;line-height:1;flex-shrink:0;">✕</button>
    </div>
    <div id="popupProgress" style="
      position:absolute;bottom:0;left:0;height:3px;
      background:${c.accent};border-radius:0 0 12px 12px;
      width:100%;transition:width linear;
    "></div>
  `;
  Object.assign(popup.style, {
    position: 'fixed',
    bottom: '24px',
    right: '24px',
    width: '320px',
    background: c.bg,
    border: `1.5px solid ${c.border}`,
    borderRadius: '12px',
    padding: '16px 16px 20px',
    boxShadow: `0 8px 32px rgba(0,0,0,0.12), 0 2px 8px ${c.border}33`,
    zIndex: '9999',
    fontFamily: "'DM Sans', sans-serif",
    animation: 'popupSlideIn 0.3s ease',
    overflow: 'hidden',
  });

  // Inject keyframes once
  if (!document.getElementById('popupStyle')) {
    const s = document.createElement('style');
    s.id = 'popupStyle';
    s.textContent = `
      @keyframes popupSlideIn {
        from { transform: translateY(20px); opacity: 0; }
        to   { transform: translateY(0);    opacity: 1; }
      }
    `;
    document.head.appendChild(s);
  }

  document.body.appendChild(popup);

  // Progress bar countdown (5s)
  const bar = popup.querySelector('#popupProgress');
  bar.style.width = '100%';
  setTimeout(() => { bar.style.transitionDuration = '4.8s'; bar.style.width = '0%'; }, 50);
  setTimeout(() => {
    popup.style.opacity = '0';
    popup.style.transform = 'translateY(10px)';
    popup.style.transition = 'all 0.3s ease';
    setTimeout(() => popup.remove(), 300);
  }, 5000);
}

// Stack multiple popups
let popupQueue = [];
let popupShowing = false;

function queuePopup(title, message, type) {
  popupQueue.push({ title, message, type });
  if (!popupShowing) processQueue();
}

function processQueue() {
  if (popupQueue.length === 0) { popupShowing = false; return; }
  popupShowing = true;
  const { title, message, type } = popupQueue.shift();
  showPopup(title, message, type);
  setTimeout(processQueue, 5500);
}

// ── CHECK & FIRE POPUPS ON LOAD ────────────────
function checkAndNotify(events) {
  const today = todayStr();
  const urgent = events.filter(e => { const d = daysDiff(e.date); return d >= 0 && d <= 2; });
  const thisWeek = events.filter(e => { const d = daysDiff(e.date); return d >= 3 && d <= 7; });

  if (urgent.length > 0) {
    urgent.forEach(ev => {
      const d = daysDiff(ev.date);
      const when = d === 0 ? 'TODAY' : d === 1 ? 'Tomorrow' : `In ${d} days`;
      queuePopup(
        `${TYPE_META[ev.type]?.icon || '🔔'} ${when}: ${ev.title}`,
        `${ev.time ? '🕐 ' + ev.time + '  ·  ' : ''}${formatDate(ev.date)}${ev.note ? '<br>📝 ' + ev.note : ''}`,
        'urgent'
      );
    });
  } else if (thisWeek.length > 0) {
    queuePopup(
      `📅 ${thisWeek.length} reminder(s) this week`,
      thisWeek.slice(0, 3).map(e => `• ${e.title} (${formatDate(e.date)})`).join('<br>'),
      'warning'
    );
  } else {
    queuePopup('✅ All clear!', 'No urgent reminders right now. You\'re on track!', 'success');
  }
}

// ── RENDER PAGE ────────────────────────────────
function renderPage() {
  const events = loadEvents();
  const today = todayStr();

  // Split into categories
  const past = events.filter(e => daysDiff(e.date) < 0);
  const urgent = events.filter(e => { const d = daysDiff(e.date); return d >= 0 && d <= 2; });
  const thisWeek = events.filter(e => { const d = daysDiff(e.date); return d >= 3 && d <= 7; });
  const upcoming = events.filter(e => daysDiff(e.date) > 7);

  // Stat counters
  document.getElementById('urgentCount').textContent = urgent.length;
  document.getElementById('weekCount').textContent = thisWeek.length;
  document.getElementById('upcomingCount').textContent = upcoming.length;

  // Main list
  renderList(events);
}

function renderList(events) {
  const container = document.querySelector('.reminder-list-container');

  if (events.length === 0) {
    container.innerHTML = `
      <h3>All Reminders</h3>
      <p class="muted">Fetched from your Calendar</p>
      <div class="empty-state">
        <div class="check-icon">✔️</div>
        <p>No reminders yet. Add events in the Calendar to see them here.</p>
      </div>`;
    return;
  }

  // Sort: soonest first, then past
  const sorted = [...events].sort((a, b) => {
    const da = daysDiff(a.date), db = daysDiff(b.date);
    if (da >= 0 && db >= 0) return da - db;
    if (da < 0 && db < 0) return db - da;
    return da >= 0 ? -1 : 1;
  });

  container.innerHTML = `
    <div class="reminder-list-header">
      <div>
        <h3>All Reminders</h3>
        <p class="muted">Synced from your Calendar · ${events.length} total</p>
      </div>
      <div class="filter-row" id="filterRow"></div>
    </div>
    <div id="reminderItems"></div>
  `;

  // Filter buttons
  const filters = ['All', 'Urgent', 'This Week', 'Upcoming', 'Past'];
  const filterRow = document.getElementById('filterRow');
  let activeFilter = 'All';

  filters.forEach(f => {
    const btn = document.createElement('button');
    btn.className = 'filter-btn' + (f === 'All' ? ' active' : '');
    btn.textContent = f;
    btn.addEventListener('click', () => {
      activeFilter = f;
      filterRow.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      applyFilter(sorted, activeFilter);
    });
    filterRow.appendChild(btn);
  });

  applyFilter(sorted, 'All');
}

function applyFilter(events, filter) {
  const itemsEl = document.getElementById('reminderItems');
  let filtered = events;

  if (filter === 'Urgent') filtered = events.filter(e => { const d = daysDiff(e.date); return d >= 0 && d <= 2; });
  if (filter === 'This Week') filtered = events.filter(e => { const d = daysDiff(e.date); return d >= 3 && d <= 7; });
  if (filter === 'Upcoming') filtered = events.filter(e => daysDiff(e.date) > 7);
  if (filter === 'Past') filtered = events.filter(e => daysDiff(e.date) < 0);

  if (filtered.length === 0) {
    itemsEl.innerHTML = `
      <div class="empty-state" style="margin-top:20px;">
        <div class="check-icon">🔍</div>
        <p>No reminders in this category.</p>
      </div>`;
    return;
  }

  itemsEl.innerHTML = filtered.map(ev => reminderCard(ev)).join('');

  // Bind delete buttons
  itemsEl.querySelectorAll('.del-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = parseInt(btn.dataset.id);
      deleteEvent(id);
    });
  });
}

function reminderCard(ev) {
  const d = daysDiff(ev.date);
  const meta = TYPE_META[ev.type] || TYPE_META.reminder;
  const isPast = d < 0;

  let urgencyClass = '';
  let urgencyLabel = '';
  let urgencyStyle = '';

  if (isPast) {
    urgencyClass = 'card-past';
    urgencyLabel = `<span class="urg-badge past-badge">Past</span>`;
  } else if (d === 0) {
    urgencyClass = 'card-today';
    urgencyLabel = `<span class="urg-badge today-badge">Today</span>`;
    urgencyStyle = 'border-left: 3px solid #ff4d8f;';
  } else if (d <= 2) {
    urgencyClass = 'card-urgent';
    urgencyLabel = `<span class="urg-badge urgent-badge">In ${d} day${d > 1 ? 's' : ''}</span>`;
    urgencyStyle = 'border-left: 3px solid #ef4444;';
  } else if (d <= 7) {
    urgencyClass = 'card-week';
    urgencyLabel = `<span class="urg-badge week-badge">In ${d} days</span>`;
    urgencyStyle = 'border-left: 3px solid #f59e0b;';
  } else {
    urgencyLabel = `<span class="urg-badge future-badge">In ${d} days</span>`;
    urgencyStyle = 'border-left: 3px solid #6c63ff;';
  }

  return `
    <div class="rem-card ${urgencyClass}" style="${urgencyStyle}">
      <div class="rem-icon ${meta.cls}">${meta.icon}</div>
      <div class="rem-body">
        <div class="rem-title">${ev.title}</div>
        <div class="rem-meta">
          📅 ${formatDate(ev.date)}
          ${ev.time ? `&nbsp;·&nbsp; 🕐 ${ev.time}` : ''}
          ${ev.note ? `&nbsp;·&nbsp; 📝 ${ev.note}` : ''}
        </div>
      </div>
      <div class="rem-right">
        <span class="type-badge ${meta.cls}">${meta.label}</span>
        ${urgencyLabel}
        <button class="del-btn" data-id="${ev.id}" title="Delete reminder">🗑</button>
      </div>
    </div>
  `;
}

function deleteEvent(id) {
  let events = loadEvents();
  const ev = events.find(e => e.id === id);
  events = events.filter(e => e.id !== id);
  saveEvents(events);
  renderPage();
  if (ev) showPopup('Deleted', `"${ev.title}" has been removed.`, 'info');
}

// ── INJECT REMINDER-SPECIFIC STYLES ───────────────────
function injectStyles() {
  if (document.getElementById('remStyles')) return;
  const s = document.createElement('style');
  s.id = 'remStyles';
  s.textContent = `
    /* Stat cards row */
    .reminder-cards {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
      margin-bottom: 28px;
    }
    .stat-card {
      background: #fff;
      border: 1px solid #e8e8ec;
      border-radius: 12px;
      padding: 18px 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      box-shadow: 0 1px 4px rgba(0,0,0,0.05);
    }
    .stat-card.urgent   { border-left: 4px solid #ef4444; }
    .stat-card.this-week{ border-left: 4px solid #f59e0b; }
    .stat-card.upcoming { border-left: 4px solid #6c63ff; }
    .stat-info span { font-size: 0.75rem; color: #8888a0; font-weight: 600; text-transform: uppercase; letter-spacing: 0.4px; }
    .stat-info h2 { font-size: 2rem; font-weight: 700; color: #1a1a2e; margin-top: 2px; }
    .stat-icon { width: 44px; height: 44px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 1.3rem; }
    .red-bg    { background: rgba(239,68,68,0.1);   }
    .yellow-bg { background: rgba(245,158,11,0.1);  }
    .blue-bg   { background: rgba(108,99,255,0.1);  }

    /* List container */
    .reminder-list-container {
      background: #fff;
      border: 1px solid #e8e8ec;
      border-radius: 14px;
      padding: 22px;
      box-shadow: 0 1px 5px rgba(0,0,0,0.04);
    }
    .reminder-list-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 12px;
      margin-bottom: 18px;
    }
    .reminder-list-container h3 { font-size: 1rem; font-weight: 700; color: #1a1a2e; }
    .reminder-list-container .muted { font-size: 0.8rem; color: #8888a0; margin-top: 3px; }

    /* Filter row */
    .filter-row { display: flex; flex-wrap: wrap; gap: 6px; }
    .filter-btn {
      background: #f5f5f7;
      border: 1px solid #e8e8ec;
      color: #8888a0;
      padding: 5px 13px;
      border-radius: 20px;
      font-family: inherit;
      font-size: 0.75rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s;
    }
    .filter-btn:hover  { background: #f0e6ef; color: #ff4d8f; border-color: #ff4d8f; }
    .filter-btn.active { background: rgba(255,77,143,0.1); color: #ff4d8f; border-color: #ff4d8f; }

    /* Reminder cards */
    #reminderItems { display: flex; flex-direction: column; gap: 10px; }

    .rem-card {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 14px 16px;
      border-radius: 10px;
      border: 1px solid #e8e8ec;
      background: #fafafa;
      transition: box-shadow 0.15s, border-color 0.15s;
    }
    .rem-card:hover { box-shadow: 0 2px 10px rgba(0,0,0,0.07); border-color: #d0d0e0; }
    .rem-card.card-past { opacity: 0.5; }
    .rem-card.card-today { background: #fff0f3; }
    .rem-card.card-urgent { background: #fff8f8; }

    .rem-icon {
      width: 38px; height: 38px;
      border-radius: 9px;
      display: flex; align-items: center; justify-content: center;
      font-size: 1.1rem;
      flex-shrink: 0;
    }
    .rem-icon.interview { background: rgba(34,197,94,0.1);  }
    .rem-icon.deadline  { background: rgba(239,68,68,0.1);  }
    .rem-icon.reminder  { background: rgba(139,92,246,0.1); }
    .rem-icon.offer     { background: rgba(14,165,233,0.1); }

    .rem-body { flex: 1; min-width: 0; }
    .rem-title { font-size: 0.875rem; font-weight: 600; color: #1a1a2e; }
    .rem-meta  { font-size: 0.72rem; color: #8888a0; margin-top: 3px; }

    .rem-right { display: flex; align-items: center; gap: 7px; flex-shrink: 0; flex-wrap: wrap; justify-content: flex-end; }

    /* Type badge */
    .type-badge {
      font-size: 0.6rem; font-weight: 700;
      padding: 2px 8px; border-radius: 20px;
      text-transform: uppercase; letter-spacing: 0.4px;
    }
    .type-badge.interview { background: rgba(34,197,94,0.1);  color: #22c55e; }
    .type-badge.deadline  { background: rgba(239,68,68,0.1);  color: #ef4444; }
    .type-badge.reminder  { background: rgba(139,92,246,0.1); color: #8b5cf6; }
    .type-badge.offer     { background: rgba(14,165,233,0.1); color: #0ea5e9; }

    /* Urgency badges */
    .urg-badge {
      font-size: 0.58rem; font-weight: 700;
      padding: 2px 7px; border-radius: 20px;
      text-transform: uppercase; letter-spacing: 0.3px;
    }
    .today-badge  { background: rgba(255,77,143,0.12); color: #ff4d8f; }
    .urgent-badge { background: rgba(239,68,68,0.1);   color: #ef4444; }
    .week-badge   { background: rgba(245,158,11,0.1);  color: #f59e0b; }
    .future-badge { background: rgba(108,99,255,0.1);  color: #6c63ff; }
    .past-badge   { background: #f0f0f4; color: #aaa; }

    /* Delete button */
    .del-btn {
      background: none; border: none;
      cursor: pointer; font-size: 0.95rem;
      opacity: 0.4; transition: opacity 0.15s;
      padding: 4px;
    }
    .del-btn:hover { opacity: 1; }

    /* Empty state */
    .empty-state { text-align: center; padding: 36px 0; color: #8888a0; }
    .check-icon  { font-size: 2rem; margin-bottom: 10px; }
    .empty-state p { font-size: 0.85rem; }

    @media (max-width: 700px) {
      .reminder-cards { grid-template-columns: 1fr; }
      .rem-right { display: none; }
    }
  `;
  document.head.appendChild(s);
}

// ── INIT ───────────────────────────────────────
injectStyles();
renderPage();
checkAndNotify(loadEvents());

// Refresh every 60 seconds in case calendar data changes in another tab
window.addEventListener('storage', (e) => {
  if (e.key === STORAGE_KEY) renderPage();
});

// ── Hamburger ─────────────────────────────────────
const hb = document.getElementById('hamburger');
const mn = document.getElementById('mobileNav');
hb?.addEventListener('click', () => {
  hb.classList.toggle('open');
  mn.classList.toggle('open');
});
document.addEventListener('click', e => {
  if (hb && mn && !hb.contains(e.target) && !mn.contains(e.target)) {
    hb.classList.remove('open');
    mn.classList.remove('open');
  }
});



/* ── Logout ──────────────────────────────────────────── */
function logout() { _logout(); }




