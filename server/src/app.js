import express from 'express';
import cors from 'cors';
import { config } from './config/index.js';
import { requestId } from './middleware/requestId.js';
import { logger } from './middleware/logger.js';
import { currentUser } from './middleware/currentuser.js';
import { notFound } from './middleware/notFound.js';
import { errorHandler } from './middleware/errorHandler.js';
import habitsRouter from './routes/habits.routes.js';
import checkInsRouter from './routes/checkIns.routes.js';

const app = express();

app.use(cors({
  origin: config.clientUrl,
  allowedHeaders: ['Content-Type', 'x-user-id'],
}));
app.use(express.json({ limit: '10kb' }));
app.use(requestId);
app.use(logger);
app.use(currentUser);

app.get('/api/v1/health', (req, res) => {
  res.json({ data: { status: 'ok' } });
});

app.use('/api/v1/habits', habitsRouter);
app.use('/api/v1/check-ins', checkInsRouter);

app.use(notFound);
app.use(errorHandler);

export default app;
