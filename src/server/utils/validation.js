const validateLogin = ({ email, password }) => {
  const errors = [];

  if (!email || typeof email !== 'string') {
    errors.push('Email is required');
  }

  if (!password || typeof password !== 'string') {
    errors.push('Password is required');
  }

  return { valid: errors.length === 0, errors };
};

export { validateLogin };
