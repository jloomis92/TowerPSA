import db from './db.js';

export const getContactsByCompanyId = (companyId) => db
  .prepare('SELECT * FROM contacts WHERE companyId = ? ORDER BY firstName ASC')
  .all(companyId);

export const getContactById = (id) => db
  .prepare('SELECT * FROM contacts WHERE id = ?')
  .get(id);

export const createContact = ({
  companyId, firstName, lastName, phone, email, jobTitle, isPrimary,
}) => {
  const result = db
    .prepare(`
      INSERT INTO contacts (companyId, firstName, lastName, phone, email, jobTitle, isPrimary)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `)
    .run(
      companyId,
      firstName,
      lastName,
      phone ?? null,
      email ?? null,
      jobTitle ?? null,
      isPrimary ? 1 : 0,
    );

  return getContactById(result.lastInsertRowid);
};

export const updateContact = (id, {
  firstName, lastName, phone, email, jobTitle, isPrimary,
}) => {
  const existing = getContactById(id);
  if (!existing) return null;

  db.prepare(`
    UPDATE contacts
    SET firstName = ?, lastName = ?, phone = ?, email = ?, jobTitle = ?, isPrimary = ?
    WHERE id = ?
  `).run(
    firstName ?? existing.firstName,
    lastName ?? existing.lastName,
    phone !== undefined ? (phone || null) : existing.phone,
    email !== undefined ? (email || null) : existing.email,
    jobTitle !== undefined ? (jobTitle || null) : existing.jobTitle,
    isPrimary !== undefined ? +isPrimary : existing.isPrimary,
    id,
  );

  return getContactById(id);
};

export const deleteContact = (id) => {
  const result = db.prepare('DELETE FROM contacts WHERE id = ?').run(id);
  return result.changes > 0;
};
