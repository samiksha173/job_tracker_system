// 1. Event Database (Mock data)
const eventsData = {
  "2026-03-06": [{ title: "Submit Portfolio", time: "09:00 AM", type: "Task" }],
  "2026-03-15": [
    { title: "Google Interview", time: "10:00 AM", type: "Interview" },
    { title: "Amazon Assessment", time: "02:00 PM", type: "Test" }
  ],
  "2026-03-22": [{ title: "Follow up: Meta", time: "04:30 PM", type: "Reminder" }]
};

// 2. DOM Elements
const daysContainer = document.getElementById('daysContainer');
const monthDisplay = document.getElementById('monthDisplay');
const selectedDateTitle = document.getElementById('selectedDateTitle');
const eventCount = document.getElementById('eventCount');
const sidebar = document.querySelector('.calendar-sidebar');

// 3. State Management
let nav = 0; // Tracks month navigation (0 = current, -1 = prev, 1 = next)
const today = new Date();

function loadCalendar() {
  const dt = new Date();

  // Adjust date based on navigation
  if (nav !== 0) {
    dt.setMonth(new Date().getMonth() + nav);
  }

  const day = dt.getDate();
  const month = dt.getMonth();
  const year = dt.getFullYear();

  const firstDayOfMonth = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const dateString = firstDayOfMonth.toLocaleDateString('en-us', {
    weekday: 'long',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  });

  const paddingDays = firstDayOfMonth.getDay();

  // Update Header
  monthDisplay.innerText = `${dt.toLocaleDateString('en-us', { month: 'long' })} ${year}`;

  daysContainer.innerHTML = '';

  // Create Calendar Grid
  for (let i = 1; i <= paddingDays + daysInMonth; i++) {
    const daySquare = document.createElement('div');
    daySquare.classList.add('day');

    const dayString = `${year}-${String(month + 1).padStart(2, '0')}-${String(i - paddingDays).padStart(2, '0')}`;

    if (i > paddingDays) {
      const dayNum = i - paddingDays;
      daySquare.innerText = dayNum;

      // Highlight Today
      if (dayNum === today.getDate() && nav === 0) {
        daySquare.classList.add('current-day-highlight');
      }

      // Check for Events
      if (eventsData[dayString]) {
        const eventDot = document.createElement('div');
        eventDot.classList.add('event-dot');
        daySquare.appendChild(eventDot);
      }

      // Click Logic
      daySquare.addEventListener('click', () => showEvents(dayString, dayNum, month, year, daySquare));

      // Auto-select March 15 on first load (to match your screenshot)
      if (dayNum === 15 && month === 2 && year === 2026) {
        daySquare.classList.add('active');
      }
    } else {
      daySquare.classList.add('padding');
    }

    daysContainer.appendChild(daySquare);
  }
}

function showEvents(dateKey, day, month, year, element) {
  // UI: Toggle Active Class
  document.querySelectorAll('.day').forEach(d => d.classList.remove('active'));
  element.classList.add('active');

  // Update Sidebar Title
  const dateObj = new Date(year, month, day);
  selectedDateTitle.innerText = dateObj.toLocaleDateString('en-us', { month: 'long', day: 'numeric', year: 'numeric' });

  // Update Sidebar List
  const dayEvents = eventsData[dateKey] || [];
  eventCount.innerText = `${dayEvents.length} event(s)`;

  // Clean old events
  const existingList = document.querySelector('.event-list');
  if (existingList) existingList.remove();

  const emptyState = document.querySelector('.empty-state');

  if (dayEvents.length > 0) {
    emptyState.style.display = 'none';
    const listContainer = document.createElement('div');
    listContainer.classList.add('event-list');

    dayEvents.forEach(ev => {
      const item = document.createElement('div');
      item.classList.add('event-item');
      item.innerHTML = `
                <div class="event-info">
                    <strong>${ev.title}</strong>
                    <span>${ev.time} • ${ev.type}</span>
                </div>
            `;
      listContainer.appendChild(item);
    });
    sidebar.appendChild(listContainer);
  } else {
    emptyState.style.display = 'block';
  }
}


let applications = JSON.parse(localStorage.getItem("applications")) || [];

applications.forEach(app => {
  console.log("Event:", app.company, app.deadline);
});

// Nav Buttons
document.getElementById('nextBtn').addEventListener('click', () => { nav++; loadCalendar(); });
document.getElementById('prevBtn').addEventListener('click', () => { nav--; loadCalendar(); });

loadCalendar();