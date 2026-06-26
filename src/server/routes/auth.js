import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { authenticator } from 'otplib';
import { getUserByEmail } from '../data/userStore.js';
import { validateLogin } from '../utils/validation.js';
import { getJwtSecret } from '../utils/config.js';

const authRouter = Router();

authRouter.post('/login', async (req, res) => {
  const { email, password, mfaCode } = req.body;
  const validation = validateLogin({ email, password });

  if (!validation.valid) {
    return res.status(400).json({ errors: validation.errors });
  }

  const user = await getUserByEmail(email);

  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const match = await bcrypt.compare(password, user.passwordHash);

  if (!match) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  if (user.mfaEnabled) {
    const token = mfaCode?.toString().trim().replace(/\s+/g, '');

    if (!token) {
      return res.status(401).json({ error: 'MFA code is required.', mfaRequired: true });
    }

    const isValid = authenticator.verify({ token, secret: user.mfaSecret || '' });
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid MFA code.', mfaRequired: true });
    }
  }

  const token = jwt.sign({ sub: user.id, role: user.role }, getJwtSecret(), { expiresIn: '1h' });

  return res.json({
    token,
    user: {
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
});

export { authRouter };
