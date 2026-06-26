import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import {
  DEFAULT_SLA_POLICY_NAME,
  createSlaPolicy,
  deleteSlaPolicy,
  getAllSlaPolicies,
  getSlaPolicyById,
  updateSlaPolicy,
} from '../data/slaPolicyStore.js';

const slaPoliciesRouter = Router();

const requireAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  return next();
};

const parsePositiveMinutes = (value) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }

  return Math.round(parsed);
};

slaPoliciesRouter.use(authenticate);

slaPoliciesRouter.get('/', (_req, res) => {
  const policies = getAllSlaPolicies();
  return res.json({ policies });
});

slaPoliciesRouter.post('/', requireAdmin, (req, res) => {
  const name = req.body?.name?.toString().trim();
  const responseMinutes = parsePositiveMinutes(req.body?.responseMinutes);
  const resolutionMinutes = parsePositiveMinutes(req.body?.resolutionMinutes);

  if (!name || !responseMinutes || !resolutionMinutes) {
    return res.status(400).json({ error: 'Name, response minutes, and resolution minutes are required.' });
  }

  try {
    const policy = createSlaPolicy({
      name,
      responseMinutes,
      resolutionMinutes,
    });
    return res.status(201).json({ policy });
  } catch (error) {
    return res.status(400).json({ error: error.message || 'Unable to create SLA policy.' });
  }
});

slaPoliciesRouter.put('/:id', requireAdmin, (req, res) => {
  const existing = getSlaPolicyById(req.params.id);
  if (!existing) {
    return res.status(404).json({ error: 'SLA policy not found.' });
  }

  const name = req.body?.name !== undefined ? req.body.name.toString().trim() : undefined;
  const responseMinutes = req.body?.responseMinutes !== undefined
    ? parsePositiveMinutes(req.body.responseMinutes)
    : undefined;
  const resolutionMinutes = req.body?.resolutionMinutes !== undefined
    ? parsePositiveMinutes(req.body.resolutionMinutes)
    : undefined;

  if (name !== undefined && !name) {
    return res.status(400).json({ error: 'SLA policy name cannot be empty.' });
  }

  if (
    existing.name === DEFAULT_SLA_POLICY_NAME
    && name
    && name !== DEFAULT_SLA_POLICY_NAME
  ) {
    return res.status(400).json({ error: 'Default SLA name cannot be changed.' });
  }

  if (req.body?.responseMinutes !== undefined && !responseMinutes) {
    return res.status(400).json({ error: 'Response minutes must be a positive number.' });
  }

  if (req.body?.resolutionMinutes !== undefined && !resolutionMinutes) {
    return res.status(400).json({ error: 'Resolution minutes must be a positive number.' });
  }

  try {
    const policy = updateSlaPolicy(req.params.id, {
      name,
      responseMinutes,
      resolutionMinutes,
    });
    return res.json({ policy });
  } catch (error) {
    return res.status(400).json({ error: error.message || 'Unable to update SLA policy.' });
  }
});

slaPoliciesRouter.delete('/:id', requireAdmin, (req, res) => {
  const existing = getSlaPolicyById(req.params.id);
  if (!existing) {
    return res.status(404).json({ error: 'SLA policy not found.' });
  }

  if (existing.name === DEFAULT_SLA_POLICY_NAME) {
    return res.status(400).json({ error: 'Default SLA cannot be deleted.' });
  }

  const deleted = deleteSlaPolicy(req.params.id);
  if (!deleted) {
    return res.status(404).json({ error: 'SLA policy not found.' });
  }

  return res.status(204).end();
});

export { slaPoliciesRouter };
