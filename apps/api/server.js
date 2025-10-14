import express from 'express';
import cors from 'cors';
import projectRoutes from './routes/project.js';
import investorRoutes from './routes/investor.js';
import phaseRoutes from './routes/phase.js';

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/projects', projectRoutes);
app.use('/api/investors', investorRoutes);
app.use('/api/phases', phaseRoutes);

// Health check
app.get('/', (req, res) => {
  res.send('Film Finance API running 🚀');
});

const PORT = process.env.PORT || 8800;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
