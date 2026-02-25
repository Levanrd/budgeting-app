import mongoose from 'mongoose';

export const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI;
    const options = {};
    if (process.env.MONGODB_DB_NAME) {
      options.dbName = process.env.MONGODB_DB_NAME;
      console.log(options);
    }
    const conn = await mongoose.connect(uri, options);
    const dbName = conn.connection.db?.databaseName || conn.connection.name || 'unknown';
    console.log(`MongoDB connected: ${conn.connection.host}, database: ${dbName}`);
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  }
};
