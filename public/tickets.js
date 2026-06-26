const ticketBody = document.querySelector('#ticket-body');
const ticketHeaderRow = document.querySelector('#ticket-header-row');
const pageError = document.querySelector('#page-error');
const newTicketButton = document.querySelector('#new-ticket-button');
const customizeColumnsButton = document.querySelector('#customize-columns-button');
const newTicketModal = document.querySelector('#new-ticket-modal');
const closeNewTicketModal = document.querySelector('#close-new-ticket-modal');
const newTicketForm = document.querySelector('#new-ticket-form');
const newTicketError = document.querySelector('#new-ticket-error');
const columnOrderModal = document.querySelector('#column-order-modal');
const closeColumnOrderModalButton = document.querySelector('#close-column-order-modal');
const doneColumnOrderButton = document.querySelector('#done-column-order');
const resetColumnOrderButton = document.querySelector('#reset-column-order');
const columnOrderList = document.querySelector('#column-order-list');
const columnOrderModalContent = columnOrderModal ? columnOrderModal.querySelector('.column-order-modal-content') : null;
const columnOrderModalHeader = columnOrderModalContent ? columnOrderModalContent.querySelector('.user-form-modal-header') : null;
const manageMenu = document.querySelector('.manage-menu');
const manageButton = document.querySelector('#manage-button');
const manageDropdown = document.querySelector('#manage-dropdown');
const profileMenu = document.querySelector('.profile-menu');
const profileButton = document.querySelector('#profile-button');
const profileDropdown = document.querySelector('#profile-dropdown');
const profileInitials = document.querySelector('#profile-initials');
const logoutButton = document.querySelector('#logout-button');
const viewProfileButton = document.querySelector('#view-profile-button');

const token = localStorage.getItem('towerPsaToken');
const userName = localStorage.getItem('towerPsaUserName') || '';
const userRole = localStorage.getItem('towerPsaUserRole') || '';
const ticketApiUrl = '/api/tickets';
const ticketColumnOrderStorageKey = 'towerPsaTicketColumnOrder';

const defaultTicketColumns = [
  { key: 'id', label: 'Ticket #' },
  { key: 'title', label: 'Title' },
  { key: 'customer', label: 'Customer' },
  { key: 'customerContact', label: 'Contact' },
  { key: 'status', label: 'Status' },
  { key: 'priority', label: 'Priority' },
  { key: 'slaState', label: 'SLA' },
  { key: 'slaResolutionDueAt', label: 'SLA Due' },
  { key: 'assignedTo', label: 'Assigned To' },
  { key: 'latestActivityAt', label: 'Latest Activity' },
  { key: 'createdAt', label: 'Created' },
];

let allCompanies = [];
let customerDropdownInitialized = false;
let allContacts = [];
let selectedCompanyId = null;
let contactDropdownInitialized = false;
let selectCompany;
let ticketsCache = [];
let ticketSortState = { key: 'id', direction: 'asc' };
let ticketColumnOrder = defaultTicketColumns.map((column) => column.key);
let draggedColumnKey = null;
let isDraggingColumnOrderModal = false;
let columnOrderModalPointerOffset = { x: 0, y: 0 };

const modalPadding = 12;

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const getColumnOrderModalBounds = () => {
  if (!columnOrderModalContent) {
    return null;
  }

  const rect = columnOrderModalContent.getBoundingClientRect();
  const maxLeft = Math.max(modalPadding, window.innerWidth - rect.width - modalPadding);
  const maxTop = Math.max(modalPadding, window.innerHeight - rect.height - modalPadding);

  return {
    width: rect.width,
    height: rect.height,
    maxLeft,
    maxTop,
  };
};

const centerColumnOrderModal = () => {
  if (!columnOrderModal || !columnOrderModalContent || columnOrderModal.hidden) {
    return;
  }

  const bounds = getColumnOrderModalBounds();
  if (!bounds) {
    return;
  }

  const centeredLeft = clamp((window.innerWidth - bounds.width) / 2, modalPadding, bounds.maxLeft);
  const centeredTop = clamp((window.innerHeight - bounds.height) / 2, modalPadding, bounds.maxTop);

  columnOrderModalContent.style.position = 'fixed';
  columnOrderModalContent.style.left = `${centeredLeft}px`;
  columnOrderModalContent.style.top = `${centeredTop}px`;
};

