import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.join(__dirname, '..', 'src', 'server', 'data');

const targets = ['tower-psa.db', 'tower-psa.db-shm', 'tower-psa.db-wal'];

for (const name of targets) {
  const targetPath = path.join(dataDir, name);
  if (fs.existsSync(targetPath)) {
    fs.rmSync(targetPath);
    // eslint-disable-next-line no-console
    console.log(`Removed ${name}`);
  }
}

// eslint-disable-next-line no-console
console.log('Database reset complete. Start the app to recreate a clean database.');
