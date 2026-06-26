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

// DOM Elements - Ticket Detail
const ticketDetailShell = document.querySelector('#ticket-detail-shell');
const ticketLoadError = document.querySelector('#ticket-load-error');
const detailNumber = document.querySelector('#detail-number');
const detailTitle = document.querySelector('#detail-title');
const detailStatusBadge = document.querySelector('#detail-status-badge');
const detailPriorityBadge = document.querySelector('#detail-priority-badge');
const detailDescription = document.querySelector('#detail-description');
const detailCustomer = document.querySelector('#detail-customer');
const detailAssigned = document.querySelector('#detail-assigned');
const detailStatusSelect = document.querySelector('#detail-status-select');
const detailPrioritySelect = document.querySelector('#detail-priority-select');
const detailSlaPolicy = document.querySelector('#detail-sla-policy');
const detailSlaState = document.querySelector('#detail-sla-state');
const detailSlaResponseDue = document.querySelector('#detail-sla-response-due');
const detailSlaResolutionDue = document.querySelector('#detail-sla-resolution-due');
const detailCreated = document.querySelector('#detail-created');
const detailUpdated = document.querySelector('#detail-updated');
const detailTotalHours = document.querySelector('#detail-total-hours');
const timeEntriesBody = document.querySelector('#time-entries-body');
const timeEntryFilterButtons = document.querySelectorAll('[data-time-filter]');
const ticketAttachmentForm = document.querySelector('#ticket-attachment-form');
const ticketAttachmentsInput = document.querySelector('#ticket-attachments-input');
const ticketAttachmentError = document.querySelector('#ticket-attachment-error');
const ticketAttachmentsList = document.querySelector('#ticket-attachments-list');
const attachmentDeleteModal = document.querySelector('#attachment-delete-modal');
const closeAttachmentDeleteModalButton = document.querySelector('#close-attachment-delete-modal');
const attachmentDeleteCancelButton = document.querySelector('#attachment-delete-cancel');
const attachmentDeleteConfirmButton = document.querySelector('#attachment-delete-confirm');
const attachmentDeleteFileName = document.querySelector('#attachment-delete-file-name');
const attachmentDeleteError = document.querySelector('#attachment-delete-error');
const viewTicketHistoryButton = document.querySelector('#view-ticket-history-button');
const ticketHistoryModal = document.querySelector('#ticket-history-modal');
const closeTicketHistoryModalButton = document.querySelector('#close-ticket-history-modal');
const ticketHistoryList = document.querySelector('#ticket-history-list');
const ticketHistoryFilterButtons = document.querySelectorAll('[data-history-filter]');

// DOM Elements - Log Time Modal
const addTimeButton = document.querySelector('#add-time-button');
const logTimeModal = document.querySelector('#log-time-modal');
const closeLogTimeModal = document.querySelector('#close-log-time-modal');
const logTimeForm = document.querySelector('#log-time-form');
const logTimeError = document.querySelector('#log-time-error');
const timeStartInput = document.querySelector('#time-start');
const timeEndInput = document.querySelector('#time-end');
const timeDurationDisplay = document.querySelector('#time-duration');
const timeHoursHidden = document.querySelector('#time-hours');

// DOM Elements - Edit Time Entry Modal
const editEntryModal = document.querySelector('#edit-entry-modal');
const closeEditEntryButton = document.querySelector('#close-edit-entry-modal');
const editEntryForm = document.querySelector('#edit-entry-form');
const editEntryDate = document.querySelector('#edit-entry-date');
const editEntryStart = document.querySelector('#edit-entry-start');
const editEntryEnd = document.querySelector('#edit-entry-end');
const editEntryHours = document.querySelector('#edit-entry-hours');
const editEntryNoteVisibility = document.querySelector('#edit-entry-note-visibility');
const editEntryNotes = document.querySelector('#edit-entry-notes');
const editEntryError = document.querySelector('#edit-entry-error');
let editingEntryId = null;

// DOM Elements - View Time Entry Modal
const viewEntryModal = document.querySelector('#view-entry-modal');
const closeViewEntryButton = document.querySelector('#close-view-entry-modal');
const viewEntryDate = document.querySelector('#view-entry-date');
const viewEntryStart = document.querySelector('#view-entry-start');
const viewEntryEnd = document.querySelector('#view-entry-end');
const viewEntryHours = document.querySelector('#view-entry-hours');
const viewEntryUser = document.querySelector('#view-entry-user');
const viewEntryBillable = document.querySelector('#view-entry-billable');
const viewEntryNotes = document.querySelector('#view-entry-notes');
const viewEntryEditButton = document.querySelector('#view-entry-edit-button');
let viewingEntry = null;

// DOM Elements - Edit Ticket Modal
const editTicketButton = document.querySelector('#edit-ticket-button');
const editTicketModal = document.querySelector('#edit-ticket-modal');
const closeEditTicketButton = document.querySelector('#close-edit-ticket-modal');
const editTicketForm = document.querySelector('#edit-ticket-form');
const editTicketTitle = document.querySelector('#edit-ticket-title');
const editTicketDescription = document.querySelector('#edit-ticket-description');
const editTicketStatus = document.querySelector('#edit-ticket-status');
const editTicketPriority = document.querySelector('#edit-ticket-priority');
const editTicketCustomer = document.querySelector('#edit-ticket-customer');
const editTicketAssigned = document.querySelector('#edit-ticket-assigned');
const editTicketError = document.querySelector('#edit-ticket-error');
let currentTicket = null;
let currentTimeEntries = [];
let currentTotalHours = 0;
let currentTimeEntryFilter = 'all';
let currentHistoryEntries = [];
let currentHistoryFilter = 'all';
let pendingDeleteAttachment = null;

