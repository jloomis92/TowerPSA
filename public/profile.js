// DOM Elements
const profileName = document.querySelector('#profile-name');
const profileEmail = document.querySelector('#profile-email');
const profileRole = document.querySelector('#profile-role');
const profileRoleDisplay = document.querySelector('#profile-role-display');
const avatarInitials = document.querySelector('#avatar-initials');
const profileInitials = document.querySelector('#profile-initials');

const profileMenu = document.querySelector('.profile-menu');
const profileButton = document.querySelector('#profile-button');
const profileDropdown = document.querySelector('#profile-dropdown');
const logoutButton = document.querySelector('#logout-button');
const viewProfileButton = document.querySelector('#view-profile-button');

const manageMenu = document.querySelector('.manage-menu');
const manageButton = document.querySelector('#manage-button');
const manageDropdown = document.querySelector('#manage-dropdown');

const changePasswordButton = document.querySelector('#change-password-button');
const changePasswordModal = document.querySelector('#change-password-modal');
const closePasswordModalButton = document.querySelector('#close-password-modal');
const changePasswordForm = document.querySelector('#change-password-form');
const passwordFormError = document.querySelector('#password-form-error');
const setupMfaButton = document.querySelector('#setup-mfa-button');
const mfaStatus = document.querySelector('#mfa-status');
const mfaSetupModal = document.querySelector('#mfa-setup-modal');
const closeMfaModalButton = document.querySelector('#close-mfa-modal');
const mfaSetupForm = document.querySelector('#mfa-setup-form');
const mfaSecretInput = document.querySelector('#mfa-secret');
const mfaQrCodeImage = document.querySelector('#mfa-qr-code');
const mfaCodeInput = document.querySelector('#mfa-code');
const mfaFormError = document.querySelector('#mfa-form-error');

// Auth Data
const token = localStorage.getItem('towerPsaToken');
const userName = localStorage.getItem('towerPsaUserName') || '';
const userEmail = localStorage.getItem('towerPsaUserEmail') || '';
const userRole = localStorage.getItem('towerPsaUserRole') || '';

// Helper Functions
const redirectToLogin = () => {
  window.location.href = 'login.html';
};

const setPasswordFormError = (message) => {
  if (passwordFormError) {
    passwordFormError.textContent = message;
  }
};

