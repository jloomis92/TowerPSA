import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, 'tower-psa.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    email       TEXT NOT NULL UNIQUE COLLATE NOCASE,
    role        TEXT NOT NULL DEFAULT 'user',
    passwordHash TEXT NOT NULL,
    mfaEnabled  INTEGER NOT NULL DEFAULT 0,
    mfaSecret   TEXT,
    createdAt   TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS tickets (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    title       TEXT NOT NULL,
    status      TEXT NOT NULL DEFAULT 'New',
    priority    TEXT NOT NULL DEFAULT 'Medium',
    customer    TEXT NOT NULL,
    customerContact TEXT,
    description TEXT NOT NULL DEFAULT '',
    assignedTo  TEXT,
    createdAt   TEXT NOT NULL DEFAULT (datetime('now')),
    updatedAt   TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS ticket_activity (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    ticketId    INTEGER NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    entryType   TEXT NOT NULL DEFAULT 'note',
    visibility  TEXT NOT NULL DEFAULT 'internal',
    message     TEXT NOT NULL,
    userId      TEXT REFERENCES users(id),
    userName    TEXT,
    createdAt   TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS ticket_activity_attachments (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    activityId  INTEGER NOT NULL REFERENCES ticket_activity(id) ON DELETE CASCADE,
    fileName    TEXT NOT NULL,
    filePath    TEXT NOT NULL,
    mimeType    TEXT,
    fileSize    INTEGER,
    createdAt   TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS time_entries (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    ticketId    INTEGER NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    userId      TEXT NOT NULL REFERENCES users(id),
    userName    TEXT NOT NULL,
    date        TEXT NOT NULL,
    hours       REAL NOT NULL,
    billable    INTEGER NOT NULL DEFAULT 1,
    noteVisibility TEXT NOT NULL DEFAULT 'internal',
    notes       TEXT NOT NULL DEFAULT '',
    createdAt   TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS companies (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    name           TEXT NOT NULL,
    primaryContact TEXT,
    slaPolicyId    INTEGER REFERENCES sla_policies(id) ON DELETE SET NULL,
    phone          TEXT,
    email          TEXT,
    address        TEXT,
    notes          TEXT,
    createdAt      TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS sla_policies (
    id                INTEGER PRIMARY KEY AUTOINCREMENT,
    name              TEXT NOT NULL UNIQUE,
    responseMinutes   INTEGER NOT NULL,
    resolutionMinutes INTEGER NOT NULL,
    createdAt         TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS contacts (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    companyId INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    firstName TEXT NOT NULL,
    lastName  TEXT NOT NULL,
    phone     TEXT,
    email     TEXT,
    jobTitle  TEXT,
    createdAt TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

// Migrate tickets table from TEXT id to INTEGER id if needed
const ticketIdType = db
  .prepare("SELECT type FROM pragma_table_info('tickets') WHERE name = 'id'")
  .get();

if (ticketIdType && ticketIdType.type !== 'INTEGER') {
  db.exec(`
    ALTER TABLE tickets RENAME TO tickets_old;

    CREATE TABLE tickets (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      title       TEXT NOT NULL,
      status      TEXT NOT NULL DEFAULT 'New',
      priority    TEXT NOT NULL DEFAULT 'Medium',
      customer    TEXT NOT NULL,
      customerContact TEXT,
      description TEXT NOT NULL DEFAULT '',
      assignedTo  TEXT,
      createdAt   TEXT NOT NULL DEFAULT (datetime('now')),
      updatedAt   TEXT NOT NULL DEFAULT (datetime('now'))
    );

    INSERT INTO tickets (title, status, priority, customer, customerContact, description, assignedTo, createdAt, updatedAt)
    SELECT title, status, priority, customer, NULL, description, assignedTo, createdAt, updatedAt
    FROM tickets_old;

    DROP TABLE tickets_old;
  `);
}

// Add start_time and end_time columns to time_entries if they don't exist
const startTimeColumn = db
  .prepare("SELECT name FROM pragma_table_info('time_entries') WHERE name = 'startTime'")
  .get();

if (!startTimeColumn) {
  db.exec(`
    ALTER TABLE time_entries ADD COLUMN startTime TEXT;
    ALTER TABLE time_entries ADD COLUMN endTime TEXT;
  `);
}

// Add primaryContact column to companies if it doesn't exist
const primaryContactColumn = db
  .prepare("SELECT name FROM pragma_table_info('companies') WHERE name = 'primaryContact'")
  .get();

if (!primaryContactColumn) {
  db.exec('ALTER TABLE companies ADD COLUMN primaryContact TEXT;');
}

// Add MFA columns to users if they don't exist
const mfaEnabledColumn = db
  .prepare("SELECT name FROM pragma_table_info('users') WHERE name = 'mfaEnabled'")
  .get();

if (!mfaEnabledColumn) {
  db.exec('ALTER TABLE users ADD COLUMN mfaEnabled INTEGER NOT NULL DEFAULT 0;');
}

const mfaSecretColumn = db
  .prepare("SELECT name FROM pragma_table_info('users') WHERE name = 'mfaSecret'")
  .get();

if (!mfaSecretColumn) {
  db.exec('ALTER TABLE users ADD COLUMN mfaSecret TEXT;');
}

// Add customerContact column to tickets if it doesn't exist
const customerContactColumn = db
  .prepare("SELECT name FROM pragma_table_info('tickets') WHERE name = 'customerContact'")
  .get();

if (!customerContactColumn) {
  db.exec('ALTER TABLE tickets ADD COLUMN customerContact TEXT;');
}

const companySlaPolicyColumn = db
  .prepare("SELECT name FROM pragma_table_info('companies') WHERE name = 'slaPolicyId'")
  .get();

if (!companySlaPolicyColumn) {
  db.exec('ALTER TABLE companies ADD COLUMN slaPolicyId INTEGER REFERENCES sla_policies(id) ON DELETE SET NULL;');
}

const ticketSlaPolicyIdColumn = db
  .prepare("SELECT name FROM pragma_table_info('tickets') WHERE name = 'slaPolicyId'")
  .get();

if (!ticketSlaPolicyIdColumn) {
  db.exec('ALTER TABLE tickets ADD COLUMN slaPolicyId INTEGER REFERENCES sla_policies(id) ON DELETE SET NULL;');
}

const ticketSlaPolicyNameColumn = db
  .prepare("SELECT name FROM pragma_table_info('tickets') WHERE name = 'slaPolicyName'")
  .get();

if (!ticketSlaPolicyNameColumn) {
  db.exec('ALTER TABLE tickets ADD COLUMN slaPolicyName TEXT;');
}

const ticketSlaResponseMinutesColumn = db
  .prepare("SELECT name FROM pragma_table_info('tickets') WHERE name = 'slaResponseMinutes'")
  .get();

if (!ticketSlaResponseMinutesColumn) {
  db.exec('ALTER TABLE tickets ADD COLUMN slaResponseMinutes INTEGER;');
}

const ticketSlaResolutionMinutesColumn = db
  .prepare("SELECT name FROM pragma_table_info('tickets') WHERE name = 'slaResolutionMinutes'")
  .get();

if (!ticketSlaResolutionMinutesColumn) {
  db.exec('ALTER TABLE tickets ADD COLUMN slaResolutionMinutes INTEGER;');
}

const ticketSlaResponseDueAtColumn = db
  .prepare("SELECT name FROM pragma_table_info('tickets') WHERE name = 'slaResponseDueAt'")
  .get();

if (!ticketSlaResponseDueAtColumn) {
  db.exec('ALTER TABLE tickets ADD COLUMN slaResponseDueAt TEXT;');
}

const ticketSlaResolutionDueAtColumn = db
  .prepare("SELECT name FROM pragma_table_info('tickets') WHERE name = 'slaResolutionDueAt'")
  .get();

if (!ticketSlaResolutionDueAtColumn) {
  db.exec('ALTER TABLE tickets ADD COLUMN slaResolutionDueAt TEXT;');
}

const ticketSlaFirstRespondedAtColumn = db
  .prepare("SELECT name FROM pragma_table_info('tickets') WHERE name = 'slaFirstRespondedAt'")
  .get();

if (!ticketSlaFirstRespondedAtColumn) {
  db.exec('ALTER TABLE tickets ADD COLUMN slaFirstRespondedAt TEXT;');
}

const ticketSlaResolvedAtColumn = db
  .prepare("SELECT name FROM pragma_table_info('tickets') WHERE name = 'slaResolvedAt'")
  .get();

if (!ticketSlaResolvedAtColumn) {
  db.exec('ALTER TABLE tickets ADD COLUMN slaResolvedAt TEXT;');
}

const ticketSlaStateColumn = db
  .prepare("SELECT name FROM pragma_table_info('tickets') WHERE name = 'slaState'")
  .get();

if (!ticketSlaStateColumn) {
  db.exec("ALTER TABLE tickets ADD COLUMN slaState TEXT NOT NULL DEFAULT 'none';");
}

const timeEntryNoteVisibilityColumn = db
  .prepare("SELECT name FROM pragma_table_info('time_entries') WHERE name = 'noteVisibility'")
  .get();

if (!timeEntryNoteVisibilityColumn) {
  db.exec("ALTER TABLE time_entries ADD COLUMN noteVisibility TEXT NOT NULL DEFAULT 'internal';");
}

const ticketActivityVisibilityColumn = db
  .prepare("SELECT name FROM pragma_table_info('ticket_activity') WHERE name = 'visibility'")
  .get();

if (!ticketActivityVisibilityColumn) {
  db.exec("ALTER TABLE ticket_activity ADD COLUMN visibility TEXT NOT NULL DEFAULT 'internal';");
}

// Add isPrimary column to contacts if it doesn't exist
const isPrimaryColumn = db
  .prepare("SELECT name FROM pragma_table_info('contacts') WHERE name = 'isPrimary'")
  .get();

if (!isPrimaryColumn) {
  db.exec('ALTER TABLE contacts ADD COLUMN isPrimary INTEGER NOT NULL DEFAULT 0;');
}

db.prepare(`
  INSERT OR IGNORE INTO sla_policies (name, responseMinutes, resolutionMinutes)
  VALUES (?, ?, ?)
`).run('Default SLA', 60, 1440);

const defaultSlaPolicy = db
  .prepare('SELECT id, name, responseMinutes, resolutionMinutes FROM sla_policies WHERE name = ?')
  .get('Default SLA');

if (defaultSlaPolicy) {
  db.prepare(`
    UPDATE tickets
    SET
      slaPolicyId = ?,
      slaPolicyName = ?,
      slaResponseMinutes = ?,
      slaResolutionMinutes = ?,
      slaResponseDueAt = COALESCE(slaResponseDueAt, datetime(createdAt, '+' || ? || ' minutes')),
      slaResolutionDueAt = COALESCE(slaResolutionDueAt, datetime(createdAt, '+' || ? || ' minutes')),
      slaState = CASE
        WHEN slaState IS NULL OR slaState = 'none' THEN 'on_track'
        ELSE slaState
      END
    WHERE slaPolicyId IS NULL
  `).run(
    defaultSlaPolicy.id,
    defaultSlaPolicy.name,
    defaultSlaPolicy.responseMinutes,
    defaultSlaPolicy.resolutionMinutes,
    defaultSlaPolicy.responseMinutes,
    defaultSlaPolicy.resolutionMinutes,
  );
}

export default db;
