// DOM Elements - Nav
const profileMenu = document.querySelector('.profile-menu');
const profileButton = document.querySelector('#profile-button');
const profileDropdown = document.querySelector('#profile-dropdown');
const profileInitials = document.querySelector('#profile-initials');
const logoutButton = document.querySelector('#logout-button');
const viewProfileButton = document.querySelector('#view-profile-button');
const manageMenu = document.querySelector('.manage-menu');
const manageButton = document.querySelector('#manage-button');
const manageDropdown = document.querySelector('#manage-dropdown');

// DOM Elements - Calendar
const calendarWeekRange = document.querySelector('#calendar-week-range');
const calendarUserName = document.querySelector('#calendar-user-name');
const calendarTotalHours = document.querySelector('#calendar-total-hours');
const calendarCapacityPercent = document.querySelector('#calendar-capacity-percent');
const calendarCapacityFill = document.querySelector('#calendar-capacity-fill');
const calendarPrevWeek = document.querySelector('#calendar-prev-week');
const calendarToday = document.querySelector('#calendar-today');
const calendarNextWeek = document.querySelector('#calendar-next-week');
const calendarRefresh = document.querySelector('#calendar-refresh');
const calendarTimeColumn = document.querySelector('#calendar-time-column');

// Auth Data
const token = localStorage.getItem('towerPsaToken');
const userName = localStorage.getItem('towerPsaUserName') || '';

// Calendar State
let currentDate = new Date();
currentDate.setHours(0, 0, 0, 0);

// Helpers
const redirectToLogin = () => { window.location.href = 'login.html'; };

const getWeekStart = (date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
};

const formatDayHeader = (date) => (
  date.toLocaleDateString('en-US', {
    weekday: 'short', month: 'numeric', day: 'numeric',
  })
);

const formatWeekRange = (startDate, endDate) => {
  const start = startDate.toLocaleDateString('en-US', {
    month: 'short', day: 'numeric',
  });
  const end = endDate.toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
  return `${start} - ${end}`;
};

const parseTimeInput = (raw) => {
  if (!raw) return null;
  const str = raw.toString().trim();
  if (!str) return null;

  const match = str.match(/^(\d{1,2}):?(\d{2})?\s*([ap]m)?$/i);
  if (!match) return null;

  let h = parseInt(match[1], 10);
  const m = match[2] ? parseInt(match[2], 10) : 0;
  const suffix = match[3]?.toLowerCase();

  if (h < 0 || h > 23 || m < 0 || m > 59) return null;

  if (suffix) {
    if (suffix === 'pm' && h !== 12) h += 12;
    if (suffix === 'am' && h === 12) h = 0;
  } else if (h < 7) {
    h += 12;
  }

  return { h: h % 24, m };
};

const formatHours = (h) => {
  const n = parseFloat(h);
  return Number.isNaN(n) ? '0h' : `${n}h`;
};

const getWeekDays = (startDate) => {
  const days = [];
  for (let i = 0; i < 7; i += 1) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    days.push(date);
  }
  return days;
};

const isSameDay = (date1, date2) => (
  date1.getFullYear() === date2.getFullYear()
    && date1.getMonth() === date2.getMonth()
    && date1.getDate() === date2.getDate()
);

// Parse YYYY-MM-DD string to local date object without timezone issues
const parseLocalDate = (dateString) => {
  if (!dateString) return null;
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date;
};

const toggleProfileDropdown = () => {
  const isHidden = profileDropdown.hidden;
  profileDropdown.hidden = !isHidden;
  if (profileButton) profileButton.setAttribute('aria-expanded', isHidden);
};

const toggleManageDropdown = () => {
  const isHidden = manageDropdown.hidden;
  manageDropdown.hidden = !isHidden;
  if (manageButton) manageButton.setAttribute('aria-expanded', isHidden);
};