// Auth Data
const token = localStorage.getItem('towerPsaToken');
const userName = localStorage.getItem('towerPsaUserName') || '';
const userRole = localStorage.getItem('towerPsaUserRole') || '';

// Get ticket ID from URL
const params = new URLSearchParams(window.location.search);
const ticketId = params.get('id');
const entryIdFromUrl = params.get('entryId');

const ticketApiUrl = `/api/tickets/${ticketId}`;
const timeEntriesApiUrl = `/api/tickets/${ticketId}/time-entries`;
const ticketActivityApiUrl = `/api/tickets/${ticketId}/activity`;

// Helpers
const redirectToLogin = () => { window.location.href = 'login.html'; };

const statusBadge = (status) => {
  const key = (status || 'new').toLowerCase().replace(/\s+/g, '-');
  return `<span class="badge badge-status-${key}">${status || 'New'}</span>`;
};

const priorityBadge = (priority) => {
  const key = (priority || 'medium').toLowerCase();
  return `<span class="badge badge-priority-${key}">${priority || 'Medium'}</span>`;
};

const slaStateBadge = (state) => {
  const normalized = (state || 'none').toLowerCase();
  const labels = {
    none: 'No SLA',
    on_track: 'On Track',
    at_risk: 'At Risk',
    response_breached: 'Response Breached',
    resolution_breached: 'Resolution Breached',
    breached: 'Response/Resolution Breached',
    met: 'Met',
  };

  return `<span class="badge badge-sla-${normalized}">${labels[normalized] || 'No SLA'}</span>`;
};

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
};

const formatDateTime = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
  });
};

const escapeHtml = (value) => value
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

const formatHours = (h) => {
  const n = parseFloat(h);
  return Number.isNaN(n) ? '0h' : `${n}h`;
};

// Parse loose time input like "900", "1115", "9:30", "14:00" → { h, m } or null
const getCurrentPeriod = () => (new Date().getHours() < 12 ? 'AM' : 'PM');

// Parse loose input: "900", "1115", "9:30", "930pm", "11:30 AM" → { h, m } (24h) or null
const parseTimeInput = (raw) => {
  const upper = raw.trim().toUpperCase().replace(/\s+/g, '');

  let explicitPeriod = null;
  let digits = upper;
  if (upper.endsWith('AM')) {
    explicitPeriod = 'AM';
    digits = upper.slice(0, -2);
  } else if (upper.endsWith('PM')) {
    explicitPeriod = 'PM';
    digits = upper.slice(0, -2);
  }

  const cleaned = digits.replace(':', '');
  if (!cleaned || !/^\d{1,4}$/.test(cleaned)) return null;

  let h;
  let m;
  if (cleaned.length <= 2) {
    h = parseInt(cleaned, 10);
    m = 0;
  } else {
    h = parseInt(cleaned.slice(0, -2), 10);
    m = parseInt(cleaned.slice(-2), 10);
  }

  if (m > 59) return null;

  // Determine AM/PM: explicit > unambiguous 24h > current system period
  let period;
  if (explicitPeriod) {
    period = explicitPeriod;
  } else if (h >= 13) {
    period = 'PM';
  } else if (h === 0) {
    period = 'AM';
  } else {
    period = getCurrentPeriod();
  }

  // Convert to 24h
  if (period === 'PM' && h < 12) h += 12;
  if (period === 'AM' && h === 12) h = 0;

  if (h > 23) return null;
  return { h, m };
};

const formatTime = ({ h, m }) => {
  const period = h < 12 ? 'AM' : 'PM';
  const displayH = h % 12 || 12;
  return `${displayH}:${String(m).padStart(2, '0')} ${period}`;
};

const updateDuration = () => {
  const startRaw = timeStartInput ? timeStartInput.value : '';
  const endRaw = timeEndInput ? timeEndInput.value : '';
  const start = parseTimeInput(startRaw);
  let end = parseTimeInput(endRaw);

  if (!start || !end) {
    if (timeDurationDisplay) timeDurationDisplay.textContent = '0.0h';
    if (timeHoursHidden) timeHoursHidden.value = '';
    return;
  }

  const startMins = start.h * 60 + start.m;
  let endMins = end.h * 60 + end.m;

  // If end is before or equal to start, try strategies:
  // 1. Flip by 12h (e.g. 12:00 after 11:45 AM → assume 12:00 PM)
  // 2. If still doesn't work, assume end is next day (crosses midnight)
  if (endMins <= startMins) {
    const flippedH = (end.h + 12) % 24;
    const flippedMins = flippedH * 60 + end.m;
    if (flippedMins > startMins) {
      end = { h: flippedH, m: end.m };
      endMins = flippedMins;
      if (timeEndInput) timeEndInput.value = formatTime(end);
    } else {
      // Assume end time is on the next day (crosses midnight)
      endMins += 24 * 60;
    }
  }

  const diffMins = endMins - startMins;

  if (diffMins <= 0) {
    if (timeDurationDisplay) timeDurationDisplay.textContent = 'End time must be after start time';
    if (timeHoursHidden) timeHoursHidden.value = '';
    return;
  }

  const hours = Math.round((diffMins / 60) * 100) / 100;
  if (timeDurationDisplay) timeDurationDisplay.textContent = `${hours}h`;
  if (timeHoursHidden) timeHoursHidden.value = String(hours);
};