const constrainColumnOrderModalToViewport = () => {
  if (!columnOrderModal || !columnOrderModalContent || columnOrderModal.hidden) {
    return;
  }

  const bounds = getColumnOrderModalBounds();
  if (!bounds) {
    return;
  }

  const currentLeft = Number.parseFloat(columnOrderModalContent.style.left);
  const currentTop = Number.parseFloat(columnOrderModalContent.style.top);

  const nextLeft = Number.isFinite(currentLeft)
    ? clamp(currentLeft, modalPadding, bounds.maxLeft)
    : clamp((window.innerWidth - bounds.width) / 2, modalPadding, bounds.maxLeft);
  const nextTop = Number.isFinite(currentTop)
    ? clamp(currentTop, modalPadding, bounds.maxTop)
    : clamp((window.innerHeight - bounds.height) / 2, modalPadding, bounds.maxTop);

  columnOrderModalContent.style.position = 'fixed';
  columnOrderModalContent.style.left = `${nextLeft}px`;
  columnOrderModalContent.style.top = `${nextTop}px`;
};

const handleColumnOrderModalDragStart = (event) => {
  if (!columnOrderModalContent || !columnOrderModalHeader || event.button !== 0) {
    return;
  }

  if (event.target.closest('button, input, select, textarea, a')) {
    return;
  }

  const rect = columnOrderModalContent.getBoundingClientRect();
  isDraggingColumnOrderModal = true;
  columnOrderModalPointerOffset = {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  };
  document.body.classList.add('is-dragging-modal');
  event.preventDefault();
};

const handleColumnOrderModalDragMove = (event) => {
  if (!isDraggingColumnOrderModal || !columnOrderModalContent) {
    return;
  }

  const bounds = getColumnOrderModalBounds();
  if (!bounds) {
    return;
  }

  const proposedLeft = event.clientX - columnOrderModalPointerOffset.x;
  const proposedTop = event.clientY - columnOrderModalPointerOffset.y;

  columnOrderModalContent.style.left = `${clamp(proposedLeft, modalPadding, bounds.maxLeft)}px`;
  columnOrderModalContent.style.top = `${clamp(proposedTop, modalPadding, bounds.maxTop)}px`;
};

const stopColumnOrderModalDrag = () => {
  if (!isDraggingColumnOrderModal) {
    return;
  }

  isDraggingColumnOrderModal = false;
  document.body.classList.remove('is-dragging-modal');
};

const redirectToLogin = () => {
  window.location.href = 'login.html';
};

const showProfileMenu = () => {
  if (profileMenu) {
    profileMenu.hidden = false;
  }

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
  if (profileFullName) {
    profileFullName.textContent = userName || 'User';
  }

  if (userRole === 'admin' && manageMenu) {
    manageMenu.hidden = false;
    manageMenu.style.display = 'flex';
  } else if (manageMenu) {
    manageMenu.hidden = true;
    manageMenu.style.display = 'none';
  }
};

const toggleDropdown = () => {
  if (!manageDropdown || !manageButton) {
    return;
  }

  const isOpen = !manageDropdown.hidden;
  manageDropdown.hidden = isOpen;
  manageButton.setAttribute('aria-expanded', String(!isOpen));
};

const toggleProfileDropdown = () => {
  if (!profileDropdown || !profileButton) {
    return;
  }

  const isOpen = !profileDropdown.hidden;
  profileDropdown.hidden = isOpen;
  profileButton.setAttribute('aria-expanded', String(!isOpen));
};

const closeDropdown = () => {
  if (!profileDropdown || !profileButton) {
    return;
  }

  profileDropdown.hidden = true;
  profileButton.setAttribute('aria-expanded', 'false');
};

const closeManageDropdown = () => {
  if (!manageDropdown || !manageButton) {
    return;
  }

  manageDropdown.hidden = true;
  manageButton.setAttribute('aria-expanded', 'false');
};

const handleDocumentClick = (event) => {
  if (!profileMenu || !profileButton || !profileDropdown) {
    return;
  }

  if (profileMenu.contains(event.target)) {
    return;
  }

  closeDropdown();

  if (manageMenu && manageMenu.contains(event.target)) {
    return;
  }

  closeManageDropdown();
};

const initializeAuth = () => {
  if (!token) {
    redirectToLogin();
    return false;
  }

  showProfileMenu();
  return true;
};

const setPageError = (message) => {
  if (pageError) {
    pageError.textContent = message;
  }
};

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