const handleDocumentClick = (event) => {
  const profileCondition = profileButton && !profileButton.contains(event.target)
    && !profileDropdown.contains(event.target);
  if (profileCondition) {
    profileDropdown.hidden = true;
    if (profileButton) profileButton.setAttribute('aria-expanded', 'false');
  }
  const manageCondition = manageButton && !manageButton.contains(event.target)
    && !manageDropdown.contains(event.target);
  if (manageCondition) {
    manageDropdown.hidden = true;
    if (manageButton) manageButton.setAttribute('aria-expanded', 'false');
  }
};

const showProfileMenu = () => {
  if (userName) {
    if (profileMenu) profileMenu.hidden = false;
    if (manageMenu) manageMenu.hidden = false;
    if (profileInitials) {
      const initials = userName.split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
      profileInitials.textContent = initials;
    }
    if (calendarUserName) calendarUserName.textContent = userName;
  }
};

// Fetch user's time entries for the week
const fetchWeekTimeEntries = async (startDate) => {
  try {
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 6);

    const startISO = startDate.toISOString().split('T')[0];
    const endISO = endDate.toISOString().split('T')[0];

    const response = await fetch(`/api/time-entries?startDate=${startISO}&endDate=${endISO}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      if (response.status === 404) {
        // No entries found for this week
        return { entries: [], totalHours: 0 };
      }
      return { entries: [], totalHours: 0 };
    }

    const result = await response.json();
    return result;
  } catch (error) {
    return { entries: [], totalHours: 0 };
  }
};

// Render time column
const renderTimeColumn = () => {
  if (!calendarTimeColumn) return;
  calendarTimeColumn.innerHTML = '';

  for (let hour = 7; hour <= 18; hour += 1) {
    for (let min = 0; min < 60; min += 15) {
      const timeSlot = document.createElement('div');
      timeSlot.className = 'calendar-time-slot';

      if (min === 0) {
        // Show hour on the hour
        const period = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        timeSlot.textContent = `${displayHour}${period}`;
        timeSlot.classList.add('calendar-time-hour');
      } else {
        // Show nothing for 15, 30, 45 minute marks
        timeSlot.textContent = '';
      }

      calendarTimeColumn.appendChild(timeSlot);
    }
  }
};

// Render day column with time entries
const renderDayColumn = (dayIndex, entries, dayDate) => {
  const dayColId = `day-col-${dayIndex}`;
  const dayCol = document.querySelector(`#${dayColId}`);
  if (!dayCol) return;

  dayCol.innerHTML = '';

  // Create time slots for this day (4 per hour = 15 min increments)
  for (let hour = 7; hour <= 18; hour += 1) {
    for (let min = 0; min < 60; min += 15) {
      const slotContainer = document.createElement('div');
      slotContainer.className = 'calendar-time-slot';

      // Find entries that overlap with this 15-min slot
      const slotEntries = entries.filter((entry) => {
        const entryDate = parseLocalDate(entry.date);
        if (!entryDate || !isSameDay(entryDate, dayDate)) return false;

        if (!entry.startTime || !entry.endTime) {
          // Skip entries without valid times
          return false;
        }

        const start = parseTimeInput(entry.startTime);
        const end = parseTimeInput(entry.endTime);
        if (!start || !end) return false;

        const startMins = start.h * 60 + start.m;
        const endMins = end.h * 60 + end.m;
        const slotStart = hour * 60 + min;
        const slotEnd = slotStart + 15;

        // Handle midnight crossing
        if (endMins <= startMins) {
          return !(endMins <= slotStart && startMins >= slotEnd);
        }

        return !(endMins <= slotStart || startMins >= slotEnd);
      });

      slotEntries.forEach((entry, entryIndex) => {
        const entryEl = document.createElement('div');
        entryEl.className = 'calendar-entry';
        entryEl.style.backgroundColor = entry.billable ? '#3182ce' : '#718096';
        entryEl.style.cursor = 'pointer';

        // If multiple entries in this slot, position them side by side
        if (slotEntries.length > 1) {
          const entryCount = slotEntries.length;
          const gapPercent = 1; // 1% gap between entries
          const availableWidth = 100 - (gapPercent * (entryCount - 1));
          const entryWidth = availableWidth / entryCount;
          const entryLeftPercent = (entryIndex * (entryWidth + gapPercent));
          entryEl.style.position = 'absolute';
          entryEl.style.top = '0';
          entryEl.style.left = `${entryLeftPercent}%`;
          entryEl.style.width = `${entryWidth}%`;
          entryEl.style.right = 'auto';
          entryEl.style.padding = '0.2rem'; // Reduce padding for smaller entries
          entryEl.style.fontSize = '0.6rem'; // Reduce font size for readability
        }

        const title = document.createElement('div');
        title.className = 'calendar-entry-title';
        title.textContent = entry.ticketTitle || `#${entry.ticketId}`;

        const notes = document.createElement('div');
        notes.className = 'calendar-entry-notes';
        notes.textContent = entry.notes || formatHours(entry.hours);

        entryEl.appendChild(title);
        entryEl.appendChild(notes);

        entryEl.addEventListener('click', () => {
          window.location.href = `ticket-detail.html?id=${entry.ticketId}`;
        });

        slotContainer.appendChild(entryEl);
      });

      dayCol.appendChild(slotContainer);
    }
  }
};

// Render calendar for current week
const renderCalendar = async () => {
  const weekStart = getWeekStart(currentDate);
  const weekDays = getWeekDays(weekStart);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);

  // Update header
  if (calendarWeekRange) {
    calendarWeekRange.textContent = formatWeekRange(weekStart, weekEnd);
  }

  // Update day headers
  weekDays.forEach((date, index) => {
    const dayHeader = document.querySelector(`#day-${index}`);
    if (dayHeader) {
      dayHeader.innerHTML = `<div class="day-name">${formatDayHeader(date)}</div>`;
      const isToday = isSameDay(date, new Date());
      dayHeader.classList.toggle('calendar-today', isToday);
    }
  });

  // Fetch time entries
  const { entries, totalHours } = await fetchWeekTimeEntries(weekStart);

  // Update capacity
  if (calendarTotalHours) calendarTotalHours.textContent = `${totalHours}h`;
  if (calendarCapacityPercent) {
    const percent = Math.min(Math.round((totalHours / 40) * 100), 100);
    calendarCapacityPercent.textContent = `${percent}%`;
  }
  if (calendarCapacityFill) {
    const percent = Math.min((totalHours / 40) * 100, 100);
    calendarCapacityFill.style.width = `${percent}%`;
  }

  // Render days
  weekDays.forEach((date, index) => {
    renderDayColumn(index, entries, date);
  });
};

