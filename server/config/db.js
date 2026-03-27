import mongoose from 'mongoose';

let connectionPromise;

export const connectDB = async () => {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (connectionPromise) {
    return connectionPromise;
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is required');
  }

  const options = {};
  if (process.env.MONGODB_DB_NAME) {
    options.dbName = process.env.MONGODB_DB_NAME;
  }

  connectionPromise = mongoose
    .connect(uri, options)
    .then((conn) => {
      const dbName = conn.connection.db?.databaseName || conn.connection.name || 'unknown';
      console.log(`MongoDB connected: ${conn.connection.host}, database: ${dbName}`);
      return conn.connection;
    })
    .catch((err) => {
      connectionPromise = null;
      console.error('MongoDB connection error:', err.message);
      throw err;
    });

  return connectionPromise;
};
