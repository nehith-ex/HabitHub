import app from './app.js';
import { config } from './config/index.js';
import { prisma } from './config/prisma.js';

try {
  await prisma.$connect();
  console.log('PostgreSQL connected via Prisma');
  app.listen(config.port, () => console.log('API running on http://localhost:' + config.port));
} catch (err) {
  console.error('Startup failed:', err.message);
  process.exit(1);
}