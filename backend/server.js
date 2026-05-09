require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const examRoutes = require('./routes/exams');
const studentRoutes = require('./routes/students');
const exportRoutes = require('./routes/export');

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

// Middleware
app.use(cors({
  origin: '*',
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Homepage Route
app.get("/", (req, res) => {
  res.send("OMR Checker Backend Running Successfully 🚀");
});

// API Routes
app.use('/api/exams', examRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/export', exportRoutes);

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found'
  });
});

// Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);

  res.status(500).json({
    error: err.message || 'Internal server error'
  });
});

// Start Server
async function startServer() {
  try {
    await mongoose.connect(MONGO_URI);

    console.log('✅ Connected to MongoDB Atlas');

    app.listen(PORT, () => {
      console.log(`🚀 OMR Checker API running on port ${PORT}`);
    });

  } catch (err) {
    console.error('❌ MongoDB Connection Error:', err.message);
  }
}

startServer();