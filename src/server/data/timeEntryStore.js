import db from './db.js';

const getEntriesForTicket = (ticketId) => db
  .prepare('SELECT * FROM time_entries WHERE ticketId = ? ORDER BY date DESC, createdAt DESC')
  .all(ticketId);

const getEntryById = (id) => db
  .prepare('SELECT * FROM time_entries WHERE id = ?')
  .get(id);

const createEntry = ({
  ticketId, userId, userName, date, hours, billable, noteVisibility, notes, startTime, endTime,
}) => {
  const result = db.prepare(`
    INSERT INTO time_entries (ticketId, userId, userName, date, hours, billable, noteVisibility, notes, startTime, endTime)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(ticketId, userId, userName, date, hours, billable ?? 1, noteVisibility ?? 'internal', notes ?? '', startTime ?? null, endTime ?? null);

  return getEntryById(result.lastInsertRowid);
};

const updateEntry = (id, updates) => {
  const existing = getEntryById(id);
  if (!existing) {
    return null;
  }

  db.prepare(`
    UPDATE time_entries
    SET date = ?, hours = ?, billable = ?, noteVisibility = ?, notes = ?, startTime = ?, endTime = ?
    WHERE id = ?
  `).run(
    updates.date ?? existing.date,
    updates.hours ?? existing.hours,
    updates.billable ?? existing.billable,
    updates.noteVisibility ?? existing.noteVisibility,
    updates.notes ?? existing.notes,
    updates.startTime ?? existing.startTime,
    updates.endTime ?? existing.endTime,
    id,
  );

  return getEntryById(id);
};

const deleteEntry = (id) => {
  const result = db.prepare('DELETE FROM time_entries WHERE id = ?').run(id);
  return result.changes > 0;
};

const getTotalHoursForTicket = (ticketId) => {
  const row = db
    .prepare('SELECT COALESCE(SUM(hours), 0) AS total FROM time_entries WHERE ticketId = ?')
    .get(ticketId);
  return row.total;
};

const getEntriesForUser = (userId, startDate, endDate) => db
  .prepare('SELECT * FROM time_entries WHERE userId = ? AND date >= ? AND date <= ? ORDER BY date ASC, startTime ASC')
  .all(userId, startDate, endDate);

export {
  getEntriesForTicket,
  getEntryById,
  createEntry,
  updateEntry,
  deleteEntry,
  getTotalHoursForTicket,
  getEntriesForUser,
};
