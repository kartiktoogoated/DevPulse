import express from 'express';
import cors from 'cors';
import authtuahRoutes from './routes/v1/authtuah';
import commitRoutes from './routes/v1/commit';
import summRoutes from './routes/v1/summ';
import healthRoutes from './routes/v1/health';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/auth', authtuahRoutes);
app.use('/commits', commitRoutes);
app.use('/summary', summRoutes);
app.use('/health', healthRoutes);

export default app;
