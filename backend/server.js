require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const examRoutes = require('./routes/exams');
const studentRoutes = require('./routes/students');
const exportRoutes = require('./routes/export');

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || '';

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes
app.use('/api/exams', examRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/export', exportRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

async function startServer() {
  let mongoUri = MONGO_URI;

  if (mongoUri) {
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB Atlas/custom URI');
  } else {
    console.log('🔧 Starting built-in in-memory MongoDB (no local install required)...');
    const { MongoMemoryServer } = require('mongodb-memory-server');
    const mongod = await MongoMemoryServer.create();
    const memUri = mongod.getUri();
    await mongoose.connect(memUri, { dbName: 'omr-checker' });
    console.log('✅ In-memory MongoDB ready');
    console.log('   ⚠  Note: Data will reset when you restart the server.');
    console.log('   💡 For persistence, set MONGO_URI in .env to your MongoDB connection string.');
  }

  app.listen(PORT, () => {
    console.log(`🚀 OMR Checker API → http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('❌ Server failed to start:', err.message);
  process.exit(1);
});
