// DOM Elements
const companyTableBody = document.querySelector('#company-table-body');
const pageError = document.querySelector('#page-error');
const addCompanyButton = document.querySelector('#add-company-button');
const companySearch = document.querySelector('#company-search');
const companyModal = document.querySelector('#company-modal');
const companyModalTitle = document.querySelector('#company-modal-title');
const closeCompanyModal = document.querySelector('#close-company-modal');
const companyForm = document.querySelector('#company-form');
const companyFormError = document.querySelector('#company-form-error');
const companyFormSubmit = document.querySelector('#company-form-submit');
const manageMenu = document.querySelector('.manage-menu');
const manageButton = document.querySelector('#manage-button');
const manageDropdown = document.querySelector('#manage-dropdown');
const profileMenu = document.querySelector('.profile-menu');
const profileButton = document.querySelector('#profile-button');
const profileDropdown = document.querySelector('#profile-dropdown');
const profileInitials = document.querySelector('#profile-initials');
const logoutButton = document.querySelector('#logout-button');
const viewProfileButton = document.querySelector('#view-profile-button');

// Auth
const token = localStorage.getItem('towerPsaToken');
const userName = localStorage.getItem('towerPsaUserName') || '';
const userRole = localStorage.getItem('towerPsaUserRole') || '';
const companyApiUrl = '/api/companies';

// State
let editingCompanyId = null;

// Helpers
const redirectToLogin = () => { window.location.href = 'login.html'; };

const formatPhone = (raw) => {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 10) return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  if (digits.length === 11 && digits[0] === '1') return `${digits.slice(1, 4)}-${digits.slice(4, 7)}-${digits.slice(7)}`;
  return raw.trim() || null;
};

const setPageError = (message) => {
  if (pageError) pageError.textContent = message;
};

const setFormError = (message) => {
  if (companyFormError) companyFormError.textContent = message;
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
let allCompaniesList = [];

const renderCompanies = (companies) => {
  if (!companyTableBody) return;

  if (!companies.length) {
    companyTableBody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align:center;color:var(--muted);padding:3rem;">No companies found.</td>
      </tr>`;
    return;
  }

  companyTableBody.innerHTML = companies.map((company) => `
    <tr class="ticket-row" data-company-id="${company.id}" role="button" tabindex="0" aria-label="View ${company.name}">
      <td><strong>${company.name}</strong></td>
      <td>${company.primaryContact || '—'}</td>
      <td>${company.phone || '—'}</td>
      <td>${company.email || '—'}</td>
      <td>${company.address || '—'}</td>
    </tr>
  `).join('');
};

// Fetch
const fetchCompanies = async () => {
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
      const result = await response.json();
      setPageError(result.error || 'Unable to load companies.');
      return;
    }

    const result = await response.json();
    allCompaniesList = result.companies;
    renderCompanies(allCompaniesList);
  } catch {
    setPageError('Unable to reach the server.');
  }
};

// Modal helpers
const openAddModal = () => {
  editingCompanyId = null;
  if (companyModalTitle) companyModalTitle.textContent = 'Add Company';
  if (companyFormSubmit) companyFormSubmit.textContent = 'Add Company';
  if (companyForm) companyForm.reset();
  setFormError('');
  if (companyModal) {
    companyModal.hidden = false;
    document.querySelector('#company-name')?.focus();
  }
};

const closeModal = () => {
  if (companyModal) companyModal.hidden = true;
  editingCompanyId = null;
  setFormError('');
};

// Form submit
const handleFormSubmit = async (event) => {
  event.preventDefault();
  if (!companyForm || !token) return;

  const formData = new FormData(companyForm);
  const body = {
    name: formData.get('name'),
    primaryContact: formData.get('primaryContact') || null,
    phone: formatPhone(formData.get('phone')),
    email: formData.get('email') || null,
    address: formData.get('address') || null,
    notes: formData.get('notes') || null,
  };

  setFormError('');

  const url = editingCompanyId ? `${companyApiUrl}/${editingCompanyId}` : companyApiUrl;
  const method = editingCompanyId ? 'PUT' : 'POST';

  try {
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
      setFormError(result.error || 'Failed to save company.');
      return;
    }

    // eslint-disable-next-line no-console
    console.log('Company created:', result.company);

    // If creating a new company with a primary contact, add that contact to the contacts list
    if (!editingCompanyId && body.primaryContact && result.company) {
      try {
        // eslint-disable-next-line no-console
        console.log('Creating contact for company ID:', result.company.id);

        const nameParts = body.primaryContact.trim().split(' ').filter(Boolean);
        if (nameParts.length === 0) {
          throw new Error('Invalid primary contact name');
        }

        const firstName = nameParts[0];
        const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : firstName;

        const contactBody = {
          companyId: result.company.id,
          firstName,
          lastName,
          phone: body.phone || null,
          email: body.email || null,
          jobTitle: null,
          isPrimary: true,
        };

        // eslint-disable-next-line no-console
        console.log('Contact body:', contactBody);

        const contactResponse = await fetch('/api/contacts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(contactBody),
        });

        // eslint-disable-next-line no-console
        console.log('Contact response status:', contactResponse.status);

        if (!contactResponse.ok) {
          const contactError = await contactResponse.json();
          // eslint-disable-next-line no-console
          console.error('Failed to create contact:', contactError);
        } else {
          const contactResult = await contactResponse.json();
          // eslint-disable-next-line no-console
          console.log('Contact created successfully:', contactResult);
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error creating contact:', error);
      }
    } else {
      // eslint-disable-next-line no-console
      console.log('Skipping contact creation:', {
        isEditing: !!editingCompanyId,
        hasPrimaryContact: !!body.primaryContact,
        hasCompany: !!result.company,
      });
    }

    closeModal();
    fetchCompanies();
  } catch {
    setFormError('Unable to reach the server.');
  }
};

// Delete
// (Moved to company-detail.js — admin only)

// Table action delegation
if (companyTableBody) {
  companyTableBody.addEventListener('click', (event) => {
    const row = event.target.closest('.ticket-row');
    if (row) window.location.href = `company-detail.html?id=${row.dataset.companyId}`;
  });

  companyTableBody.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      const row = event.target.closest('.ticket-row');
      if (row) window.location.href = `company-detail.html?id=${row.dataset.companyId}`;
    }
  });
}

// Event listeners
if (addCompanyButton) addCompanyButton.addEventListener('click', openAddModal);

if (companySearch) {
  companySearch.addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();
    const filtered = allCompaniesList.filter((c) => (
      c.name.toLowerCase().includes(term)
      || (c.primaryContact || '').toLowerCase().includes(term)
      || (c.phone || '').toLowerCase().includes(term)
      || (c.email || '').toLowerCase().includes(term)
    ));
    renderCompanies(filtered);
  });
}
if (closeCompanyModal) closeCompanyModal.addEventListener('click', closeModal);
if (companyForm) companyForm.addEventListener('submit', handleFormSubmit);

if (companyModal) {
  companyModal.addEventListener('click', (event) => {
    if (event.target === companyModal) closeModal();
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
    closeModal();
    if (profileDropdown) profileDropdown.hidden = true;
    if (manageDropdown) manageDropdown.hidden = true;
  }
});

// Boot
if (!token) {
  redirectToLogin();
} else {
  showProfileMenu();
  fetchCompanies();
}