const handleTimeBlur = (event) => {
  const parsed = parseTimeInput(event.target.value);
  if (parsed) {
    event.target.value = formatTime(parsed);
  }
  updateDuration();
};

const setLogTimeError = (msg) => {
  if (logTimeError) logTimeError.textContent = msg;
};

const setTicketAttachmentError = (message) => {
  if (ticketAttachmentError) ticketAttachmentError.textContent = message;
};

const setAttachmentDeleteError = (message) => {
  if (attachmentDeleteError) attachmentDeleteError.textContent = message;
};

const filterHistoryEntries = (entries, filter) => {
  if (filter === 'system') {
    return entries.filter((entry) => entry.entryType === 'system');
  }

  if (filter === 'customer') {
    return entries.filter((entry) => entry.entryType !== 'system' && entry.visibility === 'customer');
  }

  if (filter === 'internal') {
    return entries.filter((entry) => entry.entryType !== 'system' && entry.visibility !== 'customer');
  }

  return entries;
};

function renderTicketHistory(activity) {
  if (!ticketHistoryList) return;

  currentHistoryEntries = activity;
  const filteredActivity = filterHistoryEntries(activity, currentHistoryFilter);

  if (!filteredActivity.length) {
    ticketHistoryList.innerHTML = '<p class="ticket-activity-empty">No activity has been recorded yet.</p>';
    return;
  }

  ticketHistoryList.innerHTML = filteredActivity.map((entry) => {
    const author = escapeHtml(entry.userName || 'System');
    let typeLabel = 'Internal Note';
    if (entry.entryType === 'system') {
      typeLabel = 'System';
    } else if (entry.visibility === 'customer') {
      typeLabel = 'Customer Note';
    }
    const message = escapeHtml(entry.message || '');
    const attachments = (entry.attachments || []).map((attachment) => `
      <li>
        <a href="${attachment.filePath}" target="_blank" rel="noopener noreferrer">${escapeHtml(attachment.fileName)}</a>
        <button
          type="button"
          class="ticket-attachment-delete"
          data-action="delete-attachment"
          data-attachment-id="${attachment.id}"
          data-attachment-name="${encodeURIComponent(attachment.fileName)}"
          aria-label="Delete ${escapeHtml(attachment.fileName)}"
          title="Delete attachment"
        >
          ×
        </button>
      </li>
    `).join('');

    return `
      <article class="ticket-activity-item ${entry.entryType === 'system' ? 'system' : 'note'}">
        <div class="ticket-activity-meta">
          <span class="ticket-activity-author">${author}</span>
          <span class="ticket-activity-type">${typeLabel}</span>
          <time class="ticket-activity-time">${formatDateTime(entry.createdAt)}</time>
        </div>
        <p class="ticket-activity-message">${message || '—'}</p>
        ${attachments ? `<ul class="ticket-activity-attachments">${attachments}</ul>` : ''}
      </article>
    `;
  }).join('');
}

const setHistoryFilter = (filter) => {
  currentHistoryFilter = filter;
  ticketHistoryFilterButtons.forEach((button) => {
    button.classList.toggle('active', button.dataset.historyFilter === filter);
  });
  renderTicketHistory(currentHistoryEntries);
};

const renderTicketAttachments = (activity) => {
  if (!ticketAttachmentsList) return;

  const attachments = activity.flatMap((entry) => (entry.attachments || []).map((attachment) => ({
    ...attachment,
    activityCreatedAt: entry.createdAt,
    activityUserName: entry.userName,
  })));

  if (!attachments.length) {
    ticketAttachmentsList.innerHTML = '<p class="ticket-activity-empty">No attachments added yet.</p>';
    return;
  }

  ticketAttachmentsList.innerHTML = attachments.map((attachment) => {
    const addedBy = escapeHtml(attachment.activityUserName || 'System');

    return `
      <article class="ticket-activity-item note">
        <div class="ticket-activity-meta">
          <span class="ticket-activity-author">${addedBy}</span>
          <span class="ticket-activity-type">Attachment</span>
          <time class="ticket-activity-time">${formatDateTime(attachment.activityCreatedAt)}</time>
        </div>
        <ul class="ticket-activity-attachments">
          <li>
            <a href="${attachment.filePath}" target="_blank" rel="noopener noreferrer">${escapeHtml(attachment.fileName)}</a>
            <button
              type="button"
              class="ticket-attachment-delete"
              data-action="delete-attachment"
              data-attachment-id="${attachment.id}"
              data-attachment-name="${encodeURIComponent(attachment.fileName)}"
              aria-label="Delete ${escapeHtml(attachment.fileName)}"
              title="Delete attachment"
            >
              ×
            </button>
          </li>
        </ul>
      </article>
    `;
  }).join('');
};

const fetchActivityEntries = async () => {
  try {
    const response = await fetch(ticketActivityApiUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) return [];
    const result = await response.json();
    return result.activity || [];
  } catch {
    return [];
  }
};

const fetchTicketActivity = async () => {
  const activity = await fetchActivityEntries();
  renderTicketAttachments(activity);
};

const fetchTicketHistory = async () => {
  const activity = await fetchActivityEntries();
  renderTicketHistory(activity);
};

const refreshTicketHistoryIfVisible = () => {
  if (!ticketHistoryModal || ticketHistoryModal.hidden) {
    return;
  }

  fetchTicketHistory();
};

