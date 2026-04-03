require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// Middleware — allow localhost, any Vercel deployment, and any Render service
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    const allowed =
      origin.includes('localhost') ||
      origin.includes('vercel.app') ||
      origin.includes('onrender.com') ||
      origin === process.env.FRONTEND_URL;
    if (allowed) return callback(null, true);
    return callback(new Error(`CORS blocked: ${origin}`));
  },
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// Routes
app.use('/api/students', require('./routes/students'));
app.use('/api/aptitude', require('./routes/aptitude'));
app.use('/api/coding', require('./routes/coding'));
app.use('/api/communication', require('./routes/communication'));
app.use('/api/predict', require('./routes/predict'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Connect to MongoDB and start server
const PORT = process.env.PORT || 5000;
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('MongoDB connected');
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
