const session = require('express-session');
const MongoStore = require('connect-mongo');
const config = require('./env');

const createSessionMiddleware = () => {
  const store = MongoStore.create({
    mongoUrl: config.mongodbUri,
    collectionName: 'sessions',
    ttl: 14 * 24 * 60 * 60, // 14 days
    autoRemove: 'native',
  });

  // Determine cookie sameSite setting:
  // In production, when frontend (Vercel) and backend (Render) reside on different domains,
  // browsers require sameSite: 'none' and secure: true for cross-origin credentials.
  // When behind a unified reverse proxy or custom domain, sameSite can be configured via COOKIE_SAMESITE env.
  const sameSiteSetting = config.isProduction
    ? (process.env.COOKIE_SAMESITE || 'none')
    : 'lax';

  return session({
    name: 'clothing_saas_sid',
    secret: config.sessionSecret,
    resave: false,
    saveUninitialized: false,
    store,
    proxy: true, // Tell express-session to trust the reverse proxy (Render, Vercel)
    cookie: {
      httpOnly: true,
      secure: config.isProduction, // In production HTTPS is mandatory for SameSite=None
      sameSite: sameSiteSetting,
      domain: config.cookieDomain && config.cookieDomain !== 'localhost' && config.cookieDomain !== 'none'
        ? config.cookieDomain
        : undefined,
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days idle timeout
    },
  });
};

module.exports = createSessionMiddleware;
