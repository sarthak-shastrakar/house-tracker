const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const authRoutes = require('./src/routes/auth.routes');
const projectRoutes = require('./src/routes/project.routes');
const dashboardRoutes = require('./src/routes/dashboard.routes');
const materialRoutes = require('./src/routes/material.routes');
const contractorRoutes = require('./src/routes/contractor.routes');
const billRoutes = require('./src/routes/bill.routes');
const analyticsRoutes = require('./src/routes/analytics.routes');

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Database Connection ──────────────────────────────────────────────────────
const dbLink = process.env.DB_LINK;
if (!dbLink) {
  console.error('Error: DB_LINK is not defined in the .env file!');
  process.exit(1);
}

mongoose
  .connect(dbLink)
  .then(() => console.log('✅ MongoDB connected successfully.'))
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });

// ─── Routes ───────────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({ message: '🚀 BuildLedger API is running...', status: 'OK' });
});

app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/materials', materialRoutes);
app.use('/api/contractors', contractorRoutes);
app.use('/api/bills', billRoutes);
app.use('/api/analytics', analyticsRoutes);

// ─── 404 Handler ─────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found.' });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error.',
  });
});

// ─── Start Server ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
