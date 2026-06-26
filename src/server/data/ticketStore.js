import db from './db.js';
import {
  getAttachmentCountsByTicketIds,
  getLatestActivityByTicketIds,
} from './ticketActivityStore.js';
import { computeSlaState } from './slaUtils.js';

const withComputedSlaState = (ticket) => ({
  ...ticket,
  slaState: computeSlaState(ticket),
});

const getAllTickets = () => {
  const tickets = db
    .prepare('SELECT * FROM tickets ORDER BY id ASC')
    .all();

  const latestActivityByTicketId = getLatestActivityByTicketIds(tickets.map((ticket) => ticket.id));
  const attachmentCountByTicketId = getAttachmentCountsByTicketIds(tickets.map((ticket) => ticket.id));

  return tickets.map((ticket) => withComputedSlaState({
    ...ticket,
    attachmentCount: attachmentCountByTicketId.get(ticket.id) || 0,
    latestActivityAt: latestActivityByTicketId.get(ticket.id) || null,
  }));
};

const getTicketById = (id) => {
  const ticket = db
    .prepare('SELECT * FROM tickets WHERE id = ?')
    .get(id);

  if (!ticket) {
    return null;
  }

  return withComputedSlaState(ticket);
};

const createTicket = ({
  title,
  status,
  priority,
  customer,
  customerContact,
  description,
  assignedTo,
  slaPolicyId,
  slaPolicyName,
  slaResponseMinutes,
  slaResolutionMinutes,
  slaResponseDueAt,
  slaResolutionDueAt,
  slaFirstRespondedAt,
  slaResolvedAt,
  slaState,
}) => {
  const result = db.prepare(`
    INSERT INTO tickets (
      title,
      status,
      priority,
      customer,
      customerContact,
      description,
      assignedTo,
      slaPolicyId,
      slaPolicyName,
      slaResponseMinutes,
      slaResolutionMinutes,
      slaResponseDueAt,
      slaResolutionDueAt,
      slaFirstRespondedAt,
      slaResolvedAt,
      slaState
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    title,
    status ?? 'New',
    priority ?? 'Medium',
    customer,
    customerContact ?? null,
    description ?? '',
    assignedTo ?? null,
    slaPolicyId ?? null,
    slaPolicyName ?? null,
    slaResponseMinutes ?? null,
    slaResolutionMinutes ?? null,
    slaResponseDueAt ?? null,
    slaResolutionDueAt ?? null,
    slaFirstRespondedAt ?? null,
    slaResolvedAt ?? null,
    slaState ?? 'none',
  );

  return getTicketById(result.lastInsertRowid);
};

const updateTicket = (id, updates) => {
  const existing = getTicketById(id);
  if (!existing) {
    return null;
  }

  db.prepare(`
    UPDATE tickets
    SET title = ?, status = ?, priority = ?, customer = ?, customerContact = ?, description = ?, assignedTo = ?,
        slaFirstRespondedAt = ?, slaResolvedAt = ?, slaState = ?,
        updatedAt = datetime('now')
    WHERE id = ?
  `).run(
    updates.title ?? existing.title,
    updates.status ?? existing.status,
    updates.priority ?? existing.priority,
    updates.customer ?? existing.customer,
    updates.customerContact !== undefined ? updates.customerContact : existing.customerContact,
    updates.description ?? existing.description,
    updates.assignedTo ?? existing.assignedTo,
    updates.slaFirstRespondedAt !== undefined ? updates.slaFirstRespondedAt : existing.slaFirstRespondedAt,
    updates.slaResolvedAt !== undefined ? updates.slaResolvedAt : existing.slaResolvedAt,
    updates.slaState ?? existing.slaState,
    id,
  );

  return getTicketById(id);
};

const deleteTicket = (id) => {
  const result = db.prepare('DELETE FROM tickets WHERE id = ?').run(id);
  return result.changes > 0;
};

export {
  getAllTickets,
  getTicketById,
  createTicket,
  updateTicket,
  deleteTicket,
};
