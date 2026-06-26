const loginForm = document.querySelector('#login-form');
const formError = document.querySelector('#form-error');
const mfaModal = document.querySelector('#mfa-modal');
const mfaForm = document.querySelector('#mfa-form');
const mfaCodeInput = document.querySelector('#mfa-code');
const mfaError = document.querySelector('#mfa-error');
const closeMfaModalButton = document.querySelector('#close-mfa-modal');
const storedToken = localStorage.getItem('towerPsaToken');

const apiUrl = '/api/auth/login';
let pendingLogin = null;

const setError = (message) => {
  if (formError) {
    formError.textContent = message;
  }
};

const setMfaError = (message) => {
  if (mfaError) {
    mfaError.textContent = message;
  }
};

const openMfaModal = () => {
  if (!mfaModal) return;
  mfaModal.hidden = false;
  setMfaError('');
  if (mfaCodeInput) {
    mfaCodeInput.value = '';
    mfaCodeInput.focus();
  }
};

const closeMfaModal = () => {
  if (!mfaModal) return;
  mfaModal.hidden = true;
  setMfaError('');
};

const finalizeLogin = (result) => {
  localStorage.setItem('towerPsaToken', result.token);
  localStorage.setItem('towerPsaUserName', result.user?.name ?? '');
  localStorage.setItem('towerPsaUserEmail', result.user?.email ?? '');
  localStorage.setItem('towerPsaUserRole', result.user?.role ?? '');
  window.location.href = 'tickets.html';
};

const submitLogin = async ({ email, password, mfaCode }) => {
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      password,
      mfaCode: mfaCode || undefined,
    }),
  });

  const result = await response.json();
  return { response, result };
};

const loginReason = new URLSearchParams(window.location.search).get('reason');
if (loginReason === 'idle') {
  setError('Your session expired due to inactivity. Please sign in again.');
}

if (storedToken) {
  window.location.href = 'tickets.html';
}

const handleSubmit = async (event) => {
  event.preventDefault();
  setError('');

  const formData = new FormData(loginForm);
  const email = formData.get('email')?.toString().trim();
  const password = formData.get('password')?.toString();

  if (!email || !password) {
    setError('Email and password are required.');
    return;
  }

  try {
    const { response, result } = await submitLogin({ email, password, mfaCode: '' });

    if (!response.ok) {
      if (result.mfaRequired) {
        pendingLogin = { email, password };
        openMfaModal();
        return;
      }
      setError(result.error || result.errors?.join(', ') || 'Sign in failed.');
      return;
    }

    finalizeLogin(result);
  } catch {
    setError('Unable to reach the server. Please try again later.');
  }
};

const handleMfaSubmit = async (event) => {
  event.preventDefault();
  setMfaError('');

  if (!pendingLogin) {
    setMfaError('Session expired. Please sign in again.');
    closeMfaModal();
    return;
  }

  const code = mfaCodeInput?.value?.toString().trim().replace(/\s+/g, '') || '';
  if (!code) {
    setMfaError('MFA code is required.');
    return;
  }

  try {
    const { response, result } = await submitLogin({
      email: pendingLogin.email,
      password: pendingLogin.password,
      mfaCode: code,
    });

    if (!response.ok) {
      setMfaError(result.error || 'Invalid MFA code.');
      return;
    }

    pendingLogin = null;
    closeMfaModal();
    finalizeLogin(result);
  } catch {
    setMfaError('Unable to reach the server. Please try again later.');
  }
};

if (loginForm) {
  loginForm.addEventListener('submit', handleSubmit);
}

if (mfaForm) {
  mfaForm.addEventListener('submit', handleMfaSubmit);
}

if (closeMfaModalButton) {
  closeMfaModalButton.addEventListener('click', () => {
    pendingLogin = null;
    closeMfaModal();
  });
}

if (mfaModal) {
  mfaModal.addEventListener('click', (event) => {
    if (event.target === mfaModal) {
      pendingLogin = null;
      closeMfaModal();
    }
  });
}
