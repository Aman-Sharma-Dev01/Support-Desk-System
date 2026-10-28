import dotenv from 'dotenv';
dotenv.config();

import app from './src/app.js';
import { connectDB } from './src/config/db.js';

const PORT = process.env.PORT || 5000;

// Connect to MongoDB and start server
const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`[Server] Support Desk API running on port ${PORT}`);
    });
  } catch (error) {
    console.error(`[Fatal Server Error] ${error.message}`);
    process.exit(1);
  }
};

startServer();
