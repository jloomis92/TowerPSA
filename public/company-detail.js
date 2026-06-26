// DOM Elements - Nav
const manageMenu = document.querySelector('.manage-menu');
const manageButton = document.querySelector('#manage-button');
const manageDropdown = document.querySelector('#manage-dropdown');
const profileMenu = document.querySelector('.profile-menu');
const profileButton = document.querySelector('#profile-button');
const profileDropdown = document.querySelector('#profile-dropdown');
const profileInitials = document.querySelector('#profile-initials');
const logoutButton = document.querySelector('#logout-button');
const viewProfileButton = document.querySelector('#view-profile-button');

// DOM Elements - Detail
const companyDetailShell = document.querySelector('#company-detail-shell');
const companyLoadError = document.querySelector('#company-load-error');
const detailName = document.querySelector('#detail-name');
const detailPrimaryContact = document.querySelector('#detail-primary-contact');
const detailPhone = document.querySelector('#detail-phone');
const detailEmail = document.querySelector('#detail-email');
const detailAddress = document.querySelector('#detail-address');
const detailSlaPolicy = document.querySelector('#detail-sla-policy');
const detailNotes = document.querySelector('#detail-notes');
const detailCreated = document.querySelector('#detail-created');
const editCompanyButton = document.querySelector('#edit-company-button');
const adminActions = document.querySelector('#admin-actions');
const deleteCompanyButton = document.querySelector('#delete-company-button');
const deleteConfirmModal = document.querySelector('#delete-confirm-modal');
const closeDeleteModal = document.querySelector('#close-delete-modal');
const confirmDeleteOk = document.querySelector('#confirm-delete-ok');
const confirmDeleteCancel = document.querySelector('#confirm-delete-cancel');
const companySlaPolicySelect = document.querySelector('#company-sla-policy-select');
const companySlaHint = document.querySelector('#company-sla-hint');
const saveCompanySlaButton = document.querySelector('#save-company-sla-button');
const companySlaError = document.querySelector('#company-sla-error');

// DOM Elements - Edit Modal
const editCompanyModal = document.querySelector('#edit-company-modal');
const closeEditCompanyModal = document.querySelector('#close-edit-company-modal');
const editCompanyForm = document.querySelector('#edit-company-form');
const editCompanyError = document.querySelector('#edit-company-error');

// DOM Elements - Tabs
const detailTabButtons = document.querySelectorAll('.detail-tab-button');
const contactsTab = document.querySelector('#contacts-tab');
const ticketsTab = document.querySelector('#tickets-tab');
const notesTab = document.querySelector('#notes-tab');
const contactsList = document.querySelector('#contacts-list');
const companyTicketsBody = document.querySelector('#company-tickets-body');
const addContactButton = document.querySelector('#add-contact-button');
const contactModal = document.querySelector('#contact-modal');
const closeContactModalButton = document.querySelector('#close-contact-modal');
const contactForm = document.querySelector('#contact-form');
const contactModalTitle = document.querySelector('#contact-modal-title');
const contactError = document.querySelector('#contact-error');

// Auth
const token = localStorage.getItem('towerPsaToken');
const userName = localStorage.getItem('towerPsaUserName') || '';
const userRole = localStorage.getItem('towerPsaUserRole') || '';

// URL params
const params = new URLSearchParams(window.location.search);
const companyId = params.get('id');
const companyApiUrl = `/api/companies/${companyId}`;
const contactsApiUrl = '/api/contacts';
const slaPoliciesApiUrl = '/api/sla-policies';
const defaultSlaPolicyName = 'Default SLA';

// State
let currentCompany = null;
let currentContacts = [];
let editingContactId = null;
let slaPolicies = [];

// Helpers
const redirectToLogin = () => { window.location.href = 'login.html'; };

const formatPhone = (raw) => {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 10) return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  if (digits.length === 11 && digits[0] === '1') return `${digits.slice(1, 4)}-${digits.slice(4, 7)}-${digits.slice(7)}`;
  return raw.trim() || null;
};

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
};

const escapeHtml = (value) => (value || '')
  .toString()
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

const normalizeText = (value) => (value || '').toString().trim().toLowerCase();

const setCompanySlaError = (message) => {
  if (companySlaError) {
    companySlaError.textContent = message;
  }
};

const getDefaultSlaPolicy = () => {
  if (!slaPolicies.length) {
    return null;
  }

  const defaultPolicy = slaPolicies.find((policy) => policy.name === defaultSlaPolicyName);
  return defaultPolicy || slaPolicies[0];
};