const openTicketHistoryModal = () => {
  if (!ticketHistoryModal) return;

  setHistoryFilter('all');
  ticketHistoryModal.hidden = false;
  if (ticketHistoryList) {
    ticketHistoryList.innerHTML = '<p class="ticket-activity-empty">Loading activity history...</p>';
  }
  fetchTicketHistory();
};

const closeTicketHistoryModal = () => {
  if (ticketHistoryModal) ticketHistoryModal.hidden = true;
};

// Nav
const showProfileMenu = () => {
  if (profileMenu) profileMenu.hidden = false;

  if (profileInitials) {
    const initials = userName
      .split(' ')
      .filter(Boolean)
      .map((part) => part[0].toUpperCase())
      .slice(0, 2)
      .join('');
    profileInitials.textContent = initials || 'U';
  }

  const profileFullName = document.querySelector('#profile-fullname');
  if (profileFullName) profileFullName.textContent = userName || 'User';

  if (userRole === 'admin' && manageMenu) {
    manageMenu.hidden = false;
    manageMenu.style.display = 'flex';
  } else if (manageMenu) {
    manageMenu.hidden = true;
    manageMenu.style.display = 'none';
  }
};

const toggleProfileDropdown = () => {
  if (!profileDropdown || !profileButton) return;
  const isOpen = !profileDropdown.hidden;
  profileDropdown.hidden = isOpen;
  profileButton.setAttribute('aria-expanded', String(!isOpen));
};

const toggleManageDropdown = () => {
  if (!manageDropdown || !manageButton) return;
  const isOpen = !manageDropdown.hidden;
  manageDropdown.hidden = isOpen;
  manageButton.setAttribute('aria-expanded', String(!isOpen));
};

const closeProfileDropdown = () => {
  if (!profileDropdown || !profileButton) return;
  profileDropdown.hidden = true;
  profileButton.setAttribute('aria-expanded', 'false');
};

const closeManageDropdown = () => {
  if (!manageDropdown || !manageButton) return;
  manageDropdown.hidden = true;
  manageButton.setAttribute('aria-expanded', 'false');
};

const handleDocumentClick = (event) => {
  if (profileMenu && profileMenu.contains(event.target)) return;
  closeProfileDropdown();
  if (manageMenu && manageMenu.contains(event.target)) return;
  closeManageDropdown();
};

// Log Time Modal
const openLogTimeModal = () => {
  if (!logTimeModal || !logTimeForm) return;
  logTimeForm.reset();
  setLogTimeError('');
  // Default date to today
  const dateInput = logTimeForm.querySelector('#time-date');
  if (dateInput) {
    const [today] = new Date().toISOString().split('T');
    dateInput.value = today;
  }
  const visibilityField = logTimeForm.querySelector('#time-note-visibility');
  if (visibilityField) {
    visibilityField.value = currentTimeEntryFilter === 'internal' ? 'internal' : 'customer';
  }
  logTimeModal.hidden = false;
};

const closeModal = () => {
  if (logTimeModal) logTimeModal.hidden = true;
  setLogTimeError('');
};

const setEditEntryError = (message) => {
  if (editEntryError) editEntryError.textContent = message;
};

const updateEditDuration = () => {
  const startRaw = editEntryStart ? editEntryStart.value : '';
  const endRaw = editEntryEnd ? editEntryEnd.value : '';
  const start = parseTimeInput(startRaw);
  let end = parseTimeInput(endRaw);

  if (!start || !end) {
    if (editEntryHours) editEntryHours.textContent = '—';
    return;
  }

  const startMins = start.h * 60 + start.m;
  let endMins = end.h * 60 + end.m;

  if (endMins <= startMins) {
    const flippedH = (end.h + 12) % 24;
    const flippedMins = flippedH * 60 + end.m;
    if (flippedMins > startMins) {
      end = { h: flippedH, m: end.m };
      endMins = flippedMins;
      if (editEntryEnd) editEntryEnd.value = formatTime(end);
    } else {
      endMins += 24 * 60;
    }
  }

  const diffMins = endMins - startMins;

  if (diffMins <= 0) {
    if (editEntryHours) editEntryHours.textContent = '—';
    return;
  }

  const hours = Math.round((diffMins / 60) * 100) / 100;
  if (editEntryHours) editEntryHours.textContent = `${hours}h`;
};

const handleEditTimeBlur = (event) => {
  const parsed = parseTimeInput(event.target.value);
  if (parsed) {
    event.target.value = formatTime(parsed);
  }
  updateEditDuration();
};

const openEditEntryModal = (entry) => {
  if (!editEntryModal || !editEntryForm) return;
  editingEntryId = entry.id;
  editEntryForm.reset();
  setEditEntryError('');

  if (editEntryDate) editEntryDate.value = entry.date;

  if (editEntryStart) {
    if (entry.startTime) {
      const parsedStart = parseTimeInput(entry.startTime);
      editEntryStart.value = parsedStart ? formatTime(parsedStart) : (entry.startTime || '');
    } else {
      editEntryStart.value = '';
    }
  }

  if (editEntryEnd) {
    if (entry.endTime) {
      const parsedEnd = parseTimeInput(entry.endTime);
      editEntryEnd.value = parsedEnd ? formatTime(parsedEnd) : (entry.endTime || '');
    } else {
      editEntryEnd.value = '';
    }
  }

  if (editEntryHours) editEntryHours.textContent = formatHours(entry.hours);
  if (editEntryNoteVisibility) editEntryNoteVisibility.value = entry.noteVisibility || 'internal';
  if (editEntryNotes) editEntryNotes.value = entry.notes || '';

  if (entry.billable) {
    const billableYesRadio = editEntryForm.querySelector('#edit-billableYes');
    if (billableYesRadio) billableYesRadio.checked = true;
  } else {
    const billableNoRadio = editEntryForm.querySelector('#edit-billableNo');
    if (billableNoRadio) billableNoRadio.checked = true;
  }

  editEntryModal.hidden = false;
};

