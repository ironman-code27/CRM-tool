import express from 'express';
import cors from 'cors';
import leadsRouter from './routes/leads.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/leads', leadsRouter);

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Backend CRM server is running on http://localhost:${PORT}`);
});
