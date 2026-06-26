import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import {
  getAllUsers,
  getUserByEmail,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
} from '../data/userStore.js';

const usersRouter = Router();

const requireAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  return next();
};

// Any authenticated user can fetch the list of names (for assignment dropdowns)
usersRouter.get('/names', authenticate, async (_req, res) => {
  const users = await getAllUsers();
  const names = users.map((u) => ({ id: u.id, name: u.name }));
  res.json({ users: names });
});

usersRouter.use(authenticate, requireAdmin);

usersRouter.get('/', async (_req, res) => {
  const users = await getAllUsers();
  res.json({ users });
});

usersRouter.post('/', async (req, res) => {
  const { name, email, role, password } = req.body;

  if (!name || !email || !role || !password) {
    return res.status(400).json({ error: 'Name, email, role, and password are required.' });
  }

  try {
    const user = await createUser({ name, email, role, password });
    return res.status(201).json({ user });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

usersRouter.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { name, email, role, password } = req.body;

  try {
    const user = await updateUser(id, { name, email, role, password });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    return res.json({ user });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

usersRouter.delete('/:id', async (req, res) => {
  const { id } = req.params;

  const deleted = await deleteUser(id);
  if (!deleted) {
    return res.status(404).json({ error: 'User not found' });
  }

  return res.status(204).end();
});

usersRouter.post('/:id/reset-mfa', async (req, res) => {
  const { id } = req.params;

  if (req.user?.sub === id) {
    return res.status(400).json({ error: 'Use your profile page to reconfigure your own MFA.' });
  }

  try {
    const user = await updateUser(id, { mfaEnabled: 0, mfaSecret: null });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    return res.json({ message: 'MFA reset successfully.', user });
  } catch (error) {
    return res.status(400).json({ error: error.message || 'Unable to reset MFA.' });
  }
});

usersRouter.get('/email/:email', async (req, res) => {
  const user = await getUserByEmail(req.params.email);

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  return res.json({ user });
});

usersRouter.get('/:id', async (req, res) => {
  const { id } = req.params;
  const user = await getUserById(id);

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  return res.json({ user });
});

usersRouter.get('/email/:email', async (req, res) => {
  const user = await getUserByEmail(req.params.email);

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  return res.json({ user });
});

export { usersRouter };
