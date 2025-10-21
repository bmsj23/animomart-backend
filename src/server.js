import app from './app.js';
import config from './config/config.js';
import connectDB from './config/database.js';
import { testCloudinaryConnection } from './config/cloudinary.js';
import { verifyEmailConnection } from './utils/emailService.js';

// handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION! Shutting down...');
  console.error(err.name, err.message);
  process.exit(1);
});

// start server
const startServer = async () => {
  try {
    // connect to database
    await connectDB();

    // test cloudinary connection
    await testCloudinaryConnection();

    // test email connection
    await verifyEmailConnection();

    // start listening
    const server = app.listen(config.port, () => {
      console.log(`\nServer running on port ${config.port}`);
      console.log(`Environment: ${config.nodeEnv}`);
      console.log(`URL: http://localhost:${config.port}`);
      console.log(`AnimoMart Backend is ready!\n`);
    });

    // handle unhandled promise rejections
    process.on('unhandledRejection', (err) => {
      console.error('UNHANDLED REJECTION! Shutting down...');
      console.error(err.name, err.message);
      server.close(() => {
        process.exit(1);
      });
    });

    // handle SIGTERM
    process.on('SIGTERM', () => {
      console.log('SIGTERM received. Shutting down gracefully...');
      server.close(() => {
        console.log('Process terminated');
      });
    });

  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

// start the server
startServer();