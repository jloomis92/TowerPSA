import express from 'express';
import path from 'path';
import helmet from 'helmet';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { authRouter } from './routes/auth.js';
import { ticketsRouter } from './routes/tickets.js';
import { usersRouter } from './routes/users.js';
import { profileRouter } from './routes/profile.js';
import { timeEntriesRouter } from './routes/timeEntries.js';
import { ticketActivityRouter } from './routes/ticketActivity.js';
import { userTimeEntriesRouter } from './routes/userTimeEntries.js';
import { companiesRouter } from './routes/companies.js';
import { contactsRouter } from './routes/contacts.js';
import { slaPoliciesRouter } from './routes/slaPolicies.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = Number(process.env.PORT) || 4000;

app.use(
  helmet({
    contentSecurityPolicy: false,
    hsts: false,
  }),
);
app.use(cors({ origin: process.env.CLIENT_ORIGIN || '*' }));
app.use(express.json());
app.use(express.static(path.join(__dirname, '../../public')));

app.use('/api/auth', authRouter);
app.use('/api/tickets', ticketsRouter);
app.use('/api/tickets/:ticketId/time-entries', timeEntriesRouter);
app.use('/api/tickets/:ticketId/activity', ticketActivityRouter);
app.use('/api/time-entries', userTimeEntriesRouter);
app.use('/api/users', usersRouter);
app.use('/api/profile', profileRouter);
app.use('/api/companies', companiesRouter);
app.use('/api/contacts', contactsRouter);
app.use('/api/sla-policies', slaPoliciesRouter);

app.get('/health', (_req, res) => res.status(200).json({ status: 'ok' }));

app.use((err, _req, res, _next) => {
  // eslint-disable-next-line no-console
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`TowerPSA API listening on port ${port}`);
});
