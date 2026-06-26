import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { getUserById } from '../data/userStore.js';
import {
  getAllTickets,
  getTicketById,
  createTicket,
  updateTicket,
  deleteTicket,
} from '../data/ticketStore.js';
import { createSystemActivity } from '../data/ticketActivityStore.js';
import { getCompanyByName } from '../data/companyStore.js';
import { getDefaultSlaPolicy, getSlaPolicyById } from '../data/slaPolicyStore.js';
import { addMinutesIso, computeSlaState } from '../data/slaUtils.js';

const ticketsRouter = Router();

const normalizeText = (value) => (value ?? '').toString().trim();
const normalizeOptionalValue = (value) => {
  if (value === undefined || value === null) {
    return null;
  }

  const normalized = value.toString().trim();
  return normalized || null;
};

const displayValue = (value, fallback = '—') => {
  const normalized = normalizeOptionalValue(value);
  return normalized ?? fallback;
};

const quoteValue = (value) => `"${normalizeText(value)}"`;

const nowIso = () => new Date().toISOString();

const getSlaSnapshotForCustomer = (customerName) => {
  const company = getCompanyByName(customerName);
  const companyPolicy = company?.slaPolicyId ? getSlaPolicyById(company.slaPolicyId) : null;
  const policy = companyPolicy || getDefaultSlaPolicy();
  if (!policy) {
    return null;
  }

  return {
    slaPolicyId: policy.id,
    slaPolicyName: policy.name,
    slaResponseMinutes: policy.responseMinutes,
    slaResolutionMinutes: policy.resolutionMinutes,
  };
};

const buildSlaFieldsOnCreate = (ticketInput) => {
  const snapshot = getSlaSnapshotForCustomer(ticketInput.customer);
  if (!snapshot) {
    return {
      slaPolicyId: null,
      slaPolicyName: null,
      slaResponseMinutes: null,
      slaResolutionMinutes: null,
      slaResponseDueAt: null,
      slaResolutionDueAt: null,
      slaFirstRespondedAt: null,
      slaResolvedAt: null,
      slaState: 'none',
    };
  }

  const createdAt = nowIso();
  const isImmediatelyResponded = ticketInput.status === 'In Progress' || ticketInput.status === 'Closed';
  const isImmediatelyResolved = ticketInput.status === 'Closed';

  return {
    ...snapshot,
    slaResponseDueAt: addMinutesIso(createdAt, snapshot.slaResponseMinutes),
    slaResolutionDueAt: addMinutesIso(createdAt, snapshot.slaResolutionMinutes),
    slaFirstRespondedAt: isImmediatelyResponded ? createdAt : null,
    slaResolvedAt: isImmediatelyResolved ? createdAt : null,
    slaState: 'on_track',
  };
};

const buildSlaFieldsOnUpdate = (existing, updates) => {
  if (!existing?.slaPolicyId) {
    return {
      slaFirstRespondedAt: existing?.slaFirstRespondedAt ?? null,
      slaResolvedAt: existing?.slaResolvedAt ?? null,
      slaState: 'none',
    };
  }

  const nextStatus = updates.status ?? existing.status;
  const timestamp = nowIso();
  const {
    slaResolvedAt: existingSlaResolvedAt,
  } = existing;

  const slaFirstRespondedAt = existing.slaFirstRespondedAt
    || (nextStatus === 'In Progress' || nextStatus === 'Closed' ? timestamp : null);

  let slaResolvedAt = existingSlaResolvedAt;
  if (nextStatus === 'Closed') {
    slaResolvedAt = slaResolvedAt || timestamp;
  } else if (existing.status === 'Closed' && nextStatus !== 'Closed') {
    slaResolvedAt = null;
  }

  const computed = {
    ...existing,
    ...updates,
    slaFirstRespondedAt,
    slaResolvedAt,
  };

  return {
    slaFirstRespondedAt,
    slaResolvedAt,
    slaState: computeSlaState(computed),
  };
};

const logSystemMessages = ({
  ticketId,
  messages,
  userId,
  userName,
}) => {
  messages.forEach((message) => {
    createSystemActivity({
      ticketId,
      message,
      userId,
      userName,
    });
  });
};

const buildTicketCreationMessages = (ticket) => {
  const messages = ['Ticket created.'];

  messages.push(`Title set to ${quoteValue(ticket.title)}.`);
  messages.push(`Status set to ${displayValue(ticket.status)}.`);
  messages.push(`Priority set to ${displayValue(ticket.priority)}.`);
  messages.push(`Customer set to ${displayValue(ticket.customer)}.`);

  if (normalizeOptionalValue(ticket.customerContact)) {
    messages.push(`Contact set to ${displayValue(ticket.customerContact)}.`);
  }

  if (normalizeOptionalValue(ticket.assignedTo)) {
    messages.push(`Assigned to ${displayValue(ticket.assignedTo)}.`);
  }

  if (normalizeText(ticket.description)) {
    messages.push('Description added.');
  }

  return messages;
};