const getEffectiveCompanySlaPolicyId = (company) => {
  if (company?.slaPolicyId) {
    return String(company.slaPolicyId);
  }

  const defaultPolicy = getDefaultSlaPolicy();
  return defaultPolicy ? String(defaultPolicy.id) : '';
};

const renderCompanySlaHint = (
  selectedPolicyId,
  isUnsaved = false,
  hasExplicitAssignment = false,
) => {
  if (!companySlaHint) {
    return;
  }

  if (!selectedPolicyId) {
    companySlaHint.textContent = 'No SLA rules available yet. Create a rule to apply it to this company.';
    return;
  }

  if (hasExplicitAssignment) {
    companySlaHint.textContent = isUnsaved
      ? 'Unsaved: this company will use the selected SLA rule after you save.'
      : 'This company uses a company-specific SLA rule.';
    return;
  }

  companySlaHint.textContent = 'No company-specific rule selected. This company uses Default SLA (1h response, 24h resolution) by fallback.';
};

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

const handleDocumentClick = (event) => {
  if (profileMenu && !profileMenu.contains(event.target)) {
    if (profileDropdown) profileDropdown.hidden = true;
    if (profileButton) profileButton.setAttribute('aria-expanded', 'false');
  }
  if (manageMenu && !manageMenu.contains(event.target)) {
    if (manageDropdown) manageDropdown.hidden = true;
    if (manageButton) manageButton.setAttribute('aria-expanded', 'false');
  }
};

// Render
const renderCompany = (company) => {
  currentCompany = company;
  document.title = `${company.name} · TowerPSA`;

  if (detailName) detailName.textContent = company.name;
  if (detailPrimaryContact) detailPrimaryContact.textContent = company.primaryContact || '—';
  if (detailPhone) detailPhone.textContent = company.phone || '—';
  if (detailEmail) detailEmail.textContent = company.email || '—';
  if (detailAddress) detailAddress.textContent = company.address || '—';
  if (detailSlaPolicy) {
    detailSlaPolicy.textContent = company.slaPolicyName || 'Default SLA (fallback)';
  }
  if (detailNotes) detailNotes.textContent = company.notes || 'No notes provided.';
  if (detailCreated) detailCreated.textContent = formatDate(company.createdAt);

  if (companySlaPolicySelect) {
    const effectivePolicyId = getEffectiveCompanySlaPolicyId(company);
    companySlaPolicySelect.value = effectivePolicyId;
    renderCompanySlaHint(effectivePolicyId, false, !!company.slaPolicyId);
  }

  if (companyDetailShell) companyDetailShell.hidden = false;

  // Show delete button for admins only
  if (adminActions) adminActions.hidden = (userRole !== 'admin');
};

const renderCompanyTickets = (tickets) => {
  if (!companyTicketsBody) {
    return;
  }

  if (!tickets.length) {
    companyTicketsBody.innerHTML = `
      <tr>
        <td colspan="6" class="time-entries-empty">No tickets found for this company.</td>
      </tr>
    `;
    return;
  }

  companyTicketsBody.innerHTML = tickets.map((ticket) => `
    <tr class="company-ticket-row" data-ticket-id="${ticket.id}">
      <td><a href="ticket-detail.html?id=${ticket.id}">#${ticket.id}</a></td>
      <td>${escapeHtml(ticket.title)}</td>
      <td>${escapeHtml(ticket.status || '—')}</td>
      <td>${escapeHtml(ticket.priority || '—')}</td>
      <td>${escapeHtml(ticket.assignedTo || '—')}</td>
      <td>${formatDate(ticket.updatedAt)}</td>
    </tr>
  `).join('');
};

const handleCompanyTicketsClick = (event) => {
  const row = event.target.closest('tr.company-ticket-row');
  if (!row) {
    return;
  }

  if (event.target.closest('a')) {
    return;
  }

  const ticketId = Number(row.dataset.ticketId);
  if (!Number.isInteger(ticketId) || ticketId <= 0) {
    return;
  }

  window.location.href = `ticket-detail.html?id=${ticketId}`;
};

async function fetchCompanyTickets() {
  if (!token || !currentCompany?.name) {
    return;
  }

  try {
    const response = await fetch('/api/tickets', {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('towerPsaToken');
        redirectToLogin();
      }
      return;
    }

    const result = await response.json();
    const companyName = normalizeText(currentCompany.name);
    const tickets = (result.tickets || [])
      .filter((ticket) => normalizeText(ticket.customer) === companyName)
      .sort((a, b) => b.id - a.id);

    renderCompanyTickets(tickets);
  } catch {
    renderCompanyTickets([]);
  }
}