const closeEditEntryModal = () => {
  if (editEntryModal) editEntryModal.hidden = true;
  setEditEntryError('');
  editingEntryId = null;
};

const openViewEntryModal = (entry) => {
  viewingEntry = entry;
  if (viewEntryDate) viewEntryDate.textContent = formatDate(entry.date);
  if (viewEntryStart) viewEntryStart.textContent = entry.startTime ? formatTime(parseTimeInput(entry.startTime)) : '—';
  if (viewEntryEnd) viewEntryEnd.textContent = entry.endTime ? formatTime(parseTimeInput(entry.endTime)) : '—';
  if (viewEntryHours) viewEntryHours.textContent = formatHours(entry.hours);
  if (viewEntryUser) viewEntryUser.textContent = entry.userName;
  if (viewEntryBillable) viewEntryBillable.textContent = entry.billable ? 'Billable' : 'Non-billable';
  if (viewEntryNotes) viewEntryNotes.textContent = entry.notes || '—';
  if (viewEntryModal) viewEntryModal.hidden = false;
};

const closeViewEntryModal = () => {
  if (viewEntryModal) viewEntryModal.hidden = true;
  viewingEntry = null;
};

const handleEditEntrySubmit = async (event) => {
  event.preventDefault();
  if (!editingEntryId) return;

  const formData = new FormData(editEntryForm);
  const date = formData.get('date');
  const noteVisibility = formData.get('noteVisibility')?.toString() === 'customer' ? 'customer' : 'internal';
  const notes = formData.get('notes');
  const billable = formData.get('billable') === 'yes';
  const startTime = formData.get('startTime')?.toString().trim() || null;
  const endTime = formData.get('endTime')?.toString().trim() || null;

  if (!date) {
    setEditEntryError('Date is required.');
    return;
  }

  let hours;
  if (startTime && endTime) {
    const start = parseTimeInput(startTime);
    const end = parseTimeInput(endTime);

    if (!start || !end) {
      setEditEntryError('Invalid start or end time format.');
      return;
    }

    const startMins = start.h * 60 + start.m;
    let endMins = end.h * 60 + end.m;

    if (endMins <= startMins) {
      const flippedH = (end.h + 12) % 24;
      const flippedMins = flippedH * 60 + end.m;
      if (flippedMins > startMins) {
        endMins = flippedMins;
      } else {
        endMins += 24 * 60;
      }
    }

    const diffMins = endMins - startMins;
    if (diffMins <= 0) {
      setEditEntryError('End time must be after start time.');
      return;
    }

    hours = Math.round((diffMins / 60) * 100) / 100;
  }

  try {
    const body = {
      date,
      billable,
      noteVisibility,
      notes,
      startTime: startTime || null,
      endTime: endTime || null,
    };

    if (hours !== undefined) {
      body.hours = hours;
    }

    const response = await fetch(`${timeEntriesApiUrl}/${editingEntryId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    const result = await response.json();
    if (!response.ok) {
      setEditEntryError(result.error || 'Unable to update time entry.');
      return;
    }

    closeEditEntryModal();
    // eslint-disable-next-line no-use-before-define
    fetchTimeEntries();
    fetchTicketActivity();
    refreshTicketHistoryIfVisible();
  } catch {
    setEditEntryError('Unable to reach the server.');
  }
};

// Render time entries
const renderTimeEntries = (entries, totalHours) => {
  currentTimeEntries = entries;
  currentTotalHours = totalHours;

  const filteredEntries = currentTimeEntryFilter === 'all'
    ? entries
    : entries.filter((entry) => entry.noteVisibility === currentTimeEntryFilter);

  const filteredTotalHours = filteredEntries.reduce((sum, entry) => sum + (entry.hours || 0), 0);

  if (detailTotalHours) {
    detailTotalHours.textContent = formatHours(currentTimeEntryFilter === 'all' ? totalHours : filteredTotalHours);
  }

  if (!timeEntriesBody) return;

  if (!filteredEntries.length) {
    timeEntriesBody.innerHTML = `
      <tr>
        <td colspan="7" class="time-entries-empty">No time entries match this filter.</td>
      </tr>`;
    return;
  }

  timeEntriesBody.innerHTML = filteredEntries.map((entry) => `
    <tr class="time-entry-row" data-entry-json='${JSON.stringify(entry)}'>
      <td>${formatDate(entry.date)}</td>
      <td>${entry.userName}</td>
      <td><strong>${formatHours(entry.hours)}</strong></td>
      <td>
        <span class="badge ${entry.billable ? 'badge-billable' : 'badge-non-billable'}">
          ${entry.billable ? 'Billable' : 'Non-billable'}
        </span>
      </td>
      <td>${entry.noteVisibility === 'customer' ? 'Customer' : 'Internal'}</td>
      <td class="time-entry-notes">
        ${entry.notes
    ? `<span class="time-entry-notes-text" title="${escapeHtml(entry.notes)}">${escapeHtml(entry.notes)}</span>`
    : '<span class="time-entry-notes-empty">—</span>'}
      </td>
      <td>
        <button
          type="button"
          class="button-icon"
          data-action="edit-entry"
          data-entry-id="${entry.id}"
          aria-label="Edit time entry"
        >✎</button>
      </td>
    </tr>
  `).join('');

  // Open specific entry if entryId is in URL
  if (entryIdFromUrl && currentTimeEntries.length) {
    const entry = currentTimeEntries.find((e) => e.id === Number(entryIdFromUrl));
    if (entry) {
      // Use setTimeout to ensure openViewEntryModal is available
      setTimeout(() => openViewEntryModal(entry), 100);
    }
  }
};

const setTimeEntryFilter = (filter) => {
  currentTimeEntryFilter = filter;
  timeEntryFilterButtons.forEach((button) => {
    button.classList.toggle('active', button.dataset.timeFilter === filter);
  });
  renderTimeEntries(currentTimeEntries, currentTotalHours);
};

// Fetch time entries
const fetchTimeEntries = async () => {
  try {
    const response = await fetch(timeEntriesApiUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) return;
    const result = await response.json();
    renderTimeEntries(result.entries, result.totalHours);
  } catch {
    // silently fail — ticket data still shows
  }
};

const handleTicketAttachmentSubmit = async (event) => {
  event.preventDefault();
  if (!ticketAttachmentForm) return;

  setTicketAttachmentError('');
  const files = Array.from(ticketAttachmentsInput?.files || []);

  if (!files.length) {
    setTicketAttachmentError('Select at least one attachment.');
    return;
  }

  try {
    const payload = new FormData();
    payload.append('visibility', 'internal');
    files.forEach((file) => {
      payload.append('attachments', file);
    });

    const response = await fetch(ticketActivityApiUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: payload,
    });

    const result = await response.json();
    if (!response.ok) {
      setTicketAttachmentError(result.error || 'Unable to upload attachments.');
      return;
    }

    if (ticketAttachmentsInput) ticketAttachmentsInput.value = '';
    fetchTicketActivity();
    refreshTicketHistoryIfVisible();
  } catch {
    setTicketAttachmentError('Unable to reach the server.');
  }
};

const openAttachmentDeleteModal = (attachmentId, fileName) => {
  pendingDeleteAttachment = {
    id: attachmentId,
    fileName,
  };

  if (attachmentDeleteFileName) {
    attachmentDeleteFileName.textContent = fileName;
  }

  setAttachmentDeleteError('');
  if (attachmentDeleteModal) attachmentDeleteModal.hidden = false;
};

const closeAttachmentDeleteModal = () => {
  if (attachmentDeleteModal) attachmentDeleteModal.hidden = true;
  setAttachmentDeleteError('');
  pendingDeleteAttachment = null;
};

const handleTicketAttachmentsClick = (event) => {
  const deleteButton = event.target.closest('[data-action="delete-attachment"]');
  if (!deleteButton) return;

  const attachmentId = Number(deleteButton.dataset.attachmentId);
  const attachmentNameEncoded = deleteButton.dataset.attachmentName || '';
  const attachmentName = attachmentNameEncoded
    ? decodeURIComponent(attachmentNameEncoded)
    : 'this attachment';

  if (!Number.isInteger(attachmentId) || attachmentId <= 0) {
    setTicketAttachmentError('Unable to delete attachment. Invalid attachment id.');
    return;
  }

  openAttachmentDeleteModal(attachmentId, attachmentName);
};

const confirmDeleteAttachment = async () => {
  if (!pendingDeleteAttachment?.id) return;

  setAttachmentDeleteError('');
  setTicketAttachmentError('');

  try {
    const response = await fetch(`${ticketActivityApiUrl}/attachments/${pendingDeleteAttachment.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      const result = response.status === 204 ? {} : await response.json();
      setAttachmentDeleteError(result.error || 'Unable to delete attachment.');
      return;
    }

    closeAttachmentDeleteModal();
    fetchTicketActivity();
    refreshTicketHistoryIfVisible();
  } catch {
    setAttachmentDeleteError('Unable to reach the server.');
  }
};

// Render ticket
const renderTicket = (ticket) => {
  currentTicket = ticket;
  document.title = `#${ticket.id} · ${ticket.title} · TowerPSA`;

  if (detailNumber) detailNumber.textContent = `#${ticket.id}`;
  if (detailTitle) detailTitle.textContent = ticket.title;
  if (detailStatusBadge) detailStatusBadge.innerHTML = statusBadge(ticket.status);
  if (detailPriorityBadge) detailPriorityBadge.innerHTML = priorityBadge(ticket.priority);
  if (detailDescription) {
    detailDescription.textContent = ticket.description || 'No description provided.';
  }
  if (detailCustomer) detailCustomer.textContent = ticket.customer;
  if (detailAssigned) detailAssigned.textContent = ticket.assignedTo || '—';
  if (detailStatusSelect) detailStatusSelect.value = ticket.status || 'Open';
  if (detailPrioritySelect) detailPrioritySelect.value = ticket.priority || 'Medium';
  if (detailSlaPolicy) detailSlaPolicy.textContent = ticket.slaPolicyName || 'None';
  if (detailSlaState) detailSlaState.innerHTML = slaStateBadge(ticket.slaState);
  if (detailSlaResponseDue) {
    detailSlaResponseDue.textContent = formatDateTime(ticket.slaResponseDueAt);
  }
  if (detailSlaResolutionDue) {
    detailSlaResolutionDue.textContent = formatDateTime(ticket.slaResolutionDueAt);
  }
  if (detailCreated) detailCreated.textContent = formatDate(ticket.createdAt);
  if (detailUpdated) detailUpdated.textContent = formatDate(ticket.updatedAt);

  if (ticketDetailShell) ticketDetailShell.hidden = false;
};

const handleStatusOrPriorityChange = async (field, value) => {
  if (!currentTicket || !ticketId) return;

  try {
    const updates = { ...currentTicket, [field]: value };
    const response = await fetch(ticketApiUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        title: updates.title,
        description: updates.description,
        status: updates.status,
        priority: updates.priority,
        customer: updates.customer,
        assignedTo: updates.assignedTo,
      }),
    });

    if (!response.ok) {
      // Revert on error
      if (field === 'status' && detailStatusSelect) {
        detailStatusSelect.value = currentTicket.status;
      } else if (field === 'priority' && detailPrioritySelect) {
        detailPrioritySelect.value = currentTicket.priority;
      }
      return;
    }

    const result = await response.json();
    currentTicket = result.ticket;
    renderTicket(result.ticket);
    fetchTicketActivity();
    refreshTicketHistoryIfVisible();
  } catch {
    // Revert on error
    if (field === 'status' && detailStatusSelect) {
      detailStatusSelect.value = currentTicket.status;
    } else if (field === 'priority' && detailPrioritySelect) {
      detailPrioritySelect.value = currentTicket.priority;
    }
  }
};

