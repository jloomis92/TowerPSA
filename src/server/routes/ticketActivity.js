import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { fileURLToPath } from 'url';
import { authenticate } from '../middleware/authenticate.js';
import { getTicketById } from '../data/ticketStore.js';
import { getUserById } from '../data/userStore.js';
import {
  getActivityForTicket,
  createTicketNote,
  createSystemActivity,
  getAttachmentByIdForTicket,
  deleteAttachmentById,
} from '../data/ticketActivityStore.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.join(__dirname, '../../../public/uploads/ticket-activity');
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${Date.now()}-${safeName}`);
  },
});

const upload = multer({ storage });

const ticketActivityRouter = Router({ mergeParams: true });

ticketActivityRouter.use(authenticate);

ticketActivityRouter.get('/', (req, res) => {
  const ticketId = Number(req.params.ticketId);
  const ticket = getTicketById(ticketId);
  if (!ticket) {
    return res.status(404).json({ error: 'Ticket not found' });
  }

  const activity = getActivityForTicket(ticketId);
  return res.json({ activity });
});

ticketActivityRouter.post('/', upload.array('attachments'), (req, res) => {
  const ticketId = Number(req.params.ticketId);
  const ticket = getTicketById(ticketId);
  if (!ticket) {
    return res.status(404).json({ error: 'Ticket not found' });
  }

  const message = req.body?.message?.toString().trim();
  const visibility = req.body?.visibility === 'customer' ? 'customer' : 'internal';
  if (!message && !(req.files || []).length) {
    return res.status(400).json({ error: 'Note message is required.' });
  }

  const userId = req.user?.sub;
  const user = getUserById(userId);
  const userName = user?.name || 'Unknown User';
  const attachments = (req.files || []).map((file) => ({
    fileName: file.originalname,
    filePath: `/uploads/ticket-activity/${file.filename}`,
    mimeType: file.mimetype,
    fileSize: file.size,
  }));
  const finalMessage = message || `Added ${attachments.length} attachment${attachments.length === 1 ? '' : 's'}.`;

  const entry = createTicketNote({
    ticketId,
    message: finalMessage,
    visibility,
    userId,
    userName,
    attachments,
  });

  return res.status(201).json({ entry });
});

ticketActivityRouter.delete('/attachments/:attachmentId', (req, res) => {
  const ticketId = Number(req.params.ticketId);
  const attachmentId = Number(req.params.attachmentId);

  const ticket = getTicketById(ticketId);
  if (!ticket) {
    return res.status(404).json({ error: 'Ticket not found' });
  }

  if (!Number.isInteger(attachmentId) || attachmentId <= 0) {
    return res.status(400).json({ error: 'Invalid attachment id.' });
  }

  const attachment = getAttachmentByIdForTicket(ticketId, attachmentId);
  if (!attachment) {
    return res.status(404).json({ error: 'Attachment not found.' });
  }

  deleteAttachmentById(attachmentId);

  if (attachment.filePath) {
    const fileName = path.basename(attachment.filePath);
    const absolutePath = path.join(uploadDir, fileName);

    try {
      fs.unlinkSync(absolutePath);
    } catch (error) {
      if (error?.code !== 'ENOENT') {
        // Best effort cleanup: db row is already deleted.
      }
    }
  }

  const userId = req.user?.sub;
  const user = getUserById(userId);
  createSystemActivity({
    ticketId,
    userId,
    userName: user?.name || 'Unknown User',
    message: `Deleted attachment: ${attachment.fileName}`,
  });

  return res.status(204).send();
});

export { ticketActivityRouter };
