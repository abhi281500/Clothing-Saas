const app = require('./app');
const connectDB = require('./config/db');
const config = require('./config/env');

const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    const server = app.listen(config.port, () => {
      console.log(`===============================================`);
      console.log(` Clothing Commerce SaaS Backend Running`);
      console.log(` Environment : ${config.nodeEnv}`);
      console.log(` Port        : ${config.port}`);
      console.log(` API Base    : http://localhost:${config.port}/api`);
      console.log(` Health Check: http://localhost:${config.port}/api/health`);
      console.log(`===============================================`);
    });

    // Graceful shutdown handling
    const gracefulShutdown = () => {
      console.log('\nReceived shutdown signal. Closing HTTP server and database connections...');
      server.close(() => {
        console.log('HTTP server closed.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);
  } catch (error) {
    console.error(`Failed to start server: ${error.message}`);
    process.exit(1);
  }
};

startServer();