// Fetch ticket
const fetchTicket = async () => {
  if (!ticketId) {
    window.location.href = 'tickets.html';
    return;
  }

  try {
    const response = await fetch(ticketApiUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('towerPsaToken');
        redirectToLogin();
        return;
      }
      if (ticketLoadError) {
        ticketLoadError.textContent = 'Ticket not found.';
        ticketLoadError.hidden = false;
      }
      return;
    }

    const result = await response.json();
    renderTicket(result.ticket);
    fetchTimeEntries();
    fetchTicketActivity();
  } catch {
    if (ticketLoadError) {
      ticketLoadError.textContent = 'Unable to reach the server.';
      ticketLoadError.hidden = false;
    }
  }
};

// Ticket edit handlers
const setEditTicketError = (message) => {
  if (editTicketError) editTicketError.textContent = message;
};

const openEditTicketModal = async () => {
  if (!currentTicket) return;
  if (editTicketTitle) editTicketTitle.value = currentTicket.title || '';
  if (editTicketDescription) editTicketDescription.value = currentTicket.description || '';
  if (editTicketStatus) editTicketStatus.value = currentTicket.status || 'Open';
  if (editTicketPriority) editTicketPriority.value = currentTicket.priority || 'Medium';
  if (editTicketCustomer) editTicketCustomer.value = currentTicket.customer || '';
  setEditTicketError('');

  // Populate assigned-to dropdown then set current value
  if (editTicketAssigned) {
    try {
      const response = await fetch('/api/users/names', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const result = await response.json();
        editTicketAssigned.innerHTML = '<option value="">\u2014 Unassigned \u2014</option>';
        result.users.forEach((user) => {
          const option = document.createElement('option');
          option.value = user.name;
          option.textContent = user.name;
          editTicketAssigned.appendChild(option);
        });
      }
    } catch {
      // silently fail — dropdown may be empty but form still works
    }
    editTicketAssigned.value = currentTicket.assignedTo || '';
  }

  if (editTicketModal) editTicketModal.hidden = false;
};

