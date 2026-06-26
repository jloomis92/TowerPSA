// DOM Elements
const userForm = document.querySelector('#user-form');
const userTableBody = document.querySelector('#user-table-body');
const userFormError = document.querySelector('#user-form-error');
const addUserButton = document.querySelector('#add-user-button');
const userFormModal = document.querySelector('#user-form-modal');
const closeFormModalButton = document.querySelector('#close-form-modal');
const formModalTitle = document.querySelector('#form-modal-title');
const passwordInput = document.querySelector('#password');
const passwordHint = document.querySelector('#password-hint');
const manageMenu = document.querySelector('.manage-menu');
const manageButton = document.querySelector('#manage-button');
const manageDropdown = document.querySelector('#manage-dropdown');
const profileMenu = document.querySelector('.profile-menu');
const profileButton = document.querySelector('#profile-button');
const profileDropdown = document.querySelector('#profile-dropdown');
const profileInitials = document.querySelector('#profile-initials');
const logoutButton = document.querySelector('#logout-button');
const viewProfileButton = document.querySelector('#view-profile-button');
const deleteConfirmModal = document.querySelector('#delete-confirm-modal');
const confirmDeleteOk = document.querySelector('#confirm-delete-ok');
const confirmDeleteCancel = document.querySelector('#confirm-delete-cancel');
const resetMfaConfirmModal = document.querySelector('#reset-mfa-confirm-modal');
const confirmResetMfaOk = document.querySelector('#confirm-reset-mfa-ok');
const confirmResetMfaCancel = document.querySelector('#confirm-reset-mfa-cancel');
const resetMfaConfirmMessage = document.querySelector('#reset-mfa-confirm-message');

// Auth Data
const token = localStorage.getItem('towerPsaToken');
const userName = localStorage.getItem('towerPsaUserName') || '';
const userRole = localStorage.getItem('towerPsaUserRole') || '';
const userApiUrl = '/api/users';

// State
let editingUserId = null;
let usersCache = [];

// Helper Functions
const redirectToLogin = () => {
  window.location.href = 'login.html';
};

