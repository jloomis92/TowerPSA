import db from './db.js';

const getAttachmentsForActivityIds = (activityIds) => {
  if (!activityIds.length) {
    return new Map();
  }

  const placeholders = activityIds.map(() => '?').join(', ');
  const rows = db.prepare(`
    SELECT * FROM ticket_activity_attachments
    WHERE activityId IN (${placeholders})
    ORDER BY id ASC
  `).all(...activityIds);

  return rows.reduce((map, row) => {
    const existing = map.get(row.activityId) || [];
    existing.push(row);
    map.set(row.activityId, existing);
    return map;
  }, new Map());
};

const attachFiles = (activityRows) => {
  const activityIds = activityRows.map((row) => row.id);
  const attachmentsByActivityId = getAttachmentsForActivityIds(activityIds);

  return activityRows.map((row) => ({
    ...row,
    attachments: attachmentsByActivityId.get(row.id) || [],
  }));
};

const getActivityForTicket = (ticketId) => {
  const rows = db
    .prepare('SELECT * FROM ticket_activity WHERE ticketId = ? ORDER BY createdAt DESC, id DESC')
    .all(ticketId);

  return attachFiles(rows);
};

const getActivityById = (id) => db
  .prepare('SELECT * FROM ticket_activity WHERE id = ?')
  .get(id);

const getAttachmentById = (id) => db
  .prepare('SELECT * FROM ticket_activity_attachments WHERE id = ?')
  .get(id);

const getAttachmentByIdForTicket = (ticketId, attachmentId) => db.prepare(`
  SELECT attachments.*
  FROM ticket_activity_attachments attachments
  INNER JOIN ticket_activity activity ON activity.id = attachments.activityId
  WHERE attachments.id = ? AND activity.ticketId = ?
`).get(attachmentId, ticketId);

const deleteAttachmentById = (id) => db
  .prepare('DELETE FROM ticket_activity_attachments WHERE id = ?')
  .run(id);

const getActivityWithAttachmentsById = (id) => {
  const row = getActivityById(id);
  if (!row) {
    return null;
  }

  return attachFiles([row])[0];
};

const createActivityAttachment = ({
  activityId,
  fileName,
  filePath,
  mimeType,
  fileSize,
}) => db.prepare(`
  INSERT INTO ticket_activity_attachments (activityId, fileName, filePath, mimeType, fileSize)
  VALUES (?, ?, ?, ?, ?)
`).run(activityId, fileName, filePath, mimeType ?? null, fileSize ?? null);

const createActivityEntry = ({
  ticketId,
  entryType,
  visibility,
  message,
  userId,
  userName,
  attachments = [],
}) => {
  const result = db.prepare(`
    INSERT INTO ticket_activity (ticketId, entryType, visibility, message, userId, userName)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(ticketId, entryType, visibility ?? 'internal', message, userId ?? null, userName ?? null);

  attachments.forEach((attachment) => {
    createActivityAttachment({
      activityId: result.lastInsertRowid,
      fileName: attachment.fileName,
      filePath: attachment.filePath,
      mimeType: attachment.mimeType,
      fileSize: attachment.fileSize,
    });
  });

  return getActivityWithAttachmentsById(result.lastInsertRowid);
};

const createTicketNote = ({
  ticketId,
  message,
  visibility,
  userId,
  userName,
  attachments,
}) => createActivityEntry({
  ticketId,
  entryType: 'note',
  visibility: visibility ?? 'internal',
  message,
  userId,
  userName,
  attachments,
});

const createSystemActivity = ({
  ticketId,
  message,
  userId,
  userName,
}) => createActivityEntry({
  ticketId,
  entryType: 'system',
  visibility: 'internal',
  message,
  userId,
  userName,
});

const getLatestActivityByTicketIds = (ticketIds) => {
  if (!ticketIds.length) {
    return new Map();
  }

  const placeholders = ticketIds.map(() => '?').join(', ');
  const rows = db.prepare(`
    SELECT ticketId, MAX(createdAt) AS latestActivityAt
    FROM ticket_activity
    WHERE ticketId IN (${placeholders})
    GROUP BY ticketId
  `).all(...ticketIds);

  return rows.reduce((map, row) => {
    map.set(row.ticketId, row.latestActivityAt);
    return map;
  }, new Map());
};

const getAttachmentCountsByTicketIds = (ticketIds) => {
  if (!ticketIds.length) {
    return new Map();
  }

  const placeholders = ticketIds.map(() => '?').join(', ');
  const rows = db.prepare(`
    SELECT activity.ticketId, COUNT(attachments.id) AS attachmentCount
    FROM ticket_activity_attachments attachments
    INNER JOIN ticket_activity activity ON activity.id = attachments.activityId
    WHERE activity.ticketId IN (${placeholders})
    GROUP BY activity.ticketId
  `).all(...ticketIds);

  return rows.reduce((map, row) => {
    map.set(row.ticketId, row.attachmentCount);
    return map;
  }, new Map());
};

export {
  getActivityForTicket,
  createTicketNote,
  createSystemActivity,
  getAttachmentById,
  getAttachmentByIdForTicket,
  deleteAttachmentById,
  getLatestActivityByTicketIds,
  getAttachmentCountsByTicketIds,
};
