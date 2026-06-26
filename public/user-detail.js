const manageMenu = document.querySelector('.manage-menu');
const manageButton = document.querySelector('#manage-button');
const manageDropdown = document.querySelector('#manage-dropdown');
const profileMenu = document.querySelector('.profile-menu');
const profileButton = document.querySelector('#profile-button');
const profileDropdown = document.querySelector('#profile-dropdown');
const profileInitials = document.querySelector('#profile-initials');
const logoutButton = document.querySelector('#logout-button');
const viewProfileButton = document.querySelector('#view-profile-button');

const userDetailShell = document.querySelector('#user-detail-shell');
const userLoadError = document.querySelector('#user-load-error');
const userAvatarInitials = document.querySelector('#user-avatar-initials');
const userNameEl = document.querySelector('#user-name');
const userRoleDisplay = document.querySelector('#user-role-display');
const userEmailEl = document.querySelector('#user-email');
const userRoleEl = document.querySelector('#user-role');
const userMfaEnabledEl = document.querySelector('#user-mfa-enabled');
const userCreatedAtEl = document.querySelector('#user-created-at');

const token = localStorage.getItem('towerPsaToken');
const userName = localStorage.getItem('towerPsaUserName') || '';
const userRole = localStorage.getItem('towerPsaUserRole') || '';

const params = new URLSearchParams(window.location.search);
const targetUserId = params.get('id');

const redirectToLogin = () => {
  window.location.href = 'login.html';
};

const setPageError = (message) => {
  if (userLoadError) {
    userLoadError.textContent = message;
    userLoadError.hidden = false;
  }
};

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
};

const initialsFromName = (name) => name
  .split(' ')
  .filter(Boolean)
  .map((part) => part[0].toUpperCase())
  .slice(0, 2)
  .join('') || 'U';

const showProfileMenu = () => {
  if (profileMenu) profileMenu.hidden = false;

  if (profileInitials) {
    profileInitials.textContent = initialsFromName(userName);
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

const handleLogout = () => {
  localStorage.removeItem('towerPsaToken');
  localStorage.removeItem('towerPsaUserName');
  localStorage.removeItem('towerPsaUserEmail');
  localStorage.removeItem('towerPsaUserRole');
  redirectToLogin();
};

const handleViewProfile = () => {
  window.location.href = 'profile.html';
};

const renderUser = (user) => {
  if (userNameEl) userNameEl.textContent = user.name || 'User';
  if (userRoleDisplay) userRoleDisplay.textContent = user.role || 'user';
  if (userEmailEl) userEmailEl.textContent = user.email || '—';
  if (userRoleEl) userRoleEl.textContent = user.role || '—';
  if (userMfaEnabledEl) userMfaEnabledEl.textContent = user.mfaEnabled ? 'Yes' : 'No';
  if (userCreatedAtEl) userCreatedAtEl.textContent = formatDate(user.createdAt);
  if (userAvatarInitials) userAvatarInitials.textContent = initialsFromName(user.name || 'User');

  if (userDetailShell) userDetailShell.hidden = false;
};

const fetchUser = async () => {
  if (!targetUserId) {
    setPageError('User ID is missing.');
    return;
  }

  try {
    const response = await fetch(`/api/users/${targetUserId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        redirectToLogin();
        return;
      }
      if (response.status === 404) {
        setPageError('User not found.');
        return;
      }
      setPageError('Unable to load user profile.');
      return;
    }

    const result = await response.json();
    renderUser(result.user);
  } catch {
    setPageError('Unable to reach the server.');
  }
};

if (!token) {
  redirectToLogin();
}

if (userRole !== 'admin') {
  redirectToLogin();
}

if (logoutButton) logoutButton.addEventListener('click', handleLogout);
if (viewProfileButton) viewProfileButton.addEventListener('click', handleViewProfile);
if (profileButton) profileButton.addEventListener('click', toggleProfileDropdown);
if (manageButton) manageButton.addEventListener('click', toggleManageDropdown);

document.addEventListener('click', handleDocumentClick);
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    closeProfileDropdown();
    closeManageDropdown();
  }
});

showProfileMenu();
fetchUser();
