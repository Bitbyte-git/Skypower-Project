import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { ENV } from './config/env.js';
import { connectDB } from './config/db.js';
import { seedInitialData } from './services/seedService.js';
import routes from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const app = express();

// Middlewares
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Static uploads directory for documents & generated PDFs
const uploadsPath = path.resolve(__dirname, '../uploads');
app.use('/uploads', express.static(uploadsPath));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    module: 'Module 01: Marketing & Sales Management System',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api', routes);

// Serve Frontend SPA if built
const clientDistPath = path.resolve(__dirname, '../../sky-power/dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
      return next();
    }
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

// Global Error Handler
app.use(errorHandler);

// Start Server
export const startServer = async (port = ENV.PORT) => {
  try {
    await connectDB();
    await seedInitialData();

    return new Promise((resolve, reject) => {
      const server = app.listen(port, '0.0.0.0');
      
      server.on('listening', () => {
        console.log(`=======================================================`);
        console.log(`⚡ Switchgear & Panel Manufacturing ERP - Module 01`);
        console.log(`🚀 Unified Full-Stack Application running at:`);
        console.log(`👉 http://localhost:${port}`);
        console.log(`=======================================================`);
        resolve(server);
      });

      server.on('error', (err) => {
        reject(err);
      });
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    throw err;
  }
};

// Auto start if executed directly
if (process.argv[1] && process.argv[1].endsWith('index.js')) {
  startServer(ENV.PORT);
}