const loadTicketColumnOrder = () => {
  const raw = localStorage.getItem(ticketColumnOrderStorageKey);
  if (!raw) {
    ticketColumnOrder = defaultTicketColumns.map((column) => column.key);
    return;
  }

  try {
    const parsed = JSON.parse(raw);
    const validKeys = defaultTicketColumns.map((column) => column.key);
    const orderedKeys = parsed.filter((key) => validKeys.includes(key));
    const missingKeys = validKeys.filter((key) => !orderedKeys.includes(key));
    ticketColumnOrder = [...orderedKeys, ...missingKeys];
  } catch {
    ticketColumnOrder = defaultTicketColumns.map((column) => column.key);
  }
};

const saveTicketColumnOrder = () => {
  localStorage.setItem(ticketColumnOrderStorageKey, JSON.stringify(ticketColumnOrder));
};

const getColumnDefinition = (key) => defaultTicketColumns.find((column) => column.key === key);

const renderTicketHeaders = () => {
  if (!ticketHeaderRow) return;

  ticketHeaderRow.innerHTML = ticketColumnOrder.map((columnKey) => {
    const column = getColumnDefinition(columnKey);
    if (!column) return '';

    const isActive = ticketSortState.key === column.key;
    let ariaSort = 'none';
    let indicator = '';

    if (isActive) {
      ariaSort = ticketSortState.direction === 'asc' ? 'ascending' : 'descending';
      indicator = ticketSortState.direction === 'asc' ? ' ▲' : ' ▼';
    }

    return `<th data-sort-key="${column.key}" class="sortable-header${isActive ? ' sortable-active' : ''}" role="button" tabindex="0" aria-sort="${ariaSort}">${column.label}${indicator}</th>`;
  }).join('');
};

const renderColumnOrderList = () => {
  if (!columnOrderList) return;

  columnOrderList.innerHTML = ticketColumnOrder.map((columnKey, index) => {
    const column = getColumnDefinition(columnKey);
    if (!column) return '';

    return `
      <div class="column-order-item" data-column-key="${column.key}" draggable="true">
        <span class="column-order-label">${column.label}</span>
        <div class="column-order-actions">
          <button type="button" class="button secondary small" data-column-move="up" ${index === 0 ? 'disabled' : ''}>Up</button>
          <button type="button" class="button secondary small" data-column-move="down" ${index === ticketColumnOrder.length - 1 ? 'disabled' : ''}>Down</button>
        </div>
      </div>
    `;
  }).join('');
};

const getSortableTicketValue = (ticket, key) => {
  if (key === 'id') return Number(ticket.id) || 0;
  if (key === 'createdAt' || key === 'latestActivityAt' || key === 'slaResolutionDueAt') {
    return ticket[key] ? new Date(ticket[key]).getTime() : 0;
  }
  return (ticket[key] || '').toString().toLowerCase();
};

const sortTickets = (tickets) => {
  const sorted = [...tickets].sort((left, right) => {
    const leftValue = getSortableTicketValue(left, ticketSortState.key);
    const rightValue = getSortableTicketValue(right, ticketSortState.key);

    if (leftValue < rightValue) return ticketSortState.direction === 'asc' ? -1 : 1;
    if (leftValue > rightValue) return ticketSortState.direction === 'asc' ? 1 : -1;
    return 0;
  });

  return sorted;
};

const renderTickets = (tickets) => {
  if (!ticketBody) {
    return;
  }

  ticketsCache = tickets;
  renderTicketHeaders();
  const sortedTickets = sortTickets(tickets);

  if (!sortedTickets.length) {
    ticketBody.innerHTML = `<tr><td colspan="${ticketColumnOrder.length}" style="text-align:center;color:var(--muted);padding:3rem;">No tickets found.</td></tr>`;
    return;
  }

  ticketBody.innerHTML = sortedTickets.map((ticket) => {
    const cellMap = {
      id: `#${ticket.id}`,
      title: ticket.title,
      customer: ticket.customer,
      customerContact: ticket.customerContact || '—',
      status: statusBadge(ticket.status),
      priority: priorityBadge(ticket.priority),
      slaState: slaStateBadge(ticket.slaState),
      slaResolutionDueAt: formatDateTime(ticket.slaResolutionDueAt),
      assignedTo: ticket.assignedTo || '—',
      latestActivityAt: formatDateTime(ticket.latestActivityAt),
      createdAt: formatDate(ticket.createdAt),
    };

    const cells = ticketColumnOrder.map((columnKey) => `<td>${cellMap[columnKey] ?? '—'}</td>`).join('');

    return `
      <tr class="ticket-row" data-ticket-id="${ticket.id}" role="button" tabindex="0" aria-label="View ticket #${ticket.id}">
        ${cells}
      </tr>
    `;
  }).join('');
};