// Initialize
if (!token) redirectToLogin();

// Event Listeners
if (logoutButton) {
  logoutButton.addEventListener('click', () => {
    localStorage.removeItem('towerPsaToken');
    redirectToLogin();
  });
}
if (viewProfileButton) {
  viewProfileButton.addEventListener('click', () => { window.location.href = 'profile.html'; });
}
if (profileButton) profileButton.addEventListener('click', toggleProfileDropdown);
if (manageButton) manageButton.addEventListener('click', toggleManageDropdown);

if (calendarPrevWeek) {
  calendarPrevWeek.addEventListener('click', () => {
    currentDate.setDate(currentDate.getDate() - 7);
    renderCalendar();
  });
}

if (calendarToday) {
  calendarToday.addEventListener('click', () => {
    currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    renderCalendar();
  });
}

if (calendarNextWeek) {
  calendarNextWeek.addEventListener('click', () => {
    currentDate.setDate(currentDate.getDate() + 7);
    renderCalendar();
  });
}

if (calendarRefresh) {
  calendarRefresh.addEventListener('click', () => {
    renderCalendar();
  });
}

// Also refresh when the calendar page is navigated to (for single-page app)
if (window.location.href.includes('calendar.html')) {
  window.addEventListener('focus', () => {
    renderCalendar();
  });
}

document.addEventListener('click', handleDocumentClick);
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    profileDropdown.hidden = true;
    manageDropdown.hidden = true;
  }
});

// Auto-refresh calendar when page regains focus
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    renderCalendar();
  }
});

// Boot
showProfileMenu();
renderTimeColumn();
renderCalendar();
