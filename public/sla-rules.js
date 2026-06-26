const pageError = document.querySelector('#page-error');
const tableBody = document.querySelector('#sla-rule-table-body');
const addSlaRuleButton = document.querySelector('#add-sla-rule-button');
const modal = document.querySelector('#sla-rule-modal');
const closeModalButton = document.querySelector('#close-sla-rule-modal');
const form = document.querySelector('#sla-rule-form');
const formError = document.querySelector('#sla-rule-form-error');
const modalTitle = document.querySelector('#sla-rule-modal-title');
const ruleNameInput = document.querySelector('#sla-rule-name');
const defaultHint = document.querySelector('#sla-rule-default-hint');

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

const slaPoliciesApiUrl = '/api/sla-policies';
const defaultSlaPolicyName = 'Default SLA';

let editingPolicyId = null;
let editingIsDefault = false;
let policiesCache = [];

const redirectToLogin = () => {
  window.location.href = 'login.html';
};

const setPageError = (message) => {
  if (pageError) pageError.textContent = message;
};

const setFormError = (message) => {
  if (formError) formError.textContent = message;
};

const isDefaultPolicy = (policy) => policy.name === defaultSlaPolicyName;

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

const toggleManageDropdown = () => {
  if (!manageDropdown || !manageButton) return;
  const isOpen = !manageDropdown.hidden;
  manageDropdown.hidden = isOpen;
  manageButton.setAttribute('aria-expanded', String(!isOpen));
};

const toggleProfileDropdown = () => {
  if (!profileDropdown || !profileButton) return;
  const isOpen = !profileDropdown.hidden;
  profileDropdown.hidden = isOpen;
  profileButton.setAttribute('aria-expanded', String(!isOpen));
};

const closeDropdowns = () => {
  if (profileDropdown && profileButton) {
    profileDropdown.hidden = true;
    profileButton.setAttribute('aria-expanded', 'false');
  }

  if (manageDropdown && manageButton) {
    manageDropdown.hidden = true;
    manageButton.setAttribute('aria-expanded', 'false');
  }
};

const handleDocumentClick = (event) => {
  if (profileMenu && profileMenu.contains(event.target)) return;
  if (manageMenu && manageMenu.contains(event.target)) return;
  closeDropdowns();
};

