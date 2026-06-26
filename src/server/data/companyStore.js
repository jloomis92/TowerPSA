import db from './db.js';

export const getAllCompanies = () => db
  .prepare(`
    SELECT companies.*, policies.name AS slaPolicyName
    FROM companies
    LEFT JOIN sla_policies policies ON policies.id = companies.slaPolicyId
    ORDER BY companies.name ASC
  `)
  .all();

export const getCompanyById = (id) => db
  .prepare(`
    SELECT companies.*, policies.name AS slaPolicyName
    FROM companies
    LEFT JOIN sla_policies policies ON policies.id = companies.slaPolicyId
    WHERE companies.id = ?
  `)
  .get(id);

export const getCompanyByName = (name) => db
  .prepare(`
    SELECT companies.*, policies.name AS slaPolicyName
    FROM companies
    LEFT JOIN sla_policies policies ON policies.id = companies.slaPolicyId
    WHERE lower(companies.name) = lower(?)
  `)
  .get(name);

export const createCompany = ({
  name, primaryContact, phone, email, address, notes, slaPolicyId,
}) => {
  const result = db
    .prepare(`
      INSERT INTO companies (name, primaryContact, phone, email, address, notes, slaPolicyId)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `)
    .run(name, primaryContact ?? null, phone ?? null, email ?? null, address ?? null, notes ?? null, slaPolicyId ?? null);

  return getCompanyById(result.lastInsertRowid);
};

export const updateCompany = (id, {
  name, primaryContact, phone, email, address, notes, slaPolicyId,
}) => {
  const existing = getCompanyById(id);
  if (!existing) return null;

  db.prepare(`
    UPDATE companies
    SET name = ?, primaryContact = ?, phone = ?, email = ?, address = ?, notes = ?, slaPolicyId = ?
    WHERE id = ?
  `).run(
    name ?? existing.name,
    primaryContact !== undefined ? (primaryContact || null) : existing.primaryContact,
    phone !== undefined ? (phone || null) : existing.phone,
    email !== undefined ? (email || null) : existing.email,
    address !== undefined ? (address || null) : existing.address,
    notes !== undefined ? (notes || null) : existing.notes,
    slaPolicyId !== undefined ? (slaPolicyId || null) : existing.slaPolicyId,
    id,
  );

  return getCompanyById(id);
};

export const deleteCompany = (id) => {
  const result = db.prepare('DELETE FROM companies WHERE id = ?').run(id);
  return result.changes > 0;
};
