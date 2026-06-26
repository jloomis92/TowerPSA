import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { getTicketById } from '../data/ticketStore.js';
import { getUserById } from '../data/userStore.js';
import { createSystemActivity } from '../data/ticketActivityStore.js';
import {
  getEntriesForTicket,
  getEntryById,
  createEntry,
  updateEntry,
  deleteEntry,
  getTotalHoursForTicket,
} from '../data/timeEntryStore.js';

const timeEntriesRouter = Router({ mergeParams: true });

timeEntriesRouter.use(authenticate);

timeEntriesRouter.get('/', (req, res) => {
  const ticketId = Number(req.params.ticketId);
  const ticket = getTicketById(ticketId);
  if (!ticket) {
    return res.status(404).json({ error: 'Ticket not found' });
  }

  const entries = getEntriesForTicket(ticketId);
  const totalHours = getTotalHoursForTicket(ticketId);
  return res.json({ entries, totalHours });
});

timeEntriesRouter.post('/', (req, res) => {
  const ticketId = Number(req.params.ticketId);
  const ticket = getTicketById(ticketId);
  if (!ticket) {
    return res.status(404).json({ error: 'Ticket not found' });
  }

  const {
    date, hours, billable, noteVisibility, notes, startTime, endTime,
  } = req.body;
  const userId = req.user?.sub;
  const userRecord = getUserById(userId);
  const userName = userRecord?.name || 'Unknown';

  if (!date || !hours) {
    return res.status(400).json({ error: 'Date and hours are required.' });
  }

  const parsedHours = parseFloat(hours);
  if (Number.isNaN(parsedHours) || parsedHours <= 0) {
    return res.status(400).json({ error: 'Hours must be a positive number.' });
  }

  try {
    const entry = createEntry({
      ticketId,
      userId,
      userName,
      date,
      hours: parsedHours,
      billable: billable !== false ? 1 : 0,
      noteVisibility: noteVisibility === 'customer' ? 'customer' : 'internal',
      notes: notes || '',
      startTime: startTime || null,
      endTime: endTime || null,
    });
    createSystemActivity({
      ticketId,
      message: `Logged ${parsedHours}h ${billable !== false ? 'billable' : 'non-billable'} time entry (${noteVisibility === 'customer' ? 'customer note' : 'internal note'}).`,
      userId,
      userName,
    });
    return res.status(201).json({ entry });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

timeEntriesRouter.put('/:entryId', (req, res) => {
  const entryId = Number(req.params.entryId);
  const existing = getEntryById(entryId);

  if (!existing) {
    return res.status(404).json({ error: 'Time entry not found' });
  }

  const {
    date, hours, billable, noteVisibility, notes, startTime, endTime,
  } = req.body;
  const parsedHours = hours !== undefined ? parseFloat(hours) : undefined;

  if (parsedHours !== undefined && (Number.isNaN(parsedHours) || parsedHours <= 0)) {
    return res.status(400).json({ error: 'Hours must be a positive number.' });
  }

  let billableValue;
  if (billable !== undefined) {
    billableValue = billable ? 1 : 0;
  }

  try {
    const entry = updateEntry(entryId, {
      date,
      hours: parsedHours,
      billable: billableValue,
      noteVisibility: noteVisibility !== undefined ? (noteVisibility === 'customer' ? 'customer' : 'internal') : undefined,
      notes,
      startTime: startTime !== undefined ? (startTime || null) : undefined,
      endTime: endTime !== undefined ? (endTime || null) : undefined,
    });
    const userId = req.user?.sub;
    const userRecord = getUserById(userId);
    createSystemActivity({
      ticketId: existing.ticketId,
      message: `Updated time entry: ${existing.hours}h -> ${entry.hours}h${existing.noteVisibility !== entry.noteVisibility ? `; note type ${existing.noteVisibility} -> ${entry.noteVisibility}` : ''}.`,
      userId,
      userName: userRecord?.name || existing.userName || 'Unknown User',
    });
    return res.json({ entry });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

timeEntriesRouter.delete('/:entryId', (req, res) => {
  const entryId = Number(req.params.entryId);
  const existing = getEntryById(entryId);
  if (!existing) {
    return res.status(404).json({ error: 'Time entry not found' });
  }

  const deleted = deleteEntry(entryId);
  if (!deleted) {
    return res.status(404).json({ error: 'Time entry not found' });
  }

  const userId = req.user?.sub;
  const userRecord = getUserById(userId);
  createSystemActivity({
    ticketId: existing.ticketId,
    message: `Deleted ${existing.hours}h ${existing.billable ? 'billable' : 'non-billable'} time entry.`,
    userId,
    userName: userRecord?.name || existing.userName || 'Unknown User',
  });

  return res.status(204).end();
});

export { timeEntriesRouter };
