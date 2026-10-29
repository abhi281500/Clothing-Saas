const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const config = require('./config/env');
const createSessionMiddleware = require('./config/session');
const routes = require('./routes');
const errorHandler = require('./middlewares/errorHandler');
const { generalApiLimiter } = require('./middlewares/rateLimiter');
const { errorResponse } = require('./utils/apiResponse');

const app = express();

// Trust reverse proxy (Crucial for Render, Vercel, Heroku, Cloudflare)
// Ensures req.secure is true over HTTPS and client IP is accurately read by express-rate-limit
app.set('trust proxy', 1);

// Security HTTP headers
app.use(
  helmet({
    contentSecurityPolicy: false, // Allows frontend assets to load flexibly
    crossOriginEmbedderPolicy: false,
  })
);

// Flexible and secure CORS configuration
// Parses comma-separated CLIENT_URL and matches production Vercel domains
const configuredClientUrls = (config.clientUrl || '')
  .split(',')
  .map((u) => u.trim().replace(/\/+$/, ''))
  .filter(Boolean);

const defaultAllowedOrigins = [
  'https://clothing-saas-eight.vercel.app',
  'https://clothing-saas.vercel.app',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  ...configuredClientUrls,
];

const isOriginAllowed = (origin) => {
  if (!origin) return true; // Allow non-browser requests (Postman, server-to-server, curl)
  const cleanOrigin = origin.replace(/\/+$/, '');
  if (defaultAllowedOrigins.includes(cleanOrigin)) return true;
  // Allow any vercel deployment belonging to this project (e.g. preview branches)
  if (/^https:\/\/clothing-saas(-[a-z0-9_-]+)?\.vercel\.app$/i.test(cleanOrigin)) return true;
  return false;
};

app.use(
  cors({
    origin: (origin, callback) => {
      if (isOriginAllowed(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`Blocked by CORS policy: Origin ${origin} not allowed`));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'x-store-id'],
    exposedHeaders: ['set-cookie'],
  })
);

// Logging
if (config.nodeEnv !== 'test') {
  app.use(morgan('dev'));
}

// Request parsers
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));
app.use(cookieParser());

// Server-side Session Management with MongoStore
app.use(createSessionMiddleware());

// General API Rate Limiter
app.use('/api', generalApiLimiter);

// API Endpoints
app.use('/api', routes);

// 404 Handler
app.use((req, res) => {
  return errorResponse(res, `Route not found: ${req.method} ${req.originalUrl}`, 404, null, 'ROUTE_NOT_FOUND');
});

// Central Error Handler
app.use(errorHandler);

module.exports = app;