const renderSlaPolicyOptions = () => {
  if (!companySlaPolicySelect) {
    return;
  }

  const options = [];
  slaPolicies.forEach((policy) => {
    options.push(`<option value="${policy.id}">${policy.name} (${policy.responseMinutes}m / ${policy.resolutionMinutes}m)</option>`);
  });

  if (!options.length) {
    companySlaPolicySelect.innerHTML = '<option value="">No SLA rules available</option>';
    renderCompanySlaHint('', false, false);
    return;
  }

  companySlaPolicySelect.innerHTML = options.join('');

  if (currentCompany) {
    const effectivePolicyId = getEffectiveCompanySlaPolicyId(currentCompany);
    companySlaPolicySelect.value = effectivePolicyId;
    renderCompanySlaHint(effectivePolicyId, false, !!currentCompany.slaPolicyId);
  }
};

const fetchSlaPolicies = async () => {
  if (!token || userRole !== 'admin') {
    return;
  }

  try {
    const response = await fetch(slaPoliciesApiUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      return;
    }

    const result = await response.json();
    slaPolicies = result.policies || [];
    renderSlaPolicyOptions();
  } catch {
    // silently fail for SLA admin controls
  }
};

const handleSaveCompanySlaAssignment = async () => {
  if (!currentCompany || !companySlaPolicySelect) {
    return;
  }

  setCompanySlaError('');

  const selectedValue = companySlaPolicySelect.value;
  const defaultPolicy = getDefaultSlaPolicy();
  let selectedPolicyId = null;
  if (selectedValue) {
    selectedPolicyId = Number(selectedValue);
  } else if (defaultPolicy) {
    selectedPolicyId = defaultPolicy.id;
  }

  try {
    const response = await fetch(companyApiUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        name: currentCompany.name,
        primaryContact: currentCompany.primaryContact,
        phone: currentCompany.phone,
        email: currentCompany.email,
        address: currentCompany.address,
        notes: currentCompany.notes,
        slaPolicyId: selectedPolicyId,
      }),
    });

    const result = await response.json();
    if (!response.ok) {
      setCompanySlaError(result.error || 'Unable to save SLA assignment.');
      return;
    }

    renderCompany(result.company);
  } catch {
    setCompanySlaError('Unable to reach the server.');
  }
};

// Fetch
const fetchCompany = async () => {
  if (!companyId) {
    window.location.href = 'companies.html';
    return;
  }

  try {
    const response = await fetch(companyApiUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('towerPsaToken');
        redirectToLogin();
        return;
      }
      if (companyLoadError) {
        companyLoadError.textContent = 'Company not found.';
        companyLoadError.hidden = false;
      }
      return;
    }

    const result = await response.json();
    renderCompany(result.company);
    fetchCompanyTickets();
  } catch {
    if (companyLoadError) {
      companyLoadError.textContent = 'Unable to reach the server.';
      companyLoadError.hidden = false;
    }
  }
};

// Delete
const openDeleteConfirm = () => {
  if (deleteConfirmModal) deleteConfirmModal.hidden = false;
};

const closeDeleteConfirm = () => {
  if (deleteConfirmModal) deleteConfirmModal.hidden = true;
};

const handleDeleteConfirm = async () => {
  if (!token) return;

  try {
    const response = await fetch(companyApiUrl, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.ok) {
      window.location.href = 'companies.html';
    } else {
      const result = await response.json();
      closeDeleteConfirm();
      if (companyLoadError) {
        companyLoadError.textContent = result.error || 'Failed to delete company.';
        companyLoadError.hidden = false;
      }
    }
  } catch {
    closeDeleteConfirm();
    if (companyLoadError) {
      companyLoadError.textContent = 'Unable to reach the server.';
      companyLoadError.hidden = false;
    }
  }
};

// Edit modal
const openEditModal = () => {
  if (!currentCompany || !editCompanyForm) return;
  editCompanyForm.elements.name.value = currentCompany.name || '';
  editCompanyForm.elements.primaryContact.value = currentCompany.primaryContact || '';
  editCompanyForm.elements.phone.value = currentCompany.phone || '';
  editCompanyForm.elements.email.value = currentCompany.email || '';
  editCompanyForm.elements.address.value = currentCompany.address || '';
  editCompanyForm.elements.notes.value = currentCompany.notes || '';
  if (editCompanyError) editCompanyError.textContent = '';
  if (editCompanyModal) editCompanyModal.hidden = false;
};

const closeEditModal = () => {
  if (editCompanyModal) editCompanyModal.hidden = true;
  if (editCompanyError) editCompanyError.textContent = '';
};

