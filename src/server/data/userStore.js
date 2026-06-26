import { randomUUID } from 'crypto';
import bcrypt from 'bcryptjs';
import db from './db.js';

const SALT_ROUNDS = 10;

const publicUser = ({ passwordHash: _passwordHash, mfaSecret: _mfaSecret, ...user }) => user;

const seedAdminIfEmpty = () => {
  const count = db.prepare('SELECT COUNT(*) AS count FROM users').get();
  if (count.count > 0) {
    return;
  }

  const passwordHash = bcrypt.hashSync('Password123!', SALT_ROUNDS);
  db.prepare(`
    INSERT INTO users (id, name, email, role, passwordHash)
    VALUES (?, ?, ?, ?, ?)
  `).run('user-1', 'Tower Admin', 'admin@example.com', 'admin', passwordHash);
};

seedAdminIfEmpty();

const getAllUsers = () => {
  const users = db.prepare('SELECT * FROM users ORDER BY createdAt ASC').all();
  return users.map(publicUser);
};

const getUserByEmail = (email) => db
  .prepare('SELECT * FROM users WHERE email = ? COLLATE NOCASE')
  .get(email);

const getUserById = (id) => db
  .prepare('SELECT * FROM users WHERE id = ?')
  .get(id);

const createUser = async ({
  name, email, role, password,
}) => {
  const existing = getUserByEmail(email);
  if (existing) {
    throw new Error('A user with that email already exists');
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const id = randomUUID();

  db.prepare(`
    INSERT INTO users (id, name, email, role, passwordHash)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, name, email, role, passwordHash);

  return publicUser(getUserById(id));
};

const updateUser = async (id, updates) => {
  const existing = getUserById(id);
  if (!existing) {
    return null;
  }

  if (updates.email && updates.email.toLowerCase() !== existing.email.toLowerCase()) {
    const conflict = getUserByEmail(updates.email);
    if (conflict && conflict.id !== id) {
      throw new Error('A user with that email already exists');
    }
  }

  let { passwordHash } = existing;
  if (updates.password) {
    passwordHash = await bcrypt.hash(updates.password, SALT_ROUNDS);
  }

  db.prepare(`
    UPDATE users
    SET name = ?, email = ?, role = ?, passwordHash = ?, mfaEnabled = ?, mfaSecret = ?
    WHERE id = ?
  `).run(
    updates.name ?? existing.name,
    updates.email ?? existing.email,
    updates.role ?? existing.role,
    passwordHash,
    updates.mfaEnabled !== undefined ? updates.mfaEnabled : existing.mfaEnabled,
    updates.mfaSecret !== undefined ? updates.mfaSecret : existing.mfaSecret,
    id,
  );

  return publicUser(getUserById(id));
};

const deleteUser = (id) => {
  const result = db.prepare('DELETE FROM users WHERE id = ?').run(id);
  return result.changes > 0;
};

export {
  getAllUsers,
  getUserByEmail,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
};
