const loginLink = document.querySelector('nav.site-nav a[href="login.html"]');
const storedToken = localStorage.getItem('towerPsaToken');
const dashboardUrl = 'tickets.html';
const authCheckUrl = '/api/tickets';

const updateNavLink = (isAuthenticated) => {
  if (!loginLink) {
    return;
  }

  loginLink.textContent = isAuthenticated ? 'Dashboard' : 'Login';
  loginLink.href = isAuthenticated ? dashboardUrl : 'login.html';
};

const redirectToLogin = () => {
  window.location.href = 'login.html';
};

const redirectToDashboard = () => {
  window.location.href = dashboardUrl;
};

const validateToken = async () => {
  if (!storedToken) {
    redirectToLogin();
    return;
  }

  try {
    const response = await fetch(authCheckUrl, {
      headers: {
        Authorization: `Bearer ${storedToken}`,
      },
    });

    if (response.ok) {
      redirectToDashboard();
      return;
    }

    if (response.status === 401) {
      localStorage.removeItem('towerPsaToken');
      redirectToLogin();
      return;
    }
  } catch (error) {
    // If auth validation fails, redirect to login so the user can sign in again.
    // eslint-disable-next-line no-console
    console.warn('Failed to validate stored auth token', error);
    redirectToLogin();
    return;
  }

  updateNavLink(false);
};

validateToken();
