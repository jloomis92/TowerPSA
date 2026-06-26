import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import {
  getContactsByCompanyId,
  getContactById,
  createContact,
  updateContact,
  deleteContact,
} from '../data/contactStore.js';

const contactsRouter = Router();

contactsRouter.use(authenticate);

contactsRouter.get('/company/:companyId', (req, res) => {
  const contacts = getContactsByCompanyId(req.params.companyId);
  res.json({ contacts });
});

contactsRouter.get('/:id', (req, res) => {
  const contact = getContactById(req.params.id);
  if (!contact) return res.status(404).json({ error: 'Contact not found.' });
  return res.json({ contact });
});

contactsRouter.post('/', (req, res) => {
  const { companyId, firstName, lastName, phone, email, jobTitle, isPrimary } = req.body;
  if (!companyId || !firstName || !lastName) {
    return res.status(400).json({ error: 'Company ID, first name, and last name are required.' });
  }

  const contact = createContact({ companyId, firstName, lastName, phone, email, jobTitle, isPrimary });
  return res.status(201).json({ contact });
});

contactsRouter.put('/:id', (req, res) => {
  const { firstName, lastName, phone, email, jobTitle, isPrimary } = req.body;
  if (!firstName || !lastName) {
    return res.status(400).json({ error: 'First name and last name are required.' });
  }

  const contact = updateContact(req.params.id, { firstName, lastName, phone, email, jobTitle, isPrimary });
  if (!contact) return res.status(404).json({ error: 'Contact not found.' });
  return res.json({ contact });
});

contactsRouter.delete('/:id', (req, res) => {
  const deleted = deleteContact(req.params.id);
  if (!deleted) return res.status(404).json({ error: 'Contact not found.' });
  return res.json({ success: true });
});

export { contactsRouter };