const closeEditTicketModal = () => {
  if (editTicketModal) editTicketModal.hidden = true;
  setEditTicketError('');
};

const handleEditTicketSubmit = async (event) => {
  event.preventDefault();
  if (!ticketId) return;

  const formData = new FormData(editTicketForm);
  const title = formData.get('title');
  const description = formData.get('description');
  const status = formData.get('status');
  const priority = formData.get('priority');
  const customer = formData.get('customer');
  const assignedTo = formData.get('assignedTo');

  if (!title || !status || !priority || !customer) {
    setEditTicketError('Title, Status, Priority, and Customer are required.');
    return;
  }

  try {
    const response = await fetch(ticketApiUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        title,
        description,
        status,
        priority,
        customer,
        assignedTo,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      setEditTicketError(result.error || 'Unable to update ticket.');
      return;
    }

    closeEditTicketModal();
    fetchTicket();
  } catch {
    setEditTicketError('Unable to reach the server.');
  }
};

// Handle log time submit
const handleLogTimeSubmit = async (event) => {
  event.preventDefault();
  setLogTimeError('');

  const formData = new FormData(logTimeForm);
  const date = formData.get('date')?.toString();
  const hours = formData.get('hours')?.toString();
  const billable = formData.get('billable') === 'yes';
  const noteVisibility = formData.get('noteVisibility')?.toString() === 'customer' ? 'customer' : 'internal';
  const notes = formData.get('notes')?.toString().trim();
  const startTime = timeStartInput?.value?.toString().trim() || null;
  const endTime = timeEndInput?.value?.toString().trim() || null;

  if (!date) {
    setLogTimeError('Date is required.');
    return;
  }

  if (!hours || parseFloat(hours) <= 0) {
    setLogTimeError('Please enter valid start and end times.');
    return;
  }

  try {
    const response = await fetch(timeEntriesApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        date,
        hours: parseFloat(hours),
        billable,
        noteVisibility,
        notes,
        startTime,
        endTime,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      setLogTimeError(result.error || 'Unable to save time entry.');
      return;
    }

    closeModal();
    fetchTimeEntries();
    fetchTicketActivity();
    refreshTicketHistoryIfVisible();
  } catch {
    setLogTimeError('Unable to reach the server.');
  }
};