const renderPolicies = (policies) => {
  policiesCache = policies;

  if (!tableBody) return;

  if (!policies.length) {
    tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--muted);padding:2rem;">No SLA rules found.</td></tr>';
    return;
  }

  tableBody.innerHTML = policies.map((policy) => {
    const isDefault = isDefaultPolicy(policy);

    return `
      <tr>
        <td><strong>${policy.name}</strong></td>
        <td>${policy.responseMinutes} min</td>
        <td>${policy.resolutionMinutes} min</td>
        <td>${isDefault ? 'Yes' : 'No'}</td>
        <td>
          <div class="user-actions">
            <button type="button" class="button secondary" data-action="edit" data-policy-id="${policy.id}">Edit</button>
            <button type="button" class="button secondary" data-action="delete" data-policy-id="${policy.id}" ${isDefault ? 'disabled' : ''}>Delete</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
};

const fetchPolicies = async () => {
  try {
    const response = await fetch(slaPoliciesApiUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('towerPsaToken');
        redirectToLogin();
        return;
      }
      setPageError('Unable to load SLA rules.');
      return;
    }

    const result = await response.json();
    renderPolicies(result.policies || []);
  } catch {
    setPageError('Unable to reach the server.');
  }
};

const openAddModal = () => {
  editingPolicyId = null;
  editingIsDefault = false;
  if (modalTitle) modalTitle.textContent = 'Add SLA Rule';
  if (form) form.reset();
  if (ruleNameInput) ruleNameInput.disabled = false;
  if (defaultHint) {
    defaultHint.hidden = true;
    defaultHint.textContent = '';
  }
  setFormError('');
  if (modal) modal.hidden = false;
};

const openEditModal = (policy) => {
  editingPolicyId = policy.id;
  editingIsDefault = isDefaultPolicy(policy);
  if (modalTitle) modalTitle.textContent = 'Edit SLA Rule';
  if (form) {
    form.elements.name.value = policy.name;
    form.elements.responseMinutes.value = policy.responseMinutes;
    form.elements.resolutionMinutes.value = policy.resolutionMinutes;
  }

  if (ruleNameInput) {
    ruleNameInput.disabled = editingIsDefault;
  }

  if (defaultHint) {
    defaultHint.hidden = !editingIsDefault;
    defaultHint.textContent = editingIsDefault
      ? 'Default SLA name is locked. You can still modify response and resolution times.'
      : '';
  }

  setFormError('');
  if (modal) modal.hidden = false;
};

const closeModal = () => {
  if (modal) modal.hidden = true;
  editingPolicyId = null;
  editingIsDefault = false;
  setFormError('');
};

const handleFormSubmit = async (event) => {
  event.preventDefault();

  if (!form) return;

  const formData = new FormData(form);
  const body = {
    name: formData.get('name')?.toString().trim(),
    responseMinutes: Number(formData.get('responseMinutes')),
    resolutionMinutes: Number(formData.get('resolutionMinutes')),
  };

  if (!body.name || body.responseMinutes <= 0 || body.resolutionMinutes <= 0) {
    setFormError('Name, response minutes, and resolution minutes are required.');
    return;
  }

  try {
    const method = editingPolicyId ? 'PUT' : 'POST';
    const url = editingPolicyId ? `${slaPoliciesApiUrl}/${editingPolicyId}` : slaPoliciesApiUrl;

    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    const result = response.status === 204 ? {} : await response.json();
    if (!response.ok) {
      setFormError(result.error || 'Unable to save SLA rule.');
      return;
    }

    closeModal();
    fetchPolicies();
  } catch {
    setFormError('Unable to reach the server.');
  }
};

const handleTableClick = async (event) => {
  const button = event.target.closest('button[data-action]');
  if (!button) return;

  const policyId = Number(button.dataset.policyId);
  const policy = policiesCache.find((item) => item.id === policyId);
  if (!policy) return;

  if (button.dataset.action === 'edit') {
    openEditModal(policy);
    return;
  }

  if (button.dataset.action === 'delete') {
    // eslint-disable-next-line no-alert
    const shouldDelete = window.confirm('Delete this SLA rule? Existing ticket snapshots are preserved.');
    if (!shouldDelete) return;

    try {
      const response = await fetch(`${slaPoliciesApiUrl}/${policyId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const result = response.status === 204 ? {} : await response.json();
        // eslint-disable-next-line no-alert
        window.alert(result.error || 'Failed to delete SLA rule.');
        return;
      }

      fetchPolicies();
    } catch {
      // eslint-disable-next-line no-alert
      window.alert('Unable to reach the server.');
    }
  }
};

if (!token || userRole !== 'admin') {
  redirectToLogin();
} else {
  showProfileMenu();
  fetchPolicies();
}

if (logoutButton) {
  logoutButton.addEventListener('click', () => {
    localStorage.removeItem('towerPsaToken');
    redirectToLogin();
  });
}

if (viewProfileButton) {
  viewProfileButton.addEventListener('click', () => {
    window.location.href = 'profile.html';
  });
}

if (profileButton) profileButton.addEventListener('click', toggleProfileDropdown);
if (manageButton) manageButton.addEventListener('click', toggleManageDropdown);
if (addSlaRuleButton) addSlaRuleButton.addEventListener('click', openAddModal);
if (closeModalButton) closeModalButton.addEventListener('click', closeModal);
if (form) form.addEventListener('submit', handleFormSubmit);
if (tableBody) tableBody.addEventListener('click', handleTableClick);

if (modal) {
  modal.addEventListener('click', (event) => {
    if (event.target === modal) {
      closeModal();
    }
  });
}

document.addEventListener('click', handleDocumentClick);
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    closeModal();
    closeDropdowns();
  }
});