const handleEditSubmit = async (event) => {
  event.preventDefault();
  if (!editCompanyForm || !token) return;

  const formData = new FormData(editCompanyForm);
  const body = {
    name: formData.get('name'),
    primaryContact: formData.get('primaryContact') || null,
    phone: formatPhone(formData.get('phone')),
    email: formData.get('email') || null,
    address: formData.get('address') || null,
    notes: formData.get('notes') || null,
  };

  if (editCompanyError) editCompanyError.textContent = '';

  try {
    const response = await fetch(companyApiUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    const result = await response.json();

    if (!response.ok) {
      if (editCompanyError) editCompanyError.textContent = result.error || 'Failed to save changes.';
      return;
    }

    closeEditModal();
    renderCompany(result.company);
  } catch {
    if (editCompanyError) editCompanyError.textContent = 'Unable to reach the server.';
  }
};

// Contact Modal - Functions defined first (no dependencies)
const openAddContactModal = () => {
  editingContactId = null;
  if (contactForm) {
    contactForm.reset();
    contactForm.elements.firstName.value = '';
    contactForm.elements.lastName.value = '';
    contactForm.elements.phone.value = '';
    contactForm.elements.email.value = '';
    contactForm.elements.jobTitle.value = '';
  }
  if (contactModalTitle) contactModalTitle.textContent = 'Add Contact';
  if (contactError) contactError.textContent = '';
  if (contactModal) contactModal.hidden = false;
};

const openEditContactModal = (contact) => {
  editingContactId = contact.id;
  if (contactForm) {
    contactForm.elements.firstName.value = contact.firstName || '';
    contactForm.elements.lastName.value = contact.lastName || '';
    contactForm.elements.phone.value = contact.phone || '';
    contactForm.elements.email.value = contact.email || '';
    contactForm.elements.jobTitle.value = contact.jobTitle || '';
    contactForm.elements.isPrimary.checked = !!contact.isPrimary;
  }
  if (contactModalTitle) contactModalTitle.textContent = 'Edit Contact';
  if (contactError) contactError.textContent = '';
  if (contactModal) contactModal.hidden = false;
};

const closeContactModal = () => {
  if (contactModal) contactModal.hidden = true;
  if (contactError) contactError.textContent = '';
  editingContactId = null;
};

const handleDeleteContact = async (contactId) => {
  if (!token) return;

  try {
    const response = await fetch(`${contactsApiUrl}/${contactId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.ok) {
      // fetchContacts will be defined by the time this runs
      // eslint-disable-next-line no-use-before-define
      fetchContacts();
    } else {
      // eslint-disable-next-line no-alert
      window.alert('Failed to delete contact.');
    }
  } catch {
    // eslint-disable-next-line no-alert
    window.alert('Unable to reach the server.');
  }
};

// Contacts - Render (defined before fetchContacts which calls it)
const renderContacts = (contacts) => {
  currentContacts = contacts;
  if (!contactsList) return;

  if (!contacts.length) {
    contactsList.innerHTML = '<p style="color:var(--muted);text-align:center;padding:2rem;">No contacts yet.</p>';
    return;
  }

  contactsList.innerHTML = contacts.map((contact) => {
    const primaryBadge = contact.isPrimary ? '<span style="color:#f59e0b; margin-left:0.5rem;">★</span>' : '';

    return `
      <div class="contact-item">
        <div class="contact-item-info">
          <p class="contact-item-name">${contact.firstName} ${contact.lastName}${primaryBadge}</p>
          ${contact.email ? `<p class="contact-item-detail">📧 ${contact.email}</p>` : ''}
          ${contact.phone ? `<p class="contact-item-detail">📞 ${contact.phone}</p>` : ''}
          ${contact.jobTitle ? `<p class="contact-item-detail">💼 ${contact.jobTitle}</p>` : ''}
        </div>
        <div class="contact-item-actions">
          <button type="button" class="button secondary small edit-contact-btn" data-contact-id="${contact.id}">Edit</button>
          <button type="button" class="button danger small delete-contact-btn" data-contact-id="${contact.id}">Delete</button>
        </div>
      </div>
    `;
  }).join('');

  // Add event listeners to contact buttons
  document.querySelectorAll('.edit-contact-btn').forEach((btn) => {
    btn.addEventListener('click', ({ target }) => {
      const contactId = parseInt(target.dataset.contactId, 10);
      const contact = currentContacts.find((c) => c.id === contactId);
      if (contact) openEditContactModal(contact);
    });
  });

  document.querySelectorAll('.delete-contact-btn').forEach((btn) => {
    btn.addEventListener('click', ({ target }) => {
      const contactId = parseInt(target.dataset.contactId, 10);
      // eslint-disable-next-line no-alert
      if (window.confirm('Are you sure you want to delete this contact?')) {
        handleDeleteContact(contactId);
      }
    });
  });
};

// Contacts - Fetch
const fetchContacts = async () => {
  if (!companyId || !token) return;

  try {
    const response = await fetch(`${contactsApiUrl}/company/${companyId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('towerPsaToken');
        redirectToLogin();
        return;
      }
      return;
    }

    const result = await response.json();
    renderContacts(result.contacts || []);
  } catch {
    // Silent fail for contacts
  }
};

// Tabs
const switchTab = (tabName) => {
  detailTabButtons.forEach((button) => {
    button.classList.toggle('active', button.dataset.tab === tabName);
  });

  if (contactsTab) contactsTab.classList.toggle('active', tabName === 'contacts');
  if (ticketsTab) ticketsTab.classList.toggle('active', tabName === 'tickets');
  if (notesTab) notesTab.classList.toggle('active', tabName === 'notes');

  if (tabName === 'contacts') {
    fetchContacts();
  } else if (tabName === 'tickets') {
    fetchCompanyTickets();
  }
};

const handleContactSubmit = async (event) => {
  event.preventDefault();
  if (!contactForm || !token || !companyId) return;

  const formData = new FormData(contactForm);
  const body = {
    firstName: formData.get('firstName'),
    lastName: formData.get('lastName'),
    phone: formatPhone(formData.get('phone')),
    email: formData.get('email') || null,
    jobTitle: formData.get('jobTitle') || null,
    isPrimary: contactForm.elements.isPrimary.checked,
  };

  if (editingContactId) {
    body.companyId = companyId;
  } else {
    body.companyId = companyId;
  }

  if (contactError) contactError.textContent = '';

  try {
    const method = editingContactId ? 'PUT' : 'POST';
    const url = editingContactId ? `${contactsApiUrl}/${editingContactId}` : contactsApiUrl;

    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    const result = await response.json();

    if (!response.ok) {
      if (contactError) contactError.textContent = result.error || 'Failed to save contact.';
      return;
    }

    closeContactModal();
    fetchContacts();
  } catch {
    if (contactError) contactError.textContent = 'Unable to reach the server.';
  }
};

// Event listeners
if (editCompanyButton) editCompanyButton.addEventListener('click', openEditModal);
if (closeEditCompanyModal) closeEditCompanyModal.addEventListener('click', closeEditModal);
if (editCompanyForm) editCompanyForm.addEventListener('submit', handleEditSubmit);
if (deleteCompanyButton) deleteCompanyButton.addEventListener('click', openDeleteConfirm);
if (closeDeleteModal) closeDeleteModal.addEventListener('click', closeDeleteConfirm);
if (confirmDeleteOk) confirmDeleteOk.addEventListener('click', handleDeleteConfirm);
if (confirmDeleteCancel) confirmDeleteCancel.addEventListener('click', closeDeleteConfirm);
if (saveCompanySlaButton) saveCompanySlaButton.addEventListener('click', handleSaveCompanySlaAssignment);
if (companySlaPolicySelect) {
  companySlaPolicySelect.addEventListener('change', () => {
    renderCompanySlaHint(companySlaPolicySelect.value, true, true);
  });
}

// Tab event listeners
detailTabButtons.forEach((button) => {
  button.addEventListener('click', (e) => {
    switchTab(e.target.dataset.tab);
  });
});

// Contact modal event listeners
if (addContactButton) addContactButton.addEventListener('click', openAddContactModal);
if (closeContactModalButton) closeContactModalButton.addEventListener('click', closeContactModal);
if (contactForm) contactForm.addEventListener('submit', handleContactSubmit);
if (companyTicketsBody) companyTicketsBody.addEventListener('click', handleCompanyTicketsClick);

if (editCompanyModal) {
  editCompanyModal.addEventListener('click', (event) => {
    if (event.target === editCompanyModal) closeEditModal();
  });
}

if (contactModal) {
  contactModal.addEventListener('click', (event) => {
    if (event.target === contactModal) closeContactModal();
  });
}

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

document.addEventListener('click', handleDocumentClick);
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    closeEditModal();
    closeDeleteConfirm();
    closeContactModal();
    if (profileDropdown) profileDropdown.hidden = true;
    if (manageDropdown) manageDropdown.hidden = true;
  }
});

// Boot
if (!token) {
  redirectToLogin();
} else {
  showProfileMenu();
  fetchSlaPolicies();
  fetchCompany();
  fetchContacts(); // Load contacts on initial page load (Contacts tab is default)
}
