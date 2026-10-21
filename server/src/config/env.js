const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from server root or project root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const config = {
  port: parseInt(process.env.PORT, 10) || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  mongodbUri: process.env.MONGODB_URI,
  sessionSecret: process.env.SESSION_SECRET || 'clothing_saas_default_dev_secret_change_me_in_prod',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  cookieDomain: process.env.COOKIE_DOMAIN || undefined,
};

if (!config.mongodbUri) {
  console.warn('WARNING: MONGODB_URI is not defined in environment variables.');
}

module.exports = config;
