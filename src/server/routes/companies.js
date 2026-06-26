import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import {
  getAllCompanies,
  getCompanyById,
  createCompany,
  updateCompany,
  deleteCompany,
} from '../data/companyStore.js';

const companiesRouter = Router();

companiesRouter.use(authenticate);

companiesRouter.get('/', (_req, res) => {
  const companies = getAllCompanies();
  res.json({ companies });
});

companiesRouter.get('/:id', (req, res) => {
  const company = getCompanyById(req.params.id);
  if (!company) return res.status(404).json({ error: 'Company not found.' });
  return res.json({ company });
});

companiesRouter.post('/', (req, res) => {
  const {
    name,
    primaryContact,
    phone,
    email,
    address,
    notes,
    slaPolicyId,
  } = req.body;
  if (!name) return res.status(400).json({ error: 'Company name is required.' });

  const company = createCompany({
    name,
    primaryContact,
    phone,
    email,
    address,
    notes,
    slaPolicyId: slaPolicyId || null,
  });
  return res.status(201).json({ company });
});

companiesRouter.put('/:id', (req, res) => {
  const {
    name,
    primaryContact,
    phone,
    email,
    address,
    notes,
    slaPolicyId,
  } = req.body;
  if (!name) return res.status(400).json({ error: 'Company name is required.' });

  const company = updateCompany(req.params.id, {
    name,
    primaryContact,
    phone,
    email,
    address,
    notes,
    slaPolicyId: slaPolicyId !== undefined ? (slaPolicyId || null) : undefined,
  });
  if (!company) return res.status(404).json({ error: 'Company not found.' });
  return res.json({ company });
});

companiesRouter.delete('/:id', (req, res) => {
  const deleted = deleteCompany(req.params.id);
  if (!deleted) return res.status(404).json({ error: 'Company not found.' });
  return res.json({ success: true });
});

export { companiesRouter };