const openColumnOrderModal = () => {
  renderColumnOrderList();
  if (columnOrderModal) {
    columnOrderModal.hidden = false;
    window.requestAnimationFrame(() => {
      centerColumnOrderModal();
      constrainColumnOrderModalToViewport();
    });
  }
};

const closeColumnOrderModal = () => {
  stopColumnOrderModalDrag();
  if (columnOrderModal) columnOrderModal.hidden = true;
};

const moveTicketColumn = (columnKey, direction) => {
  const index = ticketColumnOrder.indexOf(columnKey);
  if (index === -1) return;

  const targetIndex = direction === 'up' ? index - 1 : index + 1;
  if (targetIndex < 0 || targetIndex >= ticketColumnOrder.length) return;

  const nextOrder = [...ticketColumnOrder];
  const [column] = nextOrder.splice(index, 1);
  nextOrder.splice(targetIndex, 0, column);
  ticketColumnOrder = nextOrder;
  saveTicketColumnOrder();
  renderColumnOrderList();
  renderTickets(ticketsCache);
};

const moveTicketColumnToIndex = (columnKey, targetIndex) => {
  const currentIndex = ticketColumnOrder.indexOf(columnKey);
  if (currentIndex === -1 || targetIndex < 0 || targetIndex >= ticketColumnOrder.length) {
    return;
  }

  const nextOrder = [...ticketColumnOrder];
  const [column] = nextOrder.splice(currentIndex, 1);
  nextOrder.splice(targetIndex, 0, column);
  ticketColumnOrder = nextOrder;
  saveTicketColumnOrder();
  renderColumnOrderList();
  renderTickets(ticketsCache);
};

const fetchTickets = async () => {
  if (!token) {
    redirectToLogin();
    return;
  }

  try {
    const response = await fetch(ticketApiUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const result = await response.json();

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('towerPsaToken');
        redirectToLogin();
        return;
      }

      setPageError(result.error || 'Unable to load tickets');
      return;
    }

    renderTickets(result.tickets);
  } catch (error) {
    setPageError('Unable to reach the server.');
  }
};

const handleLogout = () => {
  localStorage.removeItem('towerPsaToken');
  closeDropdown();
  redirectToLogin();
};

const handleViewProfile = () => {
  window.location.href = 'profile.html';
};

const populateAssignedToDropdown = async () => {
  const select = document.querySelector('#new-ticket-assigned');
  if (!select) return;

  try {
    const response = await fetch('/api/users/names', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) return;
    const result = await response.json();
    const existing = select.value;
    select.innerHTML = '<option value="">\u2014 Unassigned \u2014</option>';
    result.users.forEach((user) => {
      const option = document.createElement('option');
      option.value = user.name;
      option.textContent = user.name;
      select.appendChild(option);
    });
    select.value = existing;
  } catch {
    // silently fail — text fallback still works
  }
};

const renderDropdownOptions = (companies, searchTerm) => {
  const optionsContainer = document.querySelector('#new-ticket-customer-options');
  if (!optionsContainer) return;

  optionsContainer.innerHTML = '';

  const filtered = companies.filter((company) => (
    company.name.toLowerCase().includes(searchTerm.toLowerCase())
  ));

  if (filtered.length === 0) {
    optionsContainer.innerHTML = '<div class="dropdown-option-empty">No companies found</div>';
    return;
  }

  filtered.forEach((company) => {
    const option = document.createElement('div');
    option.className = 'dropdown-option';
    option.textContent = company.name;
    option.addEventListener('click', () => {
      selectCompany(company);
    });
    optionsContainer.appendChild(option);
  });
};

const selectContact = (contact) => {
  const contactDropdown = document.querySelector('#new-ticket-contact-dropdown');
  const select = document.querySelector('#new-ticket-contact');
  const display = document.querySelector('#new-ticket-contact-display');
  const menu = contactDropdown ? contactDropdown.querySelector('.dropdown-menu') : null;
  const searchInput = document.querySelector('#new-ticket-contact-search');

  if (select) select.value = contact.fullName;
  if (display) display.textContent = contact.fullName;
  if (menu) menu.hidden = true;
  if (searchInput) searchInput.value = '';
};

