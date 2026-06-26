import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { authenticator } from 'otplib';
import QRCode from 'qrcode';
import { authenticate } from '../middleware/authenticate.js';
import { getUserById, updateUser } from '../data/userStore.js';

const profileRouter = Router();

profileRouter.use(authenticate);

profileRouter.get('/mfa/status', async (req, res) => {
  const userId = req.user?.sub;

  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const user = await getUserById(userId);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  return res.json({ mfaEnabled: !!user.mfaEnabled });
});

profileRouter.post('/mfa/setup', async (req, res) => {
  const userId = req.user?.sub;

  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const user = await getUserById(userId);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  const secret = authenticator.generateSecret();
  const otpAuthUrl = authenticator.keyuri(user.email, 'TowerPSA', secret);
  const qrCodeDataUrl = await QRCode.toDataURL(otpAuthUrl);

  await updateUser(userId, {
    mfaSecret: secret,
    mfaEnabled: 0,
  });

  return res.json({
    secret,
    otpAuthUrl,
    qrCodeDataUrl,
    message: 'Scan or enter this key in your authenticator app, then verify with a code.',
  });
});

profileRouter.post('/mfa/enable', async (req, res) => {
  const userId = req.user?.sub;
  const { code } = req.body;

  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  if (!code) {
    return res.status(400).json({ message: 'MFA code is required.' });
  }

  const user = await getUserById(userId);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  if (!user.mfaSecret) {
    return res.status(400).json({ message: 'MFA setup has not been started.' });
  }

  const token = code.toString().trim().replace(/\s+/g, '');
  const isValid = authenticator.verify({ token, secret: user.mfaSecret });

  if (!isValid) {
    return res.status(400).json({ message: 'Invalid MFA code.' });
  }

  await updateUser(userId, {
    mfaEnabled: 1,
  });

  return res.json({ message: 'MFA enabled successfully.' });
});

profileRouter.post('/change-password', async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user?.sub;

  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: 'Current password and new password are required.' });
  }

  try {
    const user = await getUserById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const match = await bcrypt.compare(currentPassword, user.passwordHash);

    if (!match) {
      return res.status(401).json({ message: 'Current password is incorrect.' });
    }

    const updatedUser = await updateUser(userId, { password: newPassword });

    return res.json({
      message: 'Password changed successfully',
      user: {
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Unable to change password.' });
  }
});

export { profileRouter };