const setMfaFormError = (message) => {
  if (mfaFormError) {
    mfaFormError.textContent = message;
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

const populateProfileData = () => {
  if (profileName) {
    profileName.textContent = userName || 'User';
  }

  if (profileEmail) {
    profileEmail.textContent = userEmail || 'Not available';
  }

  if (profileRole) {
    profileRole.textContent = (userRole || 'user').charAt(0).toUpperCase() + (userRole || 'user').slice(1);
  }

  if (profileRoleDisplay) {
    profileRoleDisplay.textContent = (userRole || 'user').charAt(0).toUpperCase() + (userRole || 'user').slice(1);
  }

  if (avatarInitials) {
    const initials = userName
      .split(' ')
      .filter(Boolean)
      .map((part) => part[0].toUpperCase())
      .slice(0, 2)
      .join('');

    avatarInitials.textContent = initials || 'U';
  }
};

// Modal Functions
const openChangePasswordModal = () => {
  if (!changePasswordModal) {
    return;
  }

  changePasswordModal.hidden = false;
  changePasswordForm.reset();
  setPasswordFormError('');
};

const closeChangePasswordModal = () => {
  if (!changePasswordModal) {
    return;
  }

  changePasswordModal.hidden = true;
  setPasswordFormError('');
};

const loadMfaStatus = async () => {
  if (!token) return;

  try {
    const response = await fetch('/api/profile/mfa/status', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      if (mfaStatus) mfaStatus.textContent = 'Unavailable';
      return;
    }

    const result = await response.json();
    if (mfaStatus) {
      mfaStatus.textContent = result.mfaEnabled ? 'Enabled' : 'Not enabled';
    }
    if (setupMfaButton) {
      setupMfaButton.textContent = result.mfaEnabled ? 'Reconfigure MFA' : 'Set Up MFA';
    }
  } catch {
    if (mfaStatus) mfaStatus.textContent = 'Unavailable';
  }
};

const openMfaSetupModal = async () => {
  if (!mfaSetupModal || !mfaSecretInput || !mfaCodeInput || !mfaQrCodeImage) return;

  setMfaFormError('');
  mfaSecretInput.value = '';
  mfaQrCodeImage.src = '';
  mfaCodeInput.value = '';

  try {
    const response = await fetch('/api/profile/mfa/setup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({}),
    });

    const result = await response.json();
    if (!response.ok) {
      setMfaFormError(result.message || 'Unable to start MFA setup.');
      return;
    }

    mfaSecretInput.value = result.secret || '';
    mfaQrCodeImage.src = result.qrCodeDataUrl || '';
    mfaSetupModal.hidden = false;
    mfaCodeInput.focus();
  } catch {
    setMfaFormError('Unable to reach the server.');
  }
};

const closeMfaSetupModal = () => {
  if (!mfaSetupModal) return;
  mfaSetupModal.hidden = true;
  setMfaFormError('');
};

// Dropdown Functions
const toggleProfileDropdown = () => {
  if (!profileDropdown || !profileButton) {
    return;
  }

  const isOpen = !profileDropdown.hidden;
  profileDropdown.hidden = isOpen;
  profileButton.setAttribute('aria-expanded', String(!isOpen));
};

const toggleManageDropdown = () => {
  if (!manageDropdown || !manageButton) {
    return;
  }

  const isOpen = !manageDropdown.hidden;
  manageDropdown.hidden = isOpen;
  manageButton.setAttribute('aria-expanded', String(!isOpen));
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

// Event Handlers
const handleLogout = () => {
  localStorage.removeItem('towerPsaToken');
  closeProfileDropdown();
  redirectToLogin();
};

const handleViewProfile = () => {
  // Already on profile page
  closeProfileDropdown();
};

const handleChangePasswordSubmit = async (event) => {
  event.preventDefault();
  setPasswordFormError('');

  const formData = new FormData(changePasswordForm);
  const currentPassword = formData.get('currentPassword')?.toString().trim();
  const newPassword = formData.get('newPassword')?.toString().trim();
  const confirmPassword = formData.get('confirmPassword')?.toString().trim();

  if (!currentPassword || !newPassword || !confirmPassword) {
    setPasswordFormError('All fields are required.');
    return;
  }

  if (newPassword !== confirmPassword) {
    setPasswordFormError('New passwords do not match.');
    return;
  }

  if (newPassword.length < 6) {
    setPasswordFormError('New password must be at least 6 characters long.');
    return;
  }

  try {
    const response = await fetch('/api/profile/change-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        currentPassword,
        newPassword,
      }),
    });

    if (!response.ok) {
      const data = await response.json();
      setPasswordFormError(data.message || 'Unable to change password.');
      return;
    }

    closeChangePasswordModal();
    localStorage.removeItem('towerPsaToken');
    localStorage.removeItem('towerPsaUserName');
    localStorage.removeItem('towerPsaUserEmail');
    localStorage.removeItem('towerPsaUserRole');

    // eslint-disable-next-line no-alert
    alert('Password changed successfully! Please log back in with your new password.');
    redirectToLogin();
  } catch {
    setPasswordFormError('Unable to reach the server.');
  }
};

const handleMfaSetupSubmit = async (event) => {
  event.preventDefault();
  setMfaFormError('');

  const formData = new FormData(mfaSetupForm);
  const code = formData.get('code')?.toString().trim().replace(/\s+/g, '');

  if (!code) {
    setMfaFormError('Verification code is required.');
    return;
  }

  try {
    const response = await fetch('/api/profile/mfa/enable', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ code }),
    });

    const result = await response.json();
    if (!response.ok) {
      setMfaFormError(result.message || 'Unable to enable MFA.');
      return;
    }

    closeMfaSetupModal();
    await loadMfaStatus();
  } catch {
    setMfaFormError('Unable to reach the server.');
  }
};

// Initialize
if (!token) {
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

if (changePasswordButton) {
  changePasswordButton.addEventListener('click', openChangePasswordModal);
}

if (closePasswordModalButton) {
  closePasswordModalButton.addEventListener('click', closeChangePasswordModal);
}

if (changePasswordModal) {
  changePasswordModal.addEventListener('click', (event) => {
    if (event.target === changePasswordModal) {
      closeChangePasswordModal();
    }
  });
}

if (changePasswordForm) {
  changePasswordForm.addEventListener('submit', handleChangePasswordSubmit);
}

if (setupMfaButton) {
  setupMfaButton.addEventListener('click', openMfaSetupModal);
}

if (closeMfaModalButton) {
  closeMfaModalButton.addEventListener('click', closeMfaSetupModal);
}

if (mfaSetupModal) {
  mfaSetupModal.addEventListener('click', (event) => {
    if (event.target === mfaSetupModal) {
      closeMfaSetupModal();
    }
  });
}

if (mfaSetupForm) {
  mfaSetupForm.addEventListener('submit', handleMfaSetupSubmit);
}

document.addEventListener('click', handleDocumentClick);

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    closeChangePasswordModal();
    closeProfileDropdown();
    closeManageDropdown();
  }
});

// Load initial data
showProfileMenu();
populateProfileData();
loadMfaStatus();
