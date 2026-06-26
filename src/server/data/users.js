import bcrypt from 'bcryptjs';

const users = [
  {
    id: 'user-1',
    name: 'Tower Admin',
    email: 'admin@example.com',
    role: 'admin',
    passwordHash: await bcrypt.hash('Password123!', 10),
  },
];

export { users };