const buildTicketChangeMessages = (before, after) => {
  const changes = [];

  if (normalizeText(before.title) !== normalizeText(after.title)) {
    changes.push(`Title changed: ${quoteValue(before.title)} -> ${quoteValue(after.title)}.`);
  }

  if (before.status !== after.status) {
    changes.push(`Status changed: ${displayValue(before.status)} -> ${displayValue(after.status)}.`);

    if (after.status === 'Closed') {
      changes.push('Ticket closed.');
    } else if (before.status === 'Closed') {
      changes.push('Ticket reopened.');
    }
  }

  if (before.priority !== after.priority) {
    changes.push(`Priority changed: ${displayValue(before.priority)} -> ${displayValue(after.priority)}.`);
  }

  if (before.customer !== after.customer) {
    changes.push(`Customer changed: ${displayValue(before.customer)} -> ${displayValue(after.customer)}.`);
  }

  if (
    normalizeOptionalValue(before.customerContact)
    !== normalizeOptionalValue(after.customerContact)
  ) {
    changes.push(`Contact changed: ${displayValue(before.customerContact)} -> ${displayValue(after.customerContact)}.`);
  }

  if (normalizeOptionalValue(before.assignedTo) !== normalizeOptionalValue(after.assignedTo)) {
    changes.push(`Assignment changed: ${displayValue(before.assignedTo, 'Unassigned')} -> ${displayValue(after.assignedTo, 'Unassigned')}.`);
  }

  const beforeDescription = normalizeText(before.description);
  const afterDescription = normalizeText(after.description);
  if (beforeDescription !== afterDescription) {
    if (!beforeDescription && afterDescription) {
      changes.push('Description added.');
    } else if (beforeDescription && !afterDescription) {
      changes.push('Description cleared.');
    } else {
      changes.push('Description updated.');
    }
  }

  return changes;
};

ticketsRouter.use(authenticate);

ticketsRouter.get('/', (_req, res) => {
  const tickets = getAllTickets();
  res.json({ tickets });
});

ticketsRouter.get('/:id', (req, res) => {
  const ticket = getTicketById(req.params.id);
  if (!ticket) {
    return res.status(404).json({ error: 'Ticket not found' });
  }
  return res.json({ ticket });
});

ticketsRouter.post('/', (req, res) => {
  const {
    title, status, priority, customer, customerContact, description, assignedTo,
  } = req.body;

  if (!title || !customer) {
    return res.status(400).json({ error: 'Title and customer are required.' });
  }

  try {
    const slaFields = buildSlaFieldsOnCreate({
      title,
      status,
      priority,
      customer,
      customerContact,
      description,
      assignedTo,
    });

    const ticket = createTicket({
      title,
      status,
      priority,
      customer,
      customerContact,
      description,
      assignedTo,
      ...slaFields,
    });
    const userId = req.user?.sub;
    const user = getUserById(userId);
    logSystemMessages({
      ticketId: ticket.id,
      messages: buildTicketCreationMessages(ticket),
      userId,
      userName: user?.name || 'Unknown User',
    });
    return res.status(201).json({ ticket });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

ticketsRouter.put('/:id', (req, res) => {
  const {
    title, status, priority, customer, customerContact, description, assignedTo,
  } = req.body;

  try {
    const existing = getTicketById(req.params.id);
    const slaFields = buildSlaFieldsOnUpdate(existing, {
      title,
      status,
      priority,
      customer,
      customerContact,
      description,
      assignedTo,
    });

    const ticket = updateTicket(req.params.id, {
      title,
      status,
      priority,
      customer,
      customerContact,
      description,
      assignedTo,
      ...slaFields,
    });
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    if (existing) {
      const changes = buildTicketChangeMessages(existing, ticket);
      if (changes.length) {
        const userId = req.user?.sub;
        const user = getUserById(userId);
        logSystemMessages({
          ticketId: ticket.id,
          messages: changes,
          userId,
          userName: user?.name || 'Unknown User',
        });
      }
    }

    return res.json({ ticket });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

ticketsRouter.delete('/:id', (req, res) => {
  const deleted = deleteTicket(req.params.id);
  if (!deleted) {
    return res.status(404).json({ error: 'Ticket not found' });
  }
  return res.status(204).end();
});

export { ticketsRouter };
