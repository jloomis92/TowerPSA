import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { getEntriesForUser } from '../data/timeEntryStore.js';
import { getTicketById } from '../data/ticketStore.js';

const userTimeEntriesRouter = Router();

userTimeEntriesRouter.use(authenticate);

userTimeEntriesRouter.get('/', (req, res) => {
  const userId = req.user?.sub;
  const { startDate, endDate } = req.query;

  if (!startDate || !endDate) {
    return res.status(400).json({ error: 'startDate and endDate are required.' });
  }

  try {
    const entries = getEntriesForUser(userId, startDate, endDate)
      .filter((entry) => entry.noteVisibility === 'customer');

    // Enrich entries with ticket information
    const enrichedEntries = entries.map((entry) => {
      const ticket = getTicketById(entry.ticketId);
      return {
        ...entry,
        notes: entry.notes,
        ticketTitle: ticket?.title || `Ticket #${entry.ticketId}`,
      };
    });

    const totalHours = enrichedEntries.reduce((sum, e) => sum + (e.hours || 0), 0);

    return res.json({ entries: enrichedEntries, totalHours });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

export { userTimeEntriesRouter };