const renderContactDropdownOptions = (contacts, searchTerm) => {
  const optionsContainer = document.querySelector('#new-ticket-contact-options');
  if (!optionsContainer) return;

  optionsContainer.innerHTML = '';

  if (!selectedCompanyId) {
    optionsContainer.innerHTML = '<div class="dropdown-option-empty">Select a company first</div>';
    return;
  }

  const filtered = contacts.filter((contact) => (
    contact.fullName.toLowerCase().includes(searchTerm.toLowerCase())
  ));

  if (filtered.length === 0) {
    optionsContainer.innerHTML = '<div class="dropdown-option-empty">No contacts found</div>';
    return;
  }

  filtered.forEach((contact) => {
    const option = document.createElement('div');
    option.className = 'dropdown-option';
    option.textContent = contact.fullName;
    option.addEventListener('click', () => {
      selectContact(contact);
    });
    optionsContainer.appendChild(option);
  });
};

const resetContactSelection = () => {
  const select = document.querySelector('#new-ticket-contact');
  const display = document.querySelector('#new-ticket-contact-display');
  const searchInput = document.querySelector('#new-ticket-contact-search');

  if (select) select.value = '';
  if (display) display.textContent = '— Select Contact —';
  if (searchInput) searchInput.value = '';
};

async function loadContactsForSelectedCompany() {
  const select = document.querySelector('#new-ticket-contact');
  if (!select) return;

  resetContactSelection();

  if (!selectedCompanyId) {
    allContacts = [];
    renderContactDropdownOptions(allContacts, '');
    return;
  }

  try {
    const response = await fetch(`/api/contacts/company/${selectedCompanyId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      allContacts = [];
      renderContactDropdownOptions(allContacts, '');
      return;
    }

    const result = await response.json();
    allContacts = (result.contacts || []).map((contact) => ({
      id: contact.id,
      fullName: `${contact.firstName} ${contact.lastName}`.trim(),
    }));

    select.innerHTML = '<option value="">— Select Contact —</option>';
    allContacts.forEach((contact) => {
      const option = document.createElement('option');
      option.value = contact.fullName;
      option.textContent = contact.fullName;
      select.appendChild(option);
    });

    renderContactDropdownOptions(allContacts, '');
  } catch {
    allContacts = [];
    renderContactDropdownOptions(allContacts, '');
  }
}

selectCompany = async (company) => {
  const customerDropdown = document.querySelector('#new-ticket-customer-dropdown');
  const select = document.querySelector('#new-ticket-customer');
  const display = document.querySelector('#new-ticket-customer-display');
  const menu = customerDropdown ? customerDropdown.querySelector('.dropdown-menu') : null;
  const searchInput = document.querySelector('#new-ticket-customer-search');

  selectedCompanyId = company.id;

  if (select) select.value = company.name;
  if (display) display.textContent = company.name;
  if (menu) menu.hidden = true;
  if (searchInput) searchInput.value = '';

  await loadContactsForSelectedCompany();
};

const setupCustomerDropdown = async () => {
  const dropdown = document.querySelector('#new-ticket-customer-dropdown');
  if (!dropdown) return;

  const trigger = dropdown.querySelector('.dropdown-trigger');
  const menu = dropdown.querySelector('.dropdown-menu');
  const searchInput = dropdown.querySelector('#new-ticket-customer-search');
  const select = dropdown.querySelector('#new-ticket-customer');

  if (!trigger || !menu || !searchInput || !select) return;

  // Load companies
  try {
    const response = await fetch('/api/companies', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (response.ok) {
      const result = await response.json();
      allCompanies = result.companies;

      // Keep hidden select in sync so FormData submits customer correctly.
      select.innerHTML = '<option value="">— Select Company —</option>';
      allCompanies.forEach((company) => {
        const option = document.createElement('option');
        option.value = company.name;
        option.textContent = company.name;
        select.appendChild(option);
      });

      renderDropdownOptions(allCompanies, '');
    }
  } catch {
    // silently fail
  }

  // Only add event listeners once
  if (!customerDropdownInitialized) {
    customerDropdownInitialized = true;

    // Toggle dropdown on trigger click
    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      menu.hidden = !menu.hidden;
      if (!menu.hidden) {
        searchInput.focus();
      }
    });

    // Search filter
    searchInput.addEventListener('input', (e) => {
      renderDropdownOptions(allCompanies, e.target.value);
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
      if (!dropdown.contains(e.target)) {
        menu.hidden = true;
      }
    });
  }
};

const setupContactDropdown = () => {
  const dropdown = document.querySelector('#new-ticket-contact-dropdown');
  if (!dropdown) return;

  const trigger = dropdown.querySelector('.dropdown-trigger');
  const menu = dropdown.querySelector('.dropdown-menu');
  const searchInput = dropdown.querySelector('#new-ticket-contact-search');

  if (!trigger || !menu || !searchInput) return;

  renderContactDropdownOptions(allContacts, '');

  if (!contactDropdownInitialized) {
    contactDropdownInitialized = true;

    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      menu.hidden = !menu.hidden;
      if (!menu.hidden) {
        searchInput.focus();
      }
    });

    searchInput.addEventListener('input', (e) => {
      renderContactDropdownOptions(allContacts, e.target.value);
    });

    document.addEventListener('click', (e) => {
      if (!dropdown.contains(e.target)) {
        menu.hidden = true;
      }
    });
  }
};

const openNewTicketModal = () => {
  if (newTicketModal) {
    newTicketModal.hidden = false;
    populateAssignedToDropdown();
    setupCustomerDropdown();
    setupContactDropdown();
    const titleInput = document.querySelector('#new-ticket-title');
    if (titleInput) titleInput.focus();
  }
};

const closeNewTicketModalFn = () => {
  if (newTicketModal) {
    newTicketModal.hidden = true;
    if (newTicketForm) newTicketForm.reset();
    if (newTicketError) newTicketError.textContent = '';
    const customerDropdown = document.querySelector('#new-ticket-customer-dropdown');
    const menu = customerDropdown ? customerDropdown.querySelector('.dropdown-menu') : null;
    if (menu) menu.hidden = true;
    const searchInput = document.querySelector('#new-ticket-customer-search');
    if (searchInput) searchInput.value = '';
    const display = document.querySelector('#new-ticket-customer-display');
    if (display) display.textContent = '— Select Company —';

    const contactDropdown = document.querySelector('#new-ticket-contact-dropdown');
    const contactMenu = contactDropdown ? contactDropdown.querySelector('.dropdown-menu') : null;
    if (contactMenu) contactMenu.hidden = true;
    resetContactSelection();
    selectedCompanyId = null;
    allContacts = [];
    renderContactDropdownOptions(allContacts, '');
  }
};

const handleNewTicketSubmit = async (event) => {
  event.preventDefault();

  if (!newTicketForm || !token) return;

  const formData = new FormData(newTicketForm);
  const ticketData = {
    title: formData.get('title'),
    description: formData.get('description'),
    customer: formData.get('customer'),
    customerContact: formData.get('customerContact') || null,
    status: formData.get('status'),
    priority: formData.get('priority'),
    assignedTo: formData.get('assignedTo') || null,
  };

  if (newTicketError) newTicketError.textContent = '';

  try {
    const response = await fetch(ticketApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(ticketData),
    });

    const result = await response.json();

    if (!response.ok) {
      if (newTicketError) {
        newTicketError.textContent = result.error || 'Failed to create ticket';
      }
      return;
    }

    closeNewTicketModalFn();
    fetchTickets();
  } catch (error) {
    if (newTicketError) {
      newTicketError.textContent = 'Unable to reach the server.';
    }
  }
};

if (logoutButton) {
  logoutButton.addEventListener('click', handleLogout);
}

if (viewProfileButton) {
  viewProfileButton.addEventListener('click', handleViewProfile);
}

if (profileButton) {
  profileButton.addEventListener('click', toggleProfileDropdown);
}

if (manageButton) {
  manageButton.addEventListener('click', toggleDropdown);
}

if (newTicketButton) {
  newTicketButton.addEventListener('click', openNewTicketModal);
}

if (customizeColumnsButton) {
  customizeColumnsButton.addEventListener('click', openColumnOrderModal);
}

if (closeColumnOrderModalButton) {
  closeColumnOrderModalButton.addEventListener('click', closeColumnOrderModal);
}

if (doneColumnOrderButton) {
  doneColumnOrderButton.addEventListener('click', closeColumnOrderModal);
}

if (resetColumnOrderButton) {
  resetColumnOrderButton.addEventListener('click', () => {
    ticketColumnOrder = defaultTicketColumns.map((column) => column.key);
    saveTicketColumnOrder();
    renderColumnOrderList();
    renderTickets(ticketsCache);
  });
}

if (columnOrderList) {
  columnOrderList.addEventListener('click', (event) => {
    const button = event.target.closest('[data-column-move]');
    if (!button) return;

    const item = event.target.closest('[data-column-key]');
    if (!item) return;

    moveTicketColumn(item.dataset.columnKey, button.dataset.columnMove);
  });

  columnOrderList.addEventListener('dragstart', (event) => {
    const item = event.target.closest('[data-column-key]');
    if (!item) return;

    draggedColumnKey = item.dataset.columnKey;
    item.classList.add('dragging');
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', draggedColumnKey);
    }
  });

  columnOrderList.addEventListener('dragend', (event) => {
    const item = event.target.closest('[data-column-key]');
    if (item) {
      item.classList.remove('dragging');
    }
    draggedColumnKey = null;
    columnOrderList.querySelectorAll('.drag-over').forEach((element) => {
      element.classList.remove('drag-over');
    });
  });

  columnOrderList.addEventListener('dragover', (event) => {
    const item = event.target.closest('[data-column-key]');
    if (!item || !draggedColumnKey || item.dataset.columnKey === draggedColumnKey) return;

    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
    columnOrderList.querySelectorAll('.drag-over').forEach((element) => {
      if (element !== item) {
        element.classList.remove('drag-over');
      }
    });
    item.classList.add('drag-over');
  });

  columnOrderList.addEventListener('dragleave', (event) => {
    const item = event.target.closest('[data-column-key]');
    if (!item) return;
    item.classList.remove('drag-over');
  });

  columnOrderList.addEventListener('drop', (event) => {
    const item = event.target.closest('[data-column-key]');
    if (!item || !draggedColumnKey) return;

    event.preventDefault();
    item.classList.remove('drag-over');
    const targetIndex = ticketColumnOrder.indexOf(item.dataset.columnKey);
    moveTicketColumnToIndex(draggedColumnKey, targetIndex);
  });
}

if (closeNewTicketModal) {
  closeNewTicketModal.addEventListener('click', closeNewTicketModalFn);
}

if (newTicketForm) {
  newTicketForm.addEventListener('submit', handleNewTicketSubmit);
}

if (newTicketModal) {
  newTicketModal.addEventListener('click', (event) => {
    if (event.target === newTicketModal) {
      closeNewTicketModalFn();
    }
  });
}

if (columnOrderModal) {
  columnOrderModal.addEventListener('click', (event) => {
    if (event.target === columnOrderModal) {
      closeColumnOrderModal();
    }
  });
}

if (columnOrderModalHeader) {
  columnOrderModalHeader.addEventListener('mousedown', handleColumnOrderModalDragStart);
}

document.addEventListener('mousemove', handleColumnOrderModalDragMove);
document.addEventListener('mouseup', stopColumnOrderModalDrag);
window.addEventListener('resize', constrainColumnOrderModalToViewport);

document.addEventListener('click', handleDocumentClick);

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    closeDropdown();
  }
});

if (ticketBody) {
  ticketBody.addEventListener('click', (event) => {
    const row = event.target.closest('.ticket-row');
    if (row) window.location.href = `ticket-detail.html?id=${row.dataset.ticketId}`;
  });

  ticketBody.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      const row = event.target.closest('.ticket-row');
      if (row) window.location.href = `ticket-detail.html?id=${row.dataset.ticketId}`;
    }
  });
}

if (ticketHeaderRow) {
  const applySort = (clickedKey) => {
    if (!clickedKey) return;

    if (ticketSortState.key === clickedKey) {
      ticketSortState = {
        key: clickedKey,
        direction: ticketSortState.direction === 'asc' ? 'desc' : 'asc',
      };
    } else {
      ticketSortState = { key: clickedKey, direction: 'asc' };
    }

    renderTickets(ticketsCache);
  };

  ticketHeaderRow.addEventListener('click', (event) => {
    const header = event.target.closest('[data-sort-key]');
    if (!header) return;
    applySort(header.dataset.sortKey);
  });

  ticketHeaderRow.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      const header = event.target.closest('[data-sort-key]');
      if (!header) return;
      event.preventDefault();
      applySort(header.dataset.sortKey);
    }
  });
}

if (initializeAuth()) {
  loadTicketColumnOrder();
  fetchTickets();
}