const setUserFormError = (message) => {
  if (userFormError) {
    userFormError.textContent = message;
  }
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

// Dropdown Functions
const toggleManageDropdown = () => {
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

const closeProfileDropdown = () => {
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

  closeProfileDropdown();

  if (manageMenu && manageMenu.contains(event.target)) {
    return;
  }

  closeManageDropdown();
};

// Modal Functions
const openUserFormModal = (user = null) => {
  if (!userFormModal || !userForm) {
    return;
  }

  editingUserId = null;
  userForm.reset();
  setUserFormError('');

  if (user) {
    editingUserId = user.id;

    // Split name into first and last
    const nameParts = (user.name || '').split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    userForm.querySelector('#firstName').value = firstName;
    userForm.querySelector('#lastName').value = lastName;
    userForm.querySelector('#email').value = user.email;
    const roleRadio = userForm.querySelector(`input[name="role"][value="${user.role}"]`);
    if (roleRadio) roleRadio.checked = true;
    passwordInput.value = '';
    passwordInput.required = false;
    if (passwordHint) {
      passwordHint.hidden = false;
    }

    if (formModalTitle) {
      formModalTitle.textContent = 'Edit User';
    }

    const submitButton = userForm.querySelector('button[type="submit"]');
    if (submitButton) {
      submitButton.textContent = 'Update User';
    }
  } else {
    passwordInput.required = true;
    if (passwordHint) {
      passwordHint.hidden = true;
    }

    if (formModalTitle) {
      formModalTitle.textContent = 'New User';
    }

    const submitButton = userForm.querySelector('button[type="submit"]');
    if (submitButton) {
      submitButton.textContent = 'Add User';
    }
  }

  userFormModal.hidden = false;
};

const closeUserFormModal = () => {
  if (userFormModal) {
    userFormModal.hidden = true;
  }
};

// Table Functions
const renderUsers = (users) => {
  usersCache = users;

  if (!userTableBody) {
    return;
  }

  if (users.length === 0) {
    userTableBody.innerHTML = '<tr><td colspan="5">No users available.</td></tr>';
    return;
  }

  userTableBody.innerHTML = users
    .map(
      (user) => `
    <tr class="ticket-row" data-user-id="${user.id}" role="button" tabindex="0" aria-label="View ${user.name}">
      <td>${user.name}</td>
      <td>${user.email}</td>
      <td>${user.role}</td>
      <td>${user.mfaEnabled ? 'Yes' : 'No'}</td>
      <td>
        <div class="user-actions">
          <button type="button" data-action="edit" data-id="${user.id}" class="button secondary">Edit</button>
          <button
            type="button"
            data-action="reset-mfa"
            data-id="${user.id}"
            class="button secondary"
            ${user.mfaEnabled ? '' : 'disabled'}
          >Reset MFA</button>
          <button type="button" data-action="delete" data-id="${user.id}" class="button secondary">Delete</button>
        </div>
      </td>
    </tr>
  `,
    )
    .join('');
};

const fetchUsers = async () => {
  try {
    const response = await fetch(userApiUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('towerPsaToken');
        redirectToLogin();
        return;
      }

      setUserFormError('Unable to load users.');
      return;
    }

    const result = await response.json();
    renderUsers(result.users);
  } catch (error) {
    setUserFormError('Unable to reach the server.');
  }
};

// Form Functions
const handleUserFormSubmit = async (event) => {
  event.preventDefault();
  setUserFormError('');

  const formData = new FormData(userForm);
  const firstName = formData.get('firstName')?.toString().trim();
  const lastName = formData.get('lastName')?.toString().trim();
  const email = formData.get('email')?.toString().trim();
  const role = formData.get('role')?.toString();
  const password = formData.get('password')?.toString();

  if (!firstName || !email || !role) {
    setUserFormError('First name, email, and role are required.');
    return;
  }

  if (!editingUserId && !password) {
    setUserFormError('Password is required for new users.');
    return;
  }

  try {
    const method = editingUserId ? 'PUT' : 'POST';
    const url = editingUserId ? `${userApiUrl}/${editingUserId}` : userApiUrl;

    // Combine first and last name
    const name = lastName ? `${firstName} ${lastName}` : firstName;

    const payload = { name, email, role };

    if (!editingUserId || password) {
      payload.password = password;
    }

    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();
    if (!response.ok) {
      setUserFormError(result.error || 'Failed to save user.');
      return;
    }

    closeUserFormModal();
    fetchUsers();
  } catch (error) {
    setUserFormError('Unable to reach the server.');
  }
};

const handleUserTableClick = async (event) => {
  const button = event.target.closest('button');
  if (!button) {
    const row = event.target.closest('tr[data-user-id]');
    if (row) {
      window.location.href = `user-detail.html?id=${row.dataset.userId}`;
    }
    return;
  }

  const { action, id } = button.dataset;

  if (action === 'reset-mfa') {
    const user = usersCache.find((item) => item.id === id);
    if (!user) {
      return;
    }

    if (!resetMfaConfirmModal || !confirmResetMfaOk || !confirmResetMfaCancel) {
      return;
    }

    if (resetMfaConfirmMessage) {
      resetMfaConfirmMessage.textContent = `Reset MFA for ${user.name}? They will need to reconfigure MFA at next login.`;
    }

    resetMfaConfirmModal.hidden = false;

    const onConfirm = async () => {
      cleanup(); // eslint-disable-line no-use-before-define
      try {
        const response = await fetch(`${userApiUrl}/${id}/reset-mfa`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const result = await response.json();
        if (!response.ok) {
          setUserFormError(result.error || 'Unable to reset MFA.');
          return;
        }

        fetchUsers();
      } catch {
        setUserFormError('Unable to reach the server.');
      }
    };

    const onCancel = () => cleanup(); // eslint-disable-line no-use-before-define
    // eslint-disable-next-line no-use-before-define
    const onBackdrop = (e) => { if (e.target === resetMfaConfirmModal) cleanup(); };

    const cleanup = () => {
      resetMfaConfirmModal.hidden = true;
      confirmResetMfaOk.removeEventListener('click', onConfirm);
      confirmResetMfaCancel.removeEventListener('click', onCancel);
      resetMfaConfirmModal.removeEventListener('click', onBackdrop);
    };

    confirmResetMfaOk.addEventListener('click', onConfirm);
    confirmResetMfaCancel.addEventListener('click', onCancel);
    resetMfaConfirmModal.addEventListener('click', onBackdrop);

    return;
  }

  if (action === 'edit') {
    const user = usersCache.find((item) => item.id === id);
    if (user) {
      openUserFormModal(user);
    }
    return;
  }

  if (action === 'delete') {
    if (!deleteConfirmModal || !confirmDeleteOk || !confirmDeleteCancel) {
      return;
    }

    deleteConfirmModal.hidden = false;

    const onConfirm = async () => {
      cleanup(); // eslint-disable-line no-use-before-define
      try {
        const response = await fetch(`${userApiUrl}/${id}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          setUserFormError('Unable to delete user.');
          return;
        }

        fetchUsers();
      } catch {
        setUserFormError('Unable to reach the server.');
      }
    };

    const onCancel = () => cleanup(); // eslint-disable-line no-use-before-define
    // eslint-disable-next-line no-use-before-define
    const onBackdrop = (e) => { if (e.target === deleteConfirmModal) cleanup(); };

    const cleanup = () => {
      deleteConfirmModal.hidden = true;
      confirmDeleteOk.removeEventListener('click', onConfirm);
      confirmDeleteCancel.removeEventListener('click', onCancel);
      deleteConfirmModal.removeEventListener('click', onBackdrop);
    };

    confirmDeleteOk.addEventListener('click', onConfirm);
    confirmDeleteCancel.addEventListener('click', onCancel);
    deleteConfirmModal.addEventListener('click', onBackdrop);
  }
};

const handleLogout = () => {
  localStorage.removeItem('towerPsaToken');
  redirectToLogin();
};

const handleViewProfile = () => {
  window.location.href = 'profile.html';
};

// Initialize
if (!token) {
  redirectToLogin();
}

if (userRole !== 'admin') {
  redirectToLogin();
}

// Event Listeners
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
  manageButton.addEventListener('click', toggleManageDropdown);
}

if (addUserButton) {
  addUserButton.addEventListener('click', () => {
    openUserFormModal();
  });
}

if (closeFormModalButton) {
  closeFormModalButton.addEventListener('click', closeUserFormModal);
}

if (userFormModal) {
  userFormModal.addEventListener('click', (event) => {
    if (event.target === userFormModal) {
      closeUserFormModal();
    }
  });
}

if (userForm) {
  userForm.addEventListener('submit', handleUserFormSubmit);
}

if (userTableBody) {
  userTableBody.addEventListener('click', handleUserTableClick);
  userTableBody.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') {
      return;
    }

    const row = event.target.closest('tr[data-user-id]');
    if (!row) {
      return;
    }

    if (event.target.closest('button')) {
      return;
    }

    event.preventDefault();
    window.location.href = `user-detail.html?id=${row.dataset.userId}`;
  });
}

document.addEventListener('click', handleDocumentClick);

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    closeUserFormModal();
    closeProfileDropdown();
    closeManageDropdown();
    if (deleteConfirmModal) deleteConfirmModal.hidden = true;
  }
});

// Load initial data
showProfileMenu();
fetchUsers();