// Handle time entry table actions (view and delete)
const handleTimeEntriesClick = async (event) => {
  const editButton = event.target.closest('[data-action="edit-entry"]');
  const row = event.target.closest('.time-entry-row');

  if (!row) return;

  const entryJson = row.getAttribute('data-entry-json');
  if (!entryJson) return;

  const entry = JSON.parse(entryJson);

  // If edit button was clicked, open edit modal
  if (editButton) {
    openEditEntryModal(entry);
  } else {
    // Otherwise, open view modal
    openViewEntryModal(entry);
  }
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
if (addTimeButton) addTimeButton.addEventListener('click', openLogTimeModal);
if (timeStartInput) timeStartInput.addEventListener('blur', handleTimeBlur);
if (timeEndInput) timeEndInput.addEventListener('blur', handleTimeBlur);
if (closeLogTimeModal) closeLogTimeModal.addEventListener('click', closeModal);
if (logTimeModal) {
  logTimeModal.addEventListener('click', (e) => {
    if (e.target === logTimeModal) closeModal();
  });
}
if (logTimeForm) logTimeForm.addEventListener('submit', handleLogTimeSubmit);
if (ticketAttachmentForm) ticketAttachmentForm.addEventListener('submit', handleTicketAttachmentSubmit);
if (ticketAttachmentsList) ticketAttachmentsList.addEventListener('click', handleTicketAttachmentsClick);
if (ticketHistoryList) ticketHistoryList.addEventListener('click', handleTicketAttachmentsClick);
if (closeEditEntryButton) closeEditEntryButton.addEventListener('click', closeEditEntryModal);
if (editEntryForm) editEntryForm.addEventListener('submit', handleEditEntrySubmit);
if (editEntryStart) editEntryStart.addEventListener('blur', handleEditTimeBlur);
if (editEntryEnd) editEntryEnd.addEventListener('blur', handleEditTimeBlur);
if (editEntryModal) {
  editEntryModal.addEventListener('click', (e) => {
    if (e.target === editEntryModal) closeEditEntryModal();
  });
}
if (closeViewEntryButton) closeViewEntryButton.addEventListener('click', closeViewEntryModal);
if (viewTicketHistoryButton) viewTicketHistoryButton.addEventListener('click', openTicketHistoryModal);
if (closeTicketHistoryModalButton) closeTicketHistoryModalButton.addEventListener('click', closeTicketHistoryModal);
if (viewEntryEditButton) {
  viewEntryEditButton.addEventListener('click', () => {
    if (viewingEntry) {
      const entryToEdit = viewingEntry;
      closeViewEntryModal();
      openEditEntryModal(entryToEdit);
    }
  });
}
if (viewEntryModal) {
  viewEntryModal.addEventListener('click', (e) => {
    if (e.target === viewEntryModal) closeViewEntryModal();
  });
}
if (ticketHistoryModal) {
  ticketHistoryModal.addEventListener('click', (e) => {
    if (e.target === ticketHistoryModal) closeTicketHistoryModal();
  });
}
if (closeAttachmentDeleteModalButton) {
  closeAttachmentDeleteModalButton.addEventListener('click', closeAttachmentDeleteModal);
}
if (attachmentDeleteCancelButton) {
  attachmentDeleteCancelButton.addEventListener('click', closeAttachmentDeleteModal);
}
if (attachmentDeleteConfirmButton) {
  attachmentDeleteConfirmButton.addEventListener('click', confirmDeleteAttachment);
}
if (attachmentDeleteModal) {
  attachmentDeleteModal.addEventListener('click', (e) => {
    if (e.target === attachmentDeleteModal) closeAttachmentDeleteModal();
  });
}
if (timeEntriesBody) timeEntriesBody.addEventListener('click', handleTimeEntriesClick);
timeEntryFilterButtons.forEach((button) => {
  button.addEventListener('click', () => {
    setTimeEntryFilter(button.dataset.timeFilter);
  });
});
ticketHistoryFilterButtons.forEach((button) => {
  button.addEventListener('click', () => {
    setHistoryFilter(button.dataset.historyFilter);
  });
});

if (editTicketButton) editTicketButton.addEventListener('click', openEditTicketModal);
if (closeEditTicketButton) closeEditTicketButton.addEventListener('click', closeEditTicketModal);
if (editTicketForm) editTicketForm.addEventListener('submit', handleEditTicketSubmit);
if (editTicketModal) {
  editTicketModal.addEventListener('click', (e) => {
    if (e.target === editTicketModal) closeEditTicketModal();
  });
}

if (detailStatusSelect) {
  detailStatusSelect.addEventListener('change', (e) => {
    handleStatusOrPriorityChange('status', e.target.value);
  });
}

if (detailPrioritySelect) {
  detailPrioritySelect.addEventListener('change', (e) => {
    handleStatusOrPriorityChange('priority', e.target.value);
  });
}

document.addEventListener('click', handleDocumentClick);
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    closeModal();
    closeEditEntryModal();
    closeViewEntryModal();
    closeTicketHistoryModal();
    closeAttachmentDeleteModal();
    closeEditTicketModal();
    closeProfileDropdown();
    closeManageDropdown();
  }
});

// Boot
showProfileMenu();
fetchTicket();
