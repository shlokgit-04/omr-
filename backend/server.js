require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const fs = require('fs');

const examRoutes = require('./routes/exams');
const studentRoutes = require('./routes/students');
const exportRoutes = require('./routes/export');
const authRoutes = require('./routes/auth');
const { optionalAuth } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

// Behind Replit/Render's proxy: honour the forwarded protocol so cookies stay Secure.
app.set('trust proxy', 1);

app.use(cors({
  origin: true,
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Session context available on every API route.
app.use('/api', optionalAuth);

// Homepage Route
app.get("/", (req, res) => {
  res.send("OMR Checker Backend Running Successfully 🚀");
});

// API Routes
app.use('/api/auth', authRoutes);
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

// Privacy policy + About Us (static pages, no session needed)
app.use(express.static(path.join(__dirname, 'public'), { index: false, extensions: ['html'] }));

// Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);

  res.status(500).json({
    error: err.message || 'Internal server error'
  });
});

// SPA fallback + 404 Handler
app.use((req, res) => {
  const distDir = path.join(__dirname, '..', 'frontend', 'dist');
  const indexFile = path.join(distDir, 'index.html');
  if (!req.path.startsWith('/api') && fs.existsSync(indexFile)) {
    return res.sendFile(indexFile);
  }
  res.status(404).json({
    error: 'Route not found'
  });
});

// Start Server
async function startServer() {
  try {
    let uri = MONGO_URI;
    if (!uri) {
      // No MongoDB configured: spin up a temporary in-memory database
      // so the app runs anywhere. Data resets when the server restarts.
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const mem = await MongoMemoryServer.create();
      uri = mem.getUri();
      console.log('⚠️  No MONGO_URI set, using in-memory MongoDB (data resets on restart)');
    }

    await mongoose.connect(uri);

    console.log('✅ Connected to MongoDB');

    app.listen(PORT, () => {
      console.log(`🚀 OMR Checker running on port ${PORT}`);
    });

  } catch (err) {
    console.error('❌ MongoDB Connection Error:', err.message);
  }
}

startServer();
