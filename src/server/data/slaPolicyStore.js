import db from './db.js';

const DEFAULT_SLA_POLICY_NAME = 'Default SLA';

const getAllSlaPolicies = () => db
  .prepare('SELECT * FROM sla_policies ORDER BY name ASC')
  .all();

const getSlaPolicyById = (id) => db
  .prepare('SELECT * FROM sla_policies WHERE id = ?')
  .get(id);

const getDefaultSlaPolicy = () => db
  .prepare('SELECT * FROM sla_policies WHERE name = ?')
  .get(DEFAULT_SLA_POLICY_NAME);

const createSlaPolicy = ({
  name,
  responseMinutes,
  resolutionMinutes,
}) => {
  const result = db.prepare(`
    INSERT INTO sla_policies (name, responseMinutes, resolutionMinutes)
    VALUES (?, ?, ?)
  `).run(name, responseMinutes, resolutionMinutes);

  return getSlaPolicyById(result.lastInsertRowid);
};

const updateSlaPolicy = (id, {
  name,
  responseMinutes,
  resolutionMinutes,
}) => {
  const existing = getSlaPolicyById(id);
  if (!existing) {
    return null;
  }

  db.prepare(`
    UPDATE sla_policies
    SET name = ?, responseMinutes = ?, resolutionMinutes = ?
    WHERE id = ?
  `).run(
    name ?? existing.name,
    responseMinutes ?? existing.responseMinutes,
    resolutionMinutes ?? existing.resolutionMinutes,
    id,
  );

  return getSlaPolicyById(id);
};

const deleteSlaPolicy = (id) => {
  const result = db.prepare('DELETE FROM sla_policies WHERE id = ?').run(id);
  return result.changes > 0;
};

export {
  DEFAULT_SLA_POLICY_NAME,
  getAllSlaPolicies,
  getSlaPolicyById,
  getDefaultSlaPolicy,
  createSlaPolicy,
  updateSlaPolicy,
  deleteSlaPolicy,
};
