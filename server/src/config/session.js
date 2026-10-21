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

  return session({
    name: 'clothing_saas_sid',
    secret: config.sessionSecret,
    resave: false,
    saveUninitialized: false,
    store,
    cookie: {
      httpOnly: true,
      secure: config.isProduction,
      sameSite: config.isProduction ? 'strict' : 'lax',
      domain: config.cookieDomain && config.cookieDomain !== 'localhost' ? config.cookieDomain : undefined,
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days idle timeout
    },
  });
};

module.exports = createSessionMiddleware;
